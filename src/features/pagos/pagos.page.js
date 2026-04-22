import { pagosTemplate } from './pagos.template.js';
import { Store } from '../../core/store.js';

const BASE_URL = 'http://localhost:8080/api/v1';

export function template() {
    return pagosTemplate();
}

export function mount(container) {

    /* ── Estado ── */
    var sucursal     = Store.getSucursal();
    var allPagos     = [];
    var filtrados    = [];
    var paginaActual = 0;
    var pageSize     = 20;
    var _pagoActivo  = null;   // pago actualmente abierto en detalle/anular

    /* ── DOM refs ── */
    var loadingEl  = document.getElementById('pagos-loading');
    var errorEl    = document.getElementById('pagos-error');
    var errorMsg   = document.getElementById('pagos-error-msg');
    var tableWrap  = document.getElementById('pagos-table-wrap');
    var tbody      = document.getElementById('pagos-tbody');
    var emptyEl    = document.getElementById('pagos-empty');
    var countLabel = document.getElementById('pagos-count-label');
    var pgInfoEl    = document.getElementById('pagos-page-info');
    var pgPagEl     = document.getElementById('pagos-pagination');
    var pgFirst     = document.getElementById('pagos-page-first');
    var pgPrev      = document.getElementById('pagos-page-prev');
    var pgNext      = document.getElementById('pagos-page-next');
    var pgLast      = document.getElementById('pagos-page-last');
    var pgInfoLbl   = document.getElementById('pagos-page-info-label');
    var periodoSel  = document.getElementById('pagos-periodo');
    var metodoSel   = document.getElementById('pagos-metodo');
    var searchEl    = document.getElementById('pagos-search');

    /* ── Título dinámico ── */
    document.getElementById('pagos-title').textContent    = sucursal ? 'Pagos — ' + sucursal.nombre : 'Pagos — Global';
    document.getElementById('pagos-subtitle').textContent = sucursal
        ? 'Historial financiero de ' + sucursal.nombre
        : 'Historial financiero global de todas las sedes';

    /* ══════════════════════════════════════
       HELPERS
    ══════════════════════════════════════ */
    function toISO(d) { return d.toISOString().split('T')[0]; }

    function getRango(dias) {
        var desde = new Date(); desde.setDate(desde.getDate() - parseInt(dias));
        return { desde: toISO(desde), hasta: toISO(new Date()) };
    }

    function fmtFecha(isoStr) {
        if (!isoStr) return '—';
        var d = new Date(isoStr.includes('T') ? isoStr : isoStr + 'T00:00:00');
        var MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
        var base  = d.getDate() + ' ' + MESES[d.getMonth()] + ' ' + d.getFullYear();
        if (isoStr.includes('T')) {
            base += ', ' + String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0');
            if (d.getSeconds()) base += ':' + String(d.getSeconds()).padStart(2,'0');
        }
        return base;
    }

    function fmtMoney(n) { return 'S/ ' + Number(n || 0).toFixed(2); }

    var METODO_ICON = { EFECTIVO:'💵', YAPE:'📱', PLIN:'📱', TRANSFERENCIA:'🏦', TARJETA:'💳' };

    var TIPO_STYLE = {
        INGRESO: { bg:'#dcfce7', color:'#15803d', icon:'bx-chevrons-up',   label:'INGRESO' },
        SALIDA:  { bg:'#fee2e2', color:'#dc2626', icon:'bx-chevrons-down',  label:'SALIDA'  },
    };

    var ESTADO_STYLE = {
        COMPLETADO: { bg:'#dcfce7', color:'#15803d', label:'Completado' },
        ANULADO:    { bg:'#fee2e2', color:'#dc2626', label:'Anulado'    },
    };

    function badgeHTML(text, bg, color) {
        return "<span style='background:" + bg + ";color:" + color + ";padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;white-space:nowrap;'>" + text + "</span>";
    }

    function origenLink(p) {
        if (p.reservaId) return "<a href='#' class='pagos-origen-link' data-reserva-id='" + p.reservaId + "' style='color:#3b82f6;font-weight:700;font-size:12px;text-decoration:none;'>📋 Reserva #" + p.reservaId + "</a>";
        if (p.eventoId)  return "<a href='#' style='color:#8b5cf6;font-weight:700;font-size:12px;text-decoration:none;'>🎉 Evento #" + p.eventoId + "</a>";
        return "<span style='color:#94a3b8;font-size:12px;'>—</span>";
    }

    function mostrarToast(msg, esError) {
        var t = document.getElementById('pagos-toast');
        var m = document.getElementById('pagos-toast-msg');
        var ico = t.querySelector('i');
        if (!t || !m) return;
        m.textContent = msg;
        if (esError) {
            t.style.background = '#7f1d1d';
            if (ico) ico.className = 'bx bx-error-circle';
        } else {
            t.style.background = '';
            if (ico) ico.className = 'bx bx-check-circle';
        }
        t.style.display = 'flex';
        setTimeout(function() { t.style.display = 'none'; }, 3500);
    }

    /* ══════════════════════════════════════
       CARGA DE DATOS  →  GET /pagos
    ══════════════════════════════════════ */
    function cargarPagos() {
        var rango  = getRango(periodoSel.value || '30');
        var metodo = metodoSel.value;

        loadingEl.style.display = 'flex';
        errorEl.style.display   = 'none';
        tableWrap.style.display = 'none';

        var url = BASE_URL + '/pagos?desde=' + rango.desde + '&hasta=' + rango.hasta +
                  '&size=500&sort=fecha,desc&page=0';
        if (metodo)                            url += '&metodo='     + metodo;
        if (sucursal && sucursal.sucursalId)   url += '&sucursalId=' + sucursal.sucursalId;

        fetch(url)
            .then(function(res) {
                if (!res.ok) throw new Error('Error ' + res.status + ' al obtener pagos.');
                return res.json();
            })
            .then(function(data) {
                allPagos = Array.isArray(data) ? data : (data.content || []);
                actualizarStats(allPagos);
                aplicarFiltros();
                loadingEl.style.display = 'none';
                tableWrap.style.display = '';
            })
            .catch(function(err) {
                loadingEl.style.display = 'none';
                errorMsg.textContent    = err.message;
                errorEl.style.display   = 'block';
            });
    }

    /* ── Stats cards ── */
    function actualizarStats(pagos) {
        var completados = pagos.filter(function(p){ return p.estado !== 'ANULADO'; });
        var anulados    = pagos.filter(function(p){ return p.estado === 'ANULADO'; });
        var ingresos    = completados.filter(function(p){ return p.tipoTransaccion === 'INGRESO'; });
        var salidas     = completados.filter(function(p){ return p.tipoTransaccion === 'SALIDA'; });

        var totalIng = ingresos.reduce(function(s,p){ return s + Number(p.monto || 0); }, 0);
        var totalAnu = anulados.reduce(function(s,p){ return s + Number(p.monto || 0); }, 0);
        var totalSal = salidas.reduce(function(s,p){ return s + Number(p.monto || 0); }, 0);

        document.getElementById('pagos-stat-ingresos').textContent  = fmtMoney(totalIng);
        document.getElementById('pagos-stat-anulados').textContent  = fmtMoney(totalAnu);
        document.getElementById('pagos-stat-count').textContent     = pagos.length;
        document.getElementById('pagos-badge-count').textContent    = pagos.length;
        document.getElementById('pagos-badge-ingresos').textContent = ingresos.length + ' pagos';
        document.getElementById('pagos-badge-anulados').textContent = anulados.length + ' anulados';
        document.getElementById('pagos-stat-sub').textContent       = 'en los últimos ' + periodoSel.value + ' días';
        document.getElementById('pagos-bar-ingresos').style.width   = '80%';
        document.getElementById('pagos-bar-anulados').style.width   =
            totalIng > 0 ? Math.min(80, (totalAnu / totalIng) * 80) + '%' : '0%';

        // Tarjeta de Salidas
        document.getElementById('pagos-stat-salidas').textContent   = fmtMoney(totalSal);
        document.getElementById('pagos-badge-salidas').textContent  = salidas.length + ' salidas';
        document.getElementById('pagos-bar-salidas').style.width    =
            totalIng > 0 ? Math.min(80, (totalSal / totalIng) * 80) + '%' : '0%';
    }

    /* ── Filtros locales ── */
    function aplicarFiltros() {
        var busq = (searchEl.value || '').toLowerCase().trim();
        filtrados = allPagos.filter(function(p) {
            if (!busq) return true;
            return [p.id, p.reservaId, p.eventoId, p.referencia, p.nota].join(' ').toLowerCase().includes(busq);
        });
        paginaActual = 0;
        renderTabla();
    }

    /* ══════════════════════════════════════
       RENDER TABLA
    ══════════════════════════════════════ */
    function renderTabla() {
        var total      = filtrados.length;
        var inicio     = paginaActual * pageSize;
        var fin        = Math.min(inicio + pageSize, total);
        var pagina     = filtrados.slice(inicio, fin);
        var totalPages = Math.max(1, Math.ceil(total / pageSize));

        if (pgInfoLbl) pgInfoLbl.textContent = 'Mostrando ' + Math.min(fin, total) + ' de ' + total + ' registros';
        if (pgInfoEl)  pgInfoEl.textContent  = 'Página ' + (paginaActual + 1) + ' de ' + totalPages;
        if (pgPagEl)   pgPagEl.style.display = totalPages > 1 ? 'flex' : 'none';
        if (pgFirst)   pgFirst.disabled = paginaActual === 0;
        if (pgPrev)    pgPrev.disabled  = paginaActual === 0;
        if (pgNext)    pgNext.disabled  = paginaActual >= totalPages - 1;
        if (pgLast)    pgLast.disabled  = paginaActual >= totalPages - 1;

        tbody.innerHTML = '';
        emptyEl.style.display = pagina.length === 0 ? 'block' : 'none';

        pagina.forEach(function(p) {
            var tipo    = TIPO_STYLE[p.tipoTransaccion]  || { bg:'#f1f5f9', color:'#64748b', icon:'bx-minus', label: p.tipoTransaccion || '—' };
            var estado  = ESTADO_STYLE[p.estado]         || { bg:'#f1f5f9', color:'#64748b', label: p.estado || '—' };
            var metIcon = METODO_ICON[p.metodoPago] || '💳';
            var anulado = p.estado === 'ANULADO';

            var tr = document.createElement('tr');
            tr.dataset.pagoId = p.id;

            // Botones de acción
            var btnAnular = !anulado
                ? '<button class="pago-btn-anular" data-id="' + p.id + '" title="Anular pago"><i class=\'bx bx-block\'></i></button>'
                : '';

            tr.innerHTML = [
                '<td style="font-size:12px;color:#334155;font-weight:600;white-space:nowrap;">' + fmtFecha(p.fecha) + '</td>',
                '<td><span style="background:' + tipo.bg + ';color:' + tipo.color + ';padding:3px 9px;border-radius:20px;font-size:11px;font-weight:800;display:inline-flex;align-items:center;gap:4px;"><i class=\'bx ' + tipo.icon + '\'></i>' + tipo.label + '</span></td>',
                '<td style="text-align:right;"><strong style="font-size:14px;color:' + (anulado ? '#94a3b8' : '#0f172a') + ';' + (anulado ? 'text-decoration:line-through;' : '') + '">' + fmtMoney(p.monto) + '</strong></td>',
                '<td>' + origenLink(p) + (p.nota ? '<br><span style="font-size:11px;color:#94a3b8;font-style:italic;">' + p.nota + '</span>' : '') + '</td>',
                '<td><span style="font-size:12px;font-weight:600;color:#475569;">' + (metIcon + ' ' + (p.metodoPago || '—')) + '</span></td>',
                '<td>' + badgeHTML(estado.label, estado.bg, estado.color) + '</td>',
                '<td>',
                    '<div class="cli-actions" style="justify-content: center;">',
                        '<button class="pago-btn-ver" data-id="' + p.id + '" title="Ver detalle"><i class=\'bx bx-show\'></i></button>',
                        btnAnular,
                        '<button class="pago-btn-imprimir" data-id="' + p.id + '" title="Imprimir recibo"><i class=\'bx bx-printer\'></i></button>',
                    '</div>',
                '</td>',
            ].join('');

            tbody.appendChild(tr);
        });

        /* Delegación de clicks */
        tbody.querySelectorAll('.pago-btn-ver').forEach(function(btn) {
            btn.addEventListener('click', function() {
                abrirDetalle(parseInt(this.dataset.id));
            });
        });
        tbody.querySelectorAll('.pago-btn-anular').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var p = allPagos.find(function(x){ return String(x.id) === this.dataset.id; }.bind(this));
                if (p) abrirModalAnular(p);
            });
        });
        tbody.querySelectorAll('.pago-btn-imprimir').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var p = allPagos.find(function(x){ return String(x.id) === this.dataset.id; }.bind(this));
                if (p) imprimirRecibo(p);
            });
        });
    }

    /* ══════════════════════════════════════
       MODAL 1 — VER DETALLE  →  GET /pagos/{id}
    ══════════════════════════════════════ */
    function abrirDetalle(id) {
        _pagoActivo = allPagos.find(function(p){ return p.id === id; }) || null;
        document.getElementById('dp-title').textContent = 'Detalle de Transacción #' + id;
        document.getElementById('dp-loading').style.display  = 'block';
        document.getElementById('dp-content').style.display  = 'none';
        document.getElementById('modal-detalle-pago').style.display = 'flex';

        fetch(BASE_URL + '/pagos/' + id)
            .then(function(r) {
                if (!r.ok) throw new Error('Error ' + r.status);
                return r.json();
            })
            .then(function(p) {
                _pagoActivo = p;
                rellenarDetalle(p);
            })
            .catch(function() {
                // Fallback: usar datos de la tabla
                if (_pagoActivo) rellenarDetalle(_pagoActivo);
            });
    }

    function rellenarDetalle(p) {
        var estado  = ESTADO_STYLE[p.estado] || { bg:'#f1f5f9', color:'#64748b', label: p.estado || '—' };
        var anulado = p.estado === 'ANULADO';
        
        // Formateo del Monto
        var mColor = '#0f172a';
        var mPrefix = '';
        if (p.tipoTransaccion === 'INGRESO') {
            mColor = '#15803d'; mPrefix = '+ ';
        } else if (p.tipoTransaccion === 'SALIDA') {
            mColor = '#dc2626'; mPrefix = '- ';
        }
        if (anulado) mColor = '#94a3b8';

        document.getElementById('dp-title').textContent = 'Detalle de Transacción #' + p.id;
        document.getElementById('dp-monto').textContent = mPrefix + fmtMoney(p.monto);
        document.getElementById('dp-monto').style.color = mColor;
        document.getElementById('dp-monto').style.textDecoration = anulado ? 'line-through' : 'none';
        
        document.getElementById('dp-estado-badge').innerHTML = badgeHTML(estado.label, estado.bg, estado.color);

        document.getElementById('dp-fecha').textContent   = fmtFecha(p.fecha);
        document.getElementById('dp-tipo').innerHTML      = (() => {
            var t = TIPO_STYLE[p.tipoTransaccion] || { bg:'#f1f5f9', color:'#64748b', label: p.tipoTransaccion || '—' };
            return badgeHTML(t.label, t.bg, t.color);
        })();
        document.getElementById('dp-metodo').textContent  = (METODO_ICON[p.metodoPago] || '💳') + ' ' + (p.metodoPago || '—');
        document.getElementById('dp-origen').innerHTML    = origenLink(p);

        // Cliente asociado
        var cliWrap = document.getElementById('dp-cliente-wrap');
        if (p.clienteNombre) {
            document.getElementById('dp-cliente').innerHTML = '👤 ' + p.clienteNombre;
            cliWrap.style.display = '';
        } else {
            cliWrap.style.display = 'none';
        }

        // Registrado por (campo opcional del API)
        var regWrap = document.getElementById('dp-registrado-wrap');
        if (p.registradoPor || p.usuarioNombre) {
            document.getElementById('dp-registrado').innerHTML = '🧑‍💻 ' + (p.registradoPor || p.usuarioNombre);
            regWrap.style.display = '';
        } else {
            regWrap.style.display = 'none';
        }

        // Nota y Referencia (se unen en el mismo campo si existen ambas)
        var notaWrap = document.getElementById('dp-nota-wrap');
        var notas = [];
        if (p.nota) notas.push(p.nota);
        if (p.referencia) notas.push('Ref: ' + p.referencia);
        
        if (notas.length > 0) {
            document.getElementById('dp-nota').textContent = notas.join(' | ');
            notaWrap.style.display = '';
        } else {
            notaWrap.style.display = 'none';
        }

        // Sección anulación
        var anuSec = document.getElementById('dp-anulacion-section');
        anuSec.style.display = anulado ? 'block' : 'none';
        if (anulado) {
            document.getElementById('dp-anulado-por').textContent     = p.anuladoPor || p.usuarioAnulacion || '—';
            document.getElementById('dp-fecha-anulacion').textContent = fmtFecha(p.fechaAnulacion || p.updatedAt);
            document.getElementById('dp-motivo-anulacion').textContent = p.motivoAnulacion || p.motivo || '—';
        }

        // Botón "Anular" en el footer del detalle
        var btnAnu = document.getElementById('btn-dp-anular');
        if (!anulado) {
            btnAnu.style.display = 'flex';
            btnAnu.onclick = function() {
                cerrarDetalle();
                abrirModalAnular(p);
            };
        } else {
            btnAnu.style.display = 'none';
        }

        // Botón imprimir en el footer del detalle
        document.getElementById('btn-dp-imprimir').onclick = function() { imprimirRecibo(p); };

        document.getElementById('dp-loading').style.display = 'none';
        document.getElementById('dp-content').style.display = 'block';
    }

    function cerrarDetalle() {
        document.getElementById('modal-detalle-pago').style.display = 'none';
    }
    document.getElementById('btn-dp-close').addEventListener('click',   cerrarDetalle);
    document.getElementById('btn-dp-cerrar').addEventListener('click',  cerrarDetalle);
    document.getElementById('modal-detalle-pago').addEventListener('click', function(e) {
        if (e.target === this) cerrarDetalle();
    });

    // Navegación a Reserva desde enlace de Origen
    function irAReserva(e) {
        var target = e.target.closest('.pagos-origen-link');
        if (target) {
            e.preventDefault();
            var rId = target.getAttribute('data-reserva-id');
            if (rId) {
                sessionStorage.setItem('pitchpro_open_reserva_id', rId);
                cerrarDetalle();
                window.location.hash = '#/dashboard/reservas';
            }
        }
    }
    document.getElementById('dp-origen').addEventListener('click', irAReserva);
    document.getElementById('pagos-tbody').addEventListener('click', irAReserva);

    /* ══════════════════════════════════════
       MODAL 2 — ANULAR PAGO  →  PATCH /pagos/{id}/anular
    ══════════════════════════════════════ */
    function abrirModalAnular(p) {
        _pagoActivo = p;
        document.getElementById('anular-titulo').textContent   = '¿Anular este pago de ' + fmtMoney(p.monto) + '?';
        document.getElementById('anular-subtitle').textContent = 'Pago #' + p.id + (p.reservaId ? ' · Reserva #' + p.reservaId : '');
        document.getElementById('anular-motivo').value         = '';
        document.getElementById('anular-err-motivo').textContent = '';
        document.getElementById('anular-error-box').style.display = 'none';
        document.getElementById('anular-submit-text').style.display   = 'flex';
        document.getElementById('anular-submit-loader').style.display = 'none';
        document.getElementById('btn-anular-submit').disabled = false;
        document.getElementById('modal-anular-pago').style.display = 'flex';
    }

    function cerrarModalAnular() {
        document.getElementById('modal-anular-pago').style.display = 'none';
    }
    document.getElementById('btn-anular-close').addEventListener('click',  cerrarModalAnular);
    document.getElementById('btn-anular-cancel').addEventListener('click', cerrarModalAnular);
    document.getElementById('modal-anular-pago').addEventListener('click', function(e) {
        if (e.target === this) cerrarModalAnular();
    });

    document.getElementById('btn-anular-submit').addEventListener('click', function() {
        var motivo = (document.getElementById('anular-motivo').value || '').trim();
        if (!motivo) {
            document.getElementById('anular-err-motivo').textContent = 'El motivo es obligatorio.';
            return;
        }
        if (!_pagoActivo) return;

        this.disabled = true;
        document.getElementById('anular-submit-text').style.display   = 'none';
        document.getElementById('anular-submit-loader').style.display = 'flex';
        document.getElementById('anular-error-box').style.display     = 'none';

        fetch(BASE_URL + '/pagos/' + _pagoActivo.id + '/anular', {
            method:  'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ motivo: motivo })
        })
        .then(function(res) {
            if (res.status === 204 || res.status === 200) return null;
            return res.json().then(function(e) { throw new Error(e.mensaje || e.message || 'Error al anular.'); });
        })
        .then(function() {
            cerrarModalAnular();
            // Actualizar fila en la tabla sin recargar
            var pagoLocal = allPagos.find(function(p){ return p.id === _pagoActivo.id; });
            if (pagoLocal) {
                pagoLocal.estado          = 'ANULADO';
                pagoLocal.motivoAnulacion = motivo;
            }
            aplicarFiltros();
            actualizarStats(allPagos);
            mostrarToast('¡Pago #' + _pagoActivo.id + ' anulado correctamente!');
            _pagoActivo = null;
        })
        .catch(function(err) {
            document.getElementById('btn-anular-submit').disabled = false;
            document.getElementById('anular-submit-text').style.display   = 'flex';
            document.getElementById('anular-submit-loader').style.display = 'none';
            document.getElementById('anular-error-msg').textContent       = err.message;
            document.getElementById('anular-error-box').style.display     = 'flex';
        });
    });

    /* ══════════════════════════════════════
       ACCIÓN 3 — IMPRIMIR RECIBO
    ══════════════════════════════════════ */
    function imprimirRecibo(p) {
        var empresa = (sucursal && sucursal.nombre) ? sucursal.nombre : 'PitchPro';
        var origen  = p.reservaId ? 'Reserva #' + p.reservaId : (p.eventoId ? 'Evento #' + p.eventoId : '—');
        var estado  = p.estado || '—';

        var html = [
            '<!DOCTYPE html><html lang="es"><head>',
            '<meta charset="UTF-8"><title>Recibo de Pago #' + p.id + '</title>',
            '<style>',
            '  * { margin:0; padding:0; box-sizing:border-box; }',
            '  body { font-family: "Helvetica Neue", Arial, sans-serif; color:#1e293b; padding:40px; max-width:480px; margin:0 auto; }',
            '  .header { text-align:center; padding-bottom:24px; border-bottom:2px solid #e2e8f0; margin-bottom:24px; }',
            '  .logo { font-size:22px; font-weight:900; color:#1e3a5f; letter-spacing:-0.5px; }',
            '  .logo span { color:#3b82f6; }',
            '  .recibo-title { font-size:13px; color:#64748b; margin-top:4px; letter-spacing:2px; text-transform:uppercase; }',
            '  .monto-box { text-align:center; padding:20px; background:#f8fafc; border-radius:12px; margin-bottom:24px; }',
            '  .monto-label { font-size:11px; color:#94a3b8; letter-spacing:1px; text-transform:uppercase; }',
            '  .monto-value { font-size:36px; font-weight:900; color:#0f172a; margin:6px 0 4px; }',
            '  .estado { display:inline-block; padding:3px 14px; border-radius:20px; font-size:11px; font-weight:700; ' +
                (p.estado === 'ANULADO' ? 'background:#fee2e2;color:#dc2626;' : 'background:#dcfce7;color:#15803d;') + ' }',
            '  table { width:100%; border-collapse:collapse; }',
            '  tr { border-bottom:1px solid #f1f5f9; }',
            '  td { padding:10px 4px; font-size:13px; }',
            '  td:first-child { color:#64748b; font-weight:500; width:45%; }',
            '  td:last-child  { color:#0f172a; font-weight:700; }',
            '  .footer { margin-top:28px; text-align:center; font-size:11px; color:#94a3b8; border-top:1px solid #e2e8f0; padding-top:16px; }',
            '  @media print { body { padding:20px; } }',
            '</style></head><body>',
            '<div class="header">',
            '  <div class="logo">Pitch<span>Pro</span></div>',
            '  <div class="recibo-title">' + empresa + '</div>',
            '</div>',
            '<div class="monto-box">',
            '  <p class="monto-label">Total del Pago</p>',
            '  <h1 class="monto-value">' + fmtMoney(p.monto) + '</h1>',
            '  <span class="estado">' + estado + '</span>',
            '</div>',
            '<table>',
            '  <tr><td>N° de Pago</td><td>#' + p.id + '</td></tr>',
            '  <tr><td>Fecha</td><td>' + fmtFecha(p.fecha) + '</td></tr>',
            '  <tr><td>Método</td><td>' + (METODO_ICON[p.metodoPago] || '💳') + ' ' + (p.metodoPago || '—') + '</td></tr>',
            '  <tr><td>Tipo</td><td>' + (p.tipoTransaccion || '—') + '</td></tr>',
            '  <tr><td>Origen</td><td>' + origen + '</td></tr>',
            p.referencia    ? '  <tr><td>Referencia</td><td>' + p.referencia + '</td></tr>' : '',
            p.nota          ? '  <tr><td>Nota</td><td>' + p.nota + '</td></tr>' : '',
            p.registradoPor ? '  <tr><td>Registrado por</td><td>' + p.registradoPor + '</td></tr>' : '',
            '</table>',
            p.estado === 'ANULADO'
                ? '<div style="margin-top:20px;padding:12px 16px;background:#fff1f2;border-radius:10px;border-left:4px solid #ef4444;">' +
                  '<p style="font-size:12px;font-weight:700;color:#dc2626;margin-bottom:4px;">⚠️ PAGO ANULADO</p>' +
                  '<p style="font-size:12px;color:#7f1d1d;">' + (p.motivoAnulacion || '—') + '</p></div>'
                : '',
            '<div class="footer">',
            '  Generado el ' + fmtFecha(new Date().toISOString()) + '<br>',
            '  Este documento es un comprobante de pago.  ',
            '</div>',
            '</body></html>'
        ].join('\n');

        var win = window.open('', '_blank', 'width=600,height=700');
        win.document.write(html);
        win.document.close();
        win.focus();
        setTimeout(function() { win.print(); }, 400);
    }

    /* ── Filtros / paginación / CSV ── */
    periodoSel.addEventListener('change', cargarPagos);
    metodoSel.addEventListener('change',  cargarPagos);

    var searchTimer;
    searchEl.addEventListener('input', function() {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(aplicarFiltros, 250);
    });

    /* ---- Navegación de páginas (botones unificados) ---- */
    if (pgFirst) pgFirst.addEventListener('click', function() { paginaActual = 0; renderTabla(); });
    if (pgPrev)  pgPrev.addEventListener('click',  function() { if (paginaActual > 0) { paginaActual--; renderTabla(); } });
    if (pgNext)  pgNext.addEventListener('click',  function() { if (paginaActual < Math.ceil(filtrados.length / pageSize) - 1) { paginaActual++; renderTabla(); } });
    if (pgLast)  pgLast.addEventListener('click',  function() { paginaActual = Math.max(0, Math.ceil(filtrados.length / pageSize) - 1); renderTabla(); });

    document.getElementById('pagos-retry').addEventListener('click', cargarPagos);

    document.getElementById('pagos-btn-csv').addEventListener('click', function() {
        var rango = getRango(periodoSel.value || '30');
        var lines = ['ID,Fecha,Tipo,Monto,Origen,Método,Estado,Nota'];
        filtrados.forEach(function(p) {
            lines.push([
                p.id, p.fecha, p.tipoTransaccion,
                Number(p.monto || 0).toFixed(2),
                p.reservaId ? 'Reserva #' + p.reservaId : (p.eventoId ? 'Evento #' + p.eventoId : ''),
                p.metodoPago, p.estado,
                (p.nota || '').replace(/,/g, ' ')
            ].join(','));
        });
        var blob = new Blob([lines.join('\n')], { type: 'text/csv' });
        var a    = document.createElement('a');
        a.href   = URL.createObjectURL(blob);
        a.download = 'pagos_' + rango.desde + '_' + rango.hasta + '.csv';
        a.click();
    });

    /* Escape cierra modales en orden */
    document.addEventListener('keydown', function(e) {
        if (e.key !== 'Escape') return;
        if (document.getElementById('modal-anular-pago').style.display !== 'none') { cerrarModalAnular(); return; }
        if (document.getElementById('modal-detalle-pago').style.display !== 'none') { cerrarDetalle(); }
    });

    /* ── Init ── */
    cargarPagos();
}

export function unmount() { }
