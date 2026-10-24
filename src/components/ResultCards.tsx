import React from 'react';
import { AnalysisResult } from '../solver/types';
import { ArrowUpRight, Gauge, Activity } from 'lucide-react';

interface ResultCardsProps {
  result: AnalysisResult;
}

export const ResultCards: React.FC<ResultCardsProps> = ({ result }) => {
  if (!result.isValid) return null;

  const { reactions, extrema, config } = result;

  const ra_kN = (reactions.RA / 1000).toFixed(3);
  const rb_kN = (reactions.RB / 1000).toFixed(3);
  const ma_kNm = (reactions.MA / 1000).toFixed(3);

  const maxShear_kN = (
    Math.max(Math.abs(extrema.minShear.value), Math.abs(extrema.maxShear.value)) / 1000
  ).toFixed(3);

  const maxMoment_kNm = (
    Math.max(Math.abs(extrema.minMoment.value), Math.abs(extrema.maxMoment.value)) / 1000
  ).toFixed(3);

  const maxDeflection_mm = (Math.abs(extrema.maxAbsDeflection.value) * 1000).toFixed(3);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:grid-cols-3">
      {/* Reactions Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg space-y-2 print:border-slate-300">
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider print:text-slate-800">
          <ArrowUpRight className="w-4 h-4" />
          <span>Support Reactions</span>
        </div>
        <div className="space-y-1 font-mono text-sm">
          <div className="flex justify-between py-1 border-b border-slate-800 text-slate-300">
            <span>RA (x = 0m):</span>
            <span className="font-bold text-emerald-300">{ra_kN} kN</span>
          </div>
          {config.supportType === 'simply_supported' ? (
            <div className="flex justify-between py-1 border-b border-slate-800 text-slate-300">
              <span>RB (x = {config.length}m):</span>
              <span className="font-bold text-emerald-300">{rb_kN} kN</span>
            </div>
          ) : (
            <div className="flex justify-between py-1 border-b border-slate-800 text-slate-300">
              <span>MA Fixed Moment:</span>
              <span className="font-bold text-emerald-300">{ma_kNm} kNm</span>
            </div>
          )}
        </div>
      </div>

      {/* Internal Forces Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg space-y-2 print:border-slate-300">
        <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider print:text-slate-800">
          <Gauge className="w-4 h-4" />
          <span>Peak Internal Actions</span>
        </div>
        <div className="space-y-1 font-mono text-sm">
          <div className="flex justify-between py-1 border-b border-slate-800 text-slate-300">
            <span>Peak Shear |Vmax|:</span>
            <span className="font-bold text-indigo-300">{maxShear_kN} kN</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-800 text-slate-300">
            <span>Peak Moment |Mmax|:</span>
            <span className="font-bold text-indigo-300">{maxMoment_kNm} kNm</span>
          </div>
        </div>
      </div>

      {/* Deflection Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg space-y-2 print:border-slate-300">
        <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider print:text-slate-800">
          <Activity className="w-4 h-4" />
          <span>Max Deflection</span>
        </div>
        <div className="space-y-1 font-mono text-sm">
          <div className="flex justify-between py-1 border-b border-slate-800 text-slate-300">
            <span>|\delta max|:</span>
            <span className="font-bold text-amber-300">{maxDeflection_mm} mm</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-800 text-slate-300 text-xs">
            <span>Location x:</span>
            <span className="text-slate-400">{extrema.maxAbsDeflection.x.toFixed(3)} m</span>
          </div>
        </div>
      </div>
    </div>
  );
};
