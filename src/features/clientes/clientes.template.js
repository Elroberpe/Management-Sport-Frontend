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

        <!-- New Unified Table Component Container -->
        <div id="clientes-table-container"></div>
    </div>

</div>
`;
