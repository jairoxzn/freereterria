import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  ArrowRight,
  TrendingDown,
  ShoppingBag,
  History,
  ShieldCheck,
  Hammer
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

export default function Dashboard() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const response = await api.get('/reports/dashboard');
        if (response.data.success) {
          setStats(response.data.data);
        }
      } catch (error) {
        console.error('Error cargando estadísticas del dashboard:', error);
        showToast('No se pudieron cargar las estadísticas del panel.', 'error');
      } finally {
        setIsLoading(false);
      }
    }
    loadStats();
  }, [showToast]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium text-gray-500 dark:text-slate-400">Preparando estadísticas de la ferretería...</p>
      </div>
    );
  }

  // Colores para el gráfico de torta
  const COLORS = ['#1e3a8a', '#eab308', '#0ea5e9', '#10b981', '#6366f1', '#f43f5e'];

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-800 dark:text-slate-100 font-sans tracking-tight">
            ¡Hola, {user?.name.split(' ')[0]}!
          </h1>
          <p className="text-sm text-gray-400 font-medium mt-1">
            Aquí tienes el resumen de inventario y facturación de la ferretería hoy.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/pos')}
            className="px-5 py-3 bg-yellow-500 hover:bg-yellow-400 text-slate-950 text-sm font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-yellow-500/10 active:scale-[0.98]"
          >
            <ShoppingBag className="w-4.5 h-4.5" />
            <span>Abrir POS Ventas</span>
          </button>
        </div>
      </div>

      {/* Tarjetas de Estadísticas (Stats Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Total Productos */}
        <div className="bg-white dark:bg-ferre-dark-card rounded-2xl border border-gray-100 dark:border-ferre-dark-border p-6 flex items-center justify-between shadow-xl shadow-slate-100/40 dark:shadow-none hover-float">
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Productos</span>
            <h3 className="text-2xl font-black text-gray-850 dark:text-slate-100">
              {stats?.totalProducts || 0}
            </h3>
            <span className="text-[10px] text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              Catálogo Activo
            </span>
          </div>
          <div className="p-4 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl">
            <Package className="w-6 h-6" />
          </div>
        </div>

        {/* Bajo Stock */}
        <div
          onClick={() => navigate('/products')}
          className={`bg-white dark:bg-ferre-dark-card rounded-2xl border p-6 flex items-center justify-between shadow-xl shadow-slate-100/40 dark:shadow-none hover-float cursor-pointer ${
            stats?.lowStockCount > 0
              ? 'border-amber-200 bg-amber-50/20 dark:border-amber-900/40 dark:bg-amber-950/10'
              : 'border-gray-100 dark:border-ferre-dark-border'
          }`}
        >
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Bajo Stock</span>
            <h3 className={`text-2xl font-black ${stats?.lowStockCount > 0 ? 'text-amber-600 dark:text-amber-400 animate-pulse' : 'text-gray-850 dark:text-slate-100'}`}>
              {stats?.lowStockCount || 0}
            </h3>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
              stats?.lowStockCount > 0
                ? 'text-amber-600 bg-amber-500/10 border-amber-500/20'
                : 'text-gray-400 bg-gray-100 dark:bg-transparent border-transparent'
            }`}>
              {stats?.lowStockCount > 0 ? 'Requiere Atención' : 'Stock saludable'}
            </span>
          </div>
          <div className={`p-4 rounded-2xl ${
            stats?.lowStockCount > 0
              ? 'bg-amber-500/15 text-amber-500'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
          }`}>
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        {/* Ventas del Día */}
        <div className="bg-white dark:bg-ferre-dark-card rounded-2xl border border-gray-100 dark:border-ferre-dark-border p-6 flex items-center justify-between shadow-xl shadow-slate-100/40 dark:shadow-none hover-float">
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Ventas del Día</span>
            <h3 className="text-2xl font-black text-gray-850 dark:text-slate-100">
              S/. {(stats?.salesToday || 0).toFixed(2)}
            </h3>
            <span className="text-[10px] text-indigo-500 font-bold bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
              {stats?.salesCountToday || 0} tickets emitidos
            </span>
          </div>
          <div className="p-4 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Ganancias Mensuales */}
        <div className="bg-white dark:bg-ferre-dark-card rounded-2xl border border-gray-100 dark:border-ferre-dark-border p-6 flex items-center justify-between shadow-xl shadow-slate-100/40 dark:shadow-none hover-float">
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Facturación del Mes</span>
            <h3 className="text-2xl font-black text-gray-850 dark:text-slate-100">
              S/. {(stats?.earningsMonth || 0).toFixed(2)}
            </h3>
            <span className="text-[10px] text-yellow-600 font-bold bg-yellow-500/15 px-2 py-0.5 rounded-full border border-yellow-500/20">
              Mes actual
            </span>
          </div>
          <div className="p-4 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 rounded-2xl">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Gráficos de Ventas e Inventario */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Gráfico de Líneas - Tendencia de Ventas */}
        <div className="lg:col-span-2 bg-white dark:bg-ferre-dark-card rounded-2xl border border-gray-100 dark:border-ferre-dark-border p-6 shadow-xl shadow-slate-100/30 dark:shadow-none">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-extrabold text-gray-800 dark:text-slate-100">Tendencia de Facturación</h3>
              <p className="text-xs text-gray-400">Ventas consolidada de los últimos 7 días</p>
            </div>
            <TrendingUp className="w-5 h-5 text-indigo-500" />
          </div>
          
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.salesTrend || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" className="dark:stroke-ferre-dark-border/50" />
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} />
                <ChartTooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: 'none',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px'
                  }}
                  formatter={(value) => [`S/. ${value.toFixed(2)}`, 'Ventas']}
                />
                <Area type="monotone" dataKey="ventas" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico de Torta - Distribución de Stock por Categoría */}
        <div className="bg-white dark:bg-ferre-dark-card rounded-2xl border border-gray-100 dark:border-ferre-dark-border p-6 shadow-xl shadow-slate-100/30 dark:shadow-none">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-extrabold text-gray-800 dark:text-slate-100">Stock por Categorías</h3>
              <p className="text-xs text-gray-400">Distribución física en unidades</p>
            </div>
            <Package className="w-5 h-5 text-yellow-500" />
          </div>

          <div className="h-64 flex flex-col justify-center items-center">
            {stats?.categoryDist?.length === 0 ? (
              <p className="text-sm text-gray-400">Sin stock registrado.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats?.categoryDist || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {(stats?.categoryDist || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: 'none',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px'
                    }}
                    formatter={(value) => [`${value} uds.`, 'Stock']}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '10px', color: '#9ca3af' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>

      {/* Alertas de Stock Bajo (Tablas Rápidas) */}
      <div className="bg-white dark:bg-ferre-dark-card rounded-2xl border border-gray-100 dark:border-ferre-dark-border p-6 shadow-xl shadow-slate-100/30 dark:shadow-none">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-50 dark:border-ferre-dark-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 text-amber-500 rounded-xl">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-gray-800 dark:text-slate-100">Alertas Críticas de Reabastecimiento</h3>
              <p className="text-xs text-gray-400">Productos con existencias inferiores o iguales al límite mínimo</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/purchases')}
            className="text-xs font-bold text-yellow-600 hover:text-yellow-500 flex items-center gap-1 transition-colors"
          >
            <span>Registrar Compra Proveedor</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          {stats?.lowStockAlerts?.length === 0 ? (
            <div className="text-center py-8 text-gray-400 flex flex-col items-center gap-2">
              <ShieldCheck className="w-12 h-12 text-emerald-500 animate-bounce" />
              <p className="text-sm font-semibold text-gray-800 dark:text-slate-200">¡Felicidades! Todo el inventario se encuentra abastecido.</p>
            </div>
          ) : (
            <table className="ferre-table">
              <thead>
                <tr>
                  <th>Código SKU</th>
                  <th>Nombre Producto</th>
                  <th>Categoría</th>
                  <th>Marca</th>
                  <th>Stock Mínimo</th>
                  <th>Stock Actual</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {stats?.lowStockAlerts?.map(prod => (
                  <tr key={prod.id} className="hover:bg-slate-50/50 dark:hover:bg-ferre-dark-border/20 transition-colors">
                    <td className="font-bold text-gray-700 dark:text-slate-350">{prod.sku}</td>
                    <td className="font-semibold text-gray-800 dark:text-slate-200">{prod.name}</td>
                    <td className="text-gray-500 dark:text-slate-400">{prod.category?.name}</td>
                    <td className="text-gray-500 dark:text-slate-400">{prod.brand || '-'}</td>
                    <td className="text-gray-500 dark:text-slate-400 text-center">{prod.stockMin}</td>
                    <td>
                      <span className="font-black text-rose-500 bg-rose-500/10 px-2.5 py-1 rounded-lg border border-rose-500/20">
                        {prod.stock} uds.
                      </span>
                    </td>
                    <td>
                      <span className="text-[10px] font-bold text-rose-600 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                        Agotándose
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

    </div>
  );
}
