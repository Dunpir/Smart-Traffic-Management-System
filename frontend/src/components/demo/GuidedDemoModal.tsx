import React, { useState } from 'react';
import {
  Sparkles,
  ChevronRight,
  ChevronLeft,
  X,
  Play,
  RotateCcw,
  CheckCircle2,
  Database,
  Cpu,
  Flame,
  Siren,
  ShieldCheck,
} from 'lucide-react';
import { api } from '../../services/api';
import { NavTab } from '../layout/Sidebar';

interface GuidedDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: NavTab) => void;
  onRefresh: () => void;
}

interface DemoStep {
  stepNumber: number;
  title: string;
  badge: string;
  description: string;
  dbmsConcept: string;
  actionLabel?: string;
  actionFn?: () => Promise<void>;
  targetTab?: NavTab;
}

export const GuidedDemoModal: React.FC<GuidedDemoModalProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
  onRefresh,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);

  const demoSteps: DemoStep[] = [
    {
      stepNumber: 1,
      title: 'Central Command Center Initialization',
      badge: 'SYSTEM OVERVIEW',
      description:
        'The Intelligent Traffic Signal Controller boots as the central middleware. Notice the 4-way intersection (North, South, East, West) with dedicated Camera & IR Sensors.',
      dbmsConcept:
        'EER Schema initialization: 1 Junction entity related to 4 Road entities via (1:N) HAS_ROAD relationship.',
      targetTab: 'dashboard',
    },
    {
      stepNumber: 2,
      title: 'Status Verification: Database & Hardware Bridge',
      badge: 'CONNECTIVITY',
      description:
        'Observe the top telemetry bar: SYSTEM ONLINE, NEO4J status (Graph Database), and ARDUINO/SIMULATION status. The middleware reports genuine status without faking.',
      dbmsConcept:
        'Neo4j Bolt connection verification: executes `driver.verifyConnectivity()` with latency telemetry.',
      targetTab: 'dashboard',
    },
    {
      stepNumber: 3,
      title: 'Start Simulation Engine',
      badge: 'HARDWARE API',
      description:
        'Engage the background simulation engine. The simulator utilizes the EXACT same REST endpoints (`/api/hardware/sensor-data`) that physical Arduino hardware uses.',
      dbmsConcept:
        'Sensor Ingestion Pipeline: Streams time-series telemetry from edge sensors to the controller and database.',
      actionLabel: 'Start Simulation',
      actionFn: async () => {
        await api.startSimulation();
      },
      targetTab: 'dashboard',
    },
    {
      stepNumber: 4,
      title: 'Live Sensor Telemetry Ingestion',
      badge: 'EDGE TELEMETRY',
      description:
        'Vehicle counts start streaming in from Optical AI Cameras (C001-C004) and stop-line IR sensors (IR001-IR004). Road telemetry cards update in real-time over WebSockets.',
      dbmsConcept:
        'Sensor Superclass specialization (Total & Disjoint): Camera records vehicle counts; IRSensor records stop-line beam breaks.',
      targetTab: 'dashboard',
    },
    {
      stepNumber: 5,
      title: 'Inject Congestion Surge on West Road',
      badge: 'TRAFFIC SURGE',
      description:
        'Simulate sudden heavy traffic on West Expressway. The camera counts 36 vehicles, pushing the density level to VERY HIGH and triggering the IR occupancy sensor.',
      dbmsConcept:
        'VehicleCount Entity Ingestion: `(:Camera {sensorId:"C004"})-[:RECORDED_COUNT]->(:VehicleCount {count: 36, density:"VERY HIGH"})`.',
      actionLabel: 'Inject West Road Congestion',
      actionFn: async () => {
        await api.triggerSpike('WEST', 36);
      },
      targetTab: 'dashboard',
    },
    {
      stepNumber: 6,
      title: 'Rule-Based Controller Evaluation',
      badge: 'DECISION ENGINE',
      description:
        'The transparent rule-based traffic engine analyzes the surge. It dynamically evaluates the 4-way density and recalculates optimal phase durations without black-box AI.',
      dbmsConcept:
        'Rule-Based Algorithm: Low (<10 veh) -> 15s | Med (10-20) -> 28s | High (21-35) -> 42s | Very High (>35) -> 58s.',
      targetTab: 'dashboard',
    },
    {
      stepNumber: 7,
      title: 'Dynamic Green Time Allocation',
      badge: 'DYNAMIC TIMING',
      description:
        'West Road recommended green duration is automatically extended from 30 seconds to 48+ seconds to flush the heavy vehicle queue.',
      dbmsConcept:
        'SignalTiming Entity Creation: `(:Signal {signalId:"SIG004"})-[:HAS_TIMING]->(:SignalTiming {greenDuration:48, reason:"Very High Density"})`.',
      targetTab: 'dashboard',
    },
    {
      stepNumber: 8,
      title: 'Junction Signal Actuation',
      badge: 'ACTUATION',
      description:
        'The signal state machine safely cycles: YELLOW (3s) -> ALL-RED clearance (2s) -> WEST ROAD GREEN. Actuator command is dispatched to Arduino LEDs (Pins D11-D13).',
      dbmsConcept:
        'State persistence: Updates `Signal.currentLightState` in Neo4j with timestamp.',
      targetTab: 'dashboard',
    },
    {
      stepNumber: 9,
      title: 'Graph Database Verification (Neo4j Explorer)',
      badge: 'NEO4J AUDIT',
      description:
        'Navigate to the Neo4j Database Explorer. Notice the live graph visualization showing Junction -> Road -> Camera -> VehicleCount and Signal -> SignalTiming.',
      dbmsConcept:
        'Graph Traversal & Cypher query execution: `MATCH (j:Junction)-[:HAS_ROAD]->(r)-[:HAS_CAMERA]->(c)-[:RECORDED_COUNT]->(vc) RETURN ...`',
      targetTab: 'database',
    },
    {
      stepNumber: 10,
      title: 'Emergency Priority Pre-emption: Ambulance Detected',
      badge: 'EMERGENCY INGEST',
      description:
        'An emergency vehicle (Ambulance) is detected on East Highway. The system triggers high-priority pre-emption mode.',
      dbmsConcept:
        'EmergencyEvent Entity: `(:Sensor)-[:DETECTED_EMERGENCY]->(:EmergencyEvent)-[:AFFECTS_JUNCTION]->(:Junction)`.',
      actionLabel: 'Inject Ambulance on East Road',
      actionFn: async () => {
        await api.triggerEmergency('EAST', 'AMBULANCE');
      },
      targetTab: 'dashboard',
    },
    {
      stepNumber: 11,
      title: 'Emergency Priority HUD & Pre-emption Corridor',
      badge: 'PRE-EMPTION',
      description:
        'The emergency banner flashes across the screen. The controller instantly terminates opposing phases with safe yellow clearance and grants priority GREEN to East Road.',
      dbmsConcept:
        'High-Priority Transaction & Audit Trail committed with priority level CRITICAL.',
      targetTab: 'dashboard',
    },
    {
      stepNumber: 12,
      title: 'Hardware Actuator Lockout',
      badge: 'SAFETY INTERLOCK',
      description:
        'All conflicting approaches (North, South, West) are locked to RED. Actuator commands are confirmed on Arduino channels.',
      dbmsConcept:
        'Integrity Constraint: Conflicting green signals prevented by safety interlock layer.',
      targetTab: 'controller',
    },
    {
      stepNumber: 13,
      title: 'Emergency Audit Record in Database',
      badge: 'DATABASE AUDIT',
      description:
        'Inspect the Database Events stream. The Emergency Event, sensor trigger ID, affected junction, and priority timing override are permanently recorded in Neo4j.',
      dbmsConcept:
        'Relational BCNF mapping & Graph multi-node relationship persistence.',
      targetTab: 'database',
    },
    {
      stepNumber: 14,
      title: 'Safe Corridor Release & Return to Normal Cycle',
      badge: 'CYCLE RECOVERY',
      description:
        'Clear the emergency corridor. The controller resumes normal rule-based adaptive traffic signal scheduling across the 4-way junction.',
      dbmsConcept:
        'Complete DBMS Mini-Project Demonstration successfully finished.',
      actionLabel: 'Clear Emergency & Resume Normal Cycle',
      actionFn: async () => {
        await api.resolveEmergency();
      },
      targetTab: 'dashboard',
    },
  ];

  if (!isOpen) return null;

  const currentStep = demoSteps[currentStepIndex];

  const handleExecuteStep = async () => {
    try {
      setIsExecuting(true);
      if (currentStep.actionFn) {
        await currentStep.actionFn();
      }
      if (currentStep.targetTab) {
        onNavigateTab(currentStep.targetTab);
      }
      onRefresh();
    } catch (e) {
      console.error('Demo step error', e);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleNext = async () => {
    if (currentStep.actionFn) {
      await handleExecuteStep();
    } else if (currentStep.targetTab) {
      onNavigateTab(currentStep.targetTab);
    }

    if (currentStepIndex < demoSteps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
      const nextStep = demoSteps[currentStepIndex + 1];
      if (nextStep.targetTab) {
        onNavigateTab(nextStep.targetTab);
      }
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
      const prevStep = demoSteps[currentStepIndex - 1];
      if (prevStep.targetTab) {
        onNavigateTab(prevStep.targetTab);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-[#0a1020] border-2 border-cyan-500/50 rounded-3xl p-6 shadow-2xl shadow-cyan-950/80">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-300">
              <Sparkles className="w-5 h-5 text-yellow-300" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold tracking-widest text-cyan-400 uppercase">
                ACADEMIC DEMO MODE • STEP {currentStep.stepNumber} OF {demoSteps.length}
              </span>
              <h2 className="text-base font-bold text-white uppercase tracking-wide">
                {currentStep.title}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress Bar */}
        <div className="flex gap-1 mb-5">
          {demoSteps.map((step, idx) => (
            <div
              key={step.stepNumber}
              onClick={() => {
                setCurrentStepIndex(idx);
                if (step.targetTab) onNavigateTab(step.targetTab);
              }}
              className={`h-1.5 flex-1 rounded-full cursor-pointer transition-all ${
                idx === currentStepIndex
                  ? 'bg-cyan-400 shadow-md shadow-cyan-400/50'
                  : idx < currentStepIndex
                  ? 'bg-emerald-500'
                  : 'bg-slate-800'
              }`}
            />
          ))}
        </div>

        {/* Step Details */}
        <div className="space-y-4 mb-6">
          {/* Badge & Description */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800 mb-2">
              {currentStep.badge}
            </span>
            <p className="text-sm text-slate-200 leading-relaxed font-sans">
              {currentStep.description}
            </p>
          </div>

          {/* DBMS & Theoretical Concept Highlight */}
          <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-800/40">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-indigo-300 uppercase tracking-wider mb-1">
              <Database className="w-3.5 h-3.5 text-indigo-400" />
              <span>DBMS &amp; Graph Architecture Concept</span>
            </div>
            <p className="text-xs text-indigo-200/90 font-mono leading-relaxed">
              {currentStep.dbmsConcept}
            </p>
          </div>
        </div>

        {/* Action Controls & Navigation Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <button
            onClick={handlePrev}
            disabled={currentStepIndex === 0}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-mono text-xs font-semibold disabled:opacity-30 disabled:pointer-events-none transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>PREVIOUS</span>
          </button>

          <div className="flex items-center gap-2">
            {currentStep.actionLabel && (
              <button
                onClick={handleExecuteStep}
                disabled={isExecuting}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-mono text-xs font-bold shadow-md shadow-orange-950/50 transition-all active:scale-95"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{currentStep.actionLabel}</span>
              </button>
            )}

            <button
              onClick={handleNext}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-mono text-xs font-bold shadow-lg shadow-cyan-950/60 border border-cyan-400/30 transition-all active:scale-95"
            >
              <span>{currentStepIndex === demoSteps.length - 1 ? 'FINISH TOUR' : 'NEXT STEP'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
