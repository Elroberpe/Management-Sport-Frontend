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
            <!-- Placeholder: no existe endpoint de historial de cambios aún.
                 Reemplazar este bloque cuando el backend lo implemente. -->
            <div style="text-align:center; padding:32px 20px; color:#94a3b8;">
                <i class='bx bx-history' style="font-size:2.5rem; opacity:0.25; display:block; margin-bottom:10px;"></i>
                <p style="font-size:13px; margin:0; font-weight:600;">Historial de cambios</p>
                <p style="font-size:12px; margin:6px 0 0; opacity:0.7;">Próximamente disponible.</p>
            </div>
        </div>
    </div>
`;

export const reservaPagoFormTemplate = () => `
    <div class="modal-shell-field">
        <label class="modal-shell-label"><i class='bx bx-money'></i> Monto <span style="color:#ef4444;">*</span></label>
        <input type="number" id="ap-monto" class="modal-shell-input" placeholder="0.00" min="0.01" step="0.01">
        <span class="modal-shell-error-text" id="ap-monto-err"></span>
        <!-- Indicador de saldo pendiente — se muestra/oculta desde abrirModalPago() -->
        <div id="ap-saldo-info" style="display:none; margin-top:6px; padding:6px 10px; background:#f0fdf4; border:1px solid #bbf7d0; border-radius:8px; font-size:12px; color:#059669; align-items:center; gap:6px;">
            <i class='bx bx-info-circle'></i>
            Saldo pendiente de la reserva: <strong id="ap-saldo-val">S/ 0.00</strong>
        </div>
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

/* ─────────────────────────────────────────────────────────────────────────
   TEMPLATE: CANCELAR RESERVA
   Recibe { reserva, necesitaReembolso, montoAReembolsar }
───────────────────────────────────────────────────────────────────────── */
export const reservaCancelarTemplate = ({ reserva, necesitaReembolso, montoAReembolsar }) => `
    <div style="display:flex; flex-direction:column; gap:16px;">

        <!-- Alerta de advertencia -->
        <div style="display:flex; align-items:flex-start; gap:12px; background:#fff7ed; border:1.5px solid #fed7aa; border-radius:12px; padding:14px 16px;">
            <i class='bx bx-error' style="font-size:1.6rem; color:#ea580c; flex-shrink:0; margin-top:1px;"></i>
            <div>
                <p style="margin:0 0 4px; font-weight:700; color:#9a3412; font-size:14px;">Esta acción no se puede deshacer</p>
                <p style="margin:0; font-size:13px; color:#c2410c;">
                    ${necesitaReembolso
                        ? `Se generará un reembolso de <strong>S/ ${Number(montoAReembolsar).toFixed(2)}</strong> al cliente.`
                        : 'La reserva quedará marcada como <strong>CANCELADA</strong>.'}
                </p>
            </div>
        </div>

        <!-- Resumen de la reserva -->
        <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:14px 16px;">
            <p style="margin:0 0 10px; font-size:11px; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:0.05em;">Reserva a cancelar</p>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; font-size:13px;">
                <div>
                    <span style="display:block; color:#64748b; font-size:11px;">Cliente</span>
                    <strong style="color:#1e293b;">${reserva.nombreCliente || '—'}</strong>
                </div>
                <div>
                    <span style="display:block; color:#64748b; font-size:11px;">Cancha</span>
                    <strong style="color:#1e293b;">${reserva.nombreCancha || '—'}</strong>
                </div>
                <div>
                    <span style="display:block; color:#64748b; font-size:11px;">Fecha</span>
                    <strong style="color:#1e293b;">${reserva.fecha || '—'}</strong>
                </div>
                <div>
                    <span style="display:block; color:#64748b; font-size:11px;">Horario</span>
                    <strong style="color:#1e293b;">${(reserva.horaInicio||'').substring(0,5)} – ${(reserva.horaFin||'').substring(0,5)}</strong>
                </div>
            </div>
        </div>

        <!-- Motivo (obligatorio) -->
        <div class="modal-shell-field" style="margin-bottom:0;">
            <label class="modal-shell-label">
                <i class='bx bx-message-square-detail'></i> Motivo de cancelación <span style="color:#ef4444;">*</span>
            </label>
            <textarea id="cx-motivo" class="modal-shell-input" rows="3"
                placeholder="Por favor, describe el motivo de la cancelación..."
                style="resize:vertical; min-height:72px; font-family:inherit;"></textarea>
            <span class="modal-shell-error-text" id="cx-motivo-err"></span>
        </div>

        <!-- Método de reembolso (solo si hay reembolso) -->
        ${necesitaReembolso ? `
        <div class="modal-shell-field" style="margin-bottom:0;">
            <div style="display:flex; align-items:center; gap:8px; background:#f0fdf4; border:1.5px solid #bbf7d0; border-radius:10px; padding:10px 14px; margin-bottom:10px;">
                <i class='bx bx-money-withdraw' style="color:#059669; font-size:1.2rem;"></i>
                <span style="font-size:13px; color:#166534;">
                    Reembolso a devolver: <strong>S/ ${Number(montoAReembolsar).toFixed(2)}</strong>
                </span>
            </div>
            <label class="modal-shell-label">
                <i class='bx bx-wallet'></i> Método de devolución <span style="color:#ef4444;">*</span>
            </label>
            <select id="cx-metodo-reembolso" class="modal-shell-input">
                <option value="">— Seleccionar método —</option>
                <option value="EFECTIVO">💵 Efectivo</option>
                <option value="YAPE">📱 Yape</option>
                <option value="PLIN">📱 Plin</option>
                <option value="TRANSFERENCIA">🏦 Transferencia Bancaria</option>
                <option value="TARJETA">💳 Tarjeta</option>
            </select>
            <span class="modal-shell-error-text" id="cx-metodo-err"></span>
        </div>
        ` : ''}
    </div>
`;

/* ─────────────────────────────────────────────────────────────────────────
   TEMPLATE: REEMBOLSO MANUAL
   Recibe { credito } — crédito disponible (Math.abs(saldoPendiente))
───────────────────────────────────────────────────────────────────────── */
export const reservaReembolsoTemplate = ({ credito }) => `
    <div style="display:flex; flex-direction:column; gap:16px;">

        <!-- Info de crédito disponible -->
        <div style="display:flex; align-items:center; gap:12px; background:#f0fdf4; border:1.5px solid #bbf7d0; border-radius:12px; padding:14px 16px;">
            <i class='bx bx-badge-check' style="font-size:1.8rem; color:#059669; flex-shrink:0;"></i>
            <div>
                <p style="margin:0 0 2px; font-weight:700; color:#166534; font-size:14px;">Crédito disponible</p>
                <p style="margin:0; font-size:13px; color:#15803d;">
                    Esta reserva tiene un saldo a favor del cliente de <strong>S/ ${Number(credito).toFixed(2)}</strong>.
                </p>
            </div>
        </div>

        <!-- Monto a reembolsar -->
        <div class="modal-shell-field" style="margin-bottom:0;">
            <label class="modal-shell-label">
                <i class='bx bx-money'></i> Monto a devolver <span style="color:#ef4444;">*</span>
            </label>
            <input type="number" id="rm-monto" class="modal-shell-input"
                value="${Number(credito).toFixed(2)}"
                min="0.01" max="${Number(credito).toFixed(2)}" step="0.01"
                placeholder="0.00">
            <span class="modal-shell-error-text" id="rm-monto-err"></span>
            <div style="font-size:11px; color:#94a3b8; margin-top:4px;">
                Máximo: S/ ${Number(credito).toFixed(2)}
            </div>
        </div>

        <!-- Método de pago -->
        <div class="modal-shell-field" style="margin-bottom:0;">
            <label class="modal-shell-label">
                <i class='bx bx-wallet'></i> Método de devolución <span style="color:#ef4444;">*</span>
            </label>
            <select id="rm-metodo" class="modal-shell-input">
                <option value="">— Seleccionar método —</option>
                <option value="EFECTIVO">💵 Efectivo</option>
                <option value="YAPE">📱 Yape</option>
                <option value="PLIN">📱 Plin</option>
                <option value="TRANSFERENCIA">🏦 Transferencia Bancaria</option>
                <option value="TARJETA">💳 Tarjeta</option>
            </select>
            <span class="modal-shell-error-text" id="rm-metodo-err"></span>
        </div>

        <!-- Nota opcional -->
        <div class="modal-shell-field" style="margin-bottom:0;">
            <label class="modal-shell-label">
                <i class='bx bx-note'></i> Nota adicional
                <span style="color:#94a3b8; font-size:11px; font-weight:400;">(opcional)</span>
            </label>
            <textarea id="rm-nota" class="modal-shell-input" rows="2"
                placeholder="Ej: Reembolso autorizado por gerencia..."
                style="resize:vertical; min-height:56px; font-family:inherit;"></textarea>
        </div>
    </div>
`;
