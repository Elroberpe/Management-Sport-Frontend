export const sucursalesTemplate = () => `
<div class="page-header">
    <div>
        <h1 class="page-title">Sedes</h1>
        <p class="page-subtitle">Gestiona y monitorea tus instalaciones deportivas en múltiples zonas.</p>
    </div>
    <button class="btn btn-primary new-booking-btn" id="btn-nueva-sede">
        <i class='bx bx-plus'></i> Añadir Nueva Sede
    </button>
</div>

<!-- Stats -->
<div class="pay-stats-row" style="margin-bottom:30px;">
    <div class="pay-stat-card">
        <div class="pay-stat-header">
            <div class="pay-icon-circle bg-gray-tint text-gray-d"><i class='bx bx-building-house'></i></div>
        </div>
        <p class="pay-stat-label">TOTAL SEDES</p>
        <h2 class="pay-stat-value" id="stat-total">—</h2>
    </div>
    <div class="pay-stat-card">
        <div class="pay-stat-header">
            <div class="pay-icon-circle bg-green-tint text-green"><i class='bx bx-check-circle'></i></div>
        </div>
        <p class="pay-stat-label">ACTIVAS</p>
        <h2 class="pay-stat-value" id="stat-activas">—</h2>
    </div>
    <div class="pay-stat-card">
        <div class="pay-stat-header">
            <div class="pay-icon-circle bg-red-tint text-red"><i class='bx bx-block'></i></div>
        </div>
        <p class="pay-stat-label">INACTIVAS</p>
        <h2 class="pay-stat-value" id="stat-inactivas">—</h2>
    </div>
</div>

<!-- Estado: cargando / error -->
<div id="sedes-loading" class="sedes-feedback-state">
    <div class="spinner-circle"></div>
    <p>Cargando sucursales...</p>
</div>

<div id="sedes-error" class="sedes-feedback-state" style="display:none;">
    <i class='bx bx-error-circle' style="font-size:40px; color:#ef4444;"></i>
    <p id="sedes-error-msg">No se pudo conectar con el servidor.</p>
    <button class="btn btn-primary" id="btn-retry" style="margin-top:12px; padding:10px 24px;">
        <i class='bx bx-refresh'></i> Reintentar
    </button>
</div>

<!-- Sedes Grid -->
<div class="branch-cards-grid" id="sedes-grid" style="display:none;">
    <!-- Tarjeta: Añadir Nueva Sede -->
    <div class="branch-card-add" id="card-add-sede">
        <div class="add-content">
            <div class="add-icon-circle"><i class='bx bx-map-pin'></i></div>
            <h3>Añadir Nueva Sede</h3>
            <p>Expande tu red de canchas</p>
        </div>
    </div>
</div>

<!-- ===== MODAL: NUEVA SEDE ===== -->
<div id="modal-nueva-sede" class="nc-overlay" style="display:none;" role="dialog" aria-modal="true" aria-labelledby="modal-ns-title">
    <div class="nc-modal">

        <!-- Header -->
        <div class="nc-header">
            <div class="nc-header-icon" style="background:#f1f5f9; color:var(--primary);"><i class='bx bx-map-pin'></i></div>
            <div>
                <h2 class="nc-title" id="modal-ns-title">Nueva Sede</h2>
                <p class="nc-subtitle">Registra una nueva sucursal para tu empresa</p>
            </div>
            <button class="nc-close" id="btn-ns-close" title="Cerrar"><i class='bx bx-x'></i></button>
        </div>

        <!-- Body -->
        <div class="nc-body">

            <!-- Error general -->
            <div class="nc-alert-error" id="ns-error-general" style="display:none;">
                <i class='bx bx-error-circle'></i>
                <span id="ns-error-general-msg">Ha ocurrido un error.</span>
            </div>

            <!-- Campo: Nombre -->
            <div class="nc-field">
                <label class="nc-label" for="ns-nombre">
                    <i class='bx bx-rename'></i> Nombre de la Sede <span class="nc-required">*</span>
                </label>
                <input type="text" id="ns-nombre" class="nc-input" maxlength="100"
                    placeholder="Ej: Sede San Borja" autocomplete="on">
                <span class="nc-field-error" id="ns-err-nombre"></span>
            </div>

            <!-- Campo: Dirección -->
            <div class="nc-field">
                <label class="nc-label" for="ns-direccion">
                    <i class='bx bx-map'></i> Dirección <span class="nc-required">*</span>
                </label>
                <input type="text" id="ns-direccion" class="nc-input" maxlength="200"
                    placeholder="Ej: Av. Aviación 245, San Borja" autocomplete="on">
                <span class="nc-field-error" id="ns-err-direccion"></span>
            </div>

            <!-- Campo: Teléfono -->
            <div class="nc-field">
                <label class="nc-label" for="ns-telefono">
                    <i class='bx bx-phone'></i> Teléfono de Contacto (Opcional)
                </label>
                <input type="tel" id="ns-telefono" class="nc-input" maxlength="20"
                    placeholder="Ej: 015556789">
                <span class="nc-field-error" id="ns-err-telefono"></span>
            </div>

        </div>

        <!-- Footer -->
        <div class="nc-footer">
            <button class="nc-btn-cancel" id="btn-ns-cancel">Cancelar</button>
            <button class="nc-btn-submit" id="btn-ns-submit">
                <span id="ns-submit-text"><i class='bx bx-plus'></i> Crear Sede</span>
                <span id="ns-submit-loader" style="display:none;"><div class="nc-spinner"></div> Creando...</span>
            </button>
        </div>

    </div>
</div>

<!-- Toast de éxito (compartido) -->
<div class="nc-toast" id="ns-toast" style="display:none;">
    <i class='bx bx-check-circle'></i>
    <span id="ns-toast-msg">¡Sede creada con éxito!</span>
</div>

<!-- ===== MODAL: EDITAR SEDE ===== -->
<div id="modal-edit-sede" class="nc-overlay" style="display:none;" role="dialog" aria-modal="true" aria-labelledby="modal-es-title">
    <div class="nc-modal">

        <!-- Header -->
        <div class="nc-header">
            <div class="nc-header-icon" style="background:#f1f5f9; color:var(--primary);"><i class='bx bx-edit-alt'></i></div>
            <div>
                <h2 class="nc-title" id="modal-es-title">Editar Sede</h2>
                <p class="nc-subtitle">Modifica los datos de la sucursal seleccionada</p>
            </div>
            <button class="nc-close" id="btn-es-close" title="Cerrar"><i class='bx bx-x'></i></button>
        </div>

        <!-- Body -->
        <div class="nc-body">

            <!-- Error general -->
            <div class="nc-alert-error" id="es-error-general" style="display:none;">
                <i class='bx bx-error-circle'></i>
                <span id="es-error-general-msg">Ha ocurrido un error.</span>
            </div>

            <!-- Fila: Empresa (No editable) + Estado (No editable) -->
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
                <div class="nc-field">
                    <label class="nc-label"><i class='bx bx-buildings'></i> Empresa</label>
                    <input type="text" id="es-empresa" class="nc-input" disabled
                        style="background:#f1f5f9; cursor:not-allowed; color:#64748b; font-weight:600;">
                </div>
                <div class="nc-field">
                    <label class="nc-label"><i class='bx bx-pulse'></i> Estado</label>
                    <input type="text" id="es-estado" class="nc-input" disabled
                        style="background:#f1f5f9; cursor:not-allowed; color:#64748b; font-weight:600;">
                </div>
            </div>

            <!-- Campo: Nombre -->
            <div class="nc-field">
                <label class="nc-label" for="es-nombre">
                    <i class='bx bx-rename'></i> Nombre de la Sede <span class="nc-required">*</span>
                </label>
                <input type="text" id="es-nombre" class="nc-input" maxlength="100"
                    placeholder="Ej: Sede Miraflores" autocomplete="on">
                <span class="nc-field-error" id="es-err-nombre"></span>
            </div>

            <!-- Campo: Dirección -->
            <div class="nc-field">
                <label class="nc-label" for="es-direccion">
                    <i class='bx bx-map'></i> Dirección <span class="nc-required">*</span>
                </label>
                <input type="text" id="es-direccion" class="nc-input" maxlength="200"
                    placeholder="Ej: Av. Larco 123, Miraflores" autocomplete="on">
                <span class="nc-field-error" id="es-err-direccion"></span>
            </div>

            <!-- Campo: Teléfono -->
            <div class="nc-field">
                <label class="nc-label" for="es-telefono">
                    <i class='bx bx-phone'></i> Teléfono de Contacto (Opcional)
                </label>
                <input type="tel" id="es-telefono" class="nc-input" maxlength="20"
                    placeholder="Ej: 014455667">
            </div>

        </div>

        <!-- Footer -->
        <div class="nc-footer">
            <button class="nc-btn-cancel" id="btn-es-cancel">Cancelar</button>
            <button class="nc-btn-submit" id="btn-es-submit">
                <span id="es-submit-text"><i class='bx bx-save'></i> Guardar Cambios</span>
                <span id="es-submit-loader" style="display:none;"><div class="nc-spinner"></div> Guardando...</span>
            </button>
        </div>

    </div>
</div>
`;
