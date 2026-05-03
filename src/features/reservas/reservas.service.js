// src/features/reservas/reservas.service.js
// Capa de acceso a datos para el dominio Reservas.
// Centraliza todas las llamadas a /reservas para desacoplar la UI de la API.

import { api } from '../../core/api.js';

export const ReservaService = {
    /**
     * Lista reservas con filtros paginados.
     * @param {{ page?, size?, sort?, sucursalId?, canchaId?, estado?, clienteId?, desde?, hasta? }} params
     */
    listar: async (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return api.get(`/reservas${query ? '?' + query : ''}`);
    },

    /**
     * Obtiene el detalle completo de una reserva.
     * @param {number} id
     */
    obtener: async (id) => {
        return api.get(`/reservas/${id}`);
    },

    /**
     * Crea una nueva reserva.
     * @param {{ canchaId, clienteId, fechaInicio, fechaFin, sucursalId, metodoPago, montoPagado }} payload
     */
    crear: async (payload) => {
        return api.post('/reservas', payload);
    },

    /**
     * Cancela una reserva (con o sin reembolso).
     * @param {number} id
     * @param {{ motivo, metodoPago?, montoReembolso? }} payload
     */
    cancelar: async (id, payload) => {
        return api.patch(`/reservas/${id}/cancelar`, payload);
    },

    /**
     * Reprograma (reschedule) una reserva.
     * @param {number} id
     * @param {{ fechaInicio, fechaFin, canchaId?, metodoPago?, montoPagado? }} payload
     */
    reprogramar: async (id, payload) => {
        return api.post(`/reservas/${id}/reprogramar`, payload);
    },

    /**
     * Genera un reembolso manual para una reserva.
     * @param {number} id
     * @param {{ monto, metodoPago, motivo }} payload
     */
    reembolsar: async (id, payload) => {
        return api.post(`/reservas/${id}/reembolso`, payload);
    },

    /**
     * Agrega un pago a una reserva.
     * @param {number} id
     * @param {{ monto, metodoPago, nota? }} payload
     */
    agregarPago: async (id, payload) => {
        return api.post(`/reservas/${id}/pagos`, payload);
    },

    /**
     * Obtiene los pagos registrados de una reserva.
     * @param {number} id
     */
    obtenerPagos: async (id) => {
        return api.get(`/reservas/${id}/pagos`);
    },

    /**
     * Obtiene la disponibilidad de canchas para un rango de fechas.
     * @param {{ sucursalId?, fecha?, canchaId? }} params
     */
    obtenerDisponibilidad: async (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return api.get(`/reservas/disponibilidad${query ? '?' + query : ''}`);
    },

    /**
     * Lista las canchas disponibles para una sede.
     * @param {{ sucursalId? }} params
     */
    listarCanchas: async (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return api.get(`/canchas${query ? '?' + query : ''}`);
    },
};
