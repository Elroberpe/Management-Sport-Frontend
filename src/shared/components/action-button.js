/**
 * Componente de Botón de Acción Reutilizable
 * Estandariza los botones de creación en los headers de los módulos.
 */
export function initActionButton({ containerId, label, icon, onClick }) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.warn(`ActionButton: Container #${containerId} not found`);
        return null;
    }

    container.innerHTML = `
        <button class="btn-action-primary" id="btn-action-${containerId}">
            <i class='${icon || 'bx bx-plus'}'></i>
            <span>${label}</span>
        </button>
    `;

    const btn = container.querySelector(`#btn-action-${containerId}`);
    if (btn) {
        btn.onclick = (e) => {
            if (onClick) onClick(e);
        };
    }
    
    return btn;
}
