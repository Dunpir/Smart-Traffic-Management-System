import { Request, Response } from 'express';
import { trafficEngine } from '../services/trafficEngine';
import { emergencyManager } from '../services/emergencyManager';
import { Direction, LightState } from '../types';

export const getTrafficStatus = (req: Request, res: Response) => {
  const telemetry = trafficEngine.getLiveTelemetry();
  res.json({ success: true, data: telemetry });
};

export const getThresholds = (req: Request, res: Response) => {
  const thresholds = trafficEngine.getThresholds();
  res.json({ success: true, data: thresholds });
};

export const updateThresholds = (req: Request, res: Response) => {
  const { lowMax, mediumMax, highMax, yellowDuration, allRedDuration, minGreen, maxGreen } = req.body;
  trafficEngine.updateThresholds({
    lowMax: lowMax ? Number(lowMax) : undefined,
    mediumMax: mediumMax ? Number(mediumMax) : undefined,
    highMax: highMax ? Number(highMax) : undefined,
    yellowDuration: yellowDuration ? Number(yellowDuration) : undefined,
    allRedDuration: allRedDuration ? Number(allRedDuration) : undefined,
    minGreen: minGreen ? Number(minGreen) : undefined,
    maxGreen: maxGreen ? Number(maxGreen) : undefined,
  });
  res.json({ success: true, data: trafficEngine.getThresholds() });
};

export const setMode = (req: Request, res: Response) => {
  const { mode } = req.body;
  if (mode !== 'AUTOMATIC' && mode !== 'MANUAL') {
    return res.status(400).json({ success: false, error: 'Mode must be AUTOMATIC or MANUAL' });
  }
  trafficEngine.setMode(mode);
  res.json({ success: true, mode: trafficEngine.getMode() });
};

export const manualSignalCommand = async (req: Request, res: Response) => {
  const { direction, signal, duration } = req.body;

  if (!['NORTH', 'SOUTH', 'EAST', 'WEST'].includes(direction)) {
    return res.status(400).json({ success: false, error: 'Invalid direction (must be NORTH, SOUTH, EAST, WEST)' });
  }

  if (!['RED', 'YELLOW', 'GREEN'].includes(signal)) {
    return res.status(400).json({ success: false, error: 'Invalid signal (must be RED, YELLOW, GREEN)' });
  }

  const result = await trafficEngine.executeManualSignalCommand(
    direction as Direction,
    signal as LightState,
    duration ? Number(duration) : 30
  );

  res.json({ success: true, result });
};

export const startCycle = (req: Request, res: Response) => {
  trafficEngine.setRunning(true);
  res.json({ success: true, isRunning: true });
};

export const stopCycle = (req: Request, res: Response) => {
  trafficEngine.setRunning(false);
  res.json({ success: true, isRunning: false });
};

export const resetJunction = async (req: Request, res: Response) => {
  await trafficEngine.resetJunction();
  res.json({ success: true, message: 'Junction reset to default operational state' });
};

export const resolveEmergency = async (req: Request, res: Response) => {
  await emergencyManager.resolveEmergency();
  res.json({ success: true, message: 'Emergency corridor resolved' });
};

export const requestPedestrianCrossing = (req: Request, res: Response) => {
  const { direction, accessibleMode } = req.body;
  const result = trafficEngine.requestPedestrianCrossing(direction || 'ALL', Boolean(accessibleMode));
  res.json({ success: true, data: result });
};

export const getPedestrianStatus = (req: Request, res: Response) => {
  const state = trafficEngine.getPedestrianState();
  res.json({ success: true, data: state });
};

