import React, { useState } from 'react';
import {
  BrainCircuit,
  X,
  Cpu,
  Radio,
  Layers,
  Sparkles,
  TrendingDown,
  Activity,
  CheckCircle2,
  Zap,
  ArrowRight,
  Sliders,
  ShieldCheck,
  Eye,
  Terminal,
} from 'lucide-react';
import { AiAgentInfo, XaiDecisionRecord, AgentTier } from '../../types';
import { multiAgentSwarm } from '../../utils/multiAgentSwarm';
import { soundEffects } from '../../utils/soundEffects';

interface MultiAgentSwarmModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MultiAgentSwarmModal: React.FC<MultiAgentSwarmModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'TOPOLOGY' | 'XAI_LOGS' | 'RL_POLICY'>('TOPOLOGY');
  const [agents, setAgents] = useState<AiAgentInfo[]>(() => multiAgentSwarm.getAgents());
  const [decisions, setDecisions] = useState<XaiDecisionRecord[]>(() =>
    multiAgentSwarm.getDecisionHistory()
  );
  const [selectedAgent, setSelectedAgent] = useState<AiAgentInfo>(agents[0]);

  // Optimization Objective Weights Slider State
  const [delayWeight, setDelayWeight] = useState<number>(45);
  const [emissionWeight, setEmissionWeight] = useState<number>(30);
  const [transitPriority, setTransitPriority] = useState<number>(25);

  if (!isOpen) return null;

  const getTierBadge = (tier: AgentTier) => {
    switch (tier) {
      case 'EDGE_RL':
        return 'bg-cyan-950 text-cyan-300 border-cyan-700';
      case 'CORRIDOR_COORD':
        return 'bg-emerald-950 text-emerald-300 border-emerald-700';
      case 'CITY_MASTER':
        return 'bg-purple-950 text-purple-300 border-purple-700';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in font-sans">
      <div className="relative w-full max-w-4xl bg-slate-950 border border-cyan-500/40 rounded-3xl shadow-2xl shadow-cyan-950/60 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-slate-900 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-950 border border-cyan-500/50 text-cyan-400 flex items-center justify-center">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Autonomous Multi-Agent AI Swarm & Explainable AI (XAI)
                </h3>
                <span className="px-2 py-0.2 rounded text-[9px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-700">
                  3-TIER SWARM ACTIVE
                </span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                Edge Q-Learning RL Agents • Arterial Green Wave Coordinators • Master City Orchestrator
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
                setActiveTab('TOPOLOGY');
              }}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'TOPOLOGY'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-600'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>1. Swarm Hierarchy ({agents.length} Agents)</span>
            </button>

            <button
              onClick={() => {
                soundEffects.playClick();
                setActiveTab('XAI_LOGS');
              }}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'XAI_LOGS'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-600'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>2. Explainable AI Decision Log</span>
            </button>

            <button
              onClick={() => {
                soundEffects.playClick();
                setActiveTab('RL_POLICY');
              }}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'RL_POLICY'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-600'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>3. RL Reward Function Weights</span>
            </button>
          </div>
        </div>

        {/* Modal Body Scrollable */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Tab 1: Topology */}
          {activeTab === 'TOPOLOGY' && (
            <div className="space-y-4 font-mono text-xs">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Tier 3 Banner */}
                <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-600/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-purple-400 uppercase">TIER 3: CITY MASTER</span>
                    <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
                  </div>
                  <div className="text-white font-bold">Metropolitan Orchestrator</div>
                  <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                    Performs macro traffic load balancing, prevents spillback gridlocks, and coordinates city-wide emergency detours.
                  </p>
                  <div className="text-[10px] text-purple-300 pt-1 border-t border-purple-800">
                    Latency: <strong>48ms</strong> • Scale: <strong>9 Intersections</strong>
                  </div>
                </div>

                {/* Tier 2 Banner */}
                <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-600/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase">TIER 2: CORRIDOR SYNC</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  </div>
                  <div className="text-white font-bold">Waveband Coordinators</div>
                  <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                    Calculates phase offsets along arterial corridors to synchronize uninterrupted Green Waves at 54 km/h target speed.
                  </p>
                  <div className="text-[10px] text-emerald-300 pt-1 border-t border-emerald-800">
                    Latency: <strong>21ms</strong> • Scope: <strong>Multi-Hop Corridors</strong>
                  </div>
                </div>

                {/* Tier 1 Banner */}
                <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-600/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-cyan-400 uppercase">TIER 1: EDGE RL NODES</span>
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  </div>
                  <div className="text-white font-bold">Deep Q-Network Nodes</div>
                  <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                    Embedded RL agents at each junction optimizing split times and vehicle queues every 500ms using camera telemetry.
                  </p>
                  <div className="text-[10px] text-cyan-300 pt-1 border-t border-cyan-800">
                    Latency: <strong>&lt; 15ms</strong> • Model: <strong>DQN / Q-Learning</strong>
                  </div>
                </div>
              </div>

              {/* Agent Instances Grid */}
              <div className="space-y-2 pt-2">
                <div className="text-xs font-bold text-slate-400 uppercase">
                  Active Swarm Agent Nodes ({agents.length}):
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {agents.map((agent) => (
                    <div
                      key={agent.id}
                      onClick={() => setSelectedAgent(agent)}
                      className={`p-3.5 rounded-2xl border text-left transition cursor-pointer space-y-1.5 ${
                        selectedAgent.id === agent.id
                          ? 'bg-cyan-950/80 border-cyan-500 ring-2 ring-cyan-500/40'
                          : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold border ${getTierBadge(agent.tier)}`}>
                          {agent.tier.replace('_', ' ')}
                        </span>
                        <span className="text-slate-400 text-[10px]">{agent.inferenceLatencyMs}ms Latency</span>
                      </div>

                      <div className="text-xs font-bold text-white font-sans">{agent.name}</div>
                      <div className="text-[10px] text-slate-400 truncate">{agent.targetScope}</div>

                      <div className="pt-1 flex items-center justify-between text-[10px] text-slate-300 border-t border-slate-800/80">
                        <span>Confidence: <strong className="text-emerald-400">{agent.confidencePercent}%</strong></span>
                        <span>Reward: <strong className="text-cyan-400">+{agent.rewardScore}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Explainable AI Decision Log */}
          {activeTab === 'XAI_LOGS' && (
            <div className="space-y-3 font-mono text-xs">
              <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/40 flex items-center justify-between">
                <span>EXPLAINABLE AI (XAI) REASONING ENGINE ACTIVE</span>
                <span className="text-emerald-400 font-bold">100% Decision Auditability</span>
              </div>

              <div className="space-y-2.5">
                {decisions.map((dec) => (
                  <div
                    key={dec.id}
                    className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2.5 shadow-md"
                  >
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold border ${getTierBadge(dec.tier)}`}>
                          {dec.tier}
                        </span>
                        <span className="font-bold text-white text-xs">{dec.actionTaken}</span>
                        <span className="text-slate-400 text-[10px]">[{dec.agentId}]</span>
                      </div>
                      <span className="text-slate-400 text-[10px]">{new Date(dec.timestamp).toLocaleTimeString()}</span>
                    </div>

                    <p className="text-xs text-slate-200 font-sans leading-relaxed bg-slate-950/80 p-2.5 rounded-xl border border-slate-800/80">
                      💡 <strong>AI Reasoning:</strong> {dec.naturalLanguageReason}
                    </p>

                    <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                      <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                        <div className="text-slate-400">Wait Time Saved</div>
                        <div className="text-emerald-400 font-bold text-xs mt-0.5">-{dec.metricImpact.delaySavedSec}s</div>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                        <div className="text-slate-400">CO2 Emissions Avoided</div>
                        <div className="text-cyan-400 font-bold text-xs mt-0.5">-{dec.metricImpact.co2AvoidedKg} kg</div>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                        <div className="text-slate-400">Vehicles Cleared</div>
                        <div className="text-purple-400 font-bold text-xs mt-0.5">{dec.metricImpact.queueReductionVeh} veh</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 3: RL Policy Weights */}
          {activeTab === 'RL_POLICY' && (
            <div className="space-y-4 font-mono text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                <div className="text-xs font-bold text-white uppercase flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-cyan-400" />
                  <span>RL Multi-Objective Reward Function Weights:</span>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <div className="flex justify-between text-slate-300">
                      <span>Vehicle Delay Penalty Weight (w_delay):</span>
                      <strong className="text-cyan-400">{delayWeight}%</strong>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={80}
                      value={delayWeight}
                      onChange={(e) => setDelayWeight(Number(e.target.value))}
                      className="w-full accent-cyan-400 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-slate-300">
                      <span>Emissions &amp; Idling Fuel Penalty (w_eco):</span>
                      <strong className="text-emerald-400">{emissionWeight}%</strong>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={60}
                      value={emissionWeight}
                      onChange={(e) => setEmissionWeight(Number(e.target.value))}
                      className="w-full accent-emerald-400 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-slate-300">
                      <span>Public Transit &amp; Bus Priority Bonus (w_bus):</span>
                      <strong className="text-purple-400">{transitPriority}%</strong>
                    </div>
                    <input
                      type="range"
                      min={5}
                      max={50}
                      value={transitPriority}
                      onChange={(e) => setTransitPriority(Number(e.target.value))}
                      className="w-full accent-purple-400 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 leading-relaxed font-sans">
                  The Swarm Agents recalculate gradient descent weights every <strong>100 policy steps</strong> with experience replay memory buffer (size = 10,000 transitions).
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
