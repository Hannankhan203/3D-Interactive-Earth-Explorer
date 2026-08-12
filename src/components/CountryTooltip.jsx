import { useState, useEffect } from 'react';
import { getCountryDetails } from '../data/countryData';

/**
 * CountryTooltip Component — Spatial Cursor Telemetry Badge
 * Displays a technical hover badge near the cursor when hovering over any territory on the 3D Earth.
 */
export default function CountryTooltip({ hoveredCountry }) {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const [displayCountry, setDisplayCountry] = useState(null);

  useEffect(() => {
    if (hoveredCountry) {
      setDisplayCountry(hoveredCountry);
    }
  }, [hoveredCountry]);

  useEffect(() => {
    const handlePointerMove = (e) => {
      // Hide on touch or active drag buttons
      if (e.pointerType === 'touch' || e.buttons !== 0) {
        setIsVisible(false);
        return;
      }
      setPos({ x: e.clientX, y: e.clientY });
      if (hoveredCountry) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    const handlePointerDown = () => {
      setIsVisible(false);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerdown', handlePointerDown);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [hoveredCountry]);

  if (!displayCountry) return null;

  const details = getCountryDetails(displayCountry);
  const countryName = details?.name || displayCountry.properties?.name || 'Unknown Territory';
  const capitalName =
    details?.capital &&
    details.capital !== 'Capital City' &&
    details.capital !== 'No officially designated capital'
      ? details.capital
      : null;

  const offset = 14;
  let left = pos.x + offset;
  let top = pos.y + offset;

  const tooltipWidth = 180;
  const tooltipHeight = 44;

  if (typeof window !== 'undefined') {
    if (left + tooltipWidth > window.innerWidth - 8) {
      left = pos.x - tooltipWidth - 8;
    }
    if (top + tooltipHeight > window.innerHeight - 8) {
      top = pos.y - tooltipHeight - 8;
    }
    if (left < 8) left = 8;
    if (top < 8) top = 8;
  }

  const isShowing = hoveredCountry && isVisible;

  return (
    <div
      className={`fixed z-50 pointer-events-none transition-all duration-150 ease-out font-mono ${
        isShowing ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
      }`}
      style={{
        left: `${left}px`,
        top: `${top}px`,
      }}
    >
      <div className="px-3 py-1.5 bg-[#020617]/95 text-slate-100 text-xs border border-cyan-500/40 rounded shadow-2xl backdrop-blur-xl flex items-center gap-2 whitespace-nowrap relative">
        {/* Corner Accents */}
        <div className="absolute top-0.5 left-0.5 w-1 h-1 border-t border-l border-cyan-400" />
        <div className="absolute top-0.5 right-0.5 w-1 h-1 border-t border-r border-cyan-400" />
        <div className="absolute bottom-0.5 left-0.5 w-1 h-1 border-b border-l border-cyan-400" />
        <div className="absolute bottom-0.5 right-0.5 w-1 h-1 border-b border-r border-cyan-400" />

        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0 animate-pulse" />
        <span className="tracking-wide font-bold font-sans text-slate-100">{countryName}</span>

        {capitalName && (
          <span className="text-slate-400 text-[10px] font-normal border-l border-slate-800 pl-2 ml-0.5">
            CAPITAL: <span className="text-cyan-300 font-medium font-sans">{capitalName}</span>
          </span>
        )}
      </div>
    </div>
  );
}
