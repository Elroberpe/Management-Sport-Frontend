// src/features/reservas/reservas.modals.js
import { initModalShell } from '../../shared/components/modal-shell.js';
import { 
    reservaNewFormTemplate, 
    reservaDetailTemplate, 
    reservaPagoFormTemplate 
} from './reservas.modals.template.js';

export function initModals(ctx) {
    const { api, sucursalFiltro, sedeActiva, addGlobalListener, Store } = ctx;

    let _cargarSemana = () => {};
    let _fetchHistorical = () => {};

    function escapeHtml(s) {
        return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }

    /* ─────────────────────────────────────────────────────────────────────
       MODAL NUEVA RESERVA
    ───────────────────────────────────────────────────────────────────── */
    const modalNR = initModalShell({
        id: 'modal-nueva-reserva',
        title: 'Nueva Reserva',
        subtitle: 'Completa los datos para registrar la reserva',
        icon: 'bx bx-calendar-plus',
        confirmText: 'Crear Reserva',
        contentHtml: reservaNewFormTemplate(),
        onConfirm: async (ctx) => {
            const sid = document.getElementById('nr-sucursal').value;
            const cid = document.getElementById('nr-cancha').value;
            const fec = document.getElementById('nr-fecha').value;
            const ini = document.getElementById('nr-hora-inicio').value;
            const fin = document.getElementById('nr-hora-fin').value;
            const cli = document.getElementById('nr-cliente-id').value;

            let hasError = false;
            if (!sid) { ctx.showFieldError('nr-sucursal', 'Requerido'); hasError = true; }
            if (!cid) { ctx.showFieldError('nr-cancha', 'Requerido'); hasError = true; }
            if (!fec) { ctx.showFieldError('nr-fecha', 'Requerido'); hasError = true; }
            if (!ini) { ctx.showFieldError('nr-hora-inicio', 'Requerido'); hasError = true; }
            if (!fin) { ctx.showFieldError('nr-hora-fin', 'Requerido'); hasError = true; }
            if (!cli) { ctx.showFieldError('nr-cliente-input', 'Busca un cliente'); hasError = true; }

            if (hasError) return;

            ctx.setLoading(true);
            try {
                const nueva = await api.post('/reservas', {
                    canchaId: parseInt(cid),
                    clienteId: parseInt(cli),
                    fecha: fec,
                    horaInicio: ini + ':00',
                    horaFin: fin + ':00'
                });
                ctx.showToast('Reserva creada con éxito');
                ctx.close();
                _cargarSemana();
                _fetchHistorical(0);
                abrirDetalleReserva(nueva.id || nueva.reservaId);
            } catch (err) {
                ctx.setLoading(false);
                ctx.showError(err.message || 'Error al crear la reserva');
            }
        }
    });

    function abrirModalNuevaReserva() {
        modalNR.open();
        const nrSucursal = document.getElementById('nr-sucursal');
        const nrFecha = document.getElementById('nr-fecha');
        const nrHoraInicio = document.getElementById('nr-hora-inicio');

        // Setup default date
        const hoy = new Date();
        const pad = (n) => n < 10 ? '0' + n : '' + n;
        nrFecha.value = `${hoy.getFullYear()}-${pad(hoy.getMonth() + 1)}-${pad(hoy.getDate())}`;

        // Setup slots
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

        // Setup autocomplete and events (Simplified for now)
        setupNREvents();
    }

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
                api.get(`/clientes?nombre=${encodeURIComponent(q)}&size=6`).then(data => {
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

        if (btnNuevoCli && ctx.initClienteModal) {
            const modalCli = ctx.initClienteModal({
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
        api.get('/sucursales').then(data => {
            nrSucursal.innerHTML = '<option value="">— Seleccionar sede —</option>';
            (data.content || data).forEach(s => {
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
        api.get(`/canchas?sucursalId=${sid}&size=50`).then(data => {
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

    function generarSlots(el, desde, hasta, selected) {
        el.innerHTML = '<option value="">— Seleccionar —</option>';
        for (let h = desde; h <= hasta; h++) {
            ['00', '30'].forEach(m => {
                if (h === hasta && m === '30') return;
                const val = `${h < 10 ? '0' + h : h}:${m}`;
                const opt = document.createElement('option');
                opt.value = val; opt.textContent = val;
                if (val === selected) opt.selected = true;
                el.appendChild(opt);
            });
        }
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

    /* ─────────────────────────────────────────────────────────────────────
       MODAL DETALLE RESERVA
    ───────────────────────────────────────────────────────────────────── */
    let _drId = null;
    let _drData = null;
    const modalDR = initModalShell({
        id: 'modal-detalle-reserva',
        title: 'Detalle de Reserva',
        icon: 'bx bx-calendar-check',
        confirmText: 'Añadir Pago', // Variable contextualmente
        showConfirm: false, // Lo manejaremos con botones personalizados en el body o footer
        contentHtml: reservaDetailTemplate(),
        onConfirm: () => {} 
    });

    async function abrirDetalleReserva(id) {
        _drId = id;
        modalDR.open();
        document.getElementById('dr-loading').style.display = 'block';
        document.getElementById('dr-content').style.display = 'none';

        try {
            // Bug fix: GET /reservas/{id} NO incluye pagos en su response.
            // Hay que llamar a GET /reservas/{id}/pagos por separado.
            const [reserva, pagos] = await Promise.all([
                api.get(`/reservas/${id}`),
                api.get(`/reservas/${id}/pagos`)
            ]);
            _drData = reserva;
            renderDR(reserva, pagos);
        } catch (err) {
            document.getElementById('dr-loading').innerHTML =
                `<p style="text-align:center; color:#ef4444; padding:20px;"><i class='bx bx-error-circle' style='font-size:2rem; display:block; margin-bottom:8px;'></i>Error al cargar: ${err.message}</p>`;
        }
    }

    // Bug fix: renderDR ahora recibe los pagos como segundo parámetro
    // porque GET /reservas/{id} no los incluye en su response.
    function renderDR(r, pagos = []) {
        document.getElementById('dr-loading').style.display = 'none';
        document.getElementById('dr-content').style.display = 'block';
        
        document.getElementById('dr-cliente').textContent = r.nombreCliente || '—';
        document.getElementById('dr-cancha').textContent = r.nombreCancha || '—';
        document.getElementById('dr-fecha').textContent = `${r.fecha}  ·  ${r.horaInicio.substring(0,5)} - ${r.horaFin.substring(0,5)}`;
        document.getElementById('dr-total').textContent = `S/ ${Number(r.montoTotal).toFixed(2)}`;
        document.getElementById('dr-pagado').textContent = `S/ ${Number(r.montoPagado).toFixed(2)}`;
        
        const saldo = Number(r.saldoPendiente);
        const elSaldo = document.getElementById('dr-saldo');
        elSaldo.textContent = `S/ ${Math.abs(saldo).toFixed(2)}`;
        elSaldo.style.color = saldo > 0 ? '#dc2626' : (saldo < 0 ? '#d97706' : '#059669');

        // Setup Tabs
        const btns = document.querySelectorAll('.dr-tab-btn');
        btns.forEach(b => b.onclick = () => {
            btns.forEach(x => x.classList.remove('active'));
            b.classList.add('active');
            document.querySelectorAll('.dr-tab-content').forEach(c => c.style.display = 'none');
            document.getElementById(b.dataset.tab).style.display = 'block';
        });

        // Renderizar Pagos
        // Bug fix: el campo de fecha correcto es p.fecha (no p.fechaProcesamiento).
        // Excluimos pagos con estado ANULADO para no confundir al usuario.
        const tbody = document.getElementById('dr-tbody-pagos');
        const pagosActivos = pagos.filter(p => p.estado !== 'ANULADO');

        if (pagosActivos.length > 0) {
            tbody.innerHTML = pagosActivos.map(p => `
                <tr>
                    <td>${p.fecha || '—'}</td>
                    <td>${p.metodoPago || '—'}</td>
                    <td style="text-align:right; font-weight:600; color:#059669;">+ S/ ${Number(p.monto).toFixed(2)}</td>
                </tr>
            `).join('');
            document.getElementById('dr-empty-pagos').style.display = 'none';
        } else {
            tbody.innerHTML = '';
            document.getElementById('dr-empty-pagos').style.display = 'block';
        }
    }

    /* ─────────────────────────────────────────────────────────────────────
       MODAL PAGO
    ───────────────────────────────────────────────────────────────────── */
    const modalPago = initModalShell({
        id: 'modal-agregar-pago',
        title: 'Añadir Pago',
        icon: 'bx bx-credit-card',
        confirmText: 'Registrar Pago',
        contentHtml: reservaPagoFormTemplate(),
        onConfirm: async (ctx) => {
            const mon = document.getElementById('ap-monto').value;
            const met = document.getElementById('ap-metodo').value;
            if (!mon || mon <= 0) return ctx.showFieldError('ap-monto', 'Monto inválido');
            if (!met) return ctx.showFieldError('ap-metodo', 'Selecciona método');

            ctx.setLoading(true);
            try {
                await api.post(`/reservas/${_drId}/pagos`, { monto: parseFloat(mon), metodoPago: met });
                ctx.showToast('Pago registrado');
                ctx.close();
                abrirDetalleReserva(_drId);
                _cargarSemana();
                _fetchHistorical(0);
            } catch (err) {
                ctx.setLoading(false);
                ctx.showError(err.message);
            }
        }
    });

    return {
        abrirModalNuevaReserva,
        abrirDetalleReserva,
        abrirModalPago: () => modalPago.open(),
        abrirModalReprogramar: (r) => console.log('Reprog', r),
        abrirModalCancelar: (r) => console.log('Cancel', r),
        abrirModalReembolso: (r) => console.log('Reembolso', r),
        imprimirReciboReserva: (r) => console.log('Print', r),
        mostrarResToast: (msg) => modalNR.showToast(msg),
        setCargarSemana: (fn) => _cargarSemana = fn,
        setFetchHistorical: (fn) => _fetchHistorical = fn,
        setRhCurrentPage: (ref) => {} 
    };
}
