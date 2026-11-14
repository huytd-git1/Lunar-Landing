import { describe, expect, it } from 'vitest';
import {
  interpolateHorizonElevation,
  parseHorizonCsv,
} from '../src/services/horizonProfile';
import { HorizonProfile } from '../src/types';

describe('Horizon Profile and Circular Interpolation', () => {
  const sampleCsv = `
# Sample local horizon profile
azimuth_deg,horizon_elevation_deg
0.0, 1.0
90.0, 2.0
180.0, 3.0
270.0, 4.0
`;

  it('parses valid CSV and sorts points ascending', () => {
    const result = parseHorizonCsv(sampleCsv);
    expect(result.valid).toBe(true);
    expect(result.points).toHaveLength(4);
    expect(result.points[0].azimuth).toBe(0.0);
    expect(result.points[0].elevation).toBe(1.0);
    expect(result.points[3].azimuth).toBe(270.0);
    expect(result.points[3].elevation).toBe(4.0);
  });

  it('handles duplicate azimuths by averaging elevations', () => {
    const duplicateCsv = `
azimuth_deg,horizon_elevation_deg
10.0, 2.0
10.0, 4.0
50.0, 1.5
`;
    const result = parseHorizonCsv(duplicateCsv);
    expect(result.valid).toBe(true);
    expect(result.points).toHaveLength(2);
    expect(result.points[0].azimuth).toBe(10.0);
    expect(result.points[0].elevation).toBe(3.0); // (2.0 + 4.0) / 2
    expect(result.warnings.some((w) => w.includes('Duplicate azimuth'))).toBe(true);
  });

  it('performs linear interpolation within internal bounds', () => {
    const parsed = parseHorizonCsv(sampleCsv);
    const profile: HorizonProfile = {
      id: 'test',
      name: 'Test',
      filename: 'test.csv',
      associatedSiteId: 'site-1',
      observerHeight: 2.0,
      points: parsed.points,
      isUserSupplied: true,
      uploadedAt: '',
    };

    // Exact matches
    expect(interpolateHorizonElevation(profile, 0.0)).toBeCloseTo(1.0, 5);
    expect(interpolateHorizonElevation(profile, 90.0)).toBeCloseTo(2.0, 5);

    // Midpoint: 45° between 0° (1.0) and 90° (2.0) -> 1.5
    expect(interpolateHorizonElevation(profile, 45.0)).toBeCloseTo(1.5, 5);

    // 135° between 90° (2.0) and 180° (3.0) -> 2.5
    expect(interpolateHorizonElevation(profile, 135.0)).toBeCloseTo(2.5, 5);
  });

  it('performs circular interpolation across the 0°/360° boundary', () => {
    // Points at 350° (elevation 4.0) and 10° (elevation 2.0)
    const circularProfile: HorizonProfile = {
      id: 'circ',
      name: 'Circular Test',
      filename: 'circ.csv',
      associatedSiteId: 'site-1',
      observerHeight: 2.0,
      points: [
        { azimuth: 10.0, elevation: 2.0 },
        { azimuth: 100.0, elevation: 1.0 },
        { azimuth: 350.0, elevation: 4.0 },
      ],
      isUserSupplied: true,
      uploadedAt: '',
    };

    // Point at 0° / 360° is exactly halfway between 350° and 10° (span of 20°)
    // Elevation should be midpoint of 4.0 and 2.0 -> 3.0
    const elAtZero = interpolateHorizonElevation(circularProfile, 0.0);
    expect(elAtZero).toBeCloseTo(3.0, 4);

    // Point at 355°: 5° past 350° (a quarter of 20° span) -> 4.0 - 0.25*(4-2) = 3.5
    const elAt355 = interpolateHorizonElevation(circularProfile, 355.0);
    expect(elAt355).toBeCloseTo(3.5, 4);

    // Point at 5°: 5° before 10° -> 2.5
    const elAt5 = interpolateHorizonElevation(circularProfile, 5.0);
    expect(elAt5).toBeCloseTo(2.5, 4);
  });

  it('returns 0.0 for geometric horizon when profile is null or undefined', () => {
    expect(interpolateHorizonElevation(null, 123.45)).toBe(0.0);
    expect(interpolateHorizonElevation(undefined, 0.0)).toBe(0.0);
  });
});
