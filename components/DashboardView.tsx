
import React, { useEffect, useState } from 'react';
import { User, SavedTournament } from '../types';
import { db } from '../services/db';
import { Button } from './Button';
import { Plus, Play, Trash2, Clock, Trophy, LogOut } from 'lucide-react';
import { TeamLogo } from './TeamLogo';

interface Props {
  user: User;
  onNewTournament: () => void;
  onLoadTournament: (save: SavedTournament) => void;
  onLogout: () => void;
}

export const DashboardView: React.FC<Props> = ({ user, onNewTournament, onLoadTournament, onLogout }) => {
  const [saves, setSaves] = useState<SavedTournament[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const loadData = async () => {
      try {
        const loaded = await db.getUserTournaments(user.id);
        if (mounted) {
           setSaves(loaded);
           setLoading(false);
        }
      } catch (err) {
        console.error("Failed to load tournaments", err);
        if (mounted) setLoading(false);
      }
    };
    
    loadData();
    return () => { mounted = false; };
  }, [user.id]);

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar este torneo?')) {
      try {
        await db.deleteTournament(id);
        setSaves(prev => prev.filter(s => s.id !== id));
      } catch (err) {
        alert('Error al eliminar');
      }
    }
  };

  const getStageLabel = (save: SavedTournament) => {
     if (save.state.stage === 'GROUPS') return 'Fase de Grupos';
     if (save.state.matchups.some(m => m.winnerId)) return 'Fase Final (En Progreso)';
     if (save.state.stage === 'BRACKET') return 'Sorteo / Eliminatorias';
     return 'Configuración';
  };

  if (loading) {
      return <div className="flex items-center justify-center min-h-[50vh]"><div className="animate-spin text-cyan-500"><Clock /></div></div>;
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-4 animate-fade-in-up">
       <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Hola, {user.username}</h1>
            <p className="text-gray-400">Bienvenido al Panel de Control de FIFA 26</p>
          </div>
          <div className="flex gap-4">
             <Button onClick={onNewTournament} className="shadow-cyan-500/20">
               <Plus className="mr-2" /> Nuevo Torneo
             </Button>
             <Button variant="secondary" onClick={onLogout} className="border-red-500/30 text-red-300 hover:bg-red-900/20">
               <LogOut size={20} />
             </Button>
          </div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Create New Card (Visual shortcut) */}
          <div 
            onClick={onNewTournament}
            className="bg-white/5 border border-dashed border-white/10 rounded-2xl p-8 flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-white/10 hover:border-cyan-500/50 transition-all group min-h-[250px]"
          >
             <div className="w-16 h-16 rounded-full bg-cyan-500/10 group-hover:bg-cyan-500/20 flex items-center justify-center transition-colors">
                <Plus className="w-8 h-8 text-cyan-500" />
             </div>
             <span className="text-xl font-bold text-gray-300 group-hover:text-white">Crear Torneo</span>
          </div>

          {saves.map(save => (
            <div key={save.id} className="bg-gray-900 border border-white/10 rounded-2xl overflow-hidden hover:border-cyan-500/50 transition-all shadow-xl group flex flex-col">
               <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-6 border-b border-white/5 relative overflow-hidden">
                  <Trophy className="absolute -bottom-4 -right-4 w-24 h-24 text-white/5 group-hover:text-cyan-500/10 transition-colors transform rotate-12" />
                  <h3 className="text-xl font-bold text-white mb-1 relative z-10 truncate">{save.name}</h3>
                  <div className="flex items-center gap-2 text-xs text-cyan-400 font-mono relative z-10">
                    <span className="uppercase">{save.state.tournamentType || 'Personalizado'}</span>
                  </div>
               </div>
               
               <div className="p-6 flex-1 flex flex-col">
                  <div className="flex items-center gap-2 text-gray-400 text-sm mb-4">
                     <Clock size={14} />
                     Editado: {new Date(save.lastModified).toLocaleDateString()}
                  </div>
                  
                  <div className="mb-6">
                     <div className="text-xs text-gray-500 uppercase font-bold mb-2">Estado</div>
                     <div className="bg-white/5 rounded px-3 py-2 text-sm text-gray-200 border border-white/5">
                        {getStageLabel(save)}
                     </div>
                  </div>

                  {/* Preview Teams (First 4) */}
                  {save.state.groups.length > 0 && (
                      <div className="mb-6">
                        <div className="text-xs text-gray-500 uppercase font-bold mb-2">Líderes de Grupo</div>
                        <div className="flex -space-x-2 overflow-hidden py-1">
                            {save.state.groups.slice(0, 5).map(g => {
                                const leader = g.assignments[0]; // Naive leader preview
                                return (
                                    <div key={g.id} className="w-8 h-8 rounded-full border-2 border-gray-900 bg-gray-800" title={leader?.team.name}>
                                       {leader && <TeamLogo src={leader.team.logo} className="w-full h-full rounded-full object-contain" />}
                                    </div>
                                )
                            })}
                        </div>
                      </div>
                  )}

                  <div className="mt-auto flex gap-3 pt-4 border-t border-white/5">
                     <Button 
                       onClick={() => onLoadTournament(save)} 
                       className="flex-1 py-2 text-sm bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 shadow-none"
                     >
                       <Play size={16} className="mr-2" /> Continuar
                     </Button>
                     <Button 
                       variant="danger" 
                       onClick={() => handleDelete(save.id)}
                       className="py-2 px-3 bg-red-900/50 hover:bg-red-600 border border-red-800 text-red-200"
                     >
                       <Trash2 size={16} />
                     </Button>
                  </div>
               </div>
            </div>
          ))}
       </div>
    </div>
  );
};
