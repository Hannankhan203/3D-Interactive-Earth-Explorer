import { useState, useEffect } from 'react';
import EarthCanvas from './components/EarthCanvas';
import CountryInfoPanel from './components/CountryInfoPanel';
import CountrySearch from './components/CountrySearch';
import CountryTooltip from './components/CountryTooltip';
import TimeSimulationControls from './components/TimeSimulationControls';
import NavControls from './components/NavControls';

/**
 * Main Application Component
 * Immersive 3D Geographic Exploration Interface with full-screen WebGL canvas,
 * understated identity mark, compact geographic search, and subtle telemetry.
 */
export default function App() {
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [hoveredCountry, setHoveredCountry] = useState(null);
  const [coords, setCoords] = useState({ lat: 30.0, lon: 69.5 });
  const [showHint, setShowHint] = useState(true);
  const [simulatedTime, setSimulatedTime] = useState(null);
  const [resetTrigger, setResetTrigger] = useState(0);
  const [zoomInTrigger, setZoomInTrigger] = useState(0);
  const [zoomOutTrigger, setZoomOutTrigger] = useState(0);

  const handleResetGlobe = () => {
    setSelectedCountry(null);
    setResetTrigger((prev) => prev + 1);
  };

  const handleZoomIn = () => {
    setZoomInTrigger((prev) => prev + 1);
  };

  const handleZoomOut = () => {
    setZoomOutTrigger((prev) => prev + 1);
  };

  const handleClearSelection = () => {
    setSelectedCountry(null);
  };

  // Smoothly fade out interaction hint after 4s or on user interaction
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowHint(false);
    }, 4000);

    const handleInteraction = () => {
      setShowHint(false);
    };

    window.addEventListener('pointerdown', handleInteraction, { passive: true });
    window.addEventListener('wheel', handleInteraction, { passive: true });
    window.addEventListener('touchstart', handleInteraction, { passive: true });

    return () => {
      clearTimeout(timer);
      window.removeEventListener('pointerdown', handleInteraction);
      window.removeEventListener('wheel', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
    };
  }, []);

  return (
    <div className="w-full h-full bg-[#030712] text-slate-100 font-sans overflow-hidden relative select-none">
      {/* 3D WebGL Earth Canvas (Full Viewport) */}
      <div className="absolute inset-0 z-0">
        <EarthCanvas
          selectedCountry={selectedCountry}
          onCountrySelect={setSelectedCountry}
          onCountryHover={setHoveredCountry}
          onCoordinatesUpdate={setCoords}
          simulatedTime={simulatedTime}
          resetTrigger={resetTrigger}
          zoomInTrigger={zoomInTrigger}
          zoomOutTrigger={zoomOutTrigger}
        />
      </div>

      {/* Minimal Geographic Navigation Controls */}
      <NavControls
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetView={handleResetGlobe}
        onClearSelection={handleClearSelection}
        hasSelection={Boolean(selectedCountry)}
      />

      {/* Permanent User-Facing Time Simulation Controls */}
      <TimeSimulationControls
        simulatedTime={simulatedTime}
        onSimulateTime={setSimulatedTime}
      />

      {/* Top Left Floating Identity & Search Overlay */}
      <div className="absolute top-4 left-4 z-30 max-w-[calc(100vw-32px)]">
        <div className="flex flex-col gap-2">
          {/* Understated Identity Label & Unobtrusive Reset Control */}
          <div className="flex items-center justify-between pl-0.5 gap-3">
            <div className="flex items-center gap-2 pointer-events-none">
              <span className="w-1 h-1 rounded-full bg-cyan-400/80 shrink-0" />
              <span className="text-[11px] font-semibold tracking-wider text-slate-300 uppercase font-sans">
                Earth Explorer
              </span>
            </div>

            {/* Reset / Clear Control */}
            <button
              type="button"
              onClick={handleResetGlobe}
              className="flex items-center gap-1 px-2 py-0.5 bg-slate-950/80 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded text-[10px] font-medium text-slate-400 hover:text-slate-200 transition-colors cursor-pointer backdrop-blur-md shadow-sm"
              title="Reset view and clear selection"
            >
              <svg className="w-3 h-3 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Reset View</span>
            </button>
          </div>

          {/* Compact Geographic Search Interface */}
          <CountrySearch onSelectCountry={setSelectedCountry} resetTrigger={resetTrigger} />
        </div>
      </div>

      {/* Contextual Country Information Panel */}
      <CountryInfoPanel
        selectedFeature={selectedCountry}
        onSelectCountry={setSelectedCountry}
        onClose={() => setSelectedCountry(null)}
      />

      {/* Hover Country Tooltip */}
      <CountryTooltip hoveredCountry={hoveredCountry} />

      {/* Bottom Left Navigation Hint (Fades Out) */}
      <div
        className={`absolute bottom-4 left-4 z-20 pointer-events-none transition-opacity duration-700 ease-out ${
          showHint ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <p className="text-[10px] font-sans text-slate-400/70 tracking-wide">
          Drag to rotate &bull; Scroll to zoom
        </p>
      </div>

      {/* Bottom Right Telemetry */}
      <div className="absolute bottom-4 right-4 z-20 pointer-events-none">
        <div className="text-[10px] font-mono text-slate-400/90 tracking-wide flex items-center gap-1.5">
          <span>
            {Math.abs(coords.lat || 0).toFixed(4)}° {coords.lat >= 0 ? 'N' : 'S'}
          </span>
          <span className="text-slate-600">&bull;</span>
          <span>
            {Math.abs(coords.lon || 0).toFixed(4)}° {coords.lon >= 0 ? 'E' : 'W'}
          </span>
        </div>
      </div>
    </div>
  );
}


