export const clientesTemplate = () => `
<div class="clientes-module">

    <!-- Header -->
    <div class="page-header" style="align-items:center; margin-bottom:30px;">
        <div>
            <h1 class="page-title">Base de Clientes</h1>
            <p class="page-subtitle">Gestiona tu comunidad de jugadores y clientes registrados.</p>
        </div>
        <div style="display:flex; gap:12px; align-items:center;">
            <button class="btn btn-export-csv" id="btn-export-csv">
                <i class='bx bx-download'></i> Exportar CSV
            </button>
            <button class="btn btn-primary new-booking-btn" id="btn-nuevo-cliente">
                <i class='bx bx-user-plus'></i> Añadir Cliente
            </button>
        </div>
    </div>

    <!-- Stats -->
    <div class="stats-cards-row" style="margin-bottom:30px;">
        <div class="stat-card minimal cli-stat-card bg-green-tint-light">
            <div class="cli-stat-top">
                <div class="icon-circle bg-green-tint text-green"><i class='bx bx-group'></i></div>
            </div>
            <h2 class="stat-value" id="cli-stat-total">—</h2>
            <p class="stat-label">TOTAL CLIENTES</p>
        </div>
        <div class="stat-card minimal cli-stat-card bg-blue-tint-light">
            <div class="cli-stat-top">
                <div class="icon-circle bg-yellow-tint text-yellow-d"><i class='bx bx-id-card'></i></div>
            </div>
            <h2 class="stat-value" id="cli-stat-dni">—</h2>
            <p class="stat-label">CON DNI</p>
        </div>
        <div class="stat-card minimal cli-stat-card bg-blue-tint-light">
            <div class="cli-stat-top">
                <div class="icon-circle bg-blue-tint text-blue"><i class='bx bx-envelope'></i></div>
            </div>
            <h2 class="stat-value" id="cli-stat-email">—</h2>
            <p class="stat-label">CON EMAIL</p>
        </div>
        <div class="stat-card minimal cli-stat-card bg-blue-tint-light">
            <div class="cli-stat-top">
                <div class="icon-circle bg-red-tint text-red"><i class='bx bx-phone'></i></div>
            </div>
            <h2 class="stat-value" id="cli-stat-tel">—</h2>
            <p class="stat-label">CON TELÉFONO</p>
        </div>
    </div>

    <!-- Table Container -->
    <div class="panel table-container-full" style="padding:0; margin-bottom:40px; position:relative; border-radius:20px;">

        <!-- Toolbar -->
        <div class="table-toolbar cli-toolbar" style="border-radius:20px 20px 0 0;">
            <div class="toolbar-left" style="gap:10px;">
                <!-- Búsqueda con debounce → llama API -->
                <div class="search-wrap" style="position:relative;">
                    <i class='bx bx-search'></i>
                    <input type="text" id="cli-search" placeholder="Buscar por nombre o documento..." style="width:260px;">
                </div>
                <!-- Filtro tipo documento (local) -->
                <div class="select-wrap">
                    <select id="cli-filter-tipo">
                        <option value="">Tipo Doc: Todos</option>
                        <option value="DNI">DNI</option>
                        <option value="RUC">RUC</option>
                        <option value="PASAPORTE">Pasaporte</option>
                    </select>
                </div>
            </div>
            <div class="toolbar-right">
                <span class="sort-label" id="cli-sort-label">
                    ORDENAR POR: <strong id="cli-sort-text">Nombre A→Z <i class='bx bx-chevron-down'></i></strong>
                </span>
            </div>
        </div>

        <!-- Loading -->
        <div id="cli-loading" style="display:flex; align-items:center; justify-content:center; gap:12px; padding:60px; color:#94a3b8; font-size:14px;">
            <div class="spinner-circle"></div> Cargando clientes...
        </div>

        <!-- Error -->
        <div id="cli-error" style="display:none; flex-direction:column; align-items:center; padding:60px; gap:12px; color:#ef4444; font-size:14px;">
            <i class='bx bx-error-circle' style="font-size:38px;"></i>
            <span id="cli-error-msg">No se pudo conectar con el servidor.</span>
            <button class="btn btn-primary" id="btn-cli-retry" style="padding:10px 24px; margin-top:4px;">
                <i class='bx bx-refresh'></i> Reintentar
            </button>
        </div>

        <!-- Empty -->
        <div id="cli-empty" style="display:none; text-align:center; padding:60px; color:#94a3b8; font-size:14px;">
            <i class='bx bx-user-x' style="font-size:38px; display:block; margin-bottom:10px;"></i>
            No se encontraron clientes con esa búsqueda.
        </div>

        <!-- Table -->
        <table class="canchas-table clientes-table" id="cli-table" style="display:none;">
            <thead>
                <tr>
                    <th>NOMBRE DEL CLIENTE</th>
                    <th>DOCUMENTO</th>
                    <th>CONTACTO</th>
                    <th style="text-align:right;">ACCIONES</th>
                </tr>
            </thead>
            <tbody id="cli-tbody"></tbody>
        </table>

        <!-- Pagination footer -->
        <div class="pagination-footer" id="cli-footer" style="display:none; padding:20px 28px;">
            <span id="cli-count-label" style="font-weight:700; color:#94a3b8; letter-spacing:1px; font-size:11px;">MOSTRANDO 0 CLIENTES</span>
            <div class="page-numbers" id="cli-pagination"></div>
        </div>
    </div>

</div>
`;
