import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Cargar variables de entorno basadas en el modo (development/production)
  // El tercer argumento '' carga todas las variables, no solo las que empiezan con VITE_
  const env = loadEnv(mode, '.', '');

  return {
    plugins: [react()],
    base: 'https://github.com/soytrillos/fifa-tournamen', // Mantiene rutas relativas
    define: {
      // Esto permite que el código frontend acceda a process.env.API_KEY
      'process.env.API_KEY': JSON.stringify(env.API_KEY)
    }
  };
});
