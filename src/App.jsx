import { useState } from 'react';
import EarthCanvas from './components/EarthCanvas';
import CountryInfoPanel from './components/CountryInfoPanel';
import CountrySearch from './components/CountrySearch';
import CountryTooltip from './components/CountryTooltip';

/**
 * Main Application Component styled with the "Immersive UI" design theme.
 * Integrates high-tech HUD overlays, scene hierarchy diagnostics, and interactive 3D WebGL Earth sphere.
 */
export default function App() {
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [hoveredCountry, setHoveredCountry] = useState(null);
  const [coords, setCoords] = useState({ lat: 0, lon: 0 });

  return (
    <div className="w-full h-full bg-[#020617] text-slate-300 font-sans flex flex-col overflow-hidden relative select-none">
      {/* Sci-Fi Grid Background & Lens Flare */}
      <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none z-0" />
      <div className="lens-flare z-0" />

      {/* Top Navigation Bar */}
      <nav className="h-14 border-b border-white/10 flex items-center justify-between px-3 sm:px-6 bg-slate-950/60 backdrop-blur-md z-20">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center shrink-0">
            <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border border-cyan-400 border-dashed animate-spin" />
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] sm:text-xs font-bold tracking-widest text-cyan-400 uppercase">
              Terra Core Engine
            </span>
            <span className="text-[9px] sm:text-[10px] text-slate-500 font-mono">
              v1.0.0-alpha.initial
            </span>
          </div>
        </div>

        <div className="flex gap-3 sm:gap-6 items-center">
          <div className="flex flex-col items-end hidden sm:flex">
            <span className="text-[10px] uppercase tracking-tighter text-slate-500">
              Vite Instance
            </span>
            <span className="text-xs font-mono text-emerald-400">
              PORT: 3000 (Ready)
            </span>
          </div>
          <div className="h-8 w-[1px] bg-white/10 hidden sm:block" />
          <button className="px-2.5 py-1 sm:px-4 sm:py-1.5 rounded border border-cyan-500/50 text-[10px] sm:text-xs font-medium text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 transition-colors cursor-pointer">
            3D SPHERE
          </button>
        </div>
      </nav>

      {/* Main Workspace Body */}
      <main className="flex-1 flex relative overflow-hidden z-10">
        {/* Left Diagnostics Sidebar */}
        <aside className="w-64 border-r border-white/5 bg-slate-950/40 backdrop-blur-sm z-10 flex flex-col hidden md:flex">
          <div className="p-4 border-b border-white/5">
            <h3 className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-4">
              Scene Hierarchy
            </h3>
            <div className="space-y-1 font-mono text-[11px]">
              <div className="flex items-center gap-2 p-1.5 text-cyan-300 bg-cyan-500/5 rounded border-l-2 border-cyan-400">
                <span className="opacity-50">▼</span>
                <span>Scene (Root)</span>
              </div>
              <div className="flex items-center gap-2 p-1.5 pl-6 hover:bg-white/5 cursor-default transition-colors">
                <span className="text-slate-500">[C]</span>
                <span>PerspectiveCamera</span>
              </div>
              <div className="flex items-center gap-2 p-1.5 pl-6 hover:bg-white/5 cursor-default transition-colors">
                <span className="text-slate-500">[L]</span>
                <span>AmbientLight</span>
              </div>
              <div className="flex items-center gap-2 p-1.5 pl-6 hover:bg-white/5 cursor-default transition-colors">
                <span className="text-slate-500">[L]</span>
                <span>DirectionalLight</span>
              </div>
              <div className="flex items-center gap-2 p-1.5 pl-6 hover:bg-white/5 cursor-default transition-colors">
                <span className="text-amber-400">[M]</span>
                <span>EarthSphere_Mesh</span>
              </div>
              <div className="flex items-center gap-2 p-1.5 pl-10 opacity-60">
                <span className="text-slate-600">-</span>
                <span>SphereGeometry</span>
              </div>
              <div className="flex items-center gap-2 p-1.5 pl-10 opacity-60">
                <span className="text-slate-600">-</span>
                <span>MeshStandardMaterial</span>
              </div>
            </div>
          </div>

          <div className="p-4 flex-1">
            <h3 className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-4">
              Performance
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[11px]">FPS</span>
                <span className="text-xs font-mono text-emerald-400">60.00</span>
              </div>
              <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                <div className="w-full h-full bg-emerald-500/50" />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[11px]">Memory</span>
                <span className="text-xs font-mono text-slate-300">24.4 MB</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[11px]">Draw Calls</span>
                <span className="text-xs font-mono text-slate-300">12</span>
              </div>
            </div>
          </div>
        </aside>

        {/* 3D WebGL Canvas Section */}
        <section className="flex-1 relative flex items-center justify-center bg-black/40">
          {/* Subtle Sphere Glow Effect */}
          <div className="sphere-glow absolute inset-0 pointer-events-none" />

          {/* Floating Search Bar - Top Left HUD */}
          <div className="absolute top-4 left-4 z-30">
            <CountrySearch onSelectCountry={setSelectedCountry} />
          </div>

          {/* Interactive Three.js Earth Viewport */}
          <EarthCanvas
            selectedCountry={selectedCountry}
            onCountrySelect={setSelectedCountry}
            onCountryHover={setHoveredCountry}
            onCoordinatesUpdate={setCoords}
          />

          {/* Geographic Information Panel */}
          <CountryInfoPanel
            selectedFeature={selectedCountry}
            onClose={() => setSelectedCountry(null)}
          />

          {/* Hover Country Tooltip */}
          <CountryTooltip hoveredCountry={hoveredCountry} />

          {/* HUD Overlay - Top Right */}
          <div className="absolute top-4 right-4 z-20 pointer-events-none">
            <div className="px-3 py-1 bg-slate-900/80 border border-white/10 rounded backdrop-blur-sm text-[10px] font-mono">
              <span className="text-slate-500">RENDERER:</span>
              <span className="text-cyan-400 ml-1">WEBGL_2.0</span>
            </div>
          </div>

          {/* HUD Overlay - Bottom Left Controls */}
          <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 z-20 space-y-0.5 sm:space-y-1 text-[9px] sm:text-[10px] font-mono text-slate-500 uppercase pointer-events-none">
            <div className="hidden sm:block space-y-1">
              <p>Orbit: <span className="text-slate-300">LMB + Drag</span></p>
              <p>Zoom: <span className="text-slate-300">Scroll Wheel</span></p>
              <p>Pan: <span className="text-slate-300">RMB + Drag</span></p>
            </div>
            <div className="sm:hidden space-y-0.5">
              <p>Touch: <span className="text-slate-300">1-Finger Drag</span></p>
              <p>Pinch: <span className="text-slate-300">Zoom In/Out</span></p>
            </div>
          </div>

          {/* HUD Overlay - Bottom Right Coordinates */}
          <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 z-20 flex gap-2 sm:gap-4 text-[9px] sm:text-[10px] font-mono pointer-events-none">
            <div className="flex flex-col items-end">
              <span className="text-slate-500">LATITUDE</span>
              <span className="text-slate-200">
                {Math.abs(coords.lat || 0).toFixed(4)}° {coords.lat >= 0 ? 'N' : 'S'}
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-slate-500">LONGITUDE</span>
              <span className="text-slate-200">
                {Math.abs(coords.lon || 0).toFixed(4)}° {coords.lon >= 0 ? 'E' : 'W'}
              </span>
            </div>
          </div>
        </section>
      </main>

      {/* Footer Bar */}
      <footer className="h-10 bg-[#0f172a] border-t border-white/5 px-6 flex items-center justify-between z-20">
        <div className="flex items-center gap-4 text-[10px] font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-emerald-500">Renderer Active</span>
          </div>
          <span className="text-slate-600">|</span>
          <span className="text-slate-500 uppercase">Three.js WebGL</span>
        </div>
        <div className="flex items-center gap-4 text-[10px] text-slate-500 font-mono">
          <span>Viewport: Active</span>
          <span>Aspect: Responsive</span>
        </div>
      </footer>
    </div>
  );
}
