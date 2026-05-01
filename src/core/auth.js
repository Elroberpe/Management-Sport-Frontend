// src/core/auth.js
// Gestor de sesión JWT real.
// La interfaz pública (isLoggedIn, canAccess, getSession, logout) se mantiene
// para que router.js y todos los módulos existentes no necesiten cambios.

import { AuthApi } from '../features/auth/auth.api.js';

// ---------------------------------------------------------------------------
// Permisos por rol (fuente de verdad en el frontend para navegación)
// ---------------------------------------------------------------------------
const ROLE_PERMISSIONS = {
    superadmin:    ['inicio', 'sucursales', 'canchas', 'mantenimientos', 'reservas', 'clientes', 'pagos', 'usuarios'],
    admin:         ['inicio', 'canchas', 'mantenimientos', 'reservas', 'clientes', 'pagos', 'usuarios'],
    recepcionista: ['inicio', 'reservas', 'clientes'],
};

// ---------------------------------------------------------------------------
// Claves de localStorage
// ---------------------------------------------------------------------------
const KEYS = {
    ACCESS_TOKEN:  'pitchpro_access_token',
    REFRESH_TOKEN: 'pitchpro_refresh_token',
    USER:          'pitchpro_user',
};

// ---------------------------------------------------------------------------
// Helpers privados
// ---------------------------------------------------------------------------

/**
 * Decodifica el payload de un JWT sin librerías externas.
 * @param {string} token
 * @returns {object|null}
 */
function _decodeJwt(token) {
    try {
        const payloadB64 = token.split('.')[1];
        // base64url → base64 estándar
        const base64 = payloadB64.replace(/-/g, '+').replace(/_/g, '/');
        const json = decodeURIComponent(
            atob(base64)
                .split('')
                .map(c => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
                .join('')
        );
        return JSON.parse(json);
    } catch (e) {
        console.warn('[Auth] No se pudo decodificar el JWT:', e);
        return null;
    }
}

/**
 * Extrae y normaliza el rol desde el payload JWT.
 * El backend devuelve el rol en la propiedad `roles` (string o array).
 * @param {object} payload
 * @returns {string}
 */
function _extractRole(payload) {
    if (!payload) return 'recepcionista';

    const raw = payload.roles;

    if (Array.isArray(raw) && raw.length > 0) {
        // Normalizamos: "ROLE_SUPERADMIN" → "superadmin"
        return raw[0].replace(/^ROLE_/i, '').toLowerCase();
    }

    if (typeof raw === 'string') {
        return raw.replace(/^ROLE_/i, '').toLowerCase();
    }

    return 'recepcionista'; // Fallback seguro
}

/**
 * Guarda los tokens y construye el objeto de sesión del usuario.
 * @param {{ access_token: string, refresh_token: string }} tokens
 */
function _saveSession(tokens) {
    localStorage.setItem(KEYS.ACCESS_TOKEN, tokens.access_token);
    localStorage.setItem(KEYS.REFRESH_TOKEN, tokens.refresh_token);

    const payload = _decodeJwt(tokens.access_token);
    const rol     = _extractRole(payload);

    const user = {
        username:        payload?.sub || 'Usuario',
        nombre:          payload?.nombre || payload?.name || payload?.sub || 'Usuario',
        rol:             rol,
        rolLabel:        _rolLabel(rol),
        sucursalId:      payload?.sucursalId ?? null,
        sucursalNombre:  payload?.sucursalNombre || (rol === 'superadmin' ? 'Todas las Sedes' : 'Mi Sede'),
    };

    localStorage.setItem(KEYS.USER, JSON.stringify(user));
}

function _rolLabel(rol) {
    const labels = {
        superadmin:    'SUPER ADMINISTRADOR',
        admin:         'ADMINISTRADOR DE SEDE',
        recepcionista: 'RECEPCIONISTA',
    };
    return labels[rol] || rol.toUpperCase();
}

function _clearSession() {
    localStorage.removeItem(KEYS.ACCESS_TOKEN);
    localStorage.removeItem(KEYS.REFRESH_TOKEN);
    localStorage.removeItem(KEYS.USER);
}

// ---------------------------------------------------------------------------
// API pública de Auth
// ---------------------------------------------------------------------------
export const Auth = {

    /**
     * Inicia sesión contra el backend real.
     * @param {string} username
     * @param {string} password
     * @returns {Promise<{ok: boolean, user?: object, error?: string}>}
     */
    async login(username, password) {
        try {
            const tokens = await AuthApi.login(username, password);
            _saveSession(tokens);
            return { ok: true, user: this.getSession() };
        } catch (err) {
            return { ok: false, error: err.message };
        }
    },

    /**
     * Cierra sesión: invalida el refresh token en el servidor y limpia el cliente.
     * @returns {Promise<void>}
     */
    async logout() {
        const accessToken = this.getAccessToken();
        _clearSession();
        if (accessToken) {
            await AuthApi.logout(accessToken); // fire-and-forget seguro
        }
        window.location.hash = '#/login';
    },

    /**
     * Renueva el access token usando el refresh token guardado.
     * @returns {Promise<boolean>} true si se renovó con éxito.
     */
    async refreshSession() {
        const refreshToken = this.getRefreshToken();
        if (!refreshToken) return false;

        try {
            const tokens = await AuthApi.refreshToken(refreshToken);
            _saveSession(tokens);
            return true;
        } catch (err) {
            console.warn('[Auth] Refresh falló, cerrando sesión:', err.message);
            _clearSession();
            return false;
        }
    },

    // -------------------------------------------------------------------------
    // Getters (misma interfaz que el mock anterior)
    // -------------------------------------------------------------------------

    /** @returns {object|null} Datos del usuario logueado. */
    getSession() {
        const raw = localStorage.getItem(KEYS.USER);
        return raw ? JSON.parse(raw) : null;
    },

    /** @returns {boolean} */
    isLoggedIn() {
        return !!localStorage.getItem(KEYS.ACCESS_TOKEN) && !!this.getSession();
    },

    /** @returns {boolean} */
    canAccess(modulo) {
        const session = this.getSession();
        if (!session) return false;
        const allowed = ROLE_PERMISSIONS[session.rol] || [];
        return allowed.includes(modulo);
    },

    /** @returns {string[]} */
    getAllowedModules() {
        const session = this.getSession();
        if (!session) return [];
        return ROLE_PERMISSIONS[session.rol] || [];
    },

    /** @returns {string|null} */
    getAccessToken() {
        return localStorage.getItem(KEYS.ACCESS_TOKEN);
    },

    /** @returns {string|null} */
    getRefreshToken() {
        return localStorage.getItem(KEYS.REFRESH_TOKEN);
    },
};
