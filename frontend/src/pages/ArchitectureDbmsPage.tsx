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
    <div className="space-y-6 max-w-7xl mx-auto pb-8">
      {/* Header Banner */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-2">
          <Network className="w-5 h-5 text-cyan-400" />
          <h2 className="text-lg font-bold text-white uppercase tracking-wider">
            System Architecture &amp; DBMS Theoretical Model
          </h2>
        </div>
        <p className="text-xs text-slate-400 font-mono mt-1">
          Complete conceptual model, Sensor specialization hierarchy (Total &amp; Disjoint), BCNF normalization proofs, and Neo4j graph model.
        </p>
      </div>

      {/* 1. End-to-End System Architecture Flowchart */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800">
        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wide mb-4 flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span>End-to-End Hardware ↔ Database Bridge Architecture</span>
        </h3>

        <div className="p-4 rounded-xl bg-black/80 border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto leading-relaxed">
          <pre className="text-cyan-300">
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sensor Specialization Analysis */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wide mb-3 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-amber-400" />
            <span>Sensor Specialization (Superclass / Subclass)</span>
          </h3>

          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-mono text-slate-300 space-y-3">
            <div>
              <span className="text-amber-400 font-bold block mb-1">
                1. Total Specialization Constraint (Double Line)
              </span>
              <p className="text-slate-400">
                Every sensor instance in the <strong className="text-white">Sensor</strong> superclass MUST belong to at least one subclass (<strong className="text-white">Camera</strong> or <strong className="text-white">IRSensor</strong>). No unclassified sensor entity is allowed.
              </p>
            </div>

            <div>
              <span className="text-cyan-400 font-bold block mb-1">
                2. Disjoint Specialization Constraint (d)
              </span>
              <p className="text-slate-400">
                An entity in <strong className="text-white">Sensor</strong> can belong to AT MOST ONE subclass. A camera cannot simultaneously be an IR sensor.
              </p>
            </div>

            <div className="p-2.5 rounded-lg bg-black/60 border border-slate-800 text-[11px] text-cyan-300">
              <code>Sensor = Camera ∪ IRSensor, and Camera ∩ IRSensor = ∅</code>
            </div>
          </div>
        </div>

        {/* BCNF Normalization Proofs */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wide mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Boyce-Codd Normal Form (BCNF) Analysis</span>
          </h3>

          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-mono text-slate-300 space-y-2.5">
            <p className="text-slate-400">
              A relation R is in BCNF if for every Functional Dependency <strong className="text-white">X → Y</strong>, <strong className="text-white">X</strong> is a superkey of R.
            </p>

            <ul className="space-y-1.5 text-[11px] text-slate-300">
              <li>• <strong className="text-cyan-400">Junction</strong>: <code>junctionId → name, location, status</code> (Key: junctionId)</li>
              <li>• <strong className="text-blue-400">Road</strong>: <code>roadId → junctionId, name, direction, speedLimit, lanes</code> (Key: roadId)</li>
              <li>• <strong className="text-red-400">Camera</strong>: <code>sensorId → resolution, fps, model</code> (Key: sensorId)</li>
              <li>• <strong className="text-amber-400">IRSensor</strong>: <code>sensorId → rangeCm, detectionSensitivity, pin</code> (Key: sensorId)</li>
              <li>• <strong className="text-teal-400">SignalTiming</strong>: <code>timingId → signalId, greenDuration, reason</code> (Key: timingId)</li>
            </ul>

            <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-800 text-[11px] text-emerald-300 font-semibold">
              All 9 conceptual relations satisfy BCNF with zero anomalies.
            </div>
          </div>
        </div>
      </div>

      {/* 3. Entity-Relationship Cardinality Matrix */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800">
        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wide mb-3 flex items-center gap-2">
          <Database className="w-4 h-4 text-cyan-400" />
          <span>Entity-Relationship Cardinality &amp; Multiplicity Table</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono text-left">
            <thead>
              <tr className="text-slate-400 border-b border-slate-800 pb-2">
                <th className="py-2">Entity 1</th>
                <th className="py-2">Relationship</th>
                <th className="py-2">Entity 2</th>
                <th className="py-2">Cardinality</th>
                <th className="py-2">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              <tr>
                <td className="py-2 font-bold text-cyan-300">Junction</td>
                <td className="py-2 text-slate-400">HAS_ROAD</td>
                <td className="py-2 font-bold text-blue-300">Road</td>
                <td className="py-2 text-cyan-400 font-bold">1 : 4 (1 : N)</td>
                <td className="py-2 text-slate-400">Junction connects 4 approach roads</td>
              </tr>
              <tr>
                <td className="py-2 font-bold text-blue-300">Road</td>
                <td className="py-2 text-slate-400">HAS_CAMERA</td>
                <td className="py-2 font-bold text-red-300">Camera</td>
                <td className="py-2 text-cyan-400 font-bold">1 : 1</td>
                <td className="py-2 text-slate-400">Dedicated optical AI camera per road</td>
              </tr>
              <tr>
                <td className="py-2 font-bold text-blue-300">Road</td>
                <td className="py-2 text-slate-400">HAS_IR_SENSOR</td>
                <td className="py-2 font-bold text-amber-300">IRSensor</td>
                <td className="py-2 text-cyan-400 font-bold">1 : 1</td>
                <td className="py-2 text-slate-400">Stop-line presence beam sensor per road</td>
              </tr>
              <tr>
                <td className="py-2 font-bold text-red-300">Camera</td>
                <td className="py-2 text-slate-400">RECORDED_COUNT</td>
                <td className="py-2 font-bold text-slate-200">VehicleCount</td>
                <td className="py-2 text-cyan-400 font-bold">1 : N</td>
                <td className="py-2 text-slate-400">Continuous queue density observations</td>
              </tr>
              <tr>
                <td className="py-2 font-bold text-cyan-300">Junction</td>
                <td className="py-2 text-slate-400">CONTROLS_SIGNAL</td>
                <td className="py-2 font-bold text-emerald-300">Signal</td>
                <td className="py-2 text-cyan-400 font-bold">1 : 4 (1 : N)</td>
                <td className="py-2 text-slate-400">Junction coordinates 4 traffic signals</td>
              </tr>
              <tr>
                <td className="py-2 font-bold text-emerald-300">Signal</td>
                <td className="py-2 text-slate-400">HAS_TIMING</td>
                <td className="py-2 font-bold text-teal-300">SignalTiming</td>
                <td className="py-2 text-cyan-400 font-bold">1 : N</td>
                <td className="py-2 text-slate-400">Dynamic phase timing decisions</td>
              </tr>
              <tr>
                <td className="py-2 font-bold text-amber-300">Sensor</td>
                <td className="py-2 text-slate-400">DETECTED_EMERGENCY</td>
                <td className="py-2 font-bold text-rose-300">EmergencyEvent</td>
                <td className="py-2 text-cyan-400 font-bold">1 : N</td>
                <td className="py-2 text-slate-400">High-priority pre-emption events</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
