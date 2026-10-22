/**
 * AI Voice Commander Dispatcher for Trafix STMS
 * Exclusively powered by Microsoft Edge-TTS Neural: en-IN-NeerjaExpressiveNeural
 * Studio-grade, natural Indian English expressive voice only.
 */

import { soundEffects } from './soundEffects';
import { API_BASE } from '../services/api';

export type EmergencyType = 'AMBULANCE' | 'POLICE' | 'VIP' | 'FIRE_TRUCK';

export type VoiceAction =
  | { type: 'EMERGENCY'; road: 'NORTH' | 'SOUTH' | 'EAST' | 'WEST'; emergencyType: EmergencyType }
  | { type: 'CLEAR_EMERGENCY' }
  | { type: 'SET_MODE'; mode: 'AUTOMATIC' | 'MANUAL' }
  | { type: 'OPEN_REPORT' }
  | { type: 'OPEN_VISION' }
  | { type: 'OPEN_MATRIX' }
  | { type: 'OPEN_COMMANDS' }
  | { type: 'OPEN_ABOUT_US' }
  | { type: 'OPEN_3D' }
  | { type: 'CHAOS_MODE' }
  | { type: 'STATUS_SUMMARY' }
  | { type: 'TAB_INFO' }
  | { type: 'SIMULATION_START' }
  | { type: 'SIMULATION_PAUSE' }
  | { type: 'SIMULATION_RESET' }
  | { type: 'SIMULATION_SCENARIO'; scenario: 'DEFAULT' | 'RUSH_HOUR' | 'ACCIDENT' | 'EMERGENCY' | 'LOW_TRAFFIC' }
  | { type: 'SIMULATION_SPAWN'; road: 'NORTH' | 'SOUTH' | 'EAST' | 'WEST'; vehicleType: 'CAR' | 'BUS' | 'AMBULANCE' | 'POLICE' | 'VIP' | 'TRUCK' | 'BIKE' }
  | { type: 'SIMULATION_SPEED'; speed: number }
  | { type: 'NAVIGATE'; tab: string }
  | { type: 'UNKNOWN'; query: string };

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
      isFinal: boolean;
    };
    length: number;
  };
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

interface ISpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition?: {
      new(): ISpeechRecognition;
    };
    webkitSpeechRecognition?: {
      new(): ISpeechRecognition;
    };
  }
}

export const TAB_VOICE_MAP: Record<string, string> = {
  dashboard: '/audio/voices/dashboard.mp3',
  simulation: '/audio/voices/simulation.mp3',
  analytics: '/audio/voices/analytics.mp3',
  citymap: '/audio/voices/citymap.mp3',
  corridor: '/audio/voices/corridor.mp3',
  violations: '/audio/voices/violations.mp3',
  forecaster: '/audio/voices/forecaster.mp3',
  controller: '/audio/voices/controller.mp3',
  hardware: '/audio/voices/hardware.mp3',
  database: '/audio/voices/database.mp3',
  architecture: '/audio/voices/architecture.mp3',
  logs: '/audio/voices/logs.mp3',
  settings: '/audio/voices/settings.mp3',
};

export const ASSISTANT_VOICE_MAP: Record<string, string> = {
  welcome: '/audio/assistant/welcome.mp3',
  about_us: '/audio/assistant/about_us.mp3',
  status_summary: '/audio/assistant/status_summary.mp3',
  emergency_ambulance: '/audio/assistant/emergency_ambulance.mp3',
  emergency_cleared: '/audio/assistant/emergency_cleared.mp3',
  sim_started: '/audio/assistant/sim_started.mp3',
  sim_paused: '/audio/assistant/sim_paused.mp3',
  sim_reset: '/audio/assistant/sim_reset.mp3',
  mode_auto: '/audio/assistant/mode_auto.mp3',
  mode_manual: '/audio/assistant/mode_manual.mp3',
  open_report: '/audio/assistant/open_report.mp3',
  open_vision: '/audio/assistant/open_vision.mp3',
  open_matrix: '/audio/assistant/open_matrix.mp3',
  open_commands: '/audio/assistant/open_commands.mp3',
  open_tab_info: '/audio/assistant/open_tab_info.mp3',
  nav_dashboard: '/audio/assistant/nav_dashboard.mp3',
  nav_simulation: '/audio/assistant/nav_simulation.mp3',
  nav_analytics: '/audio/assistant/nav_analytics.mp3',
  nav_citymap: '/audio/assistant/nav_citymap.mp3',
  nav_corridor: '/audio/assistant/nav_corridor.mp3',
  nav_violations: '/audio/assistant/nav_violations.mp3',
  nav_forecaster: '/audio/assistant/nav_forecaster.mp3',
  nav_controller: '/audio/assistant/nav_controller.mp3',
  nav_hardware: '/audio/assistant/nav_hardware.mp3',
  nav_database: '/audio/assistant/nav_database.mp3',
  nav_architecture: '/audio/assistant/nav_architecture.mp3',
  nav_logs: '/audio/assistant/nav_logs.mp3',
  nav_settings: '/audio/assistant/nav_settings.mp3',
};

export class VoiceCommander {
  private recognition: ISpeechRecognition | null = null;
  private isListening: boolean = false;
  private onTranscriptCallback: ((transcript: string, isFinal: boolean) => void) | null = null;
  private onActionCallback: ((action: VoiceAction, rawText: string) => void) | null = null;
  private currentAudio: HTMLAudioElement | null = null;
  private audioCache = new Map<string, string>(); // Blob URL cache for 0ms instant playback
  private rawBufferCache = new Map<string, ArrayBuffer>(); // ArrayBuffer cache for Web Audio API playback
  private decodedAudioBufferCache = new Map<string, AudioBuffer>(); // Decoded PCM buffers for true 0ms spontaneous playback
  private isPreloadingStarted: boolean = false;
  private silenceTimer: any = null;
  private isAudioUnlocked: boolean = false;
  private accumulatedText: string = '';
  private isExecuting: boolean = false;
  private audioSourceNode: AudioBufferSourceNode | null = null;
  private onSpeechStartCallbacks = new Set<() => void>();
  private onSpeechEndCallbacks = new Set<() => void>();

  // Snappy spontaneous silence threshold (480ms general, 280ms for recognized commands)
  private readonly GENERAL_SILENCE_TIMEOUT_MS = 480;
  private readonly COMMAND_SILENCE_TIMEOUT_MS = 280;

  // STRICT VOICE: Only en-IN-NeerjaExpressiveNeural
  public readonly primaryVoice: string = 'en-IN-NeerjaExpressiveNeural';

  constructor() {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognitionAPI) {
      this.recognition = new SpeechRecognitionAPI();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-IN';

      this.recognition.onresult = (event: SpeechRecognitionEvent) => {
        if (this.isExecuting) return;

        let currentFullTranscript = '';
        let hasFinalResult = false;
        for (let i = 0; i < event.results.length; ++i) {
          currentFullTranscript += event.results[i][0].transcript + ' ';
          if (event.results[i].isFinal) {
            hasFinalResult = true;
          }
        }

        const trimmed = currentFullTranscript.trim();
        if (!trimmed) return;

        this.accumulatedText = trimmed;

        // Stream live transcript to UI so user sees words appearing in real-time
        if (this.onTranscriptCallback) {
          this.onTranscriptCallback(trimmed, hasFinalResult);
        }

        // Reset silence timer on any newly spoken token
        if (this.silenceTimer) {
          clearTimeout(this.silenceTimer);
          this.silenceTimer = null;
        }

        // Fast-path: If Web Speech engine declared finality, execute with 0ms delay!
        if (hasFinalResult) {
          this.handleFinalTranscript(trimmed);
          return;
        }

        // Check if interim words already form a known command (e.g., "go to simulation", "emergency ambulance")
        const parsed = this.parseCommand(trimmed);
        const timeoutMs = parsed.type !== 'UNKNOWN'
          ? this.COMMAND_SILENCE_TIMEOUT_MS
          : this.GENERAL_SILENCE_TIMEOUT_MS;

        this.silenceTimer = setTimeout(() => {
          if (this.isListening && !this.isExecuting && this.accumulatedText.trim().length > 0) {
            const textToSubmit = this.accumulatedText.trim();
            this.handleFinalTranscript(textToSubmit);
          }
        }, timeoutMs);
      };

      this.recognition.onerror = () => { };

      this.recognition.onend = () => {
        if (this.isListening && !this.isExecuting) {
          try {
            this.recognition?.start();
          } catch {
            this.isListening = false;
          }
        }
      };
    }

    // Auto-unlock audio on first user gesture & kick off background audio preloading
    if (typeof window !== 'undefined') {
      const unlock = () => {
        this.unlockAudio();
        window.removeEventListener('click', unlock);
        window.removeEventListener('keydown', unlock);
        window.removeEventListener('touchstart', unlock);
        window.removeEventListener('pointerdown', unlock);
      };
      window.addEventListener('click', unlock, { once: true, passive: true });
      window.addEventListener('keydown', unlock, { once: true, passive: true });
      window.addEventListener('touchstart', unlock, { once: true, passive: true });
      window.addEventListener('pointerdown', unlock, { once: true, passive: true });

      // Start preloading audio into RAM immediately
      setTimeout(() => this.startBackgroundPreload(), 80);
    }
  }

  public onSpeechStart(cb: () => void): () => void {
    this.onSpeechStartCallbacks.add(cb);
    return () => this.onSpeechStartCallbacks.delete(cb);
  }

  public onSpeechEnd(cb: () => void): () => void {
    this.onSpeechEndCallbacks.add(cb);
    return () => this.onSpeechEndCallbacks.delete(cb);
  }

  private notifySpeechStarted() {
    this.onSpeechStartCallbacks.forEach((cb) => {
      try { cb(); } catch {}
    });
  }

  private notifySpeechEnded() {
    this.onSpeechEndCallbacks.forEach((cb) => {
      try { cb(); } catch {}
    });
  }

  public unlockAudio() {
    soundEffects.resumeContext();
    if (this.isAudioUnlocked) return;
    try {
      if (!this.currentAudio) {
        this.currentAudio = new Audio();
      }
      // Prime HTML5 Audio element with silent 1-sample WAV to satisfy Safari autoplay restriction
      this.currentAudio.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
      this.currentAudio.play().then(() => {
        this.isAudioUnlocked = true;
      }).catch(() => {});
    } catch { }
  }

  public isSupported(): boolean {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  public start(
    onTranscript: (transcript: string, isFinal: boolean) => void,
    onAction: (action: VoiceAction, rawText: string) => void
  ) {
    this.unlockAudio();
    if (!this.recognition) return;
    this.onTranscriptCallback = onTranscript;
    this.onActionCallback = onAction;
    this.isListening = true;
    this.isExecuting = false;
    this.accumulatedText = '';
    try {
      this.recognition.start();
      soundEffects.playVoiceAck();
    } catch { }
  }

  public stop(executePending: boolean = false) {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }

    // If user clicked send/stop manually and had spoken text, execute exactly once
    if (executePending && !this.isExecuting && this.accumulatedText.trim().length > 0) {
      const textToSubmit = this.accumulatedText.trim();
      this.handleFinalTranscript(textToSubmit);
      return;
    }

    this.isListening = false;
    this.accumulatedText = '';

    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch { }
    }
  }

  public parseCommand(rawText: string): VoiceAction {
    const text = rawText.toLowerCase().trim();

    // Emergency Commands
    if (text.includes('ambulance') || text.includes('hospital') || text.includes('patient') || text.includes('medevac')) {
      const road = this.extractRoad(text) || 'WEST';
      return { type: 'EMERGENCY', road, emergencyType: 'AMBULANCE' };
    }

    if (text.includes('police') || text.includes('cop') || text.includes('patrol') || text.includes('siren')) {
      const road = this.extractRoad(text) || 'NORTH';
      return { type: 'EMERGENCY', road, emergencyType: 'POLICE' };
    }

    if (text.includes('fire') || text.includes('brigade') || text.includes('tender') || (text.includes('truck') && text.includes('emergency'))) {
      const road = this.extractRoad(text) || 'EAST';
      return { type: 'EMERGENCY', road, emergencyType: 'FIRE_TRUCK' };
    }

    if (text.includes('vip') || text.includes('convoy') || text.includes('minister') || text.includes('escort') || text.includes('dignitary') || text.includes('motorcade')) {
      const road = this.extractRoad(text) || 'SOUTH';
      return { type: 'EMERGENCY', road, emergencyType: 'VIP' };
    }

    if (text.includes('emergency') || text.includes('urgent') || text.includes('preempt') || text.includes('pre-empt') || text.includes('corridor')) {
      const road = this.extractRoad(text) || 'WEST';
      return { type: 'EMERGENCY', road, emergencyType: 'AMBULANCE' };
    }

    // Clear Emergency / Resume Normal
    if (text.includes('clear') || text.includes('resume') || text.includes('normal') || text.includes('restore') || text.includes('reset emergency')) {
      return { type: 'CLEAR_EMERGENCY' };
    }

    // Mode Switching
    if (text.includes('auto') || text.includes('automatic') || text.includes('adaptive')) {
      return { type: 'SET_MODE', mode: 'AUTOMATIC' };
    }
    if (text.includes('manual') || text.includes('override') || text.includes('force')) {
      return { type: 'SET_MODE', mode: 'MANUAL' };
    }

    // Modal Triggers
    if (text.includes('report') || text.includes('pdf') || text.includes('audit') || text.includes('download')) {
      return { type: 'OPEN_REPORT' };
    }
    if (text.includes('vision') || text.includes('camera') || text.includes('ai stream') || text.includes('bounding') || text.includes('radar')) {
      return { type: 'OPEN_VISION' };
    }
    if (text.includes('matrix') || text.includes('cctv') || text.includes('wall') || text.includes('four screen') || text.includes('multiview')) {
      return { type: 'OPEN_MATRIX' };
    }
    if (text.includes('dictionary') || text.includes('commands') || text.includes('cheat sheet') || text.includes('what can i say')) {
      return { type: 'OPEN_COMMANDS' };
    }
    if (text.includes('about') || text.includes('author') || text.includes('developer') || text.includes('creator') || text.includes('team') || text.includes('who made')) {
      return { type: 'OPEN_ABOUT_US' };
    }
    if (text.includes('3d') || text.includes('three') || text.includes('studio') || text.includes('perspective') || text.includes('intersection view')) {
      return { type: 'OPEN_3D' };
    }
    if (text.includes('chaos') || text.includes('stress') || text.includes('gridlock') || text.includes('roadblock')) {
      return { type: 'CHAOS_MODE' };
    }
    if (text.includes('status') || text.includes('summary') || text.includes('how is traffic') || text.includes('report status') || text.includes('overview')) {
      return { type: 'STATUS_SUMMARY' };
    }
    if (text.includes('tell me about this tab') || text.includes('what is this page') || text.includes('explain this tab') || text.includes('tab info')) {
      return { type: 'TAB_INFO' };
    }

    // Simulation Controls
    if (text.includes('start simulation') || text.includes('run simulation') || text.includes('start traffic') || text.includes('begin sim')) {
      return { type: 'SIMULATION_START' };
    }
    if (text.includes('pause simulation') || text.includes('stop simulation') || text.includes('freeze traffic') || text.includes('halt sim')) {
      return { type: 'SIMULATION_PAUSE' };
    }
    if (text.includes('reset simulation') || text.includes('clear vehicles') || text.includes('restart sim')) {
      return { type: 'SIMULATION_RESET' };
    }

    // Simulation Scenario Triggers
    if (text.includes('rush hour') || text.includes('heavy traffic') || text.includes('peak traffic')) {
      return { type: 'SIMULATION_SCENARIO', scenario: 'RUSH_HOUR' };
    }
    if (text.includes('accident') || text.includes('collision') || text.includes('crash scenario')) {
      return { type: 'SIMULATION_SCENARIO', scenario: 'ACCIDENT' };
    }
    if (text.includes('emergency scenario') || text.includes('multiple ambulance')) {
      return { type: 'SIMULATION_SCENARIO', scenario: 'EMERGENCY' };
    }
    if (text.includes('low traffic') || text.includes('night traffic') || text.includes('empty roads')) {
      return { type: 'SIMULATION_SCENARIO', scenario: 'LOW_TRAFFIC' };
    }
    if (text.includes('default scenario') || text.includes('normal flow')) {
      return { type: 'SIMULATION_SCENARIO', scenario: 'DEFAULT' };
    }

    // Spawn Specific Vehicles
    if (text.includes('spawn') || text.includes('add vehicle') || text.includes('inject car') || text.includes('generate')) {
      const road = this.extractRoad(text) || 'NORTH';
      let vehicleType: 'CAR' | 'BUS' | 'AMBULANCE' | 'POLICE' | 'VIP' | 'TRUCK' | 'BIKE' = 'CAR';
      if (text.includes('bus')) vehicleType = 'BUS';
      else if (text.includes('truck')) vehicleType = 'TRUCK';
      else if (text.includes('bike') || text.includes('motorcycle')) vehicleType = 'BIKE';
      else if (text.includes('ambulance')) vehicleType = 'AMBULANCE';
      else if (text.includes('police')) vehicleType = 'POLICE';
      else if (text.includes('vip')) vehicleType = 'VIP';

      return { type: 'SIMULATION_SPAWN', road, vehicleType };
    }

    // Simulation Speed Multiplier
    if (text.includes('speed') || text.includes('fast') || text.includes('slow')) {
      if (text.includes('5x') || text.includes('five times') || text.includes('super fast') || text.includes('maximum speed')) {
        return { type: 'SIMULATION_SPEED', speed: 5 };
      }
      if (text.includes('2x') || text.includes('two times') || text.includes('double speed') || text.includes('faster')) {
        return { type: 'SIMULATION_SPEED', speed: 2 };
      }
      if (text.includes('1x') || text.includes('normal speed') || text.includes('real time')) {
        return { type: 'SIMULATION_SPEED', speed: 1 };
      }
    }

    // Tab Navigation
    return this.parseNavigation(text, rawText);
  }

  private extractRoad(text: string): 'NORTH' | 'SOUTH' | 'EAST' | 'WEST' | null {
    // Check directional origin phrases: "from X", "X to Y", "X toward Y", "X west", etc.
    if (text.includes('from east') || text.includes('east to') || text.includes('east toward') || text.includes('east-to') || text.includes('east west') || text.includes('east-west')) return 'EAST';
    if (text.includes('from west') || text.includes('west to') || text.includes('west toward') || text.includes('west-to') || text.includes('west east') || text.includes('west-east')) return 'WEST';
    if (text.includes('from south') || text.includes('south to') || text.includes('south toward') || text.includes('south-to') || text.includes('south north') || text.includes('south-north')) return 'SOUTH';
    if (text.includes('from north') || text.includes('north to') || text.includes('north toward') || text.includes('north-to') || text.includes('north south') || text.includes('north-south')) return 'NORTH';

    // Check specific road mentions
    if (text.includes('east road') || text.includes('east approach') || text.includes('eastbound') || text.includes('east')) return 'EAST';
    if (text.includes('west road') || text.includes('west approach') || text.includes('westbound') || text.includes('west')) return 'WEST';
    if (text.includes('south road') || text.includes('south approach') || text.includes('southbound') || text.includes('south')) return 'SOUTH';
    if (text.includes('north road') || text.includes('north approach') || text.includes('northbound') || text.includes('north')) return 'NORTH';

    return null;
  }

  private parseNavigation(text: string, rawText: string): VoiceAction {
    if (text.includes('dashboard') || text.includes('overview') || text.includes('home') || text.includes('main')) return { type: 'NAVIGATE', tab: 'dashboard' };
    if (text.includes('simulation') || text.includes('simulator') || text.includes('sandbox')) return { type: 'NAVIGATE', tab: 'simulation' };
    if (text.includes('analytics') || text.includes('charts') || text.includes('graphs') || text.includes('performance')) return { type: 'NAVIGATE', tab: 'analytics' };
    if (text.includes('violation') || text.includes('anpr') || text.includes('challan') || text.includes('fine') || text.includes('plate')) return { type: 'NAVIGATE', tab: 'violations' };
    if (text.includes('forecast') || text.includes('prediction') || text.includes('arima') || text.includes('rush hour')) return { type: 'NAVIGATE', tab: 'forecaster' };
    if (text.includes('city map') || text.includes('grid map') || text.includes('map') || text.includes('intersections')) return { type: 'NAVIGATE', tab: 'citymap' };
    if (text.includes('corridor') || text.includes('green wave') || text.includes('wave') || text.includes('arterial')) return { type: 'NAVIGATE', tab: 'corridor' };
    if (text.includes('controller') || text.includes('signal controller') || text.includes('signals') || text.includes('timing')) return { type: 'NAVIGATE', tab: 'controller' };
    if (text.includes('hardware') || text.includes('arduino') || text.includes('gpio') || text.includes('iot')) return { type: 'NAVIGATE', tab: 'hardware' };
    if (text.includes('database') || text.includes('neo4j') || text.includes('cypher') || text.includes('graph')) return { type: 'NAVIGATE', tab: 'database' };
    if (text.includes('settings') || text.includes('config') || text.includes('theme') || text.includes('preferences')) return { type: 'NAVIGATE', tab: 'settings' };
    if (text.includes('architecture') || text.includes('dbms') || text.includes('bcnf') || text.includes('eer') || text.includes('theory')) return { type: 'NAVIGATE', tab: 'architecture' };
    if (text.includes('logs') || text.includes('log') || text.includes('audit')) return { type: 'NAVIGATE', tab: 'logs' };

    return { type: 'UNKNOWN', query: rawText };
  }

  private handleFinalTranscript(text: string) {
    if (!text || !text.trim() || this.isExecuting) return;

    this.isExecuting = true;
    this.isListening = false;
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
    this.accumulatedText = '';

    try {
      if (this.recognition) {
        this.recognition.stop();
      }
    } catch { }

    const trimmed = text.trim();
    if (this.onTranscriptCallback) {
      this.onTranscriptCallback(trimmed, true);
    }
    const action = this.parseCommand(trimmed);
    if (this.onActionCallback) {
      this.onActionCallback(action, trimmed);
    }

    // Reset execution lock after cooldown
    setTimeout(() => {
      this.isExecuting = false;
    }, 600);
  }

  /**
   * Cleans text for fluent speech delivery
   */
  private cleanSpokenText(text: string): string {
    if (!text) return '';
    return text
      .replace(/[*_~`#>]+/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/https?:\/\/\S+/g, '')
      .replace(/[\u{1F600}-\u{1F6FF}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
      .replace(/\bkm\/h\b/gi, 'kilometres per hour')
      .replace(/\bsec\b/gi, 'seconds')
      .replace(/\bveh\b/gi, 'vehicles')
      .replace(/\bBCNF\b/g, 'B C N F')
      .replace(/\bSTMS\b/g, 'S T M S')
      .replace(/\bANPR\b/g, 'A N P R')
      .replace(/\bRLVD\b/g, 'Red Light Violation Detection')
      .replace(/\bAQI\b/g, 'A Q I')
      .replace(/\bCO2\b/g, 'carbon dioxide')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Stop any active speech playback (MP3 audio, Web Audio nodes, and browser speech synthesis)
   */
  public stopSpeech() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
    }
    if (this.audioSourceNode) {
      try {
        this.audioSourceNode.stop();
        this.audioSourceNode.disconnect();
      } catch {}
      this.audioSourceNode = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.notifySpeechEnded();
  }

  /**
   * Plays raw audio buffer via pure Web Audio API (decodeAudioData)
   * Guaranteed to play Neerja Expressive audio in Safari without HTML5 audio autoplay blocking
   */
  public async playArrayBuffer(arrayBuffer: ArrayBuffer): Promise<boolean> {
    try {
      const ctx = soundEffects.getContext();
      if (!ctx) return false;
      if (ctx.state === 'suspended') {
        await ctx.resume().catch(() => {});
      }

      // Decode a clone of the buffer to preserve cache
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer.slice(0));
      this.stopSpeech();

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      this.audioSourceNode = source;

      this.notifySpeechStarted();

      source.onended = () => {
        if (this.audioSourceNode === source) {
          this.audioSourceNode = null;
          this.notifySpeechEnded();
        }
      };

      source.start(0);
      return true;
    } catch (e) {
      console.warn('Web Audio buffer playback fallback error:', e);
      return false;
    }
  }

  /**
   * Browser SpeechSynthesis fallback strictly for 100% offline situations
   */
  public speakBrowserFallback(text: string) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.98;
      utterance.pitch = 1.05;

      const voices = window.speechSynthesis.getVoices();
      const bestVoice =
        voices.find((v) => v.lang.includes('en-IN') && v.name.toLowerCase().includes('female')) ||
        voices.find((v) => v.lang.includes('en-IN')) ||
        voices.find((v) => v.lang.includes('en-GB') && v.name.toLowerCase().includes('female')) ||
        voices.find((v) => v.lang.includes('en-GB')) ||
        voices.find((v) => v.name.toLowerCase().includes('samantha')) ||
        voices.find((v) => v.lang.startsWith('en'));

      if (bestVoice) {
        utterance.voice = bestVoice;
      }

      utterance.onstart = () => this.notifySpeechStarted();
      utterance.onend = () => this.notifySpeechEnded();
      utterance.onerror = () => this.notifySpeechEnded();

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis playback error:', e);
      this.notifySpeechEnded();
    }
  }

  /**
   * Pre-decodes an audio asset directly into an in-memory Web Audio AudioBuffer for instantaneous 0ms playback
   */
  public async preloadAudioUrl(url: string): Promise<AudioBuffer | null> {
    if (this.decodedAudioBufferCache.has(url)) {
      return this.decodedAudioBufferCache.get(url)!;
    }
    const ctx = soundEffects.getContext();
    try {
      const res = await fetch(url);
      if (!res.ok) return null;
      const arrayBuf = await res.arrayBuffer();
      if (ctx) {
        const audioBuf = await ctx.decodeAudioData(arrayBuf.slice(0));
        this.decodedAudioBufferCache.set(url, audioBuf);
        this.rawBufferCache.set(url, arrayBuf);
        return audioBuf;
      }
    } catch {
      // Background preload error suppression
    }
    return null;
  }

  /**
   * Pre-loads the active tab audio briefing into memory so user clicks start with 0ms latency
   */
  public prewarmTab(tab: string) {
    const url = TAB_VOICE_MAP[tab];
    if (url) {
      this.preloadAudioUrl(url).catch(() => {});
    }
  }

  /**
   * Background preloads core voice clips into memory so voice assistant replies are 100% spontaneous
   */
  public async startBackgroundPreload() {
    if (this.isPreloadingStarted) return;
    this.isPreloadingStarted = true;

    // Tier 1: Immediate priority (dashboard & assistant welcome)
    await Promise.allSettled([
      this.preloadAudioUrl(TAB_VOICE_MAP.dashboard),
      this.preloadAudioUrl(ASSISTANT_VOICE_MAP.welcome),
      this.preloadAudioUrl(TAB_VOICE_MAP.simulation),
    ]);

    // Tier 2: Remaining tab briefings
    const remainingTabs = Object.values(TAB_VOICE_MAP).filter(
      (u) => u !== TAB_VOICE_MAP.dashboard && u !== TAB_VOICE_MAP.simulation
    );
    for (const u of remainingTabs) {
      await this.preloadAudioUrl(u);
    }

    // Tier 3: Assistant core phrases
    const assistantUrls = Object.values(ASSISTANT_VOICE_MAP).filter(
      (u) => u !== ASSISTANT_VOICE_MAP.welcome
    );
    for (const u of assistantUrls) {
      await this.preloadAudioUrl(u);
    }
  }

  /**
   * Plays a static audio asset with true 0ms spontaneous playback using pre-decoded Web Audio buffers
   */
  public async playAudioUrl(url: string): Promise<boolean> {
    this.stopSpeech();
    this.unlockAudio();

    const ctx = soundEffects.getContext();

    // 1. TRUE 0ms SPONTANEOUS PATH: Pre-decoded AudioBuffer in Web Audio API RAM
    if (ctx && this.decodedAudioBufferCache.has(url)) {
      try {
        const audioBuffer = this.decodedAudioBufferCache.get(url)!;
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);
        this.audioSourceNode = source;

        this.notifySpeechStarted();

        source.onended = () => {
          if (this.audioSourceNode === source) {
            this.audioSourceNode = null;
            this.notifySpeechEnded();
          }
        };

        source.start(0);
        return true;
      } catch (err) {
        console.warn('Web Audio direct buffer playback error:', err);
      }
    }

    // 2. FAST SECOND PATH: Decode and play via Web Audio API immediately (bypasses HTMLAudioElement delays)
    try {
      const res = await fetch(url);
      if (!res.ok) return false;
      const buf = await res.arrayBuffer();

      if (ctx) {
        try {
          const audioBuf = await ctx.decodeAudioData(buf.slice(0));
          this.decodedAudioBufferCache.set(url, audioBuf);

          const source = ctx.createBufferSource();
          source.buffer = audioBuf;
          source.connect(ctx.destination);
          this.audioSourceNode = source;

          this.notifySpeechStarted();

          source.onended = () => {
            if (this.audioSourceNode === source) {
              this.audioSourceNode = null;
              this.notifySpeechEnded();
            }
          };

          source.start(0);
          return true;
        } catch { }
      }

      // 3. Fallback: HTML5 Audio
      if (!this.currentAudio) {
        this.currentAudio = new Audio();
      }

      const blob = new Blob([buf], { type: 'audio/mpeg' });
      const blobUrl = URL.createObjectURL(blob);
      this.currentAudio.src = blobUrl;
      this.currentAudio.onplay = () => this.notifySpeechStarted();
      this.currentAudio.onended = () => this.notifySpeechEnded();
      this.currentAudio.onerror = () => {
        this.playArrayBuffer(buf);
      };

      try {
        await this.currentAudio.play();
        return true;
      } catch {
        return await this.playArrayBuffer(buf);
      }
    } catch (err) {
      console.warn('Error loading audio url:', url, err);
      return false;
    }
  }

  /**
   * Directly speaks a specific Tab Briefing using authentic NeerjaExpressive MP3 asset
   */
  public async speakTab(tab: string, fallbackText?: string): Promise<void> {
    const url = TAB_VOICE_MAP[tab];
    if (url) {
      const ok = await this.playAudioUrl(url);
      if (ok) return;
    }
    if (fallbackText) {
      await this.speak(fallbackText);
    }
  }

  /**
   * Pre-warm / pre-cache speech briefings in the background for instant 0ms playback
   */
  public async prewarm(texts: string[]) {
    for (const text of texts) {
      const cleaned = this.cleanSpokenText(text);
      if (!cleaned) continue;

      // Check if text corresponds to a tab briefing
      const normalized = cleaned.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
      for (const [tab, url] of Object.entries(TAB_VOICE_MAP)) {
        if (normalized.includes(tab) && normalized.length > 50) {
          this.preloadAudioUrl(url).catch(() => {});
          return;
        }
      }

      const cacheKey = `en-IN-NeerjaExpressiveNeural:${cleaned}`;
      if (this.audioCache.has(cacheKey) || this.rawBufferCache.has(cacheKey)) continue;

      try {
        const ttsUrl = `${API_BASE}/ai/tts?text=${encodeURIComponent(cleaned)}&voice=en-IN-NeerjaExpressiveNeural`;
        const res = await fetch(ttsUrl);
        if (res.ok) {
          const buf = await res.arrayBuffer();
          this.rawBufferCache.set(cacheKey, buf);
          const ctx = soundEffects.getContext();
          if (ctx) {
            ctx.decodeAudioData(buf.slice(0)).then((ab) => {
              this.decodedAudioBufferCache.set(cacheKey, ab);
            }).catch(() => {});
          }
          const blob = new Blob([buf], { type: 'audio/mpeg' });
          this.audioCache.set(cacheKey, URL.createObjectURL(blob));
        }
      } catch {
        // Background pre-fetch silent skip
      }
    }
  }

  /**
   * Speaks message using Microsoft Edge-TTS Neerja Expressive Neural voice
   * Uses pre-generated authentic assets first, then backend Edge-TTS with Web Audio API fallback
   */
  public async speak(message: string) {
    const cleaned = this.cleanSpokenText(message);
    if (!cleaned) return;

    this.stopSpeech();
    this.unlockAudio();

    const normalized = cleaned.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();

    // 1. Check tab briefing match
    for (const [tab, url] of Object.entries(TAB_VOICE_MAP)) {
      if (normalized.includes(`welcome to the ${tab}`) || normalized.includes(tab)) {
        if (normalized.length > 50) {
          const ok = await this.playAudioUrl(url as string);
          if (ok) return;
        }
      }
    }

    // 2. Check navigation match
    if (normalized.includes('navigating to')) {
      for (const tab of Object.keys(TAB_VOICE_MAP)) {
        if (normalized.includes(tab)) {
          const url = ASSISTANT_VOICE_MAP[`nav_${tab}`];
          if (url) {
            const ok = await this.playAudioUrl(url);
            if (ok) return;
          }
        }
      }
    }

    // 3. Check assistant core action match
    if (normalized.includes('lakshya pundir') || normalized.includes('developed by') || normalized.includes('lead system architect')) {
      const ok = await this.playAudioUrl(ASSISTANT_VOICE_MAP.about_us);
      if (ok) return;
    }
    if (normalized.includes('operating nominally') || normalized.includes('adaptive graph scheduling') || normalized.includes('all four approaches')) {
      const ok = await this.playAudioUrl(ASSISTANT_VOICE_MAP.status_summary);
      if (ok) return;
    }
    if (normalized.includes('ambulance') && (normalized.includes('priority') || normalized.includes('preemption') || normalized.includes('pre-emption'))) {
      const ok = await this.playAudioUrl(ASSISTANT_VOICE_MAP.emergency_ambulance);
      if (ok) return;
    }
    if (normalized.includes('emergency pre emption cleared') || normalized.includes('emergency preemption cleared') || normalized.includes('resuming adaptive')) {
      const ok = await this.playAudioUrl(ASSISTANT_VOICE_MAP.emergency_cleared);
      if (ok) return;
    }
    if (normalized.includes('simulation started')) {
      const ok = await this.playAudioUrl(ASSISTANT_VOICE_MAP.sim_started);
      if (ok) return;
    }
    if (normalized.includes('simulation paused')) {
      const ok = await this.playAudioUrl(ASSISTANT_VOICE_MAP.sim_paused);
      if (ok) return;
    }
    if (normalized.includes('simulation reset')) {
      const ok = await this.playAudioUrl(ASSISTANT_VOICE_MAP.sim_reset);
      if (ok) return;
    }
    if (normalized.includes('automatic mode')) {
      const ok = await this.playAudioUrl(ASSISTANT_VOICE_MAP.mode_auto);
      if (ok) return;
    }
    if (normalized.includes('manual mode')) {
      const ok = await this.playAudioUrl(ASSISTANT_VOICE_MAP.mode_manual);
      if (ok) return;
    }
    if (normalized.includes('audit report')) {
      const ok = await this.playAudioUrl(ASSISTANT_VOICE_MAP.open_report);
      if (ok) return;
    }
    if (normalized.includes('optical') && (normalized.includes('camera') || normalized.includes('feed'))) {
      const ok = await this.playAudioUrl(ASSISTANT_VOICE_MAP.open_vision);
      if (ok) return;
    }
    if (normalized.includes('cctv matrix') || normalized.includes('screen cctv')) {
      const ok = await this.playAudioUrl(ASSISTANT_VOICE_MAP.open_matrix);
      if (ok) return;
    }
    if (normalized.includes('command reference') || normalized.includes('command dictionary')) {
      const ok = await this.playAudioUrl(ASSISTANT_VOICE_MAP.open_commands);
      if (ok) return;
    }
    if (normalized.includes('module reference') || normalized.includes('viva talking points')) {
      const ok = await this.playAudioUrl(ASSISTANT_VOICE_MAP.open_tab_info);
      if (ok) return;
    }

    const cacheKey = `en-IN-NeerjaExpressiveNeural:${cleaned}`;

    // 4. Check in-memory audio cache for 0ms instant playback
    if (this.audioCache.has(cacheKey) || this.rawBufferCache.has(cacheKey)) {
      const cachedUrl = this.audioCache.get(cacheKey);
      const rawBuf = this.rawBufferCache.get(cacheKey);

      if (cachedUrl) {
        if (!this.currentAudio) {
          this.currentAudio = new Audio();
        }
        this.currentAudio.src = cachedUrl;
        this.currentAudio.onplay = () => this.notifySpeechStarted();
        this.currentAudio.onended = () => this.notifySpeechEnded();
        this.currentAudio.onerror = () => {
          if (rawBuf) {
            this.playArrayBuffer(rawBuf);
          } else {
            this.speakBrowserFallback(cleaned);
          }
        };

        try {
          await this.currentAudio.play();
          return;
        } catch {
          // If HTML5 Audio was blocked by Safari autoplay policy, fallback to Web Audio API buffer
          if (rawBuf) {
            const played = await this.playArrayBuffer(rawBuf);
            if (played) return;
          }
        }
      } else if (rawBuf) {
        const played = await this.playArrayBuffer(rawBuf);
        if (played) return;
      }
    }

    // 5. Fetch neural MP3 audio from backend Edge-TTS
    try {
      const ttsUrl = `${API_BASE}/ai/tts?text=${encodeURIComponent(cleaned)}&voice=en-IN-NeerjaExpressiveNeural`;
      const response = await fetch(ttsUrl);
      if (response.ok) {
        const buf = await response.arrayBuffer();
        this.rawBufferCache.set(cacheKey, buf);

        const blob = new Blob([buf], { type: 'audio/mpeg' });
        const blobUrl = URL.createObjectURL(blob);
        this.audioCache.set(cacheKey, blobUrl);

        if (!this.currentAudio) {
          this.currentAudio = new Audio();
        }
        this.currentAudio.src = blobUrl;
        this.currentAudio.onplay = () => this.notifySpeechStarted();
        this.currentAudio.onended = () => this.notifySpeechEnded();
        this.currentAudio.onerror = () => {
          this.playArrayBuffer(buf).then((ok) => {
            if (!ok) this.speakBrowserFallback(cleaned);
          });
        };

        try {
          await this.currentAudio.play();
        } catch {
          // Safari autoplay rejected HTMLAudioElement.play() -> immediately play via Web Audio API buffer!
          const played = await this.playArrayBuffer(buf);
          if (!played) {
            this.speakBrowserFallback(cleaned);
          }
        }
      } else {
        console.warn('Backend TTS returned non-200, playing via browser speech engine');
        this.speakBrowserFallback(cleaned);
      }
    } catch (err) {
      console.warn('Backend TTS fetch failed, playing via browser speech engine:', err);
      this.speakBrowserFallback(cleaned);
    }
  }
}

export const voiceCommander = new VoiceCommander();
