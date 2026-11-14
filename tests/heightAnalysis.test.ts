import { describe, expect, it } from 'vitest';
import { deriveHorizonAtHeight, runMultiHeightAnalysis } from '../src/services/heightAnalysis';
import { EphemerisRecord, HorizonProfile } from '../src/types';

describe('Multi-Height Observer Analysis (Barker et al. 2021 & Figure 14)', () => {
  const mockProfile: HorizonProfile = {
    id: 'test-profile',
    name: 'Test Rim Profile',
    filename: 'test.csv',
    associatedSiteId: 'site-a',
    observerHeight: 2.0,
    points: [
      { azimuth: 0, elevation: 1.5 },
      { azimuth: 90, elevation: 1.2 },
      { azimuth: 180, elevation: 1.8 },
      { azimuth: 270, elevation: 1.0 },
    ],
    isUserSupplied: false,
    uploadedAt: '2026-11-14T00:00:00Z',
  };

  it('correctly shifts horizon elevations with increasing mast height', () => {
    // Going from 2m to 10m (+8m height) should decrease horizon obstacle elevation
    const profile10m = deriveHorizonAtHeight(mockProfile, 10, 2500);
    expect(profile10m).not.toBeNull();
    // Delta elevation should be negative (horizon lowers)
    expect(profile10m!.points[0].elevation).toBeLessThan(mockProfile.points[0].elevation);

    // Going from 2m to 1m (-1m height) should increase horizon obstacle elevation
    const profile1m = deriveHorizonAtHeight(mockProfile, 1, 2500);
    expect(profile1m!.points[0].elevation).toBeGreaterThan(mockProfile.points[0].elevation);
  });

  it('demonstrates that higher mast reduces longest dark period and increases energy', () => {
    // Generate synthetic low-polar sun records grazing around 1.3° elevation
    const sunRecords: EphemerisRecord[] = [];
    for (let i = 0; i < 48; i++) {
      const az = (i * 15) % 360;
      // Elevation varies between 0.8° and 1.8°
      const el = 1.3 + 0.5 * Math.sin((i * Math.PI) / 12);
      sunRecords.push({
        timestamp: new Date(Date.UTC(2026, 10, 15, i)).toISOString(),
        rawTime: `2026-Nov-15 ${i.toString().padStart(2, '0')}:00`,
        flag: '',
        azimuth: az,
        elevation: el,
      });
    }

    const results = runMultiHeightAnalysis(sunRecords, mockProfile);
    expect(results.length).toBe(4); // 1m, 2m, 5m, 10m

    // Height 10m should have higher or equal illumination % than 1m
    const res1m = results.find((r) => r.heightM === 1)!;
    const res10m = results.find((r) => r.heightM === 10)!;

    expect(res10m.sunlitPct).toBeGreaterThanOrEqual(res1m.sunlitPct);
    expect(res10m.totalEnergyKWh).toBeGreaterThanOrEqual(res1m.totalEnergyKWh);
    expect(res10m.longestDarkPeriodHours).toBeLessThanOrEqual(res1m.longestDarkPeriodHours);
  });
});

