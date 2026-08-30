import {
  Direction,
  LightState,
  ControlMode,
  DensityLevel,
  CongestionStatus,
  TrafficThresholds,
  TrafficDecision,
  RoadLiveStatus,
  JunctionLiveTelemetry,
  SignalTiming,
  VehicleCount,
  PedestrianCrosswalkState,
} from '../types';
import { dbService } from '../database/neo4j';
import { hardwareService } from './hardwareService';
import { emergencyManager } from './emergencyManager';
import { violationService } from './violationService';
import { logger } from './loggerService';

class TrafficEngine {
  private mode: ControlMode = 'AUTOMATIC';
  private isRunning: boolean = true;
  private activeDirectionIndex: number = 3; // Start with WEST
  private readonly directions: Direction[] = ['NORTH', 'SOUTH', 'EAST', 'WEST'];
  private currentPhase: 'GREEN' | 'YELLOW' | 'ALL_RED' = 'GREEN';
  private phaseTimeRemaining: number = 48;
  private currentPhaseDuration: number = 48;
  private tickTimer: NodeJS.Timeout | null = null;
  private socketBroadcaster: ((event: string, data: any) => void) | null = null;

  // Pedestrian Crosswalk State (PAB)
  private pedestrianState: PedestrianCrosswalkState = {
    isActive: false,
    requestedDirection: 'ALL',
    phase: 'IDLE',
    countdown: 0,
    waitingPedestrians: 0,
    audioChirpActive: false,
    accessibleMode: false,
    safeClearanceDuration: 12,
  };

  // Configurable Rule-based Thresholds
  private thresholds: TrafficThresholds = {
    lowMax: 10,
    mediumMax: 20,
    highMax: 35,
    yellowDuration: 3,
    allRedDuration: 2,
    minGreen: 15,
    maxGreen: 65,
  };

  // Live Road States
  private roadsState: Record<Direction, RoadLiveStatus> = {
    NORTH: {
      roadId: 'R001',
      name: 'North Boulevard',
      direction: 'NORTH',
      vehicleCount: 22,
      density: 'HIGH',
      congestion: 'CONGESTED',
      cameraStatus: 'ONLINE',
      cameraResolution: '4K UHD (3840x2160)',
      irStatus: 'ACTIVE',
      irActive: false,
      currentSignal: 'RED',
      speedLimit: 50,
      flowRate: '28 veh/min',
    },
    SOUTH: {
      roadId: 'R002',
      name: 'South Avenue',
      direction: 'SOUTH',
      vehicleCount: 8,
      density: 'LOW',
      congestion: 'FREE_FLOW',
      cameraStatus: 'ONLINE',
      cameraResolution: '4K UHD (3840x2160)',
      irStatus: 'ACTIVE',
      irActive: false,
      currentSignal: 'RED',
      speedLimit: 50,
      flowRate: '12 veh/min',
    },
    EAST: {
      roadId: 'R003',
      name: 'East Highway',
      direction: 'EAST',
      vehicleCount: 16,
      density: 'MEDIUM',
      congestion: 'MODERATE',
      cameraStatus: 'ONLINE',
      cameraResolution: '4K UHD (3840x2160)',
      irStatus: 'ACTIVE',
      irActive: false,
      currentSignal: 'RED',
      speedLimit: 60,
      flowRate: '20 veh/min',
    },
    WEST: {
      roadId: 'R004',
      name: 'West Expressway',
      direction: 'WEST',
      vehicleCount: 34,
      density: 'VERY HIGH',
      congestion: 'HEAVY_QUEUE',
      cameraStatus: 'ONLINE',
      cameraResolution: '4K UHD (3840x2160)',
      irStatus: 'ACTIVE',
      irActive: true,
      currentSignal: 'GREEN',
      speedLimit: 60,
      flowRate: '45 veh/min',
    },
  };

  private lastDecision: TrafficDecision = {
    roadId: 'R004',
    direction: 'WEST',
    vehicleCount: 34,
    density: 'VERY HIGH',
    recommendedGreenSeconds: 48,
    previousDurationSeconds: 30,
    reason: 'Dynamic Green Extension (+18s): High vehicle density detected on West Expressway.',
    timestamp: new Date().toISOString(),
  };

  constructor() {
    emergencyManager.setOnEmergencyResolved(() => {
      this.resumeAfterEmergency();
    });
    this.startClock();
  }

  public setSocketBroadcaster(broadcaster: (event: string, data: any) => void) {
    this.socketBroadcaster = broadcaster;
    violationService.setSocketBroadcaster(broadcaster);
  }

  public getThresholds(): TrafficThresholds {
    return { ...this.thresholds };
  }

  public updateThresholds(newThresholds: Partial<TrafficThresholds>) {
    this.thresholds = { ...this.thresholds, ...newThresholds };
    logger.log({
      eventType: 'CONTROLLER',
      junctionId: 'J001',
      description: `Traffic decision thresholds updated: Low<=${this.thresholds.lowMax}, Med<=${this.thresholds.mediumMax}, High<=${this.thresholds.highMax}`,
      source: 'TRAFFIC_ENGINE',
      level: 'INFO',
    });
  }

  public getMode(): ControlMode {
    return this.mode;
  }

  public setMode(mode: ControlMode) {
    this.mode = mode;
    logger.log({
      eventType: 'CONTROLLER',
      junctionId: 'J001',
      description: `Traffic Controller mode switched to: ${mode}`,
      source: 'TRAFFIC_ENGINE',
      level: 'INFO',
    });
    this.broadcastTelemetry();
  }

  public isCycleRunning(): boolean {
    return this.isRunning;
  }

  public setRunning(running: boolean) {
    this.isRunning = running;
    logger.log({
      eventType: 'CONTROLLER',
      junctionId: 'J001',
      description: `Signal Cycle ${running ? 'STARTED' : 'STOPPED'}.`,
      source: 'TRAFFIC_ENGINE',
      level: 'INFO',
    });
  }

  /**
   * Evaluates vehicle count and calculates rule-based density, congestion, and green duration.
   */
  public calculateTrafficCondition(count: number, hasIROccupancy: boolean = false): {
    density: DensityLevel;
    congestion: CongestionStatus;
    duration: number;
    reason: string;
  } {
    let density: DensityLevel = 'LOW';
    let congestion: CongestionStatus = 'FREE_FLOW';
    let duration: number = this.thresholds.minGreen; // 15s
    let reason = '';

    if (count <= this.thresholds.lowMax) {
      density = 'LOW';
      congestion = 'FREE_FLOW';
      duration = Math.max(15, this.thresholds.minGreen);
      reason = `Light traffic (${count} vehicles). Allocated baseline green time of ${duration}s.`;
    } else if (count <= this.thresholds.mediumMax) {
      density = 'MEDIUM';
      congestion = 'MODERATE';
      duration = 28;
      reason = `Moderate traffic (${count} vehicles). Allocated standard green time of ${duration}s.`;
    } else if (count <= this.thresholds.highMax) {
      density = 'HIGH';
      congestion = 'CONGESTED';
      duration = 42;
      reason = `Heavy traffic (${count} vehicles). Extended green time to ${duration}s to prevent backlog.`;
    } else {
      density = 'VERY HIGH';
      congestion = 'HEAVY_QUEUE';
      duration = Math.min(58, this.thresholds.maxGreen);
      reason = `Critical congestion (${count} vehicles). Maximum allowable green window of ${duration}s granted.`;
    }

    if (hasIROccupancy && density !== 'VERY HIGH') {
      duration += 5;
      reason += ' Stop-line IR sensor detected stationary queue (+5s boost).';
    }

    return { density, congestion, duration, reason };
  }

  /**
   * Receives incoming vehicle count from Camera / Simulator
   */
  public async handleVehicleCountUpdate(params: {
    junctionId?: string;
    roadId: string;
    sensorId: string;
    count: number;
    flowRate?: string;
    timestamp?: string;
  }): Promise<VehicleCount> {
    const dirEntry = Object.entries(this.roadsState).find(([, r]) => r.roadId === params.roadId);
    const direction = dirEntry ? (dirEntry[0] as Direction) : 'NORTH';
    const timestamp = params.timestamp || new Date().toISOString();

    const condition = this.calculateTrafficCondition(params.count, this.roadsState[direction].irActive);

    // Update internal road state
    this.roadsState[direction].vehicleCount = params.count;
    this.roadsState[direction].density = condition.density;
    this.roadsState[direction].congestion = condition.congestion;
    if (params.flowRate) {
      this.roadsState[direction].flowRate = params.flowRate;
    }

    const vcRecord: VehicleCount = {
      recordId: `VC_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      sensorId: params.sensorId,
      roadId: params.roadId,
      count: params.count,
      densityLevel: condition.density,
      congestionStatus: condition.congestion,
      flowRate: this.roadsState[direction].flowRate,
      timestamp,
    };

    // Store in Neo4j
    await dbService.recordVehicleCount(vcRecord);

    this.broadcastTelemetry();
    return vcRecord;
  }

  /**
   * Receives incoming IR Sensor state change
   */
  public handleIRSensorUpdate(params: {
    roadId: string;
    sensorId: string;
    isActive: boolean;
  }) {
    const dirEntry = Object.entries(this.roadsState).find(([, r]) => r.roadId === params.roadId);
    if (dirEntry) {
      const direction = dirEntry[0] as Direction;
      this.roadsState[direction].irActive = params.isActive;
      hardwareService.updateIRSensor(direction, params.isActive);
      this.broadcastTelemetry();
    }
  }

  /**
   * Central 1-second clock loop that drives the traffic state machine
   */
  private startClock() {
    if (this.tickTimer) clearInterval(this.tickTimer);

    this.tickTimer = setInterval(() => {
      this.tick();
    }, 1000);
  }

  private async tick() {
    // If an emergency is active, emergency manager has total priority
    if (emergencyManager.getActiveEmergency()) {
      return;
    }

    if (!this.isRunning || this.mode === 'MANUAL') {
      return;
    }

    // Active Pedestrian Walk interval countdown
    if (this.pedestrianState.phase === 'WALK') {
      this.pedestrianState.countdown--;
      this.phaseTimeRemaining = this.pedestrianState.countdown;

      if (this.pedestrianState.countdown <= 0) {
        this.pedestrianState.phase = 'IDLE';
        this.pedestrianState.isActive = false;
        this.pedestrianState.audioChirpActive = false;
        this.pedestrianState.waitingPedestrians = 0;

        logger.log({
          eventType: 'CONTROLLER',
          junctionId: 'J001',
          description: 'Pedestrian Crosswalk Walk Interval completed. Resuming dynamic vehicular green cycles.',
          source: 'TRAFFIC_ENGINE',
          level: 'INFO',
        });

        await this.advancePhase();
      }

      this.broadcastTelemetry();
      return;
    }

    this.phaseTimeRemaining--;

    if (this.phaseTimeRemaining <= 0) {
      await this.advancePhase();
    }

    this.broadcastTelemetry();
  }

  /**
   * Advances the 4-phase signal state machine: GREEN -> YELLOW -> ALL_RED -> NEXT GREEN
   */
  private async advancePhase() {
    const activeDir = this.directions[this.activeDirectionIndex];

    if (this.currentPhase === 'GREEN') {
      // Transition from GREEN to YELLOW
      this.currentPhase = 'YELLOW';
      this.phaseTimeRemaining = this.thresholds.yellowDuration; // 3s
      this.currentPhaseDuration = this.thresholds.yellowDuration;

      this.roadsState[activeDir].currentSignal = 'YELLOW';
      await hardwareService.dispatchSignalCommand(activeDir, 'YELLOW', this.thresholds.yellowDuration);
    } else if (this.currentPhase === 'YELLOW') {
      // Transition from YELLOW to ALL_RED clearance
      this.currentPhase = 'ALL_RED';
      this.phaseTimeRemaining = this.thresholds.allRedDuration; // 2s
      this.currentPhaseDuration = this.thresholds.allRedDuration;

      this.roadsState[activeDir].currentSignal = 'RED';
      await hardwareService.dispatchSignalCommand(activeDir, 'RED', this.thresholds.allRedDuration);
    } else if (this.pedestrianState.phase === 'WAITING') {
      // Pedestrian demand pending -> initiate safe ALL-RED pedestrian walk interval
      const walkDuration = this.pedestrianState.safeClearanceDuration;
      this.pedestrianState.phase = 'WALK';
      this.pedestrianState.countdown = walkDuration;
      this.pedestrianState.audioChirpActive = true;
      this.currentPhase = 'ALL_RED';
      this.phaseTimeRemaining = walkDuration;
      this.currentPhaseDuration = walkDuration;

      for (const dir of this.directions) {
        this.roadsState[dir].currentSignal = 'RED';
        await hardwareService.dispatchSignalCommand(dir, 'RED', walkDuration);
      }

      logger.log({
        eventType: 'CONTROLLER',
        junctionId: 'J001',
        description: `Pedestrian Walk Interval (PAB) engaged: ALL vehicular approaches set to RED for ${walkDuration}s. [Accessibility Audio Chirp: ${this.pedestrianState.accessibleMode ? 'HIGH-CONTRAST EXTENDED' : 'STANDARD'}]`,
        source: 'TRAFFIC_ENGINE',
        level: 'INFO',
      });
    } else {
      // Transition from ALL_RED to NEXT DIRECTION GREEN
      this.activeDirectionIndex = (this.activeDirectionIndex + 1) % this.directions.length;
      const nextDir = this.directions[this.activeDirectionIndex];
      const nextRoad = this.roadsState[nextDir];

      // Calculate dynamic rule-based timing for the new approach
      const condition = this.calculateTrafficCondition(nextRoad.vehicleCount, nextRoad.irActive);

      this.currentPhase = 'GREEN';
      this.phaseTimeRemaining = condition.duration;
      this.currentPhaseDuration = condition.duration;

      // Update signal lights
      for (const dir of this.directions) {
        if (dir === nextDir) {
          this.roadsState[dir].currentSignal = 'GREEN';
          await hardwareService.dispatchSignalCommand(dir, 'GREEN', condition.duration);
        } else {
          this.roadsState[dir].currentSignal = 'RED';
          await hardwareService.dispatchSignalCommand(dir, 'RED', condition.duration);
        }
      }

      // Record Decision
      const prevDuration = this.lastDecision.recommendedGreenSeconds;
      this.lastDecision = {
        roadId: nextRoad.roadId,
        direction: nextDir,
        vehicleCount: nextRoad.vehicleCount,
        density: condition.density,
        recommendedGreenSeconds: condition.duration,
        previousDurationSeconds: prevDuration,
        reason: condition.reason,
        timestamp: new Date().toISOString(),
      };

      // Record Signal Timing in Neo4j
      const signalIdMap: Record<Direction, string> = {
        NORTH: 'SIG001',
        SOUTH: 'SIG002',
        EAST: 'SIG003',
        WEST: 'SIG004',
      };

      const timingRecord: SignalTiming = {
        timingId: `ST_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        signalId: signalIdMap[nextDir],
        roadId: nextRoad.roadId,
        direction: nextDir,
        greenDuration: condition.duration,
        yellowDuration: this.thresholds.yellowDuration,
        redDuration: 120 - condition.duration,
        calculatedDuration: condition.duration,
        reason: condition.reason,
        mode: this.mode,
        appliedAt: new Date().toISOString(),
      };

      await dbService.recordSignalTiming(timingRecord);

      logger.log({
        eventType: 'CONTROLLER',
        junctionId: 'J001',
        roadId: nextRoad.roadId,
        description: `Signal Phase shifted to ${nextDir} (${nextRoad.name}): GREEN for ${condition.duration}s. [${condition.density} - ${condition.reason}]`,
        source: 'TRAFFIC_ENGINE',
        level: 'INFO',
      });
    }
  }

  /**
   * Pedestrian Actuated Button (PAB) Request
   */
  public requestPedestrianCrossing(
    direction: 'ALL' | Direction = 'ALL',
    accessibleMode: boolean = false
  ): { success: boolean; message: string; state: PedestrianCrosswalkState } {
    this.pedestrianState.isActive = true;
    this.pedestrianState.requestedDirection = direction;
    this.pedestrianState.accessibleMode = accessibleMode;
    this.pedestrianState.safeClearanceDuration = accessibleMode ? 18 : 12;
    this.pedestrianState.waitingPedestrians += 1;

    if (this.pedestrianState.phase !== 'WALK') {
      this.pedestrianState.phase = 'WAITING';
    }

    logger.log({
      eventType: 'CONTROLLER',
      junctionId: 'J001',
      description: `Pedestrian Call Button Pressed (PAB) on ${direction} crosswalk. Safe all-red clearance queued (${this.pedestrianState.waitingPedestrians} waiting, Accessible: ${accessibleMode}).`,
      source: 'USER_DASHBOARD',
      level: 'INFO',
    });

    this.broadcastTelemetry();

    return {
      success: true,
      message: 'Pedestrian clearance scheduled on next cycle clearance interval.',
      state: { ...this.pedestrianState },
    };
  }

  public getPedestrianState(): PedestrianCrosswalkState {
    return { ...this.pedestrianState };
  }

  /**
   * Manual Signal Override Command
   */
  public async executeManualSignalCommand(
    targetDirection: Direction,
    signalState: LightState,
    durationSeconds: number = 30
  ): Promise<{ success: boolean; message: string }> {
    this.mode = 'MANUAL';

    if (signalState === 'GREEN') {
      // Set chosen direction to GREEN and all others to RED to prevent intersection collisions
      for (const dir of this.directions) {
        if (dir === targetDirection) {
          this.roadsState[dir].currentSignal = 'GREEN';
          await hardwareService.dispatchSignalCommand(dir, 'GREEN', durationSeconds);
        } else {
          this.roadsState[dir].currentSignal = 'RED';
          await hardwareService.dispatchSignalCommand(dir, 'RED', durationSeconds);
        }
      }

      this.activeDirectionIndex = this.directions.indexOf(targetDirection);
      this.currentPhase = 'GREEN';
      this.phaseTimeRemaining = durationSeconds;
      this.currentPhaseDuration = durationSeconds;

      this.lastDecision = {
        roadId: this.roadsState[targetDirection].roadId,
        direction: targetDirection,
        vehicleCount: this.roadsState[targetDirection].vehicleCount,
        density: this.roadsState[targetDirection].density,
        recommendedGreenSeconds: durationSeconds,
        previousDurationSeconds: durationSeconds,
        reason: `Manual Override: Operator commanded GREEN for ${targetDirection} (${durationSeconds}s)`,
        timestamp: new Date().toISOString(),
      };
    } else {
      this.roadsState[targetDirection].currentSignal = signalState;
      await hardwareService.dispatchSignalCommand(targetDirection, signalState, durationSeconds);
    }

    logger.log({
      eventType: 'MANUAL',
      junctionId: 'J001',
      roadId: this.roadsState[targetDirection].roadId,
      description: `Manual Signal Override executed: ${targetDirection} set to ${signalState} (${durationSeconds}s)`,
      source: 'USER_DASHBOARD',
      level: 'WARNING',
    });

    this.broadcastTelemetry();

    return {
      success: true,
      message: `Manual command applied: ${targetDirection} is ${signalState}`,
    };
  }

  /**
   * Resets junction state to initial default
   */
  public async resetJunction(): Promise<void> {
    this.mode = 'AUTOMATIC';
    this.isRunning = true;
    this.activeDirectionIndex = 3; // WEST
    this.currentPhase = 'GREEN';
    this.phaseTimeRemaining = 45;
    this.currentPhaseDuration = 45;
    this.pedestrianState = {
      isActive: false,
      requestedDirection: 'ALL',
      phase: 'IDLE',
      countdown: 0,
      waitingPedestrians: 0,
      audioChirpActive: false,
      accessibleMode: false,
      safeClearanceDuration: 12,
    };

    for (const dir of this.directions) {
      if (dir === 'WEST') {
        this.roadsState[dir].currentSignal = 'GREEN';
        await hardwareService.dispatchSignalCommand(dir, 'GREEN', 45);
      } else {
        this.roadsState[dir].currentSignal = 'RED';
        await hardwareService.dispatchSignalCommand(dir, 'RED', 45);
      }
    }

    logger.log({
      eventType: 'CONTROLLER',
      junctionId: 'J001',
      description: 'Traffic Junction reset to default operational state (West Road Active).',
      source: 'TRAFFIC_ENGINE',
      level: 'INFO',
    });

    this.broadcastTelemetry();
  }

  private resumeAfterEmergency() {
    this.advancePhase();
  }

  /**
   * Compiles live junction telemetry payload
   */
  public getLiveTelemetry(): JunctionLiveTelemetry {
    const totalVehicles = Object.values(this.roadsState).reduce((acc, r) => acc + r.vehicleCount, 0);

    // Congestion index calculation (0-100%)
    const maxCapacity = 160; // 4 roads * 40 veh max
    const congestionIndex = Math.min(100, Math.round((totalVehicles / maxCapacity) * 100));

    // Approximate average wait time (seconds)
    const avgWaitTime = Math.round((totalVehicles * 1.8) + (this.phaseTimeRemaining * 0.4));

    return {
      junctionId: 'J001',
      name: 'Central Plaza 4-Way Intersection',
      location: 'Cyber City Sector 4',
      mode: this.mode,
      activeDirection: this.directions[this.activeDirectionIndex],
      currentPhase: this.currentPhase,
      phaseTimeRemaining: Math.max(0, this.phaseTimeRemaining),
      currentPhaseDuration: this.currentPhaseDuration,
      recommendedDuration: this.lastDecision.recommendedGreenSeconds,
      totalVehicleCount: totalVehicles,
      averageWaitTimeSec: avgWaitTime,
      congestionIndex,
      roads: this.roadsState,
      lastDecision: this.lastDecision,
      activeEmergency: emergencyManager.getActiveEmergency(),
      pedestrianState: { ...this.pedestrianState },
      timestamp: new Date().toISOString(),
    };
  }

  private broadcastTelemetry() {
    if (this.socketBroadcaster) {
      this.socketBroadcaster('junction:telemetry', this.getLiveTelemetry());
    }
  }
}

export const trafficEngine = new TrafficEngine();

