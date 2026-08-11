import { useState, useEffect } from 'react';
import { getCountryDetails } from '../data/countryData';

/**
 * CountryTooltip component
 * Renders a compact, dark semi-transparent tooltip near the mouse cursor
 * when a country is hovered on the 3D Earth sphere.
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
      // Do not show hover tooltips for touch devices or while dragging (buttons !== 0)
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

  if (!displayCountry) {
    return null;
  }

  const details = getCountryDetails(displayCountry);
  const countryName = details?.name || displayCountry.properties?.name || 'Unknown Territory';
  const capitalName =
    details?.capital &&
    details.capital !== 'Capital City' &&
    details.capital !== 'No officially designated capital'
      ? details.capital
      : null;

  // Offset tooltip slightly from cursor (14px right, 14px down)
  const offset = 14;
  let left = pos.x + offset;
  let top = pos.y + offset;

  // Viewport bounds checking to prevent clipping at screen edges
  const tooltipWidth = 150;
  const tooltipHeight = 36;

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
      className={`fixed z-50 pointer-events-none transition-all duration-150 ease-out ${
        isShowing ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
      }`}
      style={{
        left: `${left}px`,
        top: `${top}px`,
      }}
    >
      <div className="px-3 py-1.5 bg-slate-950/90 text-slate-100 text-xs font-medium border border-slate-800 rounded-md shadow-xl backdrop-blur-md flex items-center gap-2 whitespace-nowrap">
        <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0" />
        <span className="tracking-wide font-sans">{countryName}</span>
        {capitalName && (
          <span className="text-slate-400 text-[11px] font-normal font-sans border-l border-slate-800/80 pl-2 ml-0.5">
            Capital: <span className="text-sky-200/90 font-medium">{capitalName}</span>
          </span>
        )}
      </div>
    </div>
  );
}
