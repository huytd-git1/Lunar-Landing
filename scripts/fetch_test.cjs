const https = require('https');

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
          resolve(json);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function run() {
  const res = await fetchHorizons('10', 0.0, -86.0, 0.002, '2026-11-15 00:00', '2026-11-22 00:00', '30m');
  const text = res.result;
  const startIdx = text.indexOf('$$SOE');
  const endIdx = text.indexOf('$$EOE');
  console.log('startIdx:', startIdx, 'endIdx:', endIdx);
  if (startIdx !== -1) {
    console.log('SOE slice:');
    console.log(text.slice(startIdx, startIdx + 500));
  } else {
    console.log('No $$SOE found! End of message:');
    console.log(text.slice(-500));
  }
}

run().catch(console.error);
