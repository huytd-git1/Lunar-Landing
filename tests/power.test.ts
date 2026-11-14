import { describe, expect, it } from 'vitest';
import {
  calculateIncidenceCosine,
  calculateInstantaneousPvPower,
  calculatePanelNormalENU,
  calculateSolarUnitVectorENU,
  integrateCumulativeEnergyWh,
  SOLAR_CONSTANT_IRRADIANCE_W_M2,
} from '../src/services/power';

describe('Photovoltaic Power Model (Gläser 2014 & Equation 14, 16)', () => {
  it('correctly calculates solar unit vector in ENU coordinates', () => {
    // Due North (Azimuth = 0 deg, Elevation = 0 deg)
    const northVec = calculateSolarUnitVectorENU(0, 0);
    expect(northVec[0]).toBeCloseTo(0, 5); // East = 0
    expect(northVec[1]).toBeCloseTo(1, 5); // North = 1
    expect(northVec[2]).toBeCloseTo(0, 5); // Up = 0

    // Due East (Azimuth = 90 deg, Elevation = 0 deg)
    const eastVec = calculateSolarUnitVectorENU(90, 0);
    expect(eastVec[0]).toBeCloseTo(1, 5); // East = 1
    expect(eastVec[1]).toBeCloseTo(0, 5); // North = 0
    expect(eastVec[2]).toBeCloseTo(0, 5); // Up = 0

    // Zenith (Elevation = 90 deg)
    const zenithVec = calculateSolarUnitVectorENU(45, 90);
    expect(zenithVec[0]).toBeCloseTo(0, 5);
    expect(zenithVec[1]).toBeCloseTo(0, 5);
    expect(zenithVec[2]).toBeCloseTo(1, 5); // Up = 1
  });

  it('demonstrates superior geometric efficiency of vertical tracking panels in polar regions', () => {
    // Polar sun at low elevation: el = 1.5 deg, az = 60 deg
    const sunEl = 1.5;
    const sunAz = 60.0;
    const sVec = calculateSolarUnitVectorENU(sunAz, sunEl);

    // 1. Tracking vertical panel: normal is oriented horizontally facing azimuth 60
    const nTrack = calculatePanelNormalENU({ orientation: 'tracking_vertical', areaM2: 2, efficiency: 0.28 }, sunAz);
    const cosTrack = calculateIncidenceCosine(nTrack, sVec);
    // cos(theta_i) = cos(1.5 deg) ≈ 0.99965 (near 100%!)
    expect(cosTrack).toBeCloseTo(Math.cos((1.5 * Math.PI) / 180), 4);
    expect(cosTrack).toBeGreaterThan(0.999);

    // 2. Horizontal panel: normal points straight Up [0, 0, 1]
    const nHoriz = calculatePanelNormalENU({ orientation: 'horizontal', areaM2: 2, efficiency: 0.28 }, sunAz);
    const cosHoriz = calculateIncidenceCosine(nHoriz, sVec);
    // cos(theta_i) = sin(1.5 deg) ≈ 0.02618 (extremely poor, only ~2.6% capture!)
    expect(cosHoriz).toBeCloseTo(Math.sin((1.5 * Math.PI) / 180), 4);
    expect(cosHoriz).toBeLessThan(0.03);

    // Consequence on power: tracking vertical produces ~38x more power at 1.5 deg elevation
    const powerTrack = calculateInstantaneousPvPower(sunAz, sunEl, 1.0, {
      orientation: 'tracking_vertical',
      areaM2: 2.0,
      efficiency: 0.28,
    });
    const powerHoriz = calculateInstantaneousPvPower(sunAz, sunEl, 1.0, {
      orientation: 'horizontal',
      areaM2: 2.0,
      efficiency: 0.28,
    });

    const expectedTrackPower = SOLAR_CONSTANT_IRRADIANCE_W_M2 * 2.0 * 0.28 * 1.0 * cosTrack;
    expect(powerTrack.powerWatts).toBeCloseTo(expectedTrackPower, 1);
    expect(powerTrack.powerWatts / powerHoriz.powerWatts).toBeGreaterThan(35);
  });

  it('scales linearly with partial visible solar disc fraction f_sun', () => {
    const config = { orientation: 'tracking_vertical' as const, areaM2: 2.0, efficiency: 0.28 };
    const fullPower = calculateInstantaneousPvPower(45, 2.0, 1.0, config);
    const halfPower = calculateInstantaneousPvPower(45, 2.0, 0.5, config);
    const zeroPower = calculateInstantaneousPvPower(45, 2.0, 0.0, config);

    expect(halfPower.powerWatts).toBeCloseTo(fullPower.powerWatts * 0.5, 2);
    expect(zeroPower.powerWatts).toBe(0);
  });

  it('integrates cumulative energy (Wh / kWh) using actual seconds delta', () => {
    // 2 hours at constant 500 Watts:
    // Timestamps 1 hour apart: 0h, 1h, 2h
    const timestamps = [
      '2026-11-15T00:00:00Z',
      '2026-11-15T01:00:00Z',
      '2026-11-15T02:00:00Z',
    ];
    const powers = [500, 500, 500];

    const energy = integrateCumulativeEnergyWh(timestamps, powers);
    // 500 W for 2 hours = 1000 Wh = 1.0 kWh
    expect(energy.totalEnergyWh).toBeCloseTo(1000, 1);
    expect(energy.totalEnergyKWh).toBeCloseTo(1.0, 2);
    expect(energy.cumulativeSeriesWh[1]).toBeCloseTo(500, 1);
    expect(energy.cumulativeSeriesWh[2]).toBeCloseTo(1000, 1);
  });
});

