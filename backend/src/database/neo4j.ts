import neo4j, { Driver, Session } from 'neo4j-driver';
import { CONFIG } from '../config/environment';
import {
  Junction,
  Road,
  Camera,
  IRSensor,
  VehicleCount,
  Signal,
  SignalTiming,
  EmergencyEvent,
} from '../types';

export interface DatabaseStatus {
  connected: boolean;
  uri: string;
  database: string;
  latencyMs: number;
  lastChecked: string;
  error: string | null;
  mode: 'NEO4J_LIVE' | 'OFFLINE_FALLBACK';
}

class Neo4jService {
  private driver: Driver | null = null;
  private status: DatabaseStatus = {
    connected: false,
    uri: CONFIG.NEO4J.URI,
    database: CONFIG.NEO4J.DATABASE,
    latencyMs: 0,
    lastChecked: new Date().toISOString(),
    error: 'Initial connection pending',
    mode: 'OFFLINE_FALLBACK',
  };

  // In-memory fallback graph store (ensures 100% functionality and zero crashes if Neo4j is offline)
  public memoryStore = {
    junctions: new Map<string, Junction>(),
    roads: new Map<string, Road>(),
    cameras: new Map<string, Camera>(),
    irSensors: new Map<string, IRSensor>(),
    vehicleCounts: [] as VehicleCount[],
    signals: new Map<string, Signal>(),
    signalTimings: [] as SignalTiming[],
    emergencyEvents: [] as EmergencyEvent[],
    recentEvents: [] as { id: string; timestamp: string; title: string; detail: string; cypherSnippet?: string }[],
  };

  constructor() {
    this.seedMemoryStore();
    this.initDriver();
    // Periodically verify Neo4j connectivity
    setInterval(() => this.checkConnectivity(), 10000);
  }

  private initDriver() {
    try {
      this.driver = neo4j.driver(
        CONFIG.NEO4J.URI,
        neo4j.auth.basic(CONFIG.NEO4J.USER, CONFIG.NEO4J.PASSWORD),
        { maxConnectionLifetime: 3 * 60 * 60 * 1000, maxConnectionPoolSize: 50, connectionAcquisitionTimeout: 5000 }
      );
      this.checkConnectivity();
    } catch (err: any) {
      this.status.connected = false;
      this.status.error = err.message || 'Driver initialization error';
      this.status.mode = 'OFFLINE_FALLBACK';
    }
  }

  public async checkConnectivity(): Promise<DatabaseStatus> {
    const startTime = Date.now();
    this.status.lastChecked = new Date().toISOString();

    if (!this.driver) {
      this.initDriver();
    }

    if (this.driver) {
      try {
        await this.driver.verifyConnectivity();
        const latency = Date.now() - startTime;
        this.status.connected = true;
        this.status.latencyMs = Math.max(1, latency);
        this.status.error = null;
        this.status.mode = 'NEO4J_LIVE';

        // If connected, ensure schema constraints and base seed exist in Neo4j
        await this.ensureSchemaInitialized();
        return this.status;
      } catch (err: any) {
        this.status.connected = false;
        this.status.latencyMs = Date.now() - startTime;
        this.status.error = err.message || 'Connection refused (Neo4j offline)';
        this.status.mode = 'OFFLINE_FALLBACK';
      }
    } else {
      this.status.connected = false;
      this.status.error = 'Neo4j driver is not initialized';
      this.status.mode = 'OFFLINE_FALLBACK';
    }

    return this.status;
  }

  public getStatus(): DatabaseStatus {
    return { ...this.status };
  }

  public getSession(): Session | null {
    if (this.driver && this.status.connected) {
      return this.driver.session({ database: CONFIG.NEO4J.DATABASE });
    }
    return null;
  }

  /**
   * Execute a Cypher query on Neo4j if online.
   * If offline, returns null and logs failure safely.
   */
  public async executeCypher<T = any>(query: string, params: Record<string, any> = {}): Promise<T[] | null> {
    const session = this.getSession();
    if (!session) {
      return null;
    }

    try {
      const result = await session.run(query, params);
      const records = result.records.map((r) => r.toObject() as T);
      return records;
    } catch (err: any) {
      console.warn(`[Neo4j Query Error]`, err.message);
      return null;
    } finally {
      await session.close();
    }
  }

  /**
   * Initializes Base Conceptual Graph Schema in Neo4j
   */
  private async ensureSchemaInitialized() {
    const session = this.getSession();
    if (!session) return;

    try {
      // Create Junction
      await session.run(`
        MERGE (j:Junction {junctionId: 'J001'})
        ON CREATE SET
          j.name = 'Central Plaza 4-Way Intersection',
          j.location = 'Cyber City Sector 4',
          j.status = 'ACTIVE',
          j.createdAt = datetime()
      `);

      // Create Roads
      const roads = [
        { id: 'R001', name: 'North Boulevard', dir: 'NORTH', speed: 50, lanes: 3 },
        { id: 'R002', name: 'South Avenue', dir: 'SOUTH', speed: 50, lanes: 3 },
        { id: 'R003', name: 'East Highway', dir: 'EAST', speed: 60, lanes: 3 },
        { id: 'R004', name: 'West Expressway', dir: 'WEST', speed: 60, lanes: 3 },
      ];

      for (const r of roads) {
        await session.run(`
          MATCH (j:Junction {junctionId: 'J001'})
          MERGE (road:Road {roadId: $id})
          ON CREATE SET road.name = $name, road.direction = $dir, road.speedLimit = $speed, road.lanes = $lanes
          MERGE (j)-[:HAS_ROAD]->(road)
        `, r);
      }

      // Create Sensors (Total & Disjoint Specialization: Camera & IRSensor)
      const sensorPairs = [
        { roadId: 'R001', cId: 'C001', cName: 'North Optical AI Camera', irId: 'IR001', irName: 'North Stop-Line IR Beam', pin: 'A0' },
        { roadId: 'R002', cId: 'C002', cName: 'South Optical AI Camera', irId: 'IR002', irName: 'South Stop-Line IR Beam', pin: 'A1' },
        { roadId: 'R003', cId: 'C003', cName: 'East Optical AI Camera', irId: 'IR003', irName: 'East Stop-Line IR Beam', pin: 'A2' },
        { roadId: 'R004', cId: 'C004', cName: 'West Optical AI Camera', irId: 'IR004', irName: 'West Stop-Line IR Beam', pin: 'A3' },
      ];

      for (const s of sensorPairs) {
        await session.run(`
          MATCH (r:Road {roadId: $roadId})
          MERGE (c:Sensor:Camera {sensorId: $cId})
          ON CREATE SET c.name = $cName, c.type = 'CAMERA', c.resolution = '4K UHD (3840x2160)', c.fps = 60, c.model = 'HikVision TrafficCam Pro', c.status = 'ONLINE'
          MERGE (r)-[:HAS_CAMERA]->(c)
          MERGE (ir:Sensor:IRSensor {sensorId: $irId})
          ON CREATE SET ir.name = $irName, ir.type = 'IR', ir.rangeCm = 500, ir.detectionSensitivity = 'HIGH', ir.pin = $pin, ir.status = 'ACTIVE'
          MERGE (r)-[:HAS_IR_SENSOR]->(ir)
        `, s);
      }

      // Create Signals
      const signals = [
        { id: 'SIG001', dir: 'NORTH', state: 'RED', rPin: 2, yPin: 3, gPin: 4 },
        { id: 'SIG002', dir: 'SOUTH', state: 'RED', rPin: 5, yPin: 6, gPin: 7 },
        { id: 'SIG003', dir: 'EAST', state: 'RED', rPin: 8, yPin: 9, gPin: 10 },
        { id: 'SIG004', dir: 'WEST', state: 'GREEN', rPin: 11, yPin: 12, gPin: 13 },
      ];

      for (const sig of signals) {
        await session.run(`
          MATCH (j:Junction {junctionId: 'J001'})
          MERGE (s:Signal {signalId: $id})
          ON CREATE SET s.direction = $dir, s.currentLightState = $state, s.redPin = $rPin, s.yellowPin = $yPin, s.greenPin = $gPin, s.lastChanged = datetime()
          MERGE (j)-[:CONTROLS_SIGNAL]->(s)
        `, sig);
      }
    } catch (e: any) {
      console.warn('[Neo4j Schema Bootstrap Warning]', e.message);
    } finally {
      await session.close();
    }
  }

  /**
   * Initializes in-memory fallback entities according to the EER Model
   */
  private seedMemoryStore() {
    // 1. Junction J001
    const junction: Junction = {
      junctionId: 'J001',
      name: 'Central Plaza 4-Way Intersection',
      location: 'Cyber City Sector 4',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    };
    this.memoryStore.junctions.set(junction.junctionId, junction);

    // 2. Roads R001..R004
    const roads: Road[] = [
      { roadId: 'R001', junctionId: 'J001', name: 'North Boulevard', direction: 'NORTH', speedLimit: 50, lanes: 3 },
      { roadId: 'R002', junctionId: 'J001', name: 'South Avenue', direction: 'SOUTH', speedLimit: 50, lanes: 3 },
      { roadId: 'R003', junctionId: 'J001', name: 'East Highway', direction: 'EAST', speedLimit: 60, lanes: 3 },
      { roadId: 'R004', junctionId: 'J001', name: 'West Expressway', direction: 'WEST', speedLimit: 60, lanes: 3 },
    ];
    roads.forEach((r) => this.memoryStore.roads.set(r.roadId, r));

    // 3. Sensors (Cameras & IR Sensors)
    const cameras: Camera[] = [
      { sensorId: 'C001', roadId: 'R001', name: 'North Optical AI Camera', type: 'CAMERA', status: 'ONLINE', installedDate: '2026-01-15', lastActive: new Date().toISOString(), resolution: '4K UHD (3840x2160)', fps: 60, model: 'HikVision TrafficCam Pro' },
      { sensorId: 'C002', roadId: 'R002', name: 'South Optical AI Camera', type: 'CAMERA', status: 'ONLINE', installedDate: '2026-01-15', lastActive: new Date().toISOString(), resolution: '4K UHD (3840x2160)', fps: 60, model: 'HikVision TrafficCam Pro' },
      { sensorId: 'C003', roadId: 'R003', name: 'East Optical AI Camera', type: 'CAMERA', status: 'ONLINE', installedDate: '2026-01-15', lastActive: new Date().toISOString(), resolution: '4K UHD (3840x2160)', fps: 60, model: 'HikVision TrafficCam Pro' },
      { sensorId: 'C004', roadId: 'R004', name: 'West Optical AI Camera', type: 'CAMERA', status: 'ONLINE', installedDate: '2026-01-15', lastActive: new Date().toISOString(), resolution: '4K UHD (3840x2160)', fps: 60, model: 'HikVision TrafficCam Pro' },
    ];
    cameras.forEach((c) => this.memoryStore.cameras.set(c.sensorId, c));

    const irSensors: IRSensor[] = [
      { sensorId: 'IR001', roadId: 'R001', name: 'North Stop-Line IR Beam', type: 'IR', status: 'ACTIVE', installedDate: '2026-01-15', lastActive: new Date().toISOString(), rangeCm: 500, detectionSensitivity: 'HIGH', pin: 'A0' },
      { sensorId: 'IR002', roadId: 'R002', name: 'South Stop-Line IR Beam', type: 'IR', status: 'ACTIVE', installedDate: '2026-01-15', lastActive: new Date().toISOString(), rangeCm: 500, detectionSensitivity: 'HIGH', pin: 'A1' },
      { sensorId: 'IR003', roadId: 'R003', name: 'East Stop-Line IR Beam', type: 'IR', status: 'ACTIVE', installedDate: '2026-01-15', lastActive: new Date().toISOString(), rangeCm: 500, detectionSensitivity: 'HIGH', pin: 'A2' },
      { sensorId: 'IR004', roadId: 'R004', name: 'West Stop-Line IR Beam', type: 'IR', status: 'ACTIVE', installedDate: '2026-01-15', lastActive: new Date().toISOString(), rangeCm: 500, detectionSensitivity: 'HIGH', pin: 'A3' },
    ];
    irSensors.forEach((ir) => this.memoryStore.irSensors.set(ir.sensorId, ir));

    // 4. Signals
    const signals: Signal[] = [
      { signalId: 'SIG001', junctionId: 'J001', roadId: 'R001', direction: 'NORTH', currentLightState: 'RED', redPin: 2, yellowPin: 3, greenPin: 4, lastChanged: new Date().toISOString() },
      { signalId: 'SIG002', junctionId: 'J001', roadId: 'R002', direction: 'SOUTH', currentLightState: 'RED', redPin: 5, yellowPin: 6, greenPin: 7, lastChanged: new Date().toISOString() },
      { signalId: 'SIG003', junctionId: 'J001', roadId: 'R003', direction: 'EAST', currentLightState: 'RED', redPin: 8, yellowPin: 9, greenPin: 10, lastChanged: new Date().toISOString() },
      { signalId: 'SIG004', junctionId: 'J001', roadId: 'R004', direction: 'WEST', currentLightState: 'GREEN', redPin: 11, yellowPin: 12, greenPin: 13, lastChanged: new Date().toISOString() },
    ];
    signals.forEach((s) => this.memoryStore.signals.set(s.signalId, s));

    // 5. Initial Vehicle Counts & Timings
    const now = new Date();
    const initialCounts: VehicleCount[] = [
      { recordId: 'VC_INIT_001', sensorId: 'C001', roadId: 'R001', count: 18, densityLevel: 'MEDIUM', congestionStatus: 'MODERATE', flowRate: '22 veh/min', timestamp: new Date(now.getTime() - 30000).toISOString() },
      { recordId: 'VC_INIT_002', sensorId: 'C002', roadId: 'R002', count: 9, densityLevel: 'LOW', congestionStatus: 'FREE_FLOW', flowRate: '12 veh/min', timestamp: new Date(now.getTime() - 25000).toISOString() },
      { recordId: 'VC_INIT_003', sensorId: 'C003', roadId: 'R003', count: 14, densityLevel: 'MEDIUM', congestionStatus: 'MODERATE', flowRate: '18 veh/min', timestamp: new Date(now.getTime() - 20000).toISOString() },
      { recordId: 'VC_INIT_004', sensorId: 'C004', roadId: 'R004', count: 34, densityLevel: 'VERY HIGH', congestionStatus: 'HEAVY_QUEUE', flowRate: '45 veh/min', timestamp: new Date(now.getTime() - 10000).toISOString() },
    ];
    this.memoryStore.vehicleCounts.push(...initialCounts);

    const initialTiming: SignalTiming = {
      timingId: 'ST_INIT_001',
      signalId: 'SIG004',
      roadId: 'R004',
      direction: 'WEST',
      greenDuration: 48,
      yellowDuration: 3,
      redDuration: 105,
      calculatedDuration: 48,
      reason: 'Dynamic Green Allocation for Very High Density (34 vehicles)',
      mode: 'AUTOMATIC',
      appliedAt: new Date().toISOString(),
    };
    this.memoryStore.signalTimings.push(initialTiming);

    // Initial database events
    this.memoryStore.recentEvents.push({
      id: 'EVT_001',
      timestamp: new Date().toISOString(),
      title: 'Database Schema Initialized',
      detail: 'Junction J001 with 4 Roads, 4 Cameras, 4 IR Sensors & 4 Signals loaded.',
      cypherSnippet: 'MERGE (j:Junction {junctionId: "J001"})...',
    });
  }

  /**
   * Save Vehicle Count record to Neo4j and memory store
   */
  public async recordVehicleCount(vc: VehicleCount): Promise<void> {
    this.memoryStore.vehicleCounts.push(vc);
    if (this.memoryStore.vehicleCounts.length > 500) {
      this.memoryStore.vehicleCounts.shift();
    }

    this.memoryStore.recentEvents.unshift({
      id: `EVT_${Date.now()}`,
      timestamp: vc.timestamp,
      title: 'Vehicle Count Recorded',
      detail: `Road ${vc.roadId} Camera ${vc.sensorId}: ${vc.count} vehicles (${vc.densityLevel})`,
      cypherSnippet: `MATCH (c:Camera {sensorId: '${vc.sensorId}'}) CREATE (c)-[:RECORDED_COUNT]->(:VehicleCount {count: ${vc.count}, density: '${vc.densityLevel}'})`,
    });
    if (this.memoryStore.recentEvents.length > 50) {
      this.memoryStore.recentEvents.pop();
    }

    // Execute Cypher if live
    await this.executeCypher(`
      MATCH (c:Camera {sensorId: $sensorId})
      CREATE (vc:VehicleCount {
        recordId: $recordId,
        count: $count,
        densityLevel: $densityLevel,
        congestionStatus: $congestionStatus,
        flowRate: $flowRate,
        timestamp: datetime($timestamp)
      })
      CREATE (c)-[:RECORDED_COUNT]->(vc)
    `, vc);
  }

  /**
   * Save Signal Timing record to Neo4j and memory store
   */
  public async recordSignalTiming(st: SignalTiming): Promise<void> {
    this.memoryStore.signalTimings.push(st);
    if (this.memoryStore.signalTimings.length > 500) {
      this.memoryStore.signalTimings.shift();
    }

    this.memoryStore.recentEvents.unshift({
      id: `EVT_${Date.now()}`,
      timestamp: st.appliedAt,
      title: 'Signal Timing Updated',
      detail: `Signal ${st.signalId} (${st.direction}): Green ${st.greenDuration}s [${st.reason}]`,
      cypherSnippet: `MATCH (s:Signal {signalId: '${st.signalId}'}) CREATE (s)-[:HAS_TIMING]->(:SignalTiming {duration: ${st.greenDuration}})`,
    });
    if (this.memoryStore.recentEvents.length > 50) {
      this.memoryStore.recentEvents.pop();
    }

    // Update signal node state and create timing record
    await this.executeCypher(`
      MATCH (s:Signal {signalId: $signalId})
      SET s.currentLightState = 'GREEN', s.lastChanged = datetime($appliedAt)
      CREATE (st:SignalTiming {
        timingId: $timingId,
        greenDuration: $greenDuration,
        yellowDuration: $yellowDuration,
        redDuration: $redDuration,
        calculatedDuration: $calculatedDuration,
        reason: $reason,
        mode: $mode,
        appliedAt: datetime($appliedAt)
      })
      CREATE (s)-[:HAS_TIMING]->(st)
    `, st);
  }

  /**
   * Save Emergency Event record to Neo4j and memory store
   */
  public async recordEmergencyEvent(em: EmergencyEvent): Promise<void> {
    this.memoryStore.emergencyEvents.push(em);
    this.memoryStore.recentEvents.unshift({
      id: `EVT_${Date.now()}`,
      timestamp: em.detectedAt,
      title: `🚨 EMERGENCY: ${em.vehicleType} DETECTED`,
      detail: `Priority corridor active on ${em.direction} Road (${em.roadId}) via Sensor ${em.sensorId}`,
      cypherSnippet: `MATCH (s:Sensor {sensorId: '${em.sensorId}'}), (j:Junction {junctionId: '${em.junctionId}'}), (r:Road {roadId: '${em.roadId}'}) CREATE (s)-[:DETECTED_EMERGENCY]->(e:EmergencyEvent)-[:AFFECTS_JUNCTION]->(j), (e)-[:AFFECTS_ROAD]->(r)`,
    });

    await this.executeCypher(`
      MATCH (s:Sensor {sensorId: $sensorId})
      MATCH (j:Junction {junctionId: $junctionId})
      MATCH (r:Road {roadId: $roadId})
      CREATE (e:EmergencyEvent {
        eventId: $eventId,
        vehicleType: $vehicleType,
        priorityLevel: $priorityLevel,
        detectedAt: datetime($detectedAt),
        status: $status,
        actionTaken: $actionTaken,
        isSimulated: $isSimulated
      })
      CREATE (s)-[:DETECTED_EMERGENCY]->(e)
      CREATE (e)-[:AFFECTS_JUNCTION]->(j)
      CREATE (e)-[:AFFECTS_ROAD]->(r)
    `, em);
  }

  /**
   * Resolve / clear an active emergency event
   */
  public async resolveEmergencyEvent(eventId: string, clearedAt: string): Promise<void> {
    const ev = this.memoryStore.emergencyEvents.find((e) => e.eventId === eventId);
    if (ev) {
      ev.status = 'RESOLVED';
      ev.clearedAt = clearedAt;
    }

    this.memoryStore.recentEvents.unshift({
      id: `EVT_${Date.now()}`,
      timestamp: clearedAt,
      title: 'Emergency Corridor Resolved',
      detail: `Emergency ${eventId} cleared. Resuming normal adaptive traffic cycle.`,
      cypherSnippet: `MATCH (e:EmergencyEvent {eventId: '${eventId}'}) SET e.status = 'RESOLVED', e.clearedAt = datetime('${clearedAt}')`,
    });

    await this.executeCypher(`
      MATCH (e:EmergencyEvent {eventId: $eventId})
      SET e.status = 'RESOLVED', e.clearedAt = datetime($clearedAt)
    `, { eventId, clearedAt });
  }

  /**
   * Close driver connection on server shutdown
   */
  public async close(): Promise<void> {
    if (this.driver) {
      await this.driver.close();
      this.driver = null;
    }
  }
}

export const dbService = new Neo4jService();
