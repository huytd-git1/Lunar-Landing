import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bundledData from '../src/data/bundledEphemeris.json';
import { DEFAULT_MISSION_SETTINGS, DEFAULT_SITES } from '../src/data/defaultSites';
import { calculateSiteVisibilitySeries } from '../src/services/visibility';
import { calculateSiteMetrics } from '../src/services/metrics';
import { generateAnalysisJson, generateTimeSeriesCsv } from '../src/services/exportData';
import { SiteAnalysisResult } from '../src/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const results: Record<string, SiteAnalysisResult> = {};

for (const site of DEFAULT_SITES) {
  const siteBundle = (bundledData.sites as any)[site.id];
  const points = calculateSiteVisibilitySeries(
    siteBundle.sun,
    siteBundle.earth,
    site.horizonProfile,
    DEFAULT_MISSION_SETTINGS.earthClearanceAngle
  );
  const metrics = calculateSiteMetrics(site.id, site.name, 'real_terrain', points);
  results[site.id] = {
    site,
    dataMode: 'real_terrain',
    source: 'NASA/JPL Solar System Dynamics Horizons API',
    points,
    metrics
  };
}

const overallAnalysis = {
  generatedAt: new Date().toISOString(),
  mission: DEFAULT_MISSION_SETTINGS,
  sites: DEFAULT_SITES,
  results,
  dataMode: 'real_terrain' as const,
  notes: [
    'Example analysis exported from Lunar Landing Site Navigator',
    'Demonstrates 7-day 30-min evaluation with real Horizons ephemerides and LOLA DEM-derived terrain profiles'
  ]
};

const examplesDir = path.join(__dirname, '..', 'examples');
if (!fs.existsSync(examplesDir)) {
  fs.mkdirSync(examplesDir, { recursive: true });
}

// Write example JSON analysis
const jsonStr = generateAnalysisJson(overallAnalysis);
fs.writeFileSync(path.join(examplesDir, 'example_exported_analysis.json'), jsonStr);

// Write example CSV for Site Alpha
const csvStr = generateTimeSeriesCsv(results['site-a']);
fs.writeFileSync(path.join(examplesDir, 'example_exported_site_a_timeseries.csv'), csvStr);

console.log('Successfully generated example exported analysis files in examples/');

