export const pagosTemplate = () => `
<div class="pagos-module">

    <!-- Header -->
    <div class="page-header" style="align-items:center; margin-bottom:28px;">
        <div>
            <h1 class="page-title" id="pagos-title">Pagos</h1>
            <p class="page-subtitle" id="pagos-subtitle">Historial financiero de la sede</p>
        </div>
        <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
            <div class="select-wrap">
                <select id="pagos-periodo" style="height:40px;padding:0 32px 0 14px;border-radius:10px;border:1px solid #e2e8f0;background:#fff;font-size:13px;font-weight:600;color:#334155;cursor:pointer;outline:none;appearance:none;background-image:url('data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%2212%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%2364748b%22 stroke-width=%222%22%3E%3Cpolyline points=%226 9 12 15 18 9%22%3E%3C/polyline%3E%3C/svg%3E');background-repeat:no-repeat;background-position:right 10px center;">
                    <option value="7">Últimos 7 días</option>
                    <option value="30" selected>Últimos 30 días</option>
                    <option value="90">Últimos 90 días</option>
                    <option value="365">Este año</option>
                </select>
            </div>
            <div class="select-wrap">
                <select id="pagos-metodo" style="height:40px;padding:0 32px 0 14px;border-radius:10px;border:1px solid #e2e8f0;background:#fff;font-size:13px;font-weight:600;color:#334155;cursor:pointer;outline:none;appearance:none;background-image:url('data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%2212%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%2364748b%22 stroke-width=%222%22%3E%3Cpolyline points=%226 9 12 15 18 9%22%3E%3C/polyline%3E%3C/svg%3E');background-repeat:no-repeat;background-position:right 10px center;">
                    <option value="">Todos los métodos</option>
                    <option value="EFECTIVO">💵 Efectivo</option>
                    <option value="YAPE">📱 Yape</option>
                    <option value="PLIN">📱 Plin</option>
                    <option value="TRANSFERENCIA">🏦 Transferencia</option>
                    <option value="TARJETA">💳 Tarjeta</option>
                </select>
            </div>
            <button id="pagos-btn-csv" style="display:flex;align-items:center;gap:6px;height:40px;padding:0 18px;border-radius:10px;border:1px solid #e2e8f0;background:#fff;font-size:13px;font-weight:700;color:#475569;cursor:pointer;">
                <i class='bx bx-download'></i> Exportar CSV
            </button>
        </div>
    </div>

    <!-- Stats Cards -->
    <div class="pay-stats-row" style="margin-bottom:28px;">
        <div class="pay-stat-card">
            <div class="pay-stat-header">
                <div class="pay-icon-circle bg-green-tint text-green"><i class='bx bx-trending-up'></i></div>
                <span class="pay-badge bg-green-tint text-green" id="pagos-badge-ingresos">0 pagos</span>
            </div>
            <p class="pay-stat-label">TOTAL INGRESOS</p>
            <h2 class="pay-stat-value" id="pagos-stat-ingresos">S/ —</h2>
            <div class="pay-prog-track"><div class="pay-prog-fill bg-dark-green" id="pagos-bar-ingresos" style="width:0%"></div></div>
        </div>
        <div class="pay-stat-card">
            <div class="pay-stat-header">
                <div class="pay-icon-circle bg-orange-tint text-orange"><i class='bx bx-trending-down'></i></div>
                <span class="pay-badge bg-orange-tint text-orange" id="pagos-badge-salidas">0 salidas</span>
            </div>
            <p class="pay-stat-label">TOTAL SALIDAS</p>
            <h2 class="pay-stat-value" id="pagos-stat-salidas">S/ —</h2>
            <div class="pay-prog-track"><div class="pay-prog-fill" id="pagos-bar-salidas" style="width:0%;background:#ea580c;"></div></div>
        </div>
        <div class="pay-stat-card">
            <div class="pay-stat-header">
                <div class="pay-icon-circle bg-red-tint text-red"><i class='bx bx-block'></i></div>
                <span class="pay-badge bg-red-tint text-red" id="pagos-badge-anulados">0 anulados</span>
            </div>
            <p class="pay-stat-label">ANULADOS</p>
            <h2 class="pay-stat-value" id="pagos-stat-anulados">S/ —</h2>
            <div class="pay-prog-track"><div class="pay-prog-fill" id="pagos-bar-anulados" style="width:0%;background:#ef4444;"></div></div>
        </div>
        <div class="pay-stat-card">
            <div class="pay-stat-header">
                <div class="pay-icon-circle bg-gray-tint text-gray-d"><i class='bx bx-transfer'></i></div>
                <span class="pay-badge" id="pagos-badge-count" style="background:#f1f5f9;color:#475569;">0</span>
            </div>
            <p class="pay-stat-label">TRANSACCIONES</p>
            <h2 class="pay-stat-value" id="pagos-stat-count">0</h2>
            <p class="pay-stat-sub" id="pagos-stat-sub">en el período</p>
        </div>
        
    </div>

    <!-- Tabla -->
    <div class="panel table-container-full pay-table-panel" style="padding:0;position:relative;border-radius:20px;margin-bottom:40px;">
        <div class="table-toolbar pay-toolbar" style="border-radius:20px 20px 0 0;">
            <div class="toolbar-left">
                <h3 style="font-size:16px;font-weight:800;color:var(--text-main);">Transacciones</h3>
                <span id="pagos-count-label" style="margin-left:10px;font-size:12px;font-weight:600;color:#94a3b8;background:#f1f5f9;padding:3px 10px;border-radius:20px;">0 registros</span>
            </div>
            <div class="toolbar-right">
                <div style="position:relative;">
                    <i class='bx bx-search' style="position:absolute;left:12px;top:50%;transform:translateY(-50%);color:#94a3b8;font-size:16px;pointer-events:none;"></i>
                    <input id="pagos-search" type="text" placeholder="Buscar referencia o ID..." style="height:38px;padding:0 14px 0 36px;border-radius:10px;border:1px solid #e2e8f0;font-size:13px;color:#334155;outline:none;width:220px;">
                </div>
            </div>
        </div>

        <!-- Loading -->
        <div id="pagos-loading" style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:60px 20px;gap:12px;">
            <div class="spinner-circle" style="width:36px;height:36px;"></div>
            <p style="color:#94a3b8;font-size:13px;font-weight:600;">Cargando pagos...</p>
        </div>
        <!-- Error -->
        <div id="pagos-error" style="display:none;padding:40px 24px;text-align:center;">
            <i class='bx bx-error-circle' style="font-size:40px;color:#ef4444;"></i>
            <p id="pagos-error-msg" style="color:#ef4444;font-weight:600;margin-top:8px;"></p>
            <button id="pagos-retry" style="margin-top:12px;padding:8px 20px;border-radius:8px;border:1px solid #e2e8f0;background:#fff;font-size:13px;font-weight:700;cursor:pointer;color:#334155;"><i class='bx bx-refresh'></i> Reintentar</button>
        </div>
        <!-- Tabla real -->
        <div id="pagos-table-wrap" style="display:none;">
            <table class="canchas-table pay-table">
                <thead>
                    <tr>
                        <th>FECHA</th>
                        <th>TIPO</th>
                        <th style="text-align:right;">MONTO</th>
                        <th>ORIGEN</th>
                        <th>MÉTODO</th>
                        <th>ESTADO</th>
                        <th style="text-align:center;">ACCIONES</th>
                    </tr>
                </thead>
                <tbody id="pagos-tbody"></tbody>
            </table>
            <div id="pagos-empty" style="display:none;padding:50px 20px;text-align:center;">
                <i class='bx bx-credit-card' style="font-size:48px;color:#cbd5e1;"></i>
                <p style="color:#94a3b8;font-weight:600;margin-top:10px;">Sin transacciones en este período</p>
            </div>
            <div class="pagination-footer" id="pagos-footer">
                <span id="pagos-page-info-label">Mostrando 0 resultados</span>
                <div class="page-numbers" id="pagos-pagination" style="display:none;">
                    <button class="arr" id="pagos-page-first" title="Primera"><i class='bx bx-chevrons-left'></i></button>
                    <button class="arr" id="pagos-page-prev"  title="Anterior"><i class='bx bx-chevron-left'></i></button>
                    <span style="display:flex;align-items:center;padding:0 8px;font-weight:600;font-size:13px;color:#0f172a;" id="pagos-page-info">Página 1 de 1</span>
                    <button class="arr" id="pagos-page-next"  title="Siguiente"><i class='bx bx-chevron-right'></i></button>
                    <button class="arr" id="pagos-page-last"  title="Última"><i class='bx bx-chevrons-right'></i></button>
                </div>
            </div>
        </div>
    </div>

    <!-- Toast -->
    <div class="nc-toast" id="pagos-toast" style="display:none;">
        <i class='bx bx-check-circle'></i>
        <span id="pagos-toast-msg">Operación exitosa</span>
    </div>

    <!-- Estilos inline para los campos del detalle -->
    <style>
        .dp-field { }
        .dp-label { font-size:10px; font-weight:700; color:#94a3b8; letter-spacing:0.8px; text-transform:uppercase; margin:0 0 3px; }
        .dp-value { font-size:13px; font-weight:600; color:#1e293b; margin:0; }
        .dp-nota  { font-size:12px; font-weight:400; color:#475569; background:#f8fafc; padding:8px 12px; border-radius:8px; border-left:3px solid #e2e8f0; line-height:1.5; }
    </style>
</div>
`;
