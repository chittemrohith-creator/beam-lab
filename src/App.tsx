import React, { useState, useEffect } from 'react';
import { BeamConfig, AnalysisResult } from './solver/types';
import { analyzeBeam } from './solver/solver';
import { validateBeamConfig } from './solver/validation';
import { EducationalWarning } from './components/EducationalWarning';
import { Sidebar } from './components/Sidebar';
import { BeamCanvas } from './components/BeamCanvas';
import { ResultCards } from './components/ResultCards';
import { DiagramView } from './components/DiagramView';
import { HandCalcView } from './components/HandCalcView';
import { ResetModal } from './components/ResetModal';
import { PRESETS } from './presets';
import { exportToCSV, exportToJSON } from './export';
import { LOCAL_STORAGE_KEY } from './presets';
import { Printer, Download } from 'lucide-react';

const DEFAULT_CONFIG: BeamConfig = PRESETS[0].config;

export function App() {
  const [config, setConfig] = useState<BeamConfig>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.schemaVersion === 1 && parsed.model) {
          const val = validateBeamConfig(parsed.model);
          if (val.isValid) return parsed.model;
        }
      } catch {
        // Fallback to default config on parse error
      }
    }
    return DEFAULT_CONFIG;
  });

  const [activeTab, setActiveTab] = useState<'all' | 'sfd' | 'bmd' | 'deflection' | 'handcalc'>('all');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult>(() => analyzeBeam(config));
  const [isStale, setIsStale] = useState<boolean>(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isResetOpen, setIsResetOpen] = useState<boolean>(false);

  // Re-validate and mark results stale when config changes
  useEffect(() => {
    const val = validateBeamConfig(config);
    setValidationErrors(val.errors);
    setIsStale(true);

    // Save to localStorage
    try {
      localStorage.setItem(
        LOCAL_STORAGE_KEY,
        JSON.stringify({ schemaVersion: 1, model: config })
      );
    } catch {
      // ignore storage quota errors
    }
  }, [config]);

  const handleSolve = () => {
    const res = analyzeBeam(config);
    setAnalysisResult(res);
    setIsStale(false);
  };

  const handleConfigChange = (newConfig: BeamConfig) => {
    setConfig(newConfig);
  };

  const handleUpdateLoadPosition = (loadId: string, newX: number) => {
    const newLoads = config.loads.map((load) => {
      if (load.id === loadId) {
        if (load.type === 'point_force' || load.type === 'point_couple') {
          return { ...load, x: newX };
        }
      }
      return load;
    });
    setConfig({ ...config, loads: newLoads });
  };

  const handleExportCSV = () => {
    if (analysisResult.isValid) {
      exportToCSV(config, analysisResult.reactions, analysisResult.diagrams);
    }
  };

  const handleExportJSON = () => {
    exportToJSON(config);
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        const modelToLoad = parsed.model || parsed;
        const val = validateBeamConfig(modelToLoad);
        if (val.isValid) {
          setConfig(modelToLoad);
          const res = analyzeBeam(modelToLoad);
          setAnalysisResult(res);
          setIsStale(false);
        } else {
          alert('Invalid beam model file: ' + val.errors.join(', '));
        }
      } catch {
        alert('Failed to parse JSON model file.');
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmReset = () => {
    setConfig(DEFAULT_CONFIG);
    const res = analyzeBeam(DEFAULT_CONFIG);
    setAnalysisResult(res);
    setIsStale(false);
    setIsResetOpen(false);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased">
      {/* Educational Warning */}
      <EducationalWarning />

      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-3 flex items-center justify-between shrink-0 print:hidden">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-black text-white text-lg shadow-lg shadow-indigo-600/30">
            B
          </div>
          <div>
            <h1 className="text-base font-extrabold text-slate-100 tracking-tight flex items-center gap-2">
              Beam Lab <span className="text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded font-mono font-medium">MVP</span>
            </h1>
            <p className="text-[11px] text-slate-400">Euler-Bernoulli Structural Beam Solver</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            disabled={!analysisResult.isValid}
            className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-xs text-slate-200 border border-slate-700 rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> CSV Data
          </button>
          <button
            onClick={handlePrint}
            className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" /> Print Report
          </button>
        </div>
      </header>

      {/* Main Workbench Layout */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Control Sidebar */}
        <Sidebar
          config={config}
          onChange={handleConfigChange}
          onSolve={handleSolve}
          isStale={isStale}
          validationErrors={validationErrors}
          onExportJSON={handleExportJSON}
          onImportJSON={handleImportJSON}
          onReset={() => setIsResetOpen(true)}
        />

        {/* Right Main Canvas & Visualizations */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6 bg-slate-950 print:bg-white print:p-0">
          {/* Visual Beam Canvas */}
          <BeamCanvas config={config} onUpdateLoadPosition={handleUpdateLoadPosition} />

          {/* Results Section */}
          <ResultCards result={analysisResult} />

          {/* Visualization Navigation Tabs */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 print:hidden">
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  activeTab === 'all'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All Diagrams
              </button>
              <button
                onClick={() => setActiveTab('sfd')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  activeTab === 'sfd'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Shear (SFD)
              </button>
              <button
                onClick={() => setActiveTab('bmd')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  activeTab === 'bmd'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Moment (BMD)
              </button>
              <button
                onClick={() => setActiveTab('deflection')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  activeTab === 'deflection'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Deflection
              </button>
              <button
                onClick={() => setActiveTab('handcalc')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  activeTab === 'handcalc'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Hand Calculations
              </button>
            </div>
          </div>

          {/* Diagrams Display */}
          {(activeTab === 'all' || activeTab === 'sfd') && (
            <DiagramView result={analysisResult} type="shear" />
          )}

          {(activeTab === 'all' || activeTab === 'bmd') && (
            <DiagramView result={analysisResult} type="moment" />
          )}

          {(activeTab === 'all' || activeTab === 'deflection') && (
            <DiagramView result={analysisResult} type="deflection" />
          )}

          {activeTab === 'handcalc' && <HandCalcView result={analysisResult} />}
        </main>
      </div>

      {/* Confirmation Reset Modal */}
      <ResetModal
        isOpen={isResetOpen}
        onConfirm={handleConfirmReset}
        onCancel={() => setIsResetOpen(false)}
      />
    </div>
  );
}
