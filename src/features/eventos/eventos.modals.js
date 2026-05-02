// src/features/eventos/eventos.modals.js
// Lógica de los 5 modales del módulo de Eventos

import { api } from '../../core/api.js';
import { Auth } from '../../core/auth.js';
import { Store } from '../../core/store.js';
import { initModalShell } from '../../shared/components/modal-shell.js';
import { initClienteModal } from '../clientes/clientes.modals.js';
import {
    eventoNewFormPaso1Template,
    eventoNewFormPaso2Template,
    eventoEditFormTemplate,
    eventoReprogramarTemplate,
    eventoPagoTemplate,
    eventoCancelarTemplate,
    horarioRowTemplate,
    eventoDetailTemplate,
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
            const clienteId   = parseInt(document.getElementById('ne-cliente-id').value);
            const sucursalId  = parseInt(document.getElementById('ne-sucursal').value);
            const fechaInicio = document.getElementById('ne-fecha-inicio').value;
            const fechaFin    = document.getElementById('ne-fecha-fin').value;
            const monto       = parseFloat(document.getElementById('ne-monto').value);

            // Validaciones
            let hasError = false;
            if (!nombre) { ctx.showFieldError('ne-nombre', 'El nombre es obligatorio.'); hasError = true; }
            if (!clienteId || isNaN(clienteId)) { ctx.showFieldError('ne-cliente-input', 'Busca un cliente.'); hasError = true; }
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
            document.getElementById('ne-cliente-input').value = '';
            document.getElementById('ne-cliente-id').value = '';

            // Cargar sucursales
            await _cargarSucursales(document.getElementById('ne-sucursal'));

            const sel = document.getElementById('ne-sucursal');
            const sucursalFiltro = document.getElementById('evt-filter-sucursal')?.value || null;
            const contextoSede = Store.getSucursal(); // Si entró a modo operativo

            // Lógica para fijar la sucursal
            if (session && session.rol !== 'superadmin' && session.sucursalId) {
                // Admin local / Recepcionista
                sel.value = session.sucursalId;
                sel.disabled = true;
            } else if (session?.rol === 'superadmin') {
                if (contextoSede && contextoSede.sucursalId) {
                    // Superadmin dentro de una sede específica en el sidebar
                    sel.value = contextoSede.sucursalId;
                    sel.disabled = true;
                } else if (sucursalFiltro) {
                    // Superadmin con el filtro global de la tabla activo
                    sel.value = sucursalFiltro;
                    sel.disabled = true;
                } else {
                    // Superadmin viendo "Todas las sedes" sin filtro
                    sel.disabled = false;
                }
            }

            // Configurar autocomplete de cliente
            const clInput = document.getElementById('ne-cliente-input');
            const clList = document.getElementById('ne-cliente-list');
            const clId = document.getElementById('ne-cliente-id');
            const btnNuevo = document.getElementById('ne-btn-nuevo-cliente');

            let debounce;
            clInput.oninput = () => {
                clearTimeout(debounce);
                const q = clInput.value.trim();
                if (q.length < 2) { clList.style.display = 'none'; return; }
                debounce = setTimeout(() => {
                    api.get(`/clientes?nombre=${encodeURIComponent(q)}&size=6`).then(data => {
                        const arr = data.content || data || [];
                        const escapeHtml = (s) => String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
                        clList.innerHTML = arr.map(c => `
                            <li data-id="${c.id || c.clienteId}" data-nombre="${escapeHtml(c.nombre)}">
                                <strong>${escapeHtml(c.nombre)}</strong>
                                ${c.numDocumento ? `<span style="font-size:11px;color:#94a3b8;">(${c.numDocumento})</span>` : ''}
                            </li>
                        `).join('');
                        clList.style.display = 'block';
                    });
                }, 300);
            };

            clList.onclick = (e) => {
                const li = e.target.closest('li');
                if (li) {
                    clInput.value = li.dataset.nombre;
                    clId.value = li.dataset.id;
                    clList.style.display = 'none';
                }
            };

            if (btnNuevo) {
                const modalCli = initClienteModal({
                    onClienteCreado: (c) => {
                        clInput.value = c.nombre;
                        clId.value = c.id || c.clienteId;
                    }
                });
                btnNuevo.onclick = () => modalCli.open();
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
    let currentEventoId = null;
    let _simulacion     = null;

    function _setupMetodoVisibility() {
        const montoEl = document.getElementById('ec-reembolso');
        const wrapper = document.getElementById('ec-metodo-wrapper');
        if (!montoEl || !wrapper) return;
        const toggle = () => {
            wrapper.style.display = (parseFloat(montoEl.value) || 0) > 0 ? 'block' : 'none';
        };
        toggle();
        montoEl.addEventListener('input', toggle);
    }

    const modal = initModalShell({
        id: 'modal-cancelar-evento',
        title: 'Cancelar Evento',
        subtitle: '¿Estás seguro? Esta acción no se puede deshacer.',
        icon: 'bx bx-x-circle',
        confirmText: 'Confirmar Cancelación',
        confirmStyle: 'danger',
        contentHtml: '<div></div>',
        onConfirm: async (ctx) => {
            const motivo = document.getElementById('ec-motivo')?.value.trim();
            const monto  = parseFloat(document.getElementById('ec-reembolso')?.value) || 0;
            const metodo = document.getElementById('ec-metodo')?.value;
            const nota   = document.getElementById('ec-nota')?.value.trim();

            let hasError = false;
            if (!motivo) {
                ctx.showFieldError('ec-motivo', 'El motivo es obligatorio.');
                hasError = true;
            }
            const maximo = _simulacion?.reembolsoMaximoPermitido ?? Infinity;
            if (monto > maximo) {
                ctx.showFieldError('ec-reembolso', `No puede superar S/ ${Number(maximo).toFixed(2)}.`);
                hasError = true;
            }
            if (monto > 0 && !metodo) {
                ctx.showFieldError('ec-metodo', 'Selecciona el método de devolución.');
                hasError = true;
            }
            if (hasError) return;

            const body = { motivo, montoReembolso: monto };
            if (nota)              body.notaReembolso = nota;
            if (metodo && monto > 0) body.metodoPago  = metodo;

            ctx.setLoading(true);
            try {
                const cancelado = await api.post(`/eventos/${currentEventoId}/cancelar`, body);
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
        abrir: async (evento) => {
            currentEventoId = evento.id || evento.eventoId;
            modal.open();

            // Fase 1 — Loading state mientras se consulta al backend
            const bodyEl     = document.querySelector('#modal-cancelar-evento .modal-shell-body');
            const btnConfirm = document.getElementById('modal-cancelar-evento-btn-confirm');
            if (bodyEl) {
                bodyEl.innerHTML = `
                    <div style="text-align:center; padding:40px 20px;">
                        <i class="bx bx-loader-alt bx-spin" style="font-size:32px; color:#64748b;"></i>
                        <p style="color:#64748b; margin-top:12px; font-size:14px;">Calculando penalidades...</p>
                    </div>`;
            }
            if (btnConfirm) btnConfirm.disabled = true;

            // Fase 2 — Simulación en el backend
            try {
                _simulacion = await api.get(`/eventos/${currentEventoId}/simular-cancelacion`);

                if (bodyEl) {
                    bodyEl.innerHTML =
                        `<div class="modal-shell-alert-error" id="modal-cancelar-evento-err-gen" style="display:none;">
                            <i class='bx bx-error-circle'></i>
                            <span id="modal-cancelar-evento-err-gen-msg"></span>
                        </div>` +
                        eventoCancelarTemplate(_simulacion);
                }
                if (btnConfirm) btnConfirm.disabled = false;
                _setupMetodoVisibility();

            } catch (err) {
                if (bodyEl) {
                    bodyEl.innerHTML = `
                        <div style="text-align:center; padding:30px 20px;">
                            <i class="bx bx-error" style="font-size:32px; color:#ef4444;"></i>
                            <p style="color:#ef4444; margin-top:8px; font-size:13px;">
                                ${err.message || 'Error al calcular penalidades.'}
                            </p>
                        </div>`;
                }
            }
        }
    };
}

// ---------------------------------------------------------------------------
// Modal E: Detalle del Evento
// ---------------------------------------------------------------------------
export function initDetalleEventoModal({ onPago }) {
    let currentEvento = null;

    const modal = initModalShell({
        id: 'modal-detalle-evento',
        title: 'Detalles del Evento',
        subtitle: 'Resumen financiero y cronograma de canchas asignadas.',
        icon: 'bx bx-info-circle',
        confirmText: 'Cerrar',
        contentHtml: '<div id="mde-content" style="padding:20px; text-align:center;"><i class="bx bx-loader-alt bx-spin" style="font-size:24px; color:#64748b;"></i><p>Cargando información del evento...</p></div>',
        onConfirm: (ctx) => {
            ctx.close();
        }
    });

    return {
        ...modal,
        abrir: async (eventoId) => {
            modal.open();
            const container = document.getElementById('mde-content');
            if (container) {
                container.innerHTML = '<div style="padding:20px; text-align:center;"><i class="bx bx-loader-alt bx-spin" style="font-size:24px; color:#64748b;"></i><p>Cargando información del evento...</p></div>';
            }

            try {
                const [eventoData, pagosData] = await Promise.all([
                    api.get(`/eventos/${eventoId}`),
                    api.get(`/eventos/${eventoId}/pagos`).catch(() => [])
                ]);
                currentEvento = eventoData;
                
                // Actualizar HTML de contenido
                const contentWrapper = document.querySelector('#modal-detalle-evento .modal-shell-body');
                if (contentWrapper) {
                    contentWrapper.innerHTML = eventoDetailTemplate(currentEvento);
                    
                    // Add listener to 'Cobrar Saldo' button if it was rendered
                    const btnCobrar = document.getElementById('det-evento-cobrar-btn');
                    if (btnCobrar) {
                        btnCobrar.addEventListener('click', () => {
                            modal.close();
                            if (onPago) onPago(currentEvento);
                        });
                    }

                    // Setup Tabs
                    const btns = contentWrapper.querySelectorAll('.evt-tab-btn');
                    btns.forEach(b => b.onclick = () => {
                        btns.forEach(x => x.classList.remove('active'));
                        b.classList.add('active');
                        contentWrapper.querySelectorAll('.evt-tab-content').forEach(c => c.style.display = 'none');
                        contentWrapper.querySelector('#' + b.dataset.tab).style.display = 'block';
                    });

                    // Render Pagos
                    const tbody = document.getElementById('evt-tbody-pagos');
                    const emptyPagos = document.getElementById('evt-empty-pagos');
                    const pagosActivos = (Array.isArray(pagosData) ? pagosData : (pagosData.content || [])).filter(p => p.estado !== 'ANULADO');

                    if (pagosActivos.length > 0) {
                        tbody.innerHTML = pagosActivos.map(p => {
                            const esSalida  = p.tipoTransaccion === 'SALIDA';
                            const signo     = esSalida ? '−' : '+';
                            const color     = esSalida ? '#dc2626' : '#059669';
                            const tipoBadge = esSalida
                                ? `<span style="font-size:10px; font-weight:700; background:#f3e8ff; color:#7e22ce; padding:2px 6px; border-radius:4px; margin-left:6px;">REEMBOLSO</span>`
                                : `<span style="font-size:10px; font-weight:700; background:#dbeafe; color:#1d4ed8; padding:2px 6px; border-radius:4px; margin-left:6px;">PAGO</span>`;
                            return `
                            <tr>
                                <td>${p.fecha || '—'}</td>
                                <td>
                                    <div>${p.metodoPago || '—'}${tipoBadge}</div>
                                    ${p.nota ? `<div style="font-size:10px; color:#64748b; margin-top:3px; font-weight:normal; line-height:1.2;">${p.nota}</div>` : ''}
                                </td>
                                <td style="text-align:right; font-weight:600; color:${color}; vertical-align:top;">${signo} S/ ${Number(p.monto).toFixed(2)}</td>
                            </tr>`;
                        }).join('');
                        emptyPagos.style.display = 'none';
                    } else {
                        tbody.innerHTML = '';
                        emptyPagos.style.display = 'block';
                    }
                }
            } catch (err) {
                if (container) {
                    container.innerHTML = `<div style="padding:20px; text-align:center;"><i class="bx bx-error" style="font-size:24px; color:#ef4444;"></i><p>${err.message || 'Error al cargar el evento.'}</p></div>`;
                }
            }
        }
    };
}
