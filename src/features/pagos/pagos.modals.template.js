export const pagosModalsTemplate = () => `

    <!-- ═══════════════════════════════════════════════
         MODAL 1 — VER DETALLE DEL PAGO (solo lectura)
    ═══════════════════════════════════════════════ -->
    <div id="modal-detalle-pago" class="modal-shell-overlay" style="display:none;" role="dialog" aria-modal="true">
        <div class="modal-shell-container" style="max-width:560px;">

            <!-- Header -->
            <div class="modal-shell-header">
                <div class="modal-shell-icon" style="background:#eff6ff; color:#1d4ed8;">
                    <i class='bx bx-receipt'></i>
                </div>
                <div class="modal-shell-title-group">
                    <h2 class="modal-shell-title" id="dp-title">Detalle de Transacción #—</h2>
                    <p class="modal-shell-subtitle" style="display:flex; align-items:center; gap:8px; margin:4px 0 0;">
                        <span id="dp-estado-badge"></span>
                    </p>
                </div>
                <button class="modal-shell-close" id="btn-dp-close"><i class='bx bx-x'></i></button>
            </div>

            <!-- Body -->
            <div class="modal-shell-body">

                <!-- Loading -->
                <div id="dp-loading" style="text-align:center; padding:40px 20px;">
                    <div class="spinner-circle" style="width:28px;height:28px;margin:0 auto 12px;"></div>
                    <p style="color:#94a3b8;font-size:13px;">Cargando detalles...</p>
                </div>

                <!-- Contenido -->
                <div id="dp-content" style="display:none;">

                    <!-- Bloque financiero destacado -->
                    <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:14px; padding:20px; margin-bottom:20px; display:flex; justify-content:space-between; align-items:flex-start; gap:16px; flex-wrap:wrap;">
                        <div>
                            <p style="font-size:11px;font-weight:700;color:#94a3b8;letter-spacing:0.8px;text-transform:uppercase;margin-bottom:6px;">Tipo de Transacción</p>
                            <p id="dp-tipo" style="margin-bottom:14px;font-size:13px;font-weight:600;color:#1e293b;">—</p>

                            <p style="font-size:11px;font-weight:700;color:#94a3b8;letter-spacing:0.8px;text-transform:uppercase;margin-bottom:6px;">Método de Pago</p>
                            <p id="dp-metodo" style="margin-bottom:14px;font-size:13px;font-weight:600;color:#1e293b;">—</p>

                            <p style="font-size:11px;font-weight:700;color:#94a3b8;letter-spacing:0.8px;text-transform:uppercase;margin-bottom:6px;">Fecha y Hora</p>
                            <p id="dp-fecha" style="font-size:13px;font-weight:600;color:#1e293b;">—</p>
                        </div>
                        <div style="text-align:right; flex-shrink:0;">
                            <p style="font-size:11px;font-weight:700;color:#94a3b8;letter-spacing:1px;margin-bottom:4px;">MONTO</p>
                            <h2 id="dp-monto" style="font-size:30px;font-weight:900;margin:0;font-family:var(--font-heading);"></h2>
                        </div>
                    </div>

                    <!-- Sección: Origen y Contexto -->
                    <div style="margin-bottom:20px;">
                        <p style="font-size:11px;font-weight:800;color:#94a3b8;letter-spacing:1px;text-transform:uppercase;margin-bottom:12px;border-bottom:1px solid #e2e8f0;padding-bottom:8px;">Origen y Contexto</p>
                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px 20px;">
                            <div>
                                <p style="font-size:11px;font-weight:700;color:#94a3b8;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.5px;">Origen</p>
                                <p id="dp-origen" style="font-size:13px;font-weight:600;color:#1e293b;">—</p>
                            </div>
                            <div id="dp-cliente-wrap">
                                <p style="font-size:11px;font-weight:700;color:#94a3b8;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.5px;">Cliente Asociado</p>
                                <p id="dp-cliente" style="font-size:13px;font-weight:600;color:#1e293b;">—</p>
                            </div>
                            <div id="dp-registrado-wrap">
                                <p style="font-size:11px;font-weight:700;color:#94a3b8;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.5px;">Registrado por</p>
                                <p id="dp-registrado" style="font-size:13px;font-weight:600;color:#1e293b;">—</p>
                            </div>
                        </div>
                    </div>

                    <!-- Sección: Nota (condicional) -->
                    <div id="dp-nota-wrap" style="margin-bottom:20px;">
                        <p style="font-size:11px;font-weight:800;color:#94a3b8;letter-spacing:1px;text-transform:uppercase;margin-bottom:12px;border-bottom:1px solid #e2e8f0;padding-bottom:8px;">Información Adicional</p>
                        <p style="font-size:11px;font-weight:700;color:#94a3b8;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.5px;">Nota de la Transacción</p>
                        <p id="dp-nota" style="font-size:13px;font-weight:500;color:#475569; background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:10px 14px;">—</p>
                    </div>

                    <!-- Sección: Anulación (condicional) -->
                    <div id="dp-anulacion-section" style="display:none; background:#fef2f2; border:1px solid #fecaca; border-radius:12px; padding:16px;">
                        <p style="font-size:11px;font-weight:800;color:#dc2626;letter-spacing:1px;margin-bottom:12px;text-transform:uppercase;">Detalles de la Anulación</p>
                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px 20px;">
                            <div>
                                <p style="font-size:11px;font-weight:700;color:#b91c1c;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.5px;">Fecha de Anulación</p>
                                <p id="dp-fecha-anulacion" style="font-size:13px;font-weight:600;color:#7f1d1d;">—</p>
                            </div>
                            <div>
                                <p style="font-size:11px;font-weight:700;color:#b91c1c;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.5px;">Anulado por</p>
                                <p id="dp-anulado-por" style="font-size:13px;font-weight:600;color:#7f1d1d;">—</p>
                            </div>
                            <div style="grid-column:1/-1;">
                                <p style="font-size:11px;font-weight:700;color:#b91c1c;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.5px;">Motivo de la Anulación</p>
                                <p id="dp-motivo-anulacion" style="font-size:13px;font-weight:500;color:#7f1d1d; background:rgba(255,255,255,0.6); border:1px solid #fecaca; border-radius:10px; padding:10px 14px;">—</p>
                            </div>
                        </div>
                    </div>

                </div><!-- /dp-content -->
            </div><!-- /modal-shell-body -->

            <!-- Footer -->
            <div class="modal-shell-footer" id="dp-footer">
                <button class="modal-shell-btn modal-shell-btn-secondary" id="btn-dp-cerrar">Cerrar</button>
                <button id="btn-dp-imprimir" class="modal-shell-btn modal-shell-btn-secondary">
                    <i class='bx bx-printer'></i> Imprimir Recibo
                </button>
                <button id="btn-dp-anular" class="modal-shell-btn modal-shell-btn-danger" style="display:none;">
                    <i class='bx bx-block'></i> Anular Pago
                </button>
            </div>

        </div>
    </div>

    <!-- ═══════════════════════════════════════════════
         MODAL 2 — ANULAR PAGO (confirmación)
    ═══════════════════════════════════════════════ -->
    <div id="modal-anular-pago" class="modal-shell-overlay" style="display:none;" role="dialog" aria-modal="true">
        <div class="modal-shell-container" style="max-width:460px;">

            <!-- Header -->
            <div class="modal-shell-header">
                <div class="modal-shell-icon" style="background:#fef2f2; color:#dc2626;">
                    <i class='bx bx-block'></i>
                </div>
                <div class="modal-shell-title-group">
                    <h2 class="modal-shell-title" id="anular-titulo">¿Anular este pago?</h2>
                    <p class="modal-shell-subtitle" id="anular-subtitle">Pago #—</p>
                </div>
                <button class="modal-shell-close" id="btn-anular-close"><i class='bx bx-x'></i></button>
            </div>

            <!-- Body -->
            <div class="modal-shell-body">

                <!-- Error box -->
                <div class="modal-shell-alert-error" id="anular-error-box" style="display:none;">
                    <i class='bx bx-error-circle'></i>
                    <span id="anular-error-msg"></span>
                </div>

                <!-- Advertencia -->
                <div style="background:#fff7ed; border:1px solid #fed7aa; border-radius:10px; padding:14px 16px; margin-bottom:20px; display:flex; gap:10px; align-items:flex-start;">
                    <i class='bx bx-error' style="color:#ea580c; font-size:20px; flex-shrink:0; margin-top:1px;"></i>
                    <p style="font-size:12px; color:#7c2d12; line-height:1.6; margin:0;">
                        <strong>Esta acción es irreversible.</strong> El monto se descontará del total pagado de la reserva o evento asociado y el saldo pendiente se recalculará automáticamente.
                    </p>
                </div>

                <!-- Campo motivo -->
                <div class="modal-shell-field">
                    <label class="modal-shell-label" for="anular-motivo">
                        <i class='bx bx-edit'></i> Motivo de Anulación <span style="color:#ef4444;">*</span>
                    </label>
                    <textarea id="anular-motivo" class="modal-shell-input" rows="3"
                        placeholder="Ej: Pago duplicado por error del sistema..."
                        style="resize:none; font-family:inherit;"></textarea>
                    <span class="modal-shell-error-text" id="anular-err-motivo"></span>
                </div>

            </div><!-- /modal-shell-body -->

            <!-- Footer -->
            <div class="modal-shell-footer">
                <button class="modal-shell-btn modal-shell-btn-secondary" id="btn-anular-cancel">Cancelar</button>
                <button class="modal-shell-btn modal-shell-btn-danger" id="btn-anular-submit">
                    <span id="anular-submit-text" style="display:flex; align-items:center; gap:6px;">
                        <i class='bx bx-block'></i> Sí, Anular Pago
                    </span>
                    <span id="anular-submit-loader" style="display:none; align-items:center; gap:8px;">
                        <div class="modal-shell-spinner"></div> Anulando...
                    </span>
                </button>
            </div>

        </div>
    </div>
`;