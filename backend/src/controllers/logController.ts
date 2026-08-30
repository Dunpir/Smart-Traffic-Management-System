import { Request, Response } from 'express';
import { logger } from '../services/loggerService';

export const getSystemLogs = (req: Request, res: Response) => {
  const { limit, eventType } = req.query;
  const logs = logger.getLogs(
    limit ? Number(limit) : 100,
    eventType ? String(eventType) : undefined
  );
  res.json({ success: true, count: logs.length, data: logs });
};

export const clearSystemLogs = (req: Request, res: Response) => {
  logger.clear();
  res.json({ success: true, message: 'System logs cleared' });
};
