// ============================================================================
// INTELLIGENT TRAFFIC SIGNAL CONTROLLER - NEO4J GRAPH SCHEMA & CONSTRAINTS
// DBMS Mini-Project Conceptual EER Model Implementation
// ============================================================================

// 1. UNIQUE CONSTRAINTS
CREATE CONSTRAINT unique_junction_id IF NOT EXISTS
FOR (j:Junction) REQUIRE j.junctionId IS UNIQUE;

CREATE CONSTRAINT unique_road_id IF NOT EXISTS
FOR (r:Road) REQUIRE r.roadId IS UNIQUE;

CREATE CONSTRAINT unique_sensor_id IF NOT EXISTS
FOR (s:Sensor) REQUIRE s.sensorId IS UNIQUE;

CREATE CONSTRAINT unique_camera_id IF NOT EXISTS
FOR (c:Camera) REQUIRE c.sensorId IS UNIQUE;

CREATE CONSTRAINT unique_ir_sensor_id IF NOT EXISTS
FOR (ir:IRSensor) REQUIRE ir.sensorId IS UNIQUE;

CREATE CONSTRAINT unique_signal_id IF NOT EXISTS
FOR (sig:Signal) REQUIRE sig.signalId IS UNIQUE;

CREATE CONSTRAINT unique_record_id IF NOT EXISTS
FOR (vc:VehicleCount) REQUIRE vc.recordId IS UNIQUE;

CREATE CONSTRAINT unique_timing_id IF NOT EXISTS
FOR (st:SignalTiming) REQUIRE st.timingId IS UNIQUE;

CREATE CONSTRAINT unique_event_id IF NOT EXISTS
FOR (e:EmergencyEvent) REQUIRE e.eventId IS UNIQUE;

// 2. INDEXES FOR PERFORMANCE
CREATE INDEX index_vehicle_count_time IF NOT EXISTS
FOR (vc:VehicleCount) ON (vc.timestamp);

CREATE INDEX index_signal_timing_time IF NOT EXISTS
FOR (st:SignalTiming) ON (st.appliedAt);

CREATE INDEX index_emergency_time IF NOT EXISTS
FOR (e:EmergencyEvent) ON (e.detectedAt);

// ============================================================================
// 3. INITIAL SEED GRAPH DATA: 4-WAY JUNCTION "J001" (Central Plaza)
// ============================================================================

// Create Central Junction
MERGE (j:Junction {junctionId: 'J001'})
ON CREATE SET
  j.name = 'Central Plaza 4-Way Intersection',
  j.location = 'Cyber City Sector 4',
  j.status = 'ACTIVE',
  j.createdAt = datetime();

// Create 4 Approach Roads
MERGE (rNorth:Road {roadId: 'R001'})
ON CREATE SET
  rNorth.name = 'North Boulevard',
  rNorth.direction = 'NORTH',
  rNorth.speedLimit = 50,
  rNorth.lanes = 3;

MERGE (rSouth:Road {roadId: 'R002'})
ON CREATE SET
  rSouth.name = 'South Avenue',
  rSouth.direction = 'SOUTH',
  rSouth.speedLimit = 50,
  rSouth.lanes = 3;

MERGE (rEast:Road {roadId: 'R003'})
ON CREATE SET
  rEast.name = 'East Highway',
  rEast.direction = 'EAST',
  rEast.speedLimit = 60,
  rEast.lanes = 3;

MERGE (rWest:Road {roadId: 'R004'})
ON CREATE SET
  rWest.name = 'West Expressway',
  rWest.direction = 'WEST',
  rWest.speedLimit = 60,
  rWest.lanes = 3;

// Connect Junction to Roads: Junction (1) -> Road (N)
MERGE (j)-[:HAS_ROAD]->(rNorth);
MERGE (j)-[:HAS_ROAD]->(rSouth);
MERGE (j)-[:HAS_ROAD]->(rEast);
MERGE (j)-[:HAS_ROAD]->(rWest);

// ============================================================================
// SENSOR SPECIALIZATION (Superclass: Sensor, Subclasses: Camera, IRSensor)
// Total & Disjoint Specialization: Labels [:Sensor:Camera] and [:Sensor:IRSensor]
// ============================================================================

// Road R001 (NORTH) Sensors
MERGE (c1:Sensor:Camera {sensorId: 'C001'})
ON CREATE SET
  c1.name = 'North Optical AI Camera',
  c1.type = 'CAMERA',
  c1.resolution = '4K UHD (3840x2160)',
  c1.fps = 60,
  c1.model = 'HikVision TrafficCam Pro',
  c1.status = 'ONLINE',
  c1.installedDate = '2026-01-15';

MERGE (ir1:Sensor:IRSensor {sensorId: 'IR001'})
ON CREATE SET
  ir1.name = 'North Stop-Line IR Beam Sensor',
  ir1.type = 'IR',
  ir1.rangeCm = 500,
  ir1.detectionSensitivity = 'HIGH',
  ir1.pin = 'A0',
  ir1.status = 'ACTIVE',
  ir1.installedDate = '2026-01-15';

MERGE (rNorth)-[:HAS_CAMERA]->(c1);
MERGE (rNorth)-[:HAS_IR_SENSOR]->(ir1);

// Road R002 (SOUTH) Sensors
MERGE (c2:Sensor:Camera {sensorId: 'C002'})
ON CREATE SET
  c2.name = 'South Optical AI Camera',
  c2.type = 'CAMERA',
  c2.resolution = '4K UHD (3840x2160)',
  c2.fps = 60,
  c2.model = 'HikVision TrafficCam Pro',
  c2.status = 'ONLINE',
  c2.installedDate = '2026-01-15';

MERGE (ir2:Sensor:IRSensor {sensorId: 'IR002'})
ON CREATE SET
  ir2.name = 'South Stop-Line IR Beam Sensor',
  ir2.type = 'IR',
  ir2.rangeCm = 500,
  ir2.detectionSensitivity = 'HIGH',
  ir2.pin = 'A1',
  ir2.status = 'ACTIVE',
  ir2.installedDate = '2026-01-15';

MERGE (rSouth)-[:HAS_CAMERA]->(c2);
MERGE (rSouth)-[:HAS_IR_SENSOR]->(ir2);

// Road R003 (EAST) Sensors
MERGE (c3:Sensor:Camera {sensorId: 'C003'})
ON CREATE SET
  c3.name = 'East Optical AI Camera',
  c3.type = 'CAMERA',
  c3.resolution = '4K UHD (3840x2160)',
  c3.fps = 60,
  c3.model = 'HikVision TrafficCam Pro',
  c3.status = 'ONLINE',
  c3.installedDate = '2026-01-15';

MERGE (ir3:Sensor:IRSensor {sensorId: 'IR003'})
ON CREATE SET
  ir3.name = 'East Stop-Line IR Beam Sensor',
  ir3.type = 'IR',
  ir3.rangeCm = 500,
  ir3.detectionSensitivity = 'HIGH',
  ir3.pin = 'A2',
  ir3.status = 'ACTIVE',
  ir3.installedDate = '2026-01-15';

MERGE (rEast)-[:HAS_CAMERA]->(c3);
MERGE (rEast)-[:HAS_IR_SENSOR]->(ir3);

// Road R004 (WEST) Sensors
MERGE (c4:Sensor:Camera {sensorId: 'C004'})
ON CREATE SET
  c4.name = 'West Optical AI Camera',
  c4.type = 'CAMERA',
  c4.resolution = '4K UHD (3840x2160)',
  c4.fps = 60,
  c4.model = 'HikVision TrafficCam Pro',
  c4.status = 'ONLINE',
  c4.installedDate = '2026-01-15';

MERGE (ir4:Sensor:IRSensor {sensorId: 'IR004'})
ON CREATE SET
  ir4.name = 'West Stop-Line IR Beam Sensor',
  ir4.type = 'IR',
  ir4.rangeCm = 500,
  ir4.detectionSensitivity = 'HIGH',
  ir4.pin = 'A3',
  ir4.status = 'ACTIVE',
  ir4.installedDate = '2026-01-15';

MERGE (rWest)-[:HAS_CAMERA]->(c4);
MERGE (rWest)-[:HAS_IR_SENSOR]->(ir4);

// ============================================================================
// TRAFFIC SIGNALS: Junction (1) -> Signal (N)
// ============================================================================
MERGE (sig1:Signal {signalId: 'SIG001'})
ON CREATE SET sig1.direction = 'NORTH', sig1.currentLightState = 'RED', sig1.redPin = 2, sig1.yellowPin = 3, sig1.greenPin = 4;

MERGE (sig2:Signal {signalId: 'SIG002'})
ON CREATE SET sig2.direction = 'SOUTH', sig2.currentLightState = 'RED', sig2.redPin = 5, sig2.yellowPin = 6, sig2.greenPin = 7;

MERGE (sig3:Signal {signalId: 'SIG003'})
ON CREATE SET sig3.direction = 'EAST', sig3.currentLightState = 'RED', sig3.redPin = 8, sig3.yellowPin = 9, sig3.greenPin = 10;

MERGE (sig4:Signal {signalId: 'SIG004'})
ON CREATE SET sig4.direction = 'WEST', sig4.currentLightState = 'GREEN', sig4.redPin = 11, sig4.yellowPin = 12, sig4.greenPin = 13;

MERGE (j)-[:CONTROLS_SIGNAL]->(sig1);
MERGE (j)-[:CONTROLS_SIGNAL]->(sig2);
MERGE (j)-[:CONTROLS_SIGNAL]->(sig3);
MERGE (j)-[:CONTROLS_SIGNAL]->(sig4);

// ============================================================================
// INITIAL SEED VEHICLE COUNTS & TIMINGS
// ============================================================================
MERGE (vcInit:VehicleCount {recordId: 'VC_INIT_001'})
ON CREATE SET
  vcInit.count = 34,
  vcInit.densityLevel = 'VERY HIGH',
  vcInit.congestionStatus = 'HEAVY_QUEUE',
  vcInit.flowRate = '42 vehicles/min',
  vcInit.timestamp = datetime();

MERGE (c4)-[:RECORDED_COUNT]->(vcInit);

MERGE (stInit:SignalTiming {timingId: 'ST_INIT_001'})
ON CREATE SET
  stInit.greenDuration = 48,
  stInit.yellowDuration = 3,
  stInit.redDuration = 105,
  stInit.calculatedDuration = 48,
  stInit.reason = 'Dynamic Green Allocation for Very High Density (34 vehicles)',
  stInit.mode = 'AUTOMATIC',
  stInit.appliedAt = datetime();

MERGE (sig4)-[:HAS_TIMING]->(stInit);
