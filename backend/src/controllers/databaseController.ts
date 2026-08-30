import { Request, Response } from 'express';
import { dbService } from '../database/neo4j';
import { CYPHER_QUERIES } from '../database/queries';

export const getDatabaseStatus = async (req: Request, res: Response) => {
  const status = await dbService.checkConnectivity();
  res.json({ success: true, data: status });
};

export const getDatabaseStats = async (req: Request, res: Response) => {
  const status = dbService.getStatus();

  if (status.connected) {
    try {
      const records = await dbService.executeCypher(CYPHER_QUERIES.GET_DATABASE_STATS);
      if (records && records.length > 0) {
        return res.json({ success: true, source: 'NEO4J', data: records[0].stats });
      }
    } catch (e) {
      // fallback to memoryStore below
    }
  }

  // Memory store fallback stats
  const store = dbService.memoryStore;
  const stats = {
    junctions: store.junctions.size,
    roads: store.roads.size,
    sensors: store.cameras.size + store.irSensors.size,
    cameras: store.cameras.size,
    irSensors: store.irSensors.size,
    signals: store.signals.size,
    vehicleCounts: store.vehicleCounts.length,
    signalTimings: store.signalTimings.length,
    emergencyEvents: store.emergencyEvents.length,
  };

  res.json({ success: true, source: 'IN_MEMORY_STORE', data: stats });
};

export const getGraphData = async (req: Request, res: Response) => {
  const status = dbService.getStatus();

  // If live Neo4j, attempt to query live graph
  if (status.connected) {
    try {
      const result = await dbService.executeCypher(CYPHER_QUERIES.GET_GRAPH_EXPLORER_DATA);
      if (result && result[0]?.nodes?.length) {
        return res.json({
          success: true,
          source: 'NEO4J',
          nodes: result[0].nodes,
          relationships: result[0].relationships,
        });
      }
    } catch (e) {
      // fallback below
    }
  }

  // Build Graph Nodes and Links from Model for Interactive Graph Visualizer
  const store = dbService.memoryStore;
  const nodes: any[] = [];
  const links: any[] = [];

  // Junction node
  store.junctions.forEach((j) => {
    nodes.push({
      id: j.junctionId,
      label: 'Junction',
      name: j.name,
      group: 'junction',
      properties: j,
    });
  });

  // Road nodes
  store.roads.forEach((r) => {
    nodes.push({
      id: r.roadId,
      label: 'Road',
      name: `${r.direction} (${r.name})`,
      group: 'road',
      properties: r,
    });
    links.push({
      source: r.junctionId,
      target: r.roadId,
      type: 'HAS_ROAD',
    });
  });

  // Camera nodes
  store.cameras.forEach((c) => {
    nodes.push({
      id: c.sensorId,
      label: 'Camera',
      name: c.name,
      group: 'camera',
      properties: c,
    });
    links.push({
      source: c.roadId,
      target: c.sensorId,
      type: 'HAS_CAMERA',
    });
  });

  // IRSensor nodes
  store.irSensors.forEach((ir) => {
    nodes.push({
      id: ir.sensorId,
      label: 'IRSensor',
      name: ir.name,
      group: 'irSensor',
      properties: ir,
    });
    links.push({
      source: ir.roadId,
      target: ir.sensorId,
      type: 'HAS_IR_SENSOR',
    });
  });

  // Signal nodes
  store.signals.forEach((s) => {
    nodes.push({
      id: s.signalId,
      label: 'Signal',
      name: `Signal (${s.direction})`,
      group: 'signal',
      properties: s,
    });
    links.push({
      source: s.junctionId,
      target: s.signalId,
      type: 'CONTROLS_SIGNAL',
    });
  });

  // Recent Vehicle Count sample nodes
  store.vehicleCounts.slice(-4).forEach((vc) => {
    nodes.push({
      id: vc.recordId,
      label: 'VehicleCount',
      name: `${vc.count} veh (${vc.densityLevel})`,
      group: 'vehicleCount',
      properties: vc,
    });
    links.push({
      source: vc.sensorId,
      target: vc.recordId,
      type: 'RECORDED_COUNT',
    });
  });

  // Recent Signal Timing nodes
  store.signalTimings.slice(-3).forEach((st) => {
    nodes.push({
      id: st.timingId,
      label: 'SignalTiming',
      name: `Timing: ${st.greenDuration}s`,
      group: 'signalTiming',
      properties: st,
    });
    links.push({
      source: st.signalId,
      target: st.timingId,
      type: 'HAS_TIMING',
    });
  });

  // Emergency Events nodes
  store.emergencyEvents.slice(-2).forEach((em) => {
    nodes.push({
      id: em.eventId,
      label: 'EmergencyEvent',
      name: `🚨 ${em.vehicleType}`,
      group: 'emergency',
      properties: em,
    });
    links.push({
      source: em.sensorId,
      target: em.eventId,
      type: 'DETECTED_EMERGENCY',
    });
    links.push({
      source: em.eventId,
      target: em.junctionId,
      type: 'AFFECTS_JUNCTION',
    });
  });

  res.json({ success: true, source: 'SCHEMA_MODEL', nodes, links });
};

export const executeCustomCypher = async (req: Request, res: Response) => {
  const { query, params } = req.body;

  if (!query || typeof query !== 'string') {
    return res.status(400).json({ success: false, error: 'Query string is required' });
  }

  const status = dbService.getStatus();
  if (status.connected) {
    try {
      const records = await dbService.executeCypher(query, params || {});
      return res.json({ success: true, executedOn: 'LIVE_NEO4J', records });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  res.json({
    success: true,
    executedOn: 'SIMULATED_GRAPH_QUERY_ENGINE',
    message: 'Neo4j server is currently offline. Returning simulated mock Cypher response.',
    records: [
      {
        sampleResult: 'Executed Cypher in Mock Engine',
        query,
        timestamp: new Date().toISOString(),
        note: 'Start local Neo4j to run queries directly against the graph store.',
      },
    ],
  });
};

export const getRecentEvents = (req: Request, res: Response) => {
  res.json({ success: true, data: dbService.memoryStore.recentEvents });
};
