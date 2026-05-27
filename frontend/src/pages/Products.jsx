import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  AlertTriangle,
  Barcode,
  Loader2,
  Filter,
  CheckCircle,
  EyeOff
} from 'lucide-react';

export default function Products() {
  const { showToast } = useToast();
  const { isAdmin } = useAuth();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filtros y búsquedas
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [brand, setBrand] = useState('');
  const [lowStock, setLowStock] = useState('false');

  // Modal Agregar/Editar Producto
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // Formulario
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [selectedCatId, setSelectedCatId] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [description, setDescription] = useState('');
  const [pricePurchase, setPricePurchase] = useState('');
  const [priceSale, setPriceSale] = useState('');
  const [stock, setStock] = useState('0');
  const [stockMin, setStockMin] = useState('5');
  const [status, setStatus] = useState('ACTIVE');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Barcode Scanner Simulator State
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannedResult, setScannedResult] = useState('');

  // Cargar productos
  async function loadProducts() {
    setIsLoading(true);
    try {
      const q = [];
      if (search) q.push(`search=${search}`);
      if (categoryId) q.push(`categoryId=${categoryId}`);
      if (brand) q.push(`brand=${brand}`);
      if (lowStock === 'true') q.push(`lowStock=true`);

      const queryStr = q.length > 0 ? `?${q.join('&')}` : '';
      const response = await api.get(`/products${queryStr}`);
      if (response.data.success) {
        setProducts(response.data.data);
      }
    } catch (e) {
      console.error(e);
      showToast('Error cargando catálogo de productos.', 'error');
    } finally {
      setIsLoading(false);
    }
  }

  // Cargar categorías para selectores
  async function loadCategories() {
    try {
      const response = await api.get('/categories');
      if (response.data.success) {
        setCategories(response.data.data);
      }
    } catch (e) {
      console.error(e);
    }
  }

  useEffect(() => {
    loadProducts();
  }, [search, categoryId, brand, lowStock]);

  useEffect(() => {
    loadCategories();
  }, []);

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setName('');
    setSku('');
    setSelectedCatId(categories[0]?.id || '');
    setSelectedBrand('');
    setDescription('');
    setPricePurchase('');
    setPriceSale('');
    setStock('10');
    setStockMin('5');
    setStatus('ACTIVE');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (prod) => {
    setEditingProduct(prod);
    setName(prod.name);
    setSku(prod.sku);
    setSelectedCatId(prod.categoryId);
    setSelectedBrand(prod.brand || '');
    setDescription(prod.description || '');
    setPricePurchase(prod.pricePurchase.toString());
    setPriceSale(prod.priceSale.toString());
    setStock(prod.stock.toString());
    setStockMin(prod.stockMin.toString());
    setStatus(prod.status);
    setIsModalOpen(true);
  };

  // Guardar/Actualizar
  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!name || !sku || !selectedCatId || pricePurchase === '' || priceSale === '') {
      showToast('Por favor completa todos los campos obligatorios.', 'warning');
      return;
    }

    if (parseFloat(priceSale) < parseFloat(pricePurchase)) {
      showToast('El precio de venta no debería ser inferior al precio de compra.', 'warning');
    }

    setIsSubmitting(true);
    const payload = {
      name,
      sku,
      categoryId: parseInt(selectedCatId),
      brand: selectedBrand,
      description,
      pricePurchase: parseFloat(pricePurchase),
      priceSale: parseFloat(priceSale),
      stock: parseInt(stock),
      stockMin: parseInt(stockMin),
      status
    };

    try {
      let res;
      if (editingProduct) {
        res = await api.put(`/products/${editingProduct.id}`, payload);
      } else {
        res = await api.post('/products', payload);
      }

      if (res.data.success) {
        showToast(res.data.message, 'success');
        setIsModalOpen(false);
        loadProducts();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Error al guardar el producto.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Eliminar / Desactivar
  const handleDeleteProduct = async (id) => {
    if (!confirm('¿Estás seguro de que deseas eliminar o desactivar este producto?')) return;

    try {
      const response = await api.delete(`/products/${id}`);
      if (response.data.success) {
        showToast(response.data.message, 'success');
        loadProducts();
      }
    } catch (e) {
      showToast('Error al eliminar producto.', 'error');
    }
  };

  // Simulador de Escaneo de Códigos de Barras
  const triggerBarcodeScanner = () => {
    setIsScannerOpen(true);
    setScannedResult('');
  };

  const simulateScan = (code) => {
    setScannedResult(code);
    setTimeout(() => {
      setSku(code);
      setIsScannerOpen(false);
      showToast(`¡Código escaneado: ${code}!`, 'success');
    }, 1200);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-800 dark:text-slate-100 font-sans tracking-tight">
            Catálogo de Productos
          </h1>
          <p className="text-sm text-gray-400 font-medium mt-1">
            Administra existencias, marcas, SKUs y precios de ferretería en tiempo real.
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="px-5 py-3 bg-yellow-500 hover:bg-yellow-400 text-slate-950 text-sm font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-yellow-500/10 active:scale-[0.98]"
        >
          <Plus className="w-5 h-5 shrink-0" />
          <span>Añadir Producto</span>
        </button>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="bg-white dark:bg-ferre-dark-card p-5 rounded-2xl border border-gray-100 dark:border-ferre-dark-border shadow-xl shadow-slate-100/30 dark:shadow-none flex flex-col md:flex-row gap-4 items-center">
        
        {/* Buscador */}
        <div className="relative w-full md:flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-gray-50 dark:bg-slate-950/40 border border-gray-200 dark:border-ferre-dark-border rounded-xl text-sm focus:outline-none focus:border-yellow-500 dark:text-white transition-all"
            placeholder="Buscar por SKU, nombre, marca..."
          />
        </div>

        {/* Categoría Selector */}
        <div className="w-full md:w-56 flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400 shrink-0" />
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full py-2.5 px-3 bg-gray-50 dark:bg-slate-950/40 border border-gray-200 dark:border-ferre-dark-border rounded-xl text-sm focus:outline-none focus:border-yellow-500 dark:text-white transition-all cursor-pointer"
          >
            <option value="">Todas las Categorías</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        {/* Bajo Stock Toggle */}
        <div className="w-full md:w-52 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-gray-400 shrink-0" />
          <select
            value={lowStock}
            onChange={(e) => setLowStock(e.target.value)}
            className="w-full py-2.5 px-3 bg-gray-50 dark:bg-slate-950/40 border border-gray-200 dark:border-ferre-dark-border rounded-xl text-sm focus:outline-none focus:border-yellow-500 dark:text-white transition-all cursor-pointer"
          >
            <option value="false">Todos los Stocks</option>
            <option value="true">⚠️ Stock Bajo / Crítico</option>
          </select>
        </div>

      </div>

      {/* Listado de Productos */}
      <div className="bg-white dark:bg-ferre-dark-card rounded-2xl border border-gray-100 dark:border-ferre-dark-border shadow-xl shadow-slate-100/30 dark:shadow-none overflow-hidden">
        {isLoading ? (
          <div className="text-center py-20 flex flex-col items-center gap-3">
            <Loader2 className="w-10 h-10 text-yellow-500 animate-spin" />
            <span className="text-sm font-medium text-gray-400">Cargando catálogo...</span>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 text-gray-400 flex flex-col items-center gap-3">
            <Package className="w-16 h-16 text-gray-300" />
            <span className="text-sm font-semibold">No se encontraron productos registrados.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="ferre-table">
              <thead>
                <tr>
                  <th>Código SKU</th>
                  <th>Nombre Artículo</th>
                  <th>Categoría</th>
                  <th>Marca</th>
                  <th>Costo</th>
                  <th>Venta</th>
                  <th>Stock Actual</th>
                  <th>Estado</th>
                  <th className="text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {products.map(prod => {
                  const isLow = prod.stock <= prod.stockMin;
                  return (
                    <tr key={prod.id} className={`hover:bg-slate-50/50 dark:hover:bg-ferre-dark-border/20 transition-colors ${
                      isLow ? 'bg-amber-500/5 dark:bg-amber-500/3' : ''
                    }`}>
                      <td className="font-bold text-gray-700 dark:text-slate-350">{prod.sku}</td>
                      <td>
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-800 dark:text-slate-200">{prod.name}</span>
                          {prod.description && (
                            <span className="text-xs text-gray-400 truncate max-w-xs">{prod.description}</span>
                          )}
                        </div>
                      </td>
                      <td className="text-gray-500 dark:text-slate-400 font-medium">{prod.category?.name}</td>
                      <td className="text-gray-500 dark:text-slate-400 font-semibold">{prod.brand || '-'}</td>
                      <td className="text-gray-500 dark:text-slate-400 font-medium">S/. {prod.pricePurchase.toFixed(2)}</td>
                      <td className="font-bold text-gray-800 dark:text-slate-200">S/. {prod.priceSale.toFixed(2)}</td>
                      <td>
                        {isLow ? (
                          <div className="flex items-center gap-1.5 text-rose-500 font-black bg-rose-500/10 px-2.5 py-1 rounded-lg border border-rose-500/20 w-fit">
                            <AlertTriangle className="w-3.5 h-3.5 animate-bounce shrink-0" />
                            <span>{prod.stock} / {prod.stockMin} uds</span>
                          </div>
                        ) : (
                          <span className="font-bold text-gray-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1 rounded-lg border border-transparent">
                            {prod.stock} uds
                          </span>
                        )}
                      </td>
                      <td>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          prod.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/50'
                            : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/50'
                        }`}>
                          {prod.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenEditModal(prod)}
                            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-ferre-dark-border hover:text-slate-800 dark:hover:text-slate-250 transition-colors"
                            title="Editar producto"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => handleDeleteProduct(prod.id)}
                              className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors"
                              title="Eliminar producto"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Añadir / Editar Producto */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProduct ? 'Editar Producto' : 'Añadir Nuevo Producto'}
        size="lg"
      >
        <form onSubmit={handleSaveProduct} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Nombre */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Nombre del Producto *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-950/40 border border-gray-200 dark:border-ferre-dark-border rounded-xl text-sm focus:outline-none focus:border-yellow-500 dark:text-white transition-all"
                placeholder="Ej. Martillo de bola 12oz"
                required
              />
            </div>

            {/* Código SKU con simulador de escáner */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Código SKU / Barra *</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-950/40 border border-gray-200 dark:border-ferre-dark-border rounded-xl text-sm focus:outline-none focus:border-yellow-500 dark:text-white transition-all font-mono font-bold"
                  placeholder="Ej. SKU-MART-005"
                  required
                />
                <button
                  type="button"
                  onClick={triggerBarcodeScanner}
                  className="p-2.5 bg-slate-900 dark:bg-slate-800 text-yellow-500 border border-transparent rounded-xl hover:bg-slate-850 dark:hover:bg-slate-700 hover:text-yellow-400 transition-all shrink-0 cursor-pointer"
                  title="Simular lector de código"
                >
                  <Barcode className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Categoría */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Categoría *</label>
              <select
                value={selectedCatId}
                onChange={(e) => setSelectedCatId(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-950/40 border border-gray-200 dark:border-ferre-dark-border rounded-xl text-sm focus:outline-none focus:border-yellow-500 dark:text-white transition-all cursor-pointer"
                required
              >
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* Marca */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Marca</label>
              <input
                type="text"
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-950/40 border border-gray-200 dark:border-ferre-dark-border rounded-xl text-sm focus:outline-none focus:border-yellow-500 dark:text-white transition-all"
                placeholder="Ej. Stanley, Truper"
              />
            </div>

            {/* Precio Compra */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Precio Compra (Costo) *</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">S/.</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={pricePurchase}
                  onChange={(e) => setPricePurchase(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-slate-950/40 border border-gray-200 dark:border-ferre-dark-border rounded-xl text-sm focus:outline-none focus:border-yellow-500 dark:text-white transition-all"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            {/* Precio Venta */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Precio Venta (Público) *</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">S/.</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={priceSale}
                  onChange={(e) => setPriceSale(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-slate-950/40 border border-gray-200 dark:border-ferre-dark-border rounded-xl text-sm focus:outline-none focus:border-yellow-500 dark:text-white transition-all"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            {/* Stock */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Stock Inicial *</label>
              <input
                type="number"
                min="0"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-950/40 border border-gray-200 dark:border-ferre-dark-border rounded-xl text-sm focus:outline-none focus:border-yellow-500 dark:text-white transition-all"
                required
              />
            </div>

            {/* Stock Mínimo */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Stock Mínimo Alerta *</label>
              <input
                type="number"
                min="1"
                value={stockMin}
                onChange={(e) => setStockMin(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-950/40 border border-gray-200 dark:border-ferre-dark-border rounded-xl text-sm focus:outline-none focus:border-yellow-500 dark:text-white transition-all"
                required
              />
            </div>

            {/* Estado */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Estado del Producto</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-950/40 border border-gray-200 dark:border-ferre-dark-border rounded-xl text-sm focus:outline-none focus:border-yellow-500 dark:text-white transition-all cursor-pointer"
              >
                <option value="ACTIVE">Activo en POS / Compras</option>
                <option value="INACTIVE">Inactivo (Ocultar)</option>
              </select>
            </div>

            {/* Descripción */}
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Descripción o Ficha Técnica</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows="3"
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-950/40 border border-gray-200 dark:border-ferre-dark-border rounded-xl text-sm focus:outline-none focus:border-yellow-500 dark:text-white transition-all resize-none"
                placeholder="Escribe detalles técnicos de la herramienta..."
              />
            </div>

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
              {isSubmitting ? 'Guardando...' : 'Guardar Producto'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Floating Barcode Scanner Simulator Modal */}
      <Modal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        title="Simulador de Escáner Código de Barras"
        size="md"
      >
        <div className="flex flex-col items-center justify-center p-6 text-center space-y-6">
          <div className="relative w-full h-44 bg-slate-950 rounded-2xl flex items-center justify-center overflow-hidden border border-slate-850">
            {/* Láser de Escáner Animado */}
            <div className="absolute left-0 w-full h-1 bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)] animate-[bounce_2s_infinite]"></div>
            
            <Barcode className="w-32 h-32 text-slate-700 animate-pulse" />
          </div>

          <div className="space-y-2">
            <h4 className="font-extrabold text-gray-800 dark:text-slate-200">Apunta el lector al código del producto</h4>
            <p className="text-xs text-gray-400">Haz click en uno de los productos de prueba de abajo para simular la lectura del código láser.</p>
          </div>

          <div className="grid grid-cols-2 gap-3 w-full">
            <button
              onClick={() => simulateScan('SKU-MART-001')}
              className="p-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold rounded-xl border border-transparent dark:text-slate-200 transition-colors"
            >
              🔨 Martillo Truper
            </button>
            <button
              onClick={() => simulateScan('SKU-TALA-001')}
              className="p-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold rounded-xl border border-transparent dark:text-slate-200 transition-colors"
            >
              🔌 Taladro DeWalt
            </button>
            <button
              onClick={() => simulateScan('SKU-PINT-001')}
              className="p-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold rounded-xl border border-transparent dark:text-slate-200 transition-colors"
            >
              🎨 Pintura Anypsa
            </button>
            <button
              onClick={() => simulateScan(`SKU-RAND-${Math.floor(100 + Math.random() * 900)}`)}
              className="p-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 text-xs font-bold rounded-xl border border-transparent transition-colors"
            >
              ➕ Código Nuevo Random
            </button>
          </div>

          {scannedResult && (
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-xl text-sm font-semibold animate-scale-in">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>Lectura exitosa: {scannedResult}</span>
            </div>
          )}
        </div>
      </Modal>

    </div>
  );
}
