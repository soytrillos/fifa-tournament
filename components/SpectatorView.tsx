
import React, { useState, useEffect, useMemo } from 'react';
import { TournamentType, Matchup, Group, TournamentStage, Assignment } from '../types';
import { MatchupView } from './MatchupView';
import { GroupStageView } from './GroupStageView';
import { BracketView } from './BracketView';
import { AdvancedStatsView } from './AdvancedStatsView';
import { TeamLogo } from './TeamLogo';
import { Radio, MonitorPlay, Activity, Users, Pause, Play, SkipForward, SkipBack } from 'lucide-react';

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

  // Derive all players
  const allAssignments = useMemo(() => getAllAssignments(groups, history, matchups), [groups, history, matchups]);

  // Determine available slides based on tournament state
  const slides: { type: SlideType; title: string; duration: number }[] = useMemo(() => {
    const list: { type: SlideType; title: string; duration: number }[] = [
      { type: 'intro', title: 'Bienvenidos', duration: 5000 },
      { type: 'roster', title: 'Equipos y Jugadores', duration: 10000 },
    ];

    if (groups.length > 0) {
      list.push({ type: 'groups', title: 'Fase de Grupos', duration: 15000 });
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

  // Auto-rotation logic
  useEffect(() => {
    let interval: ReturnType<typeof setTimeout>;
    let progressInterval: ReturnType<typeof setInterval>;

    if (isPlaying) {
      const currentSlide = slides[currentSlideIndex];
      const step = 100; // update progress every 100ms
      
      setProgress(0);
      
      progressInterval = setInterval(() => {
        setProgress(old => {
            const newProgress = old + (step / currentSlide.duration) * 100;
            return newProgress >= 100 ? 100 : newProgress;
        });
      }, step);

      interval = setTimeout(() => {
        setCurrentSlideIndex((prev) => (prev + 1) % slides.length);
        setProgress(0);
      }, currentSlide.duration);
    }

    return () => {
      clearTimeout(interval);
      clearInterval(progressInterval);
    };
  }, [currentSlideIndex, slides, isPlaying]);

  const handleNext = () => {
    setCurrentSlideIndex((prev) => (prev + 1) % slides.length);
    setProgress(0);
  };

  const handlePrev = () => {
    setCurrentSlideIndex((prev) => (prev - 1 + slides.length) % slides.length);
    setProgress(0);
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

  return (
    <div className="min-h-screen bg-[#0b0f19] text-white font-sans pb-20 overflow-hidden flex flex-col">
      
      {/* CSS Animation Injection */}
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
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
        {/* Title Overlay */}
        <div className="absolute top-8 left-8 z-10">
            <h2 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white/10 to-transparent pointer-events-none">
                {currentSlide.title}
            </h2>
        </div>

        <div key={currentSlide.type} className="flex-1 w-full h-full p-4 md:p-8 animate-slide-in overflow-y-auto custom-scrollbar">
            
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

            {/* --- SLIDE: ROSTER (NEW) --- */}
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

            {/* --- SLIDE: GROUPS --- */}
            {currentSlide.type === 'groups' && (
                <div className="pt-8 transform scale-90 origin-top">
                     <GroupStageView 
                        groups={groups} 
                        onMatchUpdate={() => {}} 
                        onAdvanceToBracket={() => {}} 
                        readOnly={true} 
                     />
                </div>
            )}

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
                    onClick={() => { setCurrentSlideIndex(idx); setProgress(0); }}
                    className={`w-2 h-2 rounded-full transition-all ${currentSlideIndex === idx ? 'bg-cyan-400 w-6' : 'bg-gray-600 hover:bg-gray-400'}`}
                    title={s.title}
                />
            ))}
        </div>
      </div>

    </div>
  );
};
