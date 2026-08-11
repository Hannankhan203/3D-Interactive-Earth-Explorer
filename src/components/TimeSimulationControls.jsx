import { useState, useEffect } from 'react';

/**
 * User-facing Time Simulation Control Panel
 * Allows users to temporarily simulate solar position and day/night illumination across different dates and times.
 * Defaults to actual real current system time.
 */
export default function TimeSimulationControls({ simulatedTime, onSimulateTime }) {
  const [isOpen, setIsOpen] = useState(false);

  // Is simulation mode currently active?
  const isSimulating = simulatedTime instanceof Date && !isNaN(simulatedTime.getTime());

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

  // Helper to update simulated date/time
  const updateSimulatedDateTime = (newDateStr, newTimeStr) => {
    const [y, m, d] = newDateStr.split('-').map(Number);
    const [h, min] = newTimeStr.split(':').map(Number);
    const updatedDate = new Date(y, m - 1, d, h || 0, min || 0, 0);
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
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border backdrop-blur-md transition-all shadow-lg cursor-pointer ${
            isSimulating
              ? 'bg-amber-950/80 border-amber-500/60 text-amber-200 hover:bg-amber-900/90 hover:border-amber-400'
              : 'bg-slate-950/80 border-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-900/90 hover:border-slate-700'
          }`}
          title="Open Time Simulation settings"
          aria-label="Time Simulation settings"
        >
          {/* Status Dot */}
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${
              isSimulating ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'
            }`}
          />

          <div className="flex flex-col text-left">
            <span className="text-[10px] font-semibold tracking-wider uppercase leading-none">
              {isSimulating ? 'Time Simulation' : 'Current Time'}
            </span>
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
        <div className="w-80 bg-slate-950/95 border border-slate-800 rounded-xl p-4 shadow-2xl backdrop-blur-md text-slate-200 flex flex-col gap-3.5 animate-in fade-in duration-150">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isSimulating ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'
                }`}
              />
              <div className="flex flex-col">
                <span className="text-xs font-bold tracking-wide text-slate-100">
                  Time Simulation
                </span>
                <span className="text-[10px] font-sans text-slate-400">
                  Solar illumination & day/night control
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 text-slate-400 hover:text-slate-200 rounded-md hover:bg-slate-800/80 text-xs transition-colors cursor-pointer"
              title="Close panel"
              aria-label="Close panel"
            >
              ✕
            </button>
          </div>

          {/* Active Mode Status & Telemetry */}
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-lg p-2.5 flex items-center justify-between text-xs">
            <div className="flex flex-col">
              <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">
                Illumination Mode
              </span>
              <span
                className={`font-semibold text-[11px] ${
                  isSimulating ? 'text-amber-400' : 'text-emerald-400'
                }`}
              >
                {isSimulating ? 'TIME SIMULATION' : 'REAL CURRENT TIME'}
              </span>
            </div>
            <div className="flex flex-col text-right font-mono text-[11px]">
              <span className="text-slate-100 font-bold">{timeDisplayStr}</span>
              <span className="text-[9px] text-slate-400">{utcDisplayStr}</span>
            </div>
          </div>

          {/* Date and Time Inputs */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-medium text-slate-400 font-sans">
                Date
              </label>
              <input
                type="date"
                value={dateInputVal}
                onChange={handleDateChange}
                className="w-full bg-slate-900 border border-slate-800 focus:border-sky-500 rounded-md px-2 py-1 text-xs text-slate-200 font-mono outline-none transition-colors cursor-pointer"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-medium text-slate-400 font-sans">
                Time
              </label>
              <input
                type="time"
                value={timeInputVal}
                onChange={handleTimeChange}
                className="w-full bg-slate-900 border border-slate-800 focus:border-sky-500 rounded-md px-2 py-1 text-xs text-slate-200 font-mono outline-none transition-colors cursor-pointer"
              />
            </div>
          </div>

          {/* 24-Hour Hour Slider Control */}
          <div className="flex flex-col gap-1.5 pt-0.5">
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span>Time Scrub</span>
              <span className="text-amber-300 font-bold">{String(sliderHourVal).padStart(2, '0')}:00</span>
            </div>
            <input
              type="range"
              min="0"
              max="23"
              step="1"
              value={sliderHourVal}
              onChange={handleSliderChange}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
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
                    className={`px-2.5 py-1.5 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between ${
                      isActive
                        ? 'bg-amber-500/20 border-amber-500/60 text-amber-200'
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
                className="w-full py-1.5 px-3 bg-sky-950/60 hover:bg-sky-900/80 text-sky-300 border border-sky-800/80 hover:border-sky-600 rounded-lg text-xs font-medium transition-colors cursor-pointer text-center flex items-center justify-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Use Current Time</span>
              </button>
            ) : (
              <p className="text-[10px] text-slate-400 text-center font-sans">
                Currently showing real-time solar illumination. Change date/time above to simulate.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
