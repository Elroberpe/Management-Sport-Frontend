// src/features/reservas/reservas.calendario.js
// Lógica del calendario semanal:
//   - Construcción de ejes de tiempo y headers de días
//   - Render de cards de reservas y mantenimientos
//   - Popovers de detalle sobre cards
//   - Stats de la semana (todas las canchas)
//   - Selector de cancha del calendario
//   - Filtro de estado visual (sin petición extra)
//   - Exportar CSV

import { DIAS_ES, MESES_ES, ESTADO_STYLE, getLunes, toISO, formatHora, escapeHtml } from './reservas.calendario.utils.js';
import { renderBottomStats } from './reservas.calendario.stats.js';
import { createPopoversHandler } from './reservas.calendario.popovers.js';

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

    const popovers = createPopoversHandler({ api, modals, cargarSemana, addGlobalListener });

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
            nowIndicator: true,
            dayHeaderContent: function(arg) {
                const DIAS = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
                const dayName = DIAS[arg.date.getDay()].toUpperCase();
                const dayNum = arg.date.getDate();
                const isToday = arg.isToday;
                const textColor = isToday ? '#16a34a' : 'var(--text-main)';
                const subColor = isToday ? '#16a34a' : '#94a3b8';
                return { html: `<div style="display:flex; flex-direction:column; gap:4px; align-items:center;">
                    <span style="font-size:10px; font-weight:700; color:${subColor}; letter-spacing:1px;">${dayName}</span>
                    <strong style="font-size:18px; color:${textColor};">${dayNum}</strong>
                </div>` };
            },
            slotLabelFormat: {
                hour: 'numeric',
                minute: '2-digit',
                meridiem: 'short'
            },
            eventContent: function(arg) {
                if (arg.event.extendedProps.type === 'RESERVA') {
                    const r = arg.event.extendedProps.raw;
                    const s = arg.event.start;
                    const e = arg.event.end;
                    const mins = e && s ? (e - s) / 60000 : 60;

                    if (r.eventoId) {
                        // Es una reserva de Evento Mayor
                        let bgColor     = '#faf5ff';
                        let borderColor = '#9333ea';
                        let textColor   = '#6b21a8';
                        let badgeBg     = '#f3e8ff';
                        
                        const inner = [
                            `<div class="cal-card" style="position:relative; left:0; right:0; height:100%; border-radius:10px; padding:7px 10px; display:flex; flex-direction:column; overflow:hidden; box-sizing:border-box; background:${bgColor}; color:${textColor}; border-left: 4px solid ${borderColor};">`,
                            `<span class='cc-title' style='font-size:11px;font-weight:800;display:flex;align-items:center;gap:4px;'><span>🏆</span><span>Evento</span></span>`,
                            mins >= 40 ? `<span style='font-size:9px;font-weight:700;background:${badgeBg};color:${textColor};padding:1px 6px;border-radius:6px;display:inline-block;margin-top:2px;'>Bloqueado por Evento</span>` : '',
                            mins >= 60 ? `<span class='cc-sub' style='font-size:11px;font-weight:700;margin-top:4px;'>${escapeHtml(r.nombreCliente || 'Sin organizador')}</span>` : '',
                            `</div>`
                        ].join('');
                        return { html: inner };
                    }

                    const meta = ESTADO_STYLE[r.estadoReserva] || ESTADO_STYLE['PENDIENTE'];
                    let subText = '';
                    
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
                    popovers.abrirPopoverReserva(info.event.extendedProps.raw, info.el);
                } else {
                    popovers.abrirPopoverMant(info.event.extendedProps.raw, info.el);
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
            if (filtroEstado && r.estadoReserva !== filtroEstado) return;

            if (r.reservasAsociadas && r.reservasAsociadas.length > 0) {
                r.reservasAsociadas.forEach((sub, idx) => {
                    if (canchaCalId && String(sub.canchaId) !== String(canchaCalId)) return;
                    
                    const rawHijo = {
                        ...r,
                        canchaId: sub.canchaId,
                        nombreCancha: sub.nombreCancha || r.nombreCancha,
                        fecha: sub.fecha,
                        horaInicio: sub.horaInicio,
                        horaFin: sub.horaFin,
                        horario: sub.horario
                    };

                    events.push({
                        id: 'R_' + r.id + '_sub_' + idx,
                        start: `${sub.fecha}T${sub.horaInicio}`,
                        end: `${sub.fecha}T${sub.horaFin}`,
                        extendedProps: { type: 'RESERVA', raw: rawHijo }
                    });
                });
            } else {
                if (canchaCalId && String(r.canchaId) !== String(canchaCalId)) return;
                
                events.push({
                    id: 'R_' + r.id,
                    start: `${r.fecha}T${r.horaInicio}`,
                    end: `${r.fecha}T${r.horaFin}`,
                    extendedProps: { type: 'RESERVA', raw: r }
                });
            }
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
            renderBottomStats(reservasSemana);

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
        renderBottomStats(reservasSemana);
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
                        renderBottomStats(reservasSemana);
                    }
            }).catch(() => {
                calCanchaSel.innerHTML = '<option value="">— Sin canchas —</option>';
            });
    }

    calCanchaSel.addEventListener('change', () => {
        canchaCalId = calCanchaSel.value ? parseInt(calCanchaSel.value) : null;
        actualizarEventosFC();
        renderBottomStats(reservasSemana);
    });

    /* ──────────── Inicio ──────────── */
    poblarSelectorCanchasCalendario();

    /* ──────────── API PÚBLICA ──────────── */
    return { cargarSemana };
}
