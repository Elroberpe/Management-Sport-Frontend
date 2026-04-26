// src/features/sucursales/sucursales.service.js
import { api } from '../../core/api.js';

export const SucursalService = {
    listar: (empresaId) => api.get(`/sucursales${empresaId ? '?empresaId=' + empresaId : ''}`),
    activar: (id) => api.patch(`/sucursales/${id}/activar`),
    desactivar: (id) => api.patch(`/sucursales/${id}/desactivar`),
    eliminar: (id) => api.delete(`/sucursales/${id}`),
    crear: (payload) => api.post('/sucursales', payload),
    obtener: (id) => api.get(`/sucursales/${id}`),
    actualizar: (id, payload) => api.put(`/sucursales/${id}`, payload)
};
