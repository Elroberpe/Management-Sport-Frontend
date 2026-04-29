// src/features/reservas/reservas.modals.js
import { initModalShell } from '../../shared/components/modal-shell.js';
import { 
    reservaNewFormTemplate, 
    reservaDetailTemplate, 
    reservaPagoFormTemplate,
    reservaCancelarTemplate,
    reservaReembolsoTemplate,
    reservaReprogramarTemplate
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
        confirmText: 'Añadir Pago',
        contentHtml: reservaDetailTemplate(),
        // Bug fix: onConfirm estaba vacío — el botón "Añadir Pago" no hacía nada.
        // Ahora cierra el modal de detalle y abre el modal de pago con los datos
        // de la reserva activa (_drId y _drData ya están cargados en el closure).
        onConfirm: (ctx) => {
            ctx.close();
            const saldo = _drData ? Number(_drData.saldoPendiente) : 0;

            // Pre-llenar campos del modal de pago
            const montoInput  = document.getElementById('ap-monto');
            const metodoInput = document.getElementById('ap-metodo');
            const saldoInfo   = document.getElementById('ap-saldo-info');
            const saldoVal    = document.getElementById('ap-saldo-val');

            if (montoInput)  montoInput.value  = saldo > 0 ? saldo.toFixed(2) : '';
            if (metodoInput) metodoInput.value = '';

            if (saldoInfo && saldoVal) {
                if (saldo > 0) {
                    saldoVal.textContent  = `S/ ${saldo.toFixed(2)}`;
                    saldoInfo.style.display = 'flex';
                } else {
                    saldoInfo.style.display = 'none';
                }
            }

            // modalPago está en el mismo closure y ya existe en este punto
            modalPago.open();
        }
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

        // Ocultar botón "Añadir Pago" si el saldo ya está en 0 (pago completo).
        // El ID del botón confirm lo genera modal-shell como `${id}-btn-confirm`.
        const btnAnadirPago = document.getElementById('modal-detalle-reserva-btn-confirm');
        if (btnAnadirPago) {
            btnAnadirPago.style.display = saldo > 0 ? '' : 'none';
        }

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
                    <td>${p.metodoPago || '—'}${tipoBadge}</td>
                    <td style="text-align:right; font-weight:600; color:${color};">${signo} S/ ${Number(p.monto).toFixed(2)}</td>
                </tr>`;
            }).join('');
            document.getElementById('dr-empty-pagos').style.display = 'none';
        } else {
            tbody.innerHTML = '';
            document.getElementById('dr-empty-pagos').style.display = 'block';
        }
    }

    /* ─────────────────────────────────────────────────────────────────────
       MODAL CANCELAR RESERVA
    ───────────────────────────────────────────────────────────────────── */

    // Constantes de penalidad (deben coincidir con el backend)
    const HORAS_LIMITE_PENALIDAD = 3;
    const PORCENTAJE_PENALIDAD   = 0.30;

    /**
     * Calcula el monto a reembolsar según las reglas de negocio.
     * Si faltan >= HORAS_LIMITE horas: reembolso total del montoPagado.
     * Si faltan < HORAS_LIMITE horas: reembolso = montoPagado - (montoTotal * 30%),  mínimo 0.
     */
    function calcularReembolso(reserva) {
        const montoPagado = Number(reserva.montoPagado || 0);
        if (montoPagado <= 0) return 0;

        const ahora         = new Date();
        const inicioReserva = new Date(`${reserva.fecha}T${reserva.horaInicio}`);
        const horasRestantes = (inicioReserva - ahora) / (1000 * 60 * 60);

        if (horasRestantes >= HORAS_LIMITE_PENALIDAD) {
            return montoPagado; // reembolso completo
        } else {
            const penalidad = Number(reserva.montoTotal || 0) * PORCENTAJE_PENALIDAD;
            return Math.max(0, montoPagado - penalidad);
        }
    }

    let _cxData           = null;
    let _cxNecesitaReemb  = false;
    let _cxMontoReemb     = 0;

    const modalCX = initModalShell({
        id:          'modal-cancelar-reserva',
        title:       'Confirmar Cancelación de Reserva',
        icon:        'bx bx-x-circle',
        confirmText: 'Confirmar Cancelación',
        confirmStyle:'danger',
        contentHtml: '<div></div>', // Se rellena dinámicamente en abrirModalCancelar
        onConfirm: async (mCtx) => {
            const motivo = (document.getElementById('cx-motivo')?.value || '').trim();
            if (!motivo) {
                mCtx.showFieldError('cx-motivo', 'El motivo es obligatorio.');
                return;
            }

            if (_cxNecesitaReemb) {
                const metodo = document.getElementById('cx-metodo-reembolso')?.value;
                if (!metodo) {
                    mCtx.showFieldError('cx-metodo-reembolso', 'Selecciona el método de devolución.');
                    return;
                }
            }

            const id    = _cxData.id || _cxData.reservaId;
            const body  = { motivo };
            if (_cxNecesitaReemb) {
                body.metodoPagoReembolso = document.getElementById('cx-metodo-reembolso').value;
            }

            mCtx.setLoading(true);
            try {
                await api.patch(`/reservas/${id}/cancelar`, body);
                mCtx.showToast('Reserva cancelada correctamente');
                mCtx.close();
                _cargarSemana();
                _fetchHistorical(0);
            } catch (err) {
                mCtx.setLoading(false);
                mCtx.showError(err.message || 'Error al cancelar la reserva');
            }
        }
    });

    function abrirModalCancelar(reserva) {
        _cxData          = reserva;
        _cxMontoReemb    = calcularReembolso(reserva);
        _cxNecesitaReemb = _cxMontoReemb > 0;

        // Inyectar contenido dinámico en el body del modal
        const bodyEl = document.querySelector('#modal-cancelar-reserva .modal-shell-body');
        if (bodyEl) {
            bodyEl.innerHTML =
                `<div class="modal-shell-alert-error" id="modal-cancelar-reserva-err-gen" style="display:none;">
                    <i class='bx bx-error-circle'></i>
                    <span id="modal-cancelar-reserva-err-gen-msg"></span>
                </div>` +
                reservaCancelarTemplate({
                    reserva,
                    necesitaReembolso: _cxNecesitaReemb,
                    montoAReembolsar:  _cxMontoReemb
                });
        }
        modalCX.open();
    }

    /* ─────────────────────────────────────────────────────────────────────
       MODAL REEMBOLSO MANUAL
    ───────────────────────────────────────────────────────────────────── */

    let _rmData   = null;
    let _rmCredito = 0;

    const modalRM = initModalShell({
        id:          'modal-reembolso-manual',
        title:       'Registrar Reembolso Manual',
        subtitle:    'Devuelve el crédito disponible al cliente',
        icon:        'bx bx-money-withdraw',
        confirmText: 'Confirmar Reembolso',
        contentHtml: '<div></div>', // Se rellena dinámicamente en abrirModalReembolso
        onConfirm: async (mCtx) => {
            const montoStr = document.getElementById('rm-monto')?.value;
            const monto    = parseFloat(montoStr);
            const metodo   = document.getElementById('rm-metodo')?.value;
            const nota     = (document.getElementById('rm-nota')?.value || '').trim();

            let hasError = false;
            if (!montoStr || isNaN(monto) || monto <= 0) {
                mCtx.showFieldError('rm-monto', 'Ingresa un monto válido.'); hasError = true;
            } else if (monto > _rmCredito) {
                mCtx.showFieldError('rm-monto', `El monto no puede superar S/ ${_rmCredito.toFixed(2)}.`); hasError = true;
            }
            if (!metodo) {
                mCtx.showFieldError('rm-metodo', 'Selecciona el método de devolución.'); hasError = true;
            }
            if (hasError) return;

            const id   = _rmData.id || _rmData.reservaId;
            const body = { monto, metodoPago: metodo };
            if (nota) body.nota = nota;

            mCtx.setLoading(true);
            try {
                await api.post(`/reservas/${id}/reembolsos`, body);
                mCtx.showToast('Reembolso registrado correctamente');
                mCtx.close();
                _fetchHistorical(0);
            } catch (err) {
                mCtx.setLoading(false);
                mCtx.showError(err.message || 'Error al registrar el reembolso');
            }
        }
    });

    function abrirModalReembolso(reserva) {
        _rmData    = reserva;
        _rmCredito = Math.abs(Number(reserva.saldoPendiente || 0));

        // Inyectar contenido dinámico en el body del modal
        const bodyEl = document.querySelector('#modal-reembolso-manual .modal-shell-body');
        if (bodyEl) {
            bodyEl.innerHTML =
                `<div class="modal-shell-alert-error" id="modal-reembolso-manual-err-gen" style="display:none;">
                    <i class='bx bx-error-circle'></i>
                    <span id="modal-reembolso-manual-err-gen-msg"></span>
                </div>` +
                reservaReembolsoTemplate({ credito: _rmCredito });
        }
        modalRM.open();
    }

    /* ─────────────────────────────────────────────────────────────────────
       MODAL REPROGRAMAR RESERVA
    ───────────────────────────────────────────────────────────────────── */

    let _rpData      = null;
    let _rpPrecioHora = 0;

    const modalRP = initModalShell({
        id:          'modal-reprogramar-reserva',
        title:       'Reprogramar Reserva',
        subtitle:    'Selecciona la nueva fecha y horario',
        icon:        'bx bx-calendar-edit',
        confirmText: 'Confirmar Reprogramación',
        contentHtml: '<div></div>',
        onConfirm: async (mCtx) => {
            const fecha  = document.getElementById('rp-fecha')?.value;
            const inicio = document.getElementById('rp-hora-inicio')?.value;
            const fin    = document.getElementById('rp-hora-fin')?.value;

            let hasError = false;
            if (!fecha)  { mCtx.showFieldError('rp-fecha',       'La fecha es requerida.');          hasError = true; }
            if (!inicio) { mCtx.showFieldError('rp-hora-inicio', 'La hora de inicio es requerida.'); hasError = true; }
            if (!fin)    { mCtx.showFieldError('rp-hora-fin',    'La hora de fin es requerida.');    hasError = true; }
            if (hasError) return;

            const id = _rpData.id || _rpData.reservaId;
            mCtx.setLoading(true);
            try {
                await api.post(`/reservas/${id}/reprogramar`, {
                    nuevaFecha:      fecha,
                    nuevaHoraInicio: inicio + ':00',
                    nuevaHoraFin:    fin    + ':00'
                });
                mCtx.showToast('¡Reserva reprogramada con éxito!');
                mCtx.close();
                _cargarSemana();
                _fetchHistorical(0);
            } catch (err) {
                mCtx.setLoading(false);
                mCtx.showError(err.message || 'El horario seleccionado no está disponible.');
            }
        }
    });

    /**
     * Recalcula en tiempo real el impacto financiero del cambio de horario.
     * Usa _rpPrecioHora calculado a partir de la reserva original.
     */
    function recalcularRP() {
        const inicio  = document.getElementById('rp-hora-inicio')?.value;
        const fin     = document.getElementById('rp-hora-fin')?.value;
        const resumen = document.getElementById('rp-resumen');
        if (!resumen) return;

        if (!inicio || !fin) { resumen.style.display = 'none'; return; }

        const [hI, mI] = inicio.split(':').map(Number);
        const [hF, mF] = fin.split(':').map(Number);
        const durHoras  = ((hF * 60 + mF) - (hI * 60 + mI)) / 60;

        if (durHoras <= 0) { resumen.style.display = 'none'; return; }

        const nuevoCosto  = _rpPrecioHora * durHoras;
        const montoPagado = Number(_rpData.montoPagado || 0);
        const ajuste      = nuevoCosto - montoPagado;

        document.getElementById('rp-nuevo-costo').textContent = `S/ ${nuevoCosto.toFixed(2)}`;

        const ajusteEl  = document.getElementById('rp-ajuste-texto');
        const ajusteVal = document.getElementById('rp-ajuste-val');

        if (ajuste > 0.005) {
            ajusteEl.textContent = 'Nuevo saldo a pagar:';
            ajusteVal.textContent = `S/ ${ajuste.toFixed(2)}`;
            ajusteVal.style.color = '#d97706';
        } else if (ajuste < -0.005) {
            ajusteEl.textContent = 'Crédito generado a favor:';
            ajusteVal.textContent = `S/ ${Math.abs(ajuste).toFixed(2)}`;
            ajusteVal.style.color = '#059669';
        } else {
            ajusteEl.textContent = 'Saldo sin cambios:';
            ajusteVal.textContent = 'S/ 0.00';
            ajusteVal.style.color = '#2563eb';
        }

        resumen.style.display = 'block';
    }

    function abrirModalReprogramar(reserva) {
        _rpData = reserva;

        // Inferir precio/hora a partir del monto y duración originales
        const [hi, mi] = (reserva.horaInicio || '00:00').split(':').map(Number);
        const [hf, mf] = (reserva.horaFin    || '00:00').split(':').map(Number);
        const durOrig   = ((hf * 60 + mf) - (hi * 60 + mi)) / 60;
        _rpPrecioHora   = durOrig > 0 ? Number(reserva.montoTotal || 0) / durOrig : 0;

        // Inyectar template en el body del modal
        const bodyEl = document.querySelector('#modal-reprogramar-reserva .modal-shell-body');
        if (bodyEl) {
            bodyEl.innerHTML =
                `<div class="modal-shell-alert-error" id="modal-reprogramar-reserva-err-gen" style="display:none;">
                    <i class='bx bx-error-circle'></i>
                    <span id="modal-reprogramar-reserva-err-gen-msg"></span>
                </div>` +
                reservaReprogramarTemplate(reserva);
        }

        // Pre-llenar fecha con la original
        const rpFecha  = document.getElementById('rp-fecha');
        const rpInicio = document.getElementById('rp-hora-inicio');
        const rpFin    = document.getElementById('rp-hora-fin');
        if (rpFecha) rpFecha.value = reserva.fecha || '';

        // Poblar select de hora inicio con la hora original pre-seleccionada
        generarSlots(rpInicio, 7, 24, (reserva.horaInicio || '').substring(0, 5));

        // Poblar select de hora fin a partir de la hora inicio original
        const inicioVal = (reserva.horaInicio || '07:00').substring(0, 5);
        const [hIni, mIni] = inicioVal.split(':').map(Number);
        const startMin = hIni * 60 + mIni + 30;
        rpFin.innerHTML = '<option value="">\u2014 Seleccionar \u2014</option>';
        rpFin.disabled  = false;
        for (let h = Math.floor(startMin / 60); h <= 24; h++) {
            const mmOpts = (h === Math.floor(startMin / 60) && startMin % 60 === 30) ? ['30'] : ['00', '30'];
            mmOpts.forEach(mm => {
                if (h === 24 && mm === '30') return;
                const time = `${h < 10 ? '0' + h : h}:${mm}`;
                const opt  = document.createElement('option');
                opt.value = time; opt.textContent = time;
                if (time === (reserva.horaFin || '').substring(0, 5)) opt.selected = true;
                rpFin.appendChild(opt);
            });
        }

        // Listeners para recalculación en tiempo real
        rpFecha.onchange  = recalcularRP;
        rpFin.onchange    = recalcularRP;
        rpInicio.onchange = () => {
            const val = rpInicio.value;
            if (!val) {
                rpFin.innerHTML = '<option value="">\u2014 Selecciona inicio \u2014</option>';
                rpFin.disabled  = true;
                recalcularRP();
                return;
            }
            const [h, m] = val.split(':').map(Number);
            const sMin   = h * 60 + m + 30;
            rpFin.innerHTML = '<option value="">\u2014 Seleccionar \u2014</option>';
            rpFin.disabled  = false;
            for (let hh = Math.floor(sMin / 60); hh <= 24; hh++) {
                const mmOpts = (hh === Math.floor(sMin / 60) && sMin % 60 === 30) ? ['30'] : ['00', '30'];
                mmOpts.forEach(mm => {
                    if (hh === 24 && mm === '30') return;
                    const time = `${hh < 10 ? '0' + hh : hh}:${mm}`;
                    const opt  = document.createElement('option');
                    opt.value = time; opt.textContent = time;
                    rpFin.appendChild(opt);
                });
            }
            recalcularRP();
        };

        // Cálculo inicial con los valores originales pre-cargados
        recalcularRP();
        modalRP.open();
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

        /**
         * Abre el modal de pago para una reserva específica.
         * Bug fix: antes la función ignoraba reservaId y saldoPendiente,
         * dejando _drId como null → POST /reservas/null/pagos → error 404.
         *
         * @param {number} reservaId      - ID de la reserva a pagar
         * @param {number} saldoPendiente - Saldo pendiente para pre-llenar el monto
         */
        abrirModalPago: (reservaId, saldoPendiente = 0) => {
            // Actualizar _drId con el ID recibido (puede venir de tabla, calendario o modal detalle)
            _drId = reservaId;

            // Pre-llenar el campo monto con el saldo pendiente para agilizar el flujo
            const montoInput = document.getElementById('ap-monto');
            if (montoInput) {
                montoInput.value = saldoPendiente > 0 ? Number(saldoPendiente).toFixed(2) : '';
            }

            // Resetear el método de pago para forzar selección consciente
            const metodoInput = document.getElementById('ap-metodo');
            if (metodoInput) metodoInput.value = '';

            // Mostrar u ocultar la info del saldo pendiente
            const saldoInfo = document.getElementById('ap-saldo-info');
            const saldoVal  = document.getElementById('ap-saldo-val');
            if (saldoInfo && saldoVal) {
                if (saldoPendiente > 0) {
                    saldoVal.textContent = `S/ ${Number(saldoPendiente).toFixed(2)}`;
                    saldoInfo.style.display = 'flex';
                } else {
                    saldoInfo.style.display = 'none';
                }
            }

            modalPago.open();
        },

        abrirModalReprogramar,
        abrirModalCancelar,
        abrirModalReembolso,
        imprimirReciboReserva: (r) => console.log('Print', r),
        mostrarResToast: (msg) => modalNR.showToast(msg),
        setCargarSemana: (fn) => _cargarSemana = fn,
        setFetchHistorical: (fn) => _fetchHistorical = fn,
        setRhCurrentPage: (ref) => {}
    };
}
