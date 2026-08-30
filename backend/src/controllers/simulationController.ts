import { Request, Response } from 'express';
import { simulationEngine } from '../services/simulationEngine';
import { Direction, EmergencyVehicleType } from '../types';

export const getSimulationStatus = (req: Request, res: Response) => {
  res.json({ success: true, data: simulationEngine.getConfig() });
};

export const startSimulation = (req: Request, res: Response) => {
  simulationEngine.start();
  res.json({ success: true, isRunning: true, config: simulationEngine.getConfig() });
};

export const stopSimulation = (req: Request, res: Response) => {
  simulationEngine.stop();
  res.json({ success: true, isRunning: false, config: simulationEngine.getConfig() });
};

export const setScenario = (req: Request, res: Response) => {
  const { scenario } = req.body;
  if (!['NORMAL_FLUCTUATION', 'MORNING_RUSH', 'EVENING_RUSH', 'RAIN_STORM'].includes(scenario)) {
    return res.status(400).json({ success: false, error: 'Invalid scenario type' });
  }
  simulationEngine.setScenario(scenario);
  res.json({ success: true, config: simulationEngine.getConfig() });
};

export const injectSpike = async (req: Request, res: Response) => {
  const { direction, vehicleCount } = req.body;
  const dir: Direction = (direction as Direction) || 'WEST';
  const count = vehicleCount ? Number(vehicleCount) : 38;

  await simulationEngine.generateTrafficSpike(dir, count);
  res.json({ success: true, message: `Traffic spike injected on ${dir} (${count} vehicles)` });
};

export const injectEmergency = async (req: Request, res: Response) => {
  const { direction, vehicleType } = req.body;
  const dir: Direction = (direction as Direction) || 'WEST';
  const type: EmergencyVehicleType = (vehicleType as EmergencyVehicleType) || 'AMBULANCE';

  const emergency = await simulationEngine.generateEmergency(dir, type);
  res.json({ success: true, emergency });
};
