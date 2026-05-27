import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';
import { Menu, Sun, Moon, Bell, AlertTriangle, User, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Navbar({ toggleMobileSidebar }) {
  const { user } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Cargar alertas de bajo stock
  useEffect(() => {
    async function fetchAlerts() {
      try {
        const response = await api.get('/products?lowStock=true');
        if (response.data.success) {
          setLowStockProducts(response.data.data);
        }
      } catch (error) {
        console.error('Error cargando alertas de bajo stock:', error);
      }
    }

    fetchAlerts();
    
    // Recargar alertas cada 2 minutos
    const interval = setInterval(fetchAlerts, 120000);
    return () => clearInterval(interval);
  }, []);

  // Cerrar dropdown al hacer click afuera
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-20 w-full h-20 bg-white/80 dark:bg-ferre-dark/80 backdrop-blur-md border-b border-gray-100 dark:border-ferre-dark-border px-6 flex items-center justify-between transition-colors duration-200">
      
      {/* Lado Izquierdo: Mobile Hamburger */}
      <div className="flex items-center gap-4">
        <button
          onClick={toggleMobileSidebar}
          className="md:hidden p-2 rounded-xl text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-ferre-dark-border transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div>
          <h2 className="text-lg font-bold text-gray-800 dark:text-slate-100 font-sans tracking-tight">
            Panel de Inventario
          </h2>
          <p className="text-xs text-gray-400 font-medium">Ferretería Profesional</p>
        </div>
      </div>

      {/* Lado Derecho: Acciones Rápidas */}
      <div className="flex items-center gap-4">
        
        {/* Toggle Modo Oscuro */}
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-xl border border-gray-100 dark:border-ferre-dark-border hover:bg-gray-50 dark:hover:bg-ferre-dark-border text-gray-500 dark:text-gray-400 transition-all duration-200"
          title="Cambiar tema de color"
        >
          {isDarkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-indigo-600" />}
        </button>

        {/* Notificaciones / Alertas de Bajo Stock */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className={`p-2.5 rounded-xl border border-gray-100 dark:border-ferre-dark-border hover:bg-gray-50 dark:hover:bg-ferre-dark-border text-gray-500 dark:text-gray-400 transition-all duration-200 relative ${
              lowStockProducts.length > 0 ? 'bg-amber-50/50 border-amber-200/50 dark:bg-amber-950/20 dark:border-amber-900/30' : ''
            }`}
          >
            <Bell className={`w-5 h-5 ${lowStockProducts.length > 0 ? 'text-amber-500 animate-swing' : ''}`} />
            
            {lowStockProducts.length > 0 && (
              <span className="absolute top-0 right-0 w-5 h-5 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center -translate-y-1 translate-x-1 shadow-lg shadow-rose-500/20">
                {lowStockProducts.length}
              </span>
            )}
          </button>

          {/* Dropdown de Alertas */}
          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-ferre-dark-card rounded-2xl shadow-2xl border border-gray-100 dark:border-ferre-dark-border animate-scale-in py-2 overflow-hidden z-50">
              <div className="px-4 py-2.5 border-b border-gray-50 dark:border-ferre-dark-border flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Alertas de Stock ({lowStockProducts.length})
                </span>
                {lowStockProducts.length > 0 && (
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                )}
              </div>

              <div className="max-h-64 overflow-y-auto">
                {lowStockProducts.length === 0 ? (
                  <div className="px-4 py-8 text-center text-gray-400 flex flex-col items-center gap-2">
                    <ShieldAlert className="w-8 h-8 text-emerald-500" />
                    <span className="text-sm font-medium">¡Todo en orden! Sin bajo stock.</span>
                  </div>
                ) : (
                  lowStockProducts.map(prod => (
                    <div
                      key={prod.id}
                      onClick={() => {
                        setShowNotifications(false);
                        navigate('/products');
                      }}
                      className="px-4 py-3 hover:bg-amber-50/50 dark:hover:bg-amber-950/20 border-b border-gray-50 dark:border-ferre-dark-border/50 cursor-pointer transition-colors flex items-start gap-3"
                    >
                      <div className="p-1.5 bg-amber-500/10 text-amber-500 rounded-lg shrink-0">
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">{prod.name}</p>
                        <p className="text-[10px] text-gray-400 font-medium">SKU: {prod.sku}</p>
                        <div className="flex gap-4 mt-1">
                          <span className="text-[10px] font-bold text-rose-500">Stock: {prod.stock}</span>
                          <span className="text-[10px] text-gray-400">Min: {prod.stockMin}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Separador */}
        <div className="h-8 w-px bg-gray-100 dark:bg-ferre-dark-border hidden sm:block"></div>

        {/* Avatar Info del Usuario */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl">
            <User className="w-4 h-4" />
          </div>
          <div className="hidden lg:block text-left">
            <span className="block text-xs font-bold text-gray-800 dark:text-slate-200">{user?.name}</span>
            <span className="block text-[10px] text-slate-500 dark:text-yellow-500 font-bold uppercase mt-0.5">
              {user?.role === 'ADMIN' ? 'Administrador' : 'Empleado'}
            </span>
          </div>
        </div>

      </div>
    </header>
  );
}
