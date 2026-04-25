// src/shared/components/table.js
/**
 * Componente de Tabla Reutilizable
 * Proporciona una interfaz estandarizada para mostrar datos en formato de tabla
 * con soporte para paginación, acciones y renderizado personalizado.
 */

export function initTable(config) {
    const {
        containerId,
        columns = [],
        fetchData, // function(page) => Promise<{ content, totalPages, number, totalElements }>
        actions = [], // Array<{ label, icon, onClick, class, show }>
        emptyMessage = 'No se encontraron resultados',
        pageSize = 10,
        showPagination = true
    } = config;

    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`TableComponent: Container #${containerId} not found`);
        return;
    }

    let currentPage = 0;
    let totalPages = 1;
    let allData = [];

    // Renderizado inicial de la estructura
    container.innerHTML = `
        <div class="table-container">
            <div class="table-wrapper">
                <table class="custom-table" id="${containerId}-table">
                    <thead>
                        <tr>
                            ${columns.map(col => `<th>${col.label}</th>`).join('')}
                            ${actions.length > 0 ? '<th style="text-align:center;">Acciones</th>' : ''}
                        </tr>
                    </thead>
                    <tbody id="${containerId}-tbody">
                        <!-- Content loaded via JS -->
                    </tbody>
                </table>
            </div>
            
            <div class="table-pagination" id="${containerId}-pagination" style="display: none;">
                <div class="pagination-info" id="${containerId}-page-info">
                    Mostrando 0 resultados
                </div>
                <div class="pagination-controls">
                    <button class="pagination-btn" id="${containerId}-page-first" title="Primera página">
                        <i class='bx bx-chevrons-left'></i>
                    </button>
                    <button class="pagination-btn" id="${containerId}-page-prev" title="Anterior">
                        <i class='bx bx-chevron-left'></i>
                    </button>
                    <span style="padding: 0 10px; display: flex; align-items: center; font-weight: 600;" id="${containerId}-page-current">
                        Página 1 de 1
                    </span>
                    <button class="pagination-btn" id="${containerId}-page-next" title="Siguiente">
                        <i class='bx bx-chevron-right'></i>
                    </button>
                    <button class="pagination-btn" id="${containerId}-page-last" title="Última página">
                        <i class='bx bx-chevrons-right'></i>
                    </button>
                </div>
            </div>
        </div>
    `;

    const tbody = document.getElementById(`${containerId}-tbody`);
    const pagination = document.getElementById(`${containerId}-pagination`);
    const pageInfo = document.getElementById(`${containerId}-page-info`);
    const pageCurrent = document.getElementById(`${containerId}-page-current`);
    
    const btnFirst = document.getElementById(`${containerId}-page-first`);
    const btnPrev = document.getElementById(`${containerId}-page-prev`);
    const btnNext = document.getElementById(`${containerId}-page-next`);
    const btnLast = document.getElementById(`${containerId}-page-last`);

    function escapeHtml(unsafe) {
        return (unsafe || '').toString()
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    async function loadPage(page = 0) {
        currentPage = page;
        
        // Show loading
        tbody.innerHTML = `
            <tr>
                <td colspan="${columns.length + (actions.length > 0 ? 1 : 0)}" class="table-empty-state">
                    <div class="table-spinner"></div>
                    <p>Cargando datos...</p>
                </td>
            </tr>
        `;

        try {
            const response = await fetchData(page);
            const items = response.content || response.items || [];
            totalPages = response.totalPages || 1;
            const totalElements = response.totalElements || items.length;
            const pageNumber = response.number || 0;
            allData = items;

            renderRows(items);
            updatePagination(pageNumber, totalPages, totalElements);
        } catch (error) {
            console.error('TableComponent Error:', error);
            tbody.innerHTML = `
                <tr>
                    <td colspan="${columns.length + (actions.length > 0 ? 1 : 0)}" class="table-empty-state">
                        <i class='bx bx-error-circle' style='font-size: 2rem; color: #ef4444;'></i>
                        <p style='color: #ef4444; margin-top: 10px;'>Error al cargar los datos</p>
                    </td>
                </tr>
            `;
        }
    }

    function renderRows(items) {
        if (items.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="${columns.length + (actions.length > 0 ? 1 : 0)}" class="table-empty-state">
                        <i class='bx bx-search-alt' style='font-size: 2.5rem; opacity: 0.2; margin-bottom: 10px; display: block;'></i>
                        ${emptyMessage}
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = '';
        items.forEach((item, index) => {
            const tr = document.createElement('tr');
            
            // Render columns
            let rowHtml = columns.map(col => {
                const value = col.key.split('.').reduce((obj, key) => obj && obj[key], item);
                const content = col.render ? col.render(value, item) : escapeHtml(value);
                return `<td>${content}</td>`;
            }).join('');

            // Render actions
            if (actions.length > 0) {
                const visibleActions = actions.filter(a => !a.show || a.show(item));
                
                rowHtml += `
                    <td style="text-align: center;">
                        <div class="table-actions" id="actions-${containerId}-${index}">
                            <button class="table-actions-btn" data-toggle="menu">
                                <i class='bx bx-dots-vertical-rounded'></i>
                            </button>
                            <div class="table-actions-menu">
                                ${visibleActions.map((action, i) => `
                                    <button class="table-actions-item ${action.class || ''}" data-index="${i}">
                                        <i class='${action.icon || 'bx bx-chevron-right'}'></i>
                                        ${action.label}
                                    </button>
                                `).join('')}
                            </div>
                        </div>
                    </td>
                `;
            }

            tr.innerHTML = rowHtml;
            tbody.appendChild(tr);

            // Add event listeners for actions
            if (actions.length > 0) {
                const actionWrap = tr.querySelector('.table-actions');
                const toggleBtn = actionWrap.querySelector('[data-toggle="menu"]');
                
                toggleBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    // Close other menus
                    document.querySelectorAll('.table-actions.active').forEach(el => {
                        if (el !== actionWrap) el.classList.remove('active');
                    });
                    actionWrap.classList.toggle('active');
                });

                actionWrap.querySelectorAll('.table-actions-item').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const actionIndex = btn.dataset.index;
                        const visibleActions = actions.filter(a => !a.show || a.show(item));
                        const action = visibleActions[actionIndex];
                        actionWrap.classList.remove('active');
                        if (action && action.onClick) action.onClick(item);
                    });
                });
            }
        });
    }

    function updatePagination(number, totalPgs, totalEls) {
        if (!showPagination || totalPgs <= 1) {
            pagination.style.display = 'none';
            return;
        }

        pagination.style.display = 'flex';
        pageInfo.textContent = `Mostrando ${allData.length} de ${totalEls} resultados`;
        pageCurrent.textContent = `Página ${number + 1} de ${totalPgs}`;

        btnFirst.disabled = number === 0;
        btnPrev.disabled = number === 0;
        btnNext.disabled = number === totalPgs - 1;
        btnLast.disabled = number === totalPgs - 1;
    }

    // Global listener to close action menus
    const closeMenus = (e) => {
        if (!e.target.closest('.table-actions')) {
            document.querySelectorAll('.table-actions.active').forEach(el => el.classList.remove('active'));
        }
    };
    document.addEventListener('click', closeMenus);

    // Pagination events
    btnFirst.onclick = () => loadPage(0);
    btnPrev.onclick  = () => loadPage(currentPage - 1);
    btnNext.onclick  = () => loadPage(currentPage + 1);
    btnLast.onclick  = () => loadPage(totalPages - 1);

    // Initial load
    // loadPage(0); // We leave it to the user to call .fetch() initially if they want

    return {
        fetch: loadPage,
        setData: (data) => {
            allData = data;
            renderRows(data);
            pagination.style.display = 'none';
        },
        destroy: () => {
            document.removeEventListener('click', closeMenus);
        }
    };
}
