export const clientesTemplate = () => `
<div class="clientes-module">

    <!-- Header -->
    <div id="clientes-header-container"></div>

    <!-- Stats Section -->
    <div id="clientes-stats-container"></div>

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
