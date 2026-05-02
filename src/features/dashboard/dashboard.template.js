// src/features/dashboard/dashboard.template.js

export const dashboardTemplate = () => `
<!-- Sidebar -->
<aside class="sidebar">
    <div class="sidebar-header">
        <h2>Pitch Pro</h2>
        <span id="sidebar-role-label">CARGANDO...</span>
    </div>
    <nav class="sidebar-nav" id="sidebar-nav">
        <!-- BLOQUE GLOBAL (Solo para Superadmin en vista general) -->
        <div id="sidebar-nav-global">
            <a href="#/dashboard/inicio" class="nav-item active" data-module="inicio" data-roles="superadmin,admin,recepcionista">
                <i class='bx bxs-dashboard'></i> Dashboard
            </a>
            <a href="#/dashboard/sucursales" class="nav-item" data-module="sucursales" data-roles="superadmin">
                <i class='bx bx-buildings'></i> Sedes
            </a>
            <a href="#/dashboard/canchas" class="nav-item" data-module="canchas" data-roles="superadmin,admin">
                <i class='bx bx-map'></i> Canchas
            </a>
            <a href="#/dashboard/mantenimientos" class="nav-item" data-module="mantenimientos" data-roles="superadmin,admin">
                <i class='bx bx-wrench'></i> Mantenimientos
            </a>
            <a href="#/dashboard/reservas" class="nav-item" data-module="reservas" data-roles="superadmin,admin,recepcionista">
                <i class='bx bx-calendar'></i> Calendario
            </a>
            <a href="#/dashboard/clientes" class="nav-item" data-module="clientes" data-roles="superadmin,admin,recepcionista">
                <i class='bx bx-group'></i> Clientes
            </a>
            <a href="#/dashboard/eventos" class="nav-item" data-module="eventos" data-roles="superadmin,admin,recepcionista">
                <i class='bx bx-calendar-event'></i> Eventos
            </a>
            <a href="#/dashboard/pagos" class="nav-item" data-module="pagos" data-roles="superadmin,admin">
                <i class='bx bx-wallet'></i> Pagos
            </a>
            <a href="#/dashboard/usuarios" class="nav-item" data-module="usuarios" data-roles="superadmin,admin">
                <i class='bx bx-shield-alt-2'></i> Usuarios
            </a>
        </div>

        <!-- BLOQUE OPERATIVO (Superadmin dentro de Sede / Admin / Recepcionista) -->
        <div id="sidebar-nav-operativo" style="display: none;">
            <a href="#" class="nav-item" id="btn-volver-sedes" data-roles="superadmin" style="color: var(--text-muted); margin-bottom: 10px; border-bottom: 1px solid var(--border-color); border-radius: 0; padding-bottom: 15px;">
                <i class='bx bx-arrow-back'></i> Volver a Sedes
            </a>
            <a href="#/dashboard/inicio" class="nav-item active" data-module="inicio" data-roles="superadmin,admin,recepcionista">
                <i class='bx bxs-dashboard'></i> Dashboard
            </a>
            <a href="#/dashboard/canchas" class="nav-item" data-module="canchas" data-roles="superadmin,admin">
                <i class='bx bx-map'></i> Canchas
            </a>
            <a href="#/dashboard/mantenimientos" class="nav-item" data-module="mantenimientos" data-roles="superadmin,admin">
                <i class='bx bx-wrench'></i> Mantenimientos
            </a>
            <a href="#/dashboard/reservas" class="nav-item" data-module="reservas" data-roles="superadmin,admin,recepcionista">
                <i class='bx bx-calendar'></i> Calendario
            </a>
            <a href="#/dashboard/clientes" class="nav-item" data-module="clientes" data-roles="superadmin,admin,recepcionista">
                <i class='bx bx-group'></i> Clientes
            </a>
            <a href="#/dashboard/eventos" class="nav-item" data-module="eventos" data-roles="superadmin,admin,recepcionista">
                <i class='bx bx-calendar-event'></i> Eventos
            </a>
            <a href="#/dashboard/pagos" class="nav-item" data-module="pagos" data-roles="superadmin,admin">
                <i class='bx bx-wallet'></i> Pagos
            </a>
            <a href="#/dashboard/usuarios" class="nav-item" data-module="usuarios" data-roles="superadmin,admin">
                <i class='bx bx-shield-alt-2'></i> Usuarios
            </a>
        </div>
    </nav>
    <div class="sidebar-footer">
        <a href="#" class="nav-item" id="sidebar-settings"><i class='bx bx-cog'></i> Ajustes</a>
        <a href="#" class="nav-item" id="sidebar-logout">
            <i class='bx bx-log-out'></i> Cerrar Sesión
        </a>
    </div>
</aside>

<!-- Main Shell -->
<div class="main-wrapper">
    <!-- Top Navbar -->
    <header class="top-nav">
        <div class="nav-left">
            <div class="search-bar">
                <i class='bx bx-search'></i>
                <input type="text" placeholder="Buscar reservas...">
            </div>
            <!-- Branch Selector con Dropdown -->
            <div class="branch-selector-wrap" id="branch-selector-wrap">
                <div class="branch-selector" id="branch-selector-btn">
                    <i class='bx bx-map pin-icon'></i>
                    <span id="header-sede-label">Cargando...</span>
                    <i class='bx bx-chevron-down' id="branch-chevron"></i>
                </div>
                <!-- Dropdown -->
                <div class="sede-dropdown" id="sede-dropdown">
                    <div class="sede-dropdown-header">SELECCIONAR SEDE</div>
                    <div id="sede-dropdown-list">
                        <div class="sede-dropdown-loading"><i class='bx bx-loader-alt bx-spin'></i> Cargando...</div>
                    </div>
                </div>
            </div>
        </div>
        <div class="nav-right">
            <div class="nav-icon"><i class='bx bx-bell'></i><span class="badg"></span></div>
            <div class="nav-icon"><i class='bx bx-question-mark' style="border: 2px solid currentColor; border-radius: 50%; padding: 2px;"></i></div>
            <div class="user-profile" id="user-profile-wrap" style="position:relative;">
                <div class="user-info">
                    <strong id="header-user-name">—</strong>
                    <span id="header-user-role">—</span>
                </div>
                <div class="user-avatar" style="cursor:pointer;" id="header-avatar-btn">
                    <img id="header-avatar-img" src="https://i.pravatar.cc/150?img=11" alt="User">
                </div>
                
                <!-- Profile Dropdown -->
                <div class="profile-dropdown" id="profile-dropdown" style="display:none; position:absolute; top:calc(100% + 10px); right:0; background:#fff; border:1px solid #e2e8f0; border-radius:8px; box-shadow:0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06); width:180px; z-index:1000; overflow:hidden;">
                    <div id="btn-mi-perfil" style="padding:10px 16px; font-size:13px; color:#334155; cursor:pointer; display:flex; align-items:center; gap:8px; border-bottom:1px solid #f1f5f9; transition:background 0.2s;">
                        <i class='bx bx-cog' style="font-size:16px; color:#64748b;"></i> Mi Perfil
                    </div>
                    <div id="btn-logout" style="padding:10px 16px; font-size:13px; color:#dc2626; cursor:pointer; display:flex; align-items:center; gap:8px; transition:background 0.2s;">
                        <i class='bx bx-log-out' style="font-size:16px;"></i> Cerrar Sesión
                    </div>
                </div>
            </div>
        </div>
    </header>

    <!-- Módulo dinámico del Dashboard cargará aquí -->
    <div class="content-area">
        <div id="module-content" class="module active" style="opacity: 0; transition: opacity 0.3s ease;">
            <!-- Contenido dinámico inyectado -->
        </div>
    </div>
</div>
`;
