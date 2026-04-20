/**
 * auth.js — Módulo de Autenticación Simulada
 * Cuando el backend esté listo, solo reemplaza Auth.login() con fetch('/api/v1/auth/login')
 */

const MOCK_USERS = [
    {
        id: 1,
        nombre: 'Carlos Ramírez',
        email: 'superadmin@pitchpro.com',
        password: 'super123',
        rol: 'superadmin',
        rolLabel: 'SUPER ADMINISTRADOR',
        sucursalId: null,
        sucursalNombre: 'Todas las Sedes',
        avatar: 'https://i.pravatar.cc/150?img=12',
    },
    {
        id: 2,
        nombre: 'María González',
        email: 'admin@sede1.com',
        password: 'admin123',
        rol: 'admin',
        rolLabel: 'ADMINISTRADOR DE SEDE',
        sucursalId: 1,
        sucursalNombre: 'Sede Principal',
        avatar: 'https://i.pravatar.cc/150?img=5',
    },
    {
        id: 3,
        nombre: 'José Martínez',
        email: 'recep@sede1.com',
        password: 'recep123',
        rol: 'recepcionista',
        rolLabel: 'RECEPCIONISTA',
        sucursalId: 1,
        sucursalNombre: 'Sede Principal',
        avatar: 'https://i.pravatar.cc/150?img=8',
    },
];

// Permisos por rol: qué módulos puede ver en el sidebar
const ROLE_PERMISSIONS = {
    superadmin: ['inicio', 'sedes', 'canchas', 'calendario', 'clientes', 'pagos'],
    admin:       ['inicio', 'canchas', 'calendario', 'clientes', 'pagos'],
    recepcionista: ['inicio', 'calendario', 'clientes'],
};

const SESSION_KEY = 'pitchpro_session';

const Auth = {
    /**
     * Valida credenciales y guarda la sesión.
     * @param {string} email
     * @param {string} password
     * @returns {{ ok: boolean, user?: object, error?: string }}
     */
    login(email, password) {
        const user = MOCK_USERS.find(
            u => u.email === email.trim().toLowerCase() && u.password === password
        );
        if (!user) {
            return { ok: false, error: 'Correo o contraseña incorrectos.' };
        }
        // Guardar sesión sin la contraseña
        const session = { ...user };
        delete session.password;
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
        return { ok: true, user: session };
    },

    /** Cierra sesión y limpia el storage */
    logout() {
        sessionStorage.removeItem(SESSION_KEY);
        window.location.hash = '#/login';
    },

    /**
     * Retorna el usuario de la sesión actual o null si no hay sesión.
     * @returns {object|null}
     */
    getSession() {
        const raw = sessionStorage.getItem(SESSION_KEY);
        return raw ? JSON.parse(raw) : null;
    },

    /**
     * Verifica si el rol actual puede acceder a un módulo.
     * @param {string} modulo - Nombre del módulo (ej: 'sedes', 'canchas')
     * @returns {boolean}
     */
    canAccess(modulo) {
        const session = this.getSession();
        if (!session) return false;
        const allowed = ROLE_PERMISSIONS[session.rol] || [];
        return allowed.includes(modulo);
    },

    /**
     * Retorna la lista de módulos permitidos para el rol actual.
     * @returns {string[]}
     */
    getAllowedModules() {
        const session = this.getSession();
        if (!session) return [];
        return ROLE_PERMISSIONS[session.rol] || [];
    },

    /** true si hay sesión activa */
    isLoggedIn() {
        return !!this.getSession();
    },
};

window.Auth = Auth;
