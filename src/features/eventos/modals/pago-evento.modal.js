import { initModalShell } from '../../../shared/components/modal-shell.js';
import { EventoService } from '../eventos.service.js';
import { eventoPagoTemplate } from '../eventos.modals.template.js';

export function initPagoEventoModal({ onPagado }) {
    let currentEventoId = null;

    const modal = initModalShell({
        id: 'modal-pago-evento',
        title: 'Añadir Pago',
        subtitle: 'Registra un abono o pago total del evento',
        icon: 'bx bx-credit-card',
        confirmText: 'Registrar Pago',
        contentHtml: eventoPagoTemplate(),
        onConfirm: async (ctx) => {
            const monto   = parseFloat(document.getElementById('ep-monto').value);
            const metodo  = document.getElementById('ep-metodo').value;

            if (!monto || monto <= 0) {
                ctx.showFieldError('ep-monto', 'El monto debe ser mayor a 0.');
                return;
            }

            ctx.setLoading(true);
            try {
                const actualizado = await EventoService.agregarPago(currentEventoId, {
                    monto, metodoPago: metodo
                });
                ctx.showToast(`Pago de S/ ${monto.toFixed(2)} registrado con éxito.`);
                ctx.close();
                if (onPagado) onPagado(actualizado);
            } catch (err) {
                ctx.setLoading(false);
                ctx.showError(err.message || 'Error al registrar el pago.');
            }
        }
    });

    return {
        ...modal,
        abrir: (evento) => {
            currentEventoId = evento.id || evento.eventoId;
            modal.open();

            const saldo = evento.saldoPendiente || 0;
            const saldoEl = document.getElementById('evt-pago-saldo');
            if (saldoEl) saldoEl.textContent = `S/ ${Number(saldo).toFixed(2)}`;

            const montoEl = document.getElementById('ep-monto');
            if (montoEl && saldo > 0) montoEl.value = saldo.toFixed(2);
        }
    };
}
