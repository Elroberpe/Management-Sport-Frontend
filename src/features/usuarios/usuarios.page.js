// src/features/usuarios/usuarios.page.js
// Orquestador principal del módulo de Gestión de Usuarios

import { usuariosTemplate } from './usuarios.template.js';
import { api } from '../../core/api.js';
import { Auth } from '../../core/auth.js';
import { initTable } from '../../shared/components/table.js';
import { initStats } from '../../shared/components/stats.js';
import { initActionButton } from '../../shared/components/action-button.js';
import { initPageHeader } from '../../shared/components/page-header.js';
import { renderStatusBadge } from '../../shared/components/status-badge.js';
import { getAvatarColor, getInitials } from '../../shared/utils/avatar.js';
import {
    initCrearUsuarioModal,
    initEditarUsuarioModal,
    initCambiarPasswordModal,
} from './usuarios.modals.js';

let mountCleanup = null;

export function template() {
    return usuariosTemplate();
}

export function mount(container) {
    // 1. Limpieza de montaje previo
    if (mountCleanup) {
        mountCleanup();
        mountCleanup = null;
    }

    const cleanups = [];
    const addCleanup = (fn) => cleanups.push(fn);
    const addGlobalListener = (target, eventName, handler) => {
        if (!target) return;
        target.addEventListener(eventName, handler);
        addCleanup(() => target.removeEventListener(eventName, handler));
    };

    // -------------------------------------------------------------------------
    // 2. Header
    // -------------------------------------------------------------------------
    const header = initPageHeader({
        containerId: 'usuarios-header-container',
        title: 'Gestión de Usuarios',
        subtitle: 'Administra los operadores del sistema y sus permisos de acceso.',
    });

    // -------------------------------------------------------------------------
    // 3. Stats
    // -------------------------------------------------------------------------
    const stats = initStats('usuarios-stats-container', [
        { id: 'total',  label: 'Total Usuarios',  icon: 'bx bx-group',        colorClass: 'blue'   },
        { id: 'admins', label: 'Administradores', icon: 'bx bx-shield-alt-2', colorClass: 'green'  },
        { id: 'receps', label: 'Recepcionistas',  icon: 'bx bx-headphone',    colorClass: 'yellow' },
    ]);

    function actualizarStats(usuarios, totalElements) {
        if (!stats) return;
        stats.updateAll({
            total:  totalElements,
            admins: usuarios.filter(u => u.rol === 'ADMIN').length,
            receps: usuarios.filter(u => u.rol === 'RECEPCIONISTA').length,
        });
    }

    // -------------------------------------------------------------------------
    // 4. Helpers visuales
    // -------------------------------------------------------------------------
    // getAvatarColor y getInitials importados desde shared/utils/avatar.js

    function rolBadge(rol) {
        const map = {
            SUPERADMIN:    { color: 'red',    label: 'Super Admin'   },
            ADMIN:         { color: 'blue',   label: 'Admin de Sede' },
            RECEPCIONISTA: { color: 'green',  label: 'Recepcionista' },
        };
        const meta = map[rol] || { color: 'gray', label: rol };
        return renderStatusBadge(rol, { color: meta.color, label: meta.label, showDot: true });
    }

    // Cache de sucursales: Map<sucursalId, nombre>
    // Se carga una sola vez al montar el módulo.
    let sucursalesMap = new Map();
    api.get('/sucursales')
        .then(list => {
            if (Array.isArray(list)) {
                list.forEach(s => {
                    const id = s.sucursalId !== undefined ? s.sucursalId : s.id;
                    sucursalesMap.set(String(id), s.nombre);
                });
            }
        })
        .catch(() => {})
        .finally(() => {
            // Cargar tabla DESPUÉS de tener el mapa de sucursales
            table.fetch(0);
        });

    // -------------------------------------------------------------------------
    // 5. Modales (pre-inicializados para que el DOM exista antes de la tabla)
    // -------------------------------------------------------------------------
    const modalEditar    = initEditarUsuarioModal({ onUsuarioActualizado: () => table.fetch(0) });
    const modalPassword  = initCambiarPasswordModal();

    // -------------------------------------------------------------------------
    // 6. Tabla
    // -------------------------------------------------------------------------
    const PAGE_SIZE = 10;

    const table = initTable({
        containerId: 'usuarios-table-container',
        pageSize: PAGE_SIZE,
        actionsStyle: 'inline',
        columns: [
            {
                key: 'nombre',
                label: 'Nombre',
                render: (v, u) => {
                    const id = u.usuarioId || u.id;
                    return `
                    <div class="profile-cell">
                        <div class="avatar-circle" style="background:${getAvatarColor(id)}; color:white;">
                            ${getInitials(v)}
                        </div>
                        <div class="cell-info">
                            <strong class="cell-title">${v}</strong>
                            <span class="cell-subtitle">ID #${id}</span>
                        </div>
                    </div>
                `;
                }
            },
            {
                key: 'username',
                label: 'Username',
                render: (v) => `
                    <div class="cell-info">
                        <span class="cell-title" style="display:flex;align-items:center;gap:5px;">
                            <i class='bx bx-at' style="color:var(--primary);"></i>
                            ${v || '—'}
                        </span>
                    </div>
                `
            },
            {
                key: 'email',
                label: 'Email',
                render: (v) => `
                    <div class="contact-link" style="opacity:${v ? '1' : '0.4'}">
                        <i class='bx bx-envelope'></i>
                        <span>${v || 'Sin email'}</span>
                    </div>
                `
            },
            {
                key: 'rol',
                label: 'Rol',
                render: (v) => rolBadge(v)
            },
            {
                key: 'sucursalId',
                label: 'Sucursal',
                render: (v) => {
                    if (!v) return `<span style="color:var(--text-muted);font-size:12px;">—</span>`;
                    const nombre = sucursalesMap.get(String(v));
                    return `
                        <div class="contact-link">
                            <i class='bx bx-map-pin' style="color:var(--primary);"></i>
                            <span>${nombre || `Sede #${v}`}</span>
                        </div>
                    `;
                }
            },
        ],
        fetchData: async (page) => {
            const searchEl = document.getElementById('usr-search');
            const rolEl    = document.getElementById('usr-filter-rol');

            const q   = searchEl ? searchEl.value.trim() : '';
            const rol = rolEl    ? rolEl.value            : '';

            let url = `/usuarios?page=${page}&size=${PAGE_SIZE}&sort=nombre,asc`;
            if (rol) url += `&rol=${encodeURIComponent(rol)}`;

            try {
                const data  = await api.get(url);
                let items   = Array.isArray(data) ? data : (data.content || []);
                let total   = data.totalElements !== undefined ? data.totalElements : items.length;

                // Excluir SUPERADMIN de la tabla (no debe gestionarse desde aquí)
                items = items.filter(u => u.rol !== 'SUPERADMIN');

                // Filtro local por búsqueda de texto si la API no lo soporta
                if (q) {
                    const qLow = q.toLowerCase();
                    items = items.filter(u =>
                        (u.nombre   || '').toLowerCase().includes(qLow) ||
                        (u.username || '').toLowerCase().includes(qLow)
                    );
                    total = items.length;
                }

                actualizarStats(items, total);

                return {
                    ...data,
                    content:       items,
                    totalElements: total,
                    items:         items,
                };
            } catch (err) {
                console.error('[Usuarios] Error al cargar usuarios:', err);
                return { content: [], totalElements: 0 };
            }
        },
        actions: [
            {
                label: 'Editar',
                icon: 'bx bx-pencil',
                onClick: (u) => modalEditar.abrir(u.usuarioId || u.id),
            },
            {
                label: 'Contraseña',
                icon: 'bx bx-key',
                onClick: (u) => modalPassword.abrir(u.usuarioId || u.id, u.nombre),
            },
            {
                label: 'Eliminar',
                icon: 'bx bx-trash',
                class: 'danger',
                onClick: async (u) => {
                    const id = u.usuarioId || u.id;
                    const confirmed = confirm(
                        `¿Estás seguro de que quieres eliminar a "${u.nombre}"?\nEsta acción no se puede deshacer.`
                    );
                    if (!confirmed) return;

                    try {
                        await api.delete(`/usuarios/${id}`);
                        table.fetch(0);
                    } catch (err) {
                        alert('No se pudo eliminar el usuario: ' + err.message);
                    }
                }
            }
        ]
    });

    // -------------------------------------------------------------------------
    // 7. Listeners de filtros con debounce
    // -------------------------------------------------------------------------
    const searchInput = document.getElementById('usr-search');
    const rolFilter   = document.getElementById('usr-filter-rol');
    let debounceTimer;

    addGlobalListener(searchInput, 'input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => table.fetch(0), 400);
    });

    addGlobalListener(rolFilter, 'change', () => table.fetch(0));

    // -------------------------------------------------------------------------
    // 8. Botón "Crear Nuevo Usuario"
    // -------------------------------------------------------------------------
    const modalCrear = initCrearUsuarioModal({
        onUsuarioCreado: () => table.fetch(0),
    });

    initActionButton({
        containerId: header ? header.primaryActionsId : 'usuarios-action-container',
        label: 'Crear Nuevo Usuario',
        icon: 'bx bx-user-plus',
        onClick: () => modalCrear.open(),
    });

    // Guardar cleanup
    mountCleanup = () => cleanups.forEach(fn => { try { fn(); } catch (e) {} });
}

export function unmount() {
    if (mountCleanup) {
        mountCleanup();
        mountCleanup = null;
    }
}
