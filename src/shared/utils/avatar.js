// src/shared/utils/avatar.js
// Utilidades para renderizar avatares circulares con iniciales.
// Centraliza la paleta de colores y los helpers de iniciales,
// eliminando la duplicación en canchas.page.js, clientes.page.js y usuarios.page.js.

/**
 * Paleta de colores para avatares (indexada por ID de entidad).
 * @type {string[]}
 */
export const AVATAR_COLORS = [
    '#1a8f3b', // verde oscuro
    '#2563eb', // azul
    '#9333ea', // púrpura
    '#ea580c', // naranja
    '#0891b2', // cyan
    '#d97706', // ámbar
    '#e11d48', // rojo
];

/**
 * Obtiene el color de avatar para una entidad según su ID.
 * @param {number|string} id - ID de la entidad
 * @returns {string} Color hexadecimal
 */
export function getAvatarColor(id) {
    return AVATAR_COLORS[(id || 0) % AVATAR_COLORS.length];
}

/**
 * Genera las iniciales de un nombre (máximo 2 palabras).
 * @param {string} nombre - Nombre completo
 * @returns {string} Iniciales en mayúscula (ej: "Juan Perez" → "JP")
 */
export function getInitials(nombre) {
    return (nombre || '??')
        .split(' ')
        .slice(0, 2)
        .map(w => w[0])
        .join('')
        .toUpperCase();
}

/**
 * Genera el HTML de un avatar circular con iniciales.
 * @param {string} nombre - Nombre para extraer iniciales
 * @param {number|string} id - ID para determinar color
 * @param {object} [opts]
 * @param {string} [opts.size='36px'] - Tamaño del círculo
 * @param {string} [opts.fontSize='13px'] - Tamaño de fuente
 * @returns {string} HTML del avatar
 */
export function renderAvatarHtml(nombre, id, opts = {}) {
    const size = opts.size || '36px';
    const fontSize = opts.fontSize || '13px';
    const color = getAvatarColor(id);
    const initials = getInitials(nombre);

    return `<div style="width:${size}; height:${size}; border-radius:50%; background:${color}; color:white; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:${fontSize}; flex-shrink:0;">${initials}</div>`;
}
