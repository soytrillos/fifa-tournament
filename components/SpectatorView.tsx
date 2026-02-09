
import React, { useState, useEffect, useMemo } from 'react';
import { TournamentType, Matchup, Group, TournamentStage, Assignment, MatchStatus } from '../types';
import { MatchupView } from './MatchupView';
import { BracketView } from './BracketView';
import { AdvancedStatsView } from './AdvancedStatsView';
import { TeamLogo } from './TeamLogo';
import { Radio, MonitorPlay, Activity, Pause, Play, SkipForward, SkipBack, Clock, CalendarDays } from 'lucide-react';

interface Props {
  tournamentType: TournamentType | null;
  stage: TournamentStage;
  groups: Group[];
  matchups: Matchup[];
  history: Matchup[][];
  round: number;
  champion: Assignment | null;
}

// Helper to extract all unique assignments (Players + Teams) from the tournament data
const getAllAssignments = (groups: Group[], history: Matchup[][], matchups: Matchup[]): Assignment[] => {
  const assignmentsMap = new Map<string, Assignment>();

  const addFromMatch = (m: Matchup) => {
    if (m.player1) assignmentsMap.set(m.player1.player.id, m.player1);
    if (m.player2) assignmentsMap.set(m.player2.player.id, m.player2);
  };

  // 1. From Groups
  groups.forEach(g => g.assignments.forEach(a => assignmentsMap.set(a.player.id, a)));
  
  // 2. From History (Bracket Round 1 usually has everyone if no groups)
  history.forEach(round => round.forEach(addFromMatch));

  // 3. From Current Matchups
  matchups.forEach(addFromMatch);

  return Array.from(assignmentsMap.values()).sort((a, b) => a.player.name.localeCompare(b.player.name));
};

// Helper to calculate table stats (Duplicated to allow specific spectator styling without breaking Admin view)
const getSpectatorTable = (group: Group) => {
    const stats: Record<string, { p: number, w: number, d: number, l: number, gf: number, ga: number, pts: number }> = {};
    
    group.assignments.forEach(a => {
      stats[a.player.id] = { p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 };
    });

    group.matches.forEach(m => {
      const isFinished = m.status === MatchStatus.FINISHED || (m.status !== MatchStatus.SCHEDULED && m.score1 !== undefined && m.score2 !== undefined && m.player2 && m.winnerId);
      
      if (isFinished && m.score1 !== undefined && m.score2 !== undefined && m.player2) {
        const p1 = stats[m.player1.player.id];
        const p2 = stats[m.player2.player.id];
        
        p1.p++; p2.p++;
        p1.gf += m.score1; p1.ga += m.score2;
        p2.gf += m.score2; p2.ga += m.score1;

        if (m.score1 > m.score2) { p1.w++; p2.l++; p1.pts += 3; }
        else if (m.score2 > m.score1) { p2.w++; p1.l++; p2.pts += 3; }
        else { p1.d++; p2.d++; p1.pts += 1; p2.pts += 1; }
      }
    });

    return group.assignments
      .map(a => ({ ...a, ...stats[a.player.id] }))
      .sort((a, b) => b.pts - a.pts || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf);
};

type SlideType = 'intro' | 'roster' | 'groups' | 'bracket' | 'stats' | 'podium';

export const SpectatorView: React.FC<Props> = ({
  tournamentType,
  stage,
  groups,
  matchups,
  history,
  round,
  champion
}) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  
  // State for sub-rotation (e.g., cycling through Group A, Group B...)
  const [subSlideIndex, setSubSlideIndex] = useState(0);

  // Derive all players
  const allAssignments = useMemo(() => getAllAssignments(groups, history, matchups), [groups, history, matchups]);

  // Determine available slides based on tournament state
  const slides: { type: SlideType; title: string; duration: number }[] = useMemo(() => {
    const list: { type: SlideType; title: string; duration: number }[] = [
      { type: 'intro', title: 'Bienvenidos', duration: 5000 },
      { type: 'roster', title: 'Equipos y Jugadores', duration: 10000 },
    ];

    if (groups.length > 0) {
      // Dynamic duration based on number of groups (10 seconds per group)
      const groupsDuration = Math.max(15000, groups.length * 10000); 
      list.push({ type: 'groups', title: 'Fase de Grupos', duration: groupsDuration });
    }

    // Always show bracket/matchups if we are in bracket stage or simply to show the tree
    if (stage === TournamentStage.BRACKET || history.length > 0) {
        list.push({ type: 'bracket', title: 'Cuadro del Torneo', duration: 15000 });
    }

    // Always show stats
    list.push({ type: 'stats', title: 'Estadísticas', duration: 12000 });

    // Show podium if champion exists
    if (champion) {
        list.push({ type: 'podium', title: 'Ceremonia de Premiación', duration: 20000 });
    }

    return list;
  }, [groups.length, stage, history.length, champion]);

  // Main Slide Rotation
  useEffect(() => {
    let interval: ReturnType<typeof setTimeout>;
    let progressInterval: ReturnType<typeof setInterval>;

    if (isPlaying) {
      const currentSlide = slides[currentSlideIndex];
      const step = 100; // update progress every 100ms
      
      // Reset progress when slide changes
      if (progress >= 100) setProgress(0);
      
      progressInterval = setInterval(() => {
        setProgress(old => {
            const newProgress = old + (step / currentSlide.duration) * 100;
            return newProgress >= 100 ? 100 : newProgress;
        });
      }, step);

      interval = setTimeout(() => {
        setCurrentSlideIndex((prev) => (prev + 1) % slides.length);
        setProgress(0);
        setSubSlideIndex(0); // Reset sub-slide index on new main slide
      }, currentSlide.duration);
    }

    return () => {
      clearTimeout(interval);
      clearInterval(progressInterval);
    };
  }, [currentSlideIndex, slides, isPlaying, progress]); // Added progress dependency to avoid jump

  // Sub-rotation for Groups (Switch group every 10 seconds while in 'groups' slide)
  useEffect(() => {
    let subInterval: ReturnType<typeof setInterval>;
    
    if (isPlaying && slides[currentSlideIndex].type === 'groups' && groups.length > 0) {
        subInterval = setInterval(() => {
            setSubSlideIndex(prev => (prev + 1) % groups.length);
        }, 10000);
    }

    return () => clearInterval(subInterval);
  }, [currentSlideIndex, slides, isPlaying, groups.length]);


  const handleNext = () => {
    setCurrentSlideIndex((prev) => (prev + 1) % slides.length);
    setProgress(0);
    setSubSlideIndex(0);
  };

  const handlePrev = () => {
    setCurrentSlideIndex((prev) => (prev - 1 + slides.length) % slides.length);
    setProgress(0);
    setSubSlideIndex(0);
  };

  if (!tournamentType) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white">
        <MonitorPlay size={64} className="text-gray-600 mb-4 animate-pulse" />
        <h1 className="text-3xl font-bold uppercase tracking-widest text-gray-500">Esperando señal del torneo...</h1>
      </div>
    );
  }

  const currentSlide = slides[currentSlideIndex];

  // Logic for Group View Rendering
  const renderGroupSlide = () => {
    if (!groups || groups.length === 0) return null;
    
    // Safety check for index
    const activeGroupIndex = subSlideIndex % groups.length;
    const activeGroup = groups[activeGroupIndex];
    const table = getSpectatorTable(activeGroup);

    // Identify the "Current" or "Next" match based on explicitly set status first
    let activeMatch = activeGroup.matches.find(m => m.status === MatchStatus.IN_PROGRESS);
    
    // If no match is strictly live, find the first scheduled
    if (!activeMatch) {
        activeMatch = activeGroup.matches.find(m => !m.status || m.status === MatchStatus.SCHEDULED);
    }

    // If all else fails (all finished), show the last one
    if (!activeMatch) {
        activeMatch = activeGroup.matches[activeGroup.matches.length - 1];
    }
    
    // Calculate index just for display "Partido X de Y"
    const activeMatchIndex = activeGroup.matches.findIndex(m => m.id === activeMatch?.id);
    const isLive = activeMatch?.status === MatchStatus.IN_PROGRESS;
    const isFinished = activeMatch?.status === MatchStatus.FINISHED;

    return (
        <div className="flex flex-col h-full animate-fade-in-up">
            <div className="flex items-center gap-4 mb-6">
                <div className="bg-cyan-600 text-white text-3xl font-bold px-6 py-2 rounded-lg shadow-[0_0_20px_rgba(8,145,178,0.5)]">
                    GRUPO {activeGroup.id}
                </div>
                <div className="h-1 flex-1 bg-gradient-to-r from-cyan-600/50 to-transparent"></div>
            </div>

            <div className="grid grid-cols-12 gap-8 h-full">
                
                {/* Left Col: Standings Table */}
                <div className="col-span-12 lg:col-span-7 flex flex-col">
                    <div className="bg-black/40 border border-white/10 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-sm flex-1">
                        <div className="bg-gradient-to-r from-gray-800 to-black p-4 border-b border-white/10 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-gray-200 uppercase tracking-widest flex items-center gap-2">
                                <Activity size={20} className="text-cyan-400" /> Tabla de Posiciones
                            </h3>
                        </div>
                        <table className="w-full text-lg">
                            <thead className="bg-white/5 text-gray-400 font-bold uppercase text-sm tracking-wider">
                                <tr>
                                    <th className="p-4 text-left">Equipo</th>
                                    <th className="p-4 text-center">PJ</th>
                                    <th className="p-4 text-center">G</th>
                                    <th className="p-4 text-center">E</th>
                                    <th className="p-4 text-center">P</th>
                                    <th className="p-4 text-center">DG</th>
                                    <th className="p-4 text-center text-white bg-white/10">PTS</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {table.map((row, i) => (
                                    <tr key={row.player.id} className={`transition-all duration-500 ${i < 2 ? 'bg-green-900/10' : ''}`}>
                                        <td className="p-4 flex items-center gap-4">
                                            <span className={`font-mono font-bold w-6 ${i < 2 ? 'text-green-400' : 'text-gray-500'}`}>{i+1}</span>
                                            <TeamLogo src={row.team.logo} className="w-10 h-10 object-contain drop-shadow-md rounded-full" fallbackText={row.team.name} />
                                            <div>
                                                <div className="font-bold text-white leading-tight">{row.team.name}</div>
                                                <div className="text-sm text-cyan-400 font-bold">{row.player.name}</div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-center font-bold text-gray-400">{row.p}</td>
                                        <td className="p-4 text-center text-gray-500">{row.w}</td>
                                        <td className="p-4 text-center text-gray-500">{row.d}</td>
                                        <td className="p-4 text-center text-gray-500">{row.l}</td>
                                        <td className={`p-4 text-center font-bold ${row.gf - row.ga > 0 ? 'text-green-400' : 'text-gray-400'}`}>
                                            {row.gf - row.ga > 0 ? '+' : ''}{row.gf - row.ga}
                                        </td>
                                        <td className="p-4 text-center font-black text-2xl text-white bg-white/5 shadow-inner">
                                            {row.pts}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Right Col: Fixture / Live Match */}
                <div className="col-span-12 lg:col-span-5 flex flex-col gap-6">
                    
                    {/* Featured Match Card (Live or Next) */}
                    {activeMatch && (
                        <div className={`bg-gradient-to-br border-2 rounded-2xl p-6 shadow-2xl relative overflow-hidden group transition-all duration-500 ${isLive ? 'from-red-900/40 to-black border-red-500/50 shadow-[0_0_50px_rgba(220,38,38,0.3)]' : 'from-blue-900/40 to-black border-cyan-500/50'}`}>
                            {/* Live Badge */}
                            <div className="flex justify-between items-center mb-6">
                                <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${isLive ? 'bg-red-600 text-white animate-pulse' : isFinished ? 'bg-gray-700 text-gray-300' : 'bg-blue-600 text-white'}`}>
                                    {isLive ? <><Radio size={14}/> En Vivo</> : isFinished ? <><Clock size={14}/> Finalizado</> : <><CalendarDays size={14}/> Próximo</>}
                                </div>
                                <div className="text-cyan-400 text-xs font-bold uppercase tracking-widest">
                                    Partido {activeMatchIndex + 1} de {activeGroup.matches.length}
                                </div>
                            </div>

                            <div className="flex justify-between items-center relative z-10">
                                {/* P1 */}
                                <div className="flex flex-col items-center flex-1">
                                    <div className="w-20 h-20 mb-2 relative">
                                        <TeamLogo src={activeMatch.player1.team.logo} className="w-full h-full object-contain drop-shadow-xl rounded-full" fallbackText={activeMatch.player1.team.name} />
                                    </div>
                                    <div className="font-black text-xl text-center leading-none mb-1">{activeMatch.player1.team.name}</div>
                                    <div className="text-xs text-cyan-400 font-bold uppercase">{activeMatch.player1.player.name}</div>
                                </div>

                                {/* Score */}
                                <div className="flex flex-col items-center px-4">
                                    <div className={`text-5xl font-black text-white flex gap-4 items-center px-4 py-2 rounded-lg border ${isLive ? 'bg-red-900/20 border-red-500/30' : 'bg-black/40 border-white/10'}`}>
                                        <span>{activeMatch.score1 ?? 0}</span>
                                        <span className="text-gray-600 text-3xl">:</span>
                                        <span>{activeMatch.score2 ?? 0}</span>
                                    </div>
                                    {isLive && <div className="text-red-500 text-xs font-bold uppercase mt-2 animate-pulse">Jugando Ahora</div>}
                                </div>

                                {/* P2 */}
                                <div className="flex flex-col items-center flex-1">
                                    <div className="w-20 h-20 mb-2 relative">
                                        {activeMatch.player2 && <TeamLogo src={activeMatch.player2.team.logo} className="w-full h-full object-contain drop-shadow-xl rounded-full" fallbackText={activeMatch.player2.team.name} />}
                                    </div>
                                    <div className="font-black text-xl text-center leading-none mb-1">{activeMatch.player2?.team.name || 'BYE'}</div>
                                    <div className="text-xs text-purple-400 font-bold uppercase">{activeMatch.player2?.player.name}</div>
                                </div>
                            </div>
                            
                            {/* Bg decoration */}
                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-r from-transparent via-cyan-500/5 to-transparent skew-x-12 pointer-events-none"></div>
                        </div>
                    )}

                    {/* Match List */}
                    <div className="flex-1 bg-black/20 border border-white/5 rounded-xl p-4 overflow-y-auto custom-scrollbar">
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <CalendarDays size={14} /> Calendario del Grupo
                        </h4>
                        <div className="space-y-2">
                            {activeGroup.matches.map((m, idx) => {
                                const isCurrent = m.id === activeMatch?.id;
                                const mIsLive = m.status === MatchStatus.IN_PROGRESS;
                                const mIsFinished = m.status === MatchStatus.FINISHED;
                                
                                return (
                                    <div 
                                        key={m.id} 
                                        className={`p-3 rounded-lg border flex items-center justify-between transition-colors ${
                                            mIsLive ? 'bg-red-900/20 border-red-500/50' :
                                            isCurrent ? 'bg-white/10 border-cyan-500/50' : 'bg-black/40 border-white/5 opacity-80'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2 flex-1">
                                            <TeamLogo src={m.player1.team.logo} className="w-6 h-6 object-contain rounded-full" fallbackText={m.player1.team.name} />
                                            <span className={`text-sm font-bold truncate ${m.winnerId === m.player1.player.id ? 'text-green-400' : 'text-gray-300'}`}>
                                                {m.player1.team.name}
                                            </span>
                                        </div>
                                        
                                        <div className="px-3 font-mono font-bold text-white text-sm bg-black/50 rounded py-1 mx-2 min-w-[50px] text-center flex flex-col items-center">
                                            <span>{m.score1 ?? 0} - {m.score2 ?? 0}</span>
                                            {mIsLive && <span className="text-[9px] text-red-500 uppercase font-bold animate-pulse">Live</span>}
                                        </div>

                                        <div className="flex items-center gap-2 flex-1 justify-end">
                                            <span className={`text-sm font-bold truncate ${m.winnerId && m.player2 && m.winnerId === m.player2.player.id ? 'text-green-400' : 'text-gray-300'}`}>
                                                {m.player2?.team.name || 'BYE'}
                                            </span>
                                            {m.player2 && <TeamLogo src={m.player2.team.logo} className="w-6 h-6 object-contain rounded-full" fallbackText={m.player2.team.name} />}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-white font-sans pb-20 overflow-hidden flex flex-col">
      
      {/* CSS Animation Injection */}
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(50px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in {
          animation: slideInRight 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      {/* Broadcast Header */}
      <div className="bg-black/90 border-b-4 border-fifa-accent sticky top-0 z-50 shadow-2xl backdrop-blur-md flex-shrink-0">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-6">
             <div className="flex items-center gap-2 bg-red-600 text-white px-3 py-1 rounded font-bold text-xs uppercase animate-pulse shadow-[0_0_10px_red]">
                <Radio size={14} /> En Vivo
             </div>
             <div>
                <h1 className="text-2xl font-bold uppercase tracking-tighter text-white leading-none">
                    {tournamentType}
                </h1>
                <span className="text-cyan-400 text-xs tracking-[0.2em] uppercase font-bold">Transmisión Oficial</span>
             </div>
          </div>
          <div className="flex items-center gap-4">
             <div className="text-right hidden md:block">
                 <div className="text-xs text-gray-400 font-bold uppercase">Siguiente</div>
                 <div className="text-sm font-bold text-white">
                    {slides[(currentSlideIndex + 1) % slides.length].title}
                 </div>
             </div>
             <Activity size={24} className="text-green-500" />
          </div>
        </div>
        {/* Progress Bar */}
        <div className="h-1 w-full bg-gray-800">
            <div 
                className="h-full bg-fifa-accent transition-all duration-100 ease-linear" 
                style={{ width: `${progress}%` }}
            ></div>
        </div>
      </div>

      {/* Main Content Area (Dynamic Slider) */}
      <main className="flex-1 relative overflow-hidden flex flex-col">
        {/* Title Overlay (except for groups where we have specific header) */}
        {currentSlide.type !== 'groups' && (
            <div className="absolute top-8 left-8 z-10">
                <h2 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white/10 to-transparent pointer-events-none">
                    {currentSlide.title}
                </h2>
            </div>
        )}

        <div key={`${currentSlide.type}-${subSlideIndex}`} className="flex-1 w-full h-full p-4 md:p-8 animate-slide-in overflow-y-auto custom-scrollbar">
            
            {/* --- SLIDE: INTRO --- */}
            {currentSlide.type === 'intro' && (
                <div className="h-full flex flex-col items-center justify-center text-center">
                    <div className="mb-8 relative">
                        <div className="absolute inset-0 bg-cyan-500 blur-[100px] opacity-20 rounded-full"></div>
                        <MonitorPlay size={120} className="text-white relative z-10" />
                    </div>
                    <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter mb-4 bg-gradient-to-b from-white to-gray-600 bg-clip-text text-transparent">
                        {tournamentType}
                    </h1>
                    <p className="text-2xl text-cyan-400 font-light tracking-[0.5em] uppercase border-t border-b border-cyan-500/30 py-4">
                        Torneo Oficial FIFA 26
                    </p>
                </div>
            )}

            {/* --- SLIDE: ROSTER --- */}
            {currentSlide.type === 'roster' && (
                <div className="max-w-7xl mx-auto pt-16">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {allAssignments.map((assignment, idx) => (
                            <div 
                                key={assignment.player.id} 
                                className="bg-gradient-to-br from-gray-900 to-black border border-white/10 rounded-2xl p-6 flex flex-col items-center gap-4 shadow-xl hover:scale-105 transition-transform duration-500 group"
                                style={{ animationDelay: `${idx * 0.1}s` }}
                            >
                                <div className="w-24 h-24 bg-white/5 rounded-full p-2 flex items-center justify-center shadow-inner group-hover:bg-white/10 transition-colors">
                                    <TeamLogo src={assignment.team.logo} className="w-full h-full object-contain" fallbackText={assignment.team.name} />
                                </div>
                                <div className="text-center">
                                    <div className="text-xl font-bold text-white mb-1">{assignment.player.name}</div>
                                    <div className="text-sm text-cyan-400 font-bold uppercase tracking-wider">{assignment.team.name}</div>
                                    <div className="text-xs text-gray-500 mt-2 flex items-center justify-center gap-1">
                                         ⭐ {assignment.team.starPlayer}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* --- SLIDE: GROUPS (NEW DYNAMIC VIEW) --- */}
            {currentSlide.type === 'groups' && renderGroupSlide()}

            {/* --- SLIDE: BRACKET --- */}
            {currentSlide.type === 'bracket' && (
                <div className="pt-12">
                     <BracketView 
                        history={history} 
                        currentMatchups={matchups} 
                        onMatchClick={() => {}} 
                        champion={champion}
                     />
                </div>
            )}

             {/* --- SLIDE: STATS --- */}
             {currentSlide.type === 'stats' && (
                <div className="max-w-6xl mx-auto pt-12">
                     <AdvancedStatsView groups={groups} history={history} currentMatchups={matchups} />
                </div>
            )}

            {/* --- SLIDE: PODIUM --- */}
            {currentSlide.type === 'podium' && (
                <div className="pt-8">
                     <MatchupView 
                        matchups={matchups} 
                        history={history} 
                        tournamentType={tournamentType} 
                        roundNumber={round} 
                        groups={groups}
                        onReset={() => {}} 
                        onMatchUpdate={() => {}} 
                        onNextRound={() => {}} 
                        readOnly={true}
                    />
                </div>
            )}
        </div>
      </main>

      {/* Control Bar (Floating) */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-black/60 backdrop-blur-xl border border-white/10 rounded-full px-6 py-3 flex items-center gap-6 shadow-2xl z-50 hover:bg-black/80 transition-colors">
        <button onClick={handlePrev} className="text-gray-400 hover:text-white transition-colors">
            <SkipBack size={20} />
        </button>
        <button 
            onClick={() => setIsPlaying(!isPlaying)} 
            className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-[0_0_15px_white]"
        >
            {isPlaying ? <Pause size={20} fill="black" /> : <Play size={20} fill="black" className="ml-1" />}
        </button>
        <button onClick={handleNext} className="text-gray-400 hover:text-white transition-colors">
            <SkipForward size={20} />
        </button>
        
        <div className="h-6 w-[1px] bg-white/20"></div>
        
        <div className="flex gap-2">
            {slides.map((s, idx) => (
                <button 
                    key={idx}
                    onClick={() => { setCurrentSlideIndex(idx); setProgress(0); setSubSlideIndex(0); }}
                    className={`w-2 h-2 rounded-full transition-all ${currentSlideIndex === idx ? 'bg-cyan-400 w-6' : 'bg-gray-600 hover:bg-gray-400'}`}
                    title={s.title}
                />
            ))}
        </div>
      </div>

    </div>
  );
};
