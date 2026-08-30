import { Request, Response } from 'express';
import { forecasterService } from '../services/forecasterService';

export const getForecast = (req: Request, res: Response) => {
  const result = forecasterService.getMultiHorizonForecast();
  res.json({ success: true, data: result });
};

export const getRushHourCurves = (req: Request, res: Response) => {
  const curves = forecasterService.getRushHourCurves();
  res.json({ success: true, data: curves });
};

export const getProactivePlan = (req: Request, res: Response) => {
  const plan = forecasterService.getProactivePlan();
  res.json({ success: true, data: plan });
};

export const applyProactivePlan = (req: Request, res: Response) => {
  const result = forecasterService.applyProactiveTuning();
  res.json({
    success: true,
    message: 'Proactive signal timing splits successfully dispatched to Traffic Engine.',
    data: result.plan,
  });
};
