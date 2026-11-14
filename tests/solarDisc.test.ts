import { describe, expect, it } from 'vitest';
import {
  calculateSolarAngularRadiusDeg,
  calculateVisibleSolarDiscFraction,
  evaluateSunlitState,
  integrateMeanSolarVisibleFraction,
  NOMINAL_SOLAR_ANGULAR_RADIUS_DEG,
} from '../src/services/solarDisc';

describe('Finite Solar Disc Model (Gläser et al. 2014 & Equation 09)', () => {
  it('correctly calculates nominal solar angular radius at 1 AU', () => {
    const radius = calculateSolarAngularRadiusDeg(1.0);
    expect(radius).toBeCloseTo(0.266, 2);
  });

  it('matches boundary values for uniform disc visible fraction f_sun(x)', () => {
    const alpha = NOMINAL_SOLAR_ANGULAR_RADIUS_DEG; // ~0.2664 deg

    // When Sun is completely below horizon: D <= -alpha -> x <= -1 -> f = 0
    const fBelow = calculateVisibleSolarDiscFraction(0.0, alpha + 0.1, alpha);
    expect(fBelow).toBe(0.0);

    // Exact lower touch point: D = -alpha -> x = -1 -> f = 0
    const fTouchBottom = calculateVisibleSolarDiscFraction(0.0, alpha, alpha);
    expect(fTouchBottom).toBeCloseTo(0.0, 5);

    // Center on horizon: D = 0 -> x = 0 -> f = 0.5 (exactly half visible)
    const fHalf = calculateVisibleSolarDiscFraction(1.5, 1.5, alpha);
    expect(fHalf).toBeCloseTo(0.5, 5);

    // Exact upper touch point: D = +alpha -> x = +1 -> f = 1
    const fTouchTop = calculateVisibleSolarDiscFraction(alpha, 0.0, alpha);
    expect(fTouchTop).toBeCloseTo(1.0, 5);

    // Sun completely above horizon: D >= alpha -> x >= 1 -> f = 1
    const fAbove = calculateVisibleSolarDiscFraction(2.0, 0.0, alpha);
    expect(fAbove).toBe(1.0);
  });

  it('is strictly monotonic for x between -1 and 1', () => {
    const alpha = 0.2664;
    const steps = 20;
    let prevF = -1;

    for (let i = 0; i <= steps; i++) {
      const x = -1.0 + (2.0 * i) / steps;
      const d = x * alpha;
      const f = calculateVisibleSolarDiscFraction(d, 0.0, alpha);
      expect(f).toBeGreaterThanOrEqual(prevF);
      expect(f).toBeGreaterThanOrEqual(0.0);
      expect(f).toBeLessThanOrEqual(1.0);
      prevF = f;
    }
  });

  it('evaluates sunlit states under point vs finite disc models', () => {
    const alpha = 0.2664;
    // Just lower limb visible: center is -0.1 deg below horizon, but within alpha
    const sunEl = -0.1;
    const horEl = 0.0;

    // Point model: center is below horizon -> obstructed
    const pointRes = evaluateSunlitState(sunEl, horEl, 'point');
    expect(pointRes.state).toBe('obstructed');
    expect(pointRes.isSunlit).toBe(false);

    // Finite disc model: partial disc is visible -> visible
    const discRes = evaluateSunlitState(sunEl, horEl, 'finite_disc', 0.0, alpha);
    expect(discRes.visibleFraction).toBeGreaterThan(0.0);
    expect(discRes.visibleFraction).toBeLessThan(0.5);
    expect(discRes.isSunlit).toBe(true);
    expect(discRes.state).toBe('visible');

    // Threshold = 0.5 (needs at least half disc) -> obstructed
    const thresholdRes = evaluateSunlitState(sunEl, horEl, 'finite_disc', 0.5, alpha);
    expect(thresholdRes.isSunlit).toBe(false);
  });

  it('integrates mean visible solar fraction accurately using trapezoidal rule', () => {
    const timeHours = [0, 1, 2, 3, 4];
    const fractions = [0.0, 0.5, 1.0, 1.0, 0.5];
    // Integral: 0.5*(0+0.5)*1 + 0.5*(0.5+1)*1 + 0.5*(1+1)*1 + 0.5*(1+0.5)*1
    // = 0.25 + 0.75 + 1.0 + 0.75 = 2.75
    // Mean = 2.75 / 4 = 0.6875
    const mean = integrateMeanSolarVisibleFraction(timeHours, fractions);
    expect(mean).toBeCloseTo(0.6875, 4);
  });
});

