import { useState, useEffect, useRef } from 'react';
import EarthCanvas from './components/EarthCanvas';
import Header from './components/Header';
import CountryInfoPanel from './components/CountryInfoPanel';
import CountryTooltip from './components/CountryTooltip';
import NavControls from './components/NavControls';
import ShortcutsModal from './components/ShortcutsModal';
import NavHint from './components/NavHint';
import { countryFeatures } from './utils/countryUtils';
import { getCountryDetails } from './data/countryData';

/**
 * Earth Explorer — Main Application Shell
 * Complete new UI build from scratch.
 * Presents a modern 3D geographic exploration interface centering the Earth,
 * framed by a slim top header with search console, astronomical chrono controls,
 * draggable/resizable territory dossier, camera gimbal controls, and coordinates HUD.
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

  // Handle Earth Canvas Initialization callbacks
  const handleEarthReady = () => {
    setIsEarthReady(true);
    setTimeout(() => {
      setShowLoadingOverlay(false);
    }, 500);
  };

  const handleEarthError = (errMsg) => {
    setEarthError(errMsg || 'Unable to initialize 3D WebGL graphics context.');
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

  // Parse shareable country URL parameter on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const countryParam = params.get('country');
    if (countryParam) {
      const paramLower = countryParam.toLowerCase();
      const match = countryFeatures.find((f) => {
        const name = f.properties?.name || '';
        const details = getCountryDetails(f);
        return (
          name.toLowerCase() === paramLower ||
          details?.name?.toLowerCase() === paramLower ||
          details?.officialName?.toLowerCase() === paramLower
        );
      });
      if (match) {
        setSelectedCountry(match);
      }
    }
  }, []);

  // Sync selected country state to URL query parameter
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    if (selectedCountry) {
      const details = getCountryDetails(selectedCountry);
      const name = details?.name || selectedCountry.properties?.name || '';
      if (name) {
        url.searchParams.set('country', name);
      }
    } else {
      url.searchParams.delete('country');
    }
    window.history.replaceState({}, '', url.toString());
  }, [selectedCountry]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
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
    <div className="w-full h-full bg-[#01040f] text-slate-100 font-sans overflow-hidden relative select-none">
      {/* 3D WebGL Earth Canvas (Full Viewport Hero Object) */}
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
          className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#01040f] text-slate-100 transition-opacity duration-500 ease-out font-mono ${
            isEarthReady && !earthError ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
        >
          {earthError ? (
            <div className="max-w-md mx-auto px-6 text-center space-y-4">
              <div className="w-12 h-12 mx-auto rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-lg">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-sm font-bold text-slate-100 uppercase tracking-widest">
                GRAPHICS INITIALIZATION FAILURE
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                {earthError}
              </p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded text-xs font-mono text-cyan-300 transition-colors cursor-pointer shadow-md"
              >
                REINITIALIZE INSTRUMENT
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 text-center px-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                <h1 className="text-sm font-bold tracking-widest uppercase text-slate-200">
                  EARTH EXPLORER // DIGITAL OBSERVATORY
                </h1>
              </div>

              <div className="flex items-center gap-2.5 text-xs text-cyan-400">
                <div className="w-4 h-4 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
                <span>RENDERING 3D GEOGRAPHIC MESH...</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Top Observatory Header */}
      <Header
        onSelectCountry={setSelectedCountry}
        simulatedTime={simulatedTime}
        onSimulateTime={setSimulatedTime}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        resetTrigger={resetTrigger}
      />

      {/* Spatial Geographic Dossier / Inspector Surface */}
      <CountryInfoPanel
        selectedFeature={selectedCountry}
        onSelectCountry={setSelectedCountry}
        onClose={() => setSelectedCountry(null)}
      />

      {/* Spatial Cursor Telemetry Tooltip */}
      <CountryTooltip hoveredCountry={hoveredCountry} />

      {/* Bottom Orbital Telemetry & Navigation Gimbal */}
      <div className="absolute bottom-[calc(0.75rem+env(safe-area-inset-bottom))] right-[calc(0.75rem+env(safe-area-inset-right))] z-30 flex flex-col items-end gap-1.5 sm:gap-2 pointer-events-none font-mono">
        {/* Geographic Coordinates HUD Readout */}
        <div className="px-2 py-0.5 sm:px-2.5 sm:py-1 bg-[#020617]/90 border border-cyan-500/30 rounded backdrop-blur-md shadow-lg text-[9px] sm:text-[10px] font-mono text-cyan-300 flex items-center gap-1.5 sm:gap-2">
          <span className="text-slate-500 hidden sm:inline">POS:</span>
          <span>
            {Math.abs(coords.lat || 0).toFixed(4)}° {coords.lat >= 0 ? 'N' : 'S'}
          </span>
          <span className="text-slate-600">&bull;</span>
          <span>
            {Math.abs(coords.lon || 0).toFixed(4)}° {coords.lon >= 0 ? 'E' : 'W'}
          </span>
        </div>

        {/* Gimbal Navigation Toolbar */}
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

      {/* Interaction Guidance Hint */}
      <NavHint />

      {/* Control Shortcuts Matrix Modal */}
      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />
    </div>
  );
}
