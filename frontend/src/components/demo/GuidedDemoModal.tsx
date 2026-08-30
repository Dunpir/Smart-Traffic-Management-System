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
import { soundEffects } from '../../utils/soundEffects';

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
        'The Neo4j Spatial Graph Database and virtual Arduino HAL are active, maintaining bidirectional sync with hardware telemetry.',
      dbmsConcept:
        'Neo4j Bolt Driver maintains ACID session pooling and sub-millisecond graph query traversal.',
      targetTab: 'dashboard',
    },
    {
      stepNumber: 3,
      title: 'Automatic Density-Driven Phase Switching',
      badge: 'ADAPTIVE ALGORITHM',
      description:
        'Watch the active green signal automatically advance from the North approach to the South approach as vehicle queues are cleared.',
      dbmsConcept:
        'Dynamic weight-based scheduling: Priority score P = w1*(VehicleCount) + w2*(WaitTime) evaluated in real-time.',
      targetTab: 'dashboard',
    },
    {
      stepNumber: 4,
      title: 'Emergency Vehicle Priority Pre-emption',
      badge: 'SAFETY CRITICAL',
      description:
        'Simulate an approaching Ambulance on the West approach. All signals immediately interlock to RED while West turns GREEN.',
      dbmsConcept:
        'Emergency Pre-emption Transaction: Atomically updates signal state and logs high-priority incident into the audit graph.',
      targetTab: 'dashboard',
      actionLabel: 'Dispatch Ambulance',
      actionFn: async () => {
        soundEffects.playEmergencySiren();
        await api.triggerEmergency('WEST', 'AMBULANCE');
      },
    },
    {
      stepNumber: 5,
      title: 'Traffic Forecaster & Proactive Tuning',
      badge: 'AI PREDICTIONS',
      description:
        'Predicts traffic volumes at 15, 30, and 60-minute horizons to proactively adjust signal timing before congestion cascades.',
      dbmsConcept:
        'ARIMA and Prophet time-series forecasting over historic hourly aggregation buckets.',
      targetTab: 'forecaster',
    },
    {
      stepNumber: 6,
      title: 'ANPR Optical Enforcement & E-Challans',
      badge: 'LAW ENFORCEMENT',
      description:
        'Live optical character recognition detects red light runners and overspeeding, issuing instant digital e-challans.',
      dbmsConcept:
        'Immutable violation records stored with vehicle metadata, fine amounts, and payment transaction statuses.',
      targetTab: 'violations',
      actionLabel: 'Trigger Red Light Violation',
      actionFn: async () => {
        soundEffects.playViolationPing();
        await api.triggerViolation({ direction: 'NORTH', violationType: 'RED_LIGHT_JUMP' });
      },
    },
    {
      stepNumber: 7,
      title: 'Green Wave Multi-Junction Arterial Corridor',
      badge: 'CORRIDOR SYNC',
      description:
        'Calculates distance-based phase offsets between adjacent junctions along a major arterial corridor to maintain continuous flow.',
      dbmsConcept:
        'Path traversal queries compute offset delays: delta t = distance / velocity across sequential Junction nodes.',
      targetTab: 'corridor',
    },
    {
      stepNumber: 8,
      title: 'Neo4j Live Graph Database Schema',
      badge: 'GRAPH DBMS',
      description:
        'Inspect all Junction, Road, Sensor, Actuator, and State nodes with interactive Cypher query execution.',
      dbmsConcept:
        'Demonstrates Total & Disjoint Sensor specialization and BCNF normalization across graph entities.',
      targetTab: 'database',
    },
  ];

  if (!isOpen) return null;

  const currentStep = demoSteps[currentStepIndex];

  const handleNext = () => {
    soundEffects.playClick();
    if (currentStepIndex < demoSteps.length - 1) {
      const nextIdx = currentStepIndex + 1;
      setCurrentStepIndex(nextIdx);
      const nextStep = demoSteps[nextIdx];
      if (nextStep.targetTab) onNavigateTab(nextStep.targetTab);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    soundEffects.playClick();
    if (currentStepIndex > 0) {
      const prevIdx = currentStepIndex - 1;
      setCurrentStepIndex(prevIdx);
      const prevStep = demoSteps[prevIdx];
      if (prevStep.targetTab) onNavigateTab(prevStep.targetTab);
    }
  };

  const handleExecuteStep = async () => {
    if (currentStep.actionFn) {
      try {
        setIsExecuting(true);
        await currentStep.actionFn();
        onRefresh();
      } finally {
        setIsExecuting(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in text-slate-900 dark:text-white">
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-[#1f1f23] rounded-lg p-5 sm:p-6 shadow-xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#1f1f23]">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300">
              <Sparkles className="w-4 h-4 text-amber-500" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-semibold text-slate-500 dark:text-zinc-400 uppercase">
                DEMO TOUR • STEP {currentStep.stepNumber} OF {demoSteps.length}
              </span>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide">
                {currentStep.title}
              </h2>
            </div>
          </div>

          <button
            onClick={() => {
              soundEffects.playClick();
              onClose();
            }}
            className="w-7 h-7 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:text-zinc-400 dark:hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Progress Bar */}
        <div className="flex gap-1">
          {demoSteps.map((step, idx) => (
            <div
              key={step.stepNumber}
              onClick={() => {
                soundEffects.playClick();
                setCurrentStepIndex(idx);
                if (step.targetTab) onNavigateTab(step.targetTab);
              }}
              className={`h-1.5 flex-1 rounded-full cursor-pointer transition-all ${
                idx === currentStepIndex
                  ? 'bg-slate-900 dark:bg-white'
                  : idx < currentStepIndex
                  ? 'bg-emerald-500'
                  : 'bg-slate-200 dark:bg-zinc-800'
              }`}
            />
          ))}
        </div>

        {/* Step Details */}
        <div className="space-y-3">
          {/* Badge & Description */}
          <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-black border border-slate-200 dark:border-[#1f1f23]">
            <span className="inline-block px-1.5 py-0.2 rounded text-[10px] font-mono font-semibold bg-slate-200 dark:bg-zinc-900 text-slate-800 dark:text-zinc-300 border border-slate-300 dark:border-zinc-800 mb-1.5">
              {currentStep.badge}
            </span>
            <p className="text-xs text-slate-700 dark:text-zinc-300 leading-relaxed font-sans">
              {currentStep.description}
            </p>
          </div>

          {/* DBMS & Theoretical Concept Highlight */}
          <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-black border border-slate-200 dark:border-[#1f1f23]">
            <div className="flex items-center gap-1.5 text-xs font-mono font-semibold text-slate-900 dark:text-white uppercase mb-1">
              <Database className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />
              <span>DBMS &amp; Graph Architecture Concept</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-zinc-400 font-mono leading-relaxed">
              {currentStep.dbmsConcept}
            </p>
          </div>
        </div>

        {/* Action Controls & Navigation Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-[#1f1f23]">
          <button
            onClick={handlePrev}
            disabled={currentStepIndex === 0}
            className="flex items-center gap-1 px-3 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:text-zinc-300 dark:hover:text-white dark:border-zinc-800 font-mono text-xs font-semibold disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>PREV</span>
          </button>

          <div className="flex items-center gap-2">
            {currentStep.actionLabel && (
              <button
                onClick={handleExecuteStep}
                disabled={isExecuting}
                className="flex items-center gap-1 px-3 py-1.5 rounded bg-amber-500 hover:bg-amber-600 text-white font-mono text-xs font-bold transition cursor-pointer shadow-xs"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>{currentStep.actionLabel}</span>
              </button>
            )}

            <button
              onClick={handleNext}
              className="flex items-center gap-1 px-4 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-black font-mono text-xs font-bold shadow-xs transition cursor-pointer"
            >
              <span>{currentStepIndex === demoSteps.length - 1 ? 'FINISH TOUR' : 'NEXT STEP'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
