import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Hammer, Mail, Lock, Loader2, ArrowRight } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('Por favor completa todos los campos.', 'warning');
      return;
    }

    setIsLoading(true);
    const result = await login(email, password);
    setIsLoading(false);

    if (result.success) {
      showToast('¡Inicio de sesión exitoso! Bienvenido.', 'success');
      navigate('/');
    } else {
      showToast(result.message, 'error');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 px-4 relative overflow-hidden">
      
      {/* Círculos de Luces de Fondo (Estilo Premium) */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>

      <div className="w-full max-w-md z-10 animate-fade-in">
        
        {/* Contenedor Flotante de Vidrio */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 shadow-2xl rounded-3xl p-8 md:p-10 text-center">
          
          {/* Logo */}
          <div className="mx-auto w-16 h-16 bg-yellow-500 text-slate-950 rounded-2xl flex items-center justify-center shadow-2xl shadow-yellow-500/20 mb-6">
            <Hammer className="w-8 h-8 animate-swing" />
          </div>

          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
            Freereterria
          </h1>
          <p className="text-sm text-slate-400 font-medium mt-2">
            Sistema Profesional de Inventario y POS
          </p>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5 text-left">
            
            {/* Email */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-950/40 border border-slate-700/60 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/10 transition-all font-medium"
                  placeholder="ejemplo@freereterria.com"
                  required
                />
              </div>
            </div>

            {/* Contraseña */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-950/40 border border-slate-700/60 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/10 transition-all font-medium"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {/* Nota de credenciales de prueba para el usuario */}
            <div className="p-3.5 bg-slate-800/40 rounded-xl border border-slate-700/30 text-xs text-slate-400 leading-relaxed font-medium">
              <span className="font-bold text-yellow-500">Credenciales Demo:</span>
              <ul className="mt-1 flex flex-col gap-0.5 list-disc pl-4">
                <li><span className="font-bold">Admin:</span> admin@freereterria.com / admin123</li>
                <li><span className="font-bold">Empleado:</span> empleado@freereterria.com / empleado123</li>
              </ul>
            </div>

            {/* Botón de Enviar */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 mt-2 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all duration-300 shadow-xl shadow-yellow-500/10 hover:shadow-yellow-500/20 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Iniciando sesión...</span>
                </>
              ) : (
                <>
                  <span>Ingresar al Sistema</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>

          </form>

        </div>

        {/* Footer simple */}
        <p className="text-center text-xs text-slate-500 mt-6 font-medium">
          © 2026 Freereterria Inc. Todos los derechos reservados.
        </p>

      </div>
    </div>
  );
}
