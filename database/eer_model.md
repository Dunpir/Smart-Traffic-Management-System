# Database Conceptual Model & EER Specification

## 1. Conceptual Overview

The Intelligent Traffic Signal Controller database models an urban smart traffic junction equipped with multi-modal sensors (Optical Cameras & Infrared Beam Sensors), signal light actuators (Red/Yellow/Green), timeseries vehicle counts, dynamic signal phase timings, and pre-emptive emergency vehicle detection records.

```
                             +---------------+
                             |    Junction   |
                             +-------+-------+
                                     |
               +---------------------+---------------------+
           1   | HAS_ROAD                              1   | CONTROLS_SIGNAL
               |                                           |
               v N                                         v N
         +-----------+                               +------------+
         |   Road    |                               |   Signal   |
         +-----+-----+                               +-----+------+
               |                                           |
        +------+------+                             1      | HAS_TIMING
      1 |             | 1                                  v N
        v             v                              +------------+
  +----------+   +----------+                        |SignalTiming|
  |  Camera  |   | IRSensor |                        +------------+
  +----+-----+   +----+-----+
       |              |
       |  (Specialization of Sensor: TOTAL, DISJOINT)
       |
       | 1 RECORDED_COUNT
       v N
+--------------+               +---------------+
| VehicleCount |         1     |EmergencyEvent |
+--------------+   +---------->+---------------+
                   |           |               |
                   | DETECTED  | AFFECTS       | AFFECTS
                   |           v N             v N
              +----+-----+ +---+----+     +----+----+
              |  Sensor  | |Junction|     |  Road   |
              +----------+ +--------+     +---------+
```

---

## 2. Entities and Attributes

### 1. `Junction`
- **`junctionId`** (Primary Key / Unique String, e.g., `"J001"`)
- `name` (String, e.g., `"Central Plaza 4-Way Intersection"`)
- `location` (String, e.g., `"Cyber City Sector 4"`)
- `status` (String: `"ACTIVE"` | `"MAINTENANCE"` | `"OFFLINE"`)
- `createdAt` (Timestamp)

### 2. `Road`
- **`roadId`** (Primary Key / Unique String, e.g., `"R001"`)
- `name` (String, e.g., `"North Boulevard"`)
- `direction` (Enum: `"NORTH"` | `"SOUTH"` | `"EAST"` | `"WEST"`)
- `speedLimit` (Integer: km/h, e.g., `50`)
- `lanes` (Integer: e.g., `3`)

### 3. `Sensor` (Superclass Entity)
- **`sensorId`** (Primary Key / Unique String, e.g., `"S001"`, `"C001"`, `"IR001"`)
- `name` (String)
- `type` (Enum: `"CAMERA"` | `"IR"`)
- `status` (Enum: `"ONLINE"` | `"ACTIVE"` | `"INACTIVE"` | `"FAULT"`)
- `installedDate` (Date / Timestamp)
- `lastActive` (Timestamp)

#### 3A. `Camera` (Subclass of `Sensor`)
- Inherits all attributes of `Sensor`
- `resolution` (String, e.g., `"4K UHD (3840x2160)"`)
- `fps` (Integer, e.g., `60`)
- `model` (String, e.g., `"HikVision TrafficCam Pro"`)

#### 3B. `IRSensor` (Subclass of `Sensor`)
- Inherits all attributes of `Sensor`
- `rangeCm` (Integer, e.g., `500`)
- `detectionSensitivity` (String: `"HIGH"` | `"MEDIUM"` | `"LOW"`)
- `pin` (String: Arduino analog/digital pin, e.g., `"A0"`)

### 4. `VehicleCount`
- **`recordId`** (Primary Key / Unique String, e.g., `"VC_1724773800000"`)
- `count` (Integer: current vehicle count)
- `densityLevel` (Enum: `"LOW"` | `"MEDIUM"` | `"HIGH"` | `"VERY HIGH"`)
- `congestionStatus` (Enum: `"FREE_FLOW"` | `"MODERATE"` | `"CONGESTED"` | `"HEAVY_QUEUE"`)
- `flowRate` (String: estimated vehicles per minute)
- `timestamp` (Timestamp ISO-8601)

### 5. `Signal`
- **`signalId`** (Primary Key / Unique String, e.g., `"SIG001"`)
- `direction` (Enum: `"NORTH"` | `"SOUTH"` | `"EAST"` | `"WEST"`)
- `currentLightState` (Enum: `"RED"` | `"YELLOW"` | `"GREEN"`)
- `redPin` (Integer: Arduino Digital Pin)
- `yellowPin` (Integer: Arduino Digital Pin)
- `greenPin` (Integer: Arduino Digital Pin)
- `lastChanged` (Timestamp)

### 6. `SignalTiming`
- **`timingId`** (Primary Key / Unique String, e.g., `"ST_1724773800000"`)
- `greenDuration` (Integer: seconds allocated)
- `yellowDuration` (Integer: seconds, typically 3-5s)
- `redDuration` (Integer: seconds)
- `calculatedDuration` (Integer: calculated optimal green window)
- `reason` (String: rule-based textual justification)
- `mode` (Enum: `"AUTOMATIC"` | `"MANUAL"` | `"EMERGENCY_OVERRIDE"`)
- `appliedAt` (Timestamp)

### 7. `EmergencyEvent`
- **`eventId`** (Primary Key / Unique String, e.g., `"EMG_001"`)
- `vehicleType` (Enum: `"AMBULANCE"` | `"FIRE_TRUCK"` | `"POLICE"`)
- `priorityLevel` (Enum: `"CRITICAL"` | `"HIGH"` | `"STANDARD"`)
- `detectedAt` (Timestamp)
- `status` (Enum: `"DETECTED"` | `"ACTIVE_CORRIDOR"` | `"RESOLVED"`)
- `actionTaken` (String: e.g., `"Pre-empted West Road green; switched to priority corridor for 30s"`)
- `clearedAt` (Timestamp)

---

## 3. Sensor Specialization Hierarchy Analysis

In database design theory:
1. **Total Specialization**: Every entity in the superclass `Sensor` MUST belong to at least one subclass. There is no generic sensor that is neither a Camera nor an IR sensor.
$$\forall s \in Sensor, s \in Camera \lor s \in IRSensor$$
2. **Disjoint Specialization**: An entity in the superclass `Sensor` can belong to AT MOST ONE subclass. A camera cannot simultaneously be an IR sensor.
$$Camera \cap IRSensor = \emptyset$$

### Implementation in Neo4j Graph Model
Neo4j natively supports multi-labeling on nodes:
- A Camera node has labels: `(:Sensor:Camera { sensorId: 'C001', ... })`
- An IR Sensor node has labels: `(:Sensor:IRSensor { sensorId: 'IR001', ... })`
- Total & Disjoint integrity is enforced at the API & ingestion layer via Zod schema validation and Cypher transaction guards.

---

## 4. Relationship Cardinalities

| Entity 1 | Relationship | Entity 2 | Cardinality | Multiplicity | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Junction** | `HAS_ROAD` | **Road** | 1 : N | 1 Junction to 4 Roads | Central junction connects 4 approaches |
| **Road** | `HAS_CAMERA` | **Camera** | 1 : 1 | 1 Road has 1 Camera | Dedicated camera per approach lane |
| **Road** | `HAS_IR_SENSOR` | **IRSensor**| 1 : 1 | 1 Road has 1 IR Sensor | Stop-line beam presence sensor |
| **Camera** | `RECORDED_COUNT`| **VehicleCount**| 1 : N | 1 Camera to many count records | Time-series vehicle observations |
| **Junction** | `CONTROLS_SIGNAL`| **Signal** | 1 : N | 1 Junction to 4 Signals | 4-channel traffic signal heads |
| **Signal** | `HAS_TIMING` | **SignalTiming**| 1 : N | 1 Signal to many timings | Dynamic phase timing execution logs |
| **Sensor** | `DETECTED_EMERGENCY`| **EmergencyEvent**| 1 : N | 1 Sensor to many emergencies | Sensor trigger records emergency |
| **EmergencyEvent** | `AFFECTS_JUNCTION`| **Junction** | N : 1 | Many emergencies to 1 Junction | Preemption target junction |
| **EmergencyEvent** | `AFFECTS_ROAD`| **Road** | N : 1 | Many emergencies to 1 Road | Approaching road cleared for corridor |

---

## 5. Relational Normalization Analysis (BCNF)

If mapped into relational tables:
- **`Junction(junctionId, name, location, status, createdAt)`**
  - FD: `junctionId -> name, location, status, createdAt`
  - Candidate Key: `{junctionId}`
  - Superkey on every FD $\implies$ **In BCNF**.
- **`Road(roadId, junctionId, name, direction, speedLimit, lanes)`**
  - FD: `roadId -> junctionId, name, direction, speedLimit, lanes`
  - Candidate Key: `{roadId}`
  - Superkey on every FD $\implies$ **In BCNF**.
- **`Sensor(sensorId, roadId, name, type, status, installedDate, lastActive)`**
  - FD: `sensorId -> roadId, name, type, status, installedDate, lastActive`
  - Candidate Key: `{sensorId}`
  - Superkey on every FD $\implies$ **In BCNF**.
- **`Camera(sensorId, resolution, fps, model)`**
  - FD: `sensorId -> resolution, fps, model`
  - Foreign Key referencing `Sensor(sensorId)`
  - Candidate Key: `{sensorId}` $\implies$ **In BCNF**.
- **`IRSensor(sensorId, rangeCm, detectionSensitivity, pin)`**
  - FD: `sensorId -> rangeCm, detectionSensitivity, pin`
  - Foreign Key referencing `Sensor(sensorId)`
  - Candidate Key: `{sensorId}` $\implies$ **In BCNF**.
- **`VehicleCount(recordId, sensorId, count, densityLevel, congestionStatus, flowRate, timestamp)`**
  - FD: `recordId -> sensorId, count, densityLevel, congestionStatus, flowRate, timestamp`
  - Candidate Key: `{recordId}` $\implies$ **In BCNF**.
- **`Signal(signalId, junctionId, direction, currentLightState, redPin, yellowPin, greenPin, lastChanged)`**
  - FD: `signalId -> junctionId, direction, currentLightState, redPin, yellowPin, greenPin, lastChanged`
  - Candidate Key: `{signalId}` $\implies$ **In BCNF**.
- **`SignalTiming(timingId, signalId, greenDuration, yellowDuration, redDuration, calculatedDuration, reason, mode, appliedAt)`**
  - FD: `timingId -> signalId, greenDuration, yellowDuration, redDuration, calculatedDuration, reason, mode, appliedAt`
  - Candidate Key: `{timingId}` $\implies$ **In BCNF**.
- **`EmergencyEvent(eventId, sensorId, junctionId, roadId, vehicleType, priorityLevel, detectedAt, status, actionTaken, clearedAt)`**
  - FD: `eventId -> sensorId, junctionId, roadId, vehicleType, priorityLevel, detectedAt, status, actionTaken, clearedAt`
  - Candidate Key: `{eventId}` $\implies$ **In BCNF**.

**Conclusion**: All relations satisfy Boyce-Codd Normal Form (BCNF) without transitive or partial dependencies.
