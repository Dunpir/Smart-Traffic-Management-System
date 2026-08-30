// Comprehensive Cypher queries corresponding to the project's conceptual EER model

export const CYPHER_QUERIES = {
  // 1. Get Junction with all connected Roads
  GET_JUNCTION_TOPOLOGY: `
    MATCH (j:Junction {junctionId: $junctionId})-[:HAS_ROAD]->(r:Road)
    OPTIONAL MATCH (r)-[:HAS_CAMERA]->(c:Camera)
    OPTIONAL MATCH (r)-[:HAS_IR_SENSOR]->(ir:IRSensor)
    OPTIONAL MATCH (j)-[:CONTROLS_SIGNAL]->(sig:Signal)
    WHERE sig.direction = r.direction
    RETURN j, collect(DISTINCT {
      road: r,
      camera: c,
      irSensor: ir,
      signal: sig
    }) AS roads
  `,

  // 2. Total & Disjoint Sensor Specialization Query
  GET_ALL_SENSORS_BY_TYPE: `
    MATCH (s:Sensor)
    OPTIONAL MATCH (r:Road)-[:HAS_CAMERA|HAS_IR_SENSOR]->(s)
    RETURN s.sensorId AS sensorId,
           s.name AS name,
           s.type AS type,
           labels(s) AS labels,
           s.status AS status,
           r.name AS roadName,
           r.direction AS direction
    ORDER BY s.type, s.sensorId
  `,

  // 3. Get Recent Vehicle Count History
  GET_VEHICLE_COUNT_HISTORY: `
    MATCH (c:Camera)-[:RECORDED_COUNT]->(vc:VehicleCount)
    MATCH (r:Road)-[:HAS_CAMERA]->(c)
    RETURN vc.recordId AS recordId,
           r.direction AS direction,
           r.name AS roadName,
           vc.count AS vehicleCount,
           vc.densityLevel AS densityLevel,
           vc.congestionStatus AS congestionStatus,
           toString(vc.timestamp) AS timestamp
    ORDER BY vc.timestamp DESC
    LIMIT $limit
  `,

  // 4. Get Signal Timing History
  GET_SIGNAL_TIMINGS_HISTORY: `
    MATCH (sig:Signal)-[:HAS_TIMING]->(st:SignalTiming)
    RETURN st.timingId AS timingId,
           sig.signalId AS signalId,
           sig.direction AS direction,
           st.greenDuration AS greenDuration,
           st.calculatedDuration AS calculatedDuration,
           st.reason AS reason,
           st.mode AS mode,
           toString(st.appliedAt) AS appliedAt
    ORDER BY st.appliedAt DESC
    LIMIT $limit
  `,

  // 5. Get Emergency Event History with Sensor & Junction links
  GET_EMERGENCY_EVENTS: `
    MATCH (s:Sensor)-[:DETECTED_EMERGENCY]->(e:EmergencyEvent)-[:AFFECTS_JUNCTION]->(j:Junction)
    MATCH (e)-[:AFFECTS_ROAD]->(r:Road)
    RETURN e.eventId AS eventId,
           e.vehicleType AS vehicleType,
           e.priorityLevel AS priorityLevel,
           s.sensorId AS sensorId,
           s.type AS sensorType,
           r.direction AS direction,
           r.name AS roadName,
           j.name AS junctionName,
           e.status AS status,
           e.actionTaken AS actionTaken,
           toString(e.detectedAt) AS detectedAt,
           toString(e.clearedAt) AS clearedAt,
           e.isSimulated AS isSimulated
    ORDER BY e.detectedAt DESC
    LIMIT $limit
  `,

  // 6. Get Database Graph Nodes & Links for Interactive Visualizer
  GET_GRAPH_EXPLORER_DATA: `
    MATCH (n)
    OPTIONAL MATCH (n)-[r]->(m)
    RETURN collect(DISTINCT {
      id: id(n),
      identity: elementId(n),
      labels: labels(n),
      properties: properties(n)
    }) AS nodes,
    collect(DISTINCT {
      id: id(r),
      type: type(r),
      startNode: id(startNode(r)),
      endNode: id(endNode(r)),
      properties: properties(r)
    }) AS relationships
  `,

  // 7. Get Database Statistics Summary
  GET_DATABASE_STATS: `
    MATCH (j:Junction) WITH count(j) AS junctions
    MATCH (r:Road) WITH junctions, count(r) AS roads
    MATCH (s:Sensor) WITH junctions, roads, count(s) AS sensors
    MATCH (c:Camera) WITH junctions, roads, sensors, count(c) AS cameras
    MATCH (ir:IRSensor) WITH junctions, roads, sensors, cameras, count(ir) AS irSensors
    MATCH (sig:Signal) WITH junctions, roads, sensors, cameras, irSensors, count(sig) AS signals
    MATCH (vc:VehicleCount) WITH junctions, roads, sensors, cameras, irSensors, signals, count(vc) AS vehicleCounts
    MATCH (st:SignalTiming) WITH junctions, roads, sensors, cameras, irSensors, signals, vehicleCounts, count(st) AS signalTimings
    MATCH (e:EmergencyEvent) WITH junctions, roads, sensors, cameras, irSensors, signals, vehicleCounts, signalTimings, count(e) AS emergencyEvents
    RETURN {
      junctions: junctions,
      roads: roads,
      sensors: sensors,
      cameras: cameras,
      irSensors: irSensors,
      signals: signals,
      vehicleCounts: vehicleCounts,
      signalTimings: signalTimings,
      emergencyEvents: emergencyEvents
    } AS stats
  `,
};
