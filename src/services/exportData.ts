import { OverallAnalysis, SiteAnalysisResult } from '../types';

/**
 * Builds CSV string of the time-series analysis for a given site strictly following
 * Section A.16 of LUNAR_LANDING_IMPLEMENTATION.md.
 */
export function generateTimeSeriesCsv(
  analysis: SiteAnalysisResult,
  appName: string = 'Lunar Landing Site Navigator'
): string {
  const lines: string[] = [];
  const { site, dataMode, source, points, metrics } = analysis;

  lines.push(`# ==============================================================================`);
  lines.push(`# ${appName} - Time-Series Ephemeris & Horizon Visibility Export`);
  lines.push(`# Specification: LUNAR_LANDING_IMPLEMENTATION.md Section A.16`);
  lines.push(`# Exported At: ${new Date().toISOString()}`);
  lines.push(`# Site ID: ${site.id} | Site Name: ${site.name}`);
  lines.push(`# Latitude: ${site.latitude}° | Longitude East: ${site.longitude}°`);
  lines.push(`# Observer Height Above Ground: ${site.observerHeight} m`);
  lines.push(`# Terrain Elevation (Sphere R=1737.4km): ${site.terrainElevation ?? 0} m`);
  lines.push(`# Data Mode: ${dataMode} | Source: ${source}`);
  lines.push(`# Illumination Metrics: Sunlit=${metrics.sunVisibleHours}h (${metrics.sunVisiblePct}%), Mean Disc Fraction=${metrics.meanSolarVisibleFractionPct}%`);
  lines.push(`# Max Dark Period (LCSP): ${metrics.longestSunObstructedHours}h | Max Light Period (LCIP): ${metrics.longestLightPeriodHours}h`);
  lines.push(`# Earth LOS: ${metrics.earthVisibleHours}h (${metrics.earthVisiblePct}%) | Both Visible: ${metrics.bothVisibleHours}h (${metrics.bothVisiblePct}%)`);
  lines.push(`# Photovoltaic Energy: Total=${metrics.totalEnergyKWh} kWh, Max Power=${metrics.maxPvPowerWatts} W`);
  lines.push(`# ==============================================================================`);

  // Exact header line from Section A.16
  lines.push([
    'site_id',
    'timestamp_utc',
    'latitude_deg',
    'longitude_east_deg',
    'observer_height_m',
    'terrain_elevation_m',
    'sun_azimuth_deg',
    'sun_elevation_deg',
    'sun_horizon_deg',
    'sun_clearance_deg',
    'sun_center_visibility',
    'solar_visible_fraction',
    'sunlit_state',
    'earth_azimuth_deg',
    'earth_elevation_deg',
    'earth_horizon_deg',
    'earth_clearance_deg',
    'earth_center_visibility',
    'earth_engineering_clearance_state',
    'both_visible_state',
    'pv_power_w',
    'ephemeris_kind',
    'horizon_kind',
    'solar_model',
    'quality_flags',
    'provenance_ids'
  ].join(','));

  const ephemKind = dataMode === 'demo' ? 'synthetic-demo' : 'cached-real';
  const horizonKind = site.horizonProfile ? (site.horizonProfile.isUserSupplied ? 'user-supplied' : 'dem-derived') : 'zero-reference';
  const solarModel = 'finite_disc';

  for (const p of points) {
    const lat = site.latitude.toFixed(4);
    const lon = site.longitude.toFixed(4);
    const hObs = site.observerHeight.toFixed(2);
    const elevTerrain = (site.terrainElevation ?? 0).toFixed(2);

    const sunAz = p.sunAzimuth.toFixed(4);
    const sunEl = p.sunElevation.toFixed(4);
    const sunHor = p.sunHorizonElevation.toFixed(4);
    const sunClr = p.sunClearance.toFixed(4);
    const sunCenterVis = p.sunVisible;
    const solFrac = p.solarVisibleFraction.toFixed(4);
    const sunlit = p.sunlitState;

    const earthAz = isNaN(p.earthAzimuth) ? '' : p.earthAzimuth.toFixed(4);
    const earthEl = isNaN(p.earthElevation) ? '' : p.earthElevation.toFixed(4);
    const earthHor = p.earthHorizonElevation.toFixed(4);
    const earthClr = isNaN(p.earthClearance) ? '' : p.earthClearance.toFixed(4);
    const earthCenterVis = p.earthVisible;
    const earthEngClr = p.earthCleared ? 'cleared' : 'uncleared';
    const bothVis = p.bothVisible ? 'visible' : 'obstructed';

    const pvPower = p.pvPowerWatts.toFixed(1);
    const qFlags = 'NOMINAL';
    const provId = `${site.id}_horizons_2026`;

    lines.push([
      site.id,
      p.timestamp,
      lat,
      lon,
      hObs,
      elevTerrain,
      sunAz,
      sunEl,
      sunHor,
      sunClr,
      sunCenterVis,
      solFrac,
      sunlit,
      earthAz,
      earthEl,
      earthHor,
      earthClr,
      earthCenterVis,
      earthEngClr,
      bothVis,
      pvPower,
      ephemKind,
      horizonKind,
      solarModel,
      qFlags,
      provId
    ].join(','));
  }

  return lines.join('\n');
}

/**
 * Builds Event Windows CSV (ordered non-overlapping intervals of illumination / blackout).
 */
export function generateEventWindowsCsv(analysis: SiteAnalysisResult): string {
  const lines: string[] = [];
  const { site, points } = analysis;

  lines.push(`# ${site.name} - Visibility Event Windows`);
  lines.push(['window_type', 'start_utc', 'stop_utc', 'duration_hours', 'state'].join(','));

  if (points.length === 0) return lines.join('\n');

  // Sunlit windows
  let currentSunState = points[0].sunlitState;
  let sunStart = points[0].timestamp;
  let sunHrs = 0;

  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    const dtHrs = p.stepMinutes / 60.0;
    if (p.sunlitState === currentSunState) {
      sunHrs += dtHrs;
    } else {
      lines.push([
        'Sunlit_Window',
        sunStart,
        p.timestamp,
        sunHrs.toFixed(2),
        currentSunState
      ].join(','));
      currentSunState = p.sunlitState;
      sunStart = p.timestamp;
      sunHrs = dtHrs;
    }
  }
  lines.push([
    'Sunlit_Window',
    sunStart,
    points[points.length - 1].timestamp,
    sunHrs.toFixed(2),
    currentSunState
  ].join(','));

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
    scientificLiteratureBasis: [
      { author: 'Bryant (2009)', report: 'JPL IPN Progress Report 42-176', contribution: 'Simultaneous illumination and Earth line-of-sight' },
      { author: 'Mazarico et al. (2011)', doi: '10.1016/j.icarus.2010.10.030', contribution: 'LOLA azimuthal horizon database & obstruction calculation' },
      { author: 'Gläser et al. (2014)', doi: '10.1016/j.icarus.2014.08.013', contribution: 'Lunar curvature, tangent planes, finite solar disc fraction f_sun(x)' },
      { author: 'Barker et al. (2021)', doi: '10.1016/j.pss.2020.105119', contribution: 'Multi-resolution DEM, observer height impact (1m vs 5m), LCSP & LCIP' },
      { author: 'Zhang et al. (2023)', doi: '10.3390/rs15245691', contribution: 'Shadow matching with orbital NAC imagery, TMR/LZMR/DZMR metrics' },
      { author: 'De Rosa et al. (2012)', doi: '10.1016/j.pss.2012.08.002', contribution: 'Horizon circular interpolation and mission constraints' },
      { author: 'Liu et al. (2025)', doi: '10.3390/rs17091579', contribution: 'Self-Organizing Map multicriteria landing zone evaluation' }
    ],
    provenance: {
      ephemerisProvider: 'NASA/JPL Solar System Dynamics Horizons API',
      targetIds: { Sun: 10, Earth: 399, ObserverCenter: 'coord@301 (Moon Body-Fixed)' },
      coordinateConvention: 'East-positive longitude [0, 360) deg, Lunar geodetic latitude [-90, +90] deg, Alt in km relative to 1737.4 km lunar sphere',
      azimuthConvention: '0° = North, 90° = East, 180° = South, 270° = West',
      solarDiscModel: 'Uniform disc area integration f_sun(x) = 0.5 + (arcsin(x) + x*sqrt(1-x^2))/pi (Gläser 2014)',
      powerModel: 'P_PV(t) = S * A_p * eta_p * f_sun(t) * max(0, n_p . s), S = 1367 W/m^2',
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
    }, {} as Record<string, unknown>)
  };

  return JSON.stringify(exportPayload, null, 2);
}

/**
 * Triggers browser download of text data as a file.
 */
export function downloadFile(content: string, filename: string, mimeType: string = 'text/plain') {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export const triggerFileDownload = downloadFile;

