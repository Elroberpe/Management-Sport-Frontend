import { canchasTemplate, canchasNewFormTemplate, canchasEditFormTemplate, canchasMantenimientoFormTemplate } from './canchas.template.js';
import { api } from '../../core/api.js';
import { Auth } from '../../core/auth.js';
import { Store } from '../../core/store.js';
import { initTable } from '../../shared/components/table.js';
import { initStats } from '../../shared/components/stats.js';
import { initActionButton } from '../../shared/components/action-button.js';
import { initModalShell } from '../../shared/components/modal-shell.js';

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

    const stats = initStats('canchas-stats-container', [
        { id: 'total', label: 'Total Canchas', icon: 'bx bx-football', colorClass: 'gray' },
        { id: 'disponibles', label: 'Disponibles', icon: 'bx bx-check-circle', colorClass: 'green' },
        { id: 'mantenimiento', label: 'Mantenimiento', icon: 'bx bx-wrench', colorClass: 'yellow' },
        { id: 'inactivas', label: 'Inactivas', icon: 'bx bx-block', colorClass: 'red' }
    ]);

    function statsActualizar(canchas) {
        if (!stats) return;
        stats.updateAll({
            total: canchas.length,
            disponibles: canchas.filter(c => c.estadoCancha === 'DISPONIBLE').length,
            mantenimiento: canchas.filter(c => c.estadoCancha === 'MANTENIMIENTO').length,
            inactivas: canchas.filter(c => c.estadoCancha === 'INACTIVA').length
        });
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
            card.querySelector('.btn-edit').onclick = () => abrirModalEditar(c.canchaId || c.id);
            grillaIn.appendChild(card);
        });
    }

    /* ---- Inicializar Tabla ---- */
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
            const query = searchIn.value.toLowerCase();
            const estado = filterEs.value;
            
            let url = `/canchas?page=${page}&size=20`;
            if (sucursalFiltro) url += `&sucursalId=${sucursalFiltro}`;
            if (estado) url += `&estadoCancha=${estado}`;
            
            const data = await api.get(url);
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
            { label: 'Mantenimiento', icon: 'bx bx-wrench', onClick: (c) => abrirModalMant(c.canchaId || c.id, c.nombre) },
            { label: 'Editar', icon: 'bx bx-pencil', onClick: (c) => abrirModalEditar(c.canchaId || c.id) },
            { 
                label: 'Eliminar', 
                icon: 'bx bx-trash', 
                class: 'danger', 
                onClick: (c) => {
                    if (confirm(`¿Estás seguro de eliminar la cancha "${c.nombre}"?`)) {
                        api.delete(`/canchas/${c.canchaId || c.id}`)
                            .then(() => {
                                table.fetch(0);
                                if (modalNC) modalNC.showToast('Cancha eliminada correctamente');
                            })
                            .catch(err => alert('Error: ' + err.message));
                    }
                } 
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

    /* ========================================
       MODALES Y FUNCIONALIDAD ADICIONAL
    ======================================== */
    
    /* ========================================
       MODALES ESTANDARIZADOS
    ======================================== */

    // --- 1. MODAL NUEVA CANCHA ---
    const modalNC = initModalShell({
        id: 'modal-nueva-cancha',
        title: 'Nueva Cancha',
        subtitle: 'Registra una nueva cancha para tus sucursales',
        icon: 'bx bx-football',
        confirmText: 'Crear Cancha',
        contentHtml: canchasNewFormTemplate(),
        onConfirm: async (ctx) => {
            const sid = document.getElementById('nc-sucursal').value;
            const nom = document.getElementById('nc-nombre').value.trim();
            const pre = document.getElementById('nc-precio').value;

            if (!sid) return ctx.showFieldError('nc-sucursal', 'Selecciona una sede');
            if (!nom) return ctx.showFieldError('nc-nombre', 'El nombre es obligatorio');
            if (!pre) return ctx.showFieldError('nc-precio', 'El precio es obligatorio');

            ctx.setLoading(true);
            try {
                await api.post('/canchas', { sucursalId: parseInt(sid), nombre: nom, precioHora: parseFloat(pre) });
                ctx.showToast('Cancha creada con éxito');
                ctx.close();
                table.fetch(0);
            } catch (err) {
                ctx.setLoading(false);
                ctx.showError(err.message || 'Error al crear la cancha');
            }
        }
    });

    initActionButton({
        containerId: 'canchas-action-container',
        label: 'Nueva Cancha',
        icon: 'bx bx-plus',
        onClick: () => {
            modalNC.open();
            cargarSucursalesDropdown('nc-sucursal');
        }
    });

    function cargarSucursalesDropdown(selectId) {
        const el = document.getElementById(selectId);
        if (!el) return;
        el.innerHTML = '<option value="">Cargando...</option>';
        api.get('/sucursales').then(sucursales => {
            el.innerHTML = '<option value="">— Seleccionar Sucursal —</option>';
            sucursales.forEach(s => {
                const opt = document.createElement('option');
                opt.value = s.sucursalId || s.id;
                opt.textContent = s.nombre;
                if (sucursalFiltro && opt.value == sucursalFiltro) opt.selected = true;
                el.appendChild(opt);
            });
        });
    }

    // --- 2. MODAL EDITAR CANCHA ---
    let editingId = null;
    const modalEC = initModalShell({
        id: 'modal-edit-cancha',
        title: 'Editar Cancha',
        subtitle: 'Modifica los detalles de la cancha seleccionada',
        icon: 'bx bx-pencil',
        confirmText: 'Guardar Cambios',
        contentHtml: canchasEditFormTemplate(),
        onConfirm: async (ctx) => {
            const nom = document.getElementById('ec-nombre').value.trim();
            const pre = document.getElementById('ec-precio').value;

            if (!nom) return ctx.showFieldError('ec-nombre', 'El nombre es obligatorio');
            if (!pre) return ctx.showFieldError('ec-precio', 'El precio es obligatorio');

            ctx.setLoading(true);
            try {
                await api.put(`/canchas/${editingId}`, { nombre: nom, precioHora: parseFloat(pre) });
                ctx.showToast('Cancha actualizada');
                ctx.close();
                table.fetch(0);
            } catch (err) {
                ctx.setLoading(false);
                ctx.showError(err.message || 'Error al actualizar');
            }
        }
    });

    function abrirModalEditar(id) {
        editingId = id;
        api.get(`/canchas/${id}`).then(c => {
            const inSuc = document.getElementById('ec-sucursal');
            const inNom = document.getElementById('ec-nombre');
            const inPre = document.getElementById('ec-precio');
            if (inSuc) inSuc.value = c.sucursalNombre || `Sede ${c.sucursalId}`;
            if (inNom) inNom.value = c.nombre;
            if (inPre) inPre.value = c.precioHora;
            modalEC.open();
        });
    }

    // --- 3. MODAL MANTENIMIENTO ---
    let mantCanchaId = null;
    const modalMant = initModalShell({
        id: 'modal-mantenimiento',
        title: 'Programar Mantenimiento',
        icon: 'bx bx-wrench',
        confirmText: 'Programar',
        contentHtml: canchasMantenimientoFormTemplate(),
        onConfirm: async (ctx) => {
            const ini = document.getElementById('pm-inicio').value;
            const fin = document.getElementById('pm-fin').value;
            const tip = document.getElementById('pm-tipo').value;
            const mot = document.getElementById('pm-motivo').value.trim();

            if (!ini) return ctx.showFieldError('pm-inicio', 'Requerido');
            if (!fin) return ctx.showFieldError('pm-fin', 'Requerido');
            if (!tip) return ctx.showFieldError('pm-tipo', 'Requerido');
            if (!mot) return ctx.showFieldError('pm-motivo', 'Requerido');

            ctx.setLoading(true);
            try {
                const payload = {
                    canchaId: mantCanchaId,
                    horaInicio: ini + ':00',
                    horaFin: fin + ':00',
                    tipoMantenimiento: tip,
                    motivo: mot
                };
                await api.post('/mantenimientos', payload);
                ctx.showToast('Mantenimiento programado');
                ctx.close();
                table.fetch(0);
            } catch (err) {
                ctx.setLoading(false);
                ctx.showError(err.message || 'Error al programar');
            }
        }
    });

    function abrirModalMant(id, nombre) {
        mantCanchaId = id;
        modalMant.open();
        // Personalizar subtítulo dinámicamente si es posible, o simplemente confiar en el shell
    }

    // Initial load
    setVista('tabla');

    /* ========================================
       QUICK SCHEDULE LOGIC (RESTORATION)
    ======================================== */
    function initQuickSchedule() {
        let currentWeekStart = new Date();
        const day = currentWeekStart.getDay();
        const diff = currentWeekStart.getDate() - day + (day === 0 ? -6 : 1);
        currentWeekStart.setDate(diff);
        currentWeekStart.setHours(0, 0, 0, 0);

        const label = document.getElementById('qs-week-label');
        const container = document.getElementById('qs-days-container');
        const btnPrev = document.getElementById('btn-qs-prev');
        const btnNext = document.getElementById('btn-qs-next');

        if (!label || !container) return;

        async function updateQS() {
            container.innerHTML = `
                <div style="width: 100%; text-align: center; padding: 30px; color: #94a3b8; font-size: 14px;">
                    <div class="table-spinner"></div><br>Cargando disponibilidad...
                </div>
            `;

            const weekEnd = new Date(currentWeekStart);
            weekEnd.setDate(weekEnd.getDate() + 6);
            weekEnd.setHours(23, 59, 59, 999);

            const format = (d) => d.toISOString().split('T')[0];
            label.textContent = `${currentWeekStart.getDate()} ${currentWeekStart.toLocaleString('es-ES', { month: 'short' })} - ${weekEnd.getDate()} ${weekEnd.toLocaleString('es-ES', { month: 'short' })}`;

            try {
                // Obtener reservas de la semana para esta sede
                let url = `/reservas?fechaDesde=${format(currentWeekStart)}&fechaHasta=${format(weekEnd)}`;
                if (sucursalFiltro) url += `&sucursalId=${sucursalFiltro}`;
                
                const data = await api.get(url);
                const res = Array.isArray(data) ? data : (data.content || []);

                // Agrupar por día
                const days = [];
                for (let i = 0; i < 7; i++) {
                    const d = new Date(currentWeekStart);
                    d.setDate(d.getDate() + i);
                    const dayStr = format(d);
                    const dayRes = res.filter(r => r.fecha === dayStr);
                    
                    // Cálculo de ocupación (Estimado: 15 horas operativas x número de canchas)
                    const totalCanchas = todasCanchas.length || 1;
                    const totalSlots = totalCanchas * 15; 
                    const occupancy = Math.min(Math.round((dayRes.length / totalSlots) * 100), 100);

                    days.push({
                        date: d,
                        count: dayRes.length,
                        occupancy
                    });
                }

                container.innerHTML = days.map(d => `
                    <div class="qs-day-card" style="background:white; border:1px solid #e2e8f0; border-radius:12px; padding:16px; display:flex; flex-direction:column; gap:8px;">
                        <div style="display:flex; justify-content:space-between; align-items:start;">
                            <div>
                                <div style="font-size:11px; font-weight:700; color:#94a3b8; text-transform:uppercase;">${d.date.toLocaleString('es-ES', { weekday: 'short' })}</div>
                                <div style="font-size:16px; font-weight:700; color:#1e293b;">${d.date.getDate()}</div>
                            </div>
                            <div style="background:#f1f5f9; padding:4px 8px; border-radius:6px; font-size:11px; font-weight:700; color:#475569;">${d.count} Res.</div>
                        </div>
                        <div style="margin-top:4px;">
                            <div style="display:flex; justify-content:space-between; font-size:10px; font-weight:700; color:#64748b; margin-bottom:4px;">
                                <span>Ocupación</span>
                                <span>${d.occupancy}%</span>
                            </div>
                            <div style="height:6px; background:#f1f5f9; border-radius:3px; overflow:hidden;">
                                <div style="width:${d.occupancy}%; height:100%; background:${d.occupancy > 80 ? '#ef4444' : (d.occupancy > 50 ? '#f59e0b' : '#10b981')}; transition:width 0.5s ease;"></div>
                            </div>
                        </div>
                    </div>
                `).join('');

                // Inyectar CSS de la grilla si no existe
                container.style.display = 'grid';
                container.style.gridTemplateColumns = 'repeat(7, 1fr)';
                container.style.gap = '12px';

            } catch (err) {
                console.error('Error en QS:', err);
                container.innerHTML = `<div style="padding:20px; color:#ef4444; text-align:center;">Error al cargar disponibilidad</div>`;
            }
        }

        btnPrev.onclick = () => { currentWeekStart.setDate(currentWeekStart.getDate() - 7); updateQS(); };
        btnNext.onclick = () => { currentWeekStart.setDate(currentWeekStart.getDate() + 7); updateQS(); };

        updateQS();
    }

    initQuickSchedule();
}

export function unmount() {}
