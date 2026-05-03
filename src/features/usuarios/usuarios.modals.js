// src/features/usuarios/usuarios.modals.js
// Lógica de los 3 modales: Crear Usuario, Editar Usuario, Cambiar Contraseña

import { UsuarioService } from './usuarios.service.js';
import { Auth } from '../../core/auth.js';
import { initModalShell } from '../../shared/components/modal-shell.js';
import {
    usuarioNewFormTemplate,
    usuarioEditFormTemplate,
    usuarioPasswordFormTemplate,
} from './usuarios.modals.template.js';

// ---------------------------------------------------------------------------
// Modal: Crear Nuevo Usuario
// ---------------------------------------------------------------------------
// Helper: cargar sucursales en un <select>
// Reutiliza el mismo endpoint y patrón que dashboard.page.js
// ---------------------------------------------------------------------------
async function _cargarSucursalesEnSelect(selectId) {
    const select = document.getElementById(selectId);
    if (!select) return;

    select.innerHTML = '';

    try {
        const activas = await UsuarioService.listarSucursales();

        activas.forEach(s => {
            const id  = s.sucursalId !== undefined ? s.sucursalId : s.id;
            const opt = document.createElement('option');
            opt.value       = id;
            opt.textContent = s.nombre;
            select.appendChild(opt);
        });
    } catch (err) {
        console.warn('[UsuariosModal] No se pudieron cargar las sucursales:', err.message);
        select.innerHTML = '<option value="">⚠️ Error al cargar sedes</option>';
    }
}

// ---------------------------------------------------------------------------
export function initCrearUsuarioModal({ onUsuarioCreado }) {
    const session = Auth.getSession();
    const rolActual = session?.rol || 'admin';

    const modal = initModalShell({
        id: 'modal-crear-usuario',
        title: 'Crear Nuevo Usuario',
        subtitle: 'Registra un operador del sistema con acceso al panel',
        icon: 'bx bx-user-plus',
        confirmText: 'Crear Usuario',
        contentHtml: usuarioNewFormTemplate(rolActual),
        onConfirm: async (ctx) => {
            const nombre    = document.getElementById('nu-nombre').value.trim();
            const username  = document.getElementById('nu-username').value.trim();
            const email     = document.getElementById('nu-email').value.trim();
            const password  = document.getElementById('nu-password').value;
            const rol       = document.getElementById('nu-rol').value;
            const sucursalEl = document.getElementById('nu-sucursal');
            const sucursalId = sucursalEl && sucursalEl.value ? parseInt(sucursalEl.value) : null;

            // Validación
            let hasError = false;
            if (!nombre) {
                ctx.showFieldError('nu-nombre', 'El nombre es obligatorio.');
                hasError = true;
            }
            if (!username) {
                ctx.showFieldError('nu-username', 'El username es obligatorio.');
                hasError = true;
            }
            if (!email) {
                ctx.showFieldError('nu-email', 'El email es obligatorio.');
                hasError = true;
            }
            if (!password || password.length < 8) {
                ctx.showFieldError('nu-password', 'La contraseña debe tener al menos 8 caracteres.');
                hasError = true;
            }
            if (hasError) return;

            ctx.setLoading(true);
            try {
                const payload = { nombre, username, email, password, rol };
                if (sucursalId) payload.sucursalId = sucursalId;

                const nuevoUsuario = await UsuarioService.crear(payload);

                ctx.showToast(`Usuario "${nuevoUsuario.nombre}" creado con éxito.`);
                ctx.close();
                if (onUsuarioCreado) onUsuarioCreado(nuevoUsuario);
            } catch (err) {
                ctx.setLoading(false);
                ctx.showError(err.message || 'Error al crear el usuario. Verifica los datos.');
            }
        }
    });

    // Envolver open() para cargar sucursales al abrir el modal
    return {
        ...modal,
        open: () => {
            modal.open();
            // Cargar sucursales de forma asíncrona al abrir
            _cargarSucursalesEnSelect('nu-sucursal');
        }
    };
}

// ---------------------------------------------------------------------------
// Modal: Editar Usuario
// ---------------------------------------------------------------------------
export function initEditarUsuarioModal({ onUsuarioActualizado }) {
    let currentUsuarioId = null;

    const modal = initModalShell({
        id: 'modal-editar-usuario',
        title: 'Editar Usuario',
        subtitle: 'Actualiza la información del operador del sistema',
        icon: 'bx bx-pencil',
        confirmText: 'Guardar Cambios',
        contentHtml: usuarioEditFormTemplate(),
        onConfirm: async (ctx) => {
            const nombre   = document.getElementById('eu-nombre').value.trim();
            const username = document.getElementById('eu-username').value.trim();
            const email    = document.getElementById('eu-email').value.trim();
            const rol      = document.getElementById('eu-rol').value;

            let hasError = false;
            if (!nombre) {
                ctx.showFieldError('eu-nombre', 'El nombre es obligatorio.');
                hasError = true;
            }
            if (!username) {
                ctx.showFieldError('eu-username', 'El username es obligatorio.');
                hasError = true;
            }
            if (hasError) return;

            ctx.setLoading(true);
            try {
                const payload = { nombre, username, email, rol };
                const actualizado = await UsuarioService.actualizar(currentUsuarioId, payload);

                ctx.showToast(`Usuario "${actualizado.nombre}" actualizado con éxito.`);
                ctx.close();
                if (onUsuarioActualizado) onUsuarioActualizado(actualizado);
            } catch (err) {
                ctx.setLoading(false);
                ctx.showError(err.message || 'Error al actualizar el usuario.');
            }
        }
    });

    return {
        ...modal,
        /**
         * Abre el modal cargando datos frescos del usuario.
         * @param {number} usuarioId
         */
        abrir: async (usuarioId) => {
            currentUsuarioId = usuarioId;
            modal.open();

            try {
                const u = await UsuarioService.obtener(usuarioId);
                document.getElementById('eu-nombre').value   = u.nombre   || '';
                document.getElementById('eu-username').value = u.username  || '';
                document.getElementById('eu-email').value    = u.email     || '';
                document.getElementById('eu-rol').value      = u.rol       || 'RECEPCIONISTA';
            } catch (err) {
                console.error('[UsuariosModal] Error al cargar usuario:', err);
                modal.showError('No se pudo cargar la información del usuario.');
            }
        }
    };
}

// ---------------------------------------------------------------------------
// Modal: Cambiar Contraseña
// ---------------------------------------------------------------------------
export function initCambiarPasswordModal() {
    let currentUsuarioId   = null;
    let currentUsuarioNombre = '';

    const modal = initModalShell({
        id: 'modal-cambiar-password',
        title: 'Cambiar Contraseña',
        subtitle: 'Establece una nueva contraseña para el usuario',
        icon: 'bx bx-key',
        confirmText: 'Cambiar Contraseña',
        contentHtml: usuarioPasswordFormTemplate(),
        onConfirm: async (ctx) => {
            const nueva     = document.getElementById('pw-nueva').value;
            const confirmar = document.getElementById('pw-confirmar').value;

            let hasError = false;
            if (!nueva || nueva.length < 8) {
                ctx.showFieldError('pw-nueva', 'La contraseña debe tener al menos 8 caracteres.');
                hasError = true;
            }
            if (nueva !== confirmar) {
                ctx.showFieldError('pw-confirmar', 'Las contraseñas no coinciden.');
                hasError = true;
            }
            if (hasError) return;

            ctx.setLoading(true);
            try {
                await UsuarioService.cambiarPassword(currentUsuarioId, nueva);

                ctx.showToast(`Contraseña de "${currentUsuarioNombre}" actualizada con éxito.`);
                ctx.close();
            } catch (err) {
                ctx.setLoading(false);
                ctx.showError(err.message || 'Error al cambiar la contraseña.');
            }
        }
    });

    return {
        ...modal,
        /**
         * Abre el modal de cambio de contraseña.
         * @param {number} usuarioId
         * @param {string} usuarioNombre
         */
        abrir: (usuarioId, usuarioNombre) => {
            currentUsuarioId     = usuarioId;
            currentUsuarioNombre = usuarioNombre;

            // Actualizar subtítulo con el nombre del usuario
            const subtitleEl = document.querySelector('#modal-cambiar-password .modal-shell-subtitle');
            if (subtitleEl) subtitleEl.textContent = `Nuevo acceso para: ${usuarioNombre}`;

            // Limpiar campos antes de abrir
            const pwNueva = document.getElementById('pw-nueva');
            const pwConfirmar = document.getElementById('pw-confirmar');
            if (pwNueva) pwNueva.value = '';
            if (pwConfirmar) pwConfirmar.value = '';

            modal.open();
        }
    };
}
