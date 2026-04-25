import { sucursalesTemplate, sucursalNewFormTemplate, sucursalEditFormTemplate } from './sucursales.template.js';
import { api } from '../../core/api.js';
import { Auth } from '../../core/auth.js';
import { Store } from '../../core/store.js';
import { initActionButton } from '../../shared/components/action-button.js';
import { initModalShell } from '../../shared/components/modal-shell.js';

export function template() {
    return sucursalesTemplate();
}

export function mount(container) {

    const SucursalService = {
        listar: (empresaId) => api.get(`/sucursales${empresaId ? '?empresaId='+empresaId : ''}`),
        activar: (id) => api.patch(`/sucursales/${id}/activar`),
        desactivar: (id) => api.patch(`/sucursales/${id}/desactivar`),
        eliminar: (id) => api.delete(`/sucursales/${id}`),
        crear: (payload) => api.post('/sucursales', payload),
        obtener: (id) => api.get(`/sucursales/${id}`),
        actualizar: (id, payload) => api.put(`/sucursales/${id}`, payload)
    };

    /* ---- Referencias DOM ---- */
    /* ---- Referencias DOM ---- */
    const grid      = document.getElementById('sedes-grid');
    const loading   = document.getElementById('sedes-loading');
    const errorBox  = document.getElementById('sedes-error');
    const errorMsg  = document.getElementById('sedes-error-msg');
    const btnRetry  = document.getElementById('btn-retry');
    const cardAdd   = document.getElementById('card-add-sede');
    const statTotal = document.getElementById('stat-total');
    const statAct   = document.getElementById('stat-activas');
    const statInact = document.getElementById('stat-inactivas');

    let _editSedeId = null;
    const session = Auth ? Auth.getSession() : null;
    const isSuperAdmin = session && session.rol === 'superadmin';
    const sucursalFiltro = (!isSuperAdmin && session) ? session.sucursalId : null;

    var COLORS = ['#1a8f3b','#2563eb','#9333ea','#ea580c','#0891b2','#d97706'];

    function getInitials(nombre) {
        return nombre.split(' ').slice(0, 2).map(function (w) { return w[0]; }).join('').toUpperCase();
    }
    function getColor(id) { return COLORS[id % COLORS.length]; }

    function buildCard(s) {
        var sid      = s.sucursalId !== undefined ? s.sucursalId : s.id;
        var color    = getColor(sid);
        var initials = getInitials(s.nombre);
        var activo   = s.activo;

        var card = document.createElement('div');
        card.className = 'branch-card' + (activo ? '' : ' inactive');
        card.dataset.id = sid;

        var phoneHTML = s.telefono
            ? "<p class='bc-phone'><i class='bx bx-phone'></i> " + s.telefono + "</p>"
            : '';

        card.innerHTML = [
            "<div class='bc-image' style='background:" + color + "20;display:flex;align-items:center;justify-content:center;min-height:120px;'>",
                "<div style='width:72px;height:72px;border-radius:50%;background:" + color + ";display:flex;align-items:center;justify-content:center;font-size:26px;font-weight:800;color:#fff;'>",
                    initials,
                "</div>",
                "<span class='bc-badge " + (activo ? 'success' : 'gray') + "'>" + (activo ? '• ACTIVO' : '• INACTIVO') + "</span>",
            "</div>",
            "<div class='bc-content'>",
                "<div class='bc-header'>",
                    "<div>",
                        "<h3>" + s.nombre + "</h3>",
                        "<p class='bc-location'><i class='bx bx-map pin-icon'></i> " + s.direccion + "</p>",
                        phoneHTML,
                    "</div>",
                    "<div class='bc-toggle-wrap'>",
                        "<label class='toggle-switch'>",
                            "<input type='checkbox' class='sede-toggle' data-id='" + sid + "'" + (activo ? ' checked' : '') + ">",
                            "<span class='slider'></span>",
                        "</label>",
                        "<span class='bc-toggle-label" + (activo ? '' : ' offline') + "'>" + (activo ? 'ACTIVO' : 'INACTIVO') + "</span>",
                    "</div>",
                "</div>",
                "<div class='bc-actions'>",
                    "<div class='action-buttons-group'>",
                        "<button class='icon-btn btn-edit-sede' data-id='" + sid + "' title='Editar'><i class='bx bx-pencil'></i></button>",
                        "<button class='icon-btn btn-delete-sede' data-id='" + sid + "' title='Eliminar'><i class='bx bx-trash'></i></button>",
                    "</div>",
                    "<button class='btn-text-arrow btn-ingresar-sede" + (activo ? '' : ' text-muted') + "' data-id='" + sid + "' data-nombre='" + s.nombre + "'>Ingresar a Sede <i class='bx bx-right-arrow-alt'></i></button>",
                "</div>",
            "</div>"
        ].join('');

        return card;
    }

    function updateStats(sucursales) {
        const activas = sucursales.filter(s => s.activo).length;
        statTotal.textContent = sucursales.length;
        statAct.textContent   = activas;
        statInact.textContent = sucursales.length - activas;
    }

    function bindEvents() {
        /* Toggle activo/inactivo */
        grid.querySelectorAll('.sede-toggle').forEach(function (toggle) {
            toggle.addEventListener('change', function (e) {
                var id  = e.target.dataset.id;
                var fn  = e.target.checked ? SucursalService.activar : SucursalService.desactivar;
                fn(id).then(function () {
                    cargarSucursales();
                }).catch(function (err) {
                    alert('Error: ' + err.message);
                    e.target.checked = !e.target.checked;
                });
            });
        });

        /* Editar */
        grid.querySelectorAll('.btn-edit-sede').forEach(function (btn) {
            btn.addEventListener('click', function () {
                abrirModalEditar(btn.dataset.id);
            });
        });

        /* Eliminar */
        grid.querySelectorAll('.btn-delete-sede').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var id = btn.dataset.id;
                if (!confirm('¿Seguro que deseas eliminar esta sede?')) return;
                SucursalService.eliminar(id).then(function () {
                    cargarSucursales();
                }).catch(function (err) {
                    alert('No se puede eliminar: ' + err.message);
                });
            });
        });

        /* Ingresar a Sede */
        grid.querySelectorAll('.btn-ingresar-sede').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var id = btn.dataset.id;
                var nombre = btn.dataset.nombre;
                Store.setSucursal({ sucursalId: id, nombre: nombre });
                window.location.hash = '#/dashboard/reservas';
            });
        });
    }

    function cargarSucursales() {
        /* Reset UI */
        loading.style.display  = 'flex';
        errorBox.style.display = 'none';
        grid.style.display     = 'none';

        /* Limpiar cards previas (mantener la tarjeta "Añadir") */
        grid.querySelectorAll('.branch-card, .branch-card.inactive').forEach(function (c) { c.remove(); });

        SucursalService.listar(sucursalFiltro).then(function (sucursales) {
            updateStats(sucursales);

            if (sucursales.length === 0) {
                /* Sin sucursales todavía */
                var empty = document.createElement('p');
                empty.style.cssText = 'grid-column:1/-1;text-align:center;color:var(--text-muted);padding:40px 0;';
                empty.textContent = 'No hay sucursales registradas aún.';
                grid.insertBefore(empty, cardAdd);
            } else {
                sucursales.forEach(function (s) {
                    grid.insertBefore(buildCard(s), cardAdd);
                });
            }

            bindEvents();
            loading.style.display = 'none';
            grid.style.display    = '';

        }).catch(function (err) {
            loading.style.display  = 'none';
            errorMsg.textContent   = 'No se pudo conectar con el servidor. (' + err.message + ')';
            errorBox.style.display = 'flex';
        });
    }

    /* ========================================
       MODALES ESTANDARIZADOS (SHELL)
    ======================================== */

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

    function abrirModalEditar(id) {
        _editSedeId = id;
        modalES.open();
        // Cargar datos
        const inEmp = document.getElementById('es-empresa');
        const inEst = document.getElementById('es-estado');
        const inNom = document.getElementById('es-nombre');
        const inDir = document.getElementById('es-direccion');
        const inTel = document.getElementById('es-telefono');

        inEmp.value = 'Cargando...';
        inEst.value = 'Cargando...';

        SucursalService.obtener(id).then(s => {
            inEmp.value = 'El Pelotero';
            inEst.value = s.activo ? 'Activa' : 'Inactiva';
            inNom.value = s.nombre || '';
            inDir.value = s.direccion || '';
            inTel.value = s.telefono || '';
        });
    }

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
