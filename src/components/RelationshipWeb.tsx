import React, { useMemo, useState, useEffect } from 'react';
import { Follower } from '../types';
import { FOLLOWERS, isPatchRequired, getModPackTag } from '../data';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ArrowRightLeft, X, Layers, Maximize2, Minimize2, Info } from 'lucide-react';

interface RelationshipWebProps {
  follower: Follower;
  onSelectFollower: (name: string) => void;
  onClose?: () => void;
}

export default function RelationshipWeb({ follower, onSelectFollower, onClose }: RelationshipWebProps) {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [hoveredSubNode, setHoveredSubNode] = useState<{ parentName: string; name: string } | null>(null);
  const [showBranches, setShowBranches] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Close fullscreen on ESC keypress
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  // Find direct followers that this follower interacts with
  const connections = useMemo(() => {
    return follower.interactsWith.map(name => {
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

  // Dimension settings for high resolution and generous spacing inside SVG
  const centerX = 300;
  const centerY = 300;
  const radius = 175;         // Distance to Tier 1 Nodes
  const branchRadius = 75;    // Dist from Tier 1 to Tier 2 Nodes

  // Calculate high-fidelity coords for both Tier 1 and Tier 2 connections
  const allConnections = useMemo(() => {
    const total = connections.length;
    if (total === 0) return [];

    return connections.map((conn, index) => {
      // Space Tier 1 nodes evenly in 360deg circle
      const angle = (index * 2 * Math.PI) / total - Math.PI / 2; // offset to start top
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      const isPatch = isPatchRequired(follower.follower, conn.name);

      // Find secondary links (Tier 2) branching off this direct connection
      const matchedFollower = FOLLOWERS.find(f => f.follower.toLowerCase() === conn.name.toLowerCase());
      const rawSecNames = matchedFollower ? matchedFollower.interactsWith : [];

      // Filter out self/parent nodes to prevent background loops and keep graph cleaner
      const secNames = rawSecNames.filter(
        name => name.toLowerCase() !== follower.follower.toLowerCase() && name.toLowerCase() !== conn.name.toLowerCase()
      );

      const subConns = secNames.map((secName, j) => {
        const matchedSec = FOLLOWERS.find(f => f.follower.toLowerCase() === secName.toLowerCase());
        const secCount = secNames.length;

        // Fan outward in an arc away from center
        const maxArc = Math.PI * 0.55; // 90-100 deg fanning arc limit
        const arcWidth = secCount > 1 ? Math.min(maxArc, 0.28 * secCount) : 0;
        const startArcAngle = angle - arcWidth / 2;

        const secAngle = secCount > 1
          ? startArcAngle + (j * arcWidth) / (secCount - 1)
          : angle; // Radial direction if single secondary node

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

  // Color mappings based on races
  const getRaceThemeColor = (race: string) => {
    const r = race.toLowerCase();
    if (r === 'unknown') return { stroke: '#4B5563', text: 'text-gray-400', glow: 'rgba(75,85,99,0.3)', dot: '#4B5563' };
    if (r.includes('khajiit')) return { stroke: '#F59E0B', text: 'text-amber-405', glow: 'rgba(245,158,11,0.3)', dot: '#F59E0B' };
    if (r.includes('argonian')) return { stroke: '#10B981', text: 'text-emerald-400', glow: 'rgba(16,185,129,0.3)', dot: '#10B981' };
    if (r.includes('altmer') || r.includes('high elf')) return { stroke: '#FBBF24', text: 'text-yellow-400', glow: 'rgba(251,191,36,0.3)', dot: '#FBBF24' };
    if (r.includes('bosmer') || r.includes('wood elf')) return { stroke: '#22C55E', text: 'text-green-500', glow: 'rgba(34,197,94,0.3)', dot: '#22C55E' };
    if (r.includes('dunmer') || r.includes('dark elf')) return { stroke: '#EF4444', text: 'text-rose-500', glow: 'rgba(239,68,68,0.3)', dot: '#EF4444' };
    if (r.includes('nord')) return { stroke: '#38BDF8', text: 'text-sky-400', glow: 'rgba(56,189,248,0.3)', dot: '#38BDF8' };
    if (r.includes('imperial')) return { stroke: '#D97706', text: 'text-amber-600', glow: 'rgba(217,119,6,0.3)', dot: '#D97706' };
    if (r.includes('breton')) return { stroke: '#A78BFA', text: 'text-violet-400', glow: 'rgba(167,139,250,0.3)', dot: '#A78BFA' };
    if (r.includes('redguard')) return { stroke: '#F97316', text: 'text-orange-500', glow: 'rgba(249,115,22,0.3)', dot: '#F97316' };
    if (r.includes('orc')) return { stroke: '#84CC16', text: 'text-lime-500', glow: 'rgba(132,204,22,0.3)', dot: '#84CC16' };
    return { stroke: '#BFA15A', text: 'text-skyrim-gold-bright', glow: 'rgba(191,161,90,0.3)', dot: '#BFA15A' };
  };

  return (
    <div 
      className={`flex flex-col bg-[#16161A] border border-skyrim-border rounded-xl shadow-xl transition-all duration-300 ${
        isFullscreen 
          ? 'fixed inset-0 z-50 w-screen h-screen bg-[#0D0D10]/98 backdrop-blur-md p-4 sm:p-6 md:p-8 overflow-y-auto' 
          : 'relative'
      }`} 
      id="relationship-web-panel"
    >
      {/* Panel header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-5 py-4 border-b border-skyrim-border bg-[#0D0D10] gap-3">
        <div className="flex items-center gap-2">
          <ArrowRightLeft className="w-5 h-5 text-skyrim-gold animate-pulse-subtle" />
          <div>
            <h3 className="font-display font-semibold text-sm tracking-widest text-[#BFA15A] uppercase flex items-center gap-2">
              Dialogue Interaction Web
              {isFullscreen && (
                <span className="text-[9px] text-skyrim-gold-light tracking-wider normal-case bg-skyrim-gold/10 px-1.5 py-0.5 rounded border border-skyrim-gold/20 font-sans font-bold">
                  Fullscreen Mode (ESC to exit)
                </span>
              )}
            </h3>
            <span className="text-[9px] text-gray-400 font-sans tracking-wide uppercase">
              Consolidated 1st & 2nd Degree Network Pathways
            </span>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 self-stretch sm:self-auto justify-between sm:justify-end">
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

          {/* Fullscreen Button */}
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-skyrim-gold hover:text-white bg-black/40 hover:bg-skyrim-gold/10 border border-skyrim-border/60 rounded-lg backdrop-blur-sm shadow-inner transition-colors duration-200 cursor-pointer"
            title={isFullscreen ? "Exit Fullscreen (Esc)" : "Fullscreen Web"}
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-3.5 h-3.5" />
                <span>Minimize</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Fullscreen</span>
              </>
            )}
          </button>

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

      <div className={`p-6 flex flex-col lg:flex-row items-center lg:items-stretch justify-center gap-10 ${
        isFullscreen ? 'max-w-7xl mx-auto w-full flex-1' : ''
      }`}>
        {/* SVG Circle Network */}
        <div className={`relative w-full aspect-square flex items-center justify-center bg-[#0D0D10]/40 rounded-3xl border border-skyrim-border/35 p-4 overflow-hidden shadow-inner shrink-0 transition-all duration-300 ${
          isFullscreen ? 'max-w-[500px] lg:max-w-[580px] lg:h-[580px]' : 'max-w-[480px]'
        }`}>
          {connections.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center p-6 text-gray-400 h-full">
              <Info className="w-12 h-12 text-skyrim-gold/40 mb-3" />
              <p className="font-display text-sm tracking-widest text-skyrim-gold uppercase mb-1">Crosstalk Archive Unavailable</p>
              <p className="text-xs text-gray-500 max-w-[280px] leading-relaxed">
                {follower.follower} does not have recorded crosstalk lines with other standalone custom companions.
              </p>
            </div>
          ) : (
            <svg 
              viewBox="0 0 600 600" 
              className="w-full h-full select-none"
              id="relationship-svg"
            >
              {/* Dynamic Gradients Definitions on background elements */}
              <defs>
                <filter id="glow-gold" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="5" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                <filter id="glow-sky" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                <linearGradient id="gradient-center" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#242430" />
                  <stop offset="100%" stopColor="#121217" />
                </linearGradient>
                <linearGradient id="gradient-node" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#1c1c24" />
                  <stop offset="100%" stopColor="#0a0a0d" />
                </linearGradient>
              </defs>

              {/* Decorative circular background rings */}
              <circle cx={centerX} cy={centerY} r={100} className="fill-none stroke-skyrim-border/5 stroke-[0.75]" />
              <circle cx={centerX} cy={centerY} r={radius} className="fill-none stroke-skyrim-border/15 stroke-1 stroke-dasharray-[4,6]" style={{ strokeDasharray: "4,6" }} />
              {showBranches && (
                <circle cx={centerX} cy={centerY} r={radius + branchRadius} className="fill-none stroke-skyrim-border/5 stroke-[0.75] stroke-dasharray-[2,4]" style={{ strokeDasharray: "2,4" }} />
              )}
              
              {/* 1. Draw connecting Lines from Tier 1 to Tier 2 (Behind direct lines) */}
              {showBranches && allConnections.map((conn) => {
                return conn.subConnections.map((subConn) => {
                  const isParentHovered = hoveredNode === conn.name;
                  const isThisSubHovered = hoveredSubNode?.parentName === conn.name && hoveredSubNode?.name === subConn.name;
                  const isAnyOtherHovered = (hoveredNode !== null && hoveredNode !== conn.name) ||
                                            (hoveredSubNode !== null && (hoveredSubNode.parentName !== conn.name || hoveredSubNode.name !== subConn.name));
                  
                  let opacity = 0.3;
                  if (isThisSubHovered) opacity = 1.0;
                  else if (isParentHovered) opacity = 0.75;
                  else if (isAnyOtherHovered) opacity = 0.05;
                  
                  return (
                    <line
                      key={`line-sub-${conn.name}-${subConn.name}`}
                      x1={conn.x}
                      y1={conn.y}
                      x2={subConn.x}
                      y2={subConn.y}
                      className="transition-all duration-300"
                      style={{
                        stroke: subConn.isPatch ? '#38bdf8' : '#BFA15A',
                        strokeWidth: isThisSubHovered ? 2.5 : 1.2,
                        strokeDasharray: subConn.isPatch ? '4,4' : undefined,
                        opacity: opacity,
                      }}
                    />
                  );
                });
              })}

              {/* 2. Direct Core Connection Lines (Tier 1 to Center) */}
              {allConnections.map((conn) => {
                const isThisPrimaryHovered = hoveredNode === conn.name;
                const isSubOfThisHovered = hoveredSubNode?.parentName === conn.name;
                const isAnyOtherHovered = (hoveredNode !== null && hoveredNode !== conn.name) ||
                                          (hoveredSubNode !== null && hoveredSubNode.parentName !== conn.name);
                                          
                let opacity = 0.65;
                if (isThisPrimaryHovered || isSubOfThisHovered) opacity = 1.0;
                else if (isAnyOtherHovered) opacity = 0.15;

                return (
                  <line
                    key={`line-prim-${conn.name}`}
                    x1={centerX}
                    y1={centerY}
                    x2={conn.x}
                    y2={conn.y}
                    className="transition-all duration-300"
                    style={{
                      stroke: conn.isPatch ? '#38bdf8' : '#BFA15A',
                      strokeWidth: (isThisPrimaryHovered || isSubOfThisHovered) ? 3.5 : 2.2,
                      strokeDasharray: conn.isPatch ? '6,4' : undefined,
                      opacity: opacity,
                      filter: (isThisPrimaryHovered || isSubOfThisHovered) 
                        ? (conn.isPatch ? 'url(#glow-sky)' : 'url(#glow-gold)') 
                        : undefined,
                    }}
                  />
                );
              })}

              {/* 3. Central Anchor Ring animations */}
              <circle
                cx={centerX}
                cy={centerY}
                r={40}
                className="fill-none stroke-skyrim-gold/15 stroke-1 animate-ping"
                style={{ animationDuration: '4.5s' }}
              />
              <circle
                cx={centerX}
                cy={centerY}
                r={32}
                className="fill-none stroke-skyrim-gold/25 stroke-[1px]"
              />

              {/* 4. Tier 2 Satellite Node Capsules (Rendered below direct capsules to feel layered) */}
              {showBranches && allConnections.map((conn) => {
                return conn.subConnections.map((subConn) => {
                  const isParentHovered = hoveredNode === conn.name;
                  const isThisSubHovered = hoveredSubNode?.parentName === conn.name && hoveredSubNode?.name === subConn.name;
                  const isAnyOtherHovered = (hoveredNode !== null && hoveredNode !== conn.name) ||
                                            (hoveredSubNode !== null && (hoveredSubNode.parentName !== conn.name || hoveredSubNode.name !== subConn.name));
                                            
                  let opacity = 0.6;
                  let borderCol = '#4B5563'; // Neutral gray-600 standard
                  if (subConn.existsInDb) {
                    borderCol = '#9CA3AF'; // Light steel for standard entries
                  }
                  
                  if (isThisSubHovered) {
                    opacity = 1.0;
                    borderCol = getRaceThemeColor(subConn.details.race).stroke;
                  } else if (isParentHovered) {
                    opacity = 0.9;
                  } else if (isAnyOtherHovered) {
                    opacity = 0.2;
                  }

                  // Capsule width based mathematically on name length so label never wraps tightly
                  const labelLength = subConn.name.length;
                  const capsuleW = Math.max(90, labelLength * 7.5 + 16);
                  const capsuleH = 26;

                  return (
                    <g
                      key={`g-sub-${conn.name}-${subConn.name}`}
                      className="cursor-pointer group select-none"
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
                      {/* Highlight Outer Glow on Hover */}
                      {isThisSubHovered && (
                        <rect
                          x={subConn.x - capsuleW / 2 - 4}
                          y={subConn.y - capsuleH / 2 - 4}
                          width={capsuleW + 8}
                          height={capsuleH + 8}
                          rx={8}
                          fill="rgba(191,161,90,0.15)"
                          className="transition-all duration-300"
                          style={{ filter: 'url(#glow-gold)' }}
                        />
                      )}

                      {/* Main capsule rect */}
                      <rect
                        x={subConn.x - capsuleW / 2}
                        y={subConn.y - capsuleH / 2}
                        width={capsuleW}
                        height={capsuleH}
                        rx={6}
                        fill="url(#gradient-node)"
                        stroke={borderCol}
                        strokeWidth={isThisSubHovered ? 1.8 : 1.0}
                        className="transition-all duration-300"
                        style={{ opacity: opacity }}
                      />

                      {/* Dynamic race-theme indicator dot */}
                      <circle
                        cx={subConn.x - capsuleW / 2 + 10}
                        cy={subConn.y}
                        r={3.5}
                        fill={getRaceThemeColor(subConn.details.race).dot}
                        style={{ opacity: opacity }}
                      />

                      {/* Text Label - Exact 12px requested size! */}
                      <text
                        x={subConn.x + 4}
                        y={subConn.y + 4.5}
                        textAnchor="middle"
                        className={`font-sans font-medium select-none tracking-wide transition-all duration-300 ${
                          subConn.existsInDb ? 'fill-gray-200' : 'fill-gray-500 italic'
                        }`}
                        style={{ 
                          fontSize: '12px',
                          opacity: opacity,
                        }}
                      >
                        {subConn.name}
                      </text>
                    </g>
                  );
                });
              })}

              {/* 5. Tier 1 Dialogue Connection Capsules (Direct layout circle) */}
              {allConnections.map((conn) => {
                const isThisPrimaryHovered = hoveredNode === conn.name;
                const isSubOfThisHovered = hoveredSubNode?.parentName === conn.name;
                const isAnyOtherHovered = (hoveredNode !== null && hoveredNode !== conn.name) ||
                                          (hoveredSubNode !== null && hoveredSubNode.parentName !== conn.name);
                                          
                let opacity = 0.95;
                let borderCol = getRaceThemeColor(conn.details.race).stroke;
                
                if (isThisPrimaryHovered || isSubOfThisHovered) {
                  opacity = 1.0;
                } else if (isAnyOtherHovered) {
                  opacity = 0.25;
                }

                // Dynamic width calculation to ensure text never wraps/clips (even for very long companion names)
                const labelLength = conn.name.length;
                const capsuleW = Math.max(105, labelLength * 8.5 + 20);
                const capsuleH = 34;

                return (
                  <g 
                    key={`g-prim-${conn.name}`}
                    className="cursor-pointer group select-none"
                    onMouseEnter={() => setHoveredNode(conn.name)}
                    onMouseLeave={() => setHoveredNode(null)}
                    onClick={() => {
                      if (conn.existsInDb) {
                        onSelectFollower(conn.name);
                        setHoveredNode(null);
                      }
                    }}
                  >
                    {/* Pulsing hover shadow decoration */}
                    {(isThisPrimaryHovered || isSubOfThisHovered) && (
                      <rect
                        x={conn.x - capsuleW / 2 - 6}
                        y={conn.y - capsuleH / 2 - 6}
                        width={capsuleW + 12}
                        height={capsuleH + 12}
                        rx={10}
                        fill="rgba(191,161,90,0.18)"
                        className="transition-all duration-300 animate-pulse-subtle"
                        style={{ filter: 'url(#glow-gold)' }}
                      />
                    )}

                    {/* Outer Border capsule */}
                    <rect
                      x={conn.x - capsuleW / 2}
                      y={conn.y - capsuleH / 2}
                      width={capsuleW}
                      height={capsuleH}
                      rx={8}
                      fill="url(#gradient-center)"
                      stroke={borderCol}
                      strokeWidth={(isThisPrimaryHovered || isSubOfThisHovered) ? 2.5 : 1.5}
                      className="transition-all duration-300"
                      style={{ opacity: opacity }}
                    />

                    {/* Integrated race colored accent dots */}
                    <circle
                      cx={conn.x - capsuleW / 2 + 13}
                      cy={conn.y}
                      r={4.5}
                      fill={getRaceThemeColor(conn.details.race).dot}
                      style={{ opacity: opacity }}
                    />

                    {/* Tier-1 highly legible Text Label - Exact 14px requested size! */}
                    <text
                      x={conn.x + 6}
                      y={conn.y + 5}
                      textAnchor="middle"
                      className={`font-sans tracking-wide transition-all duration-300 ${
                        conn.existsInDb ? 'fill-gray-100 font-bold' : 'fill-gray-500 italic'
                      }`}
                      style={{ 
                        fontSize: '14px',
                        opacity: opacity,
                      }}
                    >
                      {conn.name}
                    </text>
                  </g>
                );
              })}

              {/* 6. Locked Central Anchor Node (The selected activeFollower card) */}
              <g className="cursor-default select-none">
                {/* Large outer subtle glow for active gold central card */}
                <rect
                  x={centerX - 95}
                  y={centerY - 28}
                  width={190}
                  height={56}
                  rx={10}
                  fill="rgba(191, 161, 90, 0.08)"
                  stroke="#BFA15A"
                  strokeWidth="3px"
                  style={{ filter: 'url(#glow-gold)' }}
                />

                {/* Base solid card background */}
                <rect
                  x={centerX - 93}
                  y={centerY - 26}
                  width={186}
                  height={52}
                  rx={8}
                  fill="url(#gradient-center)"
                  stroke="#BFA15A"
                  strokeWidth="1px"
                />

                {/* Main Follower Label centered at absolute viewport center, with 16px font-size! */}
                <text
                  x={centerX}
                  y={centerY - 3}
                  textAnchor="middle"
                  className="font-display font-bold fill-skyrim-gold-bright tracking-widest uppercase"
                  style={{ fontSize: '16px' }}
                >
                  {follower.follower}
                </text>

                {/* Central Subtitle */}
                <text
                  x={centerX}
                  y={centerY + 16}
                  textAnchor="middle"
                  className="font-sans font-semibold fill-gray-400 tracking-wider uppercase"
                  style={{ fontSize: '9px' }}
                >
                  {follower.race} • {follower.gender}
                </text>

                {/* Small decorative Corner brackets */}
                <path d={`M ${centerX - 85} ${centerY - 20} L ${centerX - 89} ${centerY - 20} L ${centerX - 89} ${centerY - 16}`} stroke="#BFA15A" strokeWidth="1" fill="none" />
                <path d={`M ${centerX + 85} ${centerY - 20} L ${centerX + 89} ${centerY - 20} L ${centerX + 89} ${centerY - 16}`} stroke="#BFA15A" strokeWidth="1" fill="none" />
                <path d={`M ${centerX - 85} ${centerY + 20} L ${centerX - 89} ${centerY + 20} L ${centerX - 89} ${centerY + 16}`} stroke="#BFA15A" strokeWidth="1" fill="none" />
                <path d={`M ${centerX + 85} ${centerY + 20} L ${centerX + 89} ${centerY + 20} L ${centerX + 89} ${centerY + 16}`} stroke="#BFA15A" strokeWidth="1" fill="none" />
              </g>

            </svg>
          )}
        </div>

        {/* Legend & Hover inspection panel */}
        <div className={`flex-1 w-full lg:max-w-xl flex flex-col justify-between gap-5 text-xs transition-all duration-300 ${
          isFullscreen ? 'lg:max-w-2xl' : ''
        }`}>
          
          {/* Active Hover Detail Peek */}
          <div className="flex-1 min-h-[210px] bg-black/30 p-5 rounded-xl border border-skyrim-border/75 flex flex-col justify-between backdrop-blur-sm shadow-inner relative overflow-hidden mb-1">
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
                          <div className="grid grid-cols-3 gap-x-3 gap-y-1 text-[11px] text-gray-300 mt-2 bg-black/15 p-2.5 rounded border border-white/5 font-sans">
                            <div>Race: <span className="text-gray-100 font-medium truncate block max-w-[120px]">{subConn.details.race}</span></div>
                            <div>Gender: <span className="text-gray-100 font-medium truncate block max-w-[80px]">{subConn.details.gender}</span></div>
                            <div>Role: <span className="text-gray-100 font-medium truncate block max-w-[140px]">{subConn.details.class}</span></div>
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
                          <div className="grid grid-cols-3 gap-x-3 gap-y-1 text-[11px] text-gray-300 mt-2 bg-black/15 p-2.5 rounded border border-white/5 font-sans">
                            <div>Race: <span className="text-gray-100 font-medium truncate block max-w-[120px]">{conn.details.race}</span></div>
                            <div>Gender: <span className="text-gray-100 font-medium truncate block max-w-[80px]">{conn.details.gender}</span></div>
                            <div className="truncate">Pack: <span className="text-gray-200 font-sans text-[10px] block truncate max-w-[140px]" title={conn.details.mod}>{conn.details.mod}</span></div>
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
                  <Sparkles className="w-6 h-6 text-[#BFA15A] animate-pulse-subtle" />
                  <div>
                    <p className="text-gray-300 font-semibold text-xs tracking-wide">
                      Interactive Visualizer
                    </p>
                    <p className="text-[11px] text-gray-400 mt-1 max-w-[34ch] mx-auto leading-relaxed">
                      Hover over primary companion capsules or secondary outer branches to audit dialogue requirements, classes, and sub-networks!
                    </p>
                    <p className="text-[10px] text-[#BFA15A] mt-2 italic font-mono">
                      💡 Click any available node to refocus the database tree.
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
                <span className="block text-[15px] font-bold font-mono text-skyrim-gold animate-bounce-short">
                  {connections.length}
                </span>
                <span className="text-[9px] text-gray-400 uppercase tracking-wide">Direct Companions</span>
              </div>
              <div className="bg-[#121215]/60 border border-white/5 rounded px-2 py-1.5">
                <span className="block text-[15px] font-bold font-mono text-rose-450">
                  {showBranches ? allConnections.reduce((acc, c) => acc + c.subConnections.length, 0) : '—'}
                </span>
                <span className="text-[9px] text-gray-400 uppercase tracking-wide">Secondary Branches</span>
              </div>
            </div>

            {/* Micro Connection Legend */}
            <div className="flex flex-col gap-2 border-t border-white/5 pt-2 text-[10.5px]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-1 rounded bg-[#BFA15A]" />
                  <span className="text-gray-400">Direct companion dialogue</span>
                </div>
                <span className="text-[10px] text-rose-350 font-bold font-mono">1st Degree [14px]</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-1 rounded bg-sky-400" />
                  <span className="text-gray-400 font-sans">Requires crossover patch</span>
                </div>
                <span className="text-[9px] text-sky-400 font-bold px-1.5 py-0.2 bg-sky-950/30 rounded font-mono">Patch link</span>
              </div>

              {showBranches && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-1 rounded bg-gray-500" />
                    <span className="text-gray-400">Sub-branch conversations</span>
                  </div>
                  <span className="text-[10px] text-rose-450 font-bold font-mono">2nd Degree [12px]</span>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
