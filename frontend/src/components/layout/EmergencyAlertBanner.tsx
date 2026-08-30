import React from 'react';
import { Siren, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { EmergencyEvent } from '../../types';
import { api } from '../../services/api';

interface EmergencyAlertBannerProps {
  emergency: EmergencyEvent;
  onClear: () => void;
}

export const EmergencyAlertBanner: React.FC<EmergencyAlertBannerProps> = ({
  emergency,
  onClear,
}) => {
  const handleClear = async () => {
    try {
      await api.resolveEmergency();
      onClear();
    } catch (e) {
      console.error('Failed to resolve emergency', e);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-rose-950/90 via-red-900/80 to-rose-950/90 border-2 border-rose-500/80 p-4 mb-4 shadow-2xl shadow-rose-950/80 animate-glow-red">
      {/* Background Animated Stripes */}
      <div className="absolute inset-0 opacity-10 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%,transparent_100%)] bg-[length:24px_24px] pointer-events-none" />

      <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Left icon and title */}
        <div className="flex items-center gap-3.5">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-rose-500/20 border border-rose-400/40 text-rose-400 shrink-0 shadow-lg shadow-rose-500/30 animate-bounce">
            <Siren className="w-7 h-7 text-rose-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-[10px] font-mono font-extrabold uppercase tracking-widest bg-rose-500 text-white rounded">
                CRITICAL PRIORITY
              </span>
              <h2 className="text-sm md:text-base font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <span>🚨 EMERGENCY VEHICLE DETECTED:</span>
                <span className="text-yellow-300 underline underline-offset-4">{emergency.vehicleType}</span>
              </h2>
            </div>
            <p className="text-xs text-rose-200/90 font-mono mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1">
              <span>Event ID: <strong className="text-white">{emergency.eventId}</strong></span>
              <span>•</span>
              <span>Approach: <strong className="text-emerald-300">{emergency.direction} ROAD ({emergency.roadId})</strong></span>
              <span>•</span>
              <span>Sensor: <strong className="text-white">{emergency.sensorId}</strong></span>
              <span>•</span>
              <span>Trigger: <strong className="text-cyan-300">{emergency.isSimulated ? 'SIMULATED TELEMETRY' : 'HARDWARE SENSOR'}</strong></span>
            </p>
          </div>
        </div>

        {/* Action Taken & Clear Button */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          <div className="text-left md:text-right font-mono">
            <div className="text-[11px] text-rose-300 uppercase tracking-wider font-semibold">Priority Action</div>
            <div className="text-xs text-white font-medium max-w-xs truncate">
              Green Corridor Granted • Conflicting Signals Locked RED
            </div>
          </div>

          <button
            onClick={handleClear}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/60 border border-emerald-400 transition-all transform active:scale-95 shrink-0"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>CLEAR CORRIDOR</span>
          </button>
        </div>
      </div>
    </div>
  );
};
