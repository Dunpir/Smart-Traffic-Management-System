import { Direction, LightState } from '../types';
import { api } from './api';
import { soundEffects } from '../utils/soundEffects';

export interface SerialLogEntry {
  id: string;
  timestamp: string;
  direction: 'TX' | 'RX' | 'SYS';
  text: string;
}

export type SerialTelemetryListener = (data: any) => void;
export type SerialLogListener = (entry: SerialLogEntry) => void;
export type SerialStatusListener = (connected: boolean, portInfo?: string) => void;

class WebSerialService {
  private port: any = null;
  private reader: any = null;
  private writer: any = null;
  private isConnected: boolean = false;
  private portName: string = '';
  private baudRate: number = 115200;
  private keepReading: boolean = false;

  private telemetryListeners: Set<SerialTelemetryListener> = new Set();
  private logListeners: Set<SerialLogListener> = new Set();
  private statusListeners: Set<SerialStatusListener> = new Set();

  private logs: SerialLogEntry[] = [];
  private readonly maxLogs: number = 80;

  private lastSentSignalsJson: string = '';

  constructor() {
    this.addLog('SYS', 'WebSerial Hardware Bridge initialized. Ready to link ESP32.');
  }

  public isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'serial' in navigator;
  }

  public getIsConnected(): boolean {
    return this.isConnected;
  }

  public getPortName(): string {
    return this.portName;
  }

  public getBaudRate(): number {
    return this.baudRate;
  }

  public getLogs(): SerialLogEntry[] {
    return [...this.logs];
  }

  public subscribeTelemetry(listener: SerialTelemetryListener): () => void {
    this.telemetryListeners.add(listener);
    return () => this.telemetryListeners.delete(listener);
  }

  public subscribeLogs(listener: SerialLogListener): () => void {
    this.logListeners.add(listener);
    return () => this.logListeners.delete(listener);
  }

  public subscribeStatus(listener: SerialStatusListener): () => void {
    this.statusListeners.add(listener);
    listener(this.isConnected, this.portName);
    return () => this.statusListeners.delete(listener);
  }

  private addLog(dir: 'TX' | 'RX' | 'SYS', text: string) {
    const entry: SerialLogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toLocaleTimeString(),
      direction: dir,
      text,
    };
    this.logs.unshift(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.pop();
    }
    this.logListeners.forEach((l) => l(entry));
  }

  public clearLogs() {
    this.logs = [];
    this.addLog('SYS', 'Serial monitor log buffer cleared.');
  }

  /**
   * Request user permission & open WebSerial port
   */
  public async connect(baud: number = 115200): Promise<{ success: boolean; message: string }> {
    if (!this.isSupported()) {
      // Browser fallback (simulation mode)
      this.isConnected = true;
      this.portName = 'Simulated Serial Link (WebSerial Unsupported in Browser)';
      this.addLog('SYS', 'WebSerial API unavailable. Activated simulated loopback.');
      this.notifyStatus();
      return { success: true, message: 'Simulated connection active.' };
    }

    try {
      this.baudRate = baud;
      this.addLog('SYS', `Requesting Serial Port access at ${baud} baud (8-N-1)...`);

      // @ts-ignore
      this.port = await navigator.serial.requestPort();
      await this.port.open({ baudRate: this.baudRate });

      const info = this.port.getInfo ? this.port.getInfo() : {};
      const usbVendor = info.usbVendorId ? `VID:0x${info.usbVendorId.toString(16)}` : '';
      const usbProduct = info.usbProductId ? `PID:0x${info.usbProductId.toString(16)}` : '';
      this.portName = `ESP32 Microcontroller (${usbVendor} ${usbProduct})`.trim() || 'USB Serial Device';

      this.isConnected = true;
      this.keepReading = true;

      this.addLog('SYS', `CONNECTED to ${this.portName} at ${this.baudRate} Baud.`);
      this.notifyStatus();
      soundEffects.playSuccess();

      // Inform backend that physical hardware is connected
      api.toggleHardware(true, this.portName).catch(() => {});

      // Launch background reader loop
      this.startReadingLoop();

      // Handshake ping to ESP32
      await this.sendCommand({ cmd: 'PING' });

      return { success: true, message: `Connected to ${this.portName}` };
    } catch (err: any) {
      console.error('Serial connection error:', err);
      const msg = err.message || 'Serial connection cancelled or failed.';
      this.addLog('SYS', `Connection error: ${msg}`);
      this.disconnect();
      return { success: false, message: msg };
    }
  }

  /**
   * Disconnect the active serial port
   */
  public async disconnect() {
    this.keepReading = false;

    try {
      if (this.reader) {
        await this.reader.cancel();
        this.reader = null;
      }
      if (this.writer) {
        await this.writer.close();
        this.writer = null;
      }
      if (this.port) {
        await this.port.close();
        this.port = null;
      }
    } catch (e) {
      console.warn('Error closing port:', e);
    }

    this.isConnected = false;
    this.portName = '';
    this.addLog('SYS', 'Physical hardware disconnected.');
    this.notifyStatus();

    api.toggleHardware(false).catch(() => {});
  }

  private notifyStatus() {
    this.statusListeners.forEach((l) => l(this.isConnected, this.portName));
  }

  /**
   * Continuous read loop for incoming serial newline-delimited JSON
   */
  private async startReadingLoop() {
    if (!this.port || !this.port.readable) return;

    let buffer = '';

    try {
      // @ts-ignore
      const textDecoder = new TextDecoderStream();
      // @ts-ignore
      const readableStreamClosed = this.port.readable.pipeTo(textDecoder.writable);
      this.reader = textDecoder.readable.getReader();

      while (this.keepReading) {
        const { value, done } = await this.reader.read();
        if (done) {
          break;
        }
        if (value) {
          buffer += value;
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // Keep trailing incomplete fragment

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.length > 0) {
              this.handleIncomingLine(trimmed);
            }
          }
        }
      }
    } catch (err: any) {
      if (this.keepReading) {
        console.warn('Serial read loop error:', err);
        this.addLog('SYS', `Read error: ${err.message || err}`);
      }
    } finally {
      if (this.isConnected) {
        this.disconnect();
      }
    }
  }

  /**
   * Parses incoming JSON packets from ESP32
   */
  private handleIncomingLine(line: string) {
    this.addLog('RX', line);

    try {
      const data = JSON.parse(line);
      this.telemetryListeners.forEach((l) => l(data));

      // Handle IR Sensor Detection Event
      if (data.type === 'EVENT' && data.event === 'IR_STATE') {
        const dir = (data.lane || 'NORTH') as Direction;
        const active = Boolean(data.active);
        const roadId = dir === 'NORTH' ? 'R001' : dir === 'EAST' ? 'R003' : dir === 'SOUTH' ? 'R002' : 'R004';

        // Forward to backend API so Neo4j & Traffic Algorithm ingest physical queue
        api.sendHardwareSensorData({
          junctionId: 'J001',
          roadId,
          sensorId: `IR_${dir}`,
          sensorType: 'IR',
          isActive: active,
        }).catch(() => {});

        this.addLog('SYS', `[SENSOR] ${dir} Stop-Line IR: ${active ? 'VEHICLE PRESENT (QUEUE TRIPPED)' : 'CLEAR'}`);
      }

      // Handle RF Receiver Emergency Trigger
      if (data.type === 'EVENT' && (data.event === 'RF_EMERGENCY' || data.event === 'EMERGENCY')) {
        const lane = (data.lane || 'EAST') as Direction;
        soundEffects.playEmergencySiren();

        api.injectEmergency(lane, data.vehicle || 'AMBULANCE').catch(() => {});
        this.addLog('SYS', `🚨 [EMERGENCY] Physical RF Receiver detected siren on ${lane} approach! Pre-emption corridor opened.`);
      }

      // Handle Periodic Sensor Poll telemetry
      if (data.type === 'SENSOR_POLL' && data.sensors) {
        Object.entries(data.sensors).forEach(([lane, sensorData]: [string, any]) => {
          if (sensorData && sensorData.active !== undefined) {
            const dir = lane as Direction;
            const roadId = dir === 'NORTH' ? 'R001' : dir === 'EAST' ? 'R003' : dir === 'SOUTH' ? 'R002' : 'R004';
            api.sendHardwareSensorData({
              junctionId: 'J001',
              roadId,
              sensorId: `IR_${dir}`,
              sensorType: 'IR',
              isActive: Boolean(sensorData.active),
            }).catch(() => {});
          }
        });
      }
    } catch {
      // Non-JSON line (e.g. boot debug print), already logged to monitor
    }
  }

  /**
   * Writes a raw line or JSON packet to the ESP32
   */
  public async writeLine(raw: string): Promise<boolean> {
    const payload = raw.endsWith('\n') ? raw : raw + '\n';
    this.addLog('TX', payload.trim());

    if (!this.isConnected || !this.port || !this.port.writable) {
      return false;
    }

    try {
      const textEncoder = new TextEncoder();
      const writer = this.port.writable.getWriter();
      await writer.write(textEncoder.encode(payload));
      writer.releaseLock();
      return true;
    } catch (e: any) {
      console.error('Serial write error:', e);
      this.addLog('SYS', `Write failed: ${e.message}`);
      return false;
    }
  }

  /**
   * Sends a structured JSON command to ESP32
   */
  public async sendCommand(cmd: Record<string, any>): Promise<boolean> {
    return this.writeLine(JSON.stringify(cmd));
  }

  /**
   * Synchronizes full junction signal state with physical ESP32
   */
  public async syncTrafficState(
    roads: Record<Direction, { currentSignal: LightState }>,
    activeDirection: Direction,
    currentPhase: string,
    activeEmergency: boolean = false,
    pedestrianPhase: string = 'IDLE'
  ) {
    if (!this.isConnected) return;

    const signals: Record<string, LightState> = {
      NORTH: roads.NORTH?.currentSignal || 'RED',
      EAST: roads.EAST?.currentSignal || 'RED',
      SOUTH: roads.SOUTH?.currentSignal || 'RED',
      WEST: roads.WEST?.currentSignal || 'RED',
    };

    const buzzer = activeEmergency || pedestrianPhase === 'WALK' ? 1 : 0;

    const payload = {
      cmd: 'SET_SIGNALS',
      signals,
      activeDir: activeDirection,
      phase: currentPhase,
      buzzer,
    };

    const jsonStr = JSON.stringify(payload);
    // Debounce identical commands to avoid flooding serial port
    if (jsonStr === this.lastSentSignalsJson) return;

    this.lastSentSignalsJson = jsonStr;
    await this.writeLine(jsonStr);
  }

  /**
   * Manually test an LED pin on the ESP32
   */
  public async testSignal(direction: Direction, light: LightState) {
    return this.sendCommand({
      cmd: 'SET_SIGNAL',
      dir: direction,
      sig: light,
    });
  }

  /**
   * Manually test the Active Buzzer (GPIO 15)
   */
  public async testBuzzer(state: boolean) {
    return this.sendCommand({
      cmd: 'BUZZER',
      state: state ? 1 : 0,
    });
  }

  /**
   * Set all 4 directions to RED immediately
   */
  public async testAllRed() {
    return this.sendCommand({
      cmd: 'ALL_RED',
    });
  }
}

export const webSerialService = new WebSerialService();
