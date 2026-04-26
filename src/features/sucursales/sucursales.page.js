import { sucursalesTemplate, sucursalNewFormTemplate, sucursalEditFormTemplate } from './sucursales.template.js';
import { SucursalService } from './sucursales.service.js';
import { createBranchCard } from './sucursales.components.js';
import { Auth } from '../../core/auth.js';
import { Store } from '../../core/store.js';
import { initActionButton } from '../../shared/components/action-button.js';
import { initModalShell } from '../../shared/components/modal-shell.js';
import { initStats } from '../../shared/components/stats.js';

export function template() {
    return sucursalesTemplate();
}

export function mount(container) {
    /* ---- Referencias DOM ---- */
    const grid = document.getElementById('sedes-grid');
    const loading = document.getElementById('sedes-loading');
    const errorBox = document.getElementById('sedes-error');
    const errorMsg = document.getElementById('sedes-error-msg');
    const btnRetry = document.getElementById('btn-retry');
    const cardAdd = document.getElementById('card-add-sede');

    let _editSedeId = null;
    const session = Auth ? Auth.getSession() : null;
    const isSuperAdmin = session && session.rol === 'superadmin';
    const sucursalFiltro = (!isSuperAdmin && session) ? session.sucursalId : null;

    /* ---- Inicialización de Componentes ---- */
    const stats = initStats('sucursales-stats-container', [
        { id: 'total', label: 'TOTAL SEDES', value: '—', icon: 'bx bx-building-house', colorClass: 'gray' },
        { id: 'activas', label: 'ACTIVAS', value: '—', icon: 'bx bx-check-circle', colorClass: 'green' },
        { id: 'inactivas', label: 'INACTIVAS', value: '—', icon: 'bx bx-block', colorClass: 'red' }
    ]);

    /* ---- Event Handlers ---- */
    const handleToggleActivo = async (id, isChecked, event) => {
        const fn = isChecked ? SucursalService.activar : SucursalService.desactivar;
        try {
            await fn(id);
            cargarSucursales();
        } catch (err) {
            alert(`Error: ${err.message}`);
            event.target.checked = !isChecked; // Revert change
        }
    };

    const handleEdit = (id) => abrirModalEditar(id);

    const handleDelete = async (id) => {
        if (!confirm('¿Seguro que deseas eliminar esta sede?')) return;
        try {
            await SucursalService.eliminar(id);
            cargarSucursales();
        } catch (err) {
            alert(`No se puede eliminar: ${err.message}`);
        }
    };

    const handleEnterSede = (id, nombre) => {
        Store.setSucursal({ sucursalId: id, nombre: nombre });
        window.location.hash = '#/dashboard/reservas';
    };

    /* ---- UI Updates ---- */
    function updateStats(sucursales) {
        const activas = sucursales.filter(s => s.activo).length;
        stats.updateAll({
            total: sucursales.length,
            activas: activas,
            inactivas: sucursales.length - activas
        });
    }

    async function cargarSucursales() {
        loading.style.display = 'flex';
        errorBox.style.display = 'none';
        grid.style.display = 'none';

        // Limpiar cards previas
        grid.querySelectorAll('.branch-card, .branch-card.inactive').forEach(c => c.remove());
        grid.querySelectorAll('.empty-message').forEach(m => m.remove());

        try {
            const sucursales = await SucursalService.listar(sucursalFiltro);
            updateStats(sucursales);

            if (sucursales.length === 0) {
                const empty = document.createElement('p');
                empty.className = 'empty-message';
                empty.style.cssText = 'grid-column:1/-1;text-align:center;color:var(--text-muted);padding:40px 0;';
                empty.textContent = 'No hay sucursales registradas aún.';
                grid.insertBefore(empty, cardAdd);
            } else {
                sucursales.forEach(s => {
                    const card = createBranchCard(s, {
                        onToggle: handleToggleActivo,
                        onEdit: handleEdit,
                        onDelete: handleDelete,
                        onEnter: handleEnterSede
                    });
                    grid.insertBefore(card, cardAdd);
                });
            }

            loading.style.display = 'none';
            grid.style.display = '';
        } catch (err) {
            loading.style.display = 'none';
            errorMsg.textContent = `No se pudo conectar con el servidor. (${err.message})`;
            errorBox.style.display = 'flex';
        }
    }

    /* ---- Modales ---- */
    const modalNS = initModalShell({
        id: 'modal-nueva-sede',
        title: 'Nueva Sede',
        subtitle: 'Registra una nueva sucursal para tu empresa',
        icon: 'bx bx-map-pin',
        confirmText: 'Crear Sede',
        contentHtml: sucursalNewFormTemplate(),
        onConfirm: async (ctx) => {
            const nom = document.getElementById('ns-nombre').value.trim();
            const dir = document.getElementById('ns-direccion').value.trim();
            const tel = document.getElementById('ns-telefono').value.trim();

            if (!nom) return ctx.showFieldError('ns-nombre', 'El nombre es obligatorio.');
            if (!dir) return ctx.showFieldError('ns-direccion', 'La dirección es obligatoria.');

            ctx.setLoading(true);
            try {
                await SucursalService.crear({ empresaId: 1, nombre: nom, direccion: dir, telefono: tel });
                ctx.showToast(`Sede "${nom}" creada con éxito.`);
                ctx.close();
                cargarSucursales();
            } catch (err) {
                ctx.setLoading(false);
                ctx.showError(err.message || 'Error al conectar con el servidor.');
            }
        }
    });

    const modalES = initModalShell({
        id: 'modal-edit-sede',
        title: 'Editar Sede',
        subtitle: 'Modifica los datos de la sucursal seleccionada',
        icon: 'bx bx-edit-alt',
        confirmText: 'Guardar Cambios',
        contentHtml: sucursalEditFormTemplate(),
        onConfirm: async (ctx) => {
            const nom = document.getElementById('es-nombre').value.trim();
            const dir = document.getElementById('es-direccion').value.trim();
            const tel = document.getElementById('es-telefono').value.trim();

            if (!nom) return ctx.showFieldError('es-nombre', 'El nombre es obligatorio.');
            if (!dir) return ctx.showFieldError('es-direccion', 'La dirección es obligatoria.');

            ctx.setLoading(true);
            try {
                await SucursalService.actualizar(_editSedeId, { nombre: nom, direccion: dir, telefono: tel });
                ctx.showToast('Sede actualizada con éxito.');
                ctx.close();
                cargarSucursales();
            } catch (err) {
                ctx.setLoading(false);
                ctx.showError(err.message || 'Error al actualizar.');
            }
        }
    });

    async function abrirModalEditar(id) {
        _editSedeId = id;
        modalES.open();

        const inEmp = document.getElementById('es-empresa');
        const inEst = document.getElementById('es-estado');
        const inNom = document.getElementById('es-nombre');
        const inDir = document.getElementById('es-direccion');
        const inTel = document.getElementById('es-telefono');

        inEmp.value = 'Cargando...';
        inEst.value = 'Cargando...';

        try {
            const s = await SucursalService.obtener(id);
            inEmp.value = 'El Pelotero'; // Mocking empresa name or getting it from s if available
            inEst.value = s.activo ? 'Activa' : 'Inactiva';
            inNom.value = s.nombre || '';
            inDir.value = s.direccion || '';
            inTel.value = s.telefono || '';
        } catch (err) {
            console.error('Error al cargar datos de la sede:', err);
        }
    }

    /* ---- Inicialización ---- */
    initActionButton({
        containerId: 'sucursales-action-container',
        label: 'Añadir Nueva Sede',
        icon: 'bx bx-plus',
        onClick: () => modalNS.open()
    });

    cardAdd.onclick = () => modalNS.open();
    btnRetry.onclick = () => cargarSucursales();

    cargarSucursales();
}

export function unmount() {
    // Cleanup event listeners if needed
}
