import React, { useEffect, useState } from 'react';
import { DataMode } from '../types';
import { HelpCircle, Download, Radio, Moon, BookOpen } from 'lucide-react';

interface HeaderProps {
  dataMode: DataMode;
  onDataModeChange: (mode: DataMode) => void;
  onOpenHowItWorks: () => void;
  onOpenResearch: () => void;
  onExportJson: () => void;
  isAnalyzing: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  dataMode,
  onDataModeChange,
  onOpenHowItWorks,
  onOpenResearch,
  onExportJson,
  isAnalyzing,
}) => {
  const [currentUtc, setCurrentUtc] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentUtc(
        now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC'
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const getDataModeBadge = () => {
    switch (dataMode) {
      case 'real_terrain':
        return {
          label: 'Real Ephemeris + Terrain Horizon',
          color: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40',
          dot: 'bg-emerald-400',
        };
      case 'real_geometric':
        return {
          label: 'Real Ephemeris + Geometric Horizon (0°)',
          color: 'bg-cyan-950/80 text-cyan-300 border-cyan-500/40',
          dot: 'bg-cyan-400',
        };
      case 'demo':
        return {
          label: 'Demonstration / Synthetic Mode',
          color: 'bg-amber-950/80 text-amber-300 border-amber-500/40',
          dot: 'bg-amber-400',
        };
    }
  };

  const badge = getDataModeBadge();

  return (
    <header className="bg-[#0B1120] border-b border-slate-800/80 px-4 py-3 sticky top-0 z-40 backdrop-blur shadow-lg">
      <div className="max-w-[1920px] mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        {/* Left: Branding & Subtitle */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-inner">
            <Moon className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg md:text-xl font-bold tracking-tight text-white font-sans flex items-center gap-2">
                Lunar Landing Site Navigator
              </h1>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-cyan-900/60 text-cyan-300 border border-cyan-600/40">
                NASA Space Apps
              </span>
            </div>
            <p className="text-xs text-slate-400">
              South-polar candidate landing site comparison via Sun and Earth local horizon ephemerides
            </p>
          </div>
        </div>

        {/* Right: Data Mode Badge, Live Clock & Actions */}
        <div className="flex flex-wrap items-center gap-2 md:gap-3 w-full md:w-auto justify-between md:justify-end">
          {/* Data Mode Switcher */}
          <div className="relative group">
            <div
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${badge.color} cursor-pointer transition`}
              title="Click to switch data calculation mode"
            >
              <span className={`w-2 h-2 rounded-full ${badge.dot} animate-ping`} />
              <span>{badge.label}</span>
            </div>
            {/* Quick dropdown for mode selection */}
            <div className="hidden group-hover:block absolute right-0 top-full mt-1 w-64 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl p-1 z-50 text-xs">
              <div className="px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Select Active Calculation Mode
              </div>
              <button
                type="button"
                onClick={() => onDataModeChange('real_terrain')}
                className={`w-full text-left px-2.5 py-1.5 rounded flex items-center justify-between ${
                  dataMode === 'real_terrain' ? 'bg-cyan-950 text-cyan-200' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span>Real Ephemeris + Terrain</span>
                {dataMode === 'real_terrain' && <span className="text-cyan-400">✓</span>}
              </button>
              <button
                type="button"
                onClick={() => onDataModeChange('real_geometric')}
                className={`w-full text-left px-2.5 py-1.5 rounded flex items-center justify-between ${
                  dataMode === 'real_geometric' ? 'bg-cyan-950 text-cyan-200' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span>Real Ephemeris + Geometric (0°)</span>
                {dataMode === 'real_geometric' && <span className="text-cyan-400">✓</span>}
              </button>
              <button
                type="button"
                onClick={() => onDataModeChange('demo')}
                className={`w-full text-left px-2.5 py-1.5 rounded flex items-center justify-between ${
                  dataMode === 'demo' ? 'bg-cyan-950 text-cyan-200' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span>Demonstration Mode</span>
                {dataMode === 'demo' && <span className="text-cyan-400">✓</span>}
              </button>
            </div>
          </div>

          {/* Current UTC Clock */}
          <div className="bg-slate-900/90 border border-slate-800 px-2.5 py-1 rounded text-xs font-mono text-cyan-300 flex items-center space-x-1.5">
            <Radio className="w-3.5 h-3.5 text-cyan-400" />
            <span>{currentUtc || 'SYNCING...'}</span>
          </div>

          {/* Scientific Literature Foundations Modal button */}
          <button
            type="button"
            onClick={onOpenResearch}
            className="flex items-center space-x-1.5 px-3 py-1 rounded bg-cyan-950/70 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-600/50 text-xs font-medium transition"
            title="View 8 Research Literature Papers & 10 Methodological Figures (Barker, Gläser, Bryant, etc.)"
          >
            <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Research Foundations</span>
          </button>

          {/* Educational "How it works" button */}
          <button
            type="button"
            onClick={onOpenHowItWorks}
            className="flex items-center space-x-1.5 px-3 py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition"
            title="Learn how azimuth, elevation, and lunar polar horizon geometry work"
          >
            <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">How It Works</span>
          </button>

          {/* Export JSON Button */}
          <button
            type="button"
            onClick={onExportJson}
            disabled={isAnalyzing}
            className="flex items-center space-x-1.5 px-3 py-1 rounded bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 text-xs font-medium transition"
            title="Export full multi-site analysis with metadata and provenance"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export JSON</span>
          </button>
        </div>
      </div>
    </header>
  );
};
