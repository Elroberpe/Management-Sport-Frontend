export const sucursalesTemplate = () => `
<div class="page-header">
    <div>
        <h1 class="page-title">Sedes</h1>
        <p class="page-subtitle">Gestiona y monitorea tus instalaciones deportivas en múltiples zonas.</p>
    </div>
    <button class="btn btn-primary new-booking-btn" id="btn-nueva-sede">
        <i class='bx bx-plus'></i> Añadir Nueva Sede
    </button>
</div>

<!-- Stats -->
<div class="stats-cards-row">
    <div class="stat-card minimal">
        <p class="stat-label">TOTAL SEDES</p>
        <h2 class="stat-value" id="stat-total">—</h2>
    </div>
    <div class="stat-card minimal border-left-green bg-lighter-green">
        <p class="stat-label text-green">ACTIVAS</p>
        <h2 class="stat-value text-green" id="stat-activas">—</h2>
    </div>
    <div class="stat-card minimal">
        <p class="stat-label">INACTIVAS</p>
        <h2 class="stat-value" id="stat-inactivas">—</h2>
    </div>
</div>

<!-- Estado: cargando / error -->
<div id="sedes-loading" class="sedes-feedback-state">
    <div class="spinner-circle"></div>
    <p>Cargando sucursales...</p>
</div>

<div id="sedes-error" class="sedes-feedback-state" style="display:none;">
    <i class='bx bx-error-circle' style="font-size:40px; color:#ef4444;"></i>
    <p id="sedes-error-msg">No se pudo conectar con el servidor.</p>
    <button class="btn btn-primary" id="btn-retry" style="margin-top:12px; padding:10px 24px;">
        <i class='bx bx-refresh'></i> Reintentar
    </button>
</div>

<!-- Sedes Grid -->
<div class="branch-cards-grid" id="sedes-grid" style="display:none;">
    <!-- Tarjeta: Añadir Nueva Sede -->
    <div class="branch-card-add" id="card-add-sede">
        <div class="add-content">
            <div class="add-icon-circle"><i class='bx bx-map-pin'></i></div>
            <h3>Añadir Nueva Sede</h3>
            <p>Expande tu red de canchas</p>
        </div>
    </div>
</div>
`;
