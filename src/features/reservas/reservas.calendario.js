// src/features/reservas/reservas.calendario.js
// Lógica del calendario semanal:
//   - Construcción de ejes de tiempo y headers de días
//   - Render de cards de reservas y mantenimientos
//   - Popovers de detalle sobre cards
//   - Stats de la semana (todas las canchas)
//   - Selector de cancha del calendario
//   - Filtro de estado visual (sin petición extra)
//   - Exportar CSV

/* ──────────── CONSTANTES GLOBALES ──────────── */
const HORA_INICIO = 7;
const HORA_FIN    = 24;
const TOTAL_HORAS = HORA_FIN - HORA_INICIO;  // 17

const DIAS_ES   = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
const MESES_ES  = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

const ESTADO_STYLE = {
    PAGADA:      { cls: 'c-blue',        label: 'Pagada',      dot: '#3b82f6' },
    PENDIENTE:   { cls: 'c-yellow',      label: 'Pendiente',   dot: '#eab308' },
    COMPLETADO:  { cls: 'c-green-light', label: 'Completada',  dot: '#10b981' },
    CANCELADO:   { cls: 'c-gray',        label: 'Cancelada',   dot: '#ef4444' },
    REEMBOLSADO: { cls: 'c-gray-purple', label: 'Reembolsada', dot: '#8b5cf6' }
};

/* ──────────── UTILS DE FECHA Y DOM ──────────── */
function getLunes(offset) {
    const hoy  = new Date();
    const dia  = hoy.getDay();
    const diff = (dia === 0) ? -6 : 1 - dia;
    const l    = new Date(hoy);
    l.setDate(hoy.getDate() + diff + (offset * 7));
    l.setHours(0, 0, 0, 0);
    return l;
}

function toISO(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function formatHora(timeStr) {
    return timeStr ? timeStr.substring(0, 5) : '';
}

function posYPct(horaStr) {
    const parts = horaStr.split(':');
    const horas = parseInt(parts[0]) + parseInt(parts[1] || 0) / 60;
    return ((horas - HORA_INICIO) / TOTAL_HORAS) * 100;
}

function altPct(ini, fin) {
    return Math.max(posYPct(fin) - posYPct(ini), 5);
}

function escapeHtml(s) {
    return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

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
    const { api, sucursalFiltro, addGlobalListener, modals } = ctx;

    /* ──────────── Estado ──────────── */
    let semanaOffset         = 0;
    let reservasSemana       = [];
    let mantenimientosSemana = [];
    let filtroEstado         = '';
    let canchaCalId          = null;
    let _activePop           = null;

    /* ──────────── DOM refs ──────────── */
    const loading      = document.getElementById('cal-loading');
    const errBox       = document.getElementById('cal-error');
    const errMsg       = document.getElementById('cal-error-msg');
    const panel        = document.getElementById('cal-panel');
    const bottom       = document.getElementById('cal-bottom');
    const semLabel     = document.getElementById('cal-semana-label');
    const filterEl     = document.getElementById('cal-filter-estado');
    const calCanchaSel = document.getElementById('cal-cancha-sel');

    /* ──────────── Ejes de tiempo ──────────── */
    /* ──────────── Inicialización de FullCalendar ──────────── */
    let calendar = null;
    function initFC() {
        const calendarEl = document.getElementById('fullcalendar-container');
        if (!calendarEl) return;
        
        calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'timeGridWeek',
            locale: 'es',
            firstDay: 1, // Lunes
            slotMinTime: '07:00:00',
            slotMaxTime: '24:00:00',
            allDaySlot: false,
            headerToolbar: false,
            height: 'auto',
            slotEventOverlap: false,
            eventContent: function(arg) {
                if (arg.event.extendedProps.type === 'RESERVA') {
                    const r = arg.event.extendedProps.raw;
                    const meta = ESTADO_STYLE[r.estadoReserva] || ESTADO_STYLE['PENDIENTE'];
                    let subText = '';
                    
                    const s = arg.event.start;
                    const e = arg.event.end;
                    const mins = e && s ? (e - s) / 60000 : 60;
                    
                    if (r.saldoPendiente > 0 && r.estadoReserva !== 'COMPLETADO' && mins >= 60) {
                        subText = `<span class='cc-sub' style='color:#b45309;font-weight:700;'>Debe: S/ ${Number(r.saldoPendiente).toFixed(2)}</span>`;
                    }
                    
                    const opacityStr = r.estadoReserva === 'COMPLETADO' ? 'opacity:0.6;' : '';
                    
                    const inner = `<div class="cal-card ${meta.cls}" style="position:relative; left:0; right:0; height:100%; border-left: 4px solid ${meta.dot}; border-radius:10px; padding:7px 10px; display:flex; flex-direction:column; overflow:hidden; box-sizing:border-box; ${opacityStr}">` +
                                  `<span class='cc-title' style='font-size:12px;'>${escapeHtml(r.nombreCliente || 'Sin cliente')}</span>${subText}</div>`;
                    return { html: inner };
                } else {
                    const m = arg.event.extendedProps.raw;
                    const est = m.estadoMantenimiento;
                    const esEnProceso = est === 'EN_PROCESO';
                    const esCompletado = est === 'COMPLETADO';

                    let bgColor     = '#fff7ed'; 
                    let borderColor = '#ea580c';
                    let textColor   = '#c2410c';
                    let subColor    = '#9a3412';
                    let badgeBg     = '#ffedd5';
                    let badgeLabel  = '🔧 Programado';

                    if (esEnProceso) {
                        bgColor     = '#fff1f2'; 
                        borderColor = '#e11d48';
                        textColor   = '#9f1239';
                        subColor    = '#be123c';
                        badgeBg     = '#ffe4e6';
                        badgeLabel  = '⚙️ En Proceso';
                    } else if (esCompletado) {
                        bgColor     = '#f0fdf4'; 
                        borderColor = '#16a34a';
                        textColor   = '#166534';
                        subColor    = '#15803d';
                        badgeBg     = '#dcfce7';
                        badgeLabel  = '✅ Completado';
                    }
                    
                    const s = arg.event.start;
                    const e = arg.event.end;
                    const mins = e && s ? (e - s) / 60000 : 60;
                    
                    // Fondo animado de franjas si es naranja (ya está en cal-card-mant class)
                    const extraClass = (!esEnProceso && !esCompletado) ? 'cal-card-mant' : '';
                    
                    const inner = [
                        `<div class="cal-card ${extraClass}" style="position:relative; left:0; right:0; height:100%; border-radius:10px; padding:7px 10px; display:flex; flex-direction:column; overflow:hidden; box-sizing:border-box; background:${bgColor}; color:${textColor}; border-left: 4px solid ${borderColor}; ${esCompletado ? 'opacity:0.7;' : ''}">`,
                        `<span class='cc-title' style='font-size:11px;font-weight:800;display:flex;align-items:center;gap:4px;'><span>🔧</span><span>Mantenimiento</span></span>`,
                        mins >= 40  ? `<span style='font-size:9px;font-weight:700;background:${badgeBg};color:${subColor};padding:1px 6px;border-radius:6px;display:inline-block;margin-top:2px;'>${badgeLabel}</span>` : '',
                        mins >= 60 && m.motivo ? `<span class='cc-sub' style='font-size:10px;color:${subColor};'>${escapeHtml(m.motivo)}</span>` : '',
                        mins >= 60 ? `<span class='cc-sub' style='font-size:10px;color:${textColor};font-weight:600;display:block;margin-top:2px;'>${formatHora(m.horaInicio?.split('T')[1] || m.horaInicio)} – ${formatHora(m.horaFin?.split('T')[1] || m.horaFin)}</span>` : '',
                        `</div>`
                    ].join('');
                    return { html: inner };
                }
            },
            eventClick: function(info) {
                info.jsEvent.preventDefault();
                info.jsEvent.stopPropagation();
                if (info.event.extendedProps.type === 'RESERVA') {
                    abrirPopoverReserva(info.event.extendedProps.raw, info.el);
                } else {
                    abrirPopoverMant(info.event.extendedProps.raw, info.el);
                }
            }
        });
        calendar.render();
    }
    
    function actualizarEventosFC() {
        if (!calendar) return;
        
        const events = [];
        reservasSemana.forEach(r => {
            if (r.estadoReserva === 'CANCELADO' || r.estadoReserva === 'REEMBOLSADO') return;
            if (canchaCalId && String(r.canchaId) !== String(canchaCalId)) return;
            if (filtroEstado && r.estadoReserva !== filtroEstado) return;

            events.push({
                id: 'R_' + r.id,
                start: `${r.fecha}T${r.horaInicio}`,
                end: `${r.fecha}T${r.horaFin}`,
                extendedProps: { type: 'RESERVA', raw: r }
            });
        });

        mantenimientosSemana.forEach(m => {
            if (canchaCalId && String(m.canchaId) !== String(canchaCalId)) return;
            const est = m.estadoMantenimiento;
            if (est === 'PROGRAMADO' || est === 'EN_PROCESO' || est === 'COMPLETADO') {
                events.push({
                    id: 'M_' + m.id,
                    start: m.horaInicio,
                    end: m.horaFin,
                    extendedProps: { type: 'MANTENIMIENTO', raw: m }
                });
            }
        });
        
        calendar.removeAllEvents();
        calendar.addEventSource(events);
    }
    
    function updateHeaderLabel(lunes) {
        const fin = new Date(lunes);
        fin.setDate(lunes.getDate() + 6);
        semLabel.textContent = `${lunes.getDate()} ${MESES_ES[lunes.getMonth()].substring(0, 3)} - ${fin.getDate()} ${MESES_ES[fin.getMonth()].substring(0, 3)}, ${fin.getFullYear()}`;
    }

    /* ──────────── Stats (todas las canchas) ──────────── */
    function renderBottomStats() {
        // Las stats cuentan TODAS las canchas de la semana, sin importar
        // cuál esté seleccionada en el selector del calendario.
        const reservas = reservasSemana.filter(r =>
            r.estadoReserva !== 'CANCELADO' && r.estadoReserva !== 'REEMBOLSADO'
        );

        const completadas = reservas.filter(r => r.estadoReserva === 'COMPLETADO').length;

        document.getElementById('cal-stat-total').textContent = completadas;
        document.getElementById('cal-stat-bar').style.width = `${Math.min((completadas / Math.max(reservas.length, 1)) * 100, 100)}%`;

        const subEl = document.getElementById('cal-stat-sub');
        if (subEl) subEl.textContent = `de ${reservas.length} en total (${reservas.length ? Math.round((completadas/reservas.length)*100) : 0}%)`;

        // Conteo por estado — todas las canchas
        const counts = {};
        reservasSemana.forEach(r => {
            counts[r.estadoReserva] = (counts[r.estadoReserva] || 0) + 1;
        });

        const listEl = document.getElementById('cal-estado-list');
        listEl.innerHTML = '';

        Object.keys(ESTADO_STYLE).forEach(est => {
            const meta  = ESTADO_STYLE[est];
            const count = counts[est] || 0;
            const item  = document.createElement('div');
            item.className = 'cbc-item';
            item.innerHTML = `<strong style='display:flex;align-items:center;gap:6px;'><span style='width:8px;height:8px;border-radius:50%;background:${meta.dot};display:inline-block;'></span>${meta.label}</strong><span class='cbc-badge' style='background:#f1f5f9;color:#334155;'>${count}</span>`;
            listEl.appendChild(item);
        });
    }

    /* ──────────── Cargar semana completa ──────────── */
    function cargarSemana() {
        const lunes = getLunes(semanaOffset);
        updateHeaderLabel(lunes);
        
        if (!calendar) {
            initFC();
        }
        
        if (calendar) {
            calendar.gotoDate(lunes);
        }

        loading.style.display = 'flex';
        errBox.style.display  = 'none';
        panel.style.display   = 'none';
        bottom.style.display  = 'none';

        const domMs = new Date(lunes);
        domMs.setDate(lunes.getDate() + 6);
        
        const fDesde = toISO(lunes);
        const fHasta = toISO(domMs);

        let endpointRes  = `/reservas?fechaDesde=${fDesde}&fechaHasta=${fHasta}&size=500`;
        if (sucursalFiltro) endpointRes += `&sucursalId=${sucursalFiltro}`;

        let endpointMant = `/mantenimientos?fechaDesde=${fDesde}&fechaHasta=${fHasta}&estadoMantenimiento=PROGRAMADO&estadoMantenimiento=EN_PROCESO&estadoMantenimiento=COMPLETADO&size=100`;
        if (sucursalFiltro) endpointMant += `&sucursalId=${sucursalFiltro}`;

        Promise.all([
            api.get(endpointRes).catch(() => ({ content: [] })),
            api.get(endpointMant).catch(() => ({ content: [] }))
        ]).then(resultados => {
            const allRes  = Array.isArray(resultados[0]) ? resultados[0] : (resultados[0].content || []);
            const allMant = Array.isArray(resultados[1]) ? resultados[1] : (resultados[1].content || []);

            reservasSemana       = allRes;
            mantenimientosSemana = allMant.filter(m => m.estadoMantenimiento === 'PROGRAMADO' || m.estadoMantenimiento === 'EN_PROCESO' || m.estadoMantenimiento === 'COMPLETADO');

            actualizarEventosFC();
            renderBottomStats();

            loading.style.display = 'none';
            panel.style.display   = '';
            bottom.style.display  = '';
            if (calendar) calendar.render(); // Ensure it resizes correctly when displayed
        }).catch(err => {
            loading.style.display = 'none';
            errMsg.textContent    = `Error al cargar calendario: ${err.message}`;
            errBox.style.display  = 'flex';
        });
    }

    /* ──────────── Navegación ──────────── */
    document.getElementById('cal-prev').addEventListener('click', () => { semanaOffset--; cargarSemana(); });
    document.getElementById('cal-next').addEventListener('click', () => { semanaOffset++; cargarSemana(); });
    document.getElementById('cal-hoy').addEventListener('click',  () => { semanaOffset = 0; cargarSemana(); });
    document.getElementById('cal-btn-hoy-2').addEventListener('click', () => { semanaOffset = 0; cargarSemana(); });
    document.getElementById('cal-retry').addEventListener('click', cargarSemana);

    filterEl.addEventListener('change', () => {
        filtroEstado = filterEl.value;
        actualizarEventosFC();
        renderBottomStats();
    });

    /* ──────────── Exportar CSV ──────────── */
    document.getElementById('cal-btn-export').addEventListener('click', () => {
        const rows = [['ID','Cancha','Cliente','Fecha','Inicio','Fin','Estado','Monto','Saldo']];
        reservasSemana.forEach(r => {
            rows.push([r.id, r.nombreCancha, r.nombreCliente, r.fecha, formatHora(r.horaInicio), formatHora(r.horaFin), r.estadoReserva, r.montoTotal, r.saldoPendiente]);
        });
        const csv  = rows.map(r => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href = url;
        a.download = 'reservas.csv';
        a.click();
        URL.revokeObjectURL(url);
    });

    /* ──────────── POPOVER UTILS ──────────── */
    function cerrarPopover() {
        if (_activePop && _activePop.parentNode) _activePop.parentNode.removeChild(_activePop);
        _activePop = null;
    }

    function _posicionarPopover(pop, anchorEl) {
        const rect = anchorEl.getBoundingClientRect();
        const pw   = pop.offsetWidth  || 300;
        const ph   = pop.offsetHeight || 360;
        let left   = rect.right + 8;
        let top    = rect.top;
        
        if (left + pw > window.innerWidth)      left = rect.left - pw - 8;
        if (left < 8)                           left = 8;
        if (top + ph > window.innerHeight - 8)  top = window.innerHeight - ph - 8;
        if (top < 8)                            top = 8;
        
        pop.style.left = `${left}px`;
        pop.style.top  = `${top}px`;
    }

    /* ──────────── POPOVER MANTENIMIENTO ──────────── */
    function abrirPopoverMant(m, anchorEl) {
        cerrarPopover();
        const TIPO_LABEL   = { PREVENTIVO:'Preventivo', CORRECTIVO:'Correctivo', URGENTE:'⚠ Urgente' };
        const ESTADO_LABEL = { PROGRAMADO:'Programado', EN_PROCESO:'En Proceso', COMPLETADO:'Completado', CANCELADO:'Cancelado' };
        const ESTADO_COLOR = { PROGRAMADO:'#2563eb', EN_PROCESO:'#d97706', COMPLETADO:'#059669', CANCELADO:'#64748b' };
        const ESTADO_BG    = { PROGRAMADO:'#dbeafe', EN_PROCESO:'#fef3c7', COMPLETADO:'#dcfce7', CANCELADO:'#f1f5f9' };
        const HEADER_BG    = { PROGRAMADO:'#1e3a5f', EN_PROCESO:'#78350f', COMPLETADO:'#064e3b', CANCELADO:'#1e293b' };
        
        const parseDT = (iso) => {
            if (!iso) return { hora:'—', fecha:'—' };
            const d = new Date(iso);
            const pad = (n) => n < 10 ? `0${n}` : n;
            const MES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
            return { hora: `${pad(d.getHours())}:${pad(d.getMinutes())}`, fecha: `${d.getDate()} ${MES[d.getMonth()]}` };
        };
        
        const ini = parseDT(m.horaInicio);
        const fin = parseDT(m.horaFin);
        const est = m.estadoMantenimiento;
        let durStr = '';
        
        if (m.horaInicio && m.horaFin) {
            const mins = (new Date(m.horaFin) - new Date(m.horaInicio)) / 60000;
            if (mins > 0) durStr = ` (${mins >= 60 ? Math.floor(mins/60) + 'h' + (mins%60 ? ` ${mins%60}m` : '') : `${mins}m`})`;
        }
        
        const eColor = ESTADO_COLOR[est] || '#64748b';
        const eBg = ESTADO_BG[est] || '#f1f5f9';
        const eLabel = ESTADO_LABEL[est] || est;
        const hBg = HEADER_BG[est] || '#1e293b';

        let actionBtns = '';
        if (est === 'PROGRAMADO') {
            actionBtns = `<button class='mp-btn-manage' id='pop-iniciar-btn' style='background:#059669;color:#fff;border:none;flex:1;justify-content:center;'><i class='bx bx-play-circle'></i> Iniciar</button>`
                       + `<button class='mp-btn-cancel' id='pop-cancel-btn' style='background:#fff1f2;color:#dc2626;border:1px solid #fecaca;flex:1;justify-content:center;'><i class='bx bx-x-circle'></i> Cancelar</button>`;
        } else if (est === 'EN_PROCESO') {
            actionBtns = `<button class='mp-btn-manage' id='pop-completar-btn' style='background:#2563eb;color:#fff;border:none;width:100%;justify-content:center;'><i class='bx bx-check-circle'></i> Marcar como Completado</button>`;
        } else {
            actionBtns = `<button class='mp-btn-manage' id='pop-close-final-btn' style='width:100%;justify-content:center;'><i class='bx bx-x'></i> Cerrar</button>`;
        }

        const pop = document.createElement('div');
        pop.className = 'mant-popover';
        pop.style.width = '290px';
        pop.innerHTML = [
            `<div class='mp-header'>`,
                `<span class='mp-header-icon' style='background:${eBg};color:${eColor};font-size:16px;'>🔧</span>`,
                `<div style='flex:1;min-width:0;'>`,
                    `<span class='mp-header-title'>Mantenimiento #${m.id}</span>`,
                    `<span style='display:block;font-size:11px;color:#64748b;margin-top:2px;'>${m.nombreCancha||'—'}</span>`,
                `</div>`,
                `<div style='display:flex;flex-direction:column;align-items:flex-end;gap:4px;'>`,
                    `<button class='mp-header-close' id='pop-close-btn'>✕</button>`,
                    `<span class='legend-item badge-blue'>${eLabel}</span>`,
                `</div>`,
            `</div>`,
            `<div class='mp-body'>`,
                `<div class='mp-row'><span>🏟️ Cancha</span><strong>${m.nombreCancha||'—'}</strong></div>`,
                `<div class='mp-row'><span>📅 Fecha</span><strong>${ini.fecha}</strong></div>`,
                `<div class='mp-row'><span>🕐 Horario</span><strong>${ini.hora} – ${fin.hora}${durStr}</strong></div>`,
                `<div class='mp-row'><span>🔩 Tipo</span><strong>${TIPO_LABEL[m.tipoMantenimiento]||m.tipoMantenimiento||'—'}</strong></div>`,
                `<div class='mp-row' style='align-items:flex-start;'><span>📝 Motivo</span><strong style='text-align:right;max-width:160px;word-break:break-word;'>${m.motivo||'—'}</strong></div>`,
            `</div>`,
            `<div id='pop-feedback' style='display:none;padding:8px 12px;margin:0 12px 4px;border-radius:8px;font-size:12px;font-weight:600;text-align:center;'></div>`,
            `<div class='mp-actions' style='gap:8px;display:flex;'>${actionBtns}</div>`
        ].join('');

        document.body.appendChild(pop);
        _activePop = pop;
        _posicionarPopover(pop, anchorEl);

        const feedback = pop.querySelector('#pop-feedback');
        const _setLoading = (btn, on) => { btn.disabled = on; btn.style.opacity = on ? '0.6' : '1'; };
        const _showFeedback = (msg, isErr) => {
            feedback.style.display    = 'block';
            feedback.style.background = isErr ? '#fff1f2' : '#dcfce7';
            feedback.style.color      = isErr ? '#dc2626' : '#059669';
            feedback.textContent      = msg;
        };

        const closeBtn = pop.querySelector('#pop-close-btn');
        if (closeBtn) closeBtn.addEventListener('click', cerrarPopover);
        
        const closeFinalBtn = pop.querySelector('#pop-close-final-btn');
        if (closeFinalBtn) closeFinalBtn.addEventListener('click', cerrarPopover);

        const iniciarBtn = pop.querySelector('#pop-iniciar-btn');
        if (iniciarBtn) iniciarBtn.addEventListener('click', function() {
            _setLoading(this, true);
            api.patch(`/mantenimientos/${m.id}/estado`, { estado: 'EN_PROCESO' })
                .then(() => { cerrarPopover(); modals.mostrarResToast('🟠 Mantenimiento iniciado — EN PROCESO'); cargarSemana(); })
                .catch(e => { _showFeedback(`Error: ${e.message}`, true); _setLoading(iniciarBtn, false); });
        });

        const completarBtn = pop.querySelector('#pop-completar-btn');
        if (completarBtn) completarBtn.addEventListener('click', function() {
            _setLoading(this, true);
            api.patch(`/mantenimientos/${m.id}/estado`, { estado: 'COMPLETADO' })
                .then(() => { cerrarPopover(); modals.mostrarResToast('✅ Mantenimiento completado.'); cargarSemana(); })
                .catch(e => { _showFeedback(`Error: ${e.message}`, true); _setLoading(completarBtn, false); });
        });

        const cancelMantBtn = pop.querySelector('#pop-cancel-btn');
        if (cancelMantBtn) cancelMantBtn.addEventListener('click', function() {
            if (cancelMantBtn.dataset.confirm !== '1') {
                cancelMantBtn.dataset.confirm = '1';
                cancelMantBtn.innerHTML = `<i class='bx bx-error'></i> ¿Confirmar?`;
                cancelMantBtn.style.background = '#dc2626';
                cancelMantBtn.style.color = '#fff';
                return;
            }
            _setLoading(this, true);
            api.patch(`/mantenimientos/${m.id}/cancelar`)
                .then(() => { cerrarPopover(); modals.mostrarResToast('Mantenimiento cancelado.'); cargarSemana(); })
                .catch(e => { _showFeedback(`Error: ${e.message}`, true); _setLoading(cancelMantBtn, false); });
        });
    }

    /* ──────────── POPOVER RESERVA ──────────── */
    function abrirPopoverReserva(rResumen, anchorEl) {
        cerrarPopover();
        const reservaId = rResumen.id || rResumen.reservaId;
        if (!reservaId) return;
        
        const ESTADO_COLOR = { PENDIENTE:'#d97706', PAGADA:'#059669', COMPLETADO:'#2563eb', CANCELADO:'#dc2626', REEMBOLSADO:'#7c3aed' };
        const ESTADO_BG    = { PENDIENTE:'#fef3c7', PAGADA:'#dcfce7', COMPLETADO:'#dbeafe', CANCELADO:'#fee2e2', REEMBOLSADO:'#ede9fe' };
        const ESTADO_LABEL = { PENDIENTE:'Pendiente', PAGADA:'Pagada', COMPLETADO:'Completada', CANCELADO:'Cancelada', REEMBOLSADO:'Reembolsada' };
        const HEADER_BG    = { PENDIENTE:'#78350f', PAGADA:'#064e3b', COMPLETADO:'#1e3a5f', CANCELADO:'#7f1d1d', REEMBOLSADO:'#4c1d95' };

        const pop = document.createElement('div');
        pop.className = 'mant-popover';
        pop.style.width = '300px';
        pop.innerHTML = `<div class='mp-header'><span class='mp-header-icon' style='background:#f1f5f9;color:#64748b;'>📅</span><span class='mp-header-title'>Cargando reserva...</span><button class='mp-header-close' id='rpop-close-btn'>✕</button></div>`
            + `<div class='mp-body' style='text-align:center;padding:24px;'><i class='bx bx-loader-alt bx-spin' style='font-size:28px;color:#3b82f6;'></i></div>`;

        document.body.appendChild(pop);
        _activePop = pop;
        _posicionarPopover(pop, anchorEl);
        pop.querySelector('#rpop-close-btn').addEventListener('click', cerrarPopover);

        api.get(`/reservas/${reservaId}`)
            .then(r => {
                if (_activePop !== pop) return;
                
                const est    = r.estadoReserva;
                const eColor = ESTADO_COLOR[est] || '#64748b';
                const eBg    = ESTADO_BG[est]    || '#f1f5f9';
                const eLabel = ESTADO_LABEL[est] || est;
                const hBg    = HEADER_BG[est]    || '#1e3a5f';
                const DIAS   = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
                const MESES_C= ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
                
                const fDate  = new Date(`${r.fecha}T00:00:00`);
                const fechaStr = `${DIAS[fDate.getDay()]} ${fDate.getDate()} ${MESES_C[fDate.getMonth()]}`;
                const horaStr  = `${(r.horaInicio||'').substring(0,5)} – ${(r.horaFin||'').substring(0,5)}`;
                
                let durStr = '';
                if (r.horaInicio && r.horaFin) {
                    const iS = r.horaInicio.split(':');
                    const fS = r.horaFin.split(':');
                    const mins = (parseInt(fS[0])*60+parseInt(fS[1])) - (parseInt(iS[0])*60+parseInt(iS[1]));
                    if (mins > 0) durStr = ` (${mins >= 60 ? Math.floor(mins/60) + 'h' + (mins%60 ? ` ${mins%60}m` : '') : `${mins}m`})`;
                }
                
                const saldo  = Number(r.saldoPendiente || 0);
                const pagado = Number(r.montoPagado    || 0);
                const total  = Number(r.montoTotal     || 0);

                const rowBtns1 = [];
                const rowBtns2 = [];
                
                if (est === 'PENDIENTE' && saldo > 0) rowBtns1.push(`<button class='mp-btn-manage' id='rpop-pago-btn' style='background:#059669;color:#fff;border:none;flex:2;justify-content:center;'><i class='bx bx-credit-card'></i> Añadir Pago</button>`);
                if (est === 'PENDIENTE' || est === 'PAGADA')  rowBtns1.push(`<button class='mp-btn-manage' id='rpop-reprog-btn' style='background:#0284c7;color:#fff;border:none;flex:1;justify-content:center;'><i class='bx bx-calendar-edit'></i> Reprogramar</button>`);
                if (est === 'PAGADA'    || est === 'COMPLETADO') rowBtns1.push(`<button class='mp-btn-manage' id='rpop-imprimir-btn' style='background:#f8fafc;color:#475569;border:1px solid #e2e8f0;flex:1;justify-content:center;font-size:11px;'><i class='bx bx-printer'></i> Imprimir</button>`);
                if (est === 'PENDIENTE' || est === 'PAGADA')  rowBtns2.push(`<button class='mp-btn-cancel' id='rpop-cancelar-btn' style='background:#fff1f2;color:#dc2626;border:1px solid #fecaca;width:100%;justify-content:center;'><i class='bx bx-x-circle'></i> Cancelar Reserva</button>`);

                pop.innerHTML = [
                    `<div class='mp-header'>`,
                        `<span class='mp-header-icon' style='background:${eBg};color:${eColor};'>📅</span>`,
                        `<div style='flex:1;min-width:0;'><span class='mp-header-title'>Reserva #${r.id}</span><span style='display:block;font-size:11px;color:#64748b;margin-top:2px;'>${r.nombreCliente||'—'}</span></div>`,
                        `<div style='display:flex;flex-direction:column;align-items:flex-end;gap:4px;'><button class='mp-header-close' id='rpop-close-btn'>✕</button><span class='legend-item badge-blue'>${eLabel}</span></div>`,
                    `</div>`,
                    `<div class='mp-body'>`,
                        `<div class='mp-row'><span>👤 Cliente</span><strong>${r.nombreCliente||'—'}</strong></div>`,
                        `<div class='mp-row'><span>🏟️ Cancha</span><strong>${r.nombreCancha||'—'}</strong></div>`,
                        `<div class='mp-row'><span>📅 Fecha</span><strong>${fechaStr}</strong></div>`,
                        `<div class='mp-row'><span>🕐 Horario</span><strong>${horaStr}${durStr}</strong></div>`,
                        `<div style='background:#f8fafc;border-radius:10px;border:1px solid #e2e8f0;margin-top:10px;overflow:hidden;'>`,
                            `<div style='display:flex;justify-content:space-between;padding:7px 12px;border-bottom:1px solid #f1f5f9;'><span style='font-size:11px;color:#94a3b8;'>Total</span><span style='font-weight:600;font-size:12px;color:#334155;'>S/ ${total.toFixed(2)}</span></div>`,
                            `<div style='display:flex;justify-content:space-between;padding:7px 12px;border-bottom:1px solid #f1f5f9;'><span style='font-size:11px;color:#94a3b8;'>Pagado</span><span style='font-weight:600;font-size:12px;color:#059669;'>S/ ${pagado.toFixed(2)}</span></div>`,
                            `<div style='display:flex;justify-content:space-between;padding:9px 12px;'><span style='font-size:12px;font-weight:700;color:#334155;'>Saldo</span><span style='font-weight:800;font-size:14px;color:${saldo > 0 ? '#dc2626' : '#059669'};'>S/ ${saldo.toFixed(2)}</span></div>`,
                        `</div>`,
                    `</div>`,
                    `<div class='mp-actions' style='flex-direction:column;gap:6px;'>`,
                        rowBtns1.length ? `<div style='display:flex;gap:6px;'>${rowBtns1.join('')}</div>` : '',
                        rowBtns2.length ? `<div style='display:flex;'>${rowBtns2.join('')}</div>` : '',
                        `<button class='mp-btn-outline' id='rpop-detalle-btn' style='width:100%;justify-content:center;font-size:11px;color:#475569;border:1px solid #e2e8f0;background:#f8fafc;border-radius:8px;padding:7px;cursor:pointer;display:flex;align-items:center;gap:5px;'><i class='bx bx-show'></i> Ver Detalle Completo</button>`,
                    `</div>`
                ].join('');

                pop.querySelector('#rpop-close-btn').addEventListener('click', cerrarPopover);
                
                const detBtn = pop.querySelector('#rpop-detalle-btn');
                if (detBtn) detBtn.addEventListener('click', () => { cerrarPopover(); modals.abrirDetalleReserva(r.id); });
                
                const pagoBtn = pop.querySelector('#rpop-pago-btn');
                if (pagoBtn) pagoBtn.addEventListener('click', () => { cerrarPopover(); modals.abrirModalPago(r.id, saldo); });
                
                const reprogBtn = pop.querySelector('#rpop-reprog-btn');
                if (reprogBtn) reprogBtn.addEventListener('click', () => { cerrarPopover(); modals.abrirModalReprogramar(r); });
                
                const cancBtn = pop.querySelector('#rpop-cancelar-btn');
                if (cancBtn) cancBtn.addEventListener('click', () => { cerrarPopover(); modals.abrirModalCancelar(r); });
                
                const printBtn = pop.querySelector('#rpop-imprimir-btn');
                if (printBtn) printBtn.addEventListener('click', () => { cerrarPopover(); modals.imprimirReciboReserva(r); });
            })
            .catch(() => {
                if (_activePop === pop) {
                    pop.innerHTML = `<div style='padding:20px;text-align:center;'><i class='bx bx-error-circle' style='font-size:28px;color:#ef4444;'></i><p style='color:#ef4444;font-size:12px;margin:8px 0;'>No se pudo cargar la reserva</p><button id='rpop-close-btn' style='padding:6px 16px;border-radius:8px;border:1px solid #e2e8f0;background:#fff;cursor:pointer;font-size:12px;'>Cerrar</button></div>`;
                    pop.querySelector('#rpop-close-btn').addEventListener('click', cerrarPopover);
                }
            });
    }

    /* ──────────── Cerrar popover al click fuera ──────────── */
    addGlobalListener(document, 'click', (e) => {
        if (_activePop && !_activePop.contains(e.target)) cerrarPopover();
    });

    /* ──────────── Selector de cancha del calendario ──────────── */
    function poblarSelectorCanchasCalendario() {
        const endpoint = `/canchas?size=100${sucursalFiltro ? `&sucursalId=${sucursalFiltro}` : ''}`;
        api.get(endpoint)
            .then(data => {
                const arr = Array.isArray(data) ? data : (data.content || []);
                calCanchaSel.innerHTML = '';
                
                arr.filter(c => c.estadoCancha !== 'INACTIVA').forEach(c => {
                    const opt = document.createElement('option');
                    opt.value       = c.canchaId !== undefined ? c.canchaId : c.id;
                    opt.textContent = c.nombre;
                    calCanchaSel.appendChild(opt);
                });
                
                    if (calCanchaSel.options.length > 0) {
                        calCanchaSel.selectedIndex = 0;
                        canchaCalId = parseInt(calCanchaSel.value);
                        actualizarEventosFC();
                        renderBottomStats();
                    }
            }).catch(() => {
                calCanchaSel.innerHTML = '<option value="">— Sin canchas —</option>';
            });
    }

    calCanchaSel.addEventListener('change', () => {
        canchaCalId = calCanchaSel.value ? parseInt(calCanchaSel.value) : null;
        actualizarEventosFC();
        renderBottomStats();
    });

    /* ──────────── Inicio ──────────── */
    poblarSelectorCanchasCalendario();

    /* ──────────── API PÚBLICA ──────────── */
    return { cargarSemana };
}
