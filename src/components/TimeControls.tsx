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
  const currentPoint = points[activeIndex] || points[0];

  // Playback loop
  useEffect(() => {
    if (!isPlaying || points.length === 0) return;

    // interval speed mapping: 1x = 600ms, 5x = 250ms, 10x = 120ms, 30x = 50ms, 60x = 25ms
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
            title="Step backward one interval (-30m)"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          {/* Play / Pause Toggle */}
          <button
            type="button"
            onClick={onTogglePlay}
            className="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold flex items-center space-x-1.5 shadow-md shadow-cyan-500/20 transition"
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4 fill-current" />
                <span className="text-xs">PAUSE</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span className="text-xs">PLAY</span>
              </>
            )}
          </button>

          {/* Step Forward (+1) */}
          <button
            type="button"
            onClick={() =>
              onSelectIndex(Math.min(points.length - 1, activeIndex + 1))
            }
            disabled={activeIndex >= points.length - 1}
            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 disabled:opacity-40 transition"
            title="Step forward one interval (+30m)"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          {/* Playback Speed Selector */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded p-0.5 ml-2">
            {speedOptions.map((spd) => (
              <button
                key={spd}
                type="button"
                onClick={() => onSpeedChange(spd)}
                className={`px-2 py-0.5 text-[11px] font-mono rounded transition ${playbackSpeed === spd
                    ? 'bg-cyan-950 text-cyan-300 font-bold border border-cyan-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                  }`}
              >
                {spd}x
              </button>
            ))}
          </div>
        </div>

        {/* Current Mission Timestamp & MET Display */}
        <div className="flex items-center space-x-4 font-mono text-xs w-full md:w-auto justify-center md:justify-end">
          <div className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-md flex items-center space-x-2">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-white font-semibold tracking-wide">
              {currentPoint ? currentPoint.rawTime : '0000-00-00 00:00'} UTC
            </span>
          </div>

          <div className="bg-cyan-950/60 border border-cyan-500/30 px-3 py-1.5 rounded-md text-cyan-300 font-bold tracking-wide">
            {computeMET()}
          </div>
        </div>
      </div>

      {/* Synchronized Slider Scrub Track */}
      <div className="flex items-center space-x-3 pt-1">
        <span className="text-[10px] text-slate-500 font-mono">0h</span>
        <input
          type="range"
          min="0"
          max={Math.max(0, points.length - 1)}
          value={activeIndex}
          onChange={(e) => onSelectIndex(parseInt(e.target.value) || 0)}
          className="w-full accent-cyan-400 cursor-pointer h-2 bg-slate-800 rounded-lg appearance-none"
        />
        <span className="text-[10px] text-slate-500 font-mono">
          {points.length > 0
            ? `${Math.round(((points.length - 1) * (currentPoint.stepMinutes || 30)) / 60)}h`
            : '168h'}
        </span>
      </div>
    </div>
  );
};
