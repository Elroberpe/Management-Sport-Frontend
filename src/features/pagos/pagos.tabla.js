import { initTable } from '../../shared/components/table.js';

export function initTabla({ api, Store, addCleanup, addGlobalListener, modals }) {
    
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

    const METODO_ICON = { EFECTIVO:'💵', YAPE:'📱', PLIN:'📱', TRANSFERENCIA:'🏦', TARJETA:'💳' };

    function actualizarStats(pagos, totalElements) {
        const completados = pagos.filter(p => p.estado !== 'ANULADO');
        const anulados = pagos.filter(p => p.estado === 'ANULADO');
        const ingresos = completados.filter(p => p.tipoTransaccion === 'INGRESO');
        const salidas = completados.filter(p => p.tipoTransaccion === 'SALIDA');

        const totalIng = ingresos.reduce((s, p) => s + Number(p.monto || 0), 0);
        const totalAnu = anulados.reduce((s, p) => s + Number(p.monto || 0), 0);
        const totalSal = salidas.reduce((s, p) => s + Number(p.monto || 0), 0);

        document.getElementById('pagos-stat-ingresos').textContent = fmtMoney(totalIng);
        document.getElementById('pagos-stat-anulados').textContent = fmtMoney(totalAnu);
        document.getElementById('pagos-stat-count').textContent = totalElements || pagos.length;
        document.getElementById('pagos-badge-count').textContent = totalElements || pagos.length;
        document.getElementById('pagos-badge-ingresos').textContent = ingresos.length + ' pagos';
        document.getElementById('pagos-badge-anulados').textContent = anulados.length + ' anulados';
        
        const per = document.getElementById('pagos-periodo').value;
        document.getElementById('pagos-stat-sub').textContent = 'en los últimos ' + per + ' días';
        
        document.getElementById('pagos-bar-ingresos').style.width = '80%';
        document.getElementById('pagos-bar-anulados').style.width = totalIng > 0 ? Math.min(80, (totalAnu / totalIng) * 80) + '%' : '0%';
        document.getElementById('pagos-stat-salidas').textContent = fmtMoney(totalSal);
        document.getElementById('pagos-badge-salidas').textContent = salidas.length + ' salidas';
        document.getElementById('pagos-bar-salidas').style.width = totalIng > 0 ? Math.min(80, (totalSal / totalIng) * 80) + '%' : '0%';
    }

    const table = initTable({
        containerId: 'pagos-table-container',
        pageSize: 20,
        columns: [
            { 
                key: 'fecha', 
                label: 'Fecha', 
                render: (v) => `<span style="font-size:12px; color:#334155; font-weight:600;">${fmtFecha(v)}</span>` 
            },
            {
                key: 'tipoTransaccion',
                label: 'Tipo',
                render: (v) => {
                    const MAP = { INGRESO: 'badge-green', SALIDA: 'badge-red' };
                    const icon = v === 'INGRESO' ? 'bx-chevrons-up' : 'bx-chevrons-down';
                    return `<span class="status-badge ${MAP[v] || 'badge-gray'}" style="font-size:10px;"><i class='bx ${icon}'></i> ${v}</span>`;
                }
            },
            {
                key: 'monto',
                label: 'Monto',
                render: (v, p) => {
                    const anulado = p.estado === 'ANULADO';
                    return `<strong style="font-size:14px; text-align:right; display:block; color:${anulado ? '#94a3b8' : '#0f172a'}; ${anulado ? 'text-decoration:line-through;' : ''}">${fmtMoney(v)}</strong>`;
                }
            },
            {
                key: 'origen',
                label: 'Origen',
                render: (_, p) => {
                    let link = p.reservaId 
                        ? `<a href='#' class='pagos-origen-link' data-reserva-id='${p.reservaId}' style='color:#3b82f6; font-weight:700; font-size:12px; text-decoration:none;'>📋 Reserva #${p.reservaId}</a>`
                        : (p.eventoId ? `<a href='#' style='color:#8b5cf6; font-weight:700; font-size:12px; text-decoration:none;'>🎉 Evento #${p.eventoId}</a>` : '—');
                    return `<div>${link}${p.nota ? `<div style="font-size:11px; color:#94a3b8; font-style:italic;">${p.nota}</div>` : ''}</div>`;
                }
            },
            {
                key: 'metodoPago',
                label: 'Método',
                render: (v) => `<span style="font-size:12px; font-weight:600; color:#475569;">${METODO_ICON[v] || '💳'} ${v || '—'}</span>`
            },
            {
                key: 'estado',
                label: 'Estado',
                render: (v) => {
                    const MAP = { COMPLETADO: 'badge-green', ANULADO: 'badge-red' };
                    return `<span class="status-badge ${MAP[v] || 'badge-gray'}">${v}</span>`;
                }
            }
        ],
        fetchData: async (page) => {
            const sucursal = Store.getSucursal();
            const periodo = document.getElementById('pagos-periodo').value;
            const metodo = document.getElementById('pagos-metodo').value;
            const search = document.getElementById('pagos-search').value;

            const toISO = d => d.toISOString().split('T')[0];
            const desde = new Date(); desde.setDate(desde.getDate() - parseInt(periodo));
            const hasta = toISO(new Date());
            const desdeISO = toISO(desde);

            let url = `/pagos?desde=${desdeISO}&hasta=${hasta}&page=${page}&size=20&sort=fecha,desc`;
            if (metodo) url += `&metodo=${metodo}`;
            if (search) url += `&query=${encodeURIComponent(search)}`;
            if (sucursal && sucursal.sucursalId) url += `&sucursalId=${sucursal.sucursalId}`;

            const data = await api.get(url);
            const items = Array.isArray(data) ? data : (data.content || []);
            actualizarStats(items, data.totalElements);
            return data;
        },
        actions: [
            { 
                label: 'Ver Detalle', 
                icon: 'bx bx-show', 
                onClick: (p) => modals.abrirDetalle(p.id) 
            },
            { 
                label: 'Anular Pago', 
                icon: 'bx bx-block', 
                class: 'danger',
                show: (p) => p.estado !== 'ANULADO',
                onClick: (p) => modals.abrirModalAnular(p)
            },
            { 
                label: 'Imprimir Recibo', 
                icon: 'bx bx-printer', 
                onClick: (p) => modals.imprimirRecibo(p, Store.getSucursal())
            }
        ]
    });

    const periodoSel = document.getElementById('pagos-periodo');
    const metodoSel = document.getElementById('pagos-metodo');
    const searchEl = document.getElementById('pagos-search');

    addGlobalListener(periodoSel, 'change', () => table.fetch(0));
    addGlobalListener(metodoSel, 'change', () => table.fetch(0));
    
    let searchTimer;
    addGlobalListener(searchEl, 'input', () => {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => table.fetch(0), 400);
    });

    const btnRetry = document.getElementById('pagos-retry');
    if (btnRetry) addGlobalListener(btnRetry, 'click', () => table.fetch(0));

    return { 
        cargarPagos: () => table.fetch(0), 
        marcarAnulado: () => table.fetch(0) 
    };
}