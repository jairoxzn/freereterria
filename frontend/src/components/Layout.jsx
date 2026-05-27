import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

export default function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(prev => !prev);
  };

  const closeMobileSidebar = () => {
    setIsMobileSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
      
      {/* Sidebar de Escritorio (fijo a la izquierda) */}
      <div className="hidden md:block">
        <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      </div>

      {/* Sidebar de Móviles (overlay deslizable) */}
      <div
        className={`fixed inset-0 z-40 md:hidden transition-opacity duration-300 ${
          isMobileSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Backdrop traslúcido */}
        <div
          onClick={closeMobileSidebar}
          className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
        ></div>

        {/* Contenido del Sidebar deslizable */}
        <div
          className={`absolute top-0 left-0 h-screen transition-transform duration-300 ease-in-out ${
            isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <Sidebar isOpen={true} toggleSidebar={closeMobileSidebar} />
        </div>
      </div>

      {/* Panel de Contenido Principal */}
      <div
        className={`min-h-screen transition-all duration-300 ${
          isSidebarOpen ? 'md:pl-64' : 'md:pl-20'
        }`}
      >
        <Navbar toggleMobileSidebar={toggleMobileSidebar} />
        
        {/* Renderizador de subrutas */}
        <main className="p-6 md:p-8 max-w-7xl mx-auto animate-fade-in">
          <Outlet />
        </main>
      </div>

    </div>
  );
}
