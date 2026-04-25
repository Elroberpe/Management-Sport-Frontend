// src/features/reservas/reservas.modals.js
// Lógica de todos los modales del módulo de reservas:
//   - Modal Nueva Reserva
//   - Modal Detalle de Reserva (Centro de Pagos)
//   - Mini-Modal Añadir Pago
//   - Modal Reprogramar
//   - Modal Crédito a Favor
//   - Modal Cancelar Reserva
//   - Imprimir Recibo
//   - Toast helper (mostrarResToast)

/**
 * Inicializa todos los modales del módulo de reservas.
 *
 * @param {Object} ctx
 * @param {Object}   ctx.api               - Cliente API
 * @param {?number}  ctx.sucursalFiltro    - ID de la sucursal activa
 * @param {Object}   ctx.sedeActiva        - { sucursalId, nombre }
 * @param {Function} ctx.addCleanup        - Registra función de limpieza al unmount
 * @param {Function} ctx.addGlobalListener - Añade event listener global + registra cleanup
 * @param {Object}   ctx.Store             - Para acceso a sede (imprimir recibo)
 *
 * @returns {{ abrirModalNuevaReserva, abrirDetalleReserva, abrirModalPago,
 *             abrirModalReprogramar, abrirModalCancelar, abrirModalCreditoFavor,
 *             imprimirReciboReserva, mostrarResToast,
 *             _getCargarSemana, _setCargarSemana,
 *             _getFetchHistorical, _setFetchHistorical }}
 */
export function initModals(ctx) {
    var api             = ctx.api;
    var sucursalFiltro  = ctx.sucursalFiltro;
    var sedeActiva      = ctx.sedeActiva;
    var addCleanup      = ctx.addCleanup;
    var addGlobalListener = ctx.addGlobalListener;
    var Store           = ctx.Store;

    // Referencias a funciones de otros módulos (se inyectan después de init)
    // Se usan closures para permitir la inyección tardía.
    var _cargarSemana       = function() {};
    var _fetchHistorical    = function(_p) {};
    var _rhCurrentPage      = { value: 0 };

    function escapeHtml(s) {
        return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }

    /* ─────────────────────────────────────────────────────────────────────
       TOAST
    ───────────────────────────────────────────────────────────────────── */
    function mostrarResToast(msg, isError) {
        var t  = document.getElementById('res-toast');
        var tm = document.getElementById('res-toast-msg');
        var ic = t.querySelector('i');
        tm.textContent = msg;
        t.style.background = isError ? '#fef2f2' : '';
        t.style.color      = isError ? '#dc2626' : '';
        if (ic) ic.className = isError ? 'bx bx-x-circle' : 'bx bx-check-circle';
        t.style.display = 'flex';
        setTimeout(function(){ t.style.display = 'none'; }, 3500);
    }

    /* ─────────────────────────────────────────────────────────────────────
       MODAL NUEVA RESERVA
    ───────────────────────────────────────────────────────────────────── */
    var modalNR       = document.getElementById('modal-nueva-reserva');
    var nrSucursal    = document.getElementById('nr-sucursal');
    var nrCancha      = document.getElementById('nr-cancha');
    var nrFecha       = document.getElementById('nr-fecha');
    var nrHoraInicio  = document.getElementById('nr-hora-inicio');
    var nrHoraFin     = document.getElementById('nr-hora-fin');
    var nrClienteIn   = document.getElementById('nr-cliente-input');
    var nrClienteId   = document.getElementById('nr-cliente-id');
    var nrClienteLst  = document.getElementById('nr-cliente-list');
    var nrCostoBox    = document.getElementById('nr-costo-box');
    var nrCostoTotal  = document.getElementById('nr-costo-total');
    var nrCostoDetalle= document.getElementById('nr-costo-detalle');
    var nrErrBox      = document.getElementById('nr-error-box');
    var nrErrMsg      = document.getElementById('nr-error-msg');
    var btnNrSubmit   = document.getElementById('btn-nr-submit');
    var nrSubmitText  = document.getElementById('nr-submit-text');
    var nrSubmitLoad  = document.getElementById('nr-submit-loader');
    var nrBtnNuevoCli  = document.getElementById('nr-btn-nuevo-cliente');

    var _nrPrecioHora  = 0;
    var _nrClienteDebounce;
    addCleanup(function() { clearTimeout(_nrClienteDebounce); });

    function generarSlots(selectEl, desde, hasta, selectedVal) {
        selectEl.innerHTML = '';
        var opt0 = document.createElement('option');
        opt0.value = ''; opt0.textContent = '— Seleccionar —';
        selectEl.appendChild(opt0);
        for (var h = desde; h <= hasta; h++) {
            ['00', '30'].forEach(function(m) {
                if (h === hasta && m === '30') return;
                var pad = function(n){ return n < 10 ? '0' + n : '' + n; };
                var val = pad(h) + ':' + m;
                var opt = document.createElement('option');
                opt.value = val; opt.textContent = val;
                if (val === selectedVal) opt.selected = true;
                selectEl.appendChild(opt);
            });
        }
    }

    function cargarSucursalesNR(preSelectId) {
        nrSucursal.innerHTML = '<option value="">— Cargando sedes… —</option>';
        nrSucursal.disabled = true;
        api.get('/sucursales')
            .then(function(data){
                var arr = Array.isArray(data) ? data : (data.content || []);
                nrSucursal.innerHTML = '<option value="">— Seleccionar sede —</option>';
                arr.filter(function(s){ return s.activo !== false; }).forEach(function(s){
                    var sid = s.sucursalId !== undefined ? s.sucursalId : s.id;
                    var opt = document.createElement('option');
                    opt.value = sid; opt.textContent = s.nombre;
                    if (preSelectId && sid == preSelectId) opt.selected = true;
                    nrSucursal.appendChild(opt);
                });
                nrSucursal.disabled = false;
                if (preSelectId && nrSucursal.value) cargarCanchasNR(nrSucursal.value);
            })
            .catch(function(){
                nrSucursal.innerHTML = '<option value="">— Error al cargar sedes —</option>';
                nrSucursal.disabled = false;
            });
    }

    function cargarCanchasNR(sucursalId) {
        nrCancha.innerHTML = '<option value="">— Cargando canchas… —</option>';
        nrCancha.disabled = true;
        _nrPrecioHora = 0;
        actualizarCostoNR();
        api.get('/canchas?sucursalId=' + sucursalId + '&size=50')
            .then(function(data){
                var arr = Array.isArray(data) ? data : (data.content || []);
                var activas = arr.filter(function(c){ return c.estadoCancha !== 'INACTIVA'; });
                if (activas.length === 0) {
                    nrCancha.innerHTML = '<option value="">— Sin canchas disponibles —</option>';
                    nrCancha.disabled = true; return;
                }
                nrCancha.innerHTML = '<option value="">— Seleccionar cancha —</option>';
                activas.forEach(function(c){
                    var cid = c.canchaId !== undefined ? c.canchaId : c.id;
                    var opt = document.createElement('option');
                    opt.value = cid; opt.dataset.precio = c.precioHora || 0;
                    opt.textContent = c.nombre + (c.precioHora ? ' — S/ ' + Number(c.precioHora).toFixed(2) + '/h' : '');
                    nrCancha.appendChild(opt);
                });
                nrCancha.disabled = false;
            })
            .catch(function(){
                nrCancha.innerHTML = '<option value="">— Error al cargar canchas —</option>';
                nrCancha.disabled = false;
            });
    }

    function actualizarCostoNR() {
        var precio = _nrPrecioHora, inicio = nrHoraInicio.value, fin = nrHoraFin.value;
        if (!precio || !inicio || !fin) { nrCostoBox.style.display = 'none'; return; }
        var hI = parseInt(inicio), mI = parseInt(inicio.split(':')[1]);
        var hF = parseInt(fin),    mF = parseInt(fin.split(':')[1]);
        var durHoras = ((hF * 60 + mF) - (hI * 60 + mI)) / 60;
        if (durHoras <= 0) { nrCostoBox.style.display = 'none'; return; }
        var total = (precio * durHoras).toFixed(2);
        nrCostoTotal.textContent  = 'S/ ' + total;
        nrCostoDetalle.textContent = durHoras + ' h × S/ ' + Number(precio).toFixed(2) + '/h';
        nrCostoBox.style.display = 'block';
    }

    function nrLimpiarErrores() {
        ['nr-err-sucursal','nr-err-cancha','nr-err-fecha','nr-err-inicio','nr-err-fin','nr-err-cliente'].forEach(function(id){
            var el = document.getElementById(id); if (el) el.textContent = '';
        });
        nrErrBox.style.display = 'none'; nrErrMsg.textContent = '';
    }

    function nrSetError(fieldId, msg) {
        var el = document.getElementById(fieldId); if (el) el.textContent = msg;
    }

    function nrReset() {
        nrLimpiarErrores();
        nrSucursal.value = '';
        nrCancha.innerHTML = '<option value="">— Selecciona una sede primero —</option>';
        nrCancha.disabled = true;
        var hoy = new Date();
        var pad = function(n){ return n < 10 ? '0' + n : '' + n; };
        nrFecha.value = hoy.getFullYear() + '-' + pad(hoy.getMonth()+1) + '-' + pad(hoy.getDate());
        generarSlots(nrHoraInicio, 7, 24, '');
        nrHoraFin.innerHTML = '<option value="">— Selecciona hora inicio —</option>';
        nrHoraFin.disabled = true;
        nrClienteIn.value = ''; nrClienteId.value = '';
        nrClienteLst.style.display = 'none';
        nrCostoBox.style.display = 'none';
        _nrPrecioHora = 0;
        btnNrSubmit.disabled = false;
        nrSubmitText.style.display = 'flex';
        nrSubmitLoad.style.display = 'none';
    }

    function abrirModalNuevaReserva() {
        nrReset();
        if (sucursalFiltro && sedeActiva) {
            nrSucursal.innerHTML = '<option value="' + sucursalFiltro + '">' + sedeActiva.nombre + '</option>';
            nrSucursal.value    = sucursalFiltro;
            nrSucursal.disabled = true;
            cargarCanchasNR(sucursalFiltro);
        } else {
            nrSucursal.disabled = false;
            cargarSucursalesNR(null);
        }
        modalNR.style.display = 'flex';
        setTimeout(function(){ nrSucursal.focus(); }, 200);
    }

    function cerrarModalNuevaReserva() { modalNR.style.display = 'none'; }

    /* ─── Inicializar Modal de Nuevo Cliente (Inyectado) ─── */
    var modalNuevoCli = null;
    if (ctx.initClienteModal) {
        modalNuevoCli = ctx.initClienteModal({
            onClienteCreado: function(c) {
                if (nrClienteIn && nrClienteId) {
                    nrClienteIn.value = c.nombre;
                    nrClienteId.value = c.clienteId || c.id;
                    var errCli = document.getElementById('nr-err-cliente');
                    if (errCli) errCli.textContent = '';
                }
            }
        });
    }

    if (nrBtnNuevoCli) {
        nrBtnNuevoCli.addEventListener('click', function(e) {
            e.preventDefault();
            if (modalNuevoCli) modalNuevoCli.abrir();
        });
    }

    document.getElementById('btn-nr-close').addEventListener('click', cerrarModalNuevaReserva);
    document.getElementById('btn-nr-cancel').addEventListener('click', cerrarModalNuevaReserva);
    modalNR.addEventListener('click', function(e){ if (e.target === modalNR) cerrarModalNuevaReserva(); });

    nrSucursal.addEventListener('change', function(){
        var sid = nrSucursal.value;
        document.getElementById('nr-err-sucursal').textContent = '';
        if (!sid) { nrCancha.innerHTML = '<option value="">— Selecciona una sede primero —</option>'; nrCancha.disabled = true; _nrPrecioHora = 0; actualizarCostoNR(); return; }
        cargarCanchasNR(sid);
    });

    nrCancha.addEventListener('change', function(){
        document.getElementById('nr-err-cancha').textContent = '';
        var opt = nrCancha.options[nrCancha.selectedIndex];
        _nrPrecioHora = opt && opt.dataset.precio ? parseFloat(opt.dataset.precio) : 0;
        actualizarCostoNR();
    });

    nrHoraInicio.addEventListener('change', function(){
        document.getElementById('nr-err-inicio').textContent = '';
        var inicio = nrHoraInicio.value;
        if (!inicio) { nrHoraFin.innerHTML = '<option value="">— Selecciona hora inicio —</option>'; nrHoraFin.disabled = true; actualizarCostoNR(); return; }
        var h = parseInt(inicio), m = parseInt(inicio.split(':')[1]);
        var siguienteMin = h * 60 + m + 30;
        var hSig = Math.floor(siguienteMin / 60);
        nrHoraFin.innerHTML = '<option value="">— Seleccionar —</option>';
        nrHoraFin.disabled = false;
        for (var hh = hSig; hh <= 24; hh++) {
            var starts = (hh === hSig && siguienteMin % 60 === 30) ? ['30'] : ['00', '30'];
            if (hh === hSig && m === 30) starts = ['00'];
            starts.forEach(function(mm) {
                if (hh === 24 && mm === '30') return;
                var pad = function(n){ return n < 10 ? '0' + n : '' + n; };
                var val = pad(hh) + ':' + mm;
                if (val === inicio) return;
                var opt = document.createElement('option'); opt.value = val; opt.textContent = val;
                nrHoraFin.appendChild(opt);
            });
        }
        actualizarCostoNR();
    });

    nrHoraFin.addEventListener('change', function(){
        document.getElementById('nr-err-fin').textContent = '';
        actualizarCostoNR();
    });

    nrClienteIn.addEventListener('input', function(){
        clearTimeout(_nrClienteDebounce);
        nrClienteId.value = '';
        document.getElementById('nr-err-cliente').textContent = '';
        var q = nrClienteIn.value.trim();
        if (q.length < 2) { nrClienteLst.style.display = 'none'; return; }
        _nrClienteDebounce = setTimeout(function(){
            api.get('/clientes?nombre=' + encodeURIComponent(q) + '&size=6')
                .then(function(data){
                    var arr = Array.isArray(data) ? data : (data.content || []);
                    if (arr.length === 0) {
                        nrClienteLst.innerHTML = '<li style="color:#94a3b8;pointer-events:none;">No se encontraron clientes</li>';
                    } else {
                        nrClienteLst.innerHTML = arr.map(function(c){
                            return "<li data-id='" + c.id + "' data-nombre='" + escapeHtml(c.nombre) + "'>"
                                 + "<strong>" + escapeHtml(c.nombre) + "</strong>"
                                 + (c.dni ? " <span style='color:#94a3b8;font-size:11px;'>(" + escapeHtml(c.dni) + ")</span>" : "")
                                 + "</li>";
                        }).join('');
                    }
                    nrClienteLst.style.display = 'block';
                }).catch(function(){});
        }, 300);
    });

    nrClienteLst.addEventListener('click', function(e){
        var li = e.target.closest('li');
        if (li && li.dataset.id) {
            nrClienteIn.value = li.dataset.nombre || li.textContent.split('(')[0].trim();
            nrClienteId.value = li.dataset.id;
            nrClienteLst.style.display = 'none';
        }
    });

    var onDocumentClickNuevoCliente = function(e) {
        if (e.target !== nrClienteIn && !nrClienteLst.contains(e.target)) nrClienteLst.style.display = 'none';
    };
    addGlobalListener(document, 'click', onDocumentClickNuevoCliente);

    document.getElementById('nr-btn-nuevo-cliente').addEventListener('click', function(){
        alert('Funcionalidad "Nuevo Cliente" próximamente.');
    });

    btnNrSubmit.addEventListener('click', function(){
        nrLimpiarErrores();
        var valid = true;
        if (!nrSucursal.value)   { nrSetError('nr-err-sucursal', 'Selecciona una sucursal.'); valid = false; }
        if (!nrCancha.value)     { nrSetError('nr-err-cancha',   'Selecciona una cancha.');   valid = false; }
        if (!nrFecha.value)      { nrSetError('nr-err-fecha',    'Selecciona una fecha.');     valid = false; }
        if (!nrHoraInicio.value) { nrSetError('nr-err-inicio',   'Selecciona la hora de inicio.'); valid = false; }
        if (!nrHoraFin.value)    { nrSetError('nr-err-fin',      'Selecciona la hora de fin.');    valid = false; }
        if (!nrClienteId.value)  { nrSetError('nr-err-cliente',  'Busca y selecciona un cliente.'); valid = false; }
        if (!valid) return;

        var payload = {
            canchaId:  parseInt(nrCancha.value),
            clienteId: parseInt(nrClienteId.value),
            fecha:     nrFecha.value,
            horaInicio: nrHoraInicio.value + ':00',
            horaFin:    nrHoraFin.value  + ':00'
        };
        btnNrSubmit.disabled = true;
        nrSubmitText.style.display = 'none';
        nrSubmitLoad.style.display = 'flex';

        api.post('/reservas', payload)
        .then(function(nuevaReserva){
            cerrarModalNuevaReserva();
            mostrarResToast('¡Reserva creada con éxito!');
            _cargarSemana();
            _fetchHistorical(0);
            var reservaId = nuevaReserva.id || nuevaReserva.reservaId;
            if (reservaId) abrirDetalleReserva(reservaId);
        })
        .catch(function(e){
            btnNrSubmit.disabled = false;
            nrSubmitText.style.display = 'flex';
            nrSubmitLoad.style.display = 'none';
            nrErrMsg.textContent = e.message;
            nrErrBox.style.display = 'flex';
        });
    });

    /* ─────────────────────────────────────────────────────────────────────
       MODAL DETALLE RESERVA (Centro de Pagos)
    ───────────────────────────────────────────────────────────────────── */
    var _drReservaId = null;
    var _drCurrentReservaData = null;

    function abrirDetalleReserva(reservaId) {
        _drReservaId = reservaId;
        document.getElementById('dr-title-main').textContent   = 'Detalle de Reserva';
        document.getElementById('dr-badge-estado').textContent = '...';
        document.getElementById('dr-badge-estado').className   = 'badge'; // clear color classes
        document.getElementById('dr-loading').style.display  = 'block';
        document.getElementById('dr-content').style.display  = 'none';
        document.getElementById('dr-footer').style.display   = 'none';
        
        // Default to Tab 1
        var contentTabs = document.querySelectorAll('.dr-tab-content');
        contentTabs.forEach(function(t) { t.classList.remove('active'); t.style.display = 'none'; });
        document.getElementById('tab-detalles').classList.add('active');
        document.getElementById('tab-detalles').style.display = 'block';

        var navBtns = document.querySelectorAll('.dr-tab-btn');
        navBtns.forEach(function(b) { b.classList.remove('active'); });
        document.querySelector('.dr-tab-btn[data-tab="tab-detalles"]').classList.add('active');

        document.getElementById('modal-detalle-reserva').style.display = 'flex';

        api.get('/reservas/' + reservaId)
            .then(function(r) { renderDetalleModal(r); })
            .catch(function() {
                document.getElementById('dr-loading').style.display = 'none';
                document.getElementById('dr-content').innerHTML = '<p style="color:#ef4444;text-align:center;padding:20px;">No se pudieron cargar los detalles.</p>';
                document.getElementById('dr-content').style.display = 'block';
            });
    }

    function renderDetalleModal(r) {
        _drCurrentReservaData = r;
        var ESTADO_LABEL = { PENDIENTE:'PENDIENTE', PAGADA:'PAGADA', COMPLETADO:'COMPLETADA', CANCELADO:'CANCELADA', REEMBOLSADO:'REEMBOLSADA' };
        var ESTADO_CLASS = { 
            PENDIENTE:   'bg-amber-100 text-amber-700', 
            PAGADA:      'bg-emerald-100 text-emerald-700', 
            COMPLETADO:  'bg-blue-100 text-blue-700', 
            CANCELADO:   'bg-rose-100 text-rose-700', 
            REEMBOLSADO: 'bg-purple-100 text-purple-700' 
        };
        
        var fDate   = new Date(r.fecha + 'T00:00:00');
        var DIAS    = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
        var duration = '';
        if (r.horaInicio && r.horaFin) {
            var hI = parseInt(r.horaInicio), mI = parseInt(r.horaInicio.split(':')[1]);
            var hF = parseInt(r.horaFin),    mF = parseInt(r.horaFin.split(':')[1]);
            var durHoras = ((hF * 60 + mF) - (hI * 60 + mI)) / 60;
            duration = ' (' + durHoras + ' h)';
        }
        var fechaStr = DIAS[fDate.getDay()] + ' ' + fDate.getDate() + '  ·  ' + (r.horaInicio||'').substring(0,5) + ' – ' + (r.horaFin||'').substring(0,5);

        // Header
        document.getElementById('dr-title-main').textContent   = 'Reserva #' + r.id;
        
        var badge = document.getElementById('dr-badge-estado');
        var ESTADO_COLORS = { 
            PENDIENTE:   {bg: '#f59e0b', text: '#fff'}, 
            PAGADA:      {bg: '#10b981', text: '#fff'}, 
            COMPLETADO:  {bg: '#3b82f6', text: '#fff'}, 
            CANCELADO:   {bg: '#ef4444', text: '#fff'}, 
            REEMBOLSADO: {bg: '#8b5cf6', text: '#fff'} 
        };
        var colorState = ESTADO_COLORS[r.estadoReserva] || {bg: '#f1f5f9', text: '#475569'};
        
        badge.style.background = colorState.bg;
        badge.style.color = colorState.text;
        badge.textContent = ESTADO_LABEL[r.estadoReserva] || r.estadoReserva;

        // Info Izquierda
        document.getElementById('dr-cliente').textContent  = r.nombreCliente || '—';
        document.getElementById('dr-cancha').textContent   = r.nombreCancha  || '—';
        document.getElementById('dr-fecha').textContent    = fechaStr;
        document.getElementById('dr-duracion').textContent = duration;

        // Info Derecha
        var total = Number(r.montoTotal || 0);
        var pagado = Number(r.montoPagado || 0);
        var saldo  = Number(r.saldoPendiente || 0);

        document.getElementById('dr-total').textContent  = 'S/ ' + total.toFixed(2);
        document.getElementById('dr-pagado').textContent = 'S/ ' + pagado.toFixed(2);

        var saldoEl = document.getElementById('dr-saldo');
        saldoEl.textContent = 'S/ ' + Math.abs(saldo).toFixed(2);
        if (saldo < 0) {
            saldoEl.style.color = '#d97706'; // Ambar - A favor del cliente
        } else if (saldo > 0) {
            saldoEl.style.color = '#dc2626'; // Rojo - Deuda
        } else {
            saldoEl.style.color = '#059669'; // Verde - Pagado
        }

        // TAB PENSIONES (Simulado si backend aún no manda r.pagos)
        var tbodyPagos = document.getElementById('dr-tbody-pagos');
        var emptyPagos = document.getElementById('dr-empty-pagos');
        tbodyPagos.innerHTML = '';
        if (r.pagos && r.pagos.length > 0) {
            emptyPagos.style.display = 'none';
            r.pagos.forEach(function(p) {
                var tr = document.createElement('tr');
                tr.innerHTML = 
                    '<td>' + (p.fechaProcesamiento ? p.fechaProcesamiento.substring(0, 10) : '—') + '</td>' +
                    '<td><span style="font-family:monospace; color:#64748b; font-size:11px;">' + (p.pagoId || p.id) + '</span></td>' +
                    '<td>' + (p.metodoPago || '—') + '</td>' +
                    '<td style="text-align:right; font-weight:600; color:#059669;">+ S/ ' + Number(p.monto).toFixed(2) + '</td>';
                tbodyPagos.appendChild(tr);
            });
        } else {
            // Placeholder: Si la reserva está PAGADA o tiene algo pagado y está sin array, poner row virtual
            if (pagado > 0) {
                 emptyPagos.style.display = 'none';
                 tbodyPagos.innerHTML = '<tr><td>' + (r.fecha || '—') + '</td><td><span style="font-family:monospace; color:#64748b; font-size:11px;">VIRT-1</span></td><td>' + (r.metodoPago || 'MÚLTIPLE') + '</td><td style="text-align:right; font-weight:600; color:#059669;">+ S/ ' + pagado.toFixed(2) + '</td></tr>';
            } else {
                 emptyPagos.style.display = 'block';
            }
        }

        // TAB LOGS
        var logsList = document.getElementById('dr-logs-list');
        logsList.innerHTML = '<li><span class="dr-log-time">Sistema</span> Generación de Ticket Reserva #' + r.id + ' para ' + (r.nombreCliente || 'Cliente') + '.</li>';
        if (pagado > 0) {
            logsList.innerHTML = '<li><span class="dr-log-time">Caja</span> Pago recibido por S/ ' + pagado.toFixed(2) + '</li>' + logsList.innerHTML;
        }

        // FOOTER BOTONES Contextuales
        var btnPago = document.getElementById('btn-dr-pago');
        var btnReprog = document.getElementById('btn-dr-reprogramar');
        var btnCancelR = document.getElementById('btn-dr-cancelar-reserva');
        var btnImpresion = document.getElementById('btn-dr-imprimir');
        var btnReembolso = document.getElementById('btn-dr-reembolso');

        // Reset todos a none
        btnPago.style.display = 'none';
        btnReprog.style.display = 'none';
        btnCancelR.style.display = 'none';
        btnImpresion.style.display = 'none';
        btnReembolso.style.display = 'none';

        var est = r.estadoReserva;
        
        if (est === 'PENDIENTE') {
            btnPago.style.display = '';
            btnReprog.style.display = '';
            btnCancelR.style.display = '';
            btnPago.dataset.reservaId = r.id;
            btnPago.dataset.saldo = saldo.toFixed(2);
        } else if (est === 'PAGADA') {
            btnReprog.style.display = '';
            btnCancelR.style.display = '';
            btnImpresion.style.display = '';
            btnPago.dataset.reservaId = r.id; // Just in case
        } 

        if (saldo < 0 && est !== 'CANCELADO') {
            btnReembolso.style.display = '';
        }

        // Completado/Cancelado solo Cerrar o Reembolso si aplica y fue cancelada
        if (est === 'CANCELADO' && Math.abs(pagado) > 0 && Math.abs(saldo) > 0) {
            btnReembolso.style.display = '';
        } 

        document.getElementById('dr-loading').style.display = 'none';
        document.getElementById('dr-content').style.display = 'block';
        document.getElementById('dr-footer').style.display  = 'flex';
    }

    function cerrarDetalleReserva() {
        document.getElementById('modal-detalle-reserva').style.display = 'none';
        _drReservaId = null;
    }

    // Tabs Nav Logic
    var tabsBtns = document.querySelectorAll('.dr-tab-btn');
    tabsBtns.forEach(function(btn) {
        btn.addEventListener('click', function() {
            var targetId = this.dataset.tab;
            // Quitamos activo a todos
            tabsBtns.forEach(function(b) { b.classList.remove('active'); });
            var contentTabs = document.querySelectorAll('.dr-tab-content');
            contentTabs.forEach(function(t) { t.classList.remove('active'); t.style.display = 'none'; });
            
            // Activamos actual
            this.classList.add('active');
            var elT = document.getElementById(targetId);
            if(elT) {
                elT.classList.add('active');
                elT.style.display = 'block';
            }
        });
    });

    document.getElementById('btn-dr-close').addEventListener('click',  cerrarDetalleReserva);
    document.getElementById('btn-dr-close2').addEventListener('click', cerrarDetalleReserva);
    document.getElementById('modal-detalle-reserva').addEventListener('click', function(e) {
        if (e.target === this) cerrarDetalleReserva();
    });
    
    document.getElementById('btn-dr-pago').addEventListener('click', function() {
        abrirModalPago(_drReservaId, parseFloat(this.dataset.saldo || 0));
    });
    
    document.getElementById('btn-dr-reembolso').addEventListener('click', function() {
        abrirModalReembolso(_drCurrentReservaData);
    });

    document.getElementById('btn-dr-reprogramar').addEventListener('click', function() {
        if (_drCurrentReservaData) {
            cerrarDetalleReserva();
            abrirModalReprogramar(_drCurrentReservaData);
        }
    });

    document.getElementById('btn-dr-cancelar-reserva').addEventListener('click', function() {
        if (_drCurrentReservaData) {
            cerrarDetalleReserva();
            abrirModalCancelar(_drCurrentReservaData);
        }
    });

    document.getElementById('btn-dr-imprimir').addEventListener('click', function() {
        if (_drCurrentReservaData) imprimirReciboReserva(_drCurrentReservaData);
    });

    /* ─────────────────────────────────────────────────────────────────────
       MINI-MODAL AÑADIR PAGO
    ───────────────────────────────────────────────────────────────────── */
    function abrirModalPago(reservaId, saldoPendiente) {
        document.getElementById('ap-subtitle').textContent    = 'Saldo pendiente: S/ ' + Number(saldoPendiente).toFixed(2);
        document.getElementById('ap-monto').value             = '';
        document.getElementById('ap-monto').max               = saldoPendiente;
        document.getElementById('ap-metodo').value            = '';
        document.getElementById('ap-error-box').style.display = 'none';
        document.getElementById('ap-err-monto').textContent   = '';
        document.getElementById('ap-err-metodo').textContent  = '';
        document.getElementById('ap-submit-text').style.display   = 'flex';
        document.getElementById('ap-submit-loader').style.display = 'none';
        document.getElementById('btn-ap-submit').disabled         = false;
        document.getElementById('btn-ap-submit').dataset.reservaId = reservaId;
        document.getElementById('modal-agregar-pago').style.display = 'flex';
        setTimeout(function() { document.getElementById('ap-monto').focus(); }, 100);
    }

    function cerrarModalPago() {
        document.getElementById('modal-agregar-pago').style.display = 'none';
    }

    document.getElementById('btn-ap-close').addEventListener('click',  cerrarModalPago);
    document.getElementById('btn-ap-cancel').addEventListener('click', cerrarModalPago);
    document.getElementById('modal-agregar-pago').addEventListener('click', function(e) {
        if (e.target === this) cerrarModalPago();
    });

    document.getElementById('btn-ap-submit').addEventListener('click', function() {
        var reservaId = this.dataset.reservaId;
        var monto     = parseFloat(document.getElementById('ap-monto').value);
        var metodo    = document.getElementById('ap-metodo').value;
        var valid     = true;
        document.getElementById('ap-err-monto').textContent   = '';
        document.getElementById('ap-err-metodo').textContent  = '';
        document.getElementById('ap-error-box').style.display = 'none';
        if (!monto || isNaN(monto) || monto <= 0) { document.getElementById('ap-err-monto').textContent = 'Ingresa un monto válido mayor a 0.'; valid = false; }
        if (!metodo) { document.getElementById('ap-err-metodo').textContent = 'Selecciona un método de pago.'; valid = false; }
        if (!valid) return;

        this.disabled = true;
        document.getElementById('ap-submit-text').style.display   = 'none';
        document.getElementById('ap-submit-loader').style.display = 'flex';

        api.post('/reservas/' + reservaId + '/pagos', { monto: monto, metodoPago: metodo })
        .then(function() {
            cerrarModalPago();
            mostrarResToast('¡Pago registrado correctamente!');
            abrirDetalleReserva(reservaId);
            _cargarSemana();
            _fetchHistorical(0);
        })
        .catch(function(e) {
            document.getElementById('btn-ap-submit').disabled = false;
            document.getElementById('ap-submit-text').style.display   = 'flex';
            document.getElementById('ap-submit-loader').style.display = 'none';
            document.getElementById('ap-error-msg').textContent       = e.message;
            document.getElementById('ap-error-box').style.display     = 'flex';
        });
    });

    /* ─────────────────────────────────────────────────────────────────────
       MODAL REPROGRAMAR
    ───────────────────────────────────────────────────────────────────── */
    var _rpReservaId = null;

    function abrirModalReprogramar(r) {
        _rpReservaId = r.id || r.reservaId;
        var DIAS = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
        var fDate = new Date(r.fecha + 'T00:00:00');
        var horarioActual = DIAS[fDate.getDay()] + ', ' + r.fecha + '  ·  ' + (r.horaInicio||'').substring(0,5) + ' – ' + (r.horaFin||'').substring(0,5);

        document.getElementById('rp-title').textContent          = 'Reprogramar Reserva #' + _rpReservaId;
        document.getElementById('rp-subtitle').textContent       = 'Cliente: ' + (r.nombreCliente || '—');
        document.getElementById('rp-horario-actual').textContent = horarioActual;
        document.getElementById('rp-fecha').value   = '';
        document.getElementById('rp-inicio').value  = '';
        document.getElementById('rp-fin').value     = '';
        document.getElementById('rp-nota').value    = '';
        document.getElementById('rp-err-fecha').textContent  = '';
        document.getElementById('rp-err-inicio').textContent = '';
        document.getElementById('rp-err-fin').textContent    = '';
        document.getElementById('rp-error-box').style.display = 'none';
        document.getElementById('rp-submit-text').style.display   = 'flex';
        document.getElementById('rp-submit-loader').style.display = 'none';
        document.getElementById('btn-rp-submit').disabled = false;
        document.getElementById('modal-reprogramar').style.display = 'flex';
    }

    function cerrarModalReprogramar() {
        document.getElementById('modal-reprogramar').style.display = 'none';
        _rpReservaId = null;
    }

    document.getElementById('btn-rp-close').addEventListener('click',  cerrarModalReprogramar);
    document.getElementById('btn-rp-cancel').addEventListener('click', cerrarModalReprogramar);
    document.getElementById('modal-reprogramar').addEventListener('click', function(e) {
        if (e.target === this) cerrarModalReprogramar();
    });

    document.getElementById('btn-rp-submit').addEventListener('click', function() {
        var fecha  = document.getElementById('rp-fecha').value;
        var inicio = document.getElementById('rp-inicio').value;
        var fin    = document.getElementById('rp-fin').value;
        var valid  = true;
        document.getElementById('rp-err-fecha').textContent  = '';
        document.getElementById('rp-err-inicio').textContent = '';
        document.getElementById('rp-err-fin').textContent    = '';
        document.getElementById('rp-error-box').style.display = 'none';
        if (!fecha)  { document.getElementById('rp-err-fecha').textContent  = 'Selecciona la nueva fecha.';    valid = false; }
        if (!inicio) { document.getElementById('rp-err-inicio').textContent = 'Selecciona la hora de inicio.'; valid = false; }
        if (!fin)    { document.getElementById('rp-err-fin').textContent    = 'Selecciona la hora de fin.';    valid = false; }
        if (inicio && fin && inicio >= fin) { document.getElementById('rp-err-fin').textContent = 'La hora de fin debe ser mayor que la de inicio.'; valid = false; }
        if (!valid) return;

        this.disabled = true;
        document.getElementById('rp-submit-text').style.display   = 'none';
        document.getElementById('rp-submit-loader').style.display = 'flex';

        var payload = { nuevaFecha: fecha, nuevaHoraInicio: inicio + ':00', nuevaHoraFin: fin + ':00' };
        var nota = document.getElementById('rp-nota').value.trim();
        if (nota) payload.nota = nota;

        api.post('/reservas/' + _rpReservaId + '/reprogramar', payload)
        .then(function(nuevaReserva) {
            cerrarModalReprogramar();
            mostrarResToast('¡Reserva reprogramada correctamente!');
            _cargarSemana();
            _fetchHistorical(_rhCurrentPage.value);
            if (nuevaReserva && nuevaReserva.saldoPendiente < 0) abrirModalReembolso(nuevaReserva);
        })
        .catch(function(err) {
            document.getElementById('btn-rp-submit').disabled = false;
            document.getElementById('rp-submit-text').style.display   = 'flex';
            document.getElementById('rp-submit-loader').style.display = 'none';
            document.getElementById('rp-error-msg').textContent       = err.message;
            document.getElementById('rp-error-box').style.display     = 'flex';
        });
    });

    /* ─────────────────────────────────────────────────────────────────────
       MODAL REEMBOLSO REQUERIDO (2 pasos)
    ───────────────────────────────────────────────────────────────────── */
    var _rfReserva = null;

    function abrirModalReembolso(reserva) {
        if (!reserva) return;
        _rfReserva = reserva;
        var total   = Number(reserva.montoTotal   || 0);
        var pagado  = Number(reserva.montoPagado  || 0);
        var credito = Math.abs(Number(reserva.saldoPendiente || 0));
        document.getElementById('rf-nuevo-total').textContent     = 'S/ ' + total.toFixed(2);
        document.getElementById('rf-ya-pagado').textContent       = 'S/ ' + pagado.toFixed(2);
        document.getElementById('rf-monto-reembolso').textContent = 'S/ ' + credito.toFixed(2);
        mostrarRfPaso1();
        document.getElementById('modal-reembolso').style.display = 'flex';
    }

    function mostrarRfPaso1() {
        document.getElementById('rf-info-section').style.display  = 'block';
        document.getElementById('rf-form-section').style.display  = 'none';
    }

    function mostrarRfPaso2() {
        var credito = Math.abs(Number(_rfReserva ? _rfReserva.saldoPendiente : 0));
        document.getElementById('rf-monto-display').value         = 'S/ ' + credito.toFixed(2);
        document.getElementById('rf-metodo').value                = '';
        document.getElementById('rf-nota').value                  = '';
        document.getElementById('rf-err-metodo').textContent      = '';
        document.getElementById('rf-error-box').style.display     = 'none';
        document.getElementById('rf-confirm-text').style.display  = 'flex';
        document.getElementById('rf-confirm-loader').style.display = 'none';
        document.getElementById('btn-rf-confirm').disabled        = false;
        document.getElementById('rf-info-section').style.display  = 'none';
        document.getElementById('rf-form-section').style.display  = 'block';
    }

    function cerrarModalReembolso() {
        document.getElementById('modal-reembolso').style.display = 'none';
        _rfReserva = null;
    }

    document.getElementById('btn-rf-recordar').addEventListener('click', cerrarModalReembolso);
    document.getElementById('btn-rf-registrar').addEventListener('click', mostrarRfPaso2);
    document.getElementById('btn-rf-form-cancel').addEventListener('click', mostrarRfPaso1);
    document.getElementById('modal-reembolso').addEventListener('click', function(e) {
        if (e.target === this) cerrarModalReembolso();
    });

    document.getElementById('btn-rf-confirm').addEventListener('click', function() {
        var metodo = document.getElementById('rf-metodo').value;
        document.getElementById('rf-err-metodo').textContent  = '';
        document.getElementById('rf-error-box').style.display = 'none';
        if (!metodo) { document.getElementById('rf-err-metodo').textContent = 'Selecciona el método de reembolso.'; return; }
        if (!_rfReserva) return;

        var credito = Math.abs(Number(_rfReserva.saldoPendiente || 0));
        var nota    = document.getElementById('rf-nota').value.trim();
        var payload = { monto: credito, metodoPago: metodo };
        if (nota) payload.nota = nota;

        this.disabled = true;
        document.getElementById('rf-confirm-text').style.display   = 'none';
        document.getElementById('rf-confirm-loader').style.display = 'flex';

        api.post('/reservas/' + _rfReserva.id + '/reembolsos', payload)
        .then(function() {
            cerrarModalReembolso();
            mostrarResToast('¡Reembolso de S/ ' + credito.toFixed(2) + ' registrado con éxito!');
            _cargarSemana();
            _fetchHistorical(_rhCurrentPage.value);
        })
        .catch(function(err) {
            document.getElementById('btn-rf-confirm').disabled = false;
            document.getElementById('rf-confirm-text').style.display   = 'flex';
            document.getElementById('rf-confirm-loader').style.display = 'none';
            document.getElementById('rf-error-msg').textContent        = err.message;
            document.getElementById('rf-error-box').style.display      = 'flex';
        });
    });

    /* ─────────────────────────────────────────────────────────────────────
       MODAL CANCELAR RESERVA
    ───────────────────────────────────────────────────────────────────── */
    var _crReservaData = null;

    function abrirModalCancelar(r) {
        _crReservaData = r;
        var id     = r.id || r.reservaId;
        var pagado = Number(r.montoPagado || 0);

        document.getElementById('cr-title').textContent    = '¿Cancelar Reserva #' + id + '?';
        document.getElementById('cr-subtitle').textContent = 'Cliente: ' + (r.nombreCliente || '—') + '  ·  Cancha: ' + (r.nombreCancha || '—');
        document.getElementById('cr-info-texto').textContent =
            'Estás a punto de cancelar la reserva de ' + (r.nombreCliente || 'este cliente') + ' para la ' + (r.nombreCancha || 'cancha seleccionada') + '.';

        var reembolsoEl = document.getElementById('cr-info-reembolso');
        reembolsoEl.style.display = pagado > 0 ? 'block' : 'none';
        if (pagado > 0) reembolsoEl.textContent = '⚠️ La reserva tiene S/ ' + pagado.toFixed(2) + ' pagados. Al cancelar, se generará un reembolso automático.';

        document.getElementById('cr-motivo').value           = '';
        document.getElementById('cr-err-motivo').textContent = '';
        document.getElementById('cr-error-box').style.display = 'none';
        document.getElementById('cr-submit-text').style.display   = 'flex';
        document.getElementById('cr-submit-loader').style.display = 'none';
        document.getElementById('btn-cr-submit').disabled = false;
        document.getElementById('modal-cancelar-reserva').style.display = 'flex';
    }

    function cerrarModalCancelar() {
        document.getElementById('modal-cancelar-reserva').style.display = 'none';
        _crReservaData = null;
    }

    document.getElementById('btn-cr-close').addEventListener('click',  cerrarModalCancelar);
    document.getElementById('btn-cr-cancel').addEventListener('click', cerrarModalCancelar);
    document.getElementById('modal-cancelar-reserva').addEventListener('click', function(e) {
        if (e.target === this) cerrarModalCancelar();
    });

    document.getElementById('btn-cr-submit').addEventListener('click', function() {
        var motivo = (document.getElementById('cr-motivo').value || '').trim();
        if (!motivo) { document.getElementById('cr-err-motivo').textContent = 'El motivo de cancelación es obligatorio.'; return; }
        if (!_crReservaData) return;
        var id = _crReservaData.id || _crReservaData.reservaId;

        this.disabled = true;
        document.getElementById('cr-submit-text').style.display   = 'none';
        document.getElementById('cr-submit-loader').style.display = 'flex';
        document.getElementById('cr-error-box').style.display     = 'none';

        api.patch('/reservas/' + id + '/cancelar', { motivo: motivo })
        .then(function() {
            cerrarModalCancelar();
            mostrarResToast('Reserva cancelada correctamente.');
            _cargarSemana();
            _fetchHistorical(_rhCurrentPage.value);
        })
        .catch(function(err) {
            document.getElementById('btn-cr-submit').disabled = false;
            document.getElementById('cr-submit-text').style.display   = 'flex';
            document.getElementById('cr-submit-loader').style.display = 'none';
            document.getElementById('cr-error-msg').textContent       = err.message;
            document.getElementById('cr-error-box').style.display     = 'flex';
        });
    });

    /* ─────────────────────────────────────────────────────────────────────
       IMPRIMIR RECIBO
    ───────────────────────────────────────────────────────────────────── */
    function imprimirReciboReserva(r) {
        var empresa  = (Store.getSucursal() && Store.getSucursal().nombre) ? Store.getSucursal().nombre : 'PitchPro';
        var id       = r.id || r.reservaId;
        var fHora    = (r.horaInicio||'').substring(0,5) + ' – ' + (r.horaFin||'').substring(0,5);
        var concepto = 'Alquiler de ' + (r.nombreCancha||'Cancha') + ' (' + r.fecha + ', ' + fHora + ')';
        var ESTADO_LABEL = { PENDIENTE:'PENDIENTE', PAGADA:'PAGADA', COMPLETADO:'COMPLETADA', CANCELADO:'CANCELADA', REEMBOLSADO:'REEMBOLSADA' };
        var METODO_ICON  = { EFECTIVO:'💵', YAPE:'📱', PLIN:'📱', TRANSFERENCIA:'🏦', TARJETA:'💳' };

        var html = [
            '<!DOCTYPE html><html lang="es"><head>',
            '<meta charset="UTF-8"><title>Recibo — Reserva #' + id + '</title>',
            '<style>',
            '  * { margin:0; padding:0; box-sizing:border-box; }',
            '  body { font-family:"Helvetica Neue",Arial,sans-serif; color:#1e293b; padding:40px; max-width:520px; margin:0 auto; }',
            '  .logo { font-size:24px; font-weight:900; color:#1e3a5f; letter-spacing:-0.5px; }',
            '  .logo span { color:#3b82f6; }',
            '  .header { text-align:center; border-bottom:2px solid #e2e8f0; padding-bottom:20px; margin-bottom:24px; }',
            '  .sub { font-size:12px; color:#64748b; letter-spacing:2px; text-transform:uppercase; margin-top:4px; }',
            '  .recibo-no { font-size:22px; font-weight:800; color:#0f172a; text-align:center; margin-bottom:20px; }',
            '  table { width:100%; border-collapse:collapse; margin-bottom:20px; }',
            '  tr { border-bottom:1px solid #f1f5f9; }',
            '  td { padding:10px 4px; font-size:13px; }',
            '  td:first-child { color:#64748b; width:42%; }',
            '  td:last-child  { color:#0f172a; font-weight:700; }',
            '  .total-box { background:#f8fafc; border-radius:12px; padding:16px 20px; text-align:center; margin-bottom:20px; }',
            '  .total-label { font-size:11px; color:#94a3b8; letter-spacing:1px; text-transform:uppercase; }',
            '  .total-value { font-size:32px; font-weight:900; color:#059669; margin:6px 0; }',
            '  .estado { display:inline-block; padding:3px 14px; border-radius:20px; font-size:11px; font-weight:700; background:#dcfce7; color:#15803d; }',
            '  .footer { text-align:center; font-size:11px; color:#94a3b8; border-top:1px solid #e2e8f0; padding-top:16px; margin-top:20px; }',
            '  @media print { body { padding:20px; } }',
            '</style></head><body>',
            '<div class="header">',
            '  <div class="logo">Pitch<span>Pro</span></div>',
            '  <div class="sub">' + empresa + ' — Recibo de Pago</div>',
            '</div>',
            '<div class="recibo-no">RESERVA #' + id + '</div>',
            '<table>',
            '  <tr><td>Fecha de Emisión</td><td>' + new Date().toLocaleDateString('es-PE') + '</td></tr>',
            '  <tr><td>Cliente</td><td>' + (r.nombreCliente||'—') + '</td></tr>',
            '  <tr><td>Concepto</td><td>' + concepto + '</td></tr>',
            '  <tr><td>Estado</td><td>' + (ESTADO_LABEL[r.estadoReserva]||r.estadoReserva||'—') + '</td></tr>',
            r.metodoPago ? '  <tr><td>Método de Pago</td><td>' + (METODO_ICON[r.metodoPago]||'💳') + ' ' + r.metodoPago + '</td></tr>' : '',
            '</table>',
            '<div class="total-box">',
            '  <div class="total-label">Monto Pagado</div>',
            '  <div class="total-value">S/ ' + Number(r.montoPagado||0).toFixed(2) + '</div>',
            '  <span class="estado">' + (ESTADO_LABEL[r.estadoReserva]||r.estadoReserva||'—') + '</span>',
            '</div>',
            Number(r.saldoPendiente||0) > 0
                ? '<p style="text-align:center;color:#dc2626;font-size:13px;font-weight:700;margin-bottom:16px;">⚠️ Saldo pendiente: S/ ' + Number(r.saldoPendiente||0).toFixed(2) + '</p>'
                : '',
            '<div class="footer">Gracias por su preferencia · ' + empresa + '</div>',
            '</body></html>'
        ].join('\n');

        var win = window.open('', '_blank', 'width=620,height=750');
        win.document.write(html);
        win.document.close();
        win.focus();
        setTimeout(function() { win.print(); }, 400);
    }

    /* ─────────────────────────────────────────────────────────────────────
       ESCAPE GLOBAL (cierra el modal activo de mayor prioridad)
    ───────────────────────────────────────────────────────────────────── */
    var onDocumentKeydownModals = function(e) {
        if (e.key === 'Escape') {
            if (document.getElementById('modal-reembolso').style.display !== 'none')         { cerrarModalReembolso();    return; }
            if (document.getElementById('modal-cancelar-reserva').style.display !== 'none')  { cerrarModalCancelar();    return; }
            if (document.getElementById('modal-reprogramar').style.display !== 'none')       { cerrarModalReprogramar(); return; }
            if (document.getElementById('modal-agregar-pago').style.display !== 'none')      { cerrarModalPago();        return; }
            if (document.getElementById('modal-detalle-reserva').style.display !== 'none')   { cerrarDetalleReserva();   return; }
            if (modalNR.style.display !== 'none') cerrarModalNuevaReserva();
        }
    };
    addGlobalListener(document, 'keydown', onDocumentKeydownModals);

    /* ─────────────────────────────────────────────────────────────────────
       API PÚBLICA
    ───────────────────────────────────────────────────────────────────── */
    return {
        abrirModalNuevaReserva: abrirModalNuevaReserva,
        abrirDetalleReserva:    abrirDetalleReserva,
        abrirModalPago:         abrirModalPago,
        abrirModalReprogramar:  abrirModalReprogramar,
        abrirModalCancelar:     abrirModalCancelar,
        abrirModalReembolso:    abrirModalReembolso,
        imprimirReciboReserva:  imprimirReciboReserva,
        mostrarResToast:        mostrarResToast,
        // Setters para inyección tardía de referencias cruzadas
        setCargarSemana:    function(fn) { _cargarSemana = fn; },
        setFetchHistorical: function(fn) { _fetchHistorical = fn; },
        setRhCurrentPage:   function(ref) { _rhCurrentPage = ref; }
    };
}
