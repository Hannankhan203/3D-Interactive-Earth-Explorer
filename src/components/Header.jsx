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
    <header className="absolute top-0 left-0 right-0 z-30 flex flex-wrap sm:flex-nowrap items-center justify-between gap-1.5 sm:gap-2 px-2.5 py-2 sm:px-4 sm:py-2.5 bg-gradient-to-b from-[#01040f]/95 via-[#01040f]/85 to-transparent backdrop-blur-md border-b border-cyan-900/30 font-mono pt-[calc(0.5rem+env(safe-area-inset-top))] pl-[calc(0.625rem+env(safe-area-inset-left))] pr-[calc(0.625rem+env(safe-area-inset-right))]">
      {/* TOP ROW / LEFT: Brand mark */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
        <div className="flex flex-col">
          <h1 className="text-xs sm:text-sm font-bold tracking-widest text-slate-100 uppercase leading-none font-sans">
            EARTH EXPLORER
          </h1>
          <span className="text-[8px] text-cyan-500 tracking-wider uppercase mt-0.5 leading-none hidden sm:inline">
            3D OBSERVATORY
          </span>
        </div>
      </div>

      {/* TOP ROW / RIGHT on mobile: Time Controls & Help Shortcuts */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 order-2 sm:order-3">
        <TimeSimulationControls
          simulatedTime={simulatedTime}
          onSimulateTime={onSimulateTime}
        />

        {/* Shortcuts Matrix Trigger */}
        <button
          type="button"
          onClick={onOpenShortcuts}
          className="w-8 h-8 sm:w-8 sm:h-8 flex items-center justify-center rounded-md bg-[#020617]/90 hover:bg-cyan-950 text-slate-300 hover:text-cyan-200 border border-cyan-900/40 hover:border-cyan-500/50 backdrop-blur-md transition-all shadow-lg cursor-pointer text-xs focus-visible:outline-none shrink-0"
          title="Controls Matrix (?)"
          aria-label="Controls Matrix"
        >
          <span className="font-bold text-xs">?</span>
        </button>
      </div>

      {/* ROW 2 on mobile / CENTER on desktop: Country Search Console */}
      <div className="w-full sm:w-auto sm:flex-1 sm:max-w-md order-3 sm:order-2 mt-0.5 sm:mt-0">
        <CountrySearch
          ref={searchRef}
          onSelectCountry={onSelectCountry}
          resetTrigger={resetTrigger}
        />
      </div>
    </header>
  );
}
