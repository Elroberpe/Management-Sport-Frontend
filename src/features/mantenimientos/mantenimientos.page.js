import { mantenimientosTemplate } from './mantenimientos.template.js';
import { api } from '../../core/api.js';
import { Auth } from '../../core/auth.js';

export function template() {
    return mantenimientosTemplate();
}

export function mount(container) {

    var BASE_URL = 'http://localhost:8080/api/v1';
    var session  = Auth ? Auth.getSession() : null;

    /* ---- Colores de avatares ---- */
    var COLORS = ['#8b5cf6','#3b82f6','#f59e0b','#10b981','#ef4444','#ec4899','#06b6d4'];

    /* ---- Estado local ---- */
    var todosMantenimientos = [];
    var filtros = { canchaId: '', estado: '', desde: '', hasta: '' };
    var _editId   = null;
    var _estadoId = null;
    var _cancelId = null;

    /* ---- DOM refs ---- */
    var loadingEl = document.getElementById('mant-loading');
    var errorEl   = document.getElementById('mant-error');
    var errorMsg  = document.getElementById('mant-error-msg');
    var emptyEl   = document.getElementById('mant-empty');
    var tableWrap = document.getElementById('mant-table-wrap');
    var tbody     = document.getElementById('mant-tbody');
    var countLbl  = document.getElementById('mant-count-label');

    var mfCancha = document.getElementById('mf-cancha');
    var mfEstado = document.getElementById('mf-estado');
    var mfDesde  = document.getElementById('mf-desde');
    var mfHasta  = document.getElementById('mf-hasta');

    /* ---- Toast ---- */
    function mostrarToast(msg, isError) {
        var t   = document.getElementById('mant-toast');
        var tm  = document.getElementById('mant-toast-msg');
        tm.textContent = msg;
        t.style.background = isError ? '#fef2f2' : '';
        t.style.color      = isError ? '#dc2626' : '';
        t.style.display = 'flex';
        setTimeout(function(){ t.style.display = 'none'; }, 3500);
    }

    /* ---- Formatear fecha ISO a legible ---- */
    function fmtDate(isoStr) {
        if (!isoStr) return '—';
        var d = new Date(isoStr);
        var pad = function(n){ return n < 10 ? '0' + n : n; };
        return pad(d.getDate()) + '/' + pad(d.getMonth()+1) + '/' + d.getFullYear();
    }
    function fmtTime(isoStr) {
        if (!isoStr) return '—';
        var d = new Date(isoStr);
        var pad = function(n){ return n < 10 ? '0' + n : n; };
        return pad(d.getHours()) + ':' + pad(d.getMinutes()) + 'h';
    }

    /* ---- Cargar dropdown de canchas ---- */
    function cargarCanchasDropdown() {
        fetch(BASE_URL + '/canchas?size=200')
            .then(function(r){ return r.json(); })
            .then(function(data){
                var canchas = Array.isArray(data) ? data : (data.content || []);
                canchas.forEach(function(c){
                    var opt = document.createElement('option');
                    opt.value = c.canchaId || c.id || '';
                    opt.textContent = c.nombre;
                    mfCancha.appendChild(opt);
                });
            }).catch(function(){});
    }

    /* ---- Calcular y mostrar stats ---- */
    function actualizarStats(data) {
        var tots = { PROGRAMADO: 0, EN_PROCESO: 0, COMPLETADO: 0, CANCELADO: 0 };
        data.forEach(function(m){ if (tots[m.estadoMantenimiento] !== undefined) tots[m.estadoMantenimiento]++; });
        document.getElementById('stat-total').textContent      = data.length;
        document.getElementById('stat-programados').textContent = tots.PROGRAMADO;
        document.getElementById('stat-enproceso').textContent   = tots.EN_PROCESO;
        document.getElementById('stat-completados').textContent = tots.COMPLETADO;
    }

    /* ---- Aplicar filtros locales ---- */
    function filtrar() {
        return todosMantenimientos.filter(function(m){
            if (filtros.canchaId && String(m.canchaId) !== String(filtros.canchaId)) return false;
            if (filtros.estado  && m.estadoMantenimiento !== filtros.estado) return false;
            if (filtros.desde) {
                var dInicio = new Date(m.horaInicio);
                var dDesde  = new Date(filtros.desde + 'T00:00:00');
                if (dInicio < dDesde) return false;
            }
            if (filtros.hasta) {
                var dFin2  = new Date(m.horaInicio);
                var dHasta = new Date(filtros.hasta + 'T23:59:59');
                if (dFin2 > dHasta) return false;
            }
            return true;
        });
    }

    /* ---- Badge tipo ---- */
    function tipoBadge(tipo) {
        var map = {
            PREVENTIVO: { cls: 'tipo-preventivo', lbl: 'Preventivo' },
            CORRECTIVO: { cls: 'tipo-correctivo', lbl: 'Correctivo' },
            URGENTE:    { cls: 'tipo-urgente',    lbl: 'Urgente'    },
        };
        var t = map[tipo] || { cls: 'tipo-preventivo', lbl: tipo };
        return "<span class='mant-tipo-badge " + t.cls + "'>" + t.lbl + "</span>";
    }

    /* ---- Badge estado ---- */
    function estadoBadge(estado) {
        var map = {
            PROGRAMADO: { cls: 'est-programado', lbl: 'Programado',  dot: '🔵' },
            EN_PROCESO: { cls: 'est-en_proceso', lbl: 'En Proceso',  dot: '🟠' },
            COMPLETADO: { cls: 'est-completado', lbl: 'Completado',  dot: '🟢' },
            CANCELADO:  { cls: 'est-cancelado',  lbl: 'Cancelado',   dot: '🔴' },
        };
        var s = map[estado] || { cls: 'est-programado', lbl: estado, dot: '⚪' };
        return "<span class='mant-estado-badge " + s.cls + "'>" + s.dot + " " + s.lbl + "</span>";
    }

    /* ---- Construir fila ---- */
    function buildFila(m) {
        var color    = COLORS[(m.canchaId || 0) % COLORS.length];
        var initials = (m.nombreCancha || 'C').split(' ').slice(0,2).map(function(w){ return w[0]; }).join('').toUpperCase();
        var isProgramado = m.estadoMantenimiento === 'PROGRAMADO';
        var isFinal      = m.estadoMantenimiento === 'COMPLETADO' || m.estadoMantenimiento === 'CANCELADO';

        var tr = document.createElement('tr');
        tr.innerHTML = [
            "<td>",
                "<div class='mant-cancha-cell'>",
                    "<div class='mant-cancha-avatar' style='background:" + color + ";'>" + initials + "</div>",
                    "<div>",
                        "<div class='mant-cancha-name'>" + (m.nombreCancha || 'desconocida') + "</div>",
                        "<div class='mant-cancha-sub'>ID Man: " + (m.id || '—') + "</div>",
                    "</div>",
                "</div>",
            "</td>",
            "<td>",
                "<div class='mant-date-cell'>",
                    "<strong style='font-size:13px;color:#1e293b;display:block;'>" + fmtDate(m.horaInicio) + "</strong>",
                    "<span style='font-size:11px;color:#64748b;'>" + fmtTime(m.horaInicio) + "</span>",
                "</div>",
            "</td>",
            "<td>",
                "<div class='mant-date-cell'>",
                    "<strong style='font-size:13px;color:#1e293b;display:block;'>" + fmtDate(m.horaFin) + "</strong>",
                    "<span style='font-size:11px;color:#64748b;'>" + fmtTime(m.horaFin) + "</span>",
                "</div>",
            "</td>",
            "<td>" + tipoBadge(m.tipoMantenimiento) + "</td>",
            "<td>" + estadoBadge(m.estadoMantenimiento) + "</td>",
            "<td><div class='mant-motivo-cell' title='" + (m.motivo||'').replace(/'/g, '&#39;') + "'>" + (m.motivo || '—') + "</div></td>",
            "<td>",
                "<div class='mant-actions'>",
                    !isFinal ? "<button class='mant-btn mb-edit' data-mid='" + m.id + "'" + (!isProgramado ? " disabled title='Solo se puede editar si está PROGRAMADO'" : "") + "><i class='bx bx-edit-alt'></i> Editar</button>" : '',
                    !isFinal ? "<button class='mant-btn mb-estado' data-mid='" + m.id + "'><i class='bx bx-transfer-alt'></i> Estado</button>" : '',
                    !isFinal ? "<button class='mant-btn mb-cancel' data-mid='" + m.id + "'><i class='bx bx-x-circle'></i> Cancelar</button>" : '',
                    isFinal  ? "<span style='font-size:12px;color:#94a3b8;font-style:italic;'>Finalizado</span>" : '',
                "</div>",
            "</td>",
        ].join('');

        // Bind edit
        var btnEdit = tr.querySelector('.mb-edit:not([disabled])');
        if (btnEdit) {
            btnEdit.addEventListener('click', function(){ abrirEditar(m); });
        }
        // Bind cambiar estado
        var btnEst = tr.querySelector('.mb-estado');
        if (btnEst) {
            btnEst.addEventListener('click', function(){ abrirCambioEstado(m); });
        }
        // Bind cancelar
        var btnCan = tr.querySelector('.mb-cancel');
        if (btnCan) {
            btnCan.addEventListener('click', function(){ abrirConfirmCancelar(m); });
        }

        return tr;
    }

    /* ---- Render tabla ---- */
    function renderTabla(data) {
        tbody.innerHTML = '';
        if (data.length === 0) {
            loadingEl.style.display = 'none';
            tableWrap.style.display = 'none';
            emptyEl.style.display = 'flex';
            return;
        }
        data.forEach(function(m){ tbody.appendChild(buildFila(m)); });
        countLbl.textContent = data.length + ' mantenimiento' + (data.length !== 1 ? 's' : '') + ' encontrado' + (data.length !== 1 ? 's' : '');
        loadingEl.style.display  = 'none';
        emptyEl.style.display    = 'none';
        tableWrap.style.display  = '';

        actualizarStats(todosMantenimientos);
    }

    /* ---- Cargar datos del servidor ---- */
    function cargarMantenimientos() {
        loadingEl.style.display  = 'flex';
        errorEl.style.display    = 'none';
        emptyEl.style.display    = 'none';
        tableWrap.style.display  = 'none';

        fetch(BASE_URL + '/mantenimientos?size=200&sort=horaInicio,desc')
            .then(function(r){ if (!r.ok) throw new Error('Error ' + r.status); return r.json(); })
            .then(function(data){
                todosMantenimientos = Array.isArray(data) ? data : (data.content || []);
                renderTabla(filtrar());
            })
            .catch(function(e){
                loadingEl.style.display = 'none';
                errorMsg.textContent = 'No se pudo cargar: ' + e.message;
                errorEl.style.display = 'flex';
            });
    }

    /* ==========================================================
       MODAL EDITAR
    ========================================================== */
    var modalEdit      = document.getElementById('modal-mant-edit');
    var editCanchaLbl  = document.getElementById('edit-cancha-label');
    var editInicio     = document.getElementById('edit-inicio');
    var editFin        = document.getElementById('edit-fin');
    var editTipo       = document.getElementById('edit-tipo');
    var editMotivo     = document.getElementById('edit-motivo');
    var editCharMotivo = document.getElementById('edit-char-motivo');
    var editErrBox     = document.getElementById('edit-error-box');
    var editErrMsg     = document.getElementById('edit-error-msg');

    function dtLocalVal(isoStr) {
        if (!isoStr) return '';
        var d = new Date(isoStr);
        var pad = function(n){ return n < 10 ? '0' + n : n; };
        return d.getFullYear() + '-' + pad(d.getMonth()+1) + '-' + pad(d.getDate())
             + 'T' + pad(d.getHours()) + ':' + pad(d.getMinutes());
    }

    function abrirEditar(m) {
        _editId = m.id;
        editCanchaLbl.textContent = '📌 ' + (m.nombreCancha || 'Cancha');
        editInicio.value = dtLocalVal(m.horaInicio);
        editFin.value    = dtLocalVal(m.horaFin);
        editTipo.value   = m.tipoMantenimiento || '';
        editMotivo.value = m.motivo || '';
        editCharMotivo.textContent = (m.motivo || '').length + '/200';
        editErrBox.style.display = 'none';
        document.getElementById('edit-submit-text').style.display = 'flex';
        document.getElementById('edit-submit-loader').style.display = 'none';
        document.getElementById('btn-edit-submit').disabled = false;
        modalEdit.style.display = 'flex';
    }
    function cerrarEditar() { modalEdit.style.display = 'none'; }

    editMotivo.addEventListener('input', function(){
        editCharMotivo.textContent = editMotivo.value.length + '/200';
    });

    document.getElementById('btn-edit-close').addEventListener('click', cerrarEditar);
    document.getElementById('btn-edit-cancel').addEventListener('click', cerrarEditar);
    modalEdit.addEventListener('click', function(e){ if (e.target === modalEdit) cerrarEditar(); });

    document.getElementById('btn-edit-submit').addEventListener('click', function(){
        var inicio = editInicio.value;
        var fin    = editFin.value;
        var tipo   = editTipo.value;
        var motivo = editMotivo.value.trim();

        if (!inicio || !fin || !tipo || !motivo) {
            editErrMsg.textContent = 'Completa todos los campos.';
            editErrBox.style.display = 'flex';
            return;
        }
        if (fin <= inicio) {
            editErrMsg.textContent = 'El fin debe ser posterior al inicio.';
            editErrBox.style.display = 'flex';
            return;
        }

        var btn = document.getElementById('btn-edit-submit');
        btn.disabled = true;
        document.getElementById('edit-submit-text').style.display = 'none';
        document.getElementById('edit-submit-loader').style.display = 'flex';

        fetch(BASE_URL + '/mantenimientos/' + _editId, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ horaInicio: inicio + ':00', horaFin: fin + ':00', tipoMantenimiento: tipo, motivo: motivo })
        })
        .then(function(r){ if (!r.ok) return r.json().then(function(e){ throw e; }); return r.json(); })
        .then(function(updated){
            var idx = todosMantenimientos.findIndex(function(m){ return m.id === _editId; });
            if (idx !== -1) todosMantenimientos[idx] = updated;
            cerrarEditar();
            renderTabla(filtrar());
            mostrarToast('¡Mantenimiento actualizado con éxito!');
        })
        .catch(function(e){
            btn.disabled = false;
            document.getElementById('edit-submit-text').style.display = 'flex';
            document.getElementById('edit-submit-loader').style.display = 'none';
            editErrMsg.textContent = (e && e.message) || 'Error al actualizar.';
            editErrBox.style.display = 'flex';
        });
    });

    /* ==========================================================
       MODAL CAMBIAR ESTADO
    ========================================================== */
    var modalEstado = document.getElementById('modal-mant-estado');
    var estadoLbl   = document.getElementById('estado-mant-label');
    var estadoOpts  = document.getElementById('mant-estado-options');

    var FLUJO_ESTADOS = {
        PROGRAMADO: [
            { val: 'EN_PROCESO', lbl: 'En Proceso', icon: 'bx-loader-alt', color: '#92400e' },
            { val: 'CANCELADO',  lbl: 'Cancelado',  icon: 'bx-x-circle',   color: '#dc2626' },
        ],
        EN_PROCESO: [
            { val: 'COMPLETADO', lbl: 'Completado', icon: 'bx-check-circle', color: '#16a34a' },
        ],
    };

    function abrirCambioEstado(m) {
        _estadoId = m.id;
        estadoLbl.textContent = (m.nombreCancha || 'Cancha') + ' · ' + (m.estadoMantenimiento || '');
        estadoOpts.innerHTML = '';

        var opciones = FLUJO_ESTADOS[m.estadoMantenimiento] || [];
        if (opciones.length === 0) {
            estadoOpts.innerHTML = '<p style="font-size:13px;color:#94a3b8;">No hay transiciones disponibles.</p>';
        } else {
            opciones.forEach(function(op){
                var div = document.createElement('div');
                div.className = 'mant-estado-opt';
                div.innerHTML = "<i class='bx " + op.icon + "' style='color:" + op.color + ";'></i> " + op.lbl;
                div.addEventListener('click', function(){
                    ejecutarCambioEstado(_estadoId, op.val);
                });
                estadoOpts.appendChild(div);
            });
        }

        modalEstado.style.display = 'flex';
    }
    function cerrarEstado() { modalEstado.style.display = 'none'; }

    document.getElementById('btn-estado-close').addEventListener('click', cerrarEstado);
    document.getElementById('btn-estado-cancel').addEventListener('click', cerrarEstado);
    modalEstado.addEventListener('click', function(e){ if (e.target === modalEstado) cerrarEstado(); });

    function ejecutarCambioEstado(id, nuevoEstado) {
        cerrarEstado();
        fetch(BASE_URL + '/mantenimientos/' + id + '/estado', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estado: nuevoEstado })
        })
        .then(function(r){ if (!r.ok) throw new Error('Error ' + r.status); return r.json(); })
        .then(function(updated){
            var idx = todosMantenimientos.findIndex(function(m){ return m.id === id; });
            if (idx !== -1) todosMantenimientos[idx] = updated;
            renderTabla(filtrar());
            mostrarToast('Estado actualizado a ' + nuevoEstado + '.');
        })
        .catch(function(e){ mostrarToast('Error al cambiar estado: ' + e.message, true); });
    }

    /* ==========================================================
       MODAL CONFIRMAR CANCELAR
    ========================================================== */
    var modalConfirm = document.getElementById('modal-mant-confirm');
    var confirmMsg   = document.getElementById('mant-confirm-msg');

    function abrirConfirmCancelar(m) {
        _cancelId = m.id;
        confirmMsg.textContent = 'Estás por cancelar el mantenimiento de "' + (m.nombreCancha || 'la cancha')
            + '" programado para el ' + fmtDT(m.horaInicio) + '. ¿Confirmas?';
        document.getElementById('confirm-text').style.display = 'flex';
        document.getElementById('confirm-loader').style.display = 'none';
        document.getElementById('btn-confirm-yes').disabled = false;
        modalConfirm.style.display = 'flex';
    }
    function cerrarConfirm() { modalConfirm.style.display = 'none'; }

    document.getElementById('btn-confirm-close').addEventListener('click', cerrarConfirm);
    document.getElementById('btn-confirm-no').addEventListener('click', cerrarConfirm);
    modalConfirm.addEventListener('click', function(e){ if (e.target === modalConfirm) cerrarConfirm(); });

    document.getElementById('btn-confirm-yes').addEventListener('click', function(){
        var btn = document.getElementById('btn-confirm-yes');
        btn.disabled = true;
        document.getElementById('confirm-text').style.display = 'none';
        document.getElementById('confirm-loader').style.display = 'flex';

        fetch(BASE_URL + '/mantenimientos/' + _cancelId + '/cancelar', { method: 'PATCH' })
        .then(function(r){ if (!r.ok) throw new Error('Error ' + r.status); return r.json(); })
        .then(function(updated){
            var idx = todosMantenimientos.findIndex(function(m){ return m.id === _cancelId; });
            if (idx !== -1) todosMantenimientos[idx] = updated;
            cerrarConfirm();
            renderTabla(filtrar());
            mostrarToast('Mantenimiento cancelado correctamente.');
        })
        .catch(function(e){
            cerrarConfirm();
            mostrarToast('Error al cancelar: ' + e.message, true);
        });
    });

    /* ---- Escape global ---- */
    document.addEventListener('keydown', function(e){
        if (e.key !== 'Escape') return;
        if (modalEdit.style.display    !== 'none') cerrarEditar();
        if (modalEstado.style.display  !== 'none') cerrarEstado();
        if (modalConfirm.style.display !== 'none') cerrarConfirm();
    });

    /* ---- Filtros ---- */
    document.getElementById('mf-apply').addEventListener('click', function(){
        filtros.canchaId = mfCancha.value;
        filtros.estado   = mfEstado.value;
        filtros.desde    = mfDesde.value;
        filtros.hasta    = mfHasta.value;
        renderTabla(filtrar());
    });

    document.getElementById('mf-clear').addEventListener('click', function(){
        mfCancha.value = ''; mfEstado.value = '';
        mfDesde.value  = ''; mfHasta.value  = '';
        filtros = { canchaId: '', estado: '', desde: '', hasta: '' };
        renderTabla(filtrar());
    });

    document.getElementById('mant-retry').addEventListener('click', cargarMantenimientos);

    /* ---- Init ---- */
    cargarCanchasDropdown();
    cargarMantenimientos();


}

export function unmount() {}
