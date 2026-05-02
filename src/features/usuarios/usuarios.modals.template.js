// src/features/usuarios/usuarios.modals.template.js
// HTML de los 3 formularios: Crear, Editar, Cambiar Contraseña

/**
 * Formulario de creación de usuario.
 * Recibe el rol del usuario actual para filtrar las opciones del select de rol.
 * @param {string} rolActual - 'superadmin' | 'admin'
 */
export function usuarioNewFormTemplate(rolActual = 'admin') {
    const puedeCrearAdmin = rolActual === 'superadmin';

    return `
    <div class="modal-form-grid">

        <div class="modal-form-group">
            <label class="modal-form-label" for="nu-nombre">Nombre Completo <span class="modal-form-required">*</span></label>
            <div class="modal-shell-input-wrap">
                <i class='bx bx-user'></i>
                <input type="text" id="nu-nombre" class="modal-shell-input" placeholder="Ej: Carlos Ramírez" autocomplete="off">
            </div>
            <span class="modal-shell-error-text" id="nu-nombre-err"></span>
        </div>

        <div class="modal-form-group">
            <label class="modal-form-label" for="nu-username">Username <span class="modal-form-required">*</span></label>
            <div class="modal-shell-input-wrap">
                <i class='bx bx-at'></i>
                <input type="text" id="nu-username" class="modal-shell-input" placeholder="Ej: carlosramirez" autocomplete="off">
            </div>
            <span class="modal-shell-error-text" id="nu-username-err"></span>
        </div>

        <div class="modal-form-group">
            <label class="modal-form-label" for="nu-email">Email <span class="modal-form-required">*</span></label>
            <div class="modal-shell-input-wrap">
                <i class='bx bx-envelope'></i>
                <input type="email" id="nu-email" class="modal-shell-input" placeholder="Ej: carlos@pitchpro.com" autocomplete="off">
            </div>
            <span class="modal-shell-error-text" id="nu-email-err"></span>
        </div>

        <div class="modal-form-group">
            <label class="modal-form-label" for="nu-password">Contraseña <span class="modal-form-required">*</span></label>
            <div class="modal-shell-input-wrap">
                <i class='bx bx-lock-alt'></i>
                <input type="password" id="nu-password" class="modal-shell-input" placeholder="Mínimo 8 caracteres" autocomplete="new-password">
            </div>
            <span class="modal-shell-error-text" id="nu-password-err"></span>
        </div>

        <div class="modal-form-group">
            <label class="modal-form-label" for="nu-rol">Rol <span class="modal-form-required">*</span></label>
            <div class="modal-shell-input-wrap">
                <i class='bx bx-shield-alt-2'></i>
                <select id="nu-rol" class="modal-shell-input">
                    ${puedeCrearAdmin ? '<option value="ADMIN">Administrador de Sede</option>' : ''}
                    <option value="RECEPCIONISTA">Recepcionista</option>
                </select>
            </div>
            <span class="modal-shell-error-text" id="nu-rol-err"></span>
        </div>

        <div class="modal-form-group">
            <label class="modal-form-label" for="nu-sucursal">ID de Sucursal</label>
            <div class="modal-shell-input-wrap">
                <i class='bx bx-map-pin'></i>
                <input type="number" id="nu-sucursal" class="modal-shell-input" placeholder="Dejar vacío si no aplica" min="1">
            </div>
            <span class="modal-shell-error-text" id="nu-sucursal-err"></span>
            <small class="modal-form-hint">Requerido para ADMIN y RECEPCIONISTA</small>
        </div>

    </div>
    `;
}

/**
 * Formulario de edición de usuario (sin contraseña).
 */
export function usuarioEditFormTemplate() {
    return `
    <div class="modal-form-grid">

        <div class="modal-form-group">
            <label class="modal-form-label" for="eu-nombre">Nombre Completo <span class="modal-form-required">*</span></label>
            <div class="modal-shell-input-wrap">
                <i class='bx bx-user'></i>
                <input type="text" id="eu-nombre" class="modal-shell-input" placeholder="Nombre completo" autocomplete="off">
            </div>
            <span class="modal-shell-error-text" id="eu-nombre-err"></span>
        </div>

        <div class="modal-form-group">
            <label class="modal-form-label" for="eu-username">Username <span class="modal-form-required">*</span></label>
            <div class="modal-shell-input-wrap">
                <i class='bx bx-at'></i>
                <input type="text" id="eu-username" class="modal-shell-input" placeholder="Username" autocomplete="off">
            </div>
            <span class="modal-shell-error-text" id="eu-username-err"></span>
        </div>

        <div class="modal-form-group">
            <label class="modal-form-label" for="eu-email">Email</label>
            <div class="modal-shell-input-wrap">
                <i class='bx bx-envelope'></i>
                <input type="email" id="eu-email" class="modal-shell-input" placeholder="email@dominio.com" autocomplete="off">
            </div>
            <span class="modal-shell-error-text" id="eu-email-err"></span>
        </div>

        <div class="modal-form-group">
            <label class="modal-form-label" for="eu-rol">Rol</label>
            <div class="modal-shell-input-wrap">
                <i class='bx bx-shield-alt-2'></i>
                <select id="eu-rol" class="modal-shell-input">
                    <option value="ADMIN">Administrador de Sede</option>
                    <option value="RECEPCIONISTA">Recepcionista</option>
                </select>
            </div>
            <span class="modal-shell-error-text" id="eu-rol-err"></span>
        </div>

    </div>
    `;
}

/**
 * Formulario para cambiar la contraseña de un usuario.
 */
export function usuarioPasswordFormTemplate() {
    return `
    <div class="modal-form-grid">

        <div class="modal-form-group">
            <label class="modal-form-label" for="pw-nueva">Nueva Contraseña <span class="modal-form-required">*</span></label>
            <div class="modal-shell-input-wrap">
                <i class='bx bx-lock-open-alt'></i>
                <input type="password" id="pw-nueva" class="modal-shell-input" placeholder="Mínimo 8 caracteres" autocomplete="new-password">
            </div>
            <span class="modal-shell-error-text" id="pw-nueva-err"></span>
        </div>

        <div class="modal-form-group">
            <label class="modal-form-label" for="pw-confirmar">Confirmar Contraseña <span class="modal-form-required">*</span></label>
            <div class="modal-shell-input-wrap">
                <i class='bx bx-lock-alt'></i>
                <input type="password" id="pw-confirmar" class="modal-shell-input" placeholder="Repetir nueva contraseña" autocomplete="new-password">
            </div>
            <span class="modal-shell-error-text" id="pw-confirmar-err"></span>
        </div>

    </div>
    `;
}
