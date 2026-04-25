// src/features/clientes/clientes.modals.template.js

export const clientesNewFormTemplate = () => `
    <!-- Fila: Tipo y Número de Documento -->
    <div style="display:grid; grid-template-columns:1fr 1.5fr; gap:12px;">
        <div class="modal-shell-field">
            <label class="modal-shell-label" for="nc-tipo-doc">
                Tipo Doc <span style="color:#ef4444;">*</span>
            </label>
            <select id="nc-tipo-doc" class="modal-shell-input">
                <option value="DNI">DNI</option>
                <option value="RUC">RUC</option>
                <option value="PASAPORTE">PASAPORTE</option>
            </select>
        </div>
        <div class="modal-shell-field">
            <label class="modal-shell-label" for="nc-num-doc">
                N° Documento <span style="color:#ef4444;">*</span>
            </label>
            <input type="text" id="nc-num-doc" class="modal-shell-input" maxlength="20" placeholder="Ej: 71234567">
            <span class="modal-shell-error-text" id="nc-num-doc-err"></span>
        </div>
    </div>

    <!-- Campo: Nombre Completo -->
    <div class="modal-shell-field">
        <label class="modal-shell-label" for="nc-nombre">
            <i class='bx bx-user'></i> Nombre Completo <span style="color:#ef4444;">*</span>
        </label>
        <input type="text" id="nc-nombre" class="modal-shell-input" maxlength="150" placeholder="Ej: Juan Pérez García">
        <span class="modal-shell-error-text" id="nc-nombre-err"></span>
    </div>

    <!-- Campo: Email -->
    <div class="modal-shell-field">
        <label class="modal-shell-label" for="nc-email">
            <i class='bx bx-envelope'></i> Email (Opcional)
        </label>
        <input type="email" id="nc-email" class="modal-shell-input" maxlength="100" placeholder="ejemplo@correo.com">
        <span class="modal-shell-error-text" id="nc-email-err"></span>
    </div>

    <!-- Campo: Teléfono -->
    <div class="modal-shell-field">
        <label class="modal-shell-label" for="nc-telefono">
            <i class='bx bx-phone'></i> Teléfono (Opcional)
        </label>
        <input type="tel" id="nc-telefono" class="modal-shell-input" maxlength="20" placeholder="Ej: 987654321">
        <span class="modal-shell-error-text" id="nc-telefono-err"></span>
    </div>
`;
