export function perfilDetailTemplate() {
    return `
    <div id="perfil-det-content">
        <!-- Tabs Header -->
        <div class="dr-tabs-header" style="margin:-15px -20px 20px -20px; border-top:none; border-bottom:1px solid #e2e8f0;">
            <button class="dr-tab-btn prof-tab-btn active" data-tab="tab-prof-info"><i class='bx bx-user'></i> Información Personal</button>
            <button class="dr-tab-btn prof-tab-btn" data-tab="tab-prof-seguridad"><i class='bx bx-lock-alt'></i> Seguridad</button>
        </div>

        <!-- TAB 1: Información Personal -->
        <div class="dr-tab-content prof-tab-content active" id="tab-prof-info">
            <form id="form-perfil-info" style="display:flex; flex-direction:column; gap:16px;">
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
                    <div class="form-group" style="margin:0;">
                        <label class="form-label" style="font-size:12px; color:#475569; font-weight:600; margin-bottom:4px; display:block;">Nombre Completo</label>
                        <div class="input-with-icon" style="position:relative;">
                            <i class='bx bx-id-card' style="position:absolute; left:12px; top:50%; transform:translateY(-50%); color:#94a3b8; font-size:16px;"></i>
                            <input type="text" id="prof-nombre" class="form-input" style="width:100%; padding:10px 10px 10px 36px; border:1px solid #cbd5e1; border-radius:6px; font-size:13px; font-family:inherit; box-sizing:border-box;" required>
                        </div>
                    </div>
                    <div class="form-group" style="margin:0;">
                        <label class="form-label" style="font-size:12px; color:#475569; font-weight:600; margin-bottom:4px; display:block;">Nombre de Usuario</label>
                        <div class="input-with-icon" style="position:relative;">
                            <i class='bx bx-user-circle' style="position:absolute; left:12px; top:50%; transform:translateY(-50%); color:#94a3b8; font-size:16px;"></i>
                            <input type="text" id="prof-username" class="form-input" style="width:100%; padding:10px 10px 10px 36px; border:1px solid #cbd5e1; border-radius:6px; font-size:13px; font-family:inherit; box-sizing:border-box;" required>
                        </div>
                    </div>
                </div>

                <div class="form-group" style="margin:0;">
                    <label class="form-label" style="font-size:12px; color:#475569; font-weight:600; margin-bottom:4px; display:block;">Correo Electrónico</label>
                    <div class="input-with-icon" style="position:relative;">
                        <i class='bx bx-envelope' style="position:absolute; left:12px; top:50%; transform:translateY(-50%); color:#94a3b8; font-size:16px;"></i>
                        <input type="email" id="prof-email" class="form-input" style="width:100%; padding:10px 10px 10px 36px; border:1px solid #cbd5e1; border-radius:6px; font-size:13px; font-family:inherit; box-sizing:border-box;" required>
                    </div>
                </div>

                <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:12px; display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-top:8px;">
                    <div class="form-group" style="margin:0;">
                        <label class="form-label" style="font-size:12px; color:#64748b; font-weight:600; margin-bottom:4px; display:block;">Rol del Sistema</label>
                        <div class="input-with-icon" style="position:relative;">
                            <i class='bx bx-shield-quarter' style="position:absolute; left:12px; top:50%; transform:translateY(-50%); color:#94a3b8; font-size:16px;"></i>
                            <input type="text" id="prof-rol" class="form-input" style="width:100%; padding:8px 10px 8px 36px; border:1px solid #e2e8f0; border-radius:6px; font-size:12px; font-family:inherit; box-sizing:border-box; background:#f1f5f9; color:#64748b; font-weight:600;" disabled readonly>
                        </div>
                    </div>
                    <div class="form-group" style="margin:0;">
                        <label class="form-label" style="font-size:12px; color:#64748b; font-weight:600; margin-bottom:4px; display:block;">Sucursal Asignada</label>
                        <div class="input-with-icon" style="position:relative;">
                            <i class='bx bx-map' style="position:absolute; left:12px; top:50%; transform:translateY(-50%); color:#94a3b8; font-size:16px;"></i>
                            <input type="text" id="prof-sucursal" class="form-input" style="width:100%; padding:8px 10px 8px 36px; border:1px solid #e2e8f0; border-radius:6px; font-size:12px; font-family:inherit; box-sizing:border-box; background:#f1f5f9; color:#64748b; font-weight:600;" disabled readonly>
                        </div>
                    </div>
                </div>

                <div style="display:flex; justify-content:flex-end; margin-top:10px;">
                    <button type="submit" class="modal-shell-btn modal-shell-btn-primary" id="btn-save-prof-info" style="font-size:13px; padding:8px 16px;">
                        <i class='bx bx-save'></i> Guardar Cambios
                    </button>
                </div>
            </form>
        </div>

        <!-- TAB 2: Seguridad -->
        <div class="dr-tab-content prof-tab-content" id="tab-prof-seguridad" style="display:none;">
            <div style="background:#fff7ed; border:1px solid #fed7aa; border-radius:8px; padding:12px; margin-bottom:16px; display:flex; gap:10px; align-items:flex-start;">
                <i class='bx bx-info-circle' style="color:#ea580c; font-size:18px; margin-top:1px;"></i>
                <p style="margin:0; font-size:12px; color:#9a3412; line-height:1.4;">Al actualizar tu contraseña, tu sesión actual se cerrará por motivos de seguridad y deberás iniciar sesión nuevamente.</p>
            </div>
            <form id="form-perfil-pwd" style="display:flex; flex-direction:column; gap:16px;">
                <div class="form-group" style="margin:0;">
                    <label class="form-label" style="font-size:12px; color:#475569; font-weight:600; margin-bottom:4px; display:block;">Contraseña Actual</label>
                    <div class="input-with-icon" style="position:relative;">
                        <i class='bx bx-key' style="position:absolute; left:12px; top:50%; transform:translateY(-50%); color:#94a3b8; font-size:16px;"></i>
                        <input type="password" id="prof-pwd-actual" class="form-input" style="width:100%; padding:10px 10px 10px 36px; border:1px solid #cbd5e1; border-radius:6px; font-size:13px; font-family:inherit; box-sizing:border-box;" required placeholder="Ingresa tu contraseña actual">
                    </div>
                </div>
                
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
                    <div class="form-group" style="margin:0;">
                        <label class="form-label" style="font-size:12px; color:#475569; font-weight:600; margin-bottom:4px; display:block;">Nueva Contraseña</label>
                        <div class="input-with-icon" style="position:relative;">
                            <i class='bx bx-lock-open-alt' style="position:absolute; left:12px; top:50%; transform:translateY(-50%); color:#94a3b8; font-size:16px;"></i>
                            <input type="password" id="prof-pwd-nueva" class="form-input" style="width:100%; padding:10px 10px 10px 36px; border:1px solid #cbd5e1; border-radius:6px; font-size:13px; font-family:inherit; box-sizing:border-box;" required placeholder="Nueva contraseña">
                        </div>
                    </div>
                    <div class="form-group" style="margin:0;">
                        <label class="form-label" style="font-size:12px; color:#475569; font-weight:600; margin-bottom:4px; display:block;">Confirmar Contraseña</label>
                        <div class="input-with-icon" style="position:relative;">
                            <i class='bx bx-check-shield' style="position:absolute; left:12px; top:50%; transform:translateY(-50%); color:#94a3b8; font-size:16px;"></i>
                            <input type="password" id="prof-pwd-conf" class="form-input" style="width:100%; padding:10px 10px 10px 36px; border:1px solid #cbd5e1; border-radius:6px; font-size:13px; font-family:inherit; box-sizing:border-box;" required placeholder="Repite la nueva contraseña">
                        </div>
                    </div>
                </div>
                
                <div style="display:flex; justify-content:flex-end; margin-top:10px;">
                    <button type="submit" class="modal-shell-btn modal-shell-btn-primary" id="btn-save-prof-pwd" style="font-size:13px; padding:8px 16px; background:#ea580c; border-color:#ea580c;">
                        <i class='bx bx-lock-alt'></i> Actualizar Contraseña
                    </button>
                </div>
            </form>
        </div>
    </div>
    `;
}
