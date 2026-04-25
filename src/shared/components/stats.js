/**
 * Componente de Estadísticas Reutilizable
 * Renderiza una cuadrícula de tarjetas de métricas.
 */
export function initStats(containerId, cardsConfig) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`StatsComponent: Container #${containerId} not found`);
        return null;
    }

    container.innerHTML = `
        <div class="stats-grid">
            ${cardsConfig.map(card => `
                <div class="stat-card" id="stat-card-${card.id}">
                    <div class="stat-header">
                        <div class="stat-icon ${card.colorClass || 'blue'}">
                            <i class='${card.icon || 'bx bx-bar-chart-alt-2'}'></i>
                        </div>
                    </div>
                    <p class="stat-label">${card.label}</p>
                    <h2 class="stat-value" id="stat-val-${card.id}">${card.value || '0'}</h2>
                </div>
            `).join('')}
        </div>
    `;

    return {
        update: (id, newValue) => {
            const el = document.getElementById(`stat-val-${id}`);
            if (el) el.textContent = newValue;
        },
        updateAll: (data) => {
            Object.keys(data).forEach(id => {
                const el = document.getElementById(`stat-val-${id}`);
                if (el) el.textContent = data[id];
            });
        }
    };
}
