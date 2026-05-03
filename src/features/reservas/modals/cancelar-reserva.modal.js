import { initModalShell } from '../../../shared/components/modal-shell.js';
import { ReservaService } from '../reservas.service.js';
import { reservaCancelarTemplate } from '../reservas.modals.template.js';
import { HORAS_LIMITE_PENALIDAD, PORCENTAJE_PENALIDAD } from './reservas.modals.utils.js';

export function initCancelarReservaModal(ctx) {
    const { callbacks } = ctx;
    let _cxData           = null;
    let _cxNecesitaReemb  = false;
    let _cxMontoReemb     = 0;

    function calcularReembolso(reserva) {
        const montoPagado = Number(reserva.montoPagado || 0);
        if (montoPagado <= 0) return 0;

        const ahora         = new Date();
        const inicioReserva = new Date(`${reserva.fecha}T${reserva.horaInicio}`);
        const horasRestantes = (inicioReserva - ahora) / (1000 * 60 * 60);

        if (horasRestantes >= HORAS_LIMITE_PENALIDAD) {
            return montoPagado;
        } else {
            const penalidad = Number(reserva.montoTotal || 0) * PORCENTAJE_PENALIDAD;
            return Math.max(0, montoPagado - penalidad);
        }
    }

    const modalCX = initModalShell({
        id:          'modal-cancelar-reserva',
        title:       'Confirmar Cancelación de Reserva',
        icon:        'bx bx-x-circle',
        confirmText: 'Confirmar Cancelación',
        confirmStyle:'danger',
        contentHtml: '<div></div>',
        onConfirm: async (mCtx) => {
            const motivo = (document.getElementById('cx-motivo')?.value || '').trim();
            if (!motivo) {
                mCtx.showFieldError('cx-motivo', 'El motivo es obligatorio.');
                return;
            }

            if (_cxNecesitaReemb) {
                const metodo = document.getElementById('cx-metodo-reembolso')?.value;
                if (!metodo) {
                    mCtx.showFieldError('cx-metodo-reembolso', 'Selecciona el método de devolución.');
                    return;
                }
            }

            const id    = _cxData.id || _cxData.reservaId;
            const body  = { motivo };
            if (_cxNecesitaReemb) {
                body.metodoPagoReembolso = document.getElementById('cx-metodo-reembolso').value;
            }

            mCtx.setLoading(true);
            try {
                await ReservaService.cancelar(id, body);
                mCtx.showToast('Reserva cancelada correctamente');
                mCtx.close();
                if (callbacks.cargarSemana) callbacks.cargarSemana();
                if (callbacks.fetchHistorical) callbacks.fetchHistorical(0);
            } catch (err) {
                mCtx.setLoading(false);
                mCtx.showError(err.message || 'Error al cancelar la reserva');
            }
        }
    });

    function abrirModalCancelar(reserva) {
        _cxData          = reserva;
        _cxMontoReemb    = calcularReembolso(reserva);
        _cxNecesitaReemb = _cxMontoReemb > 0;

        const bodyEl = document.querySelector('#modal-cancelar-reserva .modal-shell-body');
        if (bodyEl) {
            bodyEl.innerHTML =
                `<div class="modal-shell-alert-error" id="modal-cancelar-reserva-err-gen" style="display:none;">
                    <i class='bx bx-error-circle'></i>
                    <span id="modal-cancelar-reserva-err-gen-msg"></span>
                </div>` +
                reservaCancelarTemplate({
                    reserva,
                    necesitaReembolso: _cxNecesitaReemb,
                    montoAReembolsar:  _cxMontoReemb
                });
        }
        modalCX.open();
    }

    return {
        abrir: abrirModalCancelar
    };
}
