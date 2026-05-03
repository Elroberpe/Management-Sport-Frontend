// src/features/clientes/clientes.service.js
// Capa de acceso a datos para el dominio Clientes.
// Centraliza todas las llamadas a /clientes para desacoplar la UI de la API.

import { api } from '../../core/api.js';

export const ClienteService = {
    /**
     * Lista clientes con filtros opcionales.
     * @param {{ page?, size?, sort?, nombre?, documento? }} params
     */
    listar: async (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return api.get(`/clientes${query ? '?' + query : ''}`);
    },

    /**
     * Obtiene un cliente por ID.
     * @param {number} id
     */
    obtener: async (id) => {
        return api.get(`/clientes/${id}`);
    },

    /**
     * Crea un nuevo cliente.
     * @param {{ tipoDocumento, numDocumento, nombre, email?, telefono? }} payload
     */
    crear: async (payload) => {
        return api.post('/clientes', payload);
    },

    /**
     * Actualiza los datos de un cliente.
     * @param {number} id
     * @param {{ nombre, email?, telefono? }} payload
     */
    actualizar: async (id, payload) => {
        return api.put(`/clientes/${id}`, payload);
    },

    /**
     * Elimina un cliente.
     * @param {number} id
     */
    eliminar: async (id) => {
        return api.delete(`/clientes/${id}`);
    },
};
