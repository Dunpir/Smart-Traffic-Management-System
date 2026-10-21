import React, { useState } from 'react';
import {
  ShieldAlert,
  X,
  PlusCircle,
  CheckCircle,
  AlertTriangle,
  Flame,
  CloudRain,
  Car,
  Radio,
  Clock,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { CityIncident, CityIntersectionNode, IncidentType } from '../../types';
import { soundEffects } from '../../utils/soundEffects';

interface CityIncidentDispatcherProps {
  isOpen: boolean;
  onClose: () => void;
  intersections: CityIntersectionNode[];
  activeIncidents: CityIncident[];
  onInjectIncident: (incident: {
    type: IncidentType;
    title: string;
    junctionId: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    impactDelayMin: number;
    description: string;
  }) => void;
  onResolveIncident: (incidentId: string) => void;
}

export const CityIncidentDispatcher: React.FC<CityIncidentDispatcherProps> = ({
  isOpen,
  onClose,
  intersections,
  activeIncidents,
  onInjectIncident,
  onResolveIncident,
}) => {
  const [selectedJunctionId, setSelectedJunctionId] = useState<string>('J001');
  const [selectedType, setSelectedType] = useState<IncidentType>('AMBULANCE_DISPATCH');

  if (!isOpen) return null;

  const incidentPresets: Array<{
    type: IncidentType;
    title: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    impactDelayMin: number;
    description: string;
    icon: React.ReactNode;
    color: string;
  }> = [
    {
      type: 'AMBULANCE_DISPATCH',
      title: 'Emergency Life Support Transit',
      severity: 'HIGH',
      impactDelayMin: 0,
      description: 'Cat-1 Priority Green wave preemption into regional trauma emergency center.',
      icon: <Radio className="w-4 h-4 text-rose-400" />,
      color: 'border-rose-600/40 hover:border-rose-500 bg-rose-950/30 text-rose-300',
    },
    {
      type: 'VIP_CONVOY',
      title: 'VIP Presidential Motorcade Corridor',
      severity: 'HIGH',
      impactDelayMin: 5.5,
      description: 'High-security convoy arterial hold. Secondary cross-streets held on red.',
      icon: <Car className="w-4 h-4 text-purple-400" />,
      color: 'border-purple-600/40 hover:border-purple-500 bg-purple-950/30 text-purple-300',
    },
    {
      type: 'ACCIDENT_BLOCK',
      title: 'Multi-Vehicle Collision Blockage',
      severity: 'CRITICAL',
      impactDelayMin: 8.0,
      description: 'Right 2 lanes blocked on approach flyover. Dynamic rerouting advisory triggered.',
      icon: <AlertTriangle className="w-4 h-4 text-amber-400" />,
      color: 'border-amber-600/40 hover:border-amber-500 bg-amber-950/30 text-amber-300',
    },
    {
      type: 'CONSTRUCTION_ZONE',
      title: 'Metro Pier Construction Lane Drop',
      severity: 'MEDIUM',
      impactDelayMin: 4.2,
      description: 'Highway capacity reduced from 4 lanes to 2. Speed limit throttled to 30 km/h.',
      icon: <Clock className="w-4 h-4 text-cyan-400" />,
      color: 'border-cyan-600/40 hover:border-cyan-500 bg-cyan-950/30 text-cyan-300',
    },
    {
      type: 'WATERLOGGING',
      title: 'Monsoon Underpass Flash Flooding',
      severity: 'CRITICAL',
      impactDelayMin: 12.0,
      description: 'Underpass flooded with 45cm water. Autonomous detour wave dispatched.',
      icon: <CloudRain className="w-4 h-4 text-blue-400" />,
      color: 'border-blue-600/40 hover:border-blue-500 bg-blue-950/30 text-blue-300',
    },
  ];

  const handleDispatchPreset = (preset: (typeof incidentPresets)[0]) => {
    if (preset.type === 'AMBULANCE_DISPATCH') {
      soundEffects.playEmergencySiren();
    } else {
      soundEffects.playWarning();
    }

    const node = intersections.find((n) => n.id === selectedJunctionId);
    const nodeName = node ? `${node.name} [${node.code}]` : selectedJunctionId;

    onInjectIncident({
      type: preset.type,
      title: `${preset.title} @ ${node?.code || selectedJunctionId}`,
      junctionId: selectedJunctionId,
      severity: preset.severity,
      impactDelayMin: preset.impactDelayMin,
      description: `${preset.description} Located at ${nodeName}.`,
    });
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'CRITICAL':
        return 'bg-rose-950 text-rose-300 border-rose-700 animate-pulse';
      case 'HIGH':
        return 'bg-purple-950 text-purple-300 border-purple-700';
      case 'MEDIUM':
        return 'bg-amber-950 text-amber-300 border-amber-700';
      default:
        return 'bg-cyan-950 text-cyan-300 border-cyan-700';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="relative w-full max-w-3xl bg-slate-950 border border-rose-500/40 rounded-2xl shadow-2xl shadow-rose-950/60 overflow-hidden font-sans max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-slate-900/90 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-rose-950 border border-rose-500/50 text-rose-400 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Tactical Metropolitan Incident Dispatcher
              </h3>
              <p className="text-xs text-slate-400 font-sans">
                Inject real-world emergency corridors, multi-vehicle blocks, and weather anomalies
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content Scrollable */}
        <div className="p-5 space-y-5 overflow-y-auto">
          {/* Target Junction Selector */}
          <div className="space-y-1.5 font-mono">
            <label className="text-xs text-slate-300 uppercase font-bold flex items-center gap-1.5">
              <span>Select Target Node for Incident Injection:</span>
            </label>
            <select
              value={selectedJunctionId}
              onChange={(e) => setSelectedJunctionId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:border-rose-400 focus:outline-none"
            >
              {intersections.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.code} — {n.name} ({n.congestionLevel} Congestion • {n.vehicleCount} vehicles)
                </option>
              ))}
            </select>
          </div>

          {/* Incident Preset Grid */}
          <div className="space-y-2">
            <div className="text-xs font-mono font-bold text-slate-400 uppercase">
              Incident Scenarios (1-Click Injection):
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {incidentPresets.map((preset) => (
                <button
                  key={preset.type}
                  onClick={() => handleDispatchPreset(preset)}
                  className={`p-3 rounded-xl border text-left transition flex flex-col justify-between gap-2 cursor-pointer ${preset.color}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 font-mono font-bold text-xs">
                      {preset.icon}
                      <span>{preset.title}</span>
                    </div>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold border ${getSeverityBadge(
                        preset.severity
                      )}`}
                    >
                      {preset.severity}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{preset.description}</p>
                  <div className="text-[10px] font-mono text-slate-300 font-bold flex items-center justify-between pt-1 border-t border-slate-800">
                    <span>Delay Impact: +{preset.impactDelayMin} min</span>
                    <span className="text-cyan-400 uppercase">Dispatch →</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Active Incidents List */}
          <div className="space-y-2.5 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between font-mono">
              <span className="text-xs font-bold text-white uppercase">
                Active Metropolitan Grid Incidents ({activeIncidents.length})
              </span>
              <span className="text-[11px] text-slate-500">Autonomous Rerouting Active</span>
            </div>

            {activeIncidents.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 text-center text-xs text-slate-500 font-mono">
                No active incidents reported on the grid. Network running at optimal green efficiency.
              </div>
            ) : (
              <div className="space-y-2">
                {activeIncidents.map((inc) => {
                  const node = intersections.find((n) => n.id === inc.junctionId);
                  return (
                    <div
                      key={inc.id}
                      className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-start justify-between gap-3 font-mono"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-1.5 py-0.2 rounded text-[9px] font-bold border ${getSeverityBadge(
                              inc.severity
                            )}`}
                          >
                            {inc.severity}
                          </span>
                          <span className="text-xs font-bold text-white">{inc.title}</span>
                          <span className="text-[10px] text-slate-400">
                            [{node?.code || inc.junctionId}]
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-sans">{inc.description}</p>
                        <div className="text-[10px] text-slate-500">
                          Reported: {new Date(inc.reportedAt).toLocaleTimeString()} • Impact Delay:{' '}
                          <strong className="text-amber-300">+{inc.impactDelayMin} mins</strong>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          soundEffects.playSuccess();
                          onResolveIncident(inc.id);
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-700 text-xs font-bold flex items-center gap-1 transition shrink-0 cursor-pointer"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Resolve</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
