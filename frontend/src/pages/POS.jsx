import React, { useEffect, useState, useRef } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';
import confetti from 'canvas-confetti';
import {
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  Search,
  Barcode,
  Sparkles,
  CreditCard,
  Printer,
  Calendar,
  User,
  Hammer,
  Receipt,
  AlertTriangle
} from 'lucide-react';

export default function POS() {
  const { showToast } = useToast();

  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState([]);
  const [discount, setDiscount] = useState('0');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Scanner Simulator State
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Success Receipt Modal
  const [completedSale, setCompletedSale] = useState(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  // Cargar productos activos
  async function loadProducts() {
    try {
      const response = await api.get('/products');
      if (response.data.success) {
        setProducts(response.data.data.filter(p => p.status === 'ACTIVE'));
      }
    } catch (e) {
      console.error(e);
      showToast('Error cargando catálogo de ventas.', 'error');
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  // Agregar producto al carrito
  const addToCart = (product) => {
    if (product.stock <= 0) {
      showToast(`El producto "${product.name}" está agotado.`, 'warning');
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          showToast(`No puedes vender más de las existencias disponibles (${product.stock} uds).`, 'warning');
          return prev;
        }
        return prev.map(item =>
          item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, {
        productId: product.id,
        name: product.name,
        sku: product.sku,
        priceSale: product.priceSale,
        stock: product.stock,
        quantity: 1
      }];
    });
  };

  const updateCartQty = (productId, delta) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.productId === productId) {
          const newQty = item.quantity + delta;
          if (newQty <= 0) return null;
          if (newQty > item.stock) {
            showToast(`Límite de stock disponible alcanzado (${item.stock} uds).`, 'warning');
            return item;
          }
          return { ...item, quantity: newQty };
        }
        return item;
      }).filter(Boolean);
    });
  };

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.productId !== productId));
  };

  // Filtrar catálogo por la barra de búsqueda
  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase()) ||
    (p.brand && p.brand.toLowerCase().includes(search.toLowerCase()))
  );

  // Cálculos matemáticos del carrito
  const subtotal = cart.reduce((acc, item) => acc + (item.quantity * item.priceSale), 0);
  const cleanDiscount = Math.min(subtotal, Math.max(0, parseFloat(discount) || 0));
  const tax = (subtotal - cleanDiscount) * 0.18; // IGV / IVA del 18% en Perú/Latam
  const total = Math.max(0, subtotal - cleanDiscount);

  // Simulación de Escaneo de Códigos de Barras en el POS
  const handleScanBarcode = (code) => {
    const matchedProd = products.find(p => p.sku === code);
    if (matchedProd) {
      addToCart(matchedProd);
      showToast(`¡Escaneado: ${matchedProd.name}!`, 'success');
      setIsScannerOpen(false);
    } else {
      showToast(`El código "${code}" no corresponde a ningún producto activo.`, 'error');
    }
  };

  // Procesar Venta Check-out
  const handleCheckout = async (e) => {
    e.preventDefault();
    if (cart.length === 0) {
      showToast('El carrito de compras está vacío.', 'warning');
      return;
    }

    setIsSubmitting(true);
    const payload = {
      discount: cleanDiscount,
      items: cart.map(i => ({
        productId: i.productId,
        quantity: i.quantity,
        priceSale: i.priceSale
      }))
    };

    try {
      const response = await api.post('/sales', payload);
      if (response.data.success) {
        const createdSale = response.data.data;
        
        // Cargar detalles de venta completos para el comprobante
        const saleDetailsRes = await api.get(`/sales/${createdSale.id}`);
        if (saleDetailsRes.data.success) {
          setCompletedSale(saleDetailsRes.data.data);
          setIsReceiptModalOpen(true);
        }

        // Celebración animada con confeti
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 }
        });

        showToast('Venta procesada exitosamente.', 'success');
        setCart([]);
        setDiscount('0');
        loadProducts(); // Recargar stock del catálogo
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Error al procesar la venta.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-140px)] animate-fade-in">
      
      {/* PANEL IZQUIERDO: Búsqueda y Selección de Productos (8 cols) */}
      <div className="lg:col-span-7 flex flex-col gap-6 h-full min-h-0">
        
        {/* Barra de Búsqueda de Productos con simulador de códigos */}
        <div className="bg-white dark:bg-ferre-dark-card p-4 rounded-2xl border border-gray-100 dark:border-ferre-dark-border shadow-xl shadow-slate-100/30 dark:shadow-none flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-slate-950/40 border border-gray-200 dark:border-ferre-dark-border rounded-xl text-sm focus:outline-none focus:border-yellow-500 dark:text-white transition-all font-semibold"
              placeholder="Escribe SKU, nombre del producto o marca..."
            />
          </div>
          <button
            onClick={() => setIsScannerOpen(true)}
            className="p-3 bg-slate-900 dark:bg-slate-800 text-yellow-500 rounded-xl hover:bg-slate-850 dark:hover:bg-slate-700 hover:text-yellow-400 transition-all shrink-0 cursor-pointer flex items-center gap-2 font-bold text-xs"
            title="Escanear Código SKU"
          >
            <Barcode className="w-5 h-5 shrink-0" />
            <span className="hidden sm:inline">Escáner</span>
          </button>
        </div>

        {/* Rejilla de Catálogo Rápido */}
        <div className="flex-1 overflow-y-auto bg-white dark:bg-ferre-dark-card rounded-2xl border border-gray-100 dark:border-ferre-dark-border shadow-xl shadow-slate-100/30 dark:shadow-none p-5 min-h-0">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-50 dark:border-ferre-dark-border">
            <Sparkles className="w-4 h-4 text-yellow-500" />
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Catálogo de Productos Disponibles</span>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="text-center py-20 text-gray-400 flex flex-col items-center gap-2">
              <ShoppingBag className="w-12 h-12 text-gray-300" />
              <span className="text-sm font-semibold">No se encontraron artículos activos.</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {filteredProducts.map(prod => {
                const isOutOfStock = prod.stock <= 0;
                const isLow = prod.stock <= prod.stockMin;
                return (
                  <div
                    key={prod.id}
                    onClick={() => !isOutOfStock && addToCart(prod)}
                    className={`border rounded-2xl p-4 flex flex-col justify-between hover-float cursor-pointer transition-all ${
                      isOutOfStock
                        ? 'border-gray-100 bg-gray-50/50 opacity-40 dark:border-ferre-dark-border/40 dark:bg-transparent pointer-events-none'
                        : isLow
                        ? 'border-amber-200 bg-amber-500/5 dark:border-amber-900/30'
                        : 'border-gray-100 dark:border-ferre-dark-border bg-white dark:bg-slate-900'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-start justify-between">
                        <span className="font-mono text-[9px] font-extrabold text-gray-400 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                          {prod.sku}
                        </span>
                        {isLow && !isOutOfStock && (
                          <span className="text-[8px] font-black text-rose-500 bg-rose-500/10 px-1 rounded animate-pulse">STOCK BAJO</span>
                        )}
                      </div>
                      <h4 className="text-xs font-bold text-gray-800 dark:text-slate-200 line-clamp-2 mt-1.5">{prod.name}</h4>
                      <p className="text-[10px] text-gray-400 font-semibold">{prod.brand || 'Truper'}</p>
                    </div>

                    <div className="flex items-end justify-between mt-4">
                      <span className="text-xs font-bold text-rose-500">
                        {isOutOfStock ? 'Agotado' : `${prod.stock} uds.`}
                      </span>
                      <span className="text-sm font-black text-gray-850 dark:text-slate-100 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 px-2 py-0.5 rounded-lg border border-yellow-500/20">
                        S/. {prod.priceSale.toFixed(2)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* PANEL DERECHO: Facturación / Carrito (5 cols) */}
      <div className="lg:col-span-5 bg-white dark:bg-ferre-dark-card rounded-2xl border border-gray-100 dark:border-ferre-dark-border shadow-xl shadow-slate-100/30 dark:shadow-none p-5 flex flex-col justify-between h-full min-h-0">
        
        {/* Cabecera del Carrito */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-50 dark:border-ferre-dark-border shrink-0">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-yellow-500" />
            <span className="font-extrabold text-gray-800 dark:text-slate-150">Caja / Boleta de Venta</span>
          </div>
          <span className="px-2.5 py-0.5 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20 rounded-full text-xs font-black">
            {cart.reduce((acc, curr) => acc + curr.quantity, 0)} artículos
          </span>
        </div>

        {/* Cuerpo del Carrito (Scrollable) */}
        <div className="flex-1 overflow-y-auto py-4 space-y-3 min-h-0">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 space-y-2">
              <ShoppingBag className="w-12 h-12 text-gray-300 animate-bounce" />
              <p className="text-sm font-medium">El carrito está vacío.</p>
              <p className="text-xs text-gray-400 max-w-xs">Haz click en los productos del catálogo de la izquierda para facturarlos.</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.productId} className="flex items-center justify-between p-3 bg-gray-50/50 dark:bg-slate-950/20 border border-gray-100 dark:border-ferre-dark-border rounded-xl">
                <div className="min-w-0 flex-1 pr-3">
                  <span className="text-[9px] font-bold font-mono text-gray-400 block">{item.sku}</span>
                  <h4 className="text-xs font-bold text-gray-800 dark:text-slate-200 truncate">{item.name}</h4>
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">S/. {item.priceSale.toFixed(2)} c/u</span>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {/* Selector de Qty */}
                  <div className="flex items-center bg-white dark:bg-slate-900 border border-gray-200 dark:border-ferre-dark-border rounded-lg overflow-hidden">
                    <button
                      type="button"
                      onClick={() => updateCartQty(item.productId, -1)}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 transition-colors"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-2 text-xs font-black text-gray-850 dark:text-slate-100">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateCartQty(item.productId, 1)}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Eliminar Ítem */}
                  <button
                    onClick={() => removeFromCart(item.productId)}
                    className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Resumen del Total y Checkout */}
        <div className="border-t border-gray-50 dark:border-ferre-dark-border pt-4 space-y-4 shrink-0 bg-white dark:bg-ferre-dark-card">
          
          {/* Fila Descuento */}
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-gray-400">Descuento Directo (S/.)</span>
            <input
              type="number"
              min="0"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              className="w-20 px-2 py-1 bg-gray-50 dark:bg-slate-950/40 border border-gray-200 dark:border-ferre-dark-border rounded-lg text-xs font-bold text-right focus:outline-none focus:border-yellow-500 dark:text-white"
            />
          </div>

          <div className="space-y-1.5 text-xs text-gray-500 dark:text-slate-400 border-b border-gray-50 dark:border-ferre-dark-border/50 pb-3">
            <div className="flex items-center justify-between">
              <span>Subtotal Neto:</span>
              <span className="font-semibold text-gray-700 dark:text-slate-300">S/. {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-rose-500 font-medium">
              <span>Descuento aplicado:</span>
              <span>- S/. {cleanDiscount.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Impuesto IGV (18% incluido):</span>
              <span>S/. {tax.toFixed(2)}</span>
            </div>
          </div>

          {/* Gran Total */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-black text-gray-800 dark:text-slate-200">TOTAL A COBRAR</span>
            <span className="text-2xl font-black text-yellow-500 bg-slate-900 px-4 py-1.5 rounded-xl shadow-md border border-transparent">
              S/. {total.toFixed(2)}
            </span>
          </div>

          {/* Botón de Pago */}
          <button
            onClick={handleCheckout}
            disabled={cart.length === 0 || isSubmitting}
            className="w-full py-4 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 text-slate-950 font-extrabold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all duration-300 shadow-xl shadow-yellow-500/10 active:scale-[0.98]"
          >
            <CreditCard className="w-5 h-5 shrink-0" />
            <span>{isSubmitting ? 'Procesando Cobro...' : 'Emitir Boleta / Cobrar'}</span>
          </button>

        </div>

      </div>

      {/* Floating Barcode Scanner Simulator Modal */}
      <Modal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        title="Escáner Láser de Caja (POS)"
        size="md"
      >
        <div className="flex flex-col items-center justify-center p-6 text-center space-y-6">
          <div className="relative w-full h-44 bg-slate-950 rounded-2xl flex items-center justify-center overflow-hidden border border-slate-850">
            <div className="absolute left-0 w-full h-1 bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)] animate-[bounce_2s_infinite]"></div>
            <Barcode className="w-32 h-32 text-slate-700 animate-pulse" />
          </div>

          <div className="space-y-1">
            <h4 className="font-extrabold text-gray-800 dark:text-slate-200">Simulador de Lectora POS</h4>
            <p className="text-xs text-gray-400">Haz click en uno de los códigos de barra de abajo para simular la lectura instantánea en la caja registradora.</p>
          </div>

          <div className="grid grid-cols-2 gap-3 w-full">
            {products.slice(0, 4).map(p => (
              <button
                key={p.id}
                onClick={() => handleScanBarcode(p.sku)}
                className="p-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold rounded-xl border border-transparent dark:text-slate-200 transition-all truncate"
              >
                📦 {p.name.split(' ')[0]} ({p.sku})
              </button>
            ))}
          </div>
        </div>
      </Modal>

      {/* Modal Boleta / Factura Imprimible de Éxito */}
      <Modal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        title="Comprobante de Pago Generado"
        size="md"
      >
        {completedSale && (
          <div className="space-y-6">
            
            {/* Boleta Imprimible */}
            <div
              id="print-receipt-modal"
              className="bg-white text-slate-950 p-6 rounded-2xl border border-slate-200 shadow-md font-mono text-xs max-w-sm mx-auto space-y-4"
            >
              
              {/* Logo / Cabecera */}
              <div className="text-center pb-4 border-b border-dashed border-slate-300 space-y-1">
                <div className="flex justify-center text-slate-900 mb-1">
                  <Hammer className="w-6 h-6" />
                </div>
                <h2 className="text-base font-extrabold tracking-wider uppercase">Ferretería Freereterria</h2>
                <p className="text-[9px] text-slate-500">R.U.C. 20492817401</p>
                <p className="text-[9px] text-slate-500">Av. Industrial 450, Ate, Lima</p>
                <p className="text-[9px] text-slate-500">Tel: (01) 555-0199</p>
              </div>

              {/* Info Ticket */}
              <div className="space-y-1 text-left text-[10px] text-slate-700">
                <p><span className="font-bold">BOLETA ELECTRÓNICA:</span> B001-{String(completedSale.id).padStart(6, '0')}</p>
                <p><span className="font-bold">FECHA EMISIÓN:</span> {new Date(completedSale.createdAt).toLocaleString('es-ES')}</p>
                <p><span className="font-bold">CAJERO:</span> {completedSale.user?.name}</p>
                <p><span className="font-bold">CLIENTE:</span> PÚBLICO GENERAL</p>
              </div>

              {/* Separador */}
              <div className="border-b border-dashed border-slate-300"></div>

              {/* Lista Productos */}
              <div className="space-y-2">
                <div className="grid grid-cols-12 font-bold text-slate-900 border-b border-slate-200 pb-1">
                  <span className="col-span-6">DESCRIPCIÓN</span>
                  <span className="col-span-2 text-center">CANT</span>
                  <span className="col-span-2 text-center">P.U.</span>
                  <span className="col-span-2 text-right">TOTAL</span>
                </div>

                {completedSale.saleDetails?.map(detail => (
                  <div key={detail.id} className="grid grid-cols-12 text-slate-700">
                    <span className="col-span-6 truncate font-medium">{detail.product?.name}</span>
                    <span className="col-span-2 text-center font-bold">{detail.quantity}</span>
                    <span className="col-span-2 text-center">S/. {detail.priceSale.toFixed(2)}</span>
                    <span className="col-span-2 text-right font-bold">S/. {detail.total.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* Separador */}
              <div className="border-b border-dashed border-slate-300"></div>

              {/* Sumatoria */}
              <div className="space-y-1 text-right text-[10px] text-slate-700">
                <div className="flex justify-between">
                  <span>SUBTOTAL:</span>
                  <span>S/. {(completedSale.total + completedSale.discount).toFixed(2)}</span>
                </div>
                {completedSale.discount > 0 && (
                  <div className="flex justify-between text-rose-600 font-bold">
                    <span>DESCUENTO DIRECTO:</span>
                    <span>- S/. {completedSale.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>IGV (18% incluido):</span>
                  <span>S/. {(completedSale.total * 0.1525).toFixed(2)}</span> {/* 18% del valor neto */}
                </div>
                <div className="flex justify-between font-black text-sm text-slate-950 border-t border-slate-200 pt-1.5">
                  <span>TOTAL COBRADO:</span>
                  <span>S/. {completedSale.total.toFixed(2)}</span>
                </div>
              </div>

              {/* Pie de página ticket */}
              <div className="text-center pt-4 border-t border-dashed border-slate-300 space-y-1">
                <p className="text-[10px] font-bold uppercase">¡Gracias por su preferencia!</p>
                <p className="text-[8px] text-slate-400">Representación impresa autorizada de Boleta de Venta Electrónica. Visita www.freereterria.com/comprobantes</p>
              </div>

            </div>

            {/* Botones */}
            <div className="flex items-center justify-center gap-3 pt-4 border-t border-gray-50 dark:border-ferre-dark-border">
              <button
                type="button"
                onClick={() => setIsReceiptModalOpen(false)}
                className="px-4 py-2.5 border border-gray-250 dark:border-ferre-dark-border text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 font-bold rounded-xl text-sm transition-colors cursor-pointer"
              >
                Cerrar Caja
              </button>
              <button
                onClick={handlePrint}
                className="px-6 py-2.5 bg-slate-900 text-yellow-500 hover:bg-slate-800 hover:text-yellow-400 font-bold rounded-xl text-sm transition-colors cursor-pointer shadow-lg flex items-center gap-2"
              >
                <Printer className="w-4 h-4 shrink-0" />
                <span>Imprimir Ticket</span>
              </button>
            </div>

          </div>
        )}
      </Modal>

    </div>
  );
}
