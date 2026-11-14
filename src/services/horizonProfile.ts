import { HorizonPoint, HorizonProfile } from '../types';
import { normalizeEastLongitude } from './coordinates';

export interface HorizonParseValidationResult {
  valid: boolean;
  points: HorizonPoint[];
  errors: string[];
  warnings: string[];
  stats?: {
    minElevation: number;
    maxElevation: number;
    meanElevation: number;
    pointCount: number;
    maxAzimuthGap: number;
  };
}

/**
 * Parses and validates CSV content defining a local horizon profile:
 * Format:
 * azimuth_deg,horizon_elevation_deg
 * 0.0, 1.25
 * 15.0, 1.40
 * ...
 */
export function parseHorizonCsv(csvContent: string): HorizonParseValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!csvContent || csvContent.trim().length === 0) {
    return {
      valid: false,
      points: [],
      errors: ['CSV content is empty.'],
      warnings: [],
    };
  }

  const lines = csvContent.split(/\r?\n/);
  const rawPoints: { azimuth: number; elevation: number; lineNum: number }[] = [];

  let headerFound = false;

  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1;
    const rawLine = lines[i].trim();

    if (rawLine.length === 0 || rawLine.startsWith('#') || rawLine.startsWith('//')) {
      // Comment or empty line
      continue;
    }

    const parts = rawLine.split(/[,;\t]/).map((p) => p.trim());
    if (parts.length < 2) {
      warnings.push(`Line ${lineNum}: Expected at least 2 columns (azimuth, elevation), found ${parts.length}. Skipping.`);
      continue;
    }

    // Check if line is a header like "azimuth, elevation"
    const azNum = parseFloat(parts[0]);
    const elNum = parseFloat(parts[1]);

    if (isNaN(azNum) || isNaN(elNum)) {
      if (!headerFound && (parts[0].toLowerCase().includes('az') || parts[1].toLowerCase().includes('el'))) {
        headerFound = true;
        continue;
      }
      errors.push(`Line ${lineNum}: Non-numeric data encountered ("${rawLine}").`);
      continue;
    }

    // Validate azimuth range
    const normAz = normalizeEastLongitude(azNum);
    if (azNum < 0 || azNum >= 360) {
      warnings.push(`Line ${lineNum}: Azimuth ${azNum}° normalized to ${normAz.toFixed(2)}° [0, 360).`);
    }

    // Validate elevation range
    if (elNum < -20 || elNum > 60) {
      warnings.push(`Line ${lineNum}: Elevation ${elNum}° is unusually steep for lunar terrain horizons.`);
    }

    rawPoints.push({
      azimuth: normAz,
      elevation: elNum,
      lineNum,
    });
  }

  if (rawPoints.length < 2) {
    errors.push(`At least 2 horizon points are required for circular interpolation; found ${rawPoints.length}.`);
    return {
      valid: false,
      points: [],
      errors,
      warnings,
    };
  }

  // Sort ascending by azimuth
  rawPoints.sort((a, b) => a.azimuth - b.azimuth);

  // Check for duplicate azimuths and average them
  const deduped: HorizonPoint[] = [];
  let i = 0;
  while (i < rawPoints.length) {
    let j = i;
    let sumEl = 0;
    while (j < rawPoints.length && Math.abs(rawPoints[j].azimuth - rawPoints[i].azimuth) < 1e-5) {
      sumEl += rawPoints[j].elevation;
      j++;
    }
    const count = j - i;
    if (count > 1) {
      warnings.push(`Duplicate azimuth ${rawPoints[i].azimuth.toFixed(2)}° encountered ${count} times. Computed average elevation.`);
    }
    deduped.push({
      azimuth: rawPoints[i].azimuth,
      elevation: sumEl / count,
    });
    i = j;
  }

  // Calculate statistics and gap check
  let minEl = Infinity;
  let maxEl = -Infinity;
  let sumEl = 0;
  let maxGap = 0;

  for (let k = 0; k < deduped.length; k++) {
    const p = deduped[k];
    if (p.elevation < minEl) minEl = p.elevation;
    if (p.elevation > maxEl) maxEl = p.elevation;
    sumEl += p.elevation;

    // Check gap to next point
    let gap: number;
    if (k < deduped.length - 1) {
      gap = deduped[k + 1].azimuth - p.azimuth;
    } else {
      // Circular wrap gap: from last point to first point + 360
      gap = (deduped[0].azimuth + 360) - p.azimuth;
    }
    if (gap > maxGap) maxGap = gap;
  }

  if (maxGap > 90) {
    warnings.push(`Large angular gap in horizon coverage detected (${maxGap.toFixed(1)}°). Linear interpolation over wide gaps may reduce accuracy.`);
  }

  const valid = errors.length === 0 && deduped.length >= 2;

  return {
    valid,
    points: deduped,
    errors,
    warnings,
    stats: valid ? {
      minElevation: minEl,
      maxElevation: maxEl,
      meanElevation: sumEl / deduped.length,
      pointCount: deduped.length,
      maxAzimuthGap: maxGap,
    } : undefined,
  };
}

/**
 * Performs circular linear interpolation of horizon elevation for any given azimuth angle [0, 360) deg.
 * If profile is null or empty, assumes Geometric Horizon (0.0°).
 */
export function interpolateHorizonElevation(
  profile: HorizonProfile | null | undefined,
  targetAzimuth: number
): number {
  if (!profile || !profile.points || profile.points.length === 0) {
    return 0.0; // Geometric horizon mode: 0 degrees
  }

  const points = profile.points;
  if (points.length === 1) {
    return points[0].elevation;
  }

  const az = normalizeEastLongitude(targetAzimuth);
  const n = points.length;

  // Check exact matches
  if (az <= points[0].azimuth) {
    if (Math.abs(az - points[0].azimuth) < 1e-7) {
      return points[0].elevation;
    }
    // az is strictly less than the first sample: wrap-around between points[n-1] and points[0]
    const azPrev = points[n - 1].azimuth - 360.0;
    const elPrev = points[n - 1].elevation;
    const azNext = points[0].azimuth;
    const elNext = points[0].elevation;

    const span = azNext - azPrev;
    if (span <= 1e-7) return elNext;
    const t = (az - azPrev) / span;
    return elPrev + t * (elNext - elPrev);
  }

  if (az >= points[n - 1].azimuth) {
    if (Math.abs(az - points[n - 1].azimuth) < 1e-7) {
      return points[n - 1].elevation;
    }
    // az is strictly greater than the last sample: wrap-around between points[n-1] and points[0] (+360)
    const azPrev = points[n - 1].azimuth;
    const elPrev = points[n - 1].elevation;
    const azNext = points[0].azimuth + 360.0;
    const elNext = points[0].elevation;

    const span = azNext - azPrev;
    if (span <= 1e-7) return elPrev;
    const t = (az - azPrev) / span;
    return elPrev + t * (elNext - elPrev);
  }

  // Binary search or linear scan for flanking points
  let low = 0;
  let high = n - 1;
  while (low <= high) {
    const mid = (low + high) >> 1;
    if (points[mid].azimuth <= az) {
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  const idx0 = high;
  const idx1 = high + 1;
  const p0 = points[idx0];
  const p1 = points[idx1];

  const span = p1.azimuth - p0.azimuth;
  if (span <= 1e-7) return p0.elevation;

  const t = (az - p0.azimuth) / span;
  return p0.elevation + t * (p1.elevation - p0.elevation);
}

