export const inicioTemplate = () => `
<!-- Header con placeholders que el script actualiza -->
<div class="page-header">
    <div>
        <h1 class="page-title" id="inicio-greeting">Bienvenido</h1>
        <p class="page-subtitle" id="inicio-subtitle">Resumen de operaciones del día.</p>
    </div>
    <button class="btn btn-primary new-booking-btn">
        <i class='bx bx-plus'></i> Nueva Reserva
    </button>
</div>

<!-- Stats Cards -->
<div class="stats-grid">
    <div class="stat-card">
        <div class="stat-icon bg-light-green"><i class='bx bx-calendar-check text-green'></i></div>
        <span class="trend positive" id="kpi-trend-reservas" style="display:none;"></span>
        <p class="stat-label">RESERVAS DE HOY</p>
        <h2 class="stat-value" id="kpi-reservas-hoy"><div class="spinner-circle" style="width:20px;height:20px;border-width:3px;border-top-color:#10b981;"></div></h2>
    </div>
    <div class="stat-card">
        <div class="stat-icon bg-light-yellow"><i class='bx bx-dollar text-yellow'></i></div>
        <span class="trend positive" id="kpi-trend-ingresos" style="display:none;"></span>
        <p class="stat-label">INGRESOS TOTALES</p>
        <h2 class="stat-value" id="kpi-ingresos-anuales"><div class="spinner-circle" style="width:20px;height:20px;border-width:3px;border-top-color:#eab308;"></div></h2>
    </div>
    <div class="stat-card">
        <div class="stat-icon bg-light-blue"><i class='bx bx-bar-chart-alt-2 text-blue'></i></div>
        <span class="trend neutral" id="kpi-trend-ocupacion" style="display:none;"></span>
        <p class="stat-label">TASA DE OCUPACIÓN</p>
        <h2 class="stat-value" id="kpi-tasa-ocupacion"><div class="spinner-circle" style="width:20px;height:20px;border-width:3px;border-top-color:#3b82f6;"></div></h2>
    </div>
    <div class="stat-card" id="inicio-stat-sedes">
        <div class="stat-icon bg-light-green"><i class='bx bx-building-house text-green'></i></div>
        <span class="trend neutral-text">EN VIVO</span>
        <p class="stat-label">SEDES ACTIVAS</p>
        <h2 class="stat-value">12</h2>
    </div>
</div>

<!-- Content Grid -->
<div class="dashboard-content-grid">
    <!-- Left Col -->
    <div class="main-column">
        <div class="panel chart-panel">
            <div class="panel-header">
                <h3>Actividad de Reservas</h3>
                <div class="pill-toggles" id="chart-pill-toggles">
                    <span class="active" data-periodo="SEMANA">Últ. 7 Días</span>
                    <span data-periodo="MES">Últ. 30 Días</span>
                </div>
            </div>
            <div class="mock-chart" id="dashboard-chart-container">
                <div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#94a3b8;">
                    <div class="spinner-circle" style="width:24px;height:24px;margin-right:8px;border-width:3px;"></div> Cargando...
                </div>
            </div>
        </div>

        <div class="panel table-panel">
            <div class="panel-header">
                <h3>Reservas Recientes</h3>
            </div>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>CLIENTE</th>
                        <th>CANCHA / SEDE</th>
                        <th>HORA</th>
                        <th>ESTADO</th>
                        <th>MONTO</th>
                    </tr>
                </thead>
                <tbody id="inicio-reservas-recientes-tbody">
                    <tr><td colspan="5" style="text-align:center;padding:20px;color:#94a3b8;"><div class="spinner-circle" style="width:20px;height:20px;border-width:3px;vertical-align:middle;margin-right:8px;"></div> Cargando...</td></tr>
                </tbody>
            </table>
        </div>
    </div>

    <!-- Right Col -->
    <div class="side-column">

        <!-- ===== VISTA GLOBAL: Estado de todas las sedes ===== -->
        <div id="inicio-panel-sedes">
            <div class="panel">
                <div class="panel-header">
                    <h3>Estado de Sedes</h3>
                    <i class='bx bx-dots-vertical-rounded'></i>
                </div>
                <div class="branch-list">
                    <div class="branch-item">
                        <div class="b-icon"><i class='bx bx-map'></i></div>
                        <div class="b-info">
                            <h4>Sede Central <span class="dot green"></span></h4>
                            <p>8/10 Canchas Activas <span class="pct">80%</span></p>
                            <div class="progress-bg"><div class="progress-fill" style="width: 80%;"></div></div>
                        </div>
                    </div>
                    <div class="branch-item">
                        <div class="b-icon bg-dark"><i class='bx bx-moon'></i></div>
                        <div class="b-info">
                            <h4>Complejo Río <span class="dot green"></span></h4>
                            <p>12/12 Canchas Activas <span class="pct">100%</span></p>
                            <div class="progress-bg"><div class="progress-fill" style="width: 100%;"></div></div>
                        </div>
                    </div>
                    <div class="branch-item grayed">
                        <div class="b-icon bg-gray"><i class='bx bx-wrench'></i></div>
                        <div class="b-info">
                            <h4>Arena Sur <span class="dot yellow"></span></h4>
                            <p>En Mantenimiento <span class="pct">0%</span></p>
                        </div>
                    </div>
                </div>
                <button class="btn btn-outlined btn-full mt-4" id="inicio-btn-add-sede" style="margin-top: 24px;">
                    <i class='bx bx-plus'></i> Añadir Sede
                </button>
            </div>
        </div>

        <!-- ===== VISTA OPERATIVA: Canchas de la sede seleccionada ===== -->
        <div id="inicio-panel-sede-info" style="display:none;">
            <div class="panel">
                <div class="panel-header">
                    <h3>Canchas de la Sede</h3>
                    <i class='bx bx-dots-vertical-rounded'></i>
                </div>
                <div class="branch-list" id="inicio-canchas-sede-list">
                    <div class="sede-dropdown-loading">
                        <i class='bx bx-loader-alt bx-spin'></i> Cargando canchas...
                    </div>
                </div>
            </div>
        </div>

        <div class="alert-card yellow-alert">
            <h4><i class='bx bx-error'></i> ALERTA MANTENIMIENTO</h4>
            <p>La iluminación de Cancha 1 requiere inspección.</p>
        </div>
    </div>
</div>
`;
