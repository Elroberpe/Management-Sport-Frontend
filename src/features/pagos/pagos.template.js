export const pagosTemplate = () => `
<div class="pagos-module">

    <!-- Header -->
    <div id="pagos-header-container"></div>

    <!-- Stats Cards -->
    <div class="stats-grid-row">
        <div class="stat-card-standard">
            <div class="stat-header-row">
                <div class="stat-icon-circle bg-green-tint text-green"><i class='bx bx-trending-up'></i></div>
                <span class="stat-badge-pill bg-green-tint text-green" id="pagos-badge-ingresos">0 pagos</span>
            </div>
            <p class="stat-label-tiny">TOTAL INGRESOS</p>
            <h2 class="stat-value-big" id="pagos-stat-ingresos">S/ —</h2>
            <div class="stat-progress-bar"><div class="stat-progress-fill bg-dark-green" id="pagos-bar-ingresos" style="width:0%"></div></div>
        </div>
        <div class="stat-card-standard">
            <div class="stat-header-row">
                <div class="stat-icon-circle bg-orange-tint text-orange"><i class='bx bx-trending-down'></i></div>
                <span class="stat-badge-pill bg-orange-tint text-orange" id="pagos-badge-salidas">0 salidas</span>
            </div>
            <p class="stat-label-tiny">TOTAL SALIDAS</p>
            <h2 class="stat-value-big" id="pagos-stat-salidas">S/ —</h2>
            <div class="stat-progress-bar"><div class="stat-progress-fill" id="pagos-bar-salidas" style="width:0%;background:#ea580c;"></div></div>
        </div>
        <div class="stat-card-standard">
            <div class="stat-header-row">
                <div class="stat-icon-circle bg-red-tint text-red"><i class='bx bx-block'></i></div>
                <span class="stat-badge-pill bg-red-tint text-red" id="pagos-badge-anulados">0 anulados</span>
            </div>
            <p class="stat-label-tiny">ANULADOS</p>
            <h2 class="stat-value-big" id="pagos-stat-anulados">S/ —</h2>
            <div class="stat-progress-bar"><div class="stat-progress-fill" id="pagos-bar-anulados" style="width:0%;background:#ef4444;"></div></div>
        </div>
        <div class="stat-card-standard">
            <div class="stat-header-row">
                <div class="stat-icon-circle bg-gray-tint text-gray-d"><i class='bx bx-transfer'></i></div>
                <span class="stat-badge-pill" id="pagos-badge-count" style="background:#f1f5f9;color:#475569;">0</span>
            </div>
            <p class="stat-label-tiny">TRANSACCIONES</p>
            <h2 class="stat-value-big" id="pagos-stat-count">0</h2>
            <p class="stat-sub" id="pagos-stat-sub">en el período</p>
        </div>
        
    </div>

    <!-- Tabla -->
    <div class="standard-panel">
        <div class="filter-bar">
            <div class="filter-group">
                <div class="search-wrap">
                    <i class='bx bx-search'></i>
                    <input id="pagos-search" type="text" placeholder="Buscar referencia o ID...">
                </div>
                <select id="pagos-periodo">
                    <option value="7">Últimos 7 días</option>
                    <option value="30" selected>Últimos 30 días</option>
                    <option value="90">Últimos 90 días</option>
                    <option value="365">Este año</option>
                </select>
                <select id="pagos-metodo">
                    <option value="">Todos los métodos</option>
                    <option value="EFECTIVO">💵 Efectivo</option>
                    <option value="YAPE">📱 Yape</option>
                    <option value="PLIN">📱 Plin</option>
                    <option value="TRANSFERENCIA">🏦 Transferencia</option>
                    <option value="TARJETA">💳 Tarjeta</option>
                </select>
            </div>
            <div class="filter-group">
                <span id="pagos-count-label" style="font-size:12px;font-weight:600;color:#94a3b8;background:#f1f5f9;padding:3px 10px;border-radius:20px;">0 registros</span>
            </div>
        </div>

        <div id="pagos-table-container"></div>
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
