import React, { useState, useMemo, useCallback } from 'react';
import {
  DataMode,
  EphemerisRecord,
  HorizonProfile,
  MissionSettings,
  OverallAnalysis,
  SiteAnalysisResult,
  SiteConfig,
} from './types';
import { DEFAULT_MISSION_SETTINGS, DEFAULT_SITES } from './data/defaultSites';
import bundledData from './data/bundledEphemeris.json';
import { calculateSiteVisibilitySeries } from './services/visibility';
import { calculateSiteMetrics } from './services/metrics';
import { generateAnalysisJson, downloadFile } from './services/exportData';
import { querySiteEphemeris } from './services/horizonsClient';

import { Header } from './components/Header';
import { SiteConfigPanel } from './components/SiteConfigPanel';
import { MissionSettingsPanel } from './components/MissionSettingsPanel';
import { LunarSiteMap } from './components/LunarSiteMap';
import { LocalHorizonChart } from './components/LocalHorizonChart';
import { TimeSeriesChart } from './components/TimeSeriesChart';
import { VisibilityTimeline } from './components/VisibilityTimeline';
import { TimeControls } from './components/TimeControls';
import { ComparisonTable } from './components/ComparisonTable';
import { HowItWorksModal } from './components/HowItWorksModal';
import { HorizonImportModal } from './components/HorizonImportModal';
import { ResearchModal } from './components/ResearchModal';
import { HeightComparisonModal } from './components/HeightComparisonModal';
import { useLanguage } from './i18n/LanguageContext';

export const App: React.FC = () => {
  const { t, language } = useLanguage();
  // 1. Mission and Site Configurations
  const [sites, setSites] = useState<SiteConfig[]>(DEFAULT_SITES);
  const [selectedSiteId, setSelectedSiteId] = useState<string>('site-a');
  const [missionSettings, setMissionSettings] = useState<MissionSettings>(DEFAULT_MISSION_SETTINGS);
  const [dataMode, setDataMode] = useState<DataMode>('real_terrain');

  // 2. Ephemeris Cache
  // Initialize with pre-bundled real NASA/JPL Horizons dataset
  const [ephemerisCache, setEphemerisCache] = useState<
    Record<string, { sun: EphemerisRecord[]; earth: EphemerisRecord[]; source: string }>
  >(() => {
    const init: Record<string, { sun: EphemerisRecord[]; earth: EphemerisRecord[]; source: string }> = {};
    for (const [id, data] of Object.entries((bundledData as any).sites)) {
      init[id] = {
        sun: (data as any).sun,
        earth: (data as any).earth,
        source: 'Bundled NASA/JPL Horizons Real Ephemeris Dataset',
      };
    }
    return init;
  });

  // 3. Playback State
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(5);

  // 4. Async Analysis & Errors
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // 5. Modals
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState<boolean>(false);
  const [isResearchOpen, setIsResearchOpen] = useState<boolean>(false);
  const [heightStudySiteId, setHeightStudySiteId] = useState<string | null>(null);
  const [importModalSiteId, setImportModalSiteId] = useState<string | null>(null);

  // Active site object
  const activeSite = useMemo(() => {
    return sites.find((s) => s.id === selectedSiteId) || sites[0];
  }, [sites, selectedSiteId]);

  // Compute Visibility, Solar Disc, PV Power, and Duration Metrics for all configured sites
  const calculatedResults: Record<string, SiteAnalysisResult> = useMemo(() => {
    const res: Record<string, SiteAnalysisResult> = {};

    for (const site of sites) {
      const cached = ephemerisCache[site.id];
      if (!cached || !cached.sun || cached.sun.length === 0) continue;

      // In geometric horizon mode, treat profile as null (0.0° line)
      const effectiveProfile = dataMode === 'real_terrain' ? site.horizonProfile : null;

      const points = calculateSiteVisibilitySeries(
        cached.sun,
        cached.earth,
        effectiveProfile,
        missionSettings.earthClearanceAngle,
        missionSettings.solarModel,
        missionSettings.sunlitThreshold,
        missionSettings.solarPanel
      );

      const metrics = calculateSiteMetrics(
        site.id,
        site.name,
        dataMode,
        points,
        effectiveProfile,
        cached.sun,
        missionSettings.solarPanel
      );

      res[site.id] = {
        site,
        dataMode,
        source: cached.source,
        points,
        metrics,
      };
    }

    return res;
  }, [
    sites,
    ephemerisCache,
    dataMode,
    missionSettings.earthClearanceAngle,
    missionSettings.solarModel,
    missionSettings.sunlitThreshold,
    missionSettings.solarPanel,
  ]);

  const activeResult = calculatedResults[selectedSiteId];
  const activePoints = activeResult?.points || [];
  const activeMetrics = activeResult?.metrics || {
    siteId: activeSite.id,
    siteName: activeSite.name,
    dataMode,
    dataCoveragePct: 100,
    totalMissionHours: 168,
    totalValidHours: 168,
    sunVisibleHours: 0,
    sunVisiblePct: 0,
    meanSolarVisibleFractionPct: 0,
    longestSunObstructedHours: 0,
    longestLightPeriodHours: 0,
    earthVisibleHours: 0,
    earthVisiblePct: 0,
    longestEarthObstructedHours: 0,
    bothVisibleHours: 0,
    bothVisiblePct: 0,
    earthClearHours: 0,
    earthClearPct: 0,
    totalEnergyKWh: 0,
    maxPvPowerWatts: 0,
  };

  const activePoint = activePoints[activeIndex] || activePoints[0] || null;

  // Handle live analysis query via backend proxy / Horizons API or client-side synthetic model
  const handleRunAnalysis = useCallback(async () => {
    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const newCache = { ...ephemerisCache };
      let updatedCount = 0;

      for (const site of sites) {
        const queryRes = await querySiteEphemeris(site, missionSettings, dataMode, language);
        if (!queryRes.success) {
          throw new Error(queryRes.error || `Failed to analyze site ${site.name}`);
        }

        newCache[site.id] = {
          sun: queryRes.sun!,
          earth: queryRes.earth!,
          source: queryRes.source || 'NASA/JPL Horizons Ephemeris',
        };
        updatedCount++;
      }

      setEphemerisCache(newCache);
      setActiveIndex(0);
      console.log(`[Analysis Complete] Successfully updated ${updatedCount} sites.`);
    } catch (err) {
      console.error('[Analysis Error]', err);
      setAnalysisError(
        (err as Error).message ||
          (language === 'vi'
            ? 'Không thể kết nối đến máy chủ Horizons. Bạn có thể nhấn "Dùng Bộ Dữ Liệu Ngoại Tuyến Có Sẵn" hoặc đổi sang Chế độ Mô phỏng.'
            : 'Failed to connect to Horizons service. You can click "Use Bundled Offline Dataset" or switch to Demonstration Mode.')
      );
    } finally {
      setIsAnalyzing(false);
    }
  }, [sites, missionSettings, ephemerisCache, dataMode, language]);

  // Fallback handler when live query fails
  const handleUseFallback = () => {
    const fallbackCache: Record<string, any> = {};
    for (const [id, data] of Object.entries((bundledData as any).sites)) {
      fallbackCache[id] = {
        sun: (data as any).sun,
        earth: (data as any).earth,
        source: 'Bundled NASA/JPL Horizons Real Ephemeris Dataset (Offline Fallback)',
      };
    }
    setEphemerisCache(fallbackCache);
    setAnalysisError(null);
  };

  // Export full mission analysis as JSON
  const handleExportJson = useCallback(() => {
    const overall: OverallAnalysis = {
      generatedAt: new Date().toISOString(),
      mission: missionSettings,
      sites,
      results: calculatedResults,
      dataMode,
      notes: [
        'Lunar Landing Site Navigator - Candidate south-polar site evaluation',
        `Data Mode: ${dataMode}`,
        'Ephemeris Source: NASA/JPL Horizons API',
        'Topography: LOLA DEM-derived circular horizon profiles',
        'Solar Model: Finite-disc analytical area integration (Gläser et al. 2014 & De Rosa et al. 2012)',
        'Photovoltaics: Surface ENU solar vector & panel incidence power modeling (Zhang et al. 2023)',
      ],
    };

    const jsonStr = generateAnalysisJson(overall);
    downloadFile(jsonStr, 'lunar_landing_site_navigator_analysis.json', 'application/json');
  }, [missionSettings, sites, calculatedResults, dataMode]);

  // Update a single site in the array
  const handleUpdateSite = (updated: SiteConfig) => {
    setSites((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  };

  // Apply imported horizon profile
  const handleApplyProfile = (profile: HorizonProfile | null) => {
    if (!importModalSiteId) return;
    setSites((prev) =>
      prev.map((s) => (s.id === importModalSiteId ? { ...s, horizonProfile: profile } : s))
    );
  };

  const heightStudySite = sites.find((s) => s.id === heightStudySiteId) || null;
  const heightStudyResults = heightStudySiteId
    ? calculatedResults[heightStudySiteId]?.metrics?.heightComparison
    : undefined;

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 flex flex-col font-sans">
      {/* 1. Header */}
      <Header
        dataMode={dataMode}
        onDataModeChange={setDataMode}
        onOpenHowItWorks={() => setIsHowItWorksOpen(true)}
        onOpenResearch={() => setIsResearchOpen(true)}
        onExportJson={handleExportJson}
        isAnalyzing={isAnalyzing}
      />

      {/* Main Dashboard Container */}
      <main className="flex-1 max-w-[1920px] w-full mx-auto p-3 md:p-4 lg:p-5 flex flex-col gap-4">
        {/* Top Section: Settings Panel (Left) & Visualizations (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left Column: Site & Mission Configuration (4 cols on lg, 3 on xl) */}
          <div className="lg:col-span-4 xl:col-span-3 flex flex-col gap-4">
            <SiteConfigPanel
              sites={sites}
              selectedSiteId={selectedSiteId}
              onSelectSite={setSelectedSiteId}
              onUpdateSite={handleUpdateSite}
              onOpenImportModal={(id) => setImportModalSiteId(id)}
            />

            <MissionSettingsPanel
              settings={missionSettings}
              onUpdateSettings={setMissionSettings}
              onRunAnalysis={handleRunAnalysis}
              isAnalyzing={isAnalyzing}
              analysisError={analysisError}
              onClearError={() => setAnalysisError(null)}
              onUseFallback={handleUseFallback}
            />
          </div>

          {/* Right Main Area: Polar Map & Local Horizon Sky Chart (8 cols on lg, 9 on xl) */}
          <div className="lg:col-span-8 xl:col-span-9 flex flex-col gap-4">
            {/* Upper Dual Visualization Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
              {/* Lunar South Pole Polar Map */}
              <div className="xl:col-span-5 flex flex-col">
                <LunarSiteMap
                  sites={sites}
                  selectedSiteId={selectedSiteId}
                  onSelectSite={setSelectedSiteId}
                  onUpdateSite={handleUpdateSite}
                  activePoint={activePoint}
                />
              </div>

              {/* Local Horizon & Sky Chart */}
              <div className="xl:col-span-7 flex flex-col">
                <LocalHorizonChart
                  site={activeSite}
                  activePoint={activePoint}
                  profile={dataMode === 'real_terrain' ? activeSite.horizonProfile : null}
                  earthClearanceAngle={missionSettings.earthClearanceAngle}
                />
              </div>
            </div>

            {/* Synchronized Mission Time Controls */}
            <TimeControls
              points={activePoints}
              activeIndex={activeIndex}
              onSelectIndex={setActiveIndex}
              isPlaying={isPlaying}
              onTogglePlay={() => setIsPlaying(!isPlaying)}
              playbackSpeed={playbackSpeed}
              onSpeedChange={setPlaybackSpeed}
            />

            {/* Synchronized Elevation Time-Series Chart */}
            <TimeSeriesChart
              points={activePoints}
              activeIndex={activeIndex}
              onSelectIndex={setActiveIndex}
            />

            {/* Operational Visibility Windows (3-Row Timeline) */}
            <VisibilityTimeline
              points={activePoints}
              metrics={activeMetrics}
              activeIndex={activeIndex}
              onSelectIndex={setActiveIndex}
            />
          </div>
        </div>

        {/* Bottom Section: Multi-Site Comparison Table & Engineering Trade-offs */}
        <div className="w-full">
          <ComparisonTable
            results={calculatedResults}
            selectedSiteId={selectedSiteId}
            onSelectSite={setSelectedSiteId}
            onExportJson={handleExportJson}
            onOpenHeightStudy={(siteId) => setHeightStudySiteId(siteId)}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#0B1120] px-4 py-3 text-center text-xs text-slate-500 font-mono">
        {t.footerText}
      </footer>

      {/* Modals */}
      <HowItWorksModal
        isOpen={isHowItWorksOpen}
        onClose={() => setIsHowItWorksOpen(false)}
      />

      <ResearchModal
        isOpen={isResearchOpen}
        onClose={() => setIsResearchOpen(false)}
      />

      {heightStudySiteId && (
        <HeightComparisonModal
          isOpen={true}
          onClose={() => setHeightStudySiteId(null)}
          site={heightStudySite}
          results={heightStudyResults}
        />
      )}

      {importModalSiteId && (
        <HorizonImportModal
          isOpen={true}
          onClose={() => setImportModalSiteId(null)}
          site={sites.find((s) => s.id === importModalSiteId) || sites[0]}
          onApplyProfile={handleApplyProfile}
        />
      )}
    </div>
  );
};
