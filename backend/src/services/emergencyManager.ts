import {
  Direction,
  EmergencyEvent,
  EmergencyVehicleType,
  EmergencyPriority,
  EmergencyStatus,
} from '../types';
import { dbService } from '../database/neo4j';
import { logger } from './loggerService';
import { hardwareService } from './hardwareService';

class EmergencyManager {
  private activeEmergency: EmergencyEvent | null = null;
  private emergencyTimer: NodeJS.Timeout | null = null;
  private socketBroadcaster: ((event: string, data: any) => void) | null = null;
  private onEmergencyResolvedCallback: (() => void) | null = null;

  public setSocketBroadcaster(broadcaster: (event: string, data: any) => void) {
    this.socketBroadcaster = broadcaster;
  }

  public setOnEmergencyResolved(callback: () => void) {
    this.onEmergencyResolvedCallback = callback;
  }

  public getActiveEmergency(): EmergencyEvent | null {
    return this.activeEmergency;
  }

  /**
   * Trigger an Emergency Event on a specified road
   */
  public async triggerEmergency(params: {
    junctionId?: string;
    roadId?: string;
    direction: Direction;
    sensorId?: string;
    vehicleType?: EmergencyVehicleType;
    priorityLevel?: EmergencyPriority;
    durationSeconds?: number;
    isSimulated?: boolean;
  }): Promise<EmergencyEvent> {
    const roadMap: Record<Direction, { roadId: string; sensorId: string }> = {
      NORTH: { roadId: 'R001', sensorId: 'C001' },
      SOUTH: { roadId: 'R002', sensorId: 'C002' },
      EAST: { roadId: 'R003', sensorId: 'C003' },
      WEST: { roadId: 'R004', sensorId: 'C004' },
    };

    const junctionId = params.junctionId || 'J001';
    const roadId = params.roadId || roadMap[params.direction].roadId;
    const sensorId = params.sensorId || roadMap[params.direction].sensorId;
    const vehicleType = params.vehicleType || 'AMBULANCE';
    const priorityLevel = params.priorityLevel || 'CRITICAL';
    const duration = params.durationSeconds || 30;
    const isSimulated = params.isSimulated !== undefined ? params.isSimulated : true;

    // Create Emergency Event object
    const emergency: EmergencyEvent = {
      eventId: `EMG_${Date.now()}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      sensorId,
      junctionId,
      roadId,
      direction: params.direction,
      vehicleType,
      priorityLevel,
      detectedAt: new Date().toISOString(),
      status: 'ACTIVE_CORRIDOR',
      actionTaken: `Pre-empted normal cycle; green corridor granted to ${params.direction} Road for ${duration}s`,
      isSimulated,
    };

    this.activeEmergency = emergency;

    // Record in Neo4j database
    await dbService.recordEmergencyEvent(emergency);

    // Hardware command dispatch: Emergency direction GREEN, all others RED
    const directions: Direction[] = ['NORTH', 'SOUTH', 'EAST', 'WEST'];
    for (const dir of directions) {
      if (dir === params.direction) {
        await hardwareService.dispatchSignalCommand(dir, 'GREEN', duration);
      } else {
        await hardwareService.dispatchSignalCommand(dir, 'RED', duration);
      }
    }

    logger.log({
      eventType: 'EMERGENCY',
      junctionId,
      roadId,
      description: `🚨 EMERGENCY PRIORITY: ${vehicleType} detected on ${params.direction} Road (${roadId}). Signal overridden to GREEN for ${duration}s.`,
      source: isSimulated ? 'SIMULATOR' : 'ARDUINO',
      level: 'CRITICAL',
    });

    this.broadcastEmergency();

    // Auto-resolve timer
    if (this.emergencyTimer) clearTimeout(this.emergencyTimer);
    this.emergencyTimer = setTimeout(async () => {
      await this.resolveEmergency();
    }, duration * 1000);

    return emergency;
  }

  /**
   * Resolve and clear the current emergency
   */
  public async resolveEmergency(): Promise<void> {
    if (!this.activeEmergency) return;

    const clearedAt = new Date().toISOString();
    const eventId = this.activeEmergency.eventId;
    const roadId = this.activeEmergency.roadId;
    const direction = this.activeEmergency.direction;

    await dbService.resolveEmergencyEvent(eventId, clearedAt);

    logger.log({
      eventType: 'EMERGENCY',
      junctionId: 'J001',
      roadId,
      description: `Emergency priority cleared for ${direction} Road. Resuming regular rule-based traffic cycle.`,
      source: 'TRAFFIC_ENGINE',
      level: 'SUCCESS',
    });

    this.activeEmergency = null;
    if (this.emergencyTimer) {
      clearTimeout(this.emergencyTimer);
      this.emergencyTimer = null;
    }

    this.broadcastEmergency();

    // Notify Traffic Engine to safely resume cycle
    if (this.onEmergencyResolvedCallback) {
      this.onEmergencyResolvedCallback();
    }
  }

  private broadcastEmergency() {
    if (this.socketBroadcaster) {
      this.socketBroadcaster('emergency:active', this.activeEmergency);
    }
  }
}

export const emergencyManager = new EmergencyManager();
