import https from 'https';

export interface HorizonsQueryParams {
  command: string; // '10' (Sun) or '399' (Earth)
  lon: number;
  lat: number;
  altKm: number;
  startTime: string;
  stopTime: string;
  stepSize: string;
}

export function fetchHorizonsRaw(params: HorizonsQueryParams): Promise<string> {
  return new Promise((resolve, reject) => {
    const urlParams = new URLSearchParams({
      format: 'json',
      COMMAND: `'${params.command}'`,
      CENTER: `'coord@301'`,
      COORD_TYPE: `'GEODETIC'`,
      SITE_COORD: `'${params.lon},${params.lat},${params.altKm}'`,
      START_TIME: `'${params.startTime}'`,
      STOP_TIME: `'${params.stopTime}'`,
      STEP_SIZE: `'${params.stepSize}'`,
      QUANTITIES: `'4'`,
    });

    const url = `https://ssd.jpl.nasa.gov/api/horizons.api?${urlParams.toString()}`;

    const req = https.get(
      url,
      {
        headers: {
          'User-Agent': 'LunarLandingSiteNavigator/1.0 (NASA Space Apps Prototype; contact@spaceapps.org)',
        },
        timeout: 15000,
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => {
          body += chunk;
        });
        res.on('end', () => {
          try {
            const json = JSON.parse(body);
            if (json.error) {
              return reject(new Error(json.error));
            }
            if (!json.result) {
              return reject(new Error('Horizons response missing result payload.'));
            }
            resolve(json.result);
          } catch (e) {
            reject(new Error(`Failed to parse Horizons JSON response: ${(e as Error).message}`));
          }
        });
      }
    );

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Horizons API request timed out after 15 seconds.'));
    });

    req.on('error', (err) => {
      reject(new Error(`Network error contacting Horizons API: ${err.message}`));
    });
  });
}

