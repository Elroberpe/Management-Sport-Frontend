export const DIAS_ES   = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
export const MESES_ES  = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

export const ESTADO_STYLE = {
    PAGADA:      { cls: 'c-blue',        label: 'Pagada',      dot: '#3b82f6' },
    PENDIENTE:   { cls: 'c-yellow',      label: 'Pendiente',   dot: '#eab308' },
    COMPLETADO:  { cls: 'c-green-light', label: 'Completada',  dot: '#10b981' },
    CANCELADO:   { cls: 'c-gray',        label: 'Cancelada',   dot: '#ef4444' },
    REEMBOLSADO: { cls: 'c-gray-purple', label: 'Reembolsada', dot: '#8b5cf6' }
};

export function getLunes(offset) {
    const hoy  = new Date();
    const dia  = hoy.getDay();
    const diff = (dia === 0) ? -6 : 1 - dia;
    const l    = new Date(hoy);
    l.setDate(hoy.getDate() + diff + (offset * 7));
    l.setHours(0, 0, 0, 0);
    return l;
}

export function toISO(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

export function formatHora(timeStr) {
    return timeStr ? timeStr.substring(0, 5) : '';
}

export function escapeHtml(s) {
    return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
