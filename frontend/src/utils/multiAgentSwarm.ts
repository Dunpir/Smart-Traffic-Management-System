import { AiAgentInfo, XaiDecisionRecord, AgentTier, Direction } from '../types';

export class MultiAgentSwarmEngine {
  private agents: AiAgentInfo[] = [
    {
      id: 'AGENT-EDGE-CP01',
      name: 'Connaught Place Edge RL Agent',
      tier: 'EDGE_RL',
      targetScope: 'J001 (Connaught Place Central)',
      status: 'ACTIVE_OPTIMIZING',
      algorithm: 'Deep Q-Network (DQN) + Webster Heuristic',
      inferenceLatencyMs: 14.2,
      rewardScore: 842,
      confidencePercent: 97.4,
      lastDecisionSummary: 'Extended North Green by +10s (Queue ratio 3.2:1)',
    },
    {
      id: 'AGENT-EDGE-AIIMS02',
      name: 'AIIMS Ring Road Edge RL Agent',
      tier: 'EDGE_RL',
      targetScope: 'J002 (AIIMS Ring Road)',
      status: 'EMERGENCY_OVERRIDE',
      algorithm: 'Deep Q-Network (DQN) + Priority Preempt',
      inferenceLatencyMs: 11.8,
      rewardScore: 915,
      confidencePercent: 99.1,
      lastDecisionSummary: 'Emergency green corridor held for ambulance inbound',
    },
    {
      id: 'AGENT-EDGE-CYB03',
      name: 'Cyber City Expressway Edge RL Agent',
      tier: 'EDGE_RL',
      targetScope: 'J003 (Cyber City NH-48)',
      status: 'ACTIVE_OPTIMIZING',
      algorithm: 'Deep Q-Network (DQN) + Spillback Shield',
      inferenceLatencyMs: 16.5,
      rewardScore: 780,
      confidencePercent: 94.8,
      lastDecisionSummary: 'Throttled Eastbound inflow to avoid flyover gridlock',
    },
    {
      id: 'AGENT-EDGE-SEC62',
      name: 'Sector 62 Electronic City Edge RL Agent',
      tier: 'EDGE_RL',
      targetScope: 'J004 (Sector 62 Noida)',
      status: 'ACTIVE_OPTIMIZING',
      algorithm: 'Deep Q-Network (DQN) + Eco-Reward Loss',
      inferenceLatencyMs: 12.1,
      rewardScore: 889,
      confidencePercent: 96.2,
      lastDecisionSummary: 'Optimized East-West phase for transit bus priority',
    },
    {
      id: 'AGENT-CORR-EW',
      name: 'East-West Capital Corridor Waveband Agent',
      tier: 'CORRIDOR_COORD',
      targetScope: 'Arterial Corridor 01 (Gurgaon - Noida)',
      status: 'ACTIVE_OPTIMIZING',
      algorithm: 'MaxBand Arterial Green Wave Coordinator',
      inferenceLatencyMs: 24.5,
      rewardScore: 1240,
      confidencePercent: 95.7,
      lastDecisionSummary: 'Synchronized 4-node phase offsets at 54 km/h target',
    },
    {
      id: 'AGENT-CORR-NS',
      name: 'North-South Medical & Heritage Corridor Agent',
      tier: 'CORRIDOR_COORD',
      targetScope: 'Arterial Corridor 02 (CP - AIIMS)',
      status: 'ACTIVE_OPTIMIZING',
      algorithm: 'Coordinated Green Waveband Engine',
      inferenceLatencyMs: 19.8,
      rewardScore: 1180,
      confidencePercent: 98.2,
      lastDecisionSummary: 'Held green progression band for trauma corridor',
    },
    {
      id: 'AGENT-MASTER-NCR',
      name: 'Delhi-NCR Metropolitan Master Orchestrator',
      tier: 'CITY_MASTER',
      targetScope: 'Metropolitan 9-Junction Macro Mesh',
      status: 'ACTIVE_OPTIMIZING',
      algorithm: 'Hierarchical Multi-Agent Graph Neural Net (H-MAGNN)',
      inferenceLatencyMs: 48.0,
      rewardScore: 2450,
      confidencePercent: 98.9,
      lastDecisionSummary: 'Balancing macro arterial load between Ring Road & DND bypass',
    },
  ];

  private decisionHistory: XaiDecisionRecord[] = [
    {
      id: 'XAI-801',
      timestamp: new Date(Date.now() - 15000).toISOString(),
      agentId: 'AGENT-EDGE-CP01',
      agentName: 'Connaught Place Edge RL Agent',
      tier: 'EDGE_RL',
      actionTaken: 'EXTEND_GREEN_PHASE (+10s)',
      targetJunctionId: 'J001',
      naturalLanguageReason:
        'North approach vehicle queue (16 veh) exceeded East approach (4 veh) by 4.0x ratio. Q(Extend Green) = +0.91 vs Q(Switch Phase) = +0.18. Granted +10s green extension.',
      metricImpact: {
        delaySavedSec: 18.4,
        co2AvoidedKg: 0.84,
        queueReductionVeh: 6,
      },
      qValues: {
        extendGreen: 0.91,
        switchPhase: 0.18,
        emergencyPreemption: 0.0,
      },
      confidence: 97.4,
    },
    {
      id: 'XAI-802',
      timestamp: new Date(Date.now() - 45000).toISOString(),
      agentId: 'AGENT-CORR-EW',
      agentName: 'East-West Capital Corridor Waveband Agent',
      tier: 'CORRIDOR_COORD',
      actionTaken: 'SYNCHRONIZE_PHASE_OFFSET (Δt = +14.2s)',
      targetJunctionId: 'CORR-01',
      naturalLanguageReason:
        'Detected arriving platoon of 28 vehicles travelling at 52 km/h from Dhaula Kuan. Shifted CP-01 phase offset by +14.2s to ensure uninterrupted zero-stop green wave pass-through.',
      metricImpact: {
        delaySavedSec: 32.0,
        co2AvoidedKg: 1.45,
        queueReductionVeh: 14,
      },
      qValues: {
        extendGreen: 0.88,
        switchPhase: 0.72,
        emergencyPreemption: 0.0,
      },
      confidence: 95.7,
    },
    {
      id: 'XAI-803',
      timestamp: new Date(Date.now() - 95000).toISOString(),
      agentId: 'AGENT-MASTER-NCR',
      agentName: 'Delhi-NCR Metropolitan Master Orchestrator',
      tier: 'CITY_MASTER',
      actionTaken: 'REROUTE_MACRO_FLOW (35% Inflow Detour)',
      targetJunctionId: 'J009',
      naturalLanguageReason:
        'Ashram Chowk construction zone bottleneck detected. Dynamically advised 35% Eastbound traffic to take DND Flyway bypass, mitigating downstream Ring Road gridlock.',
      metricImpact: {
        delaySavedSec: 45.5,
        co2AvoidedKg: 2.18,
        queueReductionVeh: 22,
      },
      qValues: {
        extendGreen: 0.65,
        switchPhase: 0.55,
        emergencyPreemption: 0.95,
      },
      confidence: 98.9,
    },
  ];

  public getAgents(): AiAgentInfo[] {
    return this.agents;
  }

  public getDecisionHistory(): XaiDecisionRecord[] {
    return this.decisionHistory;
  }

  public generateRealtimeDecision(direction: Direction, vehicleCount: number): XaiDecisionRecord {
    const qExtend = Number((0.75 + Math.random() * 0.22).toFixed(2));
    const qSwitch = Number((0.15 + Math.random() * 0.25).toFixed(2));
    const timeSaved = Number((12 + Math.random() * 15).toFixed(1));
    const co2Saved = Number((timeSaved * 0.045).toFixed(2));
    const vehiclesCleared = Math.floor(vehicleCount * 0.45) || 5;

    const newRecord: XaiDecisionRecord = {
      id: `XAI-${Math.floor(100 + Math.random() * 900)}`,
      timestamp: new Date().toISOString(),
      agentId: 'AGENT-EDGE-CP01',
      agentName: 'Connaught Place Edge RL Agent',
      tier: 'EDGE_RL',
      actionTaken: `EXTEND_${direction}_GREEN (+12s)`,
      targetJunctionId: 'J001',
      naturalLanguageReason: `Real-time RL Agent observed ${direction} queue (${vehicleCount} veh). Q(Extend Green) = +${qExtend} vs Q(Switch Phase) = +${qSwitch}. Priority phase extended by +12s to maximize throughput.`,
      metricImpact: {
        delaySavedSec: timeSaved,
        co2AvoidedKg: co2Saved,
        queueReductionVeh: vehiclesCleared,
      },
      qValues: {
        extendGreen: qExtend,
        switchPhase: qSwitch,
        emergencyPreemption: 0.0,
      },
      confidence: Number((95 + Math.random() * 4).toFixed(1)),
    };

    this.decisionHistory.unshift(newRecord);
    if (this.decisionHistory.length > 25) this.decisionHistory.pop();
    return newRecord;
  }
}

export const multiAgentSwarm = new MultiAgentSwarmEngine();
