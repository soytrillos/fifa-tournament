import React, { useEffect, useState, useMemo } from 'react';
import { Matchup, TournamentType, Group } from '../types';
import { generateTournamentCommentary } from '../services/geminiService';
import { Button } from './Button';
import { Sparkles, RefreshCw, Trophy, ArrowRight, CheckCircle2, Medal, Zap, Skull, BarChart3, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { AdvancedStatsView } from './AdvancedStatsView';
import { TeamLogo } from './TeamLogo';

interface Props {
  matchups: Matchup[];
  history: Matchup[][];
  tournamentType: TournamentType;
  roundNumber: number;
  groups?: Group[]; // Optional access to group data
  onReset: () => void;
  onMatchUpdate: (matchId: string, updates: Partial<Matchup>) => void;
  onNextRound: () => void;
  readOnly?: boolean;
}

export const MatchupView: React.FC<Props> = ({ 
  matchups, 
  history,
  tournamentType, 
  roundNumber, // This is the ACTIVE round number
  groups = [],
  onReset, 
  onMatchUpdate,
  onNextRound,
  readOnly = false
}) => {
  const [commentary, setCommentary] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [showStats, setShowStats] = useState(false);

  // Combine history and current matchups to create a timeline
  const allRounds = useMemo(() => [...history, matchups], [history, matchups]);
  
  // State to track which round we are currently VIEWING (defaults to the active round)
  const [viewIndex, setViewIndex] = useState(allRounds.length - 1);

  // Sync view index when a new round is added (user advanced round)
  useEffect(() => {
    setViewIndex(allRounds.length - 1);
  }, [allRounds.length]);

  // Determine which matchups to display based on navigation
  const displayedMatchups = allRounds[viewIndex] || [];
  const isHistoryView = viewIndex < allRounds.length - 1;
  
  // Calculate specific round properties for the VIEWED round
  const currentViewRoundNumber = viewIndex + 1;
  const isViewingCurrentRound = viewIndex === allRounds.length - 1;
  
  // Effective ReadOnly: True if passed prop is true OR if we are looking at history
  const isInteractive = !readOnly && !isHistoryView;

  // Check if all active matches have a winner (only relevant for the active round)
  const allMatchesDecided = matchups.every(m => m.winnerId !== undefined && m.winnerId !== null);
  
  // Logic to determine if it's the final stage (Podium complete) - Check against actual matchups
  // It is the final stage if we have <= 2 matches (Final OR Final + 3rd Place) AND at least one of them is the Final.
  const isFinalStage = matchups.length <= 2 && (matchups.some(m => !m.isThirdPlace && m.player2 !== null));
  
  // Champion is only declared when ALL matches in the final stage (Final + 3rd Place) are done
  const championDeclared = isFinalStage && allMatchesDecided;

  // Determine positions
  let champion = null;
  let runnerUp = null;
  let thirdPlace = null;

  if (championDeclared) {
    const finalMatch = matchups.find(m => !m.isThirdPlace);
    const thirdMatch = matchups.find(m => m.isThirdPlace);

    if (finalMatch && finalMatch.winnerId) {
       champion = finalMatch.winnerId === finalMatch.player1.player.id ? finalMatch.player1 : finalMatch.player2;
       runnerUp = finalMatch.winnerId === finalMatch.player1.player.id ? finalMatch.player2 : finalMatch.player1;
    }

    if (thirdMatch && thirdMatch.winnerId) {
      thirdPlace = thirdMatch.winnerId === thirdMatch.player1.player.id ? thirdMatch.player1 : thirdMatch.player2;
    }
  }

  // Statistics Calculation for Podium
  const calculateAwards = () => {
    const groupMatches = groups.flatMap(g => g.matches).filter(m => m.score1 !== undefined && m.score2 !== undefined);
    const bracketMatches = history.flat();
    const currentMatches = matchups.filter(m => m.score1 !== undefined && m.score2 !== undefined);
    
    const allMatches = [...groupMatches, ...bracketMatches, ...currentMatches];
    
    const stats: Record<string, { 
      name: string, 
      logo: string, 
      goals: number, 
      losses: number,
      goalsConceded: number 
    }> = {};

    allMatches.forEach(m => {
      if(m.score1 === undefined || m.score2 === undefined || !m.player2) return;
      const p1Id = m.player1.player.id;
      const p2Id = m.player2.player.id;
      
      // Init
      if (!stats[p1Id]) stats[p1Id] = { name: m.player1.player.name, logo: m.player1.team.logo, goals: 0, losses: 0, goalsConceded: 0 };
      if (!stats[p2Id]) stats[p2Id] = { name: m.player2.player.name, logo: m.player2.team.logo, goals: 0, losses: 0, goalsConceded: 0 };

      // Stats Goals Scored
      stats[p1Id].goals += m.score1;
      stats[p2Id].goals += m.score2;

      // Stats Goals Conceded (Received)
      stats[p1Id].goalsConceded += m.score2;
      stats[p2Id].goalsConceded += m.score1;

      // Stats Losses
      if (m.score1 > m.score2) stats[p2Id].losses++;
      else if (m.score2 > m.score1) stats[p1Id].losses++;
      else {
          if(m.winnerId === p1Id) stats[p2Id].losses++;
          if(m.winnerId === p2Id) stats[p1Id].losses++;
      }
    });

    const topScorer = Object.values(stats).sort((a, b) => b.goals - a.goals)[0];
    
    // Sort for "Tronco": Most losses first, then most goals conceded as tie-breaker
    const mostDefeats = Object.values(stats).sort((a, b) => {
        if (b.losses !== a.losses) return b.losses - a.losses; // Primary: Most losses
        return b.goalsConceded - a.goalsConceded; // Secondary: Most goals conceded
    })[0];

    return { topScorer, mostDefeats };
  };

  const getRoundName = (roundIdx: number, matchesInRound: Matchup[]) => {
    // Determine context based on the specific round being viewed
    const isThirdPlaceInRound = matchesInRound.some(m => m.isThirdPlace);
    
    // Logic: If it's the very last possible round of the tournament structure
    if (matchesInRound.length === 1 && !isThirdPlaceInRound) return "GRAN FINAL";
    if (isThirdPlaceInRound) return "Finales y 3er Puesto";
    if (matchesInRound.length === 2) return "Semifinales";
    if (matchesInRound.length === 4) return "Cuartos de Final";
    if (matchesInRound.length === 8) return "Octavos de Final";
    return `Ronda ${roundIdx + 1}`;
  };

  const fetchAnalysis = async () => {
    setLoadingAi(true);
    const result = await generateTournamentCommentary(tournamentType, displayedMatchups);
    setCommentary(result);
    setLoadingAi(false);
  };

  useEffect(() => {
    setCommentary(null);
  }, [matchups]);

  // Navigation Handlers
  const prevRound = () => setViewIndex(Math.max(0, viewIndex - 1));
  const nextRound = () => setViewIndex(Math.min(allRounds.length - 1, viewIndex + 1));

  // Determine if we should show the Podium View
  // We only show podium if:
  // 1. A champion is declared
  // 2. We are viewing the LATEST round (not history)
  const showPodiumView = championDeclared && champion && runnerUp && isViewingCurrentRound;

  // --- PODIUM VIEW ---
  if (showPodiumView) {
    const { topScorer, mostDefeats } = calculateAwards();
    
    return (
      <div className="w-full max-w-6xl mx-auto text-center animate-fade-in-up py-4 relative">
        
        {/* Navigation for Podium (To look back) */}
        <div className="absolute top-0 left-0 flex items-center gap-2 z-20">
            <Button 
                variant="secondary" 
                onClick={prevRound} 
                disabled={viewIndex === 0}
                className="px-3 py-2 h-10 rounded-full"
            >
                <ChevronLeft size={20} />
            </Button>
            <span className="text-xs text-gray-500 font-bold uppercase">Ver Historial</span>
        </div>

        {/* PODIUM CONTENT */}
        <div className="mb-12 relative mt-8">
          <h2 className="text-4xl font-bold text-yellow-400 mb-8 uppercase tracking-widest drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]">
            Podio del Torneo
          </h2>
          
          <div className="flex flex-col md:flex-row items-end justify-center gap-4 md:gap-8 h-auto md:h-96">
            
            {/* 2nd Place */}
            <div className="order-2 md:order-1 flex flex-col items-center animate-fade-in-up" style={{animationDelay: '0.2s'}}>
              <div className="mb-2">
                <TeamLogo src={runnerUp!.team.logo} alt={runnerUp!.team.name} className="w-16 h-16 object-contain drop-shadow-lg rounded-full" fallbackText={runnerUp!.team.name} />
              </div>
              <div className="text-gray-300 font-bold mb-1">{runnerUp!.player.name}</div>
              <div className="bg-gray-400/20 border border-gray-400 w-32 md:w-40 h-32 md:h-48 rounded-t-lg flex flex-col justify-end p-4 relative backdrop-blur-sm">
                 <div className="text-4xl font-bold text-gray-400">2</div>
                 <div className="text-xs uppercase text-gray-500">Subcampeón</div>
              </div>
            </div>

            {/* 1st Place */}
            <div className="order-1 md:order-2 flex flex-col items-center animate-fade-in-up z-10">
              <Trophy className="w-16 h-16 text-yellow-400 mb-2 drop-shadow-[0_0_15px_rgba(250,204,21,0.8)] animate-bounce" />
              <div className="mb-2">
                <TeamLogo src={champion!.team.logo} alt={champion!.team.name} className="w-24 h-24 object-contain drop-shadow-xl rounded-full" fallbackText={champion!.team.name} />
              </div>
              <div className="text-yellow-400 font-bold text-2xl mb-1">{champion!.player.name}</div>
              <div className="text-sm text-yellow-200/60 mb-2 font-light">{champion!.team.name}</div>
              <div className="bg-gradient-to-t from-yellow-600/40 to-yellow-400/10 border border-yellow-500 w-40 md:w-56 h-48 md:h-64 rounded-t-lg flex flex-col justify-end p-4 relative backdrop-blur-md shadow-[0_0_30px_rgba(250,204,21,0.2)]">
                 <div className="text-6xl font-bold text-yellow-400">1</div>
                 <div className="text-sm uppercase text-yellow-200">Campeón</div>
              </div>
            </div>

            {/* 3rd Place */}
            {thirdPlace ? (
              <div className="order-3 flex flex-col items-center animate-fade-in-up" style={{animationDelay: '0.4s'}}>
                <div className="mb-2">
                  <TeamLogo src={thirdPlace.team.logo} alt={thirdPlace.team.name} className="w-16 h-16 object-contain drop-shadow-lg rounded-full" fallbackText={thirdPlace.team.name} />
                </div>
                <div className="text-orange-300 font-bold mb-1">{thirdPlace.player.name}</div>
                <div className="bg-orange-700/20 border border-orange-600 w-32 md:w-40 h-24 md:h-36 rounded-t-lg flex flex-col justify-end p-4 relative backdrop-blur-sm shadow-[0_0_15px_rgba(234,88,12,0.2)]">
                   <div className="text-4xl font-bold text-orange-500">3</div>
                   <div className="text-xs uppercase text-orange-600">Tercer Lugar</div>
                </div>
              </div>
            ) : (
                /* Placeholder for balance if no 3rd place logic hit (unlikely with new logic) */
                 <div className="order-3 w-32 md:w-40 h-24 md:h-36 opacity-0"></div>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12 text-left max-w-4xl mx-auto">
          {/* Golden Boot */}
          {topScorer && (
            <div className="glass-panel p-6 rounded-2xl flex items-center gap-4 border-l-4 border-l-fifa-accent bg-black/40">
              <div className="bg-fifa-accent/10 p-4 rounded-full">
                <Zap className="w-8 h-8 text-fifa-accent" />
              </div>
              <div>
                <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Bota de Oro (Goleador)</h3>
                <div className="flex items-center gap-3">
                   <TeamLogo src={topScorer.logo} className="w-10 h-10 object-contain rounded-full" fallbackText={topScorer.name} />
                   <div>
                     <div className="text-xl font-bold text-white">{topScorer.name}</div>
                     <div className="text-cyan-400 font-medium text-sm">
                        {topScorer.goals} Goles
                     </div>
                   </div>
                </div>
              </div>
            </div>
          )}

          {/* Humiliation (Total Losses) */}
          {mostDefeats && (
            <div className="glass-panel p-6 rounded-2xl flex items-center gap-4 border-l-4 border-l-purple-500 bg-black/40">
              <div className="bg-purple-500/10 p-4 rounded-full">
                <Skull className="w-8 h-8 text-purple-500" />
              </div>
              <div>
                <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Premio "Tronco" (Más Goleado)</h3>
                <div className="flex items-center gap-3">
                   <TeamLogo src={mostDefeats.logo} className="w-10 h-10 object-contain opacity-50 grayscale rounded-full" fallbackText={mostDefeats.name} />
                   <div>
                     <div className="text-xl font-bold text-white">{mostDefeats.name}</div>
                     <div className="text-purple-400 font-medium text-sm">
                        {mostDefeats.losses} Derrotas ({mostDefeats.goalsConceded} Goles Recibidos)
                     </div>
                   </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Final Stats Table */}
        <div className="mb-12">
            <h3 className="text-2xl font-bold mb-4">Tabla General Final</h3>
            <AdvancedStatsView groups={groups} history={history} currentMatchups={matchups} />
        </div>

        {!readOnly && (
           <div className="flex justify-center">
             <Button onClick={onReset} variant="primary">
               <RefreshCw className="w-5 h-5 mr-2" />
               Iniciar Nuevo Torneo
             </Button>
           </div>
        )}
      </div>
    );
  }

  // --- GRID VIEW (Active or History) ---
  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 pb-12">
      
      {/* Header with Navigation */}
      <div className="text-center space-y-4 relative flex flex-col items-center">
        
        <div className="flex items-center justify-center gap-6 w-full">
            <Button 
                variant="secondary" 
                onClick={prevRound} 
                disabled={viewIndex === 0}
                className="rounded-full w-12 h-12 p-0 flex items-center justify-center border-white/20 hover:border-cyan-400"
            >
                <ChevronLeft size={24} />
            </Button>

            <div className="flex flex-col items-center min-w-[200px]">
                <h2 className="text-4xl font-bold uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
                {getRoundName(viewIndex, displayedMatchups)}
                </h2>
                <div className={`inline-block px-4 py-1 rounded-full text-sm font-semibold border mt-2 ${isHistoryView ? 'bg-gray-800 border-gray-600 text-gray-400' : 'bg-white/10 border-white/20 text-white'}`}>
                    {isHistoryView ? 'Historial (Solo Lectura)' : tournamentType}
                </div>
            </div>

            <Button 
                variant="secondary" 
                onClick={nextRound} 
                disabled={viewIndex === allRounds.length - 1}
                className="rounded-full w-12 h-12 p-0 flex items-center justify-center border-white/20 hover:border-cyan-400"
            >
                <ChevronRight size={24} />
            </Button>
        </div>
        
        {/* Toggle Stats Button */}
        <div className="absolute top-0 right-0 hidden md:block">
           <Button variant="secondary" onClick={() => setShowStats(!showStats)} className="text-xs px-3 py-2">
             <BarChart3 size={16} className="mr-2" />
             {showStats ? 'Ocultar Estadísticas' : 'Ver Estadísticas Avanzadas'}
           </Button>
        </div>
      </div>

      {/* Advanced Stats Overlay/Collapse */}
      {showStats && (
        <div className="glass-panel p-6 rounded-2xl animate-fade-in-up border-cyan-500/30">
           <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold flex items-center gap-2 text-cyan-400"><BarChart3 size={20} /> Centro de Estadísticas</h3>
              <Button variant="secondary" onClick={() => setShowStats(false)} className="text-xs py-1 px-2 h-auto">Cerrar</Button>
           </div>
           <AdvancedStatsView groups={groups} history={history} currentMatchups={matchups} />
        </div>
      )}

      {/* Matchups Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {displayedMatchups.map((match) => (
          <div key={match.id} className="relative group">
            
            {/* Third Place Label */}
            {match.isThirdPlace && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-orange-600 text-white text-xs font-bold px-3 py-1 rounded-full z-20 shadow-lg border border-orange-400">
                 POR EL 3er LUGAR
              </div>
            )}

            {/* Connection Line Visual */}
            <div className={`absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-2xl blur-xl transition-all ${match.winnerId ? 'opacity-20' : 'group-hover:blur-2xl'}`}></div>
            
            <div className={`relative bg-gray-900 border ${match.winnerId ? 'border-green-500/30' : match.isThirdPlace ? 'border-orange-500/30' : 'border-white/10'} rounded-2xl p-6 flex flex-col items-center justify-center gap-0 transition-all overflow-hidden`}>
              
              {match.winnerId && (
                <div className="absolute top-2 right-2 p-1">
                  <CheckCircle2 className="text-green-500 w-5 h-5" />
                </div>
              )}

              {/* VS Badge */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none">
                <div className="bg-black border border-white/20 rounded-full w-10 h-10 flex items-center justify-center font-bold text-xs text-fifa-accent shadow-xl">
                  VS
                </div>
              </div>

              {/* Player 1 */}
              <div className={`w-full flex items-center justify-between gap-4 pb-4 border-b border-white/5 transition-all rounded-lg p-2 ${match.winnerId === match.player1.player.id ? 'bg-green-900/10' : ''} ${match.winnerId && match.winnerId !== match.player1.player.id ? 'opacity-40 grayscale' : ''}`}>
                <div 
                  className={`text-right flex-1 flex flex-col items-end ${isInteractive ? 'cursor-pointer' : ''}`}
                  onClick={() => isInteractive && onMatchUpdate(match.id, { winnerId: match.player1.player.id })}
                >
                  <h3 className="font-bold text-xl text-white leading-tight">{match.player1.player.name}</h3>
                  <div className="flex items-center gap-1 mt-1">
                     <span className="text-xs text-gray-400 font-semibold uppercase">{match.player1.team.name}</span>
                  </div>
                </div>
                
                {/* Score Input P1 */}
                <input 
                  type="number" 
                  min="0"
                  placeholder="0"
                  disabled={!isInteractive}
                  className={`w-14 h-12 bg-black/50 border border-white/20 rounded-lg text-center text-2xl font-bold focus:border-fifa-accent focus:outline-none z-20 ${!isInteractive ? 'text-gray-300 border-transparent bg-black/20 cursor-default' : ''}`}
                  value={match.score1 ?? ''}
                  onChange={(e) => onMatchUpdate(match.id, { score1: parseInt(e.target.value) || 0 })}
                  onClick={(e) => e.stopPropagation()}
                />

                {/* Team Logo & Star Player */}
                <div className="flex flex-col items-center w-20 flex-shrink-0">
                  <div className="w-16 h-16 relative flex items-center justify-center">
                    <TeamLogo 
                      src={match.player1.team.logo} 
                      alt={match.player1.team.name}
                      fallbackText={match.player1.team.name}
                      className="w-full h-full object-contain drop-shadow-md transition-transform transform hover:scale-110 rounded-full"
                    />
                    {match.winnerId === match.player1.player.id && (
                       <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-1 border-2 border-black"><Medal size={10} className="text-black" /></div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 mt-1 bg-black/40 px-2 py-0.5 rounded-full border border-white/5">
                    <Star size={8} className="text-yellow-400 fill-yellow-400" />
                    <span className="text-[10px] text-yellow-100 font-bold whitespace-nowrap overflow-hidden max-w-[60px] text-ellipsis">
                      {match.player1.team.starPlayer}
                    </span>
                  </div>
                </div>
              </div>

              {/* Player 2 */}
              <div className="w-full pt-4">
                 {match.player2 ? (
                   <div className={`w-full flex items-center justify-between gap-4 transition-all rounded-lg p-2 ${match.winnerId === match.player2.player.id ? 'bg-green-900/10' : ''} ${match.winnerId && match.winnerId !== match.player2.player.id ? 'opacity-40 grayscale' : ''}`}>
                    
                    {/* Team Logo & Star Player */}
                    <div className="flex flex-col items-center w-20 flex-shrink-0">
                      <div className="w-16 h-16 relative flex items-center justify-center">
                        <TeamLogo 
                          src={match.player2.team.logo} 
                          alt={match.player2.team.name}
                          fallbackText={match.player2.team.name}
                          className="w-full h-full object-contain drop-shadow-md transition-transform transform hover:scale-110 rounded-full"
                        />
                         {match.winnerId === match.player2.player.id && (
                           <div className="absolute -top-1 -left-1 bg-green-500 rounded-full p-1 border-2 border-black"><Medal size={10} className="text-black" /></div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 mt-1 bg-black/40 px-2 py-0.5 rounded-full border border-white/5">
                        <Star size={8} className="text-yellow-400 fill-yellow-400" />
                        <span className="text-[10px] text-yellow-100 font-bold whitespace-nowrap overflow-hidden max-w-[60px] text-ellipsis">
                          {match.player2.team.starPlayer}
                        </span>
                      </div>
                    </div>

                    {/* Score Input P2 */}
                    <input 
                      type="number" 
                      min="0"
                      placeholder="0"
                      disabled={!isInteractive}
                      className={`w-14 h-12 bg-black/50 border border-white/20 rounded-lg text-center text-2xl font-bold focus:border-fifa-accent focus:outline-none z-20 ${!isInteractive ? 'text-gray-300 border-transparent bg-black/20 cursor-default' : ''}`}
                      value={match.score2 ?? ''}
                      onChange={(e) => onMatchUpdate(match.id, { score2: parseInt(e.target.value) || 0 })}
                      onClick={(e) => e.stopPropagation()}
                    />

                    <div 
                      className={`text-left flex-1 flex flex-col items-start ${isInteractive ? 'cursor-pointer' : ''}`}
                      onClick={() => isInteractive && onMatchUpdate(match.id, { winnerId: match.player2!.player.id })}
                    >
                      <h3 className="font-bold text-xl text-white leading-tight">{match.player2.player.name}</h3>
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-xs text-purple-400 font-semibold uppercase">{match.player2.team.name}</span>
                      </div>
                    </div>
                   </div>
                 ) : (
                   <div className="w-full text-center text-gray-500 italic py-4 bg-white/5 rounded-lg border border-dashed border-white/10">
                     Pase directo (BYE)
                   </div>
                 )}
              </div>

            </div>
          </div>
        ))}
      </div>

      {/* Actions (Only show Next/Reset buttons if we are viewing the current active round) */}
      {!readOnly && isViewingCurrentRound && (
        <div className="flex flex-col items-center gap-4 mt-8">
            {allMatchesDecided && (
            <div className="animate-fade-in-up">
                <Button onClick={onNextRound} variant="primary" className="text-xl px-12 py-4">
                {isFinalStage ? 'Ver Resultados Finales' : 'Sorteo Siguiente Ronda'}
                {!isFinalStage && <ArrowRight className="w-6 h-6 ml-2" />}
                {isFinalStage && <Trophy className="w-6 h-6 ml-2" />}
                </Button>
            </div>
            )}
        </div>
      )}

      {/* AI Commentary Section */}
      {!readOnly && isViewingCurrentRound && (
      <div className="glass-panel rounded-3xl p-8 border border-fifa-accent/30 mt-12">
        <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-3">
            <Sparkles className="text-yellow-400 animate-pulse" />
            <h3 className="text-2xl font-bold">Análisis de la IA</h3>
          </div>
          {!commentary && (
            <Button onClick={fetchAnalysis} isLoading={loadingAi} variant="secondary">
              Generar Predicción
            </Button>
          )}
        </div>

        {loadingAi && (
          <div className="space-y-3 animate-pulse">
            <div className="h-4 bg-white/10 rounded w-3/4"></div>
            <div className="h-4 bg-white/10 rounded w-full"></div>
            <div className="h-4 bg-white/10 rounded w-5/6"></div>
          </div>
        )}

        {commentary && (
          <div className="bg-black/30 rounded-xl p-6 text-gray-200 leading-relaxed whitespace-pre-line border border-white/5 shadow-inner">
            {commentary}
          </div>
        )}
      </div>
      )}
      
      {/* Show reset if viewing current round and it's not finished, OR if we are just navigating history */}
      {!allMatchesDecided && !readOnly && isViewingCurrentRound && (
        <div className="flex justify-center pt-8">
          <Button onClick={onReset} variant="secondary" className="opacity-50 hover:opacity-100">
            <RefreshCw className="w-5 h-5 mr-2" />
            Reiniciar Torneo
          </Button>
        </div>
      )}
    </div>
  );
};