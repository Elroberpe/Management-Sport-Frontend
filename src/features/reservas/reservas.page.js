import { reservasTemplate } from './reservas.template.js';
import { api } from '../../core/api.js';
import { Auth } from '../../core/auth.js';

export function template() {
    return reservasTemplate();
}

export function mount(container) {

    var BASE_URL = 'http://localhost:8080/api/v1';
    var session  = Auth ? Auth.getSession() : null;

    /* ---- Configuración temporal del calendario ---- */
    var HORA_INICIO = 7;   // 07:00
    var HORA_FIN    = 24;  // 24:00 (Media noche)
    var TOTAL_HORAS = HORA_FIN - HORA_INICIO; // 17

    var DIAS_ES  = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
    var DIAS_FULL = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
    var MESES_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

    /* ---- Estado ---- */
    var semanaOffset = 0;   // 0 = semana actual
    var reservasSemana = [];
    var mantenimientosSemana = [];
    var filtroEstado = '';

    /* ---- DOM refs ---- */
    var loading  = document.getElementById('cal-loading');
    var errBox   = document.getElementById('cal-error');
    var errMsg   = document.getElementById('cal-error-msg');
    var panel    = document.getElementById('cal-panel');
    var bottom   = document.getElementById('cal-bottom');
    var semLabel = document.getElementById('cal-semana-label');
    var filterEl = document.getElementById('cal-filter-estado');

    /* ---- Utils de fecha ---- */
    function getLunes(offset) {
        var hoy   = new Date();
        var dia   = hoy.getDay(); // 0=Dom
        var diff  = (dia === 0) ? -6 : 1 - dia; // hacia el lunes
        var lunes = new Date(hoy);
        lunes.setDate(hoy.getDate() + diff + (offset * 7));
        lunes.setHours(0, 0, 0, 0);
        return lunes;
    }

    function toISO(date) {
        var y = date.getFullYear();
        var m = String(date.getMonth() + 1).padStart(2, '0');
        var d = String(date.getDate()).padStart(2, '0');
        return y + '-' + m + '-' + d;
    }

    function formatHora(timeStr) {
        // "19:00:00" → "19:00"
        return timeStr ? timeStr.substring(0, 5) : '';
    }

    /* ---- Color por estado ---- */
    var ESTADO_STYLE = {
        PAGADA:      { cls: 'bg-blue-tint text-blue',    label: 'Pagada',      dot: '#3b82f6' },
        PENDIENTE:   { cls: 'bg-yellow-tint text-yellow', label: 'Pendiente',   dot: '#eab308' },
        COMPLETADO:  { cls: 'bg-green-tint text-green',   label: 'Completada',  dot: '#10b981' },
        CANCELADO:   { cls: 'bg-red-tint text-red',       label: 'Cancelada',   dot: '#ef4444' },
        REEMBOLSADO: { cls: 'bg-purple-tint text-purple', label: 'Reembolsada', dot: '#8b5cf6' },
    };

    /* ---- Calcular posición vertical (%) ---- */
    function posYPct(horaStr) {
        var parts = horaStr.split(':');
        var horas = parseInt(parts[0]) + parseInt(parts[1] || 0) / 60;
        return ((horas - HORA_INICIO) / TOTAL_HORAS) * 100;
    }
    function altPct(ini, fin) {
        var a = posYPct(ini);
        var b = posYPct(fin);
        return Math.max(b - a, 5); // mínimo 5% visibilidad
    }

    /* ---- Construir ejes de tiempo ---- */
    function buildEjes() {
        var axis  = document.getElementById('cal-time-axis');
        var lines = document.getElementById('cal-lines');
        axis.innerHTML = '';
        lines.innerHTML = '';
        for (var h = HORA_INICIO; h <= HORA_FIN; h++) {
            var pct = ((h - HORA_INICIO) / TOTAL_HORAS) * 100;
            var label = (h < 12) ? h + ':00 AM' : (h === 12 ? '12:00 PM' : (h === 24 ? '12:00 AM' : (h - 12) + ':00 PM'));
            var slot  = document.createElement('div');
            slot.className = 'time-slot';
            slot.style.top = pct + '%';
            slot.textContent = label;
            axis.appendChild(slot);

            var line = document.createElement('div');
            line.className = 'line-h';
            line.style.top = pct + '%';
            lines.appendChild(line);
        }
    }

    /* ---- Construir headers de días ---- */
    function buildHeaders(lunes) {
        var hoy = new Date(); hoy.setHours(0,0,0,0);
        for (var i = 0; i < 7; i++) {
            var dia = new Date(lunes); dia.setDate(lunes.getDate() + i);
            var h   = document.getElementById('cal-h-' + i);
            var esHoy = dia.getTime() === hoy.getTime();
            h.className = 'cg-day-header' + (esHoy ? ' today-active' : '');
            h.querySelector('span').textContent  = DIAS_ES[dia.getDay()].toUpperCase();
            h.querySelector('strong').textContent = dia.getDate();
        }
        // Label de semana
        var fin = new Date(lunes); fin.setDate(lunes.getDate() + 6);
        semLabel.textContent =
            lunes.getDate() + ' ' + MESES_ES[lunes.getMonth()].substring(0,3) +
            ' - ' + fin.getDate() + ' ' + MESES_ES[fin.getMonth()].substring(0,3) +
            ', ' + fin.getFullYear();
    }

    /* ---- Construir card de reserva ---- */
    function buildCard(r) {
        var meta  = ESTADO_STYLE[r.estadoReserva] || ESTADO_STYLE['PENDIENTE'];
        var top   = posYPct(r.horaInicio);
        var alt   = altPct(r.horaInicio, r.horaFin);

        var div = document.createElement('div');
        div.className = 'cal-card ' + meta.cls;
        div.style.top    = top + '%';
        div.style.height = alt + '%';
        
        // Estilos extra
        if (r.estadoReserva === 'PENDIENTE') {
            div.style.borderLeft = '4px solid #eab308';
        } else if (r.estadoReserva === 'COMPLETADO') {
            div.style.opacity = '0.6';
        }

        div.setAttribute('title', (r.nombreCliente||'Sin Cliente') + '\n' + formatHora(r.horaInicio) + ' - ' + formatHora(r.horaFin));

        var mostrarSub = alt >= 10;
        var subText = '';
        if (r.saldoPendiente > 0 && r.estadoReserva !== 'COMPLETADO') {
            subText = "<span class='cc-sub' style='color:#b45309;font-weight:700;'>Debe: S/ " + Number(r.saldoPendiente).toFixed(2) + "</span>";
        }

        div.innerHTML = [
            "<span class='cc-title' style='font-size:12px;'>" + escapeHtml(r.nombreCliente || 'Sin cliente') + "</span>",
            mostrarSub ? subText : ''
        ].join('');

        div.addEventListener('click', function(e) {
            e.stopPropagation();
            abrirPopoverReserva(r, div);
        });

        return div;
    }

    /* ---- Construir card de MANTENIMIENTO ---- */
    function buildCardMant(m) {
        var parseHora = function(isoStr) {
            if (!isoStr) return '00:00';
            var t = isoStr.split('T')[1] || isoStr;
            return t.substring(0,5);
        };
        var hIni = parseHora(m.horaInicio);
        var hFin = parseHora(m.horaFin);

        var top = posYPct(hIni);
        var alt = altPct(hIni, hFin);

        var div = document.createElement('div');
        // Usando el estilo de la leyenda peach/orange
        div.className = 'cal-card';
        div.style.top    = top + '%';
        div.style.height = Math.max(alt, 5) + '%';
        
        // Estilos visuales: Naranja suave con borde izquierdo acentuado
        div.style.background = '#fff7ed';
        div.style.color = '#c2410c';
        div.style.borderLeft = '4px solid #ea580c';
        div.style.borderRight = '1px solid #fed7aa';
        div.style.borderBottom = '1px solid #fed7aa';
        div.style.borderTop = '1px solid #fed7aa';

        var mostrarSub = alt >= 10;
        div.innerHTML = [
            "<span class='cc-title' style='font-size:11px; font-weight:800; letter-spacing:0.5px;'>🔧 MANTENIMIENTO</span>",
            mostrarSub ? "<span class='cc-sub' style='font-weight:600; font-size:11px; color:#9a3412;'><span style='font-weight:400;color:#c2410c;'>Motivo: </span>" + escapeHtml(m.motivo || '-') + "</span>" : '',
        ].join('');

        div.addEventListener('click', function(e){
            e.stopPropagation();
            abrirPopoverMant(m, div);
        });

        return div;
    }

    /* ---- Render semana ---- */
    function renderSemana(lunes, reservas) {
        // Limpiar columnas
        for (var i = 0; i < 7; i++) {
            var col = document.getElementById('cal-col-' + i);
            if (!col) continue;
            col.classList.remove('col-today-bg');
            Array.from(col.children).forEach(function(c){ c.remove(); });
        }

        var hoy = new Date(); hoy.setHours(0,0,0,0);

        // Marcar hoy
        for (var j = 0; j < 7; j++) {
            var dj = new Date(lunes); dj.setDate(lunes.getDate() + j);
            var colToday = document.getElementById('cal-col-' + j);
            if (colToday && dj.getTime() === hoy.getTime()) {
                colToday.classList.add('col-today-bg');
            }
        }

        // Agrupar reservas por día de la semana (Filtrando Canceladas/Reembolsadas)
        var porDia = {};
        reservas.forEach(function (r) {
            if (r.estadoReserva === 'CANCELADO' || r.estadoReserva === 'REEMBOLSADO') return;
            
            var fecha = new Date(r.fecha + 'T00:00:00');
            var diff  = Math.round((fecha - lunes) / (1000 * 60 * 60 * 24));
            if (diff >= 0 && diff < 7) {
                if (!porDia[diff]) porDia[diff] = [];
                porDia[diff].push(r);
            }
        });

        Object.keys(porDia).forEach(function (diaIdx) {
            var col      = document.getElementById('cal-col-' + diaIdx);
            if (!col) return;
            var resEnDia = porDia[diaIdx];

            // Aplicar filtro de estado
            if (filtroEstado) {
                resEnDia = resEnDia.filter(function(r){ return r.estadoReserva === filtroEstado; });
            }

            resEnDia.forEach(function (r) {
                col.appendChild(buildCard(r));
            });
        });

        // Render mantenimientos (Sólo PROGRAMADO y EN_PROCESO)
        mantenimientosSemana.forEach(function(m) {
            var fecha = new Date(m.horaInicio);
            fecha.setHours(0,0,0,0);
            var diff = Math.round((fecha - lunes) / (1000 * 60 * 60 * 24));
            if (diff >= 0 && diff < 7) {
                var est = m.estadoMantenimiento;
                if (est === 'PROGRAMADO' || est === 'EN_PROCESO') {
                    var col = document.getElementById('cal-col-' + diff);
                    if (col) col.appendChild(buildCardMant(m));
                }
            }
        });
    }

    /* ---- Bottom stats ---- */
    function renderBottomStats(reservas) {
        document.getElementById('cal-stat-total').textContent = reservas.length;
        var maxPosible = 50;
        var pct = Math.min((reservas.length / maxPosible) * 100, 100);
        document.getElementById('cal-stat-bar').style.width = pct + '%';

        // Resumen de estados
        var counts = {};
        reservas.forEach(function(r){ counts[r.estadoReserva] = (counts[r.estadoReserva] || 0) + 1; });
        
        var listEl = document.getElementById('cal-estado-list');
        listEl.innerHTML = '';

        // Iterar sobre todos los estados definidos para mostrar incluso los que tienen 0
        Object.keys(ESTADO_STYLE).forEach(function(est) {
            var meta = ESTADO_STYLE[est];
            var count = counts[est] || 0;
            
            var item = document.createElement('div');
            item.className = 'cbc-item';
            item.innerHTML = [
                "<strong style='display:flex;align-items:center;gap:6px;'>",
                    "<span style='width:8px;height:8px;border-radius:50%;background:" + meta.dot + ";display:inline-block;'></span>",
                    meta.label,
                "</strong>",
                "<span class='cbc-badge' style='background:#f1f5f9;color:#334155;'>" + count + "</span>"
            ].join('');
            listEl.appendChild(item);
        });

        if (reservas.length === 0) {
            // Opcional: mostrar un mensaje sutil si no hay nada en absoluto, 
            // pero ya estamos mostrando los estados con 0.
        }
    }

    /* ---- Cargar reservas de la semana completa ---- */
    function cargarSemana() {
        var lunes = getLunes(semanaOffset);
        buildHeaders(lunes);

        loading.style.display = 'flex';
        errBox.style.display  = 'none';
        panel.style.display   = 'none';
        bottom.style.display  = 'none';

        var domMs = new Date(lunes);
        domMs.setDate(lunes.getDate() + 6);
        var fechaDesdeStr = toISO(lunes);
        var fechaHastaStr = toISO(domMs);

        // Fetch Reservas (Traemos todas para las estadísticas)
        var urlReservas = BASE_URL + '/reservas?fechaDesde=' + fechaDesdeStr + '&fechaHasta=' + fechaHastaStr + '&size=500';
                          
        // Fetch Mantenimientos (PROGRAMADO, EN_PROCESO)
        var urlMant = BASE_URL + '/mantenimientos?fechaDesde=' + fechaDesdeStr + '&fechaHasta=' + fechaHastaStr + 
                      '&estadoMantenimiento=PROGRAMADO&estadoMantenimiento=EN_PROCESO&size=100';

        Promise.all([
            fetch(urlReservas).then(function(r){ return r.ok ? r.json() : { content: [] }; }),
            fetch(urlMant).then(function(r){ return r.ok ? r.json() : { content: [] }; })
        ]).then(function(resultados) {
            var dataRes = resultados[0];
            var dataMant = resultados[1];
            
            var allRes = Array.isArray(dataRes) ? dataRes : (dataRes.content || []);
            var allMant = Array.isArray(dataMant) ? dataMant : (dataMant.content || []);
            
            // Garantizar seguridad de filtrado local (Ocultar Cancelados/Reembolsados/Completados según regla)
            // Guardamos todas para el resumen de estados
            reservasSemana = allRes;
            mantenimientosSemana = allMant.filter(function(m) {
                var est = m.estadoMantenimiento;
                return est === 'PROGRAMADO' || est === 'EN_PROCESO';
            });

            buildEjes();
            renderSemana(lunes, reservasSemana);
            renderBottomStats(reservasSemana);

            loading.style.display = 'none';
            panel.style.display   = '';
            bottom.style.display  = '';
        }).catch(function(err) {
            loading.style.display = 'none';
            errMsg.textContent    = 'Error al cargar calendario: ' + err.message;
            errBox.style.display  = 'flex';
        });
    }

    /* ---- Navegación e Interacción de Cuadrícula ---- */
    document.getElementById('cal-prev').addEventListener('click', function () {
        semanaOffset--;
        cargarSemana();
    });
    document.getElementById('cal-next').addEventListener('click', function () {
        semanaOffset++;
        cargarSemana();
    });
    document.getElementById('cal-hoy').addEventListener('click', function () {
        semanaOffset = 0;
        cargarSemana();
    });
    document.getElementById('cal-btn-hoy-2').addEventListener('click', function () {
        semanaOffset = 0;
        cargarSemana();
    });

    // Interacción con espacio vacío (fondo del calendario)
    document.getElementById('cal-grid').addEventListener('click', function (e) {
        // Asegurarnos de que no hicimos click sobre una card (ya tienen stopPropagation)
        if (e.target.classList.contains('cal-card') || e.target.closest('.cal-card')) return;
        
        // Simular menú flotante temporal
        var result = prompt("¿Qué deseas crear en este espacio vacío?\n\n1. [+ Nueva Reserva]\n2. [🔧 Programar Mantenimiento]\n\nEscribe 1 o 2:");
        if (result === '1') {
            alert('Abriendo modal: [+ Nueva Reserva] (En construcción)');
        } else if (result === '2') {
            alert('Abriendo modal: [🔧 Programar Mantenimiento] (En construcción)');
        }
    });

    /* ---- Filtro de estado (re-render local sin nueva llamada) ---- */
    filterEl.addEventListener('change', function () {
        filtroEstado = filterEl.value;
        renderSemana(getLunes(semanaOffset), reservasSemana);
        renderBottomStats(filtroEstado
            ? reservasSemana.filter(function(r){ return r.estadoReserva === filtroEstado; })
            : reservasSemana
        );
    });

    /* ---- Exportar CSV de la semana ---- */
    document.getElementById('cal-btn-export').addEventListener('click', function () {
        var rows = [['ID','Cancha','Cliente','Fecha','Inicio','Fin','Estado','Monto','Saldo']];
        reservasSemana.forEach(function(r){
            rows.push([r.id, r.nombreCancha, r.nombreCliente, r.fecha, formatHora(r.horaInicio), formatHora(r.horaFin), r.estadoReserva, r.montoTotal, r.saldoPendiente]);
        });
        var csv  = rows.map(function(r){ return r.join(','); }).join('\n');
        var blob = new Blob([csv], { type:'text/csv;charset=utf-8;' });
        var url  = URL.createObjectURL(blob);
        var a    = document.createElement('a'); a.href = url; a.download = 'reservas.csv'; a.click();
        URL.revokeObjectURL(url);
    });

    /* ---- Retry ---- */
    document.getElementById('cal-retry').addEventListener('click', cargarSemana);

    /* ---- Popover Mantenimiento ---- */
    var _activePop = null;

    function cerrarPopover() {
        if (_activePop && _activePop.parentNode) {
            _activePop.parentNode.removeChild(_activePop);
        }
        _activePop = null;
    }

    function abrirPopoverMant(m, anchorEl) {
        cerrarPopover();

        var TIPO_LABEL  = { PREVENTIVO: 'Preventivo', CORRECTIVO: 'Correctivo', URGENTE: '⚠ Urgente' };
        var ESTADO_LABEL = { PROGRAMADO: '🔵 Programado', EN_PROCESO: '🟠 En Proceso', COMPLETADO: '🟢 Completado', CANCELADO: '🔴 Cancelado' };
        var DIAS_FULL2  = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
        var MESES_FULL  = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

        var parseDT = function(iso) {
            if (!iso) return { hora: '—', fecha: '—' };
            var d = new Date(iso);
            var pad = function(n){ return n < 10 ? '0' + n : n; };
            return {
                hora:  pad(d.getHours()) + ':' + pad(d.getMinutes()),
                fecha: DIAS_FULL2[d.getDay()] + ', ' + d.getDate() + ' de ' + MESES_FULL[d.getMonth()]
            };
        };

        var ini = parseDT(m.horaInicio);
        var fin = parseDT(m.horaFin);
        var isCancelable = m.estadoMantenimiento !== 'COMPLETADO' && m.estadoMantenimiento !== 'CANCELADO';

        var pop = document.createElement('div');
        pop.className = 'mant-popover';
        pop.innerHTML = [
            "<div class='mp-header'>",
                "<span class='mp-header-icon'>🔧</span>",
                "<span class='mp-header-title'>Mantenimiento</span>",
                "<button class='mp-header-close' id='pop-close-btn'>✕</button>",
            "</div>",
            "<div class='mp-body'>",
                "<div class='mp-row'><span>Cancha</span><strong>" + (m.nombreCancha || '—') + "</strong></div>",
                "<div class='mp-row'><span>Horario</span><strong>" + ini.fecha + "</strong><strong>" + ini.hora + " — " + fin.hora + "</strong></div>",
                "<div class='mp-row'><span>Tipo</span><strong>" + (TIPO_LABEL[m.tipoMantenimiento] || m.tipoMantenimiento) + "</strong></div>",
                "<div class='mp-row'><span>Motivo</span><strong>" + (m.motivo || '—') + "</strong></div>",
                "<div class='mp-row'><span>Estado</span><strong>" + (ESTADO_LABEL[m.estadoMantenimiento] || m.estadoMantenimiento) + "</strong></div>",
            "</div>",
            "<div class='mp-actions'>",
                "<button class='mp-btn-manage' id='pop-manage-btn'><i class='bx bx-list-ul'></i> Gestionar</button>",
                isCancelable ? "<button class='mp-btn-cancel' id='pop-cancel-btn'><i class='bx bx-x-circle'></i> Cancelar</button>" : '',
            "</div>",
        ].join('');

        document.body.appendChild(pop);
        _activePop = pop;

        // Posicionar cerca del bloque
        var rect = anchorEl.getBoundingClientRect();
        var left = rect.right + 8;
        var top  = rect.top;
        if (left + 285 > window.innerWidth)  left = rect.left - 293;
        if (top  + 300 > window.innerHeight) top  = window.innerHeight - 310;
        pop.style.left = left + 'px';
        pop.style.top  = Math.max(10, top) + 'px';

        // Listeners
        var closeBtn = pop.querySelector('#pop-close-btn');
        if (closeBtn) closeBtn.addEventListener('click', cerrarPopover);

        var manageBtn = pop.querySelector('#pop-manage-btn');
        if (manageBtn) {
            manageBtn.addEventListener('click', function(){
                cerrarPopover();
                window.location.hash = '#/dashboard/mantenimientos';
            });
        }
        
        var cancelBtn = pop.querySelector('#pop-cancel-btn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', function(){
                if (!confirm('¿Cancelar este mantenimiento? Esta acción no se puede deshacer.')) return;
                fetch(BASE_URL + '/mantenimientos/' + m.id + '/cancelar', { method: 'PATCH' })
                    .then(function(r){ if (!r.ok) throw new Error('Error ' + r.status); return r.json(); })
                    .then(function(){
                        cerrarPopover();
                        cargarSemana();
                    })
                    .catch(function(e){ alert('Error al cancelar: ' + e.message); });
            });
        }
    }

    /* ---- Popover Detalles de Reserva ---- */
    function abrirPopoverReserva(rResumen, anchorEl) {
        cerrarPopover();
        
        var reservaId = rResumen.id || rResumen.reservaId;
        if (!reservaId) {
            console.warn("No reserva ID available");
            return;
        }

        // Creamos un popover temporal de esqueleto/cargando
        var pop = document.createElement('div');
        pop.className = 'mant-popover'; // re-usamos los estilos del popover para hacerlo visualmente consistente
        pop.innerHTML = [
            "<div class='mp-header' style='background:#f8fafc'>",
                "<span class='mp-header-icon' style='background:#cbd5e1'>📅</span>",
                "<span class='mp-header-title'>Cargando detalles...</span>",
                "<button class='mp-header-close' id='rpop-close-btn'>✕</button>",
            "</div>",
            "<div class='mp-body' style='text-align:center; padding: 20px;'><i class='bx bx-loader-alt bx-spin' style='font-size:24px;color:#1e40af;'></i></div>"
        ].join('');

        document.body.appendChild(pop);
        _activePop = pop;
        var btnClose = document.getElementById('rpop-close-btn');
        if (btnClose) btnClose.addEventListener('click', cerrarPopover);

        var rect = anchorEl.getBoundingClientRect();
        var left = rect.right + 8;
        var top  = rect.top;
        if (left + 285 > window.innerWidth)  left = rect.left - 293;
        if (top  + 300 > window.innerHeight) top  = window.innerHeight - 310;
        pop.style.left = left + 'px';
        pop.style.top  = Math.max(10, top) + 'px';

        // 2) Lanzar Petición GET al endpoint /api/v1/reservas/{id}
        fetch(BASE_URL + '/reservas/' + reservaId)
            .then(function(res) {
                if (!res.ok) throw new Error("Error fetching reserva");
                return res.json();
            })
            .then(function(r) {
                if (_activePop !== pop) return;

                var ESTADO_LABEL = { 
                    PENDIENTE: '🟡 Pendiente', 
                    PAGADA: '🟢 Pagada', 
                    COMPLETADO: '🔵 Completado', 
                    CANCELADO: '🔴 Cancelada' 
                };

                var fDate = new Date(r.fecha + 'T00:00:00');
                var DIAS = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
                var fechaT = DIAS[fDate.getDay()] + ', ' + fDate.getDate() + ' - ' + (r.horaInicio||'').substring(0,5) + ' a ' + (r.horaFin||'').substring(0,5);

                pop.innerHTML = [
                    "<div class='mp-header' style='background:#1e40af; color:#fff;'>",
                        "<span class='mp-header-icon' style='background:#1e3a8a; color:#fff;'>📅</span>",
                        "<span class='mp-header-title' style='color:#fff;'>Reserva #" + r.id + "</span>",
                        "<button class='mp-header-close' id='rpop-close-btn' style='color:#fff;'>✕</button>",
                    "</div>",
                    "<div class='mp-body'>",
                        "<div class='mp-row'><span>Cliente</span><strong>" + (r.nombreCliente||'—') + "</strong></div>",
                        "<div class='mp-row'><span>Cancha</span><strong>" + (r.nombreCancha||'—') + "</strong></div>",
                        "<div class='mp-row'><span>Fecha</span><strong>" + fechaT + "</strong></div>",
                        "<div class='mp-row'><span>Estado</span><strong>" + (ESTADO_LABEL[r.estadoReserva] || r.estadoReserva) + "</strong></div>",
                        "<div class='mp-row'><span>Total</span><strong>S/ " + Number(r.montoTotal||0).toFixed(2) + "</strong></div>",
                        "<div class='mp-row'><span>Pagado</span><strong>S/ " + Number(r.montoPagado||0).toFixed(2) + "</strong></div>",
                        "<div class='mp-row'><span>Saldo</span><strong " + (r.saldoPendiente > 0 ? "style='color:#dc2626;'" : "") + ">S/ " + Number(r.saldoPendiente||0).toFixed(2) + "</strong></div>",
                    "</div>",
                    "<div class='mp-actions'>",
                        "<button class='mp-btn-manage' id='rpop-action-btn' style='width:100%; justify-content:center;'><i class='bx bx-edit-alt'></i>  Ver Detalles</button>",
                    "</div>"
                ].join('');

                document.getElementById('rpop-close-btn').addEventListener('click', cerrarPopover);
            })
            .catch(function(err) {
                if (_activePop === pop) {
                    pop.innerHTML = "<div style='padding:20px; text-align:center;'>❌ No se pudo cargar<br><button id='rpop-close-btn' style='margin-top:10px;'>Cerrar</button></div>";
                    document.getElementById('rpop-close-btn').addEventListener('click', cerrarPopover);
                }
            });
    }

    // Cerrar popover al click fuera
    document.addEventListener('click', function(e){
        if (_activePop && !_activePop.contains(e.target)) cerrarPopover();
    });

    /* ========================================================================= */
    /*                    TABLA HISTÓRICA Y FILTROS AVANZADOS                    */
    /* ========================================================================= */
    
    var rhCurrentPage = 0;
    var rhPageSize = 10;
    var rhTotalPages = 1;
    
    // 1. Multiselect Estado
    var msWrap = document.getElementById('rh-estado-wrap');
    var msTrigger = document.getElementById('rh-estado-trigger');
    var msDropdown = document.getElementById('rh-estado-dropdown');
    var msOptions = msDropdown.querySelectorAll('input[type="checkbox"]');
    
    msTrigger.addEventListener('click', function(e) {
        e.stopPropagation();
        msDropdown.classList.toggle('active');
    });
    msDropdown.addEventListener('click', function(e){ e.stopPropagation(); }); 
    
    function getSelectedStates() {
        var selected = [];
        msOptions.forEach(function(opt) { if(opt.checked) selected.push(opt.value); });
        return selected;
    }
    
    function updateMsTrigger() {
        var s = getSelectedStates();
        if (s.length === 0) msTrigger.textContent = 'Todos los estados';
        else if (s.length === 1) msTrigger.textContent = s[0];
        else msTrigger.textContent = s.length + ' seleccionados';
    }
    
    msOptions.forEach(function(opt) {
        opt.addEventListener('change', updateMsTrigger);
    });
    
    // 2. Autocompletado de Cliente
    var rhClienteIn = document.getElementById('rh-cliente');
    var rhClienteId = document.getElementById('rh-cliente-id');
    var rhClienteList = document.getElementById('rh-cliente-list');
    var clienteDebounce;
    
    function escapeHtml(unsafe) {
        return (unsafe||'').toString().replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

    rhClienteIn.addEventListener('input', function() {
        clearTimeout(clienteDebounce);
        var q = this.value.trim();
        if (q.length < 2) {
            rhClienteList.style.display = 'none';
            rhClienteId.value = '';
            return;
        }
        clienteDebounce = setTimeout(function() {
            fetch(BASE_URL + '/clientes?nombre=' + encodeURIComponent(q) + '&size=5')
                .then(function(r) { return r.ok ? r.json() : { content: [] }; })
                .then(function(data) {
                    var arr = Array.isArray(data) ? data : (data.content || []);
                    if (arr.length === 0) {
                        rhClienteList.innerHTML = '<li style="color:#94a3b8;">No se encontraron clientes</li>';
                    } else {
                        rhClienteList.innerHTML = arr.map(function(c) {
                            return "<li data-id='" + c.id + "'>" + escapeHtml(c.nombre) + " (" + escapeHtml(c.dni) + ")</li>";
                        }).join('');
                    }
                    rhClienteList.style.display = 'block';
                }).catch(function(){});
        }, 300);
    });
    
    rhClienteList.addEventListener('click', function(e) {
        if (e.target.tagName.toLowerCase() === 'li' && e.target.getAttribute('data-id')) {
            rhClienteIn.value = e.target.textContent;
            rhClienteId.value = e.target.getAttribute('data-id');
            rhClienteList.style.display = 'none';
        }
    });

    document.addEventListener('click', function(e) {
        if (!msWrap.contains(e.target)) msDropdown.classList.remove('active');
        if (!rhClienteList.contains(e.target) && e.target !== rhClienteIn) rhClienteList.style.display = 'none';
    });

    // 3. Poblar filtro Canchas
    var rhCanchaSel = document.getElementById('rh-cancha');
    function poblarCanchasSelect() {
        var cUrl = BASE_URL + '/canchas?size=100';
        fetch(cUrl)
            .then(function(r) { return r.ok ? r.json() : { content: [] }; })
            .then(function(data) {
                var arr = Array.isArray(data) ? data : (data.content || []);
                arr.forEach(function(c) {
                    var opt = document.createElement('option');
                    opt.value = c.canchaId;
                    opt.textContent = c.nombre;
                    rhCanchaSel.appendChild(opt);
                });
            }).catch(function(){});
    }

    // 4. Lógica de Búsqueda
    function fetchHistoricalReservas(page) {
        rhCurrentPage = page || 0;
        
        var tbody = document.getElementById('rh-tbody');
        tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; padding:40px; color:#94a3b8;"><div style="display:inline-block;" class="spinner-circle"></div><br><br>Buscando reservas...</td></tr>';
        
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
        if (canId) params.append('canchaId', canId);
        
        fetch(BASE_URL + '/reservas?' + params.toString())
            .then(function(res) {
                if (!res.ok) throw new Error("Error fetching");
                return res.json();
            })
            .then(function(data) {
                renderHistoricalTable(data);
            })
            .catch(function(err) {
                tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; padding:40px; color:#ef4444;">❌ Error al cargar los resultados.</td></tr>';
            });
    }

    function renderHistoricalTable(data) {
        var tbody = document.getElementById('rh-tbody');
        var items = data.content || [];
        
        if (items.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; padding:40px; color:#64748b;">No se encontraron reservas con esos filtros.</td></tr>';
            document.getElementById('rh-count-label').textContent = 'Mostrando 0 resultados';
            document.getElementById('rh-pagination').style.display = 'none';
            return;
        }

        tbody.innerHTML = items.map(function(r) {
            var STYLE_MAP = {
                PENDIENTE:   { badge: 'badge-yellow', dot: 'dot-yellow' },
                PAGADA:      { badge: 'badge-blue',   dot: 'dot-blue'   },
                COMPLETADO:  { badge: 'badge-green',  dot: 'dot-green'  },
                CANCELADO:   { badge: 'badge-gray',   dot: 'dot-gray'   },
                REEMBOLSADO: { badge: 'badge-gray',   dot: 'dot-gray'   }
            };
            var meta = STYLE_MAP[r.estadoReserva] || { badge: 'badge-gray', dot: 'dot-gray' };
            
            var fHora = (r.horaInicio||'').substring(0,5) + '-' + (r.horaFin||'').substring(0,5);
            var fDateTime = '<strong style="font-size:13px;color:#1e293b;">'+r.fecha+'</strong><br><span style="font-size:11px;color:#64748b;">'+fHora+'</span>';

            var actionsBtn = [
                "<div class='rh-actions'>",
                    "<button class='rh-actions-btn' onclick='this.parentNode.classList.toggle(\"active\")'><i class='bx bx-dots-vertical-rounded'></i></button>",
                    "<div class='rh-actions-menu'>",
                        "<button class='rh-menu-item rh-action-detalle' data-id='"+r.id+"' data-res='"+escapeHtml(JSON.stringify(r).replace(/'/g, "&#39;"))+"'><i class='bx bx-detail'></i> Ver Detalles</button>",
                        "<button class='rh-menu-item' onclick='alert(\"En Construcción: Añadir Pago\")'><i class='bx bx-credit-card'></i> Añadir Pago</button>",
                        "<button class='rh-menu-item' onclick='alert(\"En Construcción: Reprogramar\")'><i class='bx bx-time'></i> Reprogramar</button>",
                        "<hr style='border:none;border-top:1px solid #f1f5f9;margin:4px 0;'>",
                        "<button class='rh-menu-item danger-action' onclick='alert(\"En Construcción: Cancelar Reserva\")'><i class='bx bx-x-circle'></i> Cancelar Reserva</button>",
                    "</div>",
                "</div>"
            ].join('');

            return [
                "<tr>",
                "  <td><strong style='color:#364152;'>#"+r.id+"</strong></td>",
                "  <td>"+fDateTime+"</td>",
                "  <td>"+escapeHtml(r.nombreCliente||'—')+"</td>",
                "  <td><span style='background:#f1f5f9;padding:4px 8px;border-radius:6px;font-size:12px;font-weight:600;color:#475569;'>"+escapeHtml(r.nombreCancha||'—')+"</span></td>",
                "  <td><span class='status-badge "+meta.badge+"'><span class='dot "+meta.dot+"'></span> "+escapeHtml(r.estadoReserva)+"</span></td>",
                "  <td style='text-align:right;font-weight:600;white-space:nowrap;'>S/ "+Number(r.montoTotal||0).toFixed(2)+"</td>",
                "  <td style='text-align:right;color:#059669;white-space:nowrap;'>S/ "+Number(r.montoPagado||0).toFixed(2)+"</td>",
                "  <td style='text-align:right;color:"+(r.saldoPendiente>0 ? '#dc2626' : '#64748b')+";white-space:nowrap;'>S/ "+Number(r.saldoPendiente||0).toFixed(2)+"</td>",
                "  <td style='text-align:center;'>"+actionsBtn+"</td>",
                "</tr>"
            ].join('');
        }).join('');

        // Action Menu outside wrapper closer
        var listBtns = tbody.querySelectorAll('.rh-action-detalle');
        listBtns.forEach(function(b) {
            b.addEventListener('click', function(e) {
                var strData = this.getAttribute('data-res');
                var decodeHTML = function(html) {
                    var txt = document.createElement("textarea");
                    txt.innerHTML = html;
                    return txt.value;
                };
                var rObj = JSON.parse(decodeHTML(strData));
                b.closest('.rh-actions').classList.remove('active');
                abrirPopoverReserva(rObj, b.closest('td'));
            });
        });

        document.getElementById('rh-count-label').textContent = 'Mostrando ' + items.length + ' resultados (Total: ' + data.totalElements + ')';
        document.getElementById('rh-pagination').style.display = 'flex';
        document.getElementById('rh-page-info').textContent = 'Página ' + (data.number + 1) + ' de ' + data.totalPages;

        document.getElementById('rh-page-first').disabled = data.first;
        document.getElementById('rh-page-prev').disabled  = data.first;
        document.getElementById('rh-page-next').disabled  = data.last;
        document.getElementById('rh-page-last').disabled  = data.last;

        rhTotalPages = data.totalPages;
    }

    document.getElementById('rh-page-prev').addEventListener('click', function(){ if (rhCurrentPage>0) fetchHistoricalReservas(rhCurrentPage-1); });
    document.getElementById('rh-page-next').addEventListener('click', function(){ if (rhCurrentPage<rhTotalPages-1) fetchHistoricalReservas(rhCurrentPage+1); });
    document.getElementById('rh-page-first').addEventListener('click', function(){ fetchHistoricalReservas(0); });
    document.getElementById('rh-page-last').addEventListener('click', function(){ fetchHistoricalReservas(rhTotalPages-1); });

    document.getElementById('rh-btn-buscar').addEventListener('click', function() { fetchHistoricalReservas(0); });

    document.getElementById('rh-btn-limpiar').addEventListener('click', function() {
        document.getElementById('rh-desde').value = '';
        document.getElementById('rh-hasta').value = '';
        msOptions.forEach(function(o){ o.checked = false; });
        updateMsTrigger();
        rhClienteIn.value = '';
        rhClienteId.value = '';
        rhCanchaSel.value = '';
        fetchHistoricalReservas(0);
    });

    /* ---- Init ---- */
    cargarSemana();
    poblarCanchasSelect();
    fetchHistoricalReservas(0);

}

export function unmount() {
    // Cleanup event listeners if needed
}
