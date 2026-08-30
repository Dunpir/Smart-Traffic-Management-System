import { Request, Response } from 'express';
import { hardwareService } from '../services/hardwareService';
import { trafficEngine } from '../services/trafficEngine';
import { emergencyManager } from '../services/emergencyManager';
import { Direction, LightState, EmergencyVehicleType } from '../types';

/**
 * POST /api/hardware/sensor-data
 * Standard hardware ingest endpoint for IR Sensors & Cameras
 */
export const ingestSensorData = async (req: Request, res: Response) => {
  const { junctionId, roadId, sensorId, sensorType, vehicleCount, isActive, flowRate, timestamp } = req.body;

  if (!roadId || !sensorId) {
    return res.status(400).json({ success: false, error: 'Missing required roadId or sensorId' });
  }

  if (sensorType === 'IR' || sensorId.startsWith('IR')) {
    trafficEngine.handleIRSensorUpdate({
      roadId,
      sensorId,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
    });
    return res.json({ success: true, message: 'IR sensor reading processed' });
  }

  // Camera vehicle count payload
  if (sensorType === 'CAMERA' || sensorId.startsWith('C') || vehicleCount !== undefined) {
    const count = vehicleCount !== undefined ? Number(vehicleCount) : 0;
    const result = await trafficEngine.handleVehicleCountUpdate({
      junctionId: junctionId || 'J001',
      roadId,
      sensorId,
      count,
      flowRate,
      timestamp,
    });
    return res.json({ success: true, message: 'Camera vehicle count recorded', record: result });
  }

  res.status(400).json({ success: false, error: 'Unrecognized sensorType or payload structure' });
};

/**
 * POST /api/hardware/vehicle-data
 * Dedicated endpoint for camera edge-AI inference payloads
 */
export const ingestVehicleData = async (req: Request, res: Response) => {
  const { junctionId, roadId, sensorId, count, flowRate } = req.body;

  if (!roadId || count === undefined) {
    return res.status(400).json({ success: false, error: 'Missing roadId or count parameter' });
  }

  const result = await trafficEngine.handleVehicleCountUpdate({
    junctionId: junctionId || 'J001',
    roadId,
    sensorId: sensorId || 'C001',
    count: Number(count),
    flowRate,
  });

  res.json({ success: true, record: result });
};

/**
 * POST /api/hardware/emergency
 * Hardware emergency detection (e.g. RFID reader / siren microphone)
 */
export const ingestHardwareEmergency = async (req: Request, res: Response) => {
  const { junctionId, roadId, direction, sensorId, vehicleType, priorityLevel, duration } = req.body;

  if (!direction && !roadId) {
    return res.status(400).json({ success: false, error: 'Must provide direction (NORTH/SOUTH/EAST/WEST) or roadId' });
  }

  let dir: Direction = (direction as Direction) || 'WEST';
  if (!direction && roadId) {
    const dirMap: Record<string, Direction> = { R001: 'NORTH', R002: 'SOUTH', R003: 'EAST', R004: 'WEST' };
    dir = dirMap[roadId] || 'WEST';
  }

  const emergency = await emergencyManager.triggerEmergency({
    junctionId: junctionId || 'J001',
    roadId,
    direction: dir,
    sensorId,
    vehicleType: (vehicleType as EmergencyVehicleType) || 'AMBULANCE',
    priorityLevel: priorityLevel || 'CRITICAL',
    durationSeconds: duration ? Number(duration) : 30,
    isSimulated: false, // Ingested via hardware endpoint
  });

  res.json({ success: true, emergency });
};

/**
 * POST /api/signal/command
 * Send signal state to actuator LEDs
 */
export const dispatchSignalCommand = async (req: Request, res: Response) => {
  const { direction, signal, duration } = req.body;

  if (!['NORTH', 'SOUTH', 'EAST', 'WEST'].includes(direction)) {
    return res.status(400).json({ success: false, error: 'Invalid direction' });
  }

  if (!['RED', 'YELLOW', 'GREEN'].includes(signal)) {
    return res.status(400).json({ success: false, error: 'Invalid signal (RED, YELLOW, GREEN)' });
  }

  const result = await hardwareService.dispatchSignalCommand(
    direction as Direction,
    signal as LightState,
    duration ? Number(duration) : 30
  );

  res.json({ success: true, result });
};

/**
 * GET /api/hardware/status
 */
export const getHardwareStatus = (req: Request, res: Response) => {
  const state = hardwareService.getState();
  const commandHistory = hardwareService.getCommandHistory();
  res.json({ success: true, data: { state, commandHistory } });
};

/**
 * POST /api/hardware/connect
 * Toggles physical Arduino status
 */
export const togglePhysicalHardware = (req: Request, res: Response) => {
  const { connected, port } = req.body;
  hardwareService.setPhysicalHardwareConnected(Boolean(connected), port || '/dev/tty.usbmodem1101');
  res.json({ success: true, data: hardwareService.getState() });
};
