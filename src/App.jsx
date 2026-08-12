import { useState, useEffect, useRef } from 'react';
import EarthCanvas from './components/EarthCanvas';
import CountryInfoPanel from './components/CountryInfoPanel';
import CountrySearch from './components/CountrySearch';
import CountryTooltip from './components/CountryTooltip';
import TimeSimulationControls from './components/TimeSimulationControls';
import NavControls from './components/NavControls';
import ShortcutsModal from './components/ShortcutsModal';
import NavHint from './components/NavHint';

/**
 * Main Application Shell
 * Immersive 3D Earth Explorer with professional HUD shell,
 * real-time solar positioning, instant search, draggable telemetry card, and navigation tools.
 */
export default function App() {
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [hoveredCountry, setHoveredCountry] = useState(null);
  const [coords, setCoords] = useState({ lat: 30.0, lon: 69.5 });
  const [simulatedTime, setSimulatedTime] = useState(null);
  const [resetTrigger, setResetTrigger] = useState(0);
  const [zoomInTrigger, setZoomInTrigger] = useState(0);
  const [zoomOutTrigger, setZoomOutTrigger] = useState(0);
  const [isEarthReady, setIsEarthReady] = useState(false);
  const [earthError, setEarthError] = useState(null);
  const [showLoadingOverlay, setShowLoadingOverlay] = useState(true);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  const searchRef = useRef(null);

  const handleEarthReady = () => {
    setIsEarthReady(true);
    setTimeout(() => {
      setShowLoadingOverlay(false);
    }, 600);
  };

  const handleEarthError = (errMsg) => {
    setEarthError(errMsg || 'Unable to initialize 3D graphics context.');
  };

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

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore key shortcuts if active element is an input or textarea
      const tag = document.activeElement?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') {
        if (e.key === 'Escape') {
          document.activeElement.blur();
        }
        return;
      }

      if (e.key === '/') {
        e.preventDefault();
        searchRef.current?.focus();
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        handleResetGlobe();
      } else if (e.key === 'Escape') {
        setSelectedCountry(null);
        setIsShortcutsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
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
          onReady={handleEarthReady}
          onError={handleEarthError}
        />
      </div>

      {/* Loading & Error Screen Overlay */}
      {showLoadingOverlay && (
        <div
          className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#01040f] text-slate-100 transition-opacity duration-500 ease-out ${
            isEarthReady && !earthError ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
        >
          {earthError ? (
            <div className="max-w-md mx-auto px-6 text-center space-y-4 font-sans">
              <div className="w-12 h-12 mx-auto rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-lg">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-base font-semibold text-slate-100 tracking-wide">
                Unable to Load 3D Scene
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                {earthError}
              </p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-xs font-medium text-slate-200 transition-colors cursor-pointer shadow-md"
              >
                Reload Application
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 text-center px-4 font-sans">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                <h1 className="text-sm font-bold tracking-widest uppercase text-slate-200">
                  Earth Explorer
                </h1>
              </div>

              <div className="flex items-center gap-2.5 text-xs text-slate-400">
                <div className="w-4 h-4 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
                <span>Loading 3D Globe...</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Top Application Header Bar */}
      <header className="absolute top-3 left-3 right-3 sm:top-4 sm:left-4 sm:right-4 z-30 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        {/* Left: Brand Identity & Search Bar */}
        <div className="flex items-center gap-3 pointer-events-auto">
          {/* Brand Mark */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-950/85 border border-slate-800/80 rounded-lg backdrop-blur-md shadow-lg">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-xs font-bold tracking-wider text-slate-200 uppercase">
              Earth Explorer
            </span>
          </div>

          {/* Search Component */}
          <CountrySearch
            ref={searchRef}
            onSelectCountry={setSelectedCountry}
            resetTrigger={resetTrigger}
          />
        </div>

        {/* Right: Time & Solar Simulation Controls */}
        <div className="pointer-events-auto ml-auto">
          <TimeSimulationControls
            simulatedTime={simulatedTime}
            onSimulateTime={setSimulatedTime}
          />
        </div>
      </header>

      {/* Floating Geographic Information Card */}
      <CountryInfoPanel
        selectedFeature={selectedCountry}
        onSelectCountry={setSelectedCountry}
        onClose={() => setSelectedCountry(null)}
      />

      {/* Country Hover Badge Tooltip */}
      <CountryTooltip hoveredCountry={hoveredCountry} />

      {/* Bottom Floating Navigation Toolbar & Coordinates HUD */}
      <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 z-30 flex flex-col items-end gap-2 pointer-events-none">
        {/* Geographic Coordinates HUD */}
        <div className="px-2.5 py-1 bg-slate-950/80 border border-slate-800/80 rounded-lg backdrop-blur-md shadow-lg text-[10px] font-mono text-slate-300 flex items-center gap-1.5">
          <span>
            {Math.abs(coords.lat || 0).toFixed(4)}° {coords.lat >= 0 ? 'N' : 'S'}
          </span>
          <span className="text-slate-600">&bull;</span>
          <span>
            {Math.abs(coords.lon || 0).toFixed(4)}° {coords.lon >= 0 ? 'E' : 'W'}
          </span>
        </div>

        {/* Navigation Control Buttons */}
        <div className="pointer-events-auto">
          <NavControls
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onResetView={handleResetGlobe}
            onClearSelection={handleClearSelection}
            onToggleShortcuts={() => setIsShortcutsOpen(true)}
            hasSelection={Boolean(selectedCountry)}
          />
        </div>
      </div>

      {/* First-Time User Interaction Hint */}
      <NavHint />

      {/* Keyboard Shortcuts Dialog Modal */}
      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />
    </div>
  );
}
