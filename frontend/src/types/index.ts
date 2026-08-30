export type Direction = 'NORTH' | 'SOUTH' | 'EAST' | 'WEST';
export type LightState = 'RED' | 'YELLOW' | 'GREEN';
export type SensorType = 'CAMERA' | 'IR';
export type SensorStatus = 'ONLINE' | 'ACTIVE' | 'INACTIVE' | 'FAULT';
export type DensityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY HIGH';
export type CongestionStatus = 'FREE_FLOW' | 'MODERATE' | 'CONGESTED' | 'HEAVY_QUEUE';
export type ControlMode = 'AUTOMATIC' | 'MANUAL' | 'EMERGENCY_OVERRIDE';
export type EmergencyVehicleType = 'AMBULANCE' | 'FIRE_TRUCK' | 'POLICE' | 'VIP';
export type EmergencyPriority = 'CRITICAL' | 'HIGH' | 'STANDARD';
export type EmergencyStatus = 'DETECTED' | 'ACTIVE_CORRIDOR' | 'RESOLVED';

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
  congestionIndex: number;
  roads: Record<Direction, RoadLiveStatus>;
  lastDecision: TrafficDecision;
  activeEmergency: EmergencyEvent | null;
  pedestrianState?: PedestrianCrosswalkState;
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

export interface DatabaseStatus {
  connected: boolean;
  uri: string;
  database: string;
  latencyMs: number;
  lastChecked: string;
  error: string | null;
  mode: 'NEO4J_LIVE' | 'OFFLINE_FALLBACK';
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

export interface SimulationConfig {
  isRunning: boolean;
  tickIntervalMs: number;
  scenario: 'NORMAL_FLUCTUATION' | 'MORNING_RUSH' | 'EVENING_RUSH' | 'RAIN_STORM';
  autoEmergencySpawn: boolean;
}

export interface GraphNode {
  id: string | number;
  label: string;
  name: string;
  group: string;
  properties: Record<string, any>;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

export interface GraphLink {
  source: string | number | any;
  target: string | number | any;
  type: string;
}

// 1. Eco & Carbon Footprint Types
export interface EcoMetrics {
  co2SavedKg: number;
  co2SavedTodayKg: number;
  fuelSavedLiters: number;
  treesEquivalent: number;
  ecoScore: number;
  ecoGrade: 'A+' | 'A' | 'B+' | 'B' | 'C';
  idleReductionPercent: number;
  staticEmissionsKg: number;
  smartEmissionsKg: number;
}

// 2. Multi-Junction Green Wave Corridor Types
export interface CorridorJunction {
  junctionId: string;
  name: string;
  distanceMeters: number;
  currentSignal: LightState;
  phaseTimeRemaining: number;
  phaseDuration: number;
  vehicleCount: number;
  offsetDelaySec: number;
  queueLength: number;
  speedLimitKmh: number;
}

export interface GreenWaveConfig {
  enabled: boolean;
  targetSpeedKmh: number;
  platoonSize: number;
  corridorDirection: 'EAST_BOUND' | 'WEST_BOUND';
  activeEmergencyCorridor: boolean;
  waveProgressPercent: number;
}

// 3. AI Computer Vision Stream Types
export type WeatherCondition = 'CLEAR' | 'RAIN' | 'FOG' | 'NIGHT_RUSH';

export interface CameraBoundingBox {
  id: string;
  label: 'CAR' | 'BUS' | 'TRUCK' | 'MOTORCYCLE' | 'AMBULANCE';
  confidence: number;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  w: number;
  h: number;
  speed: number;
  lane: number;
}

export interface VisionFeedState {
  direction: Direction;
  resolution: string;
  fps: number;
  latencyMs: number;
  model: string;
  weather: WeatherCondition;
  detectionCount: number;
  confidenceAverage: number;
  rainFrictionFactor: number;
  safeBrakingDistanceMeters: number;
  boundingBoxes: CameraBoundingBox[];
}

// 4. Historical Time-Travel Replay Types
export interface HistoricalSnapshot {
  id: string;
  timestamp: string;
  timeFormatted: string;
  activeDirection: Direction;
  currentPhase: 'GREEN' | 'YELLOW' | 'ALL_RED';
  phaseCountdown: number;
  vehicleCount: number;
  congestionIndex: number;
  averageWaitTimeSec: number;
  co2RateKgPerHour: number;
  isEmergency: boolean;
  emergencyVehicle?: string;
  eventDescription?: string;
  roads: Record<Direction, { count: number; signal: LightState; density: DensityLevel }>;
}

export interface ReplayState {
  isReplaying: boolean;
  isPlaying: boolean;
  playbackSpeed: 1 | 2 | 5;
  currentIndex: number;
  snapshots: HistoricalSnapshot[];
}

// 5. Automated E-Challan & ANPR Types
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

export interface ViolationStats {
  totalViolations: number;
  pendingViolations: number;
  paidViolations: number;
  totalFinesInr: number;
  collectedFinesInr: number;
  collectionRatePercent: number;
  anprAccuracyRate: number;
  typeBreakdown: Record<string, number>;
}

// 6. AI Predictive Forecaster Types
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

export interface ForecastModelMetrics {
  modelName: string;
  accuracyPercent: number;
  meanAbsoluteError: number;
  r2Score: number;
  lastTrained: string;
  confidenceInterval: string;
}

export interface RushHourCurvePoint {
  hour: string;
  weekday: number;
  rainStorm: number;
  weekend: number;
  liveActual: number | null;
  mlForecast: number;
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

// 7. Multi-Junction City Map Types
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

export interface CityCorridorRoute {
  id: string;
  name: string;
  from: string;
  to: string;
  via: string[];
  totalDistanceKm: number;
  synchronizedGreenWave: boolean;
  averageSpeedKmh: number;
}

export interface CityMapData {
  city: string;
  totalActiveIntersections: number;
  connectedCorridorsCount: number;
  networkCongestionAverage: string;
  intersections: CityIntersectionNode[];
}

// 8. Smart City PDF Audit Report Types
export interface AuditReportData {
  reportId: string;
  generatedAt: string;
  junctionId: string;
  junctionName: string;
  cityZone: string;
  totalThroughputVehicles: number;
  co2SavedKg: number;
  fuelSavedLiters: number;
  waitTimeReductionPercent: number;
  signalEfficiencyScore: string;
  emergenciesClearedCount: number;
  violationsCount: number;
  totalFinesCollectedInr: number;
  aiAccuracyPercent: number;
}


