import { v4 as uuidv4 } from 'uuid';
import { ViolationRecord, ViolationType, ViolationStatus, Direction } from '../types';
import { logger } from './loggerService';

class ViolationService {
  private violations: ViolationRecord[] = [];
  private socketBroadcaster: ((event: string, data: any) => void) | null = null;

  constructor() {
    this.seedInitialViolations();
  }

  public setSocketBroadcaster(broadcaster: (event: string, data: any) => void) {
    this.socketBroadcaster = broadcaster;
  }

  private seedInitialViolations() {
    const sampleViolations: Array<Omit<ViolationRecord, 'id'>> = [
      {
        challanNumber: 'ECH-2026-DL-84920',
        plateNumber: 'DL 01 AB 1234',
        vehicleType: 'CAR',
        violationType: 'RED_LIGHT_JUMP',
        junctionId: 'J001',
        roadId: 'R001',
        direction: 'NORTH',
        speedKmh: 48,
        speedLimitKmh: 40,
        fineAmountInr: 1000,
        motorVehiclesActSection: 'Sec 184 & Sec 177: Red Light Violation & Dangerous Driving',
        status: 'PENDING',
        timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        smsDispatched: true,
        smsRecipient: '+91 98110-XXXXX',
        anprConfidence: 98.6,
        ownerName: 'Vikram Sharma',
      },
      {
        challanNumber: 'ECH-2026-HR-73104',
        plateNumber: 'HR 26 DQ 5521',
        vehicleType: 'CAR',
        violationType: 'SPEED_VIOLATION',
        junctionId: 'J001',
        roadId: 'R004',
        direction: 'WEST',
        speedKmh: 82,
        speedLimitKmh: 60,
        fineAmountInr: 2000,
        motorVehiclesActSection: 'Sec 112 / Sec 183: Overspeeding Beyond Prescribed Limit',
        status: 'PAID',
        timestamp: new Date(Date.now() - 42 * 60 * 1000).toISOString(),
        smsDispatched: true,
        smsRecipient: '+91 99580-XXXXX',
        anprConfidence: 99.1,
        ownerName: 'Amit Verma',
        paymentTimestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      },
      {
        challanNumber: 'ECH-2026-UP-91240',
        plateNumber: 'UP 16 AX 8820',
        vehicleType: 'MOTORCYCLE',
        violationType: 'NO_HELMET_SEATBELT',
        junctionId: 'J001',
        roadId: 'R002',
        direction: 'SOUTH',
        speedKmh: 35,
        speedLimitKmh: 40,
        fineAmountInr: 1000,
        motorVehiclesActSection: 'Sec 194D: Riding Without Protective Headgear (Helmet)',
        status: 'PENDING',
        timestamp: new Date(Date.now() - 75 * 60 * 1000).toISOString(),
        smsDispatched: true,
        smsRecipient: '+91 88001-XXXXX',
        anprConfidence: 96.4,
        ownerName: 'Rahul Choudhary',
      },
      {
        challanNumber: 'ECH-2026-KA-44019',
        plateNumber: 'KA 05 MH 9876',
        vehicleType: 'CAR',
        violationType: 'ZEBRA_CROSSING_BLOCK',
        junctionId: 'J001',
        roadId: 'R003',
        direction: 'EAST',
        speedKmh: 12,
        speedLimitKmh: 50,
        fineAmountInr: 500,
        motorVehiclesActSection: 'Sec 177: Obstruction of Pedestrian Zebra Crosswalk',
        status: 'PENDING',
        timestamp: new Date(Date.now() - 110 * 60 * 1000).toISOString(),
        smsDispatched: true,
        smsRecipient: '+91 97410-XXXXX',
        anprConfidence: 97.8,
        ownerName: 'Pooja Iyer',
      },
    ];

    this.violations = sampleViolations.map((v) => ({
      ...v,
      id: uuidv4(),
    }));
  }

  public getAllViolations(filters?: {
    roadId?: string;
    violationType?: ViolationType;
    status?: ViolationStatus;
    search?: string;
  }): ViolationRecord[] {
    let result = [...this.violations];

    if (filters?.roadId) {
      result = result.filter((v) => v.roadId === filters.roadId);
    }
    if (filters?.violationType) {
      result = result.filter((v) => v.violationType === filters.violationType);
    }
    if (filters?.status) {
      result = result.filter((v) => v.status === filters.status);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (v) =>
          v.plateNumber.toLowerCase().includes(q) ||
          v.challanNumber.toLowerCase().includes(q) ||
          v.ownerName.toLowerCase().includes(q)
      );
    }

    return result.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  public getViolationById(id: string): ViolationRecord | undefined {
    return this.violations.find((v) => v.id === id || v.challanNumber === id);
  }

  public triggerViolation(params: {
    direction: Direction;
    roadId?: string;
    violationType?: ViolationType;
    speedKmh?: number;
    plateNumber?: string;
    vehicleType?: 'CAR' | 'MOTORCYCLE' | 'BUS' | 'TRUCK' | 'AUTO_RICKSHAW';
  }): ViolationRecord {
    const roadMap: Record<Direction, string> = {
      NORTH: 'R001',
      SOUTH: 'R002',
      EAST: 'R003',
      WEST: 'R004',
    };

    const type = params.violationType || 'RED_LIGHT_JUMP';
    const vehicleType = params.vehicleType || 'CAR';
    const plate = params.plateNumber || this.generateRandomPlate();
    const speed = params.speedKmh || (type === 'SPEED_VIOLATION' ? 78 : 42);
    const speedLimit = 40;

    let fine = 1000;
    let section = 'Sec 177: Traffic Signal Non-Compliance';

    if (type === 'RED_LIGHT_JUMP') {
      fine = 1000;
      section = 'Sec 184 & Sec 177: Red Light Jumping & Dangerous Ingress';
    } else if (type === 'SPEED_VIOLATION') {
      fine = 2000;
      section = 'Sec 112 / Sec 183: Exceeding Permissible Speed Limit';
    } else if (type === 'ILLEGAL_TURN') {
      fine = 1500;
      section = 'Sec 177 / Motor Rules 1989: Prohibited Turn / Wrong-Way Driving';
    } else if (type === 'ZEBRA_CROSSING_BLOCK') {
      fine = 500;
      section = 'Sec 177: Stop-Line Encroachment & Pedestrian Interference';
    } else if (type === 'NO_HELMET_SEATBELT') {
      fine = 1000;
      section = 'Sec 194D / 194B: Safety Restraint Non-Compliance';
    }

    const randomSerial = Math.floor(10000 + Math.random() * 90000);
    const statePrefix = plate.substring(0, 2);
    const challanNumber = `ECH-2026-${statePrefix}-${randomSerial}`;

    const newViolation: ViolationRecord = {
      id: uuidv4(),
      challanNumber,
      plateNumber: plate,
      vehicleType,
      violationType: type,
      junctionId: 'J001',
      roadId: params.roadId || roadMap[params.direction],
      direction: params.direction,
      speedKmh: speed,
      speedLimitKmh: speedLimit,
      fineAmountInr: fine,
      motorVehiclesActSection: section,
      status: 'PENDING',
      timestamp: new Date().toISOString(),
      smsDispatched: true,
      smsRecipient: `+91 ${Math.floor(70000 + Math.random() * 29999)}-XXXXX`,
      anprConfidence: parseFloat((96.5 + Math.random() * 3.3).toFixed(1)),
      ownerName: this.getRandomOwnerName(),
    };

    this.violations.unshift(newViolation);

    // Keep memory store bounded to 100 records
    if (this.violations.length > 100) {
      this.violations.pop();
    }

    logger.log({
      eventType: 'CONTROLLER',
      junctionId: 'J001',
      roadId: newViolation.roadId,
      description: `ANPR Captured Violation: ${newViolation.plateNumber} (${newViolation.violationType}) on ${newViolation.direction} road. E-Challan #${newViolation.challanNumber} issued (₹${newViolation.fineAmountInr}).`,
      source: 'TRAFFIC_ENGINE',
      level: 'WARNING',
    });

    if (this.socketBroadcaster) {
      this.socketBroadcaster('violation:new', newViolation);
    }

    return newViolation;
  }

  public payViolation(id: string): { success: boolean; violation?: ViolationRecord } {
    const violation = this.violations.find((v) => v.id === id || v.challanNumber === id);
    if (!violation) return { success: false };

    violation.status = 'PAID';
    violation.paymentTimestamp = new Date().toISOString();

    logger.log({
      eventType: 'CONTROLLER',
      junctionId: violation.junctionId,
      description: `E-Challan #${violation.challanNumber} (${violation.plateNumber}) successfully paid (₹${violation.fineAmountInr}).`,
      source: 'USER_DASHBOARD',
      level: 'SUCCESS',
    });

    if (this.socketBroadcaster) {
      this.socketBroadcaster('violation:paid', violation);
    }

    return { success: true, violation };
  }

  public getStats() {
    const total = this.violations.length;
    const pending = this.violations.filter((v) => v.status === 'PENDING').length;
    const paid = this.violations.filter((v) => v.status === 'PAID').length;
    const totalFines = this.violations.reduce((acc, v) => acc + v.fineAmountInr, 0);
    const collectedFines = this.violations
      .filter((v) => v.status === 'PAID')
      .reduce((acc, v) => acc + v.fineAmountInr, 0);

    const typeBreakdown: Record<string, number> = {};
    this.violations.forEach((v) => {
      typeBreakdown[v.violationType] = (typeBreakdown[v.violationType] || 0) + 1;
    });

    return {
      totalViolations: total,
      pendingViolations: pending,
      paidViolations: paid,
      totalFinesInr: totalFines,
      collectedFinesInr: collectedFines,
      collectionRatePercent: total > 0 ? Math.round((paid / total) * 100) : 0,
      anprAccuracyRate: 98.4,
      typeBreakdown,
    };
  }

  private generateRandomPlate(): string {
    const states = ['DL', 'HR', 'UP', 'KA', 'MH', 'TN', 'WB', 'TS'];
    const state = states[Math.floor(Math.random() * states.length)];
    const rto = String(Math.floor(1 + Math.random() * 12)).padStart(2, '0');
    const letters = ['AB', 'AX', 'BK', 'DQ', 'MH', 'RN', 'ZX', 'CS'][Math.floor(Math.random() * 8)];
    const num = Math.floor(1000 + Math.random() * 9000);
    return `${state} ${rto} ${letters} ${num}`;
  }

  private getRandomOwnerName(): string {
    const names = [
      'Vikram Sharma',
      'Amit Verma',
      'Rahul Choudhary',
      'Pooja Iyer',
      'Suresh Patel',
      'Neha Singhal',
      'Deepak Mehta',
      'Ananya Reddy',
      'Rohit Kapoor',
      'Karan Malviya',
    ];
    return names[Math.floor(Math.random() * names.length)];
  }
}

export const violationService = new ViolationService();
