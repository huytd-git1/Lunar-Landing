import React from 'react';
import { X, BookOpen, Compass, Sun, Globe, AlertTriangle, ExternalLink } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface HowItWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowItWorksModal: React.FC<HowItWorksModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { t } = useLanguage();
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
                {t.hiwModalTitle}
              </h2>
              <p className="text-xs text-slate-400">
                {t.hiwModalSub}
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
              <span>{t.hiwSec1Title}</span>
            </h3>
            <p>
              {t.hiwSec1P1}
            </p>
            <p>
              {t.hiwSec1P2}
            </p>
          </div>

          {/* Section 2: Earth Libration */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-cyan-300 flex items-center space-x-1.5">
              <Globe className="w-4 h-4 text-blue-400" />
              <span>{t.hiwSec2Title}</span>
            </h3>
            <p>
              {t.hiwSec2P1}
            </p>
            <p>
              {t.hiwSec2P2}
            </p>
          </div>

          {/* Section 3: Horizons API & Coordinate Conventions */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-cyan-300 flex items-center space-x-1.5">
              <Compass className="w-4 h-4 text-emerald-400" />
              <span>{t.hiwSec3Title}</span>
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
              {t.hiwSec4Title}
            </h3>
            <p>
              {t.hiwSec4Desc}
            </p>
            <div className="bg-slate-900 p-2.5 rounded font-mono text-[11px] text-cyan-300 border border-slate-800 text-center">
              visible(t) = object_elevation(t) &gt; horizon_elevation(object_azimuth(t))
            </div>
            <p>
              {t.hiwSec4Modes}
            </p>
          </div>

          {/* Section 5: Scientific Caveats & Engineering Constraints */}
          <div className="p-3.5 bg-amber-950/30 border border-amber-500/40 rounded-xl space-y-2">
            <div className="flex items-center space-x-2 text-amber-300 font-semibold text-xs">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>{t.hiwSec5Title}</span>
            </div>
            <ul className="list-disc list-inside space-y-1.5 text-slate-300 text-[11px]">
              <li>
                {t.hiwCaveat1}
              </li>
              <li>
                {t.hiwCaveat2}
              </li>
              <li>
                {t.hiwCaveat3}
              </li>
              <li>
                {t.hiwCaveat4}
              </li>
            </ul>
          </div>

          {/* Section 6: Official Reference Resources */}
          <div className="pt-2 border-t border-slate-800 space-y-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              {t.hiwSec6Title}
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
            {t.closeBtn}
          </button>
        </div>
      </div>
    </div>
  );
};

