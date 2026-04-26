import { pagosTemplate } from './pagos.template.js';
import { pagosModalsTemplate } from './pagos.modals.template.js';
import { initTabla } from './pagos.tabla.js';
import { initModals } from './pagos.modals.js';
import { Store } from '../../core/store.js';
import { api } from '../../core/api.js';
import { initPageHeader } from '../../shared/components/page-header.js';

let mountCleanup = null;

export function template() {
    return pagosTemplate() + pagosModalsTemplate();
}

export function mount(container) {
    // Limpiar montajes previos
    if (mountCleanup) {
        mountCleanup();
        mountCleanup = null;
    }

    const cleanups = [];
    function addCleanup(fn) { cleanups.push(fn); }
    function addGlobalListener(target, eventName, handler) {
        if (!target) return;
        target.addEventListener(eventName, handler);
        addCleanup(() => target.removeEventListener(eventName, handler));
    }

    const header = initPageHeader({
        containerId: 'pagos-header-container',
        title: 'Pagos',
        subtitle: 'Historial financiero de la sede',
        extraActionsHtml: `
            <button id="pagos-btn-csv" class="btn btn-export-csv" style="display:flex;align-items:center;gap:6px;">
                <i class='bx bx-download'></i> Exportar CSV
            </button>
        `
    });

    addGlobalListener(document.getElementById('pagos-btn-csv'), 'click', () => {
        alert('Funcionalidad de exportación próximamente.');
    });

    function actualizarTextos(suc) {
        if (!header) return;
        header.updateTitle(suc ? 'Pagos — ' + suc.nombre : 'Pagos — Global');
        header.updateSubtitle(suc ? 'Historial financiero de ' + suc.nombre : 'Historial financiero global de todas las sedes');
    }
    
    actualizarTextos(Store.getSucursal());

    // 1. Inicializar Modales
    const modals = initModals({
        api,
        addGlobalListener,
        onPagoAnulado: (id, motivo) => tabla.marcarAnulado(id, motivo)
    });

    // 2. Inicializar Tabla
    const tabla = initTabla({
        api,
        Store,
        addCleanup,
        addGlobalListener,
        modals: {
            abrirDetalle: modals.abrirDetalle,
            abrirModalAnular: modals.abrirModalAnular,
            imprimirRecibo: modals.imprimirRecibo
        }
    });

    // Carga inicial
    tabla.cargarPagos();
    
    // Escuchar cambios de sede en el Dashboard
    addGlobalListener(window, 'sucursalChanged', () => {
        actualizarTextos(Store.getSucursal());
        tabla.cargarPagos();
    });

    mountCleanup = () => cleanups.forEach(fn => { try { fn(); } catch(e){} });
}

export function unmount() {
    if (mountCleanup) {
        mountCleanup();
        mountCleanup = null;
    }
}
