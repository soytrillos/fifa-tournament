
import { User, SavedTournament, TournamentStateData } from '../types';

const STORAGE_KEY_USERS = 'fifa26_users';
const STORAGE_KEY_TOURNAMENTS = 'fifa26_saved_tournaments';
const SESSION_KEY = 'fifa26_session_token';

// Helper to simulate network delay for better UX
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const db = {
  // --- AUTH ---
  register: async (username: string, email: string, password: string): Promise<User> => {
    await delay(500);
    const usersStr = localStorage.getItem(STORAGE_KEY_USERS);
    const users: any[] = usersStr ? JSON.parse(usersStr) : [];
    
    if (users.find(u => u.email === email)) {
        throw new Error('El correo ya está registrado');
    }

    const newUser = { 
        id: 'user_' + Date.now(),
        username, 
        email, 
        password // Storing password in localstorage is insecure but fine for this client-side demo
    };
    
    users.push(newUser);
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
    
    const { password: _, ...safeUser } = newUser;
    localStorage.setItem(SESSION_KEY, JSON.stringify(safeUser));
    return safeUser;
  },

  login: async (email: string, password: string): Promise<User> => {
    await delay(500);
    const usersStr = localStorage.getItem(STORAGE_KEY_USERS);
    const users: any[] = usersStr ? JSON.parse(usersStr) : [];
    
    const user = users.find(u => u.email === email && u.password === password);

    if (!user) {
        throw new Error('Credenciales inválidas');
    }

    const { password: _, ...safeUser } = user;
    localStorage.setItem(SESSION_KEY, JSON.stringify(safeUser));
    return safeUser;
  },

  logout: () => {
    localStorage.removeItem(SESSION_KEY);
  },

  getSession: (): User | null => {
    const session = localStorage.getItem(SESSION_KEY);
    return session ? JSON.parse(session) : null;
  },

  // --- TOURNAMENTS (CRUD) ---

  saveTournament: async (userId: string, data: TournamentStateData, name?: string): Promise<SavedTournament> => {
    await delay(400);
    const savesStr = localStorage.getItem(STORAGE_KEY_TOURNAMENTS);
    const saves: SavedTournament[] = savesStr ? JSON.parse(savesStr) : [];
    
    const newSave: SavedTournament = {
        id: 'save_' + Date.now(),
        userId,
        name: name || `Torneo ${new Date().toLocaleDateString()}`,
        lastModified: Date.now(),
        state: data
    };

    saves.push(newSave);
    localStorage.setItem(STORAGE_KEY_TOURNAMENTS, JSON.stringify(saves));
    return newSave;
  },

  updateTournament: async (saveId: string, data: TournamentStateData): Promise<void> => {
     await delay(300);
     const savesStr = localStorage.getItem(STORAGE_KEY_TOURNAMENTS);
     const saves: SavedTournament[] = savesStr ? JSON.parse(savesStr) : [];
     
     const index = saves.findIndex(s => s.id === saveId);
     if (index !== -1) {
         saves[index].state = data;
         saves[index].lastModified = Date.now();
         localStorage.setItem(STORAGE_KEY_TOURNAMENTS, JSON.stringify(saves));
     }
  },

  getUserTournaments: async (userId: string): Promise<SavedTournament[]> => {
    await delay(300);
    const savesStr = localStorage.getItem(STORAGE_KEY_TOURNAMENTS);
    const saves: SavedTournament[] = savesStr ? JSON.parse(savesStr) : [];
    return saves.filter(s => s.userId === userId).sort((a,b) => b.lastModified - a.lastModified);
  },

  deleteTournament: async (saveId: string): Promise<void> => {
    await delay(300);
    const savesStr = localStorage.getItem(STORAGE_KEY_TOURNAMENTS);
    let saves: SavedTournament[] = savesStr ? JSON.parse(savesStr) : [];
    saves = saves.filter(s => s.id !== saveId);
    localStorage.setItem(STORAGE_KEY_TOURNAMENTS, JSON.stringify(saves));
  }
};
