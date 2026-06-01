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
  HelpCircle,
  Download,
  MapPin
} from 'lucide-react';

export default function App() {
  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGender, setSelectedGender] = useState('');
  const [selectedRaces, setSelectedRaces] = useState<string[]>([]);
  const [excludedRaces, setExcludedRaces] = useState<string[]>([]);
  const [selectedMods, setSelectedMods] = useState<string[]>([]);
  const [excludedMods, setExcludedMods] = useState<string[]>([]);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [excludedClasses, setExcludedClasses] = useState<string[]>([]);
  const [interactFilters, setInteractFilters] = useState<string[]>([]);
  const [globalFilterLogic, setGlobalFilterLogic] = useState<'and' | 'or'>('and');
  const [raceMatchMode, setRaceMatchMode] = useState<'and' | 'or'>('or');
  const [modMatchMode, setModMatchMode] = useState<'and' | 'or'>('or');
  const [classMatchMode, setClassMatchMode] = useState<'and' | 'or'>('or');
  const [interactMatchMode, setInteractMatchMode] = useState<'and' | 'or'>('or');

  // New states for Location, Quests, and Non-Follower Mod filters
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [excludedLocations, setExcludedLocations] = useState<string[]>([]);
  
  const [selectedQuests, setSelectedQuests] = useState<string[]>([]);
  const [excludedQuests, setExcludedQuests] = useState<string[]>([]);
  const [questMatchMode, setQuestMatchMode] = useState<'and' | 'or'>('or');

  const [selectedNonFollowerMods, setSelectedNonFollowerMods] = useState<string[]>([]);
  const [excludedNonFollowerMods, setExcludedNonFollowerMods] = useState<string[]>([]);
  const [nonFollowerModMatchMode, setNonFollowerModMatchMode] = useState<'and' | 'or'>('or');
  
  // Selected Follower details state (default to Inigo or first item)
  const [selectedFollowerName, setSelectedFollowerName] = useState('Inigo');
  
  // Sorting State
  const [sortField, setSortField] = useState<SortField>('follower');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Mobile View Overlays State
  const [isMobileDetailOpen, setIsMobileDetailOpen] = useState(false);

  // References to highlight elements in table
  const selectedRowRef = useRef<HTMLTableRowElement | null>(null);

  // Find all available races, mods, and classes dynamically for selection
  const races = useMemo(() => {
    return Array.from(new Set(FOLLOWERS.map(f => f.race))).sort();
  }, []);

  const mods = useMemo(() => {
    return Array.from(new Set(FOLLOWERS.map(f => f.mod))).sort();
  }, []);

  const classes = useMemo(() => {
    const set = new Set<string>();
    FOLLOWERS.forEach(f => {
      if (f.class) {
        f.class.split(/\s*\/\s*/).forEach(c => {
          if (c.trim()) set.add(c.trim());
        });
      }
    });
    return Array.from(set).sort();
  }, []);

  const followerNames = useMemo(() => {
    return Array.from(new Set(FOLLOWERS.map(f => f.follower))).sort();
  }, []);

  // Dynamically extract unique starting locations
  const locations = useMemo(() => {
    return Array.from(new Set(FOLLOWERS.map(f => f.location).filter(Boolean))).sort();
  }, []);

  // Dynamically extract unique commented quests
  const quests = useMemo(() => {
    const set = new Set<string>();
    FOLLOWERS.forEach(f => {
      if (f.quests) {
        f.quests.forEach(q => {
          if (q.trim()) set.add(q.trim());
        });
      }
    });
    return Array.from(set).sort();
  }, []);

  // Dynamically extract unique non-follower mods
  const nonFollowerMods = useMemo(() => {
    const set = new Set<string>();
    FOLLOWERS.forEach(f => {
      if (f.nonFollowerMods) {
        f.nonFollowerMods.forEach(m => {
          if (m.trim()) set.add(m.trim());
        });
      }
    });
    return Array.from(set).sort();
  }, []);

  // Filter & Sort core logic
  const filteredFollowers = useMemo(() => {
    return FOLLOWERS.filter(f => {
      // Excluded mods override EVERYTHING
      if (excludedMods.length > 0 && excludedMods.includes(f.mod)) {
        return false;
      }

      // Excluded races override EVERYTHING (allow filtering out races as requested)
      if (excludedRaces.length > 0 && excludedRaces.includes(f.race)) {
        return false;
      }

      // Excluded classes override EVERYTHING (allow filtering out classes of tags)
      const followerClasses = f.class ? f.class.split(/\s*\/\s*/).map(c => c.trim()) : [];
      if (excludedClasses.length > 0 && excludedClasses.some(c => followerClasses.includes(c))) {
        return false;
      }

      // Excluded locations override EVERYTHING
      if (excludedLocations.length > 0 && excludedLocations.includes(f.location)) {
        return false;
      }

      // Excluded quests override EVERYTHING
      if (excludedQuests.length > 0 && f.quests.some(q => excludedQuests.includes(q))) {
        return false;
      }

      // Excluded non-follower mods override EVERYTHING
      if (excludedNonFollowerMods.length > 0 && f.nonFollowerMods.some(m => excludedNonFollowerMods.includes(m))) {
        return false;
      }

      // Check active filters status
      const activeKeyword = searchQuery.trim() !== '';
      const activeGender = !!selectedGender;
      const activeRace = selectedRaces.length > 0;
      const activeMod = selectedMods.length > 0;
      const activeClass = selectedClasses.length > 0;
      const activeInteracts = interactFilters.length > 0;
      const activeLocation = selectedLocations.length > 0;
      const activeQuests = selectedQuests.length > 0;
      const activeNonFollowerMods = selectedNonFollowerMods.length > 0;

      // 1. Text Search matching (overriding custom locations & commentaries too!)
      let matchesKeyword = false;
      if (activeKeyword) {
        const query = searchQuery.toLowerCase();
        matchesKeyword = f.follower.toLowerCase().includes(query) ||
                         f.class.toLowerCase().includes(query) ||
                         f.mod.toLowerCase().includes(query) ||
                         f.race.toLowerCase().includes(query) ||
                         f.location.toLowerCase().includes(query) ||
                         (f.quests && f.quests.some(q => q.toLowerCase().includes(query))) ||
                         (f.nonFollowerMods && f.nonFollowerMods.some(m => m.toLowerCase().includes(query)));
      }

      // 2. Gender matching
      let matchesGender = false;
      if (activeGender) {
        matchesGender = f.gender === selectedGender;
      }

      // 3. Race matching (multi-select)
      let matchesRace = false;
      if (activeRace) {
        if (raceMatchMode === 'and') {
          matchesRace = selectedRaces.every(race => f.race === race);
        } else {
          matchesRace = selectedRaces.includes(f.race);
        }
      }

      // 4. Mod pack matching (multi-select)
      let matchesMod = false;
      if (activeMod) {
        if (modMatchMode === 'and') {
          matchesMod = selectedMods.every(m => f.mod === m);
        } else {
          matchesMod = selectedMods.includes(f.mod);
        }
      }

      // 5. Class matching (multi-select for class tags)
      let matchesClass = false;
      if (activeClass) {
        if (classMatchMode === 'and') {
          matchesClass = selectedClasses.every(c => followerClasses.includes(c));
        } else {
          matchesClass = selectedClasses.some(c => followerClasses.includes(c));
        }
      }

      // 6. Interactions matching (multi-select)
      let matchesInteracts = false;
      if (activeInteracts) {
        const matchesOption = (filterItem: string) => {
          if (filterItem === '__has_any__') {
            return f.interactsWith.length > 0;
          } else {
            return f.interactsWith.some(
              partner => partner.toLowerCase() === filterItem.toLowerCase()
            );
          }
        };

        if (interactMatchMode === 'and') {
          matchesInteracts = interactFilters.every(matchesOption);
        } else {
          matchesInteracts = interactFilters.some(matchesOption);
        }
      }

      // 7. Starting Location matching
      let matchesLocation = false;
      if (activeLocation) {
        matchesLocation = selectedLocations.includes(f.location);
      }

      // 8. Quests commentary matching
      let matchesQuests = false;
      if (activeQuests) {
        if (questMatchMode === 'and') {
          matchesQuests = selectedQuests.every(q => f.quests.includes(q));
        } else {
          matchesQuests = selectedQuests.some(q => f.quests.includes(q));
        }
      }

      // 9. Non-follower mods commentary matching
      let matchesNonFollowerMods = false;
      if (activeNonFollowerMods) {
        if (nonFollowerModMatchMode === 'and') {
          matchesNonFollowerMods = selectedNonFollowerMods.every(m => f.nonFollowerMods.includes(m));
        } else {
          matchesNonFollowerMods = selectedNonFollowerMods.some(m => f.nonFollowerMods.includes(m));
        }
      }

      // Calculate total active category count
      const activeFiltersCount = 
        (activeKeyword ? 1 : 0) +
        (activeGender ? 1 : 0) +
        (activeRace ? 1 : 0) +
        (activeMod ? 1 : 0) +
        (activeClass ? 1 : 0) +
        (activeInteracts ? 1 : 0) +
        (activeLocation ? 1 : 0) +
        (activeQuests ? 1 : 0) +
        (activeNonFollowerMods ? 1 : 0);

      if (activeFiltersCount === 0) {
        return true;
      }

      if (globalFilterLogic === 'any') {
        // OR across categories: matches AT LEAST ONE active filter
        return (activeKeyword && matchesKeyword) ||
               (activeGender && matchesGender) ||
               (activeRace && matchesRace) ||
               (activeMod && matchesMod) ||
               (activeClass && matchesClass) ||
               (activeInteracts && matchesInteracts) ||
               (activeLocation && matchesLocation) ||
               (activeQuests && matchesQuests) ||
               (activeNonFollowerMods && matchesNonFollowerMods);
      } else {
        // AND across categories: must match ALL active filters
        return (!activeKeyword || matchesKeyword) &&
               (!activeGender || matchesGender) &&
               (!activeRace || matchesRace) &&
               (!activeMod || matchesMod) &&
               (!activeClass || matchesClass) &&
               (!activeInteracts || matchesInteracts) &&
               (!activeLocation || matchesLocation) &&
               (!activeQuests || matchesQuests) &&
               (!activeNonFollowerMods || matchesNonFollowerMods);
      }
    }).sort((a, b) => {
      let valA = a[sortField]?.toLowerCase() || '';
      let valB = b[sortField]?.toLowerCase() || '';

      if (sortDirection === 'asc') {
        return valA > valB ? 1 : valA < valB ? -1 : 0;
      } else {
        return valA < valB ? 1 : valA > valB ? -1 : 0;
      }
    });
  }, [
    searchQuery, selectedGender, selectedRaces, excludedRaces, selectedMods, excludedMods,
    selectedClasses, excludedClasses, interactFilters,
    selectedLocations, excludedLocations, selectedQuests, excludedQuests, questMatchMode,
    selectedNonFollowerMods, excludedNonFollowerMods, nonFollowerModMatchMode,
    globalFilterLogic, raceMatchMode, modMatchMode, classMatchMode, interactMatchMode,
    sortField, sortDirection
  ]);

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
    setSelectedRaces([]);
    setExcludedRaces([]);
    setSelectedMods([]);
    setExcludedMods([]);
    setSelectedClasses([]);
    setExcludedClasses([]);
    setInteractFilters([]);
    setSelectedLocations([]);
    setExcludedLocations([]);
    setSelectedQuests([]);
    setExcludedQuests([]);
    setSelectedNonFollowerMods([]);
    setExcludedNonFollowerMods([]);
    setGlobalFilterLogic('and');
    setRaceMatchMode('or');
    setModMatchMode('or');
    setClassMatchMode('or');
    setInteractMatchMode('or');
  };

  // Export current filtered followers list as CSV file
  const handleExportCSV = () => {
    const headers = [
      'Follower Name',
      'Gender',
      'Race or Species',
      'Combat Class',
      'Starting Location',
      'Quest Commentaries',
      'Non-Follower Mod Commentaries',
      'Origin Mod',
      'Interacts With',
      'Mod Web Link',
      'Database Notes'
    ];

    const escapeCSV = (val: string | null | undefined) => {
      if (val === null || val === undefined) return '';
      let str = String(val);
      str = str.replace(/"/g, '""');
      if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        return `"${str}"`;
      }
      return str;
    };

    const csvRows = [
      headers.join(','),
      ...filteredFollowers.map(f => {
        const interacts = f.interactsWith ? f.interactsWith.join('; ') : '';
        const questsText = f.quests ? f.quests.join('; ') : '';
        const nonFollowerModsText = f.nonFollowerMods ? f.nonFollowerMods.join('; ') : '';
        return [
          escapeCSV(f.follower),
          escapeCSV(f.gender),
          escapeCSV(f.race),
          escapeCSV(f.class),
          escapeCSV(f.location),
          escapeCSV(questsText),
          escapeCSV(nonFollowerModsText),
          escapeCSV(f.mod),
          escapeCSV(interacts),
          escapeCSV(f.modUrl),
          escapeCSV(f.note || '')
        ].join(',');
      })
    ];

    const blob = new Blob([csvRows.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `skyrim_followers_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

  const hasActiveFilters = 
    !!(searchQuery || 
    selectedGender || 
    selectedRaces.length > 0 || 
    excludedRaces.length > 0 ||
    selectedMods.length > 0 || 
    excludedMods.length > 0 || 
    selectedClasses.length > 0 || 
    excludedClasses.length > 0 || 
    interactFilters.length > 0 ||
    selectedLocations.length > 0 ||
    excludedLocations.length > 0 ||
    selectedQuests.length > 0 ||
    excludedQuests.length > 0 ||
    selectedNonFollowerMods.length > 0 ||
    excludedNonFollowerMods.length > 0);

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

          <div className="flex flex-col gap-6">
            {/* Inclusive Criteria Row */}
            <div>
              <h3 className="text-[10px] text-skyrim-gold/80 font-bold uppercase tracking-widest mb-2.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-skyrim-gold" /> Filter Criteria (Inclusion)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-9 gap-4">
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
                    Race (Species)
                  </label>
                  <select
                    id="race-select"
                    value=""
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val && !selectedRaces.includes(val)) {
                        setSelectedRaces([...selectedRaces, val]);
                      }
                    }}
                    className="w-full bg-skyrim-surf2 border border-skyrim-border hover:border-gray-600 focus:border-skyrim-gold rounded-lg px-3 py-1.5 text-xs text-gray-200 transition-all outline-none cursor-pointer"
                  >
                    <option value="">Include Races...</option>
                    {races.map(raceString => (
                      <option 
                        key={`race-opt-${raceString}`} 
                        value={raceString}
                        disabled={selectedRaces.includes(raceString)}
                        className="text-gray-200 disabled:text-gray-600"
                      >
                        {selectedRaces.includes(raceString) ? `✓ ${raceString}` : raceString}
                      </option>
                    ))}
                  </select>
                  {/* Race badges micro-list */}
                  {selectedRaces.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1 max-h-16 overflow-y-auto">
                      {selectedRaces.map(raceName => (
                        <span 
                          key={`race-badge-${raceName}`}
                          className="inline-flex items-center gap-1 bg-amber-950/20 text-[10px] text-skyrim-gold-light border border-skyrim-border/50 px-1.5 py-0.5 rounded"
                        >
                          <span className="truncate max-w-[130px]">{raceName}</span>
                          <button 
                             type="button" 
                             onClick={() => setSelectedRaces(selectedRaces.filter(r => r !== raceName))}
                             className="text-gray-400 hover:text-white font-bold focus:outline-none"
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Filter 3.1: Combat Class tags selection */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="class-select" className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">
                    Combat Class Tags
                  </label>
                  <select
                    id="class-select"
                    value=""
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val && !selectedClasses.includes(val)) {
                        setSelectedClasses([...selectedClasses, val]);
                      }
                    }}
                    className="w-full bg-skyrim-surf2 border border-skyrim-border hover:border-gray-600 focus:border-skyrim-gold rounded-lg px-3 py-1.5 text-xs text-gray-200 transition-all outline-none cursor-pointer"
                  >
                    <option value="">Include Classes...</option>
                    {classes.map(classString => (
                      <option 
                        key={`class-opt-${classString}`} 
                        value={classString}
                        disabled={selectedClasses.includes(classString)}
                        className="text-gray-200 disabled:text-gray-600"
                      >
                        {selectedClasses.includes(classString) ? `✓ ${classString}` : classString}
                      </option>
                    ))}
                  </select>
                  {/* Class badges micro-list */}
                  {selectedClasses.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1 max-h-16 overflow-y-auto">
                      {selectedClasses.map(className => (
                        <span 
                          key={`class-badge-${className}`}
                          className="inline-flex items-center gap-1 bg-blue-950/30 text-[10px] text-sky-305 border border-sky-900/30 px-1.5 py-0.5 rounded"
                        >
                          <span className="truncate max-w-[130px]">{className}</span>
                          <button 
                            type="button" 
                            onClick={() => setSelectedClasses(selectedClasses.filter(c => c !== className))}
                            className="text-gray-400 hover:text-white font-bold focus:outline-none"
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Filter 4: Origin Mod file */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="mod-select" className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">
                    Source Mod / Quest
                  </label>
                  <select
                    id="mod-select"
                    value=""
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val && !selectedMods.includes(val)) {
                        setSelectedMods([...selectedMods, val]);
                      }
                    }}
                    className="w-full bg-skyrim-surf2 border border-skyrim-border hover:border-gray-600 focus:border-skyrim-gold rounded-lg px-3 py-1.5 text-xs text-gray-200 transition-all outline-none cursor-pointer"
                  >
                    <option value="">Include Mods...</option>
                    {mods.map(modString => (
                      <option 
                        key={`mod-opt-${modString}`} 
                        value={modString}
                        disabled={selectedMods.includes(modString)}
                        className="text-gray-205 disabled:text-gray-600"
                      >
                        {selectedMods.includes(modString) ? `✓ ${modString}` : modString}
                      </option>
                    ))}
                  </select>
                  {/* Mods badges micro-list */}
                  {selectedMods.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1 max-h-16 overflow-y-auto">
                      {selectedMods.map(modName => (
                        <span 
                          key={`mod-badge-${modName}`}
                          className="inline-flex items-center gap-1 bg-[#1a1921] text-[10px] text-gray-300 border border-skyrim-border/50 px-1.5 py-0.5 rounded"
                        >
                          <span className="truncate max-w-[130px]">{modName}</span>
                          <button 
                            type="button" 
                            onClick={() => setSelectedMods(selectedMods.filter(m => m !== modName))}
                            className="text-gray-400 hover:text-white font-bold focus:outline-none"
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
                    value=""
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val && !interactFilters.includes(val)) {
                        setInteractFilters([...interactFilters, val]);
                      }
                    }}
                    className="w-full bg-skyrim-surf2 border border-skyrim-border hover:border-gray-600 focus:border-skyrim-gold rounded-lg px-3 py-1.5 text-xs text-gray-200 transition-all outline-none cursor-pointer"
                  >
                    <option value="">Select Banter...</option>
                    <option 
                      value="__has_any__"
                      disabled={interactFilters.includes('__has_any__')}
                      className="text-skyrim-gold disabled:text-gray-600"
                    >
                      Has any registered banter
                    </option>
                    <option disabled>── Filter by companion ──</option>
                    {followerNames.map(fName => (
                      <option 
                        key={`interact-opt-${fName}`} 
                        value={fName}
                        disabled={interactFilters.includes(fName)}
                        className="text-gray-205 disabled:text-gray-600"
                      >
                        {interactFilters.includes(fName) ? `✓ Mentions ${fName}` : `Mentions ${fName}`}
                      </option>
                    ))}
                  </select>
                  {/* Interaction badges micro-list */}
                  {interactFilters.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1 max-h-16 overflow-y-auto">
                      {interactFilters.map(filterItem => (
                        <span 
                          key={`interact-badge-${filterItem}`}
                          className="inline-flex items-center gap-1 bg-[#151c22] text-[10px] text-sky-305 border border-sky shadow-sm px-1.5 py-0.5 rounded"
                        >
                          <span className="truncate max-w-[130px]">
                            {filterItem === '__has_any__' ? 'Has Banter' : `Talks with ${filterItem}`}
                          </span>
                          <button 
                            type="button" 
                            onClick={() => setInteractFilters(interactFilters.filter(i => i !== filterItem))}
                            className="text-gray-400 hover:text-white font-bold focus:outline-none"
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Filter 6: Starting Locations (New) */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="location-select" className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">
                    Starting Location
                  </label>
                  <select
                    id="location-select"
                    value=""
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val && !selectedLocations.includes(val)) {
                        setSelectedLocations([...selectedLocations, val]);
                      }
                    }}
                    className="w-full bg-skyrim-surf2 border border-skyrim-border hover:border-gray-600 focus:border-skyrim-gold rounded-lg px-3 py-1.5 text-xs text-gray-200 transition-all outline-none cursor-pointer"
                  >
                    <option value="">Include Locations...</option>
                    {locations.map(loc => (
                      <option 
                        key={`location-opt-${loc}`} 
                        value={loc}
                        disabled={selectedLocations.includes(loc)}
                        className="text-gray-205 disabled:text-gray-600"
                      >
                        {selectedLocations.includes(loc) ? `✓ ${loc}` : loc}
                      </option>
                    ))}
                  </select>
                  {/* Location badges micro-list */}
                  {selectedLocations.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1 max-h-16 overflow-y-auto">
                      {selectedLocations.map(loc => (
                        <span 
                          key={`location-badge-${loc}`}
                          className="inline-flex items-center gap-1 bg-[#231b14] text-[10px] text-skyrim-gold border border-skyrim-gold/25 px-1.5 py-0.5 rounded"
                        >
                          <span className="truncate max-w-[130px]">{loc}</span>
                          <button 
                            type="button" 
                            onClick={() => setSelectedLocations(selectedLocations.filter(l => l !== loc))}
                            className="text-gray-405 hover:text-white font-bold focus:outline-none"
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Filter 7: Quest Commentary (New) */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="quest-select" className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">
                    Quest Commentary
                  </label>
                  <select
                    id="quest-select"
                    value=""
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val && !selectedQuests.includes(val)) {
                        setSelectedQuests([...selectedQuests, val]);
                      }
                    }}
                    className="w-full bg-skyrim-surf2 border border-skyrim-border hover:border-gray-600 focus:border-skyrim-gold rounded-lg px-3 py-1.5 text-xs text-gray-200 transition-all outline-none cursor-pointer"
                  >
                    <option value="">Include Quests...</option>
                    {quests.map(qst => (
                      <option 
                        key={`quest-opt-${qst}`} 
                        value={qst}
                        disabled={selectedQuests.includes(qst)}
                        className="text-gray-205 disabled:text-gray-600"
                      >
                        {selectedQuests.includes(qst) ? `✓ ${qst}` : qst}
                      </option>
                    ))}
                  </select>
                  {/* Quest badges micro-list */}
                  {selectedQuests.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1 max-h-16 overflow-y-auto">
                      {selectedQuests.map(qst => (
                        <span 
                          key={`quest-badge-${qst}`}
                          className="inline-flex items-center gap-1 bg-amber-950/20 text-[10px] text-[#dac29a] border border-skyrim-gold/20 px-1.5 py-0.5 rounded"
                        >
                          <span className="truncate max-w-[130px]">{qst}</span>
                          <button 
                            type="button" 
                            onClick={() => setSelectedQuests(selectedQuests.filter(q => q !== qst))}
                            className="text-gray-405 hover:text-white font-bold focus:outline-none"
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Filter 8: Non-Follower Mod dialogue commentary (New) */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="nonfollower-select" className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">
                    Non-Follower Mod
                  </label>
                  <select
                    id="nonfollower-select"
                    value=""
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val && !selectedNonFollowerMods.includes(val)) {
                        setSelectedNonFollowerMods([...selectedNonFollowerMods, val]);
                      }
                    }}
                    className="w-full bg-skyrim-surf2 border border-skyrim-border hover:border-gray-600 focus:border-skyrim-gold rounded-lg px-3 py-1.5 text-xs text-gray-200 transition-all outline-none cursor-pointer"
                  >
                    <option value="">Include Ext-Mods...</option>
                    {nonFollowerMods.map(exMod => (
                      <option 
                        key={`nonfollower-opt-${exMod}`} 
                        value={exMod}
                        disabled={selectedNonFollowerMods.includes(exMod)}
                        className="text-gray-205 disabled:text-gray-600"
                      >
                        {selectedNonFollowerMods.includes(exMod) ? `✓ ${exMod}` : exMod}
                      </option>
                    ))}
                  </select>
                  {/* Ext-Mod badges micro-list */}
                  {selectedNonFollowerMods.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1 max-h-16 overflow-y-auto">
                      {selectedNonFollowerMods.map(exMod => (
                        <span 
                          key={`nonfollower-badge-${exMod}`}
                          className="inline-flex items-center gap-1 bg-[#101b1e] text-[10px] text-cyan-350 border border-cyan-900/40 px-1.5 py-0.5 rounded"
                        >
                          <span className="truncate max-w-[130px]">{exMod}</span>
                          <button 
                            type="button" 
                            onClick={() => setSelectedNonFollowerMods(selectedNonFollowerMods.filter(m => m !== exMod))}
                            className="text-cyan-405 hover:text-white font-bold focus:outline-none"
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* Strict Exclusionary Overrides */}
            <div className="border-t border-skyrim-border/30 pt-4">
              <h3 className="text-[10px] text-rose-400 font-bold uppercase tracking-widest mb-2.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" /> STRICT Overrides (Exclusion / Filters Out)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                
                {/* Exclude Races (requested: as well as filtering out races as well) */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="exclude-race-select" className="text-[11px] text-rose-450 font-bold uppercase tracking-wider">
                    Exclude Races
                  </label>
                  <select
                    id="exclude-race-select"
                    value=""
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val && !excludedRaces.includes(val)) {
                        setExcludedRaces([...excludedRaces, val]);
                      }
                    }}
                    className="w-full bg-skyrim-surf2 border border-skyrim-border hover:border-rose-500/50 focus:border-skyrim-gold rounded-lg px-3 py-1.5 text-xs text-rose-200 transition-all outline-none cursor-pointer"
                  >
                    <option value="" className="text-gray-400">Exclude race species...</option>
                    {races.map(raceString => (
                      <option 
                        key={`exclude-race-${raceString}`} 
                        value={raceString}
                        disabled={excludedRaces.includes(raceString)}
                        className="text-gray-200 disabled:text-gray-600"
                      >
                        {excludedRaces.includes(raceString) ? `✓ ${raceString} (Excluded)` : `Exclude ${raceString}`}
                      </option>
                    ))}
                  </select>
                  {/* Excluded races badges */}
                  {excludedRaces.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1 max-h-16 overflow-y-auto">
                      {excludedRaces.map(raceName => (
                        <span 
                          key={`exclude-race-badge-${raceName}`}
                          className="inline-flex items-center gap-1 bg-rose-950/40 text-[10px] text-rose-300 border border-rose-900/40 px-1.5 py-0.5 rounded"
                        >
                          <span className="truncate max-w-[130px]">{raceName}</span>
                          <button 
                            type="button" 
                            onClick={() => setExcludedRaces(excludedRaces.filter(r => r !== raceName))}
                            className="text-rose-400 hover:text-rose-200 font-bold focus:outline-none"
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Exclude Classes (requested: filter classes in or out) */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="exclude-class-select" className="text-[11px] text-rose-455 font-bold uppercase tracking-wider">
                    Exclude Classes
                  </label>
                  <select
                    id="exclude-class-select"
                    value=""
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val && !excludedClasses.includes(val)) {
                        setExcludedClasses([...excludedClasses, val]);
                      }
                    }}
                    className="w-full bg-skyrim-surf2 border border-skyrim-border hover:border-rose-500/50 focus:border-skyrim-gold rounded-lg px-3 py-1.5 text-xs text-rose-200 transition-all outline-none cursor-pointer"
                  >
                    <option value="" className="text-gray-400">Exclude class roles...</option>
                    {classes.map(classString => (
                      <option 
                        key={`exclude-class-${classString}`} 
                        value={classString}
                        disabled={excludedClasses.includes(classString)}
                        className="text-gray-200 disabled:text-gray-600"
                      >
                        {excludedClasses.includes(classString) ? `✓ ${classString} (Excluded)` : `Exclude ${classString}`}
                      </option>
                    ))}
                  </select>
                  {/* Excluded classes badges */}
                  {excludedClasses.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1 max-h-16 overflow-y-auto">
                      {excludedClasses.map(className => (
                        <span 
                          key={`exclude-class-badge-${className}`}
                          className="inline-flex items-center gap-1 bg-rose-950/40 text-[10px] text-rose-300 border border-rose-900/40 px-1.5 py-0.5 rounded"
                        >
                          <span className="truncate max-w-[130px]">{className}</span>
                          <button 
                            type="button" 
                            onClick={() => setExcludedClasses(excludedClasses.filter(c => c !== className))}
                            className="text-rose-400 hover:text-rose-200 font-bold focus:outline-none"
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Exclude Mods */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="exclude-mod-select" className="text-[11px] text-rose-455 font-bold uppercase tracking-wider">
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
                        key={`exclude-mod-${modString}`} 
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
                            className="text-rose-400 hover:text-rose-200 font-bold focus:outline-none"
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Exclude Starting Locations (New) */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="exclude-location-select" className="text-[11px] text-rose-455 font-bold uppercase tracking-wider">
                    Exclude Locations
                  </label>
                  <select
                    id="exclude-location-select"
                    value=""
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val && !excludedLocations.includes(val)) {
                        setExcludedLocations([...excludedLocations, val]);
                      }
                    }}
                    className="w-full bg-skyrim-surf2 border border-skyrim-border hover:border-rose-500/50 focus:border-skyrim-gold rounded-lg px-3 py-1.5 text-xs text-rose-200 transition-all outline-none cursor-pointer"
                  >
                    <option value="" className="text-gray-400">Exclude location...</option>
                    {locations.map(loc => (
                      <option 
                        key={`exclude-location-${loc}`} 
                        value={loc}
                        disabled={excludedLocations.includes(loc)}
                        className="text-gray-200 disabled:text-gray-600"
                      >
                        {excludedLocations.includes(loc) ? `✓ ${loc} (Excluded)` : `Exclude ${loc}`}
                      </option>
                    ))}
                  </select>
                  {/* Exclusions Micro-list */}
                  {excludedLocations.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1 max-h-16 overflow-y-auto">
                      {excludedLocations.map(loc => (
                        <span 
                          key={`exclude-loc-badge-${loc}`}
                          className="inline-flex items-center gap-1 bg-rose-950/40 text-[10px] text-rose-300 border border-rose-900/40 px-1.5 py-0.5 rounded"
                        >
                          <span className="truncate max-w-[130px]">{loc}</span>
                          <button 
                            type="button" 
                            onClick={() => setExcludedLocations(excludedLocations.filter(l => l !== loc))}
                            className="text-rose-400 hover:text-rose-200 font-bold focus:outline-none"
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Exclude Quests Commentary (New) */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="exclude-quest-select" className="text-[11px] text-rose-455 font-bold uppercase tracking-wider">
                    Exclude Quests
                  </label>
                  <select
                    id="exclude-quest-select"
                    value=""
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val && !excludedQuests.includes(val)) {
                        setExcludedQuests([...excludedQuests, val]);
                      }
                    }}
                    className="w-full bg-skyrim-surf2 border border-skyrim-border hover:border-rose-500/50 focus:border-skyrim-gold rounded-lg px-3 py-1.5 text-xs text-rose-200 transition-all outline-none cursor-pointer"
                  >
                    <option value="" className="text-gray-400">Exclude quests...</option>
                    {quests.map(qst => (
                      <option 
                        key={`exclude-quest-${qst}`} 
                        value={qst}
                        disabled={excludedQuests.includes(qst)}
                        className="text-gray-200 disabled:text-gray-600"
                      >
                        {excludedQuests.includes(qst) ? `✓ ${qst} (Excluded)` : `Exclude ${qst}`}
                      </option>
                    ))}
                  </select>
                  {/* Exclusions Micro-list */}
                  {excludedQuests.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1 max-h-16 overflow-y-auto">
                      {excludedQuests.map(qst => (
                        <span 
                          key={`exclude-quest-badge-${qst}`}
                          className="inline-flex items-center gap-1 bg-rose-950/40 text-[10px] text-rose-300 border border-rose-900/40 px-1.5 py-0.5 rounded"
                        >
                          <span className="truncate max-w-[130px]">{qst}</span>
                          <button 
                            type="button" 
                            onClick={() => setExcludedQuests(excludedQuests.filter(q => q !== qst))}
                            className="text-rose-400 hover:text-rose-200 font-bold focus:outline-none"
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Exclude Non-Follower Mods Commentary (New) */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="exclude-nonfollower-select" className="text-[11px] text-rose-455 font-bold uppercase tracking-wider">
                    Exclude Ext-Mods
                  </label>
                  <select
                    id="exclude-nonfollower-select"
                    value=""
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val && !excludedNonFollowerMods.includes(val)) {
                        setExcludedNonFollowerMods([...excludedNonFollowerMods, val]);
                      }
                    }}
                    className="w-full bg-skyrim-surf2 border border-skyrim-border hover:border-rose-500/50 focus:border-skyrim-gold rounded-lg px-3 py-1.5 text-xs text-rose-200 transition-all outline-none cursor-pointer"
                  >
                    <option value="" className="text-gray-400">Exclude non-follower mods...</option>
                    {nonFollowerMods.map(exMod => (
                      <option 
                        key={`exclude-nonfollower-${exMod}`} 
                        value={exMod}
                        disabled={excludedNonFollowerMods.includes(exMod)}
                        className="text-gray-200 disabled:text-gray-600"
                      >
                        {excludedNonFollowerMods.includes(exMod) ? `✓ ${exMod} (Excluded)` : `Exclude ${exMod}`}
                      </option>
                    ))}
                  </select>
                  {/* Exclusions Micro-list */}
                  {excludedNonFollowerMods.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1 max-h-16 overflow-y-auto">
                      {excludedNonFollowerMods.map(exMod => (
                        <span 
                          key={`exclude-nonfollower-badge-${exMod}`}
                          className="inline-flex items-center gap-1 bg-rose-950/40 text-[10px] text-rose-300 border border-rose-900/40 px-1.5 py-0.5 rounded"
                        >
                          <span className="truncate max-w-[130px]">{exMod}</span>
                          <button 
                            type="button" 
                            onClick={() => setExcludedNonFollowerMods(excludedNonFollowerMods.filter(m => m !== exMod))}
                            className="text-rose-400 hover:text-rose-200 font-bold focus:outline-none"
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </div>

          </div>

          {/* Logic Settings Control Panel */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-3.5 border-t border-skyrim-border/50 text-xs">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-gray-400 font-semibold uppercase text-[10px] tracking-wider flex items-center gap-1.5 shrink-0">
                <Sparkles className="w-3.5 h-3.5 text-skyrim-gold/80 animate-pulse-subtle" /> Category Combination:
              </span>
              <div className="inline-flex rounded-lg border border-skyrim-border/70 p-0.5 bg-skyrim-surf2/80">
                <button
                  type="button"
                  onClick={() => setGlobalFilterLogic('and')}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-all ${
                    globalFilterLogic === 'and'
                      ? 'bg-skyrim-gold/20 text-skyrim-gold-light border border-skyrim-gold/20 shadow-sm font-semibold'
                      : 'text-gray-400 hover:text-gray-205 border border-transparent hover:bg-stone-800/30'
                  }`}
                  title="Follower must match ALL selected filters (Keyword AND Gender AND Races AND Classes AND Mods AND Banter)"
                >
                  Match ALL Categories (AND)
                </button>
                <button
                  type="button"
                  onClick={() => setGlobalFilterLogic('or')}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-all ${
                    globalFilterLogic === 'or'
                      ? 'bg-skyrim-gold/20 text-skyrim-gold-light border border-skyrim-gold/20 shadow-sm font-semibold'
                      : 'text-gray-400 hover:text-gray-205 border border-transparent hover:bg-stone-800/30'
                  }`}
                  title="Follower matches if they meet AT LEAST ONE of your active criteria filters (Gender OR Races OR Classes OR Mods OR Banter)"
                >
                  Match ANY Category (OR)
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span className="text-gray-400 font-semibold uppercase text-[10px] tracking-wider shrink-0">
                Multi-Select Logic:
              </span>
              
              {/* Races Match Mode Toggle */}
              <div className="flex items-center gap-1.5 bg-skyrim-surf2/50 px-2 py-1 rounded border border-skyrim-border/40 hover:border-gray-600 transition-colors cursor-help" title="ANY allows followers matching at least one selected race; ALL requires matching all selected races.">
                <span className="text-gray-400 text-[10px] uppercase font-medium">Races:</span>
                <button
                  type="button"
                  onClick={() => setRaceMatchMode(prev => prev === 'and' ? 'or' : 'and')}
                  className={`px-1.5 py-0.5 text-[9px] font-bold rounded uppercase tracking-wider transition-all select-none ${
                    raceMatchMode === 'and'
                      ? 'bg-amber-950/45 text-amber-300 border border-amber-900/40 shadow-sm'
                      : 'bg-stone-800 text-stone-400 hover:text-gray-200'
                  }`}
                >
                  {raceMatchMode === 'and' ? 'ALL (AND)' : 'ANY (OR)'}
                </button>
              </div>

              {/* Classes Match Mode Toggle */}
              <div className="flex items-center gap-1.5 bg-skyrim-surf2/50 px-2 py-1 rounded border border-skyrim-border/40 hover:border-gray-600 transition-colors cursor-help" title="ANY shows followers matching at least one selected class; ALL requires matching all of your selected class tags (for dual/triple classes).">
                <span className="text-gray-400 text-[10px] uppercase font-medium">Classes:</span>
                <button
                  type="button"
                  onClick={() => setClassMatchMode(prev => prev === 'and' ? 'or' : 'and')}
                  className={`px-1.5 py-0.5 text-[9px] font-bold rounded uppercase tracking-wider transition-all select-none ${
                    classMatchMode === 'and'
                      ? 'bg-amber-950/45 text-amber-300 border border-amber-900/40 shadow-sm'
                      : 'bg-stone-800 text-stone-400 hover:text-gray-200'
                  }`}
                >
                  {classMatchMode === 'and' ? 'ALL (AND)' : 'ANY (OR)'}
                </button>
              </div>

              {/* Mods Match Mode Toggle */}
              <div className="flex items-center gap-1.5 bg-skyrim-surf2/50 px-2 py-1 rounded border border-skyrim-border/40 hover:border-gray-600 transition-colors cursor-help" title="ANY allows followers starting in at least one selected mod; ALL requires matching all selected origin mods at the same time.">
                <span className="text-gray-400 text-[10px] uppercase font-medium">Mods:</span>
                <button
                  type="button"
                  onClick={() => setModMatchMode(prev => prev === 'and' ? 'or' : 'and')}
                  className={`px-1.5 py-0.5 text-[9px] font-bold rounded uppercase tracking-wider transition-all select-none ${
                    modMatchMode === 'and'
                      ? 'bg-amber-950/45 text-skyrim-gold border border-amber-900/40 shadow-sm'
                      : 'bg-stone-800 text-stone-400 hover:text-gray-200'
                  }`}
                >
                  {modMatchMode === 'and' ? 'ALL (AND)' : 'ANY (OR)'}
                </button>
              </div>

              {/* Interaction Match Mode Toggle */}
              <div className="flex items-center gap-1.5 bg-skyrim-surf2/50 px-2 py-1 rounded border border-skyrim-border/40 hover:border-gray-600 transition-colors cursor-help" title="If you filter by multiple companions: ANY will show anyone with custom dialogue banter with at least one; ALL forces the list to show only followers who interact with EVERY one of your choices (e.g. both Remiel AND Xelzaz).">
                <span className="text-gray-400 text-[10px] uppercase font-medium">Banter:</span>
                <button
                  type="button"
                  onClick={() => setInteractMatchMode(prev => prev === 'and' ? 'or' : 'and')}
                  className={`px-1.5 py-0.5 text-[9px] font-bold rounded uppercase tracking-wider transition-all select-none ${
                    interactMatchMode === 'and'
                      ? 'bg-sky-950/60 text-sky-305 border border-sky-900/50 shadow-sm font-extrabold'
                      : 'bg-stone-800 text-stone-400 hover:text-gray-200'
                  }`}
                >
                  {interactMatchMode === 'and' ? 'ALL (AND)' : 'ANY (OR)'}
                </button>
              </div>

              {/* Quests Match Mode Toggle */}
              <div className="flex items-center gap-1.5 bg-skyrim-surf2/50 px-2 py-1 rounded border border-skyrim-border/40 hover:border-gray-600 transition-colors cursor-help" title="ANY shows followers supporting commentary for at least one selected quest; ALL requires supporting commentary for ALL of your selected quests.">
                <span className="text-gray-400 text-[10px] uppercase font-medium">Quests:</span>
                <button
                  type="button"
                  onClick={() => setQuestMatchMode(prev => prev === 'and' ? 'or' : 'and')}
                  className={`px-1.5 py-0.5 text-[9px] font-bold rounded uppercase tracking-wider transition-all select-none ${
                    questMatchMode === 'and'
                      ? 'bg-amber-950/45 text-[#9adab1] border border-[#2b4c3e]/40 shadow-sm'
                      : 'bg-stone-800 text-stone-400 hover:text-gray-200'
                  }`}
                >
                  {questMatchMode === 'and' ? 'ALL (AND)' : 'ANY (OR)'}
                </button>
              </div>

              {/* Non-Followers Mods Match Mode Toggle */}
              <div className="flex items-center gap-1.5 bg-skyrim-surf2/50 px-2 py-1 rounded border border-skyrim-border/40 hover:border-gray-600 transition-colors cursor-help" title="ANY shows followers with banter commentary for at least one selected external mod; ALL requires commenting on ALL of your selected external mods concurrently.">
                <span className="text-gray-400 text-[10px] uppercase font-medium">Ext-Mods:</span>
                <button
                  type="button"
                  onClick={() => setNonFollowerModMatchMode(prev => prev === 'and' ? 'or' : 'and')}
                  className={`px-1.5 py-0.5 text-[9px] font-bold rounded uppercase tracking-wider transition-all select-none ${
                    nonFollowerModMatchMode === 'and'
                      ? 'bg-[#101c1e] text-cyan-300 border border-cyan-900/40 shadow-sm'
                      : 'bg-stone-800 text-stone-400 hover:text-gray-200'
                  }`}
                >
                  {nonFollowerModMatchMode === 'and' ? 'ALL (AND)' : 'ANY (OR)'}
                </button>
              </div>
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
              
              {/* Races */}
              {selectedRaces.map(raceName => (
                <span key={`active-race-${raceName}`} className="bg-skyrim-surf3 border border-emerald-950/40 px-2 py-0.5 rounded text-skyrim-gold-light flex items-center gap-1.5 shadow-sm animate-fade-in">
                  Race: {raceName}
                  <button 
                    onClick={() => setSelectedRaces(prev => prev.filter(r => r !== raceName))}
                    className="hover:text-white ml-0.5 font-bold text-gray-400 focus:outline-none"
                    title="Remove Filter"
                  >
                    ✕
                  </button>
                </span>
              ))}
              {excludedRaces.map(raceName => (
                <span key={`active-ex-race-${raceName}`} className="bg-rose-950/40 border border-rose-900/40 px-2 py-0.5 rounded text-rose-350 flex items-center gap-1.5 shadow-sm">
                  Excluded Race: {raceName}
                  <button 
                    onClick={() => setExcludedRaces(prev => prev.filter(r => r !== raceName))}
                    className="hover:text-white ml-0.5 font-bold text-rose-450 focus:outline-none"
                    title="Remove Exclusion"
                  >
                    ✕
                  </button>
                </span>
              ))}

              {/* Classes */}
              {selectedClasses.map(className => (
                <span key={`active-class-${className}`} className="bg-skyrim-surf3 border border-sky-950/50 px-2 py-0.5 rounded text-sky-305 flex items-center gap-1.5 shadow-sm">
                  Class: {className}
                  <button 
                    onClick={() => setSelectedClasses(prev => prev.filter(c => c !== className))}
                    className="hover:text-white ml-0.5 font-bold text-sky-400 focus:outline-none"
                    title="Remove Filter"
                  >
                    ✕
                  </button>
                </span>
              ))}
              {excludedClasses.map(className => (
                <span key={`active-ex-class-${className}`} className="bg-rose-950/40 border border-rose-900/40 px-2 py-0.5 rounded text-rose-350 flex items-center gap-1.5 shadow-sm">
                  Excluded Class: {className}
                  <button 
                    onClick={() => setExcludedClasses(prev => prev.filter(c => c !== className))}
                    className="hover:text-white ml-0.5 font-bold text-rose-450 focus:outline-none"
                    title="Remove Exclusion"
                  >
                    ✕
                  </button>
                </span>
              ))}

              {/* Source Mods */}
              {selectedMods.map(modName => (
                <span key={`active-mod-${modName}`} className="bg-skyrim-surf3 border border-skyrim-border px-2 py-0.5 rounded text-gray-300 flex items-center gap-1.5 shadow-sm">
                  Source: {modName}
                  <button 
                    onClick={() => setSelectedMods(prev => prev.filter(m => m !== modName))}
                    className="hover:text-white ml-0.5 font-bold text-gray-400 focus:outline-none"
                    title="Remove Filter"
                  >
                    ✕
                  </button>
                </span>
              ))}
              {excludedMods.map(modName => (
                <span key={`active-ex-mod-${modName}`} className="bg-rose-950/40 border border-rose-900/40 px-2 py-0.5 rounded text-rose-350 flex items-center gap-1.5 shadow-sm">
                  Excluded Mod: {modName}
                  <button 
                    onClick={() => setExcludedMods(prev => prev.filter(m => m !== modName))}
                    className="hover:text-white ml-0.5 font-bold text-rose-450 focus:outline-none"
                    title="Remove Exclusion"
                  >
                    ✕
                  </button>
                </span>
              ))}

              {/* Locations */}
              {selectedLocations.map(loc => (
                <span key={`active-loc-${loc}`} className="bg-[#2a2118] border border-skyrim-gold/25 px-2 py-0.5 rounded text-skyrim-gold-light flex items-center gap-1.5 shadow-sm">
                  Starting: {loc}
                  <button 
                    onClick={() => setSelectedLocations(prev => prev.filter(l => l !== loc))}
                    className="hover:text-white ml-0.5 font-bold text-gray-400 focus:outline-none"
                    title="Remove Filter"
                  >
                    ✕
                  </button>
                </span>
              ))}
              {excludedLocations.map(loc => (
                <span key={`active-ex-loc-${loc}`} className="bg-rose-950/40 border border-rose-900/40 px-2 py-0.5 rounded text-rose-350 flex items-center gap-1.5 shadow-sm">
                  Excluded Starting: {loc}
                  <button 
                    onClick={() => setExcludedLocations(prev => prev.filter(l => l !== loc))}
                    className="hover:text-white ml-0.5 font-bold text-rose-450 focus:outline-none"
                    title="Remove Exclusion"
                  >
                    ✕
                  </button>
                </span>
              ))}

              {/* Quests Commentary */}
              {selectedQuests.map(qst => (
                <span key={`active-qst-${qst}`} className="bg-[#1b2520] border border-[#2b4c3e]/30 px-2 py-0.5 rounded text-[#9adab1] flex items-center gap-1.5 shadow-sm">
                  Quest Commentary: {qst}
                  <button 
                    onClick={() => setSelectedQuests(prev => prev.filter(q => q !== qst))}
                    className="hover:text-white ml-0.5 font-bold text-gray-400 focus:outline-none"
                    title="Remove Filter"
                  >
                    ✕
                  </button>
                </span>
              ))}
              {excludedQuests.map(qst => (
                <span key={`active-ex-qst-${qst}`} className="bg-rose-950/40 border border-rose-900/40 px-2 py-0.5 rounded text-rose-350 flex items-center gap-1.5 shadow-sm">
                  Excluded Quest: {qst}
                  <button 
                    onClick={() => setExcludedQuests(prev => prev.filter(q => q !== qst))}
                    className="hover:text-white ml-0.5 font-bold text-rose-450 focus:outline-none"
                    title="Remove Exclusion"
                  >
                    ✕
                  </button>
                </span>
              ))}

              {/* Non-Followers Mods Commentary */}
              {selectedNonFollowerMods.map(exMod => (
                <span key={`active-exmod-${exMod}`} className="bg-[#101c1e] border border-cyan-900/40 px-2 py-0.5 rounded text-cyan-305 flex items-center gap-1.5 shadow-sm">
                  Ext-Mod Commentary: {exMod}
                  <button 
                    onClick={() => setSelectedNonFollowerMods(prev => prev.filter(m => m !== exMod))}
                    className="hover:text-white ml-0.5 font-bold text-cyan-400 focus:outline-none"
                    title="Remove Filter"
                  >
                    ✕
                  </button>
                </span>
              ))}
              {excludedNonFollowerMods.map(exMod => (
                <span key={`active-ex-exmod-${exMod}`} className="bg-rose-950/40 border border-rose-900/40 px-2 py-0.5 rounded text-rose-350 flex items-center gap-1.5 shadow-sm">
                  Excluded Ext-Mod: {exMod}
                  <button 
                    onClick={() => setExcludedNonFollowerMods(prev => prev.filter(m => m !== exMod))}
                    className="hover:text-white ml-0.5 font-bold text-rose-450 focus:outline-none"
                    title="Remove Exclusion"
                  >
                    ✕
                  </button>
                </span>
              ))}

              {/* Banter */}
              {interactFilters.map(filterItem => (
                <span key={`active-interact-${filterItem}`} className="bg-[#121c22] border border-sky-900/30 px-2 py-0.5 rounded text-sky-305 flex items-center gap-1.5 shadow-sm">
                  {filterItem === '__has_any__' ? 'Banter: Any interaction' : `Talks with: ${filterItem}`}
                  <button 
                    onClick={() => setInteractFilters(prev => prev.filter(i => i !== filterItem))}
                    className="hover:text-white ml-0.5 font-bold text-sky-400 focus:outline-none"
                    title="Remove Filter"
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          )}
        </section>

        {/* Full-width Stacked Layout: Searchable Database Registry & Detailed Profile */}
        <section className="flex flex-col gap-6 md:gap-8">
          
          {/* Searchable Database Registry */}
          <div className="w-full flex flex-col gap-4">
            
            {/* Header / Subtotal counter summary */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-skyrim-gold-light" />
                  <h2 className="font-display font-semibold text-lg tracking-wider text-white">
                    A-Z Skyrim Registry
                  </h2>
                </div>
                <span className="text-[10px] text-gray-500 italic mt-0.5 sm:mt-0 sm:ml-2">
                  (Scroll horizontally ↔ to view Locations, Quests & Mod Interactions)
                </span>
              </div>
              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-start">
                <span className="text-xs bg-skyrim-surf border border-skyrim-border px-2.5 py-1.5 rounded text-gray-400 font-mono">
                  Showing <strong className="text-skyrim-gold">{filteredFollowers.length}</strong> of {FOLLOWERS.length} records
                </span>
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="flex items-center gap-1.5 bg-skyrim-surf hover:bg-skyrim-surf2 border border-[#BFA15A]/30 hover:border-[#BFA15A] text-gray-300 hover:text-white text-xs px-3 py-1.5 rounded-lg font-medium transition-all shadow-sm focus:outline-none focus:ring-1 focus:ring-[#BFA15A]/30 cursor-pointer select-none"
                  title="Export current filtered list to CSV spreadsheet file"
                >
                  <Download className="w-3.5 h-3.5 text-skyrim-gold" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            {/* Main table container block with horizontal & vertical scrolling */}
            <div className="bg-skyrim-surf border border-skyrim-border rounded-xl shadow-md overflow-hidden" id="registry-table-card">
              <div className="max-h-[560px] overflow-auto relative scrollbar-thin">
                <table className="w-full text-left border-collapse text-xs md:text-sm">
                  
                  {/* Styled Header columns with sorting actions */}
                  <thead className="bg-[#1c1813] sticky top-0 z-15 shadow-sm border-b border-skyrim-border">
                    <tr className="text-gray-400 uppercase text-[10px] md:text-xs font-display tracking-wider">
                      <th 
                        className="py-3 px-4 cursor-pointer hover:bg-skyrim-surf3 transition-colors text-skyrim-gold font-semibold select-none whitespace-nowrap"
                        onClick={() => handleSort('follower')}
                      >
                        <div className="flex items-center gap-1.5">
                          Follower Name
                          <ArrowUpDown className="w-3 h-3 text-gray-500" />
                        </div>
                      </th>
                      <th 
                        className="py-3 px-3 cursor-pointer hover:bg-skyrim-surf3 transition-colors font-semibold select-none whitespace-nowrap"
                        onClick={() => handleSort('gender')}
                      >
                        <div className="flex items-center gap-1.5">
                          Gender
                          <ArrowUpDown className="w-3 h-3 text-gray-500" />
                        </div>
                      </th>
                      <th 
                        className="py-3 px-3 cursor-pointer hover:bg-skyrim-surf3 transition-colors font-semibold select-none whitespace-nowrap"
                        onClick={() => handleSort('race')}
                      >
                        <div className="flex items-center gap-1.5">
                          Race / Species
                          <ArrowUpDown className="w-3 h-3 text-gray-500" />
                        </div>
                      </th>
                      <th 
                        className="py-3 px-3 cursor-pointer hover:bg-skyrim-surf3 transition-colors font-semibold select-none whitespace-nowrap"
                        onClick={() => handleSort('class')}
                      >
                        <div className="flex items-center gap-1.5">
                          Combat Class
                          <ArrowUpDown className="w-3 h-3 text-gray-500" />
                        </div>
                      </th>
                      <th 
                        className="py-3 px-3 cursor-pointer hover:bg-skyrim-surf3 transition-colors font-semibold select-none whitespace-nowrap"
                        onClick={() => handleSort('mod')}
                      >
                        <div className="flex items-center gap-1.5">
                          Origin Mod
                          <ArrowUpDown className="w-3 h-3 text-gray-500" />
                        </div>
                      </th>
                      <th 
                        className="py-3 px-3 cursor-pointer hover:bg-skyrim-surf3 transition-colors font-semibold select-none whitespace-nowrap"
                        onClick={() => handleSort('location')}
                      >
                        <div className="flex items-center gap-1.5 text-skyrim-gold-light">
                          Starting Location
                          <ArrowUpDown className="w-3 h-3 text-gray-500" />
                        </div>
                      </th>
                      <th className="py-3 px-3 font-semibold select-none whitespace-nowrap text-skyrim-gold-light">
                        Quests
                      </th>
                      <th className="py-3 px-3 font-semibold select-none whitespace-nowrap text-skyrim-gold-light">
                        Mod Interactions
                      </th>
                      <th className="py-3 px-3 font-semibold select-none whitespace-nowrap text-stone-400">
                        Ext-mods
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
                            <td className="py-2.5 px-4 font-semibold text-gray-100 relative whitespace-nowrap">
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
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <span className={`text-[10px] font-semibold tracking-wider px-2 py-0.5 rounded shadow-sm ${
                                f.gender === 'Male' 
                                  ? 'bg-blue-950/40 text-blue-300' 
                                  : 'bg-pink-950/40 text-pink-300'
                              }`}>
                                {f.gender}
                              </span>
                            </td>

                            {/* Column 3: Race tag species */}
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded break-all ${getRaceBadgeClass(f.race)}`}>
                                {f.race}
                              </span>
                            </td>

                            {/* Column 4: Combat class / In-game role role */}
                            <td className="py-2.5 px-3 text-xs text-gray-300 whitespace-nowrap max-w-[130px] truncate">
                              {f.class}
                            </td>

                            {/* Column 5: Mod package details */}
                            <td className="py-2.5 px-3 text-xs text-skyrim-gold-light/90 italic whitespace-nowrap max-w-[155px] truncate">
                              {f.mod}
                            </td>

                            {/* Column 6: Starting Location (New) */}
                            <td className="py-2.5 px-3 text-xs text-stone-300 whitespace-nowrap">
                              <div className="inline-flex items-center gap-1 bg-stone-900 border border-stone-800 text-stone-300 px-2 py-0.5 rounded text-[10px] font-semibold">
                                <MapPin className="w-3 h-3 text-skyrim-gold/60 flex-shrink-0" />
                                <span className="truncate">{f.location || "Unknown"}</span>
                              </div>
                            </td>

                            {/* Column 7: Quests commentaries as Tags */}
                            <td className="py-2.5 px-3">
                              <div className="flex flex-wrap gap-1 min-w-[180px] max-w-[300px]">
                                {f.quests && f.quests.length > 0 ? (
                                  f.quests.map((q) => (
                                    <span 
                                      key={q} 
                                      className="inline-block bg-emerald-950/40 border border-emerald-900/40 text-[#9adab1] text-[10px] px-1.5 py-0.5 rounded font-sans tracking-tight whitespace-nowrap"
                                    >
                                      {q}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-[10px] text-stone-600 italic font-mono">-</span>
                                )}
                              </div>
                            </td>

                            {/* Column 8: Mod Interactions as Tags */}
                            <td className="py-2.5 px-3">
                              <div className="flex flex-wrap gap-1 min-w-[180px] max-w-[300px]">
                                {f.interactsWith && f.interactsWith.length > 0 ? (
                                  f.interactsWith.map((followerName) => (
                                    <span 
                                      key={followerName} 
                                      className="inline-block bg-purple-950/40 border border-purple-900/40 text-purple-300 text-[10px] px-1.5 py-0.5 rounded font-sans tracking-tight whitespace-nowrap cursor-pointer hover:bg-purple-900/40"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleSelectFollower(followerName);
                                      }}
                                    >
                                      {followerName}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-[10px] text-stone-600 italic font-mono">-</span>
                                )}
                              </div>
                            </td>

                            {/* Column 9: Non-Follower Mod commentary count as Tags */}
                            <td className="py-2.5 px-3">
                              <div className="flex flex-wrap gap-1 min-w-[180px] max-w-[300px]">
                                {f.nonFollowerMods && f.nonFollowerMods.length > 0 ? (
                                  f.nonFollowerMods.map((m) => (
                                    <span 
                                      key={m} 
                                      className="inline-block bg-cyan-950/40 border border-cyan-900/40 text-cyan-300 text-[10px] px-1.5 py-0.5 rounded font-sans tracking-tight whitespace-nowrap"
                                    >
                                      {m}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-[10px] text-stone-600 italic font-mono">-</span>
                                )}
                              </div>
                            </td>

                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={9} className="py-12 px-4 text-center text-gray-500">
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


          </div>

          {/* Detailed Follower Profile Detail Inspector */}
          <div className="w-full flex flex-col gap-6">
            
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

          </div>

        </section>

        {/* Dynamic & Spacious Dialogue Interaction Web spanning full width at the bottom */}
        <section className="flex flex-col gap-4 mt-2">
          <h3 className="font-display font-semibold text-lg tracking-wider text-white">
            Partnership & Crosstalk Interaction Web
          </h3>

          <RelationshipWeb
            follower={activeFollower}
            onSelectFollower={handleSelectFollower}
          />
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
