import React, { useState } from 'react';
import { SiteAnalysisResult, SiteMetrics } from '../types';
import {
  ArrowUpDown,
  Download,
  FileSpreadsheet,
  FileJson,
  Lightbulb,
  Sliders,
  Zap,
} from 'lucide-react';
import { generateEventWindowsCsv, generateTimeSeriesCsv, downloadFile } from '../services/exportData';

interface ComparisonTableProps {
  results: Record<string, SiteAnalysisResult>;
  selectedSiteId: string;
  onSelectSite: (siteId: string) => void;
  onExportJson: () => void;
  onOpenHeightStudy: (siteId: string) => void;
}

type SortField =
  | 'siteName'
  | 'sunVisiblePct'
  | 'meanSolarVisibleFractionPct'
  | 'sunVisibleHours'
  | 'longestSunObstructedHours'
  | 'longestLightPeriodHours'
  | 'earthVisiblePct'
  | 'bothVisibleHours'
  | 'totalEnergyKWh';

export const ComparisonTable: React.FC<ComparisonTableProps> = ({
  results,
  selectedSiteId,
  onSelectSite,
  onExportJson,
  onOpenHeightStudy,
}) => {
  const [sortField, setSortField] = useState<SortField>('sunVisiblePct');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  const siteList = Object.values(results);

  if (siteList.length === 0) {
    return null;
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false); // default descending for metrics
    }
  };

  const sortedList = [...siteList].sort((a, b) => {
    let valA = a.metrics[sortField as keyof SiteMetrics];
    let valB = b.metrics[sortField as keyof SiteMetrics];

    if (valA === undefined) return 1;
    if (valB === undefined) return -1;

    if (typeof valA === 'string') {
      valA = (valA as string).toLowerCase();
      valB = (valB as string).toLowerCase();
    }

    if (valA < valB) return sortAsc ? -1 : 1;
    if (valA > valB) return sortAsc ? 1 : -1;
    return 0;
  });

  const handleDownloadCsv = (res: SiteAnalysisResult, e: React.MouseEvent) => {
    e.stopPropagation();
    const csv = generateTimeSeriesCsv(res);
    const safeName = res.site.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    downloadFile(csv, `${safeName}_ephemeris_visibility.csv`, 'text/csv');
  };

  const handleDownloadEventsCsv = (res: SiteAnalysisResult, e: React.MouseEvent) => {
    e.stopPropagation();
    const csv = generateEventWindowsCsv(res);
    const safeName = res.site.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    downloadFile(csv, `${safeName}_event_windows.csv`, 'text/csv');
  };

  return (
    <div className="bg-[#0B1120] border border-slate-800 rounded-xl p-4 shadow-xl flex flex-col gap-4">
      {/* Table Header and Export Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
        <div>
          <div className="flex items-center space-x-2">
            <FileSpreadsheet className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
              Candidate Site Performance Matrix
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Compare illumination windows, finite solar disc fraction, PV power, and direct Earth line-of-sight
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={onExportJson}
            className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium flex items-center space-x-1.5 transition"
            title="Download full analysis as JSON"
          >
            <FileJson className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export Mission JSON</span>
          </button>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="overflow-x-auto rounded-lg border border-slate-800">
        <table className="w-full text-xs text-left border-collapse">
          <thead className="bg-slate-900/90 text-slate-400 font-mono text-[11px] uppercase tracking-wider">
            <tr>
              <th
                onClick={() => handleSort('siteName')}
                className="py-2.5 px-3 cursor-pointer hover:text-white"
              >
                <div className="flex items-center space-x-1">
                  <span>Candidate Site</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-2.5 px-3">Horizon Mode</th>
              <th
                onClick={() => handleSort('sunVisiblePct')}
                className="py-2.5 px-3 cursor-pointer hover:text-white text-right"
              >
                <div className="flex items-center justify-end space-x-1">
                  <span>Sunlit %</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('meanSolarVisibleFractionPct')}
                className="py-2.5 px-3 cursor-pointer hover:text-white text-right"
              >
                <div className="flex items-center justify-end space-x-1">
                  <span>Mean Disc f̄_sun</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('longestSunObstructedHours')}
                className="py-2.5 px-3 cursor-pointer hover:text-white text-right"
              >
                <div className="flex items-center justify-end space-x-1">
                  <span>Max Dark (LCSP)</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('longestLightPeriodHours')}
                className="py-2.5 px-3 cursor-pointer hover:text-white text-right"
              >
                <div className="flex items-center justify-end space-x-1">
                  <span>Max Light (LCIP)</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('totalEnergyKWh')}
                className="py-2.5 px-3 cursor-pointer hover:text-white text-right text-amber-300"
              >
                <div className="flex items-center justify-end space-x-1">
                  <Zap className="w-3 h-3" />
                  <span>PV Energy</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('earthVisiblePct')}
                className="py-2.5 px-3 cursor-pointer hover:text-white text-right"
              >
                <div className="flex items-center justify-end space-x-1">
                  <span>Earth Vis %</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('bothVisibleHours')}
                className="py-2.5 px-3 cursor-pointer hover:text-white text-right font-bold text-emerald-400"
              >
                <div className="flex items-center justify-end space-x-1">
                  <span>Both Vis (h)</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-2.5 px-3 text-center">Trade Study</th>
              <th className="py-2.5 px-3 text-center">Export</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 font-mono">
            {sortedList.map((res) => {
              const isSelected = res.site.id === selectedSiteId;
              const { metrics, site } = res;
              return (
                <tr
                  key={site.id}
                  onClick={() => onSelectSite(site.id)}
                  className={`cursor-pointer transition ${
                    isSelected
                      ? 'bg-cyan-950/40 text-cyan-100 font-medium border-l-2 border-cyan-400'
                      : 'hover:bg-slate-800/40 text-slate-300'
                  }`}
                >
                  <td className="py-2.5 px-3 font-sans">
                    <div className="flex items-center space-x-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: site.color }}
                      />
                      <span className="font-semibold text-white">{site.name}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      {Math.abs(site.latitude).toFixed(2)}°S, {site.longitude.toFixed(1)}°E (Obs: {site.observerHeight}m)
                    </div>
                  </td>
                  <td className="py-2.5 px-3 font-sans text-[11px]">
                    {site.horizonProfile ? (
                      <span className="text-emerald-400 flex items-center space-x-1">
                        <span>Terrain DEM</span>
                      </span>
                    ) : (
                      <span className="text-slate-400">Geometric (0°)</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-right text-amber-300 font-bold">
                    {metrics.sunVisiblePct}%
                  </td>
                  <td className="py-2.5 px-3 text-right text-amber-200">
                    {metrics.meanSolarVisibleFractionPct}%
                  </td>
                  <td className="py-2.5 px-3 text-right text-red-400">
                    {metrics.longestSunObstructedHours}h
                  </td>
                  <td className="py-2.5 px-3 text-right text-emerald-400">
                    {metrics.longestLightPeriodHours}h
                  </td>
                  <td className="py-2.5 px-3 text-right text-amber-300 font-bold">
                    {metrics.totalEnergyKWh} kWh
                  </td>
                  <td className="py-2.5 px-3 text-right text-blue-300 font-bold">
                    {metrics.earthVisiblePct}%
                  </td>
                  <td className="py-2.5 px-3 text-right text-emerald-400 font-bold">
                    {metrics.bothVisibleHours}h ({metrics.bothVisiblePct}%)
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenHeightStudy(site.id);
                      }}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-cyan-950 text-cyan-300 border border-slate-700 hover:border-cyan-500/50 text-[11px] font-sans flex items-center space-x-1 mx-auto transition"
                      title="Analyze height sensitivity (1m, 2m, 5m, 10m) from Barker et al. (2021)"
                    >
                      <Sliders className="w-3 h-3 text-cyan-400" />
                      <span>Mast Study</span>
                    </button>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <div className="flex items-center justify-center space-x-1">
                      <button
                        type="button"
                        onClick={(e) => handleDownloadCsv(res, e)}
                        className="p-1 rounded hover:bg-slate-700 text-cyan-400 hover:text-cyan-300 transition"
                        title="Download time-series CSV (Section A.16 schema)"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDownloadEventsCsv(res, e)}
                        className="px-1 py-0.5 rounded text-[10px] hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-800 transition"
                        title="Download Event Windows CSV"
                      >
                        Events
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Engineering Trade-off & Synthesis Callout */}
      <div className="p-3.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs text-slate-300 space-y-2">
        <div className="flex items-center space-x-2 text-cyan-400 font-semibold uppercase tracking-wider text-[11px]">
          <Lightbulb className="w-4 h-4" />
          <span>Multi-Criteria Mission Trade-off Analysis</span>
        </div>
        <p className="leading-relaxed text-slate-300 text-[11px]">
          No lunar landing site is universally &quot;best&quot;. Mission architecture requires balancing competing constraints:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 text-[11px]">
          <div className="p-2.5 bg-slate-950/60 rounded border border-slate-800/80">
            <span className="text-cyan-300 font-semibold block mb-1">
              Site Alpha (Connecting Ridge)
            </span>
            <p className="text-slate-400 leading-snug">
              Elevated ridge offers high cumulative illumination (~88-92%), minimizing battery mass. However, being near 160°E, Earth dips close to or below the horizon during libration, necessitating RF relay satellites or scheduled comms passes.
            </p>
          </div>
          <div className="p-2.5 bg-slate-950/60 rounded border border-slate-800/80">
            <span className="text-purple-300 font-semibold block mb-1">
              Site Beta (Malapert Mountain)
            </span>
            <p className="text-slate-400 leading-snug">
              Positioned on the 0°E Earth-facing meridian, the high massif provides near-continuous line of sight to Earth (~98% visibility), ideal for direct-to-Earth telemetry. However, its lower latitude (-86°S) means deeper seasonal solar drops.
            </p>
          </div>
          <div className="p-2.5 bg-slate-950/60 rounded border border-slate-800/80">
            <span className="text-emerald-300 font-semibold block mb-1">
              Site Gamma (de Gerlache Rim)
            </span>
            <p className="text-slate-400 leading-snug">
              Offers direct access to permanently shadowed crater floors for volatile sampling, but rugged local crater rim topography creates intermittent terrain masking periods requiring robust power reserve margins.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
