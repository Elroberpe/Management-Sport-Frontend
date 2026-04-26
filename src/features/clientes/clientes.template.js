export const clientesTemplate = () => `
<div class="clientes-module">

    <!-- Header -->
    <div id="clientes-header-container"></div>

    <!-- Stats Section -->
    <div id="clientes-stats-container"></div>

    <!-- Table Section -->
    <div class="standard-panel">
        <div class="filter-bar">
            <div class="filter-group">
                <div class="search-wrap">
                    <i class='bx bx-search'></i>
                    <input type="text" id="cli-search" placeholder="Buscar por nombre o documento...">
                </div>
                <select id="cli-filter-tipo">
                    <option value="">Todos los tipos</option>
                    <option value="DNI">DNI</option>
                    <option value="RUC">RUC</option>
                    <option value="PASAPORTE">Pasaporte</option>
                </select>
            </div>
            <div class="filter-group">
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
