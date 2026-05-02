// src/features/usuarios/usuarios.template.js
// Shell HTML del módulo de gestión de usuarios

export const usuariosTemplate = () => `
<div class="clientes-module">

    <!-- Header -->
    <div id="usuarios-header-container"></div>

    <!-- Stats Section -->
    <div id="usuarios-stats-container"></div>

    <!-- Table Section -->
    <div class="standard-panel">
        <div class="filter-bar">
            <div class="filter-group">
                <div class="search-wrap">
                    <i class='bx bx-search'></i>
                    <input type="text" id="usr-search" placeholder="Buscar por nombre o username...">
                </div>
                <select id="usr-filter-rol">
                    <option value="">Todos los roles</option>
                    <option value="SUPERADMIN">Super Admin</option>
                    <option value="ADMIN">Admin de Sede</option>
                    <option value="RECEPCIONISTA">Recepcionista</option>
                </select>
            </div>
            <div class="filter-group">
                <span class="sort-label">
                    ORDENAR POR: <strong>Nombre A→Z <i class='bx bx-chevron-down'></i></strong>
                </span>
            </div>
        </div>

        <!-- Tabla de usuarios (initTable inyecta aquí) -->
        <div id="usuarios-table-container"></div>
    </div>

</div>
`;
