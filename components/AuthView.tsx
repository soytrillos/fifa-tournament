
import React, { useState } from 'react';
import { Button } from './Button';
import { Trophy, Mail, Lock, User as UserIcon, ArrowRight } from 'lucide-react';
import { db } from '../services/db';
import { User } from '../types';

interface Props {
  onLogin: (user: User) => void;
}

export const AuthView: React.FC<Props> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate network delay
    setTimeout(() => {
      try {
        if (isLogin) {
          const user = db.login(formData.email, formData.password);
          onLogin(user);
        } else {
          if (!formData.username) throw new Error("Nombre de usuario requerido");
          const user = db.register(formData.username, formData.email, formData.password);
          onLogin(user);
        }
      } catch (err: any) {
        setError(err.message || 'Error desconocido');
        setIsLoading(false);
      }
    }, 800);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
       <div className="w-full max-w-md glass-panel p-8 rounded-3xl border border-white/10 shadow-2xl animate-fade-in-up">
          
          <div className="text-center mb-8">
            <div className="bg-gradient-to-r from-cyan-500 to-blue-600 p-3 rounded-xl inline-block mb-4 shadow-lg shadow-cyan-500/30">
                <Trophy className="text-white w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold tracking-tighter uppercase">FIFA 26</h1>
            <p className="text-cyan-400 text-sm tracking-widest uppercase font-semibold">Tournament Master</p>
          </div>

          <h2 className="text-xl font-bold text-white mb-6 text-center">
            {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
             {!isLogin && (
               <div className="space-y-1">
                 <div className="relative">
                   <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                   <input 
                     type="text" 
                     placeholder="Usuario" 
                     className="w-full bg-black/40 border border-white/20 rounded-xl py-3 pl-10 pr-4 text-white focus:border-cyan-400 outline-none transition-colors"
                     value={formData.username}
                     onChange={e => setFormData({...formData, username: e.target.value})}
                     required
                   />
                 </div>
               </div>
             )}

             <div className="relative">
               <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
               <input 
                 type="email" 
                 placeholder="Correo Electrónico" 
                 className="w-full bg-black/40 border border-white/20 rounded-xl py-3 pl-10 pr-4 text-white focus:border-cyan-400 outline-none transition-colors"
                 value={formData.email}
                 onChange={e => setFormData({...formData, email: e.target.value})}
                 required
               />
             </div>

             <div className="relative">
               <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
               <input 
                 type="password" 
                 placeholder="Contraseña" 
                 className="w-full bg-black/40 border border-white/20 rounded-xl py-3 pl-10 pr-4 text-white focus:border-cyan-400 outline-none transition-colors"
                 value={formData.password}
                 onChange={e => setFormData({...formData, password: e.target.value})}
                 required
               />
             </div>

             {error && (
               <div className="bg-red-500/20 border border-red-500/50 text-red-200 text-sm p-3 rounded-lg text-center">
                 {error}
               </div>
             )}

             <Button 
                type="submit" 
                className="w-full py-4 text-lg" 
                isLoading={isLoading}
             >
                {isLogin ? 'Entrar' : 'Registrarse'} <ArrowRight className="ml-2 w-5 h-5" />
             </Button>
          </form>

          <div className="mt-6 text-center">
             <button 
               onClick={() => { setIsLogin(!isLogin); setError(''); }}
               className="text-gray-400 hover:text-white text-sm transition-colors"
             >
               {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia Sesión'}
             </button>
          </div>
       </div>
    </div>
  );
};
