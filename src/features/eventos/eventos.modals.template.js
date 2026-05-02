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

export function eventoNewFormPaso1Template(rol = 'superadmin') {
    return `
    <p style="color:#64748b; font-size:13px; margin-bottom:16px;">
        Paso 1 de 2: Define la información general del evento antes de asignar horarios.
    </p>

    <!-- Fila: Nombre + Tipo -->
    <div style="display:grid; grid-template-columns:1.5fr 1fr; gap:12px;">
        <div class="modal-shell-field">
            <label class="modal-shell-label" for="ne-nombre">
                <i class='bx bx-calendar-event'></i> Título del Evento <span style="color:#ef4444;">*</span>
            </label>
            <input type="text" id="ne-nombre" class="modal-shell-input" placeholder="Ej: Torneo Relámpago de Verano">
            <span class="modal-shell-error-text" id="ne-nombre-err"></span>
        </div>
        <div class="modal-shell-field">
            <label class="modal-shell-label" for="ne-tipo">
                <i class='bx bx-category'></i> Tipo de Evento <span style="color:#ef4444;">*</span>
            </label>
            <select id="ne-tipo" class="modal-shell-input">${TIPOS_EVENTO}</select>
        </div>
    </div>

    <!-- Descripción -->
    <div class="modal-shell-field">
        <label class="modal-shell-label" for="ne-descripcion">
            <i class='bx bx-text'></i> Descripción (Opcional)
        </label>
        <textarea id="ne-descripcion" class="modal-shell-input" rows="2" placeholder="Ej: Torneo de 8 equipos..." style="resize:vertical; min-height:60px; font-family:inherit;"></textarea>
    </div>

    <!-- Fila: Cliente -->
    <div class="modal-shell-field">
        <label class="modal-shell-label" for="ne-cliente-input">
            <i class='bx bx-user'></i> Cliente (Organizador) <span style="color:#ef4444;">*</span>
        </label>
        <div style="display:flex; gap:8px;">
            <div style="flex:1; position:relative;">
                <input type="text" id="ne-cliente-input" class="modal-shell-input" placeholder="Buscar por nombre o DNI..." autocomplete="off">
                <input type="hidden" id="ne-cliente-id">
                <ul class="autocomplete-list" id="ne-cliente-list" style="display:none; position:absolute; top:100%; left:0; right:0; z-index:1000; margin:0;"></ul>
            </div>
            <button type="button" id="ne-btn-nuevo-cliente" class="modal-shell-btn modal-shell-btn-secondary" style="padding:0 12px; height:42px; font-size:12px;">
                <i class='bx bx-user-plus'></i> Nuevo
            </button>
        </div>
        <span class="modal-shell-error-text" id="ne-cliente-err"></span>
    </div>

    <!-- Fila: Sucursal (Oculta si no es superadmin) -->
    <div class="modal-shell-field" style="display: ${rol === 'superadmin' ? 'block' : 'none'};">
        <label class="modal-shell-label" for="ne-sucursal">
            <i class='bx bx-map-pin'></i> Sucursal <span style="color:#ef4444;">*</span>
        </label>
        <select id="ne-sucursal" class="modal-shell-input">
            <option value="">⏳ Cargando...</option>
        </select>
        <span class="modal-shell-error-text" id="ne-sucursal-err"></span>
    </div>

    <!-- Fila: Fecha Inicio + Fecha Fin -->
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
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
    </div>

    <!-- Fila: Monto -->
    <div class="modal-shell-field">
        <label class="modal-shell-label" for="ne-monto">
            <i class='bx bx-money'></i> Monto Total Pactado <span style="color:#ef4444;">*</span>
        </label>
        <input type="number" id="ne-monto" class="modal-shell-input" placeholder="0.00" min="0" step="0.01">
        <span class="modal-shell-error-text" id="ne-monto-err"></span>
    </div>
    `;
}

export function eventoNewFormPaso2Template() {
    return `
    <p style="color:#64748b; font-size:13px; margin-bottom:16px;">
        Paso 2 de 2: Añade los bloques de horario para bloquear las canchas requeridas por el evento.
    </p>

    <!-- Constructor de Horarios -->
    <div class="modal-shell-field">
        <div id="ne-horarios-container">
            <!-- Las filas se inyectan dinámicamente -->
        </div>
        <button type="button" id="ne-btn-add-horario"
            style="margin-top:8px; padding:6px 14px; border-radius:8px; border:1px dashed #94a3b8;
                   background:transparent; color:#64748b; cursor:pointer; font-size:13px; font-weight:600;
                   display:flex; align-items:center; gap:6px; transition:all 0.2s;">
            <i class='bx bx-plus'></i> Añadir Bloque de Horario
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

    <!-- Fila: Fecha Inicio + Fecha Fin -->
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
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
    </div>

    <!-- Fila: Monto -->
    <div class="modal-shell-field">
        <label class="modal-shell-label" for="ee-monto">
            <i class='bx bx-money'></i> Costo Total
        </label>
        <input type="number" id="ee-monto" class="modal-shell-input" placeholder="0.00" min="0" step="0.01">
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
    </div>
    `;
}

// ---------------------------------------------------------------------------
// Modal E: Detalle del Evento
// ---------------------------------------------------------------------------
export function eventoDetailTemplate(evento) {
    const estadoColors = {
        'PROGRAMADO': { bg: '#dcfce7', text: '#166534', dot: '#22c55e' },
        'EN_CURSO': { bg: '#fef3c7', text: '#92400e', dot: '#f59e0b' },
        'FINALIZADO': { bg: '#f1f5f9', text: '#475569', dot: '#94a3b8' },
        'CANCELADO': { bg: '#fee2e2', text: '#991b1b', dot: '#ef4444' }
    };
    
    const e = estadoColors[evento.estado] || { bg: '#f1f5f9', text: '#475569', dot: '#94a3b8' };
    
    const saldo = Number(evento.saldoPendiente || 0);
    const saldoColor = saldo > 0 ? (saldo > 100 ? '#dc2626' : '#d97706') : '#16a34a';
    const saldoText = saldo > 0 ? `S/ ${saldo.toFixed(2)}` : 'Pagado';

    const reservas = Array.isArray(evento.reservasAsociadas) ? evento.reservasAsociadas : [];

    return `
    <div id="evt-det-content">
        <!-- Tabs Header -->
        <div class="dr-tabs-header" style="margin:-15px -20px 20px -20px; border-top:none; border-bottom:1px solid #e2e8f0;">
            <button class="dr-tab-btn evt-tab-btn active" data-tab="tab-evt-detalles"><i class='bx bx-detail'></i> Detalles</button>
            <button class="dr-tab-btn evt-tab-btn" data-tab="tab-evt-canchas"><i class='bx bx-calendar'></i> Cronograma de Canchas</button>
        </div>

        <!-- TAB 1: Detalles -->
        <div class="dr-tab-content evt-tab-content active" id="tab-evt-detalles">
            <div style="display:flex; flex-direction:column; gap:20px;">
                <!-- SECCIÓN 1: Encabezado -->
                <div style="display:flex; flex-direction:column; gap:8px;">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                        <h3 style="margin:0; font-size:18px; color:#1e293b; font-weight:700;">${evento.nombre}</h3>
                        <span style="background:${e.bg}; color:${e.text}; padding:4px 8px; border-radius:12px; font-size:11px; font-weight:700; display:inline-flex; align-items:center; gap:4px;">
                            <span style="width:6px; height:6px; border-radius:50%; background:${e.dot};"></span>
                            ${evento.estado}
                        </span>
                    </div>
                    
                    <div style="display:flex; flex-direction:column; gap:4px; font-size:13px; color:#475569;">
                        <div style="display:flex; align-items:center; gap:6px;">
                            <i class='bx bx-user' style="color:#64748b;"></i> 
                            <span>A cargo de: <strong style="color:#1e293b;">${evento.nombreCliente}</strong></span>
                        </div>
                        <div style="display:flex; align-items:center; gap:6px;">
                            <i class='bx bx-calendar' style="color:#64748b;"></i> 
                            <span>Del <strong>${evento.fechaInicio}</strong> al <strong>${evento.fechaFin}</strong></span>
                        </div>
                        <div style="display:flex; align-items:center; gap:6px;">
                            <i class='bx bx-trophy' style="color:#64748b;"></i> 
                            <span>Tipo: <strong>${evento.tipoEvento}</strong></span>
                        </div>
                    </div>
                    
                    ${evento.descripcion ? `<p style="margin:8px 0 0 0; font-size:12px; color:#64748b; background:#f8fafc; padding:8px; border-radius:6px; border-left:3px solid #cbd5e1;">${evento.descripcion}</p>` : ''}
                </div>

                <!-- SECCIÓN 2: Resumen Financiero -->
                <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:16px;">
                    <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px; text-align:center;">
                        <div style="display:flex; flex-direction:column; gap:4px;">
                            <span style="font-size:11px; color:#64748b; font-weight:600; text-transform:uppercase;">Total Pactado</span>
                            <span style="font-size:15px; color:#1e293b; font-weight:700;">S/ ${Number(evento.montoPactado || 0).toFixed(2)}</span>
                        </div>
                        <div style="display:flex; flex-direction:column; gap:4px; border-left:1px solid #e2e8f0; border-right:1px solid #e2e8f0;">
                            <span style="font-size:11px; color:#64748b; font-weight:600; text-transform:uppercase;">Abonado</span>
                            <span style="font-size:15px; color:#059669; font-weight:700;">S/ ${Number(evento.montoPagado || 0).toFixed(2)}</span>
                        </div>
                        <div style="display:flex; flex-direction:column; gap:4px;">
                            <span style="font-size:11px; color:#64748b; font-weight:600; text-transform:uppercase;">Saldo Pendiente</span>
                            <span style="font-size:16px; color:${saldoColor}; font-weight:800;">${saldoText}</span>
                        </div>
                    </div>
                    
                    ${(saldo > 0 && evento.estado !== 'CANCELADO') ? `
                    <div style="margin-top:16px; text-align:center;">
                        <button type="button" class="modal-shell-btn modal-shell-btn-primary" id="det-evento-cobrar-btn" style="width:100%; justify-content:center; padding:10px; font-size:14px; background:#059669;">
                            <i class='bx bx-credit-card'></i> Cobrar Saldo
                        </button>
                    </div>
                    ` : ''}
                </div>
            </div>
        </div>

        <!-- TAB 2: Cronograma -->
        <div class="dr-tab-content evt-tab-content" id="tab-evt-canchas" style="display:none;">
            <div style="display:flex; flex-direction:column; gap:8px;">
                <h4 style="margin:0; font-size:13px; color:#334155; font-weight:700; text-transform:uppercase; letter-spacing:0.5px;">Canchas Reservadas</h4>
                
                ${reservas.length > 0 ? `
                <div style="display:flex; flex-direction:column; gap:6px;">
                    ${reservas.map(r => `
                    <div style="background:#fff; border:1px solid #e2e8f0; border-radius:8px; padding:10px 12px; display:flex; justify-content:space-between; align-items:center;">
                        <div style="display:flex; flex-direction:column; gap:2px;">
                            <span style="font-size:12px; font-weight:700; color:#1e293b; display:flex; align-items:center; gap:4px;"><i class='bx bx-map' style="color:#64748b;"></i> ${r.nombreCancha}</span>
                            <span style="font-size:11px; color:#64748b; display:flex; align-items:center; gap:4px;"><i class='bx bx-calendar'></i> ${r.fecha}</span>
                        </div>
                        <div style="background:#f1f5f9; padding:4px 8px; border-radius:6px; font-size:11px; font-weight:600; color:#475569; display:flex; align-items:center; gap:4px;">
                            <i class='bx bx-time'></i> ${r.horario || (r.horaInicio + ' - ' + r.horaFin)}
                        </div>
                    </div>
                    `).join('')}
                </div>
                ` : `
                <p style="font-size:12px; color:#94a3b8; font-style:italic; margin:0;">No hay canchas asignadas.</p>
                `}
            </div>
        </div>
    </div>
    `;
}
