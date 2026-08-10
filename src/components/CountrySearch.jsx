import { useState, useRef, useEffect, useMemo } from 'react';
import { countryFeatures } from '../utils/countryUtils';
import { getCountryDetails } from '../data/countryData';

const CONTINENT_OPTIONS = [
  { label: 'All Continents', value: 'ALL' },
  { label: 'Africa', value: 'Africa' },
  { label: 'Antarctica', value: 'Antarctica' },
  { label: 'Asia', value: 'Asia' },
  { label: 'Europe', value: 'Europe' },
  { label: 'North America', value: 'North America' },
  { label: 'South America', value: 'South America' },
  { label: 'Oceania', value: 'Oceania' },
];

/**
 * CountrySearch Component
 * High-tech HUD Search Bar with real-time matching suggestions,
 * continent and region filters, keyboard navigation, and instant 3D Earth focusing.
 */
export default function CountrySearch({ onSelectCountry }) {
  const [query, setQuery] = useState('');
  const [selectedContinent, setSelectedContinent] = useState('ALL');
  const [selectedRegion, setSelectedRegion] = useState('ALL');
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

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

  // Compute filtered search results
  const results = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
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
      const nameLower = name.toLowerCase();
      const officialLower = (details?.officialName || '').toLowerCase();
      const capitalLower = (details?.capital || '').toLowerCase();
      const iso2Lower = (details?.iso2 || '').toLowerCase();
      const iso3Lower = (details?.iso3 || '').toLowerCase();

      if (trimmed) {
        const isNameExact = nameLower === trimmed;
        const isNameStart = nameLower.startsWith(trimmed);
        const isNameContains = nameLower.includes(trimmed);
        const isOfficialContains = officialLower.includes(trimmed);
        const isCapitalContains = capitalLower.includes(trimmed);
        const isIsoMatch = iso2Lower === trimmed || iso3Lower === trimmed;

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

  // Handle outside click to dismiss dropdown
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

  // Reset active index when query, filters, or results change
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
    <div
      ref={containerRef}
      className="relative w-full max-w-xs sm:max-w-sm z-30 space-y-2"
    >
      {/* Search Input Field */}
      <div className="relative flex items-center">
        {/* Search Icon */}
        <div className="absolute left-3.5 pointer-events-none text-cyan-400/70 flex items-center justify-center">
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search country (e.g. Pakistan, Japan)..."
          className="w-full h-10 pl-10 pr-9 bg-slate-950/80 border border-cyan-500/30 rounded-lg text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 backdrop-blur-md shadow-lg transition-all"
        />

        {/* Clear Button */}
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              if (inputRef.current) inputRef.current.focus();
            }}
            className="absolute right-3 p-1 text-slate-400 hover:text-cyan-300 transition-colors rounded-full hover:bg-white/10 cursor-pointer"
            title="Clear Search Text"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Filter Controls: Continent and Region Dropdowns */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Continent Select */}
        <select
          value={selectedContinent}
          onChange={(e) => {
            setSelectedContinent(e.target.value);
            setSelectedRegion('ALL');
            setIsOpen(true);
          }}
          className="flex-1 h-7 px-2 bg-slate-950/80 border border-cyan-500/30 rounded text-[11px] text-cyan-300 focus:outline-none focus:border-cyan-400 backdrop-blur-md cursor-pointer hover:bg-slate-900/90 transition-colors truncate"
          title="Filter by Continent"
        >
          {CONTINENT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-slate-950 text-slate-200">
              {opt.label}
            </option>
          ))}
        </select>

        {/* Region Select */}
        <select
          value={selectedRegion}
          onChange={(e) => {
            setSelectedRegion(e.target.value);
            setIsOpen(true);
          }}
          className="flex-1 h-7 px-2 bg-slate-950/80 border border-cyan-500/30 rounded text-[11px] text-cyan-300 focus:outline-none focus:border-cyan-400 backdrop-blur-md cursor-pointer hover:bg-slate-900/90 transition-colors truncate"
          title="Filter by Region"
        >
          {availableRegions.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-slate-950 text-slate-200">
              {opt.label}
            </option>
          ))}
        </select>

        {/* Reset Filters Pill */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={() => {
              setSelectedContinent('ALL');
              setSelectedRegion('ALL');
            }}
            className="h-7 px-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/40 rounded text-[10px] font-mono text-cyan-300 cursor-pointer shrink-0 transition-colors flex items-center gap-1"
            title="Reset Filters"
          >
            <span>Reset</span>
            <span className="text-[9px]">✕</span>
          </button>
        )}
      </div>

      {/* Matching Suggestions Dropdown */}
      {isOpen && (query.trim().length > 0 || hasActiveFilters) && (
        <div className="absolute top-20 left-0 right-0 max-h-72 overflow-y-auto bg-slate-950/95 border border-cyan-500/30 rounded-lg shadow-2xl backdrop-blur-xl divide-y divide-white/5 z-50 text-xs scrollbar-thin scrollbar-thumb-cyan-500/20">
          {results.length > 0 ? (
            results.map((item, idx) => {
              const isSelected = idx === activeIndex;
              return (
                <div
                  key={item.feature.id || item.name}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setActiveIndex(idx)}
                  className={`p-2.5 sm:p-3 flex items-center justify-between cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-cyan-500/20 text-cyan-200 border-l-2 border-cyan-400'
                      : 'hover:bg-cyan-500/10 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {/* Flag Image / Emoji */}
                    {item.details?.flagUrl ? (
                      <img
                        src={item.details.flagUrl}
                        alt=""
                        className="w-5 h-3.5 object-cover rounded-[2px] shadow-sm shrink-0"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <span className="text-base leading-none shrink-0">
                        {item.details?.flagEmoji || '🌐'}
                      </span>
                    )}

                    {/* Country Name & Subtitle */}
                    <div className="flex flex-col min-w-0">
                      <span className="font-semibold tracking-wide truncate text-slate-100">
                        {item.name}
                      </span>
                      <span className="text-[10px] text-slate-400 truncate">
                        {item.details?.region || item.details?.continent || 'Global'}
                        {item.details?.capital && item.details.capital !== 'Capital City'
                          ? ` • Capital: ${item.details.capital}`
                          : ''}
                      </span>
                    </div>
                  </div>

                  {/* ISO Badge */}
                  {item.details?.iso2 && (
                    <span className="px-1.5 py-0.5 text-[9px] font-mono font-medium rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shrink-0 ml-2">
                      {item.details.iso2}
                    </span>
                  )}
                </div>
              );
            })
          ) : (
            <div className="p-4 text-center text-slate-400 text-xs">
              No countries found
            </div>
          )}
        </div>
      )}
    </div>
  );
}

