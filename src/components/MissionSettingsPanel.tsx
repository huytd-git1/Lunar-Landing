import React from 'react';
import { MissionSettings } from '../types';
import { Calendar, Play, RefreshCw, AlertCircle } from 'lucide-react';

interface MissionSettingsPanelProps {
  settings: MissionSettings;
  onUpdateSettings: (updated: MissionSettings) => void;
  onRunAnalysis: () => void;
  isAnalyzing: boolean;
  analysisError: string | null;
  onClearError: () => void;
  onUseFallback: () => void;
}

export const MissionSettingsPanel: React.FC<MissionSettingsPanelProps> = ({
  settings,
  onUpdateSettings,
  onRunAnalysis,
  isAnalyzing,
  analysisError,
  onClearError,
  onUseFallback,
}) => {
  // Compute total sample count per site
  const stepMinutes =
    settings.stepSize === '15m'
      ? 15
      : settings.stepSize === '30m'
      ? 30
      : settings.stepSize === '1h'
      ? 60
      : 120;

  const totalSamples = Math.floor((settings.durationDays * 24 * 60) / stepMinutes) + 1;

  return (
    <div className="bg-[#0B1120] border border-slate-800 rounded-xl p-4 shadow-xl flex flex-col gap-3">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
            Mission Timeline Settings
          </h2>
        </div>
        <span className="text-[11px] text-cyan-400 font-mono">
          {totalSamples} Samples / Site
        </span>
      </div>

      <div className="space-y-3 text-xs">
        {/* Start Date & Time */}
        <div>
          <label className="block text-slate-400 text-[11px] font-medium mb-1">
            Mission Start Timestamp (UTC)
          </label>
          <input
            type="text"
            value={settings.startTime}
            onChange={(e) =>
              onUpdateSettings({ ...settings, startTime: e.target.value })
            }
            className="w-full bg-slate-900 border border-slate-700/80 rounded px-2.5 py-1.5 text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
            placeholder="YYYY-MM-DD HH:mm (e.g. 2026-11-15 00:00)"
          />
        </div>

        {/* Duration and Sampling Interval */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-slate-400 text-[11px] font-medium mb-1">
              Duration (Earth Days)
            </label>
            <input
              type="number"
              min="1"
              max="14"
              value={settings.durationDays}
              onChange={(e) =>
                onUpdateSettings({
                  ...settings,
                  durationDays: Math.min(14, Math.max(1, parseInt(e.target.value) || 7)),
                })
              }
              className="w-full bg-slate-900 border border-slate-700/80 rounded px-2.5 py-1.5 text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
            />
            <span className="text-[10px] text-slate-500 mt-0.5 block">Max 14 days</span>
          </div>

          <div>
            <label className="block text-slate-400 text-[11px] font-medium mb-1">
              Sampling Interval
            </label>
            <select
              value={settings.stepSize}
              onChange={(e) =>
                onUpdateSettings({ ...settings, stepSize: e.target.value })
              }
              className="w-full bg-slate-900 border border-slate-700/80 rounded px-2.5 py-1.5 text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
            >
              <option value="15m">15 Minutes</option>
              <option value="30m">30 Minutes (Default)</option>
              <option value="1h">1 Hour</option>
              <option value="2h">2 Hours</option>
            </select>
          </div>
        </div>

        {/* Earth Clearance Angle */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-slate-400 text-[11px] font-medium">
              Earth RF Clearance Angle Margin
            </label>
            <span className="text-[11px] text-cyan-400 font-mono">
              +{settings.earthClearanceAngle.toFixed(1)}°
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="range"
              min="0"
              max="3"
              step="0.1"
              value={settings.earthClearanceAngle}
              onChange={(e) =>
                onUpdateSettings({
                  ...settings,
                  earthClearanceAngle: parseFloat(e.target.value) || 0,
                })
              }
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5 block">
            Extra elevation margin required above terrain for direct-to-Earth radio link
          </span>
        </div>

        {/* Error notification & Explicit Fallback */}
        {analysisError && (
          <div className="p-2.5 rounded bg-red-950/70 border border-red-500/50 text-red-200 text-xs space-y-2">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-red-300">Analysis Error</div>
                <div className="text-[11px] text-red-200/90 leading-tight">
                  {analysisError}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-red-900/50">
              <button
                type="button"
                onClick={onClearError}
                className="text-[11px] text-slate-400 hover:text-slate-200"
              >
                Dismiss
              </button>
              <button
                type="button"
                onClick={onUseFallback}
                className="text-[11px] bg-red-900/80 hover:bg-red-800 text-red-100 px-2 py-0.5 rounded font-medium transition"
              >
                Use Bundled Offline Dataset
              </button>
            </div>
          </div>
        )}

        {/* Analyze Button */}
        <button
          type="button"
          onClick={onRunAnalysis}
          disabled={isAnalyzing}
          className={`w-full py-2.5 px-4 rounded-lg font-semibold text-xs flex items-center justify-center space-x-2 shadow-lg transition ${
            isAnalyzing
              ? 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700'
              : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold hover:shadow-cyan-500/20'
          }`}
        >
          {isAnalyzing ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
              <span>Querying JPL Horizons Ephemerides...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>Analyze Candidate Sites</span>
            </>
          )}
        </button>

        <div className="text-[10px] text-slate-500 text-center font-mono">
          JPL Horizons Target 10 (Sun) & 399 (Earth) | Lunar Geodetic
        </div>
      </div>
    </div>
  );
};
