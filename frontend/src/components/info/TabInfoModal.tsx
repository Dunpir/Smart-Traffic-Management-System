import React, { useState, useEffect } from 'react';
import { X, Volume2, Square, Sparkles, Database, BookOpen, CheckCircle2, Bot } from 'lucide-react';
import { NavTab } from '../layout/Sidebar';
import { voiceCommander } from '../../utils/voiceCommander';
import { soundEffects } from '../../utils/soundEffects';

interface TabInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: NavTab;
}

interface TabDetail {
  title: string;
  badge: string;
  summary: string;
  dbmsRole: string;
  vivaPoints: string[];
  speechText: string;
}

export const TAB_INFO_DIRECTORY: Record<NavTab, TabDetail> = {
  dashboard: {
    title: 'Live Intersection Telemetry & Adaptive Controller',
    badge: 'CORE TELEMETRY ENGINE',
    summary:
      'The Dashboard is the operational hub of Trafix. It visualizes the active 4-way intersection (Central Plaza J001) in both real-time 2D SVG and full 3D WebGL Studio, displaying queue counts, signal countdowns, active green phases, and environmental AQI telemetry.',
    dbmsRole:
      'Queries Neo4j (Junction)-[:HAS_APPROACH]->(Road)-[:QUEUE_DENSITY] to calculate dynamic green duration (0s, 20s, 30s, 60s) and triggers emergency pre-emption paths in <45ms.',
    vivaPoints: [
      'Eliminates wasted green time by allocating signal splits proportional to queue densities.',
      'Includes 3D WebGL Studio with realistic vehicle physics and 4 camera view modes.',
      'Features instant emergency vehicle pre-emption with flashing sirens and audible alerts.',
    ],
    speechText:
      'Welcome to the Overview Dashboard! Here, you have live telemetry for the Central Plaza intersection in both 2D and 3D WebGL. The system continuously evaluates queue lengths across all four approaches and dynamically adjusts green signals to slash wait times by thirty-eight percent. You can also trigger instant emergency pre-emption corridors with a single click or voice command.',
  },
  simulation: {
    title: 'STMS Discrete-Event Simulation & Chaos Sandbox',
    badge: 'RESEARCH IMPLEMENTATION',
    summary:
      'Simulates dynamic vehicle arrivals, queue discharges, and camera-based shortest-job-first scheduling inspired by the published STMS research methodology. Also features the Chaos Mode Stress-Test Sandbox for extreme edge-case injection.',
    dbmsRole:
      'Simulates live graph state mutations, updating node vehicle weights and logging event transactions into the system audit stream.',
    vivaPoints: [
      'Implements the NITRA CSE STMS algorithm: 0 cars = 0s skip, 1-10 cars = 20s, 11-30 cars = 30s, >30 cars = 60s.',
      'Supports Chaos Mode with accident roadblocks, VIP convoys, and sensor fault injections.',
      'Fully controllable via AI Voice Dispatcher (Start, Pause, Reset, Spawn, Scenario).',
    ],
    speechText:
      'Welcome to the Simulation Sandbox! This environment implements our discrete-event traffic algorithm with density-based green timing allocations. You can test rush hour spikes, trigger vehicle breakdowns, run our Chaos Mode stress tests, or spawn emergency vehicles in real time.',
  },
  analytics: {
    title: 'Live Traffic Analytics & Performance Curves',
    badge: 'TELEMETRY INTELLIGENCE',
    summary:
      'Aggregates historical time-series vehicle throughput, congestion indices, waiting time reductions, and EPA mathematical carbon emission savings across all intersection approaches.',
    dbmsRole:
      'Executes Cypher aggregation queries over historical hourly telemetry nodes to benchmark adaptive signal performance against static timer baselines.',
    vivaPoints: [
      'Visualizes 24-hour peak morning/evening rush-hour traffic curves.',
      'Calculates real-time fuel savings and CO2 emission abatements.',
      'Exports full CSV/JSON audit reports for municipal reporting.',
    ],
    speechText:
      'This is the Traffic Analytics Suite. Here you can inspect 24-hour peak rush-hour curves, compare static timers against our adaptive algorithm, and measure total fuel savings alongside carbon dioxide emission reductions across the metropolitan area.',
  },
  citymap: {
    title: 'Metropolitan Multi-Intersection Grid Topology',
    badge: 'DISTRIBUTED NETWORK',
    summary:
      'Visualizes interconnected traffic signals across the city, tracking live vehicle volumes, incident alerts, and multi-node green wave routing.',
    dbmsRole:
      'Uses Neo4j Spatial graph queries to model cross-junction arterial corridors and compute optimal green progressions.',
    vivaPoints: [
      'Demonstrates 7 interconnected metropolitan intersections across Delhi-NCR.',
      'Supports single-click emergency pre-emption cascade across network corridors.',
      'Displays real-time throughput metrics across the entire city grid.',
    ],
    speechText:
      'You are viewing the Metropolitan City Grid Map. This displays the interconnected network of seven smart intersections across Delhi NCR. From here, you can track node connectivity and coordinate citywide emergency green wave cascades in real time.',
  },
  corridor: {
    title: 'Green Wave Arterial Progression Synchronizer',
    badge: 'CORRIDOR COORDINATION',
    summary:
      'Calculates distance-based phase offsets between adjacent junctions along a major arterial corridor to permit continuous non-stop vehicular flow (Green Wave).',
    dbmsRole:
      'Executes path traversal Cypher queries across sequential Junction nodes to dynamically adjust offset delays in real time.',
    vivaPoints: [
      'Interactive 3-junction corridor progression animation with speed advisory.',
      'Computes travel time offsets: delta t = distance / target velocity.',
      'Reduces fuel consumption and stop-and-go delays by up to 34%.',
    ],
    speechText:
      'Welcome to the Arterial Green Wave Corridor. This module dynamically synchronizes adjacent traffic signals along major expressways based on vehicle speed and distance, enabling non-stop platoon flow and cutting stop-and-go delays by up to thirty-four percent.',
  },
  violations: {
    title: 'ANPR Optical License Plate & E-Challan Engine',
    badge: 'LAW ENFORCEMENT',
    summary:
      'Simulates live optical automated number-plate recognition (ANPR) and red-light violation detection (RLVD) with digital law-enforcement e-challan generation.',
    dbmsRole:
      'Stores immutable violation records, fines assessed under the Motor Vehicles Act, and real-time payment audit transactions.',
    vivaPoints: [
      'Live camera HUD with optical laser scan lines and IndiPlate standard detection.',
      'Instant e-challan generation with QR code and mock payment gateway.',
      'Supports red-light jump, overspeeding, and zebra cross obstruction detections.',
    ],
    speechText:
      'This is the Automated Enforcement and E-Challan Center. Our optical computer vision engine scans vehicle number plates in real time, automatically detects red-light jumps, and issues instant digital e-challans backed by an immutable audit log.',
  },
  forecaster: {
    title: 'AI Predictive Multi-Horizon Traffic Forecaster',
    badge: 'PREDICTIVE AI',
    summary:
      'Forecasts traffic volume spikes at 15, 30, and 60-minute horizons using historical pattern modeling to proactively rebalance signal timing splits before gridlock occurs.',
    dbmsRole:
      'Performs time-series queries over aggregated historical intervals to feed predictive regression parameters.',
    vivaPoints: [
      'Multi-horizon predictive demand cards for 15, 30, and 60 minutes.',
      'Proactive signal timing adjustments based on anticipated rush-hour surges.',
      'Comparative diurnal curves: Weekday vs Rain Storm (+40%) vs Weekend.',
    ],
    speechText:
      'Welcome to the AI Traffic Forecaster. Using historical diurnal patterns and environmental telemetry, this module anticipates rush-hour congestion surges up to sixty minutes in advance and proactively rebalances green times before traffic jams form.',
  },
  controller: {
    title: 'Traffic Signal Controller & Safety Interlock',
    badge: 'ACTUATOR CONTROLLER',
    summary:
      'Deterministic rule-based phase timing allocation, manual actuator controls, and safety lockout.',
    dbmsRole:
      'Maintains database state parity between virtual software signals and physical hardware relays.',
    vivaPoints: [
      'Software-enforced safety interlocks preventing simultaneous conflicting green phases.',
      'Manual phase hold and override capabilities with timed expiration.',
      'Configurable minimum and maximum green time bounds per approach.',
    ],
    speechText:
      'This is the Signal Controller and Safety Interlock panel. It provides manual override controls, phase-hold capabilities, and software safety locks that strictly prevent conflicting green phases across opposing approaches.',
  },
  hardware: {
    title: 'Hardware Abstraction Layer & IoT Simulator',
    badge: 'EMBEDDED SYSTEMS',
    summary:
      'Simulates physical Arduino Uno/Mega GPIO digital pinouts, optical camera telemetry feeds, and IR obstacle beam stop-line sensors.',
    dbmsRole:
      'Logs edge hardware sensor telemetry directly into the Neo4j event journal via REST APIs.',
    vivaPoints: [
      'Full 12-pin LED traffic signal hardware abstraction (D2-D13).',
      '4-channel IR beam sensor occupancy telemetry on analog inputs A0-A3.',
      'Copyable production-ready C++ Arduino firmware snippet.',
    ],
    speechText:
      'Welcome to the Hardware Abstraction Layer. This simulator mirrors physical Arduino microcontrollers, mapping GPIO digital pins to physical LED signal heads and analog inputs to infrared vehicle detection sensors.',
  },
  database: {
    title: 'Neo4j Graph Database Explorer & Cypher Terminal',
    badge: 'GRAPH DBMS CORE',
    summary:
      'Interactive D3/SVG graph canvas visualizing all Junction, Road, Sensor, Actuator, and State nodes with an integrated Cypher query execution console.',
    dbmsRole:
      'Direct read/write access to the Neo4j graph engine with live query evaluation and schema inspection.',
    vivaPoints: [
      'Visualizes sensor specialization: Total & Disjoint constraints.',
      'Interactive Cypher query runner with 5 one-click evaluation presets.',
      'Displays live node count metrics across all 8 entity types.',
    ],
    speechText:
      'You are exploring the Neo4j Graph Database console. It represents our smart traffic network as an interconnected property graph. You can inspect all eight entity models, run custom Cypher queries, and trace real-time topological relationships.',
  },
  architecture: {
    title: 'System Architecture & DBMS Theoretical Model',
    badge: 'SYSTEM DESIGN',
    summary:
      'Complete conceptual EER model, sensor specialization hierarchy (Total & Disjoint), Boyce-Codd Normal Form (BCNF) decomposition proofs, and end-to-end hardware bridge.',
    dbmsRole:
      'Formal theoretical foundation of the Trafix database schema ensuring zero update, insertion, or deletion anomalies.',
    vivaPoints: [
      'Comprehensive ASCII hardware-to-database architectural diagram.',
      'Formal proofs showing all functional dependencies satisfy BCNF criteria.',
      'Sensor superclass/subclass hierarchy explanation for evaluation viva.',
    ],
    speechText:
      'This is the System Architecture and DBMS Theory overview. It details our conceptual Enhanced Entity Relationship diagram, Boyce-Codd Normal Form normalization proofs, and sensor specialization hierarchy designed for complete data integrity.',
  },
  logs: {
    title: 'System Audit Trail & Event Logs',
    badge: 'AUDIT & COMPLIANCE',
    summary:
      'Immutable chronological log of all hardware telemetries, database commits, manual operator overrides, and emergency vehicle pre-emptions.',
    dbmsRole:
      'Audit log journal persisted in Neo4j with millisecond timestamp precision and severity classification.',
    vivaPoints: [
      'Real-time streaming log feed with auto-refresh every 3 seconds.',
      'Multi-level event filtering (Sensor Reads, Signal Changes, Overrides).',
      'One-click log export to .log text file for compliance auditing.',
    ],
    speechText:
      'Welcome to the System Audit Stream. Every sensor trigger, signal phase transition, and operator intervention is recorded here in an immutable chronological ledger with millisecond precision.',
  },
  settings: {
    title: 'Settings, Theme Engine & User Configuration',
    badge: 'SYSTEM CONFIGURATION',
    summary:
      'Configures junction network endpoints, switches between Dark Mode (Cyber Highway) and Light Mode (Metropolitan Cobalt), and toggles Advanced Feature modules.',
    dbmsRole:
      'Persists user preferences and custom junction coordinates in local browser storage.',
    vivaPoints: [
      'Dynamic theme switcher with high-contrast color palettes.',
      'Advanced Features toggle to simplify or expand navigation sidebar tabs.',
      'Junction management for adding new metropolitan intersections dynamically.',
    ],
    speechText:
      'This is the Settings and Customization console. Here you can toggle between dark and light themes, configure new smart intersection endpoints, and customize advanced modules to match your workflow.',
  },
};

export const TabInfoModal: React.FC<TabInfoModalProps> = ({ isOpen, onClose, activeTab }) => {
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setIsPlaying(false);
      voiceCommander.stopSpeech();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const detail = TAB_INFO_DIRECTORY[activeTab] || TAB_INFO_DIRECTORY.dashboard;

  const handleToggleSpeech = () => {
    if (isPlaying) {
      voiceCommander.stopSpeech();
      setIsPlaying(false);
    } else {
      soundEffects.playVoiceAck();
      setIsPlaying(true);
      voiceCommander.speak(detail.speechText);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-md cursor-pointer overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl bg-white dark:bg-[#0a0a0a] text-slate-900 dark:text-white rounded-lg p-5 sm:p-6 shadow-xl border border-slate-200 dark:border-[#1f1f23] cursor-default my-auto space-y-4 animate-fade-in"
      >
        {/* Header Bar */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 dark:border-[#1f1f23] pb-3">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>{detail.badge}</span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-sans tracking-tight">
              {detail.title}
            </h2>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleToggleSpeech}
              title={isPlaying ? 'Stop Speech' : 'Listen to Neerja AI explanation'}
              className={`px-3 py-1.5 rounded font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs ${
                isPlaying
                  ? 'bg-amber-500 hover:bg-amber-600 text-black animate-pulse'
                  : 'bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-black'
              }`}
            >
              {isPlaying ? (
                <>
                  <Square className="w-3 h-3 fill-current" />
                  <span>Stop</span>
                </>
              ) : (
                <>
                  <Bot className="w-3.5 h-3.5 text-sky-400" />
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Listen to AI</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:text-zinc-400 dark:hover:text-white flex items-center justify-center transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Section 1: Overview */}
        <div className="space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-zinc-500 block">
            What This Feature Does
          </span>
          <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed bg-slate-50 dark:bg-black p-3 rounded-lg border border-slate-200 dark:border-[#1f1f23]">
            {detail.summary}
          </p>
        </div>

        {/* Section 2: DBMS Role */}
        <div className="space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-zinc-500 flex items-center gap-1">
            <Database className="w-3 h-3 text-slate-500 dark:text-zinc-400" />
            <span>Underlying Neo4j Graph Algorithm Role</span>
          </span>
          <p className="text-xs font-mono text-slate-700 dark:text-zinc-300 bg-slate-50 dark:bg-black p-3 rounded-lg border border-slate-200 dark:border-[#1f1f23] leading-relaxed">
            {detail.dbmsRole}
          </p>
        </div>

        {/* Section 3: Viva Points */}
        <div className="space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-zinc-500 flex items-center gap-1">
            <BookOpen className="w-3 h-3 text-slate-500 dark:text-zinc-400" />
            <span>Demonstration &amp; Viva Highlights</span>
          </span>
          <div className="space-y-1">
            {detail.vivaPoints.map((pt, i) => (
              <div
                key={i}
                className="flex items-start gap-2 text-xs text-slate-600 dark:text-zinc-300 p-2 rounded bg-slate-50 dark:bg-black border border-slate-200 dark:border-[#1f1f23]"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span>{pt}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Close Button */}
        <div className="pt-2 border-t border-slate-200 dark:border-[#1f1f23]">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 rounded bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-black font-semibold text-xs transition cursor-pointer shadow-xs"
          >
            Close Reference
          </button>
        </div>
      </div>
    </div>
  );
};
