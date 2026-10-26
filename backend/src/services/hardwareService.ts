import { Direction, LightState, HardwareState, HardwarePinState } from '../types';
import { logger } from './loggerService';

class HardwareService {
  private state: HardwareState = {
    connected: false,
    port: undefined,
    lastHeartbeat: new Date().toISOString(),
    isSimulated: true,
    pinStates: {},
    softwareSignalState: {
      NORTH: 'RED',
      SOUTH: 'RED',
      EAST: 'RED',
      WEST: 'GREEN',
    },
    actualHardwareSignalState: {
      NORTH: 'RED',
      SOUTH: 'RED',
      EAST: 'RED',
      WEST: 'GREEN',
    },
    irSensorStates: {
      NORTH: false,
      SOUTH: false,
      EAST: false,
      WEST: true,
    },
  };

  private socketBroadcaster: ((event: string, data: any) => void) | null = null;
  private commandHistory: Array<{
    timestamp: string;
    target: 'PHYSICAL_ARDUINO' | 'SIMULATION_ENGINE';
    direction: Direction;
    signal: LightState;
    duration: number;
    pinsAffected: number[];
    success: boolean;
  }> = [];

  constructor() {
    this.initPinMap();
  }

  public setSocketBroadcaster(broadcaster: (event: string, data: any) => void) {
    this.socketBroadcaster = broadcaster;
  }

  private initPinMap() {
    const pins: Record<string, HardwarePinState> = {
      // NORTH Signal Pins (ESP32: 2, 4, 5)
      GPIO2: { pin: 2, label: 'GPIO 2 - North RED LED', type: 'DIGITAL_OUT', value: 1, assignedTo: 'NORTH_RED' },
      GPIO4: { pin: 4, label: 'GPIO 4 - North YELLOW LED', type: 'DIGITAL_OUT', value: 0, assignedTo: 'NORTH_YELLOW' },
      GPIO5: { pin: 5, label: 'GPIO 5 - North GREEN LED', type: 'DIGITAL_OUT', value: 0, assignedTo: 'NORTH_GREEN' },
      D2: { pin: 2, label: 'D2 - North RED LED', type: 'DIGITAL_OUT', value: 1, assignedTo: 'NORTH_RED' },
      D4: { pin: 4, label: 'D4 - North YELLOW LED', type: 'DIGITAL_OUT', value: 0, assignedTo: 'NORTH_YELLOW' },
      D5: { pin: 5, label: 'D5 - North GREEN LED', type: 'DIGITAL_OUT', value: 0, assignedTo: 'NORTH_GREEN' },

      // EAST Signal Pins (ESP32: 18, 19, 21)
      GPIO18: { pin: 18, label: 'GPIO 18 - East RED LED', type: 'DIGITAL_OUT', value: 1, assignedTo: 'EAST_RED' },
      GPIO19: { pin: 19, label: 'GPIO 19 - East YELLOW LED', type: 'DIGITAL_OUT', value: 0, assignedTo: 'EAST_YELLOW' },
      GPIO21: { pin: 21, label: 'GPIO 21 - East GREEN LED', type: 'DIGITAL_OUT', value: 0, assignedTo: 'EAST_GREEN' },
      D18: { pin: 18, label: 'D18 - East RED LED', type: 'DIGITAL_OUT', value: 1, assignedTo: 'EAST_RED' },
      D19: { pin: 19, label: 'D19 - East YELLOW LED', type: 'DIGITAL_OUT', value: 0, assignedTo: 'EAST_YELLOW' },
      D21: { pin: 21, label: 'D21 - East GREEN LED', type: 'DIGITAL_OUT', value: 0, assignedTo: 'EAST_GREEN' },

      // SOUTH Signal Pins (ESP32: 22, 23, 13)
      GPIO22: { pin: 22, label: 'GPIO 22 - South RED LED', type: 'DIGITAL_OUT', value: 1, assignedTo: 'SOUTH_RED' },
      GPIO23: { pin: 23, label: 'GPIO 23 - South YELLOW LED', type: 'DIGITAL_OUT', value: 0, assignedTo: 'SOUTH_YELLOW' },
      GPIO13: { pin: 13, label: 'GPIO 13 - South GREEN LED', type: 'DIGITAL_OUT', value: 0, assignedTo: 'SOUTH_GREEN' },
      D22: { pin: 22, label: 'D22 - South RED LED', type: 'DIGITAL_OUT', value: 1, assignedTo: 'SOUTH_RED' },
      D23: { pin: 23, label: 'D23 - South YELLOW LED', type: 'DIGITAL_OUT', value: 0, assignedTo: 'SOUTH_YELLOW' },
      D13: { pin: 13, label: 'D13 - South GREEN LED', type: 'DIGITAL_OUT', value: 0, assignedTo: 'SOUTH_GREEN' },

      // WEST Signal Pins (ESP32: 12, 14, 27)
      GPIO12: { pin: 12, label: 'GPIO 12 - West RED LED', type: 'DIGITAL_OUT', value: 0, assignedTo: 'WEST_RED' },
      GPIO14: { pin: 14, label: 'GPIO 14 - West YELLOW LED', type: 'DIGITAL_OUT', value: 0, assignedTo: 'WEST_YELLOW' },
      GPIO27: { pin: 27, label: 'GPIO 27 - West GREEN LED', type: 'DIGITAL_OUT', value: 1, assignedTo: 'WEST_GREEN' },
      D12: { pin: 12, label: 'D12 - West RED LED', type: 'DIGITAL_OUT', value: 0, assignedTo: 'WEST_RED' },
      D14: { pin: 14, label: 'D14 - West YELLOW LED', type: 'DIGITAL_OUT', value: 0, assignedTo: 'WEST_YELLOW' },
      D27: { pin: 27, label: 'D27 - West GREEN LED', type: 'DIGITAL_OUT', value: 1, assignedTo: 'WEST_GREEN' },

      // IR Sensor Inputs (ESP32: 32, 33, 34, 35)
      GPIO32: { pin: 32, label: 'GPIO 32 - North IR Sensor', type: 'DIGITAL_IN', value: false, assignedTo: 'NORTH_IR' },
      GPIO33: { pin: 33, label: 'GPIO 33 - East IR Sensor', type: 'DIGITAL_IN', value: false, assignedTo: 'EAST_IR' },
      GPIO34: { pin: 34, label: 'GPIO 34 - South IR Sensor', type: 'DIGITAL_IN', value: false, assignedTo: 'SOUTH_IR' },
      GPIO35: { pin: 35, label: 'GPIO 35 - West IR Sensor', type: 'DIGITAL_IN', value: true, assignedTo: 'WEST_IR' },
      A0: { pin: 32, label: 'A0/GPIO 32 - North IR Sensor', type: 'DIGITAL_IN', value: false, assignedTo: 'NORTH_IR' },
      A1: { pin: 33, label: 'A1/GPIO 33 - East IR Sensor', type: 'DIGITAL_IN', value: false, assignedTo: 'EAST_IR' },
      A2: { pin: 34, label: 'A2/GPIO 34 - South IR Sensor', type: 'DIGITAL_IN', value: false, assignedTo: 'SOUTH_IR' },
      A3: { pin: 35, label: 'A3/GPIO 35 - West IR Sensor', type: 'DIGITAL_IN', value: true, assignedTo: 'WEST_IR' },

      // Emergency RF Receiver & Siren Buzzer (ESP32: 26, 15)
      GPIO26: { pin: 26, label: 'GPIO 26 - RF Emergency Receiver', type: 'DIGITAL_IN', value: false, assignedTo: 'EMERGENCY_RF' },
      GPIO15: { pin: 15, label: 'GPIO 15 - Siren Buzzer', type: 'DIGITAL_OUT', value: 0, assignedTo: 'BUZZER' },
    };

    this.state.pinStates = pins;
    this.state.buzzerActive = false;
    this.state.rfEmergencyActive = false;
  }

  public getState(): HardwareState {
    return { ...this.state };
  }

  public getCommandHistory() {
    return this.commandHistory.slice(0, 50);
  }

  public setPhysicalHardwareConnected(connected: boolean, portName?: string) {
    this.state.connected = connected;
    this.state.port = portName;
    this.state.lastHeartbeat = new Date().toISOString();

    logger.log({
      eventType: 'HARDWARE',
      junctionId: 'J001',
      description: connected
        ? `Physical ESP32 controller connected on ${portName || 'Serial USB'}.`
        : 'Physical ESP32 controller disconnected. HARDWARE OFFLINE.',
      source: 'ARDUINO',
      level: connected ? 'SUCCESS' : 'WARNING',
    });

    this.broadcastState();
  }

  public updateIRSensor(direction: Direction, active: boolean) {
    this.state.irSensorStates[direction] = active;
    const pinMap: Record<Direction, string[]> = {
      NORTH: ['GPIO32', 'A0'],
      EAST: ['GPIO33', 'A1'],
      SOUTH: ['GPIO34', 'A2'],
      WEST: ['GPIO35', 'A3'],
    };
    pinMap[direction]?.forEach((key) => {
      if (this.state.pinStates[key]) {
        this.state.pinStates[key].value = active;
      }
    });
    this.broadcastState();
  }

  public setBuzzer(active: boolean) {
    this.state.buzzerActive = active;
    if (this.state.pinStates['GPIO15']) {
      this.state.pinStates['GPIO15'].value = active ? 1 : 0;
    }
    this.broadcastState();
  }

  public setRFEmergency(active: boolean) {
    this.state.rfEmergencyActive = active;
    if (this.state.pinStates['GPIO26']) {
      this.state.pinStates['GPIO26'].value = active;
    }
    this.broadcastState();
  }

  /**
   * Dispatches signal command to actuators (LEDs)
   */
  public async dispatchSignalCommand(
    direction: Direction,
    signal: LightState,
    duration: number = 30
  ): Promise<{ success: boolean; target: string; message: string }> {
    const isPhysical = this.state.connected;

    // Update software state
    this.state.softwareSignalState[direction] = signal;

    // Map to ESP32 pins: North(2,4,5), East(18,19,21), South(22,23,13), West(12,14,27)
    const pinMap: Record<Direction, { red: number; yellow: number; green: number }> = {
      NORTH: { red: 2, yellow: 4, green: 5 },
      EAST: { red: 18, yellow: 19, green: 21 },
      SOUTH: { red: 22, yellow: 23, green: 13 },
      WEST: { red: 12, yellow: 14, green: 27 },
    };

    const targetPins = pinMap[direction];

    const setPin = (pinNum: number, val: number) => {
      if (this.state.pinStates[`GPIO${pinNum}`]) this.state.pinStates[`GPIO${pinNum}`].value = val;
      if (this.state.pinStates[`D${pinNum}`]) this.state.pinStates[`D${pinNum}`].value = val;
    };

    // Set pin values
    if (signal === 'GREEN') {
      setPin(targetPins.red, 0);
      setPin(targetPins.yellow, 0);
      setPin(targetPins.green, 1);
    } else if (signal === 'YELLOW') {
      setPin(targetPins.red, 0);
      setPin(targetPins.yellow, 1);
      setPin(targetPins.green, 0);
    } else {
      setPin(targetPins.red, 1);
      setPin(targetPins.yellow, 0);
      setPin(targetPins.green, 0);
    }

    this.state.actualHardwareSignalState[direction] = signal;

    const commandEntry = {
      timestamp: new Date().toISOString(),
      target: isPhysical ? ('PHYSICAL_ARDUINO' as const) : ('SIMULATION_ENGINE' as const),
      direction,
      signal,
      duration,
      pinsAffected: [targetPins.red, targetPins.yellow, targetPins.green],
      success: true,
    };

    this.commandHistory.unshift(commandEntry);

    logger.log({
      eventType: 'HARDWARE',
      junctionId: 'J001',
      description: `Actuator command dispatched: ${direction} -> ${signal} (${duration}s) via [${commandEntry.target}]`,
      source: isPhysical ? 'ARDUINO' : 'SIMULATOR',
      level: 'INFO',
    });

    this.broadcastState();

    return {
      success: true,
      target: isPhysical ? 'PHYSICAL_ARDUINO' : 'SIMULATED_ACTUATOR',
      message: `Signal for ${direction} set to ${signal} for ${duration}s`,
    };
  }

  private broadcastState() {
    if (this.socketBroadcaster) {
      this.socketBroadcaster('hardware:state', this.getState());
    }
  }
}

export const hardwareService = new HardwareService();
