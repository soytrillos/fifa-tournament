import React, { useMemo, useState } from 'react';
import { Matchup, Group } from '../types';
import { Shield, Swords, Activity, X, Calendar, User, Shirt } from 'lucide-react';
import { TeamLogo } from './TeamLogo';

interface Props {
  groups: Group[];
  history: Matchup[][];
  currentMatchups: Matchup[];
}

interface MatchRecord {
  stage: string;
  opponentName: string;
  opponentTeam: string;
  opponentLogo: string;
  scoreOwn: number;
  scoreOpp: number;
  result: 'W' | 'L' | 'D';
}

interface PlayerStats {
  id: string;
  name: string;
  teamName: string;
  teamLogo: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  gf: number;
  ga: number;
  gd: number;
  points: number;
  form: string[]; // ['W', 'L', 'W']
  matchHistory: MatchRecord[];
}

export const AdvancedStatsView: React.FC<Props> = ({ groups, history, currentMatchups }) => {
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  
  const stats = useMemo(() => {
    const playerStats: Record<string, PlayerStats> = {};

    // Helper to identify stage
    const getStageLabel = (matchId: string, isThirdPlace?: boolean, totalTeams?: number) => {
        if (matchId.startsWith('g')) return 'Fase de Grupos';
        if (isThirdPlace) return '3er Puesto';
        // Simple heuristic for bracket rounds based on ID convention 'round-X-match-Y'
        if (matchId.includes('round-')) {
            const parts = matchId.split('-');
            const r = parseInt(parts[1]);
            return `Eliminatoria (R${r})`;
        }
        return 'Torneo';
    };

    // Helper to process a match
    const processMatch = (m: Matchup) => {
      // Only process played matches (has scores)
      if (m.score1 === undefined || m.score2 === undefined || !m.player2) return;

      const p1 = m.player1;
      const p2 = m.player2;

      // Init P1
      if (!playerStats[p1.player.id]) {
        playerStats[p1.player.id] = {
          id: p1.player.id, name: p1.player.name, teamName: p1.team.name, teamLogo: p1.team.logo,
          played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0, gd: 0, points: 0, form: [], matchHistory: []
        };
      }
      // Init P2
      if (!playerStats[p2.player.id]) {
        playerStats[p2.player.id] = {
          id: p2.player.id, name: p2.player.name, teamName: p2.team.name, teamLogo: p2.team.logo,
          played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0, gd: 0, points: 0, form: [], matchHistory: []
        };
      }

      const s1 = playerStats[p1.player.id];
      const s2 = playerStats[p2.player.id];

      s1.played++;
      s2.played++;
      s1.gf += m.score1;
      s1.ga += m.score2;
      s1.gd += (m.score1 - m.score2);
      
      s2.gf += m.score2;
      s2.ga += m.score1;
      s2.gd += (m.score2 - m.score1);

      // Result Logic
      let res1: 'W'|'L'|'D' = 'D';
      let res2: 'W'|'L'|'D' = 'D';

      if (m.score1 > m.score2) {
        s1.wins++; s2.losses++; s1.points += 3;
        res1 = 'W'; res2 = 'L';
      } else if (m.score2 > m.score1) {
        s2.wins++; s1.losses++; s2.points += 3;
        res1 = 'L'; res2 = 'W';
      } else {
        // Draw logic (check PK winner)
        if (m.winnerId === p1.player.id) {
            s1.wins++; s2.losses++; s1.points += 2; s2.points += 1;
            res1 = 'W'; res2 = 'L';
        } else if (m.winnerId === p2.player.id) {
            s2.wins++; s1.losses++; s2.points += 2; s1.points += 1;
            res1 = 'L'; res2 = 'W';
        } else {
            s1.draws++; s2.draws++; s1.points += 1; s2.points += 1;
        }
      }

      s1.form.push(res1);
      s2.form.push(res2);

      // Add History Record
      const stageName = getStageLabel(m.id, m.isThirdPlace);
      
      s1.matchHistory.push({
        stage: stageName,
        opponentName: p2.player.name,
        opponentTeam: p2.team.name,
        opponentLogo: p2.team.logo,
        scoreOwn: m.score1,
        scoreOpp: m.score2,
        result: res1
      });

      s2.matchHistory.push({
        stage: stageName,
        opponentName: p1.player.name,
        opponentTeam: p1.team.name,
        opponentLogo: p1.team.logo,
        scoreOwn: m.score2,
        scoreOpp: m.score1,
        result: res2
      });
    };

    // 1. Process Groups
    groups.forEach(g => g.matches.forEach(processMatch));

    // 2. Process History (Brackets)
    history.forEach(round => round.forEach(processMatch));

    // 3. Process Current Active Matches (if they have scores)
    currentMatchups.forEach(processMatch);

    return Object.values(playerStats).sort((a, b) => {
        // Sort Priority: Points/Wins -> Goal Diff -> Goals For
        if (b.points !== a.points) return b.points - a.points;
        if (b.wins !== a.wins) return b.wins - a.wins;
        if (b.gd !== a.gd) return b.gd - a.gd;
        return b.gf - a.gf;
    });

  }, [groups, history, currentMatchups]);

  const bestAttack = [...stats].sort((a, b) => (b.gf / (b.played || 1)) - (a.gf / (a.played || 1)))[0];
  const bestDefense = [...stats].sort((a, b) => (a.ga / (a.played || 1)) - (b.ga / (b.played || 1)))[0];

  const selectedPlayerData = selectedPlayerId ? stats.find(p => p.id === selectedPlayerId) : null;

  return (
    <div className="w-full animate-fade-in-up">
      
      {/* Detail Modal */}
      {selectedPlayerData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedPlayerId(null)}>
            <div className="bg-[#0f172a] border border-cyan-500/30 rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
                
                {/* Modal Header */}
                <div className="p-6 border-b border-white/10 flex justify-between items-start bg-gradient-to-r from-cyan-900/20 to-transparent">
                    <div className="flex items-center gap-4">
                        <div className="w-20 h-20 bg-black/40 rounded-xl p-2 border border-white/10 flex items-center justify-center">
                            <TeamLogo src={selectedPlayerData.teamLogo} alt={selectedPlayerData.teamName} className="w-full h-full object-contain" fallbackText={selectedPlayerData.teamName} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                {selectedPlayerData.name}
                            </h2>
                            <div className="text-cyan-400 font-medium flex items-center gap-2">
                                <Shirt size={16} />
                                {selectedPlayerData.teamName}
                            </div>
                            <div className="mt-2 flex gap-3 text-xs text-gray-400">
                                <span className="bg-white/5 px-2 py-1 rounded">PJ: {selectedPlayerData.played}</span>
                                <span className="bg-green-500/10 text-green-400 px-2 py-1 rounded">G: {selectedPlayerData.wins}</span>
                                <span className="bg-red-500/10 text-red-400 px-2 py-1 rounded">P: {selectedPlayerData.losses}</span>
                            </div>
                        </div>
                    </div>
                    <button onClick={() => setSelectedPlayerId(null)} className="text-gray-400 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Match History List */}
                <div className="p-6 overflow-y-auto custom-scrollbar">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-2">
                        <Calendar size={16} /> Historial de Partidos
                    </h3>
                    
                    <div className="space-y-3">
                        {selectedPlayerData.matchHistory.map((match, idx) => (
                            <div key={idx} className="flex items-center justify-between bg-white/5 rounded-lg p-4 border border-white/5 hover:bg-white/10 transition-colors">
                                <div className="flex flex-col w-1/4">
                                    <span className="text-[10px] text-gray-500 uppercase font-bold">{match.stage}</span>
                                    <span className={`text-xs font-bold ${match.result === 'W' ? 'text-green-400' : match.result === 'L' ? 'text-red-400' : 'text-gray-400'}`}>
                                        {match.result === 'W' ? 'VICTORIA' : match.result === 'L' ? 'DERROTA' : 'EMPATE'}
                                    </span>
                                </div>

                                <div className="flex items-center gap-4 flex-1 justify-center">
                                    <div className="text-2xl font-bold text-white">{match.scoreOwn}</div>
                                    <div className="text-gray-500">-</div>
                                    <div className="text-2xl font-bold text-gray-400">{match.scoreOpp}</div>
                                </div>

                                <div className="flex items-center justify-end gap-3 w-1/3 text-right">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-gray-200 text-sm">{match.opponentName}</span>
                                        <span className="text-xs text-gray-500">{match.opponentTeam}</span>
                                    </div>
                                    <TeamLogo src={match.opponentLogo} className="w-8 h-8 object-contain opacity-80 rounded-full" fallbackText={match.opponentTeam} />
                                </div>
                            </div>
                        ))}
                        {selectedPlayerData.matchHistory.length === 0 && (
                            <div className="text-center text-gray-500 py-8">No hay partidos registrados aún.</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {bestAttack && (
            <div className="bg-gradient-to-r from-red-900/40 to-orange-900/40 border border-red-500/30 p-4 rounded-xl flex items-center justify-between">
                <div>
                    <div className="text-xs text-red-400 font-bold uppercase mb-1 flex items-center gap-2"><Swords size={14} /> Mejor Ataque</div>
                    <div className="font-bold text-lg text-white">{bestAttack.name}</div>
                    <div className="text-xs text-gray-400">{bestAttack.teamName}</div>
                </div>
                <div className="text-right">
                    <div className="text-2xl font-bold text-white">{(bestAttack.gf / (bestAttack.played || 1)).toFixed(1)}</div>
                    <div className="text-[10px] text-gray-400 uppercase">Goles / Partido</div>
                </div>
            </div>
        )}
        {bestDefense && (
            <div className="bg-gradient-to-r from-blue-900/40 to-cyan-900/40 border border-blue-500/30 p-4 rounded-xl flex items-center justify-between">
                <div>
                    <div className="text-xs text-blue-400 font-bold uppercase mb-1 flex items-center gap-2"><Shield size={14} /> Muro Defensivo</div>
                    <div className="font-bold text-lg text-white">{bestDefense.name}</div>
                    <div className="text-xs text-gray-400">{bestDefense.teamName}</div>
                </div>
                <div className="text-right">
                    <div className="text-2xl font-bold text-white">{(bestDefense.ga / (bestDefense.played || 1)).toFixed(1)}</div>
                    <div className="text-[10px] text-gray-400 uppercase">Goles Rec / Partido</div>
                </div>
            </div>
        )}
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/10 bg-black/40">
        <table className="w-full text-sm text-left">
          <thead className="bg-white/5 text-gray-400 font-semibold uppercase text-xs tracking-wider">
            <tr>
              <th className="p-4 rounded-tl-xl">#</th>
              <th className="p-4">Jugador / Equipo</th>
              <th className="p-4 text-center hidden sm:table-cell">Forma</th>
              <th className="p-4 text-center">PJ</th>
              <th className="p-4 text-center">G</th>
              <th className="p-4 text-center hidden sm:table-cell">E</th>
              <th className="p-4 text-center">P</th>
              <th className="p-4 text-center hidden md:table-cell">GF</th>
              <th className="p-4 text-center hidden md:table-cell">GC</th>
              <th className="p-4 text-center font-bold text-white">DG</th>
              <th className="p-4 text-center rounded-tr-xl">Prom. Goles</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {stats.map((row, index) => (
              <tr 
                key={row.id} 
                onClick={() => setSelectedPlayerId(row.id)}
                className="hover:bg-white/10 transition-colors cursor-pointer group"
              >
                <td className="p-4 text-gray-500 font-mono group-hover:text-white transition-colors">{index + 1}</td>
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <TeamLogo src={row.teamLogo} alt={row.teamName} className="w-8 h-8 object-contain rounded-full" fallbackText={row.teamName} />
                    <div>
                      <div className="font-bold text-white group-hover:text-cyan-400 transition-colors">{row.name}</div>
                      <div className="text-xs text-cyan-400 group-hover:text-cyan-300">{row.teamName}</div>
                    </div>
                  </div>
                </td>
                <td className="p-4 hidden sm:table-cell">
                    <div className="flex justify-center gap-1">
                        {row.form.slice(-5).map((result, i) => (
                            <div 
                                key={i} 
                                className={`
                                    w-2 h-2 rounded-full 
                                    ${result === 'W' ? 'bg-green-500 shadow-[0_0_5px_#22c55e]' : result === 'L' ? 'bg-red-500' : 'bg-gray-500'}
                                `}
                                title={result === 'W' ? 'Victoria' : result === 'L' ? 'Derrota' : 'Empate'}
                            ></div>
                        ))}
                    </div>
                </td>
                <td className="p-4 text-center font-medium text-gray-300">{row.played}</td>
                <td className="p-4 text-center text-green-400">{row.wins}</td>
                <td className="p-4 text-center hidden sm:table-cell text-gray-500">{row.draws}</td>
                <td className="p-4 text-center text-red-400">{row.losses}</td>
                <td className="p-4 text-center hidden md:table-cell">{row.gf}</td>
                <td className="p-4 text-center hidden md:table-cell text-gray-500">{row.ga}</td>
                <td className={`p-4 text-center font-bold ${row.gd > 0 ? 'text-green-400' : row.gd < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                    {row.gd > 0 ? '+' : ''}{row.gd}
                </td>
                <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-1 text-xs font-mono bg-black/30 rounded px-2 py-1 border border-white/5">
                        <Activity size={10} className="text-fifa-accent" />
                        {(row.gf / (row.played || 1)).toFixed(1)}
                    </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};