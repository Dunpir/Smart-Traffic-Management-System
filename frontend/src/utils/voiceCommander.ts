/**
 * AI Voice Commander Dispatcher for Trafix STMS
 * Integrates Web Speech API (SpeechRecognition & SpeechSynthesis)
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
      new (): ISpeechRecognition;
    };
    webkitSpeechRecognition?: {
      new (): ISpeechRecognition;
    };
  }
}

export class VoiceCommander {
  private recognition: ISpeechRecognition | null = null;
  private isListening: boolean = false;
  private onTranscriptCallback: ((transcript: string, isFinal: boolean) => void) | null = null;
  private onActionCallback: ((action: VoiceAction, rawText: string) => void) | null = null;

  constructor() {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognitionAPI) {
      this.recognition = new SpeechRecognitionAPI();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';

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
        // Error handling
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
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition || 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
  }

  public start(
    onTranscript: (transcript: string, isFinal: boolean) => void,
    onAction: (action: VoiceAction, rawText: string) => void
  ) {
    if (!this.recognition) return;
    this.stopAudio();
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
        // Ignored
      }
    }
  }

  public parseCommand(rawText: string): VoiceAction {
    const text = rawText.toLowerCase().trim();

    // 1. Simulation Specific Voice Commands
    if (text.includes('start simulation') || text.includes('run simulation') || text.includes('play simulation')) {
      return { type: 'SIMULATION_START' };
    }
    if (text.includes('pause simulation') || text.includes('stop simulation') || text.includes('freeze simulation')) {
      return { type: 'SIMULATION_PAUSE' };
    }
    if (text.includes('reset simulation') || text.includes('clear simulation')) {
      return { type: 'SIMULATION_RESET' };
    }

    // Simulation Scenarios
    if (text.includes('rush hour scenario') || text.includes('rush hour')) {
      return { type: 'SIMULATION_SCENARIO', scenario: 'RUSH_HOUR' };
    }
    if (text.includes('accident scenario') || text.includes('crash scenario')) {
      return { type: 'SIMULATION_SCENARIO', scenario: 'ACCIDENT' };
    }
    if (text.includes('emergency scenario')) {
      return { type: 'SIMULATION_SCENARIO', scenario: 'EMERGENCY' };
    }
    if (text.includes('low traffic scenario') || text.includes('light traffic')) {
      return { type: 'SIMULATION_SCENARIO', scenario: 'LOW_TRAFFIC' };
    }
    if (text.includes('default scenario') || text.includes('normal scenario')) {
      return { type: 'SIMULATION_SCENARIO', scenario: 'DEFAULT' };
    }

    // Simulation Vehicle Spawning
    if (text.includes('spawn') || text.includes('inject car') || text.includes('add car') || text.includes('add bus')) {
      const vType = text.includes('ambulance') ? 'AMBULANCE' : text.includes('bus') ? 'BUS' : 'CAR';
      let road: 'NORTH' | 'SOUTH' | 'EAST' | 'WEST' = 'NORTH';
      if (text.includes('south')) road = 'SOUTH';
      else if (text.includes('east')) road = 'EAST';
      else if (text.includes('west')) road = 'WEST';
      return { type: 'SIMULATION_SPAWN', road, vehicleType: vType };
    }

    // Simulation Speed
    if (text.includes('speed 2x') || text.includes('fast forward')) {
      return { type: 'SIMULATION_SPEED', speed: 2 };
    }
    if (text.includes('speed 1x') || text.includes('normal speed')) {
      return { type: 'SIMULATION_SPEED', speed: 1 };
    }

    // Tab Info / Summary
    if (
      text.includes('tell me about') ||
      text.includes('what is this') ||
      text.includes('tab info') ||
      text.includes('feature info') ||
      text.includes('summarize this tab') ||
      text.includes('explain this tab') ||
      text.includes('about this page')
    ) {
      return { type: 'TAB_INFO' };
    }

    // Command Dictionary / Help
    if (
      text.includes('command') ||
      text.includes('help') ||
      text.includes('cheat sheet') ||
      text.includes('what can you do') ||
      text.includes('show commands') ||
      text.includes('list commands')
    ) {
      return { type: 'OPEN_COMMANDS' };
    }

    // 2. Emergency pre-emption commands (Ambulance, Police, VIP Convoy, Fire Brigade)
    if (
      text.includes('ambulance') ||
      text.includes('ambu') ||
      text.includes('police') ||
      text.includes('cop') ||
      text.includes('patrol') ||
      text.includes('pursuit') ||
      text.includes('vip') ||
      text.includes('convoy') ||
      text.includes('motorcade') ||
      text.includes('minister') ||
      text.includes('emergency') ||
      text.includes('fire') ||
      text.includes('brigade') ||
      text.includes('siren') ||
      text.includes('hospital')
    ) {
      if (text.includes('clear') || text.includes('resolve') || text.includes('stop')) {
        return { type: 'CLEAR_EMERGENCY' };
      }

      let emergencyType: EmergencyType = 'AMBULANCE';
      if (text.includes('police') || text.includes('cop') || text.includes('patrol') || text.includes('pursuit')) {
        emergencyType = 'POLICE';
      } else if (text.includes('vip') || text.includes('convoy') || text.includes('motorcade') || text.includes('minister')) {
        emergencyType = 'VIP';
      } else if (text.includes('fire') || text.includes('brigade')) {
        emergencyType = 'FIRE_TRUCK';
      }

      let road: 'NORTH' | 'SOUTH' | 'EAST' | 'WEST' = 'NORTH';
      if (text.includes('south')) road = 'SOUTH';
      else if (text.includes('east')) road = 'EAST';
      else if (text.includes('west')) road = 'WEST';

      return { type: 'EMERGENCY', road, emergencyType };
    }

    if (text.includes('clear emergency') || text.includes('resolve emergency')) {
      return { type: 'CLEAR_EMERGENCY' };
    }

    // 3. Controller Mode Switch
    if (text.includes('auto') || text.includes('automatic')) {
      return { type: 'SET_MODE', mode: 'AUTOMATIC' };
    }
    if (text.includes('manual') || text.includes('override')) {
      return { type: 'SET_MODE', mode: 'MANUAL' };
    }

    // Creator / About us recognition
    if (
      text.includes('who created') ||
      text.includes('who made') ||
      text.includes('who built') ||
      text.includes('who designed') ||
      text.includes('who developed') ||
      text.includes('creator') ||
      text.includes('developer') ||
      text.includes('author') ||
      text.includes('about us') ||
      text.includes('lakshya') ||
      text.includes('digix')
    ) {
      return { type: 'OPEN_ABOUT_US' };
    }

    // 4. Navigation & Tools
    if (text.includes('report') || text.includes('audit') || text.includes('pdf')) {
      return { type: 'OPEN_REPORT' };
    }
    if (text.includes('matrix') || text.includes('cctv') || text.includes('cameras') || text.includes('wall')) {
      return { type: 'OPEN_MATRIX' };
    }
    if (text.includes('vision') || text.includes('camera feed') || text.includes('anpr')) {
      return { type: 'OPEN_VISION' };
    }
    if (text.includes('3d') || text.includes('three') || text.includes('simulation 3d')) {
      return { type: 'OPEN_3D' };
    }
    if (text.includes('chaos') || text.includes('stress') || text.includes('disruption')) {
      return { type: 'CHAOS_MODE' };
    }
    if (text.includes('status') || text.includes('summary') || text.includes('traffic report')) {
      return { type: 'STATUS_SUMMARY' };
    }

    // Direct tab navigation
    if (text.includes('simulation') || text.includes('sim tab')) return { type: 'NAVIGATE', tab: 'simulation' };
    if (text.includes('analytics')) return { type: 'NAVIGATE', tab: 'analytics' };
    if (text.includes('violations') || text.includes('challan')) return { type: 'NAVIGATE', tab: 'violations' };
    if (text.includes('corridor') || text.includes('green wave')) return { type: 'NAVIGATE', tab: 'corridor' };
    if (text.includes('forecast') || text.includes('prediction')) return { type: 'NAVIGATE', tab: 'forecaster' };
    if (text.includes('settings')) return { type: 'NAVIGATE', tab: 'settings' };
    if (text.includes('dashboard')) return { type: 'NAVIGATE', tab: 'dashboard' };
    if (text.includes('hardware')) return { type: 'NAVIGATE', tab: 'hardware' };
    if (text.includes('city') || text.includes('map')) return { type: 'NAVIGATE', tab: 'citymap' };
    if (text.includes('architecture') || text.includes('dbms')) return { type: 'NAVIGATE', tab: 'architecture' };
    if (text.includes('logs') || text.includes('log')) return { type: 'NAVIGATE', tab: 'logs' };

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

  private currentAudio: HTMLAudioElement | null = null;

  /**
   * Stop any ongoing speech or audio playback
   */
  public stopAudio() {
    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
        this.currentAudio.src = '';
        this.currentAudio = null;
      } catch {}
    }
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
  }

  /**
   * Speak output message exclusively via Microsoft Edge-TTS Indian Hindi Female Neural Voice (hi-IN-SwaraNeural)
   */
  public speak(message: string, preferredVoice: string = 'hi-IN-SwaraNeural') {
    if (!message || !message.trim()) return;

    // Immediately kill any active audio or speech synthesis to prevent overlap
    this.stopAudio();

    const cleanText = message
      .replace(/[*#`_~[\]()]/g, '')
      .replace(/https?:\/\/\S+/g, '')
      .trim();

    if (!cleanText) return;

    try {
      const ttsUrl = `/api/ai/tts?text=${encodeURIComponent(cleanText)}&voice=${encodeURIComponent(
        preferredVoice
      )}`;
      
      const audio = new Audio(ttsUrl);
      this.currentAudio = audio;
      
      audio.onended = () => {
        if (this.currentAudio === audio) {
          this.currentAudio = null;
        }
      };

      audio.play().catch((err) => {
        console.warn('Edge-TTS playback prevented by browser auto-play policy:', err);
      });
    } catch (err) {
      console.error('Edge-TTS error:', err);
    }
  }
}

export const voiceCommander = new VoiceCommander();
