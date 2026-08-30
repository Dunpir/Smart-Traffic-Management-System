/**
 * AI Voice Commander Dispatcher for Trafix STMS
 * Integrates Microsoft Edge-TTS Neural (en-IN-NeerjaExpressiveNeural)
 * Provides studio-quality, authentic Indian English human voice across the entire website
 */

import { soundEffects } from './soundEffects';

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

export class VoiceCommander {
  private recognition: ISpeechRecognition | null = null;
  private isListening: boolean = false;
  private onTranscriptCallback: ((transcript: string, isFinal: boolean) => void) | null = null;
  private onActionCallback: ((action: VoiceAction, rawText: string) => void) | null = null;
  private currentAudio: HTMLAudioElement | null = null;
  public readonly primaryVoice: string = 'en-IN-NeerjaExpressiveNeural';

  constructor() {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognitionAPI) {
      this.recognition = new SpeechRecognitionAPI();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-IN'; // Default to Indian English recognition

      this.recognition.onresult = (event: SpeechRecognitionEvent) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            this.handleFinalTranscript(transcript.trim());
          }
        }
        if (this.onTranscriptCallback) {
          this.onTranscriptCallback(transcript, false);
        }
      };

      this.recognition.onerror = () => {
        // Handle gracefully
      };

      this.recognition.onend = () => {
        if (this.isListening) {
          try {
            this.recognition?.start();
          } catch {
            this.isListening = false;
          }
        }
      };
    }
  }

  public isSupported(): boolean {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  public start(
    onTranscript: (transcript: string, isFinal: boolean) => void,
    onAction: (action: VoiceAction, rawText: string) => void
  ) {
    if (!this.recognition) return;
    this.onTranscriptCallback = onTranscript;
    this.onActionCallback = onAction;
    this.isListening = true;
    try {
      this.recognition.start();
      soundEffects.playVoiceAck();
    } catch {
      // Already running
    }
  }

  public stop() {
    this.isListening = false;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {
        // Already stopped
      }
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

    if (text.includes('fire') || text.includes('brigade') || text.includes('tender') || text.includes('truck')) {
      const road = this.extractRoad(text) || 'EAST';
      return { type: 'EMERGENCY', road, emergencyType: 'FIRE_TRUCK' };
    }

    if (text.includes('vip') || text.includes('convoy') || text.includes('minister') || text.includes('escort') || text.includes('dignitary')) {
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
    if (text.includes('north')) return 'NORTH';
    if (text.includes('south')) return 'SOUTH';
    if (text.includes('east')) return 'EAST';
    if (text.includes('west')) return 'WEST';
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
    if (!text) return;
    if (this.onTranscriptCallback) {
      this.onTranscriptCallback(text, true);
    }
    const action = this.parseCommand(text);
    if (this.onActionCallback) {
      this.onActionCallback(action, text);
    }
  }

  /**
   * Cleans text for fluent speech delivery
   */
  private cleanSpokenText(text: string): string {
    if (!text) return '';
    return text
      // Strip markdown bold/italics/headers/bullets/links/tables
      .replace(/[*_~`#>]+/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/https?:\/\/\S+/g, '')
      // Remove emojis and decorative unicode symbols
      .replace(/[\u{1F600}-\u{1F6FF}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
      // Expand common abbreviations into natural articulate speech
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
   * Stop any active speech playback
   */
  public stopSpeech() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  /**
   * Speaks message using Edge-TTS en-IN-NeerjaExpressiveNeural
   */
  public async speak(message: string, voice: string = this.primaryVoice) {
    const cleaned = this.cleanSpokenText(message);
    if (!cleaned) return;

    this.stopSpeech();

    try {
      // 1. Primary: Microsoft Edge-TTS Neural Audio via backend API
      const ttsUrl = `/api/ai/tts?text=${encodeURIComponent(cleaned)}&voice=${encodeURIComponent(voice)}`;
      const audio = new Audio(ttsUrl);
      this.currentAudio = audio;

      audio.onerror = () => {
        this.fallbackBrowserSpeech(cleaned);
      };

      await audio.play();
    } catch {
      // 2. Fallback to browser SpeechSynthesis if offline
      this.fallbackBrowserSpeech(cleaned);
    }
  }

  private fallbackBrowserSpeech(cleaned: string) {
    if (!('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(cleaned);
      utterance.rate = 0.98;
      utterance.pitch = 1.0;

      const voices = window.speechSynthesis.getVoices();
      const indianVoice = voices.find(
        (v) =>
          v.name.toLowerCase().includes('neerja') ||
          v.name.toLowerCase().includes('veena') ||
          v.name.toLowerCase().includes('swara') ||
          v.lang.toLowerCase().includes('en-in')
      );
      if (indianVoice) utterance.voice = indianVoice;

      window.speechSynthesis.speak(utterance);
    } catch {
      // Ignore
    }
  }
}

export const voiceCommander = new VoiceCommander();
