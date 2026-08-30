"use client";

import React, { useEffect, useState } from "react";
import { TrafficHeroSection } from "@/components/ui/traffic-hero-section";
import { BlackHoleHeroSection } from "@/components/ui/blackhole-hero-section";

/** True while the viewport is narrow. Drives the layout swap below. */
function useNarrow(query = "(max-width: 767px)") {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const m = window.matchMedia(query);
    const sync = () => setNarrow(m.matches);
    sync();
    m.addEventListener("change", sync);
    return () => m.removeEventListener("change", sync);
  }, [query]);
  return narrow;
}

/**
 * Traffic Management System Hero Demo
 */
export function TrafficHeroSectionDemo() {
  return (
    <section className="relative min-h-[92svh] w-full md:min-h-[720px] rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
      <TrafficHeroSection trafficDensity={1.2} speed={1.1} glowIntensity={1.2}>
        <div className="flex h-full min-h-[92svh] items-center px-6 pt-14 sm:px-10 md:min-h-[720px] lg:px-20">
          <div className="max-w-[38rem]">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-teal-500/30 text-teal-300 text-xs font-mono mb-4 backdrop-blur-md">
              <span>TRAFIX • SMART CITY DBMS PROJECT</span>
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl">
              Intelligent Traffic
              <br />
              <span className="text-teal-400">Optimization</span>
            </h1>

            <p className="mt-6 max-w-md text-sm text-zinc-300 leading-relaxed md:mt-7">
              Real-time graph-driven signal optimization, automated ANPR violation enforcement, and green wave emergency corridors.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3 md:mt-10">
              <a
                href="#"
                className="rounded-full bg-teal-400 px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-teal-300 shadow-xl shadow-teal-500/20"
              >
                Launch Control Room
              </a>
              <a
                href="#"
                className="rounded-full border border-white/20 px-6 py-3 text-sm text-white/80 transition hover:border-white/40 hover:text-white"
              >
                Neo4j Architecture
              </a>
            </div>
          </div>
        </div>
      </TrafficHeroSection>
    </section>
  );
}

/**
 * Black Hole Space Hero Demo
 */
export default function BlackHoleHeroSectionDemo() {
  const narrow = useNarrow();

  return (
    <section className="relative min-h-[92svh] w-full md:min-h-[720px]">
      <BlackHoleHeroSection
        focus={narrow ? [0.5, 0.76] : [0.72, 0.46]}
        scrim={narrow ? "top" : "left"}
        scrimStrength={0.9}
        distance={24}
        elevation={narrow ? -7 : -5.5}
        fov={narrow ? 58 : 42}
        glow={narrow ? 0.85 : 1}
        steps={narrow ? 200 : 300}
        resolution={narrow ? 0.6 : 0.7}
      >
        <div className="flex h-full min-h-[92svh] items-start px-6 pt-14 sm:px-10 md:min-h-[720px] md:items-center md:pt-0 lg:px-20">
          <div className="max-w-[34rem]">
            <h1 className="text-[2.5rem] font-light leading-[1.05] tracking-[-0.03em] text-white sm:text-6xl lg:text-[4.25rem]">
              Light does not
              <br />
              leave here
            </h1>

            <p className="mt-6 max-w-md text-[0.95rem] leading-relaxed text-white/60 md:mt-7">
              The ring above the shadow is the far side of the disc, bent over
              the top. Nothing put it there but gravity.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3 md:mt-10">
              <a
                href="#"
                className="rounded-full bg-white px-6 py-3 text-sm font-medium text-black transition hover:bg-white/90"
              >
                Get started
              </a>
              <a
                href="#"
                className="rounded-full border border-white/20 px-6 py-3 text-sm text-white/80 transition hover:border-white/40 hover:text-white"
              >
                Read the maths
              </a>
            </div>
          </div>
        </div>
      </BlackHoleHeroSection>
    </section>
  );
}
