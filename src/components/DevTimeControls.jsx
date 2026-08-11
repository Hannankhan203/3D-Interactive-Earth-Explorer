import { useState, useEffect } from 'react';

/**
 * Developer-only Time Simulation Panel
 * Allows temporary override of Sun/Day-Night calculation without modifying system clock.
 * Features quick test presets (e.g. 2 PM, 8 PM, 2 AM, 6 AM PKT) and 24-hour slider.
 */
export default function DevTimeControls({ simulatedTime, onSimulateTime }) {
  const [isOpen, setIsOpen] = useState(false);
  const [sliderHour, setSliderHour] = useState(14); // Default 14:00 PKT

  // Helper to construct a Date object for a given PKT hour (PKT = UTC+5)
  const createPktDate = (pktHour, pktMinute = 0) => {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), pktHour - 5, pktMinute, 0));
  };

  const isSimulating = simulatedTime instanceof Date;

  // Format UTC and PKT times for telemetry display
  const activeDate = isSimulating ? simulatedTime : new Date();
  const utcHours = activeDate.getUTCHours();
  const utcMinutes = activeDate.getUTCMinutes();
  const pktHours = (utcHours + 5) % 24;

  const pad = (n) => String(n).padStart(2, '0');
  const utcStr = `${pad(utcHours)}:${pad(utcMinutes)} UTC`;
  const pktStr = `${pad(pktHours)}:${pad(utcMinutes)} PKT`;

  // Quick preset test cases
  const PRESETS = [
    { label: '2:00 PM PKT', sub: 'Daytime', hour: 14, min: 0, tag: '☀️ Daylight' },
    { label: '8:00 PM PKT', sub: 'Nighttime', hour: 20, min: 0, tag: '🌙 Night' },
    { label: '2:00 AM PKT', sub: 'Nighttime', hour: 2, min: 0, tag: '🌌 Deep Night' },
    { label: '6:00 AM PKT', sub: 'Sunrise', hour: 6, min: 0, tag: '🌅 Sunrise' },
  ];

  const handleApplyPreset = (hour, min = 0) => {
    setSliderHour(hour);
    onSimulateTime(createPktDate(hour, min));
  };

  const handleSliderChange = (e) => {
    const val = parseInt(e.target.value, 10);
    setSliderHour(val);
    onSimulateTime(createPktDate(val, 0));
  };

  const handleReset = () => {
    onSimulateTime(null);
  };

  return (
    <div className="fixed top-4 right-4 z-40 font-sans">
      {!isOpen ? (
        /* Unobtrusive Developer Test Toggle Badge */
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-mono border backdrop-blur-md transition-all shadow-lg cursor-pointer ${
            isSimulating
              ? 'bg-amber-950/90 border-amber-500/60 text-amber-300 animate-pulse'
              : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
          title="Open Developer Day/Night Time Test Simulation"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
          <span>DEV TIME TEST</span>
          {isSimulating && <span className="text-[9px] font-bold">({pktStr})</span>}
        </button>
      ) : (
        /* Developer Time Simulation Inspector Card */
        <div className="w-72 bg-slate-950/95 border border-slate-800 rounded-lg p-3.5 shadow-2xl backdrop-blur-md text-slate-200 flex flex-col gap-3 animate-in fade-in duration-150">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <div className="flex flex-col">
                <span className="text-xs font-bold tracking-wide text-slate-100">
                  Day/Night Simulation
                </span>
                <span className="text-[9px] font-mono text-slate-400">
                  DEVELOPER TIME TEST
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 text-slate-400 hover:text-slate-200 rounded hover:bg-slate-800 text-xs transition-colors cursor-pointer"
              title="Close panel"
            >
              ✕
            </button>
          </div>

          {/* Mode Indicator & Live Telemetry */}
          <div className="bg-slate-900/80 border border-slate-800 rounded p-2 flex items-center justify-between text-xs">
            <div className="flex flex-col">
              <span className="text-[9px] font-mono text-slate-400 uppercase">
                Active Mode
              </span>
              <span className={`font-semibold ${isSimulating ? 'text-amber-400' : 'text-emerald-400'}`}>
                {isSimulating ? 'SIMULATED TIME' : 'LIVE SYSTEM UTC'}
              </span>
            </div>
            <div className="flex flex-col text-right font-mono text-[11px]">
              <span className="text-slate-200 font-bold">{pktStr}</span>
              <span className="text-[9px] text-slate-400">{utcStr}</span>
            </div>
          </div>

          {/* Quick Presets for Test Requirements */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
              Test Presets (Pakistan ST)
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {PRESETS.map((p) => {
                const isActive =
                  isSimulating &&
                  simulatedTime.getUTCHours() === (p.hour - 5 + 24) % 24;

                return (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => handleApplyPreset(p.hour, p.min)}
                    className={`px-2 py-1.5 rounded border text-left transition-all cursor-pointer flex flex-col ${
                      isActive
                        ? 'bg-amber-500/20 border-amber-500/60 text-amber-200'
                        : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/80 text-slate-300'
                    }`}
                  >
                    <span className="text-[11px] font-semibold">{p.label}</span>
                    <span className="text-[9px] text-slate-400 font-mono">{p.tag}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 24-Hour Slider Control */}
          <div className="flex flex-col gap-1 pt-1">
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span>Time Slider (PKT)</span>
              <span className="text-amber-300 font-bold">{pad(sliderHour)}:00 PKT</span>
            </div>
            <input
              type="range"
              min="0"
              max="23"
              step="1"
              value={sliderHour}
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

          {/* Controls Footer */}
          <div className="flex items-center justify-between border-t border-slate-800/80 pt-2.5">
            {isSimulating ? (
              <button
                type="button"
                onClick={handleReset}
                className="w-full py-1 px-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded text-[10px] font-mono font-medium transition-colors cursor-pointer text-center"
              >
                ↺ Reset to Live System Time
              </button>
            ) : (
              <span className="text-[9px] text-slate-500 font-mono italic text-center w-full">
                System time active. Click preset to simulate.
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
