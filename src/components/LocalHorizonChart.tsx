import React, { useState } from 'react';
import { CalculatedPoint, HorizonProfile, SiteConfig } from '../types';
import { interpolateHorizonElevation } from '../services/horizonProfile';
import { ZoomIn, ZoomOut, Sun, Globe, Layers, Zap } from 'lucide-react';

interface LocalHorizonChartProps {
  site: SiteConfig;
  activePoint?: CalculatedPoint | null;
  profile?: HorizonProfile | null;
  earthClearanceAngle: number;
}

export const LocalHorizonChart: React.FC<LocalHorizonChartProps> = ({
  site,
  activePoint,
  profile,
  earthClearanceAngle,
}) => {
  // Zoom mode: false = full range (-10° to +30°); true = polar zoom (-4° to +8°)
  const [isZoomed, setIsZoomed] = useState<boolean>(true);
  const [hoverAzimuth, setHoverAzimuth] = useState<number | null>(null);

  // Elevation scale bounds
  const minElev = isZoomed ? -4.0 : -10.0;
  const maxElev = isZoomed ? 8.0 : 30.0;
  const elevRange = maxElev - minElev;

  // SVG dimensions
  const width = 800;
  const height = 360;
  const margin = { top: 35, right: 30, bottom: 45, left: 55 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;

  // Coordinate projections
  const azToX = (az: number): number => {
    const clampedAz = Math.max(0, Math.min(360, az));
    return margin.left + (clampedAz / 360.0) * plotWidth;
  };

  const elevToY = (el: number): number => {
    const clampedEl = Math.max(minElev, Math.min(maxElev, el));
    return margin.top + (1.0 - (clampedEl - minElev) / elevRange) * plotHeight;
  };

  // Generate terrain horizon curve points (every 2 degrees for smooth representation)
  const terrainPoints: { az: number; el: number; x: number; y: number }[] = [];
  for (let az = 0; az <= 360; az += 2) {
    const el = interpolateHorizonElevation(profile, az);
    terrainPoints.push({
      az,
      el,
      x: azToX(az),
      y: elevToY(el),
    });
  }

  // Build SVG path for terrain profile polygon
  let terrainPathD = '';
  if (terrainPoints.length > 0) {
    terrainPathD = `M ${terrainPoints[0].x} ${terrainPoints[0].y} `;
    for (let i = 1; i < terrainPoints.length; i++) {
      terrainPathD += `L ${terrainPoints[i].x} ${terrainPoints[i].y} `;
    }
    // Close polygon down to bottom of plot
    terrainPathD += `L ${margin.left + plotWidth} ${margin.top + plotHeight} L ${margin.left} ${margin.top + plotHeight} Z`;
  }

  // Reference lines & ticks
  const yZero = elevToY(0.0);

  // Elevation ticks
  const elevStep = isZoomed ? 2 : 10;
  const elevTicks: number[] = [];
  for (let el = Math.ceil(minElev / elevStep) * elevStep; el <= maxElev; el += elevStep) {
    elevTicks.push(el);
  }

  // Azimuth cardinal ticks
  const azTicks = [
    { az: 0, label: '0° N' },
    { az: 45, label: '45° NE' },
    { az: 90, label: '90° E' },
    { az: 135, label: '135° SE' },
    { az: 180, label: '180° S' },
    { az: 225, label: '225° SW' },
    { az: 270, label: '270° W' },
    { az: 315, label: '315° NW' },
    { az: 360, label: '360° N' },
  ];

  // Mouse move handler for interactive hover
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const svgX = (mouseX / rect.width) * width;
    if (svgX >= margin.left && svgX <= margin.left + plotWidth) {
      const az = ((svgX - margin.left) / plotWidth) * 360.0;
      setHoverAzimuth(az);
    } else {
      setHoverAzimuth(null);
    }
  };

  const handleMouseLeave = () => {
    setHoverAzimuth(null);
  };

  const hoveredTerrainEl =
    hoverAzimuth !== null ? interpolateHorizonElevation(profile, hoverAzimuth) : null;

  return (
    <div className="bg-[#0B1120] border border-slate-800 rounded-xl p-4 shadow-xl flex flex-col justify-between">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
        <div>
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
              Local Horizon & Sky Chart
            </h2>
            <span
              className="text-[11px] px-2 py-0.5 rounded-full font-medium"
              style={{
                backgroundColor: `${site.color}20`,
                color: site.color,
                border: `1px solid ${site.color}50`,
              }}
            >
              {site.name}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Local topocentric coordinate system: Azimuth [0° to 360°], Elevation [deg]. Finite solar disc model α = 0.266°.
          </p>
        </div>

        {/* Zoom & Profile Mode Controls */}
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setIsZoomed(!isZoomed)}
            className={`px-2.5 py-1 rounded text-xs font-medium border flex items-center space-x-1.5 transition ${
              isZoomed
                ? 'bg-cyan-950/80 text-cyan-300 border-cyan-500/40'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
            title="Toggle between polar grazing zoom (-4° to +8°) and full sky view (-10° to +30°)"
          >
            {isZoomed ? <ZoomOut className="w-3.5 h-3.5" /> : <ZoomIn className="w-3.5 h-3.5" />}
            <span>{isZoomed ? 'Polar Zoom (-4° to +8°)' : 'Full View (-10° to +30°)'}</span>
          </button>
        </div>
      </div>

      {/* Interactive SVG Chart */}
      <div className="relative py-2 overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto select-none"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <defs>
            {/* Terrain gradient: dark rock look */}
            <linearGradient id="terrainGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#1E293B" stopOpacity="0.95" />
              <stop offset="40%" stopColor="#0F172A" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#020617" stopOpacity="1.0" />
            </linearGradient>

            {/* Sky background gradient */}
            <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#040711" />
              <stop offset="100%" stopColor="#0B132B" />
            </linearGradient>

            {/* Sun Glow */}
            <radialGradient id="sunMarkerGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#F59E0B" stopOpacity="1" />
              <stop offset="60%" stopColor="#FBBF24" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
            </radialGradient>

            {/* Earth Glow */}
            <radialGradient id="earthMarkerGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#60A5FA" stopOpacity="1" />
              <stop offset="70%" stopColor="#3B82F6" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#1E3A8A" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Plot Background Sky */}
          <rect
            x={margin.left}
            y={margin.top}
            width={plotWidth}
            height={plotHeight}
            fill="url(#skyGrad)"
            stroke="#1E293B"
            strokeWidth="1"
          />

          {/* Azimuth Vertical Gridlines & Labels */}
          {azTicks.map(({ az, label }) => {
            const x = azToX(az);
            return (
              <g key={az}>
                <line
                  x1={x}
                  y1={margin.top}
                  x2={x}
                  y2={margin.top + plotHeight}
                  stroke="#1E293B"
                  strokeWidth="0.8"
                  strokeDasharray={az % 90 === 0 ? 'none' : '2 2'}
                />
                <text
                  x={x}
                  y={margin.top + plotHeight + 16}
                  textAnchor="middle"
                  fill={az % 90 === 0 ? '#94A3B8' : '#475569'}
                  fontSize="9.5"
                  fontWeight={az % 90 === 0 ? '600' : 'normal'}
                  fontFamily="monospace"
                >
                  {label}
                </text>
              </g>
            );
          })}

          {/* Elevation Horizontal Gridlines & Labels */}
          {elevTicks.map((el) => {
            const y = elevToY(el);
            if (y < margin.top || y > margin.top + plotHeight) return null;
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
                  fontSize="9.5"
                  fontWeight={el === 0 ? 'bold' : 'normal'}
                  fontFamily="monospace"
                >
                  {el > 0 ? `+${el}°` : `${el}°`}
                </text>
              </g>
            );
          })}

          {/* 0° Geometric Horizon Line */}
          {yZero >= margin.top && yZero <= margin.top + plotHeight && (
            <g>
              <line
                x1={margin.left}
                y1={yZero}
                x2={margin.left + plotWidth}
                y2={yZero}
                stroke="#00E5FF"
                strokeWidth="1.2"
                strokeDasharray="4 3"
                opacity="0.8"
              />
              <text
                x={margin.left + plotWidth - 6}
                y={yZero - 5}
                textAnchor="end"
                fill="#00E5FF"
                fontSize="8.5"
                fontFamily="monospace"
                opacity="0.9"
              >
                0.0° Reference Horizon
              </text>
            </g>
          )}

          {/* Shaded Local Terrain Horizon Polygon */}
          {profile && profile.points && profile.points.length > 0 && terrainPathD && (
            <g>
              <path
                d={terrainPathD}
                fill="url(#terrainGrad)"
                stroke="#10B981"
                strokeWidth="1.8"
              />
            </g>
          )}

          {/* Active Sun and Earth Markers */}
          {activePoint && (
            <g>
              {/* 1. Sun Marker with Finite Disc Rendering */}
              {(() => {
                const sunX = azToX(activePoint.sunAzimuth);
                const sunY = elevToY(activePoint.sunElevation);
                const sunHorY = elevToY(activePoint.sunHorizonElevation);
                const isVisible = activePoint.sunlitState === 'visible' || activePoint.sunVisible === 'visible';
                const discFrac = activePoint.solarVisibleFraction ?? (activePoint.sunVisible === 'visible' ? 1.0 : 0.0);

                // Pixel scale of solar angular diameter (~0.53° diameter, visual scale 8px radius)
                const sunR = 8.0;

                return (
                  <g>
                    {/* Ray drop line down to horizon */}
                    <line
                      x1={sunX}
                      y1={sunY}
                      x2={sunX}
                      y2={sunHorY}
                      stroke={isVisible ? '#F59E0B' : '#EF4444'}
                      strokeWidth="1"
                      strokeDasharray="2 2"
                      opacity="0.7"
                    />

                    {/* Sun disc and glow */}
                    <circle cx={sunX} cy={sunY} r="16" fill="url(#sunMarkerGlow)" opacity={discFrac > 0 ? 0.9 : 0.3} />
                    
                    {/* Solar Disc Base */}
                    <circle
                      cx={sunX}
                      cy={sunY}
                      r={sunR}
                      fill={discFrac > 0 ? '#F59E0B' : '#451A03'}
                      stroke="#FEF08A"
                      strokeWidth="1.5"
                    />

                    {/* Partial Clipping Shading when intersecting horizon */}
                    {discFrac > 0 && discFrac < 1.0 && (
                      <clipPath id="sunDiscPartialClip">
                        <rect
                          x={sunX - sunR - 2}
                          y={sunY - sunR - 2}
                          width={2 * sunR + 4}
                          height={(2 * sunR + 4) * (1 - discFrac)}
                        />
                      </clipPath>
                    )}

                    {/* Sun rays spikes when lit */}
                    {discFrac > 0.1 &&
                      [0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
                        const rad = (deg * Math.PI) / 180;
                        const r1 = 10.5;
                        const r2 = 13.5;
                        return (
                          <line
                            key={deg}
                            x1={sunX + r1 * Math.cos(rad)}
                            y1={sunY + r1 * Math.sin(rad)}
                            x2={sunX + r2 * Math.cos(rad)}
                            y2={sunY + r2 * Math.sin(rad)}
                            stroke="#FBBF24"
                            strokeWidth="1.2"
                            opacity={discFrac}
                          />
                        );
                      })}

                    {/* Text Label above or below disc */}
                    <g
                      transform={`translate(${sunX}, ${
                        sunY > margin.top + 30 ? sunY - 20 : sunY + 24
                      })`}
                    >
                      <rect
                        x="-52"
                        y="-10"
                        width="104"
                        height="18"
                        rx="4"
                        fill="#0B1120"
                        stroke={isVisible ? '#F59E0B' : '#EF4444'}
                        strokeWidth="1"
                        opacity="0.95"
                      />
                      <text
                        x="0"
                        y="2.5"
                        textAnchor="middle"
                        fill={isVisible ? '#FDE68A' : '#FCA5A5'}
                        fontSize="9"
                        fontWeight="bold"
                        fontFamily="monospace"
                      >
                        ☀️ Sun {activePoint.sunElevation >= 0 ? '+' : ''}
                        {activePoint.sunElevation.toFixed(2)}° ({(discFrac * 100).toFixed(0)}%)
                      </text>
                    </g>
                  </g>
                );
              })()}

              {/* 2. Earth Marker */}
              {activePoint.earthAzimuth && !isNaN(activePoint.earthAzimuth) && (
                (() => {
                  const earthX = azToX(activePoint.earthAzimuth);
                  const earthY = elevToY(activePoint.earthElevation);
                  const earthHorY = elevToY(activePoint.earthHorizonElevation);
                  const isVisible = activePoint.earthVisible === 'visible';

                  return (
                    <g>
                      {/* Ray drop line down to horizon */}
                      <line
                        x1={earthX}
                        y1={earthY}
                        x2={earthX}
                        y2={earthHorY}
                        stroke={isVisible ? '#3B82F6' : '#EF4444'}
                        strokeWidth="1"
                        strokeDasharray="2 2"
                        opacity="0.7"
                      />

                      {/* Earth disc and glow */}
                      <circle cx={earthX} cy={earthY} r="14" fill="url(#earthMarkerGlow)" />
                      <circle
                        cx={earthX}
                        cy={earthY}
                        r="6.5"
                        fill="#3B82F6"
                        stroke="#93C5FD"
                        strokeWidth="1.5"
                      />
                      {/* Subtle continent markings on Earth marker */}
                      <path
                        d={`M ${earthX - 3} ${earthY - 2} Q ${earthX} ${earthY} ${earthX + 2} ${earthY - 3}`}
                        stroke="#10B981"
                        strokeWidth="1"
                        fill="none"
                      />

                      {/* Text Label */}
                      <g
                        transform={`translate(${earthX}, ${
                          earthY > margin.top + 30 ? earthY - 20 : earthY + 24
                        })`}
                      >
                        <rect
                          x="-50"
                          y="-10"
                          width="100"
                          height="18"
                          rx="4"
                          fill="#0B1120"
                          stroke={isVisible ? '#3B82F6' : '#EF4444'}
                          strokeWidth="1"
                          opacity="0.95"
                        />
                        <text
                          x="0"
                          y="2.5"
                          textAnchor="middle"
                          fill={isVisible ? '#BFDBFE' : '#FCA5A5'}
                          fontSize="9"
                          fontWeight="bold"
                          fontFamily="monospace"
                        >
                          🌍 Earth {activePoint.earthElevation >= 0 ? '+' : ''}
                          {activePoint.earthElevation.toFixed(2)}°
                        </text>
                      </g>
                    </g>
                  );
                })()
              )}
            </g>
          )}

          {/* Interactive Crosshair on Hover */}
          {hoverAzimuth !== null && hoveredTerrainEl !== null && (
            <g className="pointer-events-none">
              <line
                x1={azToX(hoverAzimuth)}
                y1={margin.top}
                x2={azToX(hoverAzimuth)}
                y2={margin.top + plotHeight}
                stroke="#38BDF8"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
              <circle
                cx={azToX(hoverAzimuth)}
                cy={elevToY(hoveredTerrainEl)}
                r="3.5"
                fill="#10B981"
                stroke="#FFFFFF"
                strokeWidth="1"
              />
              <g
                transform={`translate(${Math.min(
                  margin.left + plotWidth - 70,
                  Math.max(margin.left + 70, azToX(hoverAzimuth))
                )}, ${margin.top + 20})`}
              >
                <rect
                  x="-65"
                  y="-12"
                  width="130"
                  height="22"
                  rx="4"
                  fill="#0B1120"
                  stroke="#38BDF8"
                  strokeWidth="1"
                  opacity="0.95"
                />
                <text
                  x="0"
                  y="2"
                  textAnchor="middle"
                  fill="#E2E8F0"
                  fontSize="9.5"
                  fontFamily="monospace"
                >
                  Az {hoverAzimuth.toFixed(1)}° | Horiz {hoveredTerrainEl.toFixed(2)}°
                </text>
              </g>
            </g>
          )}
        </svg>
      </div>

      {/* Instantaneous Object Status & Photovoltaic Power Readout Cards */}
      {activePoint ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-slate-800">
          {/* Sun & Photovoltaic Power Status Card */}
          <div
            className={`p-2.5 rounded-lg border flex items-center justify-between text-xs ${
              activePoint.sunlitState === 'visible' || activePoint.sunVisible === 'visible'
                ? 'bg-amber-950/30 border-amber-500/40 text-amber-200'
                : 'bg-red-950/20 border-red-500/30 text-red-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Sun className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <div className="font-semibold text-white flex items-center gap-1.5">
                  <span>Sun:</span>
                  <span
                    className={`text-[11px] font-mono uppercase px-1.5 py-0.2 rounded ${
                      activePoint.sunlitState === 'visible' || activePoint.sunVisible === 'visible'
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-red-500/20 text-red-300'
                    }`}
                  >
                    {activePoint.sunlitState || activePoint.sunVisible}
                  </span>
                  <span className="text-[10px] text-amber-400 font-mono bg-amber-950/60 px-1 py-0.5 rounded">
                    f_sun: {((activePoint.solarVisibleFraction ?? (activePoint.sunVisible === 'visible' ? 1 : 0)) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  Az: {activePoint.sunAzimuth.toFixed(2)}° | El: {activePoint.sunElevation.toFixed(2)}° (Horizon: {activePoint.sunHorizonElevation.toFixed(2)}°)
                </div>
              </div>
            </div>
            <div className="text-right font-mono text-[11px]">
              <div className="flex items-center gap-1 text-amber-300 font-semibold justify-end">
                <Zap className="w-3 h-3 text-amber-400" />
                <span>{activePoint.pvPowerWatts} W</span>
              </div>
              <span className="text-slate-400 block text-[10px]">
                Σ {activePoint.cumulativeEnergyWh} Wh
              </span>
            </div>
          </div>

          {/* Earth Status Card */}
          <div
            className={`p-2.5 rounded-lg border flex items-center justify-between text-xs ${
              activePoint.earthVisible === 'visible'
                ? 'bg-blue-950/30 border-blue-500/40 text-blue-200'
                : 'bg-red-950/20 border-red-500/30 text-red-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Globe className="w-4 h-4 text-blue-400 shrink-0" />
              <div>
                <div className="font-semibold text-white flex items-center gap-1.5">
                  <span>Earth:</span>
                  <span
                    className={`text-[11px] font-mono uppercase px-1.5 py-0.2 rounded ${
                      activePoint.earthVisible === 'visible'
                        ? 'bg-blue-500/20 text-blue-300'
                        : 'bg-red-500/20 text-red-300'
                    }`}
                  >
                    {activePoint.earthVisible}
                  </span>
                  {activePoint.earthCleared && (
                    <span className="text-[10px] bg-cyan-900/60 text-cyan-300 px-1 rounded">
                      +{earthClearanceAngle}° Cleared
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  Az: {isNaN(activePoint.earthAzimuth) ? 'N/A' : `${activePoint.earthAzimuth.toFixed(2)}°`} | El:{' '}
                  {isNaN(activePoint.earthElevation) ? 'N/A' : `${activePoint.earthElevation.toFixed(2)}°`} (Horizon: {activePoint.earthHorizonElevation.toFixed(2)}°)
                </div>
              </div>
            </div>
            <div className="text-right font-mono text-[11px]">
              <span className="text-slate-400 block text-[10px]">Margin</span>
              <span
                className={
                  activePoint.earthElevation - activePoint.earthHorizonElevation >= 0
                    ? 'text-emerald-400 font-semibold'
                    : 'text-red-400 font-semibold'
                }
              >
                {!isNaN(activePoint.earthElevation)
                  ? `${
                      activePoint.earthElevation - activePoint.earthHorizonElevation >= 0 ? '+' : ''
                    }${(activePoint.earthElevation - activePoint.earthHorizonElevation).toFixed(2)}°`
                  : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-3 text-center text-xs text-slate-500">
          No ephemeris data loaded for selected site.
        </div>
      )}
    </div>
  );
};
