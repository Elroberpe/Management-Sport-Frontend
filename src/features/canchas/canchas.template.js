export const canchasTemplate = () => `
<div class="canchas-module">

    <!-- Header -->
    <div class="page-header" style="align-items: center; margin-bottom: 30px;">
        <div>
            <h1 class="page-title">Gestión de Canchas</h1>
            <p class="page-subtitle" id="canchas-subtitle">Configura, monitorea y gestiona tus canchas.</p>
        </div>
        <button class="btn btn-primary new-booking-btn" id="btn-nueva-cancha" style="padding: 12px 24px;">
            <i class='bx bx-plus-circle' style="font-size: 20px;"></i> Añadir Nueva Cancha
        </button>
    </div>

    <!-- Stats -->
    <div class="stats-cards-row">
        <div class="stat-card minimal stat-canchas">
            <div class="icon-top"><i class='bx bx-football text-green'></i></div>
            <p class="stat-label">TOTAL CANCHAS</p>
            <h2 class="stat-value" id="stat-total">—</h2>
        </div>
        <div class="stat-card minimal stat-canchas active-stat border-bottom-green">
            <div class="icon-top"><i class='bx bx-check-circle text-green'></i></div>
            <p class="stat-label">DISPONIBLES</p>
            <h2 class="stat-value text-green" id="stat-disponibles">—</h2>
        </div>
        <div class="stat-card minimal stat-canchas">
            <div class="icon-top"><i class='bx bx-wrench' style="color:#BA8510;"></i></div>
            <p class="stat-label">MANTENIMIENTO</p>
            <h2 class="stat-value" id="stat-mantenimiento">—</h2>
        </div>
        <div class="stat-card minimal stat-canchas stat-dark-green">
            <div class="icon-top" style="color:#fff;"><i class='bx bx-block'></i></div>
            <p class="stat-label" style="color:rgba(255,255,255,0.8);">INACTIVAS</p>
            <h2 class="stat-value" style="color:#fff;" id="stat-inactivas">—</h2>
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

        <!-- Estado: cargando -->
        <div id="canchas-loading" style="display:flex; align-items:center; justify-content:center; gap:12px; padding:50px; color:#94a3b8; font-size:14px;">
            <div class="spinner-circle"></div> Cargando canchas...
        </div>

        <!-- Estado: error -->
        <div id="canchas-error" style="display:none; flex-direction:column; align-items:center; padding:50px; gap:12px; color:#ef4444; font-size:14px;">
            <i class='bx bx-error-circle' style="font-size:36px;"></i>
            <span id="canchas-error-msg">No se pudo conectar con el servidor.</span>
            <button class="btn btn-primary" id="btn-canchas-retry" style="padding:10px 24px; margin-top:4px;">
                <i class='bx bx-refresh'></i> Reintentar
            </button>
        </div>

        <!-- Vista Tabla -->
        <table class="canchas-table" id="canchas-table" style="display:none;">
            <thead>
                <tr>
                    <th>NOMBRE DE CANCHA</th>
                    <th>PRECIO / HORA</th>
                    <th>ESTADO</th>
                    <th>DISPONIBILIDAD</th>
                    <th style="text-align:right;">ACCIONES</th>
                </tr>
            </thead>
            <tbody id="canchas-tbody">
            </tbody>
        </table>

        <!-- Vista Grilla -->
        <div id="canchas-grilla" style="display:none; padding:24px;">
            <div id="canchas-grilla-inner" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(240px,1fr)); gap:16px;">
            </div>
        </div>

        <!-- Sin resultados -->
        <div id="canchas-empty" style="display:none; text-align:center; padding:50px; color:#94a3b8; font-size:14px;">
            <i class='bx bx-search-alt' style="font-size:36px; display:block; margin-bottom:10px;"></i>
            No se encontraron canchas con ese filtro.
        </div>

        <!-- Footer -->
        <div class="pagination-footer" id="canchas-footer" style="display:none;">
            <span id="canchas-count-label">Mostrando <strong>0</strong> canchas</span>
        </div>
    </div>

    <!-- Quick Schedule (estático por ahora) -->
    <div class="quick-schedule">
        <h3 class="qs-title"><i class='bx bx-calendar'></i> Vista Rápida de Horarios</h3>
        <div class="qs-days">
            <div class="day-col"><span class="d-name">LUN</span>
                <div class="day-circle border-green"><span>18 Cupos</span><div class="fill green" style="height:15%"></div></div>
            </div>
            <div class="day-col"><span class="d-name">MAR</span>
                <div class="day-circle bg-blue-tint"><span>12 Cupos</span><div class="fill light-blue" style="height:5%"></div></div>
            </div>
            <div class="day-col"><span class="d-name">MIE</span>
                <div class="day-circle border-green"><span>20 Cupos</span><div class="fill green" style="height:25%"></div></div>
            </div>
            <div class="day-col"><span class="d-name">JUE</span>
                <div class="day-circle border-green"><span>15 Cupos</span><div class="fill green" style="height:12%"></div></div>
            </div>
            <div class="day-col"><span class="d-name">VIE</span>
                <div class="day-circle border-brown bg-brown-tint"><span style="font-weight:700;">Festivo</span></div>
            </div>
            <div class="day-col"><span class="d-name">SAB</span>
                <div class="day-circle bg-dark-green"><span class="text-white" style="font-weight:700;">LLENO</span></div>
            </div>
            <div class="day-col"><span class="d-name">DOM</span>
                <div class="day-circle border-green"><span>24 Cupos</span><div class="fill green" style="height:30%"></div></div>
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
`;
