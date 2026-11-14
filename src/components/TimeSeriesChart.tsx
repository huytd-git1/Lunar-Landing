import React, { useState } from 'react';
import { CalculatedPoint } from '../types';
import { TrendingUp } from 'lucide-react';

interface TimeSeriesChartProps {
  points: CalculatedPoint[];
  activeIndex: number;
  onSelectIndex: (index: number) => void;
}

export const TimeSeriesChart: React.FC<TimeSeriesChartProps> = ({
  points,
  activeIndex,
  onSelectIndex,
}) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (!points || points.length === 0) {
    return (
      <div className="bg-[#0B1120] border border-slate-800 rounded-xl p-4 text-center text-slate-500 text-xs">
        No time-series data available.
      </div>
    );
  }

  // Chart dimensions
  const width = 1000;
  const height = 220;
  const margin = { top: 25, right: 30, bottom: 35, left: 55 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;

  // Find min/max elevations to scale chart gracefully
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
  // Add margin
  minEl = Math.floor(minEl) - 1;
  maxEl = Math.ceil(maxEl) + 1;
  const elRange = maxEl - minEl;

  const idxToX = (idx: number): number => {
    return margin.left + (idx / (points.length - 1)) * plotWidth;
  };

  const elToY = (el: number): number => {
    const clamped = Math.max(minEl, Math.min(maxEl, el));
    return margin.top + (1.0 - (clamped - minEl) / elRange) * plotHeight;
  };

  // Build SVG path strings
  let sunPath = '';
  let earthPath = '';
  let sunHorizPath = '';
  let earthHorizPath = '';

  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    const x = idxToX(i);

    // Sun path
    const sunY = elToY(p.sunElevation);
    sunPath += i === 0 ? `M ${x} ${sunY} ` : `L ${x} ${sunY} `;

    // Sun direction horizon path
    const sunHY = elToY(p.sunHorizonElevation);
    sunHorizPath += i === 0 ? `M ${x} ${sunHY} ` : `L ${x} ${sunHY} `;

    // Earth path
    if (!isNaN(p.earthElevation)) {
      const earthY = elToY(p.earthElevation);
      earthPath += earthPath === '' ? `M ${x} ${earthY} ` : `L ${x} ${earthY} `;

      const earthHY = elToY(p.earthHorizonElevation);
      earthHorizPath += earthHorizPath === '' ? `M ${x} ${earthHY} ` : `L ${x} ${earthHY} `;
    }
  }

  // 0° reference line Y
  const yZero = elToY(0.0);

  // Elevation ticks
  const elevTicks: number[] = [];
  const tickStep = elRange > 18 ? 4 : 2;
  for (let el = Math.ceil(minEl / tickStep) * tickStep; el <= maxEl; el += tickStep) {
    elevTicks.push(el);
  }

  // Time ticks (e.g. 7 daily ticks)
  const timeTicks: { idx: number; label: string }[] = [];
  const numTimeTicks = Math.min(8, points.length);
  const stepIdx = Math.floor(points.length / (numTimeTicks - 1));
  for (let i = 0; i < points.length; i += stepIdx) {
    const dt = points[i].rawTime.split(' ')[0].replace('2026-', '');
    timeTicks.push({ idx: i, label: dt });
  }

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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-2 border-b border-slate-800 gap-2">
        <div className="flex items-center space-x-2">
          <TrendingUp className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
            Ephemeris Elevation Time-Series
          </h2>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-0.5 bg-amber-400 inline-block" />
            <span className="text-amber-300">Sun Elevation</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-0.5 bg-blue-400 inline-block" />
            <span className="text-blue-300">Earth Elevation</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-0.5 bg-emerald-500/80 inline-block border-b border-dashed border-emerald-400" />
            <span className="text-emerald-400">Directional Horizon</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-0.5 bg-cyan-400/60 inline-block border-b border-dashed border-cyan-400" />
            <span className="text-cyan-400">0° Reference</span>
          </div>
        </div>
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

          {/* Horizontal Elevation Gridlines */}
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

          {/* 0.0° Reference Horizon Line */}
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

          {/* Terrain Horizon in Sun Direction */}
          <path
            d={sunHorizPath}
            fill="none"
            stroke="#10B981"
            strokeWidth="1.2"
            strokeDasharray="3 2"
            opacity="0.85"
          />

          {/* Earth Elevation Curve */}
          {earthPath && (
            <path
              d={earthPath}
              fill="none"
              stroke="#3B82F6"
              strokeWidth="2"
              opacity="0.95"
            />
          )}

          {/* Sun Elevation Curve */}
          <path
            d={sunPath}
            fill="none"
            stroke="#F59E0B"
            strokeWidth="2.2"
            opacity="1.0"
          />

          {/* Active Playback Scrubber Line */}
          <line
            x1={idxToX(activeIndex)}
            y1={margin.top}
            x2={idxToX(activeIndex)}
            y2={margin.top + plotHeight}
            stroke="#00E5FF"
            strokeWidth="2"
            opacity="0.9"
          />
          <circle
            cx={idxToX(activeIndex)}
            cy={elToY(points[activeIndex].sunElevation)}
            r="4.5"
            fill="#F59E0B"
            stroke="#FFFFFF"
            strokeWidth="1.5"
          />
          {!isNaN(points[activeIndex].earthElevation) && (
            <circle
              cx={idxToX(activeIndex)}
              cy={elToY(points[activeIndex].earthElevation)}
              r="4.5"
              fill="#3B82F6"
              stroke="#FFFFFF"
              strokeWidth="1.5"
            />
          )}

          {/* Hover Crosshair */}
          {hoverIndex !== null && hoverIndex !== activeIndex && (
            <g className="pointer-events-none">
              <line
                x1={idxToX(hoverIndex)}
                y1={margin.top}
                x2={idxToX(hoverIndex)}
                y2={margin.top + plotHeight}
                stroke="#64748B"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
            </g>
          )}
        </svg>
      </div>

      {/* Synchronized Hover/Active Tooltip Banner */}
      <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-300 font-mono gap-2">
        <div className="flex items-center space-x-2">
          <span className="text-slate-400">Timestamp:</span>
          <span className="text-cyan-300 font-bold">{displayPoint.rawTime} UTC</span>
        </div>
        <div className="flex items-center space-x-4">
          <div>
            <span className="text-amber-400">Sun: </span>
            <span>
              {displayPoint.sunElevation >= 0 ? '+' : ''}
              {displayPoint.sunElevation.toFixed(2)}° (Horiz: {displayPoint.sunHorizonElevation.toFixed(2)}°)
            </span>
          </div>
          <div>
            <span className="text-blue-400">Earth: </span>
            <span>
              {!isNaN(displayPoint.earthElevation)
                ? `${displayPoint.earthElevation >= 0 ? '+' : ''}${displayPoint.earthElevation.toFixed(2)}°`
                : 'N/A'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

