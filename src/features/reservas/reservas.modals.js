// src/features/reservas/reservas.modals.js
import { initNuevaReservaModal } from './modals/nueva-reserva.modal.js';
import { initDetalleReservaModal } from './modals/detalle-reserva.modal.js';
import { initCancelarReservaModal } from './modals/cancelar-reserva.modal.js';
import { initReembolsoManualModal } from './modals/reembolso-manual.modal.js';
import { initReprogramarReservaModal } from './modals/reprogramar-reserva.modal.js';
import { initPagoReservaModal } from './modals/pago.modal.js';

export function initModals(ctx) {
    // Callbacks compartidos para comunicación entre modales y módulos externos (calendario/tabla)
    const callbacks = {
        cargarSemana: () => {},
        fetchHistorical: () => {},
        abrirDetalleReserva: null,
        abrirModalPago: null
    };

    const extendedCtx = { ...ctx, callbacks };

    // 1. Inicializar cada modal
    const nuevaReservaModal = initNuevaReservaModal(extendedCtx);
    const detalleReservaModal = initDetalleReservaModal(extendedCtx);
    const cancelarReservaModal = initCancelarReservaModal(extendedCtx);
    const reembolsoManualModal = initReembolsoManualModal(extendedCtx);
    const reprogramarReservaModal = initReprogramarReservaModal(extendedCtx);
    const pagoReservaModal = initPagoReservaModal(extendedCtx);

    // 2. Asignar referencias cruzadas (para que los modales se llamen entre sí)
    callbacks.abrirDetalleReserva = detalleReservaModal.abrir;
    callbacks.abrirModalPago = pagoReservaModal.abrir;

    // 3. Exponer la API pública del módulo de modales
    return {
        abrirModalNuevaReserva: nuevaReservaModal.abrir,
        abrirDetalleReserva: detalleReservaModal.abrir,
        abrirModalPago: pagoReservaModal.abrir,
        abrirModalReprogramar: reprogramarReservaModal.abrir,
        abrirModalCancelar: cancelarReservaModal.abrir,
        abrirModalReembolso: reembolsoManualModal.abrir,
        
        imprimirReciboReserva: (r) => console.log('Print', r),
        mostrarResToast: nuevaReservaModal.mostrarResToast,
        
        setCargarSemana: (fn) => callbacks.cargarSemana = fn,
        setFetchHistorical: (fn) => callbacks.fetchHistorical = fn,
        setRhCurrentPage: (ref) => {} // Compatibilidad
    };
}
