import React from 'react';
import {
  Network,
  Database,
  Cpu,
  Layers,
  CheckCircle2,
  FileText,
  ShieldAlert,
  Sliders,
  Code2,
} from 'lucide-react';

export const ArchitectureDbmsPage: React.FC = () => {
  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12 text-slate-900 dark:text-white transition-colors">
      {/* Header Banner */}
      <div className="bg-white/90 dark:bg-[#0a0a0a]/75 backdrop-blur-md p-4 sm:p-5 rounded-lg border border-slate-200 dark:border-[#1f1f23]/80 hover:border-slate-300 dark:hover:border-[#333338] shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 flex items-center justify-center shrink-0">
            <Network className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider">
              System Architecture &amp; DBMS Theoretical Model
            </h1>
            <p className="text-xs text-slate-500 dark:text-zinc-400 font-sans mt-0.5">
              Complete conceptual model, Sensor specialization hierarchy (Total &amp; Disjoint), BCNF normalization proofs, and Neo4j graph model.
            </p>
          </div>
        </div>
      </div>

      {/* 1. End-to-End System Architecture Flowchart */}
      <div className="bg-white/90 dark:bg-[#0a0a0a]/75 backdrop-blur-md p-4 sm:p-5 rounded-lg border border-slate-200 dark:border-[#1f1f23]/80 hover:border-slate-300 dark:hover:border-[#333338] shadow-xs">
        <h3 className="text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2">
          <Layers className="w-4 h-4 text-slate-500 dark:text-zinc-400" />
          <span>Hardware ↔ Database Bridge Architecture</span>
        </h3>

        <div className="p-3.5 rounded bg-slate-950 border border-slate-800 font-mono text-xs text-emerald-400 overflow-x-auto leading-relaxed">
          <pre>
{`
               OPTICAL CAMERA (C001-C004)       IR BEAM SENSORS (IR001-IR004)
               [Vehicle Counting & AI Edge]     [Stop-Line Queue Occupancy]
                             \\                     /
                              \\                   /
                       ┌─────────────────────────────────┐
                       │  ARDUINO UNO / MEGA CONTROLLER  │
                       │  (Digital Inputs & Edge Serial) │
                       └────────────────┬────────────────┘
                                        │ POST /api/hardware/sensor-data
                                        │ POST /api/hardware/emergency
                                        ▼
      ┌───────────────────────────────────────────────────────────────────┐
      │                  NODE.JS / EXPRESS BACKEND SERVER                 │
      │                                                                   │
      │   ┌───────────────────────┐      ┌────────────────────────────┐   │
      │   │  Hardware Adapter     │      │ Rule-Based Decision Engine │   │
      │   │  & Sensor Validation  │      │ & Emergency Pre-emption    │   │
      │   └───────────┬───────────┘      └────────────┬───────────────┘   │
      │               │                               │                   │
      │               ▼                               ▼                   │
      │   ┌───────────────────────────────────────────────────────────┐   │
      │   │  Neo4j Service Layer (Cypher Transactions & Ingest)       │   │
      │   └─────────────────────────────┬─────────────────────────────┘   │
      │                                 │                                 │
      │                                 ▼                                 │
      │   ┌───────────────────────────────────────────────────────────┐   │
      │   │  WebSocket Gateway (Real-Time Socket.IO Telemetry Engine) │   │
      │   └─────────────────────────────┬─────────────────────────────┘   │
      └─────────────────────────────────┼─────────────────────────────────┘
                                        │
                         ┌──────────────┴──────────────┐
                         │                             │
                         ▼                             ▼
        ┌────────────────────────────────┐   ┌─────────────────────────────────┐
        │   ACTUATOR HARDWARE (ARDUINO)  │   │     REACT CONTROL ROOM UI       │
        │   12 Digital Output Channels   │   │  • Live 4-Way Junction Visualizer│
        │   (Red, Yellow, Green LEDs)    │   │  • Signal Controller & Overrides │
        │                                │   │  • Neo4j Graph Database Explorer│
        └────────────────────────────────┘   └─────────────────────────────────┘
`}
          </pre>
        </div>
      </div>

      {/* 2. Conceptual EER Model & Sensor Specialization */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Sensor Specialization Analysis */}
        <div className="bg-white/90 dark:bg-[#0a0a0a]/75 backdrop-blur-md p-4 sm:p-5 rounded-lg border border-slate-200 dark:border-[#1f1f23]/80 hover:border-slate-300 dark:hover:border-[#333338] shadow-xs">
          <h3 className="text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-slate-500 dark:text-zinc-400" />
            <span>Sensor Specialization (Superclass / Subclass)</span>
          </h3>

          <div className="p-3 rounded bg-slate-50 dark:bg-black border border-slate-200 dark:border-[#1f1f23] text-xs font-mono space-y-2.5">
            <div>
              <span className="font-bold text-slate-900 dark:text-white block mb-0.5">
                1. Total Specialization Constraint
              </span>
              <p className="text-slate-600 dark:text-zinc-400">
                Every sensor instance in the <strong>Sensor</strong> superclass MUST belong to at least one subclass (<strong>Camera</strong> or <strong>IRSensor</strong>). No unclassified sensor entity is allowed.
              </p>
            </div>

            <div>
              <span className="font-bold text-slate-900 dark:text-white block mb-0.5">
                2. Disjoint Constraint
              </span>
              <p className="text-slate-600 dark:text-zinc-400">
                A physical sensor can ONLY be either an optical Camera OR an IR beam sensor, never simultaneously both.
              </p>
            </div>
          </div>
        </div>

        {/* BCNF Decomposition Proof */}
        <div className="bg-white/90 dark:bg-[#0a0a0a]/75 backdrop-blur-md p-4 sm:p-5 rounded-lg border border-slate-200 dark:border-[#1f1f23]/80 hover:border-slate-300 dark:hover:border-[#333338] shadow-xs">
          <h3 className="text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Boyce-Codd Normal Form (BCNF) Proof</span>
          </h3>

          <div className="p-3 rounded bg-slate-50 dark:bg-black border border-slate-200 dark:border-[#1f1f23] text-xs font-mono space-y-2.5">
            <div>
              <span className="font-bold text-slate-900 dark:text-white block mb-0.5">
                Definition of BCNF
              </span>
              <p className="text-slate-600 dark:text-zinc-400">
                For every non-trivial functional dependency <code>X → Y</code>, <code>X</code> must be a superkey.
              </p>
            </div>

            <div>
              <span className="font-bold text-slate-900 dark:text-white block mb-0.5">
                Normalized Relations
              </span>
              <p className="text-slate-600 dark:text-zinc-400">
                Eliminates update, insertion, and deletion anomalies across Junction, Road, Sensor, Actuator, and Signal State entities.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
