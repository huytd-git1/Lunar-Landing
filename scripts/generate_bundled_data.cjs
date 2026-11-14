const https = require('https');
const fs = require('fs');
const path = require('path');

function fetchHorizons(command, lon, lat, altKm, start, stop, step) {
  return new Promise((resolve, reject) => {
    const params = new URLSearchParams({
      format: 'json',
      COMMAND: `'${command}'`,
      CENTER: `'coord@301'`,
      COORD_TYPE: `'GEODETIC'`,
      SITE_COORD: `'${lon},${lat},${altKm}'`,
      START_TIME: `'${start}'`,
      STOP_TIME: `'${stop}'`,
      STEP_SIZE: `'${step}'`,
      QUANTITIES: `'4'`
    });
    const url = `https://ssd.jpl.nasa.gov/api/horizons.api?${params.toString()}`;
    
    https.get(url, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json.result);
        } catch(e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

function parseHorizonsOutput(text) {
  const startIdx = text.indexOf('$$SOE');
  const endIdx = text.indexOf('$$EOE');
  if (startIdx === -1 || endIdx === -1) {
    throw new Error('Missing $$SOE or $$EOE delimiters in Horizons output');
  }
  const block = text.substring(startIdx + 5, endIdx).trim();
  const lines = block.split(/\r?\n/).filter(l => l.trim().length > 0);
  
  const points = [];
  const re = /^\s*(\d{4}-[A-Za-z]{3}-\d{2}\s+\d{2}:\d{2})\s+([A-Za-z*\/]*)\s+([+-]?\d+\.?\d*)\s+([+-]?\d+\.?\d*)/;
  
  for (const line of lines) {
    const m = line.match(re);
    if (m) {
      const dtStr = m[1];
      const flag = m[2] || '';
      const az = parseFloat(m[3]);
      const el = parseFloat(m[4]);
      
      const parsedDate = new Date(dtStr + ' UTC');
      const isoUtc = !isNaN(parsedDate.getTime()) ? parsedDate.toISOString() : dtStr;
      
      points.push({
        timestamp: isoUtc,
        rawTime: dtStr,
        flag: flag,
        azimuth: az,
        elevation: el
      });
    }
  }
  return points;
}

const sites = [
  { id: 'site-a', name: 'Illustrative Site Alpha (Connecting Ridge / Shackleton)', lat: -89.75, lon: 160.0, height: 2.0 },
  { id: 'site-b', name: 'Illustrative Site Beta (Malapert Mountain Vicinity)', lat: -86.00, lon: 0.0, height: 2.0 },
  { id: 'site-c', name: 'Illustrative Site Gamma (de Gerlache Rim Vicinity)', lat: -88.50, lon: 290.0, height: 2.0 }
];

const mission = {
  startTime: '2026-11-15 00:00',
  stopTime: '2026-11-22 00:00',
  durationDays: 7,
  stepSize: '30m'
};

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function main() {
  console.log('Generating bundled real Horizons ephemerides for 3 illustrative sites...');
  const bundled = {
    metadata: {
      generatedAt: new Date().toISOString(),
      source: 'NASA/JPL Solar System Dynamics Horizons API',
      apiEndpoint: 'https://ssd.jpl.nasa.gov/api/horizons.api',
      missionSettings: mission,
      coordinateSystem: 'Moon Body-Fixed Geodetic (coord@301), East-positive longitude, Alt in km relative to 1737.4 km lunar sphere',
      notes: 'Real astronomical ephemeris for prototype testing and instant offline dashboard rendering.'
    },
    sites: {}
  };

  for (const site of sites) {
    console.log(`Fetching site ${site.id} (${site.name})...`);
    const altKm = site.height / 1000.0;
    
    console.log(`  Fetching Sun (10)...`);
    const sunRaw = await fetchHorizons('10', site.lon, site.lat, altKm, mission.startTime, mission.stopTime, mission.stepSize);
    const sunPoints = parseHorizonsOutput(sunRaw);
    console.log(`    Retrieved ${sunPoints.length} Sun points.`);
    await sleep(600);

    console.log(`  Fetching Earth (399)...`);
    const earthRaw = await fetchHorizons('399', site.lon, site.lat, altKm, mission.startTime, mission.stopTime, mission.stepSize);
    const earthPoints = parseHorizonsOutput(earthRaw);
    console.log(`    Retrieved ${earthPoints.length} Earth points.`);
    await sleep(600);

    bundled.sites[site.id] = {
      site: site,
      sun: sunPoints,
      earth: earthPoints,
      rawSunHeader: sunRaw.slice(0, 800),
      rawEarthHeader: earthRaw.slice(0, 800)
    };
  }

  const outDir = path.join(__dirname, '..', 'src', 'data');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  const outFile = path.join(outDir, 'bundledEphemeris.json');
  fs.writeFileSync(outFile, JSON.stringify(bundled, null, 2));
  console.log(`Successfully generated bundled ephemeris at ${outFile}`);

  const serverDataDir = path.join(__dirname, '..', 'server');
  if (!fs.existsSync(serverDataDir)) {
    fs.mkdirSync(serverDataDir, { recursive: true });
  }
  fs.writeFileSync(path.join(serverDataDir, 'bundledEphemeris.json'), JSON.stringify(bundled, null, 2));
}

main().catch(err => {
  console.error('Error generating bundled data:', err);
  process.exit(1);
});
