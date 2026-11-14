/**
 * Finite Solar Disc Model
 * Implements analytical visible disc area fraction from:
 * - Gläser et al. (2014) Section 3.1 & Figure 8 (DOI: 10.1016/j.icarus.2014.08.013)
 * - De Rosa et al. (2012) Figure 6 (DOI: 10.1016/j.pss.2012.08.002)
 * - LUNAR_LANDING_IMPLEMENTATION.md Part B.4 (Equation 09)
 */

// Nominal physical constants
export const NOMINAL_SOLAR_ANGULAR_RADIUS_DEG = 0.2664; // ~16 arcmin (0.2664°)

/**
 * Calculates the solar angular radius given Sun distance in AU.
 * alpha = arcsin(R_sun / d_sun)
 */
export function calculateSolarAngularRadiusDeg(distanceAu: number = 1.0): number {
  if (distanceAu <= 0 || isNaN(distanceAu)) {
    return NOMINAL_SOLAR_ANGULAR_RADIUS_DEG;
  }
  const R_SUN_KM = 696340;
  const AU_KM = 149597870.7;
  const dKm = distanceAu * AU_KM;
  const sinAlpha = R_SUN_KM / dKm;
  if (sinAlpha >= 1) return 90;
  return (Math.asin(sinAlpha) * 180) / Math.PI;
}

/**
 * Computes the visible fraction f_sun(x) of a uniform solar disc intersecting a linear horizon.
 * Parameter x = D / alpha_sun, where D = e_sun - H(A_sun).
 *
 * Formula (Equation 09):
 * x <= -1 : f = 0
 * -1 < x < 1: f = 0.5 + (arcsin(x) + x * sqrt(1 - x^2)) / pi
 * x >= 1  : f = 1
 *
 * Properties:
 * f(-1) = 0
 * f(0) = 0.5 (center on horizon)
 * f(1) = 1
 * Monotonic and continuous on [-1, 1].
 */
export function calculateVisibleSolarDiscFraction(
  sunElevationDeg: number,
  horizonElevationDeg: number,
  solarAngularRadiusDeg: number = NOMINAL_SOLAR_ANGULAR_RADIUS_DEG
): number {
  if (isNaN(sunElevationDeg) || isNaN(horizonElevationDeg) || solarAngularRadiusDeg <= 0) {
    return 0;
  }

  const D = sunElevationDeg - horizonElevationDeg;
  const x = D / solarAngularRadiusDeg;

  if (x <= -1.0) {
    return 0.0;
  }
  if (x >= 1.0) {
    return 1.0;
  }

  // Clamp x slightly inside [-1, 1] to prevent floating point numerical NaN in sqrt
  const clampedX = Math.max(-0.999999999999999, Math.min(0.999999999999999, x));
  const fraction = 0.5 + (Math.asin(clampedX) + clampedX * Math.sqrt(1.0 - clampedX * clampedX)) / Math.PI;

  return Math.max(0.0, Math.min(1.0, fraction));
}

/**
 * Determines illumination status based on solar model and user-configured threshold.
 * - Point model: visible if sunElevation > horizonElevation
 * - Disc model: visible if visibleFraction >= threshold (default 0.0 for any visible light, 0.1 for 10%, 0.5 for half)
 */
export function evaluateSunlitState(
  sunElevationDeg: number,
  horizonElevationDeg: number,
  solarModel: 'point' | 'finite_disc' = 'finite_disc',
  thresholdFraction: number = 0.0,
  solarAngularRadiusDeg: number = NOMINAL_SOLAR_ANGULAR_RADIUS_DEG
): {
  visibleFraction: number;
  isSunlit: boolean;
  state: 'visible' | 'obstructed' | 'unknown';
} {
  if (isNaN(sunElevationDeg) || isNaN(horizonElevationDeg)) {
    return { visibleFraction: 0, isSunlit: false, state: 'unknown' };
  }

  if (solarModel === 'point') {
    const isVis = sunElevationDeg > horizonElevationDeg;
    return {
      visibleFraction: isVis ? 1.0 : 0.0,
      isSunlit: isVis,
      state: isVis ? 'visible' : 'obstructed',
    };
  }

  const fraction = calculateVisibleSolarDiscFraction(
    sunElevationDeg,
    horizonElevationDeg,
    solarAngularRadiusDeg
  );

  const isSunlit = fraction > thresholdFraction || (thresholdFraction === 0.0 && fraction > 1e-5);
  return {
    visibleFraction: fraction,
    isSunlit,
    state: isSunlit ? 'visible' : 'obstructed',
  };
}

/**
 * Numerical trapezoidal integration of solar disc fraction over a time series.
 * returns mean visible solar fraction \bar{f}_\odot in [0, 1].
 */
export function integrateMeanSolarVisibleFraction(
  timeHours: number[],
  fractions: number[]
): number {
  if (timeHours.length < 2 || timeHours.length !== fractions.length) {
    return fractions.length > 0 ? fractions[0] : 0;
  }

  let integral = 0;
  let totalDuration = 0;

  for (let i = 0; i < timeHours.length - 1; i++) {
    const dt = timeHours[i + 1] - timeHours[i];
    if (dt > 0 && !isNaN(fractions[i]) && !isNaN(fractions[i + 1])) {
      integral += 0.5 * (fractions[i] + fractions[i + 1]) * dt;
      totalDuration += dt;
    }
  }

  if (totalDuration <= 0) return 0;
  return Math.max(0, Math.min(1, integral / totalDuration));
}
