// src/features/sucursales/sucursales.template.js

export const sucursalesTemplate = () => `
<div id="sucursales-header-container"></div>

<!-- Stats Container -->
<div id="sucursales-stats-container" style="margin-bottom:30px;"></div>

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
`;

export const sucursalNewFormTemplate = () => `
    <div class="modal-shell-field">
        <label class="modal-shell-label" for="ns-nombre">
            <i class='bx bx-rename'></i> Nombre de la Sede <span style="color:#ef4444;">*</span>
        </label>
        <input type="text" id="ns-nombre" class="modal-shell-input" maxlength="100" placeholder="Ej: Sede San Borja">
        <span class="modal-shell-error-text" id="ns-nombre-err"></span>
    </div>

    <div class="modal-shell-field">
        <label class="modal-shell-label" for="ns-direccion">
            <i class='bx bx-map'></i> Dirección <span style="color:#ef4444;">*</span>
        </label>
        <input type="text" id="ns-direccion" class="modal-shell-input" maxlength="200" placeholder="Ej: Av. Aviación 245, San Borja">
        <span class="modal-shell-error-text" id="ns-direccion-err"></span>
    </div>

    <div class="modal-shell-field">
        <label class="modal-shell-label" for="ns-telefono">
            <i class='bx bx-phone'></i> Teléfono de Contacto (Opcional)
        </label>
        <input type="tel" id="ns-telefono" class="modal-shell-input" maxlength="20" placeholder="Ej: 015556789">
        <span class="modal-shell-error-text" id="ns-telefono-err"></span>
    </div>
`;

export const sucursalEditFormTemplate = () => `
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
        <div class="modal-shell-field">
            <label class="modal-shell-label"><i class='bx bx-buildings'></i> Empresa</label>
            <input type="text" id="es-empresa" class="modal-shell-input" disabled style="background:#f1f5f9; color:#64748b;">
        </div>
        <div class="modal-shell-field">
            <label class="modal-shell-label"><i class='bx bx-pulse'></i> Estado</label>
            <input type="text" id="es-estado" class="modal-shell-input" disabled style="background:#f1f5f9; color:#64748b;">
        </div>
    </div>

    <div class="modal-shell-field">
        <label class="modal-shell-label" for="es-nombre">
            <i class='bx bx-rename'></i> Nombre de la Sede <span style="color:#ef4444;">*</span>
        </label>
        <input type="text" id="es-nombre" class="modal-shell-input" maxlength="100" placeholder="Ej: Sede Miraflores">
        <span class="modal-shell-error-text" id="es-nombre-err"></span>
    </div>

    <div class="modal-shell-field">
        <label class="modal-shell-label" for="es-direccion">
            <i class='bx bx-map'></i> Dirección <span style="color:#ef4444;">*</span>
        </label>
        <input type="text" id="es-direccion" class="modal-shell-input" maxlength="200" placeholder="Ej: Av. Larco 123, Miraflores">
        <span class="modal-shell-error-text" id="es-direccion-err"></span>
    </div>

    <div class="modal-shell-field">
        <label class="modal-shell-label" for="es-telefono">
            <i class='bx bx-phone'></i> Teléfono de Contacto (Opcional)
        </label>
        <input type="tel" id="es-telefono" class="modal-shell-input" maxlength="20" placeholder="Ej: 014455667">
    </div>
`;
