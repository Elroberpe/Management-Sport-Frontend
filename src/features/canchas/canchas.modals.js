// src/features/canchas/canchas.modals.js
import { initModalShell } from '../../shared/components/modal-shell.js';
import { canchasNewFormTemplate, canchasEditFormTemplate, canchasMantenimientoFormTemplate } from './canchas.template.js';
import { CanchaService } from './canchas.service.js';

export function initCanchasModals(onUpdate) {
    let _editingId = null;
    let _mantCanchaId = null;

    // --- 1. MODAL NUEVA CANCHA ---
    const modalNC = initModalShell({
        id: 'modal-nueva-cancha',
        title: 'Nueva Cancha',
        subtitle: 'Registra una nueva cancha para tus sucursales',
        icon: 'bx bx-football',
        confirmText: 'Crear Cancha',
        contentHtml: canchasNewFormTemplate(),
        onConfirm: async (ctx) => {
            const sid = document.getElementById('nc-sucursal').value;
            const nom = document.getElementById('nc-nombre').value.trim();
            const pre = document.getElementById('nc-precio').value;

            if (!sid) return ctx.showFieldError('nc-sucursal', 'Selecciona una sede');
            if (!nom) return ctx.showFieldError('nc-nombre', 'El nombre es obligatorio');
            if (!pre) return ctx.showFieldError('nc-precio', 'El precio es obligatorio');

            ctx.setLoading(true);
            try {
                await CanchaService.crear({ sucursalId: parseInt(sid), nombre: nom, precioHora: parseFloat(pre) });
                ctx.showToast('Cancha creada con éxito');
                ctx.close();
                if (onUpdate) onUpdate();
            } catch (err) {
                ctx.setLoading(false);
                ctx.showError(err.message || 'Error al crear la cancha');
            }
        }
    });

    // --- 2. MODAL EDITAR CANCHA ---
    const modalEC = initModalShell({
        id: 'modal-edit-cancha',
        title: 'Editar Cancha',
        subtitle: 'Modifica los detalles de la cancha seleccionada',
        icon: 'bx bx-pencil',
        confirmText: 'Guardar Cambios',
        contentHtml: canchasEditFormTemplate(),
        onConfirm: async (ctx) => {
            const nom = document.getElementById('ec-nombre').value.trim();
            const pre = document.getElementById('ec-precio').value;

            if (!nom) return ctx.showFieldError('ec-nombre', 'El nombre es obligatorio');
            if (!pre) return ctx.showFieldError('ec-precio', 'El precio es obligatorio');

            ctx.setLoading(true);
            try {
                await CanchaService.actualizar(_editingId, { nombre: nom, precioHora: parseFloat(pre) });
                ctx.showToast('Cancha actualizada');
                ctx.close();
                if (onUpdate) onUpdate();
            } catch (err) {
                ctx.setLoading(false);
                ctx.showError(err.message || 'Error al actualizar');
            }
        }
    });

    // --- 3. MODAL MANTENIMIENTO ---
    const modalMant = initModalShell({
        id: 'modal-mantenimiento',
        title: 'Programar Mantenimiento',
        icon: 'bx bx-wrench',
        confirmText: 'Programar',
        contentHtml: canchasMantenimientoFormTemplate(),
        onConfirm: async (ctx) => {
            const ini = document.getElementById('pm-inicio').value;
            const fin = document.getElementById('pm-fin').value;
            const tip = document.getElementById('pm-tipo').value;
            const mot = document.getElementById('pm-motivo').value.trim();

            if (!ini) return ctx.showFieldError('pm-inicio', 'Requerido');
            if (!fin) return ctx.showFieldError('pm-fin', 'Requerido');
            if (!tip) return ctx.showFieldError('pm-tipo', 'Requerido');
            if (!mot) return ctx.showFieldError('pm-motivo', 'Requerido');

            ctx.setLoading(true);
            try {
                const payload = {
                    canchaId: _mantCanchaId,
                    horaInicio: ini + ':00',
                    horaFin: fin + ':00',
                    tipoMantenimiento: tip,
                    motivo: mot
                };
                await CanchaService.programarMantenimiento(payload);
                ctx.showToast('Mantenimiento programado');
                ctx.close();
                if (onUpdate) onUpdate();
            } catch (err) {
                ctx.setLoading(false);
                ctx.showError(err.message || 'Error al programar');
            }
        }
    });

    return {
        abrirNueva: (sucursalFiltro) => {
            modalNC.open();
            const el = document.getElementById('nc-sucursal');
            if (!el) return;
            el.innerHTML = '<option value="">Cargando...</option>';
            CanchaService.listarSucursales().then(sucursales => {
                el.innerHTML = '<option value="">— Seleccionar Sucursal —</option>';
                sucursales.forEach(s => {
                    const opt = document.createElement('option');
                    opt.value = s.sucursalId || s.id;
                    opt.textContent = s.nombre;
                    if (sucursalFiltro && opt.value == sucursalFiltro) opt.selected = true;
                    el.appendChild(opt);
                });
            });
        },
        abrirEditar: async (id) => {
            _editingId = id;
            modalEC.open();
            try {
                const c = await CanchaService.obtener(id);
                const inSuc = document.getElementById('ec-sucursal');
                const inNom = document.getElementById('ec-nombre');
                const inPre = document.getElementById('ec-precio');
                if (inSuc) inSuc.value = c.sucursalNombre || `Sede ${c.sucursalId}`;
                if (inNom) inNom.value = c.nombre;
                if (inPre) inPre.value = c.precioHora;
            } catch (err) {
                console.error('Error al cargar cancha:', err);
            }
        },
        abrirMantenimiento: (id) => {
            _mantCanchaId = id;
            modalMant.open();
        }
    };
}
