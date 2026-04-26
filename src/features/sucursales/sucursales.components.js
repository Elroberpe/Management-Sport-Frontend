// src/features/sucursales/sucursales.components.js

const COLORS = ['#1a8f3b', '#2563eb', '#9333ea', '#ea580c', '#0891b2', '#d97706'];

function getInitials(nombre) {
    return nombre.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

function getColor(id) {
    return COLORS[id % COLORS.length];
}

/**
 * Genera el elemento DOM para una tarjeta de sucursal
 * @param {Object} s Datos de la sucursal
 * @param {Object} actions Callbacks para eventos
 */
export function createBranchCard(s, { onToggle, onEdit, onDelete, onEnter }) {
    const sid = s.sucursalId !== undefined ? s.sucursalId : s.id;
    const color = getColor(sid);
    const initials = getInitials(s.nombre);
    const activo = s.activo;

    const card = document.createElement('div');
    card.className = `branch-card ${activo ? '' : 'inactive'}`;
    card.dataset.id = sid;

    const phoneHTML = s.telefono
        ? `<p class='bc-phone'><i class='bx bx-phone'></i> ${s.telefono}</p>`
        : '';

    card.innerHTML = `
        <div class='bc-image' style='background:${color}20;display:flex;align-items:center;justify-content:center;min-height:120px;'>
            <div style='width:72px;height:72px;border-radius:50%;background:${color};display:flex;align-items:center;justify-content:center;font-size:26px;font-weight:800;color:#fff;'>
                ${initials}
            </div>
            <span class='bc-badge ${activo ? 'success' : 'gray'}'>${activo ? '• ACTIVO' : '• INACTIVO'}</span>
        </div>
        <div class='bc-content'>
            <div class='bc-header'>
                <div>
                    <h3>${s.nombre}</h3>
                    <p class='bc-location'><i class='bx bx-map pin-icon'></i> ${s.direccion}</p>
                    ${phoneHTML}
                </div>
                <div class='bc-toggle-wrap'>
                    <label class='toggle-switch'>
                        <input type='checkbox' class='sede-toggle' data-id='${sid}' ${activo ? 'checked' : ''}>
                        <span class='slider'></span>
                    </label>
                    <span class='bc-toggle-label ${activo ? '' : 'offline'}'>${activo ? 'ACTIVO' : 'INACTIVO'}</span>
                </div>
            </div>
            <div class='bc-actions'>
                <div class='action-buttons-group'>
                    <button class='icon-btn btn-edit-sede' data-id='${sid}' title='Editar'><i class='bx bx-pencil'></i></button>
                    <button class='icon-btn btn-delete-sede' data-id='${sid}' title='Eliminar'><i class='bx bx-trash'></i></button>
                </div>
                <button class='btn-text-arrow btn-ingresar-sede ${activo ? '' : 'text-muted'}' data-id='${sid}' data-nombre='${s.nombre}'>
                    Ingresar a Sede <i class='bx bx-right-arrow-alt'></i>
                </button>
            </div>
        </div>
    `;

    // Bind Events
    card.querySelector('.sede-toggle').addEventListener('change', (e) => onToggle(sid, e.target.checked, e));
    card.querySelector('.btn-edit-sede').addEventListener('click', () => onEdit(sid));
    card.querySelector('.btn-delete-sede').addEventListener('click', () => onDelete(sid));
    card.querySelector('.btn-ingresar-sede').addEventListener('click', () => onEnter(sid, s.nombre));

    return card;
}
