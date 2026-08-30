import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { TrafficHeroSection } from '@/components/ui/traffic-hero-section';
import {
  Mail,
  Lock,
  User,
  Building,
  ArrowRight,
  ShieldCheck,
  BookOpen,
  X,
  Sparkles,
  Activity,
  Navigation,
  FileCheck,
  Radio,
  Cpu,
  Layers,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export const LoginPage: React.FC = () => {
  const { login, register, demoLogin } = useAuth();

  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showResearchModal, setShowResearchModal] = useState(false);

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('Central Traffic Control Division');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (isRegisterMode) {
        if (!name.trim()) {
          setError('Please enter your full name');
          setIsLoading(false);
          return;
        }
        if (!email.trim()) {
          setError('Please enter your official email');
          setIsLoading(false);
          return;
        }
        await register(name, email, department, password);
      } else {
        if (!email.trim()) {
          setError('Please enter your email address');
          setIsLoading(false);
          return;
        }
        await login(email, password);
      }
    } catch (err) {
      setError('Authentication failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-[#050811] text-white selection:bg-teal-500 selection:text-white overflow-hidden font-sans">
      {/* Animated Traffic Management Hero Engine */}
      <TrafficHeroSection
        trafficDensity={1.3}
        speed={1.1}
        glowIntensity={1.2}
        className="min-h-screen"
      >
        {/* Top Navbar */}
        <header className="w-full flex items-center justify-between px-6 py-5 sm:px-10 lg:px-16 z-20 border-b border-white/10 backdrop-blur-md bg-black/30">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-teal-500/20 border border-teal-400/40 flex items-center justify-center shadow-lg shadow-teal-950/60">
              <Activity className="w-5 h-5 text-teal-300" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold tracking-wider text-white">TRAFIX</span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-teal-950/80 text-teal-300 border border-teal-500/30">
                  SMART CITY DBMS
                </span>
              </div>
              <span className="text-[11px] text-zinc-400 font-mono">
                Intelligent Adaptive Traffic Signal Grid
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-zinc-300 backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>J001 CENTRAL PLAZA LIVE</span>
            </div>

            <button
              onClick={demoLogin}
              className="px-4 py-2 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs transition flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 active:scale-95"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>1-Click Evaluator Demo</span>
            </button>
          </div>
        </header>

        {/* Hero Section Content */}
        <div className="flex-1 flex flex-col justify-center px-6 sm:px-10 lg:px-16 z-20 py-12 max-w-5xl">
          <div className="max-w-[42rem] space-y-6 animate-fadeIn">
            {/* Research Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-teal-500/30 text-teal-300 text-xs font-mono backdrop-blur-md shadow-lg shadow-teal-950/40">
              <Sparkles className="w-3.5 h-3.5 text-teal-400" />
              <span>NITRA CSE • IJSET 2025 Research Methodology Implementation</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.08]">
              Intelligent Traffic
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 via-cyan-200 to-emerald-400">
                Grid Optimization
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-sm sm:text-base text-zinc-300 leading-relaxed max-w-xl font-normal">
              Real-time graph-driven signal optimization, shortest job first queue allocation,
              automated ANPR violation enforcement, and green wave emergency clearance corridors.
            </p>

            {/* Live Metrics Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-2 max-w-xl font-mono">
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                <div className="text-xs text-zinc-400 mb-0.5">Efficiency</div>
                <div className="text-lg font-bold text-emerald-400">94.2%</div>
                <div className="text-[10px] text-zinc-500">Adaptive Flow</div>
              </div>

              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                <div className="text-xs text-zinc-400 mb-0.5">Emergency</div>
                <div className="text-lg font-bold text-teal-300">&lt;4.8s</div>
                <div className="text-[10px] text-zinc-500">Green Wave</div>
              </div>

              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                <div className="text-xs text-zinc-400 mb-0.5">Capacity</div>
                <div className="text-lg font-bold text-cyan-300">1,840/h</div>
                <div className="text-[10px] text-zinc-500">Vehicles/Lane</div>
              </div>

              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                <div className="text-xs text-zinc-400 mb-0.5">Database</div>
                <div className="text-lg font-bold text-orange-400">Neo4j</div>
                <div className="text-[10px] text-zinc-500">Graph Synced</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <button
                onClick={() => setShowAuthModal(true)}
                className="rounded-full bg-gradient-to-r from-teal-400 to-emerald-400 px-7 py-3.5 text-sm font-bold text-slate-950 transition hover:opacity-95 shadow-xl shadow-teal-500/25 active:scale-95 flex items-center gap-2"
              >
                <span>Launch Control Room</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => setShowResearchModal(true)}
                className="rounded-full border border-white/20 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white/90 transition hover:border-teal-400 hover:text-white backdrop-blur-sm flex items-center gap-2"
              >
                <BookOpen className="w-4 h-4 text-teal-400" />
                <span>Research Methodology</span>
              </button>
            </div>
          </div>
        </div>
      </TrafficHeroSection>

      {/* Control Room Auth Gateway Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fadeIn">
          <div className="relative w-full max-w-md bg-zinc-950/90 border border-white/20 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-2xl text-white">
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <div className="inline-block px-3 py-1 rounded-full bg-teal-950/80 border border-teal-500/30 text-[10px] font-mono font-bold uppercase tracking-widest text-teal-300 mb-2">
                TRAFIX ACCESS GATEWAY
              </div>
              <h3 className="text-xl font-bold text-white font-sans">
                {isRegisterMode ? 'Officer Registration' : 'Control Room Sign In'}
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                Authenticate with department credentials or use 1-Click Demo
              </p>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs font-mono">
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {isRegisterMode && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1.5 font-mono">
                      <User className="w-3.5 h-3.5 text-teal-400" />
                      <span>Full Name</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Officer Vikram Sharma"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-black/80 border border-white/15 text-white placeholder-zinc-500 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-400/50 transition"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1.5 font-mono">
                      <Building className="w-3.5 h-3.5 text-teal-400" />
                      <span>Department / Division</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Central Traffic Control Division"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-black/80 border border-white/15 text-white placeholder-zinc-500 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-400/50 transition"
                      required
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1.5 font-mono">
                  <Mail className="w-3.5 h-3.5 text-teal-400" />
                  <span>Official Email</span>
                </label>
                <input
                  type="email"
                  placeholder="officer@traffic.delhi.gov.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-black/80 border border-white/15 text-white placeholder-zinc-500 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-400/50 transition"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1.5 font-mono">
                  <Lock className="w-3.5 h-3.5 text-teal-400" />
                  <span>Password</span>
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-black/80 border border-white/15 text-white placeholder-zinc-500 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-400/50 transition"
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-teal-400 to-emerald-400 text-slate-950 font-bold text-sm shadow-xl flex items-center justify-center gap-2 transition active:scale-95 mt-2"
              >
                <span>
                  {isLoading
                    ? 'Authenticating...'
                    : isRegisterMode
                    ? 'Create Officer Account'
                    : 'Sign In to Control Room'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </form>

            {/* Mode Switcher */}
            <div className="mt-5 pt-3 border-t border-white/10 w-full text-center">
              <button
                type="button"
                onClick={() => {
                  setIsRegisterMode(!isRegisterMode);
                  setError(null);
                }}
                className="text-xs text-zinc-400 hover:text-white font-medium transition"
              >
                {isRegisterMode ? (
                  <span>
                    Already registered? <strong className="text-teal-300 underline">Sign in now</strong>
                  </span>
                ) : (
                  <span>
                    New officer?{' '}
                    <strong className="text-teal-300 underline">Register credentials</strong>
                  </span>
                )}
              </button>
            </div>

            {/* 1-Click Instant Login */}
            <div className="mt-3 pt-2 border-t border-white/10 w-full">
              <button
                type="button"
                onClick={demoLogin}
                className="w-full py-2.5 px-3 rounded-xl border border-emerald-500/30 bg-emerald-950/40 hover:bg-emerald-950/70 text-emerald-300 text-xs font-bold transition flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>1-Click Evaluator Instant Sign In</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Research Methodology & Algorithm Modal */}
      {showResearchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fadeIn">
          <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-zinc-950/95 border border-white/20 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-2xl text-white">
            <button
              onClick={() => setShowResearchModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-teal-950/80 border border-teal-500/40 text-teal-300 flex items-center justify-center">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white font-sans">
                  STMS Research Paper Specifications
                </h3>
                <span className="text-xs font-mono text-teal-400">
                  NITRA CSE 2025 • IJSET Adaptive Traffic Signal System
                </span>
              </div>
            </div>

            <div className="space-y-4 text-xs font-mono text-zinc-300 leading-relaxed">
              <p>
                The Smart Traffic Management System (STMS) solves junction congestion through automated computer vision density estimation and real-time scheduling:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <div className="font-bold text-teal-300 uppercase text-[11px] mb-1.5">
                    1. Adaptive Density Thresholds
                  </div>
                  <p className="text-zinc-400 text-[11px] leading-relaxed">
                    • 0 vehicles: 0s (skipped immediately)<br />
                    • 1–10 vehicles: 20s green<br />
                    • 11–30 vehicles: 30s green<br />
                    • &gt;30 vehicles: 60s max green
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <div className="font-bold text-emerald-300 uppercase text-[11px] mb-1.5">
                    2. Shortest Job First Priority
                  </div>
                  <p className="text-zinc-400 text-[11px] leading-relaxed">
                    Approaches sorted in descending congestion. The heaviest queue clears first, minimizing citywide wait time.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <div className="font-bold text-rose-300 uppercase text-[11px] mb-1.5">
                    3. Emergency Pre-emption
                  </div>
                  <p className="text-zinc-400 text-[11px] leading-relaxed">
                    Optical ambulance/fire-truck detection forces instant green waves, overriding normal cycle rotations.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <div className="font-bold text-orange-300 uppercase text-[11px] mb-1.5">
                    4. Neo4j Spatial Graph
                  </div>
                  <p className="text-zinc-400 text-[11px] leading-relaxed">
                    Models intersections as nodes and road segments as weighted edges to dynamically route green waves.
                  </p>
                </div>
              </div>

              <div className="pt-3 text-center">
                <button
                  onClick={() => {
                    setShowResearchModal(false);
                    setShowAuthModal(true);
                  }}
                  className="px-6 py-2.5 rounded-full bg-gradient-to-r from-teal-400 to-emerald-400 text-slate-950 font-bold text-xs transition shadow-lg hover:opacity-95"
                >
                  Proceed to Control Room
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
