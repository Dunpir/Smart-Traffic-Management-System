import React, { useState } from 'react';
import { Siren, Flame, Shield, ShieldAlert } from 'lucide-react';
import { Direction, EmergencyVehicleType, EmergencyEvent } from '../../types';
import { api } from '../../services/api';

interface EmergencyQuickPanelProps {
  activeEmergency: EmergencyEvent | null;
  onRefresh: () => void;
}

export const EmergencyQuickPanel: React.FC<EmergencyQuickPanelProps> = ({
  activeEmergency,
  onRefresh,
}) => {
  const [selectedDir, setSelectedDir] = useState<Direction>('WEST');
  const [selectedType, setSelectedType] = useState<EmergencyVehicleType>('AMBULANCE');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleTrigger = async () => {
    try {
      setIsSubmitting(true);
      await api.triggerEmergency(selectedDir, selectedType);
      onRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClear = async () => {
    try {
      setIsSubmitting(true);
      await api.resolveEmergency();
      onRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/80 flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 text-rose-700 font-bold text-xs uppercase tracking-wider">
            <Siren className="w-4 h-4 text-rose-600" />
            <span>Emergency Priority System</span>
          </div>

          {activeEmergency ? (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-600 text-white">
              ACTIVE
            </span>
          ) : (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500">
              STANDBY
            </span>
          )}
        </div>

        <p className="text-xs text-slate-600 mb-3 leading-relaxed">
          Pre-empt current cycle to clear all conflicting directions and grant immediate green light corridor for emergency vehicles.
        </p>

        {/* Form Selection */}
        <div className="space-y-3">
          {/* Approach Selection */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Approach Direction
            </label>
            <div className="grid grid-cols-4 gap-1.5 font-mono text-xs">
              {(['NORTH', 'SOUTH', 'EAST', 'WEST'] as Direction[]).map((d) => (
                <button
                  key={d}
                  onClick={() => setSelectedDir(d)}
                  disabled={isSubmitting}
                  className={`py-1.5 px-2 rounded-xl font-bold transition ${selectedDir === d
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Vehicle Type Selection */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Vehicle Type
            </label>
            <div className="grid grid-cols-3 gap-1.5 text-xs">
              {(
                [
                  { type: 'AMBULANCE', icon: Siren, label: 'Ambulance' },
                  { type: 'FIRE_TRUCK', icon: Flame, label: 'Fire Truck' },
                  { type: 'POLICE', icon: Shield, label: 'Police' },
                ] as { type: EmergencyVehicleType; icon: any; label: string }[]
              ).map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.type}
                    onClick={() => setSelectedType(item.type)}
                    disabled={isSubmitting}
                    className={`py-2 px-2 rounded-xl font-bold flex flex-col items-center gap-1 transition ${selectedType === item.type
                      ? 'bg-rose-50 text-rose-800 border-2 border-rose-400'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                      }`}
                  >
                    <Icon className="w-4 h-4 text-rose-600" />
                    <span className="text-[10px]">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-4 mt-3 border-t border-slate-100 flex gap-2">
        {activeEmergency ? (
          <button
            onClick={handleClear}
            disabled={isSubmitting}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition flex items-center justify-center gap-2"
          >
            <span>Resolve &amp; Resume Normal Cycle</span>
          </button>
        ) : (
          <button
            onClick={handleTrigger}
            disabled={isSubmitting}
            className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm flex items-center justify-center gap-2 transition"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Engage Green Wave Pre-emption</span>
          </button>
        )}
      </div>
    </div>
  );
};
