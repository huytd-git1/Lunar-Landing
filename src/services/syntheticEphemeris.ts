import { EphemerisRecord } from '../types';

/**
 * Analytical Synthetic Demonstration Ephemeris Generator for Lunar South Pole.
 * 
 * Based on lunar celestial mechanics (Mazarico et al. 2011, Gläser et al. 2014):
 * - Moon rotational axis tilt to ecliptic plane: epsilon = 1.5424 deg.
 * - Synodic solar day: T_syn = 29.530589 days (708.734 hours).
 * - Solar hour angle rate: dOmega/dt = -360 deg / 708.734 hrs ~= -0.50795 deg/hr.
 * - Lunar optical and physical libration in longitude (amplitude ~8.0 deg, period ~27.212 days).
 * - Lunar libration in latitude (amplitude ~6.7 deg, period ~27.322 days).
 * 
 * Used for Demonstration Mode ('demo') and client-side testing when external APIs
 * are offline or when running in static hosting environments.
 */

export interface SyntheticEphemerisOptions {
  lat: number; // observer latitude in degrees (expected south polar, e.g. -89.75)
  lon: number; // observer East longitude in degrees [0, 360)
  startTimeStr: string; // 'YYYY-MM-DD HH:mm' or ISO
  durationDays: number;
  stepMinutes: number;
}

export function generateSyntheticLunarEphemeris(options: SyntheticEphemerisOptions): {
  sun: EphemerisRecord[];
  earth: EphemerisRecord[];
  source: string;
} {
  const { lat, lon, startTimeStr, durationDays, stepMinutes } = options;

  const startDate = new Date(startTimeStr.includes('T') ? startTimeStr : `${startTimeStr.replace(' ', 'T')}:00Z`);
  const startMs = isNaN(startDate.getTime()) ? Date.now() : startDate.getTime();

  const totalSteps = Math.min(2000, Math.max(1, Math.round((durationDays * 24 * 60) / stepMinutes)));

  const latRad = (lat * Math.PI) / 180.0;
  const lonRad = (lon * Math.PI) / 180.0;

  const sunRecords: EphemerisRecord[] = [];
  const earthRecords: EphemerisRecord[] = [];

  // Seasonal obliquity constant
  const OBLIQUITY_DEG = 1.5424;
  const SYNODIC_HOURS = 29.530589 * 24.0; // ~708.734 hrs
  const DRACONIC_HOURS = 27.21222 * 24.0;
  const ANOMALISTIC_HOURS = 27.55455 * 24.0;

  // Epoch reference (2026-11-15 00:00 UTC)
  const epochMs = new Date('2026-11-15T00:00:00Z').getTime();

  for (let i = 0; i <= totalSteps; i++) {
    const currentMs = startMs + i * stepMinutes * 60 * 1000;
    const curDate = new Date(currentMs);
    const isoString = curDate.toISOString();

    const hoursSinceEpoch = (currentMs - epochMs) / (1000 * 3600);

    // Format rawTime like Horizons: 'YYYY-MMM-DD HH:mm'
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const yyyy = curDate.getUTCFullYear();
    const mmm = months[curDate.getUTCMonth()];
    const dd = String(curDate.getUTCDate()).padStart(2, '0');
    const hh = String(curDate.getUTCHours()).padStart(2, '0');
    const min = String(curDate.getUTCMinutes()).padStart(2, '0');
    const rawTime = `${yyyy}-${mmm}-${dd} ${hh}:${min}`;

    // --- 1. SOLAR POSITION (Gläser et al. 2014 & Mazarico et al. 2011) ---
    // Subsolar longitude progresses westward across the Moon
    const sunMeanLonDeg = (180.0 - (hoursSinceEpoch / SYNODIC_HOURS) * 360.0) % 360.0;
    const subsolarLonRad = (((sunMeanLonDeg % 360.0) + 360.0) % 360.0) * (Math.PI / 180.0);

    // Subsolar latitude (solar declination in lunar frame) varies over ~346.6 days nodal year
    const nodalYearHours = 346.62 * 24.0;
    const subsolarLatRad =
      OBLIQUITY_DEG * Math.sin((2 * Math.PI * hoursSinceEpoch) / nodalYearHours + 0.85) * (Math.PI / 180.0);

    // Solar Hour Angle H = subsolarLon - observerLon
    const H_sun = subsolarLonRad - lonRad;

    // Local topocentric elevation:
    // sin(elev) = sin(phi)*sin(delta) + cos(phi)*cos(delta)*cos(H)
    const sinElevSun =
      Math.sin(latRad) * Math.sin(subsolarLatRad) +
      Math.cos(latRad) * Math.cos(subsolarLatRad) * Math.cos(H_sun);
    const sunElevationDeg = (Math.asin(Math.max(-1, Math.min(1, sinElevSun))) * 180.0) / Math.PI;

    // Local topocentric azimuth (clockwise from North):
    // tan(A) = -sin(H) / (cos(phi)*tan(delta) - sin(phi)*cos(H))
    const y_sun = -Math.sin(H_sun);
    const x_sun =
      Math.cos(latRad) * Math.tan(subsolarLatRad) - Math.sin(latRad) * Math.cos(H_sun);
    let sunAzimuthDeg = (Math.atan2(y_sun, x_sun) * 180.0) / Math.PI;
    sunAzimuthDeg = (sunAzimuthDeg + 360.0) % 360.0;

    sunRecords.push({
      timestamp: isoString,
      rawTime,
      flag: '*',
      azimuth: parseFloat(sunAzimuthDeg.toFixed(4)),
      elevation: parseFloat(sunElevationDeg.toFixed(4)),
    });

    // --- 2. EARTH POSITION & LUNAR LIBRATION (Bryant 2009 & Figure 5) ---
    // Sub-Earth point oscillates about (0,0) due to optical & physical libration
    const libLonDeg = 7.9 * Math.sin((2 * Math.PI * hoursSinceEpoch) / DRACONIC_HOURS + 1.2);
    const libLatDeg = 6.6 * Math.sin((2 * Math.PI * hoursSinceEpoch) / ANOMALISTIC_HOURS + 0.4);

    const subEarthLonRad = (libLonDeg * Math.PI) / 180.0;
    const subEarthLatRad = (libLatDeg * Math.PI) / 180.0;

    const H_earth = subEarthLonRad - lonRad;

    const sinElevEarth =
      Math.sin(latRad) * Math.sin(subEarthLatRad) +
      Math.cos(latRad) * Math.cos(subEarthLatRad) * Math.cos(H_earth);
    const earthElevationDeg = (Math.asin(Math.max(-1, Math.min(1, sinElevEarth))) * 180.0) / Math.PI;

    const y_earth = -Math.sin(H_earth);
    const x_earth =
      Math.cos(latRad) * Math.tan(subEarthLatRad) - Math.sin(latRad) * Math.cos(H_earth);
    let earthAzimuthDeg = (Math.atan2(y_earth, x_earth) * 180.0) / Math.PI;
    earthAzimuthDeg = (earthAzimuthDeg + 360.0) % 360.0;

    earthRecords.push({
      timestamp: isoString,
      rawTime,
      flag: ' ',
      azimuth: parseFloat(earthAzimuthDeg.toFixed(4)),
      elevation: parseFloat(earthElevationDeg.toFixed(4)),
    });
  }

  return {
    sun: sunRecords,
    earth: earthRecords,
    source: 'Demonstration Synthetic Lunar Ephemerides (Analytical Orbit Model; Gläser 2014 & Bryant 2009)',
  };
}

