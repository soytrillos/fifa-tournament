import React from 'react';
import { Matchup, Assignment } from '../types';
import { CheckCircle2, Trophy, Medal } from 'lucide-react';
import { TeamLogo } from './TeamLogo';

interface Props {
  history: Matchup[][];
  currentMatchups: Matchup[];
  onMatchClick: (match: Matchup) => void;
  champion: Assignment | null;
}

export const BracketView: React.FC<Props> = ({ history, currentMatchups, onMatchClick, champion }) => {
  // Combine history and current to create columns
  // Filter out 3rd place matches from the main tree (display them separately)
  const allRounds = [...history, currentMatchups];
  
  // Separate Main Bracket matches from Third Place matches
  const mainBracketRounds = allRounds.map(round => round.filter(m => !m.isThirdPlace));
  const thirdPlaceMatch = allRounds.flat().find(m => m.isThirdPlace);

  return (
    <div className="w-full overflow-x-auto pb-12">
      <div className="min-w-[1000px] flex flex-row justify-center items-stretch gap-8 px-8">
        
        {mainBracketRounds.map((roundMatches, roundIndex) => {
          const isLastRound = roundIndex === mainBracketRounds.length - 1;
          // Determine round name
          let roundName = `Ronda ${roundIndex + 1}`;
          if (roundMatches.length === 8) roundName = "Octavos";
          if (roundMatches.length === 4) roundName = "Cuartos";
          if (roundMatches.length === 2) roundName = "Semifinal";
          if (roundMatches.length === 1) roundName = "Final";

          return (
            <div key={roundIndex} className="flex flex-col flex-1 relative">
              <h3 className="text-center text-cyan-400 font-bold uppercase tracking-widest mb-6 sticky left-0">
                {roundName}
              </h3>
              
              <div className="flex flex-col justify-around flex-grow gap-8">
                {roundMatches.map((match, matchIndex) => (
                  <div key={match.id} className="relative flex items-center">
                    
                    {/* The Match Card */}
                    <div 
                      onClick={() => onMatchClick(match)}
                      className={`
                        w-64 bg-gray-900 border transition-all duration-300 relative z-10 cursor-pointer group
                        ${match.winnerId ? 'border-green-500/50' : 'border-white/10 hover:border-cyan-400'}
                        rounded-xl overflow-hidden shadow-xl
                      `}
                    >
                      {/* Player 1 */}
                      <div className={`p-3 flex justify-between items-center border-b border-white/5 ${match.winnerId === match.player1.player.id ? 'bg-green-900/20' : ''}`}>
                        <div className="flex items-center gap-3 overflow-hidden">
                           <TeamLogo src={match.player1.team.logo} className="w-8 h-8 object-contain rounded-full" alt={match.player1.team.name} fallbackText={match.player1.team.name} />
                           <div className="flex flex-col overflow-hidden">
                              <span className="truncate text-xs font-bold text-gray-200 uppercase">{match.player1.team.name}</span>
                              <span className="text-[10px] text-gray-400 truncate">{match.player1.player.name}</span>
                           </div>
                        </div>
                        <span className="font-mono font-bold text-lg">{match.score1 ?? '-'}</span>
                      </div>

                      {/* Player 2 */}
                      <div className={`p-3 flex justify-between items-center ${match.winnerId && match.player2 && match.winnerId === match.player2.player.id ? 'bg-green-900/20' : ''}`}>
                        <div className="flex items-center gap-3 overflow-hidden">
                           {match.player2 ? (
                             <>
                               <TeamLogo src={match.player2.team.logo} className="w-8 h-8 object-contain rounded-full" alt={match.player2.team.name} fallbackText={match.player2.team.name} />
                               <div className="flex flex-col overflow-hidden">
                                  <span className="truncate text-xs font-bold text-gray-200 uppercase">{match.player2.team.name}</span>
                                  <span className="text-[10px] text-gray-400 truncate">{match.player2.player.name}</span>
                               </div>
                             </>
                           ) : (
                             <span className="text-sm italic text-gray-500">BYE</span>
                           )}
                        </div>
                        {match.player2 && (
                          <span className="font-mono font-bold text-lg">{match.score2 ?? '-'}</span>
                        )}
                      </div>
                    </div>

                    {/* Connecting Lines */}
                    {!isLastRound && (
                      <div className="absolute left-full top-1/2 w-8 h-[1px] bg-white/20 z-0"></div>
                    )}
                    
                    {/* Right Bracket Connector Logic (Simplified visual) */}
                    {!isLastRound && matchIndex % 2 === 0 && (
                      <div className="absolute left-[calc(100%+2rem)] top-1/2 w-[1px] bg-white/20 h-[calc(100%+2rem)] border-r border-white/20 z-0 pointer-events-none transform translate-y-1/2"></div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Champion Display & 3rd Place */}
      <div className="mt-12 flex flex-col items-center justify-center gap-8 border-t border-white/10 pt-8">
        
        {/* Champion */}
        {champion && (
          <div className="animate-fade-in-up text-center">
            <h3 className="text-yellow-400 font-bold uppercase tracking-widest mb-4 flex items-center justify-center gap-2">
              <Trophy className="w-6 h-6" /> Campeón
            </h3>
            <div className="bg-gradient-to-b from-yellow-600/20 to-black border border-yellow-500/50 p-6 rounded-2xl flex items-center gap-4">
              <div className="w-20 h-20 rounded-lg shadow-lg flex items-center justify-center bg-black/50 p-2">
                <TeamLogo src={champion.team.logo} className="w-full h-full object-contain rounded-full" alt="champion" fallbackText={champion.team.name} />
              </div>
              <div className="text-left">
                <div className="text-2xl font-bold text-white">{champion.player.name}</div>
                <div className="text-yellow-400">{champion.team.name}</div>
              </div>
            </div>
          </div>
        )}

        {/* Third Place Match Display */}
        {thirdPlaceMatch && (
          <div className="animate-fade-in-up text-center mt-4">
            <h3 className="text-orange-400 font-bold uppercase tracking-widest mb-4 flex items-center justify-center gap-2">
              <Medal className="w-6 h-6" /> Tercer Puesto
            </h3>
            
             <div 
                onClick={() => onMatchClick(thirdPlaceMatch)}
                className={`
                  w-80 mx-auto bg-gray-900 border transition-all duration-300 cursor-pointer
                  ${thirdPlaceMatch.winnerId ? 'border-orange-500/50' : 'border-white/10 hover:border-orange-400'}
                  rounded-xl overflow-hidden shadow-xl
                `}
              >
                 <div className="flex flex-col">
                    <div className={`p-4 flex justify-between items-center border-b border-white/5 ${thirdPlaceMatch.winnerId === thirdPlaceMatch.player1.player.id ? 'bg-orange-900/20' : ''}`}>
                      <div className="flex items-center gap-3">
                         <TeamLogo src={thirdPlaceMatch.player1.team.logo} className="w-10 h-10 object-contain rounded-full" fallbackText={thirdPlaceMatch.player1.team.name} />
                         <div className="text-left">
                           <div className="font-bold text-gray-200 leading-none">{thirdPlaceMatch.player1.team.name}</div>
                           <div className="text-xs text-gray-500">{thirdPlaceMatch.player1.player.name}</div>
                         </div>
                      </div>
                      <span className="font-mono text-xl font-bold">{thirdPlaceMatch.score1 ?? '-'}</span>
                    </div>

                    <div className={`p-4 flex justify-between items-center ${thirdPlaceMatch.winnerId && thirdPlaceMatch.player2 && thirdPlaceMatch.winnerId === thirdPlaceMatch.player2.player.id ? 'bg-orange-900/20' : ''}`}>
                      <div className="flex items-center gap-3">
                         {thirdPlaceMatch.player2 && (
                           <>
                           <TeamLogo src={thirdPlaceMatch.player2.team.logo} className="w-10 h-10 object-contain rounded-full" fallbackText={thirdPlaceMatch.player2.team.name} />
                           <div className="text-left">
                             <div className="font-bold text-gray-200 leading-none">{thirdPlaceMatch.player2.team.name}</div>
                             <div className="text-xs text-gray-500">{thirdPlaceMatch.player2.player.name}</div>
                           </div>
                           </>
                         )}
                      </div>
                      <span className="font-mono text-xl font-bold">{thirdPlaceMatch.score2 ?? '-'}</span>
                    </div>
                 </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};