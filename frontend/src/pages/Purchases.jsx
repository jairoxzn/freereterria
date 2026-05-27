import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';
import { Truck, Plus, Trash2, Loader2, ClipboardList, Calendar, DollarSign, User, ShieldAlert, ShoppingBag } from 'lucide-react';

export default function Purchases() {
  const { showToast } = useToast();

  const [purchases, setPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal Nueva Compra
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [supplierId, setSupplierId] = useState('');
  const [purchaseItems, setPurchaseItems] = useState([{ productId: '', quantity: 1, pricePurchase: 0.00 }]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal Ver Detalle Compra
  const [viewingPurchase, setViewingPurchase] = useState(null);

  async function loadPurchases() {
    setIsLoading(true);
    try {
      const response = await api.get('/purchases');
      if (response.data.success) {
        setPurchases(response.data.data);
      }
    } catch (e) {
      console.error(e);
      showToast('Error cargando historial de compras.', 'error');
    } finally {
      setIsLoading(false);
    }
  }

  async function loadFormSelectors() {
    try {
      const [supRes, prodRes] = await Promise.all([
        api.get('/suppliers'),
        api.get('/products')
      ]);

      if (supRes.data.success) setSuppliers(supRes.data.data);
      if (prodRes.data.success) setProducts(prodRes.data.data.filter(p => p.status === 'ACTIVE'));
    } catch (e) {
      console.error(e);
    }
  }

  useEffect(() => {
    loadPurchases();
    loadFormSelectors();
  }, []);

  const handleOpenAddModal = () => {
    if (suppliers.length === 0) {
      showToast('Primero debes registrar al menos un Proveedor.', 'warning');
      return;
    }
    if (products.length === 0) {
      showToast('Primero debes registrar al menos un Producto en el catálogo.', 'warning');
      return;
    }
    setSupplierId(suppliers[0]?.id || '');
    setPurchaseItems([{ productId: products[0]?.id || '', quantity: 1, pricePurchase: products[0]?.pricePurchase || 1.00 }]);
    setIsModalOpen(true);
  };

  const handleAddItemRow = () => {
    setPurchaseItems(prev => [...prev, { productId: products[0]?.id || '', quantity: 1, pricePurchase: products[0]?.pricePurchase || 1.00 }]);
  };

  const handleRemoveItemRow = (index) => {
    if (purchaseItems.length === 1) return;
    setPurchaseItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, field, value) => {
    setPurchaseItems(prev => {
      const updated = [...prev];
      updated[index][field] = value;
      
      // Auto-rellenar costo de compra cuando se cambia el producto
      if (field === 'productId') {
        const matchingProd = products.find(p => p.id === parseInt(value));
        if (matchingProd) {
          updated[index].pricePurchase = matchingProd.pricePurchase;
        }
      }
      return updated;
    });
  };

  // Cálculo del total acumulado del formulario
  const calculateFormTotal = () => {
    return purchaseItems.reduce((acc, item) => {
      const qty = parseInt(item.quantity) || 0;
      const cost = parseFloat(item.pricePurchase) || 0;
      return acc + (qty * cost);
    }, 0);
  };

  const handleSavePurchase = async (e) => {
    e.preventDefault();
    if (!supplierId || purchaseItems.some(i => !i.productId || i.quantity <= 0 || i.pricePurchase < 0)) {
      showToast('Datos inválidos en el carrito de compras.', 'warning');
      return;
    }

    setIsSubmitting(true);
    const payload = {
      supplierId: parseInt(supplierId),
      items: purchaseItems.map(i => ({
        productId: parseInt(i.productId),
        quantity: parseInt(i.quantity),
        pricePurchase: parseFloat(i.pricePurchase)
      }))
    };

    try {
      const response = await api.post('/purchases', payload);
      if (response.data.success) {
        showToast(response.data.message, 'success');
        setIsModalOpen(false);
        loadPurchases();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Error registrando la compra.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-800 dark:text-slate-100 font-sans tracking-tight">
            Abastecimiento y Compras
          </h1>
          <p className="text-sm text-gray-400 font-medium mt-1">
            Abastece tu ferretería registrando facturas de proveedores. Actualización automática de Kardex y existencias.
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="px-5 py-3 bg-yellow-500 hover:bg-yellow-400 text-slate-950 text-sm font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-yellow-500/10 active:scale-[0.98]"
        >
          <Plus className="w-5 h-5 shrink-0" />
          <span>Registrar Compra</span>
        </button>
      </div>

      {/* Listado de Historial de Compras */}
      <div className="bg-white dark:bg-ferre-dark-card rounded-2xl border border-gray-100 dark:border-ferre-dark-border shadow-xl shadow-slate-100/30 dark:shadow-none overflow-hidden">
        {isLoading ? (
          <div className="text-center py-20 flex flex-col items-center gap-3">
            <Loader2 className="w-10 h-10 text-yellow-500 animate-spin" />
            <span className="text-sm font-medium text-gray-400">Cargando historial de compras...</span>
          </div>
        ) : purchases.length === 0 ? (
          <div className="text-center py-20 text-gray-400 flex flex-col items-center gap-3">
            <ClipboardList className="w-16 h-16 text-gray-300" />
            <span className="text-sm font-semibold">No se registran compras previas de abastecimiento.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="ferre-table">
              <thead>
                <tr>
                  <th>Factura #</th>
                  <th>Proveedor</th>
                  <th>Fecha de Ingreso</th>
                  <th>Encargado</th>
                  <th>Ítems</th>
                  <th className="text-right">Total Facturado</th>
                  <th className="text-center">Acción</th>
                </tr>
              </thead>
              <tbody>
                {purchases.map(pur => (
                  <tr key={pur.id} className="hover:bg-slate-50/50 dark:hover:bg-ferre-dark-border/20 transition-colors">
                    <td className="font-bold text-gray-700 dark:text-slate-350">COMP-${String(pur.id).padStart(5, '0')}</td>
                    <td className="font-bold text-gray-800 dark:text-slate-200">{pur.supplier?.name}</td>
                    <td className="text-gray-500 dark:text-slate-400">
                      <div className="flex items-center gap-1.5 text-xs font-semibold">
                        <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span>{new Date(pur.createdAt).toLocaleString('es-ES')}</span>
                      </div>
                    </td>
                    <td className="text-gray-500 dark:text-slate-400">
                      <div className="flex items-center gap-1.5 text-xs font-semibold">
                        <User className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span>{pur.user?.name.split(' ')[0]}</span>
                      </div>
                    </td>
                    <td>
                      <span className="px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-300 rounded-full text-xs font-bold">
                        {pur.details?.length || 0} productos
                      </span>
                    </td>
                    <td className="font-extrabold text-slate-850 dark:text-slate-100 text-right">
                      S/. {pur.total.toFixed(2)}
                    </td>
                    <td>
                      <div className="flex justify-center">
                        <button
                          onClick={() => setViewingPurchase(pur)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                        >
                          Ver Detalle
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Registrar Compra */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Registrar Compra de Abastecimiento"
        size="xl"
      >
        <form onSubmit={handleSavePurchase} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Proveedor */}
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Distribuidor / Proveedor *</label>
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-950/40 border border-gray-200 dark:border-ferre-dark-border rounded-xl text-sm focus:outline-none focus:border-yellow-500 dark:text-white transition-all cursor-pointer font-semibold"
                required
              >
                {suppliers.map(sup => (
                  <option key={sup.id} value={sup.id}>{sup.name} ({sup.email})</option>
                ))}
              </select>
            </div>
            
            {/* Total Factura (Visual) */}
            <div className="bg-slate-900 text-yellow-500 border border-transparent rounded-2xl p-4 flex flex-col justify-center items-center shadow-lg">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Total Compra</span>
              <span className="text-2xl font-black">S/. {calculateFormTotal().toFixed(2)}</span>
            </div>
          </div>

          {/* Tabla de Productos a Agregar */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-gray-50 dark:border-ferre-dark-border">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Carrito de Abastecimiento</span>
              <button
                type="button"
                onClick={handleAddItemRow}
                className="px-3.5 py-1.5 bg-slate-900 dark:bg-slate-800 text-yellow-500 hover:text-yellow-400 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4 shrink-0" />
                <span>Agregar Línea</span>
              </button>
            </div>

            {purchaseItems.map((item, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end bg-gray-50/50 dark:bg-slate-950/20 p-3 rounded-xl border border-gray-100 dark:border-ferre-dark-border">
                {/* Producto */}
                <div className="flex flex-col gap-1 md:col-span-6">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Artículo</label>
                  <select
                    value={item.productId}
                    onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                    className="w-full py-2 px-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-ferre-dark-border rounded-xl text-xs focus:outline-none focus:border-yellow-500 dark:text-white transition-all cursor-pointer font-medium"
                    required
                  >
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name} [Stock: {p.stock} uds]</option>
                    ))}
                  </select>
                </div>

                {/* Costo Unidad */}
                <div className="flex flex-col gap-1 md:col-span-3">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Costo Unit. (S/.)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={item.pricePurchase}
                    onChange={(e) => handleItemChange(index, 'pricePurchase', e.target.value)}
                    className="w-full py-2 px-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-ferre-dark-border rounded-xl text-xs focus:outline-none focus:border-yellow-500 dark:text-white transition-all font-bold"
                    required
                  />
                </div>

                {/* Cantidad */}
                <div className="flex flex-col gap-1 md:col-span-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Cantidad</label>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                    className="w-full py-2 px-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-ferre-dark-border rounded-xl text-xs focus:outline-none focus:border-yellow-500 dark:text-white transition-all font-bold"
                    required
                  />
                </div>

                {/* Eliminar fila */}
                <div className="flex justify-center md:col-span-1 pb-1">
                  <button
                    type="button"
                    onClick={() => handleRemoveItemRow(index)}
                    disabled={purchaseItems.length === 1}
                    className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                    title="Remover línea"
                  >
                    <Trash2 className="w-4.5 h-4.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Botones de Acción */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-50 dark:border-ferre-dark-border">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2.5 border border-gray-250 dark:border-ferre-dark-border text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 font-bold rounded-xl text-sm transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold rounded-xl text-sm transition-all cursor-pointer shadow-lg shadow-yellow-500/10 active:scale-[0.98] disabled:opacity-50"
            >
              {isSubmitting ? 'Registrando...' : 'Registrar Compra'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Ver Detalle Compra */}
      <Modal
        isOpen={!!viewingPurchase}
        onClose={() => setViewingPurchase(null)}
        title={viewingPurchase ? `Detalle Abastecimiento COMP-${String(viewingPurchase.id).padStart(5, '0')}` : ''}
        size="lg"
      >
        {viewingPurchase && (
          <div className="space-y-6">
            
            {/* Encabezado del comprobante */}
            <div className="grid grid-cols-2 gap-4 pb-4 border-b border-gray-150 dark:border-ferre-dark-border text-sm">
              <div className="space-y-1">
                <p className="text-xs text-gray-400 font-bold uppercase">Proveedor</p>
                <p className="font-extrabold text-gray-850 dark:text-slate-200">{viewingPurchase.supplier?.name}</p>
                <p className="text-xs text-gray-400">{viewingPurchase.supplier?.address}</p>
                <p className="text-xs text-gray-400">{viewingPurchase.supplier?.phone}</p>
              </div>
              <div className="space-y-1 text-right">
                <p className="text-xs text-gray-400 font-bold uppercase">Información de Factura</p>
                <p className="font-mono font-bold text-gray-700 dark:text-slate-300">N° COMP-{String(viewingPurchase.id).padStart(5, '0')}</p>
                <p className="text-xs text-gray-400">{new Date(viewingPurchase.createdAt).toLocaleString('es-ES')}</p>
                <p className="text-xs text-gray-400">Encargado: {viewingPurchase.user?.name}</p>
              </div>
            </div>

            {/* Listado de Productos Adquiridos */}
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Artículos Comprados</span>
              <div className="border border-gray-100 dark:border-ferre-dark-border rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 dark:bg-ferre-dark-card/50 text-gray-500 dark:text-slate-400 font-bold border-b border-gray-100 dark:border-ferre-dark-border">
                    <tr>
                      <th className="px-4 py-2">SKU</th>
                      <th className="px-4 py-2">Descripción</th>
                      <th className="px-4 py-2 text-center">Costo Unit.</th>
                      <th className="px-4 py-2 text-center">Cant.</th>
                      <th className="px-4 py-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewingPurchase.details?.map(detail => (
                      <tr key={detail.id} className="border-b border-gray-100 dark:border-ferre-dark-border/50 dark:text-slate-200">
                        <td className="px-4 py-2.5 font-bold font-mono">{detail.product?.sku}</td>
                        <td className="px-4 py-2.5 font-semibold">{detail.product?.name}</td>
                        <td className="px-4 py-2.5 text-center font-medium">S/. {detail.pricePurchase.toFixed(2)}</td>
                        <td className="px-4 py-2.5 text-center font-bold">{detail.quantity} uds</td>
                        <td className="px-4 py-2.5 text-right font-bold">S/. {(detail.quantity * detail.pricePurchase).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Total */}
            <div className="flex justify-end pt-4 border-t border-gray-150 dark:border-ferre-dark-border">
              <div className="text-right space-y-1">
                <span className="text-xs text-gray-400 font-bold uppercase block">Total Neto Facturado</span>
                <span className="text-xl font-black text-yellow-500 bg-slate-950 px-4 py-1.5 rounded-xl border border-transparent shadow-md block">
                  S/. {viewingPurchase.total.toFixed(2)}
                </span>
              </div>
            </div>

          </div>
        )}
      </Modal>

    </div>
  );
}
