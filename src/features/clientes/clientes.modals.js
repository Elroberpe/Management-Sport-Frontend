// src/features/clientes/clientes.modals.js
import { api } from '../../core/api.js';
import { initModalShell } from '../../shared/components/modal-shell.js';
import { clientesNewFormTemplate } from './clientes.modals.template.js';

export function initClienteModal({ onClienteCreado }) {
    const modal = initModalShell({
        id: 'modal-nuevo-cliente',
        title: 'Crear Nuevo Cliente',
        subtitle: 'Registra un nuevo cliente global en el sistema',
        icon: 'bx bx-user-plus',
        confirmText: 'Guardar Cliente',
        contentHtml: clientesNewFormTemplate(),
        onConfirm: async (ctx) => {
            const tipoDoc = document.getElementById('nc-tipo-doc').value;
            const numDoc = document.getElementById('nc-num-doc').value.trim();
            const nombre = document.getElementById('nc-nombre').value.trim();
            const email = document.getElementById('nc-email').value.trim();
            const telefono = document.getElementById('nc-telefono').value.trim();

            let hasError = false;
            if (!numDoc) {
                ctx.showFieldError('nc-num-doc', 'El número de documento es obligatorio.');
                hasError = true;
            }
            if (!nombre) {
                ctx.showFieldError('nc-nombre', 'El nombre completo es obligatorio.');
                hasError = true;
            }

            if (hasError) return;

            ctx.setLoading(true);
            try {
                const payload = { tipoDocumento: tipoDoc, numDocumento: numDoc, nombre, email, telefono };
                const nuevoCliente = await api.post('/clientes', payload);
                
                ctx.showToast(`Cliente "${nuevoCliente.nombre}" creado con éxito.`);
                ctx.close();
                
                if (onClienteCreado) onClienteCreado(nuevoCliente);
            } catch (err) {
                ctx.setLoading(false);
                if (err.status === 400 || err.status === 409) {
                    ctx.showError(err.message || 'El número de documento ya existe o los datos son inválidos.');
                    ctx.showFieldError('nc-num-doc', ''); // Mark as red
                } else {
                    ctx.showError('Error al conectar con el servidor.');
                }
            }
        }
    });

    return modal;
}
