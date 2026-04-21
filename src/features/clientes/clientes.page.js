import { clientesTemplate } from './clientes.template.js';
import { api } from '../../core/api.js';
import { Auth } from '../../core/auth.js';

export function template() {
    return clientesTemplate();
}

export function mount(container) {

    var BASE_URL  = 'http://localhost:8080/api/v1';
    var PAGE_SIZE = 15;
    var paginaActual = 0;
    var totalPaginas = 1;
    var totalElementos = 0;
    var debounceTimer = null;
    var ultimaBusqueda = '';
    var clientesActuales = []; // datos de la página actual

    /* ---- DOM refs ---- */
    var loading  = document.getElementById('cli-loading');
    var errBox   = document.getElementById('cli-error');
    var errMsg   = document.getElementById('cli-error-msg');
    var emptyEl  = document.getElementById('cli-empty');
    var tableEl  = document.getElementById('cli-table');
    var tbody    = document.getElementById('cli-tbody');
    var footer   = document.getElementById('cli-footer');
    var countLbl = document.getElementById('cli-count-label');
    var pagination = document.getElementById('cli-pagination');
    var searchIn = document.getElementById('cli-search');
    var filterTipo = document.getElementById('cli-filter-tipo');

    var AVATAR_COLORS = ['#1a8f3b','#2563eb','#9333ea','#ea580c','#0891b2','#d97706','#e11d48'];

    function getInitials(nombre) {
        return (nombre || '??').split(' ').slice(0,2).map(function(w){ return w[0]; }).join('').toUpperCase();
    }
    function getColor(id) {
        return AVATAR_COLORS[id % AVATAR_COLORS.length];
    }

    /* ---- Stats (basadas en la página actual + total) ---- */
    function actualizarStats(clientes, total) {
        document.getElementById('cli-stat-total').textContent = total;
        document.getElementById('cli-stat-dni').textContent   = clientes.filter(function(c){ return c.tipoDocumento === 'DNI'; }).length + (total > PAGE_SIZE ? '+' : '');
        document.getElementById('cli-stat-email').textContent  = clientes.filter(function(c){ return c.email; }).length + (total > PAGE_SIZE ? '+' : '');
        document.getElementById('cli-stat-tel').textContent    = clientes.filter(function(c){ return c.telefono; }).length + (total > PAGE_SIZE ? '+' : '');
    }

    /* ---- Construir fila ---- */
    function buildFila(c) {
        var color    = getColor(c.clienteId);
        var initials = getInitials(c.nombre);

        // Filtro local por tipo documento
        var tipoBadge = '<span class="tipo-doc-badge ' + (c.tipoDocumento || '') + '">' + (c.tipoDocumento || '—') + '</span>';

        var tr = document.createElement('tr');
        tr.innerHTML = [
            /* Nombre */
            "<td>",
                "<div class='cli-profile-cell'>",
                    "<div class='cli-avatar-wrap'>",
                        "<div class='cli-avatar-gen' style='background:" + color + ";'>" + initials + "</div>",
                    "</div>",
                    "<div>",
                        "<strong>" + c.nombre + "</strong>",
                        "<span style='font-size:11px;color:#94a3b8;'>ID #" + c.clienteId + "</span>",
                    "</div>",
                "</div>",
            "</td>",
            /* Documento */
            "<td>",
                "<div style='display:flex;flex-direction:column;gap:4px;'>",
                    tipoBadge,
                    "<span style='font-size:13px;font-weight:600;color:#334155;'>" + (c.documento || '—') + "</span>",
                "</div>",
            "</td>",
            /* Contacto */
            "<td>",
                "<div style='display:flex;flex-direction:column;gap:4px;'>",
                    c.email
                        ? "<div class='cli-contact-row'><i class='bx bx-envelope'></i><span>" + c.email + "</span></div>"
                        : "<div class='cli-contact-row' style='color:#cbd5e1;'><i class='bx bx-envelope'></i><span>Sin email</span></div>",
                    c.telefono
                        ? "<div class='cli-contact-row'><i class='bx bx-phone'></i><strong>" + c.telefono + "</strong></div>"
                        : "<div class='cli-contact-row' style='color:#cbd5e1;'><i class='bx bx-phone'></i><span>Sin teléfono</span></div>",
                "</div>",
            "</td>",
            /* Acciones */
            "<td style='text-align:right;'>",
                "<div class='cli-actions'>",
                    c.telefono ? "<button title='Llamar'><i class='bx bxs-phone'></i></button>" : '',
                    c.email    ? "<button title='Email'><i class='bx bxs-envelope'></i></button>" : '',
                    "<button class='btn-edit-cliente' data-id='" + c.clienteId + "' title='Editar'><i class='bx bx-pencil'></i></button>",
                    "<button class='btn-delete-cliente' data-id='" + c.clienteId + "' title='Eliminar'><i class='bx bx-trash'></i></button>",
                "</div>",
            "</td>"
        ].join('');

        /* Bind eliminar */
        var btnDel = tr.querySelector('.btn-delete-cliente');
        if (btnDel) {
            btnDel.addEventListener('click', function () {
                if (!confirm('¿Eliminar a ' + c.nombre + '?')) return;
                fetch(BASE_URL + '/clientes/' + c.clienteId, { method: 'DELETE' })
                    .then(function (res) {
                        if (!res.ok && res.status !== 204) throw new Error('Error ' + res.status);
                        cargarClientes(paginaActual, ultimaBusqueda);
                    })
                    .catch(function (err) { alert('No se pudo eliminar: ' + err.message); });
            });
        }

        return tr;
    }

    /* ---- Render tabla ---- */
    function renderTabla(clientes) {
        tbody.innerHTML = '';
        var tipo = filterTipo.value;
        var filtrados = tipo
            ? clientes.filter(function(c){ return c.tipoDocumento === tipo; })
            : clientes;

        if (filtrados.length === 0) {
            tableEl.style.display = 'none';
            emptyEl.style.display = 'block';
            footer.style.display  = 'none';
            return;
        }

        emptyEl.style.display = 'none';
        tableEl.style.display = '';
        footer.style.display  = 'flex';

        filtrados.forEach(function (c) { tbody.appendChild(buildFila(c)); });
    }

    /* ---- Paginación ---- */
    function renderPaginacion(paginaActual, totalPaginas, totalEl) {
        var inicio = paginaActual * PAGE_SIZE + 1;
        var fin    = Math.min((paginaActual + 1) * PAGE_SIZE, totalEl);
        countLbl.textContent = 'MOSTRANDO ' + inicio + '-' + fin + ' DE ' + totalEl + ' CLIENTES';

        pagination.innerHTML = '';

        // Prev
        var prev = document.createElement('button');
        prev.className = 'arr';
        prev.style.cssText = 'background:#f1f5f9;border-radius:50%;';
        prev.innerHTML = "<i class='bx bx-chevron-left'></i>";
        prev.disabled = paginaActual === 0;
        if (paginaActual === 0) prev.style.opacity = '0.4';
        prev.addEventListener('click', function () { if (paginaActual > 0) cargarClientes(paginaActual - 1, ultimaBusqueda); });
        pagination.appendChild(prev);

        // Números (máximo 5 visibles)
        var start = Math.max(0, paginaActual - 2);
        var end   = Math.min(totalPaginas - 1, start + 4);
        for (var i = start; i <= end; i++) {
            (function(page) {
                var btn = document.createElement('button');
                btn.className = 'num' + (page === paginaActual ? ' active' : '');
                btn.textContent = page + 1;
                btn.addEventListener('click', function () { cargarClientes(page, ultimaBusqueda); });
                pagination.appendChild(btn);
            })(i);
        }

        // Next
        var nxt = document.createElement('button');
        nxt.className = 'arr';
        nxt.style.cssText = 'background:#f1f5f9;border-radius:50%;color:var(--text-main);';
        nxt.innerHTML = "<i class='bx bx-chevron-right'></i>";
        nxt.disabled = paginaActual >= totalPaginas - 1;
        if (paginaActual >= totalPaginas - 1) nxt.style.opacity = '0.4';
        nxt.addEventListener('click', function () { if (paginaActual < totalPaginas - 1) cargarClientes(paginaActual + 1, ultimaBusqueda); });
        pagination.appendChild(nxt);
    }

    /* ---- Cargar clientes desde API ---- */
    function cargarClientes(page, busqueda) {
        paginaActual  = page || 0;
        ultimaBusqueda = busqueda || '';

        loading.style.display  = 'flex';
        errBox.style.display   = 'none';
        tableEl.style.display  = 'none';
        emptyEl.style.display  = 'none';
        footer.style.display   = 'none';

        var url = BASE_URL + '/clientes?page=' + paginaActual + '&size=' + PAGE_SIZE + '&sort=nombre,asc';
        if (ultimaBusqueda) url += '&nombre=' + encodeURIComponent(ultimaBusqueda);

        fetch(url)
            .then(function (res) {
                if (!res.ok) throw new Error('Error ' + res.status);
                return res.json();
            })
            .then(function (data) {
                // La API devuelve { content: [], totalElements, totalPages, ... }
                var clientes = Array.isArray(data) ? data : (data.content || []);
                totalElementos = data.totalElements !== undefined ? data.totalElements : clientes.length;
                totalPaginas   = data.totalPages   !== undefined ? data.totalPages   : 1;
                clientesActuales = clientes;

                actualizarStats(clientes, totalElementos);
                loading.style.display = 'none';
                renderTabla(clientes);
                if (tableEl.style.display !== 'none') {
                    renderPaginacion(paginaActual, totalPaginas, totalElementos);
                }
            })
            .catch(function (err) {
                loading.style.display = 'none';
                errMsg.textContent = 'No se pudo conectar. (' + err.message + ')';
                errBox.style.display = 'flex';
            });
    }

    /* ---- Búsqueda con debounce 400ms → llama API ---- */
    searchIn.addEventListener('input', function () {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(function () {
            cargarClientes(0, searchIn.value.trim());
        }, 400);
    });

    /* ---- Filtro tipo documento (local, sin nueva llamada) ---- */
    filterTipo.addEventListener('change', function () {
        renderTabla(clientesActuales);
        renderPaginacion(paginaActual, totalPaginas, totalElementos);
    });

    /* ---- Retry ---- */
    document.getElementById('btn-cli-retry').addEventListener('click', function () {
        cargarClientes(paginaActual, ultimaBusqueda);
    });

    /* ---- Exportar CSV ---- */
    document.getElementById('btn-export-csv').addEventListener('click', function () {
        if (clientesActuales.length === 0) { alert('No hay clientes para exportar.'); return; }
        var rows = [['ID','Nombre','Tipo Doc','Documento','Email','Teléfono']];
        clientesActuales.forEach(function(c) {
            rows.push([c.clienteId, c.nombre, c.tipoDocumento, c.documento, c.email||'', c.telefono||'']);
        });
        var csv = rows.map(function(r){ return r.join(','); }).join('\n');
        var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        var url  = URL.createObjectURL(blob);
        var link = document.createElement('a');
        link.href = url; link.download = 'clientes.csv'; link.click();
        URL.revokeObjectURL(url);
    });

    /* ---- Init ---- */
    cargarClientes(0, '');

}

export function unmount() {
    // Cleanup event listeners if needed
}
