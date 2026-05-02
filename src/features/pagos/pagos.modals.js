export function initModals({ api, addGlobalListener, onPagoAnulado }) {
    let _pagoActivo = null;

    // Helpers utilitarios repetidos para mantener módulos desacoplados
    const fmtMoney = n => 'S/ ' + Number(n || 0).toFixed(2);
    const fmtFecha = isoStr => {
        if (!isoStr) return '—';
        const d = new Date(isoStr.includes('T') ? isoStr : isoStr + 'T00:00:00');
        const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
        let base = d.getDate() + ' ' + MESES[d.getMonth()] + ' ' + d.getFullYear();
        if (isoStr.includes('T')) base += ', ' + String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0');
        return base;
    };
    const badgeHTML = (text, bg, color) => `<span style='background:${bg};color:${color};padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;white-space:nowrap;'>${text}</span>`;
    const TIPO_STYLE = { INGRESO: { bg:'#dcfce7', color:'#15803d', label:'INGRESO' }, SALIDA: { bg:'#fee2e2', color:'#dc2626', label:'SALIDA' } };
    const ESTADO_STYLE = { COMPLETADO: { bg:'#dcfce7', color:'#15803d', label:'Completado' }, ANULADO: { bg:'#fee2e2', color:'#dc2626', label:'Anulado' } };
    const METODO_ICON = { EFECTIVO:'💵', YAPE:'📱', PLIN:'📱', TRANSFERENCIA:'🏦', TARJETA:'💳' };

    function mostrarToast(msg, esError) {
        const t = document.getElementById('pagos-toast');
        const m = document.getElementById('pagos-toast-msg');
        const ico = t.querySelector('i');
        if (!t || !m) return;
        m.textContent = msg;
        t.style.background = esError ? '#7f1d1d' : '';
        if (ico) ico.className = esError ? 'bx bx-error-circle' : 'bx bx-check-circle';
        t.style.display = 'flex';
        setTimeout(() => t.style.display = 'none', 3500);
    }

    // === DETALLE ===
    function abrirDetalle(id) {
        document.getElementById('dp-title').textContent = 'Detalle de Transacción #' + id;
        document.getElementById('dp-loading').style.display = 'block';
        document.getElementById('dp-content').style.display = 'none';
        document.getElementById('modal-detalle-pago').style.display = 'flex';

        api.get(`/pagos/${id}`)
            .then(p => {
                _pagoActivo = p;
                rellenarDetalle(p);
            }).catch(console.error);
    }

    function rellenarDetalle(p) {
        const estado = ESTADO_STYLE[p.estado] || { bg:'#f1f5f9', color:'#64748b', label: p.estado || '—' };
        const anulado = p.estado === 'ANULADO';

        let mColor = '#0f172a'; let mPrefix = '';
        if (p.tipoTransaccion === 'INGRESO') { mColor = '#15803d'; mPrefix = '+ '; } 
        else if (p.tipoTransaccion === 'SALIDA') { mColor = '#dc2626'; mPrefix = '- '; }
        if (anulado) mColor = '#94a3b8';

        document.getElementById('dp-monto').textContent = mPrefix + fmtMoney(p.monto);
        document.getElementById('dp-monto').style.color = mColor;
        document.getElementById('dp-monto').style.textDecoration = anulado ? 'line-through' : 'none';
        document.getElementById('dp-estado-badge').innerHTML = badgeHTML(estado.label, estado.bg, estado.color);
        document.getElementById('dp-fecha').textContent = fmtFecha(p.fecha);
        
        const tipo = TIPO_STYLE[p.tipoTransaccion] || { bg:'#f1f5f9', color:'#64748b', label: p.tipoTransaccion || '—' };
        document.getElementById('dp-tipo').innerHTML = badgeHTML(tipo.label, tipo.bg, tipo.color);
        document.getElementById('dp-metodo').textContent = (METODO_ICON[p.metodoPago] || '💳') + ' ' + (p.metodoPago || '—');
        
        const origenHtml = p.reservaId ? `<a href='#' class='pagos-origen-link' data-reserva-id='${p.reservaId}' style='color:#3b82f6;font-weight:700;font-size:12px;text-decoration:none;'>📋 Reserva #${p.reservaId}</a>` : '—';
        document.getElementById('dp-origen').innerHTML = origenHtml;

        document.getElementById('dp-cliente').innerHTML = p.clienteNombre ? '👤 ' + p.clienteNombre : '—';
        document.getElementById('dp-cliente-wrap').style.display = p.clienteNombre ? '' : 'none';
        
        const notas = [p.nota, p.referencia ? 'Ref: '+p.referencia : null].filter(Boolean);
        document.getElementById('dp-nota').textContent = notas.join(' | ') || '—';
        document.getElementById('dp-nota-wrap').style.display = notas.length ? '' : 'none';

        document.getElementById('dp-anulacion-section').style.display = anulado ? 'block' : 'none';
        if (anulado) {
            document.getElementById('dp-anulado-por').textContent = p.anuladoPor || p.usuarioAnulacion || '—';
            document.getElementById('dp-fecha-anulacion').textContent = fmtFecha(p.fechaAnulacion || p.updatedAt);
            document.getElementById('dp-motivo-anulacion').textContent = p.motivoAnulacion || p.motivo || '—';
        }

        const btnAnu = document.getElementById('btn-dp-anular');
        btnAnu.style.display = anulado ? 'none' : 'flex';
        btnAnu.onclick = () => { cerrarDetalle(); abrirModalAnular(p); };
        document.getElementById('btn-dp-imprimir').onclick = () => imprimirRecibo(p);

        document.getElementById('dp-loading').style.display = 'none';
        document.getElementById('dp-content').style.display = 'block';
    }

    function cerrarDetalle() { document.getElementById('modal-detalle-pago').style.display = 'none'; }
    
    // === ANULAR ===
    function abrirModalAnular(p) {
        _pagoActivo = p;
        document.getElementById('anular-titulo').textContent = `¿Anular este pago de ${fmtMoney(p.monto)}?`;
        document.getElementById('anular-subtitle').textContent = `Pago #${p.id}` + (p.reservaId ? ` · Reserva #${p.reservaId}` : '');
        document.getElementById('anular-motivo').value = '';
        document.getElementById('anular-error-box').style.display = 'none';
        document.getElementById('btn-anular-submit').disabled = false;
        document.getElementById('modal-anular-pago').style.display = 'flex';
    }
    function cerrarModalAnular() { document.getElementById('modal-anular-pago').style.display = 'none'; }

    document.getElementById('btn-anular-submit').onclick = function() {
        const motivo = (document.getElementById('anular-motivo').value || '').trim();
        const errEl  = document.getElementById('anular-err-motivo');
        if (!motivo) {
            errEl.textContent = 'El motivo es obligatorio.';
            return;
        }
        errEl.textContent = '';

        this.disabled = true;
        document.getElementById('anular-submit-text').style.display = 'none';
        document.getElementById('anular-submit-loader').style.display = 'flex';

        api.patch(`/pagos/${_pagoActivo.id}/anular`, { motivo })
        .then(() => {
            cerrarModalAnular();
            onPagoAnulado(_pagoActivo.id, motivo);
            mostrarToast(`¡Pago #${_pagoActivo.id} anulado correctamente!`);
        })
        .catch(err => {
            this.disabled = false;
            document.getElementById('anular-error-msg').textContent = err.message;
            document.getElementById('anular-error-box').style.display = 'flex';
        })
        .finally(() => {
            document.getElementById('anular-submit-text').style.display = 'flex';
            document.getElementById('anular-submit-loader').style.display = 'none';
        });
    };

    // === IMPRIMIR RECIBO ===
    function imprimirRecibo(p, sucursal) {
        const empresa = sucursal?.nombre || 'PitchPro';
        const html = `
            <!DOCTYPE html><html lang="es"><head>
            <style>
              body { font-family: "Helvetica Neue", Arial, sans-serif; padding:40px; max-width:480px; margin:0 auto; }
              .header { text-align:center; padding-bottom:24px; border-bottom:2px solid #e2e8f0; margin-bottom:24px; }
              .logo { font-size:22px; font-weight:900; color:#1e3a5f; }
              .logo span { color:#3b82f6; }
              .monto-box { text-align:center; padding:20px; background:#f8fafc; border-radius:12px; margin-bottom:24px; }
              .monto-value { font-size:36px; font-weight:900; margin:6px 0; }
              table { width:100%; border-collapse:collapse; }
              td { padding:10px 4px; font-size:13px; border-bottom:1px solid #f1f5f9; }
              td:first-child { color:#64748b; font-weight:500; }
              td:last-child { color:#0f172a; font-weight:700; text-align:right;}
            </style></head><body>
            <div class="header"><div class="logo">Pitch<span>Pro</span></div><div style="font-size:13px;color:#64748b;">${empresa}</div></div>
            <div class="monto-box"><p style="font-size:11px;color:#94a3b8;">TOTAL DEL PAGO</p><h1 class="monto-value">${fmtMoney(p.monto)}</h1></div>
            <table>
              <tr><td>N° de Pago</td><td>#${p.id}</td></tr>
              <tr><td>Fecha</td><td>${fmtFecha(p.fecha)}</td></tr>
              <tr><td>Método</td><td>${p.metodoPago || '—'}</td></tr>
              <tr><td>Tipo</td><td>${p.tipoTransaccion || '—'}</td></tr>
            </table>
            <div style="margin-top:30px;text-align:center;font-size:11px;color:#94a3b8;">Generado el ${fmtFecha(new Date().toISOString())}</div>
            </body></html>
        `;
        const win = window.open('', '_blank', 'width=600,height=700');
        win.document.write(html);
        win.document.close();
        setTimeout(() => win.print(), 400);
    }

    // Global Listeners para cerrar modales
    addGlobalListener(document.getElementById('btn-dp-close'), 'click', cerrarDetalle);
    addGlobalListener(document.getElementById('btn-dp-cerrar'), 'click', cerrarDetalle);
    addGlobalListener(document.getElementById('modal-detalle-pago'), 'click', e => { if (e.target.id === 'modal-detalle-pago') cerrarDetalle(); });
    
    addGlobalListener(document.getElementById('btn-anular-close'), 'click', cerrarModalAnular);
    addGlobalListener(document.getElementById('btn-anular-cancel'), 'click', cerrarModalAnular);
    addGlobalListener(document.getElementById('modal-anular-pago'), 'click', e => { if (e.target.id === 'modal-anular-pago') cerrarModalAnular(); });

    addGlobalListener(document, 'keydown', e => {
        if (e.key !== 'Escape') return;
        if (document.getElementById('modal-anular-pago').style.display !== 'none') cerrarModalAnular();
        else if (document.getElementById('modal-detalle-pago').style.display !== 'none') cerrarDetalle();
    });

    // Navegación a reservas desde el origen
    addGlobalListener(document, 'click', e => {
        const target = e.target.closest('.pagos-origen-link');
        if (target) { e.preventDefault(); sessionStorage.setItem('pitchpro_open_reserva_id', target.dataset.reservaId); cerrarDetalle(); window.location.hash = '#/dashboard/reservas'; }
    });

    return { abrirDetalle, abrirModalAnular, imprimirRecibo };
}