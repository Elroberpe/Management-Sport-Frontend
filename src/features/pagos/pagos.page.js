import { pagosTemplate } from './pagos.template.js';
import { pagosModalsTemplate } from './pagos.modals.template.js';
import { initTabla } from './pagos.tabla.js';
import { initModals } from './pagos.modals.js';
import { Store } from '../../core/store.js';
import { api } from '../../core/api.js';

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
        target.addEventListener(eventName, handler);
        addCleanup(() => target.removeEventListener(eventName, handler));
    }


    function actualizarTextos(suc) {
        document.getElementById('pagos-title').textContent    = suc ? 'Pagos — ' + suc.nombre : 'Pagos — Global';
        document.getElementById('pagos-subtitle').textContent = suc ? 'Historial financiero de ' + suc.nombre : 'Historial financiero global de todas las sedes';
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
