import React, { useState } from 'react';
import { CalculatedPoint } from '../types';
import { TrendingUp, Sun, Zap } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface TimeSeriesChartProps {
  points: CalculatedPoint[];
  activeIndex: number;
  onSelectIndex: (index: number) => void;
}

export type ChartViewMode = 'elevation' | 'disc_fraction' | 'power';

export const TimeSeriesChart: React.FC<TimeSeriesChartProps> = ({
  points,
  activeIndex,
  onSelectIndex,
}) => {
  const { t } = useLanguage();
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<ChartViewMode>('elevation');

  if (!points || points.length === 0) {
    return (
      <div className="bg-[#0B1120] border border-slate-800 rounded-xl p-4 text-center text-slate-500 text-xs">
        No time-series data available.
      </div>
    );
  }

  // Chart dimensions
  const width = 1000;
  const height = 230;
  const margin = { top: 25, right: 35, bottom: 35, left: 55 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;

  const idxToX = (idx: number): number => {
    return margin.left + (idx / Math.max(1, points.length - 1)) * plotWidth;
  };

  // Time ticks (daily ticks)
  const timeTicks: { idx: number; label: string }[] = [];
  const numTimeTicks = Math.min(8, points.length);
  const stepIdx = Math.max(1, Math.floor(points.length / (numTimeTicks - 1)));
  for (let i = 0; i < points.length; i += stepIdx) {
    const dt = points[i].rawTime.split(' ')[0].replace('2026-', '');
    timeTicks.push({ idx: i, label: dt });
  }

  // ================= VIEW MODE 1: ELEVATION =================
  let minEl = -6.0;
  let maxEl = 10.0;
  for (const p of points) {
    if (!isNaN(p.sunElevation)) {
      minEl = Math.min(minEl, p.sunElevation);
      maxEl = Math.max(maxEl, p.sunElevation);
    }
    if (!isNaN(p.earthElevation)) {
      minEl = Math.min(minEl, p.earthElevation);
      maxEl = Math.max(maxEl, p.earthElevation);
    }
    if (!isNaN(p.sunHorizonElevation)) {
      maxEl = Math.max(maxEl, p.sunHorizonElevation);
    }
  }
  minEl = Math.floor(minEl) - 1;
  maxEl = Math.ceil(maxEl) + 1;
  const elRange = maxEl - minEl;

  const elToY = (el: number): number => {
    const clamped = Math.max(minEl, Math.min(maxEl, el));
    return margin.top + (1.0 - (clamped - minEl) / elRange) * plotHeight;
  };

  let sunPath = '';
  let earthPath = '';
  let sunHorizPath = '';

  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    const x = idxToX(i);
    const sunY = elToY(p.sunElevation);
    sunPath += i === 0 ? `M ${x} ${sunY} ` : `L ${x} ${sunY} `;

    const sunHY = elToY(p.sunHorizonElevation);
    sunHorizPath += i === 0 ? `M ${x} ${sunHY} ` : `L ${x} ${sunHY} `;

    if (!isNaN(p.earthElevation)) {
      const earthY = elToY(p.earthElevation);
      earthPath += earthPath === '' ? `M ${x} ${earthY} ` : `L ${x} ${earthY} `;
    }
  }
  const yZero = elToY(0.0);

  const elevTicks: number[] = [];
  const tickStep = elRange > 18 ? 4 : 2;
  for (let el = Math.ceil(minEl / tickStep) * tickStep; el <= maxEl; el += tickStep) {
    elevTicks.push(el);
  }

  // ================= VIEW MODE 2: DISC FRACTION =================
  const fracToY = (f: number): number => {
    const clamped = Math.max(0, Math.min(1, f));
    return margin.top + (1.0 - clamped) * plotHeight;
  };

  let discPath = '';
  let discAreaPath = '';
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    const x = idxToX(i);
    const f = p.solarVisibleFraction ?? (p.sunVisible === 'visible' ? 1.0 : 0.0);
    const y = fracToY(f);
    discPath += i === 0 ? `M ${x} ${y} ` : `L ${x} ${y} `;
    if (i === 0) discAreaPath = `M ${x} ${margin.top + plotHeight} L ${x} ${y} `;
    else discAreaPath += `L ${x} ${y} `;
  }
  discAreaPath += `L ${idxToX(points.length - 1)} ${margin.top + plotHeight} Z`;

  // ================= VIEW MODE 3: PHOTOVOLTAIC POWER =================
  let maxP = 100;
  for (const p of points) {
    if (p.pvPowerWatts > maxP) maxP = p.pvPowerWatts;
  }
  maxP = Math.ceil(maxP / 50) * 50;

  const powerToY = (pWatts: number): number => {
    const clamped = Math.max(0, Math.min(maxP, pWatts));
    return margin.top + (1.0 - clamped / maxP) * plotHeight;
  };

  let powerPath = '';
  let powerAreaPath = '';
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    const x = idxToX(i);
    const y = powerToY(p.pvPowerWatts);
    powerPath += i === 0 ? `M ${x} ${y} ` : `L ${x} ${y} `;
    if (i === 0) powerAreaPath = `M ${x} ${margin.top + plotHeight} L ${x} ${y} `;
    else powerAreaPath += `L ${x} ${y} `;
  }
  powerAreaPath += `L ${idxToX(points.length - 1)} ${margin.top + plotHeight} Z`;

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
      {/* Top Header with View Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-2 border-b border-slate-800 gap-2">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
              {t.timeSeriesTitle}
            </h2>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center bg-slate-900/80 p-0.5 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setViewMode('elevation')}
              className={`px-2.5 py-1 rounded font-medium transition ${
                viewMode === 'elevation'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-600/50'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t.tabElevation}
            </button>
            <button
              onClick={() => setViewMode('disc_fraction')}
              className={`px-2.5 py-1 rounded font-medium flex items-center gap-1 transition ${
                viewMode === 'disc_fraction'
                  ? 'bg-cyan-950 text-amber-300 border border-amber-600/50'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sun className="w-3 h-3 text-amber-400" />
              <span>{t.tabDisc}</span>
            </button>
            <button
              onClick={() => setViewMode('power')}
              className={`px-2.5 py-1 rounded font-medium flex items-center gap-1 transition ${
                viewMode === 'power'
                  ? 'bg-cyan-950 text-amber-300 border border-amber-600/50'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Zap className="w-3 h-3 text-amber-400" />
              <span>{t.tabPower}</span>
            </button>
          </div>
        </div>

        {/* Legend */}
        {viewMode === 'elevation' && (
          <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-0.5 bg-amber-400 inline-block" />
              <span className="text-amber-300">{t.legendSunEl}</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-0.5 bg-blue-400 inline-block" />
              <span className="text-blue-300">{t.legendEarthEl}</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-0.5 bg-emerald-500/80 inline-block border-b border-dashed border-emerald-400" />
              <span className="text-emerald-400">{t.legendDirHorizon}</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-0.5 bg-cyan-400/60 inline-block border-b border-dashed border-cyan-400" />
              <span className="text-cyan-400">{t.legendZeroRef}</span>
            </div>
          </div>
        )}
        {viewMode === 'disc_fraction' && (
          <div className="flex items-center gap-3 text-xs font-mono text-amber-300">
            <span className="w-3 h-1.5 bg-amber-400/40 inline-block border border-amber-400 rounded-sm" />
            <span>{t.legendDiscFrac}</span>
          </div>
        )}
        {viewMode === 'power' && (
          <div className="flex items-center gap-3 text-xs font-mono text-amber-300">
            <span className="w-3 h-1.5 bg-amber-500/30 inline-block border border-amber-500 rounded-sm" />
            <span>{t.legendPvPower}</span>
          </div>
        )}
      </div>

      {/* SVG Plot */}
      <div className="relative py-2 overflow-hidden cursor-crosshair">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto select-none"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoverIndex(null)}
          onClick={handleClick}
        >
          <defs>
            <linearGradient id="discAreaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.02" />
            </linearGradient>
            <linearGradient id="powerAreaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#EAB308" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#EAB308" stopOpacity="0.03" />
            </linearGradient>
          </defs>

          {/* Background grid */}
          <rect
            x={margin.left}
            y={margin.top}
            width={plotWidth}
            height={plotHeight}
            fill="#060911"
            stroke="#1E293B"
            strokeWidth="1"
          />

          {/* ================= ELEVATION MODE RENDERING ================= */}
          {viewMode === 'elevation' && (
            <>
              {elevTicks.map((el) => {
                const y = elToY(el);
                return (
                  <g key={el}>
                    <line
                      x1={margin.left}
                      y1={y}
                      x2={margin.left + plotWidth}
                      y2={y}
                      stroke="#1E293B"
                      strokeWidth="0.8"
                      strokeDasharray={el === 0 ? 'none' : '2 2'}
                    />
                    <text
                      x={margin.left - 8}
                      y={y + 3}
                      textAnchor="end"
                      fill={el === 0 ? '#00E5FF' : '#64748B'}
                      fontSize="9"
                      fontFamily="monospace"
                    >
                      {el > 0 ? `+${el}°` : `${el}°`}
                    </text>
                  </g>
                );
              })}

              <line
                x1={margin.left}
                y1={yZero}
                x2={margin.left + plotWidth}
                y2={yZero}
                stroke="#00E5FF"
                strokeWidth="1.2"
                strokeDasharray="4 3"
                opacity="0.7"
              />

              {sunHorizPath && (
                <path
                  d={sunHorizPath}
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="1.4"
                  strokeDasharray="3 2"
                  opacity="0.8"
                />
              )}
              {earthPath && (
                <path d={earthPath} fill="none" stroke="#3B82F6" strokeWidth="2.0" opacity="0.9" />
              )}
              {sunPath && (
                <path d={sunPath} fill="none" stroke="#F59E0B" strokeWidth="2.2" opacity="0.95" />
              )}
            </>
          )}

          {/* ================= DISC FRACTION MODE RENDERING ================= */}
          {viewMode === 'disc_fraction' && (
            <>
              {[0, 0.25, 0.5, 0.75, 1.0].map((f) => {
                const y = fracToY(f);
                return (
                  <g key={f}>
                    <line
                      x1={margin.left}
                      y1={y}
                      x2={margin.left + plotWidth}
                      y2={y}
                      stroke="#1E293B"
                      strokeWidth="0.8"
                      strokeDasharray={f === 0 || f === 1 ? 'none' : '2 2'}
                    />
                    <text
                      x={margin.left - 8}
                      y={y + 3}
                      textAnchor="end"
                      fill={f === 1.0 ? '#F59E0B' : '#64748B'}
                      fontSize="9"
                      fontFamily="monospace"
                    >
                      {(f * 100).toFixed(0)}%
                    </text>
                  </g>
                );
              })}

              <path d={discAreaPath} fill="url(#discAreaGrad)" />
              <path d={discPath} fill="none" stroke="#F59E0B" strokeWidth="2.2" opacity="0.95" />
            </>
          )}

          {/* ================= POWER MODE RENDERING ================= */}
          {viewMode === 'power' && (
            <>
              {[0, 0.25, 0.5, 0.75, 1.0].map((frac) => {
                const pVal = Math.round(frac * maxP);
                const y = powerToY(pVal);
                return (
                  <g key={frac}>
                    <line
                      x1={margin.left}
                      y1={y}
                      x2={margin.left + plotWidth}
                      y2={y}
                      stroke="#1E293B"
                      strokeWidth="0.8"
                      strokeDasharray="2 2"
                    />
                    <text
                      x={margin.left - 8}
                      y={y + 3}
                      textAnchor="end"
                      fill="#F59E0B"
                      fontSize="9"
                      fontFamily="monospace"
                    >
                      {pVal} W
                    </text>
                  </g>
                );
              })}

              <path d={powerAreaPath} fill="url(#powerAreaGrad)" />
              <path d={powerPath} fill="none" stroke="#EAB308" strokeWidth="2.2" opacity="0.95" />
            </>
          )}

          {/* Vertical Time Gridlines */}
          {timeTicks.map(({ idx, label }) => {
            const x = idxToX(idx);
            return (
              <g key={idx}>
                <line
                  x1={x}
                  y1={margin.top}
                  x2={x}
                  y2={margin.top + plotHeight}
                  stroke="#1E293B"
                  strokeWidth="0.8"
                  strokeDasharray="2 2"
                />
                <text
                  x={x}
                  y={margin.top + plotHeight + 16}
                  textAnchor="middle"
                  fill="#64748B"
                  fontSize="9"
                  fontFamily="monospace"
                >
                  {label}
                </text>
              </g>
            );
          })}

          {/* Active / Hover Cursor Line */}
          <line
            x1={idxToX(hoverIndex !== null ? hoverIndex : activeIndex)}
            y1={margin.top}
            x2={idxToX(hoverIndex !== null ? hoverIndex : activeIndex)}
            y2={margin.top + plotHeight}
            stroke="#00E5FF"
            strokeWidth="1.5"
            strokeDasharray={hoverIndex !== null ? 'none' : '3 2'}
            opacity="0.85"
          />
        </svg>
      </div>

      {/* Interactive Tooltip Readout */}
      <div className="flex items-center justify-between text-xs px-2 pt-2 border-t border-slate-800 font-mono text-slate-300">
        <div>
          <span className="text-slate-400">Timestamp: </span>
          <span className="text-cyan-400 font-semibold">{displayPoint.rawTime} UTC</span>
        </div>
        <div className="flex items-center gap-4">
          <div>
            <span className="text-amber-400">Sun: </span>
            <span>{displayPoint.sunElevation.toFixed(2)}° </span>
            <span className="text-amber-300/80">
              (f_sun: {((displayPoint.solarVisibleFraction ?? (displayPoint.sunVisible === 'visible' ? 1 : 0)) * 100).toFixed(1)}%)
            </span>
          </div>
          <div>
            <span className="text-amber-300">PV Power: </span>
            <span className="font-semibold text-amber-400">{displayPoint.pvPowerWatts} W</span>
          </div>
          <div>
            <span className="text-blue-400">Earth: </span>
            <span>
              {!isNaN(displayPoint.earthElevation) ? `${displayPoint.earthElevation.toFixed(2)}°` : 'N/A'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
