import { describe, it, expect } from 'vitest';
import { generateSyntheticLunarEphemeris } from '../src/services/syntheticEphemeris';

describe('Synthetic Demonstration Ephemeris Generator (Lunar Polar Celestial Mechanics)', () => {
  it('generates consistent Sun and Earth time-series records', () => {
    const res = generateSyntheticLunarEphemeris({
      lat: -89.75,
      lon: 160.0,
      startTimeStr: '2026-11-15 00:00',
      durationDays: 7,
      stepMinutes: 30,
    });

    expect(res.sun.length).toBeGreaterThan(300);
    expect(res.earth.length).toBe(res.sun.length);
    expect(res.source).toContain('Demonstration');

    // Sun at south polar latitude should stay within low grazing elevation [-2°, +2°]
    for (const s of res.sun) {
      expect(s.elevation).toBeGreaterThanOrEqual(-2.5);
      expect(s.elevation).toBeLessThanOrEqual(2.5);
      expect(s.azimuth).toBeGreaterThanOrEqual(0);
      expect(s.azimuth).toBeLessThan(360);
    }

    // Earth at south polar ridge near 160°E should hover near horizon (-5° to +5°)
    for (const e of res.earth) {
      expect(e.elevation).toBeGreaterThanOrEqual(-8);
      expect(e.elevation).toBeLessThanOrEqual(8);
      expect(e.azimuth).toBeGreaterThanOrEqual(0);
      expect(e.azimuth).toBeLessThan(360);
    }
  });

  it('correctly models Earth meridian elevation at 0°E (Malapert Mountain ~+4° to +5°)', () => {
    const res = generateSyntheticLunarEphemeris({
      lat: -86.0,
      lon: 0.0,
      startTimeStr: '2026-11-15 00:00',
      durationDays: 1,
      stepMinutes: 60,
    });

    // At -86°S on 0°E meridian, Earth elevation is around +4°
    expect(res.earth[0].elevation).toBeGreaterThan(0);
    expect(res.earth[0].elevation).toBeLessThan(8);
  });
});

