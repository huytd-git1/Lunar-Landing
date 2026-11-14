import { CalculatedPoint, DataMode, SiteMetrics } from '../types';

/**
 * Calculates scientifically rigorous duration metrics by integrating over actual time intervals.
 * Handles:
 * - Actual timestamp deltas (uneven intervals)
 * - Linear margin interpolation at visibility transitions
 * - Boundary handling (start and end)
 * - Missing/unknown data retention without misclassifying as obstructed
 * - Longest continuous obstruction intervals
 */
export function calculateSiteMetrics(
  siteId: string,
  siteName: string,
  dataMode: DataMode,
  points: CalculatedPoint[]
): SiteMetrics {
  if (!points || points.length === 0) {
    return {
      siteId,
      siteName,
      dataMode,
      dataCoveragePct: 0,
      totalMissionHours: 0,
      totalValidHours: 0,
      sunVisibleHours: 0,
      sunVisiblePct: 0,
      longestSunObstructedHours: 0,
      earthVisibleHours: 0,
      earthVisiblePct: 0,
      longestEarthObstructedHours: 0,
      bothVisibleHours: 0,
      bothVisiblePct: 0,
      earthClearHours: 0,
      earthClearPct: 0,
    };
  }

  let totalMissionHours = 0;
  let totalValidHours = 0;

  let sunVisibleHours = 0;
  let earthVisibleHours = 0;
  let bothVisibleHours = 0;
  let earthClearHours = 0;

  let currentSunObstructedHours = 0;
  let maxSunObstructedHours = 0;

  let currentEarthObstructedHours = 0;
  let maxEarthObstructedHours = 0;

  // Single point edge case
  if (points.length === 1) {
    const p = points[0];
    const hrs = p.stepMinutes / 60.0;
    totalMissionHours = hrs;
    const isValid = p.sunVisible !== 'unknown' && p.earthVisible !== 'unknown';
    const validHrs = isValid ? hrs : 0;
    const sVis = p.sunVisible === 'visible' ? hrs : 0;
    const eVis = p.earthVisible === 'visible' ? hrs : 0;
    const bVis = p.bothVisible ? hrs : 0;
    const ecVis = p.earthCleared ? hrs : 0;

    return {
      siteId,
      siteName,
      dataMode,
      dataCoveragePct: isValid ? 100 : 0,
      totalMissionHours,
      totalValidHours: validHrs,
      sunVisibleHours: sVis,
      sunVisiblePct: validHrs > 0 ? (sVis / validHrs) * 100 : 0,
      longestSunObstructedHours: p.sunVisible === 'obstructed' ? hrs : 0,
      earthVisibleHours: eVis,
      earthVisiblePct: validHrs > 0 ? (eVis / validHrs) * 100 : 0,
      longestEarthObstructedHours: p.earthVisible === 'obstructed' ? hrs : 0,
      bothVisibleHours: bVis,
      bothVisiblePct: validHrs > 0 ? (bVis / validHrs) * 100 : 0,
      earthClearHours: ecVis,
      earthClearPct: validHrs > 0 ? (ecVis / validHrs) * 100 : 0,
    };
  }

  // Iterate over adjacent intervals [i, i+1]
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];

    const t1 = new Date(p1.timestamp).getTime();
    const t2 = new Date(p2.timestamp).getTime();
    let dtHours = (t2 - t1) / (1000 * 3600);

    if (isNaN(dtHours) || dtHours <= 0) {
      dtHours = p1.stepMinutes / 60.0;
    }

    totalMissionHours += dtHours;

    // Check validity of data in this interval
    const sunValid = p1.sunVisible !== 'unknown' && p2.sunVisible !== 'unknown';
    const earthValid = p1.earthVisible !== 'unknown' && p2.earthVisible !== 'unknown';

    if (!sunValid || !earthValid) {
      // Missing data: do not treat as obstructed or visible; reset active obstruction runs
      if (!sunValid) {
        if (currentSunObstructedHours > maxSunObstructedHours) {
          maxSunObstructedHours = currentSunObstructedHours;
        }
        currentSunObstructedHours = 0;
      }
      if (!earthValid) {
        if (currentEarthObstructedHours > maxEarthObstructedHours) {
          maxEarthObstructedHours = currentEarthObstructedHours;
        }
        currentEarthObstructedHours = 0;
      }
      continue;
    }

    totalValidHours += dtHours;

    // 1. Sun visibility integration with margin crossing interpolation
    const sunMargin1 = p1.sunElevation - p1.sunHorizonElevation;
    const sunMargin2 = p2.sunElevation - p2.sunHorizonElevation;

    let sunVisFraction = 0;
    let sunObsFraction = 0;

    if (p1.sunVisible === 'visible' && p2.sunVisible === 'visible') {
      sunVisFraction = 1.0;
    } else if (p1.sunVisible === 'obstructed' && p2.sunVisible === 'obstructed') {
      sunObsFraction = 1.0;
    } else {
      // Transition between visible and obstructed: interpolate crossing fraction
      const denom = Math.abs(sunMargin1) + Math.abs(sunMargin2);
      const fracCrossing = denom > 1e-6 ? Math.abs(sunMargin1) / denom : 0.5;

      if (p1.sunVisible === 'visible') {
        sunVisFraction = fracCrossing;
        sunObsFraction = 1.0 - fracCrossing;
      } else {
        sunObsFraction = fracCrossing;
        sunVisFraction = 1.0 - fracCrossing;
      }
    }

    sunVisibleHours += sunVisFraction * dtHours;

    // Track continuous Sun obstruction
    if (sunObsFraction > 0) {
      currentSunObstructedHours += sunObsFraction * dtHours;
      if (currentSunObstructedHours > maxSunObstructedHours) {
        maxSunObstructedHours = currentSunObstructedHours;
      }
      if (sunVisFraction > 0) {
        // Reset when transitioning out of obstruction
        currentSunObstructedHours = 0;
      }
    } else {
      currentSunObstructedHours = 0;
    }

    // 2. Earth visibility integration
    const earthMargin1 = p1.earthElevation - p1.earthHorizonElevation;
    const earthMargin2 = p2.earthElevation - p2.earthHorizonElevation;

    let earthVisFraction = 0;
    let earthObsFraction = 0;

    if (p1.earthVisible === 'visible' && p2.earthVisible === 'visible') {
      earthVisFraction = 1.0;
    } else if (p1.earthVisible === 'obstructed' && p2.earthVisible === 'obstructed') {
      earthObsFraction = 1.0;
    } else {
      const denom = Math.abs(earthMargin1) + Math.abs(earthMargin2);
      const fracCrossing = denom > 1e-6 ? Math.abs(earthMargin1) / denom : 0.5;

      if (p1.earthVisible === 'visible') {
        earthVisFraction = fracCrossing;
        earthObsFraction = 1.0 - fracCrossing;
      } else {
        earthObsFraction = fracCrossing;
        earthVisFraction = 1.0 - fracCrossing;
      }
    }

    earthVisibleHours += earthVisFraction * dtHours;

    // Track continuous Earth obstruction
    if (earthObsFraction > 0) {
      currentEarthObstructedHours += earthObsFraction * dtHours;
      if (currentEarthObstructedHours > maxEarthObstructedHours) {
        maxEarthObstructedHours = currentEarthObstructedHours;
      }
      if (earthVisFraction > 0) {
        currentEarthObstructedHours = 0;
      }
    } else {
      currentEarthObstructedHours = 0;
    }

    // 3. Both visible integration (coincident window)
    if (p1.bothVisible && p2.bothVisible) {
      bothVisibleHours += dtHours;
    } else if (p1.bothVisible || p2.bothVisible) {
      // Conservative or min-fraction transition estimate
      const jointFrac = Math.min(sunVisFraction, earthVisFraction);
      bothVisibleHours += jointFrac * dtHours;
    }

    // 4. Earth clearance integration
    if (p1.earthCleared && p2.earthCleared) {
      earthClearHours += dtHours;
    } else if (p1.earthCleared || p2.earthCleared) {
      earthClearHours += 0.5 * dtHours;
    }
  }

  // Handle lingering active obstruction at end of interval
  if (currentSunObstructedHours > maxSunObstructedHours) {
    maxSunObstructedHours = currentSunObstructedHours;
  }
  if (currentEarthObstructedHours > maxEarthObstructedHours) {
    maxEarthObstructedHours = currentEarthObstructedHours;
  }

  const dataCoveragePct = totalMissionHours > 0 ? (totalValidHours / totalMissionHours) * 100 : 0;
  const sunVisiblePct = totalValidHours > 0 ? (sunVisibleHours / totalValidHours) * 100 : 0;
  const earthVisiblePct = totalValidHours > 0 ? (earthVisibleHours / totalValidHours) * 100 : 0;
  const bothVisiblePct = totalValidHours > 0 ? (bothVisibleHours / totalValidHours) * 100 : 0;
  const earthClearPct = totalValidHours > 0 ? (earthClearHours / totalValidHours) * 100 : 0;

  return {
    siteId,
    siteName,
    dataMode,
    dataCoveragePct: Math.round(dataCoveragePct * 10) / 10,
    totalMissionHours: Math.round(totalMissionHours * 100) / 100,
    totalValidHours: Math.round(totalValidHours * 100) / 100,
    sunVisibleHours: Math.round(sunVisibleHours * 10) / 10,
    sunVisiblePct: Math.round(sunVisiblePct * 10) / 10,
    longestSunObstructedHours: Math.round(maxSunObstructedHours * 10) / 10,
    earthVisibleHours: Math.round(earthVisibleHours * 10) / 10,
    earthVisiblePct: Math.round(earthVisiblePct * 10) / 10,
    longestEarthObstructedHours: Math.round(maxEarthObstructedHours * 10) / 10,
    bothVisibleHours: Math.round(bothVisibleHours * 10) / 10,
    bothVisiblePct: Math.round(bothVisiblePct * 10) / 10,
    earthClearHours: Math.round(earthClearHours * 10) / 10,
    earthClearPct: Math.round(earthClearPct * 10) / 10,
  };
}

