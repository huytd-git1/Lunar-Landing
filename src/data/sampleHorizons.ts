import { HorizonProfile } from '../types';
import { parseHorizonCsv } from '../services/horizonProfile';

export const SHACKLETON_CSV = `# Horizon Profile: Illustrative Shackleton Connecting Ridge Vicinity
# DEM Source: LRO LOLA DEM (South Pole 20m/px float product)
# Reference Surface: Lunar Sphere R = 1737.4 km
# Search Radius: 120 km with lunar curvature correction
# Observer Height Above Ground: 2.0 meters
# Note: User-supplied illustrative profile for prototype testing.
azimuth_deg,horizon_elevation_deg
0.0,1.15
15.0,1.40
30.0,1.85
45.0,2.30
60.0,2.10
75.0,1.65
90.0,1.20
105.0,0.95
120.0,0.80
135.0,0.75
150.0,1.05
165.0,1.45
180.0,1.90
195.0,2.40
210.0,2.65
225.0,2.15
240.0,1.50
255.0,0.90
270.0,0.65
285.0,0.55
300.0,0.60
315.0,0.80
330.0,1.00
345.0,1.10`;

export const MALAPERT_CSV = `# Horizon Profile: Illustrative Malapert Mountain Vicinity
# DEM Source: LRO LOLA DEM Reference Topography
# Reference Surface: Lunar Sphere R = 1737.4 km
# Search Radius: 150 km with lunar curvature correction
# Observer Height Above Ground: 2.0 meters
# Note: User-supplied illustrative profile for prototype testing. Prominent northern clearance towards Earth.
azimuth_deg,horizon_elevation_deg
0.0,0.10
15.0,0.15
30.0,0.30
45.0,0.60
60.0,0.95
75.0,1.30
90.0,1.80
105.0,2.20
120.0,2.60
135.0,2.90
150.0,3.25
165.0,3.40
180.0,3.10
195.0,2.75
210.0,2.30
225.0,1.75
240.0,1.20
255.0,0.70
270.0,0.35
285.0,0.15
300.0,0.05
315.0,-0.05
330.0,-0.10
345.0,0.00`;

export const DE_GERLACHE_CSV = `# Horizon Profile: Illustrative de Gerlache Rim Vicinity
# DEM Source: LRO LOLA DEM Reference Topography
# Reference Surface: Lunar Sphere R = 1737.4 km
# Search Radius: 100 km with lunar curvature correction
# Observer Height Above Ground: 2.0 meters
# Note: User-supplied illustrative profile for prototype testing. Significant terrain masking toward adjacent peaks.
azimuth_deg,horizon_elevation_deg
0.0,1.80
20.0,2.10
40.0,2.50
60.0,2.20
80.0,1.70
100.0,1.30
120.0,1.10
140.0,1.40
160.0,1.90
180.0,2.40
200.0,2.80
220.0,2.50
240.0,1.90
260.0,1.40
280.0,1.20
300.0,1.30
320.0,1.50
340.0,1.70`;

export function createDefaultProfile(
  id: string,
  name: string,
  filename: string,
  siteId: string,
  csvText: string,
  demSource: string
): HorizonProfile {
  const parsed = parseHorizonCsv(csvText);
  return {
    id,
    name,
    filename,
    associatedSiteId: siteId,
    observerHeight: 2.0,
    points: parsed.points,
    isUserSupplied: true,
    demSource,
    description: 'Pre-computed illustrative terrain horizon derived from LOLA polar DEM',
    uploadedAt: '2026-11-14T00:00:00.000Z',
  };
}

