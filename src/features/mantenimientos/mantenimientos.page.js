import { mantenimientosTemplate } from './mantenimientos.template.js';
import { MantenimientoService } from './mantenimientos.service.js';
import { initMantenimientoModals } from './mantenimientos.modals.js';
import { api } from '../../core/api.js';
import { initTable } from '../../shared/components/table.js';
import { initStats } from '../../shared/components/stats.js';
import { renderStatusBadge } from '../../shared/components/status-badge.js';
import { initPageHeader } from '../../shared/components/page-header.js';

let mountCleanup = null;

export function template() {
    return mantenimientosTemplate();
}

export function mount(container) {
    if (mountCleanup) { mountCleanup(); mountCleanup = null; }
    const cleanups = [];
    const addCleanup = (fn) => cleanups.push(fn);
    const addGlobalListener = (target, event, handler) => {
        if (!target) return;
        target.addEventListener(event, handler);
        addCleanup(() => target.removeEventListener(event, handler));
    };

    const header = initPageHeader({
        containerId: 'mantenimientos-header-container',
        title: 'Gestión de Mantenimientos',
        subtitle: 'Administra y supervisa todos los mantenimientos programados'
    });

    const PAGE_SIZE = 20;
    
    // --- Utils ---
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

    // --- Components ---
    const stats = initStats('mantenimientos-stats-container', [
        { id: 'total', label: 'Total Mantenimientos', icon: 'bx bx-list-ul', colorClass: 'gray' },
        { id: 'programados', label: 'Programados', icon: 'bx bx-calendar-check', colorClass: 'blue' },
        { id: 'proceso', label: 'En Proceso', icon: 'bx bx-loader-alt', colorClass: 'yellow' },
        { id: 'completados', label: 'Completados', icon: 'bx bx-check-circle', colorClass: 'green' }
    ]);

    function actualizarStats(data) {
        if (!stats) return;
        const items = Array.isArray(data) ? data : (data.content || []);
        const tots = { PROGRAMADO: 0, EN_PROCESO: 0, COMPLETADO: 0, CANCELADO: 0 };
        items.forEach(m => { if (tots[m.estadoMantenimiento] !== undefined) tots[m.estadoMantenimiento]++; });
        
        stats.updateAll({
            total: data.totalElements || items.length,
            programados: tots.PROGRAMADO,
            proceso: tots.EN_PROCESO,
            completados: tots.COMPLETADO
        });
    }

    const modals = initMantenimientoModals(() => table.fetch(0));

    const table = initTable({
        containerId: 'mantenimientos-table-container',
        pageSize: PAGE_SIZE,
        actionsStyle: 'inline',
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
                render: (v) => renderStatusBadge(v, { style: 'font-size:10px;', showDot: false })
            },
            {
                key: 'estadoMantenimiento',
                label: 'Estado',
                render: (v) => renderStatusBadge(v)
            }
        ],
        fetchData: async (page) => {
            const filters = { 
                page, 
                size: PAGE_SIZE, 
                sort: 'horaInicio,desc' 
            };
            
            const canchaId = document.getElementById('mf-cancha').value;
            const estado = document.getElementById('mf-estado').value;
            const desde = document.getElementById('mf-desde').value;
            const hasta = document.getElementById('mf-hasta').value;

            if (canchaId) filters.canchaId = canchaId;
            if (estado) filters.estadoMantenimiento = estado;
            if (desde) filters.fechaDesde = desde;
            if (hasta) filters.fechaHasta = hasta;

            const data = await MantenimientoService.listar(filters);
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
                        await MantenimientoService.actualizarEstado(m.id, 'EN_PROCESO');
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
                        await MantenimientoService.actualizarEstado(m.id, 'COMPLETADO');
                        table.fetch(0);
                    } catch(e) { alert(e.message); }
                }
            },
            { 
                label: 'Editar', 
                icon: 'bx bx-edit-alt', 
                show: (m) => m.estadoMantenimiento === 'PROGRAMADO',
                onClick: (m) => modals.abrirEditar(m)
            },
            { 
                label: 'Cancelar', 
                icon: 'bx bx-x-circle', 
                class: 'danger',
                show: (m) => ['PROGRAMADO', 'EN_PROCESO'].includes(m.estadoMantenimiento),
                onClick: (m) => modals.abrirCancelar(m)
            }
        ]
    });

    // --- Events ---
    addGlobalListener(document.getElementById('mf-apply'), 'click', () => table.fetch(0));
    addGlobalListener(document.getElementById('mf-clear'), 'click', () => {
        ['mf-cancha', 'mf-estado', 'mf-desde', 'mf-hasta'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });
        table.fetch(0);
    });

    // Dropdown canchas
    api.get('/canchas?size=200').then(data => {
        const canchas = Array.isArray(data) ? data : (data.content || []);
        const sel = document.getElementById('mf-cancha');
        if (!sel) return;
        canchas.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.id; opt.textContent = c.nombre;
            sel.appendChild(opt);
        });
    }).catch(() => {});

    table.fetch(0);

    mountCleanup = () => cleanups.forEach(fn => { try { fn(); } catch(e){} });
}

export function unmount() {
    if (mountCleanup) {
        mountCleanup();
        mountCleanup = null;
    }
}
