import { describe, expect, it } from 'vitest';
import {
  evaluateEarthClearance,
  evaluatePointVisibility,
} from '../src/services/visibility';

describe('Point-Object Visibility Evaluation', () => {
  it('correctly classifies above-horizon, below-horizon, and equality boundary cases', () => {
    // Above horizon: elevation > horizonElevation -> 'visible'
    expect(evaluatePointVisibility(1.5, 1.0)).toBe('visible');
    expect(evaluatePointVisibility(0.01, 0.0)).toBe('visible');

    // Below horizon: elevation < horizonElevation -> 'obstructed'
    expect(evaluatePointVisibility(-0.5, 0.0)).toBe('obstructed');
    expect(evaluatePointVisibility(1.2, 1.8)).toBe('obstructed');

    // Equality boundary case: elevation == horizonElevation
    // Point-object approximation rule: visible(t) = object_elevation(t) > horizon_elevation(t)
    // Equality does not exceed horizon, thus considered obstructed / grazing boundary
    expect(evaluatePointVisibility(1.5, 1.5)).toBe('obstructed');
    expect(evaluatePointVisibility(0.0, 0.0)).toBe('obstructed');
  });

  it('handles NaN and missing values as unknown', () => {
    expect(evaluatePointVisibility(NaN, 0.0)).toBe('unknown');
    expect(evaluatePointVisibility(1.5, NaN)).toBe('unknown');
  });

  it('evaluates optional Earth clearance angle', () => {
    // Earth elevation = 3.0, horizon = 2.0, clearance = 0.5 -> margin = 1.0 > 0.5 -> true
    expect(evaluateEarthClearance(3.0, 2.0, 0.5)).toBe(true);

    // Earth elevation = 2.3, horizon = 2.0, clearance = 0.5 -> margin = 0.3 < 0.5 -> false
    expect(evaluateEarthClearance(2.3, 2.0, 0.5)).toBe(false);

    // Exact equality with clearance: margin == clearance -> not strictly greater -> false
    expect(evaluateEarthClearance(2.5, 2.0, 0.5)).toBe(false);

    // Zero clearance angle equals basic point-object check
    expect(evaluateEarthClearance(2.01, 2.0, 0.0)).toBe(true);
  });
});

