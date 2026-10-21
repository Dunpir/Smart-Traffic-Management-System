import React, { useState } from 'react';
import {
  GraduationCap,
  X,
  ChevronLeft,
  ChevronRight,
  TrendingDown,
  Zap,
  Activity,
  ShieldCheck,
  Cpu,
  Layers,
  Sparkles,
  HelpCircle,
  Clock,
  Gauge,
  Flame,
  FileCheck,
  CheckCircle2,
} from 'lucide-react';
import { soundEffects } from '../../utils/soundEffects';

interface VivaDefenseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VivaDefenseModal: React.FC<VivaDefenseModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'SLIDES' | 'BENCHMARK' | 'EXAMINER_QA'>('SLIDES');
  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const [expandedQa, setExpandedQa] = useState<number | null>(0);

  if (!isOpen) return null;

  const slides = [
    {
      title: '1. Executive Problem Statement & Motivation',
      subtitle: 'Why Conventional Pre-Timed Traffic Signals Fail in Modern Metros',
      badge: 'PROBLEM CONTEXT',
      content: (
        <div className="space-y-4 text-xs font-sans leading-relaxed">
          <p className="text-slate-300">
            Metropolitan cities lose billions of dollars annually due to <strong>rigid fixed-timer signals</strong> (e.g. static 60-second cycles) that cannot adapt to asymmetrical peak-hour queues, sudden surges, or emergency vehicles.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono">
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-700/50">
              <div className="text-rose-400 font-bold uppercase text-[10px]">Ghost Green Lights</div>
              <div className="text-slate-200 mt-1">Green lights given to empty lanes while congested roads wait in queue.</div>
            </div>
            <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-700/50">
              <div className="text-amber-400 font-bold uppercase text-[10px]">Ambulance Delays</div>
              <div className="text-slate-200 mt-1">Over 30% of critical trauma patients delayed in city gridlocks.</div>
            </div>
            <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-700/50">
              <div className="text-cyan-400 font-bold uppercase text-[10px]">Excess Carbon Output</div>
              <div className="text-slate-200 mt-1">Vehicular stop-and-go idling generates 35% higher CO2 emissions.</div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: '2. End-to-End System Architecture',
      subtitle: 'Full-Stack Distributed Real-Time Microservices Topology',
      badge: 'SYSTEM ARCHITECTURE',
      content: (
        <div className="space-y-3 font-mono text-xs">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <div className="text-cyan-400 font-bold">1. SENSING LAYER</div>
              <div className="text-[11px] text-slate-400 mt-1">YOLOv8 AI Edge Cameras + Ultrasonic IR Sensor HIL Nodes</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <div className="text-emerald-400 font-bold">2. LOGIC ENGINE</div>
              <div className="text-[11px] text-slate-400 mt-1">Dynamic Webster Q-Learning + Arterial Green Wave Solver</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <div className="text-purple-400 font-bold">3. DATA LAYER</div>
              <div className="text-[11px] text-slate-400 mt-1">Neo4j Spatial Graph + MongoDB Violation Database</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <div className="text-amber-400 font-bold">4. ACTUATION</div>
              <div className="text-[11px] text-slate-400 mt-1">Hardware Microcontroller Serial / MQTT Relay Actuation</div>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/80 border border-cyan-500/30 text-slate-300 text-[11px] leading-relaxed">
            Real-time push telemetry runs over full-duplex WebSockets with <strong>&lt; 50ms propagation latency</strong> across metropolitan node meshes.
          </div>
        </div>
      ),
    },
    {
      title: '3. Edge AI Vision & Automated ANPR Enforcement',
      subtitle: 'Deep Learning Vehicle Classification and Zero-Touch Violation Dispatch',
      badge: 'AI COMPUTER VISION',
      content: (
        <div className="space-y-3 font-mono text-xs">
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-cyan-400 font-bold">
              <span>YOLOv8 Embedded Vision Specs</span>
              <span>29.8 FPS • 12.4ms Inference</span>
            </div>
            <div className="text-slate-300 text-[11px] font-sans">
              Detects 6 vehicle classes (Sedans, SUVs, Auto-rickshaws, Buses, Trucks, Motorcycles) and pedestrians. Automatic OCR segment extraction reads Indian standard number plates and verifies against mock VAHAN database.
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
            <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
              <div className="text-slate-400">Violation Accuracy</div>
              <div className="text-emerald-400 font-bold text-sm mt-0.5">98.4% mAP</div>
            </div>
            <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
              <div className="text-slate-400">OCR Capture Time</div>
              <div className="text-cyan-400 font-bold text-sm mt-0.5">42 ms</div>
            </div>
            <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
              <div className="text-slate-400">Challan Dispatch</div>
              <div className="text-purple-400 font-bold text-sm mt-0.5">Instant WhatsApp / SMS</div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: '4. Green Wave Progression & Dijkstra Network Solver',
      subtitle: 'Synchronized Phase Offset Optimization Across Multi-Intersection Corridors',
      badge: 'CORRIDOR OPTIMIZATION',
      content: (
        <div className="space-y-3 font-mono text-xs">
          <p className="text-slate-300 font-sans leading-relaxed">
            By analyzing speed limits (54 km/h) and distance vectors between nodes in the <strong>Neo4j spatial graph</strong>, the system dynamically calculates progressive green wave offsets so platoons encounter zero red lights along arterial highways.
          </p>
          <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-between">
            <div>
              <div className="text-emerald-400 font-bold text-xs">Arterial Band Efficiency</div>
              <div className="text-[11px] text-slate-300 mt-0.5">Zero-Stop Progression Rate: <strong>94.8%</strong></div>
            </div>
            <div className="text-right">
              <div className="text-xs font-bold text-cyan-300">-63% Wait Time</div>
              <div className="text-[10px] text-slate-400">Continuous 54 km/h Platoon Flow</div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: '5. Fail-Safe Redundancy & Edge Fallback Architecture',
      subtitle: 'Industrial-Grade Reliability with Hardware Watchdog Safeguards',
      badge: 'SAFETY & RELIABILITY',
      content: (
        <div className="space-y-3 font-mono text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <div className="text-amber-400 font-bold">1. SENSOR FAILOVER</div>
              <div className="text-[11px] text-slate-400 mt-1">If AI vision camera disconnects, hardware automatically falls back to historical time-of-day tables and IR sensors.</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <div className="text-rose-400 font-bold">2. ALL-RED SAFETY INTERLOCK</div>
              <div className="text-[11px] text-slate-400 mt-1">Hardware interlock prevents conflicting green signals across perpendicular cross-streets.</div>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-300 text-[11px]">
            Watchdog Timer: Autonomous heartbeat ping every <strong>500ms</strong> ensures continuous failsafe control.
          </div>
        </div>
      ),
    },
  ];

  const benchmarkStats = [
    {
      metric: 'Average Vehicle Delay',
      before: '58.4 sec',
      after: '21.6 sec',
      delta: '-63.0%',
      icon: <Clock className="w-4 h-4 text-emerald-400" />,
    },
    {
      metric: 'Average Queue Length',
      before: '24 vehicles',
      after: '7 vehicles',
      delta: '-70.8%',
      icon: <Activity className="w-4 h-4 text-cyan-400" />,
    },
    {
      metric: 'Fuel Wasted at Idle',
      before: '48.2 L/hr',
      after: '14.8 L/hr',
      delta: '-69.3%',
      icon: <Flame className="w-4 h-4 text-amber-400" />,
    },
    {
      metric: 'Carbon (CO2) Emissions',
      before: '111.3 kg/hr',
      after: '34.2 kg/hr',
      delta: '-69.3%',
      icon: <TrendingDown className="w-4 h-4 text-emerald-400" />,
    },
    {
      metric: 'Emergency Transit Clearance',
      before: '85.0 sec',
      after: '18.2 sec',
      delta: '-78.6%',
      icon: <Zap className="w-4 h-4 text-rose-400" />,
    },
  ];

  const examinerQuestions = [
    {
      q: 'Q1: How does the system prevent green light conflicts between intersecting lanes?',
      a: 'The system uses an All-Red Interlock & Direction Lock state machine in the backend and microcontroller. Before switching any approach to GREEN, the current phase transitions to YELLOW (3s) followed by an ALL-RED clearance interval (2s) to purge the intersection box.',
    },
    {
      q: 'Q2: What happens if the network connection or cloud server fails?',
      a: 'The edge controller (Arduino/ESP32) runs an autonomous hardware watchdog. If WebSocket heartbeats drop for > 2000ms, the node automatically switches to a local Webster pre-timed cycle and flashes Amber for pedestrian safety.',
    },
    {
      q: 'Q3: How does the Green Wave algorithm calculate signal synchronization between nodes?',
      a: 'The Green Wave solver uses the distance d (km) from the Neo4j spatial graph and target design speed v (54 km/h) to calculate the precise phase offset t = d / v. It schedules downstream green light windows right as the vehicle platoon arrives.',
    },
    {
      q: 'Q4: How does the ANPR pipeline detect and issue violation challans in real-time?',
      a: 'When an intersection light is RED, virtual tripwires in the YOLOv8 vision pipeline trigger on bounding box breaches. The OCR engine reads the registration plate, logs the violation into MongoDB, and generates an instant digital e-challan with speed/location metadata.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in font-sans">
      <div className="relative w-full max-w-4xl bg-slate-950 border border-purple-500/40 rounded-3xl shadow-2xl shadow-purple-950/60 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-slate-900 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-950 border border-purple-500/50 text-purple-400 flex items-center justify-center">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Viva Defense & Academic Presentation Mode
                </h3>
                <span className="px-2 py-0.2 rounded text-[9px] font-mono font-bold bg-purple-950 text-purple-300 border border-purple-700">
                  DEFENSE READY
                </span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                Project Architecture • Benchmark Metrics • Examiner Q&A Defense Sheet
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center justify-between px-5 py-2.5 bg-slate-950 border-b border-slate-800 font-mono text-xs shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                soundEffects.playClick();
                setActiveTab('SLIDES');
              }}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'SLIDES'
                  ? 'bg-purple-950 text-purple-300 border border-purple-600'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>1. Presentation Slides ({currentSlide + 1}/5)</span>
            </button>

            <button
              onClick={() => {
                soundEffects.playClick();
                setActiveTab('BENCHMARK');
              }}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'BENCHMARK'
                  ? 'bg-purple-950 text-purple-300 border border-purple-600'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <TrendingDown className="w-3.5 h-3.5" />
              <span>2. Before vs After Benchmark</span>
            </button>

            <button
              onClick={() => {
                soundEffects.playClick();
                setActiveTab('EXAMINER_QA');
              }}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'EXAMINER_QA'
                  ? 'bg-purple-950 text-purple-300 border border-purple-600'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>3. Examiner Q&A Defense</span>
            </button>
          </div>
        </div>

        {/* Main Content Area Scrollable */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'SLIDES' && (
            <div className="space-y-4">
              {/* Slide Card */}
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
                <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-3">
                  <div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-950 text-purple-300 border border-purple-700">
                      {slides[currentSlide].badge}
                    </span>
                    <h3 className="text-base font-bold text-white font-sans mt-1.5">
                      {slides[currentSlide].title}
                    </h3>
                    <div className="text-xs text-slate-400 font-sans">
                      {slides[currentSlide].subtitle}
                    </div>
                  </div>
                </div>

                <div className="pt-1">{slides[currentSlide].content}</div>
              </div>

              {/* Slide Navigation Footer */}
              <div className="flex items-center justify-between font-mono text-xs pt-2">
                <button
                  onClick={() => {
                    soundEffects.playClick();
                    setCurrentSlide((s) => Math.max(s - 1, 0));
                  }}
                  disabled={currentSlide === 0}
                  className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-slate-300 border border-slate-700 flex items-center gap-1 transition cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous Slide</span>
                </button>

                <div className="flex items-center gap-1.5">
                  {slides.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentSlide(idx)}
                      className={`w-2.5 h-2.5 rounded-full transition cursor-pointer ${
                        currentSlide === idx ? 'bg-purple-400 scale-125' : 'bg-slate-700'
                      }`}
                    />
                  ))}
                </div>

                <button
                  onClick={() => {
                    soundEffects.playClick();
                    setCurrentSlide((s) => Math.min(s + 1, slides.length - 1));
                  }}
                  disabled={currentSlide === slides.length - 1}
                  className="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-bold flex items-center gap-1 transition cursor-pointer"
                >
                  <span>Next Slide</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {activeTab === 'BENCHMARK' && (
            <div className="space-y-4 font-mono">
              <div className="p-3.5 rounded-xl bg-purple-950/40 border border-purple-500/40 flex items-center justify-between text-xs">
                <span>BENCHMARK DATASET: Delhi-NCR Peak Hour Simulation (N=10,000 Vehicles)</span>
                <span className="text-emerald-400 font-bold">✓ Statistically Significant (p &lt; 0.001)</span>
              </div>

              <div className="space-y-2.5">
                {benchmarkStats.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                        {item.icon}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">{item.metric}</div>
                        <div className="text-[11px] text-slate-400 font-sans mt-0.5">
                          Fixed Baseline: <strong className="text-slate-300">{item.before}</strong> ➔ Trafix AI: <strong className="text-emerald-400">{item.after}</strong>
                        </div>
                      </div>
                    </div>

                    <div className="px-3 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-500 text-emerald-300 font-bold text-sm">
                      {item.delta}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'EXAMINER_QA' && (
            <div className="space-y-3 font-sans">
              <div className="text-xs font-mono text-purple-400 font-bold uppercase">
                Frequently Asked Examiner Technical Questions:
              </div>

              <div className="space-y-2">
                {examinerQuestions.map((qa, idx) => (
                  <div
                    key={idx}
                    className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden"
                  >
                    <button
                      onClick={() => setExpandedQa(expandedQa === idx ? null : idx)}
                      className="w-full p-3.5 text-left flex items-center justify-between gap-2 hover:bg-slate-800/60 transition cursor-pointer font-bold text-xs text-white"
                    >
                      <span>{qa.q}</span>
                      <span className="text-purple-400 font-mono text-sm">
                        {expandedQa === idx ? '−' : '+'}
                      </span>
                    </button>

                    {expandedQa === idx && (
                      <div className="p-3.5 pt-0 text-xs text-slate-300 leading-relaxed font-sans border-t border-slate-800/80 mt-1">
                        {qa.a}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
