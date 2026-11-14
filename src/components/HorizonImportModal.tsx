import React, { useState } from 'react';
import { HorizonProfile, SiteConfig } from '../types';
import { parseHorizonCsv } from '../services/horizonProfile';
import {
  DE_GERLACHE_CSV,
  MALAPERT_CSV,
  SHACKLETON_CSV,
} from '../data/sampleHorizons';
import {
  X,
  Download,
  AlertTriangle,
  CheckCircle,
  Mountain,
} from 'lucide-react';
import { triggerFileDownload } from '../services/exportData';
import { useLanguage } from '../i18n/LanguageContext';

interface HorizonImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  site: SiteConfig;
  onApplyProfile: (profile: HorizonProfile | null) => void;
}

export const HorizonImportModal: React.FC<HorizonImportModalProps> = ({
  isOpen,
  onClose,
  site,
  onApplyProfile,
}) => {
  const { t } = useLanguage();
  const [csvText, setCsvText] = useState<string>('');
  const [profileName, setProfileName] = useState<string>('Custom User Profile');
  const [demSource, setDemSource] = useState<string>(
    'User-supplied horizon CSV profile'
  );
  const [validationResult, setValidationResult] = useState<any>(null);

  if (!isOpen) return null;

  const handleValidate = (text: string) => {
    setCsvText(text);
    if (!text.trim()) {
      setValidationResult(null);
      return;
    }
    const res = parseHorizonCsv(text);
    setValidationResult(res);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProfileName(file.name.replace(/\.csv$/i, ''));
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      handleValidate(content);
    };
    reader.readAsText(file);
  };

  const handleLoadSample = (sampleType: 'shackleton' | 'malapert' | 'degerlache') => {
    let text = SHACKLETON_CSV;
    let name = 'Shackleton Connecting Ridge Topography';
    let source =
      'LRO LOLA DEM 20m/px, 120km search radius with lunar curvature correction';

    if (sampleType === 'malapert') {
      text = MALAPERT_CSV;
      name = 'Malapert Mountain Topography';
      source =
        'LRO LOLA DEM 30m/px, 150km search radius with lunar curvature correction';
    } else if (sampleType === 'degerlache') {
      text = DE_GERLACHE_CSV;
      name = 'de Gerlache Rim Topography';
      source =
        'LRO LOLA DEM 30m/px, 100km search radius with lunar curvature correction';
    }

    setProfileName(name);
    setDemSource(source);
    handleValidate(text);
  };

  const handleSave = () => {
    if (!validationResult || !validationResult.valid) return;

    const newProfile: HorizonProfile = {
      id: `profile-${Date.now()}`,
      name: profileName || 'Imported Profile',
      filename: `${profileName.toLowerCase().replace(/[^a-z0-9]/g, '_')}.csv`,
      associatedSiteId: site.id,
      observerHeight: site.observerHeight,
      points: validationResult.points,
      isUserSupplied: true,
      demSource,
      description: 'Imported local horizon profile evaluated with circular interpolation',
      uploadedAt: new Date().toISOString(),
    };

    onApplyProfile(newProfile);
    onClose();
  };

  const handleResetToGeometric = () => {
    onApplyProfile(null);
    onClose();
  };

  const handleDownloadSampleCsv = () => {
    triggerFileDownload(
      SHACKLETON_CSV,
      'sample_shackleton_connecting_ridge_horizon.csv',
      'text/csv'
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#0B1120] border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 sticky top-0 bg-[#0B1120] z-10">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-lg bg-emerald-950 border border-emerald-500/40 text-emerald-400">
              <Mountain className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {t.importModalTitle}
              </h2>
              <p className="text-xs text-slate-400">
                {t.importModalSub}: <span className="text-white font-semibold">{site.name}</span> (Obs: {site.observerHeight}m)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-xs text-slate-300">
          {/* Quick Sample Profiles */}
          <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              {t.sampleProfilesTitle}
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleLoadSample('shackleton')}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded border border-slate-700 text-left transition"
              >
                <div className="font-semibold text-white">{t.sampleShackleton}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">20m LOLA DEM</div>
              </button>
              <button
                type="button"
                onClick={() => handleLoadSample('malapert')}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-purple-300 rounded border border-slate-700 text-left transition"
              >
                <div className="font-semibold text-white">{t.sampleMalapert}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">30m LOLA DEM</div>
              </button>
              <button
                type="button"
                onClick={() => handleLoadSample('degerlache')}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-emerald-300 rounded border border-slate-700 text-left transition"
              >
                <div className="font-semibold text-white">{t.sampleDeGerlache}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">30m LOLA DEM</div>
              </button>
            </div>
          </div>

          {/* Upload or Paste CSV */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-slate-300">
                {t.uploadOrPasteTitle}
              </label>
              <button
                type="button"
                onClick={handleDownloadSampleCsv}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center space-x-1"
              >
                <Download className="w-3 h-3" />
                <span>Download Sample CSV</span>
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="file"
                accept=".csv,.txt"
                onChange={handleFileUpload}
                className="text-xs text-slate-400 file:mr-3 file:py-1 file:px-3 file:rounded file:border file:border-slate-700 file:text-xs file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700 cursor-pointer"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <label className="block text-slate-400 text-[11px] mb-1">
                  Profile Name
                </label>
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-slate-100 font-sans focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-[11px] mb-1">
                  DEM Source / Provenance
                </label>
                <input
                  type="text"
                  value={demSource}
                  onChange={(e) => setDemSource(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-slate-100 font-sans focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <textarea
              rows={6}
              value={csvText}
              onChange={(e) => handleValidate(e.target.value)}
              placeholder="azimuth_deg,horizon_elevation_deg&#10;0.0, 1.25&#10;15.0, 1.40&#10;30.0, 1.85&#10;..."
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-100 font-mono text-xs focus:outline-none focus:border-cyan-500 leading-normal"
            />
          </div>

          {/* Validation Feedback Banner */}
          {validationResult && (
            <div className="space-y-2">
              {validationResult.valid ? (
                <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 space-y-1">
                  <div className="flex items-center space-x-1.5 font-semibold text-xs">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span>Valid Horizon Profile ({validationResult.points.length} points)</span>
                  </div>
                  {validationResult.stats && (
                    <div className="text-[11px] text-emerald-200/90 font-mono grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                      <div>Min: {validationResult.stats.minElevation.toFixed(2)}°</div>
                      <div>Max: {validationResult.stats.maxElevation.toFixed(2)}°</div>
                      <div>Mean: {validationResult.stats.meanElevation.toFixed(2)}°</div>
                      <div>Max Gap: {validationResult.stats.maxAzimuthGap.toFixed(1)}°</div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-red-950/50 border border-red-500/50 text-red-300 space-y-1">
                  <div className="flex items-center space-x-1.5 font-semibold text-xs">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                    <span>CSV Validation Errors</span>
                  </div>
                  <ul className="list-disc list-inside text-[11px] text-red-200">
                    {validationResult.errors.map((e: string, i: number) => (
                      <li key={i}>{e}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Warnings */}
              {validationResult.warnings && validationResult.warnings.length > 0 && (
                <div className="p-2.5 rounded bg-amber-950/30 border border-amber-500/30 text-amber-300 text-[11px]">
                  <span className="font-semibold block mb-0.5">Notes & Warnings:</span>
                  <ul className="list-disc list-inside">
                    {validationResult.warnings.map((w: string, i: number) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-[#0B1120]">
          <button
            type="button"
            onClick={handleResetToGeometric}
            className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs transition"
          >
            {t.modeRealGeometric}
          </button>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded hover:bg-slate-800 text-slate-400 text-xs transition"
            >
              {t.dismissBtn}
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!validationResult || !validationResult.valid}
              className="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-bold text-xs transition"
            >
              {t.applyProfileBtn}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
