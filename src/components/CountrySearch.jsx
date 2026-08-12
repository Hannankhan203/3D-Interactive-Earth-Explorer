import { useState, useRef, useEffect, useMemo, forwardRef, useImperativeHandle } from 'react';
import { countryFeatures } from '../utils/countryUtils';
import { getCountryDetails } from '../data/countryData';

const CONTINENT_OPTIONS = [
  { label: 'ALL', value: 'ALL' },
  { label: 'AFRICA', value: 'Africa' },
  { label: 'ANTARCTICA', value: 'Antarctica' },
  { label: 'ASIA', value: 'Asia' },
  { label: 'EUROPE', value: 'Europe' },
  { label: 'NORTH AMERICA', value: 'North America' },
  { label: 'SOUTH AMERICA', value: 'South America' },
  { label: 'OCEANIA', value: 'Oceania' },
];

/**
 * CountrySearch Component — Spatial Target Finder Console
 * Complete UI rebuild: A specialized geographic target finder HUD console with
 * real-time search suggestions, continent and region filtering, keyboard navigation,
 * and instant 3D Earth focusing.
 */
const CountrySearch = forwardRef(function CountrySearch({ onSelectCountry, resetTrigger = 0 }, ref) {
  const [query, setQuery] = useState('');
  const [selectedContinent, setSelectedContinent] = useState('ALL');
  const [selectedRegion, setSelectedRegion] = useState('ALL');
  const [isOpen, setIsOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const containerRef = useRef(null);
  const inputRef = useRef(null);

  useImperativeHandle(ref, () => ({
    focus: () => {
      setIsOpen(true);
      setTimeout(() => inputRef.current?.focus(), 50);
    },
    blur: () => {
      inputRef.current?.blur();
      setIsOpen(false);
    }
  }));

  // Clear query and close dropdown when reset is triggered
  useEffect(() => {
    if (resetTrigger > 0) {
      setQuery('');
      setSelectedContinent('ALL');
      setSelectedRegion('ALL');
      setIsOpen(false);
      setShowFilters(false);
    }
  }, [resetTrigger]);

  // Dynamically compute available region options for the selected continent
  const availableRegions = useMemo(() => {
    const regionsSet = new Set();
    countryFeatures.forEach((feature) => {
      const details = getCountryDetails(feature);
      if (!details) return;

      const cName = details.continent || '';
      const rName = details.region || '';
      if (!rName) return;

      if (selectedContinent === 'ALL') {
        regionsSet.add(rName);
      } else {
        const cLower = cName.toLowerCase();
        const targetCLower = selectedContinent.toLowerCase();
        if (targetCLower === 'north america' || targetCLower === 'south america') {
          if (rName.toLowerCase() === targetCLower || (cLower === 'americas' && rName.toLowerCase() === targetCLower)) {
            regionsSet.add(rName);
          }
        } else if (targetCLower === 'antarctica' || targetCLower === 'antarctic') {
          if (cLower === 'antarctica' || cLower === 'antarctic' || rName.toLowerCase() === 'antarctica') {
            regionsSet.add(rName);
          }
        } else if (cLower === targetCLower || cLower.includes(targetCLower)) {
          regionsSet.add(rName);
        }
      }
    });

    const sorted = Array.from(regionsSet).sort();
    return [{ label: 'All Regions', value: 'ALL' }, ...sorted.map((r) => ({ label: r, value: r }))];
  }, [selectedContinent]);

  const normalizeStr = (str) =>
    (str || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

  // Compute filtered search results
  const results = useMemo(() => {
    const trimmed = query.trim();
    const normTrimmed = normalizeStr(trimmed);
    const hasFilter = selectedContinent !== 'ALL' || selectedRegion !== 'ALL';

    if (!trimmed && !hasFilter && !isOpen) return [];

    const matches = [];
    for (const feature of countryFeatures) {
      const name = feature.properties?.name || '';
      const details = getCountryDetails(feature);

      const cName = details?.continent || '';
      const rName = details?.region || '';

      // 1. Continent filter check
      if (selectedContinent !== 'ALL') {
        const cLower = cName.toLowerCase();
        const targetCLower = selectedContinent.toLowerCase();
        if (targetCLower === 'north america') {
          if (!(cLower === 'north america' || (cLower === 'americas' && rName.toLowerCase() === 'north america'))) continue;
        } else if (targetCLower === 'south america') {
          if (!(cLower === 'south america' || (cLower === 'americas' && rName.toLowerCase() === 'south america'))) continue;
        } else if (targetCLower === 'antarctica' || targetCLower === 'antarctic') {
          if (!(cLower === 'antarctica' || cLower === 'antarctic' || rName.toLowerCase() === 'antarctica')) continue;
        } else {
          if (cLower !== targetCLower && !cLower.includes(targetCLower)) continue;
        }
      }

      // 2. Region filter check
      if (selectedRegion !== 'ALL') {
        if (rName.toLowerCase() !== selectedRegion.toLowerCase()) continue;
      }

      // 3. Search query check
      const normName = normalizeStr(name);
      const normOfficial = normalizeStr(details?.officialName);
      const normCapital = normalizeStr(details?.capital);
      const normIso2 = normalizeStr(details?.iso2);
      const normIso3 = normalizeStr(details?.iso3);

      if (normTrimmed) {
        const isNameExact = normName === normTrimmed;
        const isNameStart = normName.startsWith(normTrimmed);
        const isNameContains = normName.includes(normTrimmed);
        const isOfficialContains = normOfficial.includes(normTrimmed);
        const isCapitalContains = normCapital.includes(normTrimmed);
        const isIsoMatch = normIso2 === normTrimmed || normIso3 === normTrimmed;

        if (!isNameExact && !isNameStart && !isNameContains && !isOfficialContains && !isCapitalContains && !isIsoMatch) {
          continue;
        }

        let score = 10;
        if (isNameExact) score = 110;
        else if (isIsoMatch) score = 100;
        else if (isNameStart) score = 80;
        else if (isNameContains) score = 60;
        else if (isOfficialContains) score = 40;
        else if (isCapitalContains) score = 20;

        matches.push({ feature, name, details, score });
      } else {
        matches.push({ feature, name, details, score: 50 });
      }
    }

    matches.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));

    return trimmed ? matches.slice(0, 15) : matches.slice(0, 50);
  }, [query, selectedContinent, selectedRegion, isOpen]);

  // Handle outside click to close overlay
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
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

  useEffect(() => {
    setActiveIndex(-1);
  }, [query, selectedContinent, selectedRegion]);

  const handleSelect = (item) => {
    if (!item) return;
    onSelectCountry(item.feature);
    setQuery(item.name);
    setIsOpen(false);
    setActiveIndex(-1);
    if (inputRef.current) inputRef.current.blur();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      if (inputRef.current) inputRef.current.blur();
      return;
    }

    if (!isOpen || results.length === 0) {
      if (e.key === 'ArrowDown' && results.length > 0) {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < results.length) {
        handleSelect(results[activeIndex]);
      } else if (results.length > 0) {
        handleSelect(results[0]);
      }
    }
  };

  const hasActiveFilters = selectedContinent !== 'ALL' || selectedRegion !== 'ALL';

  return (
    <div ref={containerRef} className="relative z-40 font-mono">
      {/* Trigger Button / Compact Bar */}
      {!isOpen ? (
        <button
          type="button"
          onClick={() => {
            setIsOpen(true);
            setTimeout(() => inputRef.current?.focus(), 50);
          }}
          className="group flex items-center gap-3 px-3.5 py-2 bg-[#020617]/90 hover:bg-[#090d16] border border-cyan-900/40 hover:border-cyan-500/50 rounded-md backdrop-blur-md text-slate-300 hover:text-white transition-all shadow-xl cursor-pointer select-none"
          title="Open Target Finder (Press /)"
          aria-label="Open Target Finder"
        >
          {/* Reticle Icon */}
          <div className="relative flex items-center justify-center w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="7" strokeWidth="1.5" strokeDasharray="3 3" />
              <path d="M12 2v3m0 14v3M2 12h3m14 0h3" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>

          <span className="text-xs font-sans tracking-wide text-slate-300 group-hover:text-cyan-200">
            {query ? query : 'Locate Territory or Capital...'}
          </span>

          <span className="ml-2 px-1.5 py-0.5 text-[9px] font-mono text-cyan-400 bg-cyan-950/80 border border-cyan-800/60 rounded">
            /
          </span>
        </button>
      ) : (
        /* Expanded Spatial Command Console Overlay */
        <div className="fixed inset-x-4 top-16 sm:top-20 sm:left-1/2 sm:-translate-x-1/2 sm:w-[540px] max-w-full bg-[#020617]/95 border border-cyan-500/40 rounded-lg shadow-[0_0_30px_rgba(6,182,212,0.15)] backdrop-blur-2xl p-3 text-slate-200 font-sans animate-in fade-in zoom-in-95 duration-150">
          {/* Tactical Corner Bracket Accents */}
          <div className="absolute top-1 left-1 w-2 h-2 border-t border-l border-cyan-400/80" />
          <div className="absolute top-1 right-1 w-2 h-2 border-t border-r border-cyan-400/80" />
          <div className="absolute bottom-1 left-1 w-2 h-2 border-b border-l border-cyan-400/80" />
          <div className="absolute bottom-1 right-1 w-2 h-2 border-b border-r border-cyan-400/80" />

          {/* Search Header Bar */}
          <div className="flex items-center gap-2 border-b border-slate-800/90 pb-2.5 mb-2">
            <div className="text-cyan-400 pl-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type country name, ISO code, or capital..."
              aria-label="Target search query"
              className="flex-1 bg-transparent text-sm text-slate-100 placeholder-slate-500 outline-none font-sans"
              autoFocus
            />

            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="px-1.5 py-0.5 text-[10px] font-mono text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800 rounded"
              >
                CLEAR
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 text-xs transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Continent Filter Pills Bar */}
          <div className="flex items-center justify-between gap-1 overflow-x-auto pb-2 custom-scrollbar">
            <div className="flex items-center gap-1">
              {CONTINENT_OPTIONS.map((opt) => {
                const isActive = selectedContinent === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      setSelectedContinent(opt.value);
                      setSelectedRegion('ALL');
                    }}
                    className={`px-2 py-1 rounded text-[10px] font-mono font-semibold uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer ${
                      isActive
                        ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/60 shadow-sm'
                        : 'bg-slate-900/60 text-slate-400 border border-slate-800/80 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={() => {
                  setSelectedContinent('ALL');
                  setSelectedRegion('ALL');
                }}
                className="px-2 py-1 text-[9px] font-mono text-amber-400 bg-amber-950/60 border border-amber-800/80 rounded whitespace-nowrap"
              >
                RESET
              </button>
            )}
          </div>

          {/* Search Results List */}
          <div className="max-h-64 overflow-y-auto divide-y divide-slate-800/60 custom-scrollbar mt-1">
            {results.length > 0 ? (
              results.map((item, idx) => {
                const isSelected = idx === activeIndex;
                return (
                  <div
                    key={item.feature.id || item.name}
                    role="option"
                    tabIndex={0}
                    aria-selected={isSelected}
                    onClick={() => handleSelect(item)}
                    onMouseEnter={() => setActiveIndex(idx)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleSelect(item);
                      }
                    }}
                    className={`p-2 flex items-center justify-between cursor-pointer rounded transition-colors ${
                      isSelected
                        ? 'bg-cyan-950/80 text-white border-l-2 border-cyan-400 pl-2.5'
                        : 'hover:bg-slate-900/80 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* Country Flag */}
                      {item.details?.flagUrl ? (
                        <img
                          src={item.details.flagUrl}
                          alt=""
                          className="w-5 h-3.5 object-cover rounded-[1px] shrink-0 border border-white/20"
                          loading="lazy"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <span className="text-xs shrink-0">{item.details?.flagEmoji || '🌐'}</span>
                      )}

                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-slate-100 truncate">
                            {item.name}
                          </span>
                          {item.details?.iso2 && (
                            <span className="text-[9px] font-mono text-cyan-400/90 px-1 py-0.2 bg-cyan-950/80 border border-cyan-800/60 rounded">
                              {item.details.iso2}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 truncate">
                          Capital: {item.details?.capital || 'N/A'} &bull; {item.details?.continent || 'Global'}
                        </span>
                      </div>
                    </div>

                    <span className="text-[10px] font-mono text-slate-500 shrink-0 ml-2">
                      TARGET 🎯
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="p-4 text-center text-xs text-slate-500 font-mono">
                NO GEOGRAPHIC TARGET MATCHED
              </div>
            )}
          </div>

          {/* Console Footer */}
          <div className="flex items-center justify-between border-t border-slate-800/80 pt-2 mt-2 text-[10px] font-mono text-slate-500">
            <span>Navigation: ↑ ↓ Enter &bull; Exit: Esc</span>
            <span>{results.length} Targets</span>
          </div>
        </div>
      )}
    </div>
  );
});

export default CountrySearch;
