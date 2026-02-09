
import React from 'react';
import { Group, Matchup, MatchStatus } from '../types';
import { Button } from './Button';
import { Trophy, ArrowRight, Shield, Users, Play, CheckCircle, Square, Clock } from 'lucide-react';
import { TeamLogo } from './TeamLogo';

interface Props {
  groups: Group[];
  onMatchUpdate: (groupId: string, matchId: string, updates: Partial<Matchup>) => void;
  onAdvanceToBracket: () => void;
  readOnly?: boolean;
}

export const GroupStageView: React.FC<Props> = ({ groups, onMatchUpdate, onAdvanceToBracket, readOnly = false }) => {
  
  // Helper to calculate table stats
  const getTable = (group: Group) => {
    const stats: Record<string, { p: number, w: number, d: number, l: number, gf: number, ga: number, pts: number }> = {};
    
    // Initialize
    group.assignments.forEach(a => {
      stats[a.player.id] = { p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 };
    });

    // Calc from matches
    group.matches.forEach(m => {
      // Only count matches that are explicitly finished OR have both scores and are not scheduled
      // Using scores presence as legacy fallback, but preferring status if available
      const isFinished = m.status === MatchStatus.FINISHED || (m.status !== MatchStatus.SCHEDULED && m.score1 !== undefined && m.score2 !== undefined && m.player2);

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

  const allMatchesPlayed = groups.every(g => g.matches.every(m => m.status === MatchStatus.FINISHED || m.winnerId !== undefined));

  // Extract all assignments for the roster view
  const allAssignments = groups.flatMap(g => g.assignments).sort((a, b) => a.player.name.localeCompare(b.player.name));

  const handleStatusChange = (groupId: string, match: Matchup) => {
    if (!match.status || match.status === MatchStatus.SCHEDULED) {
        // Start Match
        onMatchUpdate(groupId, match.id, { status: MatchStatus.IN_PROGRESS });
    } else if (match.status === MatchStatus.IN_PROGRESS) {
        // Finish Match (Auto calculate winner if needed)
        const s1 = match.score1 || 0;
        const s2 = match.score2 || 0;
        let winnerId = null;
        if (s1 > s2) winnerId = match.player1.player.id;
        else if (s2 > s1) winnerId = match.player2?.player.id;

        onMatchUpdate(groupId, match.id, { 
            status: MatchStatus.FINISHED,
            winnerId
        });
    } else {
        // Re-open match
        onMatchUpdate(groupId, match.id, { status: MatchStatus.IN_PROGRESS });
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-12">
      <div className="text-center">
        <h2 className="text-4xl font-bold uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
          Fase de Grupos
        </h2>
        <p className="text-gray-400 mt-2">Los 2 mejores de cada grupo avanzan al cuadro final</p>
      </div>

      {/* Roster Section */}
      <div className="animate-fade-in-up">
        <div className="flex items-center gap-3 mb-6">
            <div className="bg-white/10 p-2 rounded-lg">
                <Users className="text-cyan-400 w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold text-white uppercase tracking-wider">Participantes y Equipos</h3>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {allAssignments.map((assignment) => (
                <div key={assignment.player.id} className="bg-black/40 border border-white/10 rounded-xl p-4 flex items-center gap-4 hover:bg-white/5 transition-colors group">
                    <div className="w-12 h-12 flex-shrink-0 relative">
                        <TeamLogo 
                            src={assignment.team.logo} 
                            alt={assignment.team.name} 
                            fallbackText={assignment.team.name}
                            className="w-full h-full object-contain drop-shadow-md group-hover:scale-110 transition-transform"
                        />
                    </div>
                    <div className="min-w-0">
                        <div className="font-bold text-white truncate text-lg leading-tight">{assignment.player.name}</div>
                        <div className="text-xs text-cyan-400 font-bold uppercase truncate">{assignment.team.name}</div>
                        <div className="text-[10px] text-gray-500 flex items-center gap-1 mt-0.5">
                            ⭐ {assignment.team.starPlayer}
                        </div>
                    </div>
                </div>
            ))}
        </div>
      </div>

      <div className="border-t border-white/10 my-8"></div>

      {/* Groups Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {groups.map(group => {
          const table = getTable(group);
          return (
            <div key={group.id} className="glass-panel p-6 rounded-2xl border border-white/10">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
                <div className="bg-cyan-500/20 p-2 rounded-lg">
                  <Shield className="text-cyan-400 w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold text-white">Grupo {group.id}</h3>
              </div>

              {/* Matches */}
              <div className="mb-8 space-y-3">
                <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Partidos</h4>
                {group.matches.map(match => {
                    const status = match.status || MatchStatus.SCHEDULED;
                    return (
                    <div key={match.id} className={`flex items-center justify-between bg-black/40 p-3 rounded-lg border transition-colors ${status === MatchStatus.IN_PROGRESS ? 'border-red-500/50 bg-red-900/10' : 'border-white/5'}`}>
                        {/* Status Button Control */}
                        {!readOnly && (
                            <button 
                                onClick={() => handleStatusChange(group.id, match)}
                                className={`mr-2 p-2 rounded-full transition-colors ${
                                    status === MatchStatus.IN_PROGRESS ? 'bg-red-600 text-white animate-pulse' : 
                                    status === MatchStatus.FINISHED ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-400 hover:text-white'
                                }`}
                                title={status === MatchStatus.IN_PROGRESS ? "Terminar Partido" : status === MatchStatus.FINISHED ? "Reiniciar" : "Iniciar Partido"}
                            >
                                {status === MatchStatus.IN_PROGRESS ? <Square size={12} fill="currentColor" /> : 
                                 status === MatchStatus.FINISHED ? <CheckCircle size={12} /> : <Play size={12} fill="currentColor" />}
                            </button>
                        )}
                        
                        <div className="flex-1 text-right text-sm flex items-center justify-end gap-2">
                        <span className="text-xs text-gray-500 truncate max-w-[60px]">{match.player1.player.name}</span>
                        <span className="font-bold text-gray-200 truncate">{match.player1.team.name}</span>
                        <TeamLogo src={match.player1.team.logo} className="w-6 h-6 object-contain rounded-full" fallbackText={match.player1.team.name} />
                        </div>
                        
                        <div className="flex items-center gap-2 mx-3">
                        <input 
                            type="number" 
                            disabled={readOnly}
                            className={`w-8 h-8 bg-white/10 text-center rounded text-white font-bold focus:bg-fifa-accent/20 outline-none ${readOnly ? 'border-none bg-transparent' : ''}`}
                            value={match.score1 ?? ''}
                            onChange={(e) => onMatchUpdate(group.id, match.id, { score1: parseInt(e.target.value) || 0 })}
                        />
                        <span className="text-gray-500">-</span>
                        <input 
                            type="number" 
                            disabled={readOnly}
                            className={`w-8 h-8 bg-white/10 text-center rounded text-white font-bold focus:bg-fifa-accent/20 outline-none ${readOnly ? 'border-none bg-transparent' : ''}`}
                            value={match.score2 ?? ''}
                            onChange={(e) => onMatchUpdate(group.id, match.id, { score2: parseInt(e.target.value) || 0 })}
                        />
                        </div>

                        <div className="flex-1 text-left text-sm flex items-center justify-start gap-2">
                        <TeamLogo src={match.player2!.team.logo} className="w-6 h-6 object-contain rounded-full" fallbackText={match.player2!.team.name} />
                        <span className="font-bold text-gray-200 truncate">{match.player2!.team.name}</span>
                        <span className="text-xs text-gray-500 truncate max-w-[60px]">{match.player2!.player.name}</span>
                        </div>
                    </div>
                )})}
              </div>

              {/* Table */}
              <div>
                <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Tabla de Posiciones</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-gray-400 border-b border-white/10">
                        <th className="text-left py-2">Equipo</th>
                        <th className="text-center py-2">PJ</th>
                        <th className="text-center py-2">DG</th>
                        <th className="text-center py-2 text-white">PTS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {table.map((row, i) => (
                        <tr key={row.player.id} className={`border-b border-white/5 ${i < 2 ? 'bg-green-500/10' : ''}`}>
                          <td className="py-2 flex items-center gap-2">
                             <span className="text-gray-500 font-mono w-4">{i+1}</span>
                             <TeamLogo src={row.team.logo} className="w-6 h-6 object-contain rounded-full" alt={row.team.name} fallbackText={row.team.name} />
                             <div className="flex flex-col">
                               <span className="font-bold text-gray-200">{row.team.name}</span>
                               <span className="text-[10px] text-gray-500">{row.player.name}</span>
                             </div>
                          </td>
                          <td className="text-center text-gray-400">{row.p}</td>
                          <td className="text-center text-gray-400">{row.gf - row.ga}</td>
                          <td className="text-center font-bold text-white">{row.pts}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {!readOnly && (
      <div className="flex justify-center pt-8">
        <Button 
          onClick={onAdvanceToBracket} 
          disabled={!allMatchesPlayed}
          variant="primary" 
          className="text-xl px-12 py-4"
        >
          Finalizar Fase de Grupos
          <ArrowRight className="w-6 h-6 ml-2" />
        </Button>
      </div>
      )}
    </div>
  );
};
