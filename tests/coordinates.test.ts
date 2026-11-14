import { describe, expect, it } from 'vitest';
import {
  convertObserverAltToKm,
  formatEastLongitude,
  formatLatitude,
  normalizeEastLongitude,
  validateCoordinates,
} from '../src/services/coordinates';

describe('Coordinate and Unit Conversions', () => {
  it('normalizes East-positive longitude correctly', () => {
    expect(normalizeEastLongitude(0)).toBe(0);
    expect(normalizeEastLongitude(160.0)).toBe(160.0);
    expect(normalizeEastLongitude(360.0)).toBe(0);
    expect(normalizeEastLongitude(-10.0)).toBe(350.0);
    expect(normalizeEastLongitude(-180.0)).toBe(180.0);
    expect(normalizeEastLongitude(370.0)).toBe(10.0);
    expect(normalizeEastLongitude(-720.0)).toBe(0);
  });

  it('validates coordinates with south-polar exploration boundaries', () => {
    // Valid polar site
    const polarSite = validateCoordinates(-89.5, 120.0);
    expect(polarSite.valid).toBe(true);
    expect(polarSite.errors).toHaveLength(0);
    expect(polarSite.warnings).toHaveLength(0);

    // Non-polar latitude warning
    const midLatSite = validateCoordinates(-60.0, 45.0);
    expect(midLatSite.valid).toBe(true);
    expect(midLatSite.warnings.length).toBeGreaterThan(0);
    expect(midLatSite.warnings[0]).toContain('75°S');

    // Northern hemisphere warning
    const northSite = validateCoordinates(25.0, 0.0);
    expect(northSite.valid).toBe(true);
    expect(northSite.warnings.some((w) => w.includes('Northern Hemisphere'))).toBe(true);

    // Out-of-range latitude error
    const invalidLat = validateCoordinates(-95.0, 0.0);
    expect(invalidLat.valid).toBe(false);
    expect(invalidLat.errors.length).toBeGreaterThan(0);
  });

  it('converts observer mast height and terrain elevation to kilometers', () => {
    // Rover mast height 2.0 m on 0 elevation terrain
    expect(convertObserverAltToKm(2.0, 0)).toBeCloseTo(0.002, 6);

    // Lander mast 5.0 m on Malapert Mountain (+5000 m relative to reference sphere)
    expect(convertObserverAltToKm(5.0, 5000)).toBeCloseTo(5.005, 6);

    // Default 0 terrain
    expect(convertObserverAltToKm(2.5)).toBeCloseTo(0.0025, 6);
  });

  it('formats coordinate labels clearly', () => {
    expect(formatLatitude(-89.75)).toBe('89.7500°S');
    expect(formatLatitude(12.3456)).toBe('12.3456°N');
    expect(formatEastLongitude(160.0)).toBe('160.0000°E');
    expect(formatEastLongitude(-20.0)).toBe('340.0000°E');
  });
});

