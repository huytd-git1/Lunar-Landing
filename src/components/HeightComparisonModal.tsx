import React from 'react';
import { HeightComparisonResult } from '../services/heightAnalysis';
import { SiteConfig } from '../types';

interface HeightComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  site: SiteConfig | null;
  results: HeightComparisonResult[] | undefined;
}

export const HeightComparisonModal: React.FC<HeightComparisonModalProps> = ({
  isOpen,
  onClose,
  site,
  results,
}) => {
  if (!isOpen || !site) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-[#0b1329] border border-cyan-500/30 rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cyan-500/20 bg-[#070d1e]">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-xs font-mono font-semibold bg-cyan-950 text-cyan-400 border border-cyan-700/50 rounded">
                BARKER ET AL. (2021)
              </span>
              <h2 className="text-xl font-bold text-cyan-300">
                Observer Mast Height Trade Study (1m, 2m, 5m, 10m)
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Topographic horizon lowering & solar energy sensitivity at <span className="text-amber-400 font-semibold">{site.name}</span> ({site.latitude}°, {site.longitude}°E)
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800/60 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Scientific Context Banner */}
        <div className="px-6 py-3 bg-[#081228] border-b border-slate-800 text-xs text-slate-300 flex items-start gap-3">
          <span className="text-lg">🔭</span>
          <p className="leading-relaxed">
            As demonstrated in <strong className="text-cyan-300">Barker et al. (2021, Fig. 14)</strong> and{' '}
            <strong className="text-cyan-300">Gläser et al. (2014)</strong>, increasing mast height lowers the local horizon obstacle elevation angle: <span className="font-mono text-cyan-400">ΔH ≈ -arctan(Δh / d_blocker)</span>. This drastically reduces the longest continuous dark period (LCSP / L_dark) and provides more continuous power generation.
          </p>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-6">
          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {(results || []).map((r) => {
              const isDefault = site.observerHeight === r.heightM;
              return (
                <div
                  key={r.heightM}
                  className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                    isDefault
                      ? 'bg-cyan-950/40 border-cyan-500/80 ring-1 ring-cyan-500/40'
                      : 'bg-[#081024] border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-cyan-300">{r.label}</span>
                      {isDefault && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500 text-slate-950 font-semibold">
                          Current
                        </span>
                      )}
                    </div>
                    <div className="text-2xl font-bold font-mono text-amber-400 mb-1">
                      {r.sunlitPct}%
                    </div>
                    <div className="text-[11px] text-slate-400 mb-4">Illumination Window</div>

                    <div className="space-y-2 text-xs border-t border-slate-800/80 pt-3">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Mean Disc Fraction:</span>
                        <span className="font-mono text-slate-200">{r.meanVisibleFractionPct}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Max Dark (LCSP):</span>
                        <span className="font-mono text-red-400">{r.longestDarkPeriodHours} hrs</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Max Light (LCIP):</span>
                        <span className="font-mono text-emerald-400">{r.longestLightPeriodHours} hrs</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">PV Energy:</span>
                        <span className="font-mono text-amber-300">{r.totalEnergyKWh} kWh</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detailed Table */}
          <div className="bg-[#081024] border border-slate-800 rounded-xl overflow-hidden">
            <div className="px-4 py-3 bg-[#070d1e] border-b border-slate-800 font-semibold text-xs text-cyan-300">
              Comparative Metrics Summary Table
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/40">
                    <th className="p-3">Observer Height</th>
                    <th className="p-3">Application Class</th>
                    <th className="p-3">Illumination (%)</th>
                    <th className="p-3">Mean Disc Fraction</th>
                    <th className="p-3">Max Dark Period (LCSP)</th>
                    <th className="p-3">Max Light Window (LCIP)</th>
                    <th className="p-3">Energy Generated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-mono">
                  {(results || []).map((r) => (
                    <tr
                      key={r.heightM}
                      className={site.observerHeight === r.heightM ? 'bg-cyan-950/20' : 'hover:bg-slate-900/30'}
                    >
                      <td className="p-3 font-semibold text-cyan-300">{r.heightM} meters</td>
                      <td className="p-3 text-slate-300 font-sans">{r.label}</td>
                      <td className="p-3 text-amber-400 font-semibold">{r.sunlitPct}%</td>
                      <td className="p-3 text-slate-200">{r.meanVisibleFractionPct}%</td>
                      <td className="p-3 text-red-400">{r.longestDarkPeriodHours} h</td>
                      <td className="p-3 text-emerald-400">{r.longestLightPeriodHours} h</td>
                      <td className="p-3 text-amber-300 font-semibold">{r.totalEnergyKWh} kWh</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-800 bg-[#070d1e] text-xs text-slate-400">
          <div>
            Observer height sensitivity analysis referenced from <span className="text-cyan-400">Barker et al. (2021) Section 5</span>.
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
