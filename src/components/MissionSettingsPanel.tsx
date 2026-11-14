import React, { useState } from 'react';
import { MissionSettings } from '../types';
import { Calendar, Play, RefreshCw, AlertCircle, Sun, Zap } from 'lucide-react';
import { PanelOrientationType } from '../services/power';
import { useLanguage } from '../i18n/LanguageContext';

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
  const { t } = useLanguage();
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

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
            {t.missionSettingsTitle}
          </h2>
        </div>
        <span className="text-[11px] text-cyan-400 font-mono">
          {totalSamples} {t.samplesPerSite}
        </span>
      </div>

      <div className="space-y-3 text-xs">
        {/* Start Date & Time */}
        <div>
          <label className="block text-slate-400 text-[11px] font-medium mb-1">
            {t.startTimeLabel}
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
              {t.durationLabel}
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
            <span className="text-[10px] text-slate-500 mt-0.5 block">{t.maxDaysHint}</span>
          </div>

          <div>
            <label className="block text-slate-400 text-[11px] font-medium mb-1">
              {t.samplingIntervalLabel}
            </label>
            <select
              value={settings.stepSize}
              onChange={(e) =>
                onUpdateSettings({ ...settings, stepSize: e.target.value })
              }
              className="w-full bg-slate-900 border border-slate-700/80 rounded px-2.5 py-1.5 text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
            >
              <option value="15m">{t.min15}</option>
              <option value="30m">{t.min30}</option>
              <option value="1h">{t.hour1}</option>
              <option value="2h">{t.hour2}</option>
            </select>
          </div>
        </div>

        {/* Solar Visibility Model Selection */}
        <div className="p-2.5 bg-[#070d1e] rounded-lg border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-300 text-[11px] font-semibold flex items-center gap-1.5">
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span>{t.solarModelLabel}</span>
            </span>
            <span className="text-[10px] text-amber-400 font-mono">
              {settings.solarModel === 'finite_disc' ? 'Gläser 2014' : 'Point'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => onUpdateSettings({ ...settings, solarModel: 'finite_disc' })}
              className={`py-1.5 px-2 rounded text-[11px] font-medium border text-center transition ${
                settings.solarModel === 'finite_disc'
                  ? 'bg-amber-950/40 text-amber-300 border-amber-500/50'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              {t.finiteDiscOption}
            </button>
            <button
              type="button"
              onClick={() => onUpdateSettings({ ...settings, solarModel: 'point' })}
              className={`py-1.5 px-2 rounded text-[11px] font-medium border text-center transition ${
                settings.solarModel === 'point'
                  ? 'bg-cyan-950/40 text-cyan-300 border-cyan-500/50'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              {t.pointModelOption}
            </button>
          </div>

          {settings.solarModel === 'finite_disc' && (
            <div className="pt-1">
              <label className="block text-slate-400 text-[10px] mb-1">
                {t.sunlitCriterionLabel}
              </label>
              <select
                value={settings.sunlitThreshold}
                onChange={(e) =>
                  onUpdateSettings({
                    ...settings,
                    sunlitThreshold: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200 font-mono text-[11px]"
              >
                <option value={0.0}>{t.anyVisibleOption}</option>
                <option value={0.1}>{t.partial10Option}</option>
                <option value={0.5}>{t.halfDiscOption}</option>
                <option value={1.0}>{t.fullDiscOption}</option>
              </select>
            </div>
          )}
        </div>

        {/* Advanced Panel & Photovoltaic Configuration Toggle */}
        <div className="border border-slate-800 rounded-lg p-2.5 bg-[#081124]">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full flex items-center justify-between text-[11px] font-semibold text-slate-300"
          >
            <span className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>{t.pvConfigToggle}</span>
            </span>
            <span className="text-slate-500 text-xs">{showAdvanced ? '▲' : '▼'}</span>
          </button>

          {showAdvanced && (
            <div className="mt-2.5 pt-2 border-t border-slate-800 space-y-2 text-[11px]">
              <div>
                <label className="block text-slate-400 text-[10px] mb-1">
                  {t.pvOrientationLabel}
                </label>
                <select
                  value={settings.solarPanel?.orientation || 'tracking_vertical'}
                  onChange={(e) =>
                    onUpdateSettings({
                      ...settings,
                      solarPanel: {
                        ...settings.solarPanel,
                        orientation: e.target.value as PanelOrientationType,
                      },
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200 font-mono text-[11px]"
                >
                  <option value="tracking_vertical">
                    {t.pvTrackingVertical}
                  </option>
                  <option value="fixed_vertical">{t.pvFixedVertical}</option>
                  <option value="horizontal">{t.pvHorizontalFlat}</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 text-[10px] mb-1">
                    {t.arrayAreaLabel}
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="50"
                    value={settings.solarPanel?.areaM2 || 2.0}
                    onChange={(e) =>
                      onUpdateSettings({
                        ...settings,
                        solarPanel: {
                          ...settings.solarPanel,
                          areaM2: parseFloat(e.target.value) || 2.0,
                        },
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200 font-mono text-[11px]"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-[10px] mb-1">
                    {t.cellEfficiencyLabel}
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="10"
                    max="45"
                    value={Math.round((settings.solarPanel?.efficiency || 0.28) * 100)}
                    onChange={(e) =>
                      onUpdateSettings({
                        ...settings,
                        solarPanel: {
                          ...settings.solarPanel,
                          efficiency: (parseFloat(e.target.value) || 28) / 100.0,
                        },
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200 font-mono text-[11px]"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Earth Clearance Angle */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-slate-400 text-[11px] font-medium">
              {t.earthClearanceLabel}
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
            {t.earthClearanceDesc}
          </span>
        </div>

        {/* Error notification & Explicit Fallback */}
        {analysisError && (
          <div className="p-2.5 rounded bg-red-950/70 border border-red-500/50 text-red-200 text-xs space-y-2">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-red-300">{t.analysisErrorTitle}</div>
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
                {t.dismissBtn}
              </button>
              <button
                type="button"
                onClick={onUseFallback}
                className="text-[11px] bg-red-900/80 hover:bg-red-800 text-red-100 px-2 py-0.5 rounded font-medium transition"
              >
                {t.useFallbackBtn}
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
              <span>{t.queryingHorizons}</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>{t.analyzeBtn}</span>
            </>
          )}
        </button>

        <div className="text-[10px] text-slate-500 text-center font-mono">
          {t.horizonsFooter}
        </div>
      </div>
    </div>
  );
};
