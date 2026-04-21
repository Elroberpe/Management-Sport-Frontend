import { canchasTemplate } from './canchas.template.js';
import { api } from '../../core/api.js';
import { Auth } from '../../core/auth.js';

export function template() {
    return canchasTemplate();
}

export function mount(container) {

    var BASE_URL = 'http://localhost:8080/api/v1';
    var session  = Auth ? Auth.getSession() : null;

    // Subtitle con sede del usuario
    var subtitleEl = document.getElementById('canchas-subtitle');
    if (session && session.sucursalNombre) {
        subtitleEl.innerHTML = 'Configura y monitorea las canchas de <span style="font-weight:700;color:var(--primary);">' + session.sucursalNombre + '</span>.';
    }

    // Filtro por sucursal según rol
    var sucursalFiltro = (session && session.rol !== 'superadmin') ? session.sucursalId : null;

    /* ---- Refs DOM ---- */
    var loading  = document.getElementById('canchas-loading');
    var errBox   = document.getElementById('canchas-error');
    var errMsg   = document.getElementById('canchas-error-msg');
    var btnRetry = document.getElementById('btn-canchas-retry');
    var table    = document.getElementById('canchas-table');
    var tbody    = document.getElementById('canchas-tbody');
    var grilla   = document.getElementById('canchas-grilla');
    var grillaIn = document.getElementById('canchas-grilla-inner');
    var emptyEl  = document.getElementById('canchas-empty');
    var footer   = document.getElementById('canchas-footer');
    var countLbl = document.getElementById('canchas-count-label');
    var searchIn = document.getElementById('canchas-search');
    var filterEs = document.getElementById('canchas-filter-estado');
    var btnTabla  = document.getElementById('btn-view-tabla');
    var btnGrilla = document.getElementById('btn-view-grilla');

    var COLORS = ['#1a8f3b','#2563eb','#9333ea','#ea580c','#0891b2','#d97706','#e11d48'];
    var vistaActual = 'tabla'; // 'tabla' | 'grilla'
    var todasCanchas = [];

    /* ---- Helpers estado ---- */
    var ESTADO_META = {
        DISPONIBLE:    { cls: 'green',  dotCls: 'green',  label: 'Disponible',    badgeCls: 'cgc-badge-disponible' },
        MANTENIMIENTO: { cls: 'yellow', dotCls: 'yellow', label: 'Mantenimiento', badgeCls: 'cgc-badge-mantenimiento' },
        INACTIVA:      { cls: 'gray',   dotCls: 'gray',   label: 'Inactiva',      badgeCls: 'cgc-badge-inactiva' },
    };

    function statsActualizar(canchas) {
        document.getElementById('stat-total').textContent         = canchas.length;
        document.getElementById('stat-disponibles').textContent   = canchas.filter(function(c){ return c.estadoCancha === 'DISPONIBLE'; }).length;
        document.getElementById('stat-mantenimiento').textContent = canchas.filter(function(c){ return c.estadoCancha === 'MANTENIMIENTO'; }).length;
        document.getElementById('stat-inactivas').textContent     = canchas.filter(function(c){ return c.estadoCancha === 'INACTIVA'; }).length;
    }

    /* ---- Cambiar estado via API ---- */
    function cambiarEstado(canchaId, nuevoEstado, estadoAnterior, el) {
        fetch(BASE_URL + '/canchas/' + canchaId + '/estado', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estadoCancha: nuevoEstado })
        })
        .then(function (res) {
            if (!res.ok) throw new Error('Error ' + res.status);
            return res.json();
        })
        .then(function (updated) {
            // Actualizar en el arreglo local
            var idx = todasCanchas.findIndex(function(c){ return c.canchaId == canchaId; });
            if (idx !== -1) todasCanchas[idx].estadoCancha = updated.estadoCancha;
            renderVista(filtrar());
            statsActualizar(todasCanchas);
        })
        .catch(function (err) {
            alert('No se pudo cambiar el estado: ' + err.message);
            if (el.tagName.toLowerCase() === 'input' && el.type === 'checkbox') {
                 el.checked = (estadoAnterior === 'DISPONIBLE');
                 var spanText = el.parentNode.querySelector('.toggle-text');
                 if (spanText) {
                     spanText.textContent = el.checked ? 'Disponible' : 'Inactiva';
                     if (el.checked) spanText.classList.remove('offline');
                     else spanText.classList.add('offline');
                 }
            } else if (el.tagName.toLowerCase() === 'select') {
                 el.value = estadoAnterior;
                 actualizarClaseSelect(el);
            }
        });
    }

    function actualizarClaseSelect(sel) {
        sel.className = 'estado-select s-' + sel.value.toLowerCase();
    }

    /* ---- Construir fila tabla ---- */
    function buildFila(c) {
        var meta  = ESTADO_META[c.estadoCancha] || ESTADO_META['INACTIVA'];
        var color = COLORS[c.canchaId % COLORS.length];
        var initials = c.nombre.split(' ').slice(0, 2).map(function(w){ return w[0]; }).join('').toUpperCase();

        var tr = document.createElement('tr');
        tr.innerHTML = [
            "<td>",
                "<div class='cancha-name-cell'>",
                    "<div style='width:44px;height:44px;border-radius:50%;background:" + color + ";display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:800;color:#fff;flex-shrink:0;'>",
                        initials,
                    "</div>",
                    "<div>",
                        "<strong>" + c.nombre + "</strong>",
                        "<span>ID: " + c.canchaId + " · Sede " + c.sucursalId + "</span>",
                    "</div>",
                "</div>",
            "</td>",
            "<td class='price-col'>S/ " + Number(c.precioHora).toFixed(2) + "</td>",
            "<td>",
                "<label class='toggle-switch'>",
                    "<input type='checkbox' class='estado-toggle' data-id='" + c.canchaId + "'" + (c.estadoCancha === 'DISPONIBLE' ? " checked" : "") + ">",
                    "<span class='slider'></span>",
                    "<span class='toggle-text" + (c.estadoCancha !== 'DISPONIBLE' ? " offline" : "") + "'>" + (c.estadoCancha === 'DISPONIBLE' ? "Disponible" : "Inactiva") + "</span>",
                "</label>",
            "</td>",
            "<td><span class='dot-status " + meta.dotCls + "'>" + meta.label + "</span></td>",
            "<td style='text-align:right;'>",
                "<div class='actions-col' style='justify-content:flex-end;gap:6px;'>",
                    "<button class='btn-mant-cancha' data-id='" + c.canchaId + "' data-nombre='" + c.nombre + "' title='Programar Mantenimiento'><i class='bx bx-wrench'></i></button>",
                    "<button class='btn-edit-cancha' data-id='" + c.canchaId + "' title='Editar'><i class='bx bx-pencil'></i></button>",
                    "<button class='btn-delete-cancha' data-id='" + c.canchaId + "' title='Eliminar'><i class='bx bx-trash'></i></button>",
                "</div>",
            "</td>"
        ].join('');

        // Bind Edit
        var btnEdit = tr.querySelector('.btn-edit-cancha');
        if (btnEdit) {
            btnEdit.addEventListener('click', function() {
                abrirModalEditar(c.canchaId);
            });
        }

        // Bind estado change
        var toggle = tr.querySelector('.estado-toggle');
        if (toggle) {
            toggle.addEventListener('change', function () {
                var estadoAnterior = c.estadoCancha;
                var nuevoEstado = toggle.checked ? 'DISPONIBLE' : 'INACTIVA';
                var spanText = toggle.parentNode.querySelector('.toggle-text');
                spanText.textContent = toggle.checked ? 'Disponible' : 'Inactiva';
                if(toggle.checked) spanText.classList.remove('offline');
                else spanText.classList.add('offline');
                
                cambiarEstado(c.canchaId, nuevoEstado, estadoAnterior, toggle);
            });
        }

        // Bind mantenimiento
        var btnMant = tr.querySelector('.btn-mant-cancha');
        if (btnMant) {
            btnMant.addEventListener('click', function() {
                abrirModalMant(c.canchaId, c.nombre);
            });
        }

        return tr;
    }

    /* ---- Construir card grilla ---- */
    function buildCard(c) {
        var meta  = ESTADO_META[c.estadoCancha] || ESTADO_META['INACTIVA'];
        var color = COLORS[c.canchaId % COLORS.length];
        var initials = c.nombre.split(' ').slice(0, 2).map(function(w){ return w[0]; }).join('').toUpperCase();

        var card = document.createElement('div');
        card.className = 'cancha-grid-card';
        card.innerHTML = [
            "<div class='cgc-header'>",
                "<div class='cgc-icon' style='background:" + color + ";'>" + initials + "</div>",
                "<div>",
                    "<div class='cgc-name'>" + c.nombre + "</div>",
                    "<div class='cgc-precio'>S/ " + Number(c.precioHora).toFixed(2) + " / hr</div>",
                "</div>",
            "</div>",
            "<span class='cgc-estado-badge " + meta.badgeCls + "'>" + meta.label + "</span>",
            "<div style='display:flex;gap:6px;margin-top:4px;flex-wrap:wrap;align-items:center;'>",
                "<button class='btn-mant-cancha btn-mant-full' data-id='" + c.canchaId + "' data-nombre='" + c.nombre + "'><i class='bx bx-wrench'></i> Programar Mantenimiento</button>",
                "<button class='icon-btn btn-edit-cancha' data-id='" + c.canchaId + "' style='flex:1;justify-content:center;height:36px;' title='Editar'><i class='bx bx-pencil'></i></button>",
                "<div style='flex:2;display:flex;justify-content:flex-end;'>",
                    "<label class='toggle-switch'>",
                        "<input type='checkbox' class='estado-toggle' data-id='" + c.canchaId + "'" + (c.estadoCancha === 'DISPONIBLE' ? " checked" : "") + ">",
                        "<span class='slider'></span>",
                        "<span class='toggle-text" + (c.estadoCancha !== 'DISPONIBLE' ? " offline" : "") + "' style='font-size:11px;'>" + (c.estadoCancha === 'DISPONIBLE' ? "Disponible" : "Inactiva") + "</span>",
                    "</label>",
                "</div>",
            "</div>"
        ].join('');

        var toggle = card.querySelector('.estado-toggle');
        if (toggle) {
            toggle.addEventListener('change', function () {
                var estadoAnterior = c.estadoCancha;
                var nuevoEstado = toggle.checked ? 'DISPONIBLE' : 'INACTIVA';
                var spanText = toggle.parentNode.querySelector('.toggle-text');
                spanText.textContent = toggle.checked ? 'Disponible' : 'Inactiva';
                if(toggle.checked) spanText.classList.remove('offline');
                else spanText.classList.add('offline');

                cambiarEstado(c.canchaId, nuevoEstado, estadoAnterior, toggle);
            });
        }

        var btnEditCard = card.querySelector('.btn-edit-cancha');
        if (btnEditCard) {
            btnEditCard.addEventListener('click', function() {
                abrirModalEditar(c.canchaId);
            });
        }

        return card;
    }

    /* ---- Filtrar localmente ---- */
    function filtrar() {
        var texto = searchIn.value.toLowerCase();
        var estado = filterEs.value;
        return todasCanchas.filter(function (c) {
            var matchTexto = !texto || c.nombre.toLowerCase().includes(texto);
            var matchEstado = !estado || c.estadoCancha === estado;
            return matchTexto && matchEstado;
        });
    }

    /* ---- Render según vista ---- */
    function renderVista(canchas) {
        tbody.innerHTML = '';
        grillaIn.innerHTML = '';

        if (canchas.length === 0) {
            table.style.display = 'none';
            grilla.style.display = 'none';
            emptyEl.style.display = 'block';
            footer.style.display = 'none';
            return;
        }

        emptyEl.style.display = 'none';
        footer.style.display = 'flex';
        countLbl.innerHTML = 'Mostrando <strong>' + canchas.length + '</strong> de ' + todasCanchas.length + ' canchas';

        if (vistaActual === 'tabla') {
            table.style.display = '';
            grilla.style.display = 'none';
            canchas.forEach(function (c) { tbody.appendChild(buildFila(c)); });
        } else {
            table.style.display = 'none';
            grilla.style.display = '';
            canchas.forEach(function (c) { grillaIn.appendChild(buildCard(c)); });
        }
    }

    /* ---- Cargar desde API ---- */
    function cargarCanchas() {
        loading.style.display  = 'flex';
        errBox.style.display   = 'none';
        table.style.display    = 'none';
        grilla.style.display   = 'none';
        emptyEl.style.display  = 'none';
        footer.style.display   = 'none';
        todasCanchas = [];

        var url = BASE_URL + '/canchas';
        if (sucursalFiltro) url += '?sucursalId=' + sucursalFiltro;

        fetch(url)
            .then(function (res) {
                if (!res.ok) throw new Error('Error ' + res.status + ' del servidor');
                return res.json();
            })
            .then(function (data) {
                // Normalizar: si la API devuelve 'id' en lugar de 'canchaId'
                console.log('[Canchas] Primer item recibido de la API:', data[0]);
                todasCanchas = data.map(function(c) {
                    if (c.canchaId === undefined && c.id !== undefined) {
                        c.canchaId = c.id;
                    }
                    return c;
                });
                statsActualizar(todasCanchas);
                loading.style.display = 'none';
                renderVista(filtrar());
            })
            .catch(function (err) {
                loading.style.display  = 'none';
                errMsg.textContent = 'No se pudo conectar con el servidor. (' + err.message + ')';
                errBox.style.display = 'flex';
            });
    }

    /* ---- Event listeners ---- */
    btnRetry.addEventListener('click', cargarCanchas);

    searchIn.addEventListener('input', function () { renderVista(filtrar()); });
    filterEs.addEventListener('change', function () { renderVista(filtrar()); });

    btnTabla.addEventListener('click', function () {
        vistaActual = 'tabla';
        btnTabla.classList.add('active');
        btnGrilla.classList.remove('active');
        renderVista(filtrar());
    });
    btnGrilla.addEventListener('click', function () {
        vistaActual = 'grilla';
        btnGrilla.classList.add('active');
        btnTabla.classList.remove('active');
        renderVista(filtrar());
    });

    /* ---- Init ---- */
    cargarCanchas();

    /* ========================================
       MODAL NUEVA CANCHA
    ======================================== */
    var modalNC      = document.getElementById('modal-nueva-cancha');
    var btnNuevaC    = document.getElementById('btn-nueva-cancha');
    var btnNcClose   = document.getElementById('btn-nc-close');
    var btnNcCancel  = document.getElementById('btn-nc-cancel');
    var btnNcSubmit  = document.getElementById('btn-nc-submit');
    var ncSubmitText = document.getElementById('nc-submit-text');
    var ncSubmitLoad = document.getElementById('nc-submit-loader');
    var ncSelectSuc  = document.getElementById('nc-sucursal');
    var ncNombre     = document.getElementById('nc-nombre');
    var ncPrecio     = document.getElementById('nc-precio');
    var ncErrSuc     = document.getElementById('nc-err-sucursal');
    var ncErrNombre  = document.getElementById('nc-err-nombre');
    var ncErrPrecio  = document.getElementById('nc-err-precio');
    var ncCharNombre = document.getElementById('nc-char-nombre');
    var ncErrGen     = document.getElementById('nc-error-general');
    var ncErrGenMsg  = document.getElementById('nc-error-general-msg');
    var ncToast      = document.getElementById('nc-toast');
    var ncToastMsg   = document.getElementById('nc-toast-msg');

    /* -- Abrir modal -- */
    function abrirModal() {
        resetModal();
        modalNC.style.display = 'flex';
        cargarSucursalesDropdown();
        ncNombre.focus();
    }

    /* -- Cerrar modal -- */
    function cerrarModal() {
        modalNC.style.display = 'none';
    }

    /* -- Reset campos -- */
    function resetModal() {
        ncSelectSuc.innerHTML = '<option value="">Cargando sucursales...</option>';
        ncNombre.value  = '';
        ncPrecio.value  = '';
        ncCharNombre.textContent = '0/50';
        limpiarErrores();
        setLoading(false);
    }

    function limpiarErrores() {
        [ncErrSuc, ncErrNombre, ncErrPrecio].forEach(function(el){ el.textContent = ''; });
        [ncSelectSuc, ncNombre, ncPrecio].forEach(function(el){ el.classList.remove('nc-input-error'); });
        ncErrGen.style.display = 'none';
    }

    function setError(inputEl, errEl, msg) {
        inputEl.classList.add('nc-input-error');
        errEl.textContent = msg;
    }

    function setLoading(on) {
        btnNcSubmit.disabled = on;
        ncSubmitText.style.display = on ? 'none' : 'flex';
        ncSubmitLoad.style.display = on ? 'flex' : 'none';
    }

    /* -- Cargar sucursales en el dropdown -- */
    function cargarSucursalesDropdown() {
        ncSelectSuc.innerHTML = '<option value="">Cargando sucursales...</option>';
        ncSelectSuc.disabled = true;

        var url = BASE_URL + '/sucursales';
        // Si el usuario no es superadmin, pre-seleccionar su sucursal
        fetch(url)
            .then(function(res) {
                if (!res.ok) throw new Error('Error ' + res.status);
                return res.json();
            })
            .then(function(sucursales) {
                ncSelectSuc.innerHTML = '<option value="">— Seleccionar Sucursal —</option>';
                sucursales.forEach(function(s) {
                    var opt = document.createElement('option');
                    // Normalizar id
                    var sid = s.sucursalId !== undefined ? s.sucursalId : s.id;
                    opt.value = sid;
                    opt.textContent = s.nombre;
                    // Pre-seleccionar si el usuario pertenece a esa sucursal
                    if (sucursalFiltro && sid == sucursalFiltro) opt.selected = true;
                    ncSelectSuc.appendChild(opt);
                });
                ncSelectSuc.disabled = false;
            })
            .catch(function() {
                ncSelectSuc.innerHTML = '<option value="">Error al cargar sucursales</option>';
                ncSelectSuc.disabled = true;
            });
    }

    /* -- Validar formulario -- */
    function validarFormulario() {
        limpiarErrores();
        var ok = true;

        if (!ncSelectSuc.value) {
            setError(ncSelectSuc, ncErrSuc, 'Debes seleccionar una sucursal.');
            ok = false;
        }
        var nombre = ncNombre.value.trim();
        if (!nombre) {
            setError(ncNombre, ncErrNombre, 'El nombre no puede estar vacío.');
            ok = false;
        } else if (nombre.length > 50) {
            setError(ncNombre, ncErrNombre, 'Máximo 50 caracteres.');
            ok = false;
        }
        var precio = parseFloat(ncPrecio.value);
        if (!ncPrecio.value || isNaN(precio) || precio <= 0) {
            setError(ncPrecio, ncErrPrecio, 'Ingresa un precio mayor a 0.');
            ok = false;
        }
        return ok;
    }

    /* -- Enviar formulario -- */
    function crearCancha() {
        if (!validarFormulario()) return;

        var payload = {
            sucursalId: parseInt(ncSelectSuc.value, 10),
            nombre:     ncNombre.value.trim(),
            precioHora: parseFloat(ncPrecio.value)
        };

        setLoading(true);

        fetch(BASE_URL + '/canchas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
        .then(function(res) {
            if (res.status === 201) return res.json();
            // Manejar error 400 con mensaje del backend
            if (res.status === 400) {
                return res.json().then(function(err) {
                    var msg = err.message || err.error || JSON.stringify(err);
                    throw { tipo: 'validacion', mensaje: msg };
                });
            }
            throw { tipo: 'servidor', mensaje: 'Error ' + res.status + ' del servidor.' };
        })
        .then(function(nuevaCancha) {
            // Normalizar id
            if (nuevaCancha.canchaId === undefined && nuevaCancha.id !== undefined) {
                nuevaCancha.canchaId = nuevaCancha.id;
            }
            // Agregar al array local y re-renderizar
            todasCanchas.push(nuevaCancha);
            statsActualizar(todasCanchas);
            renderVista(filtrar());
            cerrarModal();
            mostrarToast('¡Cancha "' + nuevaCancha.nombre + '" creada con éxito!');
        })
        .catch(function(err) {
            setLoading(false);
            if (err && err.tipo === 'validacion') {
                // Mostrar error inline
                ncErrGenMsg.textContent = err.mensaje;
                ncErrGen.style.display = 'flex';
            } else {
                ncErrGenMsg.textContent = (err && err.mensaje) || 'No se pudo conectar con el servidor.';
                ncErrGen.style.display = 'flex';
            }
        });
    }

    /* -- Toast -- */
    var toastTimer = null;
    function mostrarToast(msg) {
        ncToastMsg.textContent = msg;
        ncToast.style.display = 'flex';
        clearTimeout(toastTimer);
        toastTimer = setTimeout(function() { ncToast.style.display = 'none'; }, 3500);
    }

    /* -- Contador de caracteres -- */
    ncNombre.addEventListener('input', function() {
        var len = ncNombre.value.length;
        ncCharNombre.textContent = len + '/50';
        if (len > 45) ncCharNombre.style.color = '#ef4444';
        else ncCharNombre.style.color = '#94a3b8';
    });

    /* -- Event listeners del modal -- */
    btnNuevaC.addEventListener('click', abrirModal);
    btnNcClose.addEventListener('click', cerrarModal);
    btnNcCancel.addEventListener('click', cerrarModal);
    modalNC.addEventListener('click', function(e) {
        if (e.target === modalNC) cerrarModal(); // click fuera cierra
    });
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modalNC.style.display !== 'none') cerrarModal();
    });
    btnNcSubmit.addEventListener('click', crearCancha);
    ncNombre.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') crearCancha();
    });

    /* ========================================
       MODAL PROGRAMAR MANTENIMIENTO
    ======================================== */
    var modalMant      = document.getElementById('modal-mant');
    var btnPmClose     = document.getElementById('btn-pm-close');
    var btnPmCancel    = document.getElementById('btn-pm-cancel');
    var btnPmSubmit    = document.getElementById('btn-pm-submit');
    var pmSubmitText   = document.getElementById('pm-submit-text');
    var pmSubmitLoader = document.getElementById('pm-submit-loader');
    var pmCancha       = document.getElementById('pm-cancha-label');
    var pmInicio       = document.getElementById('pm-inicio');
    var pmFin          = document.getElementById('pm-fin');
    var pmTipo         = document.getElementById('pm-tipo');
    var pmMotivo       = document.getElementById('pm-motivo');
    var pmErrInicio    = document.getElementById('pm-err-inicio');
    var pmErrFin       = document.getElementById('pm-err-fin');
    var pmErrTipo      = document.getElementById('pm-err-tipo');
    var pmErrMotivo    = document.getElementById('pm-err-motivo');
    var pmCharMotivo   = document.getElementById('pm-char-motivo');
    var pmErrGen       = document.getElementById('pm-error-general');
    var pmErrGenMsg    = document.getElementById('pm-error-general-msg');

    var _pmCanchaId   = null;
    var _pmCanchaNombre = null;

    /* -- Helpers datetime -- */
    function toLocalDatetimeValue(date) {
        // Convierte Date a 'YYYY-MM-DDTHH:MM' para el input datetime-local
        var pad = function(n) { return n < 10 ? '0' + n : '' + n; };
        return date.getFullYear() + '-' + pad(date.getMonth()+1) + '-' + pad(date.getDate())
             + 'T' + pad(date.getHours()) + ':' + pad(date.getMinutes());
    }
    function toISO(datetimeLocalVal) {
        // Convierte 'YYYY-MM-DDTHH:MM' a 'YYYY-MM-DDTHH:MM:00' (sin zona)
        return datetimeLocalVal + ':00';
    }

    /* -- Abrir modal -- */
    function abrirModalMant(canchaId, nombreCancha) {
        _pmCanchaId    = canchaId;
        _pmCanchaNombre = nombreCancha;

        // Reset
        pmCancha.textContent = '\uD83D\uDCCC ' + nombreCancha;
        pmInicio.value = '';
        pmFin.value    = '';
        pmTipo.value   = '';
        pmMotivo.value = '';
        pmCharMotivo.textContent = '0/200';
        pmLimpiarErrores();
        pmSetLoading(false);

        // Pre-llenar inicio con ahora (redondeado a próxima hora)
        var ahora = new Date();
        ahora.setMinutes(0, 0, 0);
        ahora.setHours(ahora.getHours() + 1);
        pmInicio.value = toLocalDatetimeValue(ahora);
        pmInicio.min   = toLocalDatetimeValue(new Date());

        var fin = new Date(ahora);
        fin.setHours(fin.getHours() + 2);
        pmFin.value = toLocalDatetimeValue(fin);
        pmFin.min   = pmInicio.value;

        modalMant.style.display = 'flex';
        pmMotivo.focus();
    }

    /* -- Cerrar -- */
    function cerrarModalMant() {
        modalMant.style.display = 'none';
    }

    function pmLimpiarErrores() {
        [pmErrInicio, pmErrFin, pmErrTipo, pmErrMotivo].forEach(function(el){ el.textContent = ''; });
        [pmInicio, pmFin, pmTipo, pmMotivo].forEach(function(el){ el.classList.remove('pm-input-error'); });
        pmErrGen.style.display = 'none';
    }

    function pmSetError(inputEl, errEl, msg) {
        inputEl.classList.add('pm-input-error');
        errEl.textContent = msg;
    }

    function pmSetLoading(on) {
        btnPmSubmit.disabled = on;
        pmSubmitText.style.display = on ? 'none' : 'flex';
        pmSubmitLoader.style.display = on ? 'flex' : 'none';
    }

    /* -- Sincronizar min de fin con inicio -- */
    pmInicio.addEventListener('change', function() {
        if (pmInicio.value) {
            pmFin.min = pmInicio.value;
            // Si fin < inicio, ajustar fin
            if (pmFin.value && pmFin.value <= pmInicio.value) {
                var newFin = new Date(pmInicio.value);
                newFin.setHours(newFin.getHours() + 1);
                pmFin.value = toLocalDatetimeValue(newFin);
            }
        }
    });

    /* -- Contador motivo -- */
    pmMotivo.addEventListener('input', function() {
        var len = pmMotivo.value.length;
        pmCharMotivo.textContent = len + '/200';
        pmCharMotivo.style.color = len > 180 ? '#ef4444' : '#94a3b8';
    });

    /* -- Validar -- */
    function pmValidar() {
        pmLimpiarErrores();
        var ok = true;
        var ahora = new Date();

        if (!pmInicio.value) {
            pmSetError(pmInicio, pmErrInicio, 'Selecciona la fecha de inicio.');
            ok = false;
        } else if (new Date(pmInicio.value) < ahora) {
            pmSetError(pmInicio, pmErrInicio, 'La fecha de inicio no puede ser en el pasado.');
            ok = false;
        }
        if (!pmFin.value) {
            pmSetError(pmFin, pmErrFin, 'Selecciona la fecha de fin.');
            ok = false;
        } else if (pmInicio.value && pmFin.value <= pmInicio.value) {
            pmSetError(pmFin, pmErrFin, 'El fin debe ser posterior al inicio.');
            ok = false;
        }
        if (!pmTipo.value) {
            pmSetError(pmTipo, pmErrTipo, 'Selecciona el tipo de mantenimiento.');
            ok = false;
        }
        var motivo = pmMotivo.value.trim();
        if (!motivo) {
            pmSetError(pmMotivo, pmErrMotivo, 'El motivo no puede estar vacío.');
            ok = false;
        }
        return ok;
    }

    /* -- Enviar -- */
    function programarMantenimiento() {
        if (!pmValidar()) return;

        var payload = {
            canchaId:          _pmCanchaId,
            horaInicio:        toISO(pmInicio.value),
            horaFin:           toISO(pmFin.value),
            tipoMantenimiento: pmTipo.value,
            motivo:            pmMotivo.value.trim()
        };

        pmSetLoading(true);

        fetch(BASE_URL + '/mantenimientos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
        .then(function(res) {
            if (res.status === 201) return res.json();
            return res.json().then(function(err) {
                var msg = err.message || err.error || 'Error al programar el mantenimiento.';
                throw { tipo: res.status === 400 ? 'conflicto' : 'servidor', mensaje: msg };
            });
        })
        .then(function() {
            cerrarModalMant();
            mostrarToast('¡Mantenimiento programado para "' + _pmCanchaNombre + '"!');
        })
        .catch(function(err) {
            pmSetLoading(false);
            pmErrGenMsg.textContent = (err && err.mensaje) || 'No se pudo conectar con el servidor.';
            pmErrGen.style.display = 'flex';
        });
    }

    /* -- Event listeners -- */
    btnPmClose.addEventListener('click', cerrarModalMant);
    btnPmCancel.addEventListener('click', cerrarModalMant);
    modalMant.addEventListener('click', function(e) {
        if (e.target === modalMant) cerrarModalMant();
    });
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modalMant.style.display !== 'none') cerrarModalMant();
    });
    btnPmSubmit.addEventListener('click', programarMantenimiento);

    /* ========================================
       MODAL EDITAR CANCHA
    ======================================== */
    var modalEC      = document.getElementById('modal-edit-cancha');
    var btnEcClose   = document.getElementById('btn-ec-close');
    var btnEcCancel  = document.getElementById('btn-ec-cancel');
    var btnEcSubmit  = document.getElementById('btn-ec-submit');
    var ecSubmitText = document.getElementById('ec-submit-text');
    var ecSubmitLoad = document.getElementById('ec-submit-loader');
    var ecSucursal   = document.getElementById('ec-sucursal');
    var ecNombre     = document.getElementById('ec-nombre');
    var ecPrecio     = document.getElementById('ec-precio');
    var ecErrNombre  = document.getElementById('ec-err-nombre');
    var ecErrPrecio  = document.getElementById('ec-err-precio');
    var ecCharNombre = document.getElementById('ec-char-nombre');
    var ecErrGen     = document.getElementById('ec-error-general');
    var ecErrGenMsg  = document.getElementById('ec-error-general-msg');

    var _editCanchaId = null;

    function abrirModalEditar(id) {
        _editCanchaId = id;
        ecLimpiarErrores();
        ecSetLoading(false);
        ecNombre.value = '';
        ecPrecio.value = '';
        ecSucursal.value = 'Cargando...';
        ecCharNombre.textContent = '0/50';

        modalEC.style.display = 'flex';

        fetch(BASE_URL + '/canchas/' + id)
            .then(function(res) {
                if (!res.ok) throw new Error('No se pudo obtener los datos de la cancha (Error ' + res.status + ')');
                return res.json();
            })
            .then(function(c) {
                // Priorizar el nombre que viene de la API de la cancha
                var nombreSede = c.sucursalNombre || (c.sucursal && c.sucursal.nombre);
                
                // Si no viene en la API, usar el de la sesión SOLO si no es "Todas las Sedes"
                if (!nombreSede && session && session.sucursalNombre && session.sucursalNombre !== 'Todas las Sedes') {
                    nombreSede = session.sucursalNombre;
                }
                
                ecSucursal.value = nombreSede || ('Sede ' + c.sucursalId);
                ecNombre.value = c.nombre || '';
                ecPrecio.value = c.precioHora || '';
                ecCharNombre.textContent = (c.nombre || '').length + '/50';
                ecNombre.focus();
            })
            .catch(function(err) {
                ecErrGenMsg.textContent = err.mensaje || err.message;
                ecErrGen.style.display = 'flex';
            });
    }

    function cerrarModalEditar() {
        modalEC.style.display = 'none';
    }

    function ecLimpiarErrores() {
        [ecErrNombre, ecErrPrecio].forEach(function(el){ el.textContent = ''; });
        [ecNombre, ecPrecio].forEach(function(el){ el.classList.remove('nc-input-error'); });
        ecErrGen.style.display = 'none';
    }

    function ecSetError(inputEl, errEl, msg) {
        inputEl.classList.add('nc-input-error');
        errEl.textContent = msg;
    }

    function ecSetLoading(on) {
        btnEcSubmit.disabled = on;
        ecSubmitText.style.display = on ? 'none' : 'flex';
        ecSubmitLoad.style.display = on ? 'flex' : 'none';
    }

    function actualizarCancha() {
        ecLimpiarErrores();
        var ok = true;
        var nombre = ecNombre.value.trim();
        if (!nombre) {
            ecSetError(ecNombre, ecErrNombre, 'El nombre no puede estar vacío.');
            ok = false;
        }
        var precio = parseFloat(ecPrecio.value);
        if (!ecPrecio.value || isNaN(precio) || precio <= 0) {
            ecSetError(ecPrecio, ecErrPrecio, 'Ingresa un precio válido mayor a 0.');
            ok = false;
        }

        if (!ok) return;

        ecSetLoading(true);

        var payload = {
            nombre:     nombre,
            precioHora: precio
        };

        fetch(BASE_URL + '/canchas/' + _editCanchaId, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
        .then(function(res) {
            if (res.status === 200) return res.json();
            return res.json().then(function(err) {
                throw new Error(err.message || 'Error al actualizar la cancha.');
            });
        })
        .then(function(updated) {
            // Actualizar arreglo local
            var idx = todasCanchas.findIndex(function(c){ return c.canchaId == _editCanchaId; });
            if (idx !== -1) {
                todasCanchas[idx].nombre = updated.nombre;
                todasCanchas[idx].precioHora = updated.precioHora;
            }
            statsActualizar(todasCanchas);
            renderVista(filtrar());
            cerrarModalEditar();
            mostrarToast('¡Cancha "' + updated.nombre + '" actualizada correctamente!');
        })
        .catch(function(err) {
            ecSetLoading(false);
            ecErrGenMsg.textContent = err.message;
            ecErrGen.style.display = 'flex';
        });
    }

    /* -- Event listeners -- */
    btnEcClose.addEventListener('click', cerrarModalEditar);
    btnEcCancel.addEventListener('click', cerrarModalEditar);
    modalEC.addEventListener('click', function(e) { if (e.target === modalEC) cerrarModalEditar(); });
    btnEcSubmit.addEventListener('click', actualizarCancha);
    ecNombre.addEventListener('keydown', function(e) { if (e.key === 'Enter') actualizarCancha(); });
    ecNombre.addEventListener('input', function() {
        var len = ecNombre.value.length;
        ecCharNombre.textContent = len + '/50';
        ecCharNombre.style.color = len > 45 ? '#ef4444' : '#94a3b8';
    });

}

export function unmount() {
    // Cleanup if necessary
}
