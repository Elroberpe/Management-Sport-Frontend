import { sucursalesTemplate } from './sucursales.template.js';
import { api } from '../../core/api.js';
import { Auth } from '../../core/auth.js';

export function template() {
    return sucursalesTemplate();
}

export function mount(container) {

    var BASE_URL = 'http://localhost:8080/api/v1';

    // Leer sesión para filtrar por rol
    var session = Auth ? Auth.getSession() : null;
    var isSuperAdmin = session && session.rol === 'superadmin';
    var sucursalFiltro = (!isSuperAdmin && session) ? session.sucursalId : null;

    /* ---- Servicio inline (sin import) ---- */
    var SucursalService = {
        listar: function (empresaId) {
            var url = BASE_URL + '/sucursales';
            if (empresaId) url += '?empresaId=' + empresaId;
            return fetch(url).then(function (res) {
                if (!res.ok) throw new Error('Error ' + res.status + ' al listar sucursales');
                return res.json();
            });
        },
        activar: function (id) {
            return fetch(BASE_URL + '/sucursales/' + id + '/activar', { method: 'PATCH' })
                .then(function (res) {
                    if (!res.ok) throw new Error('Error ' + res.status + ' al activar');
                    return res.json();
                });
        },
        desactivar: function (id) {
            return fetch(BASE_URL + '/sucursales/' + id + '/desactivar', { method: 'PATCH' })
                .then(function (res) {
                    if (!res.ok) throw new Error('Error ' + res.status + ' al desactivar');
                    return res.json();
                });
        },
        eliminar: function (id) {
            return fetch(BASE_URL + '/sucursales/' + id, { method: 'DELETE' })
                .then(function (res) {
                    if (res.status === 400) throw new Error('La sucursal tiene canchas asociadas.');
                    if (res.status === 404) throw new Error('Sucursal no encontrada.');
                    if (!res.ok) throw new Error('Error ' + res.status + ' al eliminar');
                });
        }
    };

    /* ---- Referencias DOM ---- */
    var grid         = document.getElementById('sedes-grid');
    var loading      = document.getElementById('sedes-loading');
    var errorBox     = document.getElementById('sedes-error');
    var errorMsg     = document.getElementById('sedes-error-msg');
    var btnRetry     = document.getElementById('btn-retry');
    var cardAdd      = document.getElementById('card-add-sede');
    var statTotal    = document.getElementById('stat-total');
    var statActivas  = document.getElementById('stat-activas');
    var statInact    = document.getElementById('stat-inactivas');

    var COLORS = ['#1a8f3b','#2563eb','#9333ea','#ea580c','#0891b2','#d97706'];

    function getInitials(nombre) {
        return nombre.split(' ').slice(0, 2).map(function (w) { return w[0]; }).join('').toUpperCase();
    }
    function getColor(id) { return COLORS[id % COLORS.length]; }

    function buildCard(s) {
        var color    = getColor(s.sucursalId);
        var initials = getInitials(s.nombre);
        var activo   = s.activo;

        var card = document.createElement('div');
        card.className = 'branch-card' + (activo ? '' : ' inactive');
        card.dataset.id = s.sucursalId;

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
                            "<input type='checkbox' class='sede-toggle' data-id='" + s.sucursalId + "'" + (activo ? ' checked' : '') + ">",
                            "<span class='slider'></span>",
                        "</label>",
                        "<span class='bc-toggle-label" + (activo ? '' : ' offline') + "'>" + (activo ? 'ACTIVO' : 'INACTIVO') + "</span>",
                    "</div>",
                "</div>",
                "<div class='bc-actions'>",
                    "<div class='action-buttons-group'>",
                        "<button class='icon-btn btn-edit-sede' data-id='" + s.sucursalId + "' title='Editar'><i class='bx bx-pencil'></i></button>",
                        "<button class='icon-btn btn-delete-sede' data-id='" + s.sucursalId + "' title='Eliminar'><i class='bx bx-trash'></i></button>",
                    "</div>",
                    "<button class='btn-text-arrow" + (activo ? '' : ' text-muted') + "'>Ver Canchas <i class='bx bx-right-arrow-alt'></i></button>",
                "</div>",
            "</div>"
        ].join('');

        return card;
    }

    function updateStats(sucursales) {
        var activas = sucursales.filter(function (s) { return s.activo; }).length;
        statTotal.textContent   = sucursales.length;
        statActivas.textContent = activas;
        statInact.textContent   = sucursales.length - activas;
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

    btnRetry.addEventListener('click', cargarSucursales);
    cargarSucursales();

}

export function unmount() {
    // Cleanup event listeners if needed
}
