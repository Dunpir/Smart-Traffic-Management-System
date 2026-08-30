import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  Sparkles,
  X,
  Radio,
  BookOpen,
  Send,
  Bot,
  VolumeX,
  Activity,
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

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      role: 'assistant',
      content:
        'Good day! I am Trafix AI Dispatcher. You may speak natural commands or ask for live intersection telemetry.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setIsSupported(voiceCommander.isSupported());
  }, []);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleStartListening = () => {
    if (!voiceCommander.isSupported()) {
      setIsSupported(false);
      return;
    }

    setIsListening(true);
    setTranscript('');
    voiceCommander.start(
      (text, isFinal) => {
        setTranscript(text);
        if (!isFinal) {
          setInputText(text);
        }
      },
      (action, rawText) => {
        handleActionExecution(action, rawText);
      }
    );
  };

  const handleStopListening = () => {
    setIsListening(false);
    voiceCommander.stop(true);
  };

  const handleActionExecution = (action: VoiceAction, userSpokenText?: string) => {
    setIsListening(false);
    const userText = userSpokenText || transcript;
    setLastExecuted(userText);
    setTranscript('');
    setInputText('');
    soundEffects.playVoiceAck();

    // 1. Add user message
    if (userText) {
      const userMsg: ChatMessage = {
        id: `u-${Date.now()}`,
        role: 'user',
        content: userText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, userMsg]);
    }

    // 2. Perform UI dispatch action
    onExecuteAction(action);

    // 3. Spoken Response
    let responseText = '';
    switch (action.type) {
      case 'EMERGENCY':
        responseText = `Priority pre-emption sequence engaged for ${action.emergencyType.replace('_', ' ')} on the ${action.road} approach. Conflicting signals held at Red.`;
        break;
      case 'CLEAR_EMERGENCY':
        responseText = 'Emergency pre-emption cleared. The intersection is resuming adaptive traffic scheduling.';
        break;
      case 'SET_MODE':
        responseText = `Controller switched to ${action.mode} mode.`;
        break;
      case 'SIMULATION_START':
        responseText = 'Traffic simulation started.';
        break;
      case 'SIMULATION_PAUSE':
        responseText = 'Traffic simulation paused.';
        break;
      case 'SIMULATION_RESET':
        responseText = 'Traffic simulation reset to baseline.';
        break;
      case 'SIMULATION_SCENARIO':
        responseText = `Simulation scenario set to ${action.scenario.replace('_', ' ')}.`;
        break;
      case 'SIMULATION_SPAWN':
        responseText = `Spawned ${action.vehicleType} on ${action.road} approach.`;
        break;
      case 'SIMULATION_SPEED':
        responseText = `Simulation speed set to ${action.speed}x.`;
        break;
      case 'NAVIGATE':
        responseText = `Navigating to ${action.tab} view.`;
        break;
      case 'OPEN_REPORT':
        responseText = 'Opening Smart City Audit Report.';
        break;
      case 'OPEN_VISION':
        responseText = 'Opening Optical AI Camera Feed.';
        break;
      case 'OPEN_MATRIX':
        responseText = 'Opening 4-Screen CCTV Matrix Wall.';
        break;
      case 'OPEN_ABOUT_US':
        responseText = 'Trafix was developed by Lakshya Pundir, Lead System Architect at Team DigiX.';
        break;
      case 'OPEN_COMMANDS':
        setIsDictionaryOpen(true);
        responseText = 'Displaying command reference dictionary.';
        break;
      case 'TAB_INFO':
        responseText = 'Displaying module reference and viva talking points.';
        break;
      case 'STATUS_SUMMARY':
        responseText = 'All four approaches operating nominally under adaptive graph scheduling.';
        break;
      default:
        // Handle conversational query
        handleAiChatQuery(userText);
        return;
    }

    // Add assistant response to stream & speak
    const assistantMsg: ChatMessage = {
      id: `a-${Date.now()}`,
      role: 'assistant',
      content: responseText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      action,
      provider: 'fallback',
    };
    setMessages((prev) => [...prev, assistantMsg]);
    voiceCommander.speak(responseText);
  };

  const handleAiChatQuery = async (queryText: string) => {
    if (!queryText.trim()) return;
    setIsLoading(true);

    const historyForAi = messages
      .slice(-6)
      .map((m) => ({ role: m.role, content: m.content }));
    historyForAi.push({ role: 'user', content: queryText });

    try {
      const res = await aiAssistantService.sendMessage(historyForAi);

      const assistantMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: res.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        action: res.action,
        provider: res.provider,
        model: res.model,
      };

      setMessages((prev) => [...prev, assistantMsg]);
      voiceCommander.speak(res.reply);

      if (res.action) {
        onExecuteAction(res.action);
      }
    } catch {
      const fallbackMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: `Understood. Processing your command regarding "${queryText}". All system safety interlocks remain nominal.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
      voiceCommander.speak(fallbackMsg.content);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const query = inputText.trim();
    setInputText('');
    setTranscript('');

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, userMsg]);

    const parsedAction = voiceCommander.parseCommand(query);
    if (parsedAction.type !== 'UNKNOWN') {
      handleActionExecution(parsedAction, query);
    } else {
      handleAiChatQuery(query);
    }
  };

  return (
    <>
      {/* Floating Bottom-Right Microphone Trigger Button */}
      <div className="fixed bottom-6 right-6 z-40 flex items-center gap-2">
        {/* Floating Live Speech Subtitle Pill (When listening & HUD is closed or open) */}
        {isListening && (
          <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-slate-950/90 text-white border border-red-500/50 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center gap-0.5 h-3">
              <span className="w-1 h-3 bg-red-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1 h-4 bg-red-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1 h-2 bg-red-500 rounded-full animate-bounce" />
            </div>
            <div className="max-w-[240px] sm:max-w-xs truncate">
              <span className="text-[10px] font-mono text-red-400 font-bold uppercase tracking-wider block">
                Live Speech
              </span>
              <span className="text-xs font-medium text-white truncate block">
                {transcript || 'Listening... speak now'}
              </span>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => {
            soundEffects.playClick();
            if (!isOpen) {
              onToggle();
              if (!isListening) handleStartListening();
            } else {
              if (isListening) handleStopListening();
              else handleStartListening();
            }
          }}
          className={`flex items-center gap-2 px-4 py-3 rounded-full font-bold text-xs tracking-tight shadow-xl transition cursor-pointer ${
            isListening
              ? 'bg-red-600 text-white animate-pulse shadow-red-600/30'
              : 'bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200'
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
              <Mic className="w-4 h-4" />
              <span className="hidden sm:inline">AI DISPATCH HUD</span>
            </>
          )}
        </button>
      </div>

      {/* Floating Voice & Chat Assistant Modal HUD */}
      {isOpen && (
        <div className="fixed bottom-22 right-6 z-40 w-96 sm:w-[420px] max-w-[calc(100vw-2rem)] bg-white/95 dark:bg-[#08090f]/95 backdrop-blur-2xl border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 text-slate-900 dark:text-white shadow-2xl space-y-3 animate-fade-in flex flex-col max-h-[82vh]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-3 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-slate-900 text-white dark:bg-zinc-900 dark:border dark:border-zinc-800 flex items-center justify-center shadow-xs">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    Trafix AI Dispatcher
                  </h4>
                  <span className="px-1.5 py-0.2 rounded text-[8px] font-mono font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200 dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-800">
                    Live
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* Command Cheat Sheet Button */}
              <button
                type="button"
                onClick={() => {
                  soundEffects.playClick();
                  setIsDictionaryOpen(true);
                }}
                title="View All Voice Commands"
                className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:text-zinc-300 text-[10px] font-bold font-mono transition flex items-center gap-1 cursor-pointer"
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
                className="w-7 h-7 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:text-zinc-400 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Real-Time Live Speech-to-Text Visualizer Banner inside Modal */}
          {isListening && (
            <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/80 text-red-900 dark:text-red-200 space-y-1 animate-in fade-in">
              <div className="flex items-center justify-between text-[10px] font-mono font-bold text-red-600 dark:text-red-400">
                <div className="flex items-center gap-1.5">
                  <div className="flex items-center gap-0.5 h-2.5">
                    <span className="w-1 h-2.5 bg-red-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1 h-3.5 bg-red-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1 h-2 bg-red-500 rounded-full animate-bounce" />
                  </div>
                  <span>LIVE RECOGNITION (TRANSCRIBING...)</span>
                </div>
                <span className="text-[9px] opacity-80">Stop speaking to dispatch</span>
              </div>
              <p className="text-xs font-semibold tracking-tight text-slate-900 dark:text-white bg-white/70 dark:bg-black/50 p-2 rounded border border-red-200/60 dark:border-red-900/60 min-h-[32px] flex items-center">
                {transcript ? (
                  <span>
                    "{transcript}"
                    <span className="inline-block w-1.5 h-3.5 bg-red-500 ml-1 animate-pulse" />
                  </span>
                ) : (
                  <span className="text-slate-400 dark:text-zinc-500 font-normal italic">
                    Listening to your microphone... speak command now
                  </span>
                )}
              </p>
            </div>
          )}

          {/* Conversation Chat Stream */}
          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 min-h-[140px] max-h-[260px] text-xs font-sans">
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex gap-2 items-start ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <div className="w-6 h-6 rounded bg-slate-900 text-white dark:bg-zinc-900 flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                  )}

                  <div
                    className={`p-2.5 rounded-lg max-w-[82%] space-y-1 ${
                      isUser
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-black shadow-xs font-medium'
                        : 'bg-slate-100 text-slate-800 dark:bg-zinc-900 dark:text-zinc-200 border border-slate-200 dark:border-zinc-800'
                    }`}
                  >
                    <p className="text-xs leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    <div className="flex items-center justify-between text-[9px] text-slate-400 dark:text-zinc-500 font-mono pt-0.5">
                      <span>{msg.timestamp}</span>
                      {!isUser && (
                        <button
                          type="button"
                          onClick={() => voiceCommander.speak(msg.content)}
                          title="Repeat Audio"
                          className="hover:text-slate-900 dark:hover:text-white flex items-center gap-0.5 cursor-pointer ml-2"
                        >
                          <Volume2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            {isLoading && (
              <div className="flex items-center gap-2 text-slate-400 dark:text-zinc-500 text-xs font-mono pl-8 animate-pulse">
                <Radio className="w-3.5 h-3.5 animate-spin" />
                <span>Formulating dispatch response...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Voice Prompt Suggestions */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 text-[10px] font-mono shrink-0">
            <button
              onClick={() => handleActionExecution({ type: 'EMERGENCY', road: 'WEST', emergencyType: 'AMBULANCE' }, 'Ambulance on West road')}
              className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:text-zinc-300 whitespace-nowrap cursor-pointer"
            >
              🚑 Ambulance West
            </button>
            <button
              onClick={() => handleActionExecution({ type: 'STATUS_SUMMARY' }, 'How is traffic?')}
              className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:text-zinc-300 whitespace-nowrap cursor-pointer"
            >
              📊 Status Summary
            </button>
            <button
              onClick={() => handleActionExecution({ type: 'OPEN_REPORT' }, 'Open audit report')}
              className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:text-zinc-300 whitespace-nowrap cursor-pointer"
            >
              📄 Audit PDF
            </button>
          </div>

          {/* Input Box and Controls */}
          <form onSubmit={handleTextSubmit} className="flex items-center gap-1.5 shrink-0 pt-1 border-t border-slate-200 dark:border-zinc-800">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={isListening ? 'Listening to voice in real-time...' : 'Type or speak a traffic command...'}
              className="flex-1 px-3 py-2 rounded bg-slate-50 dark:bg-black border border-slate-300 dark:border-zinc-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none"
            />

            {/* Mic Toggle Button */}
            <button
              type="button"
              onClick={() => {
                soundEffects.playClick();
                if (isListening) handleStopListening();
                else handleStartListening();
              }}
              className={`p-2 rounded transition cursor-pointer ${
                isListening
                  ? 'bg-red-600 text-white animate-pulse'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:text-zinc-300'
              }`}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            {/* Send Button */}
            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className="p-2 rounded bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-black disabled:opacity-40 transition cursor-pointer shadow-xs"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
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
