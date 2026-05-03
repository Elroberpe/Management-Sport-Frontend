import { initModalShell } from '../../../shared/components/modal-shell.js';
import { ReservaService } from '../reservas.service.js';
import { reservaReprogramarTemplate } from '../reservas.modals.template.js';
import { generarSlots } from './reservas.modals.utils.js';

export function initReprogramarReservaModal(ctx) {
    const { callbacks } = ctx;
    let _rpData      = null;
    let _rpPrecioHora = 0;

    const modalRP = initModalShell({
        id:          'modal-reprogramar-reserva',
        title:       'Reprogramar Reserva',
        subtitle:    'Selecciona la nueva fecha y horario',
        icon:        'bx bx-calendar-edit',
        confirmText: 'Confirmar Reprogramación',
        contentHtml: '<div></div>',
        onConfirm: async (mCtx) => {
            const fecha  = document.getElementById('rp-fecha')?.value;
            const inicio = document.getElementById('rp-hora-inicio')?.value;
            const fin    = document.getElementById('rp-hora-fin')?.value;

            let hasError = false;
            if (!fecha)  { mCtx.showFieldError('rp-fecha',       'La fecha es requerida.');          hasError = true; }
            if (!inicio) { mCtx.showFieldError('rp-hora-inicio', 'La hora de inicio es requerida.'); hasError = true; }
            if (!fin)    { mCtx.showFieldError('rp-hora-fin',    'La hora de fin es requerida.');    hasError = true; }
            if (hasError) return;

            const id = _rpData.id || _rpData.reservaId;
            mCtx.setLoading(true);
            try {
                await ReservaService.reprogramar(id, {
                    nuevaFecha:      fecha,
                    nuevaHoraInicio: inicio + ':00',
                    nuevaHoraFin:    fin    + ':00'
                });
                mCtx.showToast('¡Reserva reprogramada con éxito!');
                mCtx.close();
                if (callbacks.cargarSemana) callbacks.cargarSemana();
                if (callbacks.fetchHistorical) callbacks.fetchHistorical(0);
            } catch (err) {
                mCtx.setLoading(false);
                mCtx.showError(err.message || 'El horario seleccionado no está disponible.');
            }
        }
    });

    function recalcularRP() {
        const inicio  = document.getElementById('rp-hora-inicio')?.value;
        const fin     = document.getElementById('rp-hora-fin')?.value;
        const resumen = document.getElementById('rp-resumen');
        if (!resumen) return;

        if (!inicio || !fin) { resumen.style.display = 'none'; return; }

        const [hI, mI] = inicio.split(':').map(Number);
        const [hF, mF] = fin.split(':').map(Number);
        const durHoras  = ((hF * 60 + mF) - (hI * 60 + mI)) / 60;

        if (durHoras <= 0) { resumen.style.display = 'none'; return; }

        const nuevoCosto  = _rpPrecioHora * durHoras;
        const montoPagado = Number(_rpData.montoPagado || 0);
        const ajuste      = nuevoCosto - montoPagado;

        document.getElementById('rp-nuevo-costo').textContent = `S/ ${nuevoCosto.toFixed(2)}`;

        const ajusteEl  = document.getElementById('rp-ajuste-texto');
        const ajusteVal = document.getElementById('rp-ajuste-val');

        if (ajuste > 0.005) {
            ajusteEl.textContent = 'Nuevo saldo a pagar:';
            ajusteVal.textContent = `S/ ${ajuste.toFixed(2)}`;
            ajusteVal.style.color = '#d97706';
        } else if (ajuste < -0.005) {
            ajusteEl.textContent = 'Crédito generado a favor:';
            ajusteVal.textContent = `S/ ${Math.abs(ajuste).toFixed(2)}`;
            ajusteVal.style.color = '#059669';
        } else {
            ajusteEl.textContent = 'Saldo sin cambios:';
            ajusteVal.textContent = 'S/ 0.00';
            ajusteVal.style.color = '#2563eb';
        }

        resumen.style.display = 'block';
    }

    function abrirModalReprogramar(reserva) {
        _rpData = reserva;

        const [hi, mi] = (reserva.horaInicio || '00:00').split(':').map(Number);
        const [hf, mf] = (reserva.horaFin    || '00:00').split(':').map(Number);
        const durOrig   = ((hf * 60 + mf) - (hi * 60 + mi)) / 60;
        _rpPrecioHora   = durOrig > 0 ? Number(reserva.montoTotal || 0) / durOrig : 0;

        const bodyEl = document.querySelector('#modal-reprogramar-reserva .modal-shell-body');
        if (bodyEl) {
            bodyEl.innerHTML =
                `<div class="modal-shell-alert-error" id="modal-reprogramar-reserva-err-gen" style="display:none;">
                    <i class='bx bx-error-circle'></i>
                    <span id="modal-reprogramar-reserva-err-gen-msg"></span>
                </div>` +
                reservaReprogramarTemplate(reserva);
        }

        const rpFecha  = document.getElementById('rp-fecha');
        const rpInicio = document.getElementById('rp-hora-inicio');
        const rpFin    = document.getElementById('rp-hora-fin');
        if (rpFecha) rpFecha.value = reserva.fecha || '';

        generarSlots(rpInicio, 7, 24, (reserva.horaInicio || '').substring(0, 5));

        const inicioVal = (reserva.horaInicio || '07:00').substring(0, 5);
        const [hIni, mIni] = inicioVal.split(':').map(Number);
        const startMin = hIni * 60 + mIni + 30;
        rpFin.innerHTML = '<option value="">\u2014 Seleccionar \u2014</option>';
        rpFin.disabled  = false;
        for (let h = Math.floor(startMin / 60); h <= 24; h++) {
            const mmOpts = (h === Math.floor(startMin / 60) && startMin % 60 === 30) ? ['30'] : ['00', '30'];
            mmOpts.forEach(mm => {
                if (h === 24 && mm === '30') return;
                const time = `${h < 10 ? '0' + h : h}:${mm}`;
                const opt  = document.createElement('option');
                opt.value = time; opt.textContent = time;
                if (time === (reserva.horaFin || '').substring(0, 5)) opt.selected = true;
                rpFin.appendChild(opt);
            });
        }

        rpFecha.onchange  = recalcularRP;
        rpFin.onchange    = recalcularRP;
        rpInicio.onchange = () => {
            const val = rpInicio.value;
            if (!val) {
                rpFin.innerHTML = '<option value="">\u2014 Selecciona inicio \u2014</option>';
                rpFin.disabled  = true;
                recalcularRP();
                return;
            }
            const [h, m] = val.split(':').map(Number);
            const sMin   = h * 60 + m + 30;
            rpFin.innerHTML = '<option value="">\u2014 Seleccionar \u2014</option>';
            rpFin.disabled  = false;
            for (let hh = Math.floor(sMin / 60); hh <= 24; hh++) {
                const mmOpts = (hh === Math.floor(sMin / 60) && sMin % 60 === 30) ? ['30'] : ['00', '30'];
                mmOpts.forEach(mm => {
                    if (hh === 24 && mm === '30') return;
                    const time = `${hh < 10 ? '0' + hh : hh}:${mm}`;
                    const opt  = document.createElement('option');
                    opt.value = time; opt.textContent = time;
                    rpFin.appendChild(opt);
                });
            }
            recalcularRP();
        };

        recalcularRP();
        modalRP.open();
    }

    return {
        abrir: abrirModalReprogramar
    };
}
