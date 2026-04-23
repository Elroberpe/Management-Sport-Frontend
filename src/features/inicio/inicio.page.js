// src/features/inicio/inicio.page.js
import { inicioTemplate } from './inicio.template.js';
import { api } from '../../core/api.js';
import { Auth } from '../../core/auth.js';
import { Store } from '../../core/store.js';

export function template() {
    return inicioTemplate();
}

export function mount(container) {
    var session = Auth ? Auth.getSession() : null;
    var sucursal = Store.getSucursal(); // { sucursalId, nombre } | null

    /* --- Saludo personalizado --- */
    var nombre = session ? session.nombre.split(' ')[0] : 'Bienvenido';
    var hora   = new Date().getHours();
    var saludo = hora < 12 ? 'Buenos Días' : hora < 19 ? 'Buenas Tardes' : 'Buenas Noches';

    /* --- Subtítulo según contexto --- */
    var subtitulo;
    if (session && session.rol === 'superadmin' && sucursal) {
        subtitulo = 'Actividad de la sede: ' + sucursal.nombre;
    } else if (session && session.rol === 'superadmin') {
        subtitulo = 'Esto es lo que está pasando en todas tus sedes hoy.';
    } else if (session && session.sucursalNombre) {
        subtitulo = 'Actividad de tu sede: ' + session.sucursalNombre;
    } else {
        subtitulo = 'Resumen de operaciones del día.';
    }

    var greetingEl = document.getElementById('inicio-greeting');
    var subtitleEl = document.getElementById('inicio-subtitle');
    if (greetingEl) greetingEl.textContent = saludo + ', ' + nombre;
    if (subtitleEl) subtitleEl.textContent = subtitulo;

    /* --- Determinar modo: global (superadmin sin sede) vs operativo --- */
    var isModoOperativo = (session && session.rol === 'superadmin')
        ? !!sucursal          // superadmin: operativo solo si hay sede seleccionada
        : true;               // admin / recepcionista: siempre operativo

    if (isModoOperativo) {
        /* Ocultar elementos globales */
        var statSedes   = document.getElementById('inicio-stat-sedes');
        var panelSedes  = document.getElementById('inicio-panel-sedes');
        if (statSedes)  statSedes.style.display  = 'none';
        if (panelSedes) panelSedes.style.display = 'none';

        /* Mostrar panel operativo de canchas */
        var panelSedeInfo = document.getElementById('inicio-panel-sede-info');
        if (panelSedeInfo) panelSedeInfo.style.display = '';

        /* Cargar canchas de la sede */
        var sedeId = sucursal
            ? sucursal.sucursalId
            : (session ? session.sucursalId : null);

        if (sedeId) {
            _loadCanchasSede(sedeId);
        }
    } else {
        // modo global
        var sedeId = null;
    }

    // Cargar datos del dashboard (KPIs, Gráfico y Reservas Recientes)
    _loadKPIs(sedeId);
    
    // Gráfico de actividad
    var currentChartPeriod = 'SEMANA';
    _loadChart(sedeId, currentChartPeriod);

    var pillContainer = document.getElementById('chart-pill-toggles');
    if (pillContainer) {
        var pills = pillContainer.querySelectorAll('span');
        pills.forEach(function(pill) {
            pill.addEventListener('click', function() {
                pills.forEach(function(p) { p.classList.remove('active'); });
                this.classList.add('active');
                currentChartPeriod = this.getAttribute('data-periodo');
                _loadChart(sedeId, currentChartPeriod);
            });
        });
    }

    // Reservas recientes fallback
    _loadReservasRecientes(sedeId);
}

/**
 * Carga las canchas de una sede y las renderiza en #inicio-canchas-sede-list.
 * @param {number} sucursalId
 */
function _loadCanchasSede(sucursalId) {
    var list = document.getElementById('inicio-canchas-sede-list');
    if (!list) return;

    list.innerHTML = "<div class='sede-dropdown-loading'><i class='bx bx-loader-alt bx-spin'></i> Cargando canchas...</div>";

    api.get('/canchas?sucursalId=' + sucursalId)
        .then(function (canchas) {
            if (!canchas || canchas.length === 0) {
                list.innerHTML = "<p style='color:var(--text-muted);padding:16px;text-align:center;'>No hay canchas registradas en esta sede.</p>";
                return;
            }

            list.innerHTML = '';
            canchas.forEach(function (c) {
                var disponible = c.disponible !== false;
                var item = document.createElement('div');
                item.className = 'branch-item';
                item.innerHTML = `
                    <div class="b-icon ${disponible ? '' : 'bg-gray'}">
                        <i class='bx ${disponible ? 'bx-football' : 'bx-wrench'}'></i>
                    </div>
                    <div class="b-info">
                        <h4>${c.nombre || ('Cancha ' + c.id)} <span class="dot ${disponible ? 'green' : 'yellow'}"></span></h4>
                        <p>${disponible ? 'Disponible' : 'No disponible'} <span class="pct">${c.tipo || ''}</span></p>
                    </div>
                `;
                list.appendChild(item);
            });
        })
        .catch(function () {
            list.innerHTML = "<p style='color:var(--text-muted);padding:16px;text-align:center;'>No se pudo cargar las canchas.</p>";
        });
}

/**
 * Carga los KPIs (Reservas Hoy, Ingresos Anuales, Tasa Ocupación)
 */
function _loadKPIs(sucursalId) {
    var qs = sucursalId ? '?sucursalId=' + sucursalId : '';
    
    // Reservas Completadas Hoy
    api.get('/dashboard/kpi/reservas-completadas-hoy' + qs).then(function(res) {
        var el = document.getElementById('kpi-reservas-hoy');
        if (el) el.textContent = res && res.total !== undefined ? res.total : '0';
    }).catch(function() {
        var el = document.getElementById('kpi-reservas-hoy');
        if (el) el.textContent = 'N/D';
    });

    // Ingresos Anuales
    api.get('/dashboard/kpi/ingresos-anuales' + qs).then(function(res) {
        var el = document.getElementById('kpi-ingresos-anuales');
        if (el) {
            var val = res && res.total !== undefined ? res.total : 0;
            el.textContent = 'S/ ' + Number(val).toFixed(2);
        }
    }).catch(function() {
        var el = document.getElementById('kpi-ingresos-anuales');
        if (el) el.textContent = 'N/D';
    });

    // Tasa Ocupacion Mensual
    api.get('/dashboard/kpi/tasa-ocupacion-mensual' + qs).then(function(res) {
        var el = document.getElementById('kpi-tasa-ocupacion');
        if (el) {
            var val = res && res.total !== undefined ? res.total : 0;
            el.textContent = Number(val).toFixed(1) + '%';
        }
    }).catch(function() {
        var el = document.getElementById('kpi-tasa-ocupacion');
        if (el) el.textContent = 'N/D';
    });
}

/**
 * Carga el gráfico de Actividad de Reservas
 */
function _loadChart(sucursalId, periodo) {
    var qs = '?periodo=' + periodo;
    if (sucursalId) qs += '&sucursalId=' + sucursalId;

    var container = document.getElementById('dashboard-chart-container');
    if (!container) return;

    container.innerHTML = '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#94a3b8;"><div class="spinner-circle" style="width:24px;height:24px;margin-right:8px;border-width:3px;"></div> Cargando...</div>';

    api.get('/dashboard/graficos/actividad-reservas' + qs)
        .then(function(data) {
            if (!data || data.length === 0) {
                container.innerHTML = '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#94a3b8;">No hay datos para el período.</div>';
                return;
            }

            // Find max for percentage scaling
            var maxVal = 0;
            data.forEach(function(d) { if (d.cantidad > maxVal) maxVal = d.cantidad; });
            if (maxVal === 0) maxVal = 1; // prevent div by zero

            var html = '';
            var isSemana = periodo === 'SEMANA';
            
            data.forEach(function(d, index) {
                var pct = Math.min((d.cantidad / maxVal) * 100, 100);
                // Highlight primary if it's the current day (last item usually) or randomly if no logic
                var isPrimary = (index === data.length - 1);
                var bgClass = isPrimary ? ' bg-primary' : '';
                
                // Format label
                var dObj = new Date(d.fecha + 'T00:00:00');
                var label = '';
                if (isSemana) {
                    label = ['DOM','LUN','MAR','MIE','JUE','VIE','SAB'][dObj.getDay()];
                } else {
                    label = dObj.getDate().toString().padStart(2, '0'); // solo el numero del dia para MES
                }

                html += '<div class="bar-group" title="' + d.cantidad + ' reservas el ' + d.fecha + '">'
                     +  '<div class="bar h-' + Math.round(pct) + bgClass + '" style="height:' + pct + '%;"></div>'
                     +  '<span>' + label + '</span>'
                     +  '</div>';
            });
            container.innerHTML = html;
        })
        .catch(function() {
            container.innerHTML = '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#ef4444;"><i class="bx bx-error-circle"></i> Error al cargar datos.</div>';
        });
}

/**
 * Carga las reservas recientes (fallback usando el API genérico de reservas)
 */
function _loadReservasRecientes(sucursalId) {
    var tbody = document.getElementById('inicio-reservas-recientes-tbody');
    if (!tbody) return;

    var qs = '?size=5&sort=id,desc';
    if (sucursalId) qs += '&sucursalId=' + sucursalId;

    api.get('/reservas' + qs)
        .then(function(data) {
            var items = Array.isArray(data) ? data : (data.content || []);
            if (items.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:20px;color:#94a3b8;">No hay reservas recientes.</td></tr>';
                return;
            }

            var html = '';
            items.forEach(function(r) {
                var initials = (r.nombreCliente || '?').split(' ').slice(0, 2).map(function(w){ return w[0]; }).join('').toUpperCase();
                var hora = (r.horaInicio || '').substring(0,5) + ' - ' + (r.horaFin || '').substring(0,5);
                
                var badgeClass = '';
                if (r.estadoReserva === 'PENDIENTE') badgeClass = 'badge-pending';
                else if (r.estadoReserva === 'PAGADA') badgeClass = 'badge-confirmed';
                else if (r.estadoReserva === 'COMPLETADO') badgeClass = 'badge-confirmed';
                else if (r.estadoReserva === 'CANCELADO') badgeClass = 'badge-cancelled';
                else badgeClass = 'badge-confirmed';

                html += '<tr>'
                     +  '<td><div class="cell-user"><div class="avatar-sm">' + initials + '</div> ' + r.nombreCliente + '</div></td>'
                     +  '<td>' + (r.nombreCancha || ('Cancha ' + r.canchaId)) + '<br><span class="muted">' + r.fecha + '</span></td>'
                     +  '<td>' + hora + '</td>'
                     +  '<td><span class="badge ' + badgeClass + '">' + r.estadoReserva + '</span></td>'
                     +  '<td>S/ ' + Number(r.montoTotal || 0).toFixed(2) + '</td>'
                     +  '</tr>';
            });
            tbody.innerHTML = html;
        })
        .catch(function() {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:20px;color:#ef4444;">Error al cargar reservas.</td></tr>';
        });
}

export function unmount() {
    // Cleanup si fuera necesario
}
