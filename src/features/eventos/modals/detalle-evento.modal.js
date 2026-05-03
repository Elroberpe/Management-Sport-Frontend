import { initModalShell } from '../../../shared/components/modal-shell.js';
import { EventoService } from '../eventos.service.js';
import { eventoDetailTemplate } from '../eventos.modals.template.js';

export function initDetalleEventoModal({ onPago }) {
    let currentEvento = null;

    const modal = initModalShell({
        id: 'modal-detalle-evento',
        title: 'Detalles del Evento',
        subtitle: 'Resumen financiero y cronograma de canchas asignadas.',
        icon: 'bx bx-info-circle',
        confirmText: 'Cerrar',
        contentHtml: '<div id="mde-content" style="padding:20px; text-align:center;"><i class="bx bx-loader-alt bx-spin" style="font-size:24px; color:#64748b;"></i><p>Cargando información del evento...</p></div>',
        onConfirm: (ctx) => {
            ctx.close();
        }
    });

    return {
        ...modal,
        abrir: async (eventoId) => {
            modal.open();
            const container = document.getElementById('mde-content');
            if (container) {
                container.innerHTML = '<div style="padding:20px; text-align:center;"><i class="bx bx-loader-alt bx-spin" style="font-size:24px; color:#64748b;"></i><p>Cargando información del evento...</p></div>';
            }

            try {
                const [eventoData, pagosData] = await Promise.all([
                    EventoService.obtener(eventoId),
                    EventoService.obtenerPagos(eventoId).catch(() => [])
                ]);
                currentEvento = eventoData;
                
                const contentWrapper = document.querySelector('#modal-detalle-evento .modal-shell-body');
                if (contentWrapper) {
                    contentWrapper.innerHTML = eventoDetailTemplate(currentEvento);
                    
                    const btnCobrar = document.getElementById('det-evento-cobrar-btn');
                    if (btnCobrar) {
                        btnCobrar.addEventListener('click', () => {
                            modal.close();
                            if (onPago) onPago(currentEvento);
                        });
                    }

                    const btns = contentWrapper.querySelectorAll('.evt-tab-btn');
                    btns.forEach(b => b.onclick = () => {
                        btns.forEach(x => x.classList.remove('active'));
                        b.classList.add('active');
                        contentWrapper.querySelectorAll('.evt-tab-content').forEach(c => c.style.display = 'none');
                        contentWrapper.querySelector('#' + b.dataset.tab).style.display = 'block';
                    });

                    const tbody = document.getElementById('evt-tbody-pagos');
                    const emptyPagos = document.getElementById('evt-empty-pagos');
                    const pagosActivos = (Array.isArray(pagosData) ? pagosData : (pagosData.content || [])).filter(p => p.estado !== 'ANULADO');

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
                                <td>
                                    <div>${p.metodoPago || '—'}${tipoBadge}</div>
                                    ${p.nota ? `<div style="font-size:10px; color:#64748b; margin-top:3px; font-weight:normal; line-height:1.2;">${p.nota}</div>` : ''}
                                </td>
                                <td style="text-align:right; font-weight:600; color:${color}; vertical-align:top;">${signo} S/ ${Number(p.monto).toFixed(2)}</td>
                            </tr>`;
                        }).join('');
                        emptyPagos.style.display = 'none';
                    } else {
                        tbody.innerHTML = '';
                        emptyPagos.style.display = 'block';
                    }
                }
            } catch (err) {
                if (container) {
                    container.innerHTML = `<div style="padding:20px; text-align:center;"><i class="bx bx-error" style="font-size:24px; color:#ef4444;"></i><p>${err.message || 'Error al cargar el evento.'}</p></div>`;
                }
            }
        }
    };
}
