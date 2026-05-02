export function createPopoversHandler(ctx) {
    const { api, modals, cargarSemana, addGlobalListener } = ctx;
    let _activePop = null;

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
        if (est === 'PROGRAMADO' || est === 'EN_PROCESO') {
            actionBtns = `<button class='mp-btn-cancel' id='pop-cancel-btn' style='background:#fff1f2;color:#dc2626;border:1px solid #fecaca;flex:1;justify-content:center;'><i class='bx bx-x-circle'></i> Cancelar</button>`
                       + `<button class='mp-btn-manage' id='pop-close-final-btn' style='flex:1;justify-content:center;'><i class='bx bx-x'></i> Cerrar</button>`;
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
                let alertEvento = '';
                
                if (r.eventoId) {
                    alertEvento = `<div style='background:#fefce8;color:#a16207;padding:8px 12px;margin-bottom:12px;border-radius:6px;font-size:11px;border:1px solid #fef08a;display:flex;gap:6px;align-items:flex-start;'><i class='bx bx-info-circle' style='font-size:14px;margin-top:1px;'></i><div>Esta reserva pertenece a un evento global. Los pagos y ediciones se gestionan desde el módulo de Eventos.</div></div>`;
                } else {
                    if (est === 'PENDIENTE' && saldo > 0) rowBtns1.push(`<button class='mp-btn-manage' id='rpop-pago-btn' style='background:#059669;color:#fff;border:none;flex:2;justify-content:center;'><i class='bx bx-credit-card'></i> Añadir Pago</button>`);
                    if (est === 'PENDIENTE' || est === 'PAGADA')  rowBtns1.push(`<button class='mp-btn-manage' id='rpop-reprog-btn' style='background:#0284c7;color:#fff;border:none;flex:1;justify-content:center;'><i class='bx bx-calendar-edit'></i> Reprogramar</button>`);
                    if (est === 'PAGADA'    || est === 'COMPLETADO') rowBtns1.push(`<button class='mp-btn-manage' id='rpop-imprimir-btn' style='background:#f8fafc;color:#475569;border:1px solid #e2e8f0;flex:1;justify-content:center;font-size:11px;'><i class='bx bx-printer'></i> Imprimir</button>`);
                    if (est === 'PENDIENTE' || est === 'PAGADA')  rowBtns2.push(`<button class='mp-btn-cancel' id='rpop-cancelar-btn' style='background:#fff1f2;color:#dc2626;border:1px solid #fecaca;width:100%;justify-content:center;'><i class='bx bx-x-circle'></i> Cancelar Reserva</button>`);
                }

                pop.innerHTML = [
                    `<div class='mp-header'>`,
                        `<span class='mp-header-icon' style='background:${eBg};color:${eColor};'>📅</span>`,
                        `<div style='flex:1;min-width:0;'><span class='mp-header-title'>Reserva #${r.id}</span><span style='display:block;font-size:11px;color:#64748b;margin-top:2px;'>${r.nombreCliente||'—'}</span></div>`,
                        `<div style='display:flex;flex-direction:column;align-items:flex-end;gap:4px;'><button class='mp-header-close' id='rpop-close-btn'>✕</button><span class='legend-item badge-blue'>${eLabel}</span></div>`,
                    `</div>`,
                    `<div class='mp-body'>`,
                        alertEvento,
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
                if (detBtn) {
                    detBtn.addEventListener('click', () => { 
                        cerrarPopover(); 
                        if (r.eventoId && modals.abrirDetalleEvento) {
                            modals.abrirDetalleEvento(r.eventoId);
                        } else {
                            modals.abrirDetalleReserva(r.id);
                        }
                    });
                }
                
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

    return {
        abrirPopoverMant,
        abrirPopoverReserva,
        cerrarPopover
    };
}
