// src/features/reservas/reservas.tabla.js
// Lógica de la tabla histórica de reservas:
//   - Filtros (fecha, estado multiselect, cliente autocomplete, cancha)
//   - Búsqueda paginada contra la API
//   - Render de filas con menú de acciones
//   - Paginación

/**
 * Inicializa la tabla histórica de reservas.
 *
 * @param {Object} ctx
 * @param {Object}   ctx.api               - Cliente API
 * @param {?number}  ctx.sucursalFiltro    - ID de la sucursal activa
 * @param {Function} ctx.addCleanup        - Registra función de limpieza al unmount
 * @param {Function} ctx.addGlobalListener - Añade event listener global
 * @param {Object}   ctx.modals            - Referencia a las funciones de modales:
 *                                           { abrirDetalleReserva, abrirModalPago,
 *                                             abrirModalReprogramar, abrirModalCancelar,
 *                                             imprimirReciboReserva }
 *
 * @returns {{ fetchHistoricalReservas, poblarCanchasSelect, currentPage }}
 */
export function initTabla(ctx) {
    var api             = ctx.api;
    var sucursalFiltro  = ctx.sucursalFiltro;
    var addCleanup      = ctx.addCleanup;
    var addGlobalListener = ctx.addGlobalListener;
    var modals          = ctx.modals;

    var rhCurrentPage = 0;
    var rhPageSize    = 10;
    var rhTotalPages  = 1;

    // Exponer la página actual como referencia para inyectar en modals
    var currentPageRef = { value: 0 };

    /* ──────────── UTILS ──────────── */
    function escapeHtml(unsafe) {
        return (unsafe || '').toString()
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    /* ──────────── MULTISELECT ESTADO ──────────── */
    var msWrap     = document.getElementById('rh-estado-wrap');
    var msTrigger  = document.getElementById('rh-estado-trigger');
    var msDropdown = document.getElementById('rh-estado-dropdown');
    var msOptions  = msDropdown.querySelectorAll('input[type="checkbox"]');

    msTrigger.addEventListener('click', function(e) {
        e.stopPropagation();
        msDropdown.classList.toggle('active');
    });
    msDropdown.addEventListener('click', function(e) { e.stopPropagation(); });

    function getSelectedStates() {
        var selected = [];
        msOptions.forEach(function(opt) { if (opt.checked) selected.push(opt.value); });
        return selected;
    }

    function updateMsTrigger() {
        var s = getSelectedStates();
        if (s.length === 0)      msTrigger.textContent = 'Todos los estados';
        else if (s.length === 1) msTrigger.textContent = s[0];
        else                     msTrigger.textContent = s.length + ' seleccionados';
    }

    msOptions.forEach(function(opt) { opt.addEventListener('change', updateMsTrigger); });

    /* ──────────── AUTOCOMPLETE CLIENTE ──────────── */
    var rhClienteIn   = document.getElementById('rh-cliente');
    var rhClienteId   = document.getElementById('rh-cliente-id');
    var rhClienteList = document.getElementById('rh-cliente-list');
    var clienteDebounce;
    addCleanup(function() { clearTimeout(clienteDebounce); });

    rhClienteIn.addEventListener('input', function() {
        clearTimeout(clienteDebounce);
        var q = this.value.trim();
        rhClienteId.value = ''; // Limpiar el ID si el usuario altera el texto
        if (q.length < 2) {
            rhClienteList.style.display = 'none';
            return;
        }
        clienteDebounce = setTimeout(function() {
            api.get('/clientes?nombre=' + encodeURIComponent(q) + '&size=5')
                .then(function(data) {
                    var arr = Array.isArray(data) ? data : (data.content || []);
                    if (arr.length === 0) {
                        rhClienteList.innerHTML = '<li style="color:#94a3b8;">No se encontraron clientes</li>';
                    } else {
                        rhClienteList.innerHTML = arr.map(function(c) {
                            return "<li data-id='" + c.id + "'>" + escapeHtml(c.nombre) + ' (' + escapeHtml(c.dni) + ')' + '</li>';
                        }).join('');
                    }
                    rhClienteList.style.display = 'block';
                }).catch(function() {});
        }, 300);
    });

    rhClienteList.addEventListener('click', function(e) {
        if (e.target.tagName.toLowerCase() === 'li' && e.target.getAttribute('data-id')) {
            rhClienteIn.value = e.target.textContent;
            rhClienteId.value = e.target.getAttribute('data-id');
            rhClienteList.style.display = 'none';
        }
    });

    /* ──────────── CERRAR DROPDOWNS AL CLICK FUERA ──────────── */
    var onDocumentClickFilters = function(e) {
        if (!msWrap.contains(e.target))           msDropdown.classList.remove('active');
        if (!rhClienteList.contains(e.target) && e.target !== rhClienteIn)
            rhClienteList.style.display = 'none';
    };
    addGlobalListener(document, 'click', onDocumentClickFilters);

    /* ──────────── SELECT CANCHAS ──────────── */
    var rhCanchaSel = document.getElementById('rh-cancha');

    function poblarCanchasSelect() {
        var endpoint = '/canchas?size=100' + (sucursalFiltro ? '&sucursalId=' + sucursalFiltro : '');
        api.get(endpoint)
            .then(function(data) {
                var arr = Array.isArray(data) ? data : (data.content || []);
                arr.forEach(function(c) {
                    var opt = document.createElement('option');
                    opt.value       = c.canchaId !== undefined ? c.canchaId : c.id;
                    opt.textContent = c.nombre;
                    rhCanchaSel.appendChild(opt);
                });
            }).catch(function() {});
    }

    /* ──────────── FETCH + RENDER ──────────── */
    function fetchHistoricalReservas(page) {
        rhCurrentPage         = page || 0;
        currentPageRef.value  = rhCurrentPage;

        var tbody = document.getElementById('rh-tbody');
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:40px;color:#94a3b8;">'
            + '<div style="display:inline-block;" class="spinner-circle"></div><br><br>Buscando reservas...</td></tr>';

        var params = new URLSearchParams();
        params.append('page', rhCurrentPage);
        params.append('size', rhPageSize);
        params.append('sort', 'fecha,desc');

        var fDesde = document.getElementById('rh-desde').value;
        if (fDesde) params.append('fechaDesde', fDesde);

        var fHasta = document.getElementById('rh-hasta').value;
        if (fHasta) params.append('fechaHasta', fHasta);

        var estados = getSelectedStates();
        estados.forEach(function(est) { params.append('estadoReserva', est); });

        var cid = rhClienteId.value;
        if (cid) params.append('clienteId', cid);

        var canId = rhCanchaSel.value;
        if (canId)                             params.append('canchaId', canId);
        if (sucursalFiltro && !canId)          params.append('sucursalId', sucursalFiltro);

        api.get('/reservas?' + params.toString())
            .then(function(data) { renderHistoricalTable(data); })
            .catch(function() {
                tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:40px;color:#ef4444;">❌ Error al cargar los resultados.</td></tr>';
            });
    }

    function renderHistoricalTable(data) {
        var tbody = document.getElementById('rh-tbody');
        var items = Array.isArray(data) ? data : (data.content || []);

        if (items.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:40px;color:#64748b;">No se encontraron reservas con esos filtros.</td></tr>';
            document.getElementById('rh-count-label').textContent = 'Mostrando 0 resultados';
            document.getElementById('rh-pagination').style.display = 'none';
            return;
        }

        tbody.innerHTML = '';
        items.forEach(function(r) {
            var STYLE_MAP = {
                PENDIENTE:   { badge: 'badge-yellow', dot: 'dot-yellow' },
                PAGADA:      { badge: 'badge-blue',   dot: 'dot-blue'   },
                COMPLETADO:  { badge: 'badge-green',  dot: 'dot-green'  },
                CANCELADO:   { badge: 'badge-red',    dot: 'dot-red'    },
                REEMBOLSADO: { badge: 'badge-purple', dot: 'dot-purple' }
            };
            var meta     = STYLE_MAP[r.estadoReserva] || { badge: 'badge-gray', dot: 'dot-gray' };
            var fHora    = (r.horaInicio||'').substring(0,5) + ' – ' + (r.horaFin||'').substring(0,5);
            var fDateTime = '<strong style="font-size:13px;color:#1e293b;">' + r.fecha + '</strong><br>'
                          + '<span style="font-size:11px;color:#64748b;">' + fHora + '</span>';

            var est              = r.estadoReserva;
            var esPendiente      = est === 'PENDIENTE';
            var esPagada         = est === 'PAGADA';
            var esTerminal       = est === 'COMPLETADO' || est === 'CANCELADO' || est === 'REEMBOLSADO';
            var puedeAnadirPago  = esPendiente && Number(r.saldoPendiente || 0) > 0;
            var puedeReprogramar = esPendiente || esPagada;
            var puedeCancelar    = esPendiente || esPagada;
            var puedeImprimir    = esPagada    || esTerminal;
            var puedeReembolsar  = Number(r.saldoPendiente || 0) < 0;
            var rJson            = escapeHtml(JSON.stringify(r).replace(/'/g, "&#39;"));

            var menuItems = [
                "<button class='rh-menu-item rh-action-ver'          data-id='" + r.id + "'>"
                    + "<i class='bx bx-show'></i> Ver Detalle</button>"
            ];
            if (puedeAnadirPago)  menuItems.push("<button class='rh-menu-item rh-action-pago'    data-id='" + r.id + "' data-saldo='" + Number(r.saldoPendiente||0).toFixed(2) + "'><i class='bx bx-credit-card'></i> Añadir Pago</button>");
            if (puedeReprogramar) menuItems.push("<button class='rh-menu-item rh-action-reprog'  data-id='" + r.id + "' data-res='" + rJson + "'><i class='bx bx-calendar-edit'></i> Reprogramar</button>");
            if (puedeImprimir)    menuItems.push("<button class='rh-menu-item rh-action-imprimir' data-id='" + r.id + "' data-res='" + rJson + "'><i class='bx bx-printer'></i> Imprimir Recibo</button>");
            if (puedeReembolsar)  menuItems.push("<hr style='border:none;border-top:1px solid #f1f5f9;margin:4px 0;'><button class='rh-menu-item rh-action-reembolso' style='color:#d97706;' data-id='" + r.id + "' data-res='" + rJson + "'><i class='bx bx-money-withdraw'></i> Registrar Reembolso</button>");
            if (puedeCancelar)    menuItems.push("<hr style='border:none;border-top:1px solid #f1f5f9;margin:4px 0;'><button class='rh-menu-item danger-action rh-action-cancelar' data-id='" + r.id + "' data-res='" + rJson + "'><i class='bx bx-x-circle'></i> Cancelar Reserva</button>");

            var actionsBtn = [
                "<div class='rh-actions'>",
                    "<button class='rh-actions-btn' data-toggle='rh-menu'><i class='bx bx-dots-vertical-rounded'></i></button>",
                    "<div class='rh-actions-menu'>",
                        menuItems.join(''),
                    "</div>",
                "</div>"
            ].join('');

            var saldo = Number(r.saldoPendiente || 0);
            var saldoCell;
            if (saldo < 0) {
                saldoCell = "  <td style='text-align:right;font-weight:700;white-space:nowrap;color:#d97706;' title='Reembolso pendiente'>⚠️ S/ " + saldo.toFixed(2) + "</td>";
            } else if (saldo > 0) {
                saldoCell = "  <td style='text-align:right;font-weight:600;white-space:nowrap;color:#dc2626;'>S/ " + saldo.toFixed(2) + "</td>";
            } else {
                saldoCell = "  <td style='text-align:right;font-weight:600;white-space:nowrap;color:#64748b;'>S/ " + saldo.toFixed(2) + "</td>";
            }

            var tr = document.createElement('tr');
            tr.innerHTML = [
                "  <td><strong style='color:#364152;'>#" + r.id + "</strong></td>",
                "  <td>" + fDateTime + "</td>",
                "  <td>" + escapeHtml(r.nombreCliente||'—') + "</td>",
                "  <td><span style='background:#f1f5f9;padding:4px 8px;border-radius:6px;font-size:12px;font-weight:600;color:#475569;'>" + escapeHtml(r.nombreCancha||'—') + "</span></td>",
                "  <td><span class='status-badge " + meta.badge + "'><span class='dot " + meta.dot + "'></span> " + escapeHtml(r.estadoReserva) + "</span></td>",
                "  <td style='text-align:right;font-weight:600;white-space:nowrap;'>S/ " + Number(r.montoTotal||0).toFixed(2) + "</td>",
                saldoCell,
                "  <td style='text-align:center;'>" + actionsBtn + "</td>"
            ].join('');
            tbody.appendChild(tr);
        });

        /* ── Toggle menú [...] ── */
        tbody.addEventListener('click', function(e) {
            var toggleBtn = e.target.closest('[data-toggle="rh-menu"]');
            if (toggleBtn) {
                e.stopPropagation();
                var wasActive = toggleBtn.parentNode.classList.contains('active');
                tbody.querySelectorAll('.rh-actions').forEach(function(a) { a.classList.remove('active'); });
                if (!wasActive) toggleBtn.parentNode.classList.add('active');
                return;
            }
            if (!e.target.closest('.rh-actions-menu') && !e.target.closest('[data-toggle="rh-menu"]')) {
                tbody.querySelectorAll('.rh-actions').forEach(function(a) { a.classList.remove('active'); });
            }
        });

        /* ── Delegación de acciones ── */
        tbody.querySelectorAll('.rh-action-ver').forEach(function(b) {
            b.addEventListener('click', function() {
                b.closest('.rh-actions').classList.remove('active');
                modals.abrirDetalleReserva(parseInt(b.dataset.id));
            });
        });

        tbody.querySelectorAll('.rh-action-pago').forEach(function(b) {
            b.addEventListener('click', function() {
                b.closest('.rh-actions').classList.remove('active');
                modals.abrirModalPago(parseInt(b.dataset.id), parseFloat(b.dataset.saldo || 0));
            });
        });

        tbody.querySelectorAll('.rh-action-reprog').forEach(function(b) {
            b.addEventListener('click', function() {
                b.closest('.rh-actions').classList.remove('active');
                var raw = b.getAttribute('data-res').replace(/&#39;/g, "'");
                modals.abrirModalReprogramar(JSON.parse(raw));
            });
        });

        tbody.querySelectorAll('.rh-action-cancelar').forEach(function(b) {
            b.addEventListener('click', function() {
                b.closest('.rh-actions').classList.remove('active');
                var raw = b.getAttribute('data-res').replace(/&#39;/g, "'");
                modals.abrirModalCancelar(JSON.parse(raw));
            });
        });

        tbody.querySelectorAll('.rh-action-imprimir').forEach(function(b) {
            b.addEventListener('click', function() {
                b.closest('.rh-actions').classList.remove('active');
                var raw = b.getAttribute('data-res').replace(/&#39;/g, "'");
                modals.imprimirReciboReserva(JSON.parse(raw));
            });
        });

        tbody.querySelectorAll('.rh-action-reembolso').forEach(function(b) {
            b.addEventListener('click', function() {
                b.closest('.rh-actions').classList.remove('active');
                var raw = b.getAttribute('data-res').replace(/&#39;/g, "'");
                modals.abrirModalReembolso(JSON.parse(raw));
            });
        });

        /* ── Paginación ── */
        var isPaged = data.content !== undefined;
        var totalEls = isPaged ? data.totalElements : items.length;
        var pageNum = isPaged ? data.number : 0;
        var totalPgs = isPaged ? data.totalPages : 1;
        var isFirst = isPaged ? data.first : true;
        var isLast = isPaged ? data.last : true;

        document.getElementById('rh-count-label').textContent =
            'Mostrando ' + items.length + ' resultados (Total: ' + totalEls + ')';
        
        if (isPaged && totalPgs > 1) {
            document.getElementById('rh-pagination').style.display = 'flex';
            document.getElementById('rh-page-info').textContent =
                'Página ' + (pageNum + 1) + ' de ' + totalPgs;

            document.getElementById('rh-page-first').disabled = isFirst;
            document.getElementById('rh-page-prev').disabled  = isFirst;
            document.getElementById('rh-page-next').disabled  = isLast;
            document.getElementById('rh-page-last').disabled  = isLast;
            rhTotalPages = totalPgs;
        } else {
            document.getElementById('rh-pagination').style.display = 'none';
            rhTotalPages = 1;
        }
    }

    /* ──────────── EVENTOS TABLA ──────────── */
    document.getElementById('rh-page-prev').addEventListener('click', function()  { if (rhCurrentPage > 0)              fetchHistoricalReservas(rhCurrentPage - 1); });
    document.getElementById('rh-page-next').addEventListener('click', function()  { if (rhCurrentPage < rhTotalPages - 1) fetchHistoricalReservas(rhCurrentPage + 1); });
    document.getElementById('rh-page-first').addEventListener('click', function() { fetchHistoricalReservas(0); });
    document.getElementById('rh-page-last').addEventListener('click', function()  { fetchHistoricalReservas(rhTotalPages - 1); });
    document.getElementById('rh-btn-buscar').addEventListener('click', function() { fetchHistoricalReservas(0); });

    document.getElementById('rh-btn-limpiar').addEventListener('click', function() {
        document.getElementById('rh-desde').value = '';
        document.getElementById('rh-hasta').value = '';
        msOptions.forEach(function(o) { o.checked = false; });
        updateMsTrigger();
        rhClienteIn.value = '';
        rhClienteId.value = '';
        rhCanchaSel.value = '';
        fetchHistoricalReservas(0);
    });

    /* ──────────── API PÚBLICA ──────────── */
    return {
        fetchHistoricalReservas: fetchHistoricalReservas,
        poblarCanchasSelect:     poblarCanchasSelect,
        currentPageRef:          currentPageRef
    };
}
