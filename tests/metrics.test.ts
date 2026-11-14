import { describe, expect, it } from 'vitest';
import { calculateSiteMetrics } from '../src/services/metrics';
import { CalculatedPoint } from '../src/types';

describe('Duration Metrics Calculation', () => {
  it('integrates over actual time intervals and handles all-visible and all-obstructed cases', () => {
    // 3 samples spaced by 1 hour (2 intervals of 1 hr = 2 hrs total)
    const allVisiblePoints: CalculatedPoint[] = [
      {
        timestamp: '2026-11-15T00:00:00.000Z',
        rawTime: '2026-Nov-15 00:00',
        stepMinutes: 60,
        sunAzimuth: 100,
        sunElevation: 2.0,
        sunHorizonElevation: 0.0,
        sunVisible: 'visible',
        earthAzimuth: 200,
        earthElevation: 5.0,
        earthHorizonElevation: 0.0,
        earthVisible: 'visible',
        earthCleared: true,
        bothVisible: true,
      },
      {
        timestamp: '2026-11-15T01:00:00.000Z',
        rawTime: '2026-Nov-15 01:00',
        stepMinutes: 60,
        sunAzimuth: 101,
        sunElevation: 2.1,
        sunHorizonElevation: 0.0,
        sunVisible: 'visible',
        earthAzimuth: 200,
        earthElevation: 5.1,
        earthHorizonElevation: 0.0,
        earthVisible: 'visible',
        earthCleared: true,
        bothVisible: true,
      },
      {
        timestamp: '2026-11-15T02:00:00.000Z',
        rawTime: '2026-Nov-15 02:00',
        stepMinutes: 60,
        sunAzimuth: 102,
        sunElevation: 2.2,
        sunHorizonElevation: 0.0,
        sunVisible: 'visible',
        earthAzimuth: 200,
        earthElevation: 5.2,
        earthHorizonElevation: 0.0,
        earthVisible: 'visible',
        earthCleared: true,
        bothVisible: true,
      },
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
      {
        timestamp: '2026-11-15T00:00:00.000Z',
        rawTime: '2026-Nov-15 00:00',
        stepMinutes: 120,
        sunAzimuth: 50,
        sunElevation: 1.0,
        sunHorizonElevation: 0.0,
        sunVisible: 'visible',
        earthAzimuth: 180,
        earthElevation: 3.0,
        earthHorizonElevation: 0.0,
        earthVisible: 'visible',
        earthCleared: true,
        bothVisible: true,
      },
      {
        timestamp: '2026-11-15T02:00:00.000Z',
        rawTime: '2026-Nov-15 02:00',
        stepMinutes: 120,
        sunAzimuth: 52,
        sunElevation: -1.0,
        sunHorizonElevation: 0.0,
        sunVisible: 'obstructed',
        earthAzimuth: 180,
        earthElevation: 3.0,
        earthHorizonElevation: 0.0,
        earthVisible: 'visible',
        earthCleared: true,
        bothVisible: false,
      },
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
      {
        timestamp: '2026-11-15T00:00:00.000Z',
        rawTime: '2026-Nov-15 00:00',
        stepMinutes: 60,
        sunAzimuth: 10,
        sunElevation: 2.0,
        sunHorizonElevation: 0.0,
        sunVisible: 'visible',
        earthAzimuth: 180,
        earthElevation: 2.0,
        earthHorizonElevation: 0.0,
        earthVisible: 'visible',
        earthCleared: true,
        bothVisible: true,
      },
      {
        timestamp: '2026-11-15T01:00:00.000Z',
        rawTime: '2026-Nov-15 01:00',
        stepMinutes: 60,
        sunAzimuth: 12,
        sunElevation: NaN,
        sunHorizonElevation: 0.0,
        sunVisible: 'unknown',
        earthAzimuth: 180,
        earthElevation: 2.0,
        earthHorizonElevation: 0.0,
        earthVisible: 'visible',
        earthCleared: true,
        bothVisible: false,
      },
      {
        timestamp: '2026-11-15T02:00:00.000Z',
        rawTime: '2026-Nov-15 02:00',
        stepMinutes: 60,
        sunAzimuth: 14,
        sunElevation: 2.0,
        sunHorizonElevation: 0.0,
        sunVisible: 'visible',
        earthAzimuth: 180,
        earthElevation: 2.0,
        earthHorizonElevation: 0.0,
        earthVisible: 'visible',
        earthCleared: true,
        bothVisible: true,
      },
    ];

    const metrics = calculateSiteMetrics('site-missing', 'Missing Site', 'real_geometric', pointsWithMissing);
    expect(metrics.totalMissionHours).toBeCloseTo(2.0, 2);
    // Interval 0->1 involves unknown, interval 1->2 involves unknown: total valid is 0
    expect(metrics.totalValidHours).toBe(0);
    expect(metrics.dataCoveragePct).toBe(0);
    // Crucially: longest obstruction must be 0, NOT 2 hours
    expect(metrics.longestSunObstructedHours).toBe(0);
  });
});

