// src/features/mantenimientos/mantenimientos.modals.js
import { initModalShell } from '../../shared/components/modal-shell.js';
import { mantenimientosEditFormTemplate } from './mantenimientos.template.js';
import { MantenimientoService } from './mantenimientos.service.js';

export function initMantenimientoModals(onUpdate) {
    let _editId = null;

    const modalEdit = initModalShell({
        id: 'modal-mant-edit',
        title: 'Editar Mantenimiento',
        subtitle: 'Modifica la programación del mantenimiento',
        icon: 'bx bx-edit-alt',
        confirmText: 'Guardar Cambios',
        contentHtml: mantenimientosEditFormTemplate(),
        onConfirm: async (ctx) => {
            const ini = document.getElementById('edit-inicio').value;
            const fin = document.getElementById('edit-fin').value;
            const tip = document.getElementById('edit-tipo').value;
            const mot = document.getElementById('edit-motivo').value.trim();

            if (!ini) return ctx.showFieldError('edit-inicio', 'Requerido');
            if (!fin) return ctx.showFieldError('edit-fin', 'Requerido');
            if (!tip) return ctx.showFieldError('edit-tipo', 'Requerido');
            if (!mot) return ctx.showFieldError('edit-motivo', 'Requerido');

            ctx.setLoading(true);
            try {
                await MantenimientoService.actualizar(_editId, {
                    horaInicio: ini,
                    horaFin: fin,
                    tipoMantenimiento: tip,
                    motivo: mot
                });
                ctx.showToast('Mantenimiento actualizado');
                ctx.close();
                if (onUpdate) onUpdate();
            } catch (err) {
                ctx.setLoading(false);
                ctx.showError(err.message);
            }
        }
    });

    return {
        abrirEditar: (m) => {
            _editId = m.id;
            modalEdit.open();
            
            // Cargar datos
            document.getElementById('edit-inicio').value = m.horaInicio ? m.horaInicio.substring(0, 16) : '';
            document.getElementById('edit-fin').value = m.horaFin ? m.horaFin.substring(0, 16) : '';
            document.getElementById('edit-tipo').value = m.tipoMantenimiento || '';
            document.getElementById('edit-motivo').value = m.motivo || '';
            
            const area = document.getElementById('edit-motivo');
            const count = document.getElementById('edit-char-count');
            area.oninput = () => count.textContent = `${area.value.length}/200`;
            count.textContent = `${area.value.length}/200`;
        },

        abrirCancelar: (m) => {
            const modalConfirm = initModalShell({
                id: 'modal-mant-cancel',
                title: '¿Cancelar Mantenimiento?',
                subtitle: 'Esta acción es irreversible',
                icon: 'bx bx-trash-alt',
                confirmText: 'Sí, Cancelar',
                confirmClass: 'danger',
                contentHtml: `<p style="font-size:14px; color:#4b5563;">¿Estás seguro de que deseas cancelar el mantenimiento programado para la cancha <strong>${m.nombreCancha}</strong>?</p>`,
                onConfirm: async (ctx) => {
                    ctx.setLoading(true);
                    try {
                        await MantenimientoService.cancelar(m.id);
                        ctx.showToast('Mantenimiento cancelado');
                        ctx.close();
                        if (onUpdate) onUpdate();
                    } catch (err) {
                        ctx.setLoading(false);
                        ctx.showError(err.message);
                    }
                }
            });
            modalConfirm.open();
        }
    };
}
