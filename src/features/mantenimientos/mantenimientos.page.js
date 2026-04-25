import { mantenimientosTemplate } from './mantenimientos.template.js';
import { api } from '../../core/api.js';
import { initTable } from '../../shared/components/table.js';

export function template() {
    return mantenimientosTemplate();
}

export function mount(container) {
    const PAGE_SIZE = 10;
    
    // Formateadores
    const fmtDate = (iso) => {
        if (!iso) return '—';
        const d = new Date(iso);
        return `${d.getDate().toString().padStart(2,'0')}/${(d.getMonth()+1).toString().padStart(2,'0')}/${d.getFullYear()}`;
    };
    const fmtTime = (iso) => {
        if (!iso) return '—';
        const d = new Date(iso);
        return `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}h`;
    };

    function actualizarStats(data) {
        const items = Array.isArray(data) ? data : (data.content || []);
        const tots = { PROGRAMADO: 0, EN_PROCESO: 0, COMPLETADO: 0, CANCELADO: 0 };
        items.forEach(m => { if (tots[m.estadoMantenimiento] !== undefined) tots[m.estadoMantenimiento]++; });
        
        document.getElementById('stat-total').textContent      = data.totalElements || items.length;
        document.getElementById('stat-programados').textContent = tots.PROGRAMADO;
        document.getElementById('stat-enproceso').textContent   = tots.EN_PROCESO;
        document.getElementById('stat-completados').textContent = tots.COMPLETADO;
    }

    const table = initTable({
        containerId: 'mantenimientos-table-container',
        pageSize: PAGE_SIZE,
        columns: [
            { 
                key: 'nombreCancha', 
                label: 'Cancha Asignada',
                render: (v, m) => `
                    <div style="display:flex; align-items:center; gap:10px;">
                        <div style="width:32px; height:32px; border-radius:8px; background:#f1f5f9; display:flex; align-items:center; justify-content:center; color:#64748b; font-weight:700; font-size:11px;">
                            ${(v || 'C').substring(0,1)}
                        </div>
                        <div>
                            <div style="font-weight:700; color:#1e293b; font-size:13px;">${v || 'Desconocida'}</div>
                            <div style="font-size:11px; color:#94a3b8;">ID Man: ${m.id}</div>
                        </div>
                    </div>
                `
            },
            {
                key: 'horaInicio',
                label: 'Inicio',
                render: (v) => `
                    <div style="line-height:1.2;">
                        <div style="font-weight:700; color:#1e293b; font-size:13px;">${fmtDate(v)}</div>
                        <div style="font-size:11px; color:#64748b;">${fmtTime(v)}</div>
                    </div>
                `
            },
            {
                key: 'horaFin',
                label: 'Fin Estimado',
                render: (v) => `
                    <div style="line-height:1.2;">
                        <div style="font-weight:700; color:#1e293b; font-size:13px;">${fmtDate(v)}</div>
                        <div style="font-size:11px; color:#64748b;">${fmtTime(v)}</div>
                    </div>
                `
            },
            {
                key: 'tipoMantenimiento',
                label: 'Tipo',
                render: (v) => {
                    const MAP = { PREVENTIVO: 'badge-blue', CORRECTIVO: 'badge-yellow', URGENTE: 'badge-red' };
                    return `<span class="status-badge ${MAP[v] || 'badge-gray'}" style="font-size:10px;">${v}</span>`;
                }
            },
            {
                key: 'estadoMantenimiento',
                label: 'Estado',
                render: (v) => {
                    const MAP = { PROGRAMADO: 'badge-blue', EN_PROCESO: 'badge-yellow', COMPLETADO: 'badge-green', CANCELADO: 'badge-gray' };
                    return `<span class="status-badge ${MAP[v] || 'badge-gray'}"><span class="dot"></span> ${v}</span>`;
                }
            },
            {
                key: 'motivo',
                label: 'Motivo',
                render: (v) => `<div style="max-width:150px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:12px; color:#64748b;" title="${v}">${v || '—'}</div>`
            }
        ],
        fetchData: async (page) => {
            const params = new URLSearchParams({ page, size: PAGE_SIZE, sort: 'horaInicio,desc' });
            
            const canchaId = document.getElementById('mf-cancha').value;
            const estado = document.getElementById('mf-estado').value;
            const desde = document.getElementById('mf-desde').value;
            const hasta = document.getElementById('mf-hasta').value;

            if (canchaId) params.append('canchaId', canchaId);
            if (estado) params.append('estadoMantenimiento', estado);
            if (desde) params.append('fechaDesde', desde);
            if (hasta) params.append('fechaHasta', hasta);

            const data = await api.get(`/mantenimientos?${params.toString()}`);
            actualizarStats(data);
            return data;
        },
        actions: [
            { 
                label: 'Iniciar', 
                icon: 'bx bx-play-circle', 
                show: (m) => m.estadoMantenimiento === 'PROGRAMADO',
                onClick: async (m) => {
                    try {
                        await api.patch(`/mantenimientos/${m.id}/estado`, { estado: 'EN_PROCESO' });
                        table.fetch(0);
                    } catch(e) { alert(e.message); }
                }
            },
            { 
                label: 'Completar', 
                icon: 'bx bx-check-circle', 
                class: 'success',
                show: (m) => m.estadoMantenimiento === 'EN_PROCESO',
                onClick: async (m) => {
                    try {
                        await api.patch(`/mantenimientos/${m.id}/estado`, { estado: 'COMPLETADO' });
                        table.fetch(0);
                    } catch(e) { alert(e.message); }
                }
            },
            { 
                label: 'Editar', 
                icon: 'bx bx-edit-alt', 
                show: (m) => m.estadoMantenimiento === 'PROGRAMADO',
                onClick: (m) => alert('Abrir modal editar para ID: ' + m.id)
            },
            { 
                label: 'Cancelar', 
                icon: 'bx bx-x-circle', 
                class: 'danger',
                show: (m) => ['PROGRAMADO', 'EN_PROCESO'].includes(m.estadoMantenimiento),
                onClick: async (m) => {
                    if (!confirm('¿Cancelar este mantenimiento?')) return;
                    try {
                        await api.patch(`/mantenimientos/${m.id}/cancelar`);
                        table.fetch(0);
                    } catch(e) { alert(e.message); }
                }
            }
        ]
    });

    // Filtros
    document.getElementById('mf-apply').addEventListener('click', () => table.fetch(0));
    document.getElementById('mf-clear').addEventListener('click', () => {
        document.getElementById('mf-cancha').value = '';
        document.getElementById('mf-estado').value = '';
        document.getElementById('mf-desde').value = '';
        document.getElementById('mf-hasta').value = '';
        table.fetch(0);
    });

    // Dropdown canchas
    api.get('/canchas?size=200').then(data => {
        const canchas = Array.isArray(data) ? data : (data.content || []);
        const sel = document.getElementById('mf-cancha');
        canchas.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.id; opt.textContent = c.nombre;
            sel.appendChild(opt);
        });
    }).catch(() => {});

    table.fetch(0);
}

export function unmount() {}
