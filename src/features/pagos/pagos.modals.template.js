export const pagosModalsTemplate = () => `
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
`;