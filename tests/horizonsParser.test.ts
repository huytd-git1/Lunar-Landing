import { describe, expect, it } from 'vitest';
import { parseHorizonsResponse } from '../src/services/horizonsParser';

// Documented fixture based on official JPL Horizons response for Moon-centered observer
const FIXTURE_HORIZONS_OUTPUT = `
*******************************************************************************
 Revised: July 31, 2013                  Sun                                 10
 CENTER: coord@301 (Moon Body-Fixed)
*******************************************************************************
 Date__(UT)__HR:MN     Azi____(a-app)___Elev
********************************************
$$SOE
 2026-Nov-15 00:00 *   314.426181   1.731359
 2026-Nov-15 00:30 *i  314.172343  -0.051200
 2026-Nov-15 01:00      313.918507  -1.250000
 2026-Nov-15 01:30 *m  313.664673   0.000000
 2026-Nov-15 02:00 /A  313.410842   2.154321
$$EOE
*******************************************************************************
`;

describe('Horizons Output Parser', () => {
  it('parses documented fixture with various daylight/illumination flags', () => {
    const result = parseHorizonsResponse(FIXTURE_HORIZONS_OUTPUT);
    expect(result.success).toBe(true);
    expect(result.records).toHaveLength(5);

    // Record 0: standard flag *
    expect(result.records[0].rawTime).toBe('2026-Nov-15 00:00');
    expect(result.records[0].flag).toBe('*');
    expect(result.records[0].azimuth).toBeCloseTo(314.426181, 5);
    expect(result.records[0].elevation).toBeCloseTo(1.731359, 5);
    expect(result.records[0].timestamp).toContain('2026-11-15T00:00:00');

    // Record 1: multi-char flag *i with negative elevation
    expect(result.records[1].flag).toBe('*i');
    expect(result.records[1].elevation).toBeCloseTo(-0.0512, 4);

    // Record 2: empty flag (night / no solar flag)
    expect(result.records[2].flag).toBe('');
    expect(result.records[2].elevation).toBeCloseTo(-1.25, 2);

    // Record 3: flag *m at exact zero elevation
    expect(result.records[3].flag).toBe('*m');
    expect(result.records[3].elevation).toBe(0.0);

    // Record 4: slash flag /A
    expect(result.records[4].flag).toBe('/A');
    expect(result.records[4].elevation).toBeCloseTo(2.154321, 5);
  });

  it('gracefully handles missing SOE/EOE delimiters', () => {
    const badOutput = 'No ephemeris table markers present in this error message';
    const result = parseHorizonsResponse(badOutput);
    expect(result.success).toBe(false);
    expect(result.records).toHaveLength(0);
    expect(result.error).toContain('missing $$SOE/$$EOE');
  });

  it('detects explicit error messages from Horizons API', () => {
    const errorOutput = 'Cannot interpret date: 2026-99-99 00:00';
    const result = parseHorizonsResponse(errorOutput);
    expect(result.success).toBe(false);
    expect(result.error).toContain('Cannot interpret date');
  });
});

