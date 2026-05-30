import React, { useState, useMemo, useRef, useEffect } from 'react';
import { FOLLOWERS, isPatchRequired, getModPackTag } from './data';
import { Follower, SortField, SortDirection } from './types';
import FollowerDetail from './components/FollowerDetail';
import RelationshipWeb from './components/RelationshipWeb';
import { 
  Search, 
  RotateCcw, 
  ArrowUpDown, 
  ChevronUp, 
  ChevronDown, 
  FileText, 
  Compass, 
  Users, 
  Volume2, 
  Info,
  Calendar,
  Sparkles,
  Link2,
  Bookmark,
  CheckCircle2,
  XCircle,
  HelpCircle
} from 'lucide-react';

export default function App() {
  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGender, setSelectedGender] = useState('');
  const [selectedRace, setSelectedRace] = useState('');
  const [selectedMod, setSelectedMod] = useState('');
  const [excludedMods, setExcludedMods] = useState<string[]>([]);
  const [interactFilter, setInteractFilter] = useState('');
  
  // Selected Follower details state (default to Inigo or first item)
  const [selectedFollowerName, setSelectedFollowerName] = useState('Inigo');
  
  // Sorting State
  const [sortField, setSortField] = useState<SortField>('follower');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Mobile View Overlays State
  const [isMobileDetailOpen, setIsMobileDetailOpen] = useState(false);

  // References to highlight elements in table
  const selectedRowRef = useRef<HTMLTableRowElement | null>(null);

  // Find all available races and mods dynamically for the select dropdowns
  const races = useMemo(() => {
    return Array.from(new Set(FOLLOWERS.map(f => f.race))).sort();
  }, []);

  const mods = useMemo(() => {
    return Array.from(new Set(FOLLOWERS.map(f => f.mod))).sort();
  }, []);

  const followerNames = useMemo(() => {
    return Array.from(new Set(FOLLOWERS.map(f => f.follower))).sort();
  }, []);

  // Filter & Sort core logic
  const filteredFollowers = useMemo(() => {
    return FOLLOWERS.filter(f => {
      // 1. Text Search query matching name, role/class, or origin mod
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const matchesName = f.follower.toLowerCase().includes(query);
        const matchesClass = f.class.toLowerCase().includes(query);
        const matchesMod = f.mod.toLowerCase().includes(query);
        const matchesRace = f.race.toLowerCase().includes(query);
        if (!matchesName && !matchesClass && !matchesMod && !matchesRace) {
          return false;
        }
      }

      // 2. Gender select filter
      if (selectedGender && f.gender !== selectedGender) {
        return false;
      }

      // 3. Race select filter
      if (selectedRace && f.race !== selectedRace) {
        return false;
      }

      // 4. Mod pack select filter
      if (selectedMod && f.mod !== selectedMod) {
        return false;
      }

      // 4.1 Mod pack exclude filters (multiple)
      if (excludedMods.length > 0 && excludedMods.includes(f.mod)) {
        return false;
      }

      // 5. Interactions filter
      if (interactFilter) {
        if (interactFilter === '__has_any__') {
          // Must have at least one interaction partner
          if (f.interactsWith.length === 0) return false;
        } else {
          // Must interact specifically with selected companion
          const hasInteraction = f.interactsWith.some(
            partner => partner.toLowerCase() === interactFilter.toLowerCase()
          );
          if (!hasInteraction) return false;
        }
      }

      return true;
    }).sort((a, b) => {
      let valA = a[sortField]?.toLowerCase() || '';
      let valB = b[sortField]?.toLowerCase() || '';

      if (sortDirection === 'asc') {
        return valA > valB ? 1 : valA < valB ? -1 : 0;
      } else {
        return valA < valB ? 1 : valA > valB ? -1 : 0;
      }
    });
  }, [searchQuery, selectedGender, selectedRace, selectedMod, excludedMods, interactFilter, sortField, sortDirection]);

  // Lookup the currently selected follower object
  const activeFollower = useMemo(() => {
    return FOLLOWERS.find(f => f.follower.toLowerCase() === selectedFollowerName.toLowerCase()) || FOLLOWERS[0];
  }, [selectedFollowerName]);

  // Handle active follower selection from table or connection graphs
  const handleSelectFollower = (name: string) => {
    setSelectedFollowerName(name);
    // On mobile, trigger slide-over detail panel
    setIsMobileDetailOpen(true);
  };

  // Clear all filters smoothly
  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedGender('');
    setSelectedRace('');
    setSelectedMod('');
    setExcludedMods([]);
    setInteractFilter('');
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Race color helper (consistent styles)
  const getRaceBadgeClass = (race: string) => {
    const r = race.toLowerCase();
    if (r === 'unknown') return 'bg-stone-900 border border-stone-800 text-stone-400';
    if (r.includes('khajiit')) return 'bg-amber-950/40 border border-amber-900/40 text-amber-300';
    if (r.includes('argonian')) return 'bg-emerald-950/40 border border-emerald-900/40 text-emerald-300';
    if (r.includes('altmer') || r.includes('high elf')) return 'bg-yellow-950/40 border border-yellow-900/40 text-yellow-300';
    if (r.includes('bosmer') || r.includes('wood elf')) return 'bg-green-950/40 border border-green-900/40 text-green-300';
    if (r.includes('dunmer') || r.includes('dark elf')) return 'bg-rose-950/40 border border-rose-905/40 text-rose-300';
    if (r.includes('nord')) return 'bg-sky-950/40 border border-sky-900/40 text-sky-300';
    if (r.includes('imperial')) return 'bg-amber-950/15 border border-amber-900/20 text-amber-200';
    if (r.includes('breton')) return 'bg-violet-950/30 border border-violet-900/40 text-violet-300';
    if (r.includes('redguard')) return 'bg-orange-950/40 border border-orange-900/45 text-orange-300';
    if (r.includes('orc')) return 'bg-lime-950/45 border border-lime-900/40 text-lime-300';
    return 'bg-stone-900 text-gray-300 border border-stone-800';
  };

  // Scroll active elements nicely on selected follower change
  useEffect(() => {
    if (selectedRowRef.current) {
      selectedRowRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });
    }
  }, [selectedFollowerName]);

  const hasActiveFilters = searchQuery || selectedGender || selectedRace || selectedMod || excludedMods.length > 0 || interactFilter;

  return (
    <div className="min-h-screen bg-skyrim-bg text-gray-200 selection:bg-skyrim-gold selection:text-black" id="skyrim-follower-app">
      
      {/* Cinematic Skyrim Themed Cover Header with Sophisticated Dark Aesthetic */}
      <header className="border-b border-skyrim-border bg-[#0D0D10] flex flex-col md:flex-row items-center justify-between py-6 px-8 relative overflow-hidden select-none gap-6">
        
        {/* Subtle decorative grid mesh background */}
        <div className="absolute inset-0 bg-[radial-gradient(rgba(191,161,90,0.1)_1px,transparent_1px)] [background-size:16px_16px] opacity-35 pointer-events-none" />
        
        <div className="flex items-center gap-4 relative z-10 text-left">
          {/* Gothic Medallion Custom Icon */}
          <div className="w-11 h-11 border border-skyrim-gold/30 rounded-full flex items-center justify-center shrink-0">
            <div className="w-6.5 h-6.5 border border-skyrim-gold/50 rotate-45 flex items-center justify-center">
              <div className="w-2 h-2 bg-skyrim-gold/75 rounded-full"></div>
            </div>
          </div>

          <div>
            <h1 className="font-display font-bold text-xl md:text-2xl tracking-widest text-[#BFA15A] uppercase drop-shadow-sm">
              Follower Archive
            </h1>
            <span className="text-[10px] font-sans tracking-widest opacity-50 block uppercase -mt-0.5 text-gray-300">
              SKYRIM MODDED CATALOG
            </span>
          </div>
        </div>

        {/* Decorative Theme Navigation Bar */}
        <nav className="flex items-center gap-6 md:gap-8 text-xs uppercase tracking-widest font-semibold z-10">
          <span className="text-skyrim-gold border-b border-skyrim-gold pb-1 cursor-default">Directory</span>
          <span className="text-gray-400 opacity-60 hover:opacity-100 cursor-pointer transition-opacity" onClick={() => {
            const el = document.getElementById('relationship-web-panel');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}>Interactions</span>
          <span className="text-gray-400 opacity-60 hover:opacity-100 cursor-pointer transition-opacity" onClick={() => {
            const el = document.getElementById('search-filter-section');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}>Filters</span>
          <span className="text-gray-400 opacity-40 hidden md:inline">Database v.4.02.1</span>
        </nav>

        {/* Floating badge counters */}
        <div className="relative z-10 bg-zinc-900 border border-white/5 rounded px-3 py-1.5 text-[11px] font-mono flex items-center gap-1.5 text-skyrim-gold-light shadow-sm">
          <BookmarkedBadge />
        </div>
      </header>

      {/* Main Container Layout */}
      <main className="max-w-7xl mx-auto px-4 py-6 md:py-8 flex flex-col gap-6 md:gap-8">
        
        {/* Advanced Filters Grid Block */}
        <section className="bg-skyrim-surf border border-skyrim-border rounded-xl p-5 shadow-md flex flex-col gap-4 relative" id="search-filter-section">
          <div className="flex items-center justify-between border-b border-skyrim-border/50 pb-2.5">
            <h2 className="font-display font-medium text-xs tracking-widest text-skyrim-gold uppercase flex items-center gap-2">
              <Compass className="w-4 h-4" /> Filter Skyrim Registry
            </h2>
            {hasActiveFilters && (
              <button 
                onClick={handleClearFilters}
                className="text-[11px] text-skyrim-gold hover:text-skyrim-gold-bright transition-colors font-semibold flex items-center gap-1 bg-skyrim-surf2 hover:bg-skyrim-surf3 px-2 py-1 rounded border border-skyrim-border"
              >
                <RotateCcw className="w-3 h-3" /> Reset filters
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            
            {/* Filter 1: Universal Keyword */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="search-input" className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">
                Keyword Search
              </label>
              <div className="relative">
                <input
                  id="search-input"
                  type="text"
                  placeholder="e.g. Inigo, Archer, Nord..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-skyrim-surf2 border border-skyrim-border hover:border-gray-600 focus:border-skyrim-gold focus:ring-1 focus:ring-skyrim-gold rounded-lg px-3 py-1.5 pl-8 text-xs text-gray-100 placeholder-gray-500 transition-all outline-none"
                />
                <Search className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-1/2 transform -translate-y-1/2" />
              </div>
            </div>

            {/* Filter 2: Gender Selector */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="gender-select" className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">
                Gender
              </label>
              <select
                id="gender-select"
                value={selectedGender}
                onChange={(e) => setSelectedGender(e.target.value)}
                className="w-full bg-skyrim-surf2 border border-skyrim-border hover:border-gray-600 focus:border-skyrim-gold rounded-lg px-3 py-1.5 text-xs text-gray-200 transition-all outline-none cursor-pointer"
              >
                <option value="">All Genders</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>

            {/* Filter 3: Race Selection */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="race-select" className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">
                Race
              </label>
              <select
                id="race-select"
                value={selectedRace}
                onChange={(e) => setSelectedRace(e.target.value)}
                className="w-full bg-skyrim-surf2 border border-skyrim-border hover:border-gray-600 focus:border-skyrim-gold rounded-lg px-3 py-1.5 text-xs text-gray-200 transition-all outline-none cursor-pointer"
              >
                <option value="">All Races</option>
                {races.map(raceString => (
                  <option key={raceString} value={raceString}>{raceString}</option>
                ))}
              </select>
            </div>

            {/* Filter 4: Origin Mod file */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="mod-select" className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">
                Source Mod / Quest
              </label>
              <select
                id="mod-select"
                value={selectedMod}
                onChange={(e) => setSelectedMod(e.target.value)}
                className="w-full bg-skyrim-surf2 border border-skyrim-border hover:border-gray-600 focus:border-skyrim-gold rounded-lg px-3 py-1.5 text-xs text-gray-200 transition-all outline-none cursor-pointer"
              >
                <option value="">All Origin Packets</option>
                {mods.map(modString => (
                  <option key={modString} value={modString}>{modString}</option>
                ))}
              </select>
            </div>

            {/* Filter 4.1: Exclude Mod Filter (Supports Multiple) */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="exclude-mod-select" className="text-[11px] text-rose-400 font-bold uppercase tracking-wider">
                Exclude Mods / Packs
              </label>
              <select
                id="exclude-mod-select"
                value=""
                onChange={(e) => {
                  const val = e.target.value;
                  if (val && !excludedMods.includes(val)) {
                    setExcludedMods([...excludedMods, val]);
                  }
                }}
                className="w-full bg-skyrim-surf2 border border-skyrim-border hover:border-rose-500/50 focus:border-skyrim-gold rounded-lg px-3 py-1.5 text-xs text-rose-200 transition-all outline-none cursor-pointer"
              >
                <option value="" className="text-gray-400">Exclude a mod pack...</option>
                {mods.map(modString => (
                  <option 
                    key={`exclude-${modString}`} 
                    value={modString}
                    disabled={excludedMods.includes(modString)}
                    className="text-gray-200 disabled:text-gray-600"
                  >
                    {excludedMods.includes(modString) ? `✓ ${modString} (Excluded)` : `Exclude ${modString}`}
                  </option>
                ))}
              </select>
              {/* Exclusions Micro-list */}
              {excludedMods.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1 max-h-16 overflow-y-auto">
                  {excludedMods.map(modName => (
                    <span 
                      key={`badge-${modName}`}
                      className="inline-flex items-center gap-1 bg-rose-950/40 text-[10px] text-rose-300 border border-rose-900/40 px-1.5 py-0.5 rounded"
                    >
                      <span className="truncate max-w-[130px]">{modName}</span>
                      <button 
                        type="button" 
                        onClick={() => setExcludedMods(excludedMods.filter(m => m !== modName))}
                        className="text-rose-450 hover:text-rose-200 font-bold focus:outline-none"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Filter 5: Dialogue Interaction Links */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="interact-select" className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">
                Interacts With
              </label>
              <select
                id="interact-select"
                value={interactFilter}
                onChange={(e) => setInteractFilter(e.target.value)}
                className="w-full bg-skyrim-surf2 border border-skyrim-border hover:border-gray-600 focus:border-skyrim-gold rounded-lg px-3 py-1.5 text-xs text-gray-200 transition-all outline-none cursor-pointer"
              >
                <option value="">No interaction filter</option>
                <option value="__has_any__">Has any registered banter</option>
                <option disabled>── Filter by companion ──</option>
                {followerNames.map(fName => (
                  <option key={fName} value={fName}>Mentions {fName}</option>
                ))}
              </select>
            </div>

          </div>

          {/* Active Filtering Toast Badges */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 mt-2 pt-2 border-t border-skyrim-border/30 text-xs">
              <span className="text-gray-400 font-semibold uppercase text-[10px] tracking-wider">Active:</span>
              {searchQuery && (
                <span className="bg-skyrim-surf3 border border-skyrim-border px-2 py-0.5 rounded text-gray-300 flex items-center gap-1">
                  Query: "{searchQuery}"
                </span>
              )}
              {selectedGender && (
                <span className="bg-skyrim-surf3 border border-skyrim-border px-2 py-0.5 rounded text-gray-300 flex items-center gap-1">
                  Gender: {selectedGender}
                </span>
              )}
              {selectedRace && (
                <span className="bg-skyrim-surf3 border border-skyrim-border px-2 py-0.5 rounded text-gray-300 flex items-center gap-1">
                  Race: {selectedRace}
                </span>
              )}
              {selectedMod && (
                <span className="bg-skyrim-surf3 border border-skyrim-border px-2 py-0.5 rounded text-gray-300 flex items-center gap-1">
                  Mod: {selectedMod}
                </span>
              )}
              {excludedMods.map(modName => (
                <span key={`active-ex-${modName}`} className="bg-rose-950/45 border border-rose-900/40 px-2 py-0.5 rounded text-rose-300 flex items-center gap-1.5">
                  Excluded: {modName}
                  <button 
                    onClick={() => setExcludedMods(prev => prev.filter(m => m !== modName))}
                    className="hover:text-white ml-0.5 font-bold text-rose-450"
                    title="Remove Exclusion"
                  >
                    ✕
                  </button>
                </span>
              ))}
              {interactFilter && (
                <span className="bg-skyrim-surf3 border border-skyrim-border px-2 py-0.5 rounded text-gray-100 flex items-center gap-1">
                  Banter: {interactFilter === '__has_any__' ? 'Any interaction' : `Talks with ${interactFilter}`}
                </span>
              )}
            </div>
          )}
        </section>

        {/* Dynamic Multi-Column Bento Layout Grid */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 items-start">
          
          {/* LEFT BENTO BLOCK (7/12 cols): Searchable Database Registry */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            
            {/* Header / Subtotal counter summary */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-skyrim-gold-light" />
                <h2 className="font-display font-semibold text-lg tracking-wider text-white">
                  A-Z Skyrim Registry
                </h2>
              </div>
              <span className="text-xs bg-skyrim-surf border border-skyrim-border px-2.5 py-1 rounded text-gray-400 font-mono">
                Showing <strong className="text-skyrim-gold">{filteredFollowers.length}</strong> of {FOLLOWERS.length} records
              </span>
            </div>

            {/* Main table container block with vertical scrolling */}
            <div className="bg-skyrim-surf border border-skyrim-border rounded-xl shadow-md overflow-hidden" id="registry-table-card">
              <div className="max-h-[560px] overflow-y-auto relative">
                <table className="w-full text-left border-collapse text-xs md:text-sm">
                  
                  {/* Styled Header columns with sorting actions */}
                  <thead className="bg-[#1c1813] sticky top-0 z-15 shadow-sm border-b border-skyrim-border">
                    <tr className="text-gray-400 uppercase text-[10px] md:text-xs font-display tracking-wider">
                      <th 
                        className="py-3 px-4 cursor-pointer hover:bg-skyrim-surf3 transition-colors text-skyrim-gold font-semibold select-none"
                        onClick={() => handleSort('follower')}
                      >
                        <div className="flex items-center gap-1.5">
                          Follower Name
                          <ArrowUpDown className="w-3 h-3 text-gray-500" />
                        </div>
                      </th>
                      <th 
                        className="py-3 px-3 cursor-pointer hover:bg-skyrim-surf3 transition-colors font-semibold select-none hidden sm:table-cell"
                        onClick={() => handleSort('gender')}
                      >
                        <div className="flex items-center gap-1.5">
                          Gender
                          <ArrowUpDown className="w-3 h-3 text-gray-500" />
                        </div>
                      </th>
                      <th 
                        className="py-3 px-3 cursor-pointer hover:bg-skyrim-surf3 transition-colors font-semibold select-none"
                        onClick={() => handleSort('race')}
                      >
                        <div className="flex items-center gap-1.5">
                          Race / Species
                          <ArrowUpDown className="w-3 h-3 text-gray-500" />
                        </div>
                      </th>
                      <th 
                        className="py-3 px-3 cursor-pointer hover:bg-skyrim-surf3 transition-colors font-semibold select-none hidden md:table-cell"
                        onClick={() => handleSort('class')}
                      >
                        <div className="flex items-center gap-1.5">
                          Combat Class
                          <ArrowUpDown className="w-3 h-3 text-gray-500" />
                        </div>
                      </th>
                      <th 
                        className="py-3 px-3 cursor-pointer hover:bg-skyrim-surf3 transition-colors font-semibold select-none hidden lg:table-cell"
                        onClick={() => handleSort('mod')}
                      >
                        <div className="flex items-center gap-1.5">
                          Origin Mod
                          <ArrowUpDown className="w-3 h-3 text-gray-500" />
                        </div>
                      </th>
                    </tr>
                  </thead>

                  {/* Body List Registry Rows */}
                  <tbody className="divide-y divide-skyrim-border/40 font-sans">
                    {filteredFollowers.length > 0 ? (
                      filteredFollowers.map((f) => {
                        const isSelected = f.follower.toLowerCase() === activeFollower.follower.toLowerCase();
                        const pack = getModPackTag(f.follower, f.mod);

                        return (
                          <tr
                            key={f.follower}
                            ref={isSelected ? selectedRowRef : null}
                            onClick={() => handleSelectFollower(f.follower)}
                            className={`group cursor-pointer transition-all ${
                              isSelected 
                                ? 'bg-[#292219]/70 hover:bg-[#2e261d]/85' 
                                : 'hover:bg-skyrim-surf2/80'
                            }`}
                          >
                            {/* Column 1: Follower Name & Mod Pack tag overlay */}
                            <td className="py-2.5 px-4 font-semibold text-gray-100 relative">
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-1.5">
                                  <span className={`text-[13px] md:text-sm font-display tracking-wide uppercase ${
                                    isSelected ? 'text-skyrim-gold-bright font-bold' : 'text-gray-200'
                                  }`}>
                                    {f.follower}
                                  </span>
                                  {isSelected && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-skyrim-gold animate-pulse" />
                                  )}
                                </div>
                                {pack && (
                                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-semibold w-max ${pack.styleClass}`}>
                                    {pack.label}
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Column 2: Gender */}
                            <td className="py-2.5 px-3 hidden sm:table-cell">
                              <span className={`text-[10px] font-semibold tracking-wider px-2 py-0.5 rounded shadow-sm ${
                                f.gender === 'Male' 
                                  ? 'bg-blue-950/40 text-blue-300' 
                                  : 'bg-pink-950/40 text-pink-300'
                              }`}>
                                {f.gender}
                              </span>
                            </td>

                            {/* Column 3: Race tag species */}
                            <td className="py-2.5 px-3">
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded break-all whitespace-normal sm:whitespace-nowrap ${getRaceBadgeClass(f.race)}`}>
                                {f.race}
                              </span>
                            </td>

                            {/* Column 4: Combat class / In-game role role */}
                            <td className="py-2.5 px-3 text-xs text-gray-300 truncate max-w-[130px] hidden md:table-cell">
                              {f.class}
                            </td>

                            {/* Column 5: Mod package details */}
                            <td className="py-2.5 px-3 text-xs text-skyrim-gold-light/90 italic truncate max-w-[155px] hidden lg:table-cell">
                              {f.mod}
                            </td>

                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-12 px-4 text-center text-gray-500">
                          <XCircle className="w-8 h-8 text-skyrim-gold/30 mx-auto mb-2" />
                          <p className="font-display font-medium text-xs tracking-wider uppercase text-gray-400">
                            No Followers Matching Filters Found
                          </p>
                          <p className="text-[11px] text-gray-500 max-w-[32ch] mx-auto mt-1 leading-relaxed">
                            Search keywords are case-insensitive and look over names, races, mod bases, and roles. Reset to go back.
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>

                </table>
              </div>
            </div>

            {/* Quick Informational Notice Footer */}
            <div className="bg-skyrim-surf border border-skyrim-border rounded-xl p-4 flex gap-3 shadow-sm text-xs items-start">
              <Info className="w-5 h-5 text-skyrim-gold mt-0.5 shrink-0 animate-pulse-subtle" />
              <div>
                <h4 className="font-display text-gray-200 uppercase tracking-wider text-[11px] font-semibold mb-0.5">
                  Accuracy Updates Inside Registry
                </h4>
                <p className="text-gray-400 leading-relaxed text-[11px]">
                  Following detailed Skyrim mod analysis, we resolved several cataloging errors in this build: 
                  <strong> Caryalind Thallery</strong>'s gender corrected to Male (Altmer Prince), 
                  <strong> Bikhai / Ma'kara</strong> genders correctly swapped (Bikhai is Male, Ma'kara is Female), 
                  <strong> Taliesin</strong> class rectified to Mage, and 
                  <strong> Nebarra</strong>'s class updated from Mage to heavy combat Soldier / Warrior.
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT BENTO BLOCK (5/12 cols): Live Detail Inspector & Relationship Node Web */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            
            {/* Live profile sheet column block */}
            <div className="flex flex-col gap-4">
              <h3 className="font-display font-semibold text-lg tracking-wider text-white">
                Detailed Follower Profile
              </h3>
              
              <FollowerDetail
                follower={activeFollower}
                onSelectFollower={handleSelectFollower}
                followersList={FOLLOWERS}
              />
            </div>

            {/* Relationship graph visual diagram section mapped dynamically */}
            <div className="flex flex-col gap-4">
              <h3 className="font-display font-semibold text-lg tracking-wider text-white">
                Crosstalk Interaction Web
              </h3>

              <RelationshipWeb
                follower={activeFollower}
                onSelectFollower={handleSelectFollower}
              />
            </div>

          </div>

        </section>

      </main>

      {/* Elegant atmospheric footer banner */}
      <footer className="bg-skyrim-surf border-t border-skyrim-border mt-16 py-10 px-4 text-center text-xs text-gray-500 select-none">
        <div className="max-w-md mx-auto flex flex-col items-center gap-2">
          <p className="font-display text-skyrim-gold tracking-widest text-[10px] uppercase">
            Afluffyspaceshark's Skyrim Mod Archives
          </p>
          <p className="font-sans leading-relaxed text-[11px] text-gray-400">
            A curated inventory crafted to help players coordinate customized banter and crossover dialogue dialogues seamlessly.
          </p>
          <p className="text-[10px] text-gray-600 mt-2 font-mono">
            Build 2026.5.29 • Powered by React & Tailwind CSS
          </p>
        </div>
      </footer>

    </div>
  );
}

// Inline Companion Bookmarked Counts Helper
function BookmarkedBadge() {
  return (
    <>
      <Bookmark className="w-3.5 h-3.5" />
      <span>{FOLLOWERS.length} Cataloged Companions</span>
    </>
  );
}
