export const mantenimientosTemplate = () => `
<div class="mant-module">
    <div class="page-header" style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:24px;">
        <div>
            <h1 class="page-title" style="margin:0 0 4px;">Gestión de Mantenimientos</h1>
            <p class="page-subtitle" style="margin:0;">Administra y supervisa todos los mantenimientos programados</p>
        </div>
    </div>
    <div id="mantenimientos-stats-container"></div>
    <div class="panel table-container-full" style="padding:0; overflow:hidden; margin-bottom:40px;">
        <div class="table-toolbar" style="padding: 16px 24px; border-bottom: 1px solid #eef2f6; display:flex; gap:12px; justify-content:space-between; align-items:flex-end;">
            <div class="toolbar-left" style="display:flex; gap:12px; align-items:center;">
                <div class="select-wrap">
                    <select id="mf-cancha" style="font-size:13px; padding: 8px 30px 8px 12px; border: 1.5px solid #e2e8f0; border-radius: 8px; background:#f8fafc; outline:none; color:#1e293b; appearance:none; min-width: 150px;">
                        <option value="">Todas las canchas</option>
                    </select>
                    <i class='bx bx-chevron-down' style="position:absolute; right:10px; top:50%; transform:translateY(-50%); color:#94a3b8; pointer-events:none;"></i>
                </div>
                <div class="select-wrap">
                    <select id="mf-estado" style="font-size:13px; padding: 8px 30px 8px 12px; border: 1.5px solid #e2e8f0; border-radius: 8px; background:#f8fafc; outline:none; color:#1e293b; appearance:none; min-width: 120px;">
                        <option value="">Todos los estados</option>
                        <option value="PROGRAMADO">Programado</option>
                        <option value="EN_PROCESO">En Proceso</option>
                        <option value="COMPLETADO">Completado</option>
                        <option value="CANCELADO">Cancelado</option>
                    </select>
                    <i class='bx bx-chevron-down' style="position:absolute; right:10px; top:50%; transform:translateY(-50%); color:#94a3b8; pointer-events:none;"></i>
                </div>
                <div style="display:flex; align-items:center; gap:6px;">
                    <span style="font-size:12px; font-weight:600; color:#94a3b8;">DESDE:</span>
                    <input type="date" id="mf-desde" style="border: 1.5px solid #e2e8f0; border-radius: 8px; padding: 7px 12px; font-size: 13px; background:#f8fafc; outline:none;">
                </div>
                <div style="display:flex; align-items:center; gap:6px;">
                    <span style="font-size:12px; font-weight:600; color:#94a3b8;">HASTA:</span>
                    <input type="date" id="mf-hasta" style="border: 1.5px solid #e2e8f0; border-radius: 8px; padding: 7px 12px; font-size: 13px; background:#f8fafc; outline:none;">
                </div>
                <button class="btn btn-primary" id="mf-apply" style="padding: 8px 20px; font-size:13px;">
                    <i class='bx bx-filter-alt'></i> Aplicar
                </button>
            </div>
            <div class="toolbar-right">
                <button id="mf-clear" title="Limpiar filtros" style="width:36px; height:36px; border-radius:8px; border:1.5px solid #e2e8f0; background:#f8fafc; color:#64748b; font-size:18px; cursor:pointer; display:flex; align-items:center; justify-content:center;">
                    <i class='bx bx-reset'></i>
                </button>
            </div>
        </div>
        <div id="mantenimientos-table-container" style="padding: 24px;"></div>
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
`;
