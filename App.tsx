
import React, { useState, useEffect } from 'react';
import { TournamentType, Player, Assignment, Matchup, Team, TournamentStage, Group, TournamentPreset, User, SavedTournament, MatchStatus } from './types';
import { DEFAULT_TOURNAMENTS } from './constants';
import { TournamentSelector } from './components/TournamentSelector';
import { PlayerInput } from './components/PlayerInput';
import { MatchupView } from './components/MatchupView';
import { BracketView } from './components/BracketView';
import { GroupStageView } from './components/GroupStageView';
import { SpectatorView } from './components/SpectatorView';
import { AuthView } from './components/AuthView';
import { DashboardView } from './components/DashboardView';
import { Trophy, LayoutGrid, Network, ExternalLink, Save, ArrowLeft } from 'lucide-react';
import { Button } from './components/Button';
import { useTournamentPersistence } from './hooks/useTournamentPersistence';
import { db } from './services/db';

// Fisher-Yates shuffle
function shuffle<T>(array: T[]): T[] {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
}

const App: React.FC = () => {
  // Use custom hook for persistence (State Management)
  const { state, updateState, resetState, loadSpecificState, addTournamentPreset, deleteTournamentPreset } = useTournamentPersistence();
  
  // App-level flow state
  const [user, setUser] = useState<User | null>(null);
  const [appMode, setAppMode] = useState<'auth' | 'dashboard' | 'tournament'>('auth');
  const [currentSaveId, setCurrentSaveId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Destructure state for easier access
  const { 
    step, 
    tournamentType, 
    useGroupStage, 
    players, 
    stage, 
    currentTeams, 
    groups, 
    matchups, 
    history, 
    round,
    availableTournaments 
  } = state;

  // Local UI state
  const [showBracketVisual, setShowBracketVisual] = useState(false);
  const [isSpectatorMode, setIsSpectatorMode] = useState(false);

  // Initial Load (Session Check)
  useEffect(() => {
    // Check for spectator mode param
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'spectator') {
      setIsSpectatorMode(true);
      return;
    }

    // Check auth session
    const session = db.getSession();
    if (session) {
      setUser(session);
      setAppMode('dashboard');
    }
  }, []);

  // --- Handlers ---

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    setAppMode('dashboard');
  };

  const handleLogout = () => {
    db.logout();
    setUser(null);
    setAppMode('auth');
    resetState();
    setCurrentSaveId(null);
  };

  const handleNewTournament = () => {
    resetState();
    setCurrentSaveId(null);
    setAppMode('tournament');
  };

  const handleLoadTournament = (save: SavedTournament) => {
    loadSpecificState(save.state);
    // Fix: Explicitly cast ID to string to resolve TypeScript error
    setCurrentSaveId(String(save.id));
    setAppMode('tournament');
  };

  const handleSaveTournament = async () => {
    if (!user) return;
    setIsSaving(true);
    
    try {
      if (currentSaveId) {
         // Update existing
         await db.updateTournament(currentSaveId, state);
         alert('Torneo guardado correctamente.');
      } else {
         // Create new save
         const name = prompt('Nombre para guardar este torneo:', `${tournamentType || 'Torneo'} - ${players.length} Jugadores`);
         if (name) {
            // Fix: Explicitly cast user.id to string
            const save = await db.saveTournament(String(user.id), state, name);
            // Fix: Explicitly cast save.id to string
            setCurrentSaveId(String(save.id));
            alert('Torneo creado y guardado.');
         }
      }
    } catch (e) {
      alert('Error al guardar en el servidor');
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleBackToDashboard = () => {
    // Prompt to save?
    if (confirm('¿Deseas volver al menú principal? Asegúrate de guardar tus cambios.')) {
        setAppMode('dashboard');
    }
  };

  // --- Tournament Logic (Existing) ---

  const openSpectatorWindow = () => {
    window.open(`${window.location.pathname}?mode=spectator`, '_blank');
  };

  const handleSelectTournament = (preset: TournamentPreset) => {
    updateState({ 
      tournamentType: preset.name,
      currentTeams: [...preset.teams],
      step: 'players'
    });
  };

  const handleAddTournament = (name: string) => {
    const newPreset: TournamentPreset = {
        id: `custom-${Date.now()}`,
        name: name,
        teams: [],
        isCustom: true
    };
    addTournamentPreset(newPreset);
  };

  const addPlayer = (name: string) => {
    updateState({ players: [...players, { id: Math.random().toString(36).substr(2, 9), name }] });
  };

  const addPlayers = (names: string[]) => {
    const newPlayers = names.map(name => ({
      id: Math.random().toString(36).substr(2, 9) + Math.random().toString(36).substr(2, 5),
      name
    }));
    updateState({ players: [...players, ...newPlayers] });
  };

  const removePlayer = (id: string) => {
    updateState({ players: players.filter(p => p.id !== id) });
  };

  const updateTeam = (index: number, updatedTeam: Team) => {
    const newTeams = [...currentTeams];
    newTeams[index] = updatedTeam;
    updateState({ currentTeams: newTeams });
  };

  const addTeamToPool = (team: Team) => {
    updateState({ currentTeams: [...currentTeams, team] });
  };

  const removeTeamFromPool = (index: number) => {
    const newTeams = [...currentTeams];
    newTeams.splice(index, 1);
    updateState({ currentTeams: newTeams });
  };

  const resetTeamsToDefault = () => {
    if (tournamentType) {
       const preset = availableTournaments.find(t => t.name === tournamentType);
       if (preset) {
           updateState({ currentTeams: [...preset.teams] });
       }
    }
  };

  const performInitialDraw = () => {
    if (!tournamentType || players.length < 2) return;
    if (currentTeams.length < players.length) {
        alert(`No hay suficientes equipos (${currentTeams.length}) para los jugadores inscritos (${players.length}). Agrega más equipos.`);
        return;
    }
    const sortedTeams = [...currentTeams].sort((a, b) => b.rating - a.rating);
    const shuffledPlayers = shuffle<Player>(players);
    const assignments: Assignment[] = shuffledPlayers.map((player, index) => ({
      player,
      team: sortedTeams[index]
    }));

    if (useGroupStage && players.length >= 4) {
      generateGroups(assignments);
    } else {
      const mixedAssignments = shuffle(assignments);
      const newMatchups = createMatchupsFromAssignments(mixedAssignments);
      updateState({
        stage: TournamentStage.BRACKET,
        matchups: newMatchups,
        step: 'game'
      });
    }
  };

  const generateGroups = (assignments: Assignment[]) => {
    const numGroups = Math.ceil(assignments.length / 4);
    const newGroups: Group[] = [];
    const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    for (let i = 0; i < numGroups; i++) {
      newGroups.push({ id: letters[i], assignments: [], matches: [] });
    }
    assignments.forEach((a, i) => newGroups[i % numGroups].assignments.push(a));

    newGroups.forEach(g => {
      const gMatches: Matchup[] = [];
      const count = g.assignments.length;
      for (let i = 0; i < count; i++) {
        for (let j = i + 1; j < count; j++) {
           const isEven = (i + j) % 2 === 0;
           gMatches.push({
             id: `g${g.id}-${i}-${j}`,
             player1: isEven ? g.assignments[i] : g.assignments[j],
             player2: isEven ? g.assignments[j] : g.assignments[i],
             status: MatchStatus.SCHEDULED // Init status
           });
        }
      }
      g.matches = shuffle(gMatches);
    });

    updateState({
      groups: newGroups,
      stage: TournamentStage.GROUPS,
      step: 'game'
    });
  };

  const handleGroupMatchUpdate = (groupId: string, matchId: string, updates: Partial<Matchup>) => {
    const updatedGroups = groups.map(g => {
      if (g.id !== groupId) return g;
      return {
        ...g,
        matches: g.matches.map(m => m.id === matchId ? { ...m, ...updates } : m)
      };
    });
    updateState({ groups: updatedGroups });
  };

  const advanceFromGroupsToBracket = () => {
    const qualifiedAssignments: Assignment[] = [];
    groups.forEach(g => {
       const stats = g.assignments.map(a => {
         let pts = 0, gd = 0, gf = 0;
         g.matches.forEach(m => {
           if (m.score1 === undefined || m.score2 === undefined) return;
           const isP1 = m.player1.player.id === a.player.id;
           const isP2 = m.player2?.player.id === a.player.id;
           if (!isP1 && !isP2) return;
           const sOwn = isP1 ? m.score1 : m.score2;
           const sOpp = isP1 ? m.score2 : m.score1;
           gf += sOwn; gd += (sOwn - sOpp);
           if (sOwn > sOpp) pts += 3; else if (sOwn === sOpp) pts += 1;
         });
         return { assignment: a, pts, gd, gf };
       });
       stats.sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf);
       if(stats[0]) qualifiedAssignments.push(stats[0].assignment);
       if(stats[1]) qualifiedAssignments.push(stats[1].assignment);
    });
    updateState({
      stage: TournamentStage.BRACKET,
      round: 1,
      history: [],
      matchups: createMatchupsFromAssignments(shuffle(qualifiedAssignments))
    });
  };

  const createMatchupsFromAssignments = (assignments: Assignment[]): Matchup[] => {
    const generatedMatchups: Matchup[] = [];
    for (let i = 0; i < assignments.length; i += 2) {
      const player2 = assignments[i + 1] || null;
      generatedMatchups.push({
        id: `round-${round}-match-${i}`,
        player1: assignments[i],
        player2,
        winnerId: player2 ? undefined : assignments[i].player.id,
        score1: player2 ? undefined : 3, 
        score2: player2 ? undefined : 0,
        status: player2 ? MatchStatus.SCHEDULED : MatchStatus.FINISHED
      });
    }
    return generatedMatchups;
  };

  const handleMatchUpdate = (matchId: string, updates: Partial<Matchup>) => {
    const updatedMatchups = matchups.map(m => {
      if (m.id === matchId) {
        const updatedMatch = { ...m, ...updates };
        if (updatedMatch.score1 !== undefined && updatedMatch.score2 !== undefined && updatedMatch.score1 !== null && updatedMatch.score2 !== null) {
          if (updatedMatch.score1 > updatedMatch.score2) {
             updatedMatch.winnerId = updatedMatch.player1.player.id;
          } else if (updatedMatch.score2 > updatedMatch.score1 && updatedMatch.player2) {
             updatedMatch.winnerId = updatedMatch.player2.player.id;
          } 
        }
        return updatedMatch;
      }
      return m;
    });
    updateState({ matchups: updatedMatchups });
  };

  const advanceToNextRound = () => {
    const winners: Assignment[] = [];
    const losersStats: { assignment: Assignment, gd: number, gf: number }[] = [];
    const activeBracketMatches = matchups.filter(m => !m.isThirdPlace);

    activeBracketMatches.forEach(m => {
      if (m.winnerId) {
        const p1Score = m.score1 || 0;
        const p2Score = m.score2 || 0;
        if (m.winnerId === m.player1.player.id) {
            winners.push(m.player1);
            if (m.player2) losersStats.push({ assignment: m.player2, gd: p2Score - p1Score, gf: p2Score });
        } else if (m.player2 && m.winnerId === m.player2.player.id) {
            winners.push(m.player2);
            losersStats.push({ assignment: m.player1, gd: p1Score - p2Score, gf: p1Score });
        }
      }
    });

    if (winners.length === 0) return;
    if (winners.length === 1 && activeBracketMatches.length === 1) return; 

    if (winners.length % 2 !== 0 && losersStats.length > 0) {
        losersStats.sort((a, b) => { if (b.gd !== a.gd) return b.gd - a.gd; return b.gf - a.gf; });
        if (losersStats[0]) winners.push(losersStats[0].assignment);
    }

    const newHistory = [...history, matchups];
    const newMatchups = createMatchupsFromAssignments(shuffle(winners));
    
    if (newMatchups.length === 1 && losersStats.length >= 2) {
        losersStats.sort((a, b) => { if (b.gd !== a.gd) return b.gd - a.gd; return b.gf - a.gf; });
        newMatchups.push({
            id: `round-${round + 1}-3rd-place`,
            player1: losersStats[0].assignment,
            player2: losersStats[1].assignment,
            isThirdPlace: true,
            score1: 0, score2: 0,
            status: MatchStatus.SCHEDULED
        });
    }

    updateState({ round: round + 1, history: newHistory, matchups: newMatchups });
  };

  const finalMatch = matchups.find(m => !m.isThirdPlace && matchups.length === (matchups.some(x => x.isThirdPlace) ? 2 : 1));
  const champion = finalMatch?.winnerId ? (finalMatch.winnerId === finalMatch.player1.player.id ? finalMatch.player1 : finalMatch.player2) : null;

  // --- Render ---

  if (isSpectatorMode) {
    return (
      <SpectatorView 
        tournamentType={tournamentType as any}
        stage={stage}
        groups={groups}
        matchups={matchups}
        history={history}
        round={round}
        champion={champion}
      />
    );
  }

  // View: Auth
  if (appMode === 'auth') {
    return <AuthView onLogin={handleLogin} />;
  }

  // View: Dashboard
  if (appMode === 'dashboard' && user) {
    return (
      <div className="min-h-screen bg-[#0f172a] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] text-white">
        <header className="border-b border-white/10 bg-black/50 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-cyan-500 to-blue-600 p-2 rounded-lg">
                <Trophy className="text-white w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tighter uppercase leading-none">FIFA 26</h1>
                <span className="text-xs text-cyan-400 tracking-widest uppercase">Tournament Master</span>
              </div>
            </div>
            <div className="text-sm font-bold text-gray-400">{user.email}</div>
          </div>
        </header>
        <main className="container mx-auto py-12">
           <DashboardView 
              user={user} 
              onNewTournament={handleNewTournament}
              onLoadTournament={handleLoadTournament}
              onLogout={handleLogout}
           />
        </main>
      </div>
    );
  }

  // View: Active Tournament
  return (
    <div className="min-h-screen bg-[#0f172a] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] text-white font-sans selection:bg-fifa-accent selection:text-black pb-20">
      
      {/* Navbar */}
      <header className="border-b border-white/10 bg-black/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <Button variant="secondary" onClick={handleBackToDashboard} className="px-2 py-1 h-auto mr-2">
                <ArrowLeft size={16} />
             </Button>
            <div className="bg-gradient-to-r from-cyan-500 to-blue-600 p-2 rounded-lg hidden sm:block">
              <Trophy className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tighter uppercase leading-none">FIFA 26</h1>
              <span className="text-xs text-cyan-400 tracking-widest uppercase">
                {currentSaveId ? 'Torneo Guardado' : 'Nuevo Torneo'}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
             <Button onClick={handleSaveTournament} isLoading={isSaving} className="py-1 px-3 text-xs h-auto bg-green-700 hover:bg-green-600 border-none">
                <Save size={14} className="mr-1" /> Guardar
             </Button>
             {step !== 'select' && (
                <Button onClick={openSpectatorWindow} variant="secondary" className="py-1 px-3 text-xs h-auto bg-purple-900 border-purple-500 text-purple-200 hover:bg-purple-800">
                   <ExternalLink size={14} className="mr-1 hidden sm:inline" /> Espectador
                </Button>
             )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 flex flex-col items-center">
        
        {step === 'select' && (
          <div className="animate-fade-in-up w-full flex flex-col items-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-center">Selecciona tu Torneo</h2>
            <p className="text-gray-400 mb-12 text-center max-w-lg text-lg">
              Elige el formato de la competición o crea uno nuevo.
            </p>
            <TournamentSelector 
                tournaments={availableTournaments} 
                onSelect={handleSelectTournament}
                onAddTournament={handleAddTournament}
                onDeleteTournament={deleteTournamentPreset}
            />
          </div>
        )}

        {step === 'players' && (
          <div className="w-full animate-fade-in-up flex flex-col items-center">
             <div className="mb-6 flex gap-4 bg-black/30 p-2 rounded-xl">
               <button 
                onClick={() => updateState({ useGroupStage: false })}
                className={`px-4 py-2 rounded-lg transition-colors ${!useGroupStage ? 'bg-cyan-600 text-white' : 'text-gray-400 hover:text-white'}`}
               >
                 Eliminatoria Directa
               </button>
               <button 
                onClick={() => updateState({ useGroupStage: true })}
                className={`px-4 py-2 rounded-lg transition-colors ${useGroupStage ? 'bg-cyan-600 text-white' : 'text-gray-400 hover:text-white'}`}
               >
                 Fase de Grupos + Eliminatoria
               </button>
             </div>

            <PlayerInput 
              players={players}
              teams={currentTeams}
              onAddPlayer={addPlayer}
              onAddPlayers={addPlayers}
              onRemovePlayer={removePlayer}
              onUpdateTeam={updateTeam}
              onAddTeam={addTeamToPool}
              onRemoveTeam={removeTeamFromPool}
              onResetTeams={resetTeamsToDefault}
              onNext={performInitialDraw}
            />
          </div>
        )}

        {step === 'game' && tournamentType && (
          <div className="w-full animate-fade-in-up">
            
            {stage === TournamentStage.GROUPS && (
               <GroupStageView 
                 groups={groups}
                 onMatchUpdate={handleGroupMatchUpdate}
                 onAdvanceToBracket={advanceFromGroupsToBracket}
               />
            )}

            {stage === TournamentStage.BRACKET && (
              <>
                <div className="flex justify-center gap-4 mb-8">
                  <Button 
                    variant="secondary" 
                    onClick={() => setShowBracketVisual(false)}
                    className={!showBracketVisual ? 'border-cyan-500 text-cyan-400' : ''}
                  >
                    <LayoutGrid size={20} className="mr-2" />
                    Vista Tarjetas
                  </Button>
                  <Button 
                    variant="secondary" 
                    onClick={() => setShowBracketVisual(true)}
                    className={showBracketVisual ? 'border-cyan-500 text-cyan-400' : ''}
                  >
                    <Network size={20} className="mr-2" />
                    Vista Cuadro
                  </Button>
                </div>

                {showBracketVisual ? (
                  <BracketView 
                    history={history}
                    currentMatchups={matchups}
                    onMatchClick={(m) => {
                      setShowBracketVisual(false);
                    }}
                    champion={champion}
                  />
                ) : (
                  <MatchupView 
                    matchups={matchups} 
                    history={history}
                    tournamentType={tournamentType as any}
                    roundNumber={round}
                    groups={groups}
                    onReset={resetState}
                    onMatchUpdate={handleMatchUpdate}
                    onNextRound={advanceToNextRound}
                  />
                )}
              </>
            )}
          </div>
        )}
      </main>

      <footer className="fixed bottom-0 w-full text-center py-4 text-gray-600 text-sm bg-black/80 backdrop-blur-sm border-t border-white/5 z-40">
        FIFA 26 Tournament Master &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
};

export default App;
