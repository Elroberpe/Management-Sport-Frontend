import { initModalShell } from '../../../shared/components/modal-shell.js';
import { EventoService } from '../eventos.service.js';
import { ClienteService } from '../../clientes/clientes.service.js';
import { Auth } from '../../../core/auth.js';
import { Store } from '../../../core/store.js';
import { initClienteModal } from '../../clientes/clientes.modals.js';
import { eventoNewFormPaso1Template, eventoNewFormPaso2Template } from '../eventos.modals.template.js';
import { _cargarSucursales, _initHorariosBuilder } from './eventos.modals.utils.js';

export function initCrearEventoModal({ onCreado }) {
    const session = Auth.getSession();
    let horariosBuilder = null;
    let eventoData = {};

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
                const nuevo = await EventoService.crear(payload);
                ctx.showToast(`Evento "${nuevo.nombre}" creado con éxito.`);
                ctx.close();
                if (onCreado) onCreado(nuevo);
            } catch (err) {
                ctx.setLoading(false);
                ctx.showError(err.message || 'Error al crear el evento. Verifica conflictos de horario.');
            }
        }
    });

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

            ctx.close();
            modalPaso2.open();

            const builderContainer = document.getElementById('ne-horarios-container');
            if (builderContainer) builderContainer.innerHTML = '';
            
            horariosBuilder = _initHorariosBuilder('ne-horarios-container', 'ne-btn-add-horario', sucursalId);
        }
    });

    return {
        ...modalPaso1,
        open: async () => {
            modalPaso1.open();
            
            document.getElementById('ne-nombre').value = '';
            const descEl = document.getElementById('ne-descripcion');
            if (descEl) descEl.value = '';
            document.getElementById('ne-fecha-inicio').value = '';
            document.getElementById('ne-fecha-fin').value = '';
            document.getElementById('ne-monto').value = '';
            document.getElementById('ne-cliente-input').value = '';
            document.getElementById('ne-cliente-id').value = '';

            await _cargarSucursales(document.getElementById('ne-sucursal'));

            const sel = document.getElementById('ne-sucursal');
            const sucursalFiltro = document.getElementById('evt-filter-sucursal')?.value || null;
            const contextoSede = Store.getSucursal();

            if (session && session.rol !== 'superadmin' && session.sucursalId) {
                sel.value = session.sucursalId;
                sel.disabled = true;
            } else if (session?.rol === 'superadmin') {
                if (contextoSede && contextoSede.sucursalId) {
                    sel.value = contextoSede.sucursalId;
                    sel.disabled = true;
                } else if (sucursalFiltro) {
                    sel.value = sucursalFiltro;
                    sel.disabled = true;
                } else {
                    sel.disabled = false;
                }
            }

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
                    ClienteService.listar({ nombre: q, size: 6 }).then(data => {
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
