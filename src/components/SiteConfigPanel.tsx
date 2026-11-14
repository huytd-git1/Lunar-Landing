import React from 'react';
import { SiteConfig } from '../types';
import {
  convertObserverAltToKm,
  formatEastLongitude,
  formatLatitude,
  validateCoordinates,
} from '../services/coordinates';
import {
  ExternalLink,
  MapPin,
  Mountain,
  Upload,
  Info,
  AlertTriangle,
} from 'lucide-react';

interface SiteConfigPanelProps {
  sites: SiteConfig[];
  selectedSiteId: string;
  onSelectSite: (siteId: string) => void;
  onUpdateSite: (updated: SiteConfig) => void;
  onOpenImportModal: (siteId: string) => void;
}

export const SiteConfigPanel: React.FC<SiteConfigPanelProps> = ({
  sites,
  selectedSiteId,
  onSelectSite,
  onUpdateSite,
  onOpenImportModal,
}) => {
  const currentSite = sites.find((s) => s.id === selectedSiteId) || sites[0];

  const coordValidation = validateCoordinates(
    currentSite.latitude,
    currentSite.longitude
  );

  const altKm = convertObserverAltToKm(
    currentSite.observerHeight,
    currentSite.terrainElevation
  );

  // Verified external permalinks
  const quickmapUrl = `https://quickmap.lroc.asu.edu/?extent=${currentSite.latitude - 0.25},${currentSite.longitude - 2},${currentSite.latitude + 0.25},${currentSite.longitude + 2}&proj=17`;
  const moonTrekUrl = `https://trek.nasa.gov/moon/#v=0.1&x=${currentSite.longitude}&y=${currentSite.latitude}&z=10`;

  return (
    <div className="bg-[#0B1120] border border-slate-800 rounded-xl p-4 shadow-xl flex flex-col gap-4">
      {/* Site Tabs */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <MapPin className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
            Candidate Sites (Max 3)
          </h2>
        </div>
        <span className="text-[11px] text-slate-400 font-mono">
          {sites.length}/3 Configured
        </span>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-900/90 rounded-lg border border-slate-800">
        {sites.map((s, idx) => {
          const isSelected = s.id === currentSite.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onSelectSite(s.id)}
              className={`py-2 px-2 text-xs font-medium rounded-md transition text-center truncate flex items-center justify-center space-x-1.5 ${
                isSelected
                  ? 'bg-slate-800 text-white shadow-md border border-slate-700 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: s.color }}
              />
              <span className="truncate">Site {String.fromCharCode(65 + idx)}</span>
            </button>
          );
        })}
      </div>

      {/* Site Details Form */}
      <div className="space-y-3 text-xs">
        {/* Site Name */}
        <div>
          <label className="block text-slate-400 text-[11px] font-medium mb-1">
            Site Label
          </label>
          <input
            type="text"
            value={currentSite.name}
            onChange={(e) =>
              onUpdateSite({ ...currentSite, name: e.target.value })
            }
            className="w-full bg-slate-900 border border-slate-700/80 rounded px-2.5 py-1.5 text-slate-100 focus:outline-none focus:border-cyan-500 font-sans"
            placeholder="e.g. Illustrative Site Alpha"
          />
        </div>

        {/* Latitude and Longitude Grid */}
        <div className="grid grid-cols-2 gap-2">
          {/* Latitude */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-slate-400 text-[11px] font-medium">
                Latitude (deg)
              </label>
              <span className="text-[10px] text-cyan-400 font-mono">
                {formatLatitude(currentSite.latitude, 2)}
              </span>
            </div>
            <input
              type="number"
              step="0.01"
              min="-90"
              max="90"
              value={currentSite.latitude}
              onChange={(e) =>
                onUpdateSite({
                  ...currentSite,
                  latitude: parseFloat(e.target.value) || 0,
                })
              }
              className="w-full bg-slate-900 border border-slate-700/80 rounded px-2.5 py-1.5 text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Longitude */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-slate-400 text-[11px] font-medium">
                East Longitude
              </label>
              <span className="text-[10px] text-cyan-400 font-mono">
                {formatEastLongitude(currentSite.longitude, 2)}
              </span>
            </div>
            <input
              type="number"
              step="0.1"
              value={currentSite.longitude}
              onChange={(e) =>
                onUpdateSite({
                  ...currentSite,
                  longitude: parseFloat(e.target.value) || 0,
                })
              }
              className="w-full bg-slate-900 border border-slate-700/80 rounded px-2.5 py-1.5 text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        <p className="text-[10px] text-slate-500 leading-tight">
          Convention: South-negative latitude [-90° to +90°]. East-positive longitude [0° to 360°].
        </p>

        {/* Coordinate Validation Messages */}
        {coordValidation.errors.map((err, i) => (
          <div
            key={i}
            className="p-2 rounded bg-red-950/50 border border-red-500/40 text-red-300 text-[11px] flex items-start space-x-1.5"
          >
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-red-400" />
            <span>{err}</span>
          </div>
        ))}
        {coordValidation.warnings.map((warn, i) => (
          <div
            key={i}
            className="p-2 rounded bg-amber-950/40 border border-amber-500/30 text-amber-300 text-[10px] flex items-start space-x-1.5"
          >
            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-400" />
            <span>{warn}</span>
          </div>
        ))}

        {/* Heights and Horizons Elevation */}
        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800">
          <div>
            <label className="block text-slate-400 text-[11px] font-medium mb-1">
              Observer Mast Height (m)
            </label>
            <input
              type="number"
              step="0.5"
              min="0.1"
              value={currentSite.observerHeight}
              onChange={(e) =>
                onUpdateSite({
                  ...currentSite,
                  observerHeight: Math.max(0.1, parseFloat(e.target.value) || 2.0),
                })
              }
              className="w-full bg-slate-900 border border-slate-700/80 rounded px-2.5 py-1.5 text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
            />
            <span className="text-[10px] text-slate-500 mt-0.5 block">
              Above local ground (e.g. 2m mast)
            </span>
          </div>

          <div>
            <label className="block text-slate-400 text-[11px] font-medium mb-1">
              Terrain Elevation (m)
            </label>
            <input
              type="number"
              step="50"
              value={currentSite.terrainElevation || 0}
              onChange={(e) =>
                onUpdateSite({
                  ...currentSite,
                  terrainElevation: parseFloat(e.target.value) || 0,
                })
              }
              className="w-full bg-slate-900 border border-slate-700/80 rounded px-2.5 py-1.5 text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
            />
            <span className="text-[10px] text-slate-500 mt-0.5 block">
              Relative to R=1737.4 km
            </span>
          </div>
        </div>

        {/* Horizons Convention Altitude Readout */}
        <div className="p-2 bg-slate-900/60 rounded border border-slate-800 text-[11px] flex justify-between items-center text-slate-400 font-mono">
          <span>Horizons Observer Alt:</span>
          <span className="text-cyan-400 font-semibold">{altKm.toFixed(4)} km</span>
        </div>

        {/* Terrain Horizon Profile Info & Actions */}
        <div className="pt-2 border-t border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-300 flex items-center space-x-1">
              <Mountain className="w-3.5 h-3.5 text-emerald-400" />
              <span>Horizon Profile</span>
            </span>
            {currentSite.horizonProfile ? (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30 font-mono">
                {currentSite.horizonProfile.points.length} pts
              </span>
            ) : (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                Geometric (0°)
              </span>
            )}
          </div>

          {currentSite.horizonProfile ? (
            <div className="p-2.5 bg-slate-900/80 rounded border border-emerald-900/50 space-y-1">
              <div className="text-[11px] font-medium text-slate-200 truncate">
                {currentSite.horizonProfile.name}
              </div>
              <div className="text-[10px] text-slate-400 leading-snug">
                {currentSite.horizonProfile.demSource || 'User-supplied topography profile'}
              </div>
              <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400 font-mono">
                <span>Coverage: 360° Circular</span>
                <button
                  type="button"
                  onClick={() =>
                    onUpdateSite({ ...currentSite, horizonProfile: null })
                  }
                  className="text-amber-400 hover:text-amber-300 underline"
                  title="Switch back to idealized 0° geometric horizon"
                >
                  Clear Profile
                </button>
              </div>
            </div>
          ) : (
            <div className="p-2 rounded bg-slate-900/40 border border-dashed border-slate-700 text-[10px] text-slate-400">
              No terrain horizon loaded. Using geometric horizon line at 0.0° elevation.
            </div>
          )}

          <button
            type="button"
            onClick={() => onOpenImportModal(currentSite.id)}
            className="w-full py-1.5 px-3 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium flex items-center justify-center space-x-1.5 transition"
          >
            <Upload className="w-3.5 h-3.5 text-cyan-400" />
            <span>Import / Switch Horizon CSV</span>
          </button>
        </div>

        {/* External Map permalinks */}
        <div className="pt-2 border-t border-slate-800 space-y-1.5">
          <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block">
            Explore Lunar Imagery & DEMs
          </span>
          <div className="grid grid-cols-2 gap-2">
            <a
              href={quickmapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="py-1.5 px-2 bg-slate-900 hover:bg-slate-800 rounded border border-slate-800 text-[11px] text-cyan-300 hover:text-cyan-200 flex items-center justify-center space-x-1 transition"
              title="Open LROC QuickMap south polar stereographic projection at these coordinates"
            >
              <span>QuickMap</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href={moonTrekUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="py-1.5 px-2 bg-slate-900 hover:bg-slate-800 rounded border border-slate-800 text-[11px] text-cyan-300 hover:text-cyan-200 flex items-center justify-center space-x-1 transition"
              title="Open NASA Moon Trek 3D/2D GIS tool at these coordinates"
            >
              <span>Moon Trek</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Illustrative Disclaimer Note */}
        <div className="p-2 bg-slate-950/80 rounded border border-slate-800/80 text-[10px] text-slate-500 leading-normal">
          <span className="text-amber-400/80 font-semibold">Note:</span> Illustrative coordinates for Space Apps challenge demonstration. Not approved landing sites.
        </div>
      </div>
    </div>
  );
};
