import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import { Tags, Plus, Edit2, Trash2, Loader2, Package } from 'lucide-react';

export default function Categories() {
  const { showToast } = useToast();
  const { isAdmin } = useAuth();

  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function loadCategories() {
    setIsLoading(true);
    try {
      const response = await api.get('/categories');
      if (response.data.success) {
        setCategories(response.data.data);
      }
    } catch (e) {
      console.error(e);
      showToast('Error cargando las categorías.', 'error');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadCategories();
  }, []);

  const handleOpenAddModal = () => {
    setEditingCategory(null);
    setName('');
    setDescription('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (cat) => {
    setEditingCategory(cat);
    setName(cat.name);
    setDescription(cat.description || '');
    setIsModalOpen(true);
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!name) {
      showToast('El nombre de la categoría es obligatorio.', 'warning');
      return;
    }

    setIsSubmitting(true);
    const payload = { name, description };

    try {
      let res;
      if (editingCategory) {
        res = await api.put(`/categories/${editingCategory.id}`, payload);
      } else {
        res = await api.post('/categories', payload);
      }

      if (res.data.success) {
        showToast(res.data.message, 'success');
        setIsModalOpen(false);
        loadCategories();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Error al guardar la categoría.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta categoría?')) return;

    try {
      const response = await api.delete(`/categories/${id}`);
      if (response.data.success) {
        showToast(response.data.message, 'success');
        loadCategories();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Error al eliminar categoría.', 'error');
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-800 dark:text-slate-100 font-sans tracking-tight">
            Categorías de Ferretería
          </h1>
          <p className="text-sm text-gray-400 font-medium mt-1">
            Organiza las herramientas y accesorios en divisiones lógicas del catálogo.
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={handleOpenAddModal}
            className="px-5 py-3 bg-yellow-500 hover:bg-yellow-400 text-slate-950 text-sm font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-yellow-500/10 active:scale-[0.98]"
          >
            <Plus className="w-5 h-5 shrink-0" />
            <span>Nueva Categoría</span>
          </button>
        )}
      </div>

      {/* Rejilla de Categorías */}
      {isLoading ? (
        <div className="text-center py-20 flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 text-yellow-500 animate-spin" />
          <span className="text-sm font-medium text-gray-400">Cargando categorías...</span>
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-20 text-gray-400 flex flex-col items-center gap-3">
          <Tags className="w-16 h-16 text-gray-300" />
          <span className="text-sm font-semibold">Sin categorías registradas.</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map(cat => (
            <div
              key={cat.id}
              className="bg-white dark:bg-ferre-dark-card border border-gray-100 dark:border-ferre-dark-border rounded-2xl p-6 shadow-xl shadow-slate-100/40 dark:shadow-none hover-float flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="p-3 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 rounded-xl">
                    <Tags className="w-5 h-5" />
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-200 rounded-lg text-xs font-bold">
                    <Package className="w-3.5 h-3.5" />
                    <span>{cat._count?.products || 0} artículos</span>
                  </div>
                </div>

                <div>
                  <h3 className="font-extrabold text-gray-850 dark:text-slate-100 text-base">{cat.name}</h3>
                  <p className="text-xs text-gray-400 dark:text-slate-400 leading-relaxed mt-2 min-h-8">
                    {cat.description || 'Sin descripción detallada.'}
                  </p>
                </div>
              </div>

              {isAdmin && (
                <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-50 dark:border-ferre-dark-border/50">
                  <button
                    onClick={() => handleOpenEditModal(cat)}
                    className="p-2 rounded-lg text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-ferre-dark-border/60 hover:text-slate-850 dark:hover:text-white transition-colors cursor-pointer"
                    title="Editar"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(cat.id)}
                    className="p-2 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal Agregar / Editar Categoría */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCategory ? 'Editar Categoría' : 'Añadir Categoría'}
        size="md"
      >
        <form onSubmit={handleSaveCategory} className="space-y-4">
          {/* Nombre */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Nombre de la Categoría *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-950/40 border border-gray-200 dark:border-ferre-dark-border rounded-xl text-sm focus:outline-none focus:border-yellow-500 dark:text-white transition-all font-semibold"
              placeholder="Ej. Herramientas Eléctricas"
              required
            />
          </div>

          {/* Descripción */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Descripción</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows="3"
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-950/40 border border-gray-200 dark:border-ferre-dark-border rounded-xl text-sm focus:outline-none focus:border-yellow-500 dark:text-white transition-all resize-none"
              placeholder="Ej. Taladros, sierras, lijadoras y maquinaria..."
            />
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
              {isSubmitting ? 'Guardando...' : 'Guardar Categoría'}
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
