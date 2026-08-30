import React from 'react';
import { X, Volume2, Sparkles, Database, Cpu, CheckCircle2, BookOpen, Layers } from 'lucide-react';
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
      'Dashboard Overview: Visualizes live 4-way intersection telemetry in 2D and 3D WebGL. Calculates dynamic green timings using Neo4j graph algorithms to reduce waiting time by up to 38 percent.',
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
      'Simulation Tab: Discrete-event traffic simulator implementing dynamic density thresholds and Chaos Mode sandbox for stress-testing graph resilience.',
  },
  analytics: {
    title: 'Live Traffic Analytics & Performance Curves',
    badge: 'TELEMETRY INTELLIGENCE',
    summary:
      'Aggregates historical time-series vehicle throughput, congestion indices, waiting time reductions, and EPA mathematical carbon emission savings across all intersection approaches.',
    dbmsRole:
      'Executes Cypher aggregation queries over historical hourly telemetry nodes to benchmark adaptive signal performance against static timer baselines.',
    vivaPoints: [
      'Shows -38% average wait time reduction and estimated CO2 emission reductions in kg/hr.',
      'Visualizes 4-approach volume comparisons and peak congestion heatmaps.',
      'Enables exportable data insights for municipal urban planning.',
    ],
    speechText:
      'Analytics Tab: Displays historical throughput, queue density curves, and carbon footprint reduction benchmarks against static timers.',
  },
  violations: {
    title: 'Automated E-Challan Registry & ANPR Vision',
    badge: 'COMPUTER VISION & OCR',
    summary:
      'Simulates high-precision ANPR (Automatic Number Plate Recognition) for automated traffic violation detection including Red-Light Jumping, Over-Speeding (>50 km/h), and Zebra-Crossing Line Oversteps.',
    dbmsRole:
      'Stores infraction nodes in Neo4j with relationships (Vehicle)-[:COMMITTED]->(Violation)-[:OCCURRED_AT]->(Road), tracking payment statuses.',
    vivaPoints: [
      'High-precision OCR simulated on Indian HSRP vehicle registration plates.',
      'Automated fine calculation and instant one-click simulated fine payment.',
      'Filterable by road approach, violation classification, and settlement status.',
    ],
    speechText:
      'E-Challan and ANPR Tab: Computer vision infraction detector capturing red light violations and over-speeding with automated penalty records.',
  },
  forecaster: {
    title: 'AI Predictive Rush-Hour Demand Forecaster',
    badge: 'PREDICTIVE ML HORIZON',
    summary:
      'Forecasts upcoming traffic surges across 15-minute, 30-minute, and 60-minute horizons using rolling-average and historical trend models to proactively prepare signal splits before queues develop.',
    dbmsRole:
      'Scans graph historical demand patterns to anticipate junction congestion bottlenecks and apply proactive green extensions.',
    vivaPoints: [
      'Transforms reactive signal control into proactive, anticipatory signal management.',
      'Displays morning and evening rush-hour curves with confidence intervals.',
      'Allows one-click application of proactive signal duration tuning.',
    ],
    speechText:
      'Traffic Forecaster Tab: Predicts future congestion spikes up to 60 minutes in advance to proactively optimize signal cycle timings.',
  },
  citymap: {
    title: 'Multi-Junction Metropolitan City Network',
    badge: 'METRO GRAPH TOPOLOGY',
    summary:
      'A multi-node geographic map displaying Delhi-NCR traffic nodes (Central Plaza, AIIMS Flyover, Lajpat Nagar, Connaught Place) and arterial transit corridors.',
    dbmsRole:
      'Models the city as a connected weighted graph (Junction)-[:CONNECTED_TO {distance, speedLimit}]->(Junction) for macro-level routing.',
    vivaPoints: [
      'Visualizes interconnected city intersections and live corridor health.',
      'Displays real-time throughput metrics for metropolitan transit authorities.',
      'Demonstrates multi-junction scalability of the Neo4j backend.',
    ],
    speechText:
      'City Map Tab: Displays interconnected metropolitan intersections and arterial corridors across the city network.',
  },
  corridor: {
    title: 'Dynamic Green Wave Arterial Synchronization',
    badge: 'CORRIDOR OPTIMIZATION',
    summary:
      'Coordinates consecutive intersections along an arterial route so platoons traveling at the recommended speed (50-60 km/h) experience continuous green lights without stopping.',
    dbmsRole:
      'Calculates phase offset offsets $\\Delta t = d / v$ across adjacent junction nodes in the Neo4j graph topology.',
    vivaPoints: [
      'Reduces fuel consumption, brake wear, and stop-and-go delays along arterial routes.',
      'Interactive corridor speed and vehicle platoon simulation.',
      'Emergency corridor flushing for ambulances and fire brigades.',
    ],
    speechText:
      'Green Wave Corridor: Synchronizes consecutive traffic signals along arterial routes to allow non-stop vehicle flow at 54 kilometers per hour.',
  },
  controller: {
    title: 'Signal Controller & Manual Override Deck',
    badge: 'DISPATCH COMMAND',
    summary:
      'Allows traffic operators to switch between AUTOMATIC adaptive graph mode and MANUAL override, with manual green signal duration sliders and emergency buttons.',
    dbmsRole:
      'Dispatches override Cypher commands to lock junction state and override automated scheduler cycles.',
    vivaPoints: [
      'Real-time toggle between fully automated AI control and manual dispatch.',
      'Individual approach signal locks with duration timers.',
      'Safety interlocks preventing simultaneous green conflicts across conflicting roads.',
    ],
    speechText:
      'Signal Controller Tab: Command deck for manual signal overrides, safety phase locks, and direct actuator commands.',
  },
  hardware: {
    title: '12-Channel Physical Arduino & Actuator Simulator',
    badge: 'HARDWARE-IN-THE-LOOP',
    summary:
      'Demonstrates Hardware-in-the-Loop (HIL) parity between the software controller and physical 12-channel Arduino traffic lights (Red, Yellow, Green for North, South, East, West).',
    dbmsRole:
      'Synchronizes physical GPIO pin state telemetry with software graph node states.',
    vivaPoints: [
      '12-channel digital pin mapping for physical LED signal lamps and IR loop sensors.',
      'Zero-latency software-hardware parity verification (100% in-sync).',
      'Interactive hardware simulation toggle when physical microcontroller is offline.',
    ],
    speechText:
      'Hardware Simulator Tab: Verifies 12-channel physical Arduino signal states and sensor pin mappings in real time.',
  },
  database: {
    title: 'Neo4j Graph Database & Cypher Query Console',
    badge: 'GRAPH DATABASE ENGINE',
    summary:
      'Interactive database console providing live connection telemetry, graph node counts, and a built-in Cypher query editor to inspect the active traffic schema.',
    dbmsRole:
      'Executes Cypher queries against Neo4j to manage roads, junctions, emergency pre-emptions, and historical telemetry logs.',
    vivaPoints: [
      'Displays Neo4j connection status, query latency, and database metadata.',
      'Includes pre-built Cypher query templates for traffic viva evaluation.',
      'Live JSON response viewer for custom graph queries.',
    ],
    speechText:
      'Neo4j Database Tab: Interactive Cypher query console and connection health monitor for the underlying graph database.',
  },
  architecture: {
    title: 'System Architecture, Graph Topology & Schema',
    badge: 'TECHNICAL SPECIFICATIONS',
    summary:
      'Detailed technical documentation of the STMS system architecture, full Neo4j graph schema (Nodes, Relationships, Properties), and mathematical algorithms.',
    dbmsRole:
      'Documents the graph database schema, Cypher optimization indices, and microservices architecture.',
    vivaPoints: [
      'Complete viva cheat sheet explaining graph vs relational database trade-offs.',
      'Full architectural block diagram: Frontend, Node.js API, Neo4j, and Arduino.',
      'Mathematical formulas for dynamic green splits and eco emissions.',
    ],
    speechText:
      'Architecture Tab: Comprehensive technical design and graph schema documentation for project evaluation.',
  },
  logs: {
    title: 'Immutable System Audit Logs & Event Stream',
    badge: 'AUDIT & COMPLIANCE',
    summary:
      'An append-only real-time audit log stream recording every signal phase transition, emergency trigger, operator override, and database transaction.',
    dbmsRole:
      'Persists chronological audit records with timestamps and junction identifiers for accountability.',
    vivaPoints: [
      'Filterable by event type: Emergency, Controller, Simulation, Hardware, Database.',
      'Real-time streaming updates with one-click log clearance.',
      'Cryptographically ready event trail for municipal compliance.',
    ],
    speechText:
      'System Logs Tab: Real-time immutable audit stream tracking all signal transitions and operator actions.',
  },
  settings: {
    title: 'Settings, Theme Engine & User Configuration',
    badge: 'SYSTEM CONFIGURATION',
    summary:
      'Configures junction network endpoints, switches between Dark Mode (Cyber Highway) and Light Mode (Metropolitan Cobalt), and toggles Advanced Feature modules.',
    dbmsRole:
      'Persists user preferences and custom junction coordinates in local browser storage.',
    vivaPoints: [
      'Dynamic theme switcher with high-contrast color palettes and blueprint particle canvas.',
      'Advanced Features toggle to simplify or expand navigation sidebar tabs.',
      'Junction management for adding new metropolitan intersections dynamically.',
    ],
    speechText:
      'Settings Tab: Configuration panel for theme switching, junction management, and user profiles.',
  },
};

export const TabInfoModal: React.FC<TabInfoModalProps> = ({ isOpen, onClose, activeTab }) => {
  if (!isOpen) return null;

  const detail = TAB_INFO_DIRECTORY[activeTab] || TAB_INFO_DIRECTORY.dashboard;

  const handleReadAloud = () => {
    soundEffects.playVoiceAck();
    voiceCommander.speak(detail.speechText);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-xl cursor-pointer overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl bg-[#08090f] text-white rounded-3xl p-6 sm:p-8 shadow-2xl border-2 border-red-500/40 cursor-default my-auto space-y-5 animate-fade-in"
      >
        {/* Header Bar */}
        <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600/30 border border-red-400/50 text-[10px] font-mono font-bold text-red-300">
              <Sparkles className="w-3.5 h-3.5 text-red-300" />
              <span>{detail.badge}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white font-sans tracking-tight">
              {detail.title}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {/* Read Aloud Button */}
            <button
              onClick={handleReadAloud}
              title="Listen to summary (Text-to-Speech)"
              className="px-3 py-1.5 rounded-full bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-sm cursor-pointer"
            >
              <Volume2 className="w-4 h-4" />
              <span className="hidden sm:inline">Listen Aloud</span>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-rose-600 text-white flex items-center justify-center transition cursor-pointer"
            >
              <X className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* Section 1: Plain English Overview */}
        <div className="space-y-2">
          <span className="text-xs font-black tracking-wider text-red-300 uppercase block">
            What This Feature Does
          </span>
          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed bg-white/5 p-4 rounded-2xl border border-white/5">
            {detail.summary}
          </p>
        </div>

        {/* Section 2: DBMS & Graph Core */}
        <div className="space-y-2">
          <span className="text-xs font-black tracking-wider text-emerald-300 uppercase flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span>Underlying Neo4j &amp; Graph Algorithm Role</span>
          </span>
          <p className="text-xs font-mono text-emerald-200 bg-emerald-950/40 p-3.5 rounded-2xl border border-emerald-500/30 leading-relaxed">
            {detail.dbmsRole}
          </p>
        </div>

        {/* Section 3: Viva & Evaluation Talking Points */}
        <div className="space-y-2">
          <span className="text-xs font-black tracking-wider text-amber-300 uppercase flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            <span>Key Demonstration / Viva Highlights</span>
          </span>
          <div className="space-y-1.5">
            {detail.vivaPoints.map((pt, i) => (
              <div
                key={i}
                className="flex items-start gap-2.5 text-xs text-slate-300 p-2.5 rounded-xl bg-white/5 border border-white/5"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{pt}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Close Button */}
        <div className="pt-3 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-wider transition shadow-lg shadow-red-950 cursor-pointer"
          >
            GOT IT
          </button>
        </div>
      </div>
    </div>
  );
};
