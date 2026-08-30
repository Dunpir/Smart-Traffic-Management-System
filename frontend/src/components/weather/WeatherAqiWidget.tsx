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
        return <Sun className="w-5 h-5 text-amber-400" />;
      case 'MONSOON':
        return <CloudRain className="w-5 h-5 text-blue-400" />;
      case 'FOG':
        return <CloudFog className="w-5 h-5 text-slate-400" />;
      case 'HEATWAVE':
        return <Thermometer className="w-5 h-5 text-rose-500" />;
    }
  };

  const getAqiBadgeColor = (status: WeatherTelemetry['aqiStatus']) => {
    switch (status) {
      case 'Good':
        return 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30';
      case 'Moderate':
        return 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30';
      case 'Poor':
        return 'bg-orange-500/20 text-orange-700 dark:text-orange-300 border-orange-500/30';
      case 'Hazardous':
        return 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/30 animate-pulse';
    }
  };

  return (
    <div className="card-modern p-5 rounded-3xl space-y-4">
      {/* Header & Weather Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-100 dark:border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-500/30 flex items-center justify-center">
            {getWeatherIcon(currentWeather.type)}
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Environment &amp; AQI Telemetry
            </h3>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
              Delhi-NCR Station • 28.61° N, 77.20° E
            </span>
          </div>
        </div>

        {/* Preset Selector */}
        <select
          value={currentWeather.type}
          onChange={(e) => handleSelectWeather(e.target.value as WeatherType)}
          className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/15 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="CLEAR">☀️ Clear (32°C)</option>
          <option value="MONSOON">🌧️ Monsoon Deluge (26°C)</option>
          <option value="FOG">🌫️ Dense Smog (14°C)</option>
          <option value="HEATWAVE">🔥 Heatwave (44°C)</option>
        </select>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {/* Temperature */}
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 text-center">
          <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-slate-400 uppercase">
            <Thermometer className="w-3.5 h-3.5 text-rose-500" />
            <span>Ambient Temp</span>
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white mt-1 font-mono">
            {currentWeather.temperature}°C
          </div>
        </div>

        {/* Humidity */}
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 text-center">
          <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-slate-400 uppercase">
            <Droplets className="w-3.5 h-3.5 text-blue-500" />
            <span>Humidity</span>
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white mt-1 font-mono">
            {currentWeather.humidity}%
          </div>
        </div>

        {/* Air Quality Index (AQI) */}
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 text-center">
          <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-slate-400 uppercase">
            <Wind className="w-3.5 h-3.5 text-indigo-500" />
            <span>AQI (PM2.5)</span>
          </div>
          <div className="flex items-center justify-center gap-1.5 mt-1">
            <span className="text-xl font-black text-slate-900 dark:text-white font-mono">
              {currentWeather.aqi}
            </span>
            <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold border ${getAqiBadgeColor(currentWeather.aqiStatus)}`}>
              {currentWeather.aqiStatus}
            </span>
          </div>
        </div>

        {/* Road Surface Friction (Mu) */}
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 text-center">
          <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-slate-400 uppercase">
            <Compass className="w-3.5 h-3.5 text-emerald-500" />
            <span>Road Grip (μ)</span>
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white mt-1 font-mono">
            {currentWeather.frictionCoefficient}
          </div>
        </div>
      </div>

      {/* Dynamic Traffic Adaptation Box */}
      <div className="p-3 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-500/30 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          {currentWeather.frictionCoefficient < 0.6 ? (
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          ) : (
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          )}
          <div>
            <span className="font-bold text-blue-950 dark:text-blue-200">
              Safety Modifiers Active:
            </span>{' '}
            <span className="text-slate-600 dark:text-slate-300">
              Braking Distance x{currentWeather.brakingDistanceMultiplier} • Yellow Interval: {currentWeather.recommendedYellowTime}s
            </span>
          </div>
        </div>

        <span className="hidden md:inline text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-600/20 text-blue-700 dark:text-blue-300 border border-blue-500/30 shrink-0">
          AUTONOMOUS COMPENSATION
        </span>
      </div>
    </div>
  );
};
