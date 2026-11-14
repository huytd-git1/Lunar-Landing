export type VisibilityState = 'visible' | 'obstructed' | 'unknown';

export type DataMode = 'real_geometric' | 'real_terrain' | 'demo';

export interface SiteConfig {
  id: string;
  name: string;
  latitude: number; // degrees [-90, +90], expected south polar <= -75
  longitude: number; // East-positive degrees [0, 360)
  observerHeight: number; // observer height above local ground in meters
  terrainElevation?: number; // terrain elevation above R=1737.4 km sphere in meters
  horizonProfile?: HorizonProfile | null;
  color: string;
  isCustom?: boolean;
}

export interface HorizonPoint {
  azimuth: number; // [0, 360) deg
  elevation: number; // deg
}

export interface HorizonProfile {
  id: string;
  name: string;
  filename: string;
  associatedSiteId: string;
  observerHeight: number; // meters
  points: HorizonPoint[];
  isUserSupplied: boolean;
  demSource?: string;
  description?: string;
  uploadedAt: string;
}

export interface MissionSettings {
  startTime: string; // 'YYYY-MM-DD HH:mm' UTC
  durationDays: number; // e.g. 7 days
  stepSize: string; // '15m' | '30m' | '1h' | '2h'
  earthClearanceAngle: number; // degrees, e.g. 0.5
}

export interface EphemerisRecord {
  timestamp: string; // ISO 8601 UTC
  rawTime: string; // e.g. '2026-Nov-15 00:00'
  flag: string;
  azimuth: number; // deg
  elevation: number; // deg
}

export interface CalculatedPoint {
  timestamp: string; // ISO UTC
  rawTime: string;
  stepMinutes: number;
  sunAzimuth: number;
  sunElevation: number;
  sunHorizonElevation: number;
  sunVisible: VisibilityState;
  earthAzimuth: number;
  earthElevation: number;
  earthHorizonElevation: number;
  earthVisible: VisibilityState;
  earthCleared: boolean;
  bothVisible: boolean;
}

export interface SiteMetrics {
  siteId: string;
  siteName: string;
  dataMode: DataMode;
  dataCoveragePct: number; // % of mission with valid data
  totalMissionHours: number;
  totalValidHours: number;
  sunVisibleHours: number;
  sunVisiblePct: number;
  longestSunObstructedHours: number;
  earthVisibleHours: number;
  earthVisiblePct: number;
  longestEarthObstructedHours: number;
  bothVisibleHours: number;
  bothVisiblePct: number;
  earthClearHours: number;
  earthClearPct: number;
}

export interface SiteAnalysisResult {
  site: SiteConfig;
  dataMode: DataMode;
  source: string;
  points: CalculatedPoint[];
  metrics: SiteMetrics;
}

export interface OverallAnalysis {
  generatedAt: string;
  mission: MissionSettings;
  sites: SiteConfig[];
  results: Record<string, SiteAnalysisResult>;
  dataMode: DataMode;
  notes: string[];
}

