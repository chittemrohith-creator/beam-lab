import React, { useRef, useState } from 'react';
import { BeamConfig, PointForceLoad, PointCoupleLoad, DistributedLoad } from '../solver/types';

interface BeamCanvasProps {
  config: BeamConfig;
  onUpdateLoadPosition?: (loadId: string, newX: number) => void;
}

export const BeamCanvas: React.FC<BeamCanvasProps> = ({ config, onUpdateLoadPosition }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [draggingLoadId, setDraggingLoadId] = useState<string | null>(null);

  const paddingX = 80;
  const svgWidth = 800;
  const svgHeight = 220;
  const spanPx = svgWidth - 2 * paddingX;
  const beamY = 120;
  const L = config.length;

  const xToPx = (x: number) => paddingX + (x / L) * spanPx;
  const pxToX = (px: number) => {
    const rawX = ((px - paddingX) / spanPx) * L;
    const clampedX = Math.max(0, Math.min(L, rawX));
    // Snap to 0.1m grid
    return Math.round(clampedX * 10) / 10;
  };

  const handlePointerDown = (loadId: string, e: React.PointerEvent) => {
    e.preventDefault();
    setDraggingLoadId(loadId);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingLoadId || !onUpdateLoadPosition || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const clickPx = ((e.clientX - rect.left) / rect.width) * svgWidth;
    const newX = pxToX(clickPx);
    onUpdateLoadPosition(draggingLoadId, newX);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (draggingLoadId) {
      setDraggingLoadId(null);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // ignore pointer release errors
      }
    }
  };

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl overflow-x-auto select-none print:bg-white print:border-slate-300">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400 print:text-slate-800">
            Interactive Beam & Load Diagram
          </span>
          <span className="text-[10px] bg-slate-800 border border-slate-700 text-slate-400 px-2 py-0.5 rounded print:hidden">
            Drag point load nodes to position
          </span>
        </div>
        <span className="text-xs text-slate-400 font-mono print:text-slate-700">Span L = {config.length} m</span>
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="w-full h-auto min-w-[600px] touch-none"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <defs>
          {/* Arrow markers */}
          <marker id="arrow-down" viewBox="0 0 10 10" refX="5" refY="10" markerWidth="6" markerHeight="6" orient="0">
            <path d="M 0 0 L 10 0 L 5 10 z" fill="#f43f5e" />
          </marker>
          <marker id="arrow-up" viewBox="0 0 10 10" refX="5" refY="0" markerWidth="6" markerHeight="6" orient="0">
            <path d="M 0 10 L 10 10 L 5 0 z" fill="#38bdf8" />
          </marker>
          {/* Hatch pattern for supports */}
          <pattern id="hatch" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="0" y2="8" stroke="#64748b" strokeWidth="1.5" />
          </pattern>
        </defs>

        {/* Dimension Line */}
        <g stroke="#64748b" strokeWidth="1" opacity="0.6">
          <line x1={paddingX} y1={beamY + 50} x2={paddingX + spanPx} y2={beamY + 50} />
          <line x1={paddingX} y1={beamY + 42} x2={paddingX} y2={beamY + 58} />
          <line x1={paddingX + spanPx} y1={beamY + 42} x2={paddingX + spanPx} y2={beamY + 58} />
          <text
            x={paddingX + spanPx / 2}
            y={beamY + 68}
            fill="#94a3b8"
            fontSize="12"
            textAnchor="middle"
            className="font-mono"
          >
            L = {config.length} m
          </text>
        </g>

        {/* Beam Member */}
        <rect
          x={paddingX}
          y={beamY - 6}
          width={spanPx}
          height={12}
          fill="#334155"
          stroke="#64748b"
          strokeWidth="2"
          rx="2"
        />

        {/* Supports */}
        {config.supportType === 'simply_supported' ? (
          <>
            {/* Pin Support at x = 0 */}
            <g transform={`translate(${paddingX}, ${beamY + 6})`}>
              <polygon points="0,0 -12,20 12,20" fill="#475569" stroke="#94a3b8" strokeWidth="1.5" />
              <rect x="-18" y="20" width="36" height="6" fill="url(#hatch)" stroke="#64748b" strokeWidth="1" />
              <line x1="-18" y1="20" x2="18" y2="20" stroke="#94a3b8" strokeWidth="1.5" />
              <text x="0" y="38" fill="#94a3b8" fontSize="11" textAnchor="middle" className="font-semibold">
                A (Pin)
              </text>
            </g>

            {/* Roller Support at x = L */}
            <g transform={`translate(${paddingX + spanPx}, ${beamY + 6})`}>
              <polygon points="0,0 -12,14 12,14" fill="#475569" stroke="#94a3b8" strokeWidth="1.5" />
              <circle cx="-6" cy="18" r="3" fill="#94a3b8" />
              <circle cx="6" cy="18" r="3" fill="#94a3b8" />
              <rect x="-18" y="21" width="36" height="5" fill="url(#hatch)" stroke="#64748b" strokeWidth="1" />
              <line x1="-18" y1="21" x2="18" y2="21" stroke="#94a3b8" strokeWidth="1.5" />
              <text x="0" y="38" fill="#94a3b8" fontSize="11" textAnchor="middle" className="font-semibold">
                B (Roller)
              </text>
            </g>
          </>
        ) : (
          /* Cantilever Support (Fixed Wall at x = 0) */
          <g transform={`translate(${paddingX}, ${beamY})`}>
            <rect x="-16" y="-35" width="16" height="70" fill="url(#hatch)" stroke="#64748b" strokeWidth="1.5" />
            <line x1="0" y1="-35" x2="0" y2="35" stroke="#94a3b8" strokeWidth="2.5" />
            <text x="-22" y="5" fill="#94a3b8" fontSize="11" textAnchor="end" className="font-semibold">
              A (Fixed)
            </text>
          </g>
        )}

        {/* Applied Loads Rendering */}
        {config.loads.map((load) => {
          if (load.type === 'point_force') {
            const pf = load as PointForceLoad;
            const px = xToPx(pf.x);
            const isDown = pf.magnitude < 0;
            const arrowLength = 40;
            const y1 = isDown ? beamY - arrowLength - 10 : beamY + arrowLength + 10;
            const y2 = isDown ? beamY - 8 : beamY + 8;
            const isDragging = draggingLoadId === load.id;

            return (
              <g key={load.id} className="cursor-grab active:cursor-grabbing">
                <line
                  x1={px}
                  y1={y1}
                  x2={px}
                  y2={y2}
                  stroke={isDown ? '#f43f5e' : '#38bdf8'}
                  strokeWidth="3"
                  markerEnd={isDown ? 'url(#arrow-down)' : 'url(#arrow-up)'}
                />
                <circle
                  cx={px}
                  cy={y1}
                  r={isDragging ? 8 : 6}
                  fill={isDragging ? '#f59e0b' : isDown ? '#f43f5e' : '#38bdf8'}
                  stroke="#ffffff"
                  strokeWidth="1.5"
                  onPointerDown={(e) => handlePointerDown(load.id, e)}
                />
                <text
                  x={px}
                  y={y1 - 10}
                  fill={isDown ? '#f43f5e' : '#38bdf8'}
                  fontSize="12"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {pf.magnitude} kN @ x={pf.x}m
                </text>
              </g>
            );
          } else if (load.type === 'point_couple') {
            const pc = load as PointCoupleLoad;
            const px = xToPx(pc.x);
            const isCCW = pc.magnitude >= 0;

            return (
              <g key={load.id} transform={`translate(${px}, ${beamY})`}>
                <path
                  d={isCCW ? 'M -18,-15 A 20,20 0 1,1 18,-15' : 'M 18,-15 A 20,20 0 1,0 -18,-15'}
                  fill="none"
                  stroke="#a855f7"
                  strokeWidth="2.5"
                  strokeDasharray="4 2"
                />
                <text x="0" y="-30" fill="#c084fc" fontSize="12" fontWeight="bold" textAnchor="middle">
                  {pc.magnitude} kNm @ x={pc.x}m
                </text>
                <circle cx="0" cy="0" r="4" fill="#a855f7" />
              </g>
            );
          } else if (load.type === 'distributed') {
            const dist = load as DistributedLoad;
            const px1 = xToPx(dist.x1);
            const px2 = xToPx(dist.x2);
            const height1 = Math.min(50, Math.max(10, Math.abs(dist.w1) * 3));
            const height2 = Math.min(50, Math.max(10, Math.abs(dist.w2) * 3));

            const isDown1 = dist.w1 <= 0;
            const y1_start = isDown1 ? beamY - 8 - height1 : beamY + 8 + height1;
            const y2_start = isDown1 ? beamY - 8 - height2 : beamY + 8 + height2;
            const y_beam = isDown1 ? beamY - 8 : beamY + 8;

            return (
              <g key={load.id}>
                {/* Distributed load boundary polygon */}
                <polygon
                  points={`${px1},${y_beam} ${px1},${y1_start} ${px2},${y2_start} ${px2},${y_beam}`}
                  fill="#f59e0b"
                  fillOpacity="0.25"
                  stroke="#f59e0b"
                  strokeWidth="1.5"
                />
                {/* Arrow lines inside distributed load */}
                {[0, 0.25, 0.5, 0.75, 1].map((frac, idx) => {
                  const arrowPx = px1 + frac * (px2 - px1);
                  const h = height1 + frac * (height2 - height1);
                  const arrowY1 = isDown1 ? beamY - 8 - h : beamY + 8 + h;
                  return (
                    <line
                      key={idx}
                      x1={arrowPx}
                      y1={arrowY1}
                      x2={arrowPx}
                      y2={y_beam}
                      stroke="#f59e0b"
                      strokeWidth="1.5"
                      markerEnd={isDown1 ? 'url(#arrow-down)' : 'url(#arrow-up)'}
                    />
                  );
                })}
                <text
                  x={(px1 + px2) / 2}
                  y={beamY - Math.max(height1, height2) - 14}
                  fill="#fbbf24"
                  fontSize="11"
                  fontWeight="semibold"
                  textAnchor="middle"
                >
                  w1={dist.w1}, w2={dist.w2} kN/m [{dist.x1}m to {dist.x2}m]
                </text>
              </g>
            );
          }
          return null;
        })}
      </svg>
    </div>
  );
};
