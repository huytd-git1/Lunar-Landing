import { OverallAnalysis, SiteAnalysisResult } from '../types';

/**
 * Builds CSV string of the time-series analysis for a given site.
 */
export function generateTimeSeriesCsv(
  analysis: SiteAnalysisResult,
  appName: string = 'Lunar Landing Site Navigator'
): string {
  const lines: string[] = [];
  const { site, dataMode, source, points, metrics } = analysis;

  lines.push(`# ==============================================================================`);
  lines.push(`# ${appName} - Time-Series Ephemeris & Horizon Visibility Export`);
  lines.push(`# Exported At: ${new Date().toISOString()}`);
  lines.push(`# Site Name: ${site.name}`);
  lines.push(`# Latitude: ${site.latitude}° (${site.latitude < 0 ? 'South' : 'North'})`);
  lines.push(`# Longitude: ${site.longitude}° East-positive`);
  lines.push(`# Observer Height Above Ground: ${site.observerHeight} meters`);
  lines.push(`# Data Mode: ${dataMode}`);
  lines.push(`# Ephemeris Source: ${source}`);
  lines.push(`# Total Sun Visible: ${metrics.sunVisibleHours} hrs (${metrics.sunVisiblePct}%)`);
  lines.push(`# Total Earth Visible: ${metrics.earthVisibleHours} hrs (${metrics.earthVisiblePct}%)`);
  lines.push(`# Both Visible (Coincident): ${metrics.bothVisibleHours} hrs (${metrics.bothVisiblePct}%)`);
  lines.push(`# Longest Sun Obstruction (Eclipse): ${metrics.longestSunObstructedHours} hrs`);
  lines.push(`# Longest Earth Obstruction (Blackout): ${metrics.longestEarthObstructedHours} hrs`);
  lines.push(`# Note: Point-object approximation. Exploratory prototype, not flight certified.`);
  lines.push(`# ==============================================================================`);
  lines.push([
    'timestamp_utc',
    'raw_time',
    'sun_azimuth_deg',
    'sun_elevation_deg',
    'sun_horizon_elevation_deg',
    'sun_visible',
    'earth_azimuth_deg',
    'earth_elevation_deg',
    'earth_horizon_elevation_deg',
    'earth_visible',
    'earth_cleared_margin',
    'both_visible'
  ].join(','));

  for (const p of points) {
    lines.push([
      p.timestamp,
      `"${p.rawTime}"`,
      p.sunAzimuth.toFixed(4),
      p.sunElevation.toFixed(4),
      p.sunHorizonElevation.toFixed(4),
      p.sunVisible,
      isNaN(p.earthAzimuth) ? 'NaN' : p.earthAzimuth.toFixed(4),
      isNaN(p.earthElevation) ? 'NaN' : p.earthElevation.toFixed(4),
      p.earthHorizonElevation.toFixed(4),
      p.earthVisible,
      p.earthCleared ? 'true' : 'false',
      p.bothVisible ? 'true' : 'false'
    ].join(','));
  }

  return lines.join('\n');
}

/**
 * Builds comprehensive JSON export package.
 */
export function generateAnalysisJson(overall: OverallAnalysis): string {
  const exportPayload = {
    application: 'Lunar Landing Site Navigator',
    challenge: 'NASA Space Apps Challenge 2026',
    generatedAt: new Date().toISOString(),
    provenance: {
      ephemerisProvider: 'NASA/JPL Solar System Dynamics Horizons API',
      targetIds: { Sun: 10, Earth: 399, ObserverCenter: 'coord@301 (Moon Body-Fixed)' },
      coordinateConvention: 'East-positive longitude [0, 360) deg, Lunar geodetic latitude [-90, +90] deg, Alt in km relative to 1737.4 km lunar sphere',
      azimuthConvention: '0° = North, 90° = East, 180° = South, 270° = West',
      visibilityApproximation: 'visible(t) = object_elevation(t) > horizon_elevation(object_azimuth(t))',
      clearanceAngleDefinition: 'earth_clear(t) = earth_elevation(t) > horizon_elevation(earth_azimuth(t)) + clearance_angle',
    },
    scientificCaveats: [
      'Sun visibility does not directly equal electrical power generation; actual power depends on solar array incidence angle, temperature, dust deposition, and terrain reflected radiance.',
      'Earth-center visibility does not guarantee line of sight to a specific ground station; Earth rotates daily and stations may be obscured or scheduled elsewhere.',
      'Geometric line of sight does not guarantee a working radio link; RF link margins, multipath scattering off lunar terrain, and antenna pointing must be evaluated.',
      'This prototype is designed for preliminary exploration and candidate comparison, not flight certification or operational descent trajectory safety assessment.'
    ],
    mission: overall.mission,
    dataMode: overall.dataMode,
    sites: overall.sites,
    results: Object.entries(overall.results).reduce((acc, [key, val]) => {
      acc[key] = {
        site: val.site,
        dataMode: val.dataMode,
        source: val.source,
        metrics: val.metrics,
        pointCount: val.points.length,
        timeSeries: val.points
      };
      return acc;
    }, {} as Record<string, any>)
  };

  return JSON.stringify(exportPayload, null, 2);
}

/**
 * Browser file download trigger.
 */
export function triggerFileDownload(content: string, filename: string, mimeType: string = 'text/plain') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

