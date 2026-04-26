export const mantenimientosTemplate = () => `
<div class="mant-module">
    <div id="mantenimientos-header-container"></div>
    <div id="mantenimientos-stats-container"></div>
    
    <div class="standard-panel">
        <div class="filter-bar">
            <div class="filter-group">
                <select id="mf-cancha">
                    <option value="">Todas las canchas</option>
                </select>
                <select id="mf-estado">
                    <option value="">Todos los estados</option>
                    <option value="PROGRAMADO">Programado</option>
                    <option value="EN_PROCESO">En Proceso</option>
                    <option value="COMPLETADO">Completado</option>
                    <option value="CANCELADO">Cancelado</option>
                </select>
                <div>
                    <span>Desde:</span>
                    <input type="date" id="mf-desde">
                </div>
                <div>
                    <span>Hasta:</span>
                    <input type="date" id="mf-hasta">
                </div>
                <div class="filter-actions">
                    <button class="btn btn-primary" id="mf-apply">
                        <i class='bx bx-filter-alt'></i> Aplicar
                    </button>
                    <button id="mf-clear" class="btn-icon clear-btn" title="Limpiar filtros">
                        <i class='bx bx-reset'></i>
                    </button>
                </div>
            </div>
        </div>
        <div id="mantenimientos-table-container"></div>
    </div>
</div>
`;

export const mantenimientosEditFormTemplate = () => `
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
        <div class="modal-shell-field">
            <label class="modal-shell-label"><i class='bx bx-calendar-plus'></i> Inicio <span style="color:#ef4444;">*</span></label>
            <input type="datetime-local" id="edit-inicio" class="modal-shell-input">
            <span class="modal-shell-error-text" id="edit-inicio-err"></span>
        </div>
        <div class="modal-shell-field">
            <label class="modal-shell-label"><i class='bx bx-calendar-check'></i> Fin <span style="color:#ef4444;">*</span></label>
            <input type="datetime-local" id="edit-fin" class="modal-shell-input">
            <span class="modal-shell-error-text" id="edit-fin-err"></span>
        </div>
    </div>
    <div class="modal-shell-field">
        <label class="modal-shell-label"><i class='bx bx-category'></i> Tipo <span style="color:#ef4444;">*</span></label>
        <select id="edit-tipo" class="modal-shell-input">
            <option value="">— Seleccionar tipo —</option>
            <option value="PREVENTIVO">Preventivo</option>
            <option value="CORRECTIVO">Correctivo</option>
            <option value="URGENTE">Urgente</option>
        </select>
        <span class="modal-shell-error-text" id="edit-tipo-err"></span>
    </div>
    <div class="modal-shell-field">
        <label class="modal-shell-label"><i class='bx bx-note'></i> Motivo <span style="color:#ef4444;">*</span></label>
        <textarea id="edit-motivo" class="modal-shell-input" style="height:100px; resize:none;" maxlength="200" placeholder="Describe el motivo..."></textarea>
        <div style="display:flex; justify-content:space-between; margin-top:4px;">
            <span class="modal-shell-error-text" id="edit-motivo-err"></span>
            <span style="font-size:10px; color:#94a3b8;" id="edit-char-count">0/200</span>
        </div>
    </div>
`;
