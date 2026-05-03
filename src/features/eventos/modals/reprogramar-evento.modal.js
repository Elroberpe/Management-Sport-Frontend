import { initModalShell } from '../../../shared/components/modal-shell.js';
import { EventoService } from '../eventos.service.js';
import { eventoReprogramarTemplate } from '../eventos.modals.template.js';
import { _initHorariosBuilder } from './eventos.modals.utils.js';

export function initReprogramarEventoModal({ onReprogramado }) {
    let currentEventoId = null;
    let horariosBuilder = null;

    const modal = initModalShell({
        id: 'modal-reprogramar-evento',
        title: 'Reprogramar Evento',
        subtitle: 'Define los nuevos horarios para el evento',
        icon: 'bx bx-calendar-edit',
        confirmText: 'Reprogramar',
        contentHtml: eventoReprogramarTemplate(),
        onConfirm: async (ctx) => {
            const horarios = horariosBuilder ? horariosBuilder.getHorarios() : [];

            if (horarios.length === 0 || horarios.some(h => !h.canchaId || !h.fecha || !h.horaInicio || !h.horaFin)) {
                document.getElementById('rep-horarios-err').textContent = 'Completa todos los campos de cada horario.';
                return;
            }

            ctx.setLoading(true);
            try {
                const actualizado = await EventoService.reprogramar(currentEventoId, {
                    nuevosHorarios: horarios
                });
                ctx.showToast('Evento reprogramado con éxito.');
                ctx.close();
                if (onReprogramado) onReprogramado(actualizado);
            } catch (err) {
                ctx.setLoading(false);
                ctx.showError(err.message || 'Error al reprogramar. Verifica la disponibilidad de los nuevos horarios.');
            }
        }
    });

    return {
        ...modal,
        abrir: async (evento) => {
            currentEventoId = evento.id || evento.eventoId;
            modal.open();

            const sucursalId = evento.sucursalId || null;
            horariosBuilder = _initHorariosBuilder('rep-horarios-container', 'rep-btn-add-horario', sucursalId);

            const reservas = evento.reservasAsociadas || [];
            if (reservas.length > 1) {
                for (let i = 1; i < reservas.length; i++) {
                    const r = reservas[i];
                    const [hInicio, hFin] = (r.horario || '').split(' - ');
                    await horariosBuilder.addRow({
                        canchaId: r.canchaId,
                        fecha: r.fecha,
                        horaInicio: hInicio,
                        horaFin: hFin,
                    });
                }
            }
        }
    };
}
