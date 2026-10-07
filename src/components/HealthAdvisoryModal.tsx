import React from 'react';
import { X, ShieldAlert, Heart, Baby, CheckCircle2 } from 'lucide-react';

interface HealthAdvisoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HealthAdvisoryModal: React.FC<HealthAdvisoryModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-sky-500/10 rounded-xl border border-sky-500/20 text-sky-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white font-display">
                Singapore NEA Official Air Quality & Health Guide
              </h3>
              <p className="text-xs text-slate-400">
                Pollutant Standards Index (PSI) & 1-hr PM2.5 Action Thresholds
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 24-hr PSI Bands Table */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <span>1. 24-Hour PSI Air Quality Bands & Advisories</span>
          </h4>

          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-3">PSI Range</th>
                  <th className="p-3">Air Quality</th>
                  <th className="p-3">Healthy Persons</th>
                  <th className="p-3">Vulnerable Groups (Elderly/Kids/Asthma)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-normal">
                <tr className="hover:bg-slate-800/30">
                  <td className="p-3 font-mono font-bold text-emerald-400">0 – 50</td>
                  <td className="p-3 font-semibold text-emerald-400">Good</td>
                  <td className="p-3 text-slate-300">Normal outdoor activity</td>
                  <td className="p-3 text-slate-300">Normal outdoor activity</td>
                </tr>
                <tr className="hover:bg-slate-800/30">
                  <td className="p-3 font-mono font-bold text-sky-400">51 – 100</td>
                  <td className="p-3 font-semibold text-sky-400">Moderate</td>
                  <td className="p-3 text-slate-300">Normal outdoor activity</td>
                  <td className="p-3 text-slate-300">Normal outdoor activity</td>
                </tr>
                <tr className="hover:bg-slate-800/30">
                  <td className="p-3 font-mono font-bold text-amber-400">101 – 200</td>
                  <td className="p-3 font-semibold text-amber-400">Unhealthy</td>
                  <td className="p-3 text-slate-300">Reduce prolonged or strenuous exertion</td>
                  <td className="p-3 text-amber-300">Minimize outdoor physical exertion</td>
                </tr>
                <tr className="hover:bg-slate-800/30">
                  <td className="p-3 font-mono font-bold text-orange-400">201 – 300</td>
                  <td className="p-3 font-semibold text-orange-400">Very Unhealthy</td>
                  <td className="p-3 text-orange-300">Avoid prolonged strenuous exertion</td>
                  <td className="p-3 text-orange-300">Avoid outdoor activity. Stay indoors.</td>
                </tr>
                <tr className="hover:bg-slate-800/30">
                  <td className="p-3 font-mono font-bold text-rose-400">&gt; 300</td>
                  <td className="p-3 font-semibold text-rose-400">Hazardous</td>
                  <td className="p-3 text-rose-300 font-semibold">Minimize outdoor activity</td>
                  <td className="p-3 text-rose-300 font-semibold">Stay indoors with air filtration. Keep windows closed.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 1-hr PM2.5 Bands */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            2. 1-Hour PM2.5 Guide for Immediate Outdoor Planning
          </h4>
          <p className="text-xs text-slate-400">
            1-hr PM2.5 indicates short-term air quality fluctuations (e.g., sudden smoke plumes from regional fires).
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400">Band I: Normal (0 – 55 µg/m³)</span>
              </div>
              <p className="text-xs text-slate-300">Safe for all outdoor activities, workouts, and commuting.</p>
            </div>

            <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400">Band II: Elevated (56 – 150 µg/m³)</span>
              </div>
              <p className="text-xs text-slate-300">Normal for healthy persons; sensitive individuals should moderate exertion.</p>
            </div>

            <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-orange-400">Band III: High (151 – 250 µg/m³)</span>
              </div>
              <p className="text-xs text-slate-300">Reduce outdoor strenuous activities. Haze smell and reduced visibility likely.</p>
            </div>

            <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-400">Band IV: Very High (&gt; 250 µg/m³)</span>
              </div>
              <p className="text-xs text-slate-300">Avoid outdoor activities. Use air purifiers and close windows.</p>
            </div>
          </div>
        </div>

        {/* Practical Tips */}
        <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Protective Recommendations during Singapore Haze
          </h4>
          <ul className="space-y-2 text-xs text-slate-300">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>N95 Respirators:</strong> Surgical masks do not filter fine PM2.5 particulates. If outdoors during Unhealthy/Hazardous PSI, wear an N95 mask.</span>
            </li>
            <li className="flex items-start gap-2">
              <Heart className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span><strong>Chronic Heart / Lung Patients:</strong> Ensure relief medication (e.g., asthma inhalers) is readily accessible.</span>
            </li>
            <li className="flex items-start gap-2">
              <Baby className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span><strong>Children & Elderly:</strong> Avoid vigorous outdoor games when PSI exceeds 100.</span>
            </li>
          </ul>
        </div>

        <div className="pt-2 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition-colors"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
};
