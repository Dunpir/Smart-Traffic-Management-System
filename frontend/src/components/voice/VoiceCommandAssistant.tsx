import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  Sparkles,
  X,
  Terminal,
  Radio,
  BookOpen,
  Send,
  Key,
  Bot,
  User,
  Check,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { voiceCommander, VoiceAction } from '../../utils/voiceCommander';
import { soundEffects } from '../../utils/soundEffects';
import { CommandDictionaryModal } from './CommandDictionaryModal';
import { aiAssistantService, ChatMessage } from '../../utils/aiAssistantService';

interface VoiceCommandAssistantProps {
  onExecuteAction: (action: VoiceAction) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export const VoiceCommandAssistant: React.FC<VoiceCommandAssistantProps> = ({
  onExecuteAction,
  isOpen,
  onToggle,
}) => {
  const [isListening, setIsListening] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');
  const [inputText, setInputText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastExecuted, setLastExecuted] = useState<string>('');
  const [isSupported, setIsSupported] = useState<boolean>(true);
  const [isDictionaryOpen, setIsDictionaryOpen] = useState<boolean>(false);
  const [isKeyModalOpen, setIsKeyModalOpen] = useState<boolean>(false);
  const [apiKeyInput, setApiKeyInput] = useState<string>('');
  const [keySaved, setKeySaved] = useState<boolean>(false);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      role: 'assistant',
      content:
        'Hello! I am Trafix AI Dispatcher. Ask me about live junction status, trigger emergency corridors (ambulance, police, VIP), or ask anything about traffic algorithms.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setIsSupported(voiceCommander.isSupported());
    setApiKeyInput(aiAssistantService.getApiKey());
  }, []);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleStartListening = () => {
    if (!voiceCommander.isSupported()) {
      setIsListening(false);
      setTranscript('Speech recognition unavailable on this browser. Type below or use shortcuts.');
      return;
    }

    setIsListening(true);
    setTranscript('Listening for command or question...');

    voiceCommander.start(
      (text) => {
        setTranscript(text || 'Listening...');
      },
      (action, rawText) => {
        soundEffects.playVoiceAck();
        handleVoiceQuerySubmit(rawText || transcript);
      }
    );
  };

  const handleStopListening = () => {
    setIsListening(false);
    voiceCommander.stop();
  };

  const handleSaveApiKey = () => {
    aiAssistantService.setApiKey(apiKeyInput);
    setKeySaved(true);
    soundEffects.playVoiceAck();
    setTimeout(() => {
      setKeySaved(false);
      setIsKeyModalOpen(false);
    }, 1200);
  };

  const handleVoiceQuerySubmit = async (queryText: string) => {
    if (!queryText.trim()) return;

    handleStopListening();
    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);
    setTranscript('');

    try {
      const history = [...messages, userMsg].map((m) => ({ role: m.role, content: m.content }));
      const result = await aiAssistantService.sendMessage(history);

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: result.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        action: result.action,
        provider: result.provider,
        model: result.model,
      };

      setMessages((prev) => [...prev, aiMsg]);
      soundEffects.playVoiceAck();

      // Speak back in Indian Female Voice
      voiceCommander.speak(result.reply);

      // Execute system action if returned
      if (result.action) {
        handleActionExecution(result.action);
      }
    } catch (err) {
      console.error('AI query failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleActionExecution = (action: VoiceAction) => {
    onExecuteAction(action);

    switch (action.type) {
      case 'EMERGENCY': {
        const typeLabel =
          action.emergencyType === 'POLICE'
            ? '🚓 Police Cruiser'
            : action.emergencyType === 'VIP'
              ? '👑 VIP Convoy'
              : action.emergencyType === 'FIRE_TRUCK'
                ? '🚒 Fire Brigade'
                : '🚑 Ambulance';

        setLastExecuted(`${typeLabel} on ${action.road} Road`);
        break;
      }
      case 'CLEAR_EMERGENCY':
        setLastExecuted('✅ Emergency Resolved. Adaptive Graph Active.');
        break;
      case 'SET_MODE':
        setLastExecuted(`⚙️ Controller switched to ${action.mode} Mode`);
        break;
      case 'OPEN_REPORT':
        setLastExecuted('📄 Opening PDF Audit Report Generator');
        break;
      case 'OPEN_MATRIX':
        setLastExecuted('📹 Launching 4-Screen CCTV Matrix Wall');
        break;
      case 'OPEN_VISION':
        setLastExecuted('🔍 Launching ANPR Camera Vision');
        break;
      case 'OPEN_3D':
        setLastExecuted('🚗 Launching 3D WebGL Studio');
        break;
      case 'OPEN_COMMANDS':
        setIsDictionaryOpen(true);
        setLastExecuted('📖 Opening Voice Command Dictionary');
        break;
      case 'OPEN_ABOUT_US':
        setLastExecuted('👨‍💻 Lead Developer: Lakshya Pundir (Team DigiX)');
        break;
      case 'CHAOS_MODE':
        setLastExecuted('⚡ Stress Test / Chaos Mode Engaged');
        break;
      case 'SIMULATION_START':
        setLastExecuted('▶️ Simulation Started');
        break;
      case 'SIMULATION_PAUSE':
        setLastExecuted('⏸️ Simulation Paused');
        break;
      case 'SIMULATION_RESET':
        setLastExecuted('🔄 Simulation Reset');
        break;
      case 'SIMULATION_SCENARIO':
        setLastExecuted(`🎬 Scenario Switched to ${action.scenario}`);
        break;
      case 'SIMULATION_SPAWN':
        setLastExecuted(`🚗 Spawned ${action.vehicleType} on ${action.road} approach`);
        break;
      case 'SIMULATION_SPEED':
        setLastExecuted(`⏩ Simulation Speed set to ${action.speed}x`);
        break;
      case 'TAB_INFO':
        setLastExecuted('ℹ️ Opening Tab Feature & Viva Documentation');
        break;
      case 'STATUS_SUMMARY':
        setLastExecuted('📊 Reading Traffic Telemetry Summary');
        break;
      case 'NAVIGATE':
        setLastExecuted(`🧭 Navigating to ${action.tab.toUpperCase()}`);
        break;
      case 'UNKNOWN':
        setLastExecuted(`❓ Query processed`);
        break;
    }
  };

  const quickCommands = [
    { label: '🚑 Ambulance North', cmd: 'Trigger ambulance on north road' },
    { label: '🚓 Police South', cmd: 'Police escort on south road' },
    { label: '👑 VIP East', cmd: 'VIP convoy on east road' },
    { label: '🚒 Fire Truck West', cmd: 'Fire truck on west road' },
    { label: '▶️ Run Sim', cmd: 'Start simulation' },
    { label: '⏸️ Pause Sim', cmd: 'Pause simulation' },
    { label: '🚗 Spawn Car', cmd: 'Spawn car on north road' },
    { label: 'ℹ️ Tab Info', cmd: 'Tell me about this tab' },
    { label: '⚡ Chaos Mode', cmd: 'Open chaos mode' },
    { label: '👨‍💻 Who Created This?', cmd: 'Who created this website?' },
    { label: '📄 PDF Report', cmd: 'Generate audit report' },
    { label: '✅ Clear Emergency', cmd: 'Clear emergency' },
  ];

  const hasGroqKey = Boolean(aiAssistantService.getApiKey());

  return (
    <>
      {/* Floating Tactical Trigger Button in Bottom Right */}
      <div className="fixed bottom-6 right-6 z-40 flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            soundEffects.playClick();
            onToggle();
            if (!isOpen && !isListening) {
              handleStartListening();
            } else if (isOpen && isListening) {
              handleStopListening();
            }
          }}
          className={`flex items-center gap-2 px-4 py-3 rounded-full font-bold text-xs tracking-tight shadow-xl transition-all border cursor-pointer ${isOpen || isListening
              ? 'bg-rose-600 border-rose-400 text-white animate-pulse shadow-rose-600/30'
              : 'bg-gradient-to-r from-red-600 via-rose-600 to-red-700 border-red-400/40 text-white hover:scale-105 shadow-red-600/30'
            }`}
          title="Trafix AI Voice Dispatch Assistant"
        >
          {isListening ? (
            <>
              <Radio className="w-4 h-4 text-white animate-spin" />
              <span>LISTENING...</span>
            </>
          ) : (
            <>
              <Mic className="w-4 h-4 text-white" />
              <span className="hidden sm:inline">AI DISPATCH HUD</span>
            </>
          )}
        </button>
      </div>

      {/* Floating Voice & Chat Assistant Modal HUD */}
      {isOpen && (
        <div className="fixed bottom-22 right-6 z-40 w-96 sm:w-[420px] max-w-[calc(100vw-2rem)] bg-[#08090f]/95 backdrop-blur-2xl border-2 border-red-500/40 rounded-3xl p-4 sm:p-5 text-white shadow-2xl space-y-3.5 animate-fade-in flex flex-col max-h-[82vh]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-3 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-red-600 flex items-center justify-center shadow-md shadow-red-600/30">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-black uppercase tracking-wider text-white">
                    Trafix AI Dispatcher
                  </h4>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[8px] font-mono font-bold uppercase ${hasGroqKey
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      }`}
                  >
                    {hasGroqKey ? 'LLaMA-3.3-70B' : 'Dynamic Local'}
                  </span>
                </div>
                <p className="text-[10px] text-red-300 font-mono flex items-center gap-1">
                  <span>🎙️ Indian Female Voice (Edge-TTS)</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* API Key Modal Button */}
              <button
                type="button"
                onClick={() => setIsKeyModalOpen(true)}
                title="Groq API Key Settings"
                className={`p-1.5 rounded-xl border text-[10px] font-bold transition flex items-center gap-1 cursor-pointer ${hasGroqKey
                    ? 'bg-white/10 hover:bg-red-600 text-slate-300 hover:text-white border-white/10'
                    : 'bg-amber-500/20 hover:bg-amber-500/40 text-amber-300 border-amber-500/40 animate-pulse'
                  }`}
              >
                <Key className="w-3.5 h-3.5" />
              </button>

              {/* Command Cheat Sheet Button */}
              <button
                type="button"
                onClick={() => {
                  soundEffects.playClick();
                  setIsDictionaryOpen(true);
                }}
                title="View All Voice Commands"
                className="px-2 py-1.5 rounded-xl bg-white/10 hover:bg-red-600 text-red-300 hover:text-white text-[10px] font-bold font-mono transition flex items-center gap-1 cursor-pointer"
              >
                <BookOpen className="w-3 h-3" />
                <span className="hidden sm:inline">Commands</span>
              </button>

              <button
                onClick={() => {
                  soundEffects.playClick();
                  handleStopListening();
                  onToggle();
                }}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-rose-600 text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Conversation Chat Stream */}
          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 min-h-[160px] max-h-[260px] text-xs font-sans">
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex gap-2 items-start ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <div className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                      <Bot className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}

                  <div
                    className={`p-2.5 rounded-2xl max-w-[82%] space-y-1 ${isUser
                        ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-tr-xs shadow-md shadow-red-950/40 font-medium'
                        : 'bg-white/10 border border-white/10 text-slate-100 rounded-tl-xs backdrop-blur-md'
                      }`}
                  >
                    <p className="text-xs leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    <div className="flex items-center justify-between text-[9px] text-white/50 font-mono pt-0.5">
                      <span>{msg.timestamp}</span>
                      {!isUser && (
                        <button
                          type="button"
                          onClick={() => voiceCommander.speak(msg.content)}
                          title="Repeat Audio"
                          className="hover:text-red-300 flex items-center gap-0.5"
                        >
                          <Volume2 className="w-2.5 h-2.5" />
                          <span>Listen</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {isUser && (
                    <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0 mt-0.5">
                      <User className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}
                </div>
              );
            })}

            {isLoading && (
              <div className="flex gap-2 items-center text-xs text-red-300 font-mono animate-pulse">
                <Bot className="w-4 h-4 text-red-400" />
                <span>Trafix Groq LLaMA-3.3 is thinking...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Live Mic Wave & Transcription Status */}
          {isListening && (
            <div className="p-2.5 rounded-2xl bg-black/60 border border-red-500/40 space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-mono font-bold text-red-300">
                <span className="flex items-center gap-1">
                  <Terminal className="w-3 h-3 text-red-400" />
                  <span>VOICE INPUT:</span>
                </span>
                <span className="px-1.5 py-0.5 rounded-full text-[8px] bg-rose-500/20 text-rose-300 border border-rose-500/40">
                  LIVE
                </span>
              </div>
              <p className="text-[11px] font-mono text-white italic truncate">
                &quot;{transcript || 'Say any query or emergency command...'}&quot;
              </p>
              <div className="flex items-center justify-center gap-1 py-0.5">
                {[10, 20, 14, 28, 16, 24, 12, 26, 18, 20].map((h, i) => (
                  <span
                    key={i}
                    style={{ height: `${h}px` }}
                    className="w-1 bg-gradient-to-t from-red-600 to-rose-400 rounded-full animate-pulse"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Last Executed Notification */}
          {lastExecuted && (
            <div className="p-2 rounded-xl bg-red-950/60 border border-red-500/30 text-[11px] font-mono text-red-200 flex items-center gap-1.5 shrink-0">
              <Volume2 className="w-3.5 h-3.5 text-red-400 shrink-0" />
              <span className="truncate">{lastExecuted}</span>
            </div>
          )}

          {/* Quick-Click Command Buttons */}
          <div className="space-y-1 shrink-0">
            <div className="flex items-center justify-between text-[9px] font-bold text-slate-400 uppercase tracking-wider">
              <span>Quick Shortcuts:</span>
              <button
                type="button"
                onClick={() => setIsDictionaryOpen(true)}
                className="text-red-400 hover:text-red-300 underline font-mono cursor-pointer"
              >
                View all &rarr;
              </button>
            </div>
            <div className="grid grid-cols-3 gap-1 max-h-20 overflow-y-auto pr-0.5">
              {quickCommands.map((qc, i) => (
                <button
                  key={i}
                  onClick={() => {
                    soundEffects.playClick();
                    handleVoiceQuerySubmit(qc.cmd);
                  }}
                  className="px-2 py-1 rounded-lg bg-white/5 hover:bg-red-600/30 border border-white/10 hover:border-red-400/50 text-[10px] font-bold text-left transition truncate cursor-pointer text-slate-200"
                >
                  {qc.label}
                </button>
              ))}
            </div>
          </div>

          {/* Query Input Bar (Text + Voice toggle) */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleVoiceQuerySubmit(inputText);
              setInputText('');
            }}
            className="pt-2 border-t border-white/10 flex items-center gap-1.5 shrink-0"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask anything or type command..."
              className="flex-1 px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-xs text-white placeholder:text-slate-500 focus:outline-hidden focus:border-red-500 transition font-sans"
            />

            {/* Voice Mic Toggle */}
            <button
              type="button"
              onClick={() => {
                if (isListening) handleStopListening();
                else handleStartListening();
              }}
              title={isListening ? 'Stop Listening' : 'Start Voice Input'}
              className={`p-2 rounded-xl border transition cursor-pointer ${isListening
                  ? 'bg-rose-600 border-rose-400 text-white animate-pulse'
                  : 'bg-white/10 hover:bg-white/20 border-white/10 text-white'
                }`}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            {/* Send Button */}
            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className="p-2 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white transition shadow-md shadow-red-950 cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* Groq API Key Configuration Modal */}
      {isKeyModalOpen && (
        <div
          onClick={() => setIsKeyModalOpen(false)}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md cursor-pointer animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md bg-[#08090f] text-white rounded-3xl p-6 shadow-2xl border-2 border-red-500/40 cursor-default space-y-4"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-red-400" />
                <h3 className="text-sm font-black uppercase tracking-wider text-white">
                  Groq Cloud AI Configuration
                </h3>
              </div>
              <button
                onClick={() => setIsKeyModalOpen(false)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-rose-600 text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Connect your free <strong>Groq API Key</strong> to enable dynamic, high-speed <strong>LLaMA-3.3-70B</strong> reasoning and conversational voice dispatching.
            </p>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-mono font-bold text-red-400 uppercase">
                GROQ API KEY (gsk_...)
              </label>
              <input
                type="password"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="gsk_xxxxxxxxxxxxxxxxxxxx"
                className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/20 text-xs font-mono text-white placeholder:text-slate-600 focus:outline-hidden focus:border-red-500 transition"
              />
            </div>

            <div className="p-3 rounded-2xl bg-white/5 border border-white/5 space-y-1.5 text-[11px] text-slate-400">
              <div className="flex items-center gap-1.5 font-bold text-slate-200">
                <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                <span>Backend .env Alternative:</span>
              </div>
              <p>
                You can also set <code>GROQ_API_KEY=gsk_...</code> inside your root or backend <code>.env</code> file.
              </p>
              <a
                href="https://console.groq.com/keys"
                target="_blank"
                rel="noreferrer"
                className="text-red-400 hover:text-red-300 underline inline-flex items-center gap-1 pt-1 font-semibold"
              >
                <span>Get free Groq API key</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={handleSaveApiKey}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-1.5 shadow-md shadow-red-950 cursor-pointer"
              >
                {keySaved ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300" />
                    <span>Saved Successfully!</span>
                  </>
                ) : (
                  <span>Save Configuration</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Command Dictionary Modal */}
      <CommandDictionaryModal
        isOpen={isDictionaryOpen}
        onClose={() => setIsDictionaryOpen(false)}
        onExecuteCommand={(action) => handleActionExecution(action)}
      />
    </>
  );
};
