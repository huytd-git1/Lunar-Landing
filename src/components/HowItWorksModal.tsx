import React from 'react';
import { X, BookOpen, Compass, Sun, Globe, AlertTriangle, ExternalLink } from 'lucide-react';

interface HowItWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowItWorksModal: React.FC<HowItWorksModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#0B1120] border border-slate-700 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 sticky top-0 bg-[#0B1120] z-10">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-lg bg-cyan-950 border border-cyan-500/40 text-cyan-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                How It Works: Lunar Polar Ephemerides & Horizon Analysis
              </h2>
              <p className="text-xs text-slate-400">
                Aerospace engineering principles, coordinate frames, and scientific caveats
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-5 text-xs text-slate-300 leading-relaxed">
          {/* Section 1: Lunar Polar Geometry */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-cyan-300 flex items-center space-x-1.5">
              <Sun className="w-4 h-4 text-amber-400" />
              <span>1. Lunar Polar Geometry & Grazing Solar Illumination</span>
            </h3>
            <p>
              Unlike Earth&apos;s axial tilt of 23.44°, the Moon&apos;s rotational axis is tilted only{' '}
              <strong className="text-white">1.5424°</strong> relative to the ecliptic plane. Consequently, at the lunar south pole (latitudes &le; 85°S), the Sun never rises high in the sky. Instead, it slowly circles the local horizon over a <strong className="text-white">29.53-day synodic lunar day</strong>, staying within approximately &plusmn;1.5° of the horizontal plane.
            </p>
            <p>
              Because the solar rays arrive at near-horizontal grazing angles, even modest topographical elevations (such as crater rims and massifs) cast extremely long shadows. Elevated ridges (like Shackleton&apos;s Connecting Ridge) experience extended periods of near-continuous illumination, while depressed crater floors (like Shackleton, Faustini, and Shoemaker) remain in perpetual darkness as <strong className="text-white">Permanently Shadowed Regions (PSRs)</strong>.
            </p>
          </div>

          {/* Section 2: Earth Libration */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-cyan-300 flex items-center space-x-1.5">
              <Globe className="w-4 h-4 text-blue-400" />
              <span>2. Earth Libration & Communications Line of Sight</span>
            </h3>
            <p>
              The Moon is tidally locked to Earth, so the same lunar hemisphere predominantly faces Earth. However, due to orbital eccentricity and tilt, the Moon undergoes <strong className="text-white">optical and physical libration</strong> of approximately &plusmn;6.7° in latitude and &plusmn;8.0° in longitude.
            </p>
            <p>
              As seen by an astronaut or lander near the south pole, Earth does not rise and set daily. Instead, it traces out a slow <strong className="text-white">27.3-day libration oval</strong> in the sky, oscillating a few degrees above and below the horizon. On the Earth-facing meridian (0°E), Earth remains around +4° to +5° elevation. Further toward the farside (e.g. 160°E), Earth periodically dips below local topography, creating direct communications blackouts unless supported by lunar relay orbiters.
            </p>
          </div>

          {/* Section 3: Horizons API & Coordinate Conventions */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-cyan-300 flex items-center space-x-1.5">
              <Compass className="w-4 h-4 text-emerald-400" />
              <span>3. Coordinate Conventions & Horizons Specification</span>
            </h3>
            <ul className="list-disc list-inside space-y-1 text-slate-300 bg-slate-900/60 p-3 rounded-lg border border-slate-800">
              <li>
                <strong className="text-white">Observer Body:</strong> Specified as <code className="text-cyan-300">coord@301</code> (Moon Body-Fixed Geodetic frame).
              </li>
              <li>
                <strong className="text-white">Reference Sphere:</strong> Lunar mean radius <code className="text-cyan-300">R = 1737.4 km</code> (IAU / LOLA standard).
              </li>
              <li>
                <strong className="text-white">Longitude Convention:</strong> Strictly <strong className="text-white">East-positive [0° to 360°]</strong>.
              </li>
              <li>
                <strong className="text-white">Local Azimuth:</strong> Measured clockwise from local North: 0° = North, 90° = East, 180° = South, 270° = West.
              </li>
              <li>
                <strong className="text-white">Vacuum Environment:</strong> Lunar surface has no atmosphere; Earth atmospheric refraction corrections are disabled.
              </li>
            </ul>
          </div>

          {/* Section 4: Point-Object Approximation & Circular Interpolation */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-cyan-300">
              4. Horizon Modeling & Circular Interpolation
            </h3>
            <p>
              Visibility is calculated using the documented point-object approximation:
            </p>
            <div className="bg-slate-900 p-2.5 rounded font-mono text-[11px] text-cyan-300 border border-slate-800 text-center">
              visible(t) = object_elevation(t) &gt; horizon_elevation(object_azimuth(t))
            </div>
            <p>
              In <strong className="text-white">Geometric Mode</strong>, the horizon elevation is fixed at 0.0°. In <strong className="text-white">Terrain Mode</strong>, the local horizon profile is evaluated using circular linear interpolation across the 0°/360° seam to ensure continuous topography wrapping.
            </p>
          </div>

          {/* Section 5: Scientific Caveats & Engineering Constraints */}
          <div className="p-3.5 bg-amber-950/30 border border-amber-500/40 rounded-xl space-y-2">
            <div className="flex items-center space-x-2 text-amber-300 font-semibold text-xs">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Scientific Caveats & Practical Engineering Limitations</span>
            </div>
            <ul className="list-disc list-inside space-y-1.5 text-slate-300 text-[11px]">
              <li>
                <strong className="text-white">Sun Visibility &ne; Electrical Power Generation:</strong> Actual power output depends on solar array orientation, cosine of incidence angle, temperature coefficients, dust accumulation, and terrain-reflected radiation (albedo).
              </li>
              <li>
                <strong className="text-white">Earth-Center Visibility &ne; Ground Station Line-of-Sight:</strong> Earth rotates once every 24 hours. Visibility of the Earth center does not guarantee line-of-sight to a specific Deep Space Network (DSN) antenna complex (Goldstone, Madrid, or Canberra).
              </li>
              <li>
                <strong className="text-white">Geometric Line-of-Sight &ne; RF Radio Link:</strong> Direct line-of-sight is necessary but not sufficient. Multipath fading caused by regolith reflections, RF link margins, and antenna pointing error must be accounted for.
              </li>
              <li>
                <strong className="text-white">Exploratory Prototype Scope:</strong> This prototype is built for preliminary exploration and candidate site comparison for the NASA Space Apps Challenge, not for operational flight descent trajectory guidance or human landing system certification.
              </li>
            </ul>
          </div>

          {/* Section 6: Official Reference Resources */}
          <div className="pt-2 border-t border-slate-800 space-y-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Official NASA & CSA Resources
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <a
                href="https://quickmap.lroc.asu.edu/"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-slate-900 hover:bg-slate-850 rounded border border-slate-800 flex items-center justify-between text-cyan-300 hover:text-cyan-200 transition"
              >
                <span>LROC QuickMap (LOLA Topography)</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <a
                href="https://trek.nasa.gov/moon/"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-slate-900 hover:bg-slate-850 rounded border border-slate-800 flex items-center justify-between text-cyan-300 hover:text-cyan-200 transition"
              >
                <span>NASA Moon Trek Portal</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <a
                href="https://ssd.jpl.nasa.gov/horizons/"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-slate-900 hover:bg-slate-850 rounded border border-slate-800 flex items-center justify-between text-cyan-300 hover:text-cyan-200 transition"
              >
                <span>JPL Horizons Ephemeris System</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <a
                href="https://www.asc-csa.gc.ca/eng/astronomy/moon-exploration/"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-slate-900 hover:bg-slate-850 rounded border border-slate-800 flex items-center justify-between text-cyan-300 hover:text-cyan-200 transition"
              >
                <span>Canadian Space Agency (CSA) Moon Exploration</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 flex justify-end bg-[#0B1120]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs transition"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};

