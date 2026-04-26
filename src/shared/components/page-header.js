// src/shared/components/page-header.js

/**
 * Componente PageHeader
 * Estandariza la cabecera de las páginas con título, subtítulo y acciones.
 * 
 * @param {Object} config
 * @param {string} config.containerId - ID del contenedor donde se renderizará.
 * @param {string} config.title - Título principal de la página.
 * @param {string} config.subtitle - Subtítulo descriptivo.
 * @param {string} [config.extraActionsHtml] - HTML opcional para botones adicionales (ej. Exportar).
 */
export function initPageHeader({ containerId, title, subtitle, extraActionsHtml = '' }) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.warn(`PageHeader: Container #${containerId} not found`);
        return null;
    }

    container.innerHTML = `
        <div class="page-header" style="align-items:center; margin-bottom:30px;">
            <div>
                <h1 class="page-title">${title}</h1>
                <p class="page-subtitle">${subtitle}</p>
            </div>
            <div style="display:flex; gap:12px; align-items:center;" class="page-header-actions">
                ${extraActionsHtml}
                <div id="${containerId}-primary-actions"></div>
            </div>
        </div>
    `;

    return {
        updateSubtitle: (newSubtitle) => {
            const sub = container.querySelector('.page-subtitle');
            if (sub) sub.innerHTML = newSubtitle;
        },
        updateTitle: (newTitle) => {
            const titleEl = container.querySelector('.page-title');
            if (titleEl) titleEl.innerHTML = newTitle;
        },
        // Retornamos el ID del contenedor de acciones primarias para initActionButton
        primaryActionsId: `${containerId}-primary-actions`
    };
}
