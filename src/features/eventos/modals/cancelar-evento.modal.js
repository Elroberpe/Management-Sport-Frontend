import { initModalShell } from '../../../shared/components/modal-shell.js';
import { EventoService } from '../eventos.service.js';
import { eventoCancelarTemplate } from '../eventos.modals.template.js';

export function initCancelarEventoModal({ onCancelado }) {
    let currentEventoId = null;
    let _simulacion     = null;

    function _setupMetodoVisibility() {
        const montoEl = document.getElementById('ec-reembolso');
        const wrapper = document.getElementById('ec-metodo-wrapper');
        if (!montoEl || !wrapper) return;
        const toggle = () => {
            wrapper.style.display = (parseFloat(montoEl.value) || 0) > 0 ? 'block' : 'none';
        };
        toggle();
        montoEl.addEventListener('input', toggle);
    }

    const modal = initModalShell({
        id: 'modal-cancelar-evento',
        title: 'Cancelar Evento',
        subtitle: '¿Estás seguro? Esta acción no se puede deshacer.',
        icon: 'bx bx-x-circle',
        confirmText: 'Confirmar Cancelación',
        confirmStyle: 'danger',
        contentHtml: '<div></div>',
        onConfirm: async (ctx) => {
            const motivo = document.getElementById('ec-motivo')?.value.trim();
            const monto  = parseFloat(document.getElementById('ec-reembolso')?.value) || 0;
            const metodo = document.getElementById('ec-metodo')?.value;
            const nota   = document.getElementById('ec-nota')?.value.trim();

            let hasError = false;
            if (!motivo) {
                ctx.showFieldError('ec-motivo', 'El motivo es obligatorio.');
                hasError = true;
            }
            const maximo = _simulacion?.reembolsoMaximoPermitido ?? Infinity;
            if (monto > maximo) {
                ctx.showFieldError('ec-reembolso', `No puede superar S/ ${Number(maximo).toFixed(2)}.`);
                hasError = true;
            }
            if (monto > 0 && !metodo) {
                ctx.showFieldError('ec-metodo', 'Selecciona el método de devolución.');
                hasError = true;
            }
            if (hasError) return;

            const body = { motivo, montoReembolso: monto };
            if (nota)              body.notaReembolso = nota;
            if (metodo && monto > 0) body.metodoPago  = metodo;

            ctx.setLoading(true);
            try {
                const cancelado = await EventoService.cancelar(currentEventoId, body);
                ctx.showToast('Evento cancelado correctamente.');
                ctx.close();
                if (onCancelado) onCancelado(cancelado);
            } catch (err) {
                ctx.setLoading(false);
                ctx.showError(err.message || 'Error al cancelar el evento.');
            }
        }
    });

    return {
        ...modal,
        abrir: async (evento) => {
            currentEventoId = evento.id || evento.eventoId;
            modal.open();

            const bodyEl     = document.querySelector('#modal-cancelar-evento .modal-shell-body');
            const btnConfirm = document.getElementById('modal-cancelar-evento-btn-confirm');
            if (bodyEl) {
                bodyEl.innerHTML = `
                    <div style="text-align:center; padding:40px 20px;">
                        <i class="bx bx-loader-alt bx-spin" style="font-size:32px; color:#64748b;"></i>
                        <p style="color:#64748b; margin-top:12px; font-size:14px;">Calculando penalidades...</p>
                    </div>`;
            }
            if (btnConfirm) btnConfirm.disabled = true;

            try {
                _simulacion = await EventoService.simularCancelacion(currentEventoId);

                if (bodyEl) {
                    bodyEl.innerHTML =
                        `<div class="modal-shell-alert-error" id="modal-cancelar-evento-err-gen" style="display:none;">
                            <i class='bx bx-error-circle'></i>
                            <span id="modal-cancelar-evento-err-gen-msg"></span>
                        </div>` +
                        eventoCancelarTemplate(_simulacion);
                }
                if (btnConfirm) btnConfirm.disabled = false;
                _setupMetodoVisibility();

            } catch (err) {
                if (bodyEl) {
                    bodyEl.innerHTML = `
                        <div style="text-align:center; padding:30px 20px;">
                            <i class="bx bx-error" style="font-size:32px; color:#ef4444;"></i>
                            <p style="color:#ef4444; margin-top:8px; font-size:13px;">
                                ${err.message || 'Error al calcular penalidades.'}
                            </p>
                        </div>`;
                }
            }
        }
    };
}
