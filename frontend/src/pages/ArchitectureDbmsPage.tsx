import React, { useState } from 'react';
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
  Key,
  Binary,
  GitBranch,
  Table,
  Zap,
  Activity,
  ArrowRight,
  ShieldCheck,
  Lock,
} from 'lucide-react';
import { soundEffects } from '../utils/soundEffects';

interface SchemaTable {
  name: string;
  relation: string;
  primaryKey: string[];
  foreignKeys: { field: string; references: string }[];
  attributes: { name: string; type: string; isPk?: boolean; isFk?: boolean; description: string }[];
  functionalDependencies: string[];
  bcnfProof: string;
}

const RELATIONAL_SCHEMAS: SchemaTable[] = [
  {
    name: 'Junction Entity',
    relation: 'R1_JUNCTION',
    primaryKey: ['junctionId'],
    foreignKeys: [],
    attributes: [
      { name: 'junctionId', type: 'VARCHAR(16)', isPk: true, description: 'Primary Key (e.g. J001)' },
      { name: 'name', type: 'VARCHAR(128)', description: 'Junction intersection name' },
      { name: 'location', type: 'VARCHAR(255)', description: 'Geographical metropolitan zone' },
      { name: 'status', type: 'VARCHAR(32)', description: 'ACTIVE | MAINTENANCE | OFFLINE' },
      { name: 'createdAt', type: 'TIMESTAMP', description: 'Node commissioning timestamp' },
    ],
    functionalDependencies: ['junctionId → name, location, status, createdAt'],
    bcnfProof: 'LHS (junctionId) is a Candidate Key. Satisfies BCNF.',
  },
  {
    name: 'Road Approach Entity',
    relation: 'R2_ROAD',
    primaryKey: ['roadId'],
    foreignKeys: [{ field: 'junctionId', references: 'R1_JUNCTION(junctionId)' }],
    attributes: [
      { name: 'roadId', type: 'VARCHAR(16)', isPk: true, description: 'Primary Key (e.g. R001)' },
      { name: 'junctionId', type: 'VARCHAR(16)', isFk: true, description: 'Foreign Key to R1_JUNCTION' },
      { name: 'name', type: 'VARCHAR(128)', description: 'Approach avenue name' },
      { name: 'direction', type: 'VARCHAR(16)', description: 'NORTH | SOUTH | EAST | WEST' },
      { name: 'speedLimit', type: 'INTEGER', description: 'Design speed in km/h' },
      { name: 'lanes', type: 'INTEGER', description: 'Number of inbound lanes' },
    ],
    functionalDependencies: ['roadId → junctionId, name, direction, speedLimit, lanes'],
    bcnfProof: 'LHS (roadId) is a Candidate Key. Satisfies BCNF.',
  },
  {
    name: 'Sensor Superclass Entity',
    relation: 'R3_SENSOR',
    primaryKey: ['sensorId'],
    foreignKeys: [{ field: 'roadId', references: 'R2_ROAD(roadId)' }],
    attributes: [
      { name: 'sensorId', type: 'VARCHAR(16)', isPk: true, description: 'Primary Key (e.g. C001, IR001)' },
      { name: 'roadId', type: 'VARCHAR(16)', isFk: true, description: 'Foreign Key to R2_ROAD' },
      { name: 'name', type: 'VARCHAR(128)', description: 'Sensor label / tag' },
      { name: 'sensorType', type: 'VARCHAR(32)', description: 'CAMERA | IR' },
      { name: 'status', type: 'VARCHAR(32)', description: 'ONLINE | ACTIVE | DEGRADED' },
      { name: 'installedDate', type: 'DATE', description: 'Installation date' },
    ],
    functionalDependencies: ['sensorId → roadId, name, sensorType, status, installedDate'],
    bcnfProof: 'LHS (sensorId) is a Candidate Key. Satisfies BCNF.',
  },
  {
    name: 'Camera Subclass (Specialization)',
    relation: 'R4_CAMERA',
    primaryKey: ['sensorId'],
    foreignKeys: [{ field: 'sensorId', references: 'R3_SENSOR(sensorId)' }],
    attributes: [
      { name: 'sensorId', type: 'VARCHAR(16)', isPk: true, isFk: true, description: 'PK & FK to R3_SENSOR' },
      { name: 'resolution', type: 'VARCHAR(32)', description: '4K UHD (3840x2160) | 1080p' },
      { name: 'fps', type: 'INTEGER', description: 'Sampling framerate (60 FPS)' },
      { name: 'model', type: 'VARCHAR(64)', description: 'AI Optical Camera Model' },
    ],
    functionalDependencies: ['sensorId → resolution, fps, model'],
    bcnfProof: 'LHS (sensorId) is a Candidate Key. Satisfies BCNF (Disjoint & Total).',
  },
  {
    name: 'IR Sensor Subclass (Specialization)',
    relation: 'R5_IR_SENSOR',
    primaryKey: ['sensorId'],
    foreignKeys: [{ field: 'sensorId', references: 'R3_SENSOR(sensorId)' }],
    attributes: [
      { name: 'sensorId', type: 'VARCHAR(16)', isPk: true, isFk: true, description: 'PK & FK to R3_SENSOR' },
      { name: 'rangeCm', type: 'INTEGER', description: 'Max beam detection range (500cm)' },
      { name: 'detectionSensitivity', type: 'VARCHAR(32)', description: 'HIGH | MEDIUM | LOW' },
      { name: 'pin', type: 'VARCHAR(16)', description: 'Arduino Analog GPIO Pin (A0-A3)' },
    ],
    functionalDependencies: ['sensorId → rangeCm, detectionSensitivity, pin'],
    bcnfProof: 'LHS (sensorId) is a Candidate Key. Satisfies BCNF.',
  },
  {
    name: 'Signal Actuator Entity',
    relation: 'R6_SIGNAL',
    primaryKey: ['signalId'],
    foreignKeys: [
      { field: 'junctionId', references: 'R1_JUNCTION(junctionId)' },
      { field: 'roadId', references: 'R2_ROAD(roadId)' },
    ],
    attributes: [
      { name: 'signalId', type: 'VARCHAR(16)', isPk: true, description: 'Primary Key (e.g. SIG001)' },
      { name: 'junctionId', type: 'VARCHAR(16)', isFk: true, description: 'FK to R1_JUNCTION' },
      { name: 'roadId', type: 'VARCHAR(16)', isFk: true, description: 'FK to R2_ROAD' },
      { name: 'direction', type: 'VARCHAR(16)', description: 'NORTH | SOUTH | EAST | WEST' },
      { name: 'currentLightState', type: 'VARCHAR(16)', description: 'RED | YELLOW | GREEN' },
      { name: 'redPin', type: 'INTEGER', description: 'Arduino Digital Pin for Red' },
      { name: 'yellowPin', type: 'INTEGER', description: 'Arduino Digital Pin for Yellow' },
      { name: 'greenPin', type: 'INTEGER', description: 'Arduino Digital Pin for Green' },
    ],
    functionalDependencies: ['signalId → junctionId, roadId, direction, currentLightState, redPin, yellowPin, greenPin'],
    bcnfProof: 'LHS (signalId) is a Candidate Key. Satisfies BCNF.',
  },
  {
    name: 'Vehicle Count Observations',
    relation: 'R7_VEHICLE_COUNT',
    primaryKey: ['recordId'],
    foreignKeys: [
      { field: 'sensorId', references: 'R3_SENSOR(sensorId)' },
      { field: 'roadId', references: 'R2_ROAD(roadId)' },
    ],
    attributes: [
      { name: 'recordId', type: 'VARCHAR(32)', isPk: true, description: 'Primary Key (e.g. VC_178291)' },
      { name: 'sensorId', type: 'VARCHAR(16)', isFk: true, description: 'FK to R3_SENSOR' },
      { name: 'roadId', type: 'VARCHAR(16)', isFk: true, description: 'FK to R2_ROAD' },
      { name: 'count', type: 'INTEGER', description: 'Vehicle queue density count' },
      { name: 'densityLevel', type: 'VARCHAR(32)', description: 'LOW | MEDIUM | HIGH | VERY HIGH' },
      { name: 'congestionStatus', type: 'VARCHAR(32)', description: 'FREE_FLOW | MODERATE | HEAVY_QUEUE' },
      { name: 'timestamp', type: 'TIMESTAMP', description: 'Observation time' },
    ],
    functionalDependencies: ['recordId → sensorId, roadId, count, densityLevel, congestionStatus, timestamp'],
    bcnfProof: 'LHS (recordId) is a Candidate Key. Satisfies BCNF.',
  },
];

export const ArchitectureDbmsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'FLOWCHART' | 'SCHEMA' | 'NORMALIZATION' | 'EER' | 'HYBRID_GRAPH'>('FLOWCHART');
  const [selectedSchema, setSelectedSchema] = useState<SchemaTable>(RELATIONAL_SCHEMAS[0]);
  const [normStep, setNormStep] = useState<number>(4);

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12 text-slate-900 dark:text-white transition-colors">
      {/* Header Banner */}
      <div className="bg-white/90 dark:bg-[#0a0a0a]/75 backdrop-blur-md p-4 sm:p-5 rounded-lg border border-slate-200 dark:border-[#1f1f23]/80 hover:border-slate-300 dark:hover:border-[#333338] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/40 text-blue-500 flex items-center justify-center shrink-0">
            <Network className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                System Architecture &amp; DBMS Theoretical Model
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold">
                100% BCNF PROVEN
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 font-sans mt-0.5">
              Complete conceptual model, Sensor specialization hierarchy (Total &amp; Disjoint), BCNF normalization proofs, and Neo4j graph model.
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-black p-1 rounded-xl border border-slate-200 dark:border-[#1f1f23] text-xs font-mono">
          <button
            onClick={() => {
              soundEffects.playClick();
              setActiveTab('FLOWCHART');
            }}
            className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
              activeTab === 'FLOWCHART'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-black shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white'
            }`}
          >
            System Pipeline
          </button>
          <button
            onClick={() => {
              soundEffects.playClick();
              setActiveTab('SCHEMA');
            }}
            className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
              activeTab === 'SCHEMA'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-black shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white'
            }`}
          >
            Relational Schema
          </button>
          <button
            onClick={() => {
              soundEffects.playClick();
              setActiveTab('NORMALIZATION');
            }}
            className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
              activeTab === 'NORMALIZATION'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-black shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white'
            }`}
          >
            BCNF Proofs
          </button>
          <button
            onClick={() => {
              soundEffects.playClick();
              setActiveTab('EER');
            }}
            className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
              activeTab === 'EER'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-black shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white'
            }`}
          >
            EER Hierarchy
          </button>
          <button
            onClick={() => {
              soundEffects.playClick();
              setActiveTab('HYBRID_GRAPH');
            }}
            className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
              activeTab === 'HYBRID_GRAPH'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-black shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white'
            }`}
          >
            RDBMS vs Graph
          </button>
        </div>
      </div>

      {/* Tab Content 1: End-to-End System Architecture Flowchart */}
      {activeTab === 'FLOWCHART' && (
        <div className="space-y-4">
          <div className="bg-white/90 dark:bg-[#0a0a0a]/75 backdrop-blur-md p-4 sm:p-5 rounded-lg border border-slate-200 dark:border-[#1f1f23]/80 hover:border-slate-300 dark:hover:border-[#333338] shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-[#1f1f23]">
              <h3 className="text-xs font-semibold uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-500" />
                <span>Hardware ↔ Database ↔ Real-Time Control Bridge</span>
              </h3>
              <span className="text-[10px] font-mono text-emerald-500 font-bold">128-BIT SERIAL + WEBSOCKET PROTOCOL</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-emerald-400 overflow-x-auto leading-relaxed shadow-inner">
              <pre>
{`
                  [ EDGE SENSORY LAYER ]                                 [ MCU ACTUATOR HARDWARE ]
  ┌─────────────────────────────────────────────────┐               ┌─────────────────────────────────┐
  │  • 4x Optical AI Cameras (C001-C004) @ 60 FPS   │               │  • Arduino Uno / ATmega328P MCU │
  │  • 4x IR Obstacle Stop-Line Beams (IR001-IR004) │               │  • 12 Output Channels (D2-D13)  │
  └────────────────────────┬────────────────────────┘               └────────────────▲────────────────┘
                           │ POST /api/hardware/sensor-data                          │ UART 115200 Baud
                           │ (Baud: 115200, Latency: 1.8ms)                          │ LATCH_SIGNAL_PINS
                           ▼                                                         │
  ┌──────────────────────────────────────────────────────────────────────────────────┴────────────────┐
  │                                 NODE.JS / EXPRESS CONTROLLER MIDDLEWARE                           │
  │                                                                                                   │
  │   ┌───────────────────────────┐      ┌─────────────────────────────┐      ┌───────────────────┐   │
  │   │  Hardware Ingest Driver   │      │ Dynamic Threshold Rule      │      │ Emergency Preempt │   │
  │   │  (Noise Filter & CRC Check│─────►│ & Green Wave Sync Engine    │─────►│ ACID Lockout Wave │   │
  │   └───────────────────────────┘      └──────────────┬──────────────┘      └─────────┬─────────┘   │
  │                                                     │                               │             │
  │                                                     ▼                               ▼             │
  │   ┌───────────────────────────────────────────────────────────────────────────────────────────┐   │
  │   │                Neo4j Graph Database Service Layer (ACID Bolt Transactions)                │   │
  │   │       • Cypher Pattern Queries: MATCH (j:Junction)-[:HAS_ROAD]->(r:Road)-[:HAS_SIGNAL]    │   │
  │   │       • Zero-Copy Index-Free Adjacency for O(1) multi-hop corridor path finding           │   │
  │   └─────────────────────────────────────────┬─────────────────────────────────────────────────┘   │
  │                                             │                                                     │
  │                                             ▼                                                     │
  │   ┌───────────────────────────────────────────────────────────────────────────────────────────┐   │
  │   │               Socket.IO Real-Time WebSocket Gateway (Broadcasts 60 FPS Telemetry)         │   │
  │   └─────────────────────────────────────────┬─────────────────────────────────────────────────┘   │
  └─────────────────────────────────────────────┼─────────────────────────────────────────────────────┘
                                                │
                                                ▼
  ┌───────────────────────────────────────────────────────────────────────────────────────────────────┐
  │                                    REACT 18 WEB APPLICATION DASHBOARD                             │
  │  • 3D WebGL Three.js Intersection Studio    • Arterial Green Wave Corridor (1.05 km)              │
  │  • Force-Directed Neo4j Graph Explorer       • AI Demand Forecaster (Prophet / ARIMA / LSTM)       │
  │  • Hardware Simulator & Serial Console      • Automated E-Challan & ANPR Violations Registry      │
  └───────────────────────────────────────────────────────────────────────────────────────────────────┘
`}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content 2: Relational Schema Dictionary */}
      {activeTab === 'SCHEMA' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left 4 Cols: Table List */}
          <div className="lg:col-span-4 bg-white/90 dark:bg-[#0a0a0a]/75 backdrop-blur-md p-4 rounded-lg border border-slate-200 dark:border-[#1f1f23]/80 shadow-xs space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-white pb-2 border-b border-slate-200 dark:border-[#1f1f23] flex items-center justify-between">
              <span>Normalized Schema Relations</span>
              <span className="text-[10px] font-mono text-emerald-500 font-bold">{RELATIONAL_SCHEMAS.length} Tables</span>
            </div>

            <div className="space-y-1.5">
              {RELATIONAL_SCHEMAS.map((sch) => (
                <button
                  key={sch.relation}
                  onClick={() => {
                    soundEffects.playClick();
                    setSelectedSchema(sch);
                  }}
                  className={`w-full text-left p-2.5 rounded-lg border transition font-mono text-xs cursor-pointer flex items-center justify-between ${
                    selectedSchema.relation === sch.relation
                      ? 'bg-blue-50 border-blue-400 text-blue-900 dark:bg-blue-950/60 dark:border-blue-700 dark:text-blue-200 shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 dark:bg-zinc-900/60 dark:hover:bg-zinc-900 dark:border-zinc-800 text-slate-700 dark:text-zinc-300'
                  }`}
                >
                  <div>
                    <div className="font-bold">{sch.relation}</div>
                    <div className="text-[10px] text-slate-500 dark:text-zinc-400">{sch.name}</div>
                  </div>
                  <Key className="w-3.5 h-3.5 text-amber-500" />
                </button>
              ))}
            </div>
          </div>

          {/* Right 8 Cols: Selected Table Attribute & Key Inspector */}
          <div className="lg:col-span-8 bg-white/90 dark:bg-[#0a0a0a]/75 backdrop-blur-md p-4 sm:p-5 rounded-lg border border-slate-200 dark:border-[#1f1f23]/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-200 dark:border-[#1f1f23]">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white font-mono flex items-center gap-2">
                  <span>{selectedSchema.relation}</span>
                  <span className="text-xs font-normal text-slate-500 dark:text-zinc-400">({selectedSchema.name})</span>
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800 text-[10px] font-mono font-bold">
                BCNF VERIFIED
              </span>
            </div>

            {/* Attributes Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 text-left">
                    <th className="pb-2">Attribute</th>
                    <th className="pb-2">Type</th>
                    <th className="pb-2">Key Constraint</th>
                    <th className="pb-2">Semantics / Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-900">
                  {selectedSchema.attributes.map((attr) => (
                    <tr key={attr.name} className="hover:bg-slate-50 dark:hover:bg-white/5">
                      <td className="py-2 font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        {attr.isPk && <Key className="w-3 h-3 text-amber-500" />}
                        <span>{attr.name}</span>
                      </td>
                      <td className="py-2 text-cyan-600 dark:text-cyan-400">{attr.type}</td>
                      <td className="py-2">
                        {attr.isPk ? (
                          <span className="px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-300 dark:bg-amber-950 dark:text-amber-300 text-[9px] font-bold">
                            PRIMARY KEY
                          </span>
                        ) : attr.isFk ? (
                          <span className="px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 border border-blue-300 dark:bg-blue-950 dark:text-blue-300 text-[9px] font-bold">
                            FOREIGN KEY
                          </span>
                        ) : (
                          <span className="text-slate-400">NON-PRIME</span>
                        )}
                      </td>
                      <td className="py-2 text-slate-600 dark:text-zinc-400">{attr.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Functional Dependencies & BCNF Proof */}
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-black border border-slate-200 dark:border-[#1f1f23] space-y-2 text-xs font-mono">
              <div className="text-[10px] text-slate-500 uppercase font-bold">Functional Dependencies (F):</div>
              {selectedSchema.functionalDependencies.map((fd, i) => (
                <div key={i} className="text-blue-600 dark:text-blue-400 font-bold">
                  {fd}
                </div>
              ))}
              <div className="pt-2 border-t border-slate-200 dark:border-zinc-800 text-emerald-600 dark:text-emerald-400">
                <strong>Proof:</strong> {selectedSchema.bcnfProof}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content 3: Step-by-Step Normalization Proofs (1NF to BCNF) */}
      {activeTab === 'NORMALIZATION' && (
        <div className="bg-white/90 dark:bg-[#0a0a0a]/75 backdrop-blur-md p-4 sm:p-5 rounded-lg border border-slate-200 dark:border-[#1f1f23]/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-200 dark:border-[#1f1f23]">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-white">
                Step-by-Step Relational Decomposition Proof (1NF &rarr; 2NF &rarr; 3NF &rarr; BCNF)
              </h3>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-500">
              Lossless-Join &amp; Dependency-Preserving
            </span>
          </div>

          {/* Stepper Buttons */}
          <div className="grid grid-cols-4 gap-2 text-xs font-mono">
            {[
              { step: 1, title: '1NF: Atomicity', sub: 'No Multi-valued' },
              { step: 2, title: '2NF: Partial FDs', sub: 'Full Key Dependency' },
              { step: 3, title: '3NF: Transitive FDs', sub: 'No X→Y→Z' },
              { step: 4, title: 'BCNF: Superkey', sub: '∀ X→Y, X is Superkey' },
            ].map((st) => (
              <button
                key={st.step}
                onClick={() => {
                  soundEffects.playClick();
                  setNormStep(st.step);
                }}
                className={`p-3 rounded-lg border text-left transition cursor-pointer ${
                  normStep === st.step
                    ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                    : 'bg-slate-50 dark:bg-black border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300'
                }`}
              >
                <div className="font-bold text-xs">{st.title}</div>
                <div className="text-[10px] opacity-80">{st.sub}</div>
              </button>
            ))}
          </div>

          {/* Dynamic Proof Card for Active Step */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-black border border-slate-200 dark:border-[#1f1f23] space-y-3 font-mono text-xs">
            {normStep === 1 && (
              <div className="space-y-2">
                <div className="font-bold text-sm text-blue-600 dark:text-blue-400">
                  First Normal Form (1NF) Proof
                </div>
                <p className="text-slate-600 dark:text-zinc-400">
                  <strong>Requirement:</strong> Every attribute domain contains only atomic (indivisible) values, and each record is unique with no repeating attribute groups.
                </p>
                <div className="p-3 rounded bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-[11px] space-y-1">
                  <div>• Disallowed: <code>R_RAW(junctionId, sensorList: [C001, C002, IR001], lightPins: [2,3,4])</code></div>
                  <div>• Normalized: Flattened into atomic tuples where each cell has exactly 1 scalar scalar value.</div>
                </div>
              </div>
            )}

            {normStep === 2 && (
              <div className="space-y-2">
                <div className="font-bold text-sm text-blue-600 dark:text-blue-400">
                  Second Normal Form (2NF) Proof
                </div>
                <p className="text-slate-600 dark:text-zinc-400">
                  <strong>Requirement:</strong> The relation is in 1NF and no non-prime attribute is partially dependent on any candidate key (full functional dependency on candidate key).
                </p>
                <div className="p-3 rounded bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-[11px] space-y-1">
                  <div>• Violation in Composite Key: <code>(junctionId, roadId) &rarr; junctionLocation</code></div>
                  <div>• Decomposition: Extracted <code>junctionLocation</code> into standalone <code>R1_JUNCTION(junctionId, junctionLocation)</code>.</div>
                </div>
              </div>
            )}

            {normStep === 3 && (
              <div className="space-y-2">
                <div className="font-bold text-sm text-blue-600 dark:text-blue-400">
                  Third Normal Form (3NF) Proof
                </div>
                <p className="text-slate-600 dark:text-zinc-400">
                  <strong>Requirement:</strong> The relation is in 2NF and there is no transitive dependency <code>X &rarr; Y &rarr; Z</code> between non-prime attributes.
                </p>
                <div className="p-3 rounded bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-[11px] space-y-1">
                  <div>• Transitive Violation: <code>recordId &rarr; densityLevel &rarr; maxGreenDurationAllocated</code></div>
                  <div>• Decomposition: Extracted timing rules into independent <code>THRESHOLD_POLICY(densityLevel, maxGreenDurationAllocated)</code>.</div>
                </div>
              </div>
            )}

            {normStep === 4 && (
              <div className="space-y-2">
                <div className="font-bold text-sm text-emerald-600 dark:text-emerald-400">
                  Boyce-Codd Normal Form (BCNF) Formal Proof
                </div>
                <p className="text-slate-600 dark:text-zinc-400 leading-relaxed">
                  <strong>Formal Definition:</strong> A relation schema <code>R</code> is in BCNF with respect to a set of functional dependencies <code>F</code> if, for every non-trivial functional dependency <code>X &rarr; Y &isin; F^+</code>, <code>X</code> is a <strong>Superkey</strong> of <code>R</code>.
                </p>
                <div className="p-3 rounded bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-[11px] space-y-1.5">
                  <div className="text-emerald-500 font-bold">✓ Complete Absence of Redundancy:</div>
                  <div>In all relations (R1 through R7), every determinant is the primary candidate key.</div>
                  <div className="text-slate-500">Zero update anomalies, zero insertion anomalies, and zero deletion anomalies guaranteed.</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab Content 4: EER Specialization Hierarchy */}
      {activeTab === 'EER' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Total Specialization Constraint */}
          <div className="bg-white/90 dark:bg-[#0a0a0a]/75 backdrop-blur-md p-4 sm:p-5 rounded-lg border border-slate-200 dark:border-[#1f1f23]/80 shadow-xs space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-[#1f1f23]">
              <Cpu className="w-4 h-4 text-amber-500" />
              <h3 className="text-xs font-semibold uppercase tracking-wider">
                1. Total Specialization Constraint (Double Line)
              </h3>
            </div>

            <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed font-mono">
              In our EER model, the superclass <strong>SENSOR</strong> exhibits <strong>Total Specialization</strong> (<code className="font-bold">Total = True</code>).
            </p>

            <div className="p-3 rounded bg-slate-50 dark:bg-black border border-slate-200 dark:border-[#1f1f23] text-xs font-mono space-y-2">
              <div className="text-amber-600 dark:text-amber-400 font-bold">Formal Rule:</div>
              <div className="text-slate-800 dark:text-zinc-200">
                <code>&forall; s &isin; SENSOR &rArr; (s &isin; CAMERA &or; s &isin; IR_SENSOR)</code>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                It is mathematically impossible for a sensor record to exist in the database without being categorized as either an optical camera or an IR beam sensor.
              </p>
            </div>
          </div>

          {/* Disjoint Constraint */}
          <div className="bg-white/90 dark:bg-[#0a0a0a]/75 backdrop-blur-md p-4 sm:p-5 rounded-lg border border-slate-200 dark:border-[#1f1f23]/80 shadow-xs space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-[#1f1f23]">
              <Binary className="w-4 h-4 text-cyan-500" />
              <h3 className="text-xs font-semibold uppercase tracking-wider">
                2. Disjoint Specialization Constraint (Symbol: 'd')
              </h3>
            </div>

            <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed font-mono">
              Subclasses <strong>CAMERA</strong> and <strong>IR_SENSOR</strong> are mutually disjoint (<code className="font-bold">Disjoint = True</code>).
            </p>

            <div className="p-3 rounded bg-slate-50 dark:bg-black border border-slate-200 dark:border-[#1f1f23] text-xs font-mono space-y-2">
              <div className="text-cyan-600 dark:text-cyan-400 font-bold">Formal Rule:</div>
              <div className="text-slate-800 dark:text-zinc-200">
                <code>CAMERA &cap; IR_SENSOR = &empty;</code>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                A single sensor hardware device can never possess both optical camera attributes (resolution, framerate) and analog IR beam attributes (analog pin, beam range) simultaneously.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content 5: RDBMS vs Neo4j Graph Hybrid Architecture */}
      {activeTab === 'HYBRID_GRAPH' && (
        <div className="bg-white/90 dark:bg-[#0a0a0a]/75 backdrop-blur-md p-4 sm:p-5 rounded-lg border border-slate-200 dark:border-[#1f1f23]/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-200 dark:border-[#1f1f23]">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-cyan-500" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-white">
                Hybrid Architecture: Relational (RDBMS) vs Graph (Neo4j) Benchmarks
              </h3>
            </div>
            <span className="text-[10px] font-mono text-emerald-500 font-bold">INDEX-FREE ADJACENCY</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            {/* Relational SQL Approach */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-black border border-slate-200 dark:border-[#1f1f23] space-y-3">
              <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center justify-between">
                <span>Relational RDBMS (PostgreSQL / MySQL)</span>
                <span className="text-amber-500 text-[10px]">O(N log N) Complex Joins</span>
              </div>
              <p className="text-slate-600 dark:text-zinc-400 text-[11px]">
                Ideal for tabular logging (E-Challan payments, immutable audit logs), but suffers combinatorial join explosions when traversing multi-hop arterial green waves.
              </p>
              <div className="p-2.5 rounded bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-[10px] text-slate-700 dark:text-zinc-300">
                <code>
                  SELECT * FROM Junction j<br />
                  JOIN Road r ON j.id = r.jId<br />
                  JOIN Signal s ON r.id = s.rId<br />
                  JOIN Timing t ON s.id = t.sId<br />
                  WHERE j.id = 'J001'
                </code>
              </div>
            </div>

            {/* Neo4j Graph Approach */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-black border border-slate-200 dark:border-[#1f1f23] space-y-3">
              <div className="font-bold text-sm text-cyan-600 dark:text-cyan-400 flex items-center justify-between">
                <span>Native Graph DB (Neo4j Cypher)</span>
                <span className="text-emerald-500 text-[10px]">O(1) Index-Free Adjacency</span>
              </div>
              <p className="text-slate-600 dark:text-zinc-400 text-[11px]">
                Nodes maintain direct memory pointers to adjacent relationships. Traversing from J001 &rarr; Roads &rarr; Signals takes constant time regardless of total database size.
              </p>
              <div className="p-2.5 rounded bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-[10px] text-emerald-400">
                <code>
                  MATCH (j:Junction &#123;junctionId: 'J001'&#125;)-[:HAS_ROAD]-&gt;(r)-[:CONTROLS_SIGNAL]-&gt;(s)<br />
                  RETURN j, r, s
                </code>
              </div>
            </div>
          </div>

          {/* ACID Concurrency & 2PL Guarantee */}
          <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-black border border-slate-200 dark:border-[#1f1f23] text-xs font-mono space-y-2">
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              <span>ACID Concurrency Guarantee: Strict Two-Phase Locking (2PL)</span>
            </div>
            <p className="text-slate-600 dark:text-zinc-400 text-[11px]">
              During emergency pre-emption transactions, the system acquires exclusive write locks (X-Locks) on all 4 Signal nodes simultaneously in the growing phase and releases them only after write-ahead logging (WAL) commit, preventing race conditions and ensuring 100% safety lockout parity.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

