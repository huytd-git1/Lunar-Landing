/**
 * Multi-Height Observer Mast Analysis
 * Implements observer height sensitivity from:
 * - Barker et al. (2021) Section 5 & Figure 14 (DOI: 10.1016/j.pss.2020.105119)
 * - Gläser et al. (2014) Section 3 & Figures 17, 20 (DOI: 10.1016/j.icarus.2014.08.013)
 * - LUNAR_LANDING_IMPLEMENTATION.md Section B.9
 *
 * Compares heights: 1m (rover deck / low lander), 2m (standard mast), 5m (tall lander mast), 10m (dedicated solar tower)
 */

import { EphemerisRecord, HorizonProfile } from '../types';
import { calculateInstantaneousPvPower, DEFAULT_PANEL_CONFIG, integrateCumulativeEnergyWh, SolarPanelConfig } from './power';
import { evaluateSunlitState, integrateMeanSolarVisibleFraction } from './solarDisc';
import { interpolateHorizonElevation } from './horizonProfile';

export interface HeightComparisonResult {
  heightM: number;
  label: string;
  sunlitPct: number;
  meanVisibleFractionPct: number;
  longestDarkPeriodHours: number; // LCSP (Longest Continuous Shadow Period)
  longestLightPeriodHours: number; // LCIP (Longest Continuous Illumination Period)
  totalEnergyKWh: number;
}

export const STANDARD_OBSERVER_HEIGHTS_M = [1, 2, 5, 10];

/**
 * Derives an effective horizon profile at target height h based on a reference profile at h_ref.
 * An elevated observer at distance d to the blocking rim sees an elevation reduction:
 * \Delta H \approx - (h - h_ref) / d_blocker (in radians).
 * If specific blocker distance is unrecorded, a conservative nominal distance of 2.5 km (typical polar crater rim distance)
 * is used, matching Barker et al. (2021).
 */
export function deriveHorizonAtHeight(
  baseProfile: HorizonProfile | null | undefined,
  targetHeightM: number,
  nominalObstacleDistanceM: number = 2500
): HorizonProfile | null {
  if (!baseProfile) return null;

  const baseHeight = baseProfile.observerHeight || 2.0;
  const deltaH = targetHeightM - baseHeight;
  const deltaElevDeg = -(Math.atan2(deltaH, nominalObstacleDistanceM) * 180.0) / Math.PI;

  return {
    ...baseProfile,
    id: `${baseProfile.id}_h${targetHeightM}m`,
    observerHeight: targetHeightM,
    name: `${baseProfile.name} (${targetHeightM}m mast)`,
    points: baseProfile.points.map((pt) => ({
      azimuth: pt.azimuth,
      elevation: Math.max(-2.0, pt.elevation + deltaElevDeg),
    })),
  };
}

/**
 * Evaluates performance metrics for a specific observer height over the mission time series.
 */
export function evaluateSiteAtHeight(
  sunRecords: EphemerisRecord[],
  baseProfile: HorizonProfile | null | undefined,
  heightM: number,
  panelConfig: SolarPanelConfig = DEFAULT_PANEL_CONFIG
): HeightComparisonResult {
  const profileAtH = deriveHorizonAtHeight(baseProfile, heightM);
  const timeHours: number[] = [];
  const fractions: number[] = [];
  const powersWatts: number[] = [];
  const timestampsIso: string[] = [];

  let currentDarkHours = 0;
  let maxDarkHours = 0;
  let currentLightHours = 0;
  let maxLightHours = 0;
  let totalSunlitHours = 0;
  let totalHours = 0;

  for (let i = 0; i < sunRecords.length; i++) {
    const sr = sunRecords[i];
    const horEl = interpolateHorizonElevation(profileAtH, sr.azimuth);
    const sunEl = sr.elevation;

    const sunlit = evaluateSunlitState(sunEl, horEl, 'finite_disc', 0.0);
    const fraction = sunlit.visibleFraction;
    const isLit = sunlit.isSunlit;

    // Time delta
    let dtHours = 0.5;
    if (i < sunRecords.length - 1) {
      const t1 = new Date(sr.timestamp).getTime();
      const t2 = new Date(sunRecords[i + 1].timestamp).getTime();
      if (!isNaN(t1) && !isNaN(t2)) {
        dtHours = (t2 - t1) / (1000 * 3600);
      }
    }

    totalHours += dtHours;
    timeHours.push(totalHours);
    fractions.push(fraction);
    timestampsIso.push(sr.timestamp);

    // Track Power
    const pv = calculateInstantaneousPvPower(sr.azimuth, sunEl, fraction, panelConfig);
    powersWatts.push(pv.powerWatts);

    // Track dark and light runs
    if (isLit) {
      totalSunlitHours += dtHours;
      currentLightHours += dtHours;
      if (currentLightHours > maxLightHours) maxLightHours = currentLightHours;
      currentDarkHours = 0;
    } else {
      currentDarkHours += dtHours;
      if (currentDarkHours > maxDarkHours) maxDarkHours = currentDarkHours;
      currentLightHours = 0;
    }
  }

  const meanFrac = integrateMeanSolarVisibleFraction(timeHours, fractions);
  const energy = integrateCumulativeEnergyWh(timestampsIso, powersWatts);

  let label = `${heightM}m Mast`;
  if (heightM === 1) label = '1m (Rover Deck)';
  else if (heightM === 2) label = '2m (Lander Mast)';
  else if (heightM === 5) label = '5m (Tall Tower)';
  else if (heightM === 10) label = '10m (Solar Mast)';

  return {
    heightM,
    label,
    sunlitPct: totalHours > 0 ? Math.round((totalSunlitHours / totalHours) * 1000) / 10 : 0,
    meanVisibleFractionPct: Math.round(meanFrac * 1000) / 10,
    longestDarkPeriodHours: Math.round(maxDarkHours * 10) / 10,
    longestLightPeriodHours: Math.round(maxLightHours * 10) / 10,
    totalEnergyKWh: energy.totalEnergyKWh,
  };
}

/**
 * Runs a multi-height comparative assessment across 1m, 2m, 5m, 10m.
 */
export function runMultiHeightAnalysis(
  sunRecords: EphemerisRecord[],
  baseProfile: HorizonProfile | null | undefined,
  panelConfig: SolarPanelConfig = DEFAULT_PANEL_CONFIG
): HeightComparisonResult[] {
  return STANDARD_OBSERVER_HEIGHTS_M.map((h) =>
    evaluateSiteAtHeight(sunRecords, baseProfile, h, panelConfig)
  );
}
