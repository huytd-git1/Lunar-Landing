import React, { useEffect } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  Clock,
} from 'lucide-react';
import { CalculatedPoint } from '../types';
import { useLanguage } from '../i18n/LanguageContext';

interface TimeControlsProps {
  points: CalculatedPoint[];
  activeIndex: number;
  onSelectIndex: (index: number) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  playbackSpeed: number;
  onSpeedChange: (speed: number) => void;
}

export const TimeControls: React.FC<TimeControlsProps> = ({
  points,
  activeIndex,
  onSelectIndex,
  isPlaying,
  onTogglePlay,
  playbackSpeed,
  onSpeedChange,
}) => {
  const { t } = useLanguage();
  const currentPoint = points[activeIndex] || points[0];

  // Playback loop
  useEffect(() => {
    if (!isPlaying || points.length === 0) return;

    // interval speed mapping: 1x = 500ms, 5x = 200ms, 10x = 100ms, 30x = 40ms, 60x = 20ms
    const intervalMs =
      playbackSpeed === 1
        ? 500
        : playbackSpeed === 5
          ? 200
          : playbackSpeed === 10
            ? 100
            : playbackSpeed === 30
              ? 40
              : 20;

    const timer = setInterval(() => {
      onSelectIndex((activeIndex + 1) % points.length);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPlaying, activeIndex, playbackSpeed, points.length, onSelectIndex]);

  // Mission elapsed time calculation from index 0
  const computeMET = (): string => {
    if (!points || points.length === 0) return 'T+ 00d 00h 00m';
    const t0 = new Date(points[0].timestamp).getTime();
    const tCurrent = new Date(currentPoint.timestamp).getTime();
    if (isNaN(t0) || isNaN(tCurrent)) {
      const minutes = activeIndex * (currentPoint.stepMinutes || 30);
      const days = Math.floor(minutes / (24 * 60));
      const hours = Math.floor((minutes % (24 * 60)) / 60);
      const mins = minutes % 60;
      return `T+ ${String(days).padStart(2, '0')}d ${String(hours).padStart(2, '0')}h ${String(mins).padStart(2, '0')}m`;
    }
    const diffSecs = Math.max(0, Math.floor((tCurrent - t0) / 1000));
    const days = Math.floor(diffSecs / (24 * 3600));
    const hours = Math.floor((diffSecs % (24 * 3600)) / 3600);
    const mins = Math.floor((diffSecs % 3600) / 60);
    return `T+ ${String(days).padStart(2, '0')}d ${String(hours).padStart(2, '0')}h ${String(mins).padStart(2, '0')}m`;
  };

  const speedOptions = [1, 5, 10, 30, 60];

  return (
    <div className="bg-[#0B1120] border border-slate-800 rounded-xl p-3.5 shadow-xl flex flex-col gap-2.5">
      <div className="flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Playback Transport Buttons */}
        <div className="flex items-center space-x-2 w-full md:w-auto justify-center md:justify-start">
          {/* Jump to Start */}
          <button
            type="button"
            onClick={() => onSelectIndex(0)}
            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
            title="Jump to mission start"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Step Back (-1) */}
          <button
            type="button"
            onClick={() => onSelectIndex(Math.max(0, activeIndex - 1))}
            disabled={activeIndex === 0}
            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 disabled:opacity-40 transition"
            title={t.stepBackBtn}
          >
            <SkipBack className="w-4 h-4" />
          </button>

          {/* Play / Pause Toggle */}
          <button
            type="button"
            onClick={onTogglePlay}
            className={`px-4 py-1.5 rounded font-bold text-xs flex items-center space-x-1.5 shadow transition ${
              isPlaying
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4 fill-current" />
                <span>{t.pauseBtn}</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>{t.playBtn}</span>
              </>
            )}
          </button>

          {/* Step Forward (+1) */}
          <button
            type="button"
            onClick={() => onSelectIndex(Math.min(points.length - 1, activeIndex + 1))}
            disabled={activeIndex >= points.length - 1}
            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 disabled:opacity-40 transition"
            title={t.stepForwardBtn}
          >
            <SkipForward className="w-4 h-4" />
          </button>

          {/* Speed Selector */}
          <div className="flex items-center space-x-1 pl-2 border-l border-slate-800">
            <span className="text-[11px] text-slate-400 hidden sm:inline">{t.speedLabel}:</span>
            {speedOptions.map((spd) => (
              <button
                key={spd}
                type="button"
                onClick={() => onSpeedChange(spd)}
                className={`px-2 py-0.5 rounded text-[11px] font-mono font-medium transition ${
                  playbackSpeed === spd
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50'
                    : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>
        </div>

        {/* Current Active Timestamp and MET Display */}
        <div className="flex items-center space-x-3 text-xs font-mono">
          <div className="flex items-center space-x-1.5 bg-slate-900/90 border border-slate-800 px-3 py-1 rounded-md text-amber-300">
            <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="font-semibold">{currentPoint?.rawTime || '2026-Nov-15 00:00'} UTC</span>
          </div>

          <div className="bg-cyan-950/50 border border-cyan-700/40 px-2.5 py-1 rounded-md text-cyan-300 font-semibold text-[11px]">
            {computeMET()}
          </div>
        </div>
      </div>

      {/* Scrub Slider */}
      <div className="w-full flex items-center space-x-2 pt-1">
        <input
          type="range"
          min="0"
          max={Math.max(0, points.length - 1)}
          value={activeIndex}
          onChange={(e) => onSelectIndex(parseInt(e.target.value) || 0)}
          className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 focus:outline-none"
        />
      </div>
    </div>
  );
};
