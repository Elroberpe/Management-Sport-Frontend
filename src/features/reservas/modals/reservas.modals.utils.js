// src/features/reservas/modals/reservas.modals.utils.js

export function escapeHtml(s) {
    return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

export function generarSlots(el, desde, hasta, selected) {
    el.innerHTML = '<option value="">— Seleccionar —</option>';
    for (let h = desde; h <= hasta; h++) {
        ['00', '30'].forEach(m => {
            if (h === hasta && m === '30') return;
            const val = `${h < 10 ? '0' + h : h}:${m}`;
            const opt = document.createElement('option');
            opt.value = val; opt.textContent = val;
            if (val === selected) opt.selected = true;
            el.appendChild(opt);
        });
    }
}

// Constantes compartidas para penalidades
export const HORAS_LIMITE_PENALIDAD = 3;
export const PORCENTAJE_PENALIDAD   = 0.30;
