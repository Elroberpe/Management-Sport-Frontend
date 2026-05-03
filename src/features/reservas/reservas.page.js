// src/features/reservas/reservas.page.js
import { reservasTemplate } from './reservas.template.js';
import { initModals } from './reservas.modals.js';
import { initTabla } from './reservas.tabla.js';
import { initCalendario } from './reservas.calendario.js';
import { initActionButton } from '../../shared/components/action-button.js';
import { initClienteModal } from '../clientes/clientes.modals.js';
import { api } from '../../core/api.js';
import { Auth } from '../../core/auth.js';
import { Store } from '../../core/store.js';
import { initDetalleEventoModal, initPagoEventoModal } from '../eventos/eventos.modals.js';
import { createPageLifecycle } from '../../shared/utils/lifecycle.js';

let reservasMountCleanup = null;

export function template() {
    return reservasTemplate();
}

export function mount(container) {
    // Limpiar montaje previo
    const { addCleanup, addGlobalListener, getUnmount } = createPageLifecycle(reservasMountCleanup);
    reservasMountCleanup = null;

    var session = Auth ? Auth.getSession() : null;
    var sedeActiva = (session && session.rol === 'superadmin')
        ? Store.getSucursal()
        : (session ? { sucursalId: session.sucursalId, nombre: session.sucursalNombre } : null);
    var sucursalFiltro = sedeActiva ? sedeActiva.sucursalId : null;

    // ─── 1. Inicializar Modales ─────────────────────────────────────────────
    var modals = initModals({
        api:              api,
        sucursalFiltro:   sucursalFiltro,
        sedeActiva:       sedeActiva,
        addCleanup:       addCleanup,
        addGlobalListener:addGlobalListener,
        Store:            Store,
        initClienteModal: initClienteModal
    });

    var modalPagoEvento = initPagoEventoModal({ onPagado: () => { tabla.fetchHistoricalReservas(0); calendario.cargarSemana(); } });
    var modalDetalleEvento = initDetalleEventoModal({ onPago: (e) => modalPagoEvento.abrir(e) });

    // ─── 2. Inicializar Tabla Histórica ─────────────────────────────────────
    var tabla = initTabla({
        api:              api,
        sucursalFiltro:   sucursalFiltro,
        addCleanup:       addCleanup,
        addGlobalListener:addGlobalListener,
        modals: {
            abrirDetalleReserva:    modals.abrirDetalleReserva,
            abrirModalPago:         modals.abrirModalPago,
            abrirModalReprogramar:  modals.abrirModalReprogramar,
            abrirModalCancelar:     modals.abrirModalCancelar,
            abrirModalReembolso:    modals.abrirModalReembolso,
            imprimirReciboReserva:  modals.imprimirReciboReserva,
            abrirDetalleEvento:     (id) => modalDetalleEvento.abrir(id)
        }
    });

    // ─── 3. Inicializar Calendario ──────────────────────────────────────────
    var calendario = initCalendario({
        api:              api,
        sucursalFiltro:   sucursalFiltro,
        addCleanup:       addCleanup,
        addGlobalListener:addGlobalListener,
        modals: {
            mostrarResToast:        modals.mostrarResToast,
            abrirDetalleReserva:    modals.abrirDetalleReserva,
            abrirModalPago:         modals.abrirModalPago,
            abrirModalReprogramar:  modals.abrirModalReprogramar,
            abrirModalCancelar:     modals.abrirModalCancelar,
            imprimirReciboReserva:  modals.imprimirReciboReserva,
            abrirDetalleEvento:     (id) => modalDetalleEvento.abrir(id)
        }
    });

    // ─── 4. Inyectar referencias cruzadas en Modales ───────────────────────
    modals.setCargarSemana(calendario.cargarSemana);
    modals.setFetchHistorical(tabla.fetchHistoricalReservas);
    modals.setRhCurrentPage(tabla.currentPageRef);

    // ─── 5. Botón "Nueva Reserva" del header del calendario ────────────────
    initActionButton({
        containerId: 'reservas-action-container',
        label: 'Nueva Reserva',
        icon: 'bx bx-plus',
        onClick: modals.abrirModalNuevaReserva
    });

    // ─── 6. Carga inicial ───────────────────────────────────────────────────
    tabla.poblarCanchasSelect();
    tabla.fetchHistoricalReservas(0);
    calendario.cargarSemana();

    // ─── 7. Registrar cleanup global ────────────────────────────────────────
    reservasMountCleanup = getUnmount();

    // ─── 8. Abrir reserva automáticamente si hay un ID guardado ──────────────
    var autoOpenId = sessionStorage.getItem('pitchpro_open_reserva_id');
    var autoOpenNew = sessionStorage.getItem('pitchpro_open_nueva_reserva');

    if (autoOpenId) {
        sessionStorage.removeItem('pitchpro_open_reserva_id');
        setTimeout(function() {
            modals.abrirDetalleReserva(parseInt(autoOpenId, 10));
        }, 400); 
    }

    if (autoOpenNew) {
        sessionStorage.removeItem('pitchpro_open_nueva_reserva');
        setTimeout(function() {
            modals.abrirModalNuevaReserva();
        }, 400);
    }
}
