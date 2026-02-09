
import { useState, useEffect, useCallback } from 'react';
import { TournamentType, Player, Matchup, Team, TournamentStage, Group, TournamentPreset, TournamentStateData } from '../types';
import { DEFAULT_TOURNAMENTS } from '../constants';

// Define the shape of our total application state
interface TournamentState extends TournamentStateData {
  availableTournaments: TournamentPreset[];
}

const STORAGE_KEY = 'fifa_tournament_state_v2';

const DEFAULT_STATE: TournamentState = {
  step: 'select',
  tournamentType: null,
  useGroupStage: false,
  players: [],
  stage: TournamentStage.BRACKET,
  currentTeams: [],
  groups: [],
  matchups: [],
  history: [],
  round: 1,
  availableTournaments: DEFAULT_TOURNAMENTS
};

export const useTournamentPersistence = () => {
  // Initialize state from local storage or default
  const [state, setState] = useState<TournamentState>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (!parsed.availableTournaments) {
          return { ...parsed, availableTournaments: DEFAULT_TOURNAMENTS };
        }
        return parsed;
      }
      return DEFAULT_STATE;
    } catch (e) {
      console.error("Error loading state", e);
      return DEFAULT_STATE;
    }
  });

  // Helper to update specific parts of the state
  const updateState = useCallback((updates: Partial<TournamentState>) => {
    setState(prev => {
      const newState = { ...prev, ...updates };
      // Save active state to local storage immediately
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
      return newState;
    });
  }, []);

  // Full reset
  const resetState = useCallback(() => {
    setState(prev => {
      const reset = { 
        ...DEFAULT_STATE, 
        availableTournaments: prev.availableTournaments 
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(reset));
      return reset;
    });
  }, []);

  // Load a specific state (from DB)
  const loadSpecificState = useCallback((loadedState: TournamentStateData) => {
    setState(prev => {
      // Merge loaded state with current availableTournaments (so we don't lose custom presets)
      const newState = {
        ...loadedState,
        availableTournaments: prev.availableTournaments
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
      return newState;
    });
  }, []);

  const addTournamentPreset = useCallback((preset: TournamentPreset) => {
    setState(prev => {
      const updatedTournaments = [...prev.availableTournaments, preset];
      const newState = { ...prev, availableTournaments: updatedTournaments };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
      return newState;
    });
  }, []);

  const deleteTournamentPreset = useCallback((id: string) => {
    setState(prev => {
      const updatedTournaments = prev.availableTournaments.filter(t => t.id !== id);
      const newState = { ...prev, availableTournaments: updatedTournaments };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
      return newState;
    });
  }, []);

  // Listen for changes from other tabs (Spectator Mode Sync)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const newState = JSON.parse(e.newValue);
          setState(newState);
        } catch (err) {
          console.error("Sync error", err);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return {
    state,
    updateState,
    resetState,
    loadSpecificState,
    addTournamentPreset,
    deleteTournamentPreset
  };
};
