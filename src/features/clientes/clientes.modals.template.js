// src/features/clientes/clientes.modals.template.js

export const clientesModalsTemplate = () => `
<!-- ===== MODAL: NUEVO CLIENTE ===== -->
<div id="modal-nuevo-cliente" class="nc-overlay" style="display:none;" role="dialog" aria-modal="true" aria-labelledby="modal-nc-title">
    <div class="nc-modal">

        <!-- Header -->
        <div class="nc-header">
            <div class="nc-header-icon" style="background:#f1f5f9; color:var(--primary);"><i class='bx bx-user-plus'></i></div>
            <div>
                <h2 class="nc-title" id="modal-nc-title">Crear Nuevo Cliente</h2>
                <p class="nc-subtitle">Registra un nuevo cliente global en el sistema</p>
            </div>
            <button class="nc-close" id="btn-nc-close" title="Cerrar"><i class='bx bx-x'></i></button>
        </div>

        <!-- Body -->
        <div class="nc-body">

            <!-- Error general -->
            <div class="nc-alert-error" id="nc-error-general" style="display:none;">
                <i class='bx bx-error-circle'></i>
                <span id="nc-error-general-msg">Ha ocurrido un error.</span>
            </div>

            <!-- Fila: Tipo y Número de Documento -->
            <div style="display:grid; grid-template-columns:1fr 1.5fr; gap:12px;">
                <div class="nc-field">
                    <label class="nc-label" for="nc-tipo-doc">
                        Tipo Doc <span class="nc-required">*</span>
                    </label>
                    <select id="nc-tipo-doc" class="nc-input">
                        <option value="DNI">DNI</option>
                        <option value="RUC">RUC</option>
                        <option value="PASAPORTE">PASAPORTE</option>
                    </select>
                </div>
                <div class="nc-field">
                    <label class="nc-label" for="nc-num-doc">
                        N° Documento <span class="nc-required">*</span>
                    </label>
                    <input type="text" id="nc-num-doc" class="nc-input" maxlength="20" placeholder="Ej: 71234567">
                    <span class="nc-field-error" id="nc-err-num-doc"></span>
                </div>
            </div>

            <!-- Campo: Nombre Completo -->
            <div class="nc-field">
                <label class="nc-label" for="nc-nombre">
                    <i class='bx bx-user'></i> Nombre Completo <span class="nc-required">*</span>
                </label>
                <input type="text" id="nc-nombre" class="nc-input" maxlength="150" placeholder="Ej: Juan Pérez García">
                <span class="nc-field-error" id="nc-err-nombre"></span>
            </div>

            <!-- Campo: Email -->
            <div class="nc-field">
                <label class="nc-label" for="nc-email">
                    <i class='bx bx-envelope'></i> Email (Opcional)
                </label>
                <input type="email" id="nc-email" class="nc-input" maxlength="100" placeholder="ejemplo@correo.com">
                <span class="nc-field-error" id="nc-err-email"></span>
            </div>

            <!-- Campo: Teléfono -->
            <div class="nc-field">
                <label class="nc-label" for="nc-telefono">
                    <i class='bx bx-phone'></i> Teléfono (Opcional)
                </label>
                <input type="tel" id="nc-telefono" class="nc-input" maxlength="20" placeholder="Ej: 987654321">
                <span class="nc-field-error" id="nc-err-telefono"></span>
            </div>

        </div>

        <!-- Footer -->
        <div class="nc-footer">
            <button class="nc-btn-cancel" id="btn-nc-cancel">Cancelar</button>
            <button class="nc-btn-submit" id="btn-nc-submit">
                <span id="nc-submit-text"><i class='bx bx-save'></i> Guardar Cliente</span>
                <span id="nc-submit-loader" style="display:none;"><div class="nc-spinner"></div> Guardando...</span>
            </button>
        </div>

    </div>
</div>

<!-- Toast de éxito (específico para clientes) -->
<div class="nc-toast" id="nc-toast" style="display:none;">
    <i class='bx bx-check-circle'></i>
    <span id="nc-toast-msg">¡Cliente creado con éxito!</span>
</div>
`;
