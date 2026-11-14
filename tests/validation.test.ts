import { describe, expect, it } from 'vitest';
import bundledData from '../src/data/bundledEphemeris.json';

/**
 * Independent scientific validation:
 * Verifies that the astronomical ephemerides conform to celestial mechanics
 * and known lunar physical constants.
 *
 * NOTE: Software unit tests verify code logic and parsing.
 * Scientific validation verifies physical plausibility against lunar orbital geometry.
 */
describe('Independent Scientific Validation & Physical Bounds', () => {
  const siteA = bundledData.sites['site-a'];
  const siteB = bundledData.sites['site-b'];

  it('verifies solar elevation limits near lunar south pole (-89.75° Lat)', () => {
    // The Moon's obliquity to the ecliptic is ~1.5424°.
    // At latitude -89.75° (0.25° from the South Pole):
    // Maximum possible solar elevation is ~ (90° - 89.75°) + 1.5424° = 1.7924°.
    // Minimum solar elevation is ~ 0.25° - 1.5424° = -1.2924°.
    const sunPoints = siteA.sun;
    const elevations = sunPoints.map((p: any) => p.elevation);
    const maxEl = Math.max(...elevations);
    const minEl = Math.min(...elevations);

    // Verify peak elevation does not exceed the theoretical geometric ceiling
    expect(maxEl).toBeLessThanOrEqual(1.80);
    // Verify peak elevation is within expected physical range
    expect(maxEl).toBeGreaterThan(1.60);

    // Verify minimum elevation does not drop below theoretical floor
    expect(minEl).toBeGreaterThanOrEqual(-1.35);
  });

  it('verifies diurnal azimuthal progression of the Sun at polar latitudes', () => {
    // Over a 7-day period (168 hours), the Moon completes approximately 168 / (29.53 * 24) = ~23.7% of a synodic rotation.
    // In azimuth, the Sun moves approximately 360° / 29.53 days ≈ 12.19° per Earth day, or ~0.508° per hour.
    const sunPoints = siteA.sun;
    const p0 = sunPoints[0];
    const p1 = sunPoints[1]; // 30 min step
    const azDiff = Math.abs(p0.azimuth - p1.azimuth);

    // Over 30 minutes, azimuth delta should be approximately 0.254°
    expect(azDiff).toBeCloseTo(0.254, 1);
  });

  it('verifies Earth line-of-sight geometry on Earth-facing meridian (Site Beta: 0°E, -86°S)', () => {
    // Malapert Mountain is located at 0°E longitude (the sub-Earth meridian).
    // At -86.0° latitude, the unperturbed geometric elevation of Earth above the horizon is 90° - 86.0° = +4.0°.
    // Accounting for lunar optical and physical libration (~±6.7° in latitude, ~±8° in longitude),
    // during this November 2026 epoch, libration tilts the lunar south pole toward Earth,
    // elevating the mean Earth angle to ~5.04°.
    const earthPoints = siteB.earth;
    const elevations = earthPoints.map((p: any) => p.elevation);
    const meanEl = elevations.reduce((a: number, b: number) => a + b, 0) / elevations.length;

    expect(meanEl).toBeGreaterThan(0.0);
    expect(meanEl).toBeLessThan(8.0);
    // Verifies that mean elevation is approximately 5.04° (4.0° base + ~1.04° libration tilt)
    expect(meanEl).toBeCloseTo(5.04, 1);
  });
});
