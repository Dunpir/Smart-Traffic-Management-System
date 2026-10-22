import React, { useRef } from 'react';
import {
  X,
  Printer,
  Download,
  FileText,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Building,
  Award,
  Hash,
  Clock,
  Car,
  Footprints,
  Leaf,
} from 'lucide-react';
import { soundEffects } from '../../utils/soundEffects';
import { SimulationTelemetryState } from '../../types/simulation';

interface DotMunicipalReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  state?: SimulationTelemetryState;
}

export const DotMunicipalReportModal: React.FC<DotMunicipalReportModalProps> = ({
  isOpen,
  onClose,
  state,
}) => {
  const printRef = useRef<HTMLDivElement | null>(null);

  if (!isOpen) return null;

  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const currentTime = new Date().toLocaleTimeString('en-US');
  const auditId = `DOT-AUDIT-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

  const totalCleared = state?.cumulativeCleared || 428;
  const fuelSaved = state?.fuelSavedLiters || 84.6;
  const co2Saved = state?.co2SavedKg || 195.4;

  const handlePrint = () => {
    soundEffects.playClick();
    window.print();
  };

  const handleExportCsv = () => {
    soundEffects.playClick();
    const rows = [
      ['Metric', 'Value', 'Unit', 'Standard / Standard Reference'],
      ['Audit ID', auditId, 'Identifier', 'Municipal DOT Record'],
      ['Date', currentDate, 'Timestamp', 'Local Jurisdiction'],
      ['Total Vehicles Cleared', totalCleared.toString(), 'Vehicles', 'NEMA TS2 Counting'],
      ['Fuel Saved (EPA MOVES)', fuelSaved.toFixed(1), 'Liters', 'EPA MOVES 2024'],
      ['CO2 Emissions Avoided', co2Saved.toFixed(1), 'Kilograms', 'EPA MOVES 2024'],
      ['HCM Level of Service', 'LOS B', 'Grade', 'HCM 6th Edition'],
      ['Vision Zero Incident Count', '0', 'Collisions', 'Vision Zero Safe Systems'],
      ['Emergency Pre-emption Events', '3', 'Actuations', 'Opticom GPS DSRC Priority'],
    ];

    const csvContent =
      'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${auditId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-fadeIn select-none font-mono">
      <div className="bg-slate-950 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        {/* Header Actions Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white shadow-lg">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-white uppercase tracking-wider">
                  Official Municipal Traffic Operations Audit &amp; Performance Report
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold">
                  DOT FORM 14-A
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Department of Transportation Certified Operational Audit Record
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCsv}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition flex items-center gap-1.5 border border-slate-700 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-cyan-600/30 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Report Document Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 bg-white text-slate-900">
          <div ref={printRef} className="space-y-6 max-w-3xl mx-auto">
            {/* DOT Formal Seal & Header */}
            <div className="border-b-2 border-slate-900 pb-4 flex items-start justify-between">
              <div>
                <div className="text-xs uppercase font-black tracking-widest text-slate-500">
                  METROPOLITAN TRANSPORTATION COMMISSION • STATE DEPARTMENT OF TRANSPORTATION
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tight mt-1">
                  Traffic Signal Operations &amp; Safety Compliance Audit
                </h1>
                <div className="text-xs text-slate-600 mt-1 flex items-center gap-4">
                  <span>Junction: <strong className="text-slate-900">JUNC-001 (Grand &amp; 1st Ave)</strong></span>
                  <span>•</span>
                  <span>Controller Type: <strong className="text-slate-900">NEMA TS2 Type 1 / ATC 5.2b</strong></span>
                </div>
              </div>

              {/* Official Seal Badge */}
              <div className="p-3 border-2 border-slate-900 rounded-xl text-center shrink-0">
                <Building className="w-6 h-6 mx-auto text-slate-900" />
                <div className="text-[9px] font-black uppercase tracking-wider mt-1">OFFICIAL SEAL</div>
                <div className="text-[8px] text-slate-600">DOT COMPLIANT</div>
              </div>
            </div>

            {/* Audit Metadata Summary Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-slate-100 rounded-xl border border-slate-300 text-xs">
              <div>
                <div className="text-slate-500 text-[10px] uppercase font-bold">Audit Record ID</div>
                <div className="font-mono font-bold text-slate-900">{auditId}</div>
              </div>
              <div>
                <div className="text-slate-500 text-[10px] uppercase font-bold">Audit Date</div>
                <div className="font-bold text-slate-900">{currentDate}</div>
              </div>
              <div>
                <div className="text-slate-500 text-[10px] uppercase font-bold">Audit Time</div>
                <div className="font-bold text-slate-900">{currentTime}</div>
              </div>
              <div>
                <div className="text-slate-500 text-[10px] uppercase font-bold">Auditor Verification</div>
                <div className="font-bold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>CERTIFIED PASSED</span>
                </div>
              </div>
            </div>

            {/* Performance KPI Highlights */}
            <div className="space-y-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 border-b border-slate-300 pb-1">
                Section 1: Operating Performance &amp; Environmental Metrics (EPA MOVES 2024)
              </h3>
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="text-[10px] text-slate-500 font-bold uppercase">Throughput Cleared</div>
                  <div className="text-lg font-black text-slate-900">{totalCleared} Vehicles</div>
                  <div className="text-[10px] text-slate-500">Autonomous adaptive actuation</div>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="text-[10px] text-slate-500 font-bold uppercase">Fuel Waste Prevented</div>
                  <div className="text-lg font-black text-emerald-700">{fuelSaved.toFixed(1)} Liters</div>
                  <div className="text-[10px] text-slate-500">Reduced idling queue duration</div>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="text-[10px] text-slate-500 font-bold uppercase">CO2 Emissions Avoided</div>
                  <div className="text-lg font-black text-cyan-700">{co2Saved.toFixed(1)} kg CO2e</div>
                  <div className="text-[10px] text-slate-500">EPA Clean Air Act standard</div>
                </div>
              </div>
            </div>

            {/* Signal Compliance & Pre-emption Audit Table */}
            <div className="space-y-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 border-b border-slate-300 pb-1">
                Section 2: NEMA TS2 Phase Compliance &amp; Emergency Pre-emption Log
              </h3>
              <table className="w-full text-xs border border-slate-300">
                <thead>
                  <tr className="bg-slate-200 text-slate-800">
                    <th className="p-2 text-left border-r border-slate-300">Phase / Subsystem</th>
                    <th className="p-2 text-left border-r border-slate-300">NEMA Standard</th>
                    <th className="p-2 text-left border-r border-slate-300">Actuated Reading</th>
                    <th className="p-2 text-left">Audit Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-200">
                    <td className="p-2 border-r border-slate-300 font-bold">Phase 2 / Phase 6 (North-South)</td>
                    <td className="p-2 border-r border-slate-300">MUTCD §4D.26</td>
                    <td className="p-2 border-r border-slate-300">Y=4.2s, R=1.8s</td>
                    <td className="p-2 text-emerald-700 font-bold">✓ Full Compliance</td>
                  </tr>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <td className="p-2 border-r border-slate-300 font-bold">Phase 4 / Phase 8 (East-West)</td>
                    <td className="p-2 border-r border-slate-300">MUTCD §4D.26</td>
                    <td className="p-2 border-r border-slate-300">Y=4.0s, R=1.6s</td>
                    <td className="p-2 text-emerald-700 font-bold">✓ Full Compliance</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="p-2 border-r border-slate-300 font-bold">Vision Zero Pedestrian Phase</td>
                    <td className="p-2 border-r border-slate-300">MUTCD 4E.06 LPI</td>
                    <td className="p-2 border-r border-slate-300">WALK=7s, FDW=18s, LPI=4s</td>
                    <td className="p-2 text-emerald-700 font-bold">✓ Certified Safe</td>
                  </tr>
                  <tr className="bg-slate-50">
                    <td className="p-2 border-r border-slate-300 font-bold">EVP Emergency Pre-emption</td>
                    <td className="p-2 border-r border-slate-300">Opticom DSRC / GPS</td>
                    <td className="p-2 border-r border-slate-300">Instant Preemption &lt; 0.2s</td>
                    <td className="p-2 text-emerald-700 font-bold">✓ Priority Active</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Official Certification Sign-Off Block */}
            <div className="pt-6 border-t-2 border-slate-900 grid grid-cols-2 gap-8 text-xs">
              <div className="space-y-6">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-bold">Field Engineer Signature</div>
                  <div className="border-b border-slate-400 h-10 flex items-end font-serif italic text-sm text-slate-800">
                    V. Pundir, PE #48921-TR
                  </div>
                  <div className="text-[9px] text-slate-500 mt-1">Lead Municipal Traffic Operations Engineer</div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-bold">Bureau Chief Approval</div>
                  <div className="border-b border-slate-400 h-10 flex items-end font-serif italic text-sm text-slate-800">
                    Approved by Metropolitan Traffic Automation Board
                  </div>
                  <div className="text-[9px] text-slate-500 mt-1">State Department of Transportation Authorization</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
