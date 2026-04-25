export function initTabla({ api, Store, addCleanup, addGlobalListener, modals }) {
    const BASE_URL = 'http://localhost:8080/api/v1';
    let allPagos = [];
    let filtrados = [];
    let paginaActual = 0;
    const pageSize = 20;

    // DOM Refs
    const loadingEl = document.getElementById('pagos-loading');
    const errorEl = document.getElementById('pagos-error');
    const errorMsg = document.getElementById('pagos-error-msg');
    const tableWrap = document.getElementById('pagos-table-wrap');
    const tbody = document.getElementById('pagos-tbody');
    const emptyEl = document.getElementById('pagos-empty');
    const pgInfoEl = document.getElementById('pagos-page-info');
    const pgPagEl = document.getElementById('pagos-pagination');
    const pgInfoLbl = document.getElementById('pagos-page-info-label');
    const pgFirst = document.getElementById('pagos-page-first');
    const pgPrev = document.getElementById('pagos-page-prev');
    const pgNext = document.getElementById('pagos-page-next');
    const pgLast = document.getElementById('pagos-page-last');
    const periodoSel = document.getElementById('pagos-periodo');
    const metodoSel = document.getElementById('pagos-metodo');
    const searchEl = document.getElementById('pagos-search');
    const btnCsv = document.getElementById('pagos-btn-csv');
    const btnRetry = document.getElementById('pagos-retry');

    // Helpers compartidos
    const toISO = d => d.toISOString().split('T')[0];
    const getRango = dias => {
        const desde = new Date(); desde.setDate(desde.getDate() - parseInt(dias));
        return { desde: toISO(desde), hasta: toISO(new Date()) };
    };
    const fmtMoney = n => 'S/ ' + Number(n || 0).toFixed(2);
    const fmtFecha = isoStr => {
        if (!isoStr) return '—';
        const d = new Date(isoStr.includes('T') ? isoStr : isoStr + 'T00:00:00');
        const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
        let base = d.getDate() + ' ' + MESES[d.getMonth()] + ' ' + d.getFullYear();
        if (isoStr.includes('T')) {
            base += ', ' + String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0');
        }
        return base;
    };
    const badgeHTML = (text, bg, color) => `<span style='background:${bg};color:${color};padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;white-space:nowrap;'>${text}</span>`;

    const TIPO_STYLE = {
        INGRESO: { bg: '#dcfce7', color: '#15803d', icon: 'bx-chevrons-up', label: 'INGRESO' },
        SALIDA: { bg: '#fee2e2', color: '#dc2626', icon: 'bx-chevrons-down', label: 'SALIDA' },
    };
    const ESTADO_STYLE = {
        COMPLETADO: { bg: '#dcfce7', color: '#15803d', label: 'Completado' },
        ANULADO: { bg: '#fee2e2', color: '#dc2626', label: 'Anulado' },
    };
    const METODO_ICON = { EFECTIVO:'💵', YAPE:'📱', PLIN:'📱', TRANSFERENCIA:'🏦', TARJETA:'💳' };

    function cargarPagos() {
        const sucursal = Store.getSucursal();
        const rango = getRango(periodoSel.value || '30');
        const metodo = metodoSel.value;

        loadingEl.style.display = 'flex';
        errorEl.style.display = 'none';
        tableWrap.style.display = 'none';

        let url = `/pagos?desde=${rango.desde}&hasta=${rango.hasta}&size=500&sort=fecha,desc&page=0`;
        if (metodo) url += `&metodo=${metodo}`;
        if (sucursal && sucursal.sucursalId) url += `&sucursalId=${sucursal.sucursalId}`;

        // Asumiendo que api.get() construye con el BASE_URL y maneja la respuesta.
        api.get(url)
            .then(data => {
                allPagos = Array.isArray(data) ? data : (data.content || []);
                actualizarStats(allPagos);
                aplicarFiltros();
                loadingEl.style.display = 'none';
                tableWrap.style.display = '';
            })
            .catch(err => {
                loadingEl.style.display = 'none';
                errorMsg.textContent = err.message;
                errorEl.style.display = 'block';
            });
    }

    function actualizarStats(pagos) {
        const completados = pagos.filter(p => p.estado !== 'ANULADO');
        const anulados = pagos.filter(p => p.estado === 'ANULADO');
        const ingresos = completados.filter(p => p.tipoTransaccion === 'INGRESO');
        const salidas = completados.filter(p => p.tipoTransaccion === 'SALIDA');

        const totalIng = ingresos.reduce((s, p) => s + Number(p.monto || 0), 0);
        const totalAnu = anulados.reduce((s, p) => s + Number(p.monto || 0), 0);
        const totalSal = salidas.reduce((s, p) => s + Number(p.monto || 0), 0);

        document.getElementById('pagos-stat-ingresos').textContent = fmtMoney(totalIng);
        document.getElementById('pagos-stat-anulados').textContent = fmtMoney(totalAnu);
        document.getElementById('pagos-stat-count').textContent = pagos.length;
        document.getElementById('pagos-badge-count').textContent = pagos.length;
        document.getElementById('pagos-badge-ingresos').textContent = ingresos.length + ' pagos';
        document.getElementById('pagos-badge-anulados').textContent = anulados.length + ' anulados';
        document.getElementById('pagos-stat-sub').textContent = 'en los últimos ' + periodoSel.value + ' días';
        document.getElementById('pagos-bar-ingresos').style.width = '80%';
        document.getElementById('pagos-bar-anulados').style.width = totalIng > 0 ? Math.min(80, (totalAnu / totalIng) * 80) + '%' : '0%';
        document.getElementById('pagos-stat-salidas').textContent = fmtMoney(totalSal);
        document.getElementById('pagos-badge-salidas').textContent = salidas.length + ' salidas';
        document.getElementById('pagos-bar-salidas').style.width = totalIng > 0 ? Math.min(80, (totalSal / totalIng) * 80) + '%' : '0%';
    }

    function aplicarFiltros() {
        const busq = (searchEl.value || '').toLowerCase().trim();
        filtrados = allPagos.filter(p => {
            if (!busq) return true;
            return [p.id, p.reservaId, p.eventoId, p.referencia, p.nota].join(' ').toLowerCase().includes(busq);
        });
        paginaActual = 0;
        renderTabla();
    }

    function origenLink(p) {
        if (p.reservaId) return `<a href='#' class='pagos-origen-link' data-reserva-id='${p.reservaId}' style='color:#3b82f6;font-weight:700;font-size:12px;text-decoration:none;'>📋 Reserva #${p.reservaId}</a>`;
        if (p.eventoId) return `<a href='#' style='color:#8b5cf6;font-weight:700;font-size:12px;text-decoration:none;'>🎉 Evento #${p.eventoId}</a>`;
        return `<span style='color:#94a3b8;font-size:12px;'>—</span>`;
    }

    function renderTabla() {
        const total = filtrados.length;
        const inicio = paginaActual * pageSize;
        const fin = Math.min(inicio + pageSize, total);
        const pagina = filtrados.slice(inicio, fin);
        const totalPages = Math.max(1, Math.ceil(total / pageSize));

        if (pgInfoLbl) pgInfoLbl.textContent = `Mostrando ${Math.min(fin, total)} de ${total} registros`;
        if (pgInfoEl) pgInfoEl.textContent = `Página ${paginaActual + 1} de ${totalPages}`;
        if (pgPagEl) pgPagEl.style.display = totalPages > 1 ? 'flex' : 'none';
        
        if (pgFirst) pgFirst.disabled = paginaActual === 0;
        if (pgPrev) pgPrev.disabled = paginaActual === 0;
        if (pgNext) pgNext.disabled = paginaActual >= totalPages - 1;
        if (pgLast) pgLast.disabled = paginaActual >= totalPages - 1;

        tbody.innerHTML = '';
        emptyEl.style.display = pagina.length === 0 ? 'block' : 'none';

        pagina.forEach(p => {
            const tipo = TIPO_STYLE[p.tipoTransaccion] || { bg: '#f1f5f9', color: '#64748b', icon: 'bx-minus', label: p.tipoTransaccion || '—' };
            const estado = ESTADO_STYLE[p.estado] || { bg: '#f1f5f9', color: '#64748b', label: p.estado || '—' };
            const metIcon = METODO_ICON[p.metodoPago] || '💳';
            const anulado = p.estado === 'ANULADO';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="font-size:12px;color:#334155;font-weight:600;white-space:nowrap;">${fmtFecha(p.fecha)}</td>
                <td><span style="background:${tipo.bg};color:${tipo.color};padding:3px 9px;border-radius:20px;font-size:11px;font-weight:800;display:inline-flex;align-items:center;gap:4px;"><i class='bx ${tipo.icon}'></i>${tipo.label}</span></td>
                <td style="text-align:right;"><strong style="font-size:14px;color:${anulado ? '#94a3b8' : '#0f172a'};${anulado ? 'text-decoration:line-through;' : ''}">${fmtMoney(p.monto)}</strong></td>
                <td>${origenLink(p)}${p.nota ? `<br><span style="font-size:11px;color:#94a3b8;font-style:italic;">${p.nota}</span>` : ''}</td>
                <td><span style="font-size:12px;font-weight:600;color:#475569;">${metIcon} ${p.metodoPago || '—'}</span></td>
                <td>${badgeHTML(estado.label, estado.bg, estado.color)}</td>
                <td>
                    <div class="cli-actions" style="justify-content: center;">
                        <button class="pago-btn-ver" data-id="${p.id}" title="Ver detalle"><i class='bx bx-show'></i></button>
                        ${!anulado ? `<button class="pago-btn-anular" data-id="${p.id}" title="Anular pago"><i class='bx bx-block'></i></button>` : ''}
                        <button class="pago-btn-imprimir" data-id="${p.id}" title="Imprimir recibo"><i class='bx bx-printer'></i></button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Event Delegation
        tbody.querySelectorAll('.pago-btn-ver').forEach(btn => btn.onclick = () => modals.abrirDetalle(parseInt(btn.dataset.id)));
        tbody.querySelectorAll('.pago-btn-anular').forEach(btn => btn.onclick = () => {
            const p = allPagos.find(x => String(x.id) === btn.dataset.id);
            if (p) modals.abrirModalAnular(p);
        });
        tbody.querySelectorAll('.pago-btn-imprimir').forEach(btn => btn.onclick = () => {
            const p = allPagos.find(x => String(x.id) === btn.dataset.id);
            if (p) modals.imprimirRecibo(p, Store.getSucursal());
        });
    }

    function marcarAnulado(id, motivo) {
        const pago = allPagos.find(p => p.id === id);
        if (pago) {
            pago.estado = 'ANULADO';
            pago.motivoAnulacion = motivo;
            aplicarFiltros();
            actualizarStats(allPagos);
        }
    }

    // Listeners Registrados
    addGlobalListener(periodoSel, 'change', cargarPagos);
    addGlobalListener(metodoSel, 'change', cargarPagos);
    
    let searchTimer;
    addGlobalListener(searchEl, 'input', () => {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(aplicarFiltros, 250);
    });

    // Paginación y botones extra
    if (pgFirst) addGlobalListener(pgFirst, 'click', () => { paginaActual = 0; renderTabla(); });
    if (pgPrev) addGlobalListener(pgPrev, 'click', () => { if (paginaActual > 0) { paginaActual--; renderTabla(); } });
    if (pgNext) addGlobalListener(pgNext, 'click', () => { if (paginaActual < Math.ceil(filtrados.length / pageSize) - 1) { paginaActual++; renderTabla(); } });
    if (pgLast) addGlobalListener(pgLast, 'click', () => { paginaActual = Math.max(0, Math.ceil(filtrados.length / pageSize) - 1); renderTabla(); });
    
    if (btnRetry) addGlobalListener(btnRetry, 'click', cargarPagos);

    if (btnCsv) addGlobalListener(btnCsv, 'click', () => {
        const rango = getRango(periodoSel.value || '30');
        const lines = ['ID,Fecha,Tipo,Monto,Origen,Método,Estado,Nota'];
        filtrados.forEach(p => {
            lines.push([
                p.id, p.fecha, p.tipoTransaccion,
                Number(p.monto || 0).toFixed(2),
                p.reservaId ? `Reserva #${p.reservaId}` : (p.eventoId ? `Evento #${p.eventoId}` : ''),
                p.metodoPago, p.estado,
                (p.nota || '').replace(/,/g, ' ')
            ].join(','));
        });
        const blob = new Blob([lines.join('\\n')], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pagos_${rango.desde}_${rango.hasta}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    });

    return { cargarPagos, marcarAnulado };
}