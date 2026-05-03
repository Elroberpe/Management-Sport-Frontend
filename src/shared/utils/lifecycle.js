// src/shared/utils/lifecycle.js
// Helper para el patrón de montaje/desmontaje de módulos de página (SPA lifecycle).
//
// Problema que resuelve: el mismo bloque de ~15 líneas estaba copiado
// en TODOS los *.page.js (canchas, clientes, usuarios, pagos, reservas, etc.)
//
// Uso:
//   import { createPageLifecycle } from '../../shared/utils/lifecycle.js';
//
//   let cleanup = null;
//
//   export function mount(container) {
//       const { addCleanup, addGlobalListener, getUnmount } = createPageLifecycle(cleanup);
//       // ... lógica del módulo ...
//       cleanup = getUnmount();
//   }
//
//   export function unmount() {
//       if (cleanup) { cleanup(); cleanup = null; }
//   }

/**
 * Crea un contexto de lifecycle para un módulo de página.
 * Ejecuta el cleanup del montaje anterior automáticamente si se pasa.
 *
 * @param {Function|null} previousCleanup - Cleanup del montaje anterior (para auto-limpieza)
 * @returns {{ addCleanup, addGlobalListener, getUnmount }}
 */
export function createPageLifecycle(previousCleanup = null) {
    // Limpiar montaje previo si existe
    if (previousCleanup) {
        try { previousCleanup(); } catch (e) { console.warn('[Lifecycle] Error en cleanup previo:', e); }
    }

    const cleanups = [];

    /**
     * Registra una función de limpieza que se ejecutará al desmontar.
     * @param {Function} fn
     */
    function addCleanup(fn) {
        cleanups.push(fn);
    }

    /**
     * Agrega un event listener y registra su remoción automática en el cleanup.
     * @param {EventTarget|null} target - Elemento DOM o window
     * @param {string} eventName - Nombre del evento
     * @param {Function} handler - Manejador del evento
     */
    function addGlobalListener(target, eventName, handler) {
        if (!target) return;
        target.addEventListener(eventName, handler);
        addCleanup(() => target.removeEventListener(eventName, handler));
    }

    /**
     * Devuelve la función de unmount que ejecuta todos los cleanups registrados.
     * @returns {Function}
     */
    function getUnmount() {
        return () => {
            cleanups.forEach(fn => {
                try { fn(); } catch (e) { console.warn('[Lifecycle] Error en cleanup:', e); }
            });
        };
    }

    return { addCleanup, addGlobalListener, getUnmount };
}
