// src/features/canchas/canchas.quick-schedule.js
import { CanchaService } from './canchas.service.js';

export function initQuickSchedule(config = {}) {
    const { getSucursalId, getTodasCanchas } = config;
    
    let currentWeekStart = new Date();
    const day = currentWeekStart.getDay();
    const diff = currentWeekStart.getDate() - day + (day === 0 ? -6 : 1);
    currentWeekStart.setDate(diff);
    currentWeekStart.setHours(0, 0, 0, 0);

    const label = document.getElementById('qs-week-label');
    const container = document.getElementById('qs-days-container');
    const btnPrev = document.getElementById('btn-qs-prev');
    const btnNext = document.getElementById('btn-qs-next');

    if (!label || !container) return { update: () => {} };

    async function updateQS() {
        container.innerHTML = `
            <div style="width: 100%; text-align: center; padding: 30px; color: #94a3b8; font-size: 14px;">
                <div class="table-spinner"></div><br>Cargando disponibilidad...
            </div>
        `;

        const weekEnd = new Date(currentWeekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);

        const format = (d) => d.toISOString().split('T')[0];
        label.textContent = `${currentWeekStart.getDate()} ${currentWeekStart.toLocaleString('es-ES', { month: 'short' })} - ${weekEnd.getDate()} ${weekEnd.toLocaleString('es-ES', { month: 'short' })}`;

        try {
            const sucursalId = getSucursalId ? getSucursalId() : null;
            const data = await CanchaService.obtenerReservasSemana(format(currentWeekStart), format(weekEnd), sucursalId);
            const res = Array.isArray(data) ? data : (data.content || []);

            const todasCanchas = getTodasCanchas ? getTodasCanchas() : [];

            const days = [];
            for (let i = 0; i < 7; i++) {
                const d = new Date(currentWeekStart);
                d.setDate(d.getDate() + i);
                const dayStr = format(d);
                const dayRes = res.filter(r => r.fecha === dayStr);
                
                const totalCanchas = todasCanchas.length || 1;
                const totalSlots = totalCanchas * 15; 
                const occupancy = Math.min(Math.round((dayRes.length / totalSlots) * 100), 100);

                days.push({ date: d, count: dayRes.length, occupancy });
            }

            container.innerHTML = days.map(d => `
                <div class="qs-day-card" style="background:white; border:1px solid #e2e8f0; border-radius:12px; padding:16px; display:flex; flex-direction:column; gap:8px;">
                    <div style="display:flex; justify-content:space-between; align-items:start;">
                        <div>
                            <div style="font-size:11px; font-weight:700; color:#94a3b8; text-transform:uppercase;">${d.date.toLocaleString('es-ES', { weekday: 'short' })}</div>
                            <div style="font-size:16px; font-weight:700; color:#1e293b;">${d.date.getDate()}</div>
                        </div>
                        <div style="background:#f1f5f9; padding:4px 8px; border-radius:6px; font-size:11px; font-weight:700; color:#475569;">${d.count} Res.</div>
                    </div>
                    <div style="margin-top:4px;">
                        <div style="display:flex; justify-content:space-between; font-size:10px; font-weight:700; color:#64748b; margin-bottom:4px;">
                            <span>Ocupación</span>
                            <span>${d.occupancy}%</span>
                        </div>
                        <div style="height:6px; background:#f1f5f9; border-radius:3px; overflow:hidden;">
                            <div style="width:${d.occupancy}%; height:100%; background:${d.occupancy > 80 ? '#ef4444' : (d.occupancy > 50 ? '#f59e0b' : '#10b981')}; transition:width 0.5s ease;"></div>
                        </div>
                    </div>
                </div>
            `).join('');

            container.style.display = 'grid';
            container.style.gridTemplateColumns = 'repeat(7, 1fr)';
            container.style.gap = '12px';

        } catch (err) {
            console.error('Error en QS:', err);
            container.innerHTML = `<div style="padding:20px; color:#ef4444; text-align:center;">Error al cargar disponibilidad</div>`;
        }
    }

    btnPrev.onclick = () => { currentWeekStart.setDate(currentWeekStart.getDate() - 7); updateQS(); };
    btnNext.onclick = () => { currentWeekStart.setDate(currentWeekStart.getDate() + 7); updateQS(); };

    updateQS();

    return { update: updateQS };
}
