import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Tags,
  Users,
  Truck,
  History,
  FileBarChart2,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Hammer
} from 'lucide-react';

export default function Sidebar({ isOpen, toggleSidebar }) {
  const { user, logout, isAdmin } = useAuth();

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['ADMIN', 'EMPLOYEE'] },
    { name: 'POS Ventas', path: '/pos', icon: ShoppingBag, roles: ['ADMIN', 'EMPLOYEE'] },
    { name: 'Productos', path: '/products', icon: Package, roles: ['ADMIN', 'EMPLOYEE'] },
    { name: 'Categorías', path: '/categories', icon: Tags, roles: ['ADMIN', 'EMPLOYEE'] },
    { name: 'Proveedores', path: '/suppliers', icon: Truck, roles: ['ADMIN', 'EMPLOYEE'] },
    { name: 'Compras', path: '/purchases', icon: Truck, roles: ['ADMIN', 'EMPLOYEE'] },
    { name: 'Kardex Historial', path: '/kardex', icon: History, roles: ['ADMIN', 'EMPLOYEE'] },
    { name: 'Reportes y Logs', path: '/reports', icon: FileBarChart2, roles: ['ADMIN'] }, // Solo Admin
  ];

  const filteredMenu = menuItems.filter(item => item.roles.includes(user?.role));

  return (
    <aside
      className={`fixed top-0 left-0 z-30 h-screen bg-slate-900 text-white transition-all duration-300 ease-in-out border-r border-slate-800 ${
        isOpen ? 'w-64' : 'w-20'
      }`}
    >
      {/* Encabezado Logo */}
      <div className="flex items-center justify-between px-4 py-6 border-b border-slate-800">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="p-2.5 bg-yellow-500 text-slate-950 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-yellow-500/20 animate-pulse">
            <Hammer className="w-5 h-5" />
          </div>
          {isOpen && (
            <span className="text-xl font-bold tracking-wider font-sans bg-gradient-to-r from-white via-slate-100 to-yellow-400 bg-clip-text text-transparent">
              Freereterria
            </span>
          )}
        </div>
        <button
          onClick={toggleSidebar}
          className="hidden md:flex p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
        >
          {isOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </div>

      {/* Menú de Navegación */}
      <nav className="flex flex-col justify-between h-[calc(100vh-80px)] px-3 py-6 overflow-y-auto">
        <ul className="flex flex-col gap-1.5">
          {filteredMenu.map((item) => (
            <li key={item.name}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-4 px-4 py-3.5 rounded-xl font-medium text-sm transition-all duration-200 group relative ${
                    isActive
                      ? 'bg-yellow-500 text-slate-950 shadow-lg shadow-yellow-500/10'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`
                }
              >
                <item.icon className="w-5 h-5 shrink-0" />
                {isOpen && <span className="animate-fade-in">{item.name}</span>}
                
                {/* Tooltip cuando está colapsado */}
                {!isOpen && (
                  <div className="absolute left-full ml-4 px-2.5 py-1.5 bg-slate-950 text-white text-xs font-semibold rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-200 shadow-xl whitespace-nowrap z-50">
                    {item.name}
                  </div>
                )}
              </NavLink>
            </li>
          ))}
        </ul>

        {/* Sección de Usuario y Logout */}
        <div className="pt-6 border-t border-slate-800 flex flex-col gap-4">
          {isOpen && (
            <div className="px-4 py-3 bg-slate-850 rounded-xl border border-slate-800 flex flex-col">
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Sesión como</span>
              <span className="text-sm font-bold text-slate-100 truncate mt-0.5">{user?.name}</span>
              <span className="text-xs text-yellow-500 font-medium bg-yellow-500/10 px-2 py-0.5 rounded-full w-fit mt-1.5 border border-yellow-500/20">
                {user?.role === 'ADMIN' ? 'Administrador' : 'Empleado'}
              </span>
            </div>
          )}
          
          <button
            onClick={logout}
            className="flex items-center gap-4 px-4 py-3.5 rounded-xl font-medium text-sm text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-all duration-200 group relative"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {isOpen && <span>Cerrar Sesión</span>}
            
            {!isOpen && (
              <div className="absolute left-full ml-4 px-2.5 py-1.5 bg-rose-950 text-rose-300 text-xs font-semibold rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-200 shadow-xl whitespace-nowrap z-50">
                Cerrar Sesión
              </div>
            )}
          </button>
        </div>
      </nav>
    </aside>
  );
}
