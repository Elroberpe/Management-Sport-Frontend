/**
 * sucursalService.js
 * Servicio para consumir la API de Sucursales.
 * Base URL: http://localhost:8080/api/v1
 */

const BASE_URL = 'http://localhost:8080/api/v1';

const SucursalService = {
    /**
     * Obtiene todas las sucursales. Opcionalmente filtra por empresaId.
     * GET /sucursales?empresaId={id}
     * @param {number|null} empresaId - ID de empresa para filtrar (opcional)
     * @returns {Promise<Array>} Lista de SucursalResponse
     */
    async listar(empresaId = null) {
        let url = `${BASE_URL}/sucursales`;
        if (empresaId) url += `?empresaId=${empresaId}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Error al listar sucursales: ${res.status}`);
        return res.json();
    },

    /**
     * Obtiene una sucursal por su ID.
     * GET /sucursales/{id}
     * @param {number} id
     * @returns {Promise<Object>} SucursalResponse
     */
    async obtener(id) {
        const res = await fetch(`${BASE_URL}/sucursales/${id}`);
        if (res.status === 404) throw new Error('Sucursal no encontrada.');
        if (!res.ok) throw new Error(`Error al obtener sucursal: ${res.status}`);
        return res.json();
    },

    /**
     * Crea una nueva sucursal.
     * POST /sucursales
     * @param {Object} data - { empresaId, nombre, direccion, telefono }
     * @returns {Promise<Object>} SucursalResponse
     */
    async crear(data) {
        const res = await fetch(`${BASE_URL}/sucursales`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error(`Error al crear sucursal: ${res.status}`);
        return res.json();
    },

    /**
     * Actualiza una sucursal existente.
     * PUT /sucursales/{id}
     * @param {number} id
     * @param {Object} data - { nombre?, direccion?, telefono?, activo? }
     * @returns {Promise<Object>} SucursalResponse
     */
    async actualizar(id, data) {
        const res = await fetch(`${BASE_URL}/sucursales/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (res.status === 404) throw new Error('Sucursal no encontrada.');
        if (!res.ok) throw new Error(`Error al actualizar sucursal: ${res.status}`);
        return res.json();
    },

    /**
     * Elimina una sucursal. Falla si tiene canchas asociadas.
     * DELETE /sucursales/{id}
     * @param {number} id
     */
    async eliminar(id) {
        const res = await fetch(`${BASE_URL}/sucursales/${id}`, { method: 'DELETE' });
        if (res.status === 404) throw new Error('Sucursal no encontrada.');
        if (res.status === 400) throw new Error('No se puede eliminar: la sucursal tiene canchas asociadas.');
        if (!res.ok) throw new Error(`Error al eliminar sucursal: ${res.status}`);
        // 204 No Content - sin body
    },

    /**
     * Activa una sucursal.
     * PATCH /sucursales/{id}/activar
     * @param {number} id
     * @returns {Promise<Object>} SucursalResponse
     */
    async activar(id) {
        const res = await fetch(`${BASE_URL}/sucursales/${id}/activar`, { method: 'PATCH' });
        if (res.status === 404) throw new Error('Sucursal no encontrada.');
        if (!res.ok) throw new Error(`Error al activar sucursal: ${res.status}`);
        return res.json();
    },

    /**
     * Desactiva una sucursal.
     * PATCH /sucursales/{id}/desactivar
     * @param {number} id
     * @returns {Promise<Object>} SucursalResponse
     */
    async desactivar(id) {
        const res = await fetch(`${BASE_URL}/sucursales/${id}/desactivar`, { method: 'PATCH' });
        if (res.status === 404) throw new Error('Sucursal no encontrada.');
        if (!res.ok) throw new Error(`Error al desactivar sucursal: ${res.status}`);
        return res.json();
    },
};

export default SucursalService;
