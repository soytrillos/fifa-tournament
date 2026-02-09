import React, { useState } from 'react';
import { Team } from '../types';
import { Button } from './Button';
import { Pencil, Save, X, Undo, Image as ImageIcon, Star, Plus, Trash2 } from 'lucide-react';
import { TeamLogo } from './TeamLogo';
import { createTeam, colors } from '../constants';

interface Props {
  teams: Team[];
  onUpdateTeam: (index: number, updatedTeam: Team) => void;
  onAddTeam?: (team: Team) => void;
  onRemoveTeam?: (index: number) => void;
  onResetTeams: () => void;
}

export const TeamCustomizer: React.FC<Props> = ({ teams, onUpdateTeam, onAddTeam, onRemoveTeam, onResetTeams }) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Team | null>(null);
  
  // State for creating a new team
  const [isCreating, setIsCreating] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamPlayer, setNewTeamPlayer] = useState('');
  const [newTeamLogo, setNewTeamLogo] = useState('');

  const startEdit = (index: number, team: Team) => {
    setEditingIndex(index);
    setEditForm({ ...team });
    setIsCreating(false);
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditForm(null);
  };

  const saveEdit = () => {
    if (editForm && editingIndex !== null) {
      onUpdateTeam(editingIndex, editForm);
      setEditingIndex(null);
      setEditForm(null);
    }
  };

  const handleAddTeam = () => {
    if (newTeamName.trim() && onAddTeam) {
       const newTeam = createTeam(newTeamName, 'Custom', 4, newTeamPlayer, newTeamLogo);
       onAddTeam(newTeam);
       setNewTeamName('');
       setNewTeamPlayer('');
       setNewTeamLogo('');
       setIsCreating(false);
    }
  };

  return (
    <div className="w-full animate-fade-in-up">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <Pencil size={20} className="text-cyan-400" />
          Editor de Equipos
        </h3>
        <div className="flex gap-2">
            {!isCreating && onAddTeam && (
                <Button onClick={() => setIsCreating(true)} className="text-xs py-2 h-auto px-4 bg-green-600 hover:bg-green-500 border-none shadow-none">
                    <Plus size={14} className="mr-1" /> Nuevo Equipo
                </Button>
            )}
            <Button variant="secondary" onClick={onResetTeams} className="text-xs py-2 h-auto">
            <Undo size={14} className="mr-2" />
            Restaurar Originales
            </Button>
        </div>
      </div>

      {/* CREATE NEW TEAM FORM */}
      {isCreating && (
         <div className="bg-gradient-to-br from-green-900/30 to-black border border-green-500/50 p-4 rounded-xl flex flex-col gap-3 shadow-lg mb-6 animate-fade-in-up">
            <h4 className="text-sm font-bold text-green-400 uppercase">Agregar Nuevo Equipo</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                    <label className="text-xs text-gray-400 uppercase font-bold">Nombre</label>
                    <input 
                        type="text" 
                        placeholder="Ej. Mi Equipo FC"
                        value={newTeamName} 
                        onChange={(e) => setNewTeamName(e.target.value)}
                        className="w-full bg-black/40 border border-white/20 rounded px-2 py-1 text-sm text-white focus:border-green-400 outline-none"
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-xs text-gray-400 uppercase font-bold">Jugador Estrella</label>
                    <input 
                        type="text" 
                        placeholder="Ej. El 10"
                        value={newTeamPlayer} 
                        onChange={(e) => setNewTeamPlayer(e.target.value)}
                        className="w-full bg-black/40 border border-white/20 rounded px-2 py-1 text-sm text-white focus:border-green-400 outline-none"
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-xs text-gray-400 uppercase font-bold">URL Escudo (Opcional)</label>
                    <input 
                        type="text" 
                        placeholder="https://..."
                        value={newTeamLogo} 
                        onChange={(e) => setNewTeamLogo(e.target.value)}
                        className="w-full bg-black/40 border border-white/20 rounded px-2 py-1 text-sm text-white focus:border-green-400 outline-none"
                    />
                </div>
            </div>
            <div className="flex justify-end gap-2 mt-2">
                <Button onClick={() => setIsCreating(false)} variant="secondary" className="text-xs py-1 h-auto">Cancelar</Button>
                <Button onClick={handleAddTeam} disabled={!newTeamName.trim()} className="text-xs py-1 h-auto bg-green-600">Guardar Equipo</Button>
            </div>
         </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
        {teams.map((team, index) => {
          const isEditing = editingIndex === index;

          if (isEditing && editForm) {
            return (
              <div key={index} className="bg-white/10 border border-cyan-500/50 p-4 rounded-xl flex flex-col gap-3 shadow-lg relative">
                <div className="absolute top-2 right-2 flex gap-1">
                   <button onClick={saveEdit} className="p-1.5 bg-green-600 rounded-lg hover:bg-green-500 text-white"><Save size={16} /></button>
                   <button onClick={cancelEdit} className="p-1.5 bg-red-600 rounded-lg hover:bg-red-500 text-white"><X size={16} /></button>
                </div>
                
                <div className="space-y-1">
                  <label className="text-xs text-cyan-400 uppercase font-bold">Equipo</label>
                  <input 
                    type="text" 
                    value={editForm.name} 
                    onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                    className="w-full bg-black/40 border border-white/20 rounded px-2 py-1 text-sm text-white focus:border-cyan-400 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-yellow-400 uppercase font-bold flex items-center gap-1"><Star size={10} /> Estrella</label>
                  <input 
                    type="text" 
                    value={editForm.starPlayer} 
                    onChange={(e) => setEditForm({...editForm, starPlayer: e.target.value})}
                    className="w-full bg-black/40 border border-white/20 rounded px-2 py-1 text-sm text-white focus:border-yellow-400 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-gray-400 uppercase font-bold flex items-center gap-1"><ImageIcon size={10} /> URL Escudo</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={editForm.logo} 
                      onChange={(e) => setEditForm({...editForm, logo: e.target.value})}
                      className="flex-1 bg-black/40 border border-white/20 rounded px-2 py-1 text-xs text-gray-300 focus:border-white/40 outline-none"
                    />
                    <div className="w-8 h-8 flex-shrink-0 bg-black/50 rounded flex items-center justify-center border border-white/10">
                      <TeamLogo src={editForm.logo} alt="preview" className="w-6 h-6 object-contain" fallbackText={editForm.name} />
                    </div>
                  </div>
                </div>
              </div>
            );
          }

          return (
            <div 
              key={index} 
              onClick={() => startEdit(index, team)}
              className="bg-black/20 hover:bg-white/10 border border-white/5 hover:border-cyan-400/30 p-3 rounded-xl flex items-center gap-3 cursor-pointer transition-all group relative"
            >
              <div className="w-12 h-12 flex-shrink-0 relative flex items-center justify-center bg-black/30 rounded-lg p-1">
                 <TeamLogo src={team.logo} alt={team.name} className="w-full h-full object-contain" fallbackText={team.name} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-gray-200 text-sm truncate group-hover:text-cyan-400 transition-colors">{team.name}</div>
                <div className="text-xs text-yellow-500/80 flex items-center gap-1 truncate">
                   <Star size={10} /> {team.starPlayer}
                </div>
              </div>
              <Pencil size={14} className="text-gray-600 group-hover:text-white opacity-0 group-hover:opacity-100 transition-all" />
              
              {onRemoveTeam && (
                <button 
                    onClick={(e) => { e.stopPropagation(); onRemoveTeam(index); }}
                    className="absolute -top-2 -right-2 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 hover:scale-110 transition-all z-10"
                    title="Eliminar equipo"
                >
                    <Trash2 size={12} />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};