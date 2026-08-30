import React, { useState } from 'react';
import { CloudRain, Sun, Wind, CloudFog, Thermometer, Droplets, Compass } from 'lucide-react';
import { soundEffects } from '../../utils/soundEffects';

export type WeatherType = 'CLEAR' | 'MONSOON' | 'FOG' | 'HEATWAVE';

export interface WeatherTelemetry {
  type: WeatherType;
  label: string;
  temperature: number;
  humidity: number;
  aqi: number;
  aqiStatus: 'Good' | 'Moderate' | 'Poor' | 'Hazardous';
  frictionCoefficient: number;
  brakingDistanceMultiplier: number;
  recommendedYellowTime: number;
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
    label: 'Monsoon Rain',
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
    label: 'Smog / Fog',
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
    label: 'Heatwave',
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
        return <Sun className="w-3.5 h-3.5 text-amber-500 dark:text-zinc-300" />;
      case 'MONSOON':
        return <CloudRain className="w-3.5 h-3.5 text-cyan-500 dark:text-zinc-300" />;
      case 'FOG':
        return <CloudFog className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-300" />;
      case 'HEATWAVE':
        return <Thermometer className="w-3.5 h-3.5 text-rose-500 dark:text-zinc-300" />;
    }
  };

  return (
    <div className="bg-white/90 dark:bg-[#0a0a0a]/75 backdrop-blur-md p-4 rounded-lg border border-slate-200 dark:border-[#1f1f23]/80 hover:border-slate-300 dark:hover:border-[#333338] space-y-3 text-slate-900 dark:text-white transition shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-200 dark:border-[#1f1f23]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex items-center justify-center">
            {getWeatherIcon(currentWeather.type)}
          </div>
          <div>
            <h3 className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider">
              Environment &amp; AQI Telemetry
            </h3>
            <span className="text-[10px] text-slate-500 dark:text-zinc-500 font-mono">
              Delhi-NCR Station · 28.61° N, 77.20° E
            </span>
          </div>
        </div>

        {/* Preset Selector */}
        <select
          value={currentWeather.type}
          onChange={(e) => handleSelectWeather(e.target.value as WeatherType)}
          className="px-2.5 py-1 rounded bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-slate-400 dark:focus:border-zinc-600 transition cursor-pointer"
        >
          <option value="CLEAR">Clear (32°C)</option>
          <option value="MONSOON">Monsoon (26°C)</option>
          <option value="FOG">Smog/Fog (14°C)</option>
          <option value="HEATWAVE">Heatwave (44°C)</option>
        </select>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono">
        <div className="p-2 rounded bg-slate-50 dark:bg-black border border-slate-200 dark:border-[#1f1f23] text-center">
          <div className="flex items-center justify-center gap-1 text-[10px] font-sans text-slate-500 dark:text-zinc-500 uppercase">
            <Thermometer className="w-3 h-3 text-slate-400 dark:text-zinc-400" />
            <span>Ambient Temp</span>
          </div>
          <div className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
            {currentWeather.temperature}°C
          </div>
        </div>

        <div className="p-2 rounded bg-slate-50 dark:bg-black border border-slate-200 dark:border-[#1f1f23] text-center">
          <div className="flex items-center justify-center gap-1 text-[10px] font-sans text-slate-500 dark:text-zinc-500 uppercase">
            <Droplets className="w-3 h-3 text-slate-400 dark:text-zinc-400" />
            <span>Humidity</span>
          </div>
          <div className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
            {currentWeather.humidity}%
          </div>
        </div>

        <div className="p-2 rounded bg-slate-50 dark:bg-black border border-slate-200 dark:border-[#1f1f23] text-center">
          <div className="flex items-center justify-center gap-1 text-[10px] font-sans text-slate-500 dark:text-zinc-500 uppercase">
            <Wind className="w-3 h-3 text-slate-400 dark:text-zinc-400" />
            <span>AQI (PM2.5)</span>
          </div>
          <div className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
            {currentWeather.aqi} <span className="text-xs text-slate-500 dark:text-zinc-500 font-normal">({currentWeather.aqiStatus})</span>
          </div>
        </div>

        <div className="p-2 rounded bg-slate-50 dark:bg-black border border-slate-200 dark:border-[#1f1f23] text-center">
          <div className="flex items-center justify-center gap-1 text-[10px] font-sans text-slate-500 dark:text-zinc-500 uppercase">
            <Compass className="w-3 h-3 text-slate-400 dark:text-zinc-400" />
            <span>Road Grip (μ)</span>
          </div>
          <div className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
            {currentWeather.frictionCoefficient}
          </div>
        </div>
      </div>

      {/* Safety Compensation Line */}
      <div className="p-2 rounded bg-slate-50 dark:bg-black border border-slate-200 dark:border-[#1f1f23] flex items-center justify-between text-xs font-mono">
        <span className="text-slate-600 dark:text-zinc-400">
          Safety Adjustment: Braking distance x{currentWeather.brakingDistanceMultiplier} · Yellow interval: {currentWeather.recommendedYellowTime}s
        </span>
        <span className="text-[10px] text-slate-500 dark:text-zinc-500">Autonomous Hold</span>
      </div>
    </div>
  );
};
