// src/features/dashboard/dashboard.page.js
import { dashboardTemplate } from './dashboard.template.js';
import { Auth } from '../../core/auth.js';
import { api } from '../../core/api.js';
import { Store } from '../../core/store.js';

export function template() {
    return dashboardTemplate();
}

let _closeDropdownHandler = null;
let _storeUnsubscribe = null;

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
    _storeUnsubscribe = Store.subscribe(state => {
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
    const session = Auth.getSession();
    if (!session) return;

    const btnVolver = document.getElementById('btn-volver-sedes');

    // Define modules for each context for superadmin
    const globalModules = ['inicio', 'sucursales', 'canchas', 'clientes', 'pagos', 'usuarios'];
    const operativoModules = ['inicio', 'reservas', 'canchas', 'mantenimientos', 'clientes', 'pagos', 'usuarios'];

    const navItems = document.querySelectorAll('#sidebar-nav .nav-item[data-roles]');

    navItems.forEach(item => {
        const href = item.getAttribute('href');
        if (!href) return;

        const moduleName = href.replace('#/dashboard/', '');
        const allowedRoles = item.getAttribute('data-roles').split(',');

        // 1. Hide if user role is not in the list
        if (!allowedRoles.includes(session.rol)) {
            item.style.display = 'none';
            return;
        }

        // 2. For superadmin, apply dynamic visibility based on mode
        if (session.rol === 'superadmin') {
            const modulesForMode = (mode === 'global') ? globalModules : operativoModules;
            if (modulesForMode.includes(moduleName)) {
                item.style.display = ''; // Reset to default display
            } else {
                item.style.display = 'none';
            }
        } else {
            // For other roles, if they have permission, the item should be visible.
            // They are always in 'operativo' mode.
            item.style.display = '';
        }
    });

    // Handle the "Volver a sedes" button visibility
    if (btnVolver) {
        // Only visible for superadmin in operativo mode
        btnVolver.style.display = (mode === 'operativo' && session.rol === 'superadmin') ? '' : 'none';
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

    // Manejador para cerrar el dropdown al hacer clic fuera. Se limpia en unmount.
    _closeDropdownHandler = function (e) {
        if (!wrap.contains(e.target)) {
            wrap.classList.remove('open');
        }
    };
    document.addEventListener('click', _closeDropdownHandler);

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
    // Limpiar la suscripción al store para evitar fugas de memoria
    if (_storeUnsubscribe) {
        _storeUnsubscribe();
        _storeUnsubscribe = null;
    }
    // Limpiar el event listener global del documento
    if (_closeDropdownHandler) {
        document.removeEventListener('click', _closeDropdownHandler);
        _closeDropdownHandler = null;
    }
}
