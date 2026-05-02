// src/features/eventos/eventos.page.js
// Orquestador principal del módulo de Gestión de Eventos

import { eventosTemplate } from './eventos.template.js';
import { api } from '../../core/api.js';
import { Auth } from '../../core/auth.js';
import { Store } from '../../core/store.js';
import { initTable } from '../../shared/components/table.js';
import { initStats } from '../../shared/components/stats.js';
import { initActionButton } from '../../shared/components/action-button.js';
import { initPageHeader } from '../../shared/components/page-header.js';
import { renderStatusBadge } from '../../shared/components/status-badge.js';
import {
    initCrearEventoModal,
    initEditarEventoModal,
    initReprogramarEventoModal,
    initPagoEventoModal,
    initCancelarEventoModal,
} from './eventos.modals.js';

const ESTADOS_FINALES = ['FINALIZADO', 'CANCELADO'];
const PAGE_SIZE = 10;

let mountCleanup = null;

export function template() {
    return eventosTemplate();
}

export function mount(container) {
    if (mountCleanup) { mountCleanup(); mountCleanup = null; }

    const session = Auth.getSession();
    const cleanups = [];
    const addCleanup = (fn) => cleanups.push(fn);
    const addGlobalListener = (target, ev, handler) => {
        if (!target) return;
        target.addEventListener(ev, handler);
        addCleanup(() => target.removeEventListener(ev, handler));
    };

    // -------------------------------------------------------------------------
    // 1. Header
    // -------------------------------------------------------------------------
    const header = initPageHeader({
        containerId: 'eventos-header-container',
        title: 'Gestión de Eventos',
        subtitle: 'Administra torneos, eventos corporativos y especiales.',
    });

    // -------------------------------------------------------------------------
    // 2. Stats
    // -------------------------------------------------------------------------
    const stats = initStats('eventos-stats-container', [
        { id: 'total',       label: 'Total Eventos',   icon: 'bx bx-calendar-event', colorClass: 'blue'   },
        { id: 'activos',     label: 'En Curso',        icon: 'bx bx-play-circle',    colorClass: 'yellow' },
        { id: 'finalizados', label: 'Finalizados',     icon: 'bx bx-check-circle',   colorClass: 'green'  },
        { id: 'ingresos',    label: 'Ingresos (S/)',   icon: 'bx bx-money',          colorClass: 'green'  },
    ]);

    function actualizarStats(items) {
        if (!stats) return;
        const ingresos = items.reduce((acc, e) => acc + Number(e.montoPagado || 0), 0);
        stats.updateAll({
            total:       items.length,
            activos:     items.filter(e => e.estado === 'EN_CURSO').length,
            finalizados: items.filter(e => e.estado === 'FINALIZADO').length,
            ingresos:    ingresos.toFixed(2),
        });
    }

    // -------------------------------------------------------------------------
    // 3. Helpers visuales
    // -------------------------------------------------------------------------
    const TIPO_META = {
        TORNEO:      { color: 'blue',   label: '🏆 Torneo'       },
        CORPORATIVO: { color: 'purple', label: '🏢 Corporativo'   },
        RELAMPAGO:   { color: 'red',    label: '⚡ Relámpago'     },
    };

    const ESTADO_META = {
        PROGRAMADO: { color: 'blue',   label: 'Programado' },
        EN_CURSO:   { color: 'yellow', label: 'En Curso'   },
        FINALIZADO: { color: 'green',  label: 'Finalizado' },
        CANCELADO:  { color: 'red',    label: 'Cancelado'  },
    };

    function tipoBadge(tipo) {
        const meta = TIPO_META[tipo] || { color: 'gray', label: tipo };
        return renderStatusBadge(tipo, { color: meta.color, label: meta.label, showDot: false });
    }

    function estadoBadge(estado) {
        const meta = ESTADO_META[estado] || { color: 'gray', label: estado };
        return renderStatusBadge(estado, { color: meta.color, label: meta.label, showDot: true });
    }

    function formatFecha(f) {
        if (!f) return '—';
        const [y, m, d] = f.split('-');
        return `${d}/${m}/${y}`;
    }

    // -------------------------------------------------------------------------
    // 4. Filtro de Sede (solo SUPERADMIN)
    // -------------------------------------------------------------------------
    function setupFiltroSede() {
        const filterContainer = document.getElementById('eventos-sede-filter');
        const sucursalSelect  = document.getElementById('evt-filter-sucursal');
        if (!filterContainer || !sucursalSelect) return;

        if (session?.rol !== 'superadmin') return; // Oculto para otros roles

        filterContainer.style.display = 'block';

        const contextoSede = Store.getSucursal();

        // Cargar sucursales
        api.get('/sucursales')
            .then(list => {
                if (!Array.isArray(list)) return;
                list.filter(s => s.activo !== false).forEach(s => {
                    const opt = document.createElement('option');
                    opt.value = s.sucursalId !== undefined ? s.sucursalId : s.id;
                    opt.textContent = s.nombre;
                    sucursalSelect.appendChild(opt);
                });

                if (contextoSede && contextoSede.sucursalId) {
                    sucursalSelect.value = contextoSede.sucursalId;
                    sucursalSelect.disabled = true;
                }
            })
            .catch(() => {});

        addGlobalListener(sucursalSelect, 'change', () => table.fetch(0));
    }

    setupFiltroSede();

    // -------------------------------------------------------------------------
    // 5. Modales (pre-inicializados)
    // -------------------------------------------------------------------------
    const modalEditar      = initEditarEventoModal({ onActualizado: () => table.fetch(0) });
    const modalReprogramar = initReprogramarEventoModal({ onReprogramado: () => table.fetch(0) });
    const modalPago        = initPagoEventoModal({ onPagado: () => table.fetch(0) });
    const modalCancelar    = initCancelarEventoModal({ onCancelado: () => table.fetch(0) });

    // -------------------------------------------------------------------------
    // 6. Tabla
    // -------------------------------------------------------------------------
    const table = initTable({
        containerId: 'eventos-table-container',
        pageSize: PAGE_SIZE,
        actionsStyle: 'inline',
        columns: [
            {
                key: 'nombre',
                label: 'Evento',
                render: (v, e) => `
                    <div class="cell-info">
                        <strong class="cell-title">${v || '—'}</strong>
                        <span class="cell-subtitle" style="margin-top:4px;">
                            ${tipoBadge(e.tipoEvento)}
                        </span>
                    </div>
                `
            },
            {
                key: 'fechaInicio',
                label: 'Fechas',
                render: (v, e) => {
                    const inicio = formatFecha(v);
                    const fin    = formatFecha(e.fechaFin);
                    const mismaFecha = v === e.fechaFin;
                    return `
                        <div class="cell-info">
                            <span class="cell-title" style="display:flex;align-items:center;gap:4px;">
                                <i class='bx bx-calendar' style="color:var(--primary);"></i>
                                ${inicio}${!mismaFecha ? ` → ${fin}` : ''}
                            </span>
                            ${e.reservasAsociadas?.[0]?.horario
                                ? `<span class="cell-subtitle">${e.reservasAsociadas[0].horario}</span>`
                                : ''}
                        </div>
                    `;
                }
            },
            {
                key: 'reservasAsociadas',
                label: 'Cancha(s)',
                render: (v) => {
                    if (!v || v.length === 0) return '<span style="color:var(--text-muted);">—</span>';
                    const primera = v[0].nombreCancha || `Cancha #${v[0].canchaId}`;
                    const extra   = v.length > 1 ? ` <span style="color:var(--text-muted);font-size:11px;">+${v.length - 1} más</span>` : '';
                    return `
                        <div class="contact-link">
                            <i class='bx bx-map' style="color:var(--primary);"></i>
                            <span>${primera}${extra}</span>
                        </div>
                    `;
                }
            },
            {
                key: 'nombreCliente',
                label: 'Cliente',
                render: (v) => `
                    <div class="contact-link" style="opacity:${v ? 1 : 0.4}">
                        <i class='bx bx-user'></i>
                        <span>${v || 'Sin cliente'}</span>
                    </div>
                `
            },
            {
                key: 'estado',
                label: 'Estado',
                render: (v) => estadoBadge(v)
            },
            {
                key: 'saldoPendiente',
                label: 'Saldo Pend.',
                render: (v) => {
                    const saldo = Number(v || 0);
                    const color = saldo > 0 ? '#dc2626' : '#16a34a';
                    const icon  = saldo > 0 ? 'bx-error-circle' : 'bx-check-circle';
                    return `
                        <div style="text-align:right; font-weight:700; color:${color}; display:flex; align-items:center; gap:4px; justify-content:flex-end;">
                            <i class='bx ${icon}' style="font-size:14px;"></i>
                            S/ ${saldo.toFixed(2)}
                        </div>
                    `;
                }
            },
        ],
        fetchData: async (page) => {
            const searchEl    = document.getElementById('evt-search');
            const estadoEl    = document.getElementById('evt-filter-estado');
            const tipoEl      = document.getElementById('evt-filter-tipo');
            const sucursalEl  = document.getElementById('evt-filter-sucursal');

            const q      = searchEl   ? searchEl.value.trim()   : '';
            const estado = estadoEl   ? estadoEl.value           : '';
            const tipo   = tipoEl     ? tipoEl.value             : '';
            
            const contextoSede = Store.getSucursal();
            let sucId = '';

            if (session?.rol === 'superadmin') {
                if (contextoSede && contextoSede.sucursalId) {
                    sucId = contextoSede.sucursalId;
                } else if (sucursalEl && sucursalEl.value) {
                    sucId = sucursalEl.value;
                }
            } else if (session?.sucursalId) {
                sucId = session.sucursalId;
            }

            let url = `/eventos?page=${page}&size=${PAGE_SIZE}&sort=fechaInicio,desc`;
            if (sucId)  url += `&sucursalId=${encodeURIComponent(sucId)}`;

            try {
                const data  = await api.get(url);
                let items   = Array.isArray(data) ? data : (data.content || []);
                let total   = data.totalElements !== undefined ? data.totalElements : items.length;

                // Filtros client-side adicionales
                if (estado) items = items.filter(e => e.estado === estado);
                if (tipo)   items = items.filter(e => e.tipoEvento === tipo);
                if (q) {
                    const qLow = q.toLowerCase();
                    items = items.filter(e =>
                        (e.nombre         || '').toLowerCase().includes(qLow) ||
                        (e.nombreCliente  || '').toLowerCase().includes(qLow)
                    );
                }
                if (estado || tipo || q) total = items.length;

                actualizarStats(items);

                return { ...data, content: items, totalElements: total, items };
            } catch (err) {
                console.error('[Eventos] Error al cargar eventos:', err);
                return { content: [], totalElements: 0 };
            }
        },
        actions: [
            {
                label: 'Editar',
                icon: 'bx bx-pencil',
                onClick: (e) => modalEditar.abrir(e.id || e.eventoId),
            },
            {
                label: 'Reprogramar',
                icon: 'bx bx-calendar-edit',
                show: (e) => !ESTADOS_FINALES.includes(e.estado),
                onClick: (e) => modalReprogramar.abrir(e),
            },
            {
                label: 'Añadir Pago',
                icon: 'bx bx-credit-card',
                show: (e) => !ESTADOS_FINALES.includes(e.estado) && e.saldoPendiente > 0,
                onClick: (e) => modalPago.abrir(e),
            },
            {
                label: 'Cancelar',
                icon: 'bx bx-x-circle',
                class: 'danger',
                show: (e) => !ESTADOS_FINALES.includes(e.estado),
                onClick: (e) => modalCancelar.abrir(e),
            },
        ]
    });

    // -------------------------------------------------------------------------
    // 7. Listeners de filtros
    // -------------------------------------------------------------------------
    const searchInput = document.getElementById('evt-search');
    const estadoFilter = document.getElementById('evt-filter-estado');
    const tipoFilter   = document.getElementById('evt-filter-tipo');
    let debounceTimer;

    addGlobalListener(searchInput, 'input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => table.fetch(0), 400);
        addCleanup(() => clearTimeout(debounceTimer));
    });
    addGlobalListener(estadoFilter, 'change', () => table.fetch(0));
    addGlobalListener(tipoFilter,   'change', () => table.fetch(0));

    // -------------------------------------------------------------------------
    // 8. Botón "Crear Nuevo Evento"
    // -------------------------------------------------------------------------
    const modalCrear = initCrearEventoModal({ onCreado: () => table.fetch(0) });

    initActionButton({
        containerId: header ? header.primaryActionsId : 'eventos-action-container',
        label: 'Crear Nuevo Evento',
        icon: 'bx bx-calendar-plus',
        onClick: () => modalCrear.open(),
    });

    // -------------------------------------------------------------------------
    // 9. Carga inicial
    // -------------------------------------------------------------------------
    table.fetch(0);

    mountCleanup = () => cleanups.forEach(fn => { try { fn(); } catch (e) {} });
}

export function unmount() {
    if (mountCleanup) { mountCleanup(); mountCleanup = null; }
}
