import { canchasTemplate } from './canchas.template.js';
import { api } from '../../core/api.js';
import { Auth } from '../../core/auth.js';
import { Store } from '../../core/store.js';
import { initTable } from '../../shared/components/table.js';

export function template() {
    return canchasTemplate();
}

export function mount(container) {
    const session = Auth ? Auth.getSession() : null;
    const sedeActiva = (session && session.rol === 'superadmin')
        ? Store.getSucursal()
        : (session ? { sucursalId: session.sucursalId, nombre: session.sucursalNombre } : null);
    const sucursalFiltro = sedeActiva ? sedeActiva.sucursalId : null;

    const subtitleEl = document.getElementById('canchas-subtitle');
    if (subtitleEl && sedeActiva && sedeActiva.nombre) {
        subtitleEl.innerHTML = `Configura y monitorea las canchas de <span style="font-weight:700;color:var(--primary);">${sedeActiva.nombre}</span>.`;
    }

    /* ---- Refs DOM ---- */
    const grilla = document.getElementById('canchas-grilla');
    const grillaIn = document.getElementById('canchas-grilla-inner');
    const searchIn = document.getElementById('canchas-search');
    const filterEs = document.getElementById('canchas-filter-estado');
    const btnTabla = document.getElementById('btn-view-tabla');
    const btnGrilla = document.getElementById('btn-view-grilla');

    const COLORS = ['#1a8f3b','#2563eb','#9333ea','#ea580c','#0891b2','#d97706','#e11d48'];
    let vistaActual = 'tabla';
    let todasCanchas = [];

    const ESTADO_META = {
        DISPONIBLE:    { cls: 'green',  dotCls: 'green',  label: 'Disponible',    badgeCls: 'badge-green' },
        MANTENIMIENTO: { cls: 'yellow', dotCls: 'yellow', label: 'Mantenimiento', badgeCls: 'badge-yellow' },
        INACTIVA:      { cls: 'gray',   dotCls: 'gray',   label: 'Inactiva',      badgeCls: 'badge-gray' },
    };

    function statsActualizar(canchas) {
        const total = canchas.length;
        document.getElementById('stat-total').textContent = total;
        document.getElementById('stat-disponibles').textContent = canchas.filter(c => c.estadoCancha === 'DISPONIBLE').length;
        document.getElementById('stat-mantenimiento').textContent = canchas.filter(c => c.estadoCancha === 'MANTENIMIENTO').length;
        document.getElementById('stat-inactivas').textContent = canchas.filter(c => c.estadoCancha === 'INACTIVA').length;
    }

    /* ---- Vista Grilla Renderer ---- */
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
                    <div style="display:flex; gap:4px;">
                         <button class="btn-edit" style="width:32px; height:32px; border-radius:6px; border:1px solid #e2e8f0; background:white; color:#64748b;"><i class='bx bx-pencil'></i></button>
                    </div>
                </div>
            `;
            card.querySelector('.btn-edit').onclick = () => alert('Editar cancha: ' + c.id);
            grillaIn.appendChild(card);
        });
    }

    /* ---- Inicializar Tabla ---- */
    const table = initTable({
        containerId: 'canchas-table-container',
        pageSize: 20,
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
            const query = searchIn.value.toLowerCase();
            const estado = filterEs.value;
            
            // Si no hay filtro por sucursal, la API devuelve todo. 
            // Para canchas usualmente no hay miles, así que cargamos todo y paginamos localmente si es necesario, 
            // pero para mantener el patrón usamos la API si soporta size/page.
            let url = `/canchas?page=${page}&size=20`;
            if (sucursalFiltro) url += `&sucursalId=${sucursalFiltro}`;
            if (estado) url += `&estadoCancha=${estado}`;
            
            const data = await api.get(url);
            // La API de canchas actual parece devolver un Array plano. 
            // Si es así, simulamos la respuesta paginada para el componente.
            if (Array.isArray(data)) {
                todasCanchas = data;
                const filtered = data.filter(c => !query || c.nombre.toLowerCase().includes(query));
                statsActualizar(data);
                
                if (vistaActual === 'grilla') renderGrilla(filtered);
                
                return {
                    content: filtered.slice(page * 20, (page + 1) * 20),
                    totalPages: Math.ceil(filtered.length / 20),
                    totalElements: filtered.length,
                    number: page
                };
            }
            
            statsActualizar(data.content || []);
            if (vistaActual === 'grilla') renderGrilla(data.content || []);
            return data;
        },
        actions: [
            { label: 'Mantenimiento', icon: 'bx bx-wrench', onClick: (c) => alert('Programar mantenimiento: ' + c.nombre) },
            { label: 'Editar', icon: 'bx bx-pencil', onClick: (c) => alert('Editar: ' + c.nombre) },
            { 
                label: 'Desactivar', 
                icon: 'bx bx-power-off', 
                class: 'danger', 
                show: (c) => c.estadoCancha === 'DISPONIBLE',
                onClick: (c) => alert('Desactivar: ' + c.nombre) 
            }
        ]
    });

    /* ---- Manejo de Vistas ---- */
    function setVista(vista) {
        vistaActual = vista;
        if (vista === 'tabla') {
            btnTabla.classList.add('active');
            btnGrilla.classList.remove('active');
            grilla.style.display = 'none';
            document.getElementById('canchas-table-container').style.display = 'block';
        } else {
            btnGrilla.classList.add('active');
            btnTabla.classList.remove('active');
            grilla.style.display = 'block';
            document.getElementById('canchas-table-container').style.display = 'none';
        }
        table.fetch(0);
    }

    btnTabla.onclick = () => setVista('tabla');
    btnGrilla.onclick = () => setVista('grilla');
    searchIn.oninput = () => table.fetch(0);
    filterEs.onchange = () => table.fetch(0);

    const btnRetry = document.getElementById('btn-canchas-retry');
    if (btnRetry) btnRetry.onclick = () => table.fetch(0);

    // Initial load
    setVista('tabla');
}

export function unmount() {}
