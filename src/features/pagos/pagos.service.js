// src/features/pagos/pagos.service.js
// Capa de acceso a datos para el dominio Pagos.
// Centraliza todas las llamadas a /pagos para desacoplar la UI de la API.

import { api } from '../../core/api.js';

export const PagoService = {
    /**
     * Lista pagos con filtros de fecha y otros.
     * @param {{ desde, hasta, page?, size?, sort?, metodo?, query?, sucursalId? }} params
     */
    listar: async (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return api.get(`/pagos${query ? '?' + query : ''}`);
    },

    /**
     * Obtiene el detalle de un pago por ID.
     * @param {number} id
     */
    obtener: async (id) => {
        return api.get(`/pagos/${id}`);
    },

    /**
     * Anula un pago con un motivo.
     * @param {number} id
     * @param {string} motivo
     */
    anular: async (id, motivo) => {
        return api.patch(`/pagos/${id}/anular`, { motivo });
    },
};
