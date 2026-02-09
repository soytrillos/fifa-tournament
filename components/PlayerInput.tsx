import React, { useState, useRef } from 'react';
import { Player, Team } from '../types';
import { Button } from './Button';
import { TeamCustomizer } from './TeamCustomizer';
import { Users, X, Plus, Gamepad2, Settings2, ChevronUp, FileSpreadsheet, Download } from 'lucide-react';
import { read, utils, writeFile } from 'xlsx';

interface Props {
  players: Player[];
  teams: Team[]; // Available teams to edit
  onAddPlayer: (name: string) => void;
  onAddPlayers?: (names: string[]) => void;
  onRemovePlayer: (id: string) => void;
  onUpdateTeam: (index: number, team: Team) => void;
  onAddTeam?: (team: Team) => void;
  onRemoveTeam?: (index: number) => void;
  onResetTeams: () => void;
  onNext: () => void;
}

export const PlayerInput: React.FC<Props> = ({ 
  players, 
  teams,
  onAddPlayer,
  onAddPlayers,
  onRemovePlayer, 
  onUpdateTeam,
  onAddTeam,
  onRemoveTeam,
  onResetTeams,
  onNext 
}) => {
  const [name, setName] = useState('');
  const [showTeamEditor, setShowTeamEditor] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onAddPlayer(name.trim());
      setName('');
    }
  };

  const handleDownloadTemplate = () => {
    const ws = utils.json_to_sheet([
      { "Nombre": "Jugador 1" },
      { "Nombre": "Jugador 2" },
      { "Nombre": "Jugador 3" }
    ]);
    // Set column width for better readability
    ws['!cols'] = [{ wch: 30 }];
    
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Plantilla Jugadores");
    writeFile(wb, "plantilla_jugadores_fifa.xlsx");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = read(data);
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      // Convert sheet to array of arrays (header: 1)
      const jsonData = utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
      
      const namesToAdd: string[] = [];

      jsonData.forEach((row) => {
        // We assume the first column contains the names
        if (row[0] && typeof row[0] === 'string' && row[0].trim().length > 0) {
          const possibleName = row[0].trim();
          // Filter out likely headers
          if (['nombre', 'name', 'jugador', 'player', 'nombres'].includes(possibleName.toLowerCase())) {
            return;
          }
          namesToAdd.push(possibleName);
        }
      });
      
      if (namesToAdd.length > 0) {
        if (onAddPlayers) {
          onAddPlayers(namesToAdd);
        } else {
          // Fallback if batch function not provided
          namesToAdd.forEach(n => onAddPlayer(n));
        }
      } else {
        alert("No se encontraron nombres válidos en la primera columna del Excel.");
      }

    } catch (error) {
      console.error("Error parsing Excel:", error);
      alert("Error al leer el archivo. Asegúrate de que sea un Excel válido (.xlsx, .xls).");
    }

    // Reset input value so same file can be selected again if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto glass-panel p-8 rounded-3xl shadow-2xl transition-all">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold flex items-center justify-center gap-3">
          <Gamepad2 className="text-fifa-accent" />
          Configuración del Torneo
        </h2>
        <p className="text-gray-400 mt-2">Registra jugadores y personaliza los equipos</p>
      </div>

      {/* Team Customization Toggle */}
      <div className="mb-8 border-b border-white/10 pb-8">
        <div className="flex justify-center mb-4">
           <Button 
             variant="secondary" 
             onClick={() => setShowTeamEditor(!showTeamEditor)}
             className={`text-sm ${showTeamEditor ? 'bg-cyan-900/40 border-cyan-500 text-cyan-400' : ''}`}
           >
             {showTeamEditor ? <ChevronUp size={18} className="mr-2"/> : <Settings2 size={18} className="mr-2"/>}
             {showTeamEditor ? 'Ocultar Editor de Equipos' : 'Personalizar Equipos / Escudos'}
           </Button>
        </div>

        {showTeamEditor && (
          <TeamCustomizer 
            teams={teams} 
            onUpdateTeam={onUpdateTeam} 
            onAddTeam={onAddTeam}
            onRemoveTeam={onRemoveTeam}
            onResetTeams={onResetTeams} 
          />
        )}
      </div>

      <div className="max-w-2xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-4">
           <h3 className="text-lg font-bold text-gray-300">Jugadores ({players.length})</h3>
           
           <div className="flex items-center gap-2">
             <button
               onClick={handleDownloadTemplate}
               className="flex items-center gap-2 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 py-2 rounded-lg transition-colors border border-gray-600"
               title="Descargar plantilla de ejemplo"
             >
               <Download size={16} />
               Plantilla
             </button>

             <div className="relative">
               <input 
                  type="file" 
                  ref={fileInputRef}
                  accept=".xlsx, .xls, .csv" 
                  onChange={handleFileUpload}
                  className="hidden" 
                  id="excel-upload"
               />
               <label 
                 htmlFor="excel-upload" 
                 className="cursor-pointer flex items-center gap-2 text-xs bg-green-700 hover:bg-green-600 text-white px-3 py-2 rounded-lg transition-colors border border-green-500 shadow-lg shadow-green-900/20"
               >
                 <FileSpreadsheet size={16} />
                 Importar Excel
               </label>
             </div>
           </div>
        </div>

        <form onSubmit={handleSubmit} className="mb-6 flex gap-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nombre del jugador..."
            className="flex-1 bg-black/40 border border-gray-600 rounded-xl px-6 py-4 text-lg text-white placeholder-gray-500 focus:outline-none focus:border-fifa-accent focus:ring-1 focus:ring-fifa-accent transition-all"
          />
          <Button type="submit" disabled={!name.trim()}>
            <Plus size={24} />
          </Button>
        </form>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
          {players.map((p) => (
            <div key={p.id} className="flex items-center justify-between bg-white/10 px-4 py-3 rounded-lg border border-white/5 animate-pulse-fast hover:animate-none hover:bg-white/20 hover:scale-[1.02] hover:shadow-lg hover:shadow-cyan-500/20 transition-all duration-300">
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-500 flex items-center justify-center font-bold text-xs">
                   {p.name.substring(0,2).toUpperCase()}
                 </div>
                 <span className="font-semibold">{p.name}</span>
              </div>
              <button 
                onClick={() => onRemovePlayer(p.id)}
                className="text-gray-400 hover:text-red-400 transition-colors p-1"
              >
                <X size={18} />
              </button>
            </div>
          ))}
          {players.length === 0 && (
            <div className="col-span-full text-center py-8 text-gray-500 border-2 border-dashed border-gray-700 rounded-xl">
              <div className="flex flex-col items-center">
                <Users className="w-12 h-12 mb-2 opacity-20" />
                <p>No hay jugadores todavía</p>
                <p className="text-xs mt-2 text-gray-600">Tip: Descarga la plantilla y sube un Excel</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t border-white/10">
          <Button 
            onClick={onNext} 
            disabled={players.length < 2}
            className="w-full sm:w-auto text-xl px-12"
          >
            Realizar Sorteo
          </Button>
        </div>
      </div>
    </div>
  );
};