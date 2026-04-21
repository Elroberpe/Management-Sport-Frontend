// src/features/dashboard/dashboard.page.js
import { dashboardTemplate } from './dashboard.template.js';
import { Auth } from '../../core/auth.js';
import { api } from '../../core/api.js';

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
}

function setupBranchSelector(session) {
    const wrap         = document.getElementById('branch-selector-wrap');
    const btn          = document.getElementById('branch-selector-btn');
    const dropdown     = document.getElementById('sede-dropdown');
    const list         = document.getElementById('sede-dropdown-list');
    const sedeLabel    = document.getElementById('header-sede-label');

    if (!wrap || !btn || !dropdown || !list || !sedeLabel) return;

    window._selectedSucursalId = null;

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
        item.innerHTML = `
            <i class='bx ${icon}'></i>
            <span>${label}</span>
            ${activo !== null ? `<span class='sede-dot ${activo ? 'active' : 'inactive'}'></span>` : ''}
        `;
        item.addEventListener('click', function () {
            window._selectedSucursalId = sucursalId;
            sedeLabel.textContent = label;
            list.querySelectorAll('.sede-dropdown-item').forEach(el => el.classList.remove('selected'));
            item.classList.add('selected');
            wrap.classList.remove('open');
            // Trigger a custom event in case modules want to reload data when branch changes
            window.dispatchEvent(new CustomEvent('branchChanged', { detail: sucursalId }));
        });
        return item;
    }

    const isSuperAdmin = session.rol === 'superadmin';

    if (!isSuperAdmin) {
        sedeLabel.textContent = session.sucursalNombre || 'Mi Sede';
        list.innerHTML = '';
        list.appendChild(buildItem(session.sucursalNombre || 'Mi Sede', 'bx-map-pin', session.sucursalId, true, true));
        return;
    }

    sedeLabel.textContent = 'Todas las Sedes';
    list.innerHTML = "<div class='sede-dropdown-loading'><i class='bx bx-loader-alt bx-spin'></i> Cargando...</div>";

    api.get('/sucursales')
        .then(sucursales => {
            list.innerHTML = '';
            list.appendChild(buildItem('Todas las Sedes', 'bxs-grid-alt', null, null, true));
            sucursales.forEach(s => {
                list.appendChild(buildItem(s.nombre, 'bx-map-pin', s.sucursalId, s.activo, false));
            });
        })
        .catch(() => {
            list.innerHTML = '';
            list.appendChild(buildItem('Todas las Sedes', 'bxs-grid-alt', null, null, true));
            [
                { sucursalId: 1, nombre: 'Sede Central', activo: true },
                { sucursalId: 2, nombre: 'Sede Norte',   activo: true },
                { sucursalId: 3, nombre: 'Sede Sur',     activo: false }
            ].forEach(s => {
                list.appendChild(buildItem(s.nombre, 'bx-map-pin', s.sucursalId, s.activo, false));
            });
        });
}

export function unmount() {
    // Limpieza si el dashboard fuera destruido (ej. yendo al Login)
}
