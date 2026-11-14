import express, { Request, Response } from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { fetchHorizonsRaw } from './horizons.js';
import { parseHorizonsResponse } from '../src/services/horizonsParser.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// In-memory cache for ephemeris results
const ephemerisMemoryCache = new Map<string, any>();

// Load bundled data if exists
let bundledData: any = null;
const bundledPath = path.join(__dirname, 'bundledEphemeris.json');
if (fs.existsSync(bundledPath)) {
  try {
    bundledData = JSON.parse(fs.readFileSync(bundledPath, 'utf8'));
    console.log('[Server] Bundled ephemeris data successfully loaded.');
  } catch (err) {
    console.warn('[Server] Could not load bundledEphemeris.json:', (err as Error).message);
  }
}

// Request serialization queue to respect JPL Horizons rate limits
let requestQueue: Promise<any> = Promise.resolve();

function enqueueHorizonsRequest<T>(fn: () => Promise<T>): Promise<T> {
  const result = requestQueue.then(() => fn());
  // Chain small delay (200ms) after each request
  requestQueue = result.catch(() => {}).then(() => new Promise((r) => setTimeout(r, 200)));
  return result;
}

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'Lunar Landing Site Navigator Backend',
    cachedQueries: ephemerisMemoryCache.size,
    bundledLoaded: bundledData !== null,
    uptimeSeconds: process.uptime(),
  });
});

// Bundled real data endpoint
app.get('/api/bundled', (_req: Request, res: Response) => {
  if (bundledData) {
    return res.json({
      success: true,
      data: bundledData,
      source: 'Bundled NASA/JPL Horizons real ephemerides dataset',
    });
  }
  return res.status(404).json({
    success: false,
    error: 'Bundled dataset not found on server.',
  });
});

// Query Horizons live endpoint
app.get('/api/horizons', async (req: Request, res: Response) => {
  try {
    const command = (req.query.command as string) || '10'; // 10=Sun, 399=Earth
    const lon = parseFloat(req.query.lon as string);
    const lat = parseFloat(req.query.lat as string);
    const altKm = parseFloat(req.query.altKm as string) || 0.002;
    const startTime = (req.query.start as string) || '2026-11-15 00:00';
    const stopTime = (req.query.stop as string) || '2026-11-22 00:00';
    const stepSize = (req.query.step as string) || '30m';

    if (isNaN(lon) || isNaN(lat)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid coordinates: lon and lat must be valid numbers.',
      });
    }

    const cacheKey = `${command}_${lon.toFixed(4)}_${lat.toFixed(4)}_${altKm.toFixed(5)}_${startTime}_${stopTime}_${stepSize}`;

    if (ephemerisMemoryCache.has(cacheKey)) {
      return res.json({
        success: true,
        cached: true,
        records: ephemerisMemoryCache.get(cacheKey),
        source: 'NASA/JPL Horizons API (cached)',
      });
    }

    console.log(`[Horizons Query] target=${command} lon=${lon} lat=${lat} altKm=${altKm} start="${startTime}" stop="${stopTime}" step="${stepSize}"`);

    const rawOutput = await enqueueHorizonsRequest(() =>
      fetchHorizonsRaw({
        command,
        lon,
        lat,
        altKm,
        startTime,
        stopTime,
        stepSize,
      })
    );

    const parsed = parseHorizonsResponse(rawOutput);

    if (!parsed.success) {
      console.warn(`[Horizons Error] ${parsed.error}`);
      return res.status(502).json({
        success: false,
        error: parsed.error,
        canFallback: true,
      });
    }

    // Cache the result in memory
    ephemerisMemoryCache.set(cacheKey, parsed.records);

    return res.json({
      success: true,
      cached: false,
      records: parsed.records,
      source: 'NASA/JPL Horizons API (live)',
    });
  } catch (error) {
    const msg = (error as Error).message || 'Unknown server error querying Horizons';
    console.error('[Server Error in /api/horizons]:', msg);
    return res.status(502).json({
      success: false,
      error: msg,
      canFallback: true,
    });
  }
});

// Serve frontend static files if built
const distPath = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.use('/Lunar-Landing', express.static(distPath));
  app.get('*', (_req: Request, res: Response) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`[Server] Lunar Landing Site Navigator backend running on http://localhost:${PORT}`);
});

