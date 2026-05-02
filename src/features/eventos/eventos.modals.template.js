// src/features/eventos/eventos.modals.template.js
// HTML de los 5 formularios del módulo de Eventos

// ---------------------------------------------------------------------------
// Helpers reutilizados en múltiples formularios
// ---------------------------------------------------------------------------
const TIPOS_EVENTO = `
    <option value="TORNEO">🏆 Torneo</option>
    <option value="CORPORATIVO">🏢 Corporativo</option>
    <option value="RELAMPAGO">⚡ Relámpago</option>
`;

const METODOS_PAGO = `
    <option value="EFECTIVO">Efectivo</option>
    <option value="TRANSFERENCIA">Transferencia</option>
    <option value="TARJETA">Tarjeta</option>
    <option value="YAPE">Yape</option>
    <option value="PLIN">Plin</option>
`;

/**
 * Una fila de horario para el constructor dinámico.
 * @param {number} index - índice para IDs únicos
 */
export function horarioRowTemplate(index = 0) {
    return `
    <div class="horario-row" data-idx="${index}" style="display:grid; grid-template-columns:2fr 1.5fr 1fr 1fr auto; gap:8px; align-items:end; margin-bottom:8px;">
        <div class="modal-shell-field" style="margin:0;">
            <label class="modal-shell-label" style="font-size:11px;">Cancha</label>
            <select class="modal-shell-input hc-cancha" style="padding:6px 8px;">
                <option value="">Cargando...</option>
            </select>
        </div>
        <div class="modal-shell-field" style="margin:0;">
            <label class="modal-shell-label" style="font-size:11px;">Fecha</label>
            <input type="date" class="modal-shell-input hc-fecha" style="padding:6px 8px;">
        </div>
        <div class="modal-shell-field" style="margin:0;">
            <label class="modal-shell-label" style="font-size:11px;">Inicio</label>
            <input type="time" class="modal-shell-input hc-inicio" style="padding:6px 8px;">
        </div>
        <div class="modal-shell-field" style="margin:0;">
            <label class="modal-shell-label" style="font-size:11px;">Fin</label>
            <input type="time" class="modal-shell-input hc-fin" style="padding:6px 8px;">
        </div>
        <button type="button" class="hc-remove" title="Eliminar horario"
            style="height:36px; width:36px; border-radius:8px; border:1px solid #fca5a5;
                   background:#fef2f2; color:#dc2626; cursor:pointer; font-size:16px;
                   display:flex; align-items:center; justify-content:center; margin-top:20px; flex-shrink:0;">
            <i class='bx bx-x'></i>
        </button>
    </div>
    `;
}

// ---------------------------------------------------------------------------
// Modal A: Crear Evento
// ---------------------------------------------------------------------------
export function eventoNewFormTemplate() {
    return `
    <!-- Fila: Nombre + Tipo -->
    <div style="display:grid; grid-template-columns:1.5fr 1fr; gap:12px;">
        <div class="modal-shell-field">
            <label class="modal-shell-label" for="ne-nombre">
                <i class='bx bx-calendar-event'></i> Nombre del Evento <span style="color:#ef4444;">*</span>
            </label>
            <input type="text" id="ne-nombre" class="modal-shell-input" placeholder="Ej: Torneo Verano 2024">
            <span class="modal-shell-error-text" id="ne-nombre-err"></span>
        </div>
        <div class="modal-shell-field">
            <label class="modal-shell-label" for="ne-tipo">
                <i class='bx bx-category'></i> Tipo <span style="color:#ef4444;">*</span>
            </label>
            <select id="ne-tipo" class="modal-shell-input">${TIPOS_EVENTO}</select>
        </div>
    </div>

    <!-- Fila: Cliente + Sucursal -->
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
        <div class="modal-shell-field">
            <label class="modal-shell-label" for="ne-cliente">
                <i class='bx bx-user'></i> Cliente <span style="color:#ef4444;">*</span>
            </label>
            <select id="ne-cliente" class="modal-shell-input">
                <option value="">⏳ Cargando clientes...</option>
            </select>
            <span class="modal-shell-error-text" id="ne-cliente-err"></span>
        </div>
        <div class="modal-shell-field">
            <label class="modal-shell-label" for="ne-sucursal">
                <i class='bx bx-map-pin'></i> Sucursal <span style="color:#ef4444;">*</span>
            </label>
            <select id="ne-sucursal" class="modal-shell-input">
                <option value="">⏳ Cargando...</option>
            </select>
            <span class="modal-shell-error-text" id="ne-sucursal-err"></span>
        </div>
    </div>

    <!-- Fila: Fecha Inicio + Fecha Fin + Monto -->
    <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px;">
        <div class="modal-shell-field">
            <label class="modal-shell-label" for="ne-fecha-inicio">
                <i class='bx bx-calendar'></i> Fecha Inicio <span style="color:#ef4444;">*</span>
            </label>
            <input type="date" id="ne-fecha-inicio" class="modal-shell-input">
            <span class="modal-shell-error-text" id="ne-fecha-inicio-err"></span>
        </div>
        <div class="modal-shell-field">
            <label class="modal-shell-label" for="ne-fecha-fin">
                <i class='bx bx-calendar-check'></i> Fecha Fin <span style="color:#ef4444;">*</span>
            </label>
            <input type="date" id="ne-fecha-fin" class="modal-shell-input">
        </div>
        <div class="modal-shell-field">
            <label class="modal-shell-label" for="ne-monto">
                <i class='bx bx-money'></i> Costo Total <span style="color:#ef4444;">*</span>
            </label>
            <input type="number" id="ne-monto" class="modal-shell-input" placeholder="0.00" min="0" step="0.01">
            <span class="modal-shell-error-text" id="ne-monto-err"></span>
        </div>
    </div>

    <!-- Constructor de Horarios -->
    <div class="modal-shell-field">
        <label class="modal-shell-label">
            <i class='bx bx-time'></i> Horarios <span style="color:#ef4444;">*</span>
        </label>
        <div id="ne-horarios-container">
            <!-- Las filas se inyectan dinámicamente -->
        </div>
        <button type="button" id="ne-btn-add-horario"
            style="margin-top:8px; padding:6px 14px; border-radius:8px; border:1px dashed #94a3b8;
                   background:transparent; color:#64748b; cursor:pointer; font-size:13px; font-weight:600;
                   display:flex; align-items:center; gap:6px; transition:all 0.2s;">
            <i class='bx bx-plus'></i> Añadir Horario
        </button>
        <span class="modal-shell-error-text" id="ne-horarios-err"></span>
    </div>
    `;
}

// ---------------------------------------------------------------------------
// Modal B: Editar Evento (solo metadatos, sin horarios)
// ---------------------------------------------------------------------------
export function eventoEditFormTemplate() {
    return `
    <!-- Fila: Nombre + Tipo -->
    <div style="display:grid; grid-template-columns:1.5fr 1fr; gap:12px;">
        <div class="modal-shell-field">
            <label class="modal-shell-label" for="ee-nombre">
                <i class='bx bx-calendar-event'></i> Nombre del Evento <span style="color:#ef4444;">*</span>
            </label>
            <input type="text" id="ee-nombre" class="modal-shell-input" placeholder="Nombre del evento">
            <span class="modal-shell-error-text" id="ee-nombre-err"></span>
        </div>
        <div class="modal-shell-field">
            <label class="modal-shell-label" for="ee-tipo">
                <i class='bx bx-category'></i> Tipo
            </label>
            <select id="ee-tipo" class="modal-shell-input">${TIPOS_EVENTO}</select>
        </div>
    </div>

    <!-- Descripción -->
    <div class="modal-shell-field">
        <label class="modal-shell-label" for="ee-descripcion">
            <i class='bx bx-text'></i> Descripción (Opcional)
        </label>
        <textarea id="ee-descripcion" class="modal-shell-input" rows="2"
            placeholder="Notas adicionales sobre el evento..."
            style="resize:vertical; min-height:60px; font-family:inherit;"></textarea>
    </div>

    <!-- Fila: Fecha Inicio + Fecha Fin + Monto -->
    <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px;">
        <div class="modal-shell-field">
            <label class="modal-shell-label" for="ee-fecha-inicio">
                <i class='bx bx-calendar'></i> Fecha Inicio
            </label>
            <input type="date" id="ee-fecha-inicio" class="modal-shell-input">
        </div>
        <div class="modal-shell-field">
            <label class="modal-shell-label" for="ee-fecha-fin">
                <i class='bx bx-calendar-check'></i> Fecha Fin
            </label>
            <input type="date" id="ee-fecha-fin" class="modal-shell-input">
        </div>
        <div class="modal-shell-field">
            <label class="modal-shell-label" for="ee-monto">
                <i class='bx bx-money'></i> Costo Total
            </label>
            <input type="number" id="ee-monto" class="modal-shell-input" placeholder="0.00" min="0" step="0.01">
        </div>
    </div>
    `;
}

// ---------------------------------------------------------------------------
// Modal C: Reprogramar Evento
// ---------------------------------------------------------------------------
export function eventoReprogramarTemplate() {
    return `
    <p style="color:#64748b; font-size:13px; margin-bottom:12px;">
        <i class='bx bx-info-circle' style="color:#f59e0b;"></i>
        Define los nuevos horarios. La cantidad debe coincidir con los horarios actuales del evento.
    </p>

    <!-- Constructor de Horarios -->
    <div class="modal-shell-field">
        <label class="modal-shell-label">
            <i class='bx bx-time'></i> Nuevos Horarios <span style="color:#ef4444;">*</span>
        </label>
        <div id="rep-horarios-container">
            <!-- Las filas se inyectan dinámicamente -->
        </div>
        <button type="button" id="rep-btn-add-horario"
            style="margin-top:8px; padding:6px 14px; border-radius:8px; border:1px dashed #94a3b8;
                   background:transparent; color:#64748b; cursor:pointer; font-size:13px; font-weight:600;
                   display:flex; align-items:center; gap:6px; transition:all 0.2s;">
            <i class='bx bx-plus'></i> Añadir Horario
        </button>
        <span class="modal-shell-error-text" id="rep-horarios-err"></span>
    </div>
    `;
}

// ---------------------------------------------------------------------------
// Modal D: Añadir Pago
// ---------------------------------------------------------------------------
export function eventoPagoTemplate() {
    return `
    <!-- Info del saldo -->
    <div id="evt-pago-info" style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:10px;
         padding:12px 16px; margin-bottom:16px; display:flex; align-items:center; gap:10px;">
        <i class='bx bx-wallet' style="color:#16a34a; font-size:20px;"></i>
        <div>
            <div style="font-size:11px; color:#64748b; text-transform:uppercase; font-weight:700;">Saldo Pendiente</div>
            <div id="evt-pago-saldo" style="font-size:20px; font-weight:800; color:#16a34a;">S/ 0.00</div>
        </div>
    </div>

    <!-- Fila: Monto + Método -->
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
        <div class="modal-shell-field">
            <label class="modal-shell-label" for="ep-monto">
                <i class='bx bx-money'></i> Monto a Pagar <span style="color:#ef4444;">*</span>
            </label>
            <input type="number" id="ep-monto" class="modal-shell-input" placeholder="0.00" min="0.01" step="0.01">
            <span class="modal-shell-error-text" id="ep-monto-err"></span>
        </div>
        <div class="modal-shell-field">
            <label class="modal-shell-label" for="ep-metodo">
                <i class='bx bx-credit-card'></i> Método de Pago <span style="color:#ef4444;">*</span>
            </label>
            <select id="ep-metodo" class="modal-shell-input">${METODOS_PAGO}</select>
        </div>
    </div>
    `;
}

// ---------------------------------------------------------------------------
// Modal E: Cancelar Evento (crítico — diseño danger)
// ---------------------------------------------------------------------------
export function eventoCancelarTemplate() {
    return `
    <!-- Advertencia crítica -->
    <div style="background:#fef2f2; border:1px solid #fca5a5; border-radius:10px;
         padding:12px 16px; margin-bottom:16px; display:flex; gap:10px; align-items:flex-start;">
        <i class='bx bx-error' style="color:#dc2626; font-size:22px; flex-shrink:0; margin-top:2px;"></i>
        <div>
            <strong style="color:#dc2626; font-size:13px;">Acción irreversible</strong>
            <p style="color:#7f1d1d; font-size:12px; margin:4px 0 0;">
                Esta acción cancelará el evento y <strong>todas sus reservas asociadas</strong>.
                No se puede deshacer.
            </p>
        </div>
    </div>

    <!-- Info de pagos recibidos -->
    <div id="evt-cancel-info" style="background:#fff7ed; border:1px solid #fed7aa; border-radius:10px;
         padding:10px 16px; margin-bottom:16px; font-size:13px; color:#92400e;">
        <i class='bx bx-info-circle'></i>
        Monto pagado por el cliente: <strong id="evt-cancel-pagado">S/ 0.00</strong>
    </div>

    <!-- Motivo -->
    <div class="modal-shell-field">
        <label class="modal-shell-label" for="ec-motivo">
            <i class='bx bx-message-square-detail'></i> Motivo de Cancelación <span style="color:#ef4444;">*</span>
        </label>
        <textarea id="ec-motivo" class="modal-shell-input" rows="2"
            placeholder="Describe el motivo de la cancelación..."
            style="resize:vertical; min-height:60px; font-family:inherit;"></textarea>
        <span class="modal-shell-error-text" id="ec-motivo-err"></span>
    </div>

    <!-- Fila: Monto Reembolso + Nota -->
    <div style="display:grid; grid-template-columns:1fr 1.5fr; gap:12px;">
        <div class="modal-shell-field">
            <label class="modal-shell-label" for="ec-reembolso">
                <i class='bx bx-money-withdraw'></i> Monto a Reembolsar
            </label>
            <input type="number" id="ec-reembolso" class="modal-shell-input" placeholder="0.00" min="0" step="0.01" value="0">
            <span class="modal-shell-error-text" id="ec-reembolso-err"></span>
        </div>
        <div class="modal-shell-field">
            <label class="modal-shell-label" for="ec-nota">
                <i class='bx bx-note'></i> Nota del Reembolso (Opcional)
            </label>
            <input type="text" id="ec-nota" class="modal-shell-input" placeholder="Ej: Devolución a cuenta BCP">
        </div>
    </div>
    `;
}
