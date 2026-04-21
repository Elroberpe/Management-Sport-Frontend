// src/core/auth.js

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

const ROLE_PERMISSIONS = {
    superadmin:    ['inicio', 'sucursales', 'canchas', 'mantenimientos', 'reservas', 'clientes', 'pagos', 'usuarios'],
    admin:         ['inicio', 'canchas', 'mantenimientos', 'reservas', 'clientes', 'pagos', 'usuarios'],
    recepcionista: ['inicio', 'reservas', 'clientes'],
};

const SESSION_KEY = 'pitchpro_session';

export const Auth = {
    login(email, password) {
        const user = MOCK_USERS.find(
            u => u.email === email.trim().toLowerCase() && u.password === password
        );
        if (!user) {
            return { ok: false, error: 'Correo o contraseña incorrectos.' };
        }
        const session = { ...user };
        delete session.password;
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
        return { ok: true, user: session };
    },

    logout() {
        sessionStorage.removeItem(SESSION_KEY);
        window.location.hash = '#/login';
    },

    getSession() {
        const raw = sessionStorage.getItem(SESSION_KEY);
        return raw ? JSON.parse(raw) : null;
    },

    canAccess(modulo) {
        const session = this.getSession();
        if (!session) return false;
        const allowed = ROLE_PERMISSIONS[session.rol] || [];
        return allowed.includes(modulo);
    },

    getAllowedModules() {
        const session = this.getSession();
        if (!session) return [];
        return ROLE_PERMISSIONS[session.rol] || [];
    },

    isLoggedIn() {
        return !!this.getSession();
    },
};
