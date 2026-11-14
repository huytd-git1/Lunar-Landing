import { DataMode, EphemerisRecord, MissionSettings, SiteConfig } from '../types';
import { convertObserverAltToKm } from './coordinates';
import { generateSyntheticLunarEphemeris } from './syntheticEphemeris';

export interface EphemerisQueryResult {
  success: boolean;
  sun?: EphemerisRecord[];
  earth?: EphemerisRecord[];
  source?: string;
  error?: string;
  canFallback?: boolean;
}

/**
 * Safely fetches JSON from an endpoint, verifying status and content-type
 * to prevent SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON.
 */
async function safeFetchJson(url: string, timeoutMs: number = 10000): Promise<{
  ok: boolean;
  status: number;
  data: any;
  isHtml: boolean;
  rawText?: string;
}> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json, text/plain',
      },
    });
    clearTimeout(timer);

    const contentType = res.headers.get('content-type') || '';
    const isHtml = contentType.includes('text/html');

    if (isHtml || !res.ok) {
      const text = await res.text();
      // Try to parse if it happens to be json despite content-type
      if (text.trim().startsWith('{') || text.trim().startsWith('[')) {
        try {
          const json = JSON.parse(text);
          return { ok: res.ok, status: res.status, data: json, isHtml: false };
        } catch {
          // not valid json
        }
      }
      return { ok: false, status: res.status, data: null, isHtml: true, rawText: text.slice(0, 300) };
    }

    const json = await res.json();
    return { ok: true, status: res.status, data: json, isHtml: false };
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

/**
 * Queries Horizons ephemeris for a specific candidate site and mission settings.
 * Handles:
 * 1. Demonstration mode (analytical client-side computation)
 * 2. Real API with backend proxy (/api/horizons with fallback to localhost:3001)
 * 3. Graceful, human-readable error reporting on static hosts (GitHub Pages)
 */
export async function querySiteEphemeris(
  site: SiteConfig,
  missionSettings: MissionSettings,
  dataMode: DataMode,
  language: 'vi' | 'en' = 'vi'
): Promise<EphemerisQueryResult> {
  // --- 1. DEMONSTRATION MODE ---
  if (dataMode === 'demo') {
    const stepMinutes =
      missionSettings.stepSize === '15m'
        ? 15
        : missionSettings.stepSize === '1h'
        ? 60
        : missionSettings.stepSize === '2h'
        ? 120
        : 30;

    const synth = generateSyntheticLunarEphemeris({
      lat: site.latitude,
      lon: site.longitude,
      startTimeStr: missionSettings.startTime,
      durationDays: missionSettings.durationDays,
      stepMinutes,
    });

    return {
      success: true,
      sun: synth.sun,
      earth: synth.earth,
      source: synth.source,
    };
  }

  // --- 2. REAL HORIZONS EPHEMERIDES (VIA NODE BACKEND PROXY) ---
  const altKm = convertObserverAltToKm(site.observerHeight, site.terrainElevation);

  // Compute stop time from duration
  const startDate = new Date(missionSettings.startTime.replace(' ', 'T') + ':00Z');
  const stopDate = new Date(startDate.getTime() + missionSettings.durationDays * 24 * 3600 * 1000);
  const stopTimeStr = `${stopDate.getUTCFullYear()}-${String(stopDate.getUTCMonth() + 1).padStart(2, '0')}-${String(
    stopDate.getUTCDate()
  ).padStart(2, '0')} ${String(stopDate.getUTCHours()).padStart(2, '0')}:${String(stopDate.getUTCMinutes()).padStart(
    2,
    '0'
  )}`;

  const buildQuery = (base: string, cmd: string) =>
    `${base}?command=${cmd}&lon=${site.longitude}&lat=${site.latitude}&altKm=${altKm}&start=${encodeURIComponent(
      missionSettings.startTime
    )}&stop=${encodeURIComponent(stopTimeStr)}&step=${encodeURIComponent(missionSettings.stepSize)}`;

  // Candidate base URLs: 1) relative '/api/horizons', 2) direct 'http://localhost:3001/api/horizons'
  const candidateBases = ['/api/horizons', 'http://localhost:3001/api/horizons'];

  let lastStatus = 0;
  let hitHtmlResponse = false;
  let lastErrorMsg = '';

  for (const base of candidateBases) {
    try {
      const sunUrl = buildQuery(base, '10');
      const earthUrl = buildQuery(base, '399');

      const [sunRes, earthRes] = await Promise.all([
        safeFetchJson(sunUrl, 8000),
        safeFetchJson(earthUrl, 8000),
      ]);

      if (sunRes.isHtml || earthRes.isHtml || sunRes.status === 404 || earthRes.status === 404) {
        hitHtmlResponse = true;
        lastStatus = sunRes.status || earthRes.status || 404;
        continue; // try next candidate base
      }

      if (sunRes.ok && earthRes.ok && sunRes.data?.success && earthRes.data?.success) {
        return {
          success: true,
          sun: sunRes.data.records,
          earth: earthRes.data.records,
          source: sunRes.data.cached ? 'NASA/JPL Horizons API (Cached)' : 'NASA/JPL Horizons API (Live)',
        };
      }

      if (!sunRes.ok || !sunRes.data?.success) {
        lastErrorMsg = sunRes.data?.error || `HTTP ${sunRes.status} retrieving Sun ephemeris`;
      } else if (!earthRes.ok || !earthRes.data?.success) {
        lastErrorMsg = earthRes.data?.error || `HTTP ${earthRes.status} retrieving Earth ephemeris`;
      }
    } catch (netErr) {
      lastErrorMsg = (netErr as Error).message || 'Network connection failed';
    }
  }

  // If we reached here, query failed on all candidate endpoints
  let friendlyMsg = '';
  if (hitHtmlResponse || lastStatus === 404 || lastStatus === 504) {
    if (language === 'vi') {
      friendlyMsg =
        'Không thể kết nối đến máy chủ JPL Horizons Backend (Mã phản hồi HTTP 404 / Chưa khởi động máy chủ API). Trên môi trường GitHub Pages (máy chủ tĩnh) hoặc khi chưa chạy lệnh "npm run server", vui lòng nhấn nút [Dùng Bộ Dữ Liệu Ngoại Tuyến Có Sẵn] bên dưới để tiếp tục phân tích với dữ liệu thực đã được kiểm chứng, hoặc chuyển sang [Chế độ Dữ liệu Mô phỏng Minh họa] trên thanh Header.';
    } else {
      friendlyMsg =
        'Unable to reach the JPL Horizons Backend (HTTP 404 / API server offline). On static hosting like GitHub Pages or when the local "npm run server" is not running, please click [Use Bundled Offline Dataset] below to analyze with verified real ephemerides, or switch to [Demonstration Mode] in the Header.';
    }
  } else {
    friendlyMsg = lastErrorMsg || (language === 'vi' ? 'Lỗi kết nối lịch thiên văn Horizons' : 'Horizons ephemeris connection error');
  }

  return {
    success: false,
    error: friendlyMsg,
    canFallback: true,
  };
}

