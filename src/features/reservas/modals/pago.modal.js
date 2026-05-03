import { initModalShell } from '../../../shared/components/modal-shell.js';
import { ReservaService } from '../reservas.service.js';
import { reservaPagoFormTemplate } from '../reservas.modals.template.js';

export function initPagoReservaModal(ctx) {
    const { callbacks } = ctx;
    let _drId = null;

    const modalPago = initModalShell({
        id: 'modal-pago-reserva',
        title: 'Registrar Pago',
        subtitle: 'Ingresa los detalles del pago recibido',
        icon: 'bx bx-money',
        confirmText: 'Confirmar Pago',
        contentHtml: reservaPagoFormTemplate(),
        onConfirm: async (mCtx) => {
            const monto = parseFloat(document.getElementById('ap-monto').value);
            const metodo = document.getElementById('ap-metodo').value;
            const ref = document.getElementById('ap-referencia').value;

            let hasError = false;
            if (!monto || monto <= 0) { mCtx.showFieldError('ap-monto', 'Monto inválido'); hasError = true; }
            if (!metodo) { mCtx.showFieldError('ap-metodo', 'Requerido'); hasError = true; }

            if (hasError) return;

            mCtx.setLoading(true);
            try {
                await ReservaService.agregarPago(_drId, {
                    monto: monto,
                    metodoPago: metodo,
                    referencia: ref || ''
                });
                mCtx.showToast('Pago registrado correctamente');
                mCtx.close();
                if (callbacks.cargarSemana) callbacks.cargarSemana();
                if (callbacks.fetchHistorical) callbacks.fetchHistorical(0);

                if (callbacks.abrirDetalleReserva) {
                    callbacks.abrirDetalleReserva(_drId);
                }
            } catch (err) {
                mCtx.setLoading(false);
                mCtx.showError(err.message || 'Error al registrar el pago');
            }
        }
    });

    function abrirModalPago(reservaId, saldoPendiente = 0) {
        _drId = reservaId;
        const montoInput = document.getElementById('ap-monto');
        if (montoInput) {
            montoInput.value = saldoPendiente > 0 ? Number(saldoPendiente).toFixed(2) : '';
        }
        
        const metodoInput = document.getElementById('ap-metodo');
        if (metodoInput) metodoInput.value = '';
        
        const refInput = document.getElementById('ap-referencia');
        if (refInput) refInput.value = '';
        
        const saldoInfo = document.getElementById('ap-saldo-info');
        const saldoVal = document.getElementById('ap-saldo-val');
        
        if (saldoInfo && saldoVal) {
            if (saldoPendiente > 0) {
                saldoVal.textContent = `S/ ${Number(saldoPendiente).toFixed(2)}`;
                saldoInfo.style.display = 'flex';
            } else {
                saldoInfo.style.display = 'none';
            }
        }
        
        modalPago.open();
    }

    return {
        abrir: abrirModalPago
    };
}
