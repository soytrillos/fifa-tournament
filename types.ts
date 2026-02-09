
export enum TournamentType {
  CHAMPIONS = 'Champions League',
  WORLD_CUP = 'Copa Mundial',
  CONMEBOL = 'CONMEBOL Libertadores',
  PREMIER = 'Premier League',
  LALIGA = 'La Liga'
}

export interface TournamentPreset {
  id: string;
  name: string;
  teams: Team[];
  isCustom?: boolean;
}

export enum TournamentStage {
  GROUPS = 'GROUPS',
  BRACKET = 'BRACKET'
}

export interface Player {
  id: string;
  name: string;
}

export interface Team {
  id?: string; // Optional for backward compatibility, but good for tracking
  name: string;
  league: string;
  rating: number; // 1-5 stars representation
  logoColor: string; // Hex color for UI placeholder/fallback
  logo: string; // URL to the team image
  starPlayer: string; // Name of the star player
}

export interface Assignment {
  player: Player;
  team: Team;
}

export interface Matchup {
  id: string;
  player1: Assignment;
  player2: Assignment | null; // Null implies a BYE
  winnerId?: string | null; // ID of the winning player
  score1?: number; // Score for player 1
  score2?: number; // Score for player 2
  isThirdPlace?: boolean; // Flag for third place match
}

export interface Group {
  id: string; // A, B, C, D...
  assignments: Assignment[];
  matches: Matchup[];
}

// --- NEW TYPES FOR AUTH & DB ---

export interface User {
  id: string;
  username: string;
  email: string;
}

export interface SavedTournament {
  id: string;
  userId: string;
  name: string; // User friendly name for the save file
  lastModified: number;
  state: TournamentStateData;
}

// Extract of the state that needs saving
export interface TournamentStateData {
  step: 'select' | 'players' | 'game';
  tournamentType: string | null;
  useGroupStage: boolean;
  players: Player[];
  stage: TournamentStage;
  currentTeams: Team[];
  groups: Group[];
  matchups: Matchup[];
  history: Matchup[][];
  round: number;
}
