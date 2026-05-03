// src/features/usuarios/usuarios.service.js
// Capa de acceso a datos para el dominio Usuarios.
// Centraliza todas las llamadas a /usuarios para desacoplar la UI de la API.

import { api } from '../../core/api.js';

export const UsuarioService = {
    /**
     * Lista usuarios con filtros opcionales.
     * @param {{ page?, size?, sort?, rol?, sucursalId? }} params
     */
    listar: async (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return api.get(`/usuarios${query ? '?' + query : ''}`);
    },

    /**
     * Obtiene un usuario por ID.
     * @param {number} id
     */
    obtener: async (id) => {
        return api.get(`/usuarios/${id}`);
    },

    /**
     * Crea un nuevo usuario del sistema.
     * @param {{ nombre, username, email, password, rol, sucursalId? }} payload
     */
    crear: async (payload) => {
        return api.post('/usuarios', payload);
    },

    /**
     * Actualiza los datos de un usuario.
     * @param {number} id
     * @param {{ nombre, username, email, rol }} payload
     */
    actualizar: async (id, payload) => {
        return api.put(`/usuarios/${id}`, payload);
    },

    /**
     * Elimina un usuario del sistema.
     * @param {number} id
     */
    eliminar: async (id) => {
        return api.delete(`/usuarios/${id}`);
    },

    /**
     * Cambia la contraseña de un usuario.
     * @param {number} id
     * @param {string} newPassword
     */
    cambiarPassword: async (id, newPassword) => {
        return api.patch(`/usuarios/${id}/password`, { newPassword });
    },

    /**
     * Lista las sucursales activas (usado para poblar selects en modales de usuario).
     */
    listarSucursales: async () => {
        const data = await api.get('/sucursales');
        return Array.isArray(data) ? data.filter(s => s.activo !== false) : [];
    },
};
