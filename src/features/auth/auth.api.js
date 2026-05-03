// src/features/auth/auth.api.js
// Capa de acceso a la API de autenticación.
// Usa /api/auth (distinto de /api/v1 del resto de la app).

const AUTH_BASE = 'https://management-sport-api.onrender.com/api/auth';     //'http://localhost:8080/api/auth';

export const AuthApi = {

    /**
     * Inicia sesión. POST /api/auth/login
     * @param {string} username
     * @param {string} password
     * @returns {Promise<{access_token: string, refresh_token: string}>}
     */
    async login(username, password) {
        const res = await fetch(`${AUTH_BASE}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
            const msg = data?.message || `Error ${res.status}: Credenciales inválidas.`;
            throw new Error(msg);
        }

        return data; // { access_token, refresh_token }
    },

    /**
     * Renueva el access token. POST /api/auth/refresh-token
     * @param {string} refreshToken
     * @returns {Promise<{access_token: string, refresh_token: string}>}
     */
    async refreshToken(refreshToken) {
        const res = await fetch(`${AUTH_BASE}/refresh-token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
            const msg = data?.message || 'Sesión expirada. Por favor inicia sesión de nuevo.';
            throw new Error(msg);
        }

        return data; // { access_token, refresh_token }
    },

    /**
     * Cierra sesión en el servidor. POST /api/auth/logout
     * @param {string} accessToken
     * @returns {Promise<void>}
     */
    async logout(accessToken) {
        // Fire-and-forget: si falla el server, igual limpiamos el cliente
        await fetch(`${AUTH_BASE}/logout`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
            },
        }).catch((err) => {
            console.warn('[AuthApi] logout server call failed (ignorando):', err);
        });
    },
};
