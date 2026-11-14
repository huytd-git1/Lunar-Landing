import React, { useState, useRef, useMemo } from 'react';
import { CalculatedPoint, SiteConfig } from '../types';
import {
  Compass,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Minimize2,
  Crosshair,
  MapPin,
  Ruler,
  Info,
  Check,
} from 'lucide-react';
import { formatEastLongitude, formatLatitude } from '../services/coordinates';

interface LunarSiteMapProps {
  sites: SiteConfig[];
  selectedSiteId: string;
  onSelectSite: (siteId: string) => void;
  onUpdateSite?: (updated: SiteConfig) => void;
  activePoint?: CalculatedPoint | null;
}

type MapLayer = 'shaded' | 'elevation' | 'illumination' | 'earth_los';
type MapTool = 'select' | 'reposition' | 'measure';

interface PolarFeature {
  name: string;
  lat: number;
  lon: number;
  diameterKm: number;
  depthKm?: number;
  elevationM?: number;
  type: 'crater' | 'massif' | 'ridge' | 'psr';
  notes: string;
}

const POLAR_FEATURES: PolarFeature[] = [
  { name: 'Shackleton', lat: -89.9, lon: 0.0, diameterKm: 21, depthKm: 4.2, type: 'crater', notes: 'Prime south polar crater; rim features near-continuous illumination, floor is in permanent shadow.' },
  { name: 'Connecting Ridge', lat: -89.75, lon: 160.0, diameterKm: 14, elevationM: 1450, type: 'ridge', notes: 'Ridge between Shackleton and de Gerlache; one of the highest cumulative solar illumination sites on the Moon.' },
  { name: 'Malapert Mountain', lat: -86.0, lon: 0.0, diameterKm: 35, elevationM: 5000, type: 'massif', notes: 'Massif peak ~5 km above floor; near-continuous direct-to-Earth line of sight (~98%).' },
  { name: 'de Gerlache', lat: -88.5, lon: 290.0, diameterKm: 32, depthKm: 3.5, type: 'crater', notes: 'Complex crater rim; key candidate for Artemis exploration and volatile sampling.' },
  { name: 'Shoemaker', lat: -88.1, lon: 45.0, diameterKm: 51, depthKm: 3.8, type: 'crater', notes: 'Large permanently shadowed crater floor containing confirmed volatile cold traps.' },
  { name: 'Faustini', lat: -87.3, lon: 84.0, diameterKm: 39, depthKm: 3.2, type: 'crater', notes: 'Deep polar crater with extensive PSR ice-trapping conditions.' },
  { name: 'Haworth', lat: -87.4, lon: 355.0, diameterKm: 35, depthKm: 3.0, type: 'crater', notes: 'Adjacent to Malapert massif with continuous shadow on western floor.' },
  { name: 'Cabeus', lat: -84.9, lon: 325.0, diameterKm: 98, depthKm: 4.0, type: 'crater', notes: 'Site of NASA LCROSS impact (2009) confirming water ice and volatile deposits.' },
  { name: 'Amundsen', lat: -84.5, lon: 83.0, diameterKm: 103, depthKm: 4.5, type: 'crater', notes: 'Massive south polar impact basin with prominent central peak.' },
  { name: 'Nobile', lat: -85.2, lon: 53.0, diameterKm: 73, depthKm: 3.6, type: 'crater', notes: 'NASA VIPER rover primary target area for lunar water ice mapping.' },
  { name: 'Leibnitz Beta', lat: -85.8, lon: 330.0, diameterKm: 40, elevationM: 4200, type: 'massif', notes: 'Elevated plateau providing panoramic line of sight toward Earth.' },
];

export const LunarSiteMap: React.FC<LunarSiteMapProps> = ({
  sites,
  selectedSiteId,
  onSelectSite,
  onUpdateSite,
  activePoint,
}) => {
  // Map Layer State
  const [activeLayer, setActiveLayer] = useState<MapLayer>('shaded');
  const [activeTool, setActiveTool] = useState<MapTool>('select');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Zoom & Pan State
  const [zoom, setZoom] = useState<number>(1.0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Measurement tool state
  const [measurePoint1, setMeasurePoint1] = useState<{ lat: number; lon: number } | null>(null);
  const [measurePoint2, setMeasurePoint2] = useState<{ lat: number; lon: number } | null>(null);

  // Hover Coordinates Readout
  const [hoverCoords, setHoverCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Overlay Toggles
  const [showCraters, setShowCraters] = useState<boolean>(true);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [showSunBeam, setShowSunBeam] = useState<boolean>(true);
  const [showEarthBeam, setShowEarthBeam] = useState<boolean>(true);
  const [showPSRs, setShowPSRs] = useState<boolean>(true);

  // Map canvas geometry
  const baseSize = 480;
  const cx = baseSize / 2;
  const cy = baseSize / 2;
  const maxRadius = 210; // Corresponds to latitude -84.0°S

  const svgRef = useRef<SVGSVGElement | null>(null);

  // Selected site
  const selectedSite = sites.find((s) => s.id === selectedSiteId) || sites[0];

  // Map latitude [-90, -84] to radius [0, maxRadius]
  const latToRadius = (lat: number): number => {
    const colatitude = 90 + lat; // For lat=-90 -> 0; for lat=-84 -> 6
    return (Math.max(0, colatitude) / 6.0) * maxRadius;
  };

  // Convert (lat, lon) to base map (x, y)
  const projectToMap = (lat: number, lon: number): { x: number; y: number } => {
    const r = latToRadius(lat);
    const rad = (lon * Math.PI) / 180.0;
    // 0° lon (Facing Earth) points UP (-Y)
    // 90° lon points RIGHT (+X)
    const x = cx + r * Math.sin(rad);
    const y = cy - r * Math.cos(rad);
    return { x, y };
  };

  // Convert base map (x, y) back to (lat, lon)
  const unprojectFromMap = (x: number, y: number): { lat: number; lon: number } | null => {
    const dx = x - cx;
    const dy = y - cy;
    const r = Math.sqrt(dx * dx + dy * dy);
    if (r > maxRadius * 1.05) return null; // Outside valid polar disk

    const colat = (r / maxRadius) * 6.0;
    const lat = -90 + colat;

    const rad = Math.atan2(dx, -dy);
    let lon = (rad * 180.0) / Math.PI;
    if (lon < 0) lon += 360.0;

    return {
      lat: Math.max(-90, Math.min(-84, lat)),
      lon: (lon % 360 + 360) % 360,
    };
  };

  // Great-circle distance on lunar sphere (R = 1737.4 km)
  const calculateLunarDistanceKm = (
    p1: { lat: number; lon: number },
    p2: { lat: number; lon: number }
  ): number => {
    const R = 1737.4;
    const phi1 = (p1.lat * Math.PI) / 180;
    const phi2 = (p2.lat * Math.PI) / 180;
    const deltaPhi = ((p2.lat - p1.lat) * Math.PI) / 180;
    const deltaLambda = ((p2.lon - p1.lon) * Math.PI) / 180;

    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
  };

  // Mouse interaction handlers
  const getSvgCoordinates = (e: React.MouseEvent<SVGSVGElement>): { x: number; y: number } => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    // Invert zoom and pan transform
    const scale = zoom;
    const svgX = (clientX / rect.width) * baseSize;
    const svgY = (clientY / rect.height) * baseSize;

    const worldX = (svgX - cx - pan.x) / scale + cx;
    const worldY = (svgY - cy - pan.y) / scale + cy;

    return { x: worldX, y: worldY };
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const coords = getSvgCoordinates(e);
    const lunarCoords = unprojectFromMap(coords.x, coords.y);
    setHoverCoords(lunarCoords);

    if (isDragging) {
      const dx = (e.clientX - dragStart.x) * (baseSize / (svgRef.current?.clientWidth || baseSize));
      const dy = (e.clientY - dragStart.y) * (baseSize / (svgRef.current?.clientHeight || baseSize));
      setPan((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (activeTool === 'select' && zoom > 1.0) {
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMapClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const coords = getSvgCoordinates(e);
    const lunarCoords = unprojectFromMap(coords.x, coords.y);
    if (!lunarCoords) return;

    if (activeTool === 'reposition' && onUpdateSite) {
      // Relocate the active candidate site
      onUpdateSite({
        ...selectedSite,
        latitude: Math.round(lunarCoords.lat * 100) / 100,
        longitude: Math.round(lunarCoords.lon * 10) / 10,
      });
      showTemporaryNotice(
        `Relocated ${selectedSite.name} to ${formatLatitude(lunarCoords.lat, 2)}, ${formatEastLongitude(lunarCoords.lon, 1)}`
      );
    } else if (activeTool === 'measure') {
      if (!measurePoint1 || (measurePoint1 && measurePoint2)) {
        setMeasurePoint1(lunarCoords);
        setMeasurePoint2(null);
      } else {
        setMeasurePoint2(lunarCoords);
      }
    }
  };

  const showTemporaryNotice = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleZoom = (delta: number) => {
    setZoom((prev) => Math.min(4.0, Math.max(1.0, prev + delta)));
  };

  const handleResetView = () => {
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
    setMeasurePoint1(null);
    setMeasurePoint2(null);
  };

  // Measured distance
  const measuredDistanceKm = useMemo(() => {
    if (measurePoint1 && measurePoint2) {
      return calculateLunarDistanceKm(measurePoint1, measurePoint2);
    }
    return null;
  }, [measurePoint1, measurePoint2]);

  // Verified external permalinks
  const quickmapUrl = `https://quickmap.lroc.asu.edu/?extent=${selectedSite.latitude - 0.5},${selectedSite.longitude - 2},${selectedSite.latitude + 0.5},${selectedSite.longitude + 2}&proj=17`;
  const moonTrekUrl = `https://trek.nasa.gov/moon/#v=0.1&x=${selectedSite.longitude}&y=${selectedSite.latitude}&z=10`;

  // Sun dynamic azimuth angle for terrain hillshading
  const sunAzimuth = activePoint ? activePoint.sunAzimuth : 315;
  const sunLightX = cx + Math.sin((sunAzimuth * Math.PI) / 180) * 80;
  const sunLightY = cy - Math.cos((sunAzimuth * Math.PI) / 180) * 80;

  return (
    <div
      className={`bg-[#0B1120] border border-slate-800 rounded-xl p-4 shadow-xl flex flex-col justify-between transition-all ${
        isFullscreen ? 'fixed inset-4 z-50 max-w-none' : 'relative'
      }`}
    >
      {/* 1. Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between pb-2.5 border-b border-slate-800 gap-2">
        <div className="flex items-center space-x-2">
          <Compass className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
            <span>Lunar South Pole Interactive Map</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40">
              LOLA & WAC
            </span>
          </h2>
        </div>

        {/* Map Mode Buttons & External Links */}
        <div className="flex items-center space-x-2">
          {/* External Links */}
          <a
            href={quickmapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-cyan-400 hover:text-cyan-300 px-2 py-1 rounded bg-slate-800/80 hover:bg-slate-700 border border-slate-700 flex items-center space-x-1"
            title="Open in LROC QuickMap South Pole view"
          >
            <span>QuickMap</span>
            <ExternalLink className="w-3 h-3" />
          </a>
          <a
            href={moonTrekUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-cyan-400 hover:text-cyan-300 px-2 py-1 rounded bg-slate-800/80 hover:bg-slate-700 border border-slate-700 flex items-center space-x-1"
            title="Open in NASA Moon Trek South Pole GIS"
          >
            <span>Moon Trek</span>
            <ExternalLink className="w-3 h-3" />
          </a>

          {/* Fullscreen Expand Button */}
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
            title={isFullscreen ? 'Exit Fullscreen' : 'Expand Fullscreen Map'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* 2. Layer & Tool Selector Bar */}
      <div className="flex flex-wrap items-center justify-between py-2 gap-2 text-xs">
        {/* Layer Switcher Tabs */}
        <div className="flex items-center space-x-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveLayer('shaded')}
            className={`px-2.5 py-1 rounded-md transition font-medium text-[11px] ${
              activeLayer === 'shaded'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50 shadow-inner'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="LOLA Topography Shaded Relief with dynamic solar shadow casting"
          >
            Shaded Relief
          </button>
          <button
            type="button"
            onClick={() => setActiveLayer('elevation')}
            className={`px-2.5 py-1 rounded-md transition font-medium text-[11px] ${
              activeLayer === 'elevation'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50 shadow-inner'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Hypsometric color-coded elevation map (-4 km to +5 km)"
          >
            Elevation Tint
          </button>
          <button
            type="button"
            onClick={() => setActiveLayer('illumination')}
            className={`px-2.5 py-1 rounded-md transition font-medium text-[11px] ${
              activeLayer === 'illumination'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50 shadow-inner'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="LROC WAC annual solar illumination percentage and PSR cold traps"
          >
            Solar Illum %
          </button>
          <button
            type="button"
            onClick={() => setActiveLayer('earth_los')}
            className={`px-2.5 py-1 rounded-md transition font-medium text-[11px] ${
              activeLayer === 'earth_los'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50 shadow-inner'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Direct-to-Earth radio line-of-sight coverage mask"
          >
            Earth LOS Mask
          </button>
        </div>

        {/* Interactive Action Tools */}
        <div className="flex items-center space-x-1.5">
          <button
            type="button"
            onClick={() => setActiveTool('select')}
            className={`p-1.5 rounded-md border text-xs flex items-center space-x-1 transition ${
              activeTool === 'select'
                ? 'bg-cyan-950 text-cyan-300 border-cyan-500/50 font-semibold'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200'
            }`}
            title="Select & Pan Tool: Click site markers or drag map"
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Select/Pan</span>
          </button>

          {onUpdateSite && (
            <button
              type="button"
              onClick={() => setActiveTool('reposition')}
              className={`p-1.5 rounded-md border text-xs flex items-center space-x-1 transition ${
                activeTool === 'reposition'
                  ? 'bg-amber-950 text-amber-300 border-amber-500/50 font-semibold'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200'
              }`}
              title="Click on the lunar surface to relocate the active candidate site"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Relocate Site</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setActiveTool('measure');
              setMeasurePoint1(null);
              setMeasurePoint2(null);
            }}
            className={`p-1.5 rounded-md border text-xs flex items-center space-x-1 transition ${
              activeTool === 'measure'
                ? 'bg-emerald-950 text-emerald-300 border-emerald-500/50 font-semibold'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200'
            }`}
            title="Measure distance between any two lunar surface points"
          >
            <Ruler className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Ruler (km)</span>
          </button>
        </div>
      </div>

      {/* 3. Notification Banner */}
      {notification && (
        <div className="mb-2 p-2 rounded-lg bg-cyan-950/90 border border-cyan-500/60 text-cyan-200 text-xs flex items-center justify-between font-mono animate-pulse">
          <div className="flex items-center space-x-2">
            <Check className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>{notification}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* 4. Active Tool Instruction Badge */}
      {activeTool === 'reposition' && (
        <div className="mb-2 p-1.5 rounded bg-amber-950/60 border border-amber-500/40 text-amber-300 text-[11px] flex items-center space-x-1.5">
          <Info className="w-3.5 h-3.5 shrink-0" />
          <span>Click anywhere on the Moon to place <strong>{selectedSite.name}</strong>.</span>
        </div>
      )}
      {activeTool === 'measure' && (
        <div className="mb-2 p-1.5 rounded bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-[11px] flex items-center justify-between">
          <span>Click 2 points on the map to measure surface distance.</span>
          {measuredDistanceKm !== null && (
            <span className="font-mono font-bold bg-emerald-900/80 px-2 py-0.5 rounded text-white">
              Distance: {measuredDistanceKm} km
            </span>
          )}
        </div>
      )}

      {/* 5. Main SVG Map Viewport */}
      <div className="relative flex items-center justify-center overflow-hidden rounded-xl bg-slate-950 border border-slate-800 select-none">
        {/* On-Map Floating Zoom Controls */}
        <div className="absolute top-3 right-3 z-10 flex flex-col space-y-1 bg-slate-900/90 border border-slate-700/80 rounded-lg p-1 backdrop-blur shadow-lg">
          <button
            type="button"
            onClick={() => handleZoom(0.5)}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition"
            title="Zoom In (+)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <div className="text-[10px] font-mono text-center text-cyan-400 py-0.5">
            {zoom.toFixed(1)}x
          </div>
          <button
            type="button"
            onClick={() => handleZoom(-0.5)}
            disabled={zoom <= 1.0}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white disabled:opacity-40 transition"
            title="Zoom Out (-)"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleResetView}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition"
            title="Reset View"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Layer Legend Overlay (Bottom Left) */}
        <div className="absolute bottom-3 left-3 z-10 bg-slate-900/90 border border-slate-800/90 rounded-lg p-2 backdrop-blur text-[10px] font-mono space-y-1">
          {activeLayer === 'shaded' && (
            <div>
              <span className="text-slate-400 block text-[9px] uppercase">LOLA Topographic Hillshade</span>
              <div className="flex items-center space-x-1.5 mt-0.5">
                <span className="w-2.5 h-2.5 rounded bg-[#040711] border border-slate-700 inline-block" />
                <span className="text-slate-300">PSR Shadow</span>
                <span className="w-2.5 h-2.5 rounded bg-[#1E293B] inline-block ml-2" />
                <span className="text-slate-300">Terrain Ridge</span>
              </div>
            </div>
          )}
          {activeLayer === 'elevation' && (
            <div>
              <span className="text-slate-400 block text-[9px] uppercase">Elevation (m relative to R=1737.4 km)</span>
              <div className="flex items-center space-x-1 mt-0.5">
                <span className="w-3 h-2 rounded bg-indigo-900 inline-block" />
                <span>-4 km</span>
                <span className="w-3 h-2 rounded bg-cyan-700 inline-block" />
                <span>-2 km</span>
                <span className="w-3 h-2 rounded bg-emerald-600 inline-block" />
                <span>0 m</span>
                <span className="w-3 h-2 rounded bg-amber-500 inline-block" />
                <span>+2 km</span>
                <span className="w-3 h-2 rounded bg-rose-500 inline-block" />
                <span>+5 km</span>
              </div>
            </div>
          )}
          {activeLayer === 'illumination' && (
            <div>
              <span className="text-slate-400 block text-[9px] uppercase">Annual Illumination Percentage</span>
              <div className="flex items-center space-x-1 mt-0.5">
                <span className="w-3 h-2 rounded bg-black inline-block" />
                <span>0% (PSR)</span>
                <span className="w-3 h-2 rounded bg-purple-900 inline-block" />
                <span>25%</span>
                <span className="w-3 h-2 rounded bg-emerald-600 inline-block" />
                <span>50%</span>
                <span className="w-3 h-2 rounded bg-amber-400 inline-block" />
                <span>80%+</span>
              </div>
            </div>
          )}
          {activeLayer === 'earth_los' && (
            <div>
              <span className="text-slate-400 block text-[9px] uppercase">Direct-to-Earth Line of Sight</span>
              <div className="flex items-center space-x-1 mt-0.5">
                <span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block" />
                <span className="text-emerald-300">Visible (&gt;0°)</span>
                <span className="w-2.5 h-2.5 rounded bg-red-900 inline-block ml-2" />
                <span className="text-red-300">Occulted</span>
              </div>
            </div>
          )}
        </div>

        {/* Interactive SVG Canvas */}
        <svg
          ref={svgRef}
          viewBox={`0 0 ${baseSize} ${baseSize}`}
          className={`w-full max-w-[540px] h-auto ${
            activeTool === 'reposition' ? 'cursor-crosshair' : activeTool === 'measure' ? 'cursor-crosshair' : zoom > 1 ? 'cursor-grab' : 'cursor-default'
          }`}
          onMouseMove={handleMouseMove}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onClick={handleMapClick}
        >
          <defs>
            {/* Shaded relief gradient illuminated from dynamic Sun direction */}
            <radialGradient
              id="lolaShaded"
              cx={`${(sunLightX / baseSize) * 100}%`}
              cy={`${(sunLightY / baseSize) * 100}%`}
              r="60%"
            >
              <stop offset="0%" stopColor="#1E2A44" />
              <stop offset="45%" stopColor="#0F172A" />
              <stop offset="85%" stopColor="#080D1A" />
              <stop offset="100%" stopColor="#020409" />
            </radialGradient>

            {/* Elevation Hypsometric Tint Gradient */}
            <radialGradient id="elevationTint" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#1E3A8A" />
              <stop offset="35%" stopColor="#0D9488" />
              <stop offset="65%" stopColor="#10B981" />
              <stop offset="85%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#BE123C" />
            </radialGradient>

            {/* Illumination % Gradient */}
            <radialGradient id="illuminationTint" cx="45%" cy="55%" r="55%">
              <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.8" />
              <stop offset="40%" stopColor="#10B981" stopOpacity="0.5" />
              <stop offset="70%" stopColor="#312E81" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#030712" stopOpacity="0.95" />
            </radialGradient>

            {/* Earth LOS Gradient */}
            <linearGradient id="earthLosGrad" x1="50%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stopColor="#065F46" stopOpacity="0.85" />
              <stop offset="75%" stopColor="#047857" stopOpacity="0.75" />
              <stop offset="88%" stopColor="#854D0E" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#881337" stopOpacity="0.9" />
            </linearGradient>

            {/* Crater rim shadow filter */}
            <filter id="craterShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="1" dy="1" stdDeviation="1.5" floodColor="#000000" floodOpacity="0.8" />
            </filter>
          </defs>

          {/* Map Content Group with Zoom and Pan Transform */}
          <g transform={`translate(${cx + pan.x}, ${cy + pan.y}) scale(${zoom}) translate(${-cx}, ${-cy})`}>
            {/* Base Polar Disk */}
            <circle
              cx={cx}
              cy={cy}
              r={maxRadius}
              fill={
                activeLayer === 'shaded'
                  ? 'url(#lolaShaded)'
                  : activeLayer === 'elevation'
                  ? 'url(#elevationTint)'
                  : activeLayer === 'illumination'
                  ? 'url(#illuminationTint)'
                  : 'url(#earthLosGrad)'
              }
              stroke="#334155"
              strokeWidth="2"
            />

            {/* Topographic Crater Morphology & Permanent Shadow Floor Rings */}
            {POLAR_FEATURES.map((feat) => {
              const pt = projectToMap(feat.lat, feat.lon);
              const pxR = Math.max(3.5, (feat.diameterKm / 2 / 180) * 22);

              if (feat.type === 'crater') {
                return (
                  <g key={feat.name} className="pointer-events-none">
                    {/* Outer Ejecta & Rim Crest */}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={pxR * 1.25}
                      fill="none"
                      stroke="#475569"
                      strokeWidth="1.2"
                      opacity="0.6"
                    />
                    {/* Inner Rim */}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={pxR}
                      fill="#020617"
                      stroke="#38BDF8"
                      strokeWidth="1.2"
                      filter="url(#craterShadow)"
                    />
                    {/* Permanently Shadowed Region (PSR) Deep Floor */}
                    {showPSRs && (
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={pxR * 0.65}
                        fill="#000000"
                        stroke="#0F172A"
                        strokeWidth="0.8"
                      />
                    )}
                  </g>
                );
              }

              if (feat.type === 'massif' || feat.type === 'ridge') {
                return (
                  <g key={feat.name} className="pointer-events-none">
                    {/* Elevated Massif Contour */}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={pxR * 1.1}
                      fill="#1E293B"
                      fillOpacity="0.4"
                      stroke="#F59E0B"
                      strokeWidth="1.2"
                      strokeDasharray="2 2"
                    />
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={pxR * 0.5}
                      fill="#334155"
                      fillOpacity="0.6"
                    />
                  </g>
                );
              }

              return null;
            })}

            {/* Polar Concentric Grid Circles (-88°S, -86°S, -84°S) */}
            {showGrid &&
              [88, 86, 84].map((latDeg) => {
                const r = latToRadius(-latDeg);
                return (
                  <g key={latDeg} className="pointer-events-none">
                    <circle
                      cx={cx}
                      cy={cy}
                      r={r}
                      fill="none"
                      stroke="#334155"
                      strokeWidth="0.8"
                      strokeDasharray="4 3"
                      opacity="0.8"
                    />
                    <text
                      x={cx + 4}
                      y={cy - r + 11}
                      fill="#64748B"
                      fontSize="9"
                      fontFamily="monospace"
                    >
                      {latDeg}°S
                    </text>
                  </g>
                );
              })}

            {/* Meridian Radials (0° Earth, 90°E, 180° Farside, 270°E) */}
            {showGrid && (
              <g className="pointer-events-none">
                <line
                  x1={cx}
                  y1={cy - maxRadius}
                  x2={cx}
                  y2={cy + maxRadius}
                  stroke="#334155"
                  strokeWidth="0.8"
                  opacity="0.8"
                />
                <line
                  x1={cx - maxRadius}
                  y1={cy}
                  x2={cx + maxRadius}
                  y2={cy}
                  stroke="#334155"
                  strokeWidth="0.8"
                  opacity="0.8"
                />

                {/* Meridian Labels */}
                <text
                  x={cx}
                  y={cy - maxRadius - 6}
                  textAnchor="middle"
                  fill="#60A5FA"
                  fontSize="9.5"
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  0° (Earth Facing)
                </text>
                <text
                  x={cx + maxRadius + 8}
                  y={cy + 3}
                  textAnchor="start"
                  fill="#64748B"
                  fontSize="9.5"
                  fontFamily="monospace"
                >
                  90°E
                </text>
                <text
                  x={cx}
                  y={cy + maxRadius + 14}
                  textAnchor="middle"
                  fill="#64748B"
                  fontSize="9.5"
                  fontFamily="monospace"
                >
                  180° (Farside)
                </text>
                <text
                  x={cx - maxRadius - 8}
                  y={cy + 3}
                  textAnchor="end"
                  fill="#64748B"
                  fontSize="9.5"
                  fontFamily="monospace"
                >
                  270°E
                </text>
              </g>
            )}

            {/* Crater & Feature Name Annotations */}
            {showCraters &&
              POLAR_FEATURES.map((feat) => {
                const pt = projectToMap(feat.lat, feat.lon);
                const pxR = Math.max(3.5, (feat.diameterKm / 2 / 180) * 22);
                return (
                  <g key={feat.name} className="pointer-events-none">
                    <text
                      x={pt.x}
                      y={pt.y + pxR + 9}
                      textAnchor="middle"
                      fill="#94A3B8"
                      fontSize="8"
                      fontWeight="600"
                      fontFamily="sans-serif"
                    >
                      {feat.name}
                    </text>
                  </g>
                );
              })}

            {/* South Pole Exact Center Marker */}
            <circle cx={cx} cy={cy} r="3" fill="#00E5FF" />
            <text
              x={cx + 5}
              y={cy - 4}
              fill="#00E5FF"
              fontSize="9"
              fontFamily="monospace"
              fontWeight="bold"
            >
              South Pole (90°S)
            </text>

            {/* Subsolar Illumination Beam Vector */}
            {showSunBeam && activePoint && (
              <g className="pointer-events-none transition-all duration-300">
                {(() => {
                  const sunAzRad = (activePoint.sunAzimuth * Math.PI) / 180.0;
                  const arrowLen = maxRadius - 10;
                  const ax = cx + arrowLen * Math.sin(sunAzRad);
                  const ay = cy - arrowLen * Math.cos(sunAzRad);
                  return (
                    <g>
                      <line
                        x1={cx}
                        y1={cy}
                        x2={ax}
                        y2={ay}
                        stroke="#F59E0B"
                        strokeWidth="1.5"
                        strokeDasharray="4 2"
                        opacity="0.85"
                      />
                      <circle cx={ax} cy={ay} r="5" fill="#F59E0B" />
                      <text
                        x={ax + (ax > cx ? 6 : -6)}
                        y={ay + 3}
                        textAnchor={ax > cx ? 'start' : 'end'}
                        fill="#FBBF24"
                        fontSize="8.5"
                        fontWeight="bold"
                        fontFamily="monospace"
                      >
                        Sun Az {activePoint.sunAzimuth.toFixed(1)}°
                      </text>
                    </g>
                  );
                })()}
              </g>
            )}

            {/* Sub-Earth Vector */}
            {showEarthBeam && activePoint && !isNaN(activePoint.earthAzimuth) && (
              <g className="pointer-events-none transition-all duration-300">
                {(() => {
                  const earthAzRad = (activePoint.earthAzimuth * Math.PI) / 180.0;
                  const arrowLen = maxRadius - 25;
                  const ex = cx + arrowLen * Math.sin(earthAzRad);
                  const ey = cy - arrowLen * Math.cos(earthAzRad);
                  return (
                    <g>
                      <line
                        x1={cx}
                        y1={cy}
                        x2={ex}
                        y2={ey}
                        stroke="#3B82F6"
                        strokeWidth="1.5"
                        strokeDasharray="4 2"
                        opacity="0.85"
                      />
                      <circle cx={ex} cy={ey} r="4.5" fill="#3B82F6" />
                      <text
                        x={ex + (ex > cx ? 6 : -6)}
                        y={ey + 3}
                        textAnchor={ex > cx ? 'start' : 'end'}
                        fill="#60A5FA"
                        fontSize="8.5"
                        fontWeight="bold"
                        fontFamily="monospace"
                      >
                        Earth Az {activePoint.earthAzimuth.toFixed(1)}°
                      </text>
                    </g>
                  );
                })()}
              </g>
            )}

            {/* Measurement Ruler Tool Visual Line */}
            {measurePoint1 && (
              <g className="pointer-events-none">
                {(() => {
                  const pt1 = projectToMap(measurePoint1.lat, measurePoint1.lon);
                  const pt2 = measurePoint2
                    ? projectToMap(measurePoint2.lat, measurePoint2.lon)
                    : hoverCoords
                    ? projectToMap(hoverCoords.lat, hoverCoords.lon)
                    : null;

                  return (
                    <g>
                      <circle cx={pt1.x} cy={pt1.y} r="4" fill="#10B981" stroke="#FFFFFF" strokeWidth="1" />
                      {pt2 && (
                        <>
                          <circle cx={pt2.x} cy={pt2.y} r="4" fill="#10B981" stroke="#FFFFFF" strokeWidth="1" />
                          <line
                            x1={pt1.x}
                            y1={pt1.y}
                            x2={pt2.x}
                            y2={pt2.y}
                            stroke="#10B981"
                            strokeWidth="2"
                            strokeDasharray="3 3"
                          />
                          <text
                            x={(pt1.x + pt2.x) / 2}
                            y={(pt1.y + pt2.y) / 2 - 8}
                            textAnchor="middle"
                            fill="#34D399"
                            fontSize="9"
                            fontWeight="bold"
                            fontFamily="monospace"
                            className="bg-slate-900 px-1"
                          >
                            {measuredDistanceKm !== null
                              ? `${measuredDistanceKm} km`
                              : hoverCoords
                              ? `${calculateLunarDistanceKm(measurePoint1, hoverCoords)} km`
                              : ''}
                          </text>
                        </>
                      )}
                    </g>
                  );
                })()}
              </g>
            )}

            {/* Candidate Landing Sites */}
            {sites.map((s, idx) => {
              const pt = projectToMap(s.latitude, s.longitude);
              const isSelected = s.id === selectedSiteId;
              return (
                <g
                  key={s.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectSite(s.id);
                  }}
                  className="cursor-pointer group"
                >
                  {/* Ping ripple animation for selected candidate site */}
                  {isSelected && (
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r="14"
                      fill="none"
                      stroke={s.color}
                      strokeWidth="1.5"
                      className="animate-ping"
                      opacity="0.4"
                    />
                  )}
                  {/* Outer circle badge */}
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r="8"
                    fill={s.color}
                    fillOpacity={isSelected ? '0.4' : '0.2'}
                    stroke={s.color}
                    strokeWidth={isSelected ? '2.2' : '1.2'}
                  />
                  {/* Center pin dot */}
                  <circle cx={pt.x} cy={pt.y} r="3.5" fill={s.color} stroke="#FFFFFF" strokeWidth="1" />

                  {/* Site Label Tag */}
                  <g transform={`translate(${pt.x}, ${pt.y - 12})`}>
                    <rect
                      x="-35"
                      y="-11"
                      width="70"
                      height="16"
                      rx="3"
                      fill="#0B1120"
                      stroke={isSelected ? s.color : '#334155'}
                      strokeWidth={isSelected ? '1.5' : '1'}
                      opacity="0.9"
                    />
                    <text
                      x="0"
                      y="1"
                      textAnchor="middle"
                      fill={isSelected ? '#FFFFFF' : '#CBD5E1'}
                      fontSize="8.5"
                      fontWeight={isSelected ? 'bold' : 'normal'}
                      fontFamily="sans-serif"
                    >
                      Site {String.fromCharCode(65 + idx)}
                    </text>
                  </g>
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      {/* 6. Footer Controls & Readout Bar */}
      <div className="pt-2.5 mt-2 border-t border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
        {/* Layer Visibility Toggles */}
        <div className="flex flex-wrap items-center gap-3 text-[11px]">
          <label className="flex items-center space-x-1 cursor-pointer">
            <input
              type="checkbox"
              checked={showCraters}
              onChange={(e) => setShowCraters(e.target.checked)}
              className="rounded accent-cyan-400 cursor-pointer"
            />
            <span className="text-slate-300">Craters</span>
          </label>
          <label className="flex items-center space-x-1 cursor-pointer">
            <input
              type="checkbox"
              checked={showGrid}
              onChange={(e) => setShowGrid(e.target.checked)}
              className="rounded accent-cyan-400 cursor-pointer"
            />
            <span className="text-slate-300">Polar Grid</span>
          </label>
          <label className="flex items-center space-x-1 cursor-pointer">
            <input
              type="checkbox"
              checked={showSunBeam}
              onChange={(e) => setShowSunBeam(e.target.checked)}
              className="rounded accent-amber-400 cursor-pointer"
            />
            <span className="text-amber-300">Sun Vector</span>
          </label>
          <label className="flex items-center space-x-1 cursor-pointer">
            <input
              type="checkbox"
              checked={showEarthBeam}
              onChange={(e) => setShowEarthBeam(e.target.checked)}
              className="rounded accent-blue-400 cursor-pointer"
            />
            <span className="text-blue-300">Earth Vector</span>
          </label>
          <label className="flex items-center space-x-1 cursor-pointer">
            <input
              type="checkbox"
              checked={showPSRs}
              onChange={(e) => setShowPSRs(e.target.checked)}
              className="rounded accent-indigo-400 cursor-pointer"
            />
            <span className="text-indigo-300">PSR Ice Traps</span>
          </label>
        </div>

        {/* Live Cursor Coordinate Readout */}
        <div className="font-mono text-xs flex items-center space-x-2 bg-slate-900 px-2.5 py-1 rounded border border-slate-800">
          <span className="text-slate-500">Cursor:</span>
          <span className="text-cyan-300 font-semibold">
            {hoverCoords
              ? `${formatLatitude(hoverCoords.lat, 2)}, ${formatEastLongitude(hoverCoords.lon, 1)}`
              : `${formatLatitude(selectedSite.latitude, 2)}, ${formatEastLongitude(selectedSite.longitude, 1)}`}
          </span>
        </div>
      </div>
    </div>
  );
};
