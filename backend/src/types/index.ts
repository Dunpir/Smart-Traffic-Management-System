// Type definitions for Intelligent Traffic Signal Controller

export type Direction = 'NORTH' | 'SOUTH' | 'EAST' | 'WEST';
export type LightState = 'RED' | 'YELLOW' | 'GREEN';
export type SensorType = 'CAMERA' | 'IR';
export type SensorStatus = 'ONLINE' | 'ACTIVE' | 'INACTIVE' | 'FAULT';
export type DensityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY HIGH';
export type CongestionStatus = 'FREE_FLOW' | 'MODERATE' | 'CONGESTED' | 'HEAVY_QUEUE';
export type ControlMode = 'AUTOMATIC' | 'MANUAL' | 'EMERGENCY_OVERRIDE';
export type EmergencyVehicleType = 'AMBULANCE' | 'FIRE_TRUCK' | 'POLICE';
export type EmergencyPriority = 'CRITICAL' | 'HIGH' | 'STANDARD';
export type EmergencyStatus = 'DETECTED' | 'ACTIVE_CORRIDOR' | 'RESOLVED';

export interface Junction {
  junctionId: string;
  name: string;
  location: string;
  status: 'ACTIVE' | 'MAINTENANCE' | 'OFFLINE';
  createdAt: string;
}

export interface Road {
  roadId: string;
  junctionId: string;
  name: string;
  direction: Direction;
  speedLimit: number;
  lanes: number;
}

// Sensor superclass
export interface Sensor {
  sensorId: string;
  roadId: string;
  name: string;
  type: SensorType;
  status: SensorStatus;
  installedDate: string;
  lastActive: string;
}

// Camera specialization (Sensor Subclass)
export interface Camera extends Sensor {
  type: 'CAMERA';
  resolution: string;
  fps: number;
  model: string;
}

// IRSensor specialization (Sensor Subclass)
export interface IRSensor extends Sensor {
  type: 'IR';
  rangeCm: number;
  detectionSensitivity: 'HIGH' | 'MEDIUM' | 'LOW';
  pin: string;
}

export interface VehicleCount {
  recordId: string;
  sensorId: string; // Belongs to Camera
  roadId: string;
  count: number;
  densityLevel: DensityLevel;
  congestionStatus: CongestionStatus;
  flowRate: string;
  timestamp: string;
}

export interface Signal {
  signalId: string;
  junctionId: string;
  direction: Direction;
  roadId: string;
  currentLightState: LightState;
  redPin: number;
  yellowPin: number;
  greenPin: number;
  lastChanged: string;
}

export interface SignalTiming {
  timingId: string;
  signalId: string;
  roadId: string;
  direction: Direction;
  greenDuration: number;
  yellowDuration: number;
  redDuration: number;
  calculatedDuration: number;
  reason: string;
  mode: ControlMode;
  appliedAt: string;
}

export interface EmergencyEvent {
  eventId: string;
  sensorId: string;
  junctionId: string;
  roadId: string;
  direction: Direction;
  vehicleType: EmergencyVehicleType;
  priorityLevel: EmergencyPriority;
  detectedAt: string;
  status: EmergencyStatus;
  actionTaken: string;
  clearedAt?: string;
  isSimulated: boolean;
}

export interface TrafficThresholds {
  lowMax: number;       // < 10 -> Low (Green: 15s)
  mediumMax: number;    // 10-20 -> Medium (Green: 25s)
  highMax: number;      // 21-35 -> High (Green: 40s)
  // > 35 -> Very High (Green: 55s)
  yellowDuration: number; // 3s
  allRedDuration: number; // 2s
  minGreen: number;     // 15s
  maxGreen: number;     // 65s
}

export interface TrafficDecision {
  roadId: string;
  direction: Direction;
  vehicleCount: number;
  density: DensityLevel;
  recommendedGreenSeconds: number;
  previousDurationSeconds: number;
  reason: string;
  timestamp: string;
}

export interface HardwarePinState {
  pin: number | string;
  label: string;
  type: 'DIGITAL_OUT' | 'DIGITAL_IN' | 'ANALOG_IN';
  value: number | boolean;
  assignedTo: string;
}

export interface HardwareState {
  connected: boolean;
  port?: string;
  lastHeartbeat: string;
  isSimulated: boolean;
  pinStates: Record<string, HardwarePinState>;
  softwareSignalState: Record<Direction, LightState>;
  actualHardwareSignalState: Record<Direction, LightState>;
  irSensorStates: Record<Direction, boolean>;
}

export interface SystemLog {
  id: string;
  timestamp: string;
  eventType: 'HARDWARE' | 'CONTROLLER' | 'DATABASE' | 'EMERGENCY' | 'SIMULATION' | 'MANUAL';
  junctionId: string;
  roadId?: string;
  description: string;
  source: 'ARDUINO' | 'NEO4J' | 'TRAFFIC_ENGINE' | 'SIMULATOR' | 'USER_DASHBOARD';
  level: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'CRITICAL';
}

export interface RoadLiveStatus {
  roadId: string;
  name: string;
  direction: Direction;
  vehicleCount: number;
  density: DensityLevel;
  congestion: CongestionStatus;
  cameraStatus: SensorStatus;
  cameraResolution: string;
  irStatus: SensorStatus;
  irActive: boolean;
  currentSignal: LightState;
  speedLimit: number;
  flowRate: string;
}

export interface PedestrianCrosswalkState {
  isActive: boolean;
  requestedDirection: 'ALL' | Direction;
  phase: 'IDLE' | 'WAITING' | 'WALK' | 'CLEARANCE';
  countdown: number;
  waitingPedestrians: number;
  audioChirpActive: boolean;
  accessibleMode: boolean;
  safeClearanceDuration: number;
}

export interface JunctionLiveTelemetry {
  junctionId: string;
  name: string;
  location: string;
  mode: ControlMode;
  activeDirection: Direction;
  currentPhase: 'GREEN' | 'YELLOW' | 'ALL_RED';
  phaseTimeRemaining: number;
  currentPhaseDuration: number;
  recommendedDuration: number;
  totalVehicleCount: number;
  averageWaitTimeSec: number;
  congestionIndex: number; // 0-100%
  roads: Record<Direction, RoadLiveStatus>;
  lastDecision: TrafficDecision;
  activeEmergency: EmergencyEvent | null;
  pedestrianState?: PedestrianCrosswalkState;
  timestamp: string;
}

// 1. Violation & ANPR Types
export type ViolationType =
  | 'RED_LIGHT_JUMP'
  | 'SPEED_VIOLATION'
  | 'ILLEGAL_TURN'
  | 'ZEBRA_CROSSING_BLOCK'
  | 'NO_HELMET_SEATBELT';

export type ViolationStatus = 'PENDING' | 'PAID' | 'DISPUTED' | 'PROCESSING';

export interface ViolationRecord {
  id: string;
  challanNumber: string;
  plateNumber: string;
  vehicleType: 'CAR' | 'MOTORCYCLE' | 'BUS' | 'TRUCK' | 'AUTO_RICKSHAW';
  violationType: ViolationType;
  junctionId: string;
  roadId: string;
  direction: Direction;
  speedKmh: number;
  speedLimitKmh: number;
  fineAmountInr: number;
  motorVehiclesActSection: string;
  status: ViolationStatus;
  timestamp: string;
  smsDispatched: boolean;
  smsRecipient: string;
  anprConfidence: number;
  ownerName: string;
  paymentTimestamp?: string;
}

// 2. AI Forecaster Types
export interface ForecastHorizonPoint {
  horizonMinutes: number;
  timestamp: string;
  predictedVehicleCount: number;
  predictedCongestion: number;
  predictedDensity: DensityLevel;
  upperConfidence: number;
  lowerConfidence: number;
  roads: Record<Direction, number>;
}

export interface ProactiveTuningPlan {
  junctionId: string;
  detectedSurgeDirection: Direction;
  surgeTimeHorizon: string;
  surgeVehicleIncreasePercent: number;
  recommendedPhaseDuration: number;
  currentPhaseDuration: number;
  reason: string;
  isApplied: boolean;
}

// 3. City Map Node Types
export interface CityIntersectionNode {
  id: string;
  name: string;
  code: string;
  locationName: string;
  x: number;
  y: number;
  lat: number;
  lng: number;
  activeDirection: Direction;
  currentSignal: LightState;
  vehicleCount: number;
  congestionLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  connectedNodeIds: string[];
  hasEmergency: boolean;
  efficiencyRating: string;
}

