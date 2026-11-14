import { PanelOrientationType, SolarPanelConfig } from '../services/power';
import { HeightComparisonResult } from '../services/heightAnalysis';

export type VisibilityState = 'visible' | 'obstructed' | 'unknown';

export type DataMode = 'real_geometric' | 'real_terrain' | 'demo';

export type SolarModelType = 'point' | 'finite_disc';

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
  solarModel: SolarModelType;
  sunlitThreshold: number; // 0.0 (any visible), 0.1, 0.5, 1.0
  solarPanel: SolarPanelConfig;
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
  sunClearance: number; // elevation - horizonElevation
  sunVisible: VisibilityState;
  solarVisibleFraction: number; // [0, 1] for finite disc model
  sunlitState: VisibilityState; // accounts for model and threshold
  earthAzimuth: number;
  earthElevation: number;
  earthHorizonElevation: number;
  earthClearance: number;
  earthVisible: VisibilityState;
  earthCleared: boolean;
  bothVisible: boolean;
  pvPowerWatts: number;
  cumulativeEnergyWh: number;
  solarVectorENU: [number, number, number];
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
  meanSolarVisibleFractionPct: number; // \bar{f}_\odot * 100
  longestSunObstructedHours: number; // LCSP (Longest Continuous Shadow Period)
  longestLightPeriodHours: number; // LCIP (Longest Continuous Illumination Period)
  earthVisibleHours: number;
  earthVisiblePct: number;
  longestEarthObstructedHours: number;
  bothVisibleHours: number;
  bothVisiblePct: number;
  earthClearHours: number;
  earthClearPct: number;
  totalEnergyKWh: number;
  maxPvPowerWatts: number;
  heightComparison?: HeightComparisonResult[];
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

export type { SolarPanelConfig, PanelOrientationType, HeightComparisonResult };
