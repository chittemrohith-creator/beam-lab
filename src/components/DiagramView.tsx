import React, { useState } from 'react';
import { AnalysisResult, DiagramPoint } from '../solver/types';

interface DiagramViewProps {
  result: AnalysisResult;
  type: 'shear' | 'moment' | 'deflection';
}

export const DiagramView: React.FC<DiagramViewProps> = ({ result, type }) => {
  const [hoverPt, setHoverPt] = useState<DiagramPoint | null>(null);

  if (!result.isValid || result.diagrams.length === 0) return null;

  const { config, diagrams } = result;
  const svgWidth = 800;
  const svgHeight = 240;
  const paddingX = 70;
  const paddingY = 40;
  const chartWidth = svgWidth - 2 * paddingX;
  const chartHeight = svgHeight - 2 * paddingY;
  const L = config.length;

  const xToPx = (x: number) => paddingX + (x / L) * chartWidth;

  // Determine value accessor, title, units, and color based on diagram type
  let title = '';
  let unit = '';
  let strokeColor = '#3b82f6';
  let fillColor = 'rgba(59, 130, 246, 0.2)';
  let getValue = (pt: DiagramPoint) => pt.v / 1000; // default Shear in kN

  if (type === 'shear') {
    title = 'Shear Force Diagram (SFD)';
    unit = 'kN';
    strokeColor = '#06b6d4'; // cyan
    fillColor = 'rgba(6, 182, 212, 0.2)';
    getValue = (pt: DiagramPoint) => pt.v / 1000;
  } else if (type === 'moment') {
    title = 'Bending Moment Diagram (BMD)';
    unit = 'kNm';
    strokeColor = '#8b5cf6'; // purple
    fillColor = 'rgba(139, 92, 246, 0.2)';
    getValue = (pt: DiagramPoint) => pt.m / 1000;
  } else if (type === 'deflection') {
    title = 'Elastic Deflection Curve';
    unit = 'mm';
    strokeColor = '#f59e0b'; // amber
    fillColor = 'rgba(245, 158, 11, 0.2)';
    getValue = (pt: DiagramPoint) => pt.deflection * 1000;
  }

  // Find max absolute value for scaling y-axis
  let maxAbsVal = 0;
  for (const pt of diagrams) {
    const val = Math.abs(getValue(pt));
    if (val > maxAbsVal) maxAbsVal = val;
  }
  if (maxAbsVal === 0) maxAbsVal = 1; // avoid divide by zero

  const zeroYPx = paddingY + chartHeight / 2;

  const valToPx = (val: number) => {
    // Standard convention: Positive upwards
    const scale = (chartHeight / 2 - 10) / maxAbsVal;
    return zeroYPx - val * scale;
  };

  // Build SVG polygon area points and path points
  const pointsString = diagrams
    .map((pt) => `${xToPx(pt.x)},${valToPx(getValue(pt))}`)
    .join(' ');

  const areaPointsString = `${xToPx(0)},${zeroYPx} ${pointsString} ${xToPx(L)},${zeroYPx}`;

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * svgWidth;
    const xVal = Math.max(0, Math.min(L, ((mouseX - paddingX) / chartWidth) * L));

    // Find nearest diagram point
    let minDiff = Infinity;
    let closest: DiagramPoint | null = null;
    for (const pt of diagrams) {
      const diff = Math.abs(pt.x - xVal);
      if (diff < minDiff) {
        minDiff = diff;
        closest = pt;
      }
    }
    setHoverPt(closest);
  };

  const handleMouseLeave = () => {
    setHoverPt(null);
  };

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl select-none print:border-slate-300">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">{title}</h3>
        <span className="text-xs text-slate-400 font-mono">
          Max $|{unit}|$: {maxAbsVal.toFixed(3)} {unit}
        </span>
      </div>

      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="w-full h-auto min-w-[600px] cursor-crosshair"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Zero baseline */}
        <line
          x1={paddingX}
          y1={zeroYPx}
          x2={paddingX + chartWidth}
          y2={zeroYPx}
          stroke="#64748b"
          strokeWidth="1.5"
          strokeDasharray="4 2"
        />

        {/* Shaded Area */}
        <polygon points={areaPointsString} fill={fillColor} />

        {/* Diagram Curve Polyline */}
        <polyline points={pointsString} fill="none" stroke={strokeColor} strokeWidth="2.5" />

        {/* Axes & End Markers */}
        <line x1={paddingX} y1={paddingY} x2={paddingX} y2={paddingY + chartHeight} stroke="#475569" strokeWidth="1" />
        <line
          x1={paddingX + chartWidth}
          y1={paddingY}
          x2={paddingX + chartWidth}
          y2={paddingY + chartHeight}
          stroke="#475569"
          strokeWidth="1"
        />

        {/* Axis Labels */}
        <text x={paddingX - 10} y={paddingY + 10} fill="#94a3b8" fontSize="10" textAnchor="end">
          +{(maxAbsVal).toFixed(1)} {unit}
        </text>
        <text x={paddingX - 10} y={zeroYPx + 3} fill="#94a3b8" fontSize="10" textAnchor="end">
          0
        </text>
        <text x={paddingX - 10} y={paddingY + chartHeight - 5} fill="#94a3b8" fontSize="10" textAnchor="end">
          -{(maxAbsVal).toFixed(1)} {unit}
        </text>

        <text x={paddingX} y={paddingY + chartHeight + 20} fill="#94a3b8" fontSize="10" textAnchor="middle">
          0m
        </text>
        <text x={paddingX + chartWidth} y={paddingY + chartHeight + 20} fill="#94a3b8" fontSize="10" textAnchor="middle">
          {L}m
        </text>

        {/* Hover Crosshair & Tooltip */}
        {hoverPt && (
          <g>
            <line
              x1={xToPx(hoverPt.x)}
              y1={paddingY}
              x2={xToPx(hoverPt.x)}
              y2={paddingY + chartHeight}
              stroke="#e2e8f0"
              strokeWidth="1"
              strokeDasharray="2 2"
            />
            <circle
              cx={xToPx(hoverPt.x)}
              cy={valToPx(getValue(hoverPt))}
              r="5"
              fill={strokeColor}
              stroke="#ffffff"
              strokeWidth="2"
            />
            {/* Tooltip box */}
            <g transform={`translate(${Math.min(svgWidth - 140, Math.max(10, xToPx(hoverPt.x) - 60))}, 15)`}>
              <rect x="0" y="0" width="130" height="34" rx="4" fill="#0f172a" stroke="#475569" strokeWidth="1" />
              <text x="65" y="14" fill="#94a3b8" fontSize="10" textAnchor="middle">
                x = {hoverPt.x.toFixed(3)} m
              </text>
              <text x="65" y="27" fill="#f8fafc" fontSize="11" fontWeight="bold" textAnchor="middle">
                {getValue(hoverPt).toFixed(3)} {unit}
              </text>
            </g>
          </g>
        )}
      </svg>
    </div>
  );
};
