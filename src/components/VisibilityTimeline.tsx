import React, { useState } from 'react';
import { CalculatedPoint, SiteMetrics } from '../types';
import { Eye, Sun, Globe, CheckCircle2 } from 'lucide-react';

interface VisibilityTimelineProps {
  points: CalculatedPoint[];
  metrics: SiteMetrics;
  activeIndex: number;
  onSelectIndex: (index: number) => void;
}

export const VisibilityTimeline: React.FC<VisibilityTimelineProps> = ({
  points,
  metrics,
  activeIndex,
  onSelectIndex,
}) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (!points || points.length === 0) {
    return null;
  }

  const width = 1000;
  const rowHeight = 26;
  const rowGap = 6;
  const margin = { top: 15, right: 30, bottom: 25, left: 110 };
  const plotWidth = width - margin.left - margin.right;
  const totalHeight = margin.top + 3 * rowHeight + 2 * rowGap + margin.bottom;

  const idxToX = (idx: number): number => {
    return margin.left + (idx / points.length) * plotWidth;
  };

  const pointWidth = Math.max(1.0, plotWidth / points.length);

  // Rows definition
  const rows = [
    {
      id: 'sun',
      label: '1. Sun Visible',
      icon: Sun,
      color: '#F59E0B',
      pct: metrics.sunVisiblePct,
      hours: metrics.sunVisibleHours,
      check: (p: CalculatedPoint) => p.sunVisible,
    },
    {
      id: 'earth',
      label: '2. Earth Visible',
      icon: Globe,
      color: '#3B82F6',
      pct: metrics.earthVisiblePct,
      hours: metrics.earthVisibleHours,
      check: (p: CalculatedPoint) => p.earthVisible,
    },
    {
      id: 'both',
      label: '3. Both Visible',
      icon: CheckCircle2,
      color: '#10B981',
      pct: metrics.bothVisiblePct,
      hours: metrics.bothVisibleHours,
      check: (p: CalculatedPoint) => (p.bothVisible ? 'visible' : 'obstructed'),
    },
  ];

  // Mouse interaction
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const svgX = (mouseX / rect.width) * width;
    if (svgX >= margin.left && svgX <= margin.left + plotWidth) {
      const frac = (svgX - margin.left) / plotWidth;
      const idx = Math.round(frac * (points.length - 1));
      setHoverIndex(Math.max(0, Math.min(points.length - 1, idx)));
    } else {
      setHoverIndex(null);
    }
  };

  const handleClick = () => {
    if (hoverIndex !== null) {
      onSelectIndex(hoverIndex);
    }
  };

  const displayPoint =
    hoverIndex !== null ? points[hoverIndex] : points[activeIndex] || points[0];

  return (
    <div className="bg-[#0B1120] border border-slate-800 rounded-xl p-4 shadow-xl flex flex-col justify-between">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-2 border-b border-slate-800 gap-2">
        <div className="flex items-center space-x-2">
          <Eye className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
            Operational Visibility Windows (3-Row Timeline)
          </h2>
        </div>

        {/* Multi-metric stats badges */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          <span className="px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-500/40">
            ☀️ Sun: {metrics.sunVisiblePct}% ({metrics.sunVisibleHours}h)
          </span>
          <span className="px-2 py-0.5 rounded bg-blue-950/80 text-blue-300 border border-blue-500/40">
            🌍 Earth: {metrics.earthVisiblePct}% ({metrics.earthVisibleHours}h)
          </span>
          <span className="px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 font-bold">
            ⚡ Both: {metrics.bothVisiblePct}% ({metrics.bothVisibleHours}h)
          </span>
        </div>
      </div>

      {/* SVG 3-Row Strip */}
      <div className="relative py-2 overflow-hidden cursor-pointer">
        <svg
          viewBox={`0 0 ${width} ${totalHeight}`}
          className="w-full h-auto select-none"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoverIndex(null)}
          onClick={handleClick}
        >
          <defs>
            {/* Pattern for Obstructed (Accessibility: dual-encoded hatching) */}
            <pattern
              id="hatchPattern"
              width="6"
              height="6"
              patternTransform="rotate(45 0 0)"
              patternUnits="userSpaceOnUse"
            >
              <line x1="0" y1="0" x2="0" y2="6" stroke="#334155" strokeWidth="1.5" />
            </pattern>
            {/* Pattern for Unknown */}
            <pattern
              id="unknownPattern"
              width="6"
              height="6"
              patternTransform="rotate(-45 0 0)"
              patternUnits="userSpaceOnUse"
            >
              <line x1="0" y1="0" x2="0" y2="6" stroke="#475569" strokeWidth="1" strokeDasharray="2 2" />
            </pattern>
          </defs>

          {/* Render 3 rows */}
          {rows.map((row, rowIdx) => {
            const y = margin.top + rowIdx * (rowHeight + rowGap);
            return (
              <g key={row.id}>
                {/* Row Label on Left */}
                <text
                  x={margin.left - 12}
                  y={y + rowHeight / 2 + 4}
                  textAnchor="end"
                  fill="#94A3B8"
                  fontSize="11"
                  fontWeight="600"
                  fontFamily="sans-serif"
                >
                  {row.label}
                </text>

                {/* Row background bar */}
                <rect
                  x={margin.left}
                  y={y}
                  width={plotWidth}
                  height={rowHeight}
                  fill="#060911"
                  stroke="#1E293B"
                  strokeWidth="1"
                  rx="3"
                />

                {/* Time slice segments */}
                {points.map((p, pIdx) => {
                  const state = row.check(p);
                  const x = idxToX(pIdx);

                  let fillColor = row.color;
                  let fillPattern = 'none';

                  if (state === 'obstructed') {
                    fillColor = '#0F172A';
                    fillPattern = 'url(#hatchPattern)';
                  } else if (state === 'unknown') {
                    fillColor = '#1E293B';
                    fillPattern = 'url(#unknownPattern)';
                  }

                  return (
                    <g key={pIdx}>
                      <rect
                        x={x}
                        y={y}
                        width={pointWidth + 0.5}
                        height={rowHeight}
                        fill={fillColor}
                        opacity={state === 'visible' ? 0.95 : 1}
                      />
                      {state !== 'visible' && (
                        <rect
                          x={x}
                          y={y}
                          width={pointWidth + 0.5}
                          height={rowHeight}
                          fill={fillPattern}
                        />
                      )}
                    </g>
                  );
                })}
              </g>
            );
          })}

          {/* Time Axis Ticks at Bottom */}
          {(() => {
            const numTicks = 8;
            const ticks: { x: number; label: string }[] = [];
            const step = Math.floor(points.length / (numTicks - 1));
            for (let i = 0; i < points.length; i += step) {
              const dt = points[i].rawTime.split(' ')[0].replace('2026-', '');
              ticks.push({ x: idxToX(i), label: dt });
            }
            const yBottom = margin.top + 3 * rowHeight + 2 * rowGap;

            return ticks.map((t, idx) => (
              <g key={idx}>
                <line
                  x1={t.x}
                  y1={yBottom}
                  x2={t.x}
                  y2={yBottom + 4}
                  stroke="#475569"
                  strokeWidth="1"
                />
                <text
                  x={t.x}
                  y={yBottom + 16}
                  textAnchor="middle"
                  fill="#64748B"
                  fontSize="9"
                  fontFamily="monospace"
                >
                  {t.label}
                </text>
              </g>
            ));
          })()}

          {/* Active Playback Scrubber Line */}
          <line
            x1={idxToX(activeIndex)}
            y1={margin.top - 4}
            x2={idxToX(activeIndex)}
            y2={margin.top + 3 * rowHeight + 2 * rowGap + 4}
            stroke="#00E5FF"
            strokeWidth="2.2"
            opacity="0.95"
          />
          <circle
            cx={idxToX(activeIndex)}
            cy={margin.top - 4}
            r="4"
            fill="#00E5FF"
          />

          {/* Hover indicator */}
          {hoverIndex !== null && hoverIndex !== activeIndex && (
            <line
              x1={idxToX(hoverIndex)}
              y1={margin.top}
              x2={idxToX(hoverIndex)}
              y2={margin.top + 3 * rowHeight + 2 * rowGap}
              stroke="#64748B"
              strokeWidth="1"
              strokeDasharray="2 2"
            />
          )}
        </svg>
      </div>

      {/* Accessibility Shading Legend & Status */}
      <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between text-[11px] text-slate-400 gap-2">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1.5">
            <span className="w-3.5 h-3 rounded bg-emerald-500 inline-block" />
            <span className="text-slate-300">Visible (Solid)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3.5 h-3 rounded bg-slate-900 border border-slate-700 pattern-hatched inline-block" />
            <span className="text-slate-400">Obstructed / Terrain Masked (Hatched)</span>
          </div>
        </div>
        <div className="font-mono text-cyan-300">
          {displayPoint ? `${displayPoint.rawTime} UTC — Sun: ${displayPoint.sunVisible.toUpperCase()} | Earth: ${displayPoint.earthVisible.toUpperCase()}` : 'Scrub to explore'}
        </div>
      </div>
    </div>
  );
};
