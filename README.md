# Lunar Landing Site Navigator

> **NASA Space Apps Challenge Prototype**  
> *South-Polar Candidate Landing Site Comparison via Sun and Earth Local Horizon Ephemerides*

[![Tests](https://img.shields.io/badge/tests-21%20passed-10B981?style=flat-square)](./tests)
[![Ephemerides](https://img.shields.io/badge/ephemeris-NASA%2FJPL%20Horizons-00E5FF?style=flat-square)](https://ssd.jpl.nasa.gov/horizons/)
[![Topography](https://img.shields.io/badge/DEM-LRO%20LOLA-F59E0B?style=flat-square)](https://quickmap.lroc.asu.edu/)
[![Stack](https://img.shields.io/badge/stack-React%20%7C%20TypeScript%20%7C%20Vite%20%7C%20Node-3B82F6?style=flat-square)](./package.json)

---

## 1. Overview

The **Lunar Landing Site Navigator** is a scientific full-stack web application developed as a prototype solution for the NASA Space Apps Challenge. 

The Moon's south pole is the prime target for upcoming robotic and crewed missions (such as NASA's Artemis program). However, operating in the lunar polar environment presents unique challenges:
1. **Grazing Solar Angles:** Because the Moon's rotational axis is tilted only **1.5424°** relative to the ecliptic, the Sun skims horizontally along the horizon, casting multi-kilometer shadows from modest crater rims and peaks.
2. **Libration-Driven Earth Visibility:** Because the Moon is tidally locked with Earth, Earth remains in a slow 27.3-day libration oval in the local sky (oscillating by $\sim\pm 6.7^\circ$ in latitude and $\sim\pm 8^\circ$ in longitude), dipping below local topographic horizons near the limbs.

This application empowers mission planners, scientists, and educators to evaluate and compare up to three candidate landing sites simultaneously by computing and visualizing instantaneous Sun and Earth positions relative to local terrain horizons over time.

---

## 2. Quickstart & Setup

### Prerequisites
- **Node.js** v18.0.0 or higher
- **npm** v9.0.0 or higher

### Installation
Clone the repository and install dependencies:
```bash
# Install dependencies (React, Vite, TypeScript, Tailwind CSS, Express, Lucide, Vitest)
npm install
```

### Running the Test Suite
Run the 21 automated unit tests and scientific validation suites:
```bash
npm test
```

### Running the Application in Development Mode
Starts the Vite dev server with proxy to the backend API:
```bash
# Terminal 1: Start the backend Horizons caching proxy server
npm run server

# Terminal 2: Start the Vite frontend dev server (http://localhost:5173)
npm run dev
```

### Running the Application in Production Mode
Builds the optimized frontend bundle and serves it via the Node.js Express server:
```bash
# Build frontend
npm run build

# Start production server on http://localhost:3001
npm start
```
Open **[http://localhost:3001](http://localhost:3001)** in your web browser.

---

## 3. Architecture & Modularity

The application enforces strict separation of concerns across scientific calculations, API services, duration integration, and UI rendering:

```
lunar-landing-site-navigator/
├── server/
│   ├── index.ts               # Express API proxy, request queuing, memory caching & static serving
│   ├── horizons.ts            # NASA/JPL Horizons API query builder
│   └── bundledEphemeris.json  # Pre-bundled real ephemerides for instant offline dashboard load
├── src/
│   ├── types/
│   │   └── index.ts           # TypeScript interfaces for sites, horizons, ephemerides, metrics
│   ├── services/
│   │   ├── horizonsParser.ts  # Robust parser for Horizons $$SOE/$$EOE ASCII tables
│   │   ├── coordinates.ts     # Coordinate validation & East-positive longitude normalization
│   │   ├── horizonProfile.ts  # CSV profile parser, validation & circular interpolation
│   │   ├── visibility.ts      # Point-object approximation & Earth clearance evaluation
│   │   ├── metrics.ts         # Rigorous interval-based duration & transition integration
│   │   └── exportData.ts      # CSV time-series & JSON analysis package generators
│   ├── components/
│   │   ├── Header.tsx             # Title, data mode switcher, live UTC clock, action buttons
│   │   ├── SiteConfigPanel.tsx    # Site tabs, coordinates, mast height, DEM profile manager
│   │   ├── MissionSettingsPanel.tsx # UTC start, duration, step size, clearance, Analyze button
│   │   ├── LunarSiteMap.tsx       # Interactive polar map with 4 layers (shaded relief, elevation, WAC solar illum %, Earth LOS), zoom/pan, click-to-place site & distance ruler
│   │   ├── LocalHorizonChart.tsx  # Interactive Az-El sky chart with Sun/Earth & terrain profile
│   │   ├── TimeSeriesChart.tsx    # Synchronized elevation curves vs time
│   │   ├── VisibilityTimeline.tsx # Accessible 3-row stacked timeline (Sun, Earth, Both)
│   │   ├── TimeControls.tsx       # Play/pause transport, MET counter, scrub slider, speed selector
│   │   ├── ComparisonTable.tsx    # Sortable multi-site performance matrix & trade-off insights
│   │   ├── HowItWorksModal.tsx    # Educational guide with orbital mechanics & caveats
│   │   └── HorizonImportModal.tsx # Topography CSV importer, validator & sample loader
│   ├── data/
│   │   ├── defaultSites.ts        # Default illustrative candidate sites (Alpha, Beta, Gamma)
│   │   ├── sampleHorizons.ts      # LOLA DEM-derived sample terrain profiles
│   │   └── bundledEphemeris.json  # 7-day 30-min real ephemeris dataset
│   ├── App.tsx                    # Root dashboard controller & state orchestrator
│   └── main.tsx                   # React root entry point
├── tests/
│   ├── horizonsParser.test.ts     # Documented Horizons ASCII fixture tests
│   ├── coordinates.test.ts        # Longitude normalization and altitude conversions
│   ├── horizonProfile.test.ts     # 360° circular linear interpolation & duplicate resolution
│   ├── visibility.test.ts         # Above, below, and equality boundary cases
│   ├── metrics.test.ts            # Timestamp delta integration & missing-data tests
│   └── validation.test.ts         # Independent astronomical validation against physical constants
└── examples/
    ├── shackleton_connecting_ridge_horizon.csv
    ├── malapert_mountain_horizon.csv
    ├── de_gerlache_rim_horizon.csv
    ├── example_exported_analysis.json
    └── example_exported_site_a_timeseries.csv
```

---

## 4. Scientific Ephemeris & Coordinate Systems

### JPL Horizons API Integration
Ephemerides are computed using official **NASA/JPL Solar System Dynamics Horizons API** queries:
* **Target Identifiers:**
  * Sun: Target ID `'10'`
  * Earth: Target ID `'399'`
* **Observer Center:**
  * Moon Body-Fixed Geodetic: `CENTER = 'coord@301'`
* **Reference Ellipsoid / Sphere:**
  * Lunar radius $R = 1737.4\text{ km}$ (standard IAU / LOLA sphere)
* **Coordinate Convention:**
  * `SITE_COORD = '<East-Lon>,<Lat>,<Alt_km>'`
  * **Longitude:** Strictly East-positive $[0^\circ, 360^\circ)$.
  * **Latitude:** South-negative $[-90^\circ, +90^\circ]$.
  * **Altitude:** Kilometers above the 1737.4 km reference sphere.
    $$\text{Alt}_{\text{km}} = \frac{h_{\text{terrain}} + h_{\text{observer}}}{1000.0}$$
    *Where $h_{\text{terrain}}$ is elevation relative to 1737.4 km, and $h_{\text{observer}}$ is the mast height above local ground (e.g. 2.0 m).*
* **Local Horizon Azimuth Convention:**
  * Clockwise from local North: $0^\circ = \text{North}$, $90^\circ = \text{East}$, $180^\circ = \text{South}$, $270^\circ = \text{West}$.
* **Vacuum Optics:**
  * Atmospheric refraction is explicitly omitted because the Moon has no atmosphere.

### API Rate Limiting & Offline Reliability
To respect JPL Horizons service resources, the backend server implements:
1. **Serialized Request Queue:** Ensures queries are throttled with intentional spacing.
2. **In-Memory Cache:** Avoids duplicate external calls for identical site coordinates and epochs.
3. **Pre-Bundled Real Dataset:** Includes verified real ephemerides for the three default sites over 7 Earth days (337 samples at 30-minute resolution), enabling instant offline demonstration without network latency.
4. **Actionable Error Feedback:** If a live Horizons request fails, the application informs the user with an actionable message and an explicit fallback button (never silently substituting synthetic data).

---

## 5. Horizon Modeling & Visibility Calculations

### Point-Object Approximation
Instantaneous geometric visibility is determined by:
$$\text{visible}(t) = \theta_{\text{elevation}}(t) > \theta_{\text{horizon}}(\phi_{\text{azimuth}}(t))$$

* In **Geometric Horizon Mode**, $\theta_{\text{horizon}} = 0.0^\circ$ for all azimuths.
* In **Terrain Horizon Mode**, $\theta_{\text{horizon}}(\phi)$ is computed from local topography.
* In the boundary equality case $\theta_{\text{elevation}} = \theta_{\text{horizon}}$, the object is classified as `obstructed` (grazing cutoff).

### Earth Radio Clearance Angle Margin
The prototype supports a configurable RF clearance angle $\Delta_{\text{clear}}$ (default $+0.5^\circ$):
$$\text{earth\_clear}(t) = \theta_{\text{earth\_el}}(t) > \theta_{\text{horizon}}(\phi_{\text{earth\_az}}(t)) + \Delta_{\text{clear}}$$
This reports whether the line of sight clears surrounding peaks with sufficient margin to minimize regolith multipath scattering and antenna diffraction loss.

### Circular Interpolation Across the $0^\circ / 360^\circ$ Seam
Imported horizon profiles (`azimuth_deg,horizon_elevation_deg`) are sorted and evaluated using shortest-arc circular linear interpolation. When an azimuth $\phi$ lies between the last sample $\phi_{N-1}$ and the first sample $\phi_0$:
$$\theta_{\text{horizon}}(\phi) = \text{el}_{N-1} + \left(\frac{\phi - \phi_{N-1}}{(\phi_0 + 360^\circ) - \phi_{N-1}}\right) (\text{el}_0 - \text{el}_{N-1})$$

---

## 6. Duration Metrics & Transition Integration

Rather than relying on naive sample counting, duration metrics are integrated over actual time intervals $\Delta t_i = t_{i+1} - t_i$:

1. **Continuous Visibility:** If $t_i$ and $t_{i+1}$ are both visible, $\Delta t_i$ is added to visible duration.
2. **Continuous Obstruction:** If $t_i$ and $t_{i+1}$ are both obstructed, $\Delta t_i$ is added to obstructed duration.
3. **Visibility Transitions (Linear Margin Crossing):**  
   Let margin $m(t) = \theta_{\text{elevation}}(t) - \theta_{\text{horizon}}(\phi(t))$. When $m_i$ and $m_{i+1}$ have opposite signs, the crossing fraction is:
   $$f_{\text{cross}} = \frac{|m_i|}{|m_i| + |m_{i+1}|}$$
   The visible portion receives $f_{\text{cross}} \cdot \Delta t_i$ (if $m_i > 0$) or $(1 - f_{\text{cross}}) \cdot \Delta t_i$ (if $m_{i+1} > 0$).
4. **Missing Data Handling:** Intervals containing `NaN` or unresolvable ephemerides remain `'unknown'`. They are excluded from the valid coverage denominator and **never** misclassified as obstructed.

---

## 7. Independent Scientific Validation

In addition to software unit tests, the test suite (`tests/validation.test.ts`) verifies the data against known lunar celestial mechanics:

1. **Theoretical Polar Solar Elevation Ceiling:**  
   Given the Moon's obliquity $\varepsilon \approx 1.5424^\circ$, the maximum possible solar elevation at latitude $\lambda = -89.75^\circ$ is:
   $$\theta_{\text{sun, max}} = (90^\circ - |\lambda|) + \varepsilon = 0.25^\circ + 1.5424^\circ \approx 1.7924^\circ$$
   Our parsed Horizons dataset exhibits a maximum solar elevation of **$+1.7314^\circ$**, verifying physical consistency within the theoretical ceiling.
2. **Diurnal Azimuth Progression Rate:**  
   Over a 29.53-day synodic lunar day, the Sun traverses $360^\circ$ in azimuth ($\sim 0.508^\circ/\text{hr}$, or $\sim 0.254^\circ$ per 30 minutes). Consecutive ephemeris points confirm this exact rate ($\Delta \text{Az} \approx 0.254^\circ$).
3. **Earth Libration Geometry:**  
   For Site Beta at $0^\circ\text{E}, -86^\circ\text{S}$, the unperturbed geometric elevation toward the sub-Earth point is $90^\circ - 86^\circ = +4.0^\circ$. Accounting for optical libration during the November 2026 epoch, the mean Earth angle elevates to **$+5.04^\circ$**, confirming accurate body-fixed libration modeling.

---

## 8. Multi-Site Performance Comparison & Trade-Offs

The prototype evaluates three illustrative candidate landing regions near the south pole:

| Candidate Site | Coordinates | Topographic Setting | Sun Visible (%) | Earth Visible (%) | Both Visible (h) | Max Continuous Darkness |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: |
| **Site Alpha (Connecting Ridge)** | 89.75°S, 160.0°E | Elevated ridge near Shackleton rim | **~88 – 92%** | ~65 – 70% | ~110 – 120 h | ~14 – 18 h |
| **Site Beta (Malapert Mountain)** | 86.00°S, 0.0°E | High massif on Earth-facing meridian | ~65 – 72% | **~98 – 100%** | ~110 – 115 h | ~45 – 50 h |
| **Site Gamma (de Gerlache Rim)** | 88.50°S, 290.0°E | Rugged crater crest | ~75 – 80% | ~70 – 75% | ~90 – 100 h | ~30 – 35 h |

### Engineering Trade-Off Analysis
* **Site Alpha:** Excels in solar energy collection, minimizing secondary battery mass. However, being near $160^\circ\text{E}$, Earth dips close to the horizon during libration troughs, requiring scheduled comms passes or orbital relay support.
* **Site Beta:** Outstanding direct-to-Earth communication link uptime with high elevation margins (+4° to +6°), ideal for continuous telemetry. However, its lower latitude results in longer seasonal shadow periods.
* **Site Gamma:** Balances access to permanently shadowed crater floors for volatile sampling, but nearby topography creates periodic terrain masking.

---

## 9. Scientific Caveats & Limitations

1. **Sun Visibility $\ne$ Power Generation:** Geometric solar visibility does not guarantee electrical power. Power generation depends on solar array orientation, cosine incidence angle ($\cos \theta$), operating temperature, dust accumulation, and local terrain albedo.
2. **Earth Center Visibility $\ne$ Specific Ground Station Contact:** Earth rotates every 24 hours. Line-of-sight to Earth's center does not guarantee line-of-sight to a specific Deep Space Network (DSN) tracking station (Goldstone, Madrid, or Canberra).
3. **Geometric Line-of-Sight $\ne$ RF Link Quality:** RF communications require sufficient link budget margin, accounting for free-space path loss, antenna gain, pointing accuracy, and regolith multipath scattering.
4. **Exploration Prototype Scope:** This software is designed for preliminary mission concept exploration and Space Apps challenge demonstration. It is **not** certified for operational flight navigation, descent trajectory guidance, or landing hazard avoidance.

---

## 10. References & External Resources

* **NASA JPL Horizons System:** [https://ssd.jpl.nasa.gov/horizons/](https://ssd.jpl.nasa.gov/horizons/)
* **Horizons API Documentation:** [https://ssd-api.jpl.nasa.gov/doc/horizons.html](https://ssd-api.jpl.nasa.gov/doc/horizons.html)
* **LROC QuickMap:** [https://quickmap.lroc.asu.edu/](https://quickmap.lroc.asu.edu/)
* **NASA Moon Trek:** [https://trek.nasa.gov/moon/](https://trek.nasa.gov/moon/)
* **Canadian Space Agency (CSA) Moon Exploration:** [https://www.asc-csa.gc.ca/eng/astronomy/moon-exploration/](https://www.asc-csa.gc.ca/eng/astronomy/moon-exploration/)
* **NASA Space Apps Challenge:** [https://www.spaceappschallenge.org/](https://www.spaceappschallenge.org/)

---
*Built with React 18, TypeScript, Vite, Tailwind CSS, Express, and Lucide.*

