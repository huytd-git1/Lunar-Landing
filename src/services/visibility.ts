import { CalculatedPoint, EphemerisRecord, HorizonProfile, SolarModelType, VisibilityState } from '../types';
import { interpolateHorizonElevation } from './horizonProfile';
import { calculateInstantaneousPvPower, DEFAULT_PANEL_CONFIG, integrateCumulativeEnergyWh, SolarPanelConfig } from './power';
import { calculateVisibleSolarDiscFraction, evaluateSunlitState } from './solarDisc';

/**
 * Calculates instantaneous point-object visibility according to the documented approximation:
 * visible(t) = object_elevation(t) > horizon_elevation(object_azimuth(t))
 *
 * In geometric-horizon mode (profile === null), horizon_elevation = 0.0°
 */
export function evaluatePointVisibility(
  elevation: number,
  horizonElevation: number
): VisibilityState {
  if (isNaN(elevation) || isNaN(horizonElevation)) {
    return 'unknown';
  }
  return elevation > horizonElevation ? 'visible' : 'obstructed';
}

/**
 * Evaluates optional Earth clearance angle:
 * earth_clear(t) = earth_elevation(t) > horizon_elevation(earth_azimuth(t)) + clearance_angle
 */
export function evaluateEarthClearance(
  earthElevation: number,
  horizonElevation: number,
  clearanceAngle: number = 0.0
): boolean {
  if (isNaN(earthElevation) || isNaN(horizonElevation)) {
    return false;
  }
  return earthElevation > horizonElevation + (clearanceAngle || 0);
}

/**
 * Merges Sun and Earth ephemeris records and evaluates horizon elevations, finite disc fraction,
 * visibility states, and instantaneous PV power.
 */
export function calculateSiteVisibilitySeries(
  sunRecords: EphemerisRecord[],
  earthRecords: EphemerisRecord[],
  profile: HorizonProfile | null | undefined,
  clearanceAngle: number = 0.5,
  solarModel: SolarModelType = 'finite_disc',
  sunlitThreshold: number = 0.0,
  solarPanel: SolarPanelConfig = DEFAULT_PANEL_CONFIG
): CalculatedPoint[] {
  // Map Earth records by timestamp or rawTime for fast matching
  const earthMap = new Map<string, EphemerisRecord>();
  for (const er of earthRecords) {
    earthMap.set(er.timestamp, er);
    earthMap.set(er.rawTime, er);
  }

  const rawPoints: Array<Omit<CalculatedPoint, 'cumulativeEnergyWh'>> = [];
  const powersWatts: number[] = [];
  const timestampsIso: string[] = [];

  for (let i = 0; i < sunRecords.length; i++) {
    const sr = sunRecords[i];
    const er = earthMap.get(sr.timestamp) || earthMap.get(sr.rawTime) || earthRecords[i];

    // Determine step size in minutes from next point if available
    let stepMinutes = 30;
    if (i < sunRecords.length - 1) {
      const tCurrent = new Date(sr.timestamp).getTime();
      const tNext = new Date(sunRecords[i + 1].timestamp).getTime();
      if (!isNaN(tCurrent) && !isNaN(tNext)) {
        stepMinutes = Math.max(1, Math.round((tNext - tCurrent) / (60 * 1000)));
      }
    } else if (i > 0) {
      stepMinutes = rawPoints[i - 1].stepMinutes;
    }

    const sunAz = sr.azimuth;
    const sunEl = sr.elevation;
    const sunHorEl = interpolateHorizonElevation(profile, sunAz);
    const sunClearance = sunEl - sunHorEl;
    const sunPointVis = evaluatePointVisibility(sunEl, sunHorEl);

    // Finite solar disc fraction & sunlit state
    const discFraction = calculateVisibleSolarDiscFraction(sunEl, sunHorEl);
    const sunlitEval = evaluateSunlitState(sunEl, sunHorEl, solarModel, sunlitThreshold);

    // Instantaneous PV power
    const pv = calculateInstantaneousPvPower(sunAz, sunEl, discFraction, solarPanel);

    let earthAz = NaN;
    let earthEl = NaN;
    let earthHorEl = 0;
    let earthClearance = NaN;
    let earthVis: VisibilityState = 'unknown';
    let earthClear = false;

    if (er) {
      earthAz = er.azimuth;
      earthEl = er.elevation;
      earthHorEl = interpolateHorizonElevation(profile, earthAz);
      earthClearance = earthEl - earthHorEl;
      earthVis = evaluatePointVisibility(earthEl, earthHorEl);
      earthClear = evaluateEarthClearance(earthEl, earthHorEl, clearanceAngle);
    }

    // Both visible is satisfied when Sun is in sunlit state and Earth center is visible
    const bothVis = sunlitEval.state === 'visible' && earthVis === 'visible';

    powersWatts.push(pv.powerWatts);
    timestampsIso.push(sr.timestamp);

    rawPoints.push({
      timestamp: sr.timestamp,
      rawTime: sr.rawTime,
      stepMinutes,
      sunAzimuth: sunAz,
      sunElevation: sunEl,
      sunHorizonElevation: sunHorEl,
      sunClearance,
      sunVisible: sunPointVis,
      solarVisibleFraction: discFraction,
      sunlitState: sunlitEval.state,
      earthAzimuth: earthAz,
      earthElevation: earthEl,
      earthHorizonElevation: earthHorEl,
      earthClearance,
      earthVisible: earthVis,
      earthCleared: earthClear,
      bothVisible: bothVis,
      pvPowerWatts: Math.round(pv.powerWatts * 10) / 10,
      solarVectorENU: pv.solarVector,
    });
  }

  // Integrate cumulative energy series
  const energyResult = integrateCumulativeEnergyWh(timestampsIso, powersWatts);

  return rawPoints.map((pt, idx) => ({
    ...pt,
    cumulativeEnergyWh: Math.round(energyResult.cumulativeSeriesWh[idx] * 10) / 10,
  }));
}
