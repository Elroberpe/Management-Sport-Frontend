import { initModalShell } from '../../../shared/components/modal-shell.js';
import { EventoService } from '../eventos.service.js';
import { eventoEditFormTemplate } from '../eventos.modals.template.js';

export function initEditarEventoModal({ onActualizado }) {
    let currentEventoId = null;

    const modal = initModalShell({
        id: 'modal-editar-evento',
        title: 'Editar Evento',
        subtitle: 'Modifica los datos del evento seleccionado',
        icon: 'bx bx-pencil',
        confirmText: 'Guardar Cambios',
        contentHtml: eventoEditFormTemplate(),
        onConfirm: async (ctx) => {
            const nombre     = document.getElementById('ee-nombre').value.trim();
            const tipo       = document.getElementById('ee-tipo').value;
            const descripcion = document.getElementById('ee-descripcion').value.trim();
            const fechaInicio = document.getElementById('ee-fecha-inicio').value;
            const fechaFin   = document.getElementById('ee-fecha-fin').value;
            const monto      = parseFloat(document.getElementById('ee-monto').value);

            if (!nombre) { ctx.showFieldError('ee-nombre', 'El nombre es obligatorio.'); return; }

            ctx.setLoading(true);
            try {
                const payload = {
                    nombre, tipoEvento: tipo, descripcion,
                    fechaInicio, fechaFin, montoPactado: monto || undefined,
                };
                const actualizado = await EventoService.actualizar(currentEventoId, payload);
                ctx.showToast(`Evento "${actualizado.nombre}" actualizado.`);
                ctx.close();
                if (onActualizado) onActualizado(actualizado);
            } catch (err) {
                ctx.setLoading(false);
                ctx.showError(err.message || 'Error al actualizar el evento.');
            }
        }
    });

    return {
        ...modal,
        abrir: async (eventoId) => {
            currentEventoId = eventoId;
            modal.open();
            try {
                const e = await EventoService.obtener(eventoId);
                document.getElementById('ee-nombre').value       = e.nombre || '';
                document.getElementById('ee-tipo').value         = e.tipoEvento || 'TORNEO';
                document.getElementById('ee-descripcion').value  = e.descripcion || '';
                document.getElementById('ee-fecha-inicio').value = e.fechaInicio || '';
                document.getElementById('ee-fecha-fin').value    = e.fechaFin || '';
                document.getElementById('ee-monto').value        = e.montoPactado || '';
            } catch (err) {
                console.error('[EventosModal] Error al cargar evento:', err);
                modal.showError('No se pudo cargar la información del evento.');
            }
        }
    };
}
