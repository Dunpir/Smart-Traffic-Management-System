# INTELLIGENT TRAFFIC SIGNAL CONTROLLER
### Central Traffic Control System & Hardware ↔ Neo4j Database Middleware

> **DBMS Mini-Project**: A production-grade, full-stack Smart Traffic Management System bridging physical IoT hardware (Arduino, Optical Cameras, IR Beam Sensors, LED Signal Actuators) with a Graph Database (Neo4j) and an interactive web-based Control Center.

---

## 1. Project Concept & Overview

Traditional traffic controllers operate on fixed-time cycles or isolated local sensors without persistent relational graph context or emergency pre-emption capabilities.

This project delivers a **Central Traffic Control System** that functions as both:
1. **Central Traffic Controller**: Computes real-time dynamic signal phase durations using transparent rule-based traffic density equations and pre-emptive emergency corridors.
2. **Hardware ↔ Neo4j Database Bridge**: Ingests multi-modal edge sensor telemetry (Optical Cameras & Stop-Line IR sensors via Arduino), commits ACID graph transactions to Neo4j, and dispatches hardware actuator commands to 12-channel signal LEDs (Pins D2-D13).

```
CAMERA + IR SENSORS
        ↓
      ARDUINO (Edge Microcontroller)
        ↓
   BACKEND / API (Node.js + Express)
        ↕
      NEO4J (Graph Database)
        ↕
 TRAFFIC CONTROL LOGIC (Rule-Based Engine)
        ↓
   BACKEND / API
        ↓
      ARDUINO (Actuator Driver)
        ↓
 RED / YELLOW / GREEN (Traffic Signal Heads)
```

---

## 2. System Architecture

```
                       ┌─────────────────────────┐
                       │  CAMERA & IR SENSORS    │
                       │  (Physical or Simulator)│
                       └───────────┬─────────────┘
                                   │ Telemetry
                                   ▼
                       ┌─────────────────────────┐
                       │   ARDUINO / SIMULATOR   │
                       └───────────┬─────────────┘
                                   │ POST /api/hardware/sensor-data
                                   │ POST /api/hardware/emergency
                                   ▼
      ┌────────────────────────────────────────────────────────────┐
      │                   NODE.JS / EXPRESS BACKEND                │
      │                                                            │
      │   ┌─────────────────────┐      ┌───────────────────────┐   │
      │   │ Hardware Adapter    │      │ Rule-Based Decision   │   │
      │   │ & Validation        │      │ Engine & Emergency    │   │
      │   └──────────┬──────────┘      └───────────┬───────────┘   │
      │              │                             │                   │
      │              ▼                             ▼                   │
      │   ┌────────────────────────────────────────────────────┐       │
      │   │  Neo4j Service (Cypher Queries & Graph Transactions│       │
      │   └────────────────────────┬───────────────────────────┘       │
      │                            │                                   │
      │                            ▼                                   │
      │   ┌────────────────────────────────────────────────────┐       │
      │   │  WebSocket Gateway (Socket.IO Live Telemetry Broadcast)   │
      │   └────────────────────────┬───────────────────────────┘       │
      └────────────────────────────┼───────────────────────────────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    │                             │
                    ▼                             ▼
        ┌───────────────────────┐     ┌───────────────────────┐
        │   ARDUINO ACTUATORS   │     │  REACT WEB DASHBOARD  │
        │  (Traffic Light LEDs) │     │  (Control Center UI)  │
        └───────────────────────┘     └───────────────────────┘
```

---

## 3. Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide Icons, Recharts, Socket.IO Client.
- **Backend**: Node.js, Express, TypeScript, Neo4j Driver v5, Socket.IO, Zod.
- **Database**: Neo4j Graph Database (Cypher Query Language).
- **Physical Hardware Layer**: Arduino Uno / Mega 2560, 12x Traffic Signal LEDs (Pins D2-D13), 4x IR Obstacle Sensors (Pins A0-A3), Serial JSON Bridge (9600 Baud).
- **Communication Protocol**: RESTful JSON APIs + Real-time WebSockets (Socket.IO).

---

## 4. Conceptual Database Model & EER Specification

### Entities
1. **`Junction`** (`junctionId`, `name`, `location`, `status`, `createdAt`)
2. **`Road`** (`roadId`, `junctionId`, `name`, `direction` [NORTH/SOUTH/EAST/WEST], `speedLimit`, `lanes`)
3. **`Sensor`** (Superclass: `sensorId`, `roadId`, `name`, `type`, `status`, `installedDate`, `lastActive`)
   - **`Camera`** (Subclass: `resolution`, `fps`, `model`)
   - **`IRSensor`** (Subclass: `rangeCm`, `detectionSensitivity`, `pin`)
4. **`VehicleCount`** (`recordId`, `sensorId`, `roadId`, `count`, `densityLevel`, `congestionStatus`, `flowRate`, `timestamp`)
5. **`Signal`** (`signalId`, `junctionId`, `direction`, `currentLightState` [RED/YELLOW/GREEN], `redPin`, `yellowPin`, `greenPin`, `lastChanged`)
6. **`SignalTiming`** (`timingId`, `signalId`, `direction`, `greenDuration`, `yellowDuration`, `redDuration`, `calculatedDuration`, `reason`, `mode`, `appliedAt`)
7. **`EmergencyEvent`** (`eventId`, `sensorId`, `junctionId`, `roadId`, `direction`, `vehicleType` [AMBULANCE/FIRE_TRUCK/POLICE], `priorityLevel`, `detectedAt`, `status`, `actionTaken`, `clearedAt`, `isSimulated`)

### Specialization Constraints
- **Total Specialization**: Every sensor instance in `Sensor` belongs to either `Camera` or `IRSensor`.
- **Disjoint Specialization**: An instance cannot belong to both `Camera` and `IRSensor`.

### Relationships & Cardinalities
- `Junction (1) ──[:HAS_ROAD]──> Road (4)`
- `Road (1) ──[:HAS_CAMERA]──> Camera (1)`
- `Road (1) ──[:HAS_IR_SENSOR]──> IRSensor (1)`
- `Camera (1) ──[:RECORDED_COUNT]──> VehicleCount (N)`
- `Junction (1) ──[:CONTROLS_SIGNAL]──> Signal (4)`
- `Signal (1) ──[:HAS_TIMING]──> SignalTiming (N)`
- `Sensor (1) ──[:DETECTED_EMERGENCY]──> EmergencyEvent (N)`
- `EmergencyEvent (N) ──[:AFFECTS_JUNCTION]──> Junction (1)`
- `EmergencyEvent (N) ──[:AFFECTS_ROAD]──> Road (1)`

### Normalization (BCNF)
Every relation $R$ satisfies Boyce-Codd Normal Form since for every non-trivial functional dependency $X \to Y$, $X$ is a superkey of $R$.

---

## 5. Neo4j Setup & Execution

### Option A: Local Neo4j Desktop / Neo4j Community Server
1. Download & Install [Neo4j Desktop](https://neo4j.com/download/) or run via Docker:
   ```bash
   docker run \
     --name neo4j-traffic \
     -p 7474:7474 -p 7687:7687 \
     -d \
     -e NEO4J_AUTH=neo4j/password \
     neo4j:latest
   ```
2. Open Neo4j Browser at `http://localhost:7474` and execute the schema initialization script located at `database/schema.cypher`.

### Option B: Built-in Graceful Fallback Mode
If Neo4j is offline or not installed on your machine, the backend will honestly show **`DATABASE OFFLINE (FALLBACK ACTIVE)`** and operate using an in-memory graph store with identical Cypher query capabilities, ensuring zero crashes during demos.

---

## 6. Environment Variables (`.env`)

Create `.env` in the `backend/` directory or root:
```env
PORT=5001
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173

# Neo4j Graph Database Configuration
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=password
NEO4J_DATABASE=neo4j

# Simulation Settings
SIMULATION_ENABLED=true
SIMULATION_TICK_MS=3000

# Hardware Serial Configuration (Optional for physical Arduino)
SERIAL_PORT=/dev/tty.usbmodem1101
BAUD_RATE=9600
```

---

## 7. Installation and Running Locally

### Step 1: Install Dependencies
```bash
# From the project root
npm run install:all
```

### Step 2: Start Backend Server
```bash
npm run backend:dev
# Backend starts at http://localhost:5001
```

### Step 3: Start Frontend Web Dashboard
```bash
npm run frontend:dev
# Frontend UI starts at http://localhost:5173
```

---

## 8. Hardware Layer & Arduino Integration

The Arduino C++ sketch is available in `docs/arduino/traffic_controller.ino`.

### Pinout Mapping:
- **North Road Traffic Light**: Red: `D2`, Yellow: `D3`, Green: `D4`
- **South Road Traffic Light**: Red: `D5`, Yellow: `D6`, Green: `D7`
- **East Road Traffic Light**: Red: `D8`, Yellow: `D9`, Green: `D10`
- **West Road Traffic Light**: Red: `D11`, Yellow: `D12`, Green: `D13`
- **Stop-Line IR Obstacle Sensors**: North: `A0`, South: `A1`, East: `A2`, West: `A3`

### Seamless Physical ↔ Simulated Hardware Transition
The backend uses a **Hardware Abstraction Layer (HAL)**. In Simulation Mode, the simulation engine posts telemetry to `/api/hardware/sensor-data`. When a physical Arduino is plugged in via USB, the Serial bridge communicates using the exact same JSON format, requiring **zero changes** to the application code.

---

## 9. Rule-Based Traffic Decision Logic

The decision engine operates on transparent, configurable rules:
- **Low Traffic** ($\le 10$ vehicles): **15s Base Green**
- **Medium Traffic** ($11 - 20$ vehicles): **28s Standard Green**
- **High Traffic** ($21 - 35$ vehicles): **42s Extended Green**
- **Very High Traffic** ($> 35$ vehicles): **58s Maximum Green**
- **IR Stop-Line Trigger**: Stationary queue bonus (+5s).
- **Safety Transitions**: 3s Yellow clearance + 2s All-Red intersection clearance.

---

## 10. Emergency Vehicle Priority System

When an emergency vehicle is detected (Ambulance, Fire Truck, Police):
1. Prominent flashing red HUD banner appears on dashboard.
2. Opposing phases transition with safe 3s yellow clearance to ALL-RED.
3. Priority green corridor opens on the target approach road.
4. `EmergencyEvent` node and relationships are committed to Neo4j.
5. All conflicting signals are locked to RED.
6. Upon clearing, the system safely resumes adaptive rule-based cycling.

---

## 11. 14-Step Academic Demonstration Tour

The web application includes an automated **Guided Demo Mode** accessible from the header:
- **Step 1**: Open dashboard & verify 4-way topology.
- **Step 2**: Check genuine Neo4j and Arduino connection status.
- **Step 3**: Start Simulation Engine.
- **Step 4**: Observe live sensor telemetry streaming over WebSockets.
- **Step 5**: Inject traffic congestion spike on West Road (36 vehicles).
- **Step 6**: Controller evaluates congestion in real-time.
- **Step 7**: Recommended green duration dynamically extends (30s $\to$ 48s).
- **Step 8**: Signal state changes in 4-way junction visualizer.
- **Step 9**: Inspect committed Cypher records in Neo4j Database Explorer.
- **Step 10**: Trigger 🚨 Ambulance Emergency on East Road.
- **Step 11**: Priority green corridor opens instantly.
- **Step 12**: Hardware safety interlock locks all conflicting lights RED.
- **Step 13**: Verify emergency audit record in Neo4j database events.
- **Step 14**: Release emergency corridor and return to normal adaptive cycle.

---

## 12. REST API Documentation

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/traffic-status` | Get live 4-way junction telemetry & active phase |
| `POST` | `/api/traffic/mode` | Set mode (`AUTOMATIC` or `MANUAL`) |
| `POST` | `/api/traffic/manual-command` | Force manual signal state with safety interlock |
| `POST` | `/api/traffic/start` | Start automatic signal cycle |
| `POST` | `/api/traffic/stop` | Stop signal cycle |
| `POST` | `/api/traffic/reset` | Reset junction to default operational state |
| `POST` | `/api/traffic/resolve-emergency` | Clear active emergency priority corridor |
| `POST` | `/api/hardware/sensor-data` | Ingest Camera vehicle counts or IR sensor states |
| `POST` | `/api/hardware/emergency` | Ingest hardware emergency trigger |
| `POST` | `/api/signal/command` | Dispatch LED commands to actuators |
| `GET` | `/api/hardware/status` | Get GPIO pin states & hardware handshake status |
| `GET` | `/api/database/status` | Get Neo4j connection status, latency, and mode |
| `GET` | `/api/database/stats` | Get entity counts (Junctions, Roads, Sensors, etc.) |
| `GET` | `/api/database/graph` | Get graph nodes & relationships for visualizer |
| `POST` | `/api/database/query` | Execute raw Cypher query |
| `POST` | `/api/simulation/start` | Start traffic simulation loop |
| `POST` | `/api/simulation/spike` | Inject congestion spike on a road |
| `POST` | `/api/simulation/emergency` | Inject emergency vehicle into simulation |
| `GET` | `/api/analytics/timeseries` | Get vehicle queue timeseries data |
| `GET` | `/api/logs` | Query real-time system audit logs |

---

## 13. License

MIT License © 2026 Smart Traffic Systems
