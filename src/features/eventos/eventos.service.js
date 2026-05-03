import { api } from '../../core/api.js';

/**
 * Servicio para encapsular todas las llamadas a la API relacionadas con Eventos.
 * Desacopla la capa de red de los componentes de UI.
 */
export const EventoService = {
    /**
     * Lista eventos paginados y filtrados.
     */
    async listar(params = {}) {
        const queryParams = new URLSearchParams();
        if (params.page !== undefined) queryParams.append('page', params.page);
        if (params.size !== undefined) queryParams.append('size', params.size);
        if (params.sort) queryParams.append('sort', params.sort);
        if (params.sucursalId) queryParams.append('sucursalId', params.sucursalId);
        
        const qs = queryParams.toString();
        const url = `/eventos${qs ? '?' + qs : ''}`;
        return api.get(url);
    },

    /**
     * Obtiene los detalles de un evento específico por su ID.
     */
    async obtener(id) {
        return api.get(`/eventos/${id}`);
    },

    /**
     * Crea un nuevo evento.
     */
    async crear(data) {
        return api.post('/eventos', data);
    },

    /**
     * Actualiza un evento existente.
     */
    async actualizar(id, data) {
        return api.put(`/eventos/${id}`, data);
    },

    /**
     * Reprograma los horarios de un evento.
     */
    async reprogramar(id, data) {
        return api.post(`/eventos/${id}/reprogramar`, data);
    },

    /**
     * Agrega un pago a un evento.
     */
    async agregarPago(id, data) {
        return api.post(`/eventos/${id}/pagos`, data);
    },

    /**
     * Obtiene el historial de pagos de un evento.
     */
    async obtenerPagos(id) {
        return api.get(`/eventos/${id}/pagos`);
    },

    /**
     * Simula la cancelación de un evento para calcular penalidades/reembolsos.
     */
    async simularCancelacion(id) {
        return api.get(`/eventos/${id}/simular-cancelacion`);
    },

    /**
     * Cancela un evento con sus respectivas reglas de negocio (reembolsos/penalidades).
     */
    async cancelar(id, data) {
        return api.post(`/eventos/${id}/cancelar`, data);
    }
};
