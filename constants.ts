import { Team, TournamentType, TournamentPreset } from './types';

// Helper to generate a random distinct color for team logos (fallback)
export const colors = ['#ef4444', '#3b82f6', '#22c55e', '#eab308', '#a855f7', '#ec4899', '#f97316', '#06b6d4'];

export const createTeam = (name: string, league: string, rating: number, starPlayer: string, logoUrl?: string): Team => ({
  id: Math.random().toString(36).substr(2, 9),
  name,
  league,
  rating,
  logoColor: colors[Math.floor(Math.random() * colors.length)],
  starPlayer,
  logo: logoUrl || '' 
});

// Default Presets
export const DEFAULT_TOURNAMENTS: TournamentPreset[] = [
  {
    id: 'champions',
    name: TournamentType.CHAMPIONS,
    teams: [
      createTeam('Real Madrid', 'ESP', 5, 'K. Mbappé', 'https://crests.football-data.org/86.svg'),
      createTeam('Man City', 'ENG', 5, 'E. Haaland', 'https://crests.football-data.org/65.svg'),
      createTeam('Bayern Munich', 'GER', 5, 'H. Kane', 'https://crests.football-data.org/5.svg'),
      createTeam('PSG', 'FRA', 5, 'O. Dembélé', 'https://crests.football-data.org/524.svg'),
      createTeam('Inter Milan', 'ITA', 4, 'L. Martínez', 'https://crests.football-data.org/108.svg'),
      createTeam('Arsenal', 'ENG', 5, 'B. Saka', 'https://crests.football-data.org/57.svg'),
      createTeam('Barcelona', 'ESP', 5, 'L. Yamal', 'https://crests.football-data.org/81.svg'),
      createTeam('Atletico Madrid', 'ESP', 4, 'J. Alvarez', 'https://crests.football-data.org/78.svg'),
      createTeam('Dortmund', 'GER', 4, 'J. Brandt', 'https://crests.football-data.org/4.svg'),
      createTeam('Juventus', 'ITA', 4, 'D. Vlahović', 'https://crests.football-data.org/109.svg'),
      createTeam('Liverpool', 'ENG', 5, 'M. Salah', 'https://crests.football-data.org/64.svg'),
      createTeam('Leverkusen', 'GER', 4, 'F. Wirtz', 'https://crests.football-data.org/3.svg'),
      createTeam('AC Milan', 'ITA', 4, 'R. Leão', 'https://crests.football-data.org/98.svg'),
      createTeam('Benfica', 'POR', 4, 'A. Di María', 'https://crests.football-data.org/1903.svg'),
      createTeam('Feyenoord', 'NED', 3, 'S. Giménez', 'https://crests.football-data.org/675.svg'),
      createTeam('Celtic', 'SCO', 3, 'K. Furuhashi', 'https://crests.football-data.org/732.svg'),
    ]
  },
  {
    id: 'worldcup',
    name: TournamentType.WORLD_CUP,
    teams: [
      createTeam('Argentina', 'INT', 5, 'L. Messi', 'https://crests.football-data.org/762.svg'),
      createTeam('Francia', 'INT', 5, 'K. Mbappé', 'https://crests.football-data.org/773.svg'), 
      createTeam('Brasil', 'INT', 5, 'Vinícius Jr.', 'https://crests.football-data.org/764.svg'),
      createTeam('Inglaterra', 'INT', 5, 'J. Bellingham', 'https://crests.football-data.org/770.svg'),
      createTeam('España', 'INT', 5, 'Rodri', 'https://crests.football-data.org/760.svg'),
      createTeam('Alemania', 'INT', 4, 'J. Musiala', 'https://crests.football-data.org/759.svg'),
      createTeam('Portugal', 'INT', 5, 'C. Ronaldo', 'https://crests.football-data.org/765.svg'),
      createTeam('Países Bajos', 'INT', 4, 'V. van Dijk', 'https://crests.football-data.org/8601.svg'),
      createTeam('Italia', 'INT', 4, 'N. Barella', 'https://crests.football-data.org/784.svg'),
      createTeam('Croacia', 'INT', 4, 'L. Modrić', 'https://crests.football-data.org/799.svg'),
      createTeam('Bélgica', 'INT', 4, 'K. De Bruyne', 'https://crests.football-data.org/805.svg'),
      createTeam('Uruguay', 'INT', 4, 'F. Valverde', 'https://crests.football-data.org/758.svg'),
      createTeam('Colombia', 'INT', 4, 'L. Díaz', 'https://crests.football-data.org/818.svg'),
      createTeam('Japón', 'INT', 3, 'K. Mitoma', 'https://crests.football-data.org/766.svg'),
      createTeam('Marruecos', 'INT', 4, 'A. Hakimi', 'https://crests.football-data.org/815.svg'),
      createTeam('USA', 'INT', 4, 'C. Pulisic', 'https://upload.wikimedia.org/wikipedia/commons/8/86/United_States_Soccer_Federation_logo_2016.svg'),
    ]
  },
  {
    id: 'conmebol',
    name: TournamentType.CONMEBOL,
    teams: [
      createTeam('Flamengo', 'BRA', 5, 'Pedro', 'https://crests.football-data.org/1783.svg'),
      createTeam('Palmeiras', 'BRA', 5, 'Estêvão', 'https://crests.football-data.org/1769.svg'),
      createTeam('River Plate', 'ARG', 5, 'M. Borja', 'https://upload.wikimedia.org/wikipedia/commons/3/3f/Logo_River_Plate.png'),
      createTeam('Boca Juniors', 'ARG', 4, 'E. Cavani', 'https://upload.wikimedia.org/wikipedia/commons/4/41/Club_Atl%C3%A9tico_Boca_Juniors_logo.svg'),
      createTeam('Fluminense', 'BRA', 4, 'Ganso', 'https://crests.football-data.org/1765.svg'),
      createTeam('São Paulo', 'BRA', 4, 'Lucas Moura', 'https://crests.football-data.org/1776.svg'),
      createTeam('Atlético Mineiro', 'BRA', 4, 'Hulk', 'https://crests.football-data.org/1766.svg'),
      createTeam('Ind. del Valle', 'ECU', 4, 'K. Páez', 'https://upload.wikimedia.org/wikipedia/en/4/4b/Independiente_del_Valle_logo.svg'),
      createTeam('Nacional', 'URU', 3, 'N. López', 'https://upload.wikimedia.org/wikipedia/commons/1/11/Escudo_Club_Nacional_de_Football.png'),
      createTeam('Peñarol', 'URU', 3, 'L. Fernández', 'https://upload.wikimedia.org/wikipedia/en/4/41/Pe%C3%B1arol_crest.svg'),
      createTeam('Colo-Colo', 'CHI', 3, 'A. Vidal', 'https://upload.wikimedia.org/wikipedia/commons/a/ac/Escudo_Colo_Colo_2024.png'),
      createTeam('LDU Quito', 'ECU', 4, 'A. Arce', 'https://upload.wikimedia.org/wikipedia/commons/6/6b/Liga_de_Quito_logo.svg'),
      createTeam('Estudiantes', 'ARG', 3, 'E. Pérez', 'https://upload.wikimedia.org/wikipedia/commons/d/d3/Estudiantes_de_La_Plata_Logo.svg'),
      createTeam('Libertad', 'PAR', 3, 'O. Cardozo', 'https://upload.wikimedia.org/wikipedia/commons/f/f9/Club_Libertad_logo.svg'),
      createTeam('Millonarios', 'COL', 3, 'Falcao', 'https://upload.wikimedia.org/wikipedia/commons/1/1d/Escudo_de_Millonarios_F%C3%BAtbol_Club.svg'),
      createTeam('Junior', 'COL', 3, 'C. Bacca', 'https://upload.wikimedia.org/wikipedia/en/6/6f/Junior_Barranquilla_logo.svg'),
    ]
  },
  {
    id: 'premier',
    name: TournamentType.PREMIER,
    teams: [
      createTeam('Man City', 'ENG', 5, 'E. Haaland', 'https://crests.football-data.org/65.svg'),
      createTeam('Arsenal', 'ENG', 5, 'M. Ødegaard', 'https://crests.football-data.org/57.svg'),
      createTeam('Liverpool', 'ENG', 5, 'T. Alexander-Arnold', 'https://crests.football-data.org/64.svg'),
      createTeam('Aston Villa', 'ENG', 4, 'O. Watkins', 'https://crests.football-data.org/58.svg'),
      createTeam('Tottenham', 'ENG', 4, 'H. Son', 'https://crests.football-data.org/73.svg'),
      createTeam('Chelsea', 'ENG', 4, 'C. Palmer', 'https://crests.football-data.org/61.svg'),
      createTeam('Newcastle', 'ENG', 4, 'A. Isak', 'https://crests.football-data.org/67.svg'),
      createTeam('Man United', 'ENG', 4, 'B. Fernandes', 'https://crests.football-data.org/66.svg'),
      createTeam('West Ham', 'ENG', 4, 'J. Bowen', 'https://crests.football-data.org/563.svg'),
      createTeam('Brighton', 'ENG', 3, 'K. Mitoma', 'https://crests.football-data.org/397.svg'),
    ]
  },
  {
    id: 'laliga',
    name: TournamentType.LALIGA,
    teams: [
      createTeam('Real Madrid', 'ESP', 5, 'Vini Jr.', 'https://crests.football-data.org/86.svg'),
      createTeam('Barcelona', 'ESP', 5, 'Pedri', 'https://crests.football-data.org/81.svg'),
      createTeam('Atletico Madrid', 'ESP', 5, 'A. Griezmann', 'https://crests.football-data.org/78.svg'),
      createTeam('Girona', 'ESP', 4, 'V. Tsygankov', 'https://crests.football-data.org/298.svg'),
      createTeam('Athletic Club', 'ESP', 4, 'N. Williams', 'https://crests.football-data.org/77.svg'),
      createTeam('Real Sociedad', 'ESP', 4, 'T. Kubo', 'https://crests.football-data.org/92.svg'),
      createTeam('Real Betis', 'ESP', 4, 'Isco', 'https://crests.football-data.org/90.svg'),
      createTeam('Valencia', 'ESP', 3, 'Hugo Duro', 'https://crests.football-data.org/95.svg'),
      createTeam('Sevilla', 'ESP', 4, 'L. Ocampos', 'https://crests.football-data.org/559.svg'),
      createTeam('Villarreal', 'ESP', 4, 'G. Moreno', 'https://crests.football-data.org/94.svg'),
    ]
  }
];