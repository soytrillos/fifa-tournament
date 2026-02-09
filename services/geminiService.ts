import { GoogleGenAI } from "@google/genai";
import { Matchup, TournamentType } from '../types';

export const generateTournamentCommentary = async (
  tournamentType: TournamentType,
  matchups: Matchup[]
): Promise<string> => {
  if (!process.env.API_KEY) {
    return "API Key no configurada. No se puede generar el análisis.";
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Format the matchups into a readable string for the prompt
  const matchupText = matchups.map(m => {
    if (m.player2) {
      return `- ${m.player1.player.name} (${m.player1.team.name}) vs ${m.player2.player.name} (${m.player2.team.name})`;
    } else {
      return `- ${m.player1.player.name} (${m.player1.team.name}) pasa directo (BYE)`;
    }
  }).join('\n');

  const prompt = `
    Actúa como un narrador deportivo de fútbol muy emocionado y profesional (estilo Fernando Palomo o Mariano Closs).
    
    Estamos en un torneo de FIFA 26: "${tournamentType}".
    
    Aquí están los enfrentamientos sorteados:
    ${matchupText}
    
    Por favor genera un "Previo del Torneo" corto (max 150 palabras). 
    1. Menciona el "Partido de la Fecha" (el cruce más parejo o interesante).
    2. Haz una predicción divertida sobre quién podría ser el "Caballo Negro" (sorpresa).
    3. Usa emojis de fútbol y banderas.
    4. Mantén el tono divertido y competitivo.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "No se pudo generar el comentario.";
  } catch (error) {
    console.error("Error generating commentary:", error);
    return "El narrador está tomando un descanso (Error de conexión con IA).";
  }
};