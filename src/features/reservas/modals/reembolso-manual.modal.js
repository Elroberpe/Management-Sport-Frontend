import { initModalShell } from '../../../shared/components/modal-shell.js';
import { ReservaService } from '../reservas.service.js';
import { reservaReembolsoTemplate } from '../reservas.modals.template.js';

export function initReembolsoManualModal(ctx) {
    const { callbacks } = ctx;
    let _rmData   = null;
    let _rmCredito = 0;

    const modalRM = initModalShell({
        id:          'modal-reembolso-manual',
        title:       'Registrar Reembolso Manual',
        subtitle:    'Devuelve el crédito disponible al cliente',
        icon:        'bx bx-money-withdraw',
        confirmText: 'Confirmar Reembolso',
        contentHtml: '<div></div>',
        onConfirm: async (mCtx) => {
            const montoStr = document.getElementById('rm-monto')?.value;
            const monto    = parseFloat(montoStr);
            const metodo   = document.getElementById('rm-metodo')?.value;
            const nota     = (document.getElementById('rm-nota')?.value || '').trim();

            let hasError = false;
            if (!montoStr || isNaN(monto) || monto <= 0) {
                mCtx.showFieldError('rm-monto', 'Ingresa un monto válido.'); hasError = true;
            } else if (monto > _rmCredito) {
                mCtx.showFieldError('rm-monto', `El monto no puede superar S/ ${_rmCredito.toFixed(2)}.`); hasError = true;
            }
            if (!metodo) {
                mCtx.showFieldError('rm-metodo', 'Selecciona el método de devolución.'); hasError = true;
            }
            if (hasError) return;

            const id   = _rmData.id || _rmData.reservaId;
            const body = { monto, metodoPago: metodo };
            if (nota) body.nota = nota;

            mCtx.setLoading(true);
            try {
                await ReservaService.reembolsar(id, body);
                mCtx.showToast('Reembolso registrado correctamente');
                mCtx.close();
                if (callbacks.fetchHistorical) callbacks.fetchHistorical(0);
            } catch (err) {
                mCtx.setLoading(false);
                mCtx.showError(err.message || 'Error al registrar el reembolso');
            }
        }
    });

    function abrirModalReembolso(reserva) {
        _rmData    = reserva;
        _rmCredito = Math.abs(Number(reserva.saldoPendiente || 0));

        const bodyEl = document.querySelector('#modal-reembolso-manual .modal-shell-body');
        if (bodyEl) {
            bodyEl.innerHTML =
                `<div class="modal-shell-alert-error" id="modal-reembolso-manual-err-gen" style="display:none;">
                    <i class='bx bx-error-circle'></i>
                    <span id="modal-reembolso-manual-err-gen-msg"></span>
                </div>` +
                reservaReembolsoTemplate({ credito: _rmCredito });
        }
        modalRM.open();
    }

    return {
        abrir: abrirModalReembolso
    };
}
