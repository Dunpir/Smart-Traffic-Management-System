import React, { useState } from 'react';
import {
  X,
  CreditCard,
  QrCode,
  CheckCircle2,
  ShieldCheck,
  Smartphone,
  Lock,
  ArrowRight,
  Download,
  Printer,
  Sparkles,
  Building,
} from 'lucide-react';
import { ViolationRecord } from '../../types';
import { soundEffects } from '../../utils/soundEffects';

interface ChallanPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  violation: ViolationRecord | null;
  onPaymentSuccess: (id: string) => Promise<void>;
}

type PaymentMethod = 'UPI_QR' | 'UPI_APPS' | 'CARD' | 'NET_BANKING';

export const ChallanPaymentModal: React.FC<ChallanPaymentModalProps> = ({
  isOpen,
  onClose,
  violation,
  onPaymentSuccess,
}) => {
  const [method, setMethod] = useState<PaymentMethod>('UPI_QR');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [upiId, setUpiId] = useState<string>('driver@okhdfcbank');
  const [selectedApp, setSelectedApp] = useState<string>('gpay');

  if (!isOpen || !violation) return null;

  const fineAmount = violation.fineAmountInr || 2000;

  const handleSimulatePayment = async () => {
    setIsProcessing(true);
    soundEffects.playClick();

    setTimeout(async () => {
      setIsProcessing(false);
      setIsSuccess(true);
      soundEffects.playSuccess();
      await onPaymentSuccess(violation.id);
    }, 2200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in font-sans">
      <div className="relative w-full max-w-lg bg-slate-950 border border-emerald-500/40 rounded-3xl shadow-2xl shadow-emerald-950/60 overflow-hidden">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-4 bg-slate-900 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-500/50 text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Bharat E-Challan Secure Gateway
              </h3>
              <div className="text-[11px] text-slate-400 font-mono">
                Challan: <strong className="text-white">{violation.challanNumber}</strong>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          {/* Amount Due Card */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/60 to-cyan-950/60 border border-emerald-500/30 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-mono text-emerald-400 uppercase font-bold">
                Vehicle: {violation.plateNumber}
              </div>
              <div className="text-xs text-slate-300 font-sans mt-0.5">
                {violation.violationType.replace(/_/g, ' ')} ({violation.speedKmh ? `${violation.speedKmh} km/h` : 'ANPR Snapshot'})
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-mono text-slate-400 uppercase">Amount Due</div>
              <div className="text-xl font-extrabold text-white font-mono">
                ₹{fineAmount.toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          {!isSuccess ? (
            <>
              {/* Payment Method Selector Tabs */}
              <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-slate-900 border border-slate-800 font-mono text-[11px]">
                <button
                  onClick={() => setMethod('UPI_QR')}
                  className={`py-1.5 rounded-lg font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                    method === 'UPI_QR'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <QrCode className="w-3 h-3" />
                  <span>Scan QR</span>
                </button>

                <button
                  onClick={() => setMethod('UPI_APPS')}
                  className={`py-1.5 rounded-lg font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                    method === 'UPI_APPS'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Smartphone className="w-3 h-3" />
                  <span>UPI Apps</span>
                </button>

                <button
                  onClick={() => setMethod('CARD')}
                  className={`py-1.5 rounded-lg font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                    method === 'CARD'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <CreditCard className="w-3 h-3" />
                  <span>Cards</span>
                </button>

                <button
                  onClick={() => setMethod('NET_BANKING')}
                  className={`py-1.5 rounded-lg font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                    method === 'NET_BANKING'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Building className="w-3 h-3" />
                  <span>NetBank</span>
                </button>
              </div>

              {/* Method Detail View */}
              {method === 'UPI_QR' && (
                <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col items-center justify-center text-center space-y-3">
                  {/* Dynamic SVG QR Code Simulation */}
                  <div className="p-3 bg-white rounded-2xl shadow-xl shadow-black/40">
                    <svg className="w-36 h-36" viewBox="0 0 100 100">
                      {/* Outer Corners */}
                      <rect x="5" y="5" width="30" height="30" rx="3" fill="#0f172a" />
                      <rect x="10" y="10" width="20" height="20" rx="2" fill="#ffffff" />
                      <rect x="14" y="14" width="12" height="12" rx="1" fill="#0f172a" />

                      <rect x="65" y="5" width="30" height="30" rx="3" fill="#0f172a" />
                      <rect x="70" y="10" width="20" height="20" rx="2" fill="#ffffff" />
                      <rect x="74" y="14" width="12" height="12" rx="1" fill="#0f172a" />

                      <rect x="5" y="65" width="30" height="30" rx="3" fill="#0f172a" />
                      <rect x="10" y="70" width="20" height="20" rx="2" fill="#ffffff" />
                      <rect x="14" y="74" width="12" height="12" rx="1" fill="#0f172a" />

                      {/* Random QR Grid Data Blocks */}
                      <rect x="42" y="10" width="6" height="6" fill="#0f172a" />
                      <rect x="52" y="16" width="8" height="6" fill="#0f172a" />
                      <rect x="42" y="26" width="14" height="6" fill="#0f172a" />
                      <rect x="10" y="44" width="16" height="6" fill="#0f172a" />
                      <rect x="30" y="44" width="8" height="16" fill="#0f172a" />
                      <rect x="44" y="44" width="12" height="12" fill="#0f172a" />
                      <rect x="62" y="44" width="14" height="8" fill="#0f172a" />
                      <rect x="80" y="44" width="10" height="14" fill="#0f172a" />
                      <rect x="44" y="64" width="14" height="6" fill="#0f172a" />
                      <rect x="64" y="60" width="10" height="16" fill="#0f172a" />
                      <rect x="80" y="66" width="12" height="14" fill="#0f172a" />
                      <rect x="44" y="78" width="8" height="14" fill="#0f172a" />
                      <rect x="58" y="82" width="18" height="8" fill="#0f172a" />
                    </svg>
                  </div>
                  <div className="font-mono text-xs text-slate-300">
                    Scan with any UPI App (GPay / PhonePe / Paytm)
                  </div>
                  <div className="text-[10px] font-mono text-slate-500">
                    VPA: <strong className="text-cyan-400">delhi.traffic.police@sbi</strong>
                  </div>
                </div>
              )}

              {method === 'UPI_APPS' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2 font-mono text-xs">
                    {[
                      { id: 'gpay', name: 'Google Pay', icon: '🟢 GPay' },
                      { id: 'phonepe', name: 'PhonePe', icon: '🟣 PhonePe' },
                      { id: 'paytm', name: 'Paytm UPI', icon: '🔵 Paytm' },
                    ].map((app) => (
                      <button
                        key={app.id}
                        onClick={() => setSelectedApp(app.id)}
                        className={`p-3 rounded-xl border text-center transition cursor-pointer font-bold ${
                          selectedApp === app.id
                            ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <div>{app.icon}</div>
                        <div className="text-[10px] text-slate-500 mt-1">{app.name}</div>
                      </button>
                    ))}
                  </div>

                  <div className="space-y-1 font-mono text-xs">
                    <label className="text-slate-400 text-[10px] uppercase">Or Enter UPI ID / VPA:</label>
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-emerald-400 text-xs"
                      placeholder="e.g. mobile@upi"
                    />
                  </div>
                </div>
              )}

              {method === 'CARD' && (
                <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2.5 font-mono text-xs">
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase">Card Number</label>
                    <input
                      type="text"
                      defaultValue="4532 •••• •••• 8819"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs mt-1"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-400 uppercase">Expiry</label>
                      <input
                        type="text"
                        defaultValue="08 / 29"
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 uppercase">CVV</label>
                      <input
                        type="password"
                        defaultValue="•••"
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs mt-1"
                      />
                    </div>
                  </div>
                </div>
              )}

              {method === 'NET_BANKING' && (
                <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                  {['State Bank of India', 'HDFC Bank', 'ICICI Bank', 'Axis Bank', 'Punjab National Bank', 'Kotak Bank'].map(
                    (bank, idx) => (
                      <button
                        key={bank}
                        className={`p-2.5 rounded-xl border text-left text-xs font-bold transition cursor-pointer ${
                          idx === 0
                            ? 'bg-emerald-950/60 border-emerald-600 text-emerald-300'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        🏛️ {bank}
                      </button>
                    )
                  )}
                </div>
              )}

              {/* Pay Now Button */}
              <button
                onClick={handleSimulatePayment}
                disabled={isProcessing}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-950 cursor-pointer transition hover:scale-[1.01]"
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Authorizing Payment via NPCI Gateway...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>Authorize & Pay ₹{fineAmount.toLocaleString('en-IN')} Now</span>
                  </>
                )}
              </button>
            </>
          ) : (
            /* Success Receipt Screen */
            <div className="p-5 rounded-2xl bg-emerald-950/60 border border-emerald-500 text-center space-y-3 font-mono">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto animate-bounce">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                E-Challan Payment Settled Successfully
              </h4>
              <p className="text-xs text-slate-300 font-sans">
                Transaction ID: <strong className="text-cyan-400">TXN-UPI-{Date.now().toString().slice(-8)}</strong>
              </p>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 space-y-1 text-left">
                <div>Challan No: <span className="text-white font-bold">{violation.challanNumber}</span></div>
                <div>Status: <span className="text-emerald-400 font-bold">PAID (Clear Record in VAHAN)</span></div>
                <div>Amount: <span className="text-white font-bold">₹{fineAmount}</span></div>
                <div>Timestamp: <span className="text-slate-300">{new Date().toLocaleString()}</span></div>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  onClick={() => {
                    soundEffects.playClick();
                    onClose();
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition cursor-pointer"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    soundEffects.playClick();
                    window.print();
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Slip</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
