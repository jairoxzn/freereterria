import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import { UserPlus, Shield, User, Mail, Lock, Loader2, Users, CheckCircle, ShieldAlert } from 'lucide-react';

export default function Register() {
  const { registerUser } = useAuth();
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('EMPLOYEE');
  const [isLoading, setIsLoading] = useState(false);
  const [systemUsers, setSystemUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Cargar lista de usuarios del sistema
  async function fetchUsers() {
    setLoadingUsers(true);
    try {
      // Como cargamos estadísticas de administrador o logs, podemos hacer un endpoint simple para jalar perfiles o reportes.
      // Escribiremos un endpoint en Express para jalar usuarios, pero dado que queremos mantener compatibilidad, podemos crear un servicio rápido de consulta o jalar directo.
      // El backend no tiene un CRUD de usuarios específico por razones de seguridad de negocio, pero podemos proveer una ruta o jalar perfiles.
      // Por ahora para el demo, listaremos los usuarios sembrados principales.
      setSystemUsers([
        { id: 1, name: 'Administrador Freereterria', email: 'admin@freereterria.com', role: 'ADMIN', createdAt: '2026-05-27T05:00:00Z' },
        { id: 2, name: 'Juan Pérez Empleado', email: 'empleado@freereterria.com', role: 'EMPLOYEE', createdAt: '2026-05-27T05:00:00Z' }
      ]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingUsers(false);
    }
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      showToast('Por favor completa todos los campos obligatorios.', 'warning');
      return;
    }

    setIsLoading(true);
    const result = await registerUser({ name, email, password, role });
    setIsLoading(false);

    if (result.success) {
      showToast('¡Usuario registrado con éxito en el sistema!', 'success');
      setName('');
      setEmail('');
      setPassword('');
      setRole('EMPLOYEE');
      
      // Agregar temporalmente al listado en memoria
      setSystemUsers(prev => [
        ...prev,
        {
          id: Date.now(),
          name,
          email,
          role,
          createdAt: new Date().toISOString()
        }
      ]);
    } else {
      showToast(result.message, 'error');
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Encabezado */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-gray-800 dark:text-slate-100 font-sans tracking-tight">
          Gestión de Usuarios
        </h1>
        <p className="text-sm text-gray-400 font-medium mt-1">
          Registra personal y administra los roles de acceso al inventario y POS.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Lado Izquierdo: Formulario de Registro */}
        <div className="lg:col-span-1 bg-white dark:bg-ferre-dark-card rounded-2xl shadow-xl border border-gray-100 dark:border-ferre-dark-border p-6 h-fit">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-50 dark:border-ferre-dark-border">
            <div className="p-2 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 rounded-xl">
              <UserPlus className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-gray-800 dark:text-slate-200">Registrar Personal</h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Nombre */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-slate-400">
                Nombre Completo
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-slate-950/40 border border-gray-200 dark:border-ferre-dark-border rounded-xl text-sm focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/10 dark:text-white transition-all"
                  placeholder="Juan López"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-slate-400">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-slate-950/40 border border-gray-200 dark:border-ferre-dark-border rounded-xl text-sm focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/10 dark:text-white transition-all"
                  placeholder="empleado@freereterria.com"
                  required
                />
              </div>
            </div>

            {/* Contraseña */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-slate-400">
                Contraseña Temporal
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-slate-950/40 border border-gray-200 dark:border-ferre-dark-border rounded-xl text-sm focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/10 dark:text-white transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {/* Rol */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-slate-400">
                Rol del Sistema
              </label>
              <div className="relative">
                <Shield className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-slate-950/40 border border-gray-200 dark:border-ferre-dark-border rounded-xl text-sm focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/10 dark:text-white transition-all cursor-pointer"
                >
                  <option value="EMPLOYEE">Empleado POS / Inventario</option>
                  <option value="ADMIN">Administrador General</option>
                </select>
              </div>
            </div>

            {/* Botón de Enviar */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 mt-4 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all duration-300 shadow-lg shadow-yellow-500/10 disabled:opacity-50 active:scale-[0.98]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Registrando...</span>
                </>
              ) : (
                <>
                  <span>Registrar Usuario</span>
                </>
              )}
            </button>

          </form>
        </div>

        {/* Lado Derecho: Listado de Usuarios Existientes */}
        <div className="lg:col-span-2 bg-white dark:bg-ferre-dark-card rounded-2xl shadow-xl border border-gray-100 dark:border-ferre-dark-border p-6">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-50 dark:border-ferre-dark-border">
            <div className="p-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-gray-800 dark:text-slate-200">Personal Registrado</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="ferre-table">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Correo</th>
                  <th>Rol</th>
                  <th>Fecha Registro</th>
                </tr>
              </thead>
              <tbody>
                {systemUsers.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-ferre-dark-border/20 transition-colors">
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl flex items-center justify-center font-bold text-sm">
                          {u.name.substring(0, 2).toUpperCase()}
                        </div>
                        <span className="font-semibold text-gray-800 dark:text-slate-200">{u.name}</span>
                      </div>
                    </td>
                    <td className="text-gray-500 dark:text-slate-400">{u.email}</td>
                    <td>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        u.role === 'ADMIN'
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-900/50'
                          : 'bg-yellow-50 text-yellow-700 border border-yellow-200 dark:bg-yellow-950/40 dark:text-yellow-400 dark:border-yellow-900/50'
                      }`}>
                        {u.role === 'ADMIN' ? (
                          <>
                            <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                            <span>Admin</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>Empleado</span>
                          </>
                        )}
                      </span>
                    </td>
                    <td className="text-xs text-gray-450 font-medium">
                      {new Date(u.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
}
