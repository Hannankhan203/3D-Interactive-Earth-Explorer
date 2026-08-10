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
  const [showFilters, setShowFilters] = useState(false);
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
      className="relative w-64 sm:w-72 z-30 space-y-1.5 font-sans"
    >
      {/* Primary Compact Search Input Bar */}
      <div className="relative flex items-center shadow-lg rounded-md bg-slate-950/90 border border-slate-800 backdrop-blur-md">
        {/* Search Icon */}
        <div className="absolute left-2.5 pointer-events-none text-slate-400 flex items-center justify-center">
          <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
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
          placeholder="Search country..."
          className="w-full h-8 pl-8 pr-14 bg-transparent text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
        />

        {/* Action Controls inside Search Input Bar */}
        <div className="absolute right-1.5 flex items-center gap-1">
          {/* Clear Button */}
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                if (inputRef.current) inputRef.current.focus();
              }}
              className="p-1 text-slate-400 hover:text-slate-200 transition-colors rounded hover:bg-slate-800 cursor-pointer"
              title="Clear text"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}

          {/* Filter Toggle Button */}
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`p-1 text-slate-400 hover:text-slate-200 transition-colors rounded hover:bg-slate-800 cursor-pointer relative ${
              hasActiveFilters || showFilters ? 'text-cyan-400 bg-slate-900' : ''
            }`}
            title="Toggle geographic filters"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            {hasActiveFilters && (
              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-cyan-400" />
            )}
          </button>
        </div>
      </div>

      {/* Collapsible Filter Bar */}
      {showFilters && (
        <div className="flex items-center gap-1.5 p-1.5 bg-slate-950/90 border border-slate-800 rounded-md backdrop-blur-md shadow-lg animate-in fade-in duration-150">
          {/* Continent Select */}
          <select
            value={selectedContinent}
            onChange={(e) => {
              setSelectedContinent(e.target.value);
              setSelectedRegion('ALL');
              setIsOpen(true);
            }}
            className="flex-1 h-6 px-1.5 bg-slate-900 border border-slate-800 rounded text-[10px] text-slate-300 focus:outline-none focus:border-slate-700 cursor-pointer truncate"
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
            className="flex-1 h-6 px-1.5 bg-slate-900 border border-slate-800 rounded text-[10px] text-slate-300 focus:outline-none focus:border-slate-700 cursor-pointer truncate"
            title="Filter by Region"
          >
            {availableRegions.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-slate-950 text-slate-200">
                {opt.label}
              </option>
            ))}
          </select>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => {
                setSelectedContinent('ALL');
                setSelectedRegion('ALL');
              }}
              className="h-6 px-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded text-[9px] font-mono text-cyan-400 cursor-pointer shrink-0 transition-colors"
              title="Reset Filters"
            >
              Reset
            </button>
          )}
        </div>
      )}

      {/* Search Results Dropdown List */}
      {isOpen && (query.trim().length > 0 || hasActiveFilters) && (
        <div className="absolute left-0 right-0 max-h-60 overflow-y-auto bg-slate-950/95 border border-slate-800 rounded-md shadow-2xl backdrop-blur-xl divide-y divide-slate-800/60 z-50 text-xs scrollbar-thin">
          {results.length > 0 ? (
            results.map((item, idx) => {
              const isSelected = idx === activeIndex;
              return (
                <div
                  key={item.feature.id || item.name}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setActiveIndex(idx)}
                  className={`p-2 flex items-center justify-between cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-slate-800/80 text-white'
                      : 'hover:bg-slate-900 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {/* Flag */}
                    {item.details?.flagUrl ? (
                      <img
                        src={item.details.flagUrl}
                        alt=""
                        className="w-4 h-3 object-cover rounded-[1px] shrink-0 border border-white/10"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <span className="text-xs leading-none shrink-0">
                        {item.details?.flagEmoji || '🌐'}
                      </span>
                    )}

                    {/* Country Name & Capital/Region */}
                    <div className="flex flex-col min-w-0">
                      <span className="font-medium truncate text-slate-100 text-xs">
                        {item.name}
                      </span>
                      <span className="text-[10px] text-slate-400 truncate font-sans">
                        {item.details?.capital && item.details.capital !== 'Capital City'
                          ? item.details.capital
                          : item.details?.region || item.details?.continent || 'Global'}
                      </span>
                    </div>
                  </div>

                  {/* ISO Code */}
                  {item.details?.iso2 && (
                    <span className="text-[9px] font-mono text-slate-500 shrink-0 ml-2">
                      {item.details.iso2}
                    </span>
                  )}
                </div>
              );
            })
          ) : (
            <div className="p-3 text-center text-slate-500 text-xs font-sans">
              No matching countries
            </div>
          )}
        </div>
      )}
    </div>
  );
}

