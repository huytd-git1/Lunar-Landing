/**
 * Coordinate and unit conversions for lunar surface observations.
 * Reference: NASA/JPL Horizons lunar geodetic coordinates (coord@301).
 * Reference Moon radius: 1737.4 km (IAU / LOLA mean sphere).
 */

/**
 * Normalizes any longitude input to East-positive [0, 360) degrees.
 * E.g.: -10° becomes 350°, 370° becomes 10°, 0° remains 0°.
 */
export function normalizeEastLongitude(lon: number): number {
  if (isNaN(lon)) return 0;
  let normalized = lon % 360;
  if (normalized < 0) {
    normalized += 360;
  }
  // Avoid -0
  return normalized === 0 ? 0 : normalized;
}

/**
 * Validates lunar coordinates with scientific guidance for south-polar exploration.
 */
export function validateCoordinates(lat: number, lon: number): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (isNaN(lat)) {
    errors.push('Latitude must be a valid number.');
  } else if (lat < -90 || lat > 90) {
    errors.push('Latitude must be between -90° and +90°.');
  } else if (lat > 0) {
    warnings.push('Selected latitude is in the Lunar Northern Hemisphere; this application specializes in the Lunar South Pole.');
  } else if (lat > -75) {
    warnings.push('Location is north of 75°S. Polar grazing illumination patterns primarily occur within the lunar polar circle (<= 85°S).');
  }

  if (isNaN(lon)) {
    errors.push('Longitude must be a valid number.');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Converts observer mast height above ground (meters) and local terrain elevation (meters)
 * into altitude in kilometers relative to the Moon's reference sphere (R = 1737.4 km),
 * as required by JPL Horizons `SITE_COORD='lon,lat,alt_km'`.
 */
export function convertObserverAltToKm(
  observerHeightAboveGroundMeters: number,
  terrainElevationAboveSphereMeters: number = 0
): number {
  const totalMeters = (terrainElevationAboveSphereMeters || 0) + (observerHeightAboveGroundMeters || 0);
  return totalMeters / 1000.0;
}

/**
 * Formats a decimal latitude with hemisphere label.
 */
export function formatLatitude(lat: number, precision: number = 4): string {
  if (isNaN(lat)) return 'N/A';
  const hemi = lat < 0 ? '°S' : lat > 0 ? '°N' : '°';
  return `${Math.abs(lat).toFixed(precision)}${hemi}`;
}

/**
 * Formats an East-positive longitude with convention label.
 */
export function formatEastLongitude(lon: number, precision: number = 4): string {
  if (isNaN(lon)) return 'N/A';
  const norm = normalizeEastLongitude(lon);
  return `${norm.toFixed(precision)}°E`;
}

