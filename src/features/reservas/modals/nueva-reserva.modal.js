import { initModalShell } from '../../../shared/components/modal-shell.js';
import { ReservaService } from '../reservas.service.js';
import { ClienteService } from '../../clientes/clientes.service.js';
import { UsuarioService } from '../../usuarios/usuarios.service.js';
import { Auth } from '../../../core/auth.js';
import { reservaNewFormTemplate } from '../reservas.modals.template.js';
import { escapeHtml, generarSlots } from './reservas.modals.utils.js';

export function initNuevaReservaModal(ctx) {
    const { sucursalFiltro, sedeActiva, initClienteModal, callbacks } = ctx;

    const modalNR = initModalShell({
        id: 'modal-nueva-reserva',
        title: 'Nueva Reserva',
        subtitle: 'Completa los datos para registrar la reserva',
        icon: 'bx bx-calendar-plus',
        confirmText: 'Crear Reserva',
        contentHtml: reservaNewFormTemplate(),
        onConfirm: async (mCtx) => {
            const sid = document.getElementById('nr-sucursal').value;
            const cid = document.getElementById('nr-cancha').value;
            const fec = document.getElementById('nr-fecha').value;
            const ini = document.getElementById('nr-hora-inicio').value;
            const fin = document.getElementById('nr-hora-fin').value;
            const cli = document.getElementById('nr-cliente-id').value;

            let hasError = false;
            if (!sid) { mCtx.showFieldError('nr-sucursal', 'Requerido'); hasError = true; }
            if (!cid) { mCtx.showFieldError('nr-cancha', 'Requerido'); hasError = true; }
            if (!fec) { mCtx.showFieldError('nr-fecha', 'Requerido'); hasError = true; }
            if (!ini) { mCtx.showFieldError('nr-hora-inicio', 'Requerido'); hasError = true; }
            if (!fin) { mCtx.showFieldError('nr-hora-fin', 'Requerido'); hasError = true; }
            if (!cli) { mCtx.showFieldError('nr-cliente-input', 'Busca un cliente'); hasError = true; }

            if (hasError) return;

            const session = Auth.getSession() || {};

            mCtx.setLoading(true);
            try {
                const nueva = await ReservaService.crear({
                    canchaId: parseInt(cid),
                    clienteId: parseInt(cli),
                    usuarioId: session.id || 1,
                    fecha: fec,
                    horaInicio: ini + ':00',
                    horaFin: fin + ':00'
                });
                mCtx.showToast('Reserva creada con éxito');
                mCtx.close();
                if (callbacks.cargarSemana) callbacks.cargarSemana();
                if (callbacks.fetchHistorical) callbacks.fetchHistorical(0);
                if (callbacks.abrirDetalleReserva) callbacks.abrirDetalleReserva(nueva.id || nueva.reservaId);
            } catch (err) {
                mCtx.setLoading(false);
                mCtx.showError(err.message || 'Error al crear la reserva');
            }
        }
    });

    function setupNREvents() {
        const nrSucursal = document.getElementById('nr-sucursal');
        const nrCancha = document.getElementById('nr-cancha');
        const nrHoraInicio = document.getElementById('nr-hora-inicio');
        const nrHoraFin = document.getElementById('nr-hora-fin');
        const nrClienteIn = document.getElementById('nr-cliente-input');
        const nrClienteLst = document.getElementById('nr-cliente-list');
        const btnNuevoCli = document.getElementById('nr-btn-nuevo-cliente');

        nrSucursal.onchange = () => cargarCanchasNR(nrSucursal.value);
        nrCancha.onchange = () => actualizarCostoNR();
        nrHoraInicio.onchange = () => {
            const val = nrHoraInicio.value;
            if (!val) {
                nrHoraFin.innerHTML = '<option value="">— Selecciona inicio —</option>';
                nrHoraFin.disabled = true;
                return;
            }
            const [h, m] = val.split(':').map(Number);
            const startMin = h * 60 + m + 30;
            nrHoraFin.innerHTML = '<option value="">— Seleccionar —</option>';
            nrHoraFin.disabled = false;
            for (let hh = Math.floor(startMin / 60); hh <= 24; hh++) {
                const mmOptions = (hh === Math.floor(startMin / 60) && startMin % 60 === 30) ? ['30'] : ['00', '30'];
                mmOptions.forEach(mm => {
                    if (hh === 24 && mm === '30') return;
                    const time = `${hh < 10 ? '0' + hh : hh}:${mm}`;
                    if (time === val) return;
                    const opt = document.createElement('option');
                    opt.value = time; opt.textContent = time;
                    nrHoraFin.appendChild(opt);
                });
            }
            actualizarCostoNR();
        };
        nrHoraFin.onchange = () => actualizarCostoNR();

        let debounce;
        nrClienteIn.oninput = () => {
            clearTimeout(debounce);
            const q = nrClienteIn.value.trim();
            if (q.length < 2) { nrClienteLst.style.display = 'none'; return; }
            debounce = setTimeout(() => {
                ClienteService.listar({ nombre: q, size: 6 }).then(data => {
                    const arr = data.content || data || [];
                    nrClienteLst.innerHTML = arr.map(c => `
                        <li data-id="${c.id || c.clienteId}" data-nombre="${escapeHtml(c.nombre)}">
                            <strong>${escapeHtml(c.nombre)}</strong>
                            ${c.numDocumento ? `<span style="font-size:11px;color:#94a3b8;">(${c.numDocumento})</span>` : ''}
                        </li>
                    `).join('');
                    nrClienteLst.style.display = 'block';
                });
            }, 300);
        };

        nrClienteLst.onclick = (e) => {
            const li = e.target.closest('li');
            if (li) {
                nrClienteIn.value = li.dataset.nombre;
                document.getElementById('nr-cliente-id').value = li.dataset.id;
                nrClienteLst.style.display = 'none';
            }
        };

        if (btnNuevoCli && initClienteModal) {
            const modalCli = initClienteModal({
                onClienteCreado: (c) => {
                    nrClienteIn.value = c.nombre;
                    document.getElementById('nr-cliente-id').value = c.id || c.clienteId;
                }
            });
            btnNuevoCli.onclick = () => modalCli.open();
        }
    }

    function cargarSucursalesNR() {
        const nrSucursal = document.getElementById('nr-sucursal');
        UsuarioService.listarSucursales().then(data => {
            nrSucursal.innerHTML = '<option value="">— Seleccionar sede —</option>';
            (Array.isArray(data) ? data : []).forEach(s => {
                const opt = document.createElement('option');
                opt.value = s.id || s.sucursalId;
                opt.textContent = s.nombre;
                nrSucursal.appendChild(opt);
            });
        });
    }

    function cargarCanchasNR(sid) {
        const nrCancha = document.getElementById('nr-cancha');
        if (!sid) { nrCancha.disabled = true; return; }
        ReservaService.listarCanchas({ sucursalId: sid, size: 50 }).then(data => {
            const arr = (data.content || data).filter(c => c.estadoCancha !== 'INACTIVA');
            nrCancha.innerHTML = '<option value="">— Seleccionar cancha —</option>';
            arr.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c.id || c.canchaId;
                opt.dataset.precio = c.precioHora || 0;
                opt.textContent = `${c.nombre} (S/ ${Number(c.precioHora).toFixed(2)}/h)`;
                nrCancha.appendChild(opt);
            });
            nrCancha.disabled = false;
        });
    }

    function actualizarCostoNR() {
        const pre = parseFloat(document.getElementById('nr-cancha').selectedOptions[0]?.dataset.precio || 0);
        const ini = document.getElementById('nr-hora-inicio').value;
        const fin = document.getElementById('nr-hora-fin').value;
        const box = document.getElementById('nr-costo-box');
        if (!pre || !ini || !fin) { box.style.display = 'none'; return; }

        const [hI, mI] = ini.split(':').map(Number);
        const [hF, mF] = fin.split(':').map(Number);
        const dur = ((hF * 60 + mF) - (hI * 60 + mI)) / 60;
        if (dur <= 0) { box.style.display = 'none'; return; }

        document.getElementById('nr-costo-total').textContent = `S/ ${(pre * dur).toFixed(2)}`;
        document.getElementById('nr-costo-detalle').textContent = `${dur} h × S/ ${pre.toFixed(2)}/h`;
        box.style.display = 'block';
    }

    function abrirModalNuevaReserva() {
        modalNR.open();
        const nrSucursal = document.getElementById('nr-sucursal');
        const nrFecha = document.getElementById('nr-fecha');
        const nrHoraInicio = document.getElementById('nr-hora-inicio');

        const hoy = new Date();
        const pad = (n) => n < 10 ? '0' + n : '' + n;
        nrFecha.value = `${hoy.getFullYear()}-${pad(hoy.getMonth() + 1)}-${pad(hoy.getDate())}`;

        generarSlots(nrHoraInicio, 7, 24, '');

        if (sucursalFiltro && sedeActiva) {
            nrSucursal.innerHTML = `<option value="${sucursalFiltro}">${sedeActiva.nombre}</option>`;
            nrSucursal.value = sucursalFiltro;
            nrSucursal.disabled = true;
            cargarCanchasNR(sucursalFiltro);
        } else {
            nrSucursal.disabled = false;
            cargarSucursalesNR();
        }

        setupNREvents();
    }

    return {
        abrir: abrirModalNuevaReserva,
        mostrarResToast: (msg) => modalNR.showToast(msg)
    };
}
