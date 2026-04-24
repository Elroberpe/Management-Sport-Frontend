// src/features/reservas/reservas.modals.template.js
// HTML de todos los modales del módulo de reservas.
// Importado por reservas.page.js y concatenado al template principal.

export const reservasModalsTemplate = () => `

<!-- ===== MODAL NUEVA RESERVA ===== -->
<div id="modal-nueva-reserva" class="pm-overlay" style="display:none;" role="dialog" aria-modal="true">
    <div class="pm-modal" style="max-width:560px;">
        <div class="pm-header">
            <div class="pm-header-icon" style="background:linear-gradient(135deg,#0f4c81,#2563eb);">
                <i class='bx bx-calendar-plus'></i>
            </div>
            <div>
                <h2 class="pm-title">Nueva Reserva</h2>
                <p class="pm-subtitle">Completa los datos para registrar la reserva</p>
            </div>
            <button class="pm-close" id="btn-nr-close"><i class='bx bx-x'></i></button>
        </div>
        <div class="pm-body">

            <!-- Error general -->
            <div class="pm-alert-error" id="nr-error-box" style="display:none;">
                <i class='bx bx-error-circle'></i>
                <span id="nr-error-msg">Error</span>
            </div>

            <!-- Fila: Sucursal + Cancha (cascade) -->
            <div class="pm-row-2">
                <div class="pm-field">
                    <label class="pm-label"><i class='bx bx-building-house'></i> Sucursal <span class="pm-required">*</span></label>
                    <div class="pm-select-wrap">
                        <select id="nr-sucursal" class="pm-input pm-select">
                            <option value="">— Cargando sedes… —</option>
                        </select>
                        <i class='bx bx-chevron-down pm-select-arrow'></i>
                    </div>
                    <span class="pm-field-error" id="nr-err-sucursal"></span>
                </div>
                <div class="pm-field">
                    <label class="pm-label"><i class='bx bx-football'></i> Cancha <span class="pm-required">*</span></label>
                    <div class="pm-select-wrap">
                        <select id="nr-cancha" class="pm-input pm-select" disabled>
                            <option value="">— Selecciona una sede primero —</option>
                        </select>
                        <i class='bx bx-chevron-down pm-select-arrow'></i>
                    </div>
                    <span class="pm-field-error" id="nr-err-cancha"></span>
                </div>
            </div>

            <!-- Fecha -->
            <div class="pm-field">
                <label class="pm-label"><i class='bx bx-calendar'></i> Fecha <span class="pm-required">*</span></label>
                <input type="date" id="nr-fecha" class="pm-input">
                <span class="pm-field-error" id="nr-err-fecha"></span>
            </div>

            <!-- Fila: Hora Inicio + Hora Fin -->
            <div class="pm-row-2">
                <div class="pm-field">
                    <label class="pm-label"><i class='bx bx-time'></i> Hora de Inicio <span class="pm-required">*</span></label>
                    <div class="pm-select-wrap">
                        <select id="nr-hora-inicio" class="pm-input pm-select">
                            <option value="">— Seleccionar —</option>
                        </select>
                        <i class='bx bx-chevron-down pm-select-arrow'></i>
                    </div>
                    <span class="pm-field-error" id="nr-err-inicio"></span>
                </div>
                <div class="pm-field">
                    <label class="pm-label"><i class='bx bx-time-five'></i> Hora de Fin <span class="pm-required">*</span></label>
                    <div class="pm-select-wrap">
                        <select id="nr-hora-fin" class="pm-input pm-select" disabled>
                            <option value="">— Selecciona hora inicio —</option>
                        </select>
                        <i class='bx bx-chevron-down pm-select-arrow'></i>
                    </div>
                    <span class="pm-field-error" id="nr-err-fin"></span>
                </div>
            </div>

            <!-- Cliente (autocomplete + nuevo) -->
            <div class="pm-field">
                <label class="pm-label"><i class='bx bx-user'></i> Cliente <span class="pm-required">*</span></label>
                <div style="display:flex; gap:8px; align-items:flex-start;">
                    <div style="flex:1; position:relative;">
                        <input type="text" id="nr-cliente-input" class="pm-input" placeholder="Buscar por nombre o DNI..." autocomplete="off" style="width:100%;">
                        <input type="hidden" id="nr-cliente-id">
                        <ul class="autocomplete-list" id="nr-cliente-list" style="position:absolute;top:100%;left:0;right:0;z-index:999;margin:0;"></ul>
                    </div>
                    <button type="button" id="nr-btn-nuevo-cliente" class="pm-btn-cancel" style="white-space:nowrap; height:42px; padding:0 14px; display:flex; align-items:center; gap:6px; font-size:13px;">
                        <i class='bx bx-user-plus'></i> Nuevo
                    </button>
                </div>
                <span class="pm-field-error" id="nr-err-cliente"></span>
            </div>

            <!-- Cálculo dinámico de costo -->
            <div id="nr-costo-box" style="display:none; background:#f0fdf4; border:1.5px solid #bbf7d0; border-radius:10px; padding:14px 18px; margin-top:4px;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span style="font-size:13px; color:#166534; font-weight:600;"><i class='bx bx-money'></i> Total a Pagar</span>
                    <span id="nr-costo-total" style="font-size:20px; font-weight:800; color:#15803d;">S/ 0.00</span>
                </div>
                <div style="font-size:11px; color:#4ade80; margin-top:4px;" id="nr-costo-detalle">—</div>
            </div>

        </div>
        <div class="pm-footer">
            <button class="pm-btn-cancel" id="btn-nr-cancel">Cancelar</button>
            <button class="pm-btn-submit" id="btn-nr-submit" style="background:linear-gradient(135deg,#0f4c81,#2563eb);">
                <span id="nr-submit-text"><i class='bx bx-calendar-check'></i> Crear Reserva</span>
                <span id="nr-submit-loader" style="display:none;"><div class="pm-spinner"></div> Creando...</span>
            </button>
        </div>
    </div>
</div>

<!-- ===== MODAL DETALLE RESERVA (Centro de Pagos) ===== -->
<div id="modal-detalle-reserva" class="pm-overlay" style="display:none;" role="dialog" aria-modal="true">
    <div class="pm-modal" style="max-width:700px;">
        <div class="pm-header" style="background:linear-gradient(135deg,#1e40af,#3b82f6);">
            <div class="pm-header-icon" style="background:rgba(255,255,255,0.15);">
                <i class='bx bx-calendar-check' style="color:#fff;"></i>
            </div>
            <div>
                <div style="display:flex; align-items:center; gap:12px;">
                    <h2 class="pm-title" id="dr-title-main" style="color:#fff; margin:0; font-size: 19px; letter-spacing: 0.2px;">Detalle de Reserva</h2>
                    <span id="dr-badge-estado" style="padding: 4px 12px; font-size: 11px; font-weight: 800; border-radius: 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.2); letter-spacing: 0.5px; text-transform: uppercase; background:#fff; color:#1e293b; border: 1px solid rgba(255,255,255,0.2);">PENDIENTE</span>
                </div>
            </div>
            <button class="pm-close" id="btn-dr-close" style="color:#fff;"><i class='bx bx-x'></i></button>
        </div>
        
        <!-- Pestañas de Navegación -->
        <div class="dr-tabs-header">
            <button class="dr-tab-btn active" data-tab="tab-detalles"><i class='bx bx-detail'></i> Detalles</button>
            <button class="dr-tab-btn" data-tab="tab-pagos"><i class='bx bx-credit-card-front'></i> Historial de Pagos</button>
            <button class="dr-tab-btn" data-tab="tab-logs"><i class='bx bx-history'></i> Historial de Cambios</button>
        </div>

        <div class="pm-body" style="padding:20px 24px;">
            <div id="dr-loading" style="text-align:center;padding:40px;">
                <div class="spinner-circle" style="margin:0 auto;"></div>
                <p style="color:#94a3b8;margin-top:12px;font-size:13px;">Cargando detalles...</p>
            </div>
            
            <div id="dr-content" style="display:none;">
                
                <!-- TAB 1: DETALLES PRINCIPALES -->
                <div class="dr-tab-content active" id="tab-detalles">
                    <div class="dr-dos-columnas">
                        <!-- Col Izquierda: Logística -->
                        <div class="dr-col-left">
                            <div class="dr-info-block">
                                <span class="dr-lbl"><i class='bx bx-user'></i> Cliente</span>
                                <strong id="dr-cliente" class="dr-val" style="color:#2563eb; cursor:pointer;" title="Ver Contacto">—</strong>
                            </div>
                            <div class="dr-info-block">
                                <span class="dr-lbl"><i class='bx bx-football'></i> Cancha</span>
                                <strong id="dr-cancha" class="dr-val">—</strong>
                            </div>
                            <div class="dr-info-block">
                                <span class="dr-lbl"><i class='bx bx-calendar'></i> Fecha y Hora</span>
                                <strong id="dr-fecha" class="dr-val">—</strong>
                                <span id="dr-duracion" style="font-size:12px; color:#64748b;"></span>
                            </div>
                            <div class="dr-info-block">
                                <span class="dr-lbl"><i class='bx bx-user-pin'></i> Registrado por</span>
                                <strong class="dr-val" style="font-weight:500;">admin</strong>
                            </div>
                        </div>

                        <!-- Col Derecha: Finanzas -->
                        <div class="dr-col-right">
                            <div class="dr-finance-card">
                                <div class="dr-fin-row">
                                    <span>Monto Total:</span>
                                    <strong id="dr-total">S/ 0.00</strong>
                                </div>
                                <div class="dr-fin-row">
                                    <span>Monto Pagado:</span>
                                    <strong id="dr-pagado" style="color:#059669;">S/ 0.00</strong>
                                </div>
                                <div class="dr-fin-divider"></div>
                                <div class="dr-fin-saldo-box">
                                    <span>Saldo Pendiente</span>
                                    <div id="dr-saldo" class="dr-saldo-val">S/ 0.00</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- TAB 2: HISTORIAL DE PAGOS -->
                <div class="dr-tab-content" id="tab-pagos" style="display:none;">
                    <div class="table-container-full" style="border: 1px solid #e2e8f0; border-radius:10px; margin:0; overflow:hidden;">
                        <table class="canchas-table" style="margin:0;">
                            <thead>
                                <tr>
                                    <th>FECHA</th>
                                    <th>CÓDIGO</th>
                                    <th>MÉTODO</th>
                                    <th style="text-align:right;">MONTO</th>
                                </tr>
                            </thead>
                            <tbody id="dr-tbody-pagos">
                                <!-- Filas por JS -->
                            </tbody>
                        </table>
                        <div id="dr-empty-pagos" style="display:none; text-align:center; padding:30px; color:#94a3b8; font-size:13px;">
                            No hay pagos registrados para esta reserva.
                        </div>
                    </div>
                </div>

                <!-- TAB 3: HISTORIAL DE CAMBIOS -->
                <div class="dr-tab-content" id="tab-logs" style="display:none;">
                    <ul class="dr-logs-feed" id="dr-logs-list">
                        <li><span class="dr-log-time">--/--/-- --:--</span> Reserva registrada por el sistema.</li>
                    </ul>
                </div>

            </div>
        </div>
        <div class="pm-footer" id="dr-footer" style="display:none; justify-content:flex-end;">
            <button class="pm-btn-cancel" id="btn-dr-close2">Cerrar</button>
            <button class="pm-btn-cancel" id="btn-dr-imprimir" style="display:none; border:1px solid #e2e8f0;"><i class='bx bx-printer'></i> Imprimir Recibo</button>
            <button class="pm-btn-cancel" id="btn-dr-cancelar-reserva" style="display:none; background:#fef2f2; color:#dc2626; border-color:#fecaca;"><i class='bx bx-x-circle'></i> Cancelar</button>
            <button class="pm-btn-submit" id="btn-dr-reprogramar" style="display:none; background:linear-gradient(135deg,#0284c7,#0369a1);"><i class='bx bx-calendar-edit'></i> Reprogramar</button>
            <button class="pm-btn-submit" id="btn-dr-reembolso" style="display:none;background:linear-gradient(135deg,#92400e,#d97706);"><i class='bx bx-money-withdraw'></i> Reembolsar</button>
            <button class="pm-btn-submit" id="btn-dr-pago" style="display:none;background:linear-gradient(135deg,#065f46,#059669);"><i class='bx bx-plus-circle'></i> Añadir Pago</button>
        </div>
    </div>
</div>

<!-- ===== MINI-MODAL AÑADIR PAGO ===== -->
<div id="modal-agregar-pago" class="pm-overlay" style="display:none;" role="dialog" aria-modal="true">
    <div class="pm-modal" style="max-width:380px;">
        <div class="pm-header" style="background:linear-gradient(135deg,#065f46,#059669);">
            <div class="pm-header-icon" style="background:rgba(255,255,255,0.15);">
                <i class='bx bx-credit-card' style="color:#fff;"></i>
            </div>
            <div>
                <h2 class="pm-title" style="color:#fff;">Añadir Pago</h2>
                <p class="pm-subtitle" id="ap-subtitle" style="color:rgba(255,255,255,0.8);">Saldo pendiente: S/ 0.00</p>
            </div>
            <button class="pm-close" id="btn-ap-close" style="color:#fff;"><i class='bx bx-x'></i></button>
        </div>
        <div class="pm-body">
            <div class="pm-alert-error" id="ap-error-box" style="display:none;">
                <i class='bx bx-error-circle'></i>
                <span id="ap-error-msg">Error</span>
            </div>
            <div class="pm-field">
                <label class="pm-label"><i class='bx bx-money'></i> Monto <span class="pm-required">*</span></label>
                <input type="number" id="ap-monto" class="pm-input" placeholder="0.00" min="0.01" step="0.01">
                <span class="pm-field-error" id="ap-err-monto"></span>
            </div>
            <div class="pm-field">
                <label class="pm-label"><i class='bx bx-wallet'></i> Método de Pago <span class="pm-required">*</span></label>
                <div class="pm-select-wrap">
                    <select id="ap-metodo" class="pm-input pm-select">
                        <option value="">— Seleccionar —</option>
                        <option value="EFECTIVO">💵 Efectivo</option>
                        <option value="YAPE">📱 Yape</option>
                        <option value="PLIN">📱 Plin</option>
                        <option value="TRANSFERENCIA">🏦 Transferencia</option>
                        <option value="TARJETA">💳 Tarjeta</option>
                    </select>
                    <i class='bx bx-chevron-down pm-select-arrow'></i>
                </div>
                <span class="pm-field-error" id="ap-err-metodo"></span>
            </div>
        </div>
        <div class="pm-footer">
            <button class="pm-btn-cancel" id="btn-ap-cancel">Cancelar</button>
            <button class="pm-btn-submit" id="btn-ap-submit" style="background:linear-gradient(135deg,#065f46,#059669);">
                <span id="ap-submit-text" style="display:flex;align-items:center;gap:6px;"><i class='bx bx-check'></i> Registrar Pago</span>
                <span id="ap-submit-loader" style="display:none;align-items:center;gap:8px;"><div class="pm-spinner"></div> Registrando...</span>
            </button>
        </div>
    </div>
</div>

<!-- ===== MODAL REPROGRAMAR RESERVA ===== -->
<div id="modal-reprogramar" class="pm-overlay" style="display:none;" role="dialog" aria-modal="true">
    <div class="pm-modal" style="max-width:420px;">
        <div class="pm-header" style="background:linear-gradient(135deg,#1e3a5f,#0284c7);">
            <div class="pm-header-icon" style="background:rgba(255,255,255,0.15);">
                <i class='bx bx-calendar-edit' style="color:#fff;"></i>
            </div>
            <div>
                <h2 class="pm-title" id="rp-title" style="color:#fff;">Reprogramar Reserva</h2>
                <p class="pm-subtitle" id="rp-subtitle" style="color:rgba(255,255,255,0.8);">Selecciona el nuevo horario</p>
            </div>
            <button class="pm-close" id="btn-rp-close" style="color:#fff;"><i class='bx bx-x'></i></button>
        </div>
        <div class="pm-body">
            <!-- Info contexto -->
            <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:10px;padding:12px 16px;margin-bottom:18px;">
                <p style="font-size:11px;font-weight:700;color:#0369a1;letter-spacing:0.5px;margin-bottom:6px;">HORARIO ACTUAL</p>
                <p style="font-size:13px;font-weight:600;color:#0c4a6e;" id="rp-horario-actual">—</p>
            </div>
            <div class="pm-alert-error" id="rp-error-box" style="display:none;">
                <i class='bx bx-error-circle'></i>
                <span id="rp-error-msg">Error</span>
            </div>
            <div class="pm-field">
                <label class="pm-label"><i class='bx bx-calendar'></i> Nueva Fecha <span class="pm-required">*</span></label>
                <input type="date" id="rp-fecha" class="pm-input">
                <span class="pm-field-error" id="rp-err-fecha"></span>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
                <div class="pm-field">
                    <label class="pm-label"><i class='bx bx-time'></i> Nueva Hora Inicio <span class="pm-required">*</span></label>
                    <input type="time" id="rp-inicio" class="pm-input">
                    <span class="pm-field-error" id="rp-err-inicio"></span>
                </div>
                <div class="pm-field">
                    <label class="pm-label"><i class='bx bx-time-five'></i> Nueva Hora Fin <span class="pm-required">*</span></label>
                    <input type="time" id="rp-fin" class="pm-input">
                    <span class="pm-field-error" id="rp-err-fin"></span>
                </div>
            </div>
            <!-- Nota -->
            <div class="pm-field">
                <label class="pm-label"><i class='bx bx-note'></i> Motivo / Nota (Opcional)</label>
                <input type="text" id="rp-nota" class="pm-input" placeholder="Ej: Solicitud del cliente por agenda...">
            </div>
        </div>
        <div class="pm-footer">
            <button class="pm-btn-cancel" id="btn-rp-cancel">Cancelar</button>
            <button class="pm-btn-submit" id="btn-rp-submit" style="background:linear-gradient(135deg,#1e3a5f,#0284c7);">
                <span id="rp-submit-text" style="display:flex;align-items:center;gap:6px;"><i class='bx bx-calendar-check'></i> Reprogramar</span>
                <span id="rp-submit-loader" style="display:none;align-items:center;gap:8px;"><div class="pm-spinner"></div> Reprogramando...</span>
            </button>
        </div>
    </div>
</div>

<!-- ===== MODAL CANCELAR RESERVA ===== -->
<div id="modal-cancelar-reserva" class="pm-overlay" style="display:none;" role="dialog" aria-modal="true">
    <div class="pm-modal" style="max-width:440px;">
        <div class="pm-header" style="background:linear-gradient(135deg,#7f1d1d,#dc2626);">
            <div class="pm-header-icon" style="background:rgba(255,255,255,0.15);">
                <i class='bx bx-x-circle' style="color:#fff;"></i>
            </div>
            <div>
                <h2 class="pm-title" id="cr-title" style="color:#fff;">¿Cancelar Reserva?</h2>
                <p class="pm-subtitle" id="cr-subtitle" style="color:rgba(255,255,255,0.8);">Esta acción es irreversible</p>
            </div>
            <button class="pm-close" id="btn-cr-close" style="color:#fff;"><i class='bx bx-x'></i></button>
        </div>
        <div class="pm-body">
            <!-- Texto explicativo -->
            <div id="cr-info-box" style="background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:14px 16px;margin-bottom:16px;display:flex;gap:10px;align-items:flex-start;">
                <i class='bx bx-error' style="color:#ea580c;font-size:20px;flex-shrink:0;margin-top:1px;"></i>
                <div>
                    <p id="cr-info-texto" style="font-size:12px;color:#7c2d12;line-height:1.6;margin:0 0 4px;">Estás a punto de cancelar esta reserva.</p>
                    <p id="cr-info-reembolso" style="font-size:12px;color:#9a3412;font-weight:700;margin:0;display:none;">⚠️ La reserva tiene pagos registrados. Al cancelar, se generará un reembolso automático.</p>
                </div>
            </div>
            <div class="pm-alert-error" id="cr-error-box" style="display:none;">
                <i class='bx bx-error-circle'></i>
                <span id="cr-error-msg">Error</span>
            </div>
            <div class="pm-field">
                <label class="pm-label"><i class='bx bx-edit'></i> Motivo de Cancelación <span class="pm-required">*</span></label>
                <textarea id="cr-motivo" class="pm-input" rows="3" placeholder="Ej: El cliente llamó para cancelar por imprevistos..." style="resize:none;"></textarea>
                <span class="pm-field-error" id="cr-err-motivo"></span>
            </div>
        </div>
        <div class="pm-footer">
            <button class="pm-btn-cancel" id="btn-cr-cancel">No, Volver</button>
            <button class="pm-btn-submit" id="btn-cr-submit" style="background:linear-gradient(135deg,#7f1d1d,#dc2626);">
                <span id="cr-submit-text" style="display:flex;align-items:center;gap:6px;"><i class='bx bx-x-circle'></i> Sí, Cancelar Reserva</span>
                <span id="cr-submit-loader" style="display:none;align-items:center;gap:8px;"><div class="pm-spinner"></div> Cancelando...</span>
            </button>
        </div>
    </div>
</div>

<!-- ===== MODAL REEMBOLSO REQUERIDO ===== -->
<div id="modal-reembolso" class="pm-overlay" style="display:none; z-index:1000;" role="dialog" aria-modal="true">
    <div class="pm-modal" style="max-width:420px;">
        <div class="pm-header" style="background:linear-gradient(135deg,#78350f,#d97706);">
            <div class="pm-header-icon" style="background:rgba(255,255,255,0.15);">
                <i class='bx bx-money-withdraw' style="color:#fff;"></i>
            </div>
            <div>
                <h2 class="pm-title" style="color:#fff;">💰 Reembolso Requerido</h2>
                <p class="pm-subtitle" style="color:rgba(255,255,255,0.8);">Acción requerida tras la reprogramación</p>
            </div>
        </div>

        <!-- PASO 1: Resumen de montos -->
        <div id="rf-info-section">
            <div class="pm-body">
                <div style="background:#fffbeb;border:1px solid #fcd34d;border-radius:12px;padding:18px;">
                    <p style="font-size:13px;color:#92400e;margin-bottom:14px;line-height:1.6;">
                        ✅ <strong>La reserva se reprogramó con éxito.</strong><br>
                        El nuevo costo es inferior al monto ya pagado por el cliente.
                    </p>
                    <div style="display:flex;justify-content:space-between;font-size:13px;color:#78350f;padding:6px 0;border-top:1px solid #fef3c7;">
                        <span>Nuevo costo de la reserva:</span>
                        <strong id="rf-nuevo-total">S/ 0.00</strong>
                    </div>
                    <div style="display:flex;justify-content:space-between;font-size:13px;color:#78350f;padding:6px 0;border-top:1px solid #fef3c7;">
                        <span>El cliente ya había pagado:</span>
                        <strong id="rf-ya-pagado">S/ 0.00</strong>
                    </div>
                    <div style="border-top:2px dashed #fcd34d;margin:12px 0;"></div>
                    <div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;">
                        <span style="font-size:14px;font-weight:700;color:#7c2d12;">💸 Se debe reembolsar:</span>
                        <strong id="rf-monto-reembolso" style="font-size:22px;color:#dc2626;">S/ 0.00</strong>
                    </div>
                </div>
            </div>
            <div class="pm-footer">
                <button class="pm-btn-cancel" id="btn-rf-recordar">⏰ Recordar Más Tarde</button>
                <button class="pm-btn-submit" id="btn-rf-registrar" style="background:linear-gradient(135deg,#92400e,#d97706);">
                    <i class='bx bx-money-withdraw'></i> Registrar Reembolso
                </button>
            </div>
        </div>

        <!-- PASO 2: Formulario de confirmación -->
        <div id="rf-form-section" style="display:none;">
            <div class="pm-body">
                <div class="pm-alert-error" id="rf-error-box" style="display:none;">
                    <i class='bx bx-error-circle'></i>
                    <span id="rf-error-msg">Error</span>
                </div>
                <div class="pm-field">
                    <label class="pm-label"><i class='bx bx-money'></i> Monto a Reembolsar</label>
                    <input type="text" id="rf-monto-display" class="pm-input" readonly
                        style="background:#f1f5f9;color:#64748b;font-weight:700;cursor:not-allowed;">
                </div>
                <div class="pm-field">
                    <label class="pm-label"><i class='bx bx-wallet'></i> Método de Reembolso <span class="pm-required">*</span></label>
                    <div class="pm-select-wrap">
                        <select id="rf-metodo" class="pm-input pm-select">
                            <option value="">— Seleccionar —</option>
                            <option value="EFECTIVO">💵 Efectivo</option>
                            <option value="YAPE">📱 Yape</option>
                            <option value="PLIN">📱 Plin</option>
                            <option value="TRANSFERENCIA">🏦 Transferencia</option>
                            <option value="TARJETA">💳 Tarjeta</option>
                        </select>
                        <i class='bx bx-chevron-down pm-select-arrow'></i>
                    </div>
                    <span class="pm-field-error" id="rf-err-metodo"></span>
                </div>
                <div class="pm-field">
                    <label class="pm-label"><i class='bx bx-note'></i> Nota (Opcional)</label>
                    <textarea id="rf-nota" class="pm-input" rows="2"
                        placeholder="Ej: Reembolso en efectivo por cambio a horario más económico..."
                        style="resize:none;"></textarea>
                </div>
            </div>
            <div class="pm-footer">
                <button class="pm-btn-cancel" id="btn-rf-form-cancel"><i class='bx bx-arrow-back'></i> Volver</button>
                <button class="pm-btn-submit" id="btn-rf-confirm" style="background:linear-gradient(135deg,#92400e,#d97706);">
                    <span id="rf-confirm-text" style="display:flex;align-items:center;gap:6px;"><i class='bx bx-check'></i> Confirmar y Registrar</span>
                    <span id="rf-confirm-loader" style="display:none;align-items:center;gap:8px;"><div class="pm-spinner"></div> Registrando...</span>
                </button>
            </div>
        </div>

    </div>
</div>

<!-- ===== TOAST RESERVAS ===== -->
<div class="nc-toast" id="res-toast" style="display:none;">
    <i class='bx bx-check-circle'></i>
    <span id="res-toast-msg">Operación exitosa</span>
</div>
`;
