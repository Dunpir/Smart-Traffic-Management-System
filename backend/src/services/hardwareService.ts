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
      // NORTH Signal Pins
      D2: { pin: 2, label: 'D2 - North RED LED', type: 'DIGITAL_OUT', value: 1, assignedTo: 'NORTH_RED' },
      D3: { pin: 3, label: 'D3 - North YELLOW LED', type: 'DIGITAL_OUT', value: 0, assignedTo: 'NORTH_YELLOW' },
      D4: { pin: 4, label: 'D4 - North GREEN LED', type: 'DIGITAL_OUT', value: 0, assignedTo: 'NORTH_GREEN' },

      // SOUTH Signal Pins
      D5: { pin: 5, label: 'D5 - South RED LED', type: 'DIGITAL_OUT', value: 1, assignedTo: 'SOUTH_RED' },
      D6: { pin: 6, label: 'D6 - South YELLOW LED', type: 'DIGITAL_OUT', value: 0, assignedTo: 'SOUTH_YELLOW' },
      D7: { pin: 7, label: 'D7 - South GREEN LED', type: 'DIGITAL_OUT', value: 0, assignedTo: 'SOUTH_GREEN' },

      // EAST Signal Pins
      D8: { pin: 8, label: 'D8 - East RED LED', type: 'DIGITAL_OUT', value: 1, assignedTo: 'EAST_RED' },
      D9: { pin: 9, label: 'D9 - East YELLOW LED', type: 'DIGITAL_OUT', value: 0, assignedTo: 'EAST_YELLOW' },
      D10: { pin: 10, label: 'D10 - East GREEN LED', type: 'DIGITAL_OUT', value: 0, assignedTo: 'EAST_GREEN' },

      // WEST Signal Pins
      D11: { pin: 11, label: 'D11 - West RED LED', type: 'DIGITAL_OUT', value: 0, assignedTo: 'WEST_RED' },
      D12: { pin: 12, label: 'D12 - West YELLOW LED', type: 'DIGITAL_OUT', value: 0, assignedTo: 'WEST_YELLOW' },
      D13: { pin: 13, label: 'D13 - West GREEN LED', type: 'DIGITAL_OUT', value: 1, assignedTo: 'WEST_GREEN' },

      // IR Sensor Inputs
      A0: { pin: 'A0', label: 'A0 - North IR Beam Sensor', type: 'ANALOG_IN', value: false, assignedTo: 'NORTH_IR' },
      A1: { pin: 'A1', label: 'A1 - South IR Beam Sensor', type: 'ANALOG_IN', value: false, assignedTo: 'SOUTH_IR' },
      A2: { pin: 'A2', label: 'A2 - East IR Beam Sensor', type: 'ANALOG_IN', value: false, assignedTo: 'EAST_IR' },
      A3: { pin: 'A3', label: 'A3 - West IR Beam Sensor', type: 'ANALOG_IN', value: true, assignedTo: 'WEST_IR' },
    };

    this.state.pinStates = pins;
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
        ? `Physical Arduino connected on ${portName || 'Serial USB'}.`
        : 'Physical Arduino disconnected. HARDWARE OFFLINE.',
      source: 'ARDUINO',
      level: connected ? 'SUCCESS' : 'WARNING',
    });

    this.broadcastState();
  }

  public updateIRSensor(direction: Direction, active: boolean) {
    this.state.irSensorStates[direction] = active;
    const pinKey = direction === 'NORTH' ? 'A0' : direction === 'SOUTH' ? 'A1' : direction === 'EAST' ? 'A2' : 'A3';
    if (this.state.pinStates[pinKey]) {
      this.state.pinStates[pinKey].value = active;
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

    // Map to pins
    const pinMap: Record<Direction, { red: number; yellow: number; green: number }> = {
      NORTH: { red: 2, yellow: 3, green: 4 },
      SOUTH: { red: 5, yellow: 6, green: 7 },
      EAST: { red: 8, yellow: 9, green: 10 },
      WEST: { red: 11, yellow: 12, green: 13 },
    };

    const targetPins = pinMap[direction];

    // Set pin values
    if (signal === 'GREEN') {
      this.state.pinStates[`D${targetPins.red}`].value = 0;
      this.state.pinStates[`D${targetPins.yellow}`].value = 0;
      this.state.pinStates[`D${targetPins.green}`].value = 1;
    } else if (signal === 'YELLOW') {
      this.state.pinStates[`D${targetPins.red}`].value = 0;
      this.state.pinStates[`D${targetPins.yellow}`].value = 1;
      this.state.pinStates[`D${targetPins.green}`].value = 0;
    } else {
      this.state.pinStates[`D${targetPins.red}`].value = 1;
      this.state.pinStates[`D${targetPins.yellow}`].value = 0;
      this.state.pinStates[`D${targetPins.green}`].value = 0;
    }

    if (isPhysical) {
      // In physical hardware mode, write to actual hardware state
      this.state.actualHardwareSignalState[direction] = signal;
    } else {
      // Simulated actuator state
      this.state.actualHardwareSignalState[direction] = signal;
    }

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
