// src/core/api.js
// Cliente HTTP centralizado con:
//   - Inyección automática del Bearer token en cada request
//   - Auto-refresh cuando el servidor devuelve 401
//   - Logout automático si el refresh también falla

import { Auth } from './auth.js';
import { CONFIG } from './config.js';

const BASE_URL = CONFIG.API_BASE_URL;

// Flag para evitar múltiples intentos de refresh simultáneos
let _isRefreshing = false;
let _refreshSubscribers = [];

// Ejecuta las llamadas en cola con el nuevo token
function onRefreshed(token) {
    _refreshSubscribers.forEach(cb => cb(token));
    _refreshSubscribers = [];
}

// Agrega llamadas a la cola de espera
function addRefreshSubscriber(cb) {
    _refreshSubscribers.push(cb);
}

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
     * Si recibe 401 o 403, pausa las llamadas (cola), renueva el token, 
     * y luego reintenta transparentemente.
     * @param {string} endpoint  - ruta relativa ej: '/canchas'
     * @param {string} method    - GET, POST, PUT, PATCH, DELETE
     * @param {object|null} data - cuerpo JSON opcional
     * @param {boolean} _retry   - flag interno para evitar loop de refresh
     */
    async request(endpoint, method, data = null, _retry = false) {
        // 1. Si está refrescando, poner en cola hasta que termine (salvo que sea un retry)
        if (_isRefreshing && !_retry) {
            return new Promise((resolve) => {
                addRefreshSubscriber(() => {
                    resolve(this.request(endpoint, method, data, true));
                });
            });
        }

        const url = `${BASE_URL}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
        };

        // 2. Inyectar Bearer token actual
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

            // 3. Manejo de Error 401 / 403 (Token Expirado)
            if ((response.status === 401 || response.status === 403) && !_retry) {
                
                // Si justo en el medio del vuelo otro req disparó el refresh
                if (_isRefreshing) {
                    return new Promise((resolve) => {
                        addRefreshSubscriber(() => {
                            resolve(this.request(endpoint, method, data, true));
                        });
                    });
                }

                _isRefreshing = true;

                // 4. Intento de Rescate (Refresh Token)
                const refreshed = await Auth.refreshSession();

                if (refreshed) {
                    _isRefreshing = false;
                    // Llamar a todos los requests en pausa para que reintenten
                    onRefreshed(Auth.getAccessToken());
                    // Reintentar este mismo request original
                    return this.request(endpoint, method, data, true);
                } else {
                    // 5. Refresh Falló: Forzar Logout
                    _isRefreshing = false;
                    _refreshSubscribers = []; // Vaciar cola
                    await Auth.logout();
                    throw new Error('Sesión expirada por seguridad. Por favor inicia sesión de nuevo.');
                }
            }

            // Manejo de otros errores estándar
            if (!response.ok) {
                if (response.status === 204) return null;
                const errorData = await response.json().catch(() => null);
                throw new Error((errorData && errorData.message) || `Error HTTP: ${response.status}`);
            }

            // Respuesta exitosa sin body
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
