import { canchasTemplate } from './canchas.template.js';
import { Auth } from '../../core/auth.js';
import { Store } from '../../core/store.js';
import { initTable } from '../../shared/components/table.js';
import { initStats } from '../../shared/components/stats.js';
import { initActionButton } from '../../shared/components/action-button.js';
import { initPageHeader } from '../../shared/components/page-header.js';
import { initCanchasModals } from './canchas.modals.js';
import { initQuickSchedule } from './canchas.quick-schedule.js';

let mountCleanup = null;

export function template() {
    return canchasTemplate();
}

export function mount(container) {
    // 1. Limpieza de montaje previo
    if (mountCleanup) {
        mountCleanup();
        mountCleanup = null;
    }

    const cleanups = [];
    const addCleanup = (fn) => cleanups.push(fn);
    const addGlobalListener = (target, eventName, handler) => {
        if (!target) return;
        target.addEventListener(eventName, handler);
        addCleanup(() => target.removeEventListener(eventName, handler));
    };

    const session = Auth ? Auth.getSession() : null;
    const sedeActiva = (session && session.rol === 'superadmin')
        ? Store.getSucursal()
        : (session ? { sucursalId: session.sucursalId, nombre: session.sucursalNombre } : null);
    const sucursalFiltro = sedeActiva ? sedeActiva.sucursalId : null;

    const header = initPageHeader({
        containerId: 'canchas-header-container',
        title: 'Gestión de Canchas',
        subtitle: 'Configura, monitorea y gestiona tus canchas.'
    });

    if (header && sedeActiva && sedeActiva.nombre) {
        header.updateSubtitle(`Configura y monitorea las canchas de <span style="font-weight:700;color:var(--primary);">${sedeActiva.nombre}</span>.`);
    }

    /* ---- State ---- */
    const COLORS = ['#1a8f3b','#2563eb','#9333ea','#ea580c','#0891b2','#d97706','#e11d48'];
    const ESTADO_META = {
        DISPONIBLE:    { cls: 'green',  dotCls: 'green',  label: 'Disponible',    badgeCls: 'badge-green' },
        MANTENIMIENTO: { cls: 'yellow', dotCls: 'yellow', label: 'Mantenimiento', badgeCls: 'badge-yellow' },
        INACTIVA:      { cls: 'gray',   dotCls: 'gray',   label: 'Inactiva',      badgeCls: 'badge-gray' },
    };
    let vistaActual = 'tabla';
    let todasCanchas = [];

    /* ---- Components ---- */
    const stats = initStats('canchas-stats-container', [
        { id: 'total', label: 'Total Canchas', icon: 'bx bx-football', colorClass: 'gray' },
        { id: 'disponibles', label: 'Disponibles', icon: 'bx bx-check-circle', colorClass: 'green' },
        { id: 'mantenimiento', label: 'Mantenimiento', icon: 'bx bx-wrench', colorClass: 'yellow' },
        { id: 'inactivas', label: 'Inactivas', icon: 'bx bx-block', colorClass: 'red' }
    ]);

    const qs = initQuickSchedule({
        getSucursalId: () => sucursalFiltro,
        getTodasCanchas: () => todasCanchas
    });

    const modals = initCanchasModals(() => {
        table.fetch(0);
        if (qs) qs.update();
    });

    /* ---- Table & Grid ---- */
    const grilla = document.getElementById('canchas-grilla');
    const grillaIn = document.getElementById('canchas-grilla-inner');

    function renderGrilla(canchas) {
        grillaIn.innerHTML = '';
        canchas.forEach(c => {
            const meta = ESTADO_META[c.estadoCancha] || ESTADO_META['INACTIVA'];
            const color = COLORS[(c.canchaId || c.id) % COLORS.length];
            const initials = c.nombre.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();

            const card = document.createElement('div');
            card.className = 'cancha-grid-card';
            card.style = 'background:white; border-radius:12px; border:1px solid #e2e8f0; padding:16px; display:flex; flex-direction:column; gap:12px; transition:all 0.2s;';
            card.innerHTML = `
                <div style="display:flex; align-items:center; gap:12px;">
                    <div style="width:40px; height:40px; border-radius:10px; background:${color}; color:white; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:13px;">${initials}</div>
                    <div>
                        <div style="font-weight:700; color:#1e293b; font-size:14px;">${c.nombre}</div>
                        <div style="font-size:12px; color:#64748b;">S/ ${Number(c.precioHora).toFixed(2)} / hr</div>
                    </div>
                </div>
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span class="status-badge ${meta.badgeCls}"><span class="dot"></span> ${meta.label}</span>
                    <div class="table-actions-inline">
                         <button class="table-action-icon" title="Editar"><i class='bx bx-pencil'></i></button>
                    </div>
                </div>
            `;
            // Listener interno para la grilla
            card.querySelector('.table-action-icon').onclick = () => modals.abrirEditar(c.canchaId || c.id);
            grillaIn.appendChild(card);
        });
    }

    const table = initTable({
        containerId: 'canchas-table-container',
        pageSize: 20,
        actionsStyle: 'inline',
        columns: [
            { 
                key: 'nombre', 
                label: 'Nombre de Cancha',
                render: (v, c) => `
                    <div style="display:flex; align-items:center; gap:12px;">
                        <div style="width:36px; height:36px; border-radius:50%; background:${COLORS[(c.canchaId || c.id) % COLORS.length]}; color:white; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:12px;">
                            ${(v||'C').split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase()}
                        </div>
                        <div>
                            <strong style="color:#1e293b; display:block;">${v}</strong>
                            <span style="font-size:11px; color:#94a3b8;">ID: ${c.canchaId || c.id} · Sede ${c.sucursalId}</span>
                        </div>
                    </div>
                `
            },
            { key: 'precioHora', label: 'Precio / Hora', render: (v) => `<strong>S/ ${Number(v || 0).toFixed(2)}</strong>` },
            { 
                key: 'estadoCancha', 
                label: 'Estado',
                render: (v) => {
                    const meta = ESTADO_META[v] || ESTADO_META['INACTIVA'];
                    return `<span class="status-badge ${meta.badgeCls}"><span class="dot"></span> ${meta.label}</span>`;
                }
            }
        ],
        fetchData: async (page) => {
            const query = document.getElementById('canchas-search').value.toLowerCase();
            const estado = document.getElementById('canchas-filter-estado').value;
            
            const params = { page, size: 500 }; // Traemos más para filtrado local robusto si no es mucha data
            if (sucursalFiltro) params.sucursalId = sucursalFiltro;
            
            // Eliminamos estadoCancha de la API por petición del usuario para manejarlo localmente
            const data = await CanchaService.listar(params);
            
            let rawItems = Array.isArray(data) ? data : (data.content || []);
            todasCanchas = rawItems;

            // Filtro LOCAL (Nombre y Estado)
            const filtered = rawItems.filter(c => {
                const matchQuery = !query || c.nombre.toLowerCase().includes(query);
                const matchEstado = !estado || c.estadoCancha === estado;
                return matchQuery && matchEstado;
            });
            
            // Stats (Sobre el total de la sede)
            if (stats) {
                stats.updateAll({
                    total: rawItems.length,
                    disponibles: rawItems.filter(c => c.estadoCancha === 'DISPONIBLE').length,
                    mantenimiento: rawItems.filter(c => c.estadoCancha === 'MANTENIMIENTO').length,
                    inactivas: rawItems.filter(c => c.estadoCancha === 'INACTIVA').length
                });
            }

            if (vistaActual === 'grilla') renderGrilla(filtered);
            if (qs) qs.update();

            return {
                content: filtered.slice(page * 20, (page + 1) * 20),
                totalPages: Math.ceil(filtered.length / 20),
                totalElements: filtered.length,
                number: page
            };
        },
        actions: [
            { label: 'Mantenimiento', icon: 'bx bx-wrench', onClick: (c) => modals.abrirMantenimiento(c.canchaId || c.id) },
            { label: 'Editar', icon: 'bx bx-pencil', onClick: (c) => modals.abrirEditar(c.canchaId || c.id) },
            { 
                label: 'Eliminar', 
                icon: 'bx bx-trash', 
                class: 'danger', 
                onClick: async (c) => {
                    if (!confirm(`¿Estás seguro de eliminar la cancha "${c.nombre}"?`)) return;
                    try {
                        await CanchaService.eliminar(c.canchaId || c.id);
                        table.fetch(0);
                    } catch (err) { alert('Error: ' + err.message); }
                } 
            }
        ]
    });

    /* ---- Handlers ---- */
    const btnTabla = document.getElementById('btn-view-tabla');
    const btnGrilla = document.getElementById('btn-view-grilla');
    const searchIn = document.getElementById('canchas-search');
    const filterEstado = document.getElementById('canchas-filter-estado');

    function setVista(vista) {
        vistaActual = vista;
        const tableCont = document.getElementById('canchas-table-container');
        if (vista === 'tabla') {
            btnTabla.classList.add('active');
            btnGrilla.classList.remove('active');
            grilla.style.display = 'none';
            tableCont.style.display = 'block';
        } else {
            btnGrilla.classList.add('active');
            btnTabla.classList.remove('active');
            grilla.style.display = 'block';
            tableCont.style.display = 'none';
        }
        table.fetch(0);
    }

    addGlobalListener(btnTabla, 'click', () => setVista('tabla'));
    addGlobalListener(btnGrilla, 'click', () => setVista('grilla'));
    
    let debounceTimer;
    addGlobalListener(searchIn, 'input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => table.fetch(0), 300);
    });

    addGlobalListener(filterEstado, 'change', () => table.fetch(0));

    initActionButton({
        containerId: header ? header.primaryActionsId : 'canchas-action-container',
        label: 'Nueva Cancha',
        icon: 'bx bx-plus',
        onClick: () => modals.abrirNueva(sucursalFiltro)
    });

    // Carga inicial
    setVista('tabla');

    // Guardar cleanup para unmount
    mountCleanup = () => cleanups.forEach(fn => { try { fn(); } catch(e){} });
}

export function unmount() {
    if (mountCleanup) {
        mountCleanup();
        mountCleanup = null;
    }
}
