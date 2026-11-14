/**
 * Lunar Surface Photovoltaic Power & Energy Model
 * Implements equations from:
 * - Gläser et al. (2014) Sections 3 & Figures 25-26
 * - Zhang et al. (2023) Section 4.1.3 & Eq (7)
 * - LUNAR_LANDING_IMPLEMENTATION.md Part B.6 (Equations 14 & 16)
 */

export const SOLAR_CONSTANT_IRRADIANCE_W_M2 = 1367.0; // W/m^2 at 1 AU

export type PanelOrientationType = 'tracking_vertical' | 'fixed_vertical' | 'horizontal';

export interface SolarPanelConfig {
  orientation: PanelOrientationType;
  fixedAzimuthDeg?: number; // used if orientation is 'fixed_vertical'
  areaM2: number; // default 2.0 m^2
  efficiency: number; // default 0.28 (28% triple-junction space cells)
  solarIrradianceWM2?: number; // default 1367 W/m^2
}

export const DEFAULT_PANEL_CONFIG: SolarPanelConfig = {
  orientation: 'tracking_vertical',
  fixedAzimuthDeg: 0,
  areaM2: 2.0,
  efficiency: 0.28,
  solarIrradianceWM2: SOLAR_CONSTANT_IRRADIANCE_W_M2,
};

/**
 * Computes solar unit vector in local East-North-Up (ENU) coordinates.
 * Equation 14:
 * \hat{s}(t) = [cos(e) * sin(A), cos(e) * cos(A), sin(e)]^T
 */
export function calculateSolarUnitVectorENU(
  azimuthDeg: number,
  elevationDeg: number
): [number, number, number] {
  const azRad = (azimuthDeg * Math.PI) / 180.0;
  const elRad = (elevationDeg * Math.PI) / 180.0;

  const cosEl = Math.cos(elRad);
  const sinEl = Math.sin(elRad);
  const sinAz = Math.sin(azRad);
  const cosAz = Math.cos(azRad);

  return [cosEl * sinAz, cosEl * cosAz, sinEl];
}

/**
 * Computes panel unit normal vector in local ENU coordinates.
 */
export function calculatePanelNormalENU(
  config: SolarPanelConfig,
  currentSunAzimuthDeg: number
): [number, number, number] {
  switch (config.orientation) {
    case 'tracking_vertical': {
      // Actively tracks sun in azimuth while standing vertical (normal has 0 Up component)
      const azRad = (currentSunAzimuthDeg * Math.PI) / 180.0;
      return [Math.sin(azRad), Math.cos(azRad), 0.0];
    }
    case 'fixed_vertical': {
      // Fixed vertical facing fixedAzimuthDeg
      const azRad = ((config.fixedAzimuthDeg || 0) * Math.PI) / 180.0;
      return [Math.sin(azRad), Math.cos(azRad), 0.0];
    }
    case 'horizontal':
    default: {
      // Flat panel lying horizontal on local surface, pointing Up
      return [0.0, 0.0, 1.0];
    }
  }
}

/**
 * Computes cosine of the solar incidence angle cos(theta_i) = n_p . s.
 * Clamped to 0 if sunlight arrives from behind the panel.
 */
export function calculateIncidenceCosine(
  panelNormal: [number, number, number],
  sunVector: [number, number, number]
): number {
  const dot =
    panelNormal[0] * sunVector[0] +
    panelNormal[1] * sunVector[1] +
    panelNormal[2] * sunVector[2];
  return Math.max(0.0, dot);
}

/**
 * Instantaneous Photovoltaic Power in Watts:
 * P_PV(t) = S * A_p * eta_p * f_sun(t) * max(0, n_p . s)
 * Equation 16.
 */
export function calculateInstantaneousPvPower(
  sunAzimuthDeg: number,
  sunElevationDeg: number,
  solarVisibleFraction: number,
  config: SolarPanelConfig = DEFAULT_PANEL_CONFIG
): {
  powerWatts: number;
  incidenceAngleDeg: number;
  cosIncidence: number;
  solarVector: [number, number, number];
  panelNormal: [number, number, number];
} {
  if (solarVisibleFraction <= 0 || isNaN(sunElevationDeg) || isNaN(sunAzimuthDeg)) {
    const sVec = calculateSolarUnitVectorENU(sunAzimuthDeg || 0, sunElevationDeg || 0);
    const nVec = calculatePanelNormalENU(config, sunAzimuthDeg || 0);
    return {
      powerWatts: 0,
      incidenceAngleDeg: 90,
      cosIncidence: 0,
      solarVector: sVec,
      panelNormal: nVec,
    };
  }

  const sVec = calculateSolarUnitVectorENU(sunAzimuthDeg, sunElevationDeg);
  const nVec = calculatePanelNormalENU(config, sunAzimuthDeg);
  const cosTheta = calculateIncidenceCosine(nVec, sVec);
  const incidenceAngleDeg = (Math.acos(Math.min(1.0, Math.max(0.0, cosTheta))) * 180.0) / Math.PI;

  const S = config.solarIrradianceWM2 || SOLAR_CONSTANT_IRRADIANCE_W_M2;
  const powerWatts = S * config.areaM2 * config.efficiency * solarVisibleFraction * cosTheta;

  return {
    powerWatts: Math.max(0.0, powerWatts),
    incidenceAngleDeg,
    cosIncidence: cosTheta,
    solarVector: sVec,
    panelNormal: nVec,
  };
}

/**
 * Cumulative Energy Generation in Watt-hours [Wh]:
 * E_PV = (1 / 3600) * \int P_PV(t) dt [s]
 */
export function integrateCumulativeEnergyWh(
  timestampsIso: string[],
  powersWatts: number[]
): {
  totalEnergyWh: number;
  totalEnergyKWh: number;
  cumulativeSeriesWh: number[];
} {
  const n = Math.min(timestampsIso.length, powersWatts.length);
  const cumulativeSeriesWh: number[] = new Array(n).fill(0);

  if (n < 2) {
    return { totalEnergyWh: 0, totalEnergyKWh: 0, cumulativeSeriesWh };
  }

  let totalEnergyWh = 0;

  for (let i = 0; i < n - 1; i++) {
    const t1 = new Date(timestampsIso[i]).getTime();
    const t2 = new Date(timestampsIso[i + 1]).getTime();
    const dtSeconds = Math.max(0, (t2 - t1) / 1000.0);

    const p1 = powersWatts[i] || 0;
    const p2 = powersWatts[i + 1] || 0;

    // Trapezoidal rule for power over time interval
    const dWh = (0.5 * (p1 + p2) * dtSeconds) / 3600.0;
    totalEnergyWh += dWh;
    cumulativeSeriesWh[i + 1] = totalEnergyWh;
  }

  return {
    totalEnergyWh: Math.round(totalEnergyWh * 10) / 10,
    totalEnergyKWh: Math.round((totalEnergyWh / 1000.0) * 100) / 100,
    cumulativeSeriesWh,
  };
}
