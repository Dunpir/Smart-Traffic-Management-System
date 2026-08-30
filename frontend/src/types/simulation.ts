import { Direction, LightState } from './index';

export type SimDirection = Direction; // 'NORTH' | 'SOUTH' | 'EAST' | 'WEST'

export type SimLaneType = 'LEFT' | 'RIGHT';

export type SimManeuver = 'STRAIGHT' | 'LEFT_TURN' | 'RIGHT_TURN';

export type SimVehicleState = 'APPROACHING' | 'WAITING' | 'MOVING' | 'TURNING' | 'CROSSED' | 'EXITING';

// Multi-class vehicle generation as defined in the paper (Page 4: car, bus, truck, bike, emergency)
export type SimVehicleType = 'CAR' | 'SUV' | 'TAXI' | 'BUS' | 'TRUCK' | 'BIKE' | 'AMBULANCE' | 'FIRE_TRUCK' | 'POLICE' | 'VIP';

export interface SimVehicle {
  id: string;
  type: SimVehicleType;
  color: string;
  x: number;
  y: number;
  speed: number;
  targetSpeed: number;
  maxSpeed: number;
  angle: number; // in radians
  direction: SimDirection;
  lane: SimLaneType;
  maneuver: SimManeuver;
  state: SimVehicleState;
  turnProgress: number; // 0 to 1
  length: number;
  width: number;
  isEmergency?: boolean;
  entryTime: number;
  waitTimeSec: number;
  crossedStopLine: boolean;
}

export type TrafficLightSignalMap = Record<SimDirection, LightState>;

export type SimulationMode = 'ADAPTIVE_STMS' | 'AUTO_FIXED' | 'MANUAL';

export type SpawnRate = 'LOW' | 'MEDIUM' | 'HIGH';

// Research paper's 4 scenario buttons (Page 3 Section III)
export type STMSScenario = 'VERY_BUSY' | 'MANY_EMERGENCY' | 'TWO_BUSY_ROADS' | 'EMPTY_ROADS' | 'DEFAULT';

// Dynamic threshold allocation record (Page 5 Fig -4)
export interface SignalAllocation {
  direction: SimDirection;
  signalName: string;
  carCount: number;
  allottedGreenSec: number;
  currentSignal: LightState;
  hasEmergency: boolean;
  isCurrentActive: boolean;
}

export interface SimulationTelemetryState {
  mode: SimulationMode;
  activeScenario: STMSScenario;
  activeDirection: SimDirection;
  currentState: LightState;
  timeRemaining: number;
  totalVehicles: number;
  waitingVehicles: number;
  flowDensity: 'LIGHT' | 'NORMAL' | 'HEAVY';
  averageWaitTimeSec: number;
  signals: TrafficLightSignalMap;
  signalAllocations: Record<SimDirection, SignalAllocation>;
  cameraDetectionCounts: Record<SimDirection, number>;
  activeEmergencyMessage: string | null;
  isRunning: boolean;
  simSpeed: number;
  cycleTime: number;
  spawnRate: SpawnRate;
  showCameraBboxes: boolean;
}
