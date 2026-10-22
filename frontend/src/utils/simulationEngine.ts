import {
  SimDirection,
  SimLaneType,
  SimManeuver,
  SimVehicle,
  SimVehicleState,
  SimVehicleType,
  SimulationMode,
  SimulationTelemetryState,
  SpawnRate,
  STMSScenario,
  TrafficLightSignalMap,
  SignalAllocation,
  SimWeather,
} from '../types/simulation';
import { LightState } from '../types';

/**
 * Calculates allotted green time based on the Research Paper's Threshold Matrix (Fig -4, Page 5)
 * - Car Count == 0: 0 sec (Skip signal immediately)
 * - 1 <= Car Count <= 10: 20 sec
 * - 11 <= Car Count <= 30: 30 sec
 * - Car Count > 30: 60 sec
 */
export function calculateThresholdGreenSec(count: number, hasEmergency: boolean): number {
  if (hasEmergency) return 25; // Priority emergency flush duration
  if (count === 0) return 0;
  if (count <= 10) return 20;
  if (count <= 30) return 30;
  return 60;
}

export class STMSAdaptiveController {
  private mode: SimulationMode = 'ADAPTIVE_STMS';
  private activeScenario: STMSScenario = 'DEFAULT';
  private activeDirection: SimDirection = 'NORTH';
  private currentState: LightState = 'GREEN';
  private timeRemaining: number = 20;
  private yellowDuration: number = 2.5;
  private allRedDuration: number = 0.8;
  private transitionPhase: 'GREEN' | 'YELLOW' | 'ALL_RED' = 'GREEN';
  private transitionTimer: number = 0;
  private emergencyAlertMessage: string | null = null;

  // Signal state map
  private signals: TrafficLightSignalMap = {
    NORTH: 'GREEN',
    SOUTH: 'RED',
    EAST: 'RED',
    WEST: 'RED',
  };

  // Fixed auto cycle time fallback
  private fixedCycleTime: number = 30;

  public update(
    deltaSec: number,
    queueCounts: Record<SimDirection, number>,
    emergencyApproaches: Set<SimDirection>
  ): void {
    if (this.mode === 'ADAPTIVE_STMS') {
      this.updateAdaptiveSTMS(deltaSec, queueCounts, emergencyApproaches);
    } else if (this.mode === 'AUTO_FIXED') {
      this.updateFixedCycle(deltaSec);
    } else {
      this.updateManual(deltaSec);
    }
  }

  /**
   * STMS Dynamic Adaptive Logic (Paper Section II & III)
   * 1. Check for Emergency Pre-emption (Ambulances / Fire Trucks)
   * 2. When current phase timer expires -> Transition Yellow (2.5s) -> All Red (0.8s)
   * 3. Sort approaches by vehicle count in descending order (Shortest Job First / Most Jammed First)
   * 4. Allocate dynamic green duration using threshold matrix (0s, 20s, 30s, 60s)
   * 5. If chosen approach has 0 cars, skip to next approach
   */
  private updateAdaptiveSTMS(
    deltaSec: number,
    queueCounts: Record<SimDirection, number>,
    emergencyApproaches: Set<SimDirection>
  ): void {
    // 1. Immediate Emergency Pre-emption
    if (emergencyApproaches.size > 0) {
      const emgDir = Array.from(emergencyApproaches)[0];
      if (this.activeDirection !== emgDir && this.transitionPhase !== 'YELLOW') {
        this.emergencyAlertMessage = `🚨 STMS EMERGENCY OVERRIDE: ${emgDir} approach pre-empted for emergency vehicle clearance!`;
        this.triggerYellowTransition(emgDir, calculateThresholdGreenSec(queueCounts[emgDir] || 1, true));
        return;
      }
    }

    // 2. Count down phase timer
    this.timeRemaining -= deltaSec;

    if (this.transitionPhase === 'GREEN') {
      if (this.timeRemaining <= 0) {
        // Find next priority approach
        const nextDir = this.selectNextPriorityDirection(queueCounts, emergencyApproaches);
        const nextCount = queueCounts[nextDir] || 0;
        const allottedGreen = calculateThresholdGreenSec(nextCount, emergencyApproaches.has(nextDir));

        if (allottedGreen === 0 && Object.values(queueCounts).every((c) => c === 0)) {
          // All empty, keep quick 10s rotation
          this.triggerYellowTransition(nextDir, 10);
        } else {
          this.triggerYellowTransition(nextDir, Math.max(12, allottedGreen));
        }
      }
    } else if (this.transitionPhase === 'YELLOW') {
      this.transitionTimer -= deltaSec;
      if (this.transitionTimer <= 0) {
        this.transitionPhase = 'ALL_RED';
        this.transitionTimer = this.allRedDuration;
        this.currentState = 'RED';
        this.signals = { NORTH: 'RED', SOUTH: 'RED', EAST: 'RED', WEST: 'RED' };
      }
    } else if (this.transitionPhase === 'ALL_RED') {
      this.transitionTimer -= deltaSec;
      if (this.transitionTimer <= 0) {
        this.transitionPhase = 'GREEN';
        this.currentState = 'GREEN';
        this.signals = {
          NORTH: this.activeDirection === 'NORTH' ? 'GREEN' : 'RED',
          SOUTH: this.activeDirection === 'SOUTH' ? 'GREEN' : 'RED',
          EAST: this.activeDirection === 'EAST' ? 'GREEN' : 'RED',
          WEST: this.activeDirection === 'WEST' ? 'GREEN' : 'RED',
        };
        if (emergencyApproaches.size === 0) {
          this.emergencyAlertMessage = null;
        }
      }
    }
  }

  private triggerYellowTransition(nextDirection: SimDirection, nextGreenDuration: number): void {
    this.transitionPhase = 'YELLOW';
    this.currentState = 'YELLOW';
    this.transitionTimer = this.yellowDuration;

    // Set currently active direction to YELLOW
    this.signals = {
      NORTH: this.activeDirection === 'NORTH' ? 'YELLOW' : 'RED',
      SOUTH: this.activeDirection === 'SOUTH' ? 'YELLOW' : 'RED',
      EAST: this.activeDirection === 'EAST' ? 'YELLOW' : 'RED',
      WEST: this.activeDirection === 'WEST' ? 'YELLOW' : 'RED',
    };

    this.activeDirection = nextDirection;
    this.timeRemaining = nextGreenDuration;
  }

  /**
   * Sorts approaches by vehicle count in descending order (Paper Page 3 Flowchart)
   */
  private selectNextPriorityDirection(
    queueCounts: Record<SimDirection, number>,
    emergencyApproaches: Set<SimDirection>
  ): SimDirection {
    // 1. Emergency approach takes highest priority
    if (emergencyApproaches.size > 0) {
      return Array.from(emergencyApproaches)[0];
    }

    const allDirs: SimDirection[] = ['NORTH', 'SOUTH', 'EAST', 'WEST'];
    const candidates = allDirs.filter((d) => d !== this.activeDirection);

    // Sort by car count descending (Worst jam first)
    candidates.sort((a, b) => (queueCounts[b] || 0) - (queueCounts[a] || 0));

    // If candidate has 0 cars, check if there's any road with cars
    const topCandidate = candidates[0];
    if ((queueCounts[topCandidate] || 0) === 0) {
      // Standard round-robin fallback
      const rotation: SimDirection[] = ['NORTH', 'EAST', 'SOUTH', 'WEST'];
      const idx = rotation.indexOf(this.activeDirection);
      return rotation[(idx + 1) % rotation.length];
    }

    return topCandidate;
  }

  private updateFixedCycle(deltaSec: number): void {
    this.timeRemaining -= deltaSec;
    if (this.timeRemaining <= 0) {
      const rotation: SimDirection[] = ['NORTH', 'EAST', 'SOUTH', 'WEST'];
      const idx = rotation.indexOf(this.activeDirection);
      const nextDir = rotation[(idx + 1) % rotation.length];
      this.triggerYellowTransition(nextDir, this.fixedCycleTime);
    }
  }

  private updateManual(deltaSec: number): void {
    if (this.transitionPhase === 'YELLOW') {
      this.transitionTimer -= deltaSec;
      if (this.transitionTimer <= 0) {
        this.transitionPhase = 'ALL_RED';
        this.transitionTimer = this.allRedDuration;
        this.signals = { NORTH: 'RED', SOUTH: 'RED', EAST: 'RED', WEST: 'RED' };
      }
    } else if (this.transitionPhase === 'ALL_RED') {
      this.transitionTimer -= deltaSec;
      if (this.transitionTimer <= 0) {
        this.transitionPhase = 'GREEN';
        this.currentState = 'GREEN';
        this.signals = {
          NORTH: this.activeDirection === 'NORTH' ? 'GREEN' : 'RED',
          SOUTH: this.activeDirection === 'SOUTH' ? 'GREEN' : 'RED',
          EAST: this.activeDirection === 'EAST' ? 'GREEN' : 'RED',
          WEST: this.activeDirection === 'WEST' ? 'GREEN' : 'RED',
        };
      }
    } else {
      this.timeRemaining -= deltaSec;
      if (this.timeRemaining < 0) this.timeRemaining = 0;
    }
  }

  public setMode(mode: SimulationMode): void {
    this.mode = mode;
  }

  public setScenario(scenario: STMSScenario): void {
    this.activeScenario = scenario;
  }

  public setManualDirection(dir: SimDirection): void {
    this.mode = 'MANUAL';
    if (dir === this.activeDirection && this.currentState === 'GREEN') return;
    this.triggerYellowTransition(dir, 30);
  }

  public setFixedCycleTime(time: number): void {
    this.fixedCycleTime = Math.max(10, Math.min(60, time));
  }

  public getSignals(): TrafficLightSignalMap {
    return { ...this.signals };
  }

  public getActiveDirection(): SimDirection {
    return this.activeDirection;
  }

  public getCurrentState(): LightState {
    return this.currentState;
  }

  public getTimeRemaining(): number {
    return Math.max(0, Math.ceil(this.timeRemaining));
  }

  public getMode(): SimulationMode {
    return this.mode;
  }

  public getActiveScenario(): STMSScenario {
    return this.activeScenario;
  }

  public getEmergencyMessage(): string | null {
    return this.emergencyAlertMessage;
  }

  public preemptEmergency(dir: SimDirection, duration: number = 25, alert?: string): void {
    this.activeDirection = dir;
    this.currentState = 'GREEN';
    this.transitionPhase = 'GREEN';
    this.timeRemaining = duration;
    this.emergencyAlertMessage = alert || `🚨 PRIORITY PRE-EMPTION: ${dir} APPROACH GREEN CORRIDOR`;
    this.signals = {
      NORTH: dir === 'NORTH' ? 'GREEN' : 'RED',
      SOUTH: dir === 'SOUTH' ? 'GREEN' : 'RED',
      EAST: dir === 'EAST' ? 'GREEN' : 'RED',
      WEST: dir === 'WEST' ? 'GREEN' : 'RED',
    };
  }

  public reset(): void {
    this.mode = 'ADAPTIVE_STMS';
    this.activeScenario = 'DEFAULT';
    this.activeDirection = 'NORTH';
    this.currentState = 'GREEN';
    this.timeRemaining = 20;
    this.transitionPhase = 'GREEN';
    this.emergencyAlertMessage = null;
    this.signals = { NORTH: 'GREEN', SOUTH: 'RED', EAST: 'RED', WEST: 'RED' };
  }
}

export class MultiClassVehicleManager {
  private vehicles: SimVehicle[] = [];
  private spawnRate: SpawnRate = 'MEDIUM';
  private spawnTimer: number = 0;
  private activeScenario: STMSScenario = 'DEFAULT';

  // Multi-Class Vehicle Palette & Specs (Paper Page 4)
  private VEHICLE_SPECS: Record<
    SimVehicleType,
    { length: number; width: number; speed: number; colors: string[] }
  > = {
    BIKE: { length: 22, width: 9, speed: 2.3, colors: ['#e11d48', '#06b6d4', '#f59e0b', '#3b82f6'] },
    CAR: { length: 35, width: 17, speed: 2.0, colors: ['#3b82f6', '#f8fafc', '#eab308', '#06b6d4', '#64748b'] },
    SUV: { length: 39, width: 19, speed: 1.85, colors: ['#475569', '#059669', '#d97706', '#1e293b'] },
    TAXI: { length: 35, width: 17, speed: 2.0, colors: ['#eab308'] },
    BUS: { length: 58, width: 22, speed: 1.45, colors: ['#ea580c', '#eab308', '#0284c7'] },
    TRUCK: { length: 60, width: 22, speed: 1.4, colors: ['#78716c', '#0f766e', '#b45309'] },
    AMBULANCE: { length: 44, width: 20, speed: 2.7, colors: ['#ffffff'] },
    FIRE_TRUCK: { length: 54, width: 22, speed: 2.5, colors: ['#dc2626'] },
    POLICE: { length: 40, width: 18, speed: 2.85, colors: ['#1e3a8a'] },
    VIP: { length: 46, width: 21, speed: 2.6, colors: ['#09090b'] },
  };

  public update(deltaSec: number, signals: TrafficLightSignalMap, simSpeed: number): void {
    // 1. Spawning Loop based on Active Scenario
    this.spawnTimer += deltaSec * simSpeed;
    const interval = this.getSpawnInterval();

    if (this.spawnTimer >= interval) {
      this.spawnTimer = 0;
      this.executeScenarioSpawning();
    }

    // 2. Group incoming vehicles by (Direction, Lane) for Queue Buffering
    type LaneKey = `${SimDirection}_${SimLaneType}`;
    const lanes: Record<LaneKey, SimVehicle[]> = {
      NORTH_LEFT: [],
      NORTH_RIGHT: [],
      SOUTH_LEFT: [],
      SOUTH_RIGHT: [],
      EAST_LEFT: [],
      EAST_RIGHT: [],
      WEST_LEFT: [],
      WEST_RIGHT: [],
    };

    this.vehicles.forEach((v) => {
      if (!v.crossedStopLine) {
        const key: LaneKey = `${v.direction}_${v.lane}`;
        lanes[key].push(v);
      }
    });

    // Sort by closeness to stop line
    lanes.NORTH_LEFT.sort((a, b) => b.y - a.y);
    lanes.NORTH_RIGHT.sort((a, b) => b.y - a.y);
    lanes.SOUTH_LEFT.sort((a, b) => a.y - b.y);
    lanes.SOUTH_RIGHT.sort((a, b) => a.y - b.y);
    lanes.WEST_LEFT.sort((a, b) => b.x - a.x);
    lanes.WEST_RIGHT.sort((a, b) => b.x - a.x);
    lanes.EAST_LEFT.sort((a, b) => a.x - b.x);
    lanes.EAST_RIGHT.sort((a, b) => a.x - b.x);

    // 3. Process Kinematics & Queue Headway for Incoming Approaches
    (Object.keys(lanes) as LaneKey[]).forEach((key) => {
      const [dir] = key.split('_') as [SimDirection, SimLaneType];
      const list = lanes[key];
      const isGreen = signals[dir] === 'GREEN';

      list.forEach((v, idx) => {
        const isLead = idx === 0;
        const prev = idx > 0 ? list[idx - 1] : null;
        let targetStop = 0;
        let atStop = false;

        // Safe stop line coordinates (before crosswalks)
        const stopNorth = 195;
        const stopSouth = 445;
        const stopWest = 195;
        const stopEast = 445;

        // Account for half-length so front bumper never breaches the stop line / crosswalk
        const halfLen = v.length / 2;

        if (dir === 'NORTH') {
          targetStop = isLead ? (stopNorth - halfLen) : (prev!.y - (halfLen + prev!.length / 2 + 10));
          atStop = v.y >= targetStop;
        } else if (dir === 'SOUTH') {
          targetStop = isLead ? (stopSouth + halfLen) : (prev!.y + (halfLen + prev!.length / 2 + 10));
          atStop = v.y <= targetStop;
        } else if (dir === 'WEST') {
          targetStop = isLead ? (stopWest - halfLen) : (prev!.x - (halfLen + prev!.length / 2 + 10));
          atStop = v.x >= targetStop;
        } else if (dir === 'EAST') {
          targetStop = isLead ? (stopEast + halfLen) : (prev!.x + (halfLen + prev!.length / 2 + 10));
          atStop = v.x <= targetStop;
        }

        // GREEN LIGHT MOVEMENT
        if (isGreen) {
          if (isLead) {
            // Lead car accelerates smoothly on green
            v.targetSpeed = v.maxSpeed;
            v.speed = Math.min(v.maxSpeed, Math.max(0.6, v.speed + 0.15 * simSpeed));
            v.state = 'MOVING';
          } else if (prev) {
            // Follower car maintains safe headway
            let dist = 999;
            if (dir === 'NORTH') dist = prev.y - v.y;
            if (dir === 'SOUTH') dist = v.y - prev.y;
            if (dir === 'WEST') dist = prev.x - v.x;
            if (dir === 'EAST') dist = v.x - prev.x;

            const safeGap = halfLen + prev.length / 2 + 10;
            if (dist > safeGap) {
              v.targetSpeed = v.maxSpeed;
              v.speed = Math.min(v.maxSpeed, Math.max(0.5, v.speed + 0.12 * simSpeed));
              v.state = 'MOVING';
            } else if (prev.speed > 0.1) {
              v.targetSpeed = prev.speed;
              v.speed = Math.min(prev.speed, Math.max(0.4, v.speed + 0.08 * simSpeed));
              v.state = 'MOVING';
            } else {
              v.targetSpeed = 0;
              v.speed = Math.max(0, v.speed - 0.28 * simSpeed);
              v.state = 'WAITING';
              v.waitTimeSec += deltaSec;
            }
          }
        } else {
          // RED / YELLOW LIGHT STOPPING & QUEUING
          if (atStop && !v.isEmergency) {
            v.targetSpeed = 0;
            v.speed = Math.max(0, v.speed - 0.35 * simSpeed);
            v.state = 'WAITING';
            v.waitTimeSec += deltaSec;
            // Strict clamp to prevent creeping or sliding across the stop line onto sidewalk/crosswalk
            if (dir === 'NORTH') v.y = Math.min(v.y, targetStop);
            if (dir === 'SOUTH') v.y = Math.max(v.y, targetStop);
            if (dir === 'WEST') v.x = Math.min(v.x, targetStop);
            if (dir === 'EAST') v.x = Math.max(v.x, targetStop);
          } else if (prev) {
            let dist = 999;
            if (dir === 'NORTH') dist = prev.y - v.y;
            if (dir === 'SOUTH') dist = v.y - prev.y;
            if (dir === 'WEST') dist = prev.x - v.x;
            if (dir === 'EAST') dist = v.x - prev.x;

            const safeGap = halfLen + prev.length / 2 + 10;
            if (dist <= safeGap) {
              v.targetSpeed = 0;
              v.speed = Math.max(0, v.speed - 0.3 * simSpeed);
              v.state = 'WAITING';
              v.waitTimeSec += deltaSec;
            } else {
              v.speed = Math.min(v.maxSpeed, Math.max(0.3, (dist / (safeGap * 2.2)) * v.maxSpeed));
            }
          } else {
            // Approaching stop line with smooth deceleration
            let distToStop = 999;
            if (dir === 'NORTH') distToStop = targetStop - v.y;
            if (dir === 'SOUTH') distToStop = v.y - targetStop;
            if (dir === 'WEST') distToStop = targetStop - v.x;
            if (dir === 'EAST') distToStop = v.x - targetStop;

            if (distToStop < 40) {
              v.targetSpeed = 0;
              v.speed = Math.max(0, v.speed - 0.2 * simSpeed);
            } else {
              v.targetSpeed = v.maxSpeed;
              v.speed = Math.min(v.maxSpeed, v.speed + 0.08 * simSpeed);
            }
          }
        }

        // Advance position
        const step = v.speed * simSpeed;
        if (dir === 'NORTH') v.y += step;
        if (dir === 'SOUTH') v.y -= step;
        if (dir === 'WEST') v.x += step;
        if (dir === 'EAST') v.x -= step;

        // ONLY mark as CROSSED once physically entering intersection on GREEN (or emergency preemption)
        const canCross = isGreen || v.isEmergency;
        if (canCross) {
          if (dir === 'NORTH' && v.y >= 235) {
            v.crossedStopLine = true;
            v.state = v.maneuver === 'STRAIGHT' ? 'MOVING' : 'TURNING';
          }
          if (dir === 'SOUTH' && v.y <= 405) {
            v.crossedStopLine = true;
            v.state = v.maneuver === 'STRAIGHT' ? 'MOVING' : 'TURNING';
          }
          if (dir === 'WEST' && v.x >= 235) {
            v.crossedStopLine = true;
            v.state = v.maneuver === 'STRAIGHT' ? 'MOVING' : 'TURNING';
          }
          if (dir === 'EAST' && v.x <= 405) {
            v.crossedStopLine = true;
            v.state = v.maneuver === 'STRAIGHT' ? 'MOVING' : 'TURNING';
          }
        }
      });
    });

    // 4. Update vehicles past stop-line (Smooth Circular Arc Turning & Exiting)
    this.vehicles.forEach((v) => {
      if (v.crossedStopLine) {
        v.speed = Math.min(v.maxSpeed, v.speed + 0.1 * simSpeed);
        const step = v.speed * simSpeed;

        if (v.maneuver === 'STRAIGHT') {
          if (v.direction === 'NORTH') {
            v.y += step;
            v.angle = Math.PI / 2;
          } else if (v.direction === 'SOUTH') {
            v.y -= step;
            v.angle = -Math.PI / 2;
          } else if (v.direction === 'WEST') {
            v.x += step;
            v.angle = 0;
          } else if (v.direction === 'EAST') {
            v.x -= step;
            v.angle = Math.PI;
          }
        } else if (v.maneuver === 'RIGHT_TURN') {
          // Smooth 90-degree Right Turn along radius R = 20 staying strictly on asphalt roadway
          const arcLength = (Math.PI / 2) * 20;
          v.turnProgress = Math.min(1, v.turnProgress + step / arcLength);
          const t = v.turnProgress;
          const theta = t * (Math.PI / 2);

          if (v.direction === 'NORTH') {
            // (265, 245) -> Westbound lane (y: 265, x -> 0), safely inside road box
            if (t < 1) {
              v.x = 245 + 20 * Math.cos(theta);
              v.y = 245 + 20 * Math.sin(theta);
              v.angle = Math.PI / 2 + theta;
            } else {
              v.x -= step;
              v.y = 265;
              v.angle = Math.PI;
            }
          } else if (v.direction === 'SOUTH') {
            // (375, 395) -> Eastbound lane (y: 375, x -> 640)
            if (t < 1) {
              v.x = 395 - 20 * Math.cos(theta);
              v.y = 395 - 20 * Math.sin(theta);
              v.angle = -Math.PI / 2 + theta;
            } else {
              v.x += step;
              v.y = 375;
              v.angle = 0;
            }
          } else if (v.direction === 'WEST') {
            // (245, 375) -> Southbound lane (x: 265, y -> 640)
            if (t < 1) {
              v.x = 245 + 20 * Math.sin(theta);
              v.y = 395 - 20 * Math.cos(theta);
              v.angle = theta;
            } else {
              v.x = 265;
              v.y += step;
              v.angle = Math.PI / 2;
            }
          } else if (v.direction === 'EAST') {
            // (395, 265) -> Northbound lane (x: 375, y -> 0)
            if (t < 1) {
              v.x = 395 - 20 * Math.sin(theta);
              v.y = 245 + 20 * Math.cos(theta);
              v.angle = Math.PI + theta;
            } else {
              v.x = 375;
              v.y -= step;
              v.angle = -Math.PI / 2;
            }
          }
        } else if (v.maneuver === 'LEFT_TURN') {
          // Smooth 90-degree Wide Left Turn through intersection core
          const arcLength = (Math.PI / 2) * 100;
          v.turnProgress = Math.min(1, v.turnProgress + step / arcLength);
          const t = v.turnProgress;
          const theta = t * (Math.PI / 2);

          if (v.direction === 'NORTH') {
            // (295, 245) -> Eastbound (y: 345, x -> 640)
            if (t < 1) {
              v.x = 395 - 100 * Math.cos(theta);
              v.y = 245 + 100 * Math.sin(theta);
              v.angle = Math.PI / 2 - theta;
            } else {
              v.x += step;
              v.y = 345;
              v.angle = 0;
            }
          } else if (v.direction === 'SOUTH') {
            // (345, 395) -> Westbound (y: 295, x -> 0)
            if (t < 1) {
              v.x = 245 + 100 * Math.cos(theta);
              v.y = 395 - 100 * Math.sin(theta);
              v.angle = -Math.PI / 2 - theta;
            } else {
              v.x -= step;
              v.y = 295;
              v.angle = Math.PI;
            }
          } else if (v.direction === 'WEST') {
            // (245, 345) -> Northbound (x: 345, y -> 0)
            if (t < 1) {
              v.x = 245 + 100 * Math.sin(theta);
              v.y = 345 - 100 * Math.cos(theta);
              v.angle = -theta;
            } else {
              v.x = 345;
              v.y -= step;
              v.angle = -Math.PI / 2;
            }
          } else if (v.direction === 'EAST') {
            // (395, 295) -> Southbound (x: 295, y -> 640)
            if (t < 1) {
              v.x = 395 - 100 * Math.sin(theta);
              v.y = 245 + 100 * Math.cos(theta);
              v.angle = Math.PI - theta;
            } else {
              v.x = 295;
              v.y += step;
              v.angle = Math.PI / 2;
            }
          }
        }

        if (v.y < -70 || v.y > 710 || v.x < -70 || v.x > 710) {
          v.state = 'EXITING';
        }
      }
    });

    // 5. Filter out exited vehicles
    this.vehicles = this.vehicles.filter(
      (v) => v.x > -90 && v.x < 730 && v.y > -90 && v.y < 730
    );
  }

  private getSpawnInterval(): number {
    if (this.activeScenario === 'VERY_BUSY') return 0.65;
    if (this.activeScenario === 'EMPTY_ROADS') return 4.5;
    if (this.activeScenario === 'MANY_EMERGENCY') return 0.9;
    return this.spawnRate === 'LOW' ? 2.4 : this.spawnRate === 'MEDIUM' ? 1.3 : 0.75;
  }

  private executeScenarioSpawning(): void {
    if (this.vehicles.length >= 36) return;

    if (this.activeScenario === 'TWO_BUSY_ROADS') {
      // Heavily spawn North and South, rarely East/West
      const dirs: SimDirection[] = Math.random() > 0.15 ? ['NORTH', 'SOUTH'] : ['EAST', 'WEST'];
      this.spawnVehicle(dirs[Math.floor(Math.random() * dirs.length)]);
    } else if (this.activeScenario === 'MANY_EMERGENCY') {
      // 35% chance to spawn Ambulance or Fire Truck
      const dirs: SimDirection[] = ['NORTH', 'SOUTH', 'EAST', 'WEST'];
      const dir = dirs[Math.floor(Math.random() * dirs.length)];
      if (Math.random() < 0.35) {
        this.spawnVehicle(dir, Math.random() > 0.5 ? 'AMBULANCE' : 'FIRE_TRUCK');
      } else {
        this.spawnVehicle(dir);
      }
    } else if (this.activeScenario === 'EMPTY_ROADS') {
      // Very sparse
      if (Math.random() > 0.6) {
        this.spawnVehicle('NORTH');
      }
    } else {
      // Balanced / Very Busy
      const dirs: SimDirection[] = ['NORTH', 'SOUTH', 'EAST', 'WEST'];
      this.spawnVehicle(dirs[Math.floor(Math.random() * dirs.length)]);
    }
  }

  public spawnVehicle(dir: SimDirection, forcedType?: SimVehicleType): void {
    if (forcedType === 'VIP') {
      // Clear civilian cars on this road's LEFT lane to clear unobstructed corridor
      this.vehicles = this.vehicles.filter(
        (v) => v.direction !== dir || v.lane !== 'LEFT' || v.isEmergency
      );

      // Spawn 3-vehicle VIP Convoy (Lead Police -> VIP Armored Limo -> Rear Police Escort)
      const leadPolice = this.createSingleVehicle(dir, 'LEFT', 'STRAIGHT', 'POLICE', 0, 3.2);
      const vipLimo = this.createSingleVehicle(dir, 'LEFT', 'STRAIGHT', 'VIP', 56, 3.2);
      const escortSUV = this.createSingleVehicle(dir, 'LEFT', 'STRAIGHT', 'POLICE', 112, 3.2);

      this.vehicles.push(leadPolice, vipLimo, escortSUV);
      return;
    }

    if (forcedType === 'AMBULANCE' || forcedType === 'POLICE' || forcedType === 'FIRE_TRUCK') {
      // Clear civilian cars on this road's LEFT lane
      this.vehicles = this.vehicles.filter(
        (v) => v.direction !== dir || v.lane !== 'LEFT' || v.isEmergency
      );

      const emgVeh = this.createSingleVehicle(dir, 'LEFT', 'STRAIGHT', forcedType, 0, 3.2);
      this.vehicles.push(emgVeh);
      return;
    }

    const lane: SimLaneType = Math.random() > 0.45 ? 'LEFT' : 'RIGHT';
    let maneuver: SimManeuver = 'STRAIGHT';

    if (lane === 'RIGHT') {
      maneuver = 'RIGHT_TURN';
    } else {
      maneuver = Math.random() > 0.4 ? 'STRAIGHT' : 'LEFT_TURN';
    }

    let type: SimVehicleType = forcedType || 'CAR';
    if (!forcedType) {
      const rand = Math.random();
      if (rand < 0.15) type = 'BIKE';
      else if (rand < 0.65) type = 'CAR';
      else if (rand < 0.8) type = 'SUV';
      else if (rand < 0.92) type = 'BUS';
      else if (rand < 0.98) type = 'TRUCK';
      else type = 'AMBULANCE';
    }

    const laneVehicles = this.vehicles.filter(
      (v) => !v.crossedStopLine && v.direction === dir && v.lane === lane
    );
    const spec = this.VEHICLE_SPECS[type];
    const offset = laneVehicles.length * (spec.length + 14);

    const veh = this.createSingleVehicle(dir, lane, maneuver, type, offset, spec.speed);
    this.vehicles.push(veh);
  }

  private createSingleVehicle(
    dir: SimDirection,
    lane: SimLaneType,
    maneuver: SimManeuver,
    type: SimVehicleType,
    offset: number,
    speed: number
  ): SimVehicle {
    const spec = this.VEHICLE_SPECS[type];
    const isEmergency = type === 'AMBULANCE' || type === 'FIRE_TRUCK' || type === 'POLICE' || type === 'VIP';

    let initX = 0;
    let initY = 0;
    let initAngle = 0;

    switch (dir) {
      case 'NORTH':
        initX = lane === 'LEFT' ? 295 : 255;
        initY = -15 - offset;
        initAngle = Math.PI / 2;
        break;
      case 'SOUTH':
        initX = lane === 'LEFT' ? 345 : 385;
        initY = 655 + offset;
        initAngle = -Math.PI / 2;
        break;
      case 'WEST':
        initX = -15 - offset;
        initY = lane === 'LEFT' ? 345 : 385;
        initAngle = 0;
        break;
      case 'EAST':
        initX = 655 + offset;
        initY = lane === 'LEFT' ? 295 : 255;
        initAngle = Math.PI;
        break;
    }

    const color = spec.colors[Math.floor(Math.random() * spec.colors.length)];

    return {
      id: `veh_${Date.now()}_${Math.random()}`,
      type,
      color,
      x: initX,
      y: initY,
      speed,
      targetSpeed: speed,
      maxSpeed: speed,
      angle: initAngle,
      direction: dir,
      lane,
      maneuver,
      state: 'APPROACHING',
      turnProgress: 0,
      length: spec.length,
      width: spec.width,
      isEmergency,
      entryTime: Date.now(),
      waitTimeSec: 0,
      crossedStopLine: false,
    };
  }

  public setSpawnRate(rate: SpawnRate): void {
    this.spawnRate = rate;
  }

  public setScenario(scenario: STMSScenario): void {
    this.activeScenario = scenario;
    this.vehicles = [];

    if (scenario === 'VERY_BUSY') {
      // Pre-fill 3-4 cars per approach
      (['NORTH', 'SOUTH', 'EAST', 'WEST'] as SimDirection[]).forEach((dir) => {
        this.spawnVehicle(dir, 'BUS');
        this.spawnVehicle(dir, 'CAR');
        this.spawnVehicle(dir, 'TRUCK');
        this.spawnVehicle(dir, 'CAR');
      });
    } else if (scenario === 'TWO_BUSY_ROADS') {
      (['NORTH', 'SOUTH'] as SimDirection[]).forEach((dir) => {
        this.spawnVehicle(dir, 'TRUCK');
        this.spawnVehicle(dir, 'CAR');
        this.spawnVehicle(dir, 'BUS');
        this.spawnVehicle(dir, 'CAR');
      });
    } else if (scenario === 'MANY_EMERGENCY') {
      this.spawnVehicle('SOUTH', 'AMBULANCE');
      this.spawnVehicle('NORTH', 'FIRE_TRUCK');
      this.spawnVehicle('WEST', 'CAR');
      this.spawnVehicle('EAST', 'CAR');
    } else if (scenario === 'EMPTY_ROADS') {
      // No vehicles initially
    } else {
      this.populateDefaultVehicles();
    }
  }

  public getVehicles(): SimVehicle[] {
    return this.vehicles;
  }

  public getIncomingQueueCounts(): Record<SimDirection, number> {
    const counts: Record<SimDirection, number> = { NORTH: 0, SOUTH: 0, EAST: 0, WEST: 0 };
    this.vehicles.forEach((v) => {
      if (!v.crossedStopLine) {
        counts[v.direction]++;
      }
    });
    return counts;
  }

  public getEmergencyApproaches(): Set<SimDirection> {
    const emg = new Set<SimDirection>();
    this.vehicles.forEach((v) => {
      if (!v.crossedStopLine && v.isEmergency) {
        emg.add(v.direction);
      }
    });
    return emg;
  }

  public getWaitingCount(): number {
    return this.vehicles.filter((v) => !v.crossedStopLine && v.state === 'WAITING').length;
  }

  public getAverageWaitTime(): number {
    if (this.vehicles.length === 0) return 0;
    const totalWait = this.vehicles.reduce((acc, v) => acc + v.waitTimeSec, 0);
    return Math.round((totalWait / this.vehicles.length) * 10) / 10;
  }

  public clear(): void {
    this.vehicles = [];
    this.spawnTimer = 0;
  }

  public populateDefaultVehicles(): void {
    this.vehicles = [
      {
        id: 'v_init_1',
        type: 'CAR',
        color: '#3b82f6',
        x: 295,
        y: 110,
        speed: 2.0,
        targetSpeed: 2.0,
        maxSpeed: 2.0,
        angle: Math.PI / 2,
        direction: 'NORTH',
        lane: 'LEFT',
        maneuver: 'STRAIGHT',
        state: 'APPROACHING',
        turnProgress: 0,
        length: 35,
        width: 17,
        entryTime: Date.now(),
        waitTimeSec: 0,
        crossedStopLine: false,
      },
      {
        id: 'v_init_2',
        type: 'BUS',
        color: '#ea580c',
        x: 255,
        y: 155,
        speed: 1.5,
        targetSpeed: 1.5,
        maxSpeed: 1.5,
        angle: Math.PI / 2,
        direction: 'NORTH',
        lane: 'RIGHT',
        maneuver: 'RIGHT_TURN',
        state: 'APPROACHING',
        turnProgress: 0,
        length: 58,
        width: 22,
        entryTime: Date.now(),
        waitTimeSec: 0,
        crossedStopLine: false,
      },
      {
        id: 'v_init_3',
        type: 'CAR',
        color: '#06b6d4',
        x: 165,
        y: 345,
        speed: 0,
        targetSpeed: 0,
        maxSpeed: 2.0,
        angle: 0,
        direction: 'WEST',
        lane: 'LEFT',
        maneuver: 'STRAIGHT',
        state: 'WAITING',
        turnProgress: 0,
        length: 35,
        width: 17,
        entryTime: Date.now(),
        waitTimeSec: 3.8,
        crossedStopLine: false,
      },
      {
        id: 'v_init_4',
        type: 'TRUCK',
        color: '#78716c',
        x: 105,
        y: 345,
        speed: 0,
        targetSpeed: 0,
        maxSpeed: 1.4,
        angle: 0,
        direction: 'WEST',
        lane: 'LEFT',
        maneuver: 'STRAIGHT',
        state: 'WAITING',
        turnProgress: 0,
        length: 60,
        width: 22,
        entryTime: Date.now(),
        waitTimeSec: 2.9,
        crossedStopLine: false,
      },
      {
        id: 'v_init_5',
        type: 'CAR',
        color: '#f97316',
        x: 475,
        y: 295,
        speed: 0,
        targetSpeed: 0,
        maxSpeed: 2.0,
        angle: Math.PI,
        direction: 'EAST',
        lane: 'LEFT',
        maneuver: 'STRAIGHT',
        state: 'WAITING',
        turnProgress: 0,
        length: 35,
        width: 17,
        entryTime: Date.now(),
        waitTimeSec: 2.1,
        crossedStopLine: false,
      },
      {
        id: 'v_init_6',
        type: 'BIKE',
        color: '#e11d48',
        x: 345,
        y: 530,
        speed: 2.3,
        targetSpeed: 2.3,
        maxSpeed: 2.3,
        angle: -Math.PI / 2,
        direction: 'SOUTH',
        lane: 'LEFT',
        maneuver: 'STRAIGHT',
        state: 'APPROACHING',
        turnProgress: 0,
        length: 22,
        width: 9,
        entryTime: Date.now(),
        waitTimeSec: 0,
        crossedStopLine: false,
      },
    ];
  }
}

export class STMSIntersectionRenderer {
  public render(
    ctx: CanvasRenderingContext2D,
    W: number,
    H: number,
    signals: TrafficLightSignalMap,
    vehicles: SimVehicle[],
    showCameraBboxes: boolean,
    timeRemainingSec: number = 20,
    activeDir: SimDirection = 'NORTH',
    weather: SimWeather = 'NIGHT',
    showRadar: boolean = true,
    showHeatmap: boolean = false,
    pedestrianActive: boolean = false,
    pedestrianTimeRemaining: number = 0,
    queueCounts: Record<SimDirection, number> = { NORTH: 0, SOUTH: 0, EAST: 0, WEST: 0 }
  ): void {
    const isNight = weather === 'NIGHT';
    const isRain = weather === 'RAIN';

    // 1. Asphalt Roadway
    ctx.fillStyle = isNight ? '#070a14' : isRain ? '#0c101d' : '#1e293b';
    ctx.fillRect(0, 0, W, H);

    // Subtle Road Grain Grid (Smart City Infrastructure)
    if (isNight) {
      ctx.strokeStyle = 'rgba(14, 165, 233, 0.04)';
      ctx.lineWidth = 1;
      for (let x = 0; x < W; x += 32) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
      }
      for (let y = 0; y < H; y += 32) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }
    }

    // 2. Corner Lawns & Curbs
    const grassColor = isNight ? '#04070d' : isRain ? '#091c13' : '#15803d';
    const cornerSize = 230;

    ctx.fillStyle = grassColor;
    ctx.fillRect(0, 0, cornerSize, cornerSize);
    ctx.fillRect(410, 0, cornerSize, cornerSize);
    ctx.fillRect(0, 410, cornerSize, cornerSize);
    ctx.fillRect(410, 410, cornerSize, cornerSize);

    // High-Tech Cyber Corner Tiles in Night Mode
    if (isNight) {
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.12)';
      ctx.lineWidth = 1;
      ctx.strokeRect(8, 8, cornerSize - 16, cornerSize - 16);
      ctx.strokeRect(418, 8, cornerSize - 16, cornerSize - 16);
      ctx.strokeRect(8, 418, cornerSize - 16, cornerSize - 16);
      ctx.strokeRect(418, 418, cornerSize - 16, cornerSize - 16);
    }

    // Sidewalk Curbs
    ctx.strokeStyle = isNight ? '#1e293b' : '#475569';
    ctx.lineWidth = 4;
    ctx.strokeRect(0, 0, cornerSize, cornerSize);
    ctx.strokeRect(410, 0, cornerSize, cornerSize);
    ctx.strokeRect(0, 410, cornerSize, cornerSize);
    ctx.strokeRect(410, 410, cornerSize, cornerSize);

    // 3. Queue Density Heatmap Overlay
    if (showHeatmap) {
      const drawHeatmapCone = (x: number, y: number, w: number, h: number, count: number, dir: SimDirection) => {
        const heatColor = count > 12 ? 'rgba(239, 68, 68, 0.35)' : count > 4 ? 'rgba(245, 158, 11, 0.30)' : 'rgba(16, 185, 129, 0.20)';
        const grad = dir === 'NORTH'
          ? ctx.createLinearGradient(x, y + h, x, y)
          : dir === 'SOUTH'
          ? ctx.createLinearGradient(x, y, x, y + h)
          : dir === 'WEST'
          ? ctx.createLinearGradient(x + w, y, x, y)
          : ctx.createLinearGradient(x, y, x + w, y);

        grad.addColorStop(0, heatColor);
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(x, y, w, h);
      };

      drawHeatmapCone(230, 0, 180, 220, queueCounts.NORTH, 'NORTH');
      drawHeatmapCone(230, 420, 180, 220, queueCounts.SOUTH, 'SOUTH');
      drawHeatmapCone(0, 230, 220, 180, queueCounts.WEST, 'WEST');
      drawHeatmapCone(420, 230, 220, 180, queueCounts.EAST, 'EAST');
    }

    // 4. Medians & Lane Dividers
    ctx.strokeStyle = isNight ? '#fbbf24' : '#eab308'; // Solid yellow median
    ctx.lineWidth = 3.5;

    ctx.beginPath();
    ctx.moveTo(320, 0);
    ctx.lineTo(320, 230);
    ctx.moveTo(320, 410);
    ctx.lineTo(320, H);
    ctx.moveTo(0, 320);
    ctx.lineTo(230, 320);
    ctx.moveTo(410, 320);
    ctx.lineTo(W, 320);
    ctx.stroke();

    // White Dashed Lane Lines
    ctx.strokeStyle = isNight ? 'rgba(255, 255, 255, 0.65)' : '#ffffff';
    ctx.lineWidth = 2;
    ctx.setLineDash([12, 10]);

    ctx.beginPath();
    ctx.moveTo(275, 0);
    ctx.lineTo(275, 230);
    ctx.moveTo(365, 0);
    ctx.lineTo(365, 230);
    ctx.moveTo(275, 410);
    ctx.lineTo(275, H);
    ctx.moveTo(365, 410);
    ctx.lineTo(365, H);
    ctx.moveTo(0, 275);
    ctx.lineTo(230, 275);
    ctx.moveTo(0, 365);
    ctx.lineTo(230, 365);
    ctx.moveTo(410, 275);
    ctx.lineTo(W, 275);
    ctx.moveTo(410, 365);
    ctx.lineTo(W, 365);
    ctx.stroke();
    ctx.setLineDash([]);

    // 5. Zebra Crosswalks & Stop Lines
    const drawZebra = (sx: number, sy: number, ex: number, ey: number) => {
      ctx.strokeStyle = isNight ? 'rgba(255, 255, 255, 0.75)' : 'rgba(255, 255, 255, 0.85)';
      ctx.lineWidth = 6;
      ctx.setLineDash([7, 7]);
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(ex, ey);
      ctx.stroke();
      ctx.setLineDash([]);
    };

    drawZebra(240, 218, 400, 218); // North crosswalk
    drawZebra(240, 422, 400, 422); // South crosswalk
    drawZebra(218, 240, 218, 400); // West crosswalk
    drawZebra(422, 240, 422, 400); // East crosswalk

    // Stop Lines (Located safely behind the zebra crosswalks)
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(240, 195);
    ctx.lineTo(320, 195); // North incoming stop line
    ctx.moveTo(320, 445);
    ctx.lineTo(400, 445); // South incoming stop line
    ctx.moveTo(195, 320);
    ctx.lineTo(195, 400); // West incoming stop line
    ctx.moveTo(445, 240);
    ctx.lineTo(445, 320); // East incoming stop line
    ctx.stroke();

    // 6. Pedestrian Crossing Figures & Active Phase
    if (pedestrianActive) {
      // Flashing Crosswalk Studs
      const studBlink = Math.floor(Date.now() / 200) % 2 === 0;
      ctx.fillStyle = studBlink ? '#10b981' : '#f59e0b';
      ctx.shadowColor = studBlink ? '#10b981' : '#f59e0b';
      ctx.shadowBlur = 10;
      for (let i = 240; i <= 400; i += 32) {
        ctx.beginPath();
        ctx.arc(i, 220, 3, 0, 2 * Math.PI);
        ctx.arc(i, 420, 3, 0, 2 * Math.PI);
        ctx.fill();
      }
      ctx.shadowBlur = 0;

      // Animated Pedestrians Walking Across North & South Zebra
      const t = (Date.now() / 1000) % 6;
      const walkProgress = t / 6; // 0 to 1
      const pedX = 240 + walkProgress * 150;

      const drawPedestrian = (px: number, py: number) => {
        ctx.save();
        ctx.fillStyle = '#f8fafc';
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(px, py, 4.5, 0, 2 * Math.PI); // Head
        ctx.fill();
        ctx.fillStyle = '#0284c7';
        ctx.beginPath();
        ctx.roundRect(px - 3, py + 4, 6, 8, 2); // Body
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.restore();
      };

      drawPedestrian(pedX, 220);
      drawPedestrian(pedX - 35, 220);
      drawPedestrian(400 - walkProgress * 150, 420);
      drawPedestrian(365 - walkProgress * 150, 420);

      // Pedestrian HUD Badge
      ctx.save();
      ctx.fillStyle = 'rgba(5, 46, 22, 0.9)';
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(260, 305, 120, 30, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`🚶 PEDESTRIAN WALK`, 320, 318);
      ctx.fillStyle = '#a7f3d0';
      ctx.font = 'bold 9px monospace';
      ctx.fillText(`${Math.ceil(pedestrianTimeRemaining)}s Remaining`, 320, 329);
      ctx.restore();
    }

    // 7. 4 Corner Traffic Light Posts with Digital Countdown Timers on Top
    const drawSignal = (x: number, y: number, state: LightState, dir: SimDirection) => {
      ctx.save();
      ctx.translate(x, y);

      const isRed = state === 'RED';
      const isYellow = state === 'YELLOW';
      const isGreen = state === 'GREEN';

      // Digital Timer Display Box Mounted ON TOP of the Signal Box
      let countdownSec = Math.max(1, Math.round(timeRemainingSec));
      let timerColor = isGreen ? '#00ff88' : isYellow ? '#ffd700' : '#ff4d4d';

      if (isRed) {
        const waitOffset = dir === 'SOUTH' ? 4 : dir === 'EAST' ? 10 : dir === 'WEST' ? 16 : 8;
        countdownSec = Math.min(99, Math.round(timeRemainingSec) + waitOffset);
      }

      const timerText = `${countdownSec}s`;

      // Digital Timer Badge
      ctx.fillStyle = '#050508';
      ctx.strokeStyle = timerColor;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(-16, -42, 32, 17, 4);
      ctx.fill();
      ctx.stroke();

      // Digital Timer Text
      ctx.fillStyle = timerColor;
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      if (isNight) {
        ctx.shadowColor = timerColor;
        ctx.shadowBlur = 8;
      }
      ctx.fillText(timerText, 0, -33);
      ctx.shadowBlur = 0;

      // Traffic Signal Housing Box
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-9, -20, 18, 40, 4);
      ctx.fill();
      ctx.stroke();

      // Red Lamp
      ctx.beginPath();
      ctx.arc(0, -12, 4.5, 0, 2 * Math.PI);
      ctx.fillStyle = isRed ? '#ff4d4d' : '#450a0a';
      if (isRed && isNight) {
        ctx.shadowColor = '#ff4d4d';
        ctx.shadowBlur = 16;
      }
      ctx.fill();
      ctx.shadowBlur = 0;

      // Yellow Lamp
      ctx.beginPath();
      ctx.arc(0, 0, 4.5, 0, 2 * Math.PI);
      ctx.fillStyle = isYellow ? '#ffd700' : '#451a03';
      if (isYellow && isNight) {
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 16;
      }
      ctx.fill();
      ctx.shadowBlur = 0;

      // Green Lamp
      ctx.beginPath();
      ctx.arc(0, 12, 4.5, 0, 2 * Math.PI);
      ctx.fillStyle = isGreen ? '#00cc66' : '#052e16';
      if (isGreen && isNight) {
        ctx.shadowColor = '#00cc66';
        ctx.shadowBlur = 18;
      }
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.restore();
    };

    drawSignal(212, 185, signals.NORTH, 'NORTH'); // Top-Left faces North incoming
    drawSignal(428, 185, signals.EAST, 'EAST');  // Top-Right faces East incoming
    drawSignal(428, 455, signals.SOUTH, 'SOUTH'); // Bottom-Right faces South incoming
    drawSignal(212, 455, signals.WEST, 'WEST');  // Bottom-Left faces West incoming

    // 8. Direction Badges + Virtual Camera ID Badges
    const drawBadgeWithCam = (bx: number, by: number, label: string, camId: string, queue: number) => {
      ctx.save();
      ctx.translate(bx, by);

      const isActive = activeDir === label && signals[label as SimDirection] === 'GREEN';
      ctx.fillStyle = isActive ? '#064e3b' : '#0f172a';
      ctx.strokeStyle = isActive ? '#10b981' : '#334155';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(-36, -12, 72, 24, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${label}`, -10, -2);

      // Queue Counter Badge
      ctx.fillStyle = queue > 8 ? '#f43f5e' : queue > 3 ? '#f59e0b' : '#10b981';
      ctx.font = 'bold 8px monospace';
      ctx.fillText(`(${queue})`, 22, -2);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '7px monospace';
      ctx.fillText(`[${camId}]`, 0, 7);

      ctx.restore();
    };

    drawBadgeWithCam(320, 16, 'NORTH', 'CAM 1', queueCounts.NORTH);
    drawBadgeWithCam(320, 624, 'SOUTH', 'CAM 3', queueCounts.SOUTH);
    drawBadgeWithCam(24, 320, 'WEST', 'CAM 4', queueCounts.WEST);
    drawBadgeWithCam(616, 320, 'EAST', 'CAM 2', queueCounts.EAST);

    // 9. Render Multi-Class Vehicles
    vehicles.forEach((v) => {
      ctx.save();
      ctx.translate(v.x, v.y);
      ctx.rotate(v.angle);

      // Dynamic Headlight Cones (Night / Rain Photorealism)
      if (isNight || isRain) {
        const lightGrad = ctx.createRadialGradient(v.length / 2, 0, 5, v.length / 2 + 55, 0, 35);
        lightGrad.addColorStop(0, 'rgba(254, 240, 138, 0.42)');
        lightGrad.addColorStop(0.6, 'rgba(254, 240, 138, 0.15)');
        lightGrad.addColorStop(1, 'rgba(254, 240, 138, 0)');

        ctx.fillStyle = lightGrad;
        ctx.beginPath();
        ctx.moveTo(v.length / 2, -v.width * 0.45);
        ctx.lineTo(v.length / 2 + 55, -v.width * 0.95);
        ctx.lineTo(v.length / 2 + 55, v.width * 0.95);
        ctx.lineTo(v.length / 2, v.width * 0.45);
        ctx.closePath();
        ctx.fill();
      }

      // Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.beginPath();
      ctx.roundRect(-v.length / 2 + 2, -v.width / 2 + 2, v.length, v.width, 5);
      ctx.fill();

      // Body
      ctx.fillStyle = v.color;
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.roundRect(-v.length / 2, -v.width / 2, v.length, v.width, v.type === 'BIKE' ? 3 : 6);
      ctx.fill();
      ctx.stroke();

      if (v.type === 'BIKE') {
        // Rider Helmet
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(0, 0, 3.5, 0, 2 * Math.PI);
        ctx.fill();
      } else {
        // Windshield
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.roundRect(v.length * 0.1, -v.width * 0.38, v.length * 0.22, v.width * 0.76, 2.5);
        ctx.fill();

        // Rear Window
        ctx.beginPath();
        ctx.roundRect(-v.length * 0.36, -v.width * 0.35, v.length * 0.16, v.width * 0.7, 2.5);
        ctx.fill();

        // Roof
        ctx.fillStyle = v.color;
        ctx.beginPath();
        ctx.roundRect(-v.length * 0.16, -v.width * 0.34, v.length * 0.34, v.width * 0.68, 2.5);
        ctx.fill();
        ctx.stroke();

        // Headlights
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(v.length / 2 - 2, -v.width * 0.42, 3, 3.5);
        ctx.fillRect(v.length / 2 - 2, v.width * 0.42 - 3.5, 3, 3.5);

        // Turn Indicators (Blinking Amber LEDs on turning cars)
        if (v.maneuver === 'LEFT_TURN' || v.maneuver === 'RIGHT_TURN') {
          const isBlinkerOn = Math.floor(Date.now() / 250) % 2 === 0;
          if (isBlinkerOn) {
            ctx.fillStyle = '#f59e0b';
            ctx.shadowColor = '#f59e0b';
            ctx.shadowBlur = 8;
            const blinkerY = v.maneuver === 'LEFT_TURN' ? -v.width / 2 : v.width / 2 - 3.5;
            ctx.fillRect(v.length / 2 - 2, blinkerY, 3.5, 3.5);
            ctx.fillRect(-v.length / 2 - 1, blinkerY, 3.5, 3.5);
            ctx.shadowBlur = 0;
          }
        }

        // Brake Lights
        const isBraking = v.state === 'WAITING';
        ctx.fillStyle = isBraking ? '#ff1e1e' : '#ef4444';
        if (isBraking && isNight) {
          ctx.shadowColor = '#ff1e1e';
          ctx.shadowBlur = 10;
        }
        ctx.fillRect(-v.length / 2 - 1, -v.width * 0.42, 2, 3.5);
        ctx.fillRect(-v.length / 2 - 1, v.width * 0.42 - 3.5, 2, 3.5);
        ctx.shadowBlur = 0;

        // Emergency Sirens (Ambulance / Fire Truck / Police)
        if (v.isEmergency) {
          const isRed = Math.floor(Date.now() / 130) % 2 === 0;
          ctx.fillStyle = isRed ? '#ef4444' : '#38bdf8';
          ctx.shadowColor = isRed ? '#ef4444' : '#38bdf8';
          ctx.shadowBlur = 16;
          ctx.beginPath();
          ctx.arc(0, 0, 5.5, 0, 2 * Math.PI);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }

      // 10. Virtual Camera Detection Green Bounding Box & Speed Radar
      if (showCameraBboxes && !v.crossedStopLine) {
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(-v.length / 2 - 3, -v.width / 2 - 3, v.length + 6, v.width + 6);

        ctx.fillStyle = '#22c55e';
        ctx.font = 'bold 7px monospace';
        ctx.fillText(`${v.type} 98%`, -v.length / 2 - 2, -v.width / 2 - 5);
      }

      // Speed Radar Badge Floating above Vehicle
      if (showRadar && !v.crossedStopLine) {
        ctx.save();
        ctx.rotate(-v.angle); // Keep badge horizontal
        const speedKmh = Math.round(v.speed * 20);
        ctx.fillStyle = 'rgba(2, 6, 23, 0.85)';
        ctx.strokeStyle = v.state === 'WAITING' ? '#f59e0b' : '#06b6d4';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(-22, -v.width - 15, 44, 13, 3);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = v.state === 'WAITING' ? '#fbbf24' : '#38bdf8';
        ctx.font = 'bold 8px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(v.state === 'WAITING' ? '0 km/h' : `${speedKmh} km/h`, 0, -v.width - 6);
        ctx.restore();
      }

      ctx.restore();
    });
  }
}

export class TrafficSimulationEngine {
  private controller: STMSAdaptiveController;
  private vehicleManager: MultiClassVehicleManager;
  private renderer: STMSIntersectionRenderer;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private isRunning: boolean = true;
  private simSpeed: number = 1;
  private showCameraBboxes: boolean = true;
  private weather: SimWeather = 'NIGHT';
  private showRadar: boolean = true;
  private showHeatmap: boolean = false;
  private pedestrianActive: boolean = false;
  private pedestrianTimer: number = 0;
  private cumulativeCleared: number = 138;
  private fuelSavedLiters: number = 19.4;
  private co2SavedKg: number = 44.8;
  private animId: number | null = null;
  private lastTimestamp: number = 0;
  private onStateChangeCallback?: (state: SimulationTelemetryState) => void;

  constructor() {
    this.controller = new STMSAdaptiveController();
    this.vehicleManager = new MultiClassVehicleManager();
    this.renderer = new STMSIntersectionRenderer();
    this.vehicleManager.populateDefaultVehicles();
    this.start();
  }

  public isLoopRunning(): boolean {
    return this.isRunning && this.animId !== null;
  }

  public bindCanvas(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.start();
  }

  public unbindCanvas(): void {
    this.canvas = null;
    this.ctx = null;
  }

  public start(): void {
    this.isRunning = true;
    if (this.animId !== null) return;
    this.lastTimestamp = performance.now();
    this.animId = requestAnimationFrame(this.loop);
  }

  public pause(): void {
    this.isRunning = false;
    if (this.animId !== null) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
    this.notifyState();
  }

  public reset(): void {
    this.controller.reset();
    this.vehicleManager.clear();
    this.vehicleManager.populateDefaultVehicles();
    this.pedestrianActive = false;
    this.pedestrianTimer = 0;
    this.start();
    this.notifyState();
  }

  private loop = (timestamp: number): void => {
    if (!this.isRunning) return;

    const deltaMs = Math.min(100, timestamp - this.lastTimestamp);
    const deltaSec = deltaMs / 1000;
    this.lastTimestamp = timestamp;

    const queueCounts = this.vehicleManager.getIncomingQueueCounts();
    const emergencyApproaches = this.vehicleManager.getEmergencyApproaches();

    // Pedestrian Actuation Countdown
    if (this.pedestrianActive) {
      this.pedestrianTimer -= deltaSec * this.simSpeed;
      if (this.pedestrianTimer <= 0) {
        this.pedestrianActive = false;
        this.pedestrianTimer = 0;
      }
    }

    const effectiveSignals: TrafficLightSignalMap = this.pedestrianActive
      ? { NORTH: 'RED', SOUTH: 'RED', EAST: 'RED', WEST: 'RED' }
      : this.controller.getSignals();

    // 1. Update STMS Adaptive Controller
    this.controller.update(deltaSec * this.simSpeed, queueCounts, emergencyApproaches);

    // 2. Update Vehicle Kinematics & Maneuvers
    this.vehicleManager.update(deltaSec, effectiveSignals, this.simSpeed);

    // Cumulative Eco-Counters
    this.cumulativeCleared += deltaSec * 0.15 * this.simSpeed;
    this.fuelSavedLiters += deltaSec * 0.008 * this.simSpeed;
    this.co2SavedKg += deltaSec * 0.018 * this.simSpeed;

    // 3. Render Canvas
    if (this.ctx && this.canvas) {
      this.renderer.render(
        this.ctx,
        this.canvas.width,
        this.canvas.height,
        effectiveSignals,
        this.vehicleManager.getVehicles(),
        this.showCameraBboxes,
        this.controller.getTimeRemaining(),
        this.controller.getActiveDirection(),
        this.weather,
        this.showRadar,
        this.showHeatmap,
        this.pedestrianActive,
        this.pedestrianTimer,
        queueCounts
      );
    }

    this.notifyState();
    this.animId = requestAnimationFrame(this.loop);
  };

  public setOnStateChange(cb: (state: SimulationTelemetryState) => void): void {
    this.onStateChangeCallback = cb;
  }

  private notifyState(): void {
    if (this.onStateChangeCallback) {
      this.onStateChangeCallback(this.getState());
    }
  }

  public getState(): SimulationTelemetryState {
    const queueCounts = this.vehicleManager.getIncomingQueueCounts();
    const emergencyApproaches = this.vehicleManager.getEmergencyApproaches();
    const signals = this.getSignals();
    const activeDir = this.controller.getActiveDirection();

    const signalAllocations: Record<SimDirection, SignalAllocation> = {
      NORTH: {
        direction: 'NORTH',
        signalName: 'Signal 1 (North / Cam 1)',
        carCount: queueCounts.NORTH || 0,
        allottedGreenSec: calculateThresholdGreenSec(queueCounts.NORTH || 0, emergencyApproaches.has('NORTH')),
        currentSignal: signals.NORTH,
        hasEmergency: emergencyApproaches.has('NORTH'),
        isCurrentActive: activeDir === 'NORTH',
      },
      EAST: {
        direction: 'EAST',
        signalName: 'Signal 2 (East / Cam 2)',
        carCount: queueCounts.EAST || 0,
        allottedGreenSec: calculateThresholdGreenSec(queueCounts.EAST || 0, emergencyApproaches.has('EAST')),
        currentSignal: signals.EAST,
        hasEmergency: emergencyApproaches.has('EAST'),
        isCurrentActive: activeDir === 'EAST',
      },
      SOUTH: {
        direction: 'SOUTH',
        signalName: 'Signal 3 (South / Cam 3)',
        carCount: queueCounts.SOUTH || 0,
        allottedGreenSec: calculateThresholdGreenSec(queueCounts.SOUTH || 0, emergencyApproaches.has('SOUTH')),
        currentSignal: signals.SOUTH,
        hasEmergency: emergencyApproaches.has('SOUTH'),
        isCurrentActive: activeDir === 'SOUTH',
      },
      WEST: {
        direction: 'WEST',
        signalName: 'Signal 4 (West / Cam 4)',
        carCount: queueCounts.WEST || 0,
        allottedGreenSec: calculateThresholdGreenSec(queueCounts.WEST || 0, emergencyApproaches.has('WEST')),
        currentSignal: signals.WEST,
        hasEmergency: emergencyApproaches.has('WEST'),
        isCurrentActive: activeDir === 'WEST',
      },
    };

    const total = this.vehicleManager.getVehicles().length;
    const waiting = this.vehicleManager.getWaitingCount();
    const flowDensity = total > 18 ? 'HEAVY' : total > 8 ? 'NORMAL' : 'LIGHT';

    return {
      mode: this.controller.getMode(),
      activeScenario: this.controller.getActiveScenario(),
      activeDirection: activeDir,
      currentState: this.controller.getCurrentState(),
      timeRemaining: this.controller.getTimeRemaining(),
      totalVehicles: total,
      waitingVehicles: waiting,
      flowDensity,
      averageWaitTimeSec: this.vehicleManager.getAverageWaitTime(),
      signals,
      signalAllocations,
      cameraDetectionCounts: queueCounts,
      activeEmergencyMessage: this.controller.getEmergencyMessage(),
      isRunning: this.isRunning,
      simSpeed: this.simSpeed,
      cycleTime: 30,
      spawnRate: 'MEDIUM',
      showCameraBboxes: this.showCameraBboxes,
      weather: this.weather,
      showRadar: this.showRadar,
      showHeatmap: this.showHeatmap,
      pedestrianActive: this.pedestrianActive,
      pedestrianTimeRemaining: this.pedestrianTimer,
      cumulativeCleared: Math.round(this.cumulativeCleared),
      fuelSavedLiters: Math.round(this.fuelSavedLiters * 10) / 10,
      co2SavedKg: Math.round(this.co2SavedKg * 10) / 10,
    };
  }

  public setMode(mode: SimulationMode): void {
    this.controller.setMode(mode);
    this.notifyState();
  }

  public setScenario(scenario: STMSScenario): void {
    this.controller.setScenario(scenario);
    this.vehicleManager.setScenario(scenario);
    this.notifyState();
  }

  public setManualDirection(dir: SimDirection): void {
    this.controller.setManualDirection(dir);
    this.notifyState();
  }

  public setFixedCycleTime(time: number): void {
    this.controller.setFixedCycleTime(time);
    this.notifyState();
  }

  public setSpawnRate(rate: SpawnRate): void {
    this.vehicleManager.setSpawnRate(rate);
    this.notifyState();
  }

  public setSimSpeed(speed: number): void {
    this.simSpeed = speed;
    this.notifyState();
  }

  public toggleCameraBboxes(): void {
    this.showCameraBboxes = !this.showCameraBboxes;
    this.notifyState();
  }

  public setWeather(weather: SimWeather): void {
    this.weather = weather;
    this.notifyState();
  }

  public toggleRadar(): void {
    this.showRadar = !this.showRadar;
    this.notifyState();
  }

  public toggleHeatmap(): void {
    this.showHeatmap = !this.showHeatmap;
    this.notifyState();
  }

  public triggerPedestrianCall(): void {
    this.pedestrianActive = true;
    this.pedestrianTimer = 14;
    this.notifyState();
  }

  public triggerRushHourSpike(): void {
    this.reset();
    for (let i = 0; i < 18; i++) {
      this.vehicleManager.spawnVehicle('NORTH', 'CAR');
    }
    for (let i = 0; i < 12; i++) {
      this.vehicleManager.spawnVehicle('EAST', 'BUS');
    }
    this.vehicleManager.spawnVehicle('SOUTH', 'CAR');
    this.setMode('ADAPTIVE_STMS');
    this.start();
    this.notifyState();
  }

  public triggerGhostGreenDemo(): void {
    this.reset();
    for (let i = 0; i < 22; i++) {
      this.vehicleManager.spawnVehicle('NORTH', 'CAR');
    }
    // South and West remain completely empty (0 cars)
    this.start();
    this.notifyState();
  }

  public spawnSingleVehicle(dir: SimDirection, type?: SimVehicleType): void {
    if (type === 'VIP' || type === 'AMBULANCE' || type === 'POLICE' || type === 'FIRE_TRUCK') {
      this.controller.preemptEmergency(
        dir,
        25,
        type === 'VIP'
          ? `👑 VIP MOTORCADE CORRIDOR: ${dir} APPROACH`
          : `🚨 ${type} PRIORITY PRE-EMPTION ON ${dir} APPROACH`
      );
    }
    this.vehicleManager.spawnVehicle(dir, type);
    this.start();
    this.notifyState();
  }

  public handleCanvasClick(clientX: number, clientY: number, canvasRect: DOMRect): void {
    if (!this.canvas) return;
    const x = ((clientX - canvasRect.left) / canvasRect.width) * this.canvas.width;
    const y = ((clientY - canvasRect.top) / canvasRect.height) * this.canvas.height;

    if (y < 230 && x >= 200 && x <= 440) {
      this.setManualDirection('NORTH');
    } else if (y > 410 && x >= 200 && x <= 440) {
      this.setManualDirection('SOUTH');
    } else if (x < 230 && y >= 200 && y <= 440) {
      this.setManualDirection('WEST');
    } else if (x > 410 && y >= 200 && y <= 440) {
      this.setManualDirection('EAST');
    }
  }

  public getVehicles(): SimVehicle[] {
    return this.vehicleManager.getVehicles();
  }

  public getSignals(): TrafficLightSignalMap {
    if (this.pedestrianActive) {
      return { NORTH: 'RED', SOUTH: 'RED', EAST: 'RED', WEST: 'RED' };
    }
    return this.controller.getSignals();
  }

  public isPedestrianActive(): boolean {
    return this.pedestrianActive;
  }

  public getPedestrianTimer(): number {
    return this.pedestrianTimer;
  }

  public getEmergencyMessage(): string | null {
    return this.controller.getEmergencyMessage();
  }
}

