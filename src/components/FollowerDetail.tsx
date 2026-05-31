import React from 'react';
import { Follower } from '../types';
import { isPatchRequired, getModPackTag } from '../data';
import { ExternalLink, ShieldAlert, BadgeInfo, Swords, Compass, CircleHelp } from 'lucide-react';

interface FollowerDetailProps {
  follower: Follower;
  onSelectFollower: (name: string) => void;
  followersList: Follower[];
}

export default function FollowerDetail({ follower, onSelectFollower, followersList }: FollowerDetailProps) {
  // Mod URL Helper
  const getModHost = (url: string) => {
    if (!url) return '';
    try {
      const parsed = new URL(url);
      if (parsed.hostname.includes('nexusmods.com')) return 'Nexus Mods';
      if (parsed.hostname.includes('craftian.itch.io')) return 'itch.io (Craftian)';
      if (parsed.hostname.includes('moddb.com')) return 'ModDB';
      return parsed.hostname;
    } catch {
      return 'Mod Page';
    }
  };

  const pack = getModPackTag(follower.follower, follower.mod);

  // Helper to color codes based on race
  const getRaceBadgeStyle = (race: string) => {
    const r = race.toLowerCase();
    if (r === 'unknown') return 'bg-stone-900 text-stone-400 border border-stone-800';
    if (r.includes('khajiit')) return 'bg-amber-950/60 text-amber-300 border border-amber-900/60';
    if (r.includes('argonian')) return 'bg-emerald-950/60 text-emerald-300 border border-emerald-900/60';
    if (r.includes('altmer') || r.includes('high elf')) return 'bg-yellow-950/60 text-yellow-300 border border-yellow-900/60';
    if (r.includes('bosmer') || r.includes('wood elf')) return 'bg-green-950/60 text-green-300 border border-green-900/60';
    if (r.includes('dunmer') || r.includes('dark elf')) return 'bg-rose-950/60 text-rose-300 border border-rose-900/60';
    if (r.includes('nord')) return 'bg-sky-950/60 text-sky-300 border border-sky-900/60';
    if (r.includes('imperial')) return 'bg-amber-900/10 text-amber-200 border border-amber-900/30';
    if (r.includes('breton')) return 'bg-violet-950/60 text-violet-300 border border-violet-900/60';
    if (r.includes('redguard')) return 'bg-orange-950/60 text-orange-300 border border-orange-900/60';
    if (r.includes('orc')) return 'bg-lime-950/60 text-lime-300 border border-lime-900/60';
    if (r.includes('riekling')) return 'bg-blue-950/60 text-blue-300 border border-blue-900/60';
    if (r.includes('snow elf')) return 'bg-cyan-950/60 text-cyan-300 border border-cyan-900/60';
    return 'bg-amber-950/40 text-skyrim-gold-light border border-skyrim-gold/30';
  };

  // Helper to check if a connection requires patch
  const hasBanterPatchConnection = follower.interactsWith.some(connName => 
    isPatchRequired(follower.follower, connName)
  );

  return (
    <div className="bg-skyrim-surf border border-skyrim-border rounded-xl shadow-xl overflow-hidden flex flex-col h-full" id={`detail-${follower.follower}`}>
      {/* Decorative Top Border */}
      <div className="h-1 bg-gradient-to-r from-skyrim-gold-dark via-skyrim-gold to-skyrim-gold-bright" />

      {/* Banner / Title Row */}
      <div className="p-6 bg-skyrim-surf2 border-b border-skyrim-border/50 flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-skyrim-gold">
              Active Selection
            </span>
            <h2 className="font-display font-medium text-2xl lg:text-3xl text-skyrim-gold-bright tracking-normal mt-0.5" id="detail-name-heading">
              {follower.follower}
            </h2>
          </div>

          <div className="flex flex-wrap gap-2">
            {pack && (
              <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded shadow-sm ${pack.styleClass}`}>
                {pack.label}
              </span>
            )}
            <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded shadow-sm ${
              follower.gender === 'Male' 
                ? 'bg-blue-950/50 text-blue-300 border border-blue-900/60' 
                : 'bg-pink-950/50 text-pink-300 border border-pink-900/60'
            }`}>
              {follower.gender}
            </span>
            <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded shadow-sm ${getRaceBadgeStyle(follower.race)}`}>
              {follower.race}
            </span>
          </div>
        </div>

        {/* Core Stats Panel (Class and Mod info) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-1">
          {/* Class Section */}
          <div className="bg-skyrim-bg/60 p-3 rounded-lg border border-skyrim-border/40 flex items-start gap-2.5">
            <Swords className="w-4 h-4 text-skyrim-gold mt-0.5" />
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">In-Game Role / Class</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {follower.class ? (
                  follower.class.split(/\s*\/\s*/).map(tag => (
                    <span 
                      key={tag} 
                      className="px-2 py-0.5 text-[10.5px] font-semibold rounded bg-[#2e261d] text-skyrim-gold-light border border-skyrim-gold/30 shadow-sm"
                    >
                      {tag}
                    </span>
                  ))
                ) : (
                  <span className="text-sm font-medium text-gray-200">—</span>
                )}
              </div>
            </div>
          </div>

          {/* Source Mod Section */}
          <div className="bg-skyrim-bg/60 p-3 rounded-lg border border-skyrim-border/40 flex items-start gap-2.5">
            <Compass className="w-4 h-4 text-skyrim-gold mt-0.5" />
            <div className="overflow-hidden w-full">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Origin Mod Base</p>
              <p className="text-sm font-medium text-gray-200 mt-0.5 truncate">{follower.mod || '—'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-6 flex-1 flex flex-col justify-between gap-6">
        {/* Interaction Details List */}
        <div>
          <div className="flex items-center justify-between gap-2 border-b border-skyrim-border pb-2 mb-4">
            <h3 className="font-display font-semibold text-xs tracking-wider uppercase text-gray-300">
              Dialogue & crosstalk list ({follower.interactsWith.length})
            </h3>
            
            {hasBanterPatchConnection && (
              <span className="flex items-center gap-1.5 text-[10px] text-sky-300 font-medium bg-sky-950/40 px-2 py-0.5 rounded border border-sky-800/40">
                <ShieldAlert className="w-3 h-3" />
                Patch may be required
              </span>
            )}
          </div>

          {follower.interactsWith.length > 0 ? (
            <div className="flex flex-wrap gap-2 max-h-[180px] overflow-y-auto pr-1">
              {follower.interactsWith.map(connName => {
                const isPatch = isPatchRequired(follower.follower, connName);
                const isFoundInDb = followersList.some(f => f.follower.toLowerCase() === connName.toLowerCase());

                return (
                  <button
                    key={connName}
                    onClick={() => {
                      if (isFoundInDb) {
                        onSelectFollower(connName);
                      }
                    }}
                    className={`text-xs px-2.5 py-1.5 rounded-md flex items-center gap-1.5 transition-all text-left group ${
                      isFoundInDb
                        ? 'bg-skyrim-surf3 hover:bg-skyrim-gold/15 active:bg-skyrim-gold/20 border border-skyrim-border hover:border-skyrim-gold/50 text-gray-300 hover:text-skyrim-gold-bright cursor-pointer'
                        : 'bg-skyrim-bg/40 border border-skyrim-border/60 text-gray-500 cursor-help'
                    }`}
                    title={
                      !isFoundInDb 
                        ? `${connName} is an external character mentioned in dialogue but details are managed by other mods.` 
                        : isPatch 
                        ? `Click to view ${connName} (Crosstalk requires separate patch)` 
                        : `Click to view ${connName}`
                    }
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70 group-hover:scale-125 transition-transform" />
                    <span>{connName}</span>
                    {isPatch && (
                      <span className="text-[10px] font-semibold text-sky-400 bg-sky-950/40 px-1 rounded-sm border border-sky-800/20 leading-none">
                        Patch
                      </span>
                    )}
                    {!isFoundInDb && (
                      <CircleHelp className="w-3 h-3 text-gray-600 group-hover:text-gray-400 transition-colors" />
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center p-6 bg-skyrim-bg/30 border border-dashed border-skyrim-border/50 rounded-lg text-gray-500 text-xs">
              This follower does not initiate documented direct-crosstalk or unique chatter with any other mods yet.
            </div>
          )}
        </div>

        {/* Footer actions inside detail cards */}
        <div className="bg-skyrim-bg/40 p-4 rounded-lg border border-skyrim-border/80 flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
          <div className="flex items-center gap-2">
            <BadgeInfo className="w-4 h-4 text-skyrim-gold-light shrink-0" />
            <p className="text-[11px] text-gray-400">
              {follower.note || `Looking to try ${follower.follower} in Skyrim? Install their standalone mod using the link below.`}
            </p>
          </div>

          {follower.modUrl && (
            <a
              href={follower.modUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-skyrim-gold hover:bg-skyrim-gold-light active:bg-skyrim-gold-dark text-black font-semibold text-xs tracking-wider uppercase rounded-md shadow-md hover:shadow-lg transition-all shrink-0 flex items-center gap-1.5"
              id="download-mod-link"
            >
              <span>Get on {getModHost(follower.modUrl)}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
