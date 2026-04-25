// src/features/reservas/reservas.tabla.js
import { initTable } from '../../shared/components/table.js';

/**
 * Inicializa la tabla histórica de reservas usando el componente reutilizable.
 */
export function initTabla(ctx) {
    const { api, sucursalFiltro, addCleanup, addGlobalListener, modals } = ctx;

    // Referencia para la página actual (compatible con el resto del módulo)
    const currentPageRef = { value: 0 };

    /* ──────────── MULTISELECT ESTADO (Filtros específicos) ──────────── */
    const msWrap     = document.getElementById('rh-estado-wrap');
    const msTrigger  = document.getElementById('rh-estado-trigger');
    const msDropdown = document.getElementById('rh-estado-dropdown');
    const msOptions  = msDropdown.querySelectorAll('input[type="checkbox"]');

    msTrigger.addEventListener('click', (e) => { e.stopPropagation(); msDropdown.classList.toggle('active'); });
    
    function getSelectedStates() {
        return Array.from(msOptions).filter(opt => opt.checked).map(opt => opt.value);
    }

    function updateMsTrigger() {
        const s = getSelectedStates();
        msTrigger.textContent = s.length === 0 ? 'Todos los estados' : (s.length === 1 ? s[0] : `${s.length} seleccionados`);
    }

    msOptions.forEach(opt => opt.addEventListener('change', updateMsTrigger));

    /* ──────────── AUTOCOMPLETE CLIENTE ──────────── */
    const rhClienteIn   = document.getElementById('rh-cliente');
    const rhClienteId   = document.getElementById('rh-cliente-id');
    const rhClienteList = document.getElementById('rh-cliente-list');
    let clienteDebounce;
    addCleanup(() => clearTimeout(clienteDebounce));

    rhClienteIn.addEventListener('input', function() {
        clearTimeout(clienteDebounce);
        const q = this.value.trim();
        rhClienteId.value = '';
        if (q.length < 2) { rhClienteList.style.display = 'none'; return; }
        clienteDebounce = setTimeout(() => {
            api.get(`/clientes?nombre=${encodeURIComponent(q)}&size=5`)
                .then(data => {
                    const arr = Array.isArray(data) ? data : (data.content || []);
                    rhClienteList.innerHTML = arr.length === 0 ? '<li style="color:#94a3b8;">No hay resultados</li>' : 
                        arr.map(c => `<li data-id='${c.id}'>${c.nombre} (${c.dni})</li>`).join('');
                    rhClienteList.style.display = 'block';
                }).catch(() => {});
        }, 300);
    });

    rhClienteList.addEventListener('click', (e) => {
        if (e.target.tagName === 'LI' && e.target.dataset.id) {
            rhClienteIn.value = e.target.textContent;
            rhClienteId.value = e.target.dataset.id;
            rhClienteList.style.display = 'none';
        }
    });

    addGlobalListener(document, 'click', (e) => {
        if (!msWrap.contains(e.target)) msDropdown.classList.remove('active');
        if (!rhClienteList.contains(e.target) && e.target !== rhClienteIn) rhClienteList.style.display = 'none';
    });

    /* ──────────── SELECT CANCHAS ──────────── */
    const rhCanchaSel = document.getElementById('rh-cancha');
    function poblarCanchasSelect() {
        const endpoint = `/canchas?size=100${sucursalFiltro ? `&sucursalId=${sucursalFiltro}` : ''}`;
        api.get(endpoint).then(data => {
            const arr = Array.isArray(data) ? data : (data.content || []);
            arr.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c.id; opt.textContent = c.nombre;
                rhCanchaSel.appendChild(opt);
            });
        }).catch(() => {});
    }

    /* ──────────── INICIALIZAR COMPONENTE TABLA ──────────── */
    const table = initTable({
        containerId: 'reservas-hist-table-container',
        columns: [
            { key: 'id', label: 'ID', render: (v) => `<strong style="color:#1e293b;">#${v}</strong>` },
            { 
                key: 'fecha', 
                label: 'Fecha y Hora', 
                render: (v, item) => `
                    <div style="line-height:1.2;">
                        <div style="font-weight:700; font-size:13px; color:#1e293b;">${v}</div>
                        <div style="font-size:11px; color:#64748b;">${(item.horaInicio||'').substring(0,5)} – ${(item.horaFin||'').substring(0,5)}</div>
                    </div>
                `
            },
            { key: 'nombreCliente', label: 'Cliente' },
            { 
                key: 'nombreCancha', 
                label: 'Cancha', 
                render: (v) => `<span style="background:#f1f5f9; padding:4px 8px; border-radius:6px; font-size:12px; font-weight:600; color:#475569;">${v || '—'}</span>`
            },
            { 
                key: 'estadoReserva', 
                label: 'Estado',
                render: (v) => {
                    const STYLE_MAP = {
                        PENDIENTE:   'badge-yellow',
                        PAGADA:      'badge-blue',
                        COMPLETADO:  'badge-green',
                        CANCELADO:   'badge-red',
                        REEMBOLSADO: 'badge-purple'
                    };
                    return `<span class="status-badge ${STYLE_MAP[v] || 'badge-gray'}"><span class="dot"></span> ${v}</span>`;
                }
            },
            { key: 'montoTotal', label: 'Total', render: (v) => `<div style="text-align:right; font-weight:600;">S/ ${Number(v||0).toFixed(2)}</div>` },
            { 
                key: 'saldoPendiente', 
                label: 'Saldo', 
                render: (v) => {
                    const saldo = Number(v || 0);
                    let color = '#64748b';
                    let icon = '';
                    if (saldo < 0) { color = '#d97706'; icon = '⚠️ '; }
                    else if (saldo > 0) { color = '#dc2626'; }
                    return `<div style="text-align:right; font-weight:700; color:${color};">${icon}S/ ${saldo.toFixed(2)}</div>`;
                }
            }
        ],
        fetchData: (page) => {
            currentPageRef.value = page;
            const params = new URLSearchParams({ page, size: 10, sort: 'fecha,desc' });
            
            const fDesde = document.getElementById('rh-desde').value;
            const fHasta = document.getElementById('rh-hasta').value;
            if (fDesde) params.append('fechaDesde', fDesde);
            if (fHasta) params.append('fechaHasta', fHasta);
            
            getSelectedStates().forEach(est => params.append('estado', est));
            if (rhClienteId.value) params.append('clienteId', rhClienteId.value);
            
            const canId = rhCanchaSel.value;
            if (canId) params.append('canchaId', canId);
            else if (sucursalFiltro) params.append('sucursalId', sucursalFiltro);

            return api.get(`/reservas?${params.toString()}`);
        },
        actions: [
            { label: 'Ver Detalle', icon: 'bx bx-show', onClick: (r) => modals.abrirDetalleReserva(r.id) },
            { 
                label: 'Añadir Pago', 
                icon: 'bx bx-credit-card', 
                show: (r) => r.estadoReserva === 'PENDIENTE' && r.saldoPendiente > 0,
                onClick: (r) => modals.abrirModalPago(r.id, r.saldoPendiente)
            },
            { 
                label: 'Reprogramar', 
                icon: 'bx bx-calendar-edit', 
                show: (r) => ['PENDIENTE', 'PAGADA'].includes(r.estadoReserva),
                onClick: (r) => modals.abrirModalReprogramar(r)
            },
            { 
                label: 'Imprimir Recibo', 
                icon: 'bx bx-printer', 
                show: (r) => ['PAGADA', 'COMPLETADO', 'CANCELADO', 'REEMBOLSADO'].includes(r.estadoReserva),
                onClick: (r) => modals.imprimirReciboReserva(r)
            },
            { 
                label: 'Registrar Reembolso', 
                icon: 'bx bx-money-withdraw', 
                class: 'warning',
                show: (r) => r.saldoPendiente < 0,
                onClick: (r) => modals.abrirModalReembolso(r)
            },
            { 
                label: 'Cancelar Reserva', 
                icon: 'bx bx-x-circle', 
                class: 'danger',
                show: (r) => ['PENDIENTE', 'PAGADA'].includes(r.estadoReserva),
                onClick: (r) => modals.abrirModalCancelar(r)
            }
        ]
    });

    document.getElementById('rh-btn-buscar').addEventListener('click', () => table.fetch(0));
    document.getElementById('rh-btn-limpiar').addEventListener('click', () => {
        document.getElementById('rh-desde').value = '';
        document.getElementById('rh-hasta').value = '';
        msOptions.forEach(o => o.checked = false);
        updateMsTrigger();
        rhClienteIn.value = ''; rhClienteId.value = ''; rhCanchaSel.value = '';
        table.fetch(0);
    });

    return {
        fetchHistoricalReservas: table.fetch,
        poblarCanchasSelect,
        currentPageRef
    };
}
