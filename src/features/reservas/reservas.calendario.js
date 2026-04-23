// src/features/reservas/reservas.calendario.js
// Lógica del calendario semanal:
//   - Construcción de ejes de tiempo y headers de días
//   - Render de cards de reservas y mantenimientos
//   - Popovers de detalle sobre cards
//   - Stats de la semana (todas las canchas)
//   - Selector de cancha del calendario
//   - Filtro de estado visual (sin petición extra)
//   - Exportar CSV

/**
 * Inicializa el módulo de calendario semanal.
 *
 * @param {Object} ctx
 * @param {Object}   ctx.api               - Cliente API
 * @param {?number}  ctx.sucursalFiltro    - ID de la sucursal activa
 * @param {Function} ctx.addCleanup        - Registra función de limpieza al unmount
 * @param {Function} ctx.addGlobalListener - Añade event listener global
 * @param {Object}   ctx.modals            - Referencia a funciones de modales:
 *                                           { mostrarResToast, abrirDetalleReserva,
 *                                             abrirModalPago, abrirModalReprogramar,
 *                                             abrirModalCancelar, imprimirReciboReserva }
 *
 * @returns {{ cargarSemana }}
 */
export function initCalendario(ctx) {
    var api             = ctx.api;
    var sucursalFiltro  = ctx.sucursalFiltro;
    var addGlobalListener = ctx.addGlobalListener;
    var modals          = ctx.modals;

    /* ──────────── Configuración temporal ──────────── */
    var HORA_INICIO = 7;
    var HORA_FIN    = 24;
    var TOTAL_HORAS = HORA_FIN - HORA_INICIO;  // 17

    var DIAS_ES   = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
    var MESES_ES  = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

    /* ──────────── Estado ──────────── */
    var semanaOffset        = 0;
    var reservasSemana      = [];
    var mantenimientosSemana = [];
    var filtroEstado        = '';
    var canchaCalId         = null;

    /* ──────────── DOM refs ──────────── */
    var loading  = document.getElementById('cal-loading');
    var errBox   = document.getElementById('cal-error');
    var errMsg   = document.getElementById('cal-error-msg');
    var panel    = document.getElementById('cal-panel');
    var bottom   = document.getElementById('cal-bottom');
    var semLabel = document.getElementById('cal-semana-label');
    var filterEl = document.getElementById('cal-filter-estado');

    /* ──────────── Color por estado ──────────── */
    var ESTADO_STYLE = {
        PAGADA:      { cls: 'c-blue',        label: 'Pagada',      dot: '#3b82f6' },
        PENDIENTE:   { cls: 'c-yellow',      label: 'Pendiente',   dot: '#eab308' },
        COMPLETADO:  { cls: 'c-green-light', label: 'Completada',  dot: '#10b981' },
        CANCELADO:   { cls: 'c-gray',        label: 'Cancelada',   dot: '#ef4444' },
        REEMBOLSADO: { cls: 'c-gray-purple', label: 'Reembolsada', dot: '#8b5cf6' }
    };

    /* ──────────── Utils de fecha ──────────── */
    function getLunes(offset) {
        var hoy  = new Date();
        var dia  = hoy.getDay();
        var diff = (dia === 0) ? -6 : 1 - dia;
        var l    = new Date(hoy);
        l.setDate(hoy.getDate() + diff + (offset * 7));
        l.setHours(0, 0, 0, 0);
        return l;
    }

    function toISO(date) {
        var y = date.getFullYear();
        var m = String(date.getMonth() + 1).padStart(2, '0');
        var d = String(date.getDate()).padStart(2, '0');
        return y + '-' + m + '-' + d;
    }

    function formatHora(timeStr) {
        return timeStr ? timeStr.substring(0, 5) : '';
    }

    /* ──────────── Posición % en la grilla ──────────── */
    function posYPct(horaStr) {
        var parts = horaStr.split(':');
        var horas = parseInt(parts[0]) + parseInt(parts[1] || 0) / 60;
        return ((horas - HORA_INICIO) / TOTAL_HORAS) * 100;
    }
    function altPct(ini, fin) {
        return Math.max(posYPct(fin) - posYPct(ini), 5);
    }

    /* ──────────── Ejes de tiempo ──────────── */
    function buildEjes() {
        var axis  = document.getElementById('cal-time-axis');
        var lines = document.getElementById('cal-lines');
        axis.innerHTML = lines.innerHTML = '';
        for (var h = HORA_INICIO; h <= HORA_FIN; h++) {
            var pct   = ((h - HORA_INICIO) / TOTAL_HORAS) * 100;
            var label = h < 12 ? h + ':00 AM' : (h === 12 ? '12:00 PM' : (h === 24 ? '12:00 AM' : (h - 12) + ':00 PM'));
            var slot  = document.createElement('div'); slot.className = 'time-slot'; slot.style.top = pct + '%'; slot.textContent = label;
            var line  = document.createElement('div'); line.className = 'line-h';    line.style.top = pct + '%';
            axis.appendChild(slot);
            lines.appendChild(line);
        }
    }

    /* ──────────── Headers de días ──────────── */
    function buildHeaders(lunes) {
        var hoy = new Date(); hoy.setHours(0, 0, 0, 0);
        var row    = document.querySelector('.cg-headers-row');
        var corner = row.querySelector('.cg-corner');
        row.innerHTML = '';
        if (corner) { row.appendChild(corner); }
        else { var _co = document.createElement('div'); _co.className = 'cg-corner'; row.appendChild(_co); }

        for (var i = 0; i < 7; i++) {
            var dia = new Date(lunes); dia.setDate(lunes.getDate() + i);
            var h   = document.createElement('div');
            h.className = 'cg-day-header' + (dia.getTime() === hoy.getTime() ? ' today-active' : '');
            h.id        = 'cal-h-' + i;
            h.innerHTML = '<span>' + DIAS_ES[dia.getDay()].toUpperCase() + '</span><strong>' + dia.getDate() + '</strong>';
            row.appendChild(h);
        }
        var fin   = new Date(lunes); fin.setDate(lunes.getDate() + 6);
        semLabel.textContent = lunes.getDate() + ' ' + MESES_ES[lunes.getMonth()].substring(0, 3)
            + ' - ' + fin.getDate() + ' ' + MESES_ES[fin.getMonth()].substring(0, 3) + ', ' + fin.getFullYear();
    }

    /* ──────────── Columnas dinámicas ──────────── */
    function rebuildGridColumns(count, canchaIds) {
        var grid = document.getElementById('cal-grid');
        Array.from(grid.children).forEach(function(child) { if (child.id !== 'cal-lines') grid.removeChild(child); });
        for (var i = 0; i < count; i++) {
            var col = document.createElement('div');
            col.className   = 'cg-col';
            col.id          = 'cal-col-' + i;
            col.dataset.day = i;
            if (canchaIds && canchaIds[i] !== undefined) col.dataset.canchaId = canchaIds[i];
            grid.appendChild(col);
        }
        for (var j = 1; j < count; j++) {
            var divEl = document.createElement('div');
            divEl.className  = 'cg-col-divider';
            divEl.style.left = (j / count * 100).toFixed(4) + '%';
            grid.appendChild(divEl);
        }
    }

    /* ──────────── Card reserva ──────────── */
    function escapeHtml(s) { return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

    function buildCard(r) {
        var meta = ESTADO_STYLE[r.estadoReserva] || ESTADO_STYLE['PENDIENTE'];
        var div  = document.createElement('div');
        div.className    = 'cal-card ' + meta.cls;
        div.style.top    = posYPct(r.horaInicio) + '%';
        div.style.height = altPct(r.horaInicio, r.horaFin) + '%';
        if (r.estadoReserva === 'COMPLETADO') div.style.opacity    = '0.6';
        div.setAttribute('title', (r.nombreCliente||'Sin Cliente') + '\n' + formatHora(r.horaInicio) + ' - ' + formatHora(r.horaFin));

        var alt     = altPct(r.horaInicio, r.horaFin);
        var subText = '';
        if (r.saldoPendiente > 0 && r.estadoReserva !== 'COMPLETADO') {
            subText = "<span class='cc-sub' style='color:#b45309;font-weight:700;'>Debe: S/ " + Number(r.saldoPendiente).toFixed(2) + "</span>";
        }
        div.innerHTML = "<span class='cc-title' style='font-size:12px;'>" + escapeHtml(r.nombreCliente || 'Sin cliente') + "</span>"
            + (alt >= 10 ? subText : '');

        div.addEventListener('click', function(e) { e.stopPropagation(); abrirPopoverReserva(r, div); });
        return div;
    }

    /* ──────────── Card mantenimiento ──────────── */
    function buildCardMant(m) {
        var parseHora = function(isoStr) { if (!isoStr) return '00:00'; var t = isoStr.split('T')[1] || isoStr; return t.substring(0, 5); };
        var hIni = parseHora(m.horaInicio);
        var hFin = parseHora(m.horaFin);
        var alt  = altPct(hIni, hFin);
        var esEnProceso = m.estadoMantenimiento === 'EN_PROCESO';
        var bgColor     = esEnProceso ? '#fff1f2' : '#fff7ed';
        var borderColor = esEnProceso ? '#e11d48' : '#ea580c';
        var textColor   = esEnProceso ? '#9f1239' : '#c2410c';
        var subColor    = esEnProceso ? '#be123c' : '#9a3412';
        var badgeBg     = esEnProceso ? '#ffe4e6' : '#ffedd5';
        var badgeLabel  = esEnProceso ? '⚙️ En Proceso' : '🔧 Programado';

        var div = document.createElement('div');
        div.className        = 'cal-card';
        div.style.top        = posYPct(hIni) + '%';
        div.style.height     = Math.max(alt, 5) + '%';
        div.style.background = bgColor;
        div.style.color      = textColor;
        div.style.borderLeft = '4px solid ' + borderColor;

        div.setAttribute('title', '🔧 Mantenimiento\nEstado: ' + (m.estadoMantenimiento||'—') + '\n' + formatHora(hIni) + ' - ' + formatHora(hFin) + '\nMotivo: ' + (m.motivo||'—'));
        div.innerHTML = [
            "<span class='cc-title' style='font-size:11px;font-weight:800;display:flex;align-items:center;gap:4px;'><span>🔧</span><span>Mantenimiento</span></span>",
            alt >= 6  ? "<span style='font-size:9px;font-weight:700;background:" + badgeBg + ";color:" + subColor + ";padding:1px 6px;border-radius:6px;display:inline-block;margin-top:2px;'>" + badgeLabel + "</span>" : '',
            alt >= 10 && m.motivo ? "<span class='cc-sub' style='font-size:10px;color:" + subColor + ";'>" + escapeHtml(m.motivo) + "</span>" : '',
            alt >= 10 ? "<span class='cc-sub' style='font-size:10px;color:" + textColor + ";font-weight:600;display:block;margin-top:2px;'>" + formatHora(hIni) + ' – ' + formatHora(hFin) + "</span>" : ''
        ].join('');
        div.addEventListener('click', function(e) { e.stopPropagation(); abrirPopoverMant(m, div); });
        return div;
    }

    /* ──────────── Render semana ──────────── */
    function renderSemana(lunes, reservas) {
        for (var i = 0; i < 7; i++) {
            var col = document.getElementById('cal-col-' + i);
            if (!col) continue;
            col.classList.remove('col-today-bg');
            Array.from(col.children).forEach(function(c) { c.remove(); });
        }
        var hoy = new Date(); hoy.setHours(0, 0, 0, 0);
        for (var j = 0; j < 7; j++) {
            var dj  = new Date(lunes); dj.setDate(lunes.getDate() + j);
            var colJ = document.getElementById('cal-col-' + j);
            if (colJ && dj.getTime() === hoy.getTime()) colJ.classList.add('col-today-bg');
        }

        var porDia = {};
        reservas.forEach(function(r) {
            if (r.estadoReserva === 'CANCELADO' || r.estadoReserva === 'REEMBOLSADO') return;
            if (canchaCalId && String(r.canchaId) !== String(canchaCalId)) return;
            var diff = Math.round((new Date(r.fecha + 'T00:00:00') - lunes) / 86400000);
            if (diff >= 0 && diff < 7) { if (!porDia[diff]) porDia[diff] = []; porDia[diff].push(r); }
        });

        Object.keys(porDia).forEach(function(diaIdx) {
            var colEl = document.getElementById('cal-col-' + diaIdx); if (!colEl) return;
            var resEnDia = porDia[diaIdx];
            if (filtroEstado) resEnDia = resEnDia.filter(function(r) { return r.estadoReserva === filtroEstado; });
            resEnDia.forEach(function(r) { colEl.appendChild(buildCard(r)); });
        });

        mantenimientosSemana.forEach(function(m) {
            if (canchaCalId && String(m.canchaId) !== String(canchaCalId)) return;
            var fecha = new Date(m.horaInicio); fecha.setHours(0, 0, 0, 0);
            var diff  = Math.round((fecha - lunes) / 86400000);
            if (diff >= 0 && diff < 7) {
                var est = m.estadoMantenimiento;
                if (est === 'PROGRAMADO' || est === 'EN_PROCESO') {
                    var colM = document.getElementById('cal-col-' + diff);
                    if (colM) colM.appendChild(buildCardMant(m));
                }
            }
        });
    }

    /* ──────────── Stats (todas las canchas) ──────────── */
    function renderBottomStats() {
        var reservas = reservasSemana.filter(function(r) {
            if (r.estadoReserva === 'CANCELADO' || r.estadoReserva === 'REEMBOLSADO') return false;
            if (canchaCalId && String(r.canchaId) !== String(canchaCalId)) return false;
            return true;
        });
        var completadas = reservas.filter(function(r) { return r.estadoReserva === 'COMPLETADO'; }).length;
        
        document.getElementById('cal-stat-total').textContent = completadas;
        document.getElementById('cal-stat-bar').style.width = Math.min((completadas / Math.max(reservas.length, 1)) * 100, 100) + '%';

        var subEl = document.getElementById('cal-stat-sub');
        if (subEl) subEl.textContent = 'de ' + reservas.length + ' en total (' + (reservas.length ? Math.round((completadas/reservas.length)*100) : 0) + '%)';

        var counts = {};
        reservasSemana.forEach(function(r) { 
            if (canchaCalId && String(r.canchaId) !== String(canchaCalId)) return;
            counts[r.estadoReserva] = (counts[r.estadoReserva] || 0) + 1; 
        });

        var listEl = document.getElementById('cal-estado-list');
        listEl.innerHTML = '';
        Object.keys(ESTADO_STYLE).forEach(function(est) {
            var meta  = ESTADO_STYLE[est];
            var count = counts[est] || 0;
            var item  = document.createElement('div'); item.className = 'cbc-item';
            item.innerHTML = "<strong style='display:flex;align-items:center;gap:6px;'>"
                + "<span style='width:8px;height:8px;border-radius:50%;background:" + meta.dot + ";display:inline-block;'></span>"
                + meta.label + "</strong><span class='cbc-badge' style='background:#f1f5f9;color:#334155;'>" + count + "</span>";
            listEl.appendChild(item);
        });
    }

    /* ──────────── Cargar semana completa ──────────── */
    function cargarSemana() {
        var lunes = getLunes(semanaOffset);
        buildHeaders(lunes);

        loading.style.display = 'flex';
        errBox.style.display  = 'none';
        panel.style.display   = 'none';
        bottom.style.display  = 'none';

        var domMs = new Date(lunes); domMs.setDate(lunes.getDate() + 6);
        var fDesde = toISO(lunes), fHasta = toISO(domMs);

        var endpointRes  = '/reservas?fechaDesde=' + fDesde + '&fechaHasta=' + fHasta + '&size=500';
        if (sucursalFiltro) endpointRes += '&sucursalId=' + sucursalFiltro;

        var endpointMant = '/mantenimientos?fechaDesde=' + fDesde + '&fechaHasta=' + fHasta
            + '&estadoMantenimiento=PROGRAMADO&estadoMantenimiento=EN_PROCESO&size=100';
        if (sucursalFiltro) endpointMant += '&sucursalId=' + sucursalFiltro;

        Promise.all([
            api.get(endpointRes).catch(function() { return { content: [] }; }),
            api.get(endpointMant).catch(function() { return { content: [] }; })
        ]).then(function(resultados) {
            var allRes  = Array.isArray(resultados[0]) ? resultados[0] : (resultados[0].content || []);
            var allMant = Array.isArray(resultados[1]) ? resultados[1] : (resultados[1].content || []);

            reservasSemana      = allRes;
            mantenimientosSemana = allMant.filter(function(m) {
                return m.estadoMantenimiento === 'PROGRAMADO' || m.estadoMantenimiento === 'EN_PROCESO';
            });

            buildEjes();
            renderSemana(lunes, reservasSemana);
            renderBottomStats();

            loading.style.display = 'none';
            panel.style.display   = '';
            bottom.style.display  = '';
        }).catch(function(err) {
            loading.style.display = 'none';
            errMsg.textContent    = 'Error al cargar calendario: ' + err.message;
            errBox.style.display  = 'flex';
        });
    }

    /* ──────────── Navegación ──────────── */
    document.getElementById('cal-prev').addEventListener('click', function() { semanaOffset--; cargarSemana(); });
    document.getElementById('cal-next').addEventListener('click', function() { semanaOffset++; cargarSemana(); });
    document.getElementById('cal-hoy').addEventListener('click',  function() { semanaOffset = 0; cargarSemana(); });
    document.getElementById('cal-btn-hoy-2').addEventListener('click', function() { semanaOffset = 0; cargarSemana(); });
    document.getElementById('cal-retry').addEventListener('click', cargarSemana);

    filterEl.addEventListener('change', function() {
        filtroEstado = filterEl.value;
        renderSemana(getLunes(semanaOffset), reservasSemana);
        renderBottomStats();
    });

    /* ──────────── Exportar CSV ──────────── */
    document.getElementById('cal-btn-export').addEventListener('click', function() {
        var rows = [['ID','Cancha','Cliente','Fecha','Inicio','Fin','Estado','Monto','Saldo']];
        reservasSemana.forEach(function(r) {
            rows.push([r.id, r.nombreCancha, r.nombreCliente, r.fecha, formatHora(r.horaInicio), formatHora(r.horaFin), r.estadoReserva, r.montoTotal, r.saldoPendiente]);
        });
        var csv  = rows.map(function(r) { return r.join(','); }).join('\n');
        var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        var url  = URL.createObjectURL(blob);
        var a    = document.createElement('a'); a.href = url; a.download = 'reservas.csv'; a.click();
        URL.revokeObjectURL(url);
    });

    /* ──────────── POPOVER MANTENIMIENTO ──────────── */
    var _activePop = null;

    function cerrarPopover() {
        if (_activePop && _activePop.parentNode) _activePop.parentNode.removeChild(_activePop);
        _activePop = null;
    }

    function _posicionarPopover(pop, anchorEl) {
        var rect = anchorEl.getBoundingClientRect();
        var pw   = pop.offsetWidth  || 300;
        var ph   = pop.offsetHeight || 360;
        var left = rect.right + 8, top = rect.top;
        if (left + pw > window.innerWidth)      left = rect.left - pw - 8;
        if (left < 8)                           left = 8;
        if (top + ph > window.innerHeight - 8)  top = window.innerHeight - ph - 8;
        if (top < 8)                            top = 8;
        pop.style.left = left + 'px';
        pop.style.top  = top  + 'px';
    }

    function abrirPopoverMant(m, anchorEl) {
        cerrarPopover();
        var TIPO_LABEL   = { PREVENTIVO:'Preventivo', CORRECTIVO:'Correctivo', URGENTE:'⚠ Urgente' };
        var ESTADO_LABEL = { PROGRAMADO:'Programado', EN_PROCESO:'En Proceso', COMPLETADO:'Completado', CANCELADO:'Cancelado' };
        var ESTADO_COLOR = { PROGRAMADO:'#2563eb', EN_PROCESO:'#d97706', COMPLETADO:'#059669', CANCELADO:'#64748b' };
        var ESTADO_BG    = { PROGRAMADO:'#dbeafe', EN_PROCESO:'#fef3c7', COMPLETADO:'#dcfce7', CANCELADO:'#f1f5f9' };
        var HEADER_BG    = { PROGRAMADO:'#1e3a5f', EN_PROCESO:'#78350f', COMPLETADO:'#064e3b', CANCELADO:'#1e293b' };
        var parseDT = function(iso) {
            if (!iso) return { hora:'—', fecha:'—' };
            var d = new Date(iso); var pad = function(n){ return n < 10 ? '0' + n : n; };
            var MES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
            return { hora: pad(d.getHours()) + ':' + pad(d.getMinutes()), fecha: d.getDate() + ' ' + MES[d.getMonth()] };
        };
        var ini = parseDT(m.horaInicio), fin = parseDT(m.horaFin);
        var est = m.estadoMantenimiento;
        var durStr = '';
        if (m.horaInicio && m.horaFin) {
            var mins = (new Date(m.horaFin) - new Date(m.horaInicio)) / 60000;
            if (mins > 0) durStr = ' (' + (mins >= 60 ? Math.floor(mins/60) + 'h' + (mins%60 ? ' '+mins%60+'m' : '') : mins+'m') + ')';
        }
        var eColor = ESTADO_COLOR[est] || '#64748b', eBg = ESTADO_BG[est] || '#f1f5f9', eLabel = ESTADO_LABEL[est] || est, hBg = HEADER_BG[est] || '#1e293b';

        var actionBtns = '';
        if (est === 'PROGRAMADO') {
            actionBtns = "<button class='mp-btn-manage' id='pop-iniciar-btn' style='background:linear-gradient(135deg,#065f46,#059669);color:#fff;border:none;flex:1;justify-content:center;'><i class='bx bx-play-circle'></i> Iniciar</button>"
                       + "<button class='mp-btn-cancel' id='pop-cancel-btn' style='background:#fff1f2;color:#dc2626;border:1px solid #fecaca;flex:1;justify-content:center;'><i class='bx bx-x-circle'></i> Cancelar</button>";
        } else if (est === 'EN_PROCESO') {
            actionBtns = "<button class='mp-btn-manage' id='pop-completar-btn' style='background:linear-gradient(135deg,#1e3a5f,#2563eb);color:#fff;border:none;width:100%;justify-content:center;'><i class='bx bx-check-circle'></i> Marcar como Completado</button>";
        } else {
            actionBtns = "<button class='mp-btn-manage' id='pop-close-final-btn' style='width:100%;justify-content:center;'><i class='bx bx-x'></i> Cerrar</button>";
        }

        var pop = document.createElement('div'); pop.className = 'mant-popover'; pop.style.width = '290px';
        pop.innerHTML = [
            "<div class='mp-header' style='background:" + hBg + ";'>",
                "<span class='mp-header-icon' style='background:rgba(255,255,255,0.15);font-size:16px;'>🔧</span>",
                "<div style='flex:1;min-width:0;'>",
                    "<span class='mp-header-title' style='color:#fff;'>Mantenimiento #" + m.id + "</span>",
                    "<span style='display:block;font-size:10px;color:rgba(255,255,255,0.7);margin-top:2px;'>" + (m.nombreCancha||'—') + "</span>",
                "</div>",
                "<div style='display:flex;flex-direction:column;align-items:flex-end;gap:4px;'>",
                    "<span style='background:" + eBg + ";color:" + eColor + ";padding:2px 8px;border-radius:20px;font-size:10px;font-weight:800;white-space:nowrap;'>" + eLabel + "</span>",
                    "<button class='mp-header-close' id='pop-close-btn' style='color:#fff;margin:0;'>✕</button>",
                "</div>",
            "</div>",
            "<div class='mp-body'>",
                "<div class='mp-row'><span>🏟️ Cancha</span><strong>" + (m.nombreCancha||'—') + "</strong></div>",
                "<div class='mp-row'><span>📅 Fecha</span><strong>" + ini.fecha + "</strong></div>",
                "<div class='mp-row'><span>🕐 Horario</span><strong>" + ini.hora + " – " + fin.hora + durStr + "</strong></div>",
                "<div class='mp-row'><span>🔩 Tipo</span><strong>" + (TIPO_LABEL[m.tipoMantenimiento]||m.tipoMantenimiento||'—') + "</strong></div>",
                "<div class='mp-row' style='align-items:flex-start;'><span>📝 Motivo</span><strong style='text-align:right;max-width:160px;word-break:break-word;'>" + (m.motivo||'—') + "</strong></div>",
            "</div>",
            "<div id='pop-feedback' style='display:none;padding:8px 12px;margin:0 12px 4px;border-radius:8px;font-size:12px;font-weight:600;text-align:center;'></div>",
            "<div class='mp-actions' style='gap:8px;display:flex;'>" + actionBtns + "</div>"
        ].join('');

        document.body.appendChild(pop);
        _activePop = pop;
        _posicionarPopover(pop, anchorEl);

        var feedback = pop.querySelector('#pop-feedback');
        function _setLoading(btn, on) { btn.disabled = on; btn.style.opacity = on ? '0.6' : '1'; }
        function _showFeedback(msg, isErr) {
            feedback.style.display    = 'block';
            feedback.style.background = isErr ? '#fff1f2' : '#dcfce7';
            feedback.style.color      = isErr ? '#dc2626' : '#059669';
            feedback.textContent      = msg;
        }

        var closeBtn = pop.querySelector('#pop-close-btn'); if (closeBtn) closeBtn.addEventListener('click', cerrarPopover);
        var closeFinalBtn = pop.querySelector('#pop-close-final-btn'); if (closeFinalBtn) closeFinalBtn.addEventListener('click', cerrarPopover);

        var iniciarBtn = pop.querySelector('#pop-iniciar-btn');
        if (iniciarBtn) iniciarBtn.addEventListener('click', function() {
            _setLoading(this, true);
            api.patch('/mantenimientos/' + m.id + '/estado', { estado: 'EN_PROCESO' })
                .then(function() { cerrarPopover(); modals.mostrarResToast('🟠 Mantenimiento iniciado — EN PROCESO'); cargarSemana(); })
                .catch(function(e) { _showFeedback('Error: ' + e.message, true); _setLoading(iniciarBtn, false); });
        });

        var completarBtn = pop.querySelector('#pop-completar-btn');
        if (completarBtn) completarBtn.addEventListener('click', function() {
            _setLoading(this, true);
            api.patch('/mantenimientos/' + m.id + '/estado', { estado: 'COMPLETADO' })
                .then(function() { cerrarPopover(); modals.mostrarResToast('✅ Mantenimiento completado.'); cargarSemana(); })
                .catch(function(e) { _showFeedback('Error: ' + e.message, true); _setLoading(completarBtn, false); });
        });

        var cancelMantBtn = pop.querySelector('#pop-cancel-btn');
        if (cancelMantBtn) cancelMantBtn.addEventListener('click', function() {
            if (cancelMantBtn.dataset.confirm !== '1') {
                cancelMantBtn.dataset.confirm = '1';
                cancelMantBtn.innerHTML = "<i class='bx bx-error'></i> ¿Confirmar?";
                cancelMantBtn.style.background = '#dc2626'; cancelMantBtn.style.color = '#fff'; return;
            }
            _setLoading(this, true);
            api.patch('/mantenimientos/' + m.id + '/cancelar')
                .then(function() { cerrarPopover(); modals.mostrarResToast('Mantenimiento cancelado.'); cargarSemana(); })
                .catch(function(e) { _showFeedback('Error: ' + e.message, true); _setLoading(cancelMantBtn, false); });
        });
    }

    /* ──────────── POPOVER RESERVA ──────────── */
    function abrirPopoverReserva(rResumen, anchorEl) {
        cerrarPopover();
        var reservaId = rResumen.id || rResumen.reservaId;
        if (!reservaId) return;
        var ESTADO_COLOR = { PENDIENTE:'#d97706', PAGADA:'#059669', COMPLETADO:'#2563eb', CANCELADO:'#dc2626', REEMBOLSADO:'#7c3aed' };
        var ESTADO_BG    = { PENDIENTE:'#fef3c7', PAGADA:'#dcfce7', COMPLETADO:'#dbeafe', CANCELADO:'#fee2e2', REEMBOLSADO:'#ede9fe' };
        var ESTADO_LABEL = { PENDIENTE:'Pendiente', PAGADA:'Pagada', COMPLETADO:'Completada', CANCELADO:'Cancelada', REEMBOLSADO:'Reembolsada' };
        var HEADER_BG    = { PENDIENTE:'#78350f', PAGADA:'#064e3b', COMPLETADO:'#1e3a5f', CANCELADO:'#7f1d1d', REEMBOLSADO:'#4c1d95' };

        var pop = document.createElement('div'); pop.className = 'mant-popover'; pop.style.width = '300px';
        pop.innerHTML = "<div class='mp-header' style='background:#1e3a5f;'><span class='mp-header-icon' style='background:rgba(255,255,255,0.15);'>📅</span><span class='mp-header-title' style='color:#fff;'>Cargando reserva...</span><button class='mp-header-close' id='rpop-close-btn' style='color:#fff;'>✕</button></div>"
            + "<div class='mp-body' style='text-align:center;padding:24px;'><i class='bx bx-loader-alt bx-spin' style='font-size:28px;color:#3b82f6;'></i></div>";

        document.body.appendChild(pop);
        _activePop = pop;
        _posicionarPopover(pop, anchorEl);
        pop.querySelector('#rpop-close-btn').addEventListener('click', cerrarPopover);

        api.get('/reservas/' + reservaId)
            .then(function(r) {
                if (_activePop !== pop) return;
                var est    = r.estadoReserva;
                var eColor = ESTADO_COLOR[est] || '#64748b';
                var eBg    = ESTADO_BG[est]    || '#f1f5f9';
                var eLabel = ESTADO_LABEL[est]  || est;
                var hBg    = HEADER_BG[est]     || '#1e3a5f';
                var DIAS   = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
                var MESES_C= ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
                var fDate  = new Date(r.fecha + 'T00:00:00');
                var fechaStr = DIAS[fDate.getDay()] + ' ' + fDate.getDate() + ' ' + MESES_C[fDate.getMonth()];
                var horaStr  = (r.horaInicio||'').substring(0,5) + ' – ' + (r.horaFin||'').substring(0,5);
                var durStr = '';
                if (r.horaInicio && r.horaFin) {
                    var iS = r.horaInicio.split(':'), fS = r.horaFin.split(':');
                    var mins = (parseInt(fS[0])*60+parseInt(fS[1])) - (parseInt(iS[0])*60+parseInt(iS[1]));
                    if (mins > 0) durStr = ' (' + (mins >= 60 ? Math.floor(mins/60) + 'h' + (mins%60 ? ' '+mins%60+'m' : '') : mins+'m') + ')';
                }
                var saldo  = Number(r.saldoPendiente || 0);
                var pagado = Number(r.montoPagado    || 0);
                var total  = Number(r.montoTotal     || 0);

                var rowBtns1 = [], rowBtns2 = [];
                if (est === 'PENDIENTE' && saldo > 0) rowBtns1.push("<button class='mp-btn-manage' id='rpop-pago-btn'    style='background:linear-gradient(135deg,#065f46,#059669);color:#fff;border:none;flex:2;justify-content:center;'><i class='bx bx-credit-card'></i> Añadir Pago</button>");
                if (est === 'PENDIENTE' || est === 'PAGADA')  rowBtns1.push("<button class='mp-btn-manage' id='rpop-reprog-btn'  style='background:linear-gradient(135deg,#1e3a5f,#0284c7);color:#fff;border:none;flex:1;justify-content:center;'><i class='bx bx-calendar-edit'></i> Reprogramar</button>");
                if (est === 'PAGADA'   || est === 'COMPLETADO') rowBtns1.push("<button class='mp-btn-manage' id='rpop-imprimir-btn' style='background:#f8fafc;color:#475569;border:1px solid #e2e8f0;flex:1;justify-content:center;font-size:11px;'><i class='bx bx-printer'></i> Imprimir</button>");
                if (est === 'PENDIENTE' || est === 'PAGADA')  rowBtns2.push("<button class='mp-btn-cancel'  id='rpop-cancelar-btn' style='background:#fff1f2;color:#dc2626;border:1px solid #fecaca;width:100%;justify-content:center;'><i class='bx bx-x-circle'></i> Cancelar Reserva</button>");

                pop.innerHTML = [
                    "<div class='mp-header' style='background:" + hBg + ";'>",
                        "<span class='mp-header-icon' style='background:rgba(255,255,255,0.15);'>📅</span>",
                        "<div style='flex:1;min-width:0;'><span class='mp-header-title' style='color:#fff;'>Reserva #" + r.id + "</span><span style='display:block;font-size:10px;color:rgba(255,255,255,0.75);margin-top:2px;'>" + (r.nombreCliente||'—') + "</span></div>",
                        "<div style='display:flex;flex-direction:column;align-items:flex-end;gap:4px;'><span style='background:" + eBg + ";color:" + eColor + ";padding:2px 8px;border-radius:20px;font-size:10px;font-weight:800;white-space:nowrap;'>" + eLabel + "</span><button class='mp-header-close' id='rpop-close-btn' style='color:#fff;margin:0;'>✕</button></div>",
                    "</div>",
                    "<div class='mp-body'>",
                        "<div class='mp-row'><span>👤 Cliente</span><strong>" + (r.nombreCliente||'—') + "</strong></div>",
                        "<div class='mp-row'><span>🏟️ Cancha</span><strong>" + (r.nombreCancha||'—')  + "</strong></div>",
                        "<div class='mp-row'><span>📅 Fecha</span><strong>"  + fechaStr               + "</strong></div>",
                        "<div class='mp-row'><span>🕐 Horario</span><strong>"+ horaStr + durStr       + "</strong></div>",
                        "<div style='background:#f8fafc;border-radius:10px;border:1px solid #e2e8f0;margin-top:10px;overflow:hidden;'>",
                            "<div style='display:flex;justify-content:space-between;padding:7px 12px;border-bottom:1px solid #f1f5f9;'><span style='font-size:11px;color:#94a3b8;'>Total</span><span style='font-weight:600;font-size:12px;color:#334155;'>S/ " + total.toFixed(2)  + "</span></div>",
                            "<div style='display:flex;justify-content:space-between;padding:7px 12px;border-bottom:1px solid #f1f5f9;'><span style='font-size:11px;color:#94a3b8;'>Pagado</span><span style='font-weight:600;font-size:12px;color:#059669;'>S/ " + pagado.toFixed(2) + "</span></div>",
                            "<div style='display:flex;justify-content:space-between;padding:9px 12px;'><span style='font-size:12px;font-weight:700;color:#334155;'>Saldo</span><span style='font-weight:800;font-size:14px;color:" + (saldo > 0 ? '#dc2626' : '#059669') + ";'>S/ " + saldo.toFixed(2) + "</span></div>",
                        "</div>",
                    "</div>",
                    "<div class='mp-actions' style='flex-direction:column;gap:6px;'>",
                        rowBtns1.length ? "<div style='display:flex;gap:6px;'>" + rowBtns1.join('') + "</div>" : '',
                        rowBtns2.length ? "<div style='display:flex;'>"          + rowBtns2.join('') + "</div>" : '',
                        "<button class='mp-btn-outline' id='rpop-detalle-btn' style='width:100%;justify-content:center;font-size:11px;color:#475569;border:1px solid #e2e8f0;background:#f8fafc;border-radius:8px;padding:7px;cursor:pointer;display:flex;align-items:center;gap:5px;'><i class='bx bx-show'></i> Ver Detalle Completo</button>",
                    "</div>"
                ].join('');

                pop.querySelector('#rpop-close-btn').addEventListener('click', cerrarPopover);
                var detBtn = pop.querySelector('#rpop-detalle-btn');   if (detBtn)     detBtn.addEventListener('click',     function() { cerrarPopover(); modals.abrirDetalleReserva(r.id); });
                var pagoBtn = pop.querySelector('#rpop-pago-btn');     if (pagoBtn)    pagoBtn.addEventListener('click',    function() { cerrarPopover(); modals.abrirModalPago(r.id, saldo); });
                var reprogBtn = pop.querySelector('#rpop-reprog-btn'); if (reprogBtn)  reprogBtn.addEventListener('click',  function() { cerrarPopover(); modals.abrirModalReprogramar(r); });
                var cancBtn = pop.querySelector('#rpop-cancelar-btn'); if (cancBtn)    cancBtn.addEventListener('click',    function() { cerrarPopover(); modals.abrirModalCancelar(r); });
                var printBtn = pop.querySelector('#rpop-imprimir-btn');if (printBtn)   printBtn.addEventListener('click',   function() { cerrarPopover(); modals.imprimirReciboReserva(r); });
            })
            .catch(function() {
                if (_activePop === pop) {
                    pop.innerHTML = "<div style='padding:20px;text-align:center;'><i class='bx bx-error-circle' style='font-size:28px;color:#ef4444;'></i><p style='color:#ef4444;font-size:12px;margin:8px 0;'>No se pudo cargar la reserva</p><button id='rpop-close-btn' style='padding:6px 16px;border-radius:8px;border:1px solid #e2e8f0;background:#fff;cursor:pointer;font-size:12px;'>Cerrar</button></div>";
                    pop.querySelector('#rpop-close-btn').addEventListener('click', cerrarPopover);
                }
            });
    }

    /* ──────────── Cerrar popover al click fuera ──────────── */
    addGlobalListener(document, 'click', function(e) {
        if (_activePop && !_activePop.contains(e.target)) cerrarPopover();
    });

    /* ──────────── Selector de cancha del calendario ──────────── */
    var calCanchaSel = document.getElementById('cal-cancha-sel');
    function poblarSelectorCanchasCalendario() {
        var endpoint = '/canchas?size=100' + (sucursalFiltro ? '&sucursalId=' + sucursalFiltro : '');
        api.get(endpoint)
            .then(function(data) {
                var arr = Array.isArray(data) ? data : (data.content || []);
                calCanchaSel.innerHTML = ''; // Quitamos "Todas las canchas"
                arr.filter(function(c) { return c.estadoCancha !== 'INACTIVA'; }).forEach(function(c) {
                    var opt = document.createElement('option');
                    opt.value       = c.canchaId !== undefined ? c.canchaId : c.id;
                    opt.textContent = c.nombre;
                    calCanchaSel.appendChild(opt);
                });
                
                // Seleccionar la primera cancha por defecto
                if (calCanchaSel.options.length > 0) {
                    calCanchaSel.selectedIndex = 0;
                    canchaCalId = parseInt(calCanchaSel.value);
                    renderSemana(getLunes(semanaOffset), reservasSemana);
                    renderBottomStats();
                }
            }).catch(function() {
                calCanchaSel.innerHTML = '<option value="">— Sin canchas —</option>';
            });
    }

    calCanchaSel.addEventListener('change', function() {
        canchaCalId = calCanchaSel.value ? parseInt(calCanchaSel.value) : null;
        renderSemana(getLunes(semanaOffset), reservasSemana);
        renderBottomStats();
    });

    /* ──────────── Inicio ──────────── */
    poblarSelectorCanchasCalendario();

    /* ──────────── API PÚBLICA ──────────── */
    return { cargarSemana: cargarSemana };
}
