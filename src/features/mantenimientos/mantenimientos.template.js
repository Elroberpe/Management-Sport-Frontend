export const mantenimientosTemplate = () => `
<div class="mant-module">

    <!-- ===== HEADER ===== -->
    <div class="page-header" style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:24px;">
        <div>
            <h1 class="page-title" style="margin:0 0 4px;">Gestión de Mantenimientos</h1>
            <p class="page-subtitle" style="margin:0;">Administra y supervisa todos los mantenimientos programados</p>
        </div>
    </div>

    <!-- Stats Section -->
    <div id="mantenimientos-stats-container"></div>

    <!-- ===== PANEL UNIFICADO (Filtros + Tabla) ===== -->
    <div class="panel table-container-full" style="padding:0; overflow:hidden; margin-bottom:40px;">
        
        <!-- TOOLBAR FILTROS -->
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

        <!-- New Unified Table Component Container -->
        <div id="mantenimientos-table-container" style="padding: 24px;"></div>
    </div> <!-- /panel -->

    </div> <!-- /panel -->

</div><!-- /mant-module -->

<!-- ===== MODAL EDITAR MANTENIMIENTO ===== -->
<div id="modal-mant-edit" class="pm-overlay" style="display:none;" role="dialog" aria-modal="true">
    <div class="pm-modal">
        <div class="pm-header">
            <div class="pm-header-icon" style="background:linear-gradient(135deg,#1e40af,#3b82f6);">
                <i class='bx bx-edit-alt'></i>
            </div>
            <div>
                <h2 class="pm-title">Editar Mantenimiento</h2>
                <p class="pm-subtitle" id="edit-cancha-label">Cancha seleccionada</p>
            </div>
            <button class="pm-close" id="btn-edit-close"><i class='bx bx-x'></i></button>
        </div>
        <div class="pm-body">
            <div class="pm-alert-error" id="edit-error-box" style="display:none;">
                <i class='bx bx-error-circle'></i>
                <span id="edit-error-msg">Error</span>
            </div>
            <div class="pm-row-2">
                <div class="pm-field">
                    <label class="pm-label"><i class='bx bx-calendar-plus'></i> Inicio <span class="pm-required">*</span></label>
                    <input type="datetime-local" id="edit-inicio" class="pm-input">
                    <span class="pm-field-error" id="edit-err-inicio"></span>
                </div>
                <div class="pm-field">
                    <label class="pm-label"><i class='bx bx-calendar-check'></i> Fin <span class="pm-required">*</span></label>
                    <input type="datetime-local" id="edit-fin" class="pm-input">
                    <span class="pm-field-error" id="edit-err-fin"></span>
                </div>
            </div>
            <div class="pm-field">
                <label class="pm-label"><i class='bx bx-category'></i> Tipo <span class="pm-required">*</span></label>
                <div class="pm-select-wrap">
                    <select id="edit-tipo" class="pm-input pm-select">
                        <option value="">— Seleccionar tipo —</option>
                        <option value="PREVENTIVO">Preventivo</option>
                        <option value="CORRECTIVO">Correctivo</option>
                        <option value="URGENTE">Urgente</option>
                    </select>
                    <i class='bx bx-chevron-down pm-select-arrow'></i>
                </div>
                <span class="pm-field-error" id="edit-err-tipo"></span>
            </div>
            <div class="pm-field">
                <label class="pm-label"><i class='bx bx-note'></i> Motivo <span class="pm-required">*</span></label>
                <textarea id="edit-motivo" class="pm-input pm-textarea" maxlength="200" placeholder="Describe el motivo del mantenimiento..."></textarea>
                <div class="pm-input-footer">
                    <span class="pm-field-error" id="edit-err-motivo"></span>
                    <span class="pm-char-count" id="edit-char-motivo">0/200</span>
                </div>
            </div>
        </div>
        <div class="pm-footer">
            <button class="pm-btn-cancel" id="btn-edit-cancel">Cancelar</button>
            <button class="pm-btn-submit" id="btn-edit-submit" style="background:linear-gradient(135deg,#1e40af,#3b82f6);">
                <span id="edit-submit-text"><i class='bx bx-save'></i> Guardar Cambios</span>
                <span id="edit-submit-loader" style="display:none;"><div class="pm-spinner"></div> Guardando...</span>
            </button>
        </div>
    </div>
</div>

<!-- ===== CONFIRM CANCELAR ===== -->

<!-- ===== CONFIRM CANCELAR ===== -->
<div id="modal-mant-confirm" class="pm-overlay" style="display:none;" role="dialog" aria-modal="true">
    <div class="pm-modal" style="max-width:380px;">
        <div class="pm-header">
            <div class="pm-header-icon" style="background:linear-gradient(135deg,#7f1d1d,#dc2626);">
                <i class='bx bx-trash-alt'></i>
            </div>
            <div>
                <h2 class="pm-title">¿Cancelar Mantenimiento?</h2>
                <p class="pm-subtitle">Esta acción liberará el horario seleccionado</p>
            </div>
            <button class="pm-close" id="btn-confirm-close"><i class='bx bx-x'></i></button>
        </div>
        <div class="pm-body">
            <p id="mant-confirm-msg" style="font-size:13.5px;color:#374151;margin:0;line-height:1.6;"></p>
        </div>
        <div class="pm-footer">
            <button class="pm-btn-cancel" id="btn-confirm-no">No, Mantener Programación</button>
            <button class="pm-btn-submit" id="btn-confirm-yes" style="background:linear-gradient(135deg,#7f1d1d,#dc2626);">
                <span id="confirm-text"><i class='bx bx-check-circle'></i> Sí, Cancelar Mantenimiento</span>
                <span id="confirm-loader" style="display:none;"><div class="pm-spinner"></div> Procesando...</span>
            </button>
        </div>
    </div>
</div>

<!-- ===== TOAST ===== -->
<div class="nc-toast" id="mant-toast" style="display:none;">
    <i class='bx bx-check-circle'></i>
    <span id="mant-toast-msg">Operación exitosa</span>
</div>
`;
