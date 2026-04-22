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
        <div class="pay-stat-card">
            <div class="pay-stat-header">
                <div class="pay-icon-circle bg-orange-tint text-orange"><i class='bx bx-trending-down'></i></div>
                <span class="pay-badge bg-orange-tint text-orange" id="pagos-badge-salidas">0 salidas</span>
            </div>
            <p class="pay-stat-label">TOTAL SALIDAS</p>
            <h2 class="pay-stat-value" id="pagos-stat-salidas">S/ —</h2>
            <div class="pay-prog-track"><div class="pay-prog-fill" id="pagos-bar-salidas" style="width:0%;background:#ea580c;"></div></div>
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

    <!-- ═══════════════════════════════════════════════
         MODAL 1 — VER DETALLE DEL PAGO (solo lectura)
    ═══════════════════════════════════════════════ -->
    <div id="modal-detalle-pago" class="pm-overlay" style="display:none;" role="dialog" aria-modal="true">
        <div class="pm-modal" style="max-width:550px;">
            <div class="pm-header" style="background:linear-gradient(135deg,#1e3a5f,#3b82f6);">
                <div class="pm-header-icon" style="background:rgba(255,255,255,0.15);">
                    <i class='bx bx-receipt' style="color:#fff;"></i>
                </div>
                <div style="flex-grow:1; display:flex; align-items:center; gap:12px; flex-wrap:wrap;">
                    <h2 class="pm-title" id="dp-title" style="color:#fff; margin:0;">Detalle de Transacción #—</h2>
                    <span id="dp-estado-badge"></span>
                </div>
                <button class="pm-close" id="btn-dp-close" style="color:#fff;"><i class='bx bx-x'></i></button>
            </div>
            <div class="pm-body" style="padding:24px;">
                <!-- Loading detalle -->
                <div id="dp-loading" style="text-align:center;padding:30px;">
                    <div class="spinner-circle" style="width:28px;height:28px;margin:0 auto 10px;"></div>
                    <p style="color:#94a3b8;font-size:13px;">Cargando detalles...</p>
                </div>
                <!-- Contenido detalle -->
                <div id="dp-content" style="display:none;">
                    
                    <!-- Sección 1: Detalles Financieros -->
                    <div style="margin-bottom:24px;">
                        <div style="display:flex; justify-content:space-between; align-items:flex-start; background:#f8fafc; padding:20px; border-radius:14px; border:1px solid #e2e8f0;">
                            <div>
                                <p class="dp-label">Tipo de Transacción</p>
                                <p class="dp-value" id="dp-tipo" style="margin-bottom:14px;">—</p>
                                
                                <p class="dp-label">Método de Pago</p>
                                <p class="dp-value" id="dp-metodo" style="margin-bottom:14px;">—</p>
                                
                                <p class="dp-label">Fecha y Hora de Registro</p>
                                <p class="dp-value" id="dp-fecha">—</p>
                            </div>
                            <div style="text-align:right; display:flex; flex-direction:column; justify-content:center; height:100%;">
                                <p style="font-size:11px;font-weight:700;color:#94a3b8;letter-spacing:1px; margin-bottom:4px;">MONTO</p>
                                <h2 id="dp-monto" style="font-size:32px;font-weight:900;margin:0;"></h2>
                            </div>
                        </div>
                    </div>

                    <!-- Sección 2: Origen y Contexto -->
                    <div style="margin-bottom:24px;">
                        <p style="font-size:11px;font-weight:800;color:#94a3b8;letter-spacing:1px;text-transform:uppercase;margin-bottom:14px;border-bottom:1px solid #e2e8f0;padding-bottom:6px;">Origen y Contexto</p>
                        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px 20px;">
                            <div class="dp-field"><p class="dp-label">Origen de la Transacción</p><p class="dp-value" id="dp-origen">—</p></div>
                            <div class="dp-field" id="dp-cliente-wrap"><p class="dp-label">Cliente Asociado</p><p class="dp-value" id="dp-cliente">—</p></div>
                            <div class="dp-field" id="dp-registrado-wrap"><p class="dp-label">Registrado por</p><p class="dp-value" id="dp-registrado">—</p></div>
                        </div>
                    </div>

                    <!-- Sección 3: Información Adicional -->
                    <div style="margin-bottom:24px;" id="dp-nota-wrap">
                        <p style="font-size:11px;font-weight:800;color:#94a3b8;letter-spacing:1px;text-transform:uppercase;margin-bottom:14px;border-bottom:1px solid #e2e8f0;padding-bottom:6px;">Información Adicional</p>
                        <div class="dp-field"><p class="dp-label">Nota de la Transacción</p><p class="dp-value dp-nota" id="dp-nota">—</p></div>
                    </div>

                    <!-- Sección ANULADO (solo si estado == ANULADO) -->
                    <div id="dp-anulacion-section" style="display:none;background:#fff1f2;border:1px solid #fecaca;border-radius:12px;padding:16px;">
                        <p style="font-size:11px;font-weight:800;color:#dc2626;letter-spacing:1px;margin-bottom:12px;text-transform:uppercase;">Detalles de la Anulación</p>
                        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px 20px;">
                            <div class="dp-field"><p class="dp-label" style="color:#b91c1c;">Fecha de Anulación</p><p class="dp-value" style="color:#7f1d1d;" id="dp-fecha-anulacion">—</p></div>
                            <div class="dp-field"><p class="dp-label" style="color:#b91c1c;">Anulado por</p><p class="dp-value" style="color:#7f1d1d;" id="dp-anulado-por">—</p></div>
                            <div class="dp-field" style="grid-column:1/-1;"><p class="dp-label" style="color:#b91c1c;">Motivo de la Anulación</p><p class="dp-value dp-nota" style="background:rgba(255,255,255,0.6);border-color:#fecaca;color:#7f1d1d;margin-top:4px;" id="dp-motivo-anulacion">—</p></div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="pm-footer" id="dp-footer">
                <button class="pm-btn-cancel" id="btn-dp-cerrar">Cerrar</button>
                <button id="btn-dp-imprimir" style="display:flex;align-items:center;gap:6px;padding:10px 20px;border-radius:10px;border:1px solid #e2e8f0;background:#f8fafc;font-size:13px;font-weight:700;cursor:pointer;color:#475569;">
                    <i class='bx bx-printer'></i> Imprimir Recibo
                </button>
                <button id="btn-dp-anular" style="display:none;display:flex;align-items:center;gap:6px;padding:10px 22px;border-radius:10px;border:none;background:linear-gradient(135deg,#7f1d1d,#ef4444);color:#fff;font-size:13px;font-weight:700;cursor:pointer;">
                    <i class='bx bx-block'></i> Anular Pago
                </button>
            </div>
        </div>
    </div>

    <!-- ═══════════════════════════════════════════════
         MODAL 2 — ANULAR PAGO (confirmación)
    ═══════════════════════════════════════════════ -->
    <div id="modal-anular-pago" class="pm-overlay" style="display:none;" role="dialog" aria-modal="true">
        <div class="pm-modal" style="max-width:440px;">
            <div class="pm-header" style="background:linear-gradient(135deg,#7f1d1d,#ef4444);">
                <div class="pm-header-icon" style="background:rgba(255,255,255,0.15);">
                    <i class='bx bx-block' style="color:#fff;"></i>
                </div>
                <div>
                    <h2 class="pm-title" style="color:#fff;" id="anular-titulo">¿Anular este pago?</h2>
                    <p class="pm-subtitle" style="color:rgba(255,255,255,0.8);" id="anular-subtitle">Pago #—</p>
                </div>
                <button class="pm-close" id="btn-anular-close" style="color:#fff;"><i class='bx bx-x'></i></button>
            </div>
            <div class="pm-body">
                <div class="pm-alert-error" id="anular-error-box" style="display:none;">
                    <i class='bx bx-error-circle'></i>
                    <span id="anular-error-msg"></span>
                </div>
                <!-- Aviso explicativo -->
                <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:14px 16px;margin-bottom:18px;display:flex;gap:10px;align-items:flex-start;">
                    <i class='bx bx-error' style="color:#ea580c;font-size:20px;flex-shrink:0;margin-top:1px;"></i>
                    <p style="font-size:12px;color:#7c2d12;line-height:1.6;margin:0;">
                        <strong>Esta acción es irreversible.</strong> El monto se descontará del total pagado de la reserva o evento asociado y el saldo pendiente se recalculará automáticamente.
                    </p>
                </div>
                <div class="pm-field">
                    <label class="pm-label"><i class='bx bx-edit'></i> Motivo de Anulación <span class="pm-required">*</span></label>
                    <textarea id="anular-motivo" class="pm-input" rows="3" placeholder="Ej: Pago duplicado por error del sistema..." style="resize:none;"></textarea>
                    <span class="pm-field-error" id="anular-err-motivo"></span>
                </div>
            </div>
            <div class="pm-footer">
                <button class="pm-btn-cancel" id="btn-anular-cancel">Cancelar</button>
                <button class="pm-btn-submit" id="btn-anular-submit" style="background:linear-gradient(135deg,#7f1d1d,#ef4444);">
                    <span id="anular-submit-text" style="display:flex;align-items:center;gap:6px;"><i class='bx bx-block'></i> Sí, Anular Pago</span>
                    <span id="anular-submit-loader" style="display:none;align-items:center;gap:8px;"><div class="pm-spinner"></div> Anulando...</span>
                </button>
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
