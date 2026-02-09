
import { User, SavedTournament, TournamentStateData } from '../types';

// Simulacion de Base de Datos usando LocalStorage estructurado
// En una app real, aquí haríamos fetch() a un backend con SQLite/Postgres.

const DB_KEYS = {
  USERS: 'fifa26_users_v1',
  TOURNAMENTS: 'fifa26_tournaments_v1',
  SESSION: 'fifa26_session_v1'
};

export const db = {
  // --- AUTH ---
  
  register: (username: string, email: string, password: string): User => {
    const users = JSON.parse(localStorage.getItem(DB_KEYS.USERS) || '[]');
    
    if (users.some((u: any) => u.email === email)) {
      throw new Error('El correo ya está registrado');
    }
    
    // Simulating password hash (store plain for demo, DO NOT do this in prod)
    const newUser = {
      id: Math.random().toString(36).substr(2, 9),
      username,
      email,
      password // In real app: bcrypt hash
    };
    
    users.push(newUser);
    localStorage.setItem(DB_KEYS.USERS, JSON.stringify(users));
    
    // Return user without password
    const { password: _, ...safeUser } = newUser;
    return safeUser;
  },

  login: (email: string, password: string): User => {
    const users = JSON.parse(localStorage.getItem(DB_KEYS.USERS) || '[]');
    const user = users.find((u: any) => u.email === email && u.password === password);
    
    if (!user) {
      throw new Error('Credenciales inválidas');
    }
    
    const { password: _, ...safeUser } = user;
    localStorage.setItem(DB_KEYS.SESSION, JSON.stringify(safeUser));
    return safeUser;
  },

  logout: () => {
    localStorage.removeItem(DB_KEYS.SESSION);
  },

  getSession: (): User | null => {
    const session = localStorage.getItem(DB_KEYS.SESSION);
    return session ? JSON.parse(session) : null;
  },

  // --- TOURNAMENTS (CRUD) ---

  saveTournament: (userId: string, data: TournamentStateData, name?: string): SavedTournament => {
    const tournaments: SavedTournament[] = JSON.parse(localStorage.getItem(DB_KEYS.TOURNAMENTS) || '[]');
    
    // Generate a default name if not provided or new
    const finalName = name || `${data.tournamentType || 'Torneo'} - ${new Date().toLocaleDateString()}`;
    
    const newSave: SavedTournament = {
      id: Math.random().toString(36).substr(2, 12),
      userId,
      name: finalName,
      lastModified: Date.now(),
      state: data
    };

    tournaments.push(newSave);
    localStorage.setItem(DB_KEYS.TOURNAMENTS, JSON.stringify(tournaments));
    return newSave;
  },

  updateTournament: (saveId: string, data: TournamentStateData): void => {
    const tournaments: SavedTournament[] = JSON.parse(localStorage.getItem(DB_KEYS.TOURNAMENTS) || '[]');
    const index = tournaments.findIndex(t => t.id === saveId);
    
    if (index !== -1) {
      tournaments[index] = {
        ...tournaments[index],
        state: data,
        lastModified: Date.now()
      };
      localStorage.setItem(DB_KEYS.TOURNAMENTS, JSON.stringify(tournaments));
    }
  },

  getUserTournaments: (userId: string): SavedTournament[] => {
    const tournaments: SavedTournament[] = JSON.parse(localStorage.getItem(DB_KEYS.TOURNAMENTS) || '[]');
    return tournaments
        .filter(t => t.userId === userId)
        .sort((a, b) => b.lastModified - a.lastModified);
  },

  deleteTournament: (saveId: string) => {
    let tournaments: SavedTournament[] = JSON.parse(localStorage.getItem(DB_KEYS.TOURNAMENTS) || '[]');
    tournaments = tournaments.filter(t => t.id !== saveId);
    localStorage.setItem(DB_KEYS.TOURNAMENTS, JSON.stringify(tournaments));
  }
};
