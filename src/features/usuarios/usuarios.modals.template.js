// src/features/usuarios/usuarios.modals.template.js
// HTML de los 3 formularios: Crear, Editar, Cambiar Contraseña
// Estructura idéntica a clientes.modals.template.js

/**
 * Formulario de creación de usuario.
 * @param {string} rolActual - 'superadmin' | 'admin'
 */
export function usuarioNewFormTemplate(rolActual = 'admin') {
    const puedeCrearAdmin = rolActual === 'superadmin';

    return `
    <!-- Fila: Nombre + Username -->
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
        <div class="modal-shell-field">
            <label class="modal-shell-label" for="nu-nombre">
                <i class='bx bx-user'></i> Nombre Completo <span style="color:#ef4444;">*</span>
            </label>
            <input type="text" id="nu-nombre" class="modal-shell-input" placeholder="Ej: Carlos Ramírez" autocomplete="off">
            <span class="modal-shell-error-text" id="nu-nombre-err"></span>
        </div>
        <div class="modal-shell-field">
            <label class="modal-shell-label" for="nu-username">
                <i class='bx bx-at'></i> Username <span style="color:#ef4444;">*</span>
            </label>
            <input type="text" id="nu-username" class="modal-shell-input" placeholder="Ej: carlosramirez" autocomplete="off">
            <span class="modal-shell-error-text" id="nu-username-err"></span>
        </div>
    </div>

    <!-- Campo: Email -->
    <div class="modal-shell-field">
        <label class="modal-shell-label" for="nu-email">
            <i class='bx bx-envelope'></i> Email <span style="color:#ef4444;">*</span>
        </label>
        <input type="email" id="nu-email" class="modal-shell-input" placeholder="Ej: carlos@pitchpro.com" autocomplete="off">
        <span class="modal-shell-error-text" id="nu-email-err"></span>
    </div>

    <!-- Campo: Contraseña -->
    <div class="modal-shell-field">
        <label class="modal-shell-label" for="nu-password">
            <i class='bx bx-lock-alt'></i> Contraseña <span style="color:#ef4444;">*</span>
        </label>
        <input type="password" id="nu-password" class="modal-shell-input" placeholder="Mínimo 8 caracteres" autocomplete="new-password">
        <span class="modal-shell-error-text" id="nu-password-err"></span>
    </div>

    <!-- Fila: Rol + Sucursal -->
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
        <div class="modal-shell-field">
            <label class="modal-shell-label" for="nu-rol">
                <i class='bx bx-shield-alt-2'></i> Rol <span style="color:#ef4444;">*</span>
            </label>
            <select id="nu-rol" class="modal-shell-input">
                ${puedeCrearAdmin ? '<option value="ADMIN">Administrador de Sede</option>' : ''}
                <option value="RECEPCIONISTA">Recepcionista</option>
            </select>
            <span class="modal-shell-error-text" id="nu-rol-err"></span>
        </div>
        <div class="modal-shell-field">
            <label class="modal-shell-label" for="nu-sucursal">
                <i class='bx bx-map-pin'></i> ID de Sucursal
            </label>
            <input type="number" id="nu-sucursal" class="modal-shell-input" placeholder="Dejar vacío si no aplica" min="1">
            <span class="modal-shell-error-text" id="nu-sucursal-err"></span>
        </div>
    </div>
    `;
}

/**
 * Formulario de edición de usuario (sin campo contraseña).
 */
export function usuarioEditFormTemplate() {
    return `
    <!-- Fila: Nombre + Username -->
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
        <div class="modal-shell-field">
            <label class="modal-shell-label" for="eu-nombre">
                <i class='bx bx-user'></i> Nombre Completo <span style="color:#ef4444;">*</span>
            </label>
            <input type="text" id="eu-nombre" class="modal-shell-input" placeholder="Nombre completo" autocomplete="off">
            <span class="modal-shell-error-text" id="eu-nombre-err"></span>
        </div>
        <div class="modal-shell-field">
            <label class="modal-shell-label" for="eu-username">
                <i class='bx bx-at'></i> Username <span style="color:#ef4444;">*</span>
            </label>
            <input type="text" id="eu-username" class="modal-shell-input" placeholder="username" autocomplete="off">
            <span class="modal-shell-error-text" id="eu-username-err"></span>
        </div>
    </div>

    <!-- Campo: Email -->
    <div class="modal-shell-field">
        <label class="modal-shell-label" for="eu-email">
            <i class='bx bx-envelope'></i> Email
        </label>
        <input type="email" id="eu-email" class="modal-shell-input" placeholder="email@dominio.com" autocomplete="off">
        <span class="modal-shell-error-text" id="eu-email-err"></span>
    </div>

    <!-- Campo: Rol -->
    <div class="modal-shell-field">
        <label class="modal-shell-label" for="eu-rol">
            <i class='bx bx-shield-alt-2'></i> Rol
        </label>
        <select id="eu-rol" class="modal-shell-input">
            <option value="ADMIN">Administrador de Sede</option>
            <option value="RECEPCIONISTA">Recepcionista</option>
        </select>
        <span class="modal-shell-error-text" id="eu-rol-err"></span>
    </div>
    `;
}

/**
 * Formulario para cambiar la contraseña de un usuario.
 */
export function usuarioPasswordFormTemplate() {
    return `
    <!-- Campo: Nueva Contraseña -->
    <div class="modal-shell-field">
        <label class="modal-shell-label" for="pw-nueva">
            <i class='bx bx-lock-open-alt'></i> Nueva Contraseña <span style="color:#ef4444;">*</span>
        </label>
        <input type="password" id="pw-nueva" class="modal-shell-input" placeholder="Mínimo 8 caracteres" autocomplete="new-password">
        <span class="modal-shell-error-text" id="pw-nueva-err"></span>
    </div>

    <!-- Campo: Confirmar Contraseña -->
    <div class="modal-shell-field">
        <label class="modal-shell-label" for="pw-confirmar">
            <i class='bx bx-lock-alt'></i> Confirmar Contraseña <span style="color:#ef4444;">*</span>
        </label>
        <input type="password" id="pw-confirmar" class="modal-shell-input" placeholder="Repetir nueva contraseña" autocomplete="new-password">
        <span class="modal-shell-error-text" id="pw-confirmar-err"></span>
    </div>
    `;
}
