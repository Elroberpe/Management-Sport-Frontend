// src/features/eventos/eventos.template.js
// Shell HTML del módulo de Gestión de Eventos

export const eventosTemplate = () => `
<div class="clientes-module">

    <!-- Header -->
    <div id="eventos-header-container"></div>

    <!-- Stats -->
    <div id="eventos-stats-container"></div>

    <!-- Filtro de Sede (solo visible para SUPERADMIN, controlado por JS) -->
    <div id="eventos-sede-filter" style="display:none; margin-bottom:16px;">
        <div class="filter-bar" style="padding:12px 16px;">
            <div class="filter-group">
                <label style="font-size:12px; font-weight:700; color:var(--text-muted); text-transform:uppercase;">
                    <i class='bx bx-map-pin' style="color:var(--primary);"></i> Filtrar por Sede
                </label>
                <select id="evt-filter-sucursal" style="padding:6px 12px; border-radius:8px; border:1px solid var(--border-color); background:var(--card-bg); color:var(--text-primary); font-size:13px; cursor:pointer;">
                    <option value="">Todas las Sedes</option>
                </select>
            </div>
        </div>
    </div>

    <!-- Panel principal con filtros y tabla -->
    <div class="standard-panel">
        <div class="filter-bar">
            <div class="filter-group">
                <div class="search-wrap">
                    <i class='bx bx-search'></i>
                    <input type="text" id="evt-search" placeholder="Buscar por nombre o cliente...">
                </div>
                <select id="evt-filter-estado">
                    <option value="">Todos los estados</option>
                    <option value="PROGRAMADO">Programado</option>
                    <option value="EN_CURSO">En Curso</option>
                    <option value="FINALIZADO">Finalizado</option>
                    <option value="CANCELADO">Cancelado</option>
                </select>
                <select id="evt-filter-tipo">
                    <option value="">Todos los tipos</option>
                    <option value="TORNEO">🏆 Torneo</option>
                    <option value="CORPORATIVO">🏢 Corporativo</option>
                    <option value="RELAMPAGO">⚡ Relámpago</option>
                </select>
            </div>
        </div>

        <!-- Tabla paginada -->
        <div id="eventos-table-container"></div>
    </div>

</div>
`;
