import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import { Truck, Plus, Edit2, Trash2, Loader2, Phone, Mail, MapPin, ClipboardList } from 'lucide-react';

export default function Suppliers() {
  const { showToast } = useToast();
  const { isAdmin } = useAuth();

  const [suppliers, setSuppliers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function loadSuppliers() {
    setIsLoading(true);
    try {
      const response = await api.get('/suppliers');
      if (response.data.success) {
        setSuppliers(response.data.data);
      }
    } catch (e) {
      console.error(e);
      showToast('Error cargando la lista de proveedores.', 'error');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadSuppliers();
  }, []);

  const handleOpenAddModal = () => {
    setEditingSupplier(null);
    setName('');
    setPhone('');
    setAddress('');
    setEmail('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (sup) => {
    setEditingSupplier(sup);
    setName(sup.name);
    setPhone(sup.phone || '');
    setAddress(sup.address || '');
    setEmail(sup.email || '');
    setIsModalOpen(true);
  };

  const handleSaveSupplier = async (e) => {
    e.preventDefault();
    if (!name) {
      showToast('El nombre del proveedor es obligatorio.', 'warning');
      return;
    }

    setIsSubmitting(true);
    const payload = { name, phone, address, email };

    try {
      let res;
      if (editingSupplier) {
        res = await api.put(`/suppliers/${editingSupplier.id}`, payload);
      } else {
        res = await api.post('/suppliers', payload);
      }

      if (res.data.success) {
        showToast(res.data.message, 'success');
        setIsModalOpen(false);
        loadSuppliers();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Error al guardar el proveedor.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSupplier = async (id) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este proveedor?')) return;

    try {
      const response = await api.delete(`/suppliers/${id}`);
      if (response.data.success) {
        showToast(response.data.message, 'success');
        loadSuppliers();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Error al eliminar proveedor.', 'error');
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-800 dark:text-slate-100 font-sans tracking-tight">
            Proveedores de Ferretería
          </h1>
          <p className="text-sm text-gray-400 font-medium mt-1">
            Gestiona el directorio de contactos comerciales de distribución y abastecimiento.
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={handleOpenAddModal}
            className="px-5 py-3 bg-yellow-500 hover:bg-yellow-400 text-slate-950 text-sm font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-yellow-500/10 active:scale-[0.98]"
          >
            <Plus className="w-5 h-5 shrink-0" />
            <span>Nuevo Proveedor</span>
          </button>
        )}
      </div>

      {/* Listado de Proveedores */}
      <div className="bg-white dark:bg-ferre-dark-card rounded-2xl border border-gray-100 dark:border-ferre-dark-border shadow-xl shadow-slate-100/30 dark:shadow-none overflow-hidden">
        {isLoading ? (
          <div className="text-center py-20 flex flex-col items-center gap-3">
            <Loader2 className="w-10 h-10 text-yellow-500 animate-spin" />
            <span className="text-sm font-medium text-gray-400">Cargando proveedores...</span>
          </div>
        ) : suppliers.length === 0 ? (
          <div className="text-center py-20 text-gray-400 flex flex-col items-center gap-3">
            <Truck className="w-16 h-16 text-gray-300" />
            <span className="text-sm font-semibold">Sin proveedores registrados.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="ferre-table">
              <thead>
                <tr>
                  <th>Proveedor</th>
                  <th>Teléfono</th>
                  <th>Dirección</th>
                  <th>Correo Electrónico</th>
                  <th className="text-center">Compras Realizadas</th>
                  {isAdmin && <th className="text-center">Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {suppliers.map(sup => (
                  <tr key={sup.id} className="hover:bg-slate-50/50 dark:hover:bg-ferre-dark-border/20 transition-colors">
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 rounded-xl flex items-center justify-center font-bold text-sm shrink-0">
                          <Truck className="w-5 h-5" />
                        </div>
                        <span className="font-bold text-gray-800 dark:text-slate-200">{sup.name}</span>
                      </div>
                    </td>
                    <td className="text-gray-500 dark:text-slate-400 font-medium">
                      {sup.phone ? (
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span>{sup.phone}</span>
                        </div>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                    <td className="text-gray-500 dark:text-slate-400">
                      {sup.address ? (
                        <div className="flex items-center gap-1.5 max-w-xs truncate">
                          <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span>{sup.address}</span>
                        </div>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                    <td className="text-gray-500 dark:text-slate-400 font-medium">
                      {sup.email ? (
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span>{sup.email}</span>
                        </div>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                    <td>
                      <div className="flex items-center justify-center gap-1.5 text-slate-500 dark:text-slate-350 font-bold bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded-full w-fit mx-auto border border-transparent">
                        <ClipboardList className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                        <span>{sup._count?.purchases || 0} abastecimientos</span>
                      </div>
                    </td>
                    {isAdmin && (
                      <td>
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenEditModal(sup)}
                            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-ferre-dark-border hover:text-slate-800 dark:hover:text-slate-250 transition-colors cursor-pointer"
                            title="Editar proveedor"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteSupplier(sup.id)}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                            title="Eliminar proveedor"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Agregar / Editar Proveedor */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSupplier ? 'Editar Proveedor' : 'Registrar Nuevo Proveedor'}
        size="md"
      >
        <form onSubmit={handleSaveSupplier} className="space-y-4">
          
          {/* Nombre */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Nombre de la Distribuidora *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-950/40 border border-gray-200 dark:border-ferre-dark-border rounded-xl text-sm focus:outline-none focus:border-yellow-500 dark:text-white transition-all font-semibold"
              placeholder="Ej. Distribuidora Ferretera Express S.A."
              required
            />
          </div>

          {/* Teléfono */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Teléfono de Contacto</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-950/40 border border-gray-200 dark:border-ferre-dark-border rounded-xl text-sm focus:outline-none focus:border-yellow-500 dark:text-white transition-all"
              placeholder="Ej. +51 987654321"
            />
          </div>

          {/* Correo Electrónico */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Correo Electrónico</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-950/40 border border-gray-200 dark:border-ferre-dark-border rounded-xl text-sm focus:outline-none focus:border-yellow-500 dark:text-white transition-all"
              placeholder="Ej. contacto@ferreteraexpress.com"
            />
          </div>

          {/* Direccion */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Dirección Fiscal / Almacén</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-950/40 border border-gray-200 dark:border-ferre-dark-border rounded-xl text-sm focus:outline-none focus:border-yellow-500 dark:text-white transition-all"
              placeholder="Ej. Av. Industrial 450, Ate, Lima"
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
              {isSubmitting ? 'Guardando...' : 'Guardar Proveedor'}
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
