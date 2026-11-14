import { MissionSettings, SiteConfig } from '../types';
import { DEFAULT_PANEL_CONFIG } from '../services/power';
import {
  createDefaultProfile,
  DE_GERLACHE_CSV,
  MALAPERT_CSV,
  SHACKLETON_CSV,
} from './sampleHorizons';

export const DEFAULT_MISSION_SETTINGS: MissionSettings = {
  startTime: '2026-11-15 00:00',
  durationDays: 7,
  stepSize: '30m',
  earthClearanceAngle: 0.5,
  solarModel: 'finite_disc',
  sunlitThreshold: 0.0,
  solarPanel: DEFAULT_PANEL_CONFIG,
};

export const DEFAULT_SITES: SiteConfig[] = [
  {
    id: 'site-a',
    name: 'Illustrative Site Alpha (Connecting Ridge / Shackleton)',
    latitude: -89.75,
    longitude: 160.0,
    observerHeight: 2.0,
    terrainElevation: 1250,
    color: '#00E5FF', // Cyan accent
    horizonProfile: createDefaultProfile(
      'profile-shackleton',
      'Shackleton Connecting Ridge Topography',
      'shackleton_connecting_ridge_horizon.csv',
      'site-a',
      SHACKLETON_CSV,
      'LRO LOLA Polar DEM 20m/px, 120km search radius with lunar curvature correction'
    ),
  },
  {
    id: 'site-b',
    name: 'Illustrative Site Beta (Malapert Mountain Vicinity)',
    latitude: -86.0,
    longitude: 0.0,
    observerHeight: 2.0,
    terrainElevation: 5000,
    color: '#A855F7', // Purple/Violet
    horizonProfile: createDefaultProfile(
      'profile-malapert',
      'Malapert Mountain Massif Topography',
      'malapert_mountain_horizon.csv',
      'site-b',
      MALAPERT_CSV,
      'LRO LOLA Polar DEM 30m/px, 150km search radius with lunar curvature correction'
    ),
  },
  {
    id: 'site-c',
    name: 'Illustrative Site Gamma (de Gerlache Rim Vicinity)',
    latitude: -88.5,
    longitude: 290.0,
    observerHeight: 2.0,
    terrainElevation: 2100,
    color: '#10B981', // Emerald
    horizonProfile: createDefaultProfile(
      'profile-degerlache',
      'de Gerlache Rim Topography',
      'de_gerlache_rim_horizon.csv',
      'site-c',
      DE_GERLACHE_CSV,
      'LRO LOLA Polar DEM 30m/px, 100km search radius with lunar curvature correction'
    ),
  },
];
