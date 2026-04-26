// src/shared/components/status-badge.js

/**
 * Diccionario centralizado de estados y sus configuraciones visuales.
 */
const STATUS_MAP = {
    // Canchas / General
    DISPONIBLE:    { color: 'green',  label: 'Disponible' },
    MANTENIMIENTO: { color: 'yellow', label: 'Mantenimiento' },
    INACTIVA:      { color: 'gray',   label: 'Inactiva' },

    // Reservas / Mantenimientos
    PENDIENTE:     { color: 'yellow', label: 'Pendiente' },
    CONFIRMADA:    { color: 'blue',   label: 'Confirmada' },
    PAGADA:        { color: 'blue',   label: 'Pagada' },
    CANCELADA:     { color: 'red',    label: 'Cancelada' },
    CANCELADO:     { color: 'red',    label: 'Cancelado' },
    FINALIZADA:    { color: 'green',  label: 'Finalizada' },
    COMPLETADO:    { color: 'green',  label: 'Completado' },
    PROGRAMADO:    { color: 'blue',   label: 'Programado' },
    EN_PROCESO:    { color: 'yellow', label: 'En Proceso' },
    REEMBOLSADO:   { color: 'purple', label: 'Reembolsado' },

    // Pagos
    INGRESO:       { color: 'green',  label: 'Ingreso', icon: 'bx-chevrons-up' },
    SALIDA:        { color: 'red',    label: 'Salida',  icon: 'bx-chevrons-down' },
    ANULADO:       { color: 'red',    label: 'Anulado' },

    // Tipos Mantenimiento
    PREVENTIVO:    { color: 'blue',   label: 'Preventivo' },
    CORRECTIVO:    { color: 'yellow', label: 'Correctivo' },
    URGENTE:       { color: 'red',    label: 'Urgente' },
    
    // Clientes (Documentos)
    DNI:           { color: 'gray',   label: 'DNI' },
    RUC:           { color: 'gray',   label: 'RUC' },
    PASAPORTE:     { color: 'gray',   label: 'Pasaporte' }
};

/**
 * Genera el HTML de un badge de estado estandarizado.
 * 
 * @param {string} status - El código del estado (ej: 'DISPONIBLE').
 * @param {Object} [options] - Opciones adicionales.
 * @param {string} [options.color] - Sobrescribir el color (green, yellow, red, blue, purple, gray).
 * @param {string} [options.label] - Sobrescribir el texto.
 * @param {string} [options.icon] - Clase de Boxicons (ej: 'bx-check').
 * @param {boolean} [options.showDot] - Si se debe mostrar el punto lateral (default: true).
 * @param {string} [options.style] - Estilos inline adicionales.
 * @returns {string} HTML del badge.
 */
export function renderStatusBadge(status, options = {}) {
    const meta = STATUS_MAP[status] || { color: 'gray', label: status };
    
    const color = options.color || meta.color;
    const label = options.label || meta.label;
    const iconClass = options.icon || meta.icon || '';
    
    const showDot = options.showDot !== false; 
    const dotHtml = showDot ? '<span class="dot"></span>' : '';
    const iconHtml = iconClass ? `<i class='bx ${iconClass}' style='margin-right:4px;'></i>` : '';
    
    return `
        <span class="status-badge badge-${color}" title="${status}" style="${options.style || ''}">
            ${dotHtml}
            ${iconHtml}
            <span>${label}</span>
        </span>
    `;
}

/**
 * Retorna la configuración de un estado si se necesita para lógica fuera del render.
 */
export function getStatusMeta(status) {
    return STATUS_MAP[status] || { color: 'gray', label: status };
}
