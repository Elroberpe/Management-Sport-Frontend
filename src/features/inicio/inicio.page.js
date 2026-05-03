// src/features/inicio/inicio.page.js
import { inicioTemplate } from './inicio.template.js';
import { api } from '../../core/api.js';
import { Auth } from '../../core/auth.js';
import { Store } from '../../core/store.js';
import { initActionButton } from '../../shared/components/action-button.js';

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
    
    /* --- Botón Nueva Reserva --- */
    initActionButton({
        containerId: 'inicio-action-container',
        label: 'Nueva Reserva',
        icon: 'bx bx-plus',
        onClick: () => {
            sessionStorage.setItem('pitchpro_open_nueva_reserva', 'true');
            window.location.hash = '#/dashboard/reservas';
        }
    });

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
        _loadStatusSedes();
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
    
    // Reservas Completadas Hoy (ahora en reserva-api)
    api.get('/reservas/stats/completadas-hoy' + qs).then(function(res) {
        var el = document.getElementById('kpi-reservas-hoy');
        if (el) el.textContent = res && res.total !== undefined ? res.total : '0';
    }).catch(function() {
        var el = document.getElementById('kpi-reservas-hoy');
        if (el) el.textContent = 'N/D';
    });

    // Ingresos Anuales (ahora en pago-api)
    api.get('/pagos/stats/ingresos-anuales' + qs).then(function(res) {
        var el = document.getElementById('kpi-ingresos-anuales');
        if (el) {
            var val = res && res.total !== undefined ? res.total : 0;
            el.textContent = 'S/ ' + Number(val).toFixed(2);
        }
    }).catch(function() {
        var el = document.getElementById('kpi-ingresos-anuales');
        if (el) el.textContent = 'N/D';
    });

    // Tasa Ocupacion Mensual (sigue en dashboard-api)
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
                var pct = Math.min((d.cantidad / maxVal), 1);
                // Calcular altura en pixeles (máximo 120px para que encaje en los 180px del contenedor)
                var barHeight = Math.max(pct * 120, 8); // minimo 8px para que siempre se vea una línea base

                // Highlight primary if it's the current day (last item usually)
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
                     +  '<div class="bar' + bgClass + '" style="height:' + barHeight + 'px;"></div>'
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

    Promise.all([
        api.get('/reservas' + qs),
        api.get('/sucursales'),
        api.get('/canchas')
    ])
    .then(function(results) {
        var data = results[0];
        var sucursales = results[1] || [];
        var canchas = results[2] || [];

        // Mapeos para resolver el nombre de la sede a partir de la cancha
        var sucursalMap = {};
        sucursales.forEach(function(s) { sucursalMap[s.id] = s.nombre; });
        var canchaToSucursal = {};
        canchas.forEach(function(c) { canchaToSucursal[c.id] = c.sucursalId; });

        var items = Array.isArray(data) ? data : (data.content || []);
        if (items.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:20px;color:#94a3b8;">No hay reservas recientes.</td></tr>';
            return;
        }

        var STYLE_MAP = {
            PENDIENTE:   { badge: 'badge-yellow', dot: 'dot-yellow' },
            PAGADA:      { badge: 'badge-blue',   dot: 'dot-blue'   },
            COMPLETADO:  { badge: 'badge-green',  dot: 'dot-green'  },
            CANCELADO:   { badge: 'badge-red',    dot: 'dot-red'    },
            REEMBOLSADO: { badge: 'badge-purple', dot: 'dot-purple' }
        };

        var html = '';
        items.forEach(function(r) {
            var initials = (r.nombreCliente || '?').split(' ').slice(0, 2).map(function(w){ return w[0]; }).join('').toUpperCase();
            var hora = (r.horaInicio || '').substring(0,5) + ' - ' + (r.horaFin || '').substring(0,5);
            
            var meta = STYLE_MAP[r.estadoReserva] || { badge: 'badge-gray', dot: 'dot-gray' };

            // Lógica solicitada: SEDE si modo global (sin sucursalId), CANCHA si modo sede (con sucursalId)
            var locationDisplay = '';
            if (sucursalId) {
                locationDisplay = r.nombreCancha || ('Cancha ' + r.canchaId);
            } else {
                var sId = canchaToSucursal[r.canchaId];
                var rawNombre = sucursalMap[sId] || '';
                // Remover la palabra "Sede " del nombre si la tiene (ej: "Sede Miraflores" -> "Miraflores")
                locationDisplay = rawNombre.replace(/^Sede\s+/i, '') || ('Sucursal ' + (sId || ''));
            }

            html += '<tr>'
                 +  '<td><div class="cell-user"><div class="avatar-sm">' + initials + '</div> ' + (r.nombreCliente || 'Sin Nombre') + '</div></td>'
                 +  '<td>' + locationDisplay + '<br><span class="muted">' + (r.fecha || '') + '</span></td>'
                 +  '<td>' + hora + '</td>'
                 +  '<td><span class="status-badge ' + meta.badge + '"><span class="dot ' + meta.dot + '"></span> ' + (r.estadoReserva || '') + '</span></td>'
                 +  '<td>S/ ' + Number(r.montoTotal || 0).toFixed(2) + '</td>'
                 +  '</tr>';
        });
        tbody.innerHTML = html;
    })
    .catch(function() {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:20px;color:#ef4444;">Error al cargar reservas.</td></tr>';
    });
}

/**
 * Carga el estado de las sedes para la vista global
 */
function _loadStatusSedes() {
    var listContainer = document.querySelector('#inicio-panel-sedes .branch-list');
    var statValueEl = document.querySelector('#inicio-stat-sedes .stat-value');
    
    if (listContainer) {
        listContainer.innerHTML = '<div style="padding:20px;text-align:center;color:#94a3b8;"><div class="spinner-circle" style="width:24px;height:24px;margin:0 auto 10px;border-width:3px;"></div>Cargando estado...</div>';
    }
    
    Promise.all([
        api.get('/sucursales'),
        api.get('/dashboard/status-sedes')
    ])
    .then(function(results) {
        var sucursales = Array.isArray(results[0]) ? results[0] : [];
        var statusData = Array.isArray(results[1]) ? results[1] : [];
        
        // Actualizar KPI con el total de sedes marcadas como activo=true
        if (statValueEl) {
            var activas = sucursales.filter(function(s) { return s.activo; }).length;
            statValueEl.textContent = activas;
        }
        
        if (!listContainer) return;
        
        if (sucursales.length === 0) {
            listContainer.innerHTML = '<div style="padding:20px;text-align:center;color:#94a3b8;">No hay sedes registradas.</div>';
            return;
        }
        
        var html = '';
        sucursales.forEach(function(s) {
            if (!s.activo) return; // Omitir sucursales dadas de baja
            
            // Buscar los datos en el dashboard usando el id de la sede
            var dStatus = statusData.find(function(d) { return d.sucursalId === s.id; }) || { canchasTotales: 0, canchasActivas: 0 };
            
            var pct = dStatus.canchasTotales > 0 ? Math.round((dStatus.canchasActivas / dStatus.canchasTotales) * 100) : 0;
            var isActive = dStatus.canchasActivas > 0;
            var isMaintenance = dStatus.canchasTotales > 0 && dStatus.canchasActivas === 0;
            
            var iconHtml = isActive ? '<div class="b-icon"><i class="bx bx-map"></i></div>' : 
                          (isMaintenance ? '<div class="b-icon bg-gray"><i class="bx bx-wrench"></i></div>' : 
                                           '<div class="b-icon bg-dark"><i class="bx bx-moon"></i></div>');
                                           
            var dotClass = isActive ? 'green' : (isMaintenance ? 'yellow' : 'gray');
            var textClass = (isMaintenance || dStatus.canchasTotales === 0) ? 'grayed' : '';
            var statusText = isActive ? (dStatus.canchasActivas + '/' + dStatus.canchasTotales + ' Canchas Activas') : 
                            (isMaintenance ? 'En Mantenimiento' : 'Sin canchas registradas');
            
            html += '<div class="branch-item ' + textClass + '">'
                 +    iconHtml
                 +    '<div class="b-info">'
                 +      '<h4>' + s.nombre + ' <span class="dot ' + dotClass + '"></span></h4>'
                 +      '<p>' + statusText + ' ' + (dStatus.canchasTotales > 0 ? '<span class="pct">' + pct + '%</span>' : '') + '</p>'
                 +      (dStatus.canchasTotales > 0 ? '<div class="progress-bg"><div class="progress-fill" style="width: ' + pct + '%;"></div></div>' : '')
                 +    '</div>'
                 +  '</div>';
        });
        
        listContainer.innerHTML = html;
    })
    .catch(function() {
        if (listContainer) listContainer.innerHTML = '<div style="padding:20px;text-align:center;color:#ef4444;">Error al cargar el estado de las sedes.</div>';
        if (statValueEl) statValueEl.textContent = 'N/D';
    });
}

export function unmount() {
    // Cleanup si fuera necesario
}
