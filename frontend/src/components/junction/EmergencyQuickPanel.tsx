import React, { useState } from 'react';
import { Siren, Flame, Shield, ShieldAlert } from 'lucide-react';
import { Direction, EmergencyVehicleType, EmergencyEvent } from '../../types';
import { api } from '../../services/api';
import { soundEffects } from '../../utils/soundEffects';

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
      soundEffects.playEmergencySiren();
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
      soundEffects.playClick();
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
    <div className="bg-[#0a0a0a] border border-[#1f1f23] hover:border-[#333338] rounded-lg p-4 flex flex-col justify-between h-full transition text-white">
      <div>
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#1f1f23]">
          <div className="flex items-center gap-2 text-white font-semibold text-xs uppercase tracking-wider">
            <Siren className="w-3.5 h-3.5 text-zinc-400" />
            <span>Emergency Pre-emption</span>
          </div>

          {activeEmergency ? (
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-950 text-red-300 border border-red-800">
              ACTIVE
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded text-[10px] font-mono text-zinc-500 bg-zinc-900 border border-zinc-800">
              STANDBY
            </span>
          )}
        </div>

        <p className="text-xs text-zinc-400 mb-3 leading-relaxed">
          Pre-empt current cycle to clear conflicting directions and grant green corridor.
        </p>

        {/* Form Selection */}
        <div className="space-y-3">
          {/* Approach Selection */}
          <div>
            <label className="block text-[10px] font-mono text-zinc-500 uppercase mb-1">
              Approach Direction
            </label>
            <div className="grid grid-cols-4 gap-1.5 font-mono text-xs">
              {(['NORTH', 'SOUTH', 'EAST', 'WEST'] as Direction[]).map((d) => (
                <button
                  key={d}
                  onClick={() => {
                    soundEffects.playClick();
                    setSelectedDir(d);
                  }}
                  disabled={isSubmitting}
                  className={`py-1.5 px-2 rounded font-mono text-xs transition cursor-pointer ${
                    selectedDir === d
                      ? 'bg-white text-black font-bold'
                      : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Vehicle Type Selection */}
          <div>
            <label className="block text-[10px] font-mono text-zinc-500 uppercase mb-1">
              Vehicle Type
            </label>
            <div className="grid grid-cols-3 gap-1.5 text-xs">
              {(
                [
                  { type: 'AMBULANCE', icon: Siren, label: 'Ambulance' },
                  { type: 'FIRE_TRUCK', icon: Flame, label: 'Fire Truck' },
                  { type: 'POLICE', icon: Shield, label: 'Police' },
                ] as { type: EmergencyVehicleType; icon: React.ElementType; label: string }[]
              ).map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.type}
                    onClick={() => {
                      soundEffects.playClick();
                      setSelectedType(item.type);
                    }}
                    disabled={isSubmitting}
                    className={`py-2 px-2 rounded font-medium flex flex-col items-center gap-1 transition cursor-pointer ${
                      selectedType === item.type
                        ? 'bg-zinc-800 text-white border border-zinc-600'
                        : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                    }`}
                  >
                    <Icon className="w-4 h-4 text-zinc-300" />
                    <span className="text-[10px] font-mono">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-3 mt-3 border-t border-[#1f1f23] flex gap-2">
        {activeEmergency ? (
          <button
            onClick={handleClear}
            disabled={isSubmitting}
            className="w-full py-2 px-3 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700 text-xs font-semibold transition cursor-pointer"
          >
            <span>Resolve &amp; Resume Normal Cycle</span>
          </button>
        ) : (
          <button
            onClick={handleTrigger}
            disabled={isSubmitting}
            className="w-full py-2 px-3 rounded bg-white hover:bg-zinc-200 text-black text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Engage Emergency Priority</span>
          </button>
        )}
      </div>
    </div>
  );
};
