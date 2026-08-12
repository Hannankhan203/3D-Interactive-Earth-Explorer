import { useState, useEffect, useRef } from 'react';

/**
 * Astronomical Chrono Instrument
 * Complete UI rebuild: A specialized solar time instrument for calculating
 * subsolar positioning, real-time day/night lighting, solar hour scrubbing,
 * solar position presets (Noon, Sunset, Midnight, Sunrise), and date simulation.
 */
export default function TimeSimulationControls({ simulatedTime, onSimulateTime }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const containerRef = useRef(null);

  // Update real-time ticker every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Handle outside click to close popover
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const activeDate = simulatedTime instanceof Date && !isNaN(simulatedTime.getTime())
    ? simulatedTime
    : currentTime;

  const isSimulated = Boolean(simulatedTime);

  // Compute UTC Hours (0-24)
  const utcHoursDecimal =
    activeDate.getUTCHours() +
    activeDate.getUTCMinutes() / 60 +
    activeDate.getUTCSeconds() / 3600;

  // Format UTC string
  const formatUtcString = (d) => {
    const hrs = String(d.getUTCHours()).padStart(2, '0');
    const mins = String(d.getUTCMinutes()).padStart(2, '0');
    const secs = String(d.getUTCSeconds()).padStart(2, '0');
    return `${hrs}:${mins}:${secs} UTC`;
  };

  // Format Date string
  const formatDateString = (d) => {
    return d.toISOString().split('T')[0];
  };

  // Set hour on active date
  const handleHourChange = (newDecimalHours) => {
    const base = new Date(activeDate);
    const h = Math.floor(newDecimalHours);
    const m = Math.floor((newDecimalHours - h) * 60);
    const s = Math.floor(((newDecimalHours - h) * 60 - m) * 60);

    base.setUTCHours(h, m, s, 0);
    onSimulateTime(base);
  };

  // Solar Presets
  const handlePreset = (targetUtcHours) => {
    const base = new Date(activeDate);
    base.setUTCHours(targetUtcHours, 0, 0, 0);
    onSimulateTime(base);
  };

  // Handle Date picker change
  const handleDateInput = (dateStr) => {
    if (!dateStr) return;
    const [year, month, day] = dateStr.split('-').map(Number);
    const base = new Date(activeDate);
    base.setUTCFullYear(year, month - 1, day);
    onSimulateTime(base);
  };

  // Reset to live real-time
  const handleReset = () => {
    onSimulateTime(null);
  };

  // Sun Phase Status (based on UTC decimal hours)
  let solarPhase = 'DAYLIGHT';
  let solarIcon = '☀️';
  if (utcHoursDecimal >= 5 && utcHoursDecimal < 7) {
    solarPhase = 'SUNRISE';
    solarIcon = '🌅';
  } else if (utcHoursDecimal >= 7 && utcHoursDecimal < 17) {
    solarPhase = 'SOLAR DAY';
    solarIcon = '☀️';
  } else if (utcHoursDecimal >= 17 && utcHoursDecimal < 19) {
    solarPhase = 'SUNSET';
    solarIcon = '🌇';
  } else {
    solarPhase = 'NIGHT';
    solarIcon = '🌙';
  }

  return (
    <div ref={containerRef} className="relative z-40 font-mono">
      {/* Compact Chrono Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`group flex items-center gap-2.5 px-3 py-2 rounded-md border backdrop-blur-md shadow-xl transition-all cursor-pointer select-none text-xs ${
          isSimulated
            ? 'bg-amber-950/90 text-amber-300 border-amber-600/70 hover:border-amber-400'
            : 'bg-[#020617]/90 text-slate-300 border-cyan-900/40 hover:border-cyan-500/50 hover:text-white'
        }`}
        title="Astronomical Time Instrument"
        aria-label="Astronomical Time Instrument"
      >
        <span className="text-sm leading-none">{solarIcon}</span>

        <div className="flex flex-col items-start leading-none">
          <div className="flex items-center gap-1.5">
            <span className="font-bold font-mono tracking-wider text-[11px]">
              {formatUtcString(activeDate)}
            </span>
            {isSimulated && (
              <span className="px-1 py-0.2 text-[8px] font-mono bg-amber-500 text-black font-bold rounded">
                SIM
              </span>
            )}
          </div>
          <span className="text-[9px] text-slate-400 uppercase tracking-widest mt-0.5">
            {solarPhase}
          </span>
        </div>

        <svg className="w-3.5 h-3.5 ml-1 text-slate-400 group-hover:text-cyan-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded Chrono Instrument Console */}
      {isOpen && (
        <div className="absolute right-0 top-11 sm:top-12 w-[calc(100vw-20px)] sm:w-80 max-w-[320px] bg-[#020617]/95 border border-cyan-500/40 rounded-lg p-3 sm:p-3.5 shadow-[0_0_30px_rgba(6,182,212,0.15)] backdrop-blur-2xl text-slate-200 space-y-3 animate-in fade-in zoom-in-95 duration-150 z-50 max-h-[82vh] overflow-y-auto custom-scrollbar">
          {/* Corner Bracket Accents */}
          <div className="absolute top-1 left-1 w-2 h-2 border-t border-l border-cyan-400/80 pointer-events-none" />
          <div className="absolute top-1 right-1 w-2 h-2 border-t border-r border-cyan-400/80 pointer-events-none" />
          <div className="absolute bottom-1 left-1 w-2 h-2 border-b border-l border-cyan-400/80 pointer-events-none" />
          <div className="absolute bottom-1 right-1 w-2 h-2 border-b border-r border-cyan-400/80 pointer-events-none" />

          {/* Instrument Header */}
          <div className="flex items-center justify-between border-b border-slate-800/90 pb-2">
            <div className="flex items-center gap-2">
              <span className="text-cyan-400">⏱️</span>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-100">
                ASTRONOMICAL CHRONO
              </h3>
            </div>
            {isSimulated && (
              <button
                type="button"
                onClick={handleReset}
                className="px-2 py-1 text-[9px] font-mono text-cyan-300 bg-cyan-950/80 border border-cyan-800 hover:bg-cyan-900 rounded cursor-pointer transition-colors"
              >
                LIVE REALTIME
              </button>
            )}
          </div>

          {/* Solar Hour Scrub Dial Slider */}
          <div className="space-y-1.5 bg-[#01040f]/80 p-2.5 rounded border border-slate-800/80">
            <div className="flex items-center justify-between text-[10px] text-slate-300 font-mono">
              <span className="text-cyan-400 font-semibold">SOLAR POSITION</span>
              <span>{utcHoursDecimal.toFixed(1)} / 24.0 HRS</span>
            </div>

            <input
              type="range"
              min="0"
              max="23.98"
              step="0.1"
              value={utcHoursDecimal}
              onChange={(e) => handleHourChange(parseFloat(e.target.value))}
              aria-label="Solar position hours slider"
              className="w-full accent-cyan-400 bg-slate-900 h-2 sm:h-1.5 rounded cursor-pointer"
            />

            <div className="flex justify-between text-[8px] text-slate-500 font-mono pt-0.5">
              <span>00:00 (MIDNIGHT)</span>
              <span>12:00 (NOON)</span>
              <span>23:59</span>
            </div>
          </div>

          {/* Solar Position Quick Presets */}
          <div className="space-y-1">
            <span className="text-[9px] text-cyan-500 uppercase tracking-wider block">
              SOLAR ILLUMINATION PRESETS
            </span>
            <div className="grid grid-cols-2 xs:grid-cols-4 gap-1">
              <button
                type="button"
                onClick={() => handlePreset(6)}
                className="px-1.5 py-2 sm:py-1 bg-slate-900/80 hover:bg-cyan-950 border border-slate-800 hover:border-cyan-600 rounded text-[10px] sm:text-[9px] text-slate-300 hover:text-cyan-200 transition-colors cursor-pointer min-h-[36px] flex items-center justify-center"
              >
                🌅 SUNRISE
              </button>
              <button
                type="button"
                onClick={() => handlePreset(12)}
                className="px-1.5 py-2 sm:py-1 bg-slate-900/80 hover:bg-cyan-950 border border-slate-800 hover:border-cyan-600 rounded text-[10px] sm:text-[9px] text-slate-300 hover:text-cyan-200 transition-colors cursor-pointer min-h-[36px] flex items-center justify-center"
              >
                ☀️ NOON
              </button>
              <button
                type="button"
                onClick={() => handlePreset(18)}
                className="px-1.5 py-2 sm:py-1 bg-slate-900/80 hover:bg-cyan-950 border border-slate-800 hover:border-cyan-600 rounded text-[10px] sm:text-[9px] text-slate-300 hover:text-cyan-200 transition-colors cursor-pointer min-h-[36px] flex items-center justify-center"
              >
                🌇 SUNSET
              </button>
              <button
                type="button"
                onClick={() => handlePreset(0)}
                className="px-1.5 py-2 sm:py-1 bg-slate-900/80 hover:bg-cyan-950 border border-slate-800 hover:border-cyan-600 rounded text-[10px] sm:text-[9px] text-slate-300 hover:text-cyan-200 transition-colors cursor-pointer min-h-[36px] flex items-center justify-center"
              >
                🌙 MIDNIGHT
              </button>
            </div>
          </div>

          {/* Date Picker */}
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/80">
            <span className="text-[10px] text-slate-400">CALENDAR DATE:</span>
            <input
              type="date"
              value={formatDateString(activeDate)}
              onChange={(e) => handleDateInput(e.target.value)}
              aria-label="Simulation date input"
              className="bg-slate-900 border border-slate-800 rounded px-2 py-1 sm:py-0.5 text-xs text-cyan-300 font-mono outline-none focus:border-cyan-500 cursor-pointer min-h-[36px] sm:min-h-0"
            />
          </div>
        </div>
      )}
    </div>
  );
}
