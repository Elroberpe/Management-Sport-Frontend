// src/features/mantenimientos/mantenimientos.service.js
import { api } from '../../core/api.js';

export const MantenimientoService = {
    listar: async (filters = {}) => {
        const params = new URLSearchParams(filters);
        return await api.get(`/mantenimientos?${params.toString()}`);
    },

    obtener: async (id) => {
        return await api.get(`/mantenimientos/${id}`);
    },

    actualizarEstado: async (id, estado) => {
        return await api.patch(`/mantenimientos/${id}/estado`, { estado });
    },

    cancelar: async (id) => {
        return await api.patch(`/mantenimientos/${id}/cancelar`);
    },

    actualizar: async (id, payload) => {
        return await api.put(`/mantenimientos/${id}`, payload);
    },

    crear: async (payload) => {
        return await api.post('/mantenimientos', payload);
    }
};
