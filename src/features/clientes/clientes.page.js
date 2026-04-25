import { clientesTemplate } from './clientes.template.js';
import { api } from '../../core/api.js';
import { initTable } from '../../shared/components/table.js';

export function template() {
    return clientesTemplate();
}

export function mount(container) {
    const PAGE_SIZE = 15;
    let debounceTimer = null;
    let currentData = [];

    const AVATAR_COLORS = ['#1a8f3b','#2563eb','#9333ea','#ea580c','#0891b2','#d97706','#e11d48'];

    function getInitials(nombre) {
        return (nombre || '??').split(' ').slice(0,2).map(w => w[0]).join('').toUpperCase();
    }
    
    function getColor(id) {
        return AVATAR_COLORS[(id || 0) % AVATAR_COLORS.length];
    }

    function actualizarStats(clientes, total) {
        const totalEl = document.getElementById('cli-stat-total');
        if (totalEl) totalEl.textContent = total;
        
        const dniEl = document.getElementById('cli-stat-dni');
        if (dniEl) dniEl.textContent = clientes.filter(c => c.tipoDocumento === 'DNI').length + (total > PAGE_SIZE ? '+' : '');
        
        const emailEl = document.getElementById('cli-stat-email');
        if (emailEl) emailEl.textContent = clientes.filter(c => c.email).length + (total > PAGE_SIZE ? '+' : '');
        
        const telEl = document.getElementById('cli-stat-tel');
        if (telEl) telEl.textContent = clientes.filter(c => c.telefono).length + (total > PAGE_SIZE ? '+' : '');
    }

    const table = initTable({
        containerId: 'clientes-table-container',
        pageSize: PAGE_SIZE,
        columns: [
            { 
                key: 'nombre', 
                label: 'Nombre del Cliente',
                render: (v, c) => `
                    <div class='cli-profile-cell' style="display:flex; align-items:center; gap:12px;">
                        <div class='cli-avatar-gen' style='background:${getColor(c.clienteId || c.id)}; width:36px; height:36px; border-radius:50%; display:flex; align-items:center; justify-content:center; color:white; font-weight:700; font-size:12px;'>
                            ${getInitials(v)}
                        </div>
                        <div>
                            <strong style="color:#1e293b; display:block;">${v}</strong>
                            <span style='font-size:11px; color:#94a3b8;'>ID #${c.clienteId || c.id}</span>
                        </div>
                    </div>
                `
            },
            {
                key: 'documento',
                label: 'Documento',
                render: (v, c) => `
                    <div style='display:flex; flex-direction:column; gap:4px;'>
                        <span class="status-badge badge-gray" style="font-size:10px; padding:2px 8px;">${c.tipoDocumento || '—'}</span>
                        <span style='font-size:13px; font-weight:600; color:#334155;'>${v || '—'}</span>
                    </div>
                `
            },
            {
                key: 'contacto',
                label: 'Contacto',
                render: (_, c) => `
                    <div style='display:flex; flex-direction:column; gap:4px;'>
                        <div style="display:flex; align-items:center; gap:6px; font-size:12px; color:${c.email ? '#475569' : '#cbd5e1'};">
                            <i class='bx bx-envelope'></i> <span>${c.email || 'Sin email'}</span>
                        </div>
                        <div style="display:flex; align-items:center; gap:6px; font-size:12px; font-weight:600; color:${c.telefono ? '#1e293b' : '#cbd5e1'};">
                            <i class='bx bx-phone'></i> <span>${c.telefono || 'Sin teléfono'}</span>
                        </div>
                    </div>
                `
            }
        ],
        fetchData: async (page) => {
            const searchIn = document.getElementById('cli-search');
            const q = searchIn ? searchIn.value.trim() : '';
            const filterTipo = document.getElementById('cli-filter-tipo');
            const tipo = filterTipo ? filterTipo.value : '';

            let url = `/clientes?page=${page}&size=${PAGE_SIZE}&sort=nombre,asc`;
            if (q) url += `&nombre=${encodeURIComponent(q)}`;
            // Note: If the API doesn't support 'tipo' on server side, we might need local filtering, 
            // but for a reusable table it's better to use server-side. 
            // Assuming current API supports it or we'll refactor later.

            const data = await api.get(url);
            const items = Array.isArray(data) ? data : (data.content || []);
            const total = data.totalElements !== undefined ? data.totalElements : items.length;
            
            currentData = items;
            actualizarStats(items, total);
            return data;
        },
        actions: [
            { 
                label: 'Llamar', 
                icon: 'bx bxs-phone', 
                show: (c) => !!c.telefono, 
                onClick: (c) => window.open(`tel:${c.telefono}`) 
            },
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
                onClick: (c) => alert('Editar cliente: ' + c.nombre) 
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

    // Listeners for filters
    const searchIn = document.getElementById('cli-search');
    if (searchIn) {
        searchIn.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => table.fetch(0), 400);
        });
    }

    const filterTipo = document.getElementById('cli-filter-tipo');
    if (filterTipo) {
        filterTipo.addEventListener('change', () => table.fetch(0));
    }

    const btnRetry = document.getElementById('btn-cli-retry');
    if (btnRetry) btnRetry.addEventListener('click', () => table.fetch(0));

    const btnNuevo = document.getElementById('btn-nuevo-cliente');
    if (btnNuevo) btnNuevo.addEventListener('click', () => alert('Modal Nuevo Cliente'));

    // Initial load
    table.fetch(0);
}

export function unmount() {
    // Cleanup handled by Router if it calls unmount, 
    // but TableComponent also has a global listener we might want to clean.
}
