import { useState, useEffect } from 'react';

/**
 * User-facing Time Simulation Control Panel
 * Allows users to temporarily simulate solar position and day/night illumination across different dates and times.
 * Defaults to actual real current system time.
 */
export default function TimeSimulationControls({ simulatedTime, onSimulateTime }) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputError, setInputError] = useState(null);

  // Is simulation mode currently active?
  const isSimulating = simulatedTime instanceof Date && !isNaN(simulatedTime.getTime());

  // Close panel on Escape key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Active date object: simulated Date or current live system Date
  const activeDate = isSimulating ? simulatedTime : new Date();

  // Local date formatted string for input type="date" (YYYY-MM-DD)
  const localYear = activeDate.getFullYear();
  const localMonth = String(activeDate.getMonth() + 1).padStart(2, '0');
  const localDay = String(activeDate.getDate()).padStart(2, '0');
  const dateInputVal = `${localYear}-${localMonth}-${localDay}`;

  // Local time formatted string for input type="time" (HH:MM)
  const localHours = String(activeDate.getHours()).padStart(2, '0');
  const localMinutes = String(activeDate.getMinutes()).padStart(2, '0');
  const timeInputVal = `${localHours}:${localMinutes}`;

  // Formatted date string for display (e.g. "11 Aug 2026")
  const dateDisplayStr = activeDate.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  // Formatted time string for display (e.g. "2:30 PM")
  const timeDisplayStr = activeDate.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });

  // UTC Time string for telemetry (e.g. "17:30 UTC")
  const utcHours = String(activeDate.getUTCHours()).padStart(2, '0');
  const utcMinutes = String(activeDate.getUTCMinutes()).padStart(2, '0');
  const utcDisplayStr = `${utcHours}:${utcMinutes} UTC`;

  // Quick time of day presets
  const PRESETS = [
    { label: 'Solar Noon', hour: 12, min: 0, tag: '☀️ Daylight', icon: '☀️' },
    { label: 'Sunset', hour: 18, min: 0, tag: '🌅 Sunset', icon: '🌅' },
    { label: 'Midnight', hour: 0, min: 0, tag: '🌙 Night', icon: '🌙' },
    { label: 'Sunrise', hour: 6, min: 0, tag: '🌅 Sunrise', icon: '🌅' },
  ];

  // Helper to update simulated date/time with strict validation
  const updateSimulatedDateTime = (newDateStr, newTimeStr) => {
    if (!newDateStr || !newTimeStr) {
      setInputError('Please enter a valid date and time.');
      return;
    }

    const dateParts = newDateStr.split('-').map(Number);
    const timeParts = newTimeStr.split(':').map(Number);

    if (dateParts.length < 3 || timeParts.length < 2) {
      setInputError('Please enter a complete date and time.');
      return;
    }

    const [y, m, d] = dateParts;
    const [h, min] = timeParts;

    if (isNaN(y) || isNaN(m) || isNaN(d) || isNaN(h) || isNaN(min)) {
      setInputError('Invalid date or time entered. Preserving last valid state.');
      return;
    }

    const updatedDate = new Date(y, m - 1, d, h, min, 0);

    if (isNaN(updatedDate.getTime())) {
      setInputError('Invalid date or time entered. Preserving last valid state.');
      return;
    }

    if (y < 1000 || y > 3000) {
      setInputError('Year must be between 1000 and 3000.');
      return;
    }

    setInputError(null);
    onSimulateTime(updatedDate);
  };

  const handleDateChange = (e) => {
    updateSimulatedDateTime(e.target.value, timeInputVal);
  };

  const handleTimeChange = (e) => {
    updateSimulatedDateTime(dateInputVal, e.target.value);
  };

  const handleSliderChange = (e) => {
    const hourVal = parseInt(e.target.value, 10);
    const formattedHour = String(hourVal).padStart(2, '0');
    updateSimulatedDateTime(dateInputVal, `${formattedHour}:${localMinutes}`);
  };

  const handleApplyPreset = (presetHour, presetMin = 0) => {
    const formattedHour = String(presetHour).padStart(2, '0');
    const formattedMin = String(presetMin).padStart(2, '0');
    updateSimulatedDateTime(dateInputVal, `${formattedHour}:${formattedMin}`);
  };

  const handleResetToCurrentTime = () => {
    setInputError(null);
    onSimulateTime(null);
  };

  // Keep active local hours for slider
  const sliderHourVal = activeDate.getHours();

  return (
    <div className="fixed top-4 right-4 z-40 font-sans">
      {!isOpen ? (
        /* Compact Badge Button in Top Right Viewport */
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={`flex items-center gap-2 px-3 py-2 sm:py-1.5 rounded-lg border backdrop-blur-md transition-all shadow-lg cursor-pointer min-h-[36px] sm:min-h-0 focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none ${
            isSimulating
              ? 'bg-amber-950/85 border-amber-500/70 text-amber-200 hover:bg-amber-900/90 hover:border-amber-400'
              : 'bg-slate-950/85 border-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-900/90 hover:border-slate-700'
          }`}
          title="Open Time Simulation settings"
          aria-label="Time Simulation settings"
        >
          {/* Status Indicator Dot */}
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${
              isSimulating ? 'bg-amber-400 animate-pulse ring-2 ring-amber-400/30' : 'bg-emerald-400'
            }`}
          />

          <div className="flex flex-col text-left">
            <div className="flex items-center gap-1.5 leading-none">
              <span className="text-[10px] font-bold tracking-wider uppercase">
                {isSimulating ? 'Simulated Time' : 'Current Time'}
              </span>
              {isSimulating && (
                <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1 py-0.2 rounded font-mono font-medium">
                  SIM
                </span>
              )}
            </div>
            <span className="text-[11px] font-mono text-slate-400 font-medium leading-tight mt-0.5">
              {dateDisplayStr} &bull; {timeDisplayStr}
            </span>
          </div>

          <svg className="w-3.5 h-3.5 text-slate-400 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      ) : (
        /* Interactive Time Simulation Control Card */
        <div className="w-80 max-w-[calc(100vw-32px)] bg-slate-950/95 border border-slate-800 rounded-xl p-4 shadow-2xl backdrop-blur-md text-slate-200 flex flex-col gap-3.5 animate-in fade-in duration-150">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isSimulating ? 'bg-amber-400 animate-pulse ring-2 ring-amber-400/30' : 'bg-emerald-400'
                }`}
              />
              <div className="flex flex-col">
                <span className="text-xs font-bold tracking-wide text-slate-100">
                  Time & Illumination
                </span>
                <span className="text-[10px] text-slate-400">
                  Control Earth solar positioning
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1.5 text-slate-400 hover:text-slate-200 rounded-md hover:bg-slate-800/80 text-xs transition-colors cursor-pointer min-w-[28px] min-h-[28px] flex items-center justify-center focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none"
              title="Close panel"
              aria-label="Close panel"
            >
              ✕
            </button>
          </div>

          {/* Mode Switcher Segment Control */}
          <div className="grid grid-cols-2 gap-1 bg-slate-900/90 p-1 rounded-lg border border-slate-800">
            <button
              type="button"
              onClick={handleResetToCurrentTime}
              className={`py-2 sm:py-1.5 px-2 rounded-md text-[11px] font-medium transition-all cursor-pointer flex items-center justify-center gap-1.5 focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none ${
                !isSimulating
                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/50 shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${!isSimulating ? 'bg-emerald-400' : 'bg-slate-600'}`} />
              <span>Current Time</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (!isSimulating) {
                  onSimulateTime(new Date());
                }
              }}
              className={`py-2 sm:py-1.5 px-2 rounded-md text-[11px] font-medium transition-all cursor-pointer flex items-center justify-center gap-1.5 focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none ${
                isSimulating
                  ? 'bg-amber-950/80 text-amber-300 border border-amber-500/50 shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isSimulating ? 'bg-amber-400 animate-pulse' : 'bg-slate-600'}`} />
              <span>Time Simulation</span>
            </button>
          </div>

          {/* Simulation Status Notice */}
          {isSimulating ? (
            <div className="bg-amber-950/40 border border-amber-500/40 rounded-lg p-2.5 flex items-start gap-2 text-xs">
              <span className="text-amber-400 text-sm leading-none mt-0.5">⚠️</span>
              <div className="flex flex-col text-[10px] text-amber-200/90 leading-normal">
                <span className="font-semibold text-amber-300">Simulated Illumination Active</span>
                <span>Earth day/night lighting reflects custom date and time below.</span>
              </div>
            </div>
          ) : (
            <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-lg p-2.5 flex items-center justify-between text-xs">
              <div className="flex flex-col">
                <span className="text-[9px] font-mono text-emerald-400/80 uppercase tracking-wider">
                  Live Sync
                </span>
                <span className="font-semibold text-[11px] text-emerald-300">
                  REAL CURRENT UTC TIME
                </span>
              </div>
              <div className="flex flex-col text-right font-mono text-[11px]">
                <span className="text-slate-100 font-bold">{timeDisplayStr}</span>
                <span className="text-[9px] text-slate-400">{utcDisplayStr}</span>
              </div>
            </div>
          )}

          {/* Input Error Warning Banner */}
          {inputError && (
            <div className="bg-rose-950/60 border border-rose-500/50 rounded-lg p-2 flex items-center gap-2 text-xs text-rose-200">
              <span className="text-rose-400 font-bold shrink-0">⚠️</span>
              <span className="text-[10px] font-medium leading-tight font-sans">{inputError}</span>
            </div>
          )}

          {/* Date and Time Inputs */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label htmlFor="sim-date-input" className="text-[10px] font-medium text-slate-400 font-sans flex items-center justify-between">
                <span>Date</span>
                <span className="text-[9px] font-mono text-slate-500">Local</span>
              </label>
              <input
                id="sim-date-input"
                type="date"
                value={dateInputVal}
                onChange={handleDateChange}
                aria-label="Simulation Local Date"
                className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500/70 focus-visible:ring-2 focus-visible:ring-cyan-400 rounded-md px-2 py-1 text-xs text-slate-200 font-mono outline-none transition-colors cursor-pointer"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="sim-time-input" className="text-[10px] font-medium text-slate-400 font-sans flex items-center justify-between">
                <span>Time</span>
                <span className="text-[9px] font-mono text-slate-500">Local</span>
              </label>
              <input
                id="sim-time-input"
                type="time"
                value={timeInputVal}
                onChange={handleTimeChange}
                aria-label="Simulation Local Time"
                className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500/70 focus-visible:ring-2 focus-visible:ring-cyan-400 rounded-md px-2 py-1 text-xs text-slate-200 font-mono outline-none transition-colors cursor-pointer"
              />
            </div>
          </div>

          {/* 24-Hour Hour Slider Control */}
          <div className="flex flex-col gap-1.5 pt-0.5">
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
              <label htmlFor="sim-hour-slider">Time Scrub</label>
              <span className="text-amber-300 font-bold">{String(sliderHourVal).padStart(2, '0')}:00</span>
            </div>
            <input
              id="sim-hour-slider"
              type="range"
              min="0"
              max="23"
              step="1"
              value={sliderHourVal}
              onChange={handleSliderChange}
              aria-label="Simulation Hour Scrub Slider"
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400 focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none"
            />
            <div className="flex justify-between text-[8px] font-mono text-slate-500 px-0.5">
              <span>00:00</span>
              <span>06:00</span>
              <span>12:00</span>
              <span>18:00</span>
              <span>23:00</span>
            </div>
          </div>

          {/* Time of Day Presets */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
              Time Presets
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {PRESETS.map((p) => {
                const isActive =
                  isSimulating &&
                  activeDate.getHours() === p.hour;

                return (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => handleApplyPreset(p.hour, p.min)}
                    aria-label={`Apply ${p.label} preset`}
                    className={`px-2.5 py-1.5 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none ${
                      isActive
                        ? 'bg-amber-500/20 border-amber-500/60 text-amber-200 shadow-sm'
                        : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/80 text-slate-300'
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className="text-[11px] font-medium">{p.label}</span>
                      <span className="text-[9px] text-slate-400 font-mono">{p.tag}</span>
                    </div>
                    <span className="text-xs">{p.icon}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Footer */}
          <div className="border-t border-slate-800/80 pt-2.5">
            {isSimulating ? (
              <button
                type="button"
                onClick={handleResetToCurrentTime}
                className="w-full py-1.5 px-3 bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-800/80 hover:border-emerald-600 rounded-lg text-xs font-medium transition-colors cursor-pointer text-center flex items-center justify-center gap-1.5 focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Return to Real Current Time</span>
              </button>
            ) : (
              <p className="text-[10px] text-slate-400 text-center font-sans">
                Currently showing real-time solar illumination. Select Time Simulation to alter date or time.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
