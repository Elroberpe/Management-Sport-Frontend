// src/features/dashboard/dashboard.page.js
import { dashboardTemplate } from './dashboard.template.js';
import { Auth } from '../../core/auth.js';
import { api } from '../../core/api.js';
import { Store } from '../../core/store.js';

export function template() {
    return dashboardTemplate();
}

export function mount() {
    const session = Auth.getSession();
    if (!session) {
        window.location.hash = '#/login';
        return;
    }

    // Poblar datos del usuario en la UI
    document.getElementById('header-user-name').textContent   = session.nombre;
    document.getElementById('header-user-role').textContent   = session.rolLabel;
    document.getElementById('sidebar-role-label').textContent = session.rolLabel;
    
    const avatarImg = document.getElementById('header-avatar-img');
    if (session.avatar && avatarImg) avatarImg.src = session.avatar;

    // Filtrar sidebar según rol
    const navItems = document.querySelectorAll('#sidebar-nav .nav-item[data-roles]');
    navItems.forEach(function (item) {
        const allowedRoles = item.getAttribute('data-roles').split(',');
        if (!allowedRoles.includes(session.rol)) {
            item.style.display = 'none';
        }
    });

    // Cerrar sesión
    const logoutBtn = document.getElementById('sidebar-logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function (e) {
            e.preventDefault();
            Auth.logout();
        });
    }

    const avatarBtn = document.getElementById('header-avatar-btn');
    if (avatarBtn) {
        avatarBtn.addEventListener('click', function () {
            if (confirm('¿Cerrar sesión?')) Auth.logout();
        });
    }

    // Branch Selector Logic
    setupBranchSelector(session);

    // Escuchar cambios de sucursal en el Store
    window._storeUnsubscribe = Store.subscribe(state => {
        const sucursal = state.sucursal;
        const sedeLabel = document.getElementById('header-sede-label');
        if (sucursal) {
            setSidebarMode('operativo');
            if (sedeLabel) sedeLabel.textContent = sucursal.nombre;
        } else {
            setSidebarMode('global');
            if (sedeLabel) sedeLabel.textContent = 'Todas las Sedes';
        }
        
        // Actualizar el estado 'selected' en el dropdown
        const list = document.getElementById('sede-dropdown-list');
        if (list) {
            const currentId = sucursal ? String(sucursal.sucursalId) : null;
            list.querySelectorAll('.sede-dropdown-item').forEach(el => {
                const sId = el.dataset.sid;
                if ((currentId === null && !sId) || (currentId === sId)) {
                    el.classList.add('selected');
                } else {
                    el.classList.remove('selected');
                }
            });
        }
    });

    // Botón volver a sedes
    const btnVolver = document.getElementById('btn-volver-sedes');
    if (btnVolver) {
        btnVolver.addEventListener('click', (e) => {
            e.preventDefault();
            Store.setSucursal(null);
            window.location.hash = '#/dashboard/sucursales';
        });
    }

    // Inicializar sidebar según store actual
    const currentSucursal = Store.getSucursal();
    if (currentSucursal) {
        setSidebarMode('operativo');
        const sedeLabel = document.getElementById('header-sede-label');
        if (sedeLabel) sedeLabel.textContent = currentSucursal.nombre;
    } else {
        setSidebarMode('global');
    }
}

function setSidebarMode(mode) {
    const navGlobal = document.getElementById('sidebar-nav-global');
    const navOperativo = document.getElementById('sidebar-nav-operativo');
    if (!navGlobal || !navOperativo) return;

    if (mode === 'global') {
        navGlobal.style.display = 'block';
        navOperativo.style.display = 'none';
    } else {
        navGlobal.style.display = 'none';
        navOperativo.style.display = 'block';
    }
}

function setupBranchSelector(session) {
    const wrap         = document.getElementById('branch-selector-wrap');
    const btn          = document.getElementById('branch-selector-btn');
    const dropdown     = document.getElementById('sede-dropdown');
    const list         = document.getElementById('sede-dropdown-list');
    const sedeLabel    = document.getElementById('header-sede-label');

    if (!wrap || !btn || !dropdown || !list || !sedeLabel) return;

    btn.addEventListener('click', function (e) {
        e.stopPropagation();
        wrap.classList.toggle('open');
    });

    // We attach click to document. To clean it up, we need a named function, 
    // but right now since the shell usually stays alive, this is acceptable.
    // For a perfect implementation, we should store this function and remove it in unmount().
    document.addEventListener('click', function (e) {
        if (!wrap.contains(e.target)) {
            wrap.classList.remove('open');
        }
    });

    function buildItem(label, icon, sucursalId, activo, isSelected) {
        const item = document.createElement('div');
        item.className = 'sede-dropdown-item' + (isSelected ? ' selected' : '');
        if (sucursalId) item.dataset.sid = sucursalId;
        item.innerHTML = `
            <i class='bx ${icon}'></i>
            <span>${label}</span>
            ${activo !== null ? `<span class='sede-dot ${activo ? 'active' : 'inactive'}'></span>` : ''}
        `;
        item.addEventListener('click', function () {
            const s = sucursalId ? { sucursalId, nombre: label } : null;
            Store.setSucursal(s);
            
            list.querySelectorAll('.sede-dropdown-item').forEach(el => el.classList.remove('selected'));
            item.classList.add('selected');
            wrap.classList.remove('open');
            
            // Si elige "Todas las Sedes" y está en una ruta que requiere sede, el botón de volver ya redirige.
            // Si elige una sede específica, disparamos el evento local para que la tabla/vista se recargue.
            if (!s && window.location.hash !== '#/dashboard/sucursales' && window.location.hash !== '#/dashboard/inicio') {
                window.location.hash = '#/dashboard/sucursales';
            } else {
                window.dispatchEvent(new CustomEvent('sucursalChanged', { detail: sucursalId }));
            }
        });
        return item;
    }

    const isSuperAdmin = session.rol === 'superadmin';

    if (!isSuperAdmin) {
        sedeLabel.textContent = session.sucursalNombre || 'Mi Sede';
        list.innerHTML = '';
        list.appendChild(buildItem(session.sucursalNombre || 'Mi Sede', 'bx-map-pin', session.sucursalId, true, true));
        Store.setSucursal({ sucursalId: session.sucursalId, nombre: session.sucursalNombre });
        
        setSidebarMode('operativo');
        const btnVolver = document.getElementById('btn-volver-sedes');
        if (btnVolver) btnVolver.style.display = 'none'; // Admin no puede volver al global
        return;
    }

    sedeLabel.textContent = 'Todas las Sedes';
    list.innerHTML = "<div class='sede-dropdown-loading'><i class='bx bx-loader-alt bx-spin'></i> Cargando...</div>";

    const currentSuc = Store.getSucursal();
    const currentId = currentSuc ? currentSuc.sucursalId : null;

    api.get('/sucursales')
        .then(sucursales => {
            list.innerHTML = '';
            list.appendChild(buildItem('Todas las Sedes', 'bxs-grid-alt', null, null, currentId === null));
            sucursales.forEach(s => {
                const sId = s.sucursalId !== undefined ? s.sucursalId : s.id;
                list.appendChild(buildItem(s.nombre, 'bx-map-pin', sId, s.activo, currentId == sId));
            });
        })
        .catch(() => {
            list.innerHTML = '';
            list.appendChild(buildItem('Todas las Sedes', 'bxs-grid-alt', null, null, currentId === null));
            [
                { sucursalId: 1, nombre: 'Sede Central', activo: true },
                { sucursalId: 2, nombre: 'Sede Norte',   activo: true },
                { sucursalId: 3, nombre: 'Sede Sur',     activo: false }
            ].forEach(s => {
                list.appendChild(buildItem(s.nombre, 'bx-map-pin', s.sucursalId, s.activo, currentId == s.sucursalId));
            });
        });
}

export function unmount() {
    if (window._storeUnsubscribe) {
        window._storeUnsubscribe();
    }
}
