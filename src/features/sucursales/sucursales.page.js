import { sucursalesTemplate } from './sucursales.template.js';
import { api } from '../../core/api.js';
import { Auth } from '../../core/auth.js';
import { Store } from '../../core/store.js';
import { initActionButton } from '../../shared/components/action-button.js';

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
        },
        crear: function (payload) {
            return fetch(BASE_URL + '/sucursales', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            }).then(function (res) {
                if (res.status === 201) return res.json();
                if (res.status === 400) {
                    return res.json().then(function (err) {
                        throw new Error(err.message || 'Error de validación');
                    });
                }
                throw new Error('Error ' + res.status + ' al crear sede');
            });
        },
        obtener: function (id) {
            return fetch(BASE_URL + '/sucursales/' + id)
                .then(function (res) {
                    if (!res.ok) throw new Error('Error ' + res.status + ' al obtener la sede');
                    return res.json();
                });
        },
        actualizar: function (id, payload) {
            return fetch(BASE_URL + '/sucursales/' + id, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            }).then(function (res) {
                if (res.status === 200) return res.json();
                if (res.status === 400) {
                    return res.json().then(function (err) {
                        throw new Error(err.message || err.error || 'Error de validación');
                    });
                }
                throw new Error('Error ' + res.status + ' al actualizar sede');
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

    /* ---- Refs Modal Nueva Sede ---- */
    var modalNS       = document.getElementById('modal-nueva-sede');
    var btnNsClose    = document.getElementById('btn-ns-close');
    var btnNsCancel   = document.getElementById('btn-ns-cancel');
    var btnNsSubmit   = document.getElementById('btn-ns-submit');
    var nsSubmitText  = document.getElementById('ns-submit-text');
    var nsSubmitLoad  = document.getElementById('ns-submit-loader');
    var nsNombre      = document.getElementById('ns-nombre');
    var nsDireccion   = document.getElementById('ns-direccion');
    var nsTelefono    = document.getElementById('ns-telefono');
    var nsErrNombre   = document.getElementById('ns-err-nombre');
    var nsErrDir      = document.getElementById('ns-err-direccion');
    var nsErrGen      = document.getElementById('ns-error-general');
    var nsErrGenMsg   = document.getElementById('ns-error-general-msg');
    var nsToast       = document.getElementById('ns-toast');
    var nsToastMsg    = document.getElementById('ns-toast-msg');

    /* ---- Refs Modal Editar Sede ---- */
    var modalES      = document.getElementById('modal-edit-sede');
    var btnEsClose   = document.getElementById('btn-es-close');
    var btnEsCancel  = document.getElementById('btn-es-cancel');
    var btnEsSubmit  = document.getElementById('btn-es-submit');
    var esSubmitText = document.getElementById('es-submit-text');
    var esSubmitLoad = document.getElementById('es-submit-loader');
    var esEmpresa    = document.getElementById('es-empresa');
    var esEstado     = document.getElementById('es-estado');
    var esNombre     = document.getElementById('es-nombre');
    var esDireccion  = document.getElementById('es-direccion');
    var esTelefono   = document.getElementById('es-telefono');
    var esErrNombre  = document.getElementById('es-err-nombre');
    var esErrDir     = document.getElementById('es-err-direccion');
    var esErrGen     = document.getElementById('es-error-general');
    var esErrGenMsg  = document.getElementById('es-error-general-msg');
    var _editSedeId  = null;

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
       LÓGICA MODAL NUEVA SEDE
    ======================================== */

    function abrirModal() {
        resetModal();
        modalNS.style.display = 'flex';
        nsNombre.focus();
    }

    function cerrarModal() {
        modalNS.style.display = 'none';
    }

    function resetModal() {
        nsNombre.value    = '';
        nsDireccion.value = '';
        nsTelefono.value  = '';
        limpiarErrores();
        setLoading(false);
    }

    function limpiarErrores() {
        [nsErrNombre, nsErrDir].forEach(function(el){ el.textContent = ''; });
        [nsNombre, nsDireccion].forEach(function(el){ el.classList.remove('nc-input-error'); });
        nsErrGen.style.display = 'none';
    }

    function setError(inputEl, errEl, msg) {
        inputEl.classList.add('nc-input-error');
        errEl.textContent = msg;
    }

    function setLoading(on) {
        btnNsSubmit.disabled = on;
        nsSubmitText.style.display = on ? 'none' : 'flex';
        nsSubmitLoad.style.display = on ? 'flex' : 'none';
    }

    function mostrarToast(msg) {
        nsToastMsg.textContent = msg;
        nsToast.style.display = 'flex';
        setTimeout(function() { nsToast.style.display = 'none'; }, 3500);
    }

    function guardarSede() {
        limpiarErrores();
        var ok = true;

        var nombre = nsNombre.value.trim();
        if (!nombre) {
            setError(nsNombre, nsErrNombre, 'El nombre es obligatorio.');
            ok = false;
        }

        var direccion = nsDireccion.value.trim();
        if (!direccion) {
            setError(nsDireccion, nsErrDir, 'La dirección es obligatoria.');
            ok = false;
        }

        if (!ok) return;

        var payload = {
            empresaId: 1, // Por ahora fijo a 1
            nombre: nombre,
            direccion: direccion,
            telefono: nsTelefono.value.trim()
        };

        setLoading(true);

        SucursalService.crear(payload)
            .then(function() {
                cerrarModal();
                mostrarToast('¡Sede "' + nombre + '" creada con éxito!');
                cargarSucursales();
            })
            .catch(function(err) {
                setLoading(false);
                nsErrGenMsg.textContent = err.message || 'Error al conectar con el servidor.';
                nsErrGen.style.display = 'flex';
            });
    }

    /* ---- Eventos Nueva Sede ---- */
    initActionButton({
        containerId: 'sucursales-action-container',
        label: 'Añadir Nueva Sede',
        icon: 'bx bx-plus',
        onClick: abrirModal
    });
    cardAdd.addEventListener('click', abrirModal);
    btnNsClose.addEventListener('click', cerrarModal);
    btnNsCancel.addEventListener('click', cerrarModal);
    btnNsSubmit.addEventListener('click', guardarSede);

    [nsNombre, nsDireccion, nsTelefono].forEach(function(input) {
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') guardarSede();
        });
    });

    modalNS.addEventListener('click', function(e) {
        if (e.target === modalNS) cerrarModal();
    });

    /* ========================================
       LÓGICA MODAL EDITAR SEDE
    ======================================== */

    function abrirModalEditar(id) {
        if (!id || id === 'undefined') {
            console.error('ID de sede no válido:', id);
            return;
        }
        _editSedeId = id;
        esLimpiarErrores();
        esSetLoading(false);
        esNombre.value    = '';
        esDireccion.value = '';
        esTelefono.value  = '';
        esEmpresa.value   = 'Cargando...';
        esEstado.value    = 'Cargando...';
        modalES.style.display = 'flex';

        SucursalService.obtener(id)
            .then(function(s) {
                esEmpresa.value   = 'El Pelotero'; // Empresa fija por ahora
                esEstado.value    = s.activo ? 'Activa' : 'Inactiva';
                esNombre.value    = s.nombre    || '';
                esDireccion.value = s.direccion || '';
                esTelefono.value  = s.telefono  || '';
                esNombre.focus();
            })
            .catch(function(err) {
                esErrGenMsg.textContent = err.message || 'No se pudo cargar los datos de la sede.';
                esErrGen.style.display = 'flex';
            });
    }

    function cerrarModalEditar() {
        modalES.style.display = 'none';
    }

    function esLimpiarErrores() {
        [esErrNombre, esErrDir].forEach(function(el){ el.textContent = ''; });
        [esNombre, esDireccion].forEach(function(el){ el.classList.remove('nc-input-error'); });
        esErrGen.style.display = 'none';
    }

    function esSetError(inputEl, errEl, msg) {
        inputEl.classList.add('nc-input-error');
        errEl.textContent = msg;
    }

    function esSetLoading(on) {
        btnEsSubmit.disabled = on;
        esSubmitText.style.display = on ? 'none' : 'flex';
        esSubmitLoad.style.display = on ? 'flex' : 'none';
    }

    function guardarSedeEditada() {
        esLimpiarErrores();
        var ok = true;

        var nombre = esNombre.value.trim();
        if (!nombre) {
            esSetError(esNombre, esErrNombre, 'El nombre es obligatorio.');
            ok = false;
        }

        var direccion = esDireccion.value.trim();
        if (!direccion) {
            esSetError(esDireccion, esErrDir, 'La dirección es obligatoria.');
            ok = false;
        }

        if (!ok) return;

        var payload = {
            nombre:    nombre,
            direccion: direccion,
            telefono:  esTelefono.value.trim()
        };

        esSetLoading(true);

        SucursalService.actualizar(_editSedeId, payload)
            .then(function() {
                cerrarModalEditar();
                mostrarToast('\u00a1Sede "' + nombre + '" actualizada con éxito!');
                cargarSucursales();
            })
            .catch(function(err) {
                esSetLoading(false);
                esErrGenMsg.textContent = err.message || 'Error al conectar con el servidor.';
                esErrGen.style.display = 'flex';
            });
    }

    /* ---- Eventos Editar Sede ---- */
    btnEsClose.addEventListener('click', cerrarModalEditar);
    btnEsCancel.addEventListener('click', cerrarModalEditar);
    btnEsSubmit.addEventListener('click', guardarSedeEditada);

    [esNombre, esDireccion, esTelefono].forEach(function(input) {
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') guardarSedeEditada();
        });
    });

    modalES.addEventListener('click', function(e) {
        if (e.target === modalES) cerrarModalEditar();
    });

    btnRetry.addEventListener('click', cargarSucursales);
    cargarSucursales();

}

export function unmount() {
    // Cleanup event listeners if needed
}
