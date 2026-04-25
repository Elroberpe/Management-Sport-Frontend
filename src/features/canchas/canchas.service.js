// src/features/canchas/canchas.service.js
import { api } from '../../core/api.js';

export const CanchaService = {
    listar: async (params = {}) => {
        let url = `/canchas`;
        const query = new URLSearchParams(params).toString();
        if (query) url += `?${query}`;
        return await api.get(url);
    },

    obtener: async (id) => {
        return await api.get(`/canchas/${id}`);
    },

    crear: async (payload) => {
        return await api.post('/canchas', payload);
    },

    actualizar: async (id, payload) => {
        return await api.put(`/canchas/${id}`, payload);
    },

    eliminar: async (id) => {
        return await api.delete(`/canchas/${id}`);
    },

    listarSucursales: async () => {
        return await api.get('/sucursales');
    },

    programarMantenimiento: async (payload) => {
        return await api.post('/mantenimientos', payload);
    },

    obtenerReservasSemana: async (fechaDesde, fechaHasta, sucursalId) => {
        let url = `/reservas?fechaDesde=${fechaDesde}&fechaHasta=${fechaHasta}`;
        if (sucursalId) url += `&sucursalId=${sucursalId}`;
        return await api.get(url);
    }
};
