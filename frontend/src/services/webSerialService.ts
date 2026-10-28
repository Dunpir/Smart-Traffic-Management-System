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
  private isConnected: boolean = false;
  private portName: string = '';
  private baudRate: number = 115200;
  private keepReading: boolean = false;

  private telemetryListeners: Set<SerialTelemetryListener> = new Set();
  private logListeners: Set<SerialLogListener> = new Set();
  private statusListeners: Set<SerialStatusListener> = new Set();

  private logs: SerialLogEntry[] = [];
  private readonly maxLogs: number = 100;

  // Cached active traffic state for hardware synchronization
  private currentTrafficState = {
    signals: {
      NORTH: 'GREEN' as LightState,
      EAST: 'RED' as LightState,
      SOUTH: 'RED' as LightState,
      WEST: 'RED' as LightState,
    },
    activeDir: 'NORTH' as Direction,
    phase: 'GREEN',
    buzzer: 0,
    activeLow: false,
  };

  private heartbeatTimer: any = null;
  private lastSentSignalsJson: string = '';
  private lastSentTime: number = 0;

  // Serial write lock and queue to eliminate browser stream collisions
  private writeQueue: string[] = [];
  private isWriting: boolean = false;

  // Manual Override Lock: Prevents automatic cycles from overwriting user clicks!
  private isManualLocked: boolean = false;
  private manualLockExpiresAt: number = 0;

  constructor() {
    this.addLog('SYS', 'WebSerial Hardware Bridge initialized. Ready for ESP32 link.');
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

  public getPolarity(): boolean {
    return this.currentTrafficState.activeLow;
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
      this.addLog('SYS', 'WebSerial API unavailable in this browser. Activated simulated loopback.');
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

      // Immediately push current traffic lights to hardware so LEDs light up instantly!
      await this.pushCurrentStateToHardware(true);

      // Start client-side heartbeat loop to keep ESP32 watchdog constantly refreshed
      this.startHeartbeatLoop();

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
    this.stopHeartbeatLoop();

    try {
      if (this.reader) {
        await this.reader.cancel();
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
    this.reader = null;
    this.writeQueue = [];
    this.isWriting = false;
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
    const decoder = new TextDecoder();

    try {
      this.reader = this.port.readable.getReader();

      while (this.keepReading) {
        const { value, done } = await this.reader.read();
        if (done) {
          break;
        }
        if (value) {
          buffer += decoder.decode(value, { stream: true });
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
      if (this.reader) {
        try {
          this.reader.releaseLock();
        } catch (_) {}
        this.reader = null;
      }
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
   * Thread-safe, queued write to avoid stream locking collisions
   */
  public async writeLine(raw: string): Promise<boolean> {
    const payload = raw.endsWith('\n') ? raw : raw + '\n';

    if (!this.isConnected || !this.port || !this.port.writable) {
      return false;
    }

    return new Promise<boolean>((resolve) => {
      this.writeQueue.push(payload);
      this.processWriteQueue().then(resolve);
    });
  }

  private async processWriteQueue(): Promise<boolean> {
    if (this.isWriting) return true;
    this.isWriting = true;

    try {
      while (this.writeQueue.length > 0 && this.isConnected && this.port?.writable) {
        const nextPayload = this.writeQueue.shift();
        if (!nextPayload) continue;

        try {
          const textEncoder = new TextEncoder();
          const writer = this.port.writable.getWriter();
          await writer.write(textEncoder.encode(nextPayload));
          writer.releaseLock();
          this.addLog('TX', nextPayload.trim());
        } catch (err: any) {
          console.warn('Serial write chunk error:', err);
          this.addLog('SYS', `Write warning: ${err.message || err}`);
        }
      }
      return true;
    } finally {
      this.isWriting = false;
    }
  }

  /**
   * Sends a structured JSON command to ESP32
   */
  public async sendCommand(cmd: Record<string, any>): Promise<boolean> {
    return this.writeLine(JSON.stringify(cmd));
  }

  /**
   * Background Heartbeat: Refreshes ESP32 watchdog every 1500ms so it stays firmly in online mode
   */
  private startHeartbeatLoop() {
    this.stopHeartbeatLoop();
    this.heartbeatTimer = setInterval(() => {
      if (!this.isConnected) {
        this.stopHeartbeatLoop();
        return;
      }
      this.pushCurrentStateToHardware(false);
    }, 1500);
  }

  private stopHeartbeatLoop() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * Pushes the active traffic lights down the physical wire
   */
  public async pushCurrentStateToHardware(force: boolean = false): Promise<boolean> {
    if (!this.isConnected) return false;

    const payload = {
      cmd: 'SET_SIGNALS',
      signals: this.currentTrafficState.signals,
      activeDir: this.currentTrafficState.activeDir,
      phase: this.currentTrafficState.phase,
      buzzer: this.currentTrafficState.buzzer,
    };

    const jsonStr = JSON.stringify(payload);
    const now = Date.now();

    // If not forcing and sent within 1.2s with identical payload, skip to avoid overwhelming serial
    if (!force && jsonStr === this.lastSentSignalsJson && now - this.lastSentTime < 1200) {
      return true;
    }

    this.lastSentSignalsJson = jsonStr;
    this.lastSentTime = now;
    return this.writeLine(jsonStr);
  }

  public isManualActive(): boolean {
    return this.isManualLocked && Date.now() < this.manualLockExpiresAt;
  }

  /**
   * Mode toggle: switch ESP32 between AUTO and MANUAL mode (ChatGPT protocol)
   */
  public async setTrafficMode(mode: 'AUTO' | 'MANUAL'): Promise<boolean> {
    if (mode === 'MANUAL') {
      this.isManualLocked = true;
      this.manualLockExpiresAt = Date.now() + 3600000; // 1 hr hold
    } else {
      this.isManualLocked = false;
      this.manualLockExpiresAt = 0;
    }
    this.addLog('SYS', `[MODE] Controller switched to ${mode}`);
    return this.sendCommand({
      cmd: 'SET_MODE',
      mode,
    });
  }

  /**
   * Change signal of a specific lane (ChatGPT protocol)
   * Locks ESP32 to MANUAL mode and enforces strict single-green
   */
  public async changeSignal(lane: Direction, signal: LightState): Promise<boolean> {
    const validLanes: Direction[] = ['NORTH', 'EAST', 'SOUTH', 'WEST'];
    const validSignals: LightState[] = ['RED', 'YELLOW', 'GREEN'];

    if (!validLanes.includes(lane) || !validSignals.includes(signal)) {
      throw new Error('Invalid lane or signal');
    }

    if (signal === 'GREEN') {
      this.isManualLocked = true;
      this.manualLockExpiresAt = Date.now() + 3600000;
      validLanes.forEach((d) => {
        this.currentTrafficState.signals[d] = d === lane ? 'GREEN' : 'RED';
      });
      this.currentTrafficState.activeDir = lane;
      this.currentTrafficState.phase = 'GREEN';
    } else {
      this.currentTrafficState.signals[lane] = signal;
    }

    // Inform ESP32 to enter MANUAL mode and change signal
    await this.setTrafficMode('MANUAL');
    const ok = await this.sendCommand({
      cmd: 'SET_SIGNAL',
      dir: lane,
      sig: signal,
    });
    return ok;
  }

  /**
   * Set all lanes to RED immediately (ChatGPT protocol)
   */
  public async setAllRed(): Promise<boolean> {
    this.isManualLocked = true;
    this.manualLockExpiresAt = Date.now() + 3600000;
    this.currentTrafficState.signals = {
      NORTH: 'RED',
      EAST: 'RED',
      SOUTH: 'RED',
      WEST: 'RED',
    };
    this.currentTrafficState.phase = 'ALL_RED';
    await this.setTrafficMode('MANUAL');
    return this.sendCommand({ cmd: 'ALL_RED' });
  }

  /**
   * Set active buzzer on/off (ChatGPT protocol)
   */
  public async setBuzzer(enabled: boolean): Promise<boolean> {
    this.currentTrafficState.buzzer = enabled ? 1 : 0;
    return this.sendCommand({
      cmd: 'BUZZER',
      state: enabled ? 1 : 0,
    });
  }

  /**
   * Resume automatic cycle
   */
  public async resumeAutomatic(): Promise<void> {
    this.isManualLocked = false;
    this.manualLockExpiresAt = 0;
    this.addLog('SYS', 'Manual override released. Resumed automatic signal synchronization.');
    await this.setTrafficMode('AUTO');
    await this.pushCurrentStateToHardware(true);
  }

  /**
   * Locks physical ESP32 to a single GREEN direction for N seconds,
   * guaranteeing that automatic background cycles WILL NOT override or cause it to blink!
   */
  public async forceDirectionGreen(direction: Direction, durationSeconds: number = 30): Promise<boolean> {
    this.isManualLocked = true;
    this.manualLockExpiresAt = Date.now() + durationSeconds * 1000;

    const signals: Record<string, LightState> = {
      NORTH: direction === 'NORTH' ? 'GREEN' : 'RED',
      EAST: direction === 'EAST' ? 'GREEN' : 'RED',
      SOUTH: direction === 'SOUTH' ? 'GREEN' : 'RED',
      WEST: direction === 'WEST' ? 'GREEN' : 'RED',
    };

    this.currentTrafficState.signals = signals as any;
    this.currentTrafficState.activeDir = direction;
    this.currentTrafficState.phase = 'GREEN';

    this.addLog('SYS', `[MANUAL LOCK ACTIVE] ${direction} locked GREEN for ${durationSeconds}s. Automatic overrides blocked.`);
    await this.setTrafficMode('MANUAL');
    return this.changeSignal(direction, 'GREEN');
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
    // CRITICAL FIX: If user has triggered a manual override (e.g. Force Green),
    // NEVER allow automatic cycle packets to overwrite it and cause physical blinking!
    if (this.isManualLocked) {
      if (Date.now() < this.manualLockExpiresAt) {
        return; // Retain manual green
      }
      this.isManualLocked = false;
      this.addLog('SYS', 'Manual override timer expired. Resuming automatic cycles.');
      this.setTrafficMode('AUTO').catch(() => {});
    }

    const signals: Record<string, LightState> = {
      NORTH: roads.NORTH?.currentSignal || 'RED',
      EAST: roads.EAST?.currentSignal || 'RED',
      SOUTH: roads.SOUTH?.currentSignal || 'RED',
      WEST: roads.WEST?.currentSignal || 'RED',
    };

    // STRICT SINGLE-GREEN SAFETY INTERLOCK:
    // Ensure under no condition can more than one direction have GREEN.
    const allDirs: Direction[] = ['NORTH', 'EAST', 'SOUTH', 'WEST'];
    const greenDirs = allDirs.filter((d) => signals[d] === 'GREEN');
    if (greenDirs.length > 1) {
      allDirs.forEach((d) => {
        signals[d] = d === activeDirection ? 'GREEN' : 'RED';
      });
    }

    const buzzer = activeEmergency || pedestrianPhase === 'WALK' ? 1 : 0;

    // Update cache
    this.currentTrafficState.signals = signals as any;
    this.currentTrafficState.activeDir = activeDirection;
    this.currentTrafficState.phase = currentPhase;
    this.currentTrafficState.buzzer = buzzer;

    if (!this.isConnected) return;

    await this.pushCurrentStateToHardware(false);
  }

  /**
   * Manually test an LED pin on the ESP32 with strict single-green safety interlock
   */
  public async testSignal(direction: Direction, light: LightState) {
    if (light === 'GREEN') {
      return this.forceDirectionGreen(direction, 30);
    }

    if (light === 'RED') {
      this.currentTrafficState.signals[direction] = 'RED';
      return this.pushCurrentStateToHardware(true);
    }

    // Single signal command
    return this.changeSignal(direction, light);
  }

  /**
   * Dynamically toggle hardware output polarity:
   * false = Direct LEDs (HIGH turns LED ON)
   * true  = Active-LOW Relay Modules (LOW turns relay ON)
   */
  public async setPolarity(activeLow: boolean): Promise<boolean> {
    this.currentTrafficState.activeLow = activeLow;
    this.addLog('SYS', `Switching hardware output polarity to: ${activeLow ? 'ACTIVE LOW (Relay)' : 'ACTIVE HIGH (Direct LED)'}`);
    const ok = await this.sendCommand({
      cmd: 'POLARITY',
      activeLow: activeLow ? 1 : 0,
    });
    // Immediately re-push signals with new polarity
    await this.pushCurrentStateToHardware(true);
    return ok;
  }

  /**
   * Manually test the Active Buzzer (GPIO 15)
   */
  public async testBuzzer(state: boolean) {
    return this.setBuzzer(state);
  }

  /**
   * Set all 4 directions to RED immediately with manual lock
   */
  public async testAllRed(durationSeconds: number = 30) {
    this.isManualLocked = true;
    this.manualLockExpiresAt = Date.now() + durationSeconds * 1000;
    this.currentTrafficState.signals = {
      NORTH: 'RED',
      EAST: 'RED',
      SOUTH: 'RED',
      WEST: 'RED',
    };
    this.currentTrafficState.phase = 'ALL_RED';
    this.addLog('SYS', `[ALL RED LOCKED] All 4 directions held RED for ${durationSeconds}s.`);
    return this.setAllRed();
  }
}

export const webSerialService = new WebSerialService();
