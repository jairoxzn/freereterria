import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { History, Search, ArrowUpRight, ArrowDownLeft, AlertCircle, Loader2 } from 'lucide-react';

export default function Kardex() {
  const { showToast } = useToast();

  const [movements, setMovements] = useState([]);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filtros
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedType, setSelectedType] = useState('');

  async function loadMovements() {
    setIsLoading(true);
    try {
      const q = [];
      if (selectedProductId) q.push(`productId=${selectedProductId}`);
      if (selectedType) q.push(`type=${selectedType}`);

      const queryStr = q.length > 0 ? `?${q.join('&')}` : '';
      const response = await api.get(`/movements${queryStr}`);
      if (response.data.success) {
        setMovements(response.data.data);
      }
    } catch (e) {
      console.error(e);
      showToast('Error cargando el historial Kardex de movimientos.', 'error');
    } finally {
      setIsLoading(false);
    }
  }

  async function loadProductsSelector() {
    try {
      const response = await api.get('/products');
      if (response.data.success) {
        setProducts(response.data.data);
      }
    } catch (e) {
      console.error(e);
    }
  }

  useEffect(() => {
    loadMovements();
  }, [selectedProductId, selectedType]);

  useEffect(() => {
    loadProductsSelector();
  }, []);

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Encabezado */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-gray-800 dark:text-slate-100 font-sans tracking-tight">
          Kardex de Inventario
        </h1>
        <p className="text-sm text-gray-400 font-medium mt-1">
          Historial detallado de todas las entradas (compras), salidas (ventas) y ajustes manuales realizados.
        </p>
      </div>

      {/* Barra de Filtros */}
      <div className="bg-white dark:bg-ferre-dark-card p-5 rounded-2xl border border-gray-100 dark:border-ferre-dark-border shadow-xl shadow-slate-100/30 dark:shadow-none flex flex-col sm:flex-row gap-4 items-center">
        
        {/* Selector de Producto */}
        <div className="w-full sm:flex-1 flex items-center gap-2">
          <Search className="w-4 h-4 text-gray-400 shrink-0" />
          <select
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            className="w-full py-2.5 px-3 bg-gray-50 dark:bg-slate-950/40 border border-gray-200 dark:border-ferre-dark-border rounded-xl text-sm focus:outline-none focus:border-yellow-500 dark:text-white transition-all cursor-pointer font-semibold"
          >
            <option value="">Todos los Productos</option>
            {products.map(p => (
              <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
            ))}
          </select>
        </div>

        {/* Selector de Tipo Movimiento */}
        <div className="w-full sm:w-64 flex items-center gap-2">
          <History className="w-4 h-4 text-gray-400 shrink-0" />
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full py-2.5 px-3 bg-gray-50 dark:bg-slate-950/40 border border-gray-200 dark:border-ferre-dark-border rounded-xl text-sm focus:outline-none focus:border-yellow-500 dark:text-white transition-all cursor-pointer"
          >
            <option value="">Todos los Movimientos</option>
            <option value="INPUT">📥 Entradas (Ingresos/Compras)</option>
            <option value="OUTPUT">📤 Salidas (Ventas/Despachos)</option>
            <option value="ADJUSTMENT">🔧 Ajustes de Inventario</option>
          </select>
        </div>

      </div>

      {/* Tabla Kardex */}
      <div className="bg-white dark:bg-ferre-dark-card rounded-2xl border border-gray-100 dark:border-ferre-dark-border shadow-xl shadow-slate-100/30 dark:shadow-none overflow-hidden">
        {isLoading ? (
          <div className="text-center py-20 flex flex-col items-center gap-3">
            <Loader2 className="w-10 h-10 text-yellow-500 animate-spin" />
            <span className="text-sm font-medium text-gray-400">Cargando Kardex...</span>
          </div>
        ) : movements.length === 0 ? (
          <div className="text-center py-20 text-gray-400 flex flex-col items-center gap-2">
            <History className="w-16 h-16 text-gray-300" />
            <span className="text-sm font-semibold">No se registran movimientos para los filtros seleccionados.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="ferre-table">
              <thead>
                <tr>
                  <th>Fecha de Operación</th>
                  <th>Código SKU</th>
                  <th>Artículo / Producto</th>
                  <th className="text-center">Tipo</th>
                  <th className="text-center">Unidades</th>
                  <th>Razón / Justificación</th>
                  <th>Usuario Responsable</th>
                </tr>
              </thead>
              <tbody>
                {movements.map(mov => (
                  <tr key={mov.id} className="hover:bg-slate-50/50 dark:hover:bg-ferre-dark-border/20 transition-colors">
                    <td className="text-gray-500 dark:text-slate-400 font-semibold text-xs">
                      {new Date(mov.createdAt).toLocaleString('es-ES')}
                    </td>
                    <td className="font-bold text-gray-700 dark:text-slate-350">{mov.product?.sku}</td>
                    <td>
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-800 dark:text-slate-200">{mov.product?.name}</span>
                        <span className="text-[10px] text-gray-400 font-semibold">Stock Actual: {mov.product?.stock} uds</span>
                      </div>
                    </td>
                    <td>
                      <div className="flex justify-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          mov.type === 'INPUT'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/50'
                            : mov.type === 'OUTPUT'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/50'
                            : 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/50'
                        }`}>
                          {mov.type === 'INPUT' && (
                            <>
                              <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
                              <span>Entrada</span>
                            </>
                          )}
                          {mov.type === 'OUTPUT' && (
                            <>
                              <ArrowDownLeft className="w-3.5 h-3.5 shrink-0" />
                              <span>Salida</span>
                            </>
                          )}
                          {mov.type === 'ADJUSTMENT' && (
                            <>
                              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                              <span>Ajuste</span>
                            </>
                          )}
                        </span>
                      </div>
                    </td>
                    <td className="text-center">
                      <span className={`font-extrabold text-sm ${
                        mov.type === 'INPUT' ? 'text-emerald-600' : mov.type === 'OUTPUT' ? 'text-rose-500' : 'text-amber-500'
                      }`}>
                        {mov.type === 'INPUT' ? '+' : mov.type === 'OUTPUT' ? '-' : ''}
                        {mov.quantity} uds.
                      </span>
                    </td>
                    <td className="text-gray-500 dark:text-slate-400 font-semibold text-xs leading-relaxed max-w-xs truncate" title={mov.reason}>
                      {mov.reason}
                    </td>
                    <td className="text-gray-550 dark:text-slate-350 font-bold text-xs">
                      {mov.user?.name}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
