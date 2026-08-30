import { SystemLog } from '../types';
import { v4 as uuidv4 } from 'uuid';

class LoggerService {
  private logs: SystemLog[] = [];
  private readonly maxLogs = 300;
  private socketBroadcaster: ((event: string, data: any) => void) | null = null;

  constructor() {
    this.log({
      eventType: 'CONTROLLER',
      junctionId: 'J001',
      description: 'Intelligent Traffic Controller System initialized.',
      source: 'TRAFFIC_ENGINE',
      level: 'INFO',
    });
  }

  public setSocketBroadcaster(broadcaster: (event: string, data: any) => void) {
    this.socketBroadcaster = broadcaster;
  }

  public log(entry: Omit<SystemLog, 'id' | 'timestamp'>): SystemLog {
    const fullLog: SystemLog = {
      id: `LOG_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      ...entry,
    };

    this.logs.unshift(fullLog);
    if (this.logs.length > this.maxLogs) {
      this.logs.pop();
    }

    if (this.socketBroadcaster) {
      this.socketBroadcaster('system:log', fullLog);
    }

    return fullLog;
  }

  public getLogs(limit: number = 100, eventType?: string): SystemLog[] {
    if (eventType && eventType !== 'ALL') {
      return this.logs.filter((l) => l.eventType === eventType).slice(0, limit);
    }
    return this.logs.slice(0, limit);
  }

  public clear() {
    this.logs = [];
  }
}

export const logger = new LoggerService();
