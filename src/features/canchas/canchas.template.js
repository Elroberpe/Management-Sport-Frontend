// src/features/canchas/canchas.template.js

export const canchasTemplate = () => `
<div class="canchas-module">

    <!-- Header -->
    <div id="canchas-header-container"></div>

    <!-- Stats Section -->
    <div id="canchas-stats-container"></div>

    <!-- Table Section -->
    <div class="standard-panel">

        <!-- Toolbar -->
        <div class="filter-bar">
            <div class="filter-group">
                <div class="search-wrap">
                    <i class='bx bx-search'></i>
                    <input type="text" id="canchas-search" placeholder="Buscar canchas...">
                </div>
                <select id="canchas-filter-estado">
                    <option value="">Todos los estados</option>
                    <option value="DISPONIBLE">Disponible</option>
                    <option value="MANTENIMIENTO">Mantenimiento</option>
                    <option value="INACTIVA">Inactiva</option>
                </select>
            </div>
            <div class="filter-group">
                <div class="view-toggle">
                    <button class="active" id="btn-view-tabla">Tabla</button>
                    <button id="btn-view-grilla">Grilla</button>
                </div>
            </div>
        </div>

        <!-- View Table (Using Reusable Component) -->
        <div id="canchas-table-container"></div>

        <!-- Vista Grilla -->
        <div id="canchas-grilla" style="display:none; padding:24px;">
            <div id="canchas-grilla-inner" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(240px,1fr)); gap:16px;">
            </div>
        </div>
    </div>

    <!-- Quick Schedule -->
    <div class="quick-schedule">
        <div class="qs-header" style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
            <h3 class="qs-title" style="margin-bottom: 0;"><i class='bx bx-calendar'></i> Disponibilidad Semanal</h3>
            <div class="qs-nav" style="display: flex; align-items: center; gap: 12px;">
                <button class="btn btn-icon" id="btn-qs-prev" style="width: 32px; height: 32px; padding: 0; border-radius: 8px; background: #fff; border: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: center;"><i class='bx bx-chevron-left'></i></button>
                <span id="qs-week-label" style="font-weight: 600; color: #1e293b; font-size: 14px; min-width: 140px; text-align: center;">Cargando...</span>
                <button class="btn btn-icon" id="btn-qs-next" style="width: 32px; height: 32px; padding: 0; border-radius: 8px; background: #fff; border: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: center;"><i class='bx bx-chevron-right'></i></button>
            </div>
        </div>
        <div class="qs-days" id="qs-days-container">
            <div style="width: 100%; text-align: center; padding: 30px; color: #94a3b8; font-size: 14px;">
                <div class="spinner-circle" style="width: 24px; height: 24px; border-width: 3px; display: inline-block; vertical-align: middle; margin-right: 8px;"></div>
                Cargando disponibilidad...
            </div>
        </div>
    </div>
</div>
`;

export const canchasNewFormTemplate = () => `
    <!-- Campo: Sucursal -->
    <div class="modal-shell-field" id="nc-field-sucursal">
        <label class="modal-shell-label" for="nc-sucursal">
            <i class='bx bx-map-pin'></i> Seleccionar Sucursal <span style="color:#ef4444;">*</span>
        </label>
        <select id="nc-sucursal" class="modal-shell-input">
            <option value="">Cargando sucursales...</option>
        </select>
        <span class="modal-shell-error-text" id="nc-sucursal-err"></span>
    </div>

    <!-- Campo: Nombre -->
    <div class="modal-shell-field">
        <label class="modal-shell-label" for="nc-nombre">
            <i class='bx bx-rename'></i> Nombre de la Cancha <span style="color:#ef4444;">*</span>
        </label>
        <input type="text" id="nc-nombre" class="modal-shell-input" maxlength="50" placeholder="Ej: Cancha 1 - Fútbol 5">
        <span class="modal-shell-error-text" id="nc-nombre-err"></span>
    </div>

    <!-- Campo: Precio -->
    <div class="modal-shell-field">
        <label class="modal-shell-label" for="nc-precio">
            <i class='bx bx-money'></i> Precio por Hora <span style="color:#ef4444;">*</span>
        </label>
        <div style="position:relative;">
            <span style="position:absolute; left:12px; top:50%; transform:translateY(-50%); color:#64748b; font-weight:600;">S/</span>
            <input type="number" id="nc-precio" class="modal-shell-input" style="padding-left:35px;" min="0.01" step="0.01" placeholder="50.00">
        </div>
        <span class="modal-shell-error-text" id="nc-precio-err"></span>
    </div>
`;

export const canchasEditFormTemplate = () => `
    <!-- Campo: Sucursal (Solo lectura) -->
    <div class="modal-shell-field">
        <label class="modal-shell-label" for="ec-sucursal">
            <i class='bx bx-map-pin'></i> Sucursal (No editable)
        </label>
        <input type="text" id="ec-sucursal" class="modal-shell-input" disabled style="background:#f1f5f9; color:#64748b;">
    </div>

    <!-- Campo: Nombre -->
    <div class="modal-shell-field">
        <label class="modal-shell-label" for="ec-nombre">
            <i class='bx bx-rename'></i> Nombre de la Cancha <span style="color:#ef4444;">*</span>
        </label>
        <input type="text" id="ec-nombre" class="modal-shell-input" maxlength="50" placeholder="Ej: Cancha 1 - Fútbol 6">
        <span class="modal-shell-error-text" id="ec-nombre-err"></span>
    </div>

    <!-- Campo: Precio -->
    <div class="modal-shell-field">
        <label class="modal-shell-label" for="ec-precio">
            <i class='bx bx-money'></i> Precio por Hora <span style="color:#ef4444;">*</span>
        </label>
        <div style="position:relative;">
            <span style="position:absolute; left:12px; top:50%; transform:translateY(-50%); color:#64748b; font-weight:600;">S/</span>
            <input type="number" id="ec-precio" class="modal-shell-input" style="padding-left:35px;" min="0.01" step="0.01" placeholder="85.00">
        </div>
        <span class="modal-shell-error-text" id="ec-precio-err"></span>
    </div>
`;

export const canchasMantenimientoFormTemplate = () => `
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
        <div class="modal-shell-field">
            <label class="modal-shell-label" for="pm-inicio">
                <i class='bx bx-calendar-plus'></i> Inicio <span style="color:#ef4444;">*</span>
            </label>
            <input type="datetime-local" id="pm-inicio" class="modal-shell-input">
            <span class="modal-shell-error-text" id="pm-inicio-err"></span>
        </div>
        <div class="modal-shell-field">
            <label class="modal-shell-label" for="pm-fin">
                <i class='bx bx-calendar-check'></i> Fin <span style="color:#ef4444;">*</span>
            </label>
            <input type="datetime-local" id="pm-fin" class="modal-shell-input">
            <span class="modal-shell-error-text" id="pm-fin-err"></span>
        </div>
    </div>

    <div class="modal-shell-field">
        <label class="modal-shell-label" for="pm-tipo">
            <i class='bx bx-category'></i> Tipo <span style="color:#ef4444;">*</span>
        </label>
        <select id="pm-tipo" class="modal-shell-input">
            <option value="">— Seleccionar tipo —</option>
            <option value="PREVENTIVO">Preventivo</option>
            <option value="CORRECTIVO">Correctivo</option>
            <option value="URGENTE">Urgente</option>
        </select>
        <span class="modal-shell-error-text" id="pm-tipo-err"></span>
    </div>

    <div class="modal-shell-field">
        <label class="modal-shell-label" for="pm-motivo">
            <i class='bx bx-note'></i> Motivo <span style="color:#ef4444;">*</span>
        </label>
        <textarea id="pm-motivo" class="modal-shell-input" style="height:100px; resize:none;" maxlength="200" placeholder="Ej: Pintado de líneas..."></textarea>
        <span class="modal-shell-error-text" id="pm-motivo-err"></span>
    </div>
`;
