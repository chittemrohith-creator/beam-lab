import React from 'react';
import { AnalysisResult, PointForceLoad, PointCoupleLoad, DistributedLoad } from '../solver/types';

interface PrintReportProps {
  result: AnalysisResult;
}

export const PrintReport: React.FC<PrintReportProps> = ({ result }) => {
  if (!result || !result.isValid) return null;

  const { config, reactions, extrema, diagrams } = result;

  const renderDiagramSVG = (type: 'shear' | 'moment' | 'deflection') => {
    const svgWidth = 700;
    const svgHeight = 160;
    const paddingX = 60;
    const paddingY = 30;
    const chartWidth = svgWidth - 2 * paddingX;
    const chartHeight = svgHeight - 2 * paddingY;
    const L = config.length;

    const xToPx = (x: number) => paddingX + (x / L) * chartWidth;

    let title = '';
    let unit = '';
    let strokeColor = '#0284c7';
    let fillColor = 'rgba(2, 132, 199, 0.15)';
    let getValue = (pt: any) => pt.v / 1000;

    if (type === 'shear') {
      title = 'Shear Force Diagram (SFD)';
      unit = 'kN';
      strokeColor = '#0891b2';
      fillColor = 'rgba(8, 145, 178, 0.15)';
      getValue = (pt: any) => pt.v / 1000;
    } else if (type === 'moment') {
      title = 'Bending Moment Diagram (BMD)';
      unit = 'kNm';
      strokeColor = '#7c3aed';
      fillColor = 'rgba(124, 58, 237, 0.15)';
      getValue = (pt: any) => pt.m / 1000;
    } else if (type === 'deflection') {
      title = 'Elastic Deflection Curve';
      unit = 'mm';
      strokeColor = '#d97706';
      fillColor = 'rgba(217, 119, 6, 0.15)';
      getValue = (pt: any) => pt.deflection * 1000;
    }

    let realMax = 0;
    for (const pt of diagrams) {
      const val = Math.abs(getValue(pt));
      if (val > realMax) realMax = val;
    }
    const scaleMax = realMax > 0 ? realMax : 1;
    const zeroYPx = paddingY + chartHeight / 2;

    const valToPx = (val: number) => {
      const scale = (chartHeight / 2 - 8) / scaleMax;
      return zeroYPx - val * scale;
    };

    const pointsString = diagrams
      .map((pt) => `${xToPx(pt.x)},${valToPx(getValue(pt))}`)
      .join(' ');
    const areaPointsString = `${xToPx(0)},${zeroYPx} ${pointsString} ${xToPx(L)},${zeroYPx}`;

    return (
      <div className="mb-4 border border-slate-300 rounded p-3 bg-slate-50 print-avoid-break">
        <div className="flex justify-between items-center mb-1 text-xs font-bold text-slate-800">
          <span>{title}</span>
          <span>Max: {realMax.toFixed(3)} {unit}</span>
        </div>
        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto">
          <line
            x1={paddingX}
            y1={zeroYPx}
            x2={paddingX + chartWidth}
            y2={zeroYPx}
            stroke="#94a3b8"
            strokeWidth="1"
            strokeDasharray="4 2"
          />
          <polygon points={areaPointsString} fill={fillColor} />
          <polyline points={pointsString} fill="none" stroke={strokeColor} strokeWidth="2" />

          <text x={paddingX - 5} y={paddingY + 8} fill="#475569" fontSize="9" textAnchor="end">
            +{(realMax).toFixed(1)}
          </text>
          <text x={paddingX - 5} y={zeroYPx + 3} fill="#475569" fontSize="9" textAnchor="end">
            0
          </text>
          <text x={paddingX - 5} y={paddingY + chartHeight - 2} fill="#475569" fontSize="9" textAnchor="end">
            -{(realMax).toFixed(1)}
          </text>

          <text x={paddingX} y={paddingY + chartHeight + 14} fill="#475569" fontSize="9" textAnchor="middle">
            0m
          </text>
          <text x={paddingX + chartWidth} y={paddingY + chartHeight + 14} fill="#475569" fontSize="9" textAnchor="middle">
            {L}m
          </text>
        </svg>
      </div>
    );
  };

  return (
    <div className="hidden print:block bg-white text-slate-900 p-8 text-sm font-sans space-y-6">
      {/* Header */}
      <div className="border-b-2 border-slate-800 pb-4 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">BEAM LAB</h1>
          <p className="text-xs text-slate-600 font-medium">
            Euler-Bernoulli Structural Analysis Report
          </p>
        </div>
        <div className="text-right text-xs text-slate-500">
          <p>Date: {new Date().toLocaleDateString()}</p>
          <p className="font-semibold text-rose-700">Not Certified for Construction Design</p>
        </div>
      </div>

      {/* Model Overview & Geometry */}
      <div className="grid grid-cols-2 gap-6 print-avoid-break">
        <div className="border border-slate-300 rounded p-3 bg-slate-50 space-y-1">
          <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 border-b border-slate-200 pb-1">
            Geometry & Materials
          </h2>
          <div className="flex justify-between text-xs">
            <span className="text-slate-600">Span Length (L):</span>
            <span className="font-semibold text-slate-900">{config.length} m</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-600">Support Type:</span>
            <span className="font-semibold text-slate-900 capitalize">
              {config.supportType.replace('_', ' ')}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-600">Elastic Modulus (E):</span>
            <span className="font-semibold text-slate-900">{config.elasticModulus} GPa</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-600">Moment of Inertia (Iz):</span>
            <span className="font-semibold text-slate-900">{config.momentOfInertia} mm⁴</span>
          </div>
        </div>

        {/* Reaction Results */}
        <div className="border border-slate-300 rounded p-3 bg-slate-50 space-y-1">
          <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 border-b border-slate-200 pb-1">
            Support Reactions
          </h2>
          <div className="flex justify-between text-xs">
            <span className="text-slate-600">RA (x = 0m):</span>
            <span className="font-semibold text-slate-900">
              {(reactions.RA / 1000).toFixed(3)} kN
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-600">MA (x = 0m):</span>
            <span className="font-semibold text-slate-900">
              {(reactions.MA / 1000).toFixed(3)} kNm
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-600">RB (x = {config.length}m):</span>
            <span className="font-semibold text-slate-900">
              {(reactions.RB / 1000).toFixed(3)} kN
            </span>
          </div>
        </div>
      </div>

      {/* Applied Loads Table */}
      <div className="print-avoid-break">
        <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
          Applied Loads ({config.loads.length})
        </h2>
        <table className="w-full text-xs border-collapse border border-slate-300">
          <thead>
            <tr className="bg-slate-100 text-slate-700 text-left">
              <th className="border border-slate-300 p-1.5">Type</th>
              <th className="border border-slate-300 p-1.5">Location</th>
              <th className="border border-slate-300 p-1.5">Magnitude / Intensity</th>
            </tr>
          </thead>
          <tbody>
            {config.loads.map((load, idx) => (
              <tr key={idx} className="border-b border-slate-200">
                <td className="border border-slate-300 p-1.5 capitalize font-medium">
                  {load.type.replace('_', ' ')}
                </td>
                <td className="border border-slate-300 p-1.5">
                  {load.type === 'distributed'
                    ? `x1 = ${(load as DistributedLoad).x1}m, x2 = ${(load as DistributedLoad).x2}m`
                    : `x = ${(load as PointForceLoad).x}m`}
                </td>
                <td className="border border-slate-300 p-1.5">
                  {load.type === 'point_force' && `${(load as PointForceLoad).magnitude} kN`}
                  {load.type === 'point_couple' && `${(load as PointCoupleLoad).magnitude} kNm`}
                  {load.type === 'distributed' &&
                    `w1 = ${(load as DistributedLoad).w1} kN/m, w2 = ${(load as DistributedLoad).w2} kN/m`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Critical Peak Summary */}
      <div className="border border-slate-300 rounded p-3 bg-slate-50 print-avoid-break">
        <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 border-b border-slate-200 pb-1">
          Peak Internal Actions & Deflection
        </h2>
        <div className="grid grid-cols-3 gap-4 text-xs">
          <div>
            <span className="text-slate-600 block">Peak Shear |Vmax|</span>
            <span className="font-bold text-slate-900 text-sm">
              {(Math.max(Math.abs(extrema.minShear.value), Math.abs(extrema.maxShear.value)) / 1000).toFixed(3)} kN
            </span>
          </div>
          <div>
            <span className="text-slate-600 block">Peak Moment |Mmax|</span>
            <span className="font-bold text-slate-900 text-sm">
              {(Math.max(Math.abs(extrema.minMoment.value), Math.abs(extrema.maxMoment.value)) / 1000).toFixed(3)} kNm
            </span>
          </div>
          <div>
            <span className="text-slate-600 block">Max Deflection |δmax|</span>
            <span className="font-bold text-slate-900 text-sm">
              {(extrema.maxAbsDeflection.value * 1000).toFixed(3)} mm
            </span>
            <span className="text-[10px] text-slate-500 block">@ x = {extrema.maxAbsDeflection.x.toFixed(3)}m</span>
          </div>
        </div>
      </div>

      {/* All Complete Diagrams */}
      <div className="space-y-4">
        <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200 pb-1">
          Structural Response Diagrams
        </h2>
        {renderDiagramSVG('shear')}
        {renderDiagramSVG('moment')}
        {renderDiagramSVG('deflection')}
      </div>
    </div>
  );
};
