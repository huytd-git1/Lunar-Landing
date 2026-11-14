import { EphemerisRecord } from '../types';

/**
 * Parses JPL Horizons API output text (or result field from JSON output).
 * Table contains data between $$SOE and $$EOE markers.
 * Standard format for Quantities 4 (Az-El):
 *  Date__(UT)__HR:MN     Azi____(a-app)___Elev
 *  2026-Nov-15 00:00 *i  114.477644  -0.100084
 */
export function parseHorizonsResponse(rawOutput: string): {
  success: boolean;
  records: EphemerisRecord[];
  error?: string;
  metadata?: {
    center?: string;
    target?: string;
    timeRange?: string;
  };
} {
  if (!rawOutput || typeof rawOutput !== 'string') {
    return {
      success: false,
      records: [],
      error: 'Empty or invalid response from Horizons service.',
    };
  }

  // Check for explicit error messages from Horizons
  if (rawOutput.includes('Cannot interpret date') || rawOutput.includes('No matches found')) {
    return {
      success: false,
      records: [],
      error: `Horizons API error: ${rawOutput.slice(0, 300)}`,
    };
  }

  const startIdx = rawOutput.indexOf('$$SOE');
  const endIdx = rawOutput.indexOf('$$EOE');

  if (startIdx === -1 || endIdx === -1) {
    // Check if there is an error block
    const errorMatch = rawOutput.match(/Error:\s*(.*)/i) || rawOutput.match(/!+\s*(.*)/);
    return {
      success: false,
      records: [],
      error: errorMatch
        ? `Horizons error: ${errorMatch[1]}`
        : 'Horizons output missing $$SOE/$$EOE ephemeris delimiters. The server might have returned an error page.',
    };
  }

  const block = rawOutput.substring(startIdx + 5, endIdx).trim();
  const lines = block.split(/\r?\n/).filter((l) => l.trim().length > 0);

  const records: EphemerisRecord[] = [];
  // Regex:
  // Group 1: Date (e.g. "2026-Nov-15 00:00" or "2026-11-15 00:00")
  // Group 2: Optional flags (*, *i, *m, /A, etc.)
  // Group 3: Azimuth float
  // Group 4: Elevation float
  const lineRegex = /^\s*(\d{4}-[A-Za-z0-9]{2,3}-\d{2}\s+\d{2}:\d{2})\s*([A-Za-z*\/]*)\s+([+-]?\d+\.?\d*)\s+([+-]?\d+\.?\d*)/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(lineRegex);
    if (match) {
      const rawTime = match[1].trim();
      const flag = match[2].trim();
      const az = parseFloat(match[3]);
      const el = parseFloat(match[4]);

      // Parse UTC timestamp
      let isoTimestamp: string;
      const parsedDate = new Date(`${rawTime} UTC`);
      if (!isNaN(parsedDate.getTime())) {
        isoTimestamp = parsedDate.toISOString();
      } else {
        // Fallback standard format
        isoTimestamp = rawTime;
      }

      records.push({
        timestamp: isoTimestamp,
        rawTime,
        flag,
        azimuth: az,
        elevation: el,
      });
    }
  }

  if (records.length === 0) {
    return {
      success: false,
      records: [],
      error: `Found $$SOE block but failed to parse valid AZ-EL data lines (${lines.length} lines inspected).`,
    };
  }

  return {
    success: true,
    records,
  };
}

