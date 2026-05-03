import { clientesTemplate } from './clientes.template.js';
import { api } from '../../core/api.js';
import { initTable } from '../../shared/components/table.js';
import { initStats } from '../../shared/components/stats.js';
import { initActionButton } from '../../shared/components/action-button.js';
import { initClienteModal, initEditClienteModal } from './clientes.modals.js';
import { initPageHeader } from '../../shared/components/page-header.js';
import { getAvatarColor, getInitials } from '../../shared/utils/avatar.js';

let mountCleanup = null;

export function template() {
    return clientesTemplate();
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

    const header = initPageHeader({
        containerId: 'clientes-header-container',
        title: 'Base de Clientes',
        subtitle: 'Gestiona tu comunidad de jugadores y clientes registrados.',
        extraActionsHtml: `
            <button class="btn btn-export-csv" id="btn-export-csv">
                <i class='bx bx-download'></i> Exportar CSV
            </button>
        `
    });

    addGlobalListener(document.getElementById('btn-export-csv'), 'click', () => {
        alert('Funcionalidad de exportación próximamente.');
    });

    const PAGE_SIZE = 20;

    // 2. Inicializar Componentes Reutilizables
    const stats = initStats('clientes-stats-container', [
        { id: 'total', label: 'Total Clientes', icon: 'bx bx-group', colorClass: 'green' },
        { id: 'dni', label: 'Con DNI', icon: 'bx bx-id-card', colorClass: 'yellow' },
        { id: 'email', label: 'Con Email', icon: 'bx bx-envelope', colorClass: 'blue' },
        { id: 'tel', label: 'Con Teléfono', icon: 'bx bx-phone', colorClass: 'red' }
    ]);

    function actualizarStats(clientes, total) {
        if (!stats) return;
        stats.updateAll({
            total: total,
            dni: clientes.filter(c => c.tipoDocumento === 'DNI').length + (total > PAGE_SIZE ? '+' : ''),
            email: clientes.filter(c => c.email).length + (total > PAGE_SIZE ? '+' : ''),
            tel: clientes.filter(c => c.telefono).length + (total > PAGE_SIZE ? '+' : '')
        });
    }

    const modalEC = initEditClienteModal({
        onClienteActualizado: () => table.fetch(0)
    });

    // 3. Configuración de la Tabla
    const table = initTable({
        containerId: 'clientes-table-container',
        pageSize: PAGE_SIZE,
        actionsStyle: 'inline',
        columns: [
            { 
                key: 'nombre', 
                label: 'Nombre del Cliente',
                render: (v, c) => `
                    <div class="profile-cell">
                        <div class="avatar-circle" style="background:${getAvatarColor(c.clienteId || c.id)}; color:white;">
                            ${getInitials(v)}
                        </div>
                        <div class="cell-info">
                            <strong class="cell-title">${v}</strong>
                            <span class="cell-subtitle">ID #${c.clienteId || c.id}</span>
                        </div>
                    </div>
                `
            },
            {
                key: 'documento',
                label: 'Documento',
                render: (v, c) => `
                    <div class="cell-info">
                        <span class="status-badge badge-gray" style="font-size:10px; align-self:flex-start;">${c.tipoDocumento || '—'}</span>
                        <span class="cell-title" style="margin-top:4px;">${v || c.numDocumento || '—'}</span>
                    </div>
                `
            },
            {
                key: 'contacto',
                label: 'Contacto',
                render: (_, c) => `
                    <div class="contact-cell">
                        <div class="contact-link" style="opacity:${c.email ? '1' : '0.4'}">
                            <i class='bx bx-envelope'></i> <span>${c.email || 'Sin email'}</span>
                        </div>
                        <div class="contact-link" style="font-weight:600; opacity:${c.telefono ? '1' : '0.4'}">
                            <i class='bx bx-phone'></i> <span>${c.telefono || 'Sin teléfono'}</span>
                        </div>
                    </div>
                `
            }
        ],
        fetchData: async (page) => {
            const searchEl = document.getElementById('cli-search');
            const tipoEl = document.getElementById('cli-filter-tipo');
            
            const q = searchEl ? searchEl.value.trim() : '';
            const tipo = tipoEl ? tipoEl.value : '';

            // 1. Petición a la API usando parámetros soportados (nombre/documento)
            let url = `/clientes?page=${page}&size=${PAGE_SIZE}&sort=nombre,asc`;
            
            if (q) {
                // Heurística: si es numérico buscamos por documento, si no por nombre
                // Según cliente-api.yaml, los parámetros son 'nombre' y 'documento'
                if (/^\d+$/.test(q)) {
                    url += `&documento=${encodeURIComponent(q)}`;
                } else {
                    url += `&nombre=${encodeURIComponent(q)}`;
                }
            }

            try {
                const data = await api.get(url);
                let items = Array.isArray(data) ? data : (data.content || []);
                let total = data.totalElements !== undefined ? data.totalElements : items.length;
                
                // 2. Filtro LOCAL para Tipo de Documento (ya que la API no lo soporta)
                if (tipo) {
                    items = items.filter(c => c.tipoDocumento === tipo);
                    // Actualizamos el total para la vista actual
                    total = items.length;
                }

                actualizarStats(items, total);
                
                // Retornamos el objeto con los items ya filtrados localmente
                return {
                    ...data,
                    content: items,
                    totalElements: total,
                    items: items // Por compatibilidad con initTable
                };
            } catch (err) {
                console.error('Error al cargar clientes:', err);
                return { content: [], totalElements: 0 };
            }
        },
        actions: [
            { 
                label: 'WhatsApp', 
                icon: 'bx bxl-whatsapp', 
                class: 'success',
                show: (c) => !!c.telefono, 
                onClick: (c) => window.open(`https://wa.me/51${c.telefono.replace(/\s/g, '')}`) 
            },
            { 
                label: 'Editar', 
                icon: 'bx bx-pencil', 
                onClick: (c) => modalEC.abrir(c.clienteId || c.id) 
            },
            { 
                label: 'Eliminar', 
                icon: 'bx bx-trash', 
                class: 'danger',
                onClick: async (c) => {
                    if (!confirm(`¿Eliminar a ${c.nombre}?`)) return;
                    try {
                        await api.delete(`/clientes/${c.clienteId || c.id}`);
                        table.fetch(0);
                    } catch (err) {
                        alert('No se pudo eliminar: ' + err.message);
                    }
                }
            }
        ]
    });

    // 4. Listeners con Debounce y Cleanup
    const searchIn = document.getElementById('cli-search');
    const filterTipo = document.getElementById('cli-filter-tipo');
    let debounceTimer;

    addGlobalListener(searchIn, 'input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => table.fetch(0), 400);
    });

    addGlobalListener(filterTipo, 'change', () => table.fetch(0));

    // 5. Inicializar Acciones Globales
    const modalNC = initClienteModal({
        onClienteCreado: () => table.fetch(0)
    });

    initActionButton({
        containerId: header ? header.primaryActionsId : 'clientes-action-container',
        label: 'Añadir Cliente',
        icon: 'bx bx-user-plus',
        onClick: () => modalNC.open()
    });

    // Carga inicial
    table.fetch(0);

    // Guardar cleanup para unmount
    mountCleanup = () => cleanups.forEach(fn => { try { fn(); } catch(e){} });
}

export function unmount() {
    if (mountCleanup) {
        mountCleanup();
        mountCleanup = null;
    }
}
