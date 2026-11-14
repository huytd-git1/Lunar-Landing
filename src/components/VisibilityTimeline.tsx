import React, { useState } from 'react';
import { CalculatedPoint, SiteMetrics } from '../types';
import { Eye, Sun, Globe, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

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
  const { t } = useLanguage();
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (!points || points.length === 0) {
    return null;
  }

  const width = 1000;
  const rowHeight = 26;
  const rowGap = 6;
  const margin = { top: 15, right: 30, bottom: 25, left: 130 };
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
      label: t.rowSun,
      icon: Sun,
      color: '#F59E0B',
      pct: metrics.sunVisiblePct,
      hours: metrics.sunVisibleHours,
      check: (p: CalculatedPoint) => p.sunlitState || p.sunVisible,
    },
    {
      id: 'earth',
      label: t.rowEarth,
      icon: Globe,
      color: '#3B82F6',
      pct: metrics.earthVisiblePct,
      hours: metrics.earthVisibleHours,
      check: (p: CalculatedPoint) => p.earthVisible,
    },
    {
      id: 'both',
      label: t.rowBoth,
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

  return (
    <div className="bg-[#0B1120] border border-slate-800 rounded-xl p-4 shadow-xl flex flex-col justify-between">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-2 border-b border-slate-800 gap-2">
        <div className="flex items-center space-x-2">
          <Eye className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
            {t.timelineTitle}
          </h2>
        </div>

        {/* Legend for shading */}
        <div className="flex items-center space-x-4 text-xs font-mono text-slate-400">
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-sm bg-amber-500 inline-block" />
            <span className="text-slate-300">{t.visibleLabel}</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-sm bg-slate-900 border border-slate-700 inline-block" />
            <span className="text-slate-400">{t.obstructedLabel}</span>
          </div>
        </div>
      </div>

      {/* SVG Multi-Row Timeline */}
      <div className="relative py-2 overflow-hidden cursor-crosshair">
        <svg
          viewBox={`0 0 ${width} ${totalHeight}`}
          className="w-full h-auto select-none"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoverIndex(null)}
          onClick={handleClick}
        >
          <defs>
            {/* Pattern for Obstructed status: diagonal hatching */}
            <pattern
              id="hatchPattern"
              patternUnits="userSpaceOnUse"
              width="6"
              height="6"
              patternTransform="rotate(45)"
            >
              <line x1="0" y1="0" x2="0" y2="6" stroke="#334155" strokeWidth="1.5" />
            </pattern>
            {/* Pattern for Unknown status: cross-hatch */}
            <pattern
              id="unknownPattern"
              patternUnits="userSpaceOnUse"
              width="8"
              height="8"
            >
              <line x1="0" y1="0" x2="8" y2="8" stroke="#475569" strokeWidth="1" />
              <line x1="8" y1="0" x2="0" y2="8" stroke="#475569" strokeWidth="1" />
            </pattern>
          </defs>

          {/* Render Timeline Rows */}
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

            return ticks.map((tick, idx) => (
              <g key={idx}>
                <line
                  x1={tick.x}
                  y1={yBottom}
                  x2={tick.x}
                  y2={yBottom + 4}
                  stroke="#475569"
                  strokeWidth="1"
                />
                <text
                  x={tick.x}
                  y={yBottom + 16}
                  textAnchor="middle"
                  fill="#64748B"
                  fontSize="9"
                  fontFamily="monospace"
                >
                  {tick.label}
                </text>
              </g>
            ));
          })()}

          {/* Active / Hover Cursor Line */}
          <line
            x1={idxToX(hoverIndex !== null ? hoverIndex : activeIndex)}
            y1={margin.top - 5}
            x2={idxToX(hoverIndex !== null ? hoverIndex : activeIndex)}
            y2={margin.top + 3 * rowHeight + 2 * rowGap + 5}
            stroke="#00E5FF"
            strokeWidth="1.5"
            strokeDasharray={hoverIndex !== null ? 'none' : '3 2'}
            opacity="0.85"
          />
        </svg>
      </div>

      {/* Summary Metrics Badges below timeline */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-xs font-mono">
        {rows.map((r) => (
          <div
            key={r.id}
            className="p-2 rounded bg-slate-900/60 border border-slate-800 flex items-center justify-between"
          >
            <div className="flex items-center space-x-2">
              <r.icon className="w-3.5 h-3.5" style={{ color: r.color }} />
              <span className="text-slate-300 font-sans text-[11px] truncate">{r.label}</span>
            </div>
            <div className="text-right">
              <span className="font-bold text-white text-[11px]">{r.pct}%</span>
              <span className="text-slate-400 text-[10px] ml-1">({r.hours}h)</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
