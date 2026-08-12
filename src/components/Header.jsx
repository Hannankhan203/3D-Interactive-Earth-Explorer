import { useRef } from 'react';
import CountrySearch from './CountrySearch';
import TimeSimulationControls from './TimeSimulationControls';

/**
 * Header Component — Slim, Professional Observatory Header
 * Left: Logo/Brand
 * Center: Integrated Country Search Console
 * Right: Time Simulation Controls & Help/Shortcuts trigger
 */
export default function Header({
  onSelectCountry,
  simulatedTime,
  onSimulateTime,
  onOpenShortcuts,
  resetTrigger,
}) {
  const searchRef = useRef(null);

  return (
    <header className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between gap-2 px-3 py-2 sm:px-4 sm:py-2.5 bg-gradient-to-b from-[#01040f]/95 via-[#01040f]/80 to-transparent backdrop-blur-md border-b border-cyan-900/30 font-mono">
      {/* LEFT: Brand mark */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
        <div className="flex flex-col">
          <h1 className="text-xs sm:text-sm font-bold tracking-widest text-slate-100 uppercase leading-none font-sans">
            EARTH EXPLORER
          </h1>
          <span className="text-[9px] text-cyan-500 tracking-wider uppercase mt-0.5 leading-none hidden sm:inline">
            3D OBSERVATORY
          </span>
        </div>
      </div>

      {/* CENTER: Country Search Console */}
      <div className="flex-1 max-w-md mx-2 sm:mx-4">
        <CountrySearch
          ref={searchRef}
          onSelectCountry={onSelectCountry}
          resetTrigger={resetTrigger}
        />
      </div>

      {/* RIGHT: Time Controls & Help Shortcuts */}
      <div className="flex items-center gap-2 shrink-0">
        <TimeSimulationControls
          simulatedTime={simulatedTime}
          onSimulateTime={onSimulateTime}
        />

        {/* Shortcuts Matrix Trigger */}
        <button
          type="button"
          onClick={onOpenShortcuts}
          className="w-8 h-8 flex items-center justify-center rounded-md bg-[#020617]/90 hover:bg-cyan-950 text-slate-300 hover:text-cyan-200 border border-cyan-900/40 hover:border-cyan-500/50 backdrop-blur-md transition-all shadow-lg cursor-pointer text-xs focus-visible:outline-none"
          title="Controls Matrix (?)"
          aria-label="Controls Matrix"
        >
          <span className="font-bold text-xs">?</span>
        </button>
      </div>
    </header>
  );
}
