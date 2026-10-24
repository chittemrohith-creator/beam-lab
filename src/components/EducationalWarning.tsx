import React from 'react';
import { AlertTriangle } from 'lucide-react';

export const EducationalWarning: React.FC = () => {
  return (
    <div className="bg-amber-500/15 border-b border-amber-500/30 text-amber-200 px-4 py-2 text-xs md:text-sm flex items-center justify-center gap-2 text-center select-none print:hidden">
      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
      <span>
        <strong>Educational & Engineering Calculation Tool:</strong> Beam Lab is strictly for educational purposes and is <strong>NOT certified for structural engineering design or construction</strong>.
      </span>
    </div>
  );
};
