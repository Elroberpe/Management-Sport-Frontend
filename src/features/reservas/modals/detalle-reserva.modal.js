import { initModalShell } from '../../../shared/components/modal-shell.js';
import { ReservaService } from '../reservas.service.js';
import { reservaDetailTemplate } from '../reservas.modals.template.js';

export function initDetalleReservaModal(ctx) {
    const { callbacks } = ctx;
    let _drId = null;
    let _drData = null;

    const modalDR = initModalShell({
        id: 'modal-detalle-reserva',
        title: 'Detalle de Reserva',
        icon: 'bx bx-calendar-check',
        confirmText: 'Añadir Pago',
        contentHtml: reservaDetailTemplate(),
        onConfirm: (mCtx) => {
            mCtx.close();
            const saldo = _drData ? Number(_drData.saldoPendiente) : 0;
            if (callbacks.abrirModalPago) {
                callbacks.abrirModalPago(_drId, saldo);
            }
        }
    });

    async function abrirDetalleReserva(id) {
        _drId = id;
        modalDR.open();
        document.getElementById('dr-loading').style.display = 'block';
        document.getElementById('dr-content').style.display = 'none';

        try {
            const [reserva, pagos] = await Promise.all([
                ReservaService.obtener(id),
                ReservaService.obtenerPagos(id)
            ]);
            _drData = reserva;
            renderDR(reserva, pagos);
        } catch (err) {
            document.getElementById('dr-loading').innerHTML =
                `<p style="text-align:center; color:#ef4444; padding:20px;"><i class='bx bx-error-circle' style='font-size:2rem; display:block; margin-bottom:8px;'></i>Error al cargar: ${err.message}</p>`;
        }
    }

    function renderDR(r, pagos = []) {
        document.getElementById('dr-loading').style.display = 'none';
        document.getElementById('dr-content').style.display = 'block';
        
        document.getElementById('dr-cliente').textContent = r.nombreCliente || '—';
        document.getElementById('dr-cancha').textContent = r.nombreCancha || '—';
        document.getElementById('dr-fecha').textContent = `${r.fecha}  ·  ${r.horaInicio.substring(0,5)} - ${r.horaFin.substring(0,5)}`;
        document.getElementById('dr-total').textContent = `S/ ${Number(r.montoTotal).toFixed(2)}`;
        document.getElementById('dr-pagado').textContent = `S/ ${Number(r.montoPagado).toFixed(2)}`;
        
        const saldo = Number(r.saldoPendiente);
        const elSaldo = document.getElementById('dr-saldo');
        elSaldo.textContent = `S/ ${Math.abs(saldo).toFixed(2)}`;
        elSaldo.style.color = saldo > 0 ? '#dc2626' : (saldo < 0 ? '#d97706' : '#059669');

        const btnAnadirPago = document.getElementById('modal-detalle-reserva-btn-confirm');
        if (btnAnadirPago) {
            const noAceptaPagos = (r.estadoReserva === 'CANCELADO' || r.estadoReserva === 'REEMBOLSADO' || r.eventoId);
            btnAnadirPago.style.display = (saldo > 0 && !noAceptaPagos) ? '' : 'none';
        }

        const btns = document.querySelectorAll('.dr-tab-btn');
        btns.forEach(b => b.onclick = () => {
            btns.forEach(x => x.classList.remove('active'));
            b.classList.add('active');
            document.querySelectorAll('.dr-tab-content').forEach(c => c.style.display = 'none');
            document.getElementById(b.dataset.tab).style.display = 'block';
        });

        const tbody = document.getElementById('dr-tbody-pagos');
        const pagosActivos = pagos.filter(p => p.estado !== 'ANULADO');

        if (pagosActivos.length > 0) {
            tbody.innerHTML = pagosActivos.map(p => {
                const esSalida  = p.tipoTransaccion === 'SALIDA';
                const signo     = esSalida ? '−' : '+';
                const color     = esSalida ? '#dc2626' : '#059669';
                const tipoBadge = esSalida
                    ? `<span style="font-size:10px; font-weight:700; background:#f3e8ff; color:#7e22ce; padding:2px 6px; border-radius:4px; margin-left:6px;">REEMBOLSO</span>`
                    : `<span style="font-size:10px; font-weight:700; background:#dbeafe; color:#1d4ed8; padding:2px 6px; border-radius:4px; margin-left:6px;">PAGO</span>`;
                return `
                <tr>
                    <td>${p.fecha || '—'}</td>
                    <td>${p.metodoPago || '—'}${tipoBadge}</td>
                    <td style="text-align:right; font-weight:600; color:${color};">${signo} S/ ${Number(p.monto).toFixed(2)}</td>
                </tr>`;
            }).join('');
            document.getElementById('dr-empty-pagos').style.display = 'none';
        } else {
            tbody.innerHTML = '';
            document.getElementById('dr-empty-pagos').style.display = 'block';
        }
    }

    return {
        abrir: abrirDetalleReserva
    };
}
