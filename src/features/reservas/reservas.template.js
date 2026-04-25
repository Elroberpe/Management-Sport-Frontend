export const reservasTemplate = () => `
<div class="calendario-module">

    <!-- Header -->
    <div class="page-header calendar-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px;">
        <div class="ch-left">
            <h1 class="page-title">Horario de Reservas</h1>
            <p class="page-subtitle" id="cal-semana-label">Cargando...</p>
        </div>
        <div class="ch-center">
            <div class="date-navigator" style="display:flex; align-items:center; background:#f1f5f9; border-radius:30px; padding:6px; gap:8px; box-shadow:inset 0 2px 4px rgba(0,0,0,0.02);">
                <button class="nav-btn" id="cal-prev" style="width:32px; height:32px; border-radius:50%; border:none; background:#fff; cursor:pointer; box-shadow:0 1px 3px rgba(0,0,0,0.1);"><i class='bx bx-chevron-left'></i></button>
                <button class="nav-btn" id="cal-hoy" style="width:auto; height:32px; padding:0 20px; border-radius:16px; border:none; background:#fff; font-size:12px; font-weight:700; cursor:pointer; box-shadow:0 1px 3px rgba(0,0,0,0.1); color:#334155;">HOY</button>
                <button class="nav-btn" id="cal-next" style="width:32px; height:32px; border-radius:50%; border:none; background:#fff; cursor:pointer; box-shadow:0 1px 3px rgba(0,0,0,0.1);"><i class='bx bx-chevron-right'></i></button>
            </div>
        </div>
        <div class="ch-right" style="display:flex; align-items:center; gap:12px;">
            <div class="select-wrap">
                <select id="cal-cancha-sel" style="height:42px; padding:0 36px 0 16px; border-radius:10px; border:1px solid #e2e8f0; background-color:#fff; font-size:13px; font-weight:600; color:#334155; cursor:pointer; outline:none; appearance:none; background-image:url(&quot;data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E&quot;); background-repeat:no-repeat; background-position:right 12px center;">
                    <option value="">Cargando canchas...</option>
                </select>
            </div>
            <div class="select-wrap">
                <select id="cal-filter-estado" style="height:42px; padding:0 36px 0 16px; border-radius:10px; border:1px solid #e2e8f0; background-color:#fff; font-size:13px; font-weight:600; color:#334155; cursor:pointer; outline:none; appearance:none; background-image:url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\"); background-repeat:no-repeat; background-position:right 12px center;">
                    <option value="">Todos los estados</option>
                    <option value="PENDIENTE">Pendiente</option>
                    <option value="PAGADA">Pagada</option>
                    <option value="COMPLETADO">Completada</option>
                </select>
            </div>
            <div id="reservas-action-container"></div>
        </div>
    </div>

    <!-- Legend -->
    <div class="calendar-legend">
        <div class="legend-item badge-blue"><span class="dot dot-blue"></span> Pagada</div>
        <div class="legend-item badge-yellow"><span class="dot dot-yellow"></span> Pendiente</div>
        <div class="legend-item badge-green"><span class="dot dot-green"></span> Completada</div>
        <div class="legend-item badge-red"><span class="dot dot-red"></span> Cancelada</div>
        <div class="legend-item badge-purple"><span class="dot dot-purple"></span> Reembolsado</div>
        <div class="legend-item badge-orange"><span class="dot dot-orange"></span> 🔧 Mantenimiento</div>
    </div>

    <!-- Loading / Error -->
    <div id="cal-loading" style="display:flex;align-items:center;justify-content:center;gap:12px;padding:60px;color:#94a3b8;font-size:14px;">
        <div class="spinner-circle"></div> Cargando reservas...
    </div>
    <div id="cal-error" style="display:none;flex-direction:column;align-items:center;padding:60px;gap:12px;color:#ef4444;font-size:14px;">
        <i class='bx bx-error-circle' style="font-size:38px;"></i>
        <span id="cal-error-msg">No se pudo conectar.</span>
        <button class="btn btn-primary" id="cal-retry" style="padding:10px 24px;margin-top:4px;"><i class='bx bx-refresh'></i> Reintentar</button>
    </div>

    <!-- Calendar Grid Panel -->
    <div class="calendar-panel" id="cal-panel" style="display:none;">

        <!-- Day Headers -->
        <div class="cg-headers-row">
            <div class="cg-corner"></div>
            <div class="cg-day-header" id="cal-h-0"><span></span><strong></strong></div>
            <div class="cg-day-header" id="cal-h-1"><span></span><strong></strong></div>
            <div class="cg-day-header" id="cal-h-2"><span></span><strong></strong></div>
            <div class="cg-day-header" id="cal-h-3"><span></span><strong></strong></div>
            <div class="cg-day-header" id="cal-h-4"><span></span><strong></strong></div>
            <div class="cg-day-header" id="cal-h-5"><span></span><strong></strong></div>
            <div class="cg-day-header" id="cal-h-6"><span></span><strong></strong></div>
        </div>

        <div class="cg-body-wrapper">
            <!-- Time Axis (08:00 - 22:00 = 14 horas) -->
            <div class="cg-time-axis" id="cal-time-axis"></div>

            <div class="cg-grid-system" id="cal-grid">
                <!-- Líneas horizontales -->
                <div class="cg-lines-bg" id="cal-lines"></div>

                <!-- Columnas días -->
                <div class="cg-col" id="cal-col-0" data-day="0"></div>
                <div class="cg-col" id="cal-col-1" data-day="1"></div>
                <div class="cg-col" id="cal-col-2" data-day="2"></div>
                <div class="cg-col" id="cal-col-3" data-day="3"></div>
                <div class="cg-col" id="cal-col-4" data-day="4"></div>
                <div class="cg-col" id="cal-col-5" data-day="5"></div>
                <div class="cg-col" id="cal-col-6" data-day="6"></div>

                <!-- Divisores verticales -->
                <div class="cg-col-divider" style="left:14.28%"></div>
                <div class="cg-col-divider" style="left:28.56%"></div>
                <div class="cg-col-divider" style="left:42.84%"></div>
                <div class="cg-col-divider" style="left:57.12%"></div>
                <div class="cg-col-divider" style="left:71.40%"></div>
                <div class="cg-col-divider" style="left:85.68%"></div>
            </div>
        </div>
    </div>

    <!-- Bottom Stats Cards -->
    <div class="calendar-bottom-row" id="cal-bottom" style="display:none;">
        <div class="cal-bottom-card">
            <span class="cbc-label">RESERVAS ESTA SEMANA</span>
            <div class="cbc-big-stat">
                <h2 id="cal-stat-total">0</h2>
                <span class="cbc-trend text-green" id="cal-stat-sub">esta semana</span>
            </div>
            <div class="cbc-progress-bg">
                <div class="cbc-progress-fill" id="cal-stat-bar" style="width:0%;"></div>
            </div>
        </div>
        <div class="cal-bottom-card">
            <span class="cbc-label">RESUMEN DE ESTADOS</span>
            <div class="cbc-list" id="cal-estado-list"></div>
        </div>
        <div class="cal-bottom-card box-bg-blue">
            <span class="cbc-label">ACCIONES RÁPIDAS</span>
            <div class="cbc-actions-grid">
                <button class="btn-pill-white" id="cal-btn-export">Exportar CSV</button>
                <button class="btn-pill-white" id="cal-btn-hoy-2">Ir a Hoy</button>
            </div>
        </div>
    </div>

    <!-- ===================================== -->
    <!--  HISTORICAL RESERVATIONS TABLE PANEL  -->
    <!-- ===================================== -->
    <div class="panel table-container-full rh-panel" id="reservas-hist-panel">
        
        <!-- Filters Area -->
        <div class="rh-filters">
            <!-- Fechas -->
            <div class="rh-filter-group">
                <label>Desde</label>
                <input type="date" class="rh-input" id="rh-desde">
            </div>
            <div class="rh-filter-group">
                <label>Hasta</label>
                <input type="date" class="rh-input" id="rh-hasta">
            </div>

            <!-- Estado Multi-select -->
            <div class="rh-filter-group">
                <label>Estado</label>
                <div class="ms-wrap" id="rh-estado-wrap">
                    <div class="ms-trigger" id="rh-estado-trigger">Todos los estados</div>
                    <div class="ms-dropdown" id="rh-estado-dropdown">
                        <label class="ms-option"><input type="checkbox" value="PENDIENTE"><span>Pendiente</span></label>
                        <label class="ms-option"><input type="checkbox" value="PAGADA"><span>Pagada</span></label>
                        <label class="ms-option"><input type="checkbox" value="COMPLETADO"><span>Completada</span></label>
                        <label class="ms-option"><input type="checkbox" value="CANCELADO"><span>Cancelada</span></label>
                        <label class="ms-option"><input type="checkbox" value="REEMBOLSADO"><span>Reembolsada</span></label>
                    </div>
                </div>
            </div>

            <!-- Client Autocomplete -->
            <div class="rh-filter-group">
                <label>Cliente</label>
                <div class="autocomplete-wrap">
                    <input type="text" class="rh-input" id="rh-cliente" placeholder="Buscar por nombre..." autocomplete="off">
                    <input type="hidden" id="rh-cliente-id">
                    <ul class="autocomplete-list" id="rh-cliente-list"></ul>
                </div>
            </div>

            <!-- Cancha Select (Generic) -->
            <div class="rh-filter-group">
                <label>Cancha</label>
                <select class="rh-input" id="rh-cancha" style="width: 180px; appearance:none; padding-right:24px; background-image:url('data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%2212%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%2364748b%22 stroke-width=%222%22%3E%3Cpolyline points=%226 9 12 15 18 9%22%3E%3C/polyline%3E%3C/svg%3E'); background-repeat:no-repeat; background-position:right 12px center;">
                    <option value="">Todas las canchas</option>
                    <!-- Filled by JS -->
                </select>
            </div>

            <!-- Botones -->
            <div class="rh-filter-group" style="flex-direction:row; align-items:flex-end; gap:8px; margin-left:auto;">
                <button class="btn btn-primary" id="rh-btn-buscar" style="height:40px; padding:0 24px;"><i class='bx bx-search'></i> Buscar</button>
                <button class="btn" id="rh-btn-limpiar" style="height:40px; padding:0 16px; background:#f1f5f9; color:#475569; border:none;"><i class='bx bx-reset'></i> Limpiar</button>
            </div>
        </div>

        <!-- New Unified Table Component Container -->
        <div id="reservas-hist-table-container"></div>
    </div>
</div>
`;
