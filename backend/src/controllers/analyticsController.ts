import { Request, Response } from 'express';
import { dbService } from '../database/neo4j';
import { Direction } from '../types';

export const getTrafficTimeseries = (req: Request, res: Response) => {
  const { roadId, limit } = req.query;
  const countLimit = limit ? Number(limit) : 30;

  let records = [...dbService.memoryStore.vehicleCounts];
  if (roadId) {
    records = records.filter((r) => r.roadId === roadId);
  }

  // Take latest records
  const recent = records.slice(-countLimit).map((r) => ({
    timestamp: r.timestamp,
    timeLabel: new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    count: r.count,
    roadId: r.roadId,
    density: r.densityLevel,
    congestion: r.congestionStatus,
  }));

  res.json({ success: true, data: recent });
};

export const getRoadComparison = (req: Request, res: Response) => {
  const roads = ['R001', 'R002', 'R003', 'R004'];
  const dirNames: Record<string, string> = {
    R001: 'North Boulevard',
    R002: 'South Avenue',
    R003: 'East Highway',
    R004: 'West Expressway',
  };

  const comparison = roads.map((rId) => {
    const roadCounts = dbService.memoryStore.vehicleCounts.filter((vc) => vc.roadId === rId);
    const avgCount = roadCounts.length
      ? Math.round(roadCounts.reduce((acc, v) => acc + v.count, 0) / roadCounts.length)
      : 15;
    const maxCount = roadCounts.length ? Math.max(...roadCounts.map((v) => v.count)) : 25;
    const latest = roadCounts[roadCounts.length - 1];

    return {
      roadId: rId,
      name: dirNames[rId],
      averageVehicles: avgCount,
      peakVehicles: maxCount,
      currentCount: latest ? latest.count : 15,
      density: latest ? latest.densityLevel : 'MEDIUM',
    };
  });

  res.json({ success: true, data: comparison });
};

export const getSignalTimingHistory = (req: Request, res: Response) => {
  const timings = dbService.memoryStore.signalTimings.slice(-20).map((t) => ({
    timingId: t.timingId,
    signalId: t.signalId,
    direction: t.direction,
    greenDuration: t.greenDuration,
    calculatedDuration: t.calculatedDuration,
    reason: t.reason,
    mode: t.mode,
    appliedAt: t.appliedAt,
    timeFormatted: new Date(t.appliedAt).toLocaleTimeString(),
  }));

  res.json({ success: true, data: timings });
};

export const getEmergencyHistory = (req: Request, res: Response) => {
  const emergencies = dbService.memoryStore.emergencyEvents.slice(-20).map((e) => ({
    eventId: e.eventId,
    vehicleType: e.vehicleType,
    priorityLevel: e.priorityLevel,
    roadId: e.roadId,
    direction: e.direction,
    sensorId: e.sensorId,
    status: e.status,
    actionTaken: e.actionTaken,
    detectedAt: e.detectedAt,
    clearedAt: e.clearedAt,
    isSimulated: e.isSimulated,
  }));

  res.json({ success: true, data: emergencies });
};
