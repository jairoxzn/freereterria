import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import {
  FileText,
  FileSpreadsheet,
  Terminal,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  Loader2,
  Download,
  Printer,
  ChevronDown
} from 'lucide-react';

export default function Reports() {
  const { showToast } = useToast();
  const { isAdmin } = useAuth();

  const [systemLogs, setSystemLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logFilter, setLogFilter] = useState('ALL'); // "ALL", "INFO", "WARN", "ERROR"

  // Cargar logs de auditoría (Solo Admin)
  async function loadLogs() {
    if (!isAdmin) return;
    setLoadingLogs(true);
    try {
      const response = await api.get('/reports/logs');
      if (response.data.success) {
        setSystemLogs(response.data.data);
      }
    } catch (e) {
      console.error(e);
      showToast('Error cargando los registros de auditoría.', 'error');
    } finally {
      setLoadingLogs(false);
    }
  }

  useEffect(() => {
    loadLogs();
  }, []);

  // Filtrado de logs en memoria
  const filteredLogs = systemLogs.filter(log => {
    if (logFilter === 'ALL') return true;
    return log.includes(`[${logFilter}]`);
  });

  // EXPORTADOR A EXCEL (CSV UTF-8 COMPATIBLE CON EXCEL)
  const exportToCSV = async (reportType) => {
    try {
      showToast(`Generando reporte de ${reportType}...`, 'info');
      let dataToExport = [];
      let headers = [];
      let filename = `Reporte_${reportType}_${new Date().toISOString().slice(0,10)}.csv`;

      if (reportType === 'PRODUCTOS') {
        const res = await api.get('/products');
        if (res.data.success) {
          headers = ['ID', 'SKU', 'PRODUCTO', 'CATEGORIA', 'MARCA', 'COSTO COMPRA (S/.)', 'PRECIO VENTA (S/.)', 'STOCK FISICO', 'STOCK MINIMO', 'ESTADO'];
          dataToExport = res.data.data.map(p => [
            p.id,
            p.sku,
            `"${p.name.replace(/"/g, '""')}"`,
            `"${p.category?.name || ''}"`,
            `"${p.brand || ''}"`,
            p.pricePurchase.toFixed(2),
            p.priceSale.toFixed(2),
            p.stock,
            p.stockMin,
            p.status
          ]);
        }
      } else if (reportType === 'VENTAS') {
        const res = await api.get('/sales');
        if (res.data.success) {
          headers = ['ID TICKET', 'FECHA EMISION', 'OPERADOR CAJERO', 'DESCUENTO (S/.)', 'TOTAL COBRADO (S/.)'];
          dataToExport = res.data.data.map(s => [
            `TICK-${String(s.id).padStart(5, '0')}`,
            new Date(s.createdAt).toLocaleString('es-ES'),
            `"${s.user?.name || ''}"`,
            s.discount.toFixed(2),
            s.total.toFixed(2)
          ]);
        }
      } else if (reportType === 'INVENTARIO_KARDEX') {
        const res = await api.get('/movements');
        if (res.data.success) {
          headers = ['FECHA', 'SKU', 'PRODUCTO', 'TIPO MOVIMIENTO', 'CANTIDAD (UDS)', 'RESPONSABLE', 'RAZON / JUSTIFICACION'];
          dataToExport = res.data.data.map(m => [
            new Date(m.createdAt).toLocaleString('es-ES'),
            m.product?.sku || '',
            `"${m.product?.name || ''}"`,
            m.type,
            m.quantity,
            `"${m.user?.name || ''}"`,
            `"${m.reason.replace(/"/g, '""')}"`
          ]);
        } else {
          return;
        }
      } else if (reportType === 'GANANCIAS') {
        // Reporte consolidado de rentabilidad
        const [salesRes, prodRes] = await Promise.all([
          api.get('/sales'),
          api.get('/products')
        ]);

        if (salesRes.data.success && prodRes.data.success) {
          headers = ['MES FACTURADO', 'COSTO INVERSION COMPRA (S/.)', 'INGRESOS TOTALES VENTA (S/.)', 'Rendimiento Margen Utilidad'];
          // Simular reporte mensual consolidad
          const totalIngresos = salesRes.data.data.reduce((acc, curr) => acc + curr.total, 0);
          // Calcular costo acumulado aproximado
          const totalCosto = salesRes.data.data.reduce((acc, curr) => {
            const saleCost = curr.saleDetails?.reduce((dAcc, dCurr) => {
              const cost = dCurr.product?.pricePurchase || 0.00;
              return dAcc + (dCurr.quantity * cost);
            }, 0) || 0;
            return acc + saleCost;
          }, 0);
          
          const utilidad = totalIngresos - totalCosto;
          const margen = totalIngresos > 0 ? (utilidad / totalIngresos) * 100 : 0;

          dataToExport = [
            [
              new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }).toUpperCase(),
              totalCosto.toFixed(2),
              totalIngresos.toFixed(2),
              `S/. ${utilidad.toFixed(2)} (${margen.toFixed(1)}%)`
            ]
          ];
        }
      }

      // Estructurar CSV con UTF-8 BOM para soporte correcto de caracteres con tilde en Excel
      const csvContent = "\uFEFF" + [headers.join(','), ...dataToExport.map(row => row.join(','))].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast(`¡Reporte de ${reportType} exportado con éxito!`, 'success');
    } catch (e) {
      console.error(e);
      showToast('Error al exportar reporte a Excel/CSV.', 'error');
    }
  };

  // NATIVO IMPRESION PDF DESDE EL NAVEGADOR
  const printReport = () => {
    window.print();
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <AlertTriangle className="w-16 h-16 text-amber-500 animate-pulse" />
        <h2 className="text-xl font-bold text-gray-800 dark:text-slate-100">Acceso Restringido</h2>
        <p className="text-sm text-gray-400 max-w-md font-medium leading-relaxed">
          Esta zona contiene estadísticas consolidadas de facturación y logs de auditoría del sistema. Solo está disponible para usuarios administradores.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Encabezado */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-gray-800 dark:text-slate-100 font-sans tracking-tight">
          Reportes y Auditoría del Sistema
        </h1>
        <p className="text-sm text-gray-400 font-medium mt-1">
          Descarga informes fiscales de facturación en formato compatible con Excel o audita logs de seguridad.
        </p>
      </div>

      {/* PANEL DE REPORTES DISPONIBLES (Grid) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Reporte Ventas */}
        <div className="bg-white dark:bg-ferre-dark-card border border-gray-100 dark:border-ferre-dark-border rounded-2xl p-5 shadow-xl shadow-slate-100/30 dark:shadow-none hover-float flex flex-col justify-between">
          <div className="space-y-3">
            <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl w-fit">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-gray-850 dark:text-slate-100 text-sm">Reporte de Ventas</h3>
              <p className="text-[11px] text-gray-400 leading-relaxed mt-1">Historial totalizador de tickets, descuentos y recaudaciones.</p>
            </div>
          </div>
          <button
            onClick={() => exportToCSV('VENTAS')}
            className="w-full mt-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-600/10 active:scale-[0.98] transition-all"
          >
            <Download className="w-4 h-4 shrink-0" />
            <span>Exportar Excel</span>
          </button>
        </div>

        {/* Reporte Productos */}
        <div className="bg-white dark:bg-ferre-dark-card border border-gray-100 dark:border-ferre-dark-border rounded-2xl p-5 shadow-xl shadow-slate-100/30 dark:shadow-none hover-float flex flex-col justify-between">
          <div className="space-y-3">
            <div className="p-3 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl w-fit">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-gray-850 dark:text-slate-100 text-sm">Catálogo & Costos</h3>
              <p className="text-[11px] text-gray-400 leading-relaxed mt-1">Exportación completa del stock, precios de costo y venta.</p>
            </div>
          </div>
          <button
            onClick={() => exportToCSV('PRODUCTOS')}
            className="w-full mt-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-blue-600/10 active:scale-[0.98] transition-all"
          >
            <Download className="w-4 h-4 shrink-0" />
            <span>Exportar Excel</span>
          </button>
        </div>

        {/* Reporte Inventario */}
        <div className="bg-white dark:bg-ferre-dark-card border border-gray-100 dark:border-ferre-dark-border rounded-2xl p-5 shadow-xl shadow-slate-100/30 dark:shadow-none hover-float flex flex-col justify-between">
          <div className="space-y-3">
            <div className="p-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl w-fit">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-gray-850 dark:text-slate-100 text-sm">Kardex de Movimiento</h3>
              <p className="text-[11px] text-gray-400 leading-relaxed mt-1">Lista cronológica del flujo de entrada y salida física.</p>
            </div>
          </div>
          <button
            onClick={() => exportToCSV('INVENTARIO_KARDEX')}
            className="w-full mt-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-amber-600/10 active:scale-[0.98] transition-all"
          >
            <Download className="w-4 h-4 shrink-0" />
            <span>Exportar Excel</span>
          </button>
        </div>

        {/* Reporte Rentabilidad */}
        <div className="bg-white dark:bg-ferre-dark-card border border-gray-100 dark:border-ferre-dark-border rounded-2xl p-5 shadow-xl shadow-slate-100/30 dark:shadow-none hover-float flex flex-col justify-between">
          <div className="space-y-3">
            <div className="p-3 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 rounded-xl w-fit">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-gray-850 dark:text-slate-100 text-sm">Rentabilidad Mensual</h3>
              <p className="text-[11px] text-gray-400 leading-relaxed mt-1">Márgenes brutos de ganancia (Ingresos menos Costos).</p>
            </div>
          </div>
          <button
            onClick={() => exportToCSV('GANANCIAS')}
            className="w-full mt-5 py-2.5 bg-yellow-500 hover:bg-yellow-450 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-yellow-500/10 active:scale-[0.98] transition-all"
          >
            <Download className="w-4 h-4 shrink-0" />
            <span>Exportar Excel</span>
          </button>
        </div>

      </div>

      {/* SECCIÓN DE AUDITORÍA TERMINAL DE LOGS */}
      <div className="bg-white dark:bg-ferre-dark-card rounded-2xl border border-gray-100 dark:border-ferre-dark-border p-6 shadow-xl shadow-slate-100/30 dark:shadow-none">
        
        {/* Cabecera Terminal */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-gray-50 dark:border-ferre-dark-border mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-900 text-slate-200 rounded-xl">
              <Terminal className="w-5 h-5 shrink-0" />
            </div>
            <div>
              <h3 className="font-extrabold text-gray-800 dark:text-slate-100">Logs de Auditoría de Operaciones</h3>
              <p className="text-xs text-gray-400 font-medium">Registro de auditoría forense de logins, POS, compras y base de datos.</p>
            </div>
          </div>

          {/* Filtros de Terminal */}
          <div className="flex gap-2">
            <select
              value={logFilter}
              onChange={(e) => setLogFilter(e.target.value)}
              className="py-1.5 px-3 bg-gray-50 dark:bg-slate-950/40 border border-gray-200 dark:border-ferre-dark-border rounded-xl text-xs focus:outline-none focus:border-yellow-500 dark:text-white transition-all cursor-pointer font-bold"
            >
              <option value="ALL">Ver todos los logs</option>
              <option value="INFO">🟢 Info General</option>
              <option value="WARN">🟡 Advertencias</option>
              <option value="ERROR">🔴 Errores Críticos</option>
            </select>
            <button
              onClick={loadLogs}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold rounded-xl border border-transparent dark:text-slate-200 transition-colors"
            >
              Recargar Terminal
            </button>
          </div>
        </div>

        {/* Consola Terminal */}
        <div className="bg-slate-950 text-slate-350 p-5 rounded-2xl border border-slate-850 font-mono text-xs h-96 overflow-y-auto space-y-2 relative shadow-2xl">
          {loadingLogs ? (
            <div className="absolute inset-0 bg-slate-950/60 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-yellow-500 animate-spin" />
            </div>
          ) : filteredLogs.length === 0 ? (
            <p className="text-slate-500 italic">No se registran logs forenses de auditoría en esta categoría.</p>
          ) : (
            filteredLogs.map((log, index) => {
              let color = 'text-slate-400';
              if (log.includes('[ERROR]')) color = 'text-rose-500 font-bold';
              if (log.includes('[WARN]')) color = 'text-amber-400 font-semibold';
              if (log.includes('[INFO]')) color = 'text-emerald-450';
              
              return (
                <p key={index} className={`leading-relaxed whitespace-pre-wrap ${color}`}>
                  {log}
                </p>
              );
            })
          )}
        </div>

      </div>

    </div>
  );
}
