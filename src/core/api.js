// src/core/api.js
// Cliente HTTP centralizado con:
//   - Inyección automática del Bearer token en cada request
//   - Auto-refresh cuando el servidor devuelve 401
//   - Logout automático si el refresh también falla

import { Auth } from './auth.js';

const BASE_URL = 'http://localhost:8080/api/v1';

// Flag para evitar múltiples intentos de refresh simultáneos
let _isRefreshing = false;

export const api = {
    async get(endpoint) {
        return this.request(endpoint, 'GET');
    },

    async post(endpoint, data) {
        return this.request(endpoint, 'POST', data);
    },

    async put(endpoint, data) {
        return this.request(endpoint, 'PUT', data);
    },

    async patch(endpoint, data) {
        return this.request(endpoint, 'PATCH', data);
    },

    async delete(endpoint) {
        return this.request(endpoint, 'DELETE');
    },

    /**
     * Realiza una petición HTTP autenticada.
     * Si recibe 401, intenta renovar el token una sola vez y reintenta.
     * @param {string} endpoint  - ruta relativa ej: '/canchas'
     * @param {string} method    - GET, POST, PUT, PATCH, DELETE
     * @param {object|null} data - cuerpo JSON opcional
     * @param {boolean} _retry   - flag interno para evitar loop de refresh
     */
    async request(endpoint, method, data = null, _retry = false) {
        const url = `${BASE_URL}${endpoint}`;

        const headers = {
            'Content-Type': 'application/json',
        };

        // Inyectar Bearer token si existe
        const token = Auth.getAccessToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const options = { method, headers };

        if (data !== null && data !== undefined) {
            options.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(url, options);

            // --- Manejo de 401: token expirado ---
            if (response.status === 401 && !_retry && !_isRefreshing) {
                _isRefreshing = true;

                const refreshed = await Auth.refreshSession();
                _isRefreshing = false;

                if (refreshed) {
                    // Reintentar el request original con el nuevo token
                    console.info('[API] Token renovado. Reintentando request...');
                    return this.request(endpoint, method, data, true);
                } else {
                    // Refresh falló → logout automático
                    console.warn('[API] Refresh falló. Cerrando sesión.');
                    await Auth.logout();
                    throw new Error('Sesión expirada. Por favor inicia sesión de nuevo.');
                }
            }

            if (!response.ok) {
                // Para respuestas 204 No Content (ej. DELETE), no hay body
                if (response.status === 204) return null;

                const errorData = await response.json().catch(() => null);
                throw new Error((errorData && errorData.message) || `Error HTTP: ${response.status}`);
            }

            // Respuesta exitosa sin body (ej: logout 200 sin JSON)
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                return null;
            }

            return await response.json();

        } catch (error) {
            console.error(`[API] Error en ${method} ${endpoint}:`, error);
            throw error;
        }
    }
};
