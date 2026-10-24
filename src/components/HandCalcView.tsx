import React from 'react';
import { AnalysisResult } from '../solver/types';
import { BookOpen, CheckCircle2 } from 'lucide-react';

interface HandCalcViewProps {
  result: AnalysisResult;
}

export const HandCalcView: React.FC<HandCalcViewProps> = ({ result }) => {
  if (!result.isValid || !result.handCalc) return null;

  const { steps } = result.handCalc;

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6 select-none print:border-slate-300">
      <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
        <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
          <BookOpen className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-100">Step-by-Step Hand Calculation Explanation</h3>
          <p className="text-xs text-slate-400">
            Analytical mechanics equations, static equilibrium, and integration constants.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {steps.map((step, idx) => (
          <div key={idx} className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-4 space-y-2">
            <h4 className="text-sm font-semibold text-indigo-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{step.title}</span>
            </h4>
            <div className="text-xs text-slate-300 font-mono leading-relaxed whitespace-pre-line pl-6">
              {step.description}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
