import { CalculatedPoint, EphemerisRecord, HorizonProfile, VisibilityState } from '../types';
import { interpolateHorizonElevation } from './horizonProfile';

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
 * Merges Sun and Earth ephemeris records and evaluates horizon elevations and visibility states.
 */
export function calculateSiteVisibilitySeries(
  sunRecords: EphemerisRecord[],
  earthRecords: EphemerisRecord[],
  profile: HorizonProfile | null | undefined,
  clearanceAngle: number = 0.5
): CalculatedPoint[] {
  // Map Earth records by timestamp or rawTime for fast matching
  const earthMap = new Map<string, EphemerisRecord>();
  for (const er of earthRecords) {
    earthMap.set(er.timestamp, er);
    earthMap.set(er.rawTime, er);
  }

  const result: CalculatedPoint[] = [];

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
      stepMinutes = result[i - 1].stepMinutes;
    }

    const sunAz = sr.azimuth;
    const sunEl = sr.elevation;
    const sunHorEl = interpolateHorizonElevation(profile, sunAz);
    const sunVis = evaluatePointVisibility(sunEl, sunHorEl);

    let earthAz = NaN;
    let earthEl = NaN;
    let earthHorEl = 0;
    let earthVis: VisibilityState = 'unknown';
    let earthClear = false;

    if (er) {
      earthAz = er.azimuth;
      earthEl = er.elevation;
      earthHorEl = interpolateHorizonElevation(profile, earthAz);
      earthVis = evaluatePointVisibility(earthEl, earthHorEl);
      earthClear = evaluateEarthClearance(earthEl, earthHorEl, clearanceAngle);
    }

    const bothVis = sunVis === 'visible' && earthVis === 'visible';

    result.push({
      timestamp: sr.timestamp,
      rawTime: sr.rawTime,
      stepMinutes,
      sunAzimuth: sunAz,
      sunElevation: sunEl,
      sunHorizonElevation: sunHorEl,
      sunVisible: sunVis,
      earthAzimuth: earthAz,
      earthElevation: earthEl,
      earthHorizonElevation: earthHorEl,
      earthVisible: earthVis,
      earthCleared: earthClear,
      bothVisible: bothVis,
    });
  }

  return result;
}

