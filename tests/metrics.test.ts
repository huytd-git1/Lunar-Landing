import { describe, expect, it } from 'vitest';
import { calculateSiteMetrics } from '../src/services/metrics';
import { CalculatedPoint } from '../src/types';

function createMockPoint(partial: Partial<CalculatedPoint>): CalculatedPoint {
  const sunEl = partial.sunElevation ?? 2.0;
  const sunHor = partial.sunHorizonElevation ?? 0.0;
  const earthEl = partial.earthElevation ?? 5.0;
  const earthHor = partial.earthHorizonElevation ?? 0.0;
  const sunVis = partial.sunVisible ?? (sunEl > sunHor ? 'visible' : 'obstructed');
  const earthVis = partial.earthVisible ?? (earthEl > earthHor ? 'visible' : 'obstructed');

  return {
    timestamp: '2026-11-15T00:00:00.000Z',
    rawTime: '2026-Nov-15 00:00',
    stepMinutes: 60,
    sunAzimuth: 100,
    sunElevation: sunEl,
    sunHorizonElevation: sunHor,
    sunClearance: sunEl - sunHor,
    sunVisible: sunVis,
    solarVisibleFraction: sunVis === 'visible' ? 1.0 : 0.0,
    sunlitState: sunVis,
    earthAzimuth: 200,
    earthElevation: earthEl,
    earthHorizonElevation: earthHor,
    earthClearance: earthEl - earthHor,
    earthVisible: earthVis,
    earthCleared: true,
    bothVisible: sunVis === 'visible' && earthVis === 'visible',
    pvPowerWatts: sunVis === 'visible' ? 500 : 0,
    cumulativeEnergyWh: 0,
    solarVectorENU: [0, 1, 0],
    ...partial,
  };
}

describe('Duration Metrics Calculation', () => {
  it('integrates over actual time intervals and handles all-visible and all-obstructed cases', () => {
    // 3 samples spaced by 1 hour (2 intervals of 1 hr = 2 hrs total)
    const allVisiblePoints: CalculatedPoint[] = [
      createMockPoint({
        timestamp: '2026-11-15T00:00:00.000Z',
        rawTime: '2026-Nov-15 00:00',
        sunElevation: 2.0,
        earthElevation: 5.0,
      }),
      createMockPoint({
        timestamp: '2026-11-15T01:00:00.000Z',
        rawTime: '2026-Nov-15 01:00',
        sunElevation: 2.1,
        earthElevation: 5.1,
      }),
      createMockPoint({
        timestamp: '2026-11-15T02:00:00.000Z',
        rawTime: '2026-Nov-15 02:00',
        sunElevation: 2.2,
        earthElevation: 5.2,
      }),
    ];

    const metrics = calculateSiteMetrics('test-site', 'Test Site', 'real_geometric', allVisiblePoints);
    expect(metrics.totalMissionHours).toBeCloseTo(2.0, 2);
    expect(metrics.totalValidHours).toBeCloseTo(2.0, 2);
    expect(metrics.dataCoveragePct).toBe(100);
    expect(metrics.sunVisibleHours).toBeCloseTo(2.0, 2);
    expect(metrics.sunVisiblePct).toBe(100);
    expect(metrics.longestSunObstructedHours).toBe(0);
    expect(metrics.earthVisibleHours).toBeCloseTo(2.0, 2);
    expect(metrics.bothVisibleHours).toBeCloseTo(2.0, 2);
  });

  it('interpolates transition fractions across elevation margins', () => {
    // 2 samples spaced by 2 hours.
    // At t=0: Sun elevation = +1.0° (margin = +1.0°)
    // At t=2: Sun elevation = -1.0° (margin = -1.0°)
    // Symmetrical crossing: should be visible for 1.0 hr, obstructed for 1.0 hr
    const transitionPoints: CalculatedPoint[] = [
      createMockPoint({
        timestamp: '2026-11-15T00:00:00.000Z',
        rawTime: '2026-Nov-15 00:00',
        stepMinutes: 120,
        sunElevation: 1.0,
        sunVisible: 'visible',
        sunlitState: 'visible',
      }),
      createMockPoint({
        timestamp: '2026-11-15T02:00:00.000Z',
        rawTime: '2026-Nov-15 02:00',
        stepMinutes: 120,
        sunElevation: -1.0,
        sunVisible: 'obstructed',
        sunlitState: 'obstructed',
      }),
    ];

    const metrics = calculateSiteMetrics('site-trans', 'Transition Site', 'real_geometric', transitionPoints);
    expect(metrics.totalMissionHours).toBeCloseTo(2.0, 2);
    expect(metrics.sunVisibleHours).toBeCloseTo(1.0, 2);
    expect(metrics.sunVisiblePct).toBeCloseTo(50.0, 1);
    expect(metrics.longestSunObstructedHours).toBeCloseTo(1.0, 2);
  });

  it('handles missing/unknown data without classifying it as obstructed', () => {
    // Point with unknown visibility
    const pointsWithMissing: CalculatedPoint[] = [
      createMockPoint({
        timestamp: '2026-11-15T00:00:00.000Z',
        rawTime: '2026-Nov-15 00:00',
        sunElevation: 2.0,
        sunVisible: 'visible',
      }),
      createMockPoint({
        timestamp: '2026-11-15T01:00:00.000Z',
        rawTime: '2026-Nov-15 01:00',
        sunElevation: NaN,
        sunVisible: 'unknown',
        sunlitState: 'unknown',
      }),
      createMockPoint({
        timestamp: '2026-11-15T02:00:00.000Z',
        rawTime: '2026-Nov-15 02:00',
        sunElevation: 2.0,
        sunVisible: 'visible',
      }),
    ];

    const metrics = calculateSiteMetrics('site-gap', 'Gap Site', 'real_geometric', pointsWithMissing);
    // Interval 0->1 is invalid, interval 1->2 is invalid (contains unknown).
    expect(metrics.totalMissionHours).toBeCloseTo(2.0, 2);
    expect(metrics.dataCoveragePct).toBe(0); // 0 valid hours out of 2
    expect(metrics.sunVisibleHours).toBe(0);
    // Unknown data MUST NOT become 'obstructed'
    expect(metrics.longestSunObstructedHours).toBe(0);
  });
});
