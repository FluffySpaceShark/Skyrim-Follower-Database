import React, { useMemo, useState } from 'react';
import { Follower } from '../types';
import { FOLLOWERS, isPatchRequired, getModPackTag } from '../data';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ArrowRightLeft, X, Layers } from 'lucide-react';

interface RelationshipWebProps {
  follower: Follower;
  onSelectFollower: (name: string) => void;
  onClose?: () => void;
}

export default function RelationshipWeb({ follower, onSelectFollower, onClose }: RelationshipWebProps) {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [hoveredSubNode, setHoveredSubNode] = useState<{ parentName: string; name: string } | null>(null);
  const [showBranches, setShowBranches] = useState<boolean>(true);

  // Find all followers that this follower interacts with
  const connections = useMemo(() => {
    return follower.interactsWith.map(name => {
      // Find full info for this connected follower
      const matched = FOLLOWERS.find(f => f.follower.toLowerCase() === name.toLowerCase());
      return {
        name,
        existsInDb: !!matched,
        details: matched || {
          follower: name,
          gender: 'Male' as const,
          race: 'Unknown',
          class: 'Unknown',
          mod: 'Unknown',
          interactsWith: [],
          modUrl: ''
        }
      };
    });
  }, [follower]);

  const centerX = 250;
  const centerY = 250;
  const radius = 125;         // Radius for primary nodes
  const branchRadius = 45;    // Distance from primary node to secondary nodes

  // Calculate coordinates for primary connections and pre-calculate branching secondary connections
  const allConnections = useMemo(() => {
    const total = connections.length;
    return connections.map((conn, index) => {
      const angle = (index * 2 * Math.PI) / total - Math.PI / 2; // Offset by -90deg to start at top
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      const isPatch = isPatchRequired(follower.follower, conn.name);

      // Find secondary links for this companion
      const matchedFollower = FOLLOWERS.find(f => f.follower.toLowerCase() === conn.name.toLowerCase());
      const rawSecNames = matchedFollower ? matchedFollower.interactsWith : [];
      // Filter out the center/central follower and parent relations to avoid backward loops in visual tree
      const secNames = rawSecNames.filter(
        name => name.toLowerCase() !== follower.follower.toLowerCase()
      );

      const subConns = secNames.map((secName, j) => {
        const matchedSec = FOLLOWERS.find(f => f.follower.toLowerCase() === secName.toLowerCase());
        const secCount = secNames.length;
        
        // Face outwards: the branch fanning arc centered around parent's radial angle
        const maxArc = Math.PI * 0.55; // max 90-100 degrees fanning
        const arcWidth = secCount > 1 ? Math.min(maxArc, 0.28 * secCount) : 0;
        const startArcAngle = angle - arcWidth / 2;
        
        const secAngle = secCount > 1 
          ? startArcAngle + (j * arcWidth) / (secCount - 1)
          : angle; // Straight outward if single secondary node

        const secX = x + branchRadius * Math.cos(secAngle);
        const secY = y + branchRadius * Math.sin(secAngle);
        const isSecPatch = isPatchRequired(conn.name, secName);

        return {
          name: secName,
          parentName: conn.name,
          x: secX,
          y: secY,
          angle: secAngle,
          isPatch: isSecPatch,
          existsInDb: !!matchedSec,
          details: matchedSec || {
            follower: secName,
            gender: 'Male' as const,
            race: 'Unknown',
            class: 'Unknown',
            mod: 'Unknown',
            interactsWith: [],
            modUrl: ''
          }
        };
      });

      return {
        ...conn,
        angle,
        x,
        y,
        isPatch,
        subConnections: subConns
      };
    });
  }, [connections, follower]);

  // Color mapper based on races
  const getRaceBorderColor = (race: string) => {
    const r = race.toLowerCase();
    if (r === 'unknown') return 'stroke-gray-500';
    if (r.includes('khajiit')) return 'stroke-amber-500';
    if (r.includes('argonian')) return 'stroke-emerald-400';
    if (r.includes('altmer') || r.includes('high elf')) return 'stroke-yellow-400';
    if (r.includes('bosmer') || r.includes('wood elf')) return 'stroke-green-500';
    if (r.includes('dunmer') || r.includes('dark elf')) return 'stroke-rose-600';
    if (r.includes('nord')) return 'stroke-sky-400';
    if (r.includes('imperial')) return 'stroke-amber-600';
    if (r.includes('breton')) return 'stroke-violet-400';
    if (r.includes('redguard')) return 'stroke-orange-500';
    if (r.includes('orc')) return 'stroke-lime-500';
    if (r.includes('riekling')) return 'stroke-blue-300';
    if (r.includes('snow elf')) return 'stroke-cyan-200';
    return 'stroke-skyrim-gold';
  };

  const getRaceBgColor = (race: string) => {
    const r = race.toLowerCase();
    if (r === 'unknown') return 'bg-gray-950/80 text-gray-500';
    if (r.includes('khajiit')) return 'bg-amber-950/40 text-amber-300';
    if (r.includes('argonian')) return 'bg-emerald-950/40 text-emerald-300';
    if (r.includes('altmer') || r.includes('high elf')) return 'bg-yellow-950/40 text-yellow-300';
    if (r.includes('bosmer') || r.includes('wood elf')) return 'bg-green-950/40 text-green-300';
    if (r.includes('dunmer') || r.includes('dark elf')) return 'bg-rose-950/40 text-rose-300';
    if (r.includes('nord')) return 'bg-sky-950/40 text-sky-300';
    if (r.includes('imperial')) return 'bg-stone-850 text-amber-200';
    if (r.includes('breton')) return 'bg-violet-950/40 text-violet-300';
    if (r.includes('redguard')) return 'bg-orange-950/40 text-orange-300';
    if (r.includes('orc')) return 'bg-lime-950/40 text-lime-300';
    return 'bg-skyrim-surf text-skyrim-gold-bright';
  };

  return (
    <div className="flex flex-col bg-[#16161A] border border-skyrim-border rounded-xl overflow-hidden shadow-xl" id="relationship-web-panel">
      {/* Panel header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-5 py-4 border-b border-skyrim-border bg-[#0D0D10] gap-3">
        <div className="flex items-center gap-2">
          <ArrowRightLeft className="w-5 h-5 text-skyrim-gold animate-pulse-subtle" />
          <div>
            <h3 className="font-display font-semibold text-sm tracking-widest text-[#BFA15A] uppercase">
              Dialogue Interaction Web
            </h3>
            <span className="text-[9px] text-gray-400 font-sans tracking-wide uppercase">
              Consolidated 1st & 2nd Degree Network Pathways
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-4 self-stretch sm:self-auto justify-between sm:justify-end">
          {/* Toggle show branches */}
          <div className="flex items-center gap-2 bg-black/40 border border-skyrim-border/60 rounded-lg px-2.5 py-1.5 backdrop-blur-sm shadow-inner">
            <input 
              type="checkbox" 
              id="show-branches-toggle" 
              checked={showBranches} 
              onChange={(e) => setShowBranches(e.target.checked)}
              className="w-3.5 h-3.5 accent-skyrim-gold bg-zinc-950 border-skyrim-border rounded focus:ring-skyrim-gold cursor-pointer"
            />
            <label htmlFor="show-branches-toggle" className="text-[10px] uppercase tracking-widest text-gray-300 font-bold cursor-pointer select-none">
              Deep Web Branches
            </label>
          </div>

          {onClose && (
            <button 
              onClick={onClose} 
              className="p-1.5 hover:bg-skyrim-surf3 border border-skyrim-border rounded-md text-gray-400 hover:text-white transition-colors"
              id="close-web-btn"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="p-5 flex flex-col xl:flex-row items-center justify-center gap-8">
        {/* SVG Circle Network */}
        <div className="relative w-full max-w-[430px] aspect-square flex items-center justify-center bg-[#0D0D10]/40 rounded-full border border-skyrim-border/30 p-2 overflow-hidden shadow-inner">
          <svg 
            viewBox="0 0 500 500" 
            className="w-full h-full select-none"
            id="relationship-svg"
          >
            {/* Ambient decorative background grid */}
            <circle cx={centerX} cy={centerY} r={80} className="fill-none stroke-skyrim-border/10 stroke-[0.75] stroke-dasharray-[2,4]" style={{ strokeDasharray: "2,4" }} />
            <circle cx={centerX} cy={centerY} r={125} className="fill-none stroke-skyrim-border/20 stroke-1 stroke-dasharray-[3,3]" style={{ strokeDasharray: "3,3" }} />
            <circle cx={centerX} cy={centerY} r={170} className="fill-none stroke-skyrim-border/10 stroke-[0.75] stroke-dasharray-[4,4]" style={{ strokeDasharray: "4,4" }} />
            
            {/* 1. Branching Secondary Connection Lines (Faded behind direct lines) */}
            {showBranches && allConnections.map((conn) => {
              return conn.subConnections.map((subConn) => {
                const isParentHovered = hoveredNode === conn.name;
                const isThisSubHovered = hoveredSubNode?.parentName === conn.name && hoveredSubNode?.name === subConn.name;
                const isAnyOtherHovered = (hoveredNode !== null && hoveredNode !== conn.name) ||
                                          (hoveredSubNode !== null && (hoveredSubNode.parentName !== conn.name || hoveredSubNode.name !== subConn.name));
                
                let opacity = 0.25;
                if (isThisSubHovered) opacity = 1.0;
                else if (isParentHovered) opacity = 0.65;
                else if (isAnyOtherHovered) opacity = 0.04;
                
                return (
                  <line
                    key={`line-sub-${conn.name}-${subConn.name}`}
                    x1={conn.x}
                    y1={conn.y}
                    x2={subConn.x}
                    y2={subConn.y}
                    className={`transition-all duration-300 ${
                      subConn.isPatch 
                        ? 'stroke-sky-400 stroke-dasharray-[3,3]' 
                        : 'stroke-[#BFA15A]'
                    }`}
                    style={{
                      strokeWidth: isThisSubHovered ? 2.5 : 1.2,
                      strokeDasharray: subConn.isPatch ? '4,2' : undefined,
                      opacity: opacity,
                      filter: isThisSubHovered ? 'drop-shadow(0px 0px 4px rgba(191, 161, 90, 0.8))' : undefined,
                    }}
                  />
                );
              });
            })}

            {/* 2. Direct Connection Lines */}
            {allConnections.map((conn) => {
              const isThisPrimaryHovered = hoveredNode === conn.name;
              const isSubOfThisHovered = hoveredSubNode?.parentName === conn.name;
              const isAnyOtherHovered = (hoveredNode !== null && hoveredNode !== conn.name) ||
                                        (hoveredSubNode !== null && hoveredSubNode.parentName !== conn.name);
                                        
              let opacity = 0.55;
              if (isThisPrimaryHovered || isSubOfThisHovered) opacity = 1.0;
              else if (isAnyOtherHovered) opacity = 0.12;

              return (
                <line
                  key={`line-prim-${conn.name}`}
                  x1={centerX}
                  y1={centerY}
                  x2={conn.x}
                  y2={conn.y}
                  className={`transition-all duration-300 ${
                    conn.isPatch 
                      ? 'stroke-sky-400 stroke-[2]' 
                      : 'stroke-skyrim-gold stroke-[2.2]'
                  }`}
                  style={{
                    strokeDasharray: conn.isPatch ? '6,3' : undefined,
                    opacity: opacity,
                    filter: (isThisPrimaryHovered || isSubOfThisHovered) ? 'drop-shadow(0px 0px 5px var(--color-skyrim-gold))' : undefined,
                  }}
                />
              );
            })}

            {/* 3. Central Node Rings */}
            <circle
              cx={centerX}
              cy={centerY}
              r={30}
              className="fill-none stroke-skyrim-gold/25 stroke-1 animate-ping"
              style={{ animationDuration: '4.5s' }}
            />
            <circle
              cx={centerX}
              cy={centerY}
              r={25}
              className="fill-none stroke-skyrim-gold/30 stroke-1"
            />

            {/* 4. Central Node */}
            <g className="cursor-default">
              <circle
                cx={centerX}
                cy={centerY}
                r={19}
                className="fill-skyrim-bg stroke-skyrim-gold stroke-[2px]"
              />
              <text
                x={centerX}
                y={centerY + 3.5}
                textAnchor="middle"
                className="font-display font-bold text-[9px] fill-skyrim-gold-bright uppercase tracking-wider"
              >
                {follower.follower.slice(0, 3)}
              </text>
            </g>

            {/* 5. Branching Secondary Outer Nodes */}
            {showBranches && allConnections.map((conn) => {
              return conn.subConnections.map((subConn) => {
                const isParentHovered = hoveredNode === conn.name;
                const isThisSubHovered = hoveredSubNode?.parentName === conn.name && hoveredSubNode?.name === subConn.name;
                const isAnyOtherHovered = (hoveredNode !== null && hoveredNode !== conn.name) ||
                                          (hoveredSubNode !== null && (hoveredSubNode.parentName !== conn.name || hoveredSubNode.name !== subConn.name));
                                          
                let scale = 1.0;
                let opacity = 0.55;
                if (isThisSubHovered) {
                  scale = 1.4;
                  opacity = 1.0;
                } else if (isParentHovered) {
                  scale = 1.15;
                  opacity = 0.9;
                } else if (isAnyOtherHovered) {
                  opacity = 0.15;
                }

                return (
                  <g
                    key={`node-sub-${conn.name}-${subConn.name}`}
                    className="cursor-pointer group animate-fade-in"
                    onMouseEnter={() => setHoveredSubNode({ parentName: conn.name, name: subConn.name })}
                    onMouseLeave={() => setHoveredSubNode(null)}
                    onClick={() => {
                      if (subConn.existsInDb) {
                        onSelectFollower(subConn.name);
                        setHoveredSubNode(null);
                        setHoveredNode(null);
                      }
                    }}
                  >
                    <circle
                      cx={subConn.x}
                      cy={subConn.y}
                      r={14}
                      className="fill-skyrim-gold-light/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    />
                    <circle
                      cx={subConn.x}
                      cy={subConn.y}
                      r={subConn.existsInDb ? 7 : 5}
                      className={`fill-skyrim-bg ${getRaceBorderColor(subConn.details.race)} ${
                        subConn.existsInDb ? 'stroke-2' : 'stroke-[1.5px] stroke-gray-600'
                      } transition-all duration-300`}
                      style={{
                        opacity: opacity,
                        transform: `scale(${scale})`,
                        transformOrigin: `${subConn.x}px ${subConn.y}px`
                      }}
                    />
                    {(isThisSubHovered || isParentHovered) && (
                      <g className="pointer-events-none">
                        <rect
                          x={subConn.x - 30}
                          y={subConn.y - 23}
                          width={60}
                          height={12}
                          rx={3}
                          className="fill-zinc-950/90 stroke-skyrim-border/40 stroke-[0.5px]"
                        />
                        <text
                          x={subConn.x}
                          y={subConn.y - 14}
                          textAnchor="middle"
                          className="font-sans font-bold text-[8px] fill-gray-200"
                        >
                          {subConn.name}
                        </text>
                      </g>
                    )}
                  </g>
                );
              });
            })}

            {/* 6. Direct Connection Ring Nodes */}
            {allConnections.map((conn) => {
              const isThisPrimaryHovered = hoveredNode === conn.name;
              const isSubOfThisHovered = hoveredSubNode?.parentName === conn.name;
              const isAnyOtherHovered = (hoveredNode !== null && hoveredNode !== conn.name) ||
                                        (hoveredSubNode !== null && hoveredSubNode.parentName !== conn.name);
                                        
              let scale = 1.0;
              let opacity = 1.0;
              if (isThisPrimaryHovered || isSubOfThisHovered) {
                scale = 1.25;
              } else if (isAnyOtherHovered) {
                opacity = 0.25;
              }

              return (
                <g 
                  key={`node-prim-${conn.name}`}
                  className="cursor-pointer group"
                  onMouseEnter={() => setHoveredNode(conn.name)}
                  onMouseLeave={() => setHoveredNode(null)}
                  onClick={() => {
                    if (conn.existsInDb) {
                      onSelectFollower(conn.name);
                      setHoveredNode(null);
                    }
                  }}
                >
                  <circle
                    cx={conn.x}
                    cy={conn.y}
                    r={26}
                    className="fill-skyrim-gold/15 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  />
                  <circle
                    cx={conn.x}
                    cy={conn.y}
                    r={conn.existsInDb ? 14 : 11}
                    className={`fill-skyrim-bg ${getRaceBorderColor(conn.details.race)} ${
                      conn.existsInDb ? 'stroke-2' : 'stroke-[1.5px] stroke-gray-600'
                    } transition-all duration-300`}
                    style={{
                      opacity: opacity,
                      transform: `scale(${scale})`,
                      transformOrigin: `${conn.x}px ${conn.y}px`
                    }}
                  />
                  <text
                    x={conn.x}
                    y={conn.y + 3}
                    textAnchor="middle"
                    className={`font-sans font-semibold text-[8px] tracking-tighter transition-all duration-300 ${
                      conn.existsInDb ? 'fill-gray-200 font-bold' : 'fill-gray-500 italic'
                    }`}
                    style={{
                      opacity: opacity,
                      transform: `scale(${scale})`,
                      transformOrigin: `${conn.x}px ${conn.y}px`
                    }}
                  >
                    {conn.name.slice(0, 3)}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Central Label overlay centered cleanly above or below the central node */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
            <div className="bg-zinc-950/90 border border-skyrim-border/80 px-3 py-1 rounded shadow-lg max-w-[130px] backdrop-blur-sm transform translate-y-16 select-none">
              <p className="font-display font-bold text-[12px] text-skyrim-gold truncate">{follower.follower}</p>
              <p className="text-[8px] text-gray-400 capitalize tracking-wider font-mono">{follower.race} • {follower.gender}</p>
            </div>
          </div>
        </div>

        {/* Legend & Details Display Panel */}
        <div className="flex-1 w-full max-w-sm flex flex-col gap-4 text-xs">
          
          {/* Active Hover Detail Peek */}
          <div className="min-h-[195px] bg-black/30 p-4 rounded-xl border border-skyrim-border/75 flex flex-col justify-between backdrop-blur-sm shadow-inner relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-skyrim-gold/5 rounded-full blur-2xl pointer-events-none" />
            
            <AnimatePresence mode="wait">
              {hoveredSubNode ? (
                (() => {
                  const parentConn = allConnections.find(c => c.name === hoveredSubNode.parentName);
                  const subConn = parentConn?.subConnections.find(s => s.name === hoveredSubNode.name);
                  if (!subConn) return null;
                  const pack = getModPackTag(subConn.name, subConn.details.mod);
                  
                  return (
                    <motion.div
                      key={`sub-${subConn.name}-${subConn.parentName}`}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="flex flex-col h-full justify-between gap-2.5"
                    >
                      <div>
                        <span className="text-[9px] uppercase tracking-wider text-rose-450 font-bold bg-rose-950/30 px-2 py-0.5 rounded border border-rose-900/40">
                          Branch Connection (2nd-Degree)
                        </span>

                        <div className="flex items-center gap-2 mt-2 pb-1.5 border-b border-skyrim-border/30">
                          <span className="font-display font-semibold text-[15px] text-skyrim-gold-bright truncate">
                            {subConn.name}
                          </span>
                          {!subConn.existsInDb && (
                            <span className="text-[8px] px-1.5 py-0.5 bg-zinc-900 border border-zinc-800 rounded text-gray-500 font-mono">
                              External Ref
                            </span>
                          )}
                        </div>

                        <p className="text-gray-400 text-[11px] mt-1.5 leading-relaxed">
                          Connected to <span className="font-semibold text-gray-250">{subConn.parentName}</span> via dialogue interactions.
                        </p>

                        {subConn.existsInDb ? (
                          <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] text-gray-300 mt-2 bg-black/15 p-2 rounded border border-white/5 font-sans">
                            <div>Race: <span className="text-gray-100 font-medium truncate block max-w-[90px]">{subConn.details.race}</span></div>
                            <div>Gender: <span className="text-gray-100 font-medium">{subConn.details.gender}</span></div>
                            <div className="col-span-2 truncate">Role: <span className="text-gray-100 font-medium">{subConn.details.class}</span></div>
                          </div>
                        ) : (
                          <p className="text-gray-500 italic text-[11px] py-1">
                            This character belongs to other companion mods but holds explicit crosstalk dialog lines with {subConn.parentName}.
                          </p>
                        )}
                      </div>

                      <div className="pt-2 border-t border-skyrim-border/20 flex flex-wrap items-center justify-between gap-1.5 text-[10px]">
                        <span className={`px-2 py-0.5 rounded-full font-semibold ${
                          subConn.isPatch 
                            ? 'bg-sky-950/40 text-sky-300 border border-sky-800/60' 
                            : 'bg-amber-950/30 text-skyrim-gold-light border border-skyrim-gold/30'
                        }`}>
                          {subConn.isPatch ? 'Requires Patch' : 'Integrated Dialog'}
                        </span>
                        {pack && (
                          <span className={`px-2 py-0.5 rounded-sm font-semibold text-[9px] ${pack.styleClass}`}>
                            {pack.label}
                          </span>
                        )}
                      </div>
                    </motion.div>
                  );
                })()
              ) : hoveredNode ? (
                (() => {
                  const conn = allConnections.find(c => c.name === hoveredNode);
                  if (!conn) return null;
                  const pack = getModPackTag(conn.name, conn.details.mod);
                  
                  return (
                    <motion.div
                      key={`prim-${conn.name}`}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="flex flex-col h-full justify-between gap-2.5"
                    >
                      <div>
                        <span className="text-[9px] uppercase tracking-wider text-skyrim-gold font-bold bg-skyrim-gold/10 px-2 py-0.5 rounded border border-skyrim-gold/30">
                          Direct Crosstalk (1st-Degree)
                        </span>

                        <div className="flex items-center justify-between gap-2 mt-2 pb-1.5 border-b border-skyrim-border/30">
                          <span className="font-display font-semibold text-[15px] text-skyrim-gold-bright truncate">
                            {conn.name}
                          </span>
                          {!conn.existsInDb && (
                            <span className="text-[8px] px-1.5 py-0.5 bg-zinc-900 border border-zinc-800 rounded text-gray-500 font-mono">
                              External Ref
                            </span>
                          )}
                        </div>

                        <p className="text-gray-400 text-[11px] mt-1.5 leading-relaxed">
                          Has direct dual-banter dialogue lines with <span className="font-semibold text-[#BFA15A]">{follower.follower}</span>.
                          {conn.subConnections.length > 0 && (
                            <span> It also features <span className="text-gray-200 font-semibold">{conn.subConnections.length}</span> outward dialogue links!</span>
                          )}
                        </p>

                        {conn.existsInDb ? (
                          <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] text-gray-300 mt-2 bg-black/15 p-2 rounded border border-white/5 font-sans">
                            <div>Race: <span className="text-gray-100 font-medium truncate block max-w-[90px]">{conn.details.race}</span></div>
                            <div>Gender: <span className="text-gray-100 font-medium">{conn.details.gender}</span></div>
                            <div className="col-span-2 truncate font-mono">Pack: <span className="text-gray-200 font-sans">{conn.details.mod}</span></div>
                          </div>
                        ) : (
                          <p className="text-gray-500 italic text-[11px] py-1">
                            External source character featured directly inside {follower.follower}'s dial-tree databases.
                          </p>
                        )}
                      </div>

                      <div className="pt-2 border-t border-skyrim-border/20 flex flex-wrap items-center justify-between gap-1.5 text-[10px]">
                        <span className={`px-2 py-0.5 rounded-full font-semibold ${
                          conn.isPatch 
                            ? 'bg-sky-950/40 text-sky-300 border border-sky-800/60' 
                            : 'bg-amber-950/30 text-skyrim-gold-light border border-skyrim-gold/30'
                        }`}>
                          {conn.isPatch ? 'Requires Patch' : 'Standalone Mod'}
                        </span>
                        {pack && (
                          <span className={`px-2 py-0.5 rounded-sm font-semibold text-[9px] ${pack.styleClass}`}>
                            {pack.label}
                          </span>
                        )}
                      </div>
                    </motion.div>
                  );
                })()
              ) : (
                <motion.div
                  key="default-peek"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center text-center h-full text-gray-500 gap-2.5 py-4"
                >
                  <Sparkles className="w-5 h-5 text-skyrim-gold-light/50 animate-pulse-subtle" />
                  <div>
                    <p className="text-gray-300 font-semibold text-xs tracking-wide">
                      Interactive Visualizer
                    </p>
                    <p className="text-[11px] text-gray-400 mt-1 max-w-[34ch] mx-auto leading-relaxed">
                      Hover over primary companion circles or secondary outer branches to audit dialogue requirements, classes, and sub-networks!
                    </p>
                    <p className="text-[10px] text-[#BFA15A] mt-2 italic font-mono">
                      💡 Click any available node to refocus the database.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Combined Network Footprint & Legend Stats */}
          <div className="bg-black/20 p-4 rounded-xl border border-skyrim-border/40 flex flex-col gap-3">
            <div className="flex items-center gap-2 mb-1 border-b border-white/5 pb-1.5">
              <Layers className="w-4 h-4 text-skyrim-gold-light" />
              <h4 className="font-display font-semibold text-gray-300 text-[11px] tracking-wider uppercase">
                {follower.follower}'s Dialogue Footprint
              </h4>
            </div>

            <div className="grid grid-cols-2 gap-2 text-center text-xs">
              <div className="bg-[#121215]/60 border border-white/5 rounded px-2 py-1.5">
                <span className="block text-[15px] font-bold font-mono text-skyrim-gold">
                  {allConnections.length}
                </span>
                <span className="text-[9px] text-gray-400 uppercase tracking-wide">Direct Companions</span>
              </div>
              <div className="bg-[#121215]/60 border border-white/5 rounded px-2 py-1.5">
                <span className="block text-[15px] font-bold font-mono text-rose-400">
                  {showBranches ? allConnections.reduce((acc, c) => acc + c.subConnections.length, 0) : '—'}
                </span>
                <span className="text-[9px] text-gray-400 uppercase tracking-wide">Secondary Branches</span>
              </div>
            </div>

            {/* Micro Connection Legend */}
            <div className="flex flex-col gap-2 border-t border-white/5 pt-2 text-[10.5px]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-0.5 bg-skyrim-gold" />
                  <span className="text-gray-400">Direct companion dialogue</span>
                </div>
                <span className="text-[10px] text-rose-350 font-bold">1st Degree</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-0.5 bg-sky-400 border-dashed border-t" />
                  <span className="text-gray-400 font-sans">Requires crossover patch</span>
                </div>
                <span className="text-[9px] text-sky-400 font-bold px-1 py-0.2 bg-sky-950/30 rounded">Patch Link</span>
              </div>

              {showBranches && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-0.5 bg-[#BFA15A]/60" />
                    <span className="text-gray-400">Sub-branch conversations</span>
                  </div>
                  <span className="text-[10px] text-rose-450 font-bold">2nd Degree</span>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
