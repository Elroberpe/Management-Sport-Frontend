// src/features/reservas/reservas.modals.template.js

export const reservasModalsTemplate = () => ""; // No longer used for the shell system

export const reservaNewFormTemplate = () => `
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
        <div class="modal-shell-field">
            <label class="modal-shell-label"><i class='bx bx-building-house'></i> Sucursal <span style="color:#ef4444;">*</span></label>
            <select id="nr-sucursal" class="modal-shell-input">
                <option value="">— Cargando sedes… —</option>
            </select>
            <span class="modal-shell-error-text" id="nr-sucursal-err"></span>
        </div>
        <div class="modal-shell-field">
            <label class="modal-shell-label"><i class='bx bx-football'></i> Cancha <span style="color:#ef4444;">*</span></label>
            <select id="nr-cancha" class="modal-shell-input" disabled>
                <option value="">— Selecciona una sede —</option>
            </select>
            <span class="modal-shell-error-text" id="nr-cancha-err"></span>
        </div>
    </div>

    <div class="modal-shell-field">
        <label class="modal-shell-label"><i class='bx bx-calendar'></i> Fecha <span style="color:#ef4444;">*</span></label>
        <input type="date" id="nr-fecha" class="modal-shell-input">
        <span class="modal-shell-error-text" id="nr-fecha-err"></span>
    </div>

    <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
        <div class="modal-shell-field">
            <label class="modal-shell-label"><i class='bx bx-time'></i> Hora Inicio <span style="color:#ef4444;">*</span></label>
            <select id="nr-hora-inicio" class="modal-shell-input">
                <option value="">— Seleccionar —</option>
            </select>
            <span class="modal-shell-error-text" id="nr-inicio-err"></span>
        </div>
        <div class="modal-shell-field">
            <label class="modal-shell-label"><i class='bx bx-time-five'></i> Hora Fin <span style="color:#ef4444;">*</span></label>
            <select id="nr-hora-fin" class="modal-shell-input" disabled>
                <option value="">— Selecciona inicio —</option>
            </select>
            <span class="modal-shell-error-text" id="nr-fin-err"></span>
        </div>
    </div>

    <div class="modal-shell-field">
        <label class="modal-shell-label"><i class='bx bx-user'></i> Cliente <span style="color:#ef4444;">*</span></label>
        <div style="display:flex; gap:8px;">
            <div style="flex:1; position:relative;">
                <input type="text" id="nr-cliente-input" class="modal-shell-input" placeholder="Buscar por nombre o DNI..." autocomplete="off">
                <input type="hidden" id="nr-cliente-id">
                <ul class="autocomplete-list" id="nr-cliente-list" style="position:absolute; top:100%; left:0; right:0; z-index:1000; margin:0;"></ul>
            </div>
            <button type="button" id="nr-btn-nuevo-cliente" class="modal-shell-btn modal-shell-btn-secondary" style="padding:0 12px; height:42px; font-size:12px;">
                <i class='bx bx-user-plus'></i> Nuevo
            </button>
        </div>
        <span class="modal-shell-error-text" id="nr-cliente-err"></span>
    </div>

    <div id="nr-costo-box" style="display:none; background:#f0fdf4; border:1.5px solid #bbf7d0; border-radius:10px; padding:14px 18px; margin-top:10px;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
            <span style="font-size:13px; color:#166534; font-weight:600;"><i class='bx bx-money'></i> Total a Pagar</span>
            <span id="nr-costo-total" style="font-size:20px; font-weight:800; color:#15803d;">S/ 0.00</span>
        </div>
        <div style="font-size:11px; color:#4ade80; margin-top:4px;" id="nr-costo-detalle">—</div>
    </div>
`;

export const reservaDetailTemplate = () => `
    <div id="dr-loading" style="text-align:center; padding:40px;">
        <div class="spinner-circle" style="margin:0 auto;"></div>
        <p style="color:#94a3b8; margin-top:12px; font-size:13px;">Cargando detalles...</p>
    </div>
    
    <div id="dr-content" style="display:none;">
        <div class="dr-tabs-header" style="margin:-15px -20px 20px -20px; border-top:none; border-bottom:1px solid #e2e8f0;">
            <button class="dr-tab-btn active" data-tab="tab-detalles"><i class='bx bx-detail'></i> Detalles</button>
            <button class="dr-tab-btn" data-tab="tab-pagos"><i class='bx bx-credit-card-front'></i> Pagos</button>
            <button class="dr-tab-btn" data-tab="tab-logs"><i class='bx bx-history'></i> Cambios</button>
        </div>

        <div class="dr-tab-content active" id="tab-detalles">
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px;">
                <div>
                    <div style="margin-bottom:12px;">
                        <span style="display:block; font-size:11px; color:#94a3b8; font-weight:700; text-transform:uppercase;">Cliente</span>
                        <strong id="dr-cliente" style="color:#2563eb; cursor:pointer;">—</strong>
                    </div>
                    <div style="margin-bottom:12px;">
                        <span style="display:block; font-size:11px; color:#94a3b8; font-weight:700; text-transform:uppercase;">Cancha</span>
                        <strong id="dr-cancha">—</strong>
                    </div>
                    <div>
                        <span style="display:block; font-size:11px; color:#94a3b8; font-weight:700; text-transform:uppercase;">Fecha y Hora</span>
                        <strong id="dr-fecha">—</strong>
                        <div id="dr-duracion" style="font-size:12px; color:#64748b;"></div>
                    </div>
                </div>
                <div style="background:#f8fafc; border-radius:12px; padding:16px; border:1px solid #e2e8f0;">
                    <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:13px;">
                        <span>Monto Total:</span>
                        <strong id="dr-total">S/ 0.00</strong>
                    </div>
                    <div style="display:flex; justify-content:space-between; margin-bottom:12px; font-size:13px;">
                        <span>Pagado:</span>
                        <strong id="dr-pagado" style="color:#059669;">S/ 0.00</strong>
                    </div>
                    <div style="border-top:1px dashed #cbd5e1; margin-bottom:12px;"></div>
                    <div style="text-align:center;">
                        <span style="display:block; font-size:11px; color:#64748b; margin-bottom:4px;">Saldo Pendiente</span>
                        <div id="dr-saldo" style="font-size:24px; font-weight:800; color:#1e293b;">S/ 0.00</div>
                    </div>
                </div>
            </div>
        </div>

        <div class="dr-tab-content" id="tab-pagos" style="display:none;">
            <div style="border:1px solid #e2e8f0; border-radius:10px; overflow:hidden;">
                <table class="canchas-table" style="margin:0; font-size:13px;">
                    <thead>
                        <tr>
                            <th>FECHA</th>
                            <th>MÉTODO</th>
                            <th style="text-align:right;">MONTO</th>
                        </tr>
                    </thead>
                    <tbody id="dr-tbody-pagos"></tbody>
                </table>
                <div id="dr-empty-pagos" style="display:none; text-align:center; padding:20px; color:#94a3b8; font-size:12px;">Sin pagos.</div>
            </div>
        </div>

        <div class="dr-tab-content" id="tab-logs" style="display:none;">
            <ul id="dr-logs-list" style="list-style:none; padding:0; font-size:12px; color:#64748b;"></ul>
        </div>
    </div>
`;

export const reservaPagoFormTemplate = () => `
    <div class="modal-shell-field">
        <label class="modal-shell-label"><i class='bx bx-money'></i> Monto <span style="color:#ef4444;">*</span></label>
        <input type="number" id="ap-monto" class="modal-shell-input" placeholder="0.00" min="0.01" step="0.01">
        <span class="modal-shell-error-text" id="ap-monto-err"></span>
    </div>
    <div class="modal-shell-field">
        <label class="modal-shell-label"><i class='bx bx-wallet'></i> Método de Pago <span style="color:#ef4444;">*</span></label>
        <select id="ap-metodo" class="modal-shell-input">
            <option value="">— Seleccionar —</option>
            <option value="EFECTIVO">💵 Efectivo</option>
            <option value="YAPE">📱 Yape</option>
            <option value="PLIN">📱 Plin</option>
            <option value="TRANSFERENCIA">🏦 Transferencia</option>
            <option value="TARJETA">💳 Tarjeta</option>
        </select>
        <span class="modal-shell-error-text" id="ap-metodo-err"></span>
    </div>
`;
