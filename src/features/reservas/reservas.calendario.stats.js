import { ESTADO_STYLE } from './reservas.calendario.utils.js';

export function renderBottomStats(reservasSemana) {
    const reservas = reservasSemana.filter(r =>
        r.estadoReserva !== 'CANCELADO' && r.estadoReserva !== 'REEMBOLSADO'
    );

    const completadas = reservas.filter(r => r.estadoReserva === 'COMPLETADO').length;

    const statTotalEl = document.getElementById('cal-stat-total');
    const statBarEl   = document.getElementById('cal-stat-bar');
    const subEl       = document.getElementById('cal-stat-sub');
    const listEl      = document.getElementById('cal-estado-list');

    if (statTotalEl) statTotalEl.textContent = completadas;
    if (statBarEl)   statBarEl.style.width = `${Math.min((completadas / Math.max(reservas.length, 1)) * 100, 100)}%`;
    if (subEl)       subEl.textContent = `de ${reservas.length} en total (${reservas.length ? Math.round((completadas/reservas.length)*100) : 0}%)`;

    const counts = {};
    reservasSemana.forEach(r => {
        counts[r.estadoReserva] = (counts[r.estadoReserva] || 0) + 1;
    });

    if (listEl) {
        listEl.innerHTML = '';
        Object.keys(ESTADO_STYLE).forEach(est => {
            const meta  = ESTADO_STYLE[est];
            const count = counts[est] || 0;
            const item  = document.createElement('div');
            item.className = 'cbc-item';
            item.innerHTML = `<strong style='display:flex;align-items:center;gap:6px;'><span style='width:8px;height:8px;border-radius:50%;background:${meta.dot};display:inline-block;'></span>${meta.label}</strong><span class='cbc-badge' style='background:#f1f5f9;color:#334155;'>${count}</span>`;
            listEl.appendChild(item);
        });
    }
}
