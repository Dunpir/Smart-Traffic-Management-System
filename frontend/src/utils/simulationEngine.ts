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

        // Stop line coordinates
        if (dir === 'NORTH') {
          targetStop = isLead ? 222 : prev!.y - (v.length + 12);
          atStop = v.y >= targetStop;
        } else if (dir === 'SOUTH') {
          targetStop = isLead ? 418 : prev!.y + (v.length + 12);
          atStop = v.y <= targetStop;
        } else if (dir === 'WEST') {
          targetStop = isLead ? 222 : prev!.x - (v.length + 12);
          atStop = v.x >= targetStop;
        } else if (dir === 'EAST') {
          targetStop = isLead ? 418 : prev!.x + (v.length + 12);
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

            const safeGap = v.length + 10;
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
              v.speed = Math.max(0, v.speed - 0.25 * simSpeed);
              v.state = 'WAITING';
              v.waitTimeSec += deltaSec;
            }
          }
        } else {
          // RED / YELLOW LIGHT STOPPING & QUEUING
          if (atStop && !v.isEmergency) {
            v.targetSpeed = 0;
            v.speed = Math.max(0, v.speed - 0.28 * simSpeed);
            v.state = 'WAITING';
            v.waitTimeSec += deltaSec;
          } else if (prev) {
            let dist = 999;
            if (dir === 'NORTH') dist = prev.y - v.y;
            if (dir === 'SOUTH') dist = v.y - prev.y;
            if (dir === 'WEST') dist = prev.x - v.x;
            if (dir === 'EAST') dist = v.x - prev.x;

            const safeGap = v.length + 10;
            if (dist <= safeGap) {
              v.targetSpeed = 0;
              v.speed = Math.max(0, v.speed - 0.25 * simSpeed);
              v.state = 'WAITING';
              v.waitTimeSec += deltaSec;
            } else {
              v.speed = Math.min(v.maxSpeed, Math.max(0.3, (dist / (safeGap * 2.2)) * v.maxSpeed));
            }
          } else {
            // Approaching stop line
            v.targetSpeed = v.maxSpeed;
            v.speed = Math.min(v.maxSpeed, v.speed + 0.08 * simSpeed);
          }
        }

        // Advance position
        const step = v.speed * simSpeed;
        if (dir === 'NORTH') v.y += step;
        if (dir === 'SOUTH') v.y -= step;
        if (dir === 'WEST') v.x += step;
        if (dir === 'EAST') v.x -= step;

        // Mark as CROSSED once past stop line (no longer in incoming queue)
        if (dir === 'NORTH' && v.y > 230) {
          v.crossedStopLine = true;
          v.state = v.maneuver === 'STRAIGHT' ? 'MOVING' : 'TURNING';
        }
        if (dir === 'SOUTH' && v.y < 410) {
          v.crossedStopLine = true;
          v.state = v.maneuver === 'STRAIGHT' ? 'MOVING' : 'TURNING';
        }
        if (dir === 'WEST' && v.x > 230) {
          v.crossedStopLine = true;
          v.state = v.maneuver === 'STRAIGHT' ? 'MOVING' : 'TURNING';
        }
        if (dir === 'EAST' && v.x < 410) {
          v.crossedStopLine = true;
          v.state = v.maneuver === 'STRAIGHT' ? 'MOVING' : 'TURNING';
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
          // Smooth 90-degree Right Turn along radius R = 25
          const arcLength = (Math.PI / 2) * 25;
          v.turnProgress = Math.min(1, v.turnProgress + step / arcLength);
          const t = v.turnProgress;
          const theta = t * (Math.PI / 2);

          if (v.direction === 'NORTH') {
            // (255, 230) -> Westbound (y: 255, x -> 0)
            if (t < 1) {
              v.x = 230 + 25 * Math.cos(theta);
              v.y = 230 + 25 * Math.sin(theta);
              v.angle = Math.PI / 2 + theta;
            } else {
              v.x -= step;
              v.y = 255;
              v.angle = Math.PI;
            }
          } else if (v.direction === 'SOUTH') {
            // (385, 410) -> Eastbound (y: 385, x -> 640)
            if (t < 1) {
              v.x = 410 - 25 * Math.cos(theta);
              v.y = 410 - 25 * Math.sin(theta);
              v.angle = -Math.PI / 2 + theta;
            } else {
              v.x += step;
              v.y = 385;
              v.angle = 0;
            }
          } else if (v.direction === 'WEST') {
            // (230, 385) -> Southbound (x: 255, y -> 640)
            if (t < 1) {
              v.x = 230 + 25 * Math.sin(theta);
              v.y = 410 - 25 * Math.cos(theta);
              v.angle = theta;
            } else {
              v.x = 255;
              v.y += step;
              v.angle = Math.PI / 2;
            }
          } else if (v.direction === 'EAST') {
            // (410, 255) -> Northbound (x: 385, y -> 0)
            if (t < 1) {
              v.x = 410 - 25 * Math.sin(theta);
              v.y = 230 + 25 * Math.cos(theta);
              v.angle = Math.PI + theta;
            } else {
              v.x = 385;
              v.y -= step;
              v.angle = -Math.PI / 2;
            }
          }
        } else if (v.maneuver === 'LEFT_TURN') {
          // Smooth 90-degree Wide Left Turn along radius R = 115
          const arcLength = (Math.PI / 2) * 115;
          v.turnProgress = Math.min(1, v.turnProgress + step / arcLength);
          const t = v.turnProgress;
          const theta = t * (Math.PI / 2);

          if (v.direction === 'NORTH') {
            // (295, 230) -> Eastbound (y: 345, x -> 640)
            if (t < 1) {
              v.x = 410 - 115 * Math.cos(theta);
              v.y = 230 + 115 * Math.sin(theta);
              v.angle = Math.PI / 2 - theta;
            } else {
              v.x += step;
              v.y = 345;
              v.angle = 0;
            }
          } else if (v.direction === 'SOUTH') {
            // (345, 410) -> Westbound (y: 295, x -> 0)
            if (t < 1) {
              v.x = 230 + 115 * Math.cos(theta);
              v.y = 410 - 115 * Math.sin(theta);
              v.angle = -Math.PI / 2 - theta;
            } else {
              v.x -= step;
              v.y = 295;
              v.angle = Math.PI;
            }
          } else if (v.direction === 'WEST') {
            // (230, 345) -> Northbound (x: 345, y -> 0)
            if (t < 1) {
              v.x = 230 + 115 * Math.sin(theta);
              v.y = 230 + 115 * Math.cos(theta);
              v.angle = -theta;
            } else {
              v.x = 345;
              v.y -= step;
              v.angle = -Math.PI / 2;
            }
          } else if (v.direction === 'EAST') {
            // (410, 295) -> Southbound (x: 295, y -> 640)
            if (t < 1) {
              v.x = 410 - 115 * Math.sin(theta);
              v.y = 410 - 115 * Math.cos(theta);
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

    const spec = this.VEHICLE_SPECS[type];
    const isEmergency = type === 'AMBULANCE' || type === 'FIRE_TRUCK' || type === 'POLICE' || type === 'VIP';

    const laneVehicles = this.vehicles.filter(
      (v) => !v.crossedStopLine && v.direction === dir && v.lane === lane
    );

    const offset = laneVehicles.length * (spec.length + 14);
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

    const vehicle: SimVehicle = {
      id: `veh_${Date.now()}_${Math.random()}`,
      type,
      color,
      x: initX,
      y: initY,
      speed: spec.speed,
      targetSpeed: spec.speed,
      maxSpeed: spec.speed,
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

    this.vehicles.push(vehicle);
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
    showCameraBboxes: boolean
  ): void {
    // 1. Asphalt Roadway
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, W, H);

    // 2. Corner Lawns
    const grassColor = '#15803d';
    const cornerSize = 230;

    ctx.fillStyle = grassColor;
    ctx.fillRect(0, 0, cornerSize, cornerSize);
    ctx.fillRect(410, 0, cornerSize, cornerSize);
    ctx.fillRect(0, 410, cornerSize, cornerSize);
    ctx.fillRect(410, 410, cornerSize, cornerSize);

    // Sidewalk Curbs
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 4;
    ctx.strokeRect(0, 0, cornerSize, cornerSize);
    ctx.strokeRect(410, 0, cornerSize, cornerSize);
    ctx.strokeRect(0, 410, cornerSize, cornerSize);
    ctx.strokeRect(410, 410, cornerSize, cornerSize);

    // 3. Medians & Lane Dividers
    ctx.strokeStyle = '#eab308'; // Solid yellow median
    ctx.lineWidth = 3.5;

    ctx.beginPath();
    ctx.moveTo(320, 0);
    ctx.lineTo(320, 230);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(320, 410);
    ctx.lineTo(320, H);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, 320);
    ctx.lineTo(230, 320);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(410, 320);
    ctx.lineTo(W, 320);
    ctx.stroke();

    // White Dashed Lane Lines
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.setLineDash([12, 10]);

    ctx.beginPath();
    ctx.moveTo(275, 0);
    ctx.lineTo(275, 230);
    ctx.moveTo(365, 0);
    ctx.lineTo(365, 230);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(275, 410);
    ctx.lineTo(275, H);
    ctx.moveTo(365, 410);
    ctx.lineTo(365, H);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, 275);
    ctx.lineTo(230, 275);
    ctx.moveTo(0, 365);
    ctx.lineTo(230, 365);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(410, 275);
    ctx.lineTo(W, 275);
    ctx.moveTo(410, 365);
    ctx.lineTo(W, 365);
    ctx.stroke();

    ctx.setLineDash([]);

    // 4. Zebra Crosswalks & Stop Lines
    const drawZebra = (sx: number, sy: number, ex: number, ey: number) => {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.lineWidth = 6;
      ctx.setLineDash([7, 7]);
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(ex, ey);
      ctx.stroke();
      ctx.setLineDash([]);
    };

    drawZebra(230, 220, 410, 220); // North
    drawZebra(230, 420, 410, 420); // South
    drawZebra(220, 230, 220, 410); // West
    drawZebra(420, 230, 420, 410); // East

    // Stop Lines
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;

    ctx.beginPath();
    ctx.moveTo(230, 228);
    ctx.lineTo(320, 228);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(320, 412);
    ctx.lineTo(410, 412);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(228, 320);
    ctx.lineTo(228, 410);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(412, 230);
    ctx.lineTo(412, 320);
    ctx.stroke();

    // 5. 4 Corner Traffic Light Posts
    const drawSignal = (x: number, y: number, state: LightState) => {
      ctx.save();
      ctx.translate(x, y);

      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-9, -20, 18, 40, 4);
      ctx.fill();
      ctx.stroke();

      const isRed = state === 'RED';
      const isYellow = state === 'YELLOW';
      const isGreen = state === 'GREEN';

      // Red
      ctx.beginPath();
      ctx.arc(0, -12, 4.5, 0, 2 * Math.PI);
      ctx.fillStyle = isRed ? '#ff4d4d' : '#450a0a';
      if (isRed) {
        ctx.shadowColor = '#ff4d4d';
        ctx.shadowBlur = 12;
      }
      ctx.fill();
      ctx.shadowBlur = 0;

      // Yellow
      ctx.beginPath();
      ctx.arc(0, 0, 4.5, 0, 2 * Math.PI);
      ctx.fillStyle = isYellow ? '#ffd700' : '#451a03';
      if (isYellow) {
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 12;
      }
      ctx.fill();
      ctx.shadowBlur = 0;

      // Green
      ctx.beginPath();
      ctx.arc(0, 12, 4.5, 0, 2 * Math.PI);
      ctx.fillStyle = isGreen ? '#00cc66' : '#052e16';
      if (isGreen) {
        ctx.shadowColor = '#00cc66';
        ctx.shadowBlur = 12;
      }
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.restore();
    };

    drawSignal(212, 185, signals.NORTH); // Top-Left faces North incoming
    drawSignal(428, 185, signals.EAST);  // Top-Right faces East incoming
    drawSignal(428, 455, signals.SOUTH); // Bottom-Right faces South incoming
    drawSignal(212, 455, signals.WEST);  // Bottom-Left faces West incoming

    // 6. Direction Badges + Virtual Camera ID Badges (Paper Fig -5)
    const drawBadgeWithCam = (bx: number, by: number, label: string, camId: string) => {
      ctx.save();
      ctx.translate(bx, by);

      ctx.fillStyle = '#064e3b';
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(-30, -11, 60, 22, 5);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${label}`, 0, -2);

      ctx.fillStyle = '#6ee7b7';
      ctx.font = '7px monospace';
      ctx.fillText(`[${camId}]`, 0, 6);

      ctx.restore();
    };

    drawBadgeWithCam(320, 16, 'NORTH', 'CAM 1');
    drawBadgeWithCam(320, 624, 'SOUTH', 'CAM 3');
    drawBadgeWithCam(24, 320, 'WEST', 'CAM 4');
    drawBadgeWithCam(616, 320, 'EAST', 'CAM 2');

    // 7. Render Multi-Class Vehicles
    vehicles.forEach((v) => {
      ctx.save();
      ctx.translate(v.x, v.y);
      ctx.rotate(v.angle);

      // Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
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

        // Brake Lights
        const isBraking = v.state === 'WAITING';
        ctx.fillStyle = isBraking ? '#ff1e1e' : '#ef4444';
        if (isBraking) {
          ctx.shadowColor = '#ff1e1e';
          ctx.shadowBlur = 8;
        }
        ctx.fillRect(-v.length / 2 - 1, -v.width * 0.42, 2, 3.5);
        ctx.fillRect(-v.length / 2 - 1, v.width * 0.42 - 3.5, 2, 3.5);
        ctx.shadowBlur = 0;

        // Emergency Sirens (Ambulance / Fire Truck)
        if (v.isEmergency) {
          const isRed = Math.floor(Date.now() / 130) % 2 === 0;
          ctx.fillStyle = isRed ? '#ef4444' : '#38bdf8';
          ctx.shadowColor = isRed ? '#ef4444' : '#38bdf8';
          ctx.shadowBlur = 14;
          ctx.beginPath();
          ctx.arc(0, 0, 5.5, 0, 2 * Math.PI);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }

      // 8. Virtual Camera Detection Green Bounding Box (Paper Fig -3 & Fig -5 Blob Analysis)
      if (showCameraBboxes && !v.crossedStopLine) {
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(-v.length / 2 - 3, -v.width / 2 - 3, v.length + 6, v.width + 6);

        ctx.fillStyle = '#22c55e';
        ctx.font = 'bold 7px monospace';
        ctx.fillText(`${v.type} 98%`, -v.length / 2 - 2, -v.width / 2 - 5);
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
  private animId: number | null = null;
  private lastTimestamp: number = 0;
  private onStateChangeCallback?: (state: SimulationTelemetryState) => void;

  constructor() {
    this.controller = new STMSAdaptiveController();
    this.vehicleManager = new MultiClassVehicleManager();
    this.renderer = new STMSIntersectionRenderer();
    this.vehicleManager.populateDefaultVehicles();
  }

  public bindCanvas(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.start();
  }

  public unbindCanvas(): void {
    this.pause();
    this.canvas = null;
    this.ctx = null;
  }

  public start(): void {
    if (this.animId !== null) return;
    this.isRunning = true;
    this.lastTimestamp = performance.now();
    this.loop(this.lastTimestamp);
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
    this.notifyState();
  }

  private loop = (timestamp: number): void => {
    if (!this.isRunning) return;

    const deltaMs = Math.min(100, timestamp - this.lastTimestamp);
    const deltaSec = deltaMs / 1000;
    this.lastTimestamp = timestamp;

    const queueCounts = this.vehicleManager.getIncomingQueueCounts();
    const emergencyApproaches = this.vehicleManager.getEmergencyApproaches();

    // 1. Update STMS Adaptive Controller
    this.controller.update(deltaSec * this.simSpeed, queueCounts, emergencyApproaches);

    // 2. Update Vehicle Kinematics & Maneuvers
    this.vehicleManager.update(deltaSec, this.controller.getSignals(), this.simSpeed);

    // 3. Render Canvas
    if (this.ctx && this.canvas) {
      this.renderer.render(
        this.ctx,
        this.canvas.width,
        this.canvas.height,
        this.controller.getSignals(),
        this.vehicleManager.getVehicles(),
        this.showCameraBboxes
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
    const signals = this.controller.getSignals();
    const activeDir = this.controller.getActiveDirection();

    // Compute STMS threshold signal allocations (Paper Page 5 Fig -4 & Page 6 Fig -6)
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

  public spawnSingleVehicle(dir: SimDirection, type?: SimVehicleType): void {
    this.vehicleManager.spawnVehicle(dir, type);
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
}
