export const canchasTemplate = () => `
<div class="canchas-module">

    <!-- Header -->
    <div class="page-header" style="align-items: center; margin-bottom: 30px;">
        <div>
            <h1 class="page-title">Gestión de Canchas</h1>
            <p class="page-subtitle" id="canchas-subtitle">Configura, monitorea y gestiona tus canchas.</p>
        </div>
        <button class="btn btn-primary new-booking-btn" id="btn-nueva-cancha" style="height:42px; padding:0 24px; display:flex; align-items:center; gap:6px; white-space:nowrap;">
            <i class='bx bx-plus'></i> Nueva Cancha
        </button>
    </div>

    <!-- Stats -->
    <div class="pay-stats-row" style="margin-bottom:30px;">
        <div class="pay-stat-card">
            <div class="pay-stat-header">
                <div class="pay-icon-circle bg-gray-tint text-gray-d"><i class='bx bx-football'></i></div>
            </div>
            <p class="pay-stat-label">TOTAL CANCHAS</p>
            <h2 class="pay-stat-value" id="stat-total">—</h2>
        </div>
        <div class="pay-stat-card">
            <div class="pay-stat-header">
                <div class="pay-icon-circle bg-green-tint text-green"><i class='bx bx-check-circle'></i></div>
            </div>
            <p class="pay-stat-label">DISPONIBLES</p>
            <h2 class="pay-stat-value" id="stat-disponibles">—</h2>
        </div>
        <div class="pay-stat-card">
            <div class="pay-stat-header">
                <div class="pay-icon-circle bg-yellow-tint text-yellow-d"><i class='bx bx-wrench'></i></div>
            </div>
            <p class="pay-stat-label">MANTENIMIENTO</p>
            <h2 class="pay-stat-value" id="stat-mantenimiento">—</h2>
        </div>
        <div class="pay-stat-card">
            <div class="pay-stat-header">
                <div class="pay-icon-circle bg-red-tint text-red"><i class='bx bx-block'></i></div>
            </div>
            <p class="pay-stat-label">INACTIVAS</p>
            <h2 class="pay-stat-value" id="stat-inactivas">—</h2>
        </div>
    </div>

    <!-- Table Section -->
    <div class="panel table-container-full" style="padding:0; overflow:hidden; margin-bottom:40px;">

        <!-- Toolbar -->
        <div class="table-toolbar">
            <div class="toolbar-left">
                <div class="search-wrap">
                    <i class='bx bx-search'></i>
                    <input type="text" id="canchas-search" placeholder="Buscar canchas...">
                </div>
                <div class="select-wrap">
                    <select id="canchas-filter-estado">
                        <option value="">Estado: Todos</option>
                        <option value="DISPONIBLE">Disponible</option>
                        <option value="MANTENIMIENTO">Mantenimiento</option>
                        <option value="INACTIVA">Inactiva</option>
                    </select>
                </div>
            </div>
            <div class="toolbar-right">
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

        <!-- Sin resultados se maneja dentro del componente o globalmente -->
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

<!-- ===== MODAL: NUEVA CANCHA ===== -->
<div id="modal-nueva-cancha" class="nc-overlay" style="display:none;" role="dialog" aria-modal="true" aria-labelledby="modal-nc-title">
    <div class="nc-modal">

        <!-- Header -->
        <div class="nc-header">
            <div class="nc-header-icon"><i class='bx bx-football'></i></div>
            <div>
                <h2 class="nc-title" id="modal-nc-title">Nueva Cancha</h2>
                <p class="nc-subtitle">Completa los datos para registrar la cancha</p>
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

            <!-- Campo: Sucursal -->
            <div class="nc-field" id="nc-field-sucursal">
                <label class="nc-label" for="nc-sucursal">
                    <i class='bx bx-map-pin'></i> Seleccionar Sucursal <span class="nc-required">*</span>
                </label>
                <div class="nc-select-wrap" id="nc-sucursal-wrap">
                    <select id="nc-sucursal" class="nc-input nc-select" required>
                        <option value="">Cargando sucursales...</option>
                    </select>
                    <i class='bx bx-chevron-down nc-select-arrow'></i>
                </div>
                <span class="nc-field-error" id="nc-err-sucursal"></span>
            </div>

            <!-- Campo: Nombre -->
            <div class="nc-field" id="nc-field-nombre">
                <label class="nc-label" for="nc-nombre">
                    <i class='bx bx-rename'></i> Nombre de la Cancha <span class="nc-required">*</span>
                </label>
                <input type="text" id="nc-nombre" class="nc-input" maxlength="50"
                    placeholder="Ej: Cancha 1 - Fútbol 5" autocomplete="off">
                <div class="nc-input-footer">
                    <span class="nc-field-error" id="nc-err-nombre"></span>
                    <span class="nc-char-count" id="nc-char-nombre">0/50</span>
                </div>
            </div>

            <!-- Campo: Precio -->
            <div class="nc-field" id="nc-field-precio">
                <label class="nc-label" for="nc-precio">
                    <i class='bx bx-money'></i> Precio por Hora <span class="nc-required">*</span>
                </label>
                <div class="nc-precio-wrap">
                    <span class="nc-currency">S/</span>
                    <input type="number" id="nc-precio" class="nc-input nc-input-precio"
                        min="0.01" step="0.01" placeholder="50.00">
                </div>
                <span class="nc-field-error" id="nc-err-precio"></span>
            </div>

        </div>

        <!-- Footer -->
        <div class="nc-footer">
            <button class="nc-btn-cancel" id="btn-nc-cancel">Cancelar</button>
            <button class="nc-btn-submit" id="btn-nc-submit">
                <span id="nc-submit-text"><i class='bx bx-plus'></i> Crear Cancha</span>
                <span id="nc-submit-loader" style="display:none;"><div class="nc-spinner"></div> Creando...</span>
            </button>
        </div>

    </div>
</div>

<!-- Toast de éxito -->
<div class="nc-toast" id="nc-toast" style="display:none;">
    <i class='bx bx-check-circle'></i>
    <span id="nc-toast-msg">¡Cancha creada con éxito!</span>
</div>

<!-- ===== MODAL: PROGRAMAR MANTENIMIENTO ===== -->
<div id="modal-mant" class="pm-overlay" style="display:none;" role="dialog" aria-modal="true" aria-labelledby="modal-mant-title">
    <div class="pm-modal">

        <!-- Header -->
        <div class="pm-header">
            <div class="pm-header-icon"><i class='bx bx-wrench'></i></div>
            <div>
                <h2 class="pm-title" id="modal-mant-title">Programar Mantenimiento</h2>
                <p class="pm-subtitle" id="pm-cancha-label">Cancha seleccionada</p>
            </div>
            <button class="pm-close" id="btn-pm-close" title="Cerrar"><i class='bx bx-x'></i></button>
        </div>

        <!-- Body -->
        <div class="pm-body">

            <!-- Error general -->
            <div class="pm-alert-error" id="pm-error-general" style="display:none;">
                <i class='bx bx-error-circle'></i>
                <span id="pm-error-general-msg">Ha ocurrido un error.</span>
            </div>

            <!-- Fila: Inicio / Fin -->
            <div class="pm-row-2">
                <div class="pm-field">
                    <label class="pm-label" for="pm-inicio">
                        <i class='bx bx-calendar-plus'></i> Inicio del Mantenimiento <span class="pm-required">*</span>
                    </label>
                    <input type="datetime-local" id="pm-inicio" class="pm-input">
                    <span class="pm-field-error" id="pm-err-inicio"></span>
                </div>
                <div class="pm-field">
                    <label class="pm-label" for="pm-fin">
                        <i class='bx bx-calendar-check'></i> Fin del Mantenimiento <span class="pm-required">*</span>
                    </label>
                    <input type="datetime-local" id="pm-fin" class="pm-input">
                    <span class="pm-field-error" id="pm-err-fin"></span>
                </div>
            </div>

            <!-- Tipo -->
            <div class="pm-field">
                <label class="pm-label" for="pm-tipo">
                    <i class='bx bx-category'></i> Tipo <span class="pm-required">*</span>
                </label>
                <div class="pm-select-wrap">
                    <select id="pm-tipo" class="pm-input pm-select">
                        <option value="">— Seleccionar tipo —</option>
                        <option value="PREVENTIVO">Preventivo</option>
                        <option value="CORRECTIVO">Correctivo</option>
                        <option value="URGENTE">Urgente</option>
                    </select>
                    <i class='bx bx-chevron-down pm-select-arrow'></i>
                </div>
                <span class="pm-field-error" id="pm-err-tipo"></span>
            </div>

            <!-- Motivo -->
            <div class="pm-field">
                <label class="pm-label" for="pm-motivo">
                    <i class='bx bx-note'></i> Motivo del Mantenimiento <span class="pm-required">*</span>
                </label>
                <textarea id="pm-motivo" class="pm-input pm-textarea" maxlength="200"
                    placeholder="Ej: Pintado de líneas, reparación de red, etc."></textarea>
                <div class="pm-input-footer">
                    <span class="pm-field-error" id="pm-err-motivo"></span>
                    <span class="pm-char-count" id="pm-char-motivo">0/200</span>
                </div>
            </div>

        </div>

        <!-- Footer -->
        <div class="pm-footer">
            <button class="pm-btn-cancel" id="btn-pm-cancel">Cancelar</button>
            <button class="pm-btn-submit" id="btn-pm-submit">
                <span id="pm-submit-text"><i class='bx bx-calendar-event'></i> Programar</span>
                <span id="pm-submit-loader" style="display:none;"><div class="pm-spinner"></div> Programando...</span>
            </button>
        </div>

    </div>
</div>

<!-- ===== MODAL: EDITAR CANCHA ===== -->
<div id="modal-edit-cancha" class="nc-overlay" style="display:none;" role="dialog" aria-modal="true" aria-labelledby="modal-ec-title">
    <div class="nc-modal">

        <!-- Header -->
        <div class="nc-header">
            <div class="nc-header-icon" style="background: #f1f5f9; color: #1e40af;"><i class='bx bx-pencil'></i></div>
            <div>
                <h2 class="nc-title" id="modal-ec-title">Editar Cancha</h2>
                <p class="nc-subtitle">Modifica los detalles de la cancha seleccionada</p>
            </div>
            <button class="nc-close" id="btn-ec-close" title="Cerrar"><i class='bx bx-x'></i></button>
        </div>

        <!-- Body -->
        <div class="nc-body">

            <!-- Error general -->
            <div class="nc-alert-error" id="ec-error-general" style="display:none;">
                <i class='bx bx-error-circle'></i>
                <span id="ec-error-general-msg">Ha ocurrido un error.</span>
            </div>

            <!-- Campo: Sucursal (Deshabilitado) -->
            <div class="nc-field">
                <label class="nc-label" for="ec-sucursal">
                    <i class='bx bx-map-pin'></i> Sucursal (No editable)
                </label>
                <input type="text" id="ec-sucursal" class="nc-input" disabled style="background:#f1f5f9; cursor:not-allowed; border-color:#e2e8f0; color:#64748b; font-weight:600;">
            </div>

            <!-- Campo: Nombre -->
            <div class="nc-field">
                <label class="nc-label" for="ec-nombre">
                    <i class='bx bx-rename'></i> Nombre de la Cancha <span class="nc-required">*</span>
                </label>
                <input type="text" id="ec-nombre" class="nc-input" maxlength="50" placeholder="Ej: Cancha 1 - Fútbol 6" autocomplete="off">
                <div class="nc-input-footer">
                    <span class="nc-field-error" id="ec-err-nombre"></span>
                    <span class="nc-char-count" id="ec-char-nombre">0/50</span>
                </div>
            </div>

            <!-- Campo: Precio -->
            <div class="nc-field">
                <label class="nc-label" for="ec-precio">
                    <i class='bx bx-money'></i> Precio por Hora <span class="nc-required">*</span>
                </label>
                <div class="nc-precio-wrap">
                    <span class="nc-currency">S/</span>
                    <input type="number" id="ec-precio" class="nc-input nc-input-precio" min="0.01" step="0.01" placeholder="85.00">
                </div>
                <span class="nc-field-error" id="ec-err-precio"></span>
            </div>

        </div>

        <!-- Footer -->
        <div class="nc-footer">
            <button class="nc-btn-cancel" id="btn-ec-cancel">Cancelar</button>
            <button class="nc-btn-submit" id="btn-ec-submit">
                <span id="ec-submit-text"><i class='bx bx-save'></i> Guardar Cambios</span>
                <span id="ec-submit-loader" style="display:none;"><div class="nc-spinner"></div> Guardando...</span>
            </button>
        </div>

    </div>
</div>
`;
