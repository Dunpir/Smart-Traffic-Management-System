import { Request, Response } from 'express';
import { violationService } from '../services/violationService';

export const getViolations = (req: Request, res: Response) => {
  const { roadId, violationType, status, search } = req.query;

  const list = violationService.getAllViolations({
    roadId: roadId as string,
    violationType: violationType as any,
    status: status as any,
    search: search as string,
  });

  res.json({ success: true, data: list });
};

export const getViolationById = (req: Request, res: Response) => {
  const { id } = req.params;
  const item = violationService.getViolationById(id);

  if (!item) {
    return res.status(404).json({ success: false, error: 'Violation record not found' });
  }

  res.json({ success: true, data: item });
};

export const triggerViolation = (req: Request, res: Response) => {
  const { direction, roadId, violationType, speedKmh, plateNumber, vehicleType } = req.body;

  if (!direction) {
    return res.status(400).json({ success: false, error: 'Direction is required' });
  }

  const record = violationService.triggerViolation({
    direction,
    roadId,
    violationType,
    speedKmh,
    plateNumber,
    vehicleType,
  });

  res.status(201).json({
    success: true,
    message: `Violation ${record.violationType} logged and E-Challan #${record.challanNumber} issued.`,
    data: record,
  });
};

export const payViolation = (req: Request, res: Response) => {
  const { id } = req.params;
  const result = violationService.payViolation(id);

  if (!result.success) {
    return res.status(404).json({ success: false, error: 'Violation record not found or already settled' });
  }

  res.json({
    success: true,
    message: `E-Challan payment received. Status updated to PAID.`,
    data: result.violation,
  });
};

export const getViolationStats = (req: Request, res: Response) => {
  const stats = violationService.getStats();
  res.json({ success: true, data: stats });
};
