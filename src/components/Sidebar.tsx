import React, { useState } from 'react';
import { BeamConfig, Load, PointForceLoad, PointCoupleLoad, DistributedLoad } from '../solver/types';
import { PRESETS } from '../presets';
import { Plus, Trash2, RotateCcw, Download, Upload, Play, AlertCircle } from 'lucide-react';

interface SidebarProps {
  config: BeamConfig;
  onChange: (newConfig: BeamConfig) => void;
  onSolve: () => void;
  isStale: boolean;
  validationErrors: string[];
  onExportJSON: () => void;
  onImportJSON: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onReset: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  config,
  onChange,
  onSolve,
  isStale,
  validationErrors,
  onExportJSON,
  onImportJSON,
  onReset,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<string>('');

  const updateField = <K extends keyof BeamConfig>(field: K, value: BeamConfig[K]) => {
    onChange({ ...config, [field]: value });
  };

  const handleAddLoad = (type: Load['type']) => {
    const id = 'load_' + Math.random().toString(36).substring(2, 9);
    let newLoad: Load;

    if (type === 'point_force') {
      newLoad = {
        id,
        type: 'point_force',
        x: Math.round((config.length / 2) * 100) / 100,
        magnitude: -10,
      };
    } else if (type === 'point_couple') {
      newLoad = {
        id,
        type: 'point_couple',
        x: Math.round((config.length / 2) * 100) / 100,
        magnitude: 15,
      };
    } else {
      newLoad = {
        id,
        type: 'distributed',
        x1: 0,
        x2: Math.round(config.length * 100) / 100,
        w1: -5,
        w2: -5,
      };
    }

    onChange({
      ...config,
      loads: [...config.loads, newLoad],
    });
  };

  const handleUpdateLoad = (id: string, updatedFields: Partial<Load>) => {
    const newLoads = config.loads.map((load) => {
      if (load.id === id) {
        return { ...load, ...updatedFields } as Load;
      }
      return load;
    });
    onChange({ ...config, loads: newLoads });
  };

  const handleDeleteLoad = (id: string) => {
    onChange({
      ...config,
      loads: config.loads.filter((l) => l.id !== id),
    });
  };

  const handleSelectPreset = (name: string) => {
    setSelectedPreset(name);
    const found = PRESETS.find((p) => p.name === name);
    if (found) {
      onChange(JSON.parse(JSON.stringify(found.config)));
    }
  };

  return (
    <aside className="w-full lg:w-96 bg-slate-900 border-r border-slate-800 flex flex-col h-full overflow-y-auto text-slate-200 p-4 space-y-6 shrink-0 print:hidden">
      {/* Header / Solve Button */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block"></span>
            Beam Model Config
          </h2>
          {isStale && (
            <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded font-medium animate-pulse">
              Stale Results
            </span>
          )}
        </div>

        <button
          onClick={onSolve}
          className={`w-full py-2.5 px-4 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all shadow-md ${
            isStale
              ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
              : 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30'
          }`}
        >
          <Play className="w-4 h-4 fill-current" />
          {isStale ? 'Solve Beam Model' : 'Model Solved'}
        </button>

        {validationErrors.length > 0 && (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg p-3 text-xs text-rose-300 space-y-1">
            <div className="font-semibold flex items-center gap-1.5 text-rose-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Validation Errors:</span>
            </div>
            <ul className="list-disc list-inside space-y-0.5 text-rose-200">
              {validationErrors.map((err, idx) => (
                <li key={idx}>{err}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Preset Selector */}
      <div className="space-y-2 border-t border-slate-800 pt-4">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
          Presets
        </label>
        <select
          value={selectedPreset}
          onChange={(e) => handleSelectPreset(e.target.value)}
          className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
        >
          <option value="">Select a Benchmark Preset...</option>
          {PRESETS.map((p) => (
            <option key={p.name} value={p.name}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {/* Geometry & Supports */}
      <div className="space-y-4 border-t border-slate-800 pt-4">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Geometry & Material
        </h3>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-400 block mb-1">
              Length L (m)
            </label>
            <input
              type="number"
              step="0.1"
              min="0.1"
              value={config.length}
              onChange={(e) => updateField('length', parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1">
              Support Type
            </label>
            <select
              value={config.supportType}
              onChange={(e) => updateField('supportType', e.target.value as BeamConfig['supportType'])}
              className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
            >
              <option value="simply_supported">Simply Supported</option>
              <option value="cantilever">Cantilever Fixed Left</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-400 block mb-1">
              Elasticity E (GPa)
            </label>
            <input
              type="number"
              step="1"
              min="0.1"
              value={config.elasticModulus}
              onChange={(e) => updateField('elasticModulus', parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1">
              Inertia Iz (mm⁴)
            </label>
            <input
              type="number"
              step="1000000"
              min="1"
              value={config.momentOfInertia}
              onChange={(e) => updateField('momentOfInertia', parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Applied Loads */}
      <div className="space-y-4 border-t border-slate-800 pt-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Applied Loads ({config.loads.length})
          </h3>
          <div className="flex gap-1">
            <button
              title="Add Point Force"
              onClick={() => handleAddLoad('point_force')}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-xs text-indigo-300 rounded border border-slate-700 flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> Force
            </button>
            <button
              title="Add Point Couple"
              onClick={() => handleAddLoad('point_couple')}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-xs text-indigo-300 rounded border border-slate-700 flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> Couple
            </button>
            <button
              title="Add Distributed Load"
              onClick={() => handleAddLoad('distributed')}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-xs text-indigo-300 rounded border border-slate-700 flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> Distr
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {config.loads.length === 0 ? (
            <p className="text-xs text-slate-500 italic text-center py-3">
              No loads added yet. Click above to add forces, couples, or distributed loads.
            </p>
          ) : (
            config.loads.map((load, idx) => (
              <div
                key={load.id}
                className="bg-slate-800/80 border border-slate-700/80 rounded-lg p-3 space-y-2.5"
              >
                <div className="flex items-center justify-between text-xs font-medium text-slate-300">
                  <span className="capitalize text-indigo-400 font-semibold">
                    #{idx + 1} {load.type.replace('_', ' ')}
                  </span>
                  <button
                    onClick={() => handleDeleteLoad(load.id)}
                    className="text-slate-500 hover:text-rose-400 p-0.5 rounded transition-colors"
                    title="Delete load"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {load.type === 'point_force' && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-400 block">
                        Pos x (m)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={(load as PointForceLoad).x}
                        onChange={(e) =>
                          handleUpdateLoad(load.id, { x: parseFloat(e.target.value) || 0 })
                        }
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block">
                        Magnitude P (kN)
                      </label>
                      <input
                        type="number"
                        step="1"
                        value={(load as PointForceLoad).magnitude}
                        onChange={(e) =>
                          handleUpdateLoad(load.id, { magnitude: parseFloat(e.target.value) || 0 })
                        }
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200"
                      />
                    </div>
                  </div>
                )}

                {load.type === 'point_couple' && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-400 block">
                        Pos x (m)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={(load as PointCoupleLoad).x}
                        onChange={(e) =>
                          handleUpdateLoad(load.id, { x: parseFloat(e.target.value) || 0 })
                        }
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block">
                        Moment Mc (kNm)
                      </label>
                      <input
                        type="number"
                        step="1"
                        value={(load as PointCoupleLoad).magnitude}
                        onChange={(e) =>
                          handleUpdateLoad(load.id, { magnitude: parseFloat(e.target.value) || 0 })
                        }
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200"
                      />
                    </div>
                  </div>
                )}

                {load.type === 'distributed' && (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-400 block">
                          Start x1 (m)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={(load as DistributedLoad).x1}
                          onChange={(e) =>
                            handleUpdateLoad(load.id, { x1: parseFloat(e.target.value) || 0 })
                          }
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 block">
                          End x2 (m)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={(load as DistributedLoad).x2}
                          onChange={(e) =>
                            handleUpdateLoad(load.id, { x2: parseFloat(e.target.value) || 0 })
                          }
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-400 block">
                          Intensity w1 (kN/m)
                        </label>
                        <input
                          type="number"
                          step="1"
                          value={(load as DistributedLoad).w1}
                          onChange={(e) =>
                            handleUpdateLoad(load.id, { w1: parseFloat(e.target.value) || 0 })
                          }
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 block">
                          Intensity w2 (kN/m)
                        </label>
                        <input
                          type="number"
                          step="1"
                          value={(load as DistributedLoad).w2}
                          onChange={(e) =>
                            handleUpdateLoad(load.id, { w2: parseFloat(e.target.value) || 0 })
                          }
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Persistence & Actions */}
      <div className="border-t border-slate-800 pt-4 space-y-2">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          File & Reset
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onExportJSON}
            className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-xs text-slate-200 flex items-center justify-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" /> Save JSON
          </button>
          <label className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-xs text-slate-200 flex items-center justify-center gap-1.5 cursor-pointer">
            <Upload className="w-3.5 h-3.5" /> Load JSON
            <input
              type="file"
              accept=".json"
              onChange={onImportJSON}
              className="hidden"
            />
          </label>
        </div>
        <button
          onClick={onReset}
          className="w-full py-1.5 px-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded text-xs flex items-center justify-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Reset Model
        </button>
      </div>
    </aside>
  );
};
