import React, { useState } from 'react';
import { TournamentType, TournamentPreset } from '../types';
import { Trophy, Globe, MapPin, Shield, Plus, Trash2, Dribbble, Star } from 'lucide-react';
import { Button } from './Button';

interface Props {
  tournaments: TournamentPreset[];
  onSelect: (preset: TournamentPreset) => void;
  onAddTournament: (name: string) => void;
  onDeleteTournament: (id: string) => void;
}

export const TournamentSelector: React.FC<Props> = ({ tournaments, onSelect, onAddTournament, onDeleteTournament }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newTournamentName, setNewTournamentName] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTournamentName.trim()) {
      onAddTournament(newTournamentName.trim());
      setNewTournamentName('');
      setIsAdding(false);
    }
  };

  const getIcon = (name: string) => {
    // Map standard names to icons
    if (name === TournamentType.CHAMPIONS) return <Trophy className="w-10 h-10 text-yellow-400" />;
    if (name === TournamentType.WORLD_CUP) return <Globe className="w-10 h-10 text-green-400" />;
    if (name === TournamentType.CONMEBOL) return <MapPin className="w-10 h-10 text-orange-400" />;
    if (name === TournamentType.PREMIER) return <Shield className="w-10 h-10 text-purple-400" />;
    if (name === TournamentType.LALIGA) return <Dribbble className="w-10 h-10 text-red-400" />;
    // Default for custom
    return <Star className="w-10 h-10 text-cyan-400" />;
  };

  const getColor = (name: string) => {
    if (name === TournamentType.CHAMPIONS) return 'from-blue-900 to-indigo-900';
    if (name === TournamentType.WORLD_CUP) return 'from-green-900 to-emerald-900';
    if (name === TournamentType.CONMEBOL) return 'from-orange-900 to-red-900';
    if (name === TournamentType.PREMIER) return 'from-purple-900 to-fuchsia-900';
    if (name === TournamentType.LALIGA) return 'from-red-900 to-orange-900';
    return 'from-gray-800 to-gray-900';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl mx-auto p-4">
      {tournaments.map((preset) => (
        <div key={preset.id} className="relative group">
          <button
            onClick={() => onSelect(preset)}
            className={`w-full h-full relative overflow-hidden rounded-2xl p-8 text-left transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl border border-white/10 bg-gradient-to-br ${getColor(preset.name)}`}
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-150">
              {getIcon(preset.name)}
            </div>
            <div className="relative z-10">
              <div className="mb-4 bg-black/30 w-fit p-3 rounded-xl backdrop-blur-sm">
                {getIcon(preset.name)}
              </div>
              <h3 className="text-2xl font-bold text-white mb-2 uppercase tracking-widest truncate">{preset.name}</h3>
              <p className="text-gray-300 font-medium text-sm">
                {preset.teams.length} Equipos disponibles
              </p>
            </div>
          </button>
          
          {preset.isCustom && (
            <button 
              onClick={(e) => { e.stopPropagation(); onDeleteTournament(preset.id); }}
              className="absolute top-2 right-2 p-2 bg-red-600/80 hover:bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-20"
              title="Eliminar torneo"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      ))}

      {/* Add New Tournament Card */}
      {isAdding ? (
        <div className="rounded-2xl p-8 border border-cyan-500/50 bg-gray-900/50 flex flex-col justify-center gap-4 animate-fade-in-up">
           <h3 className="text-xl font-bold text-white">Nuevo Torneo</h3>
           <form onSubmit={handleAdd} className="flex flex-col gap-3">
             <input 
               autoFocus
               type="text" 
               placeholder="Nombre (ej. Torneo de Barrio)" 
               className="bg-black/50 border border-white/20 rounded-lg px-4 py-3 text-white focus:border-cyan-400 outline-none"
               value={newTournamentName}
               onChange={(e) => setNewTournamentName(e.target.value)}
             />
             <div className="flex gap-2 mt-2">
               <Button type="submit" className="flex-1 py-2 text-sm" disabled={!newTournamentName.trim()}>Crear</Button>
               <Button type="button" variant="secondary" className="py-2 text-sm" onClick={() => setIsAdding(false)}>Cancelar</Button>
             </div>
           </form>
        </div>
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className="rounded-2xl p-8 border border-dashed border-white/20 hover:border-cyan-400 bg-white/5 hover:bg-white/10 transition-all flex flex-col items-center justify-center gap-4 group min-h-[200px]"
        >
           <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-cyan-500/20 transition-colors">
             <Plus className="w-8 h-8 text-gray-400 group-hover:text-cyan-400" />
           </div>
           <span className="text-gray-400 group-hover:text-white font-bold uppercase tracking-widest">Crear Torneo</span>
        </button>
      )}
    </div>
  );
};