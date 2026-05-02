// src/features/eventos/eventos.modals.js
// Lógica de los 5 modales del módulo de Eventos

import { api } from '../../core/api.js';
import { Auth } from '../../core/auth.js';
import { initModalShell } from '../../shared/components/modal-shell.js';
import {
    eventoNewFormPaso1Template,
    eventoNewFormPaso2Template,
    eventoEditFormTemplate,
    eventoReprogramarTemplate,
    eventoPagoTemplate,
    eventoCancelarTemplate,
    horarioRowTemplate,
} from './eventos.modals.template.js';

// ---------------------------------------------------------------------------
// Helper: poblar un <select> con canchas de una sucursal
// ---------------------------------------------------------------------------
async function _cargarCanchas(selectEl, sucursalId) {
    if (!selectEl) return;
    selectEl.innerHTML = '<option value="">Cargando canchas...</option>';
    try {
        const url = `/canchas?size=100${sucursalId ? `&sucursalId=${sucursalId}` : ''}`;
        const data = await api.get(url);
        const arr = Array.isArray(data) ? data : (data.content || []);
        selectEl.innerHTML = '<option value="">— Seleccionar cancha —</option>';
        arr.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.canchaId || c.id;
            opt.textContent = c.nombre;
            selectEl.appendChild(opt);
        });
    } catch {
        selectEl.innerHTML = '<option value="">Error al cargar canchas</option>';
    }
}

// ---------------------------------------------------------------------------
// Helper: poblar un <select> con clientes
// ---------------------------------------------------------------------------
async function _cargarClientes(selectEl) {
    if (!selectEl) return;
    selectEl.innerHTML = '<option value="">Cargando clientes...</option>';
    try {
        const data = await api.get('/clientes?size=200&sort=nombre,asc');
        const arr = Array.isArray(data) ? data : (data.content || []);
        selectEl.innerHTML = '<option value="">— Seleccionar cliente —</option>';
        arr.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.clienteId || c.id;
            opt.textContent = c.nombre;
            selectEl.appendChild(opt);
        });
    } catch {
        selectEl.innerHTML = '<option value="">Error al cargar clientes</option>';
    }
}

// ---------------------------------------------------------------------------
// Helper: poblar un <select> con sucursales
// ---------------------------------------------------------------------------
async function _cargarSucursales(selectEl) {
    if (!selectEl) return;
    selectEl.innerHTML = '<option value="">Cargando sucursales...</option>';
    try {
        const list = await api.get('/sucursales');
        const activas = Array.isArray(list) ? list.filter(s => s.activo !== false) : [];
        selectEl.innerHTML = '<option value="">— Seleccionar sede —</option>';
        activas.forEach(s => {
            const opt = document.createElement('option');
            opt.value = s.sucursalId !== undefined ? s.sucursalId : s.id;
            opt.textContent = s.nombre;
            selectEl.appendChild(opt);
        });
    } catch {
        selectEl.innerHTML = '<option value="">Error al cargar sedes</option>';
    }
}

// ---------------------------------------------------------------------------
// Helper: constructor de horarios (reutilizado en Crear y Reprogramar)
// ---------------------------------------------------------------------------
function _initHorariosBuilder(containerId, btnAddId, sucursalId = null) {
    const container = document.getElementById(containerId);
    const btnAdd = document.getElementById(btnAddId);
    if (!container || !btnAdd) return;

    let rowIdx = 0;

    async function addRow(defaults = {}) {
        const idx = rowIdx++;
        container.insertAdjacentHTML('beforeend', horarioRowTemplate(idx));
        const row = container.lastElementChild;

        // Cargar canchas en el select de esta fila
        const canchaSelect = row.querySelector('.hc-cancha');
        await _cargarCanchas(canchaSelect, sucursalId);

        // Aplicar defaults si los hay
        if (defaults.canchaId) canchaSelect.value = defaults.canchaId;
        if (defaults.fecha) row.querySelector('.hc-fecha').value = defaults.fecha;
        if (defaults.horaInicio) row.querySelector('.hc-inicio').value = defaults.horaInicio.substring(0, 5);
        if (defaults.horaFin) row.querySelector('.hc-fin').value = defaults.horaFin.substring(0, 5);

        // Botón eliminar
        row.querySelector('.hc-remove').addEventListener('click', () => {
            if (container.children.length > 1) {
                row.remove();
            }
        });
    }

    btnAdd.addEventListener('click', () => addRow());

    // Agregar primera fila al inicializar
    addRow();

    return {
        getHorarios: () => {
            return Array.from(container.querySelectorAll('.horario-row')).map(row => ({
                canchaId:  parseInt(row.querySelector('.hc-cancha').value),
                fecha:     row.querySelector('.hc-fecha').value,
                horaInicio: row.querySelector('.hc-inicio').value + ':00',
                horaFin:    row.querySelector('.hc-fin').value + ':00',
            }));
        },
        addRow,
    };
}

// ---------------------------------------------------------------------------
// Modal A: Crear Nuevo Evento
// ---------------------------------------------------------------------------
export function initCrearEventoModal({ onCreado }) {
    const session = Auth.getSession();
    let horariosBuilder = null;
    let eventoData = {}; // Guarda los datos del paso 1 temporalmente

    // Modal Paso 2: Horarios
    const modalPaso2 = initModalShell({
        id: 'modal-crear-evento-paso2',
        title: 'Crear Evento - Paso 2',
        subtitle: 'Asignación de canchas y horarios',
        icon: 'bx bx-time',
        confirmText: 'Crear Evento',
        contentHtml: eventoNewFormPaso2Template(),
        onConfirm: async (ctx) => {
            const horarios = horariosBuilder ? horariosBuilder.getHorarios() : [];

            if (horarios.length === 0 || horarios.some(h => !h.canchaId || !h.fecha || !h.horaInicio || !h.horaFin)) {
                document.getElementById('ne-horarios-err').textContent = 'Completa todos los campos de cada horario.';
                return;
            }

            ctx.setLoading(true);
            try {
                const payload = {
                    ...eventoData,
                    horarios,
                };
                const nuevo = await api.post('/eventos', payload);
                ctx.showToast(`Evento "${nuevo.nombre}" creado con éxito.`);
                ctx.close();
                if (onCreado) onCreado(nuevo);
            } catch (err) {
                ctx.setLoading(false);
                ctx.showError(err.message || 'Error al crear el evento. Verifica conflictos de horario.');
            }
        }
    });

    // Modal Paso 1: Datos Generales
    const modalPaso1 = initModalShell({
        id: 'modal-crear-evento-paso1',
        title: 'Crear Evento - Paso 1',
        subtitle: 'Datos generales del torneo o evento corporativo',
        icon: 'bx bx-calendar-plus',
        confirmText: 'Siguiente: Horarios',
        contentHtml: eventoNewFormPaso1Template(session?.rol || 'superadmin'),
        onConfirm: async (ctx) => {
            const nombre      = document.getElementById('ne-nombre').value.trim();
            const descripcion = document.getElementById('ne-descripcion')?.value.trim();
            const tipo        = document.getElementById('ne-tipo').value;
            const clienteId   = parseInt(document.getElementById('ne-cliente').value);
            const sucursalId  = parseInt(document.getElementById('ne-sucursal').value);
            const fechaInicio = document.getElementById('ne-fecha-inicio').value;
            const fechaFin    = document.getElementById('ne-fecha-fin').value;
            const monto       = parseFloat(document.getElementById('ne-monto').value);

            // Validaciones
            let hasError = false;
            if (!nombre) { ctx.showFieldError('ne-nombre', 'El nombre es obligatorio.'); hasError = true; }
            if (!clienteId) { ctx.showFieldError('ne-cliente', 'Selecciona un cliente.'); hasError = true; }
            if (!sucursalId) { ctx.showFieldError('ne-sucursal', 'Selecciona una sede.'); hasError = true; }
            if (!fechaInicio) { ctx.showFieldError('ne-fecha-inicio', 'La fecha de inicio es obligatoria.'); hasError = true; }
            if (!monto || monto <= 0) { ctx.showFieldError('ne-monto', 'El monto debe ser mayor a 0.'); hasError = true; }
            if (hasError) return;

            eventoData = {
                nombre, descripcion, sucursalId, clienteId,
                fechaInicio, fechaFin: fechaFin || fechaInicio,
                tipoEvento: tipo,
                montoPactado: monto,
            };

            // Cerrar paso 1 y abrir paso 2
            ctx.close();
            modalPaso2.open();

            // Asegurar que el contenedor está limpio antes de iniciar el builder
            const builderContainer = document.getElementById('ne-horarios-container');
            if (builderContainer) builderContainer.innerHTML = '';
            
            // Inicializar constructor con el ID de sucursal seleccionado en el paso 1
            horariosBuilder = _initHorariosBuilder('ne-horarios-container', 'ne-btn-add-horario', sucursalId);
        }
    });

    return {
        ...modalPaso1,
        open: async () => {
            modalPaso1.open();
            
            // Limpiar campos del paso 1 si se vuelve a abrir
            document.getElementById('ne-nombre').value = '';
            const descEl = document.getElementById('ne-descripcion');
            if (descEl) descEl.value = '';
            document.getElementById('ne-fecha-inicio').value = '';
            document.getElementById('ne-fecha-fin').value = '';
            document.getElementById('ne-monto').value = '';

            // Cargar clientes y sucursales en paralelo
            await Promise.all([
                _cargarClientes(document.getElementById('ne-cliente')),
                _cargarSucursales(document.getElementById('ne-sucursal')),
            ]);

            // Si admin/recep → pre-seleccionar su sede y deshabilitar el select
            if (session && session.rol !== 'superadmin' && session.sucursalId) {
                const sel = document.getElementById('ne-sucursal');
                sel.value = session.sucursalId;
                sel.disabled = true;
            }
        }
    };
}

// ---------------------------------------------------------------------------
// Modal B: Editar Evento
// ---------------------------------------------------------------------------
export function initEditarEventoModal({ onActualizado }) {
    let currentEventoId = null;

    const modal = initModalShell({
        id: 'modal-editar-evento',
        title: 'Editar Evento',
        subtitle: 'Modifica los datos del evento seleccionado',
        icon: 'bx bx-pencil',
        confirmText: 'Guardar Cambios',
        contentHtml: eventoEditFormTemplate(),
        onConfirm: async (ctx) => {
            const nombre     = document.getElementById('ee-nombre').value.trim();
            const tipo       = document.getElementById('ee-tipo').value;
            const descripcion = document.getElementById('ee-descripcion').value.trim();
            const fechaInicio = document.getElementById('ee-fecha-inicio').value;
            const fechaFin   = document.getElementById('ee-fecha-fin').value;
            const monto      = parseFloat(document.getElementById('ee-monto').value);

            if (!nombre) { ctx.showFieldError('ee-nombre', 'El nombre es obligatorio.'); return; }

            ctx.setLoading(true);
            try {
                const payload = {
                    nombre, tipoEvento: tipo, descripcion,
                    fechaInicio, fechaFin, montoPactado: monto || undefined,
                };
                const actualizado = await api.put(`/eventos/${currentEventoId}`, payload);
                ctx.showToast(`Evento "${actualizado.nombre}" actualizado.`);
                ctx.close();
                if (onActualizado) onActualizado(actualizado);
            } catch (err) {
                ctx.setLoading(false);
                ctx.showError(err.message || 'Error al actualizar el evento.');
            }
        }
    });

    return {
        ...modal,
        abrir: async (eventoId) => {
            currentEventoId = eventoId;
            modal.open();
            try {
                const e = await api.get(`/eventos/${eventoId}`);
                document.getElementById('ee-nombre').value       = e.nombre || '';
                document.getElementById('ee-tipo').value         = e.tipoEvento || 'TORNEO';
                document.getElementById('ee-descripcion').value  = e.descripcion || '';
                document.getElementById('ee-fecha-inicio').value = e.fechaInicio || '';
                document.getElementById('ee-fecha-fin').value    = e.fechaFin || '';
                document.getElementById('ee-monto').value        = e.montoPactado || '';
            } catch (err) {
                console.error('[EventosModal] Error al cargar evento:', err);
                modal.showError('No se pudo cargar la información del evento.');
            }
        }
    };
}

// ---------------------------------------------------------------------------
// Modal C: Reprogramar Evento
// ---------------------------------------------------------------------------
export function initReprogramarEventoModal({ onReprogramado }) {
    let currentEventoId = null;
    let horariosBuilder = null;

    const modal = initModalShell({
        id: 'modal-reprogramar-evento',
        title: 'Reprogramar Evento',
        subtitle: 'Define los nuevos horarios para el evento',
        icon: 'bx bx-calendar-edit',
        confirmText: 'Reprogramar',
        contentHtml: eventoReprogramarTemplate(),
        onConfirm: async (ctx) => {
            const horarios = horariosBuilder ? horariosBuilder.getHorarios() : [];

            if (horarios.length === 0 || horarios.some(h => !h.canchaId || !h.fecha || !h.horaInicio || !h.horaFin)) {
                document.getElementById('rep-horarios-err').textContent = 'Completa todos los campos de cada horario.';
                return;
            }

            ctx.setLoading(true);
            try {
                const actualizado = await api.post(`/eventos/${currentEventoId}/reprogramar`, {
                    nuevosHorarios: horarios
                });
                ctx.showToast('Evento reprogramado con éxito.');
                ctx.close();
                if (onReprogramado) onReprogramado(actualizado);
            } catch (err) {
                ctx.setLoading(false);
                ctx.showError(err.message || 'Error al reprogramar. Verifica la disponibilidad de los nuevos horarios.');
            }
        }
    });

    return {
        ...modal,
        abrir: async (evento) => {
            currentEventoId = evento.id || evento.eventoId;
            modal.open();

            // Inicializar el builder con las canchas de la sucursal del evento
            const sucursalId = evento.sucursalId || null;
            horariosBuilder = _initHorariosBuilder('rep-horarios-container', 'rep-btn-add-horario', sucursalId);

            // Pre-poblar con los horarios actuales del evento
            const reservas = evento.reservasAsociadas || [];
            if (reservas.length > 1) {
                // Ya se añadió la primera fila, agregar el resto
                for (let i = 1; i < reservas.length; i++) {
                    const r = reservas[i];
                    const [hInicio, hFin] = (r.horario || '').split(' - ');
                    await horariosBuilder.addRow({
                        canchaId: r.canchaId,
                        fecha: r.fecha,
                        horaInicio: hInicio,
                        horaFin: hFin,
                    });
                }
            }
        }
    };
}

// ---------------------------------------------------------------------------
// Modal D: Añadir Pago
// ---------------------------------------------------------------------------
export function initPagoEventoModal({ onPagado }) {
    let currentEventoId = null;

    const modal = initModalShell({
        id: 'modal-pago-evento',
        title: 'Añadir Pago',
        subtitle: 'Registra un abono o pago total del evento',
        icon: 'bx bx-credit-card',
        confirmText: 'Registrar Pago',
        contentHtml: eventoPagoTemplate(),
        onConfirm: async (ctx) => {
            const monto   = parseFloat(document.getElementById('ep-monto').value);
            const metodo  = document.getElementById('ep-metodo').value;

            if (!monto || monto <= 0) {
                ctx.showFieldError('ep-monto', 'El monto debe ser mayor a 0.');
                return;
            }

            ctx.setLoading(true);
            try {
                const actualizado = await api.post(`/eventos/${currentEventoId}/pagos`, {
                    monto, metodoPago: metodo
                });
                ctx.showToast(`Pago de S/ ${monto.toFixed(2)} registrado con éxito.`);
                ctx.close();
                if (onPagado) onPagado(actualizado);
            } catch (err) {
                ctx.setLoading(false);
                ctx.showError(err.message || 'Error al registrar el pago.');
            }
        }
    });

    return {
        ...modal,
        abrir: (evento) => {
            currentEventoId = evento.id || evento.eventoId;
            modal.open();

            // Mostrar saldo pendiente como referencia
            const saldo = evento.saldoPendiente || 0;
            const saldoEl = document.getElementById('evt-pago-saldo');
            if (saldoEl) saldoEl.textContent = `S/ ${Number(saldo).toFixed(2)}`;

            // Pre-rellenar el monto con el saldo pendiente
            const montoEl = document.getElementById('ep-monto');
            if (montoEl && saldo > 0) montoEl.value = saldo.toFixed(2);
        }
    };
}

// ---------------------------------------------------------------------------
// Modal E: Cancelar Evento
// ---------------------------------------------------------------------------
export function initCancelarEventoModal({ onCancelado }) {
    let currentEventoId  = null;
    let montoPagadoActual = 0;

    const modal = initModalShell({
        id: 'modal-cancelar-evento',
        title: 'Cancelar Evento',
        subtitle: '¿Estás seguro? Esta acción no se puede deshacer.',
        icon: 'bx bx-x-circle',
        confirmText: 'Confirmar Cancelación',
        confirmStyle: 'danger',
        contentHtml: eventoCancelarTemplate(),
        onConfirm: async (ctx) => {
            const motivo     = document.getElementById('ec-motivo').value.trim();
            const reembolso  = parseFloat(document.getElementById('ec-reembolso').value) || 0;
            const nota       = document.getElementById('ec-nota').value.trim();

            // Validaciones
            let hasError = false;
            if (!motivo) {
                ctx.showFieldError('ec-motivo', 'El motivo es obligatorio.');
                hasError = true;
            }
            if (reembolso < 0) {
                ctx.showFieldError('ec-reembolso', 'El reembolso no puede ser negativo.');
                hasError = true;
            }
            if (reembolso > montoPagadoActual) {
                ctx.showFieldError('ec-reembolso', `El reembolso no puede superar lo pagado (S/ ${montoPagadoActual.toFixed(2)}).`);
                hasError = true;
            }
            if (hasError) return;

            ctx.setLoading(true);
            try {
                const cancelado = await api.post(`/eventos/${currentEventoId}/cancelar`, {
                    motivo,
                    montoReembolso: reembolso,
                    notaReembolso: nota || undefined,
                });
                ctx.showToast('Evento cancelado correctamente.');
                ctx.close();
                if (onCancelado) onCancelado(cancelado);
            } catch (err) {
                ctx.setLoading(false);
                ctx.showError(err.message || 'Error al cancelar el evento.');
            }
        }
    });

    return {
        ...modal,
        abrir: (evento) => {
            currentEventoId   = evento.id || evento.eventoId;
            montoPagadoActual = Number(evento.montoPagado || 0);
            modal.open();

            // Mostrar monto pagado como referencia
            const pagadoEl = document.getElementById('evt-cancel-pagado');
            if (pagadoEl) pagadoEl.textContent = `S/ ${montoPagadoActual.toFixed(2)}`;

            // Limpiar campos
            const motivoEl = document.getElementById('ec-motivo');
            const reembolsoEl = document.getElementById('ec-reembolso');
            const notaEl = document.getElementById('ec-nota');
            if (motivoEl) motivoEl.value = '';
            if (reembolsoEl) reembolsoEl.value = '0';
            if (notaEl) notaEl.value = '';
        }
    };
}
