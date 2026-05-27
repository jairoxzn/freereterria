import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  
  // Cerrar al pulsar Escape
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose();
    }
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full m-4',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop de desenfoque premium */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm transition-opacity duration-300"
      ></div>

      {/* Caja del Modal */}
      <div
        className={`bg-white dark:bg-ferre-dark-card w-full ${sizeClasses[size]} rounded-2xl shadow-2xl border border-gray-100 dark:border-ferre-dark-border overflow-hidden z-10 animate-scale-in transition-all`}
      >
        {/* Cabecera */}
        <div className="px-6 py-5 border-b border-gray-50 dark:border-ferre-dark-border flex items-center justify-between">
          <h3 className="text-base font-bold text-gray-800 dark:text-slate-100 font-sans tracking-tight">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-50 dark:hover:bg-ferre-dark-border hover:text-gray-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cuerpo */}
        <div className="px-6 py-6 max-h-[calc(100vh-180px)] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
