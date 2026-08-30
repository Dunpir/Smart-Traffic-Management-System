import React, { useState } from 'react';
import { CloudRain, Sun, Wind, CloudFog, AlertTriangle, ShieldCheck, Thermometer, Droplets, Compass } from 'lucide-react';
import { soundEffects } from '../../utils/soundEffects';

export type WeatherType = 'CLEAR' | 'MONSOON' | 'FOG' | 'HEATWAVE';

export interface WeatherTelemetry {
  type: WeatherType;
  label: string;
  temperature: number; // °C
  humidity: number; // %
  aqi: number; // Air Quality Index
  aqiStatus: 'Good' | 'Moderate' | 'Poor' | 'Hazardous';
  frictionCoefficient: number; // mu: 0.85 (dry) to 0.40 (wet)
  brakingDistanceMultiplier: number;
  recommendedYellowTime: number; // seconds
}

export const WEATHER_PRESETS: Record<WeatherType, WeatherTelemetry> = {
  CLEAR: {
    type: 'CLEAR',
    label: 'Clear Sky / Optimal',
    temperature: 32,
    humidity: 48,
    aqi: 142,
    aqiStatus: 'Moderate',
    frictionCoefficient: 0.82,
    brakingDistanceMultiplier: 1.0,
    recommendedYellowTime: 3.0,
  },
  MONSOON: {
    type: 'MONSOON',
    label: 'Heavy Monsoon Deluge',
    temperature: 26,
    humidity: 92,
    aqi: 78,
    aqiStatus: 'Good',
    frictionCoefficient: 0.45,
    brakingDistanceMultiplier: 1.8,
    recommendedYellowTime: 4.5,
  },
  FOG: {
    type: 'FOG',
    label: 'Dense Winter Smog & Fog',
    temperature: 14,
    humidity: 88,
    aqi: 385,
    aqiStatus: 'Hazardous',
    frictionCoefficient: 0.62,
    brakingDistanceMultiplier: 1.45,
    recommendedYellowTime: 4.0,
  },
  HEATWAVE: {
    type: 'HEATWAVE',
    label: 'Extreme Summer Heatwave',
    temperature: 44,
    humidity: 28,
    aqi: 220,
    aqiStatus: 'Poor',
    frictionCoefficient: 0.76,
    brakingDistanceMultiplier: 1.15,
    recommendedYellowTime: 3.2,
  },
};

export const WeatherAqiWidget: React.FC = () => {
  const [currentWeather, setCurrentWeather] = useState<WeatherTelemetry>(WEATHER_PRESETS.CLEAR);

  const handleSelectWeather = (type: WeatherType) => {
    soundEffects.playClick();
    setCurrentWeather(WEATHER_PRESETS[type]);
  };

  const getWeatherIcon = (type: WeatherType) => {
    switch (type) {
      case 'CLEAR':
        return <Sun className="w-4 h-4 text-amber-400" />;
      case 'MONSOON':
        return <CloudRain className="w-4 h-4 text-cyan-400" />;
      case 'FOG':
        return <CloudFog className="w-4 h-4 text-zinc-400" />;
      case 'HEATWAVE':
        return <Thermometer className="w-4 h-4 text-rose-500" />;
    }
  };

  const getAqiBadgeColor = (status: WeatherTelemetry['aqiStatus']) => {
    switch (status) {
      case 'Good':
        return 'bg-emerald-950/80 text-emerald-400 border-emerald-800';
      case 'Moderate':
        return 'bg-amber-950/80 text-amber-400 border-amber-800';
      case 'Poor':
        return 'bg-orange-950/80 text-orange-400 border-orange-800';
      case 'Hazardous':
        return 'bg-rose-950/80 text-rose-400 border-rose-800 animate-pulse';
    }
  };

  return (
    <div className="bg-[#0a0a0a] p-5 rounded-xl border border-[#27272a] hover:border-zinc-700 space-y-4 text-white transition">
      {/* Header & Weather Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-[#1f1f23]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
            {getWeatherIcon(currentWeather.type)}
          </div>
          <div>
            <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
              Environment &amp; AQI Telemetry
            </h3>
            <span className="text-[10px] text-zinc-500 font-mono">
              Delhi-NCR Station · 28.61° N, 77.20° E
            </span>
          </div>
        </div>

        {/* Preset Selector */}
        <select
          value={currentWeather.type}
          onChange={(e) => handleSelectWeather(e.target.value as WeatherType)}
          className="px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-xs font-mono text-white focus:outline-none focus:border-zinc-600 transition cursor-pointer"
        >
          <option value="CLEAR">☀️ Clear (32°C)</option>
          <option value="MONSOON">🌧️ Monsoon Deluge (26°C)</option>
          <option value="FOG">🌫️ Dense Smog (14°C)</option>
          <option value="HEATWAVE">🔥 Heatwave (44°C)</option>
        </select>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono">
        {/* Temperature */}
        <div className="p-3 rounded-lg bg-black border border-[#27272a] text-center">
          <div className="flex items-center justify-center gap-1 text-[10px] font-sans text-zinc-500 uppercase">
            <Thermometer className="w-3.5 h-3.5 text-rose-400" />
            <span>Ambient Temp</span>
          </div>
          <div className="text-xl font-bold text-white mt-1">
            {currentWeather.temperature}°C
          </div>
        </div>

        {/* Humidity */}
        <div className="p-3 rounded-lg bg-black border border-[#27272a] text-center">
          <div className="flex items-center justify-center gap-1 text-[10px] font-sans text-zinc-500 uppercase">
            <Droplets className="w-3.5 h-3.5 text-cyan-400" />
            <span>Humidity</span>
          </div>
          <div className="text-xl font-bold text-white mt-1">
            {currentWeather.humidity}%
          </div>
        </div>

        {/* Air Quality Index (AQI) */}
        <div className="p-3 rounded-lg bg-black border border-[#27272a] text-center">
          <div className="flex items-center justify-center gap-1 text-[10px] font-sans text-zinc-500 uppercase">
            <Wind className="w-3.5 h-3.5 text-zinc-400" />
            <span>AQI (PM2.5)</span>
          </div>
          <div className="flex items-center justify-center gap-1.5 mt-1">
            <span className="text-xl font-bold text-white">
              {currentWeather.aqi}
            </span>
            <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono border ${getAqiBadgeColor(currentWeather.aqiStatus)}`}>
              {currentWeather.aqiStatus}
            </span>
          </div>
        </div>

        {/* Road Surface Friction (Mu) */}
        <div className="p-3 rounded-lg bg-black border border-[#27272a] text-center">
          <div className="flex items-center justify-center gap-1 text-[10px] font-sans text-zinc-500 uppercase">
            <Compass className="w-3.5 h-3.5 text-emerald-400" />
            <span>Road Grip (μ)</span>
          </div>
          <div className="text-xl font-bold text-white mt-1">
            {currentWeather.frictionCoefficient}
          </div>
        </div>
      </div>

      {/* Dynamic Traffic Adaptation Box */}
      <div className="p-3 rounded-lg bg-black border border-[#27272a] flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          {currentWeather.frictionCoefficient < 0.6 ? (
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          ) : (
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <div>
            <span className="font-semibold text-white">
              Safety Modifiers Active:
            </span>{' '}
            <span className="text-zinc-400 font-mono text-[11px]">
              Braking Distance x{currentWeather.brakingDistanceMultiplier} · Yellow Interval: {currentWeather.recommendedYellowTime}s
            </span>
          </div>
        </div>

        <span className="hidden md:inline text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 text-zinc-300 border border-zinc-800 shrink-0">
          AUTONOMOUS COMPENSATION
        </span>
      </div>
    </div>
  );
};
