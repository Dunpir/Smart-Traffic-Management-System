import React from 'react';

interface TechnicalGridBackgroundProps {
  isDark?: boolean;
}

export const TechnicalGridBackground: React.FC<TechnicalGridBackgroundProps> = ({ isDark = true }) => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
      {/* High-Precision Technical Dot Grid */}
      <div
        className={`absolute inset-0 transition-opacity duration-500 ${
          isDark ? 'opacity-[0.14]' : 'opacity-[0.09]'
        }`}
        style={{
          backgroundImage: `radial-gradient(circle, ${isDark ? '#a1a1aa' : '#475569'} 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }}
      />

      {/* Radial Spotlight Vignette: softly focuses luminance on active command decks */}
      <div
        className={`absolute inset-0 transition-colors duration-500 ${
          isDark
            ? 'bg-[radial-gradient(ellipse_at_center,_transparent_20%,_rgba(9,9,11,0.75)_70%,_#09090b_100%)]'
            : 'bg-[radial-gradient(ellipse_at_center,_transparent_30%,_rgba(248,250,252,0.6)_75%,_#f8fafc_100%)]'
        }`}
      />

      {/* Faint Ambient Mission Control Glow */}
      {isDark && (
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-cyan-950/10 rounded-full blur-[140px] pointer-events-none" />
      )}

      {/* Technical Precision Coordinate Indicators (Desktop HUD) */}
      <div className="hidden lg:flex items-center justify-between px-6 pt-16 text-[9px] font-mono tracking-widest text-slate-400 dark:text-zinc-600/70">
        <div className="flex items-center gap-2">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-500/50 animate-pulse" />
          <span>GEO: 37°46'29"N · 122°25'10"W [EPSG:3857]</span>
        </div>
        <div className="flex items-center gap-4">
          <span>SPEC: NEMA-TS2 ACTUATED</span>
          <span>·</span>
          <span>HIL BRIDGE: ESP32 115200 8N1</span>
        </div>
      </div>

      <div className="hidden lg:flex items-center justify-between px-6 pb-4 absolute bottom-0 left-0 right-0 text-[9px] font-mono tracking-widest text-slate-400 dark:text-zinc-600/60">
        <div>NODE: JNC-04-METRO · CYCLE CLOCK: ACTUATED</div>
        <div>SAFETY INTERLOCK: SINGLE-GREEN ENFORCED</div>
      </div>

      {/* Subtle Corner Reticle Crosshairs */}
      <div className="hidden md:block absolute top-16 left-3 text-slate-300 dark:text-zinc-800 text-[10px] font-mono font-light">+</div>
      <div className="hidden md:block absolute top-16 right-3 text-slate-300 dark:text-zinc-800 text-[10px] font-mono font-light">+</div>
      <div className="hidden md:block absolute bottom-3 left-3 text-slate-300 dark:text-zinc-800 text-[10px] font-mono font-light">+</div>
      <div className="hidden md:block absolute bottom-3 right-3 text-slate-300 dark:text-zinc-800 text-[10px] font-mono font-light">+</div>
    </div>
  );
};

