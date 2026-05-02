// src/core/router.js
import { Auth } from './auth.js';

export class Router {
    constructor() {
        this.appDiv = document.getElementById('app');
        this.currentShell = null;
        this.currentSubModule = null;
        
        // El mapa ahora resolverá "promesas" de import() -> carga perezosa
        this.routes = {
            '#/login': () => import('../features/auth/login.page.js'),
            '#/dashboard': () => import('../features/dashboard/dashboard.page.js'),
            // Submódulos del Dashboard
            '#/dashboard/inicio': () => import('../features/inicio/inicio.page.js'),
            '#/dashboard/canchas': () => import('../features/canchas/canchas.page.js'),
            '#/dashboard/mantenimientos': () => import('../features/mantenimientos/mantenimientos.page.js'),
            '#/dashboard/reservas': () => import('../features/reservas/reservas.page.js'),
            '#/dashboard/clientes':   () => import('../features/clientes/clientes.page.js'),
            '#/dashboard/pagos':       () => import('../features/pagos/pagos.page.js'),
            '#/dashboard/sucursales':  () => import('../features/sucursales/sucursales.page.js'),
            '#/dashboard/usuarios':    () => import('../features/usuarios/usuarios.page.js')
        };
        
        window.addEventListener('hashchange', () => this.handleRoute());
        window.addEventListener('sucursalChanged', () => this.handleRoute());
        this.handleRoute();
    }

    async handleRoute() {
        let hash = window.location.hash;
        
        if (!hash || hash === '') {
            window.location.hash = '#/login';
            return;
        }

        const isDashboardRoute = hash.startsWith('#/dashboard');
        if (isDashboardRoute && !Auth.isLoggedIn()) {
            window.location.hash = '#/login';
            return;
        }

        if (hash === '#/login' && Auth.isLoggedIn()) {
            window.location.hash = '#/dashboard/inicio';
            return;
        }

        if (hash.startsWith('#/dashboard/')) {
            const moduleName = hash.replace('#/dashboard/', '');
            if (!Auth.canAccess(moduleName)) {
                window.location.hash = '#/dashboard/inicio';
                return;
            }
        }

        let isDashboardModule = hash.startsWith('#/dashboard/');
        let basePath = isDashboardModule ? '#/dashboard' : hash;
        
        let needsShellLoad = false;
        if (basePath === '#/dashboard') {
            const shellContent = document.querySelector('.main-wrapper');
            if (!shellContent) needsShellLoad = true;
        }

        // Cargar Shell (Login o Dashboard Layout)
        if (basePath === '#/login' || needsShellLoad) {
            try {
                const loader = this.routes[basePath];
                if (loader) {
                    const module = await loader();
                    if (this.currentShell && this.currentShell.unmount) {
                        this.currentShell.unmount();
                    }
                    this.appDiv.innerHTML = module.template();
                    if (module.mount) module.mount(this.appDiv);
                    this.currentShell = module;
                }
            } catch (error) {
                console.error(`[Router] Error loading ${basePath}:`, error);
                this.appDiv.innerHTML = `<div class="error-msg">Error: Module not found</div>`;
            }

            if (basePath === '#/dashboard') {
                document.body.classList.add('dashboard-mode');
            } else {
                document.body.classList.remove('dashboard-mode');
            }
        }

        // Cargar Sub-módulo (si aplica)
        if (isDashboardModule) {
            const moduleContainer = document.getElementById('module-content');
            if (moduleContainer) {
                const loader = this.routes[hash];
                if (loader) {
                    moduleContainer.style.opacity = 0;
                    setTimeout(async () => {
                        try {
                            const moduleImport = await loader();
                            if (moduleImport) {
                                if (this.currentSubModule && this.currentSubModule.unmount) {
                                    this.currentSubModule.unmount();
                                }
                                moduleContainer.innerHTML = moduleImport.template();
                                if (moduleImport.mount) moduleImport.mount(moduleContainer);
                                this.currentSubModule = moduleImport;
                            } else {
                                moduleContainer.innerHTML = `
                                  <div style="padding:40px; text-align:center;">
                                     <h2>🚧 En construcción: ${hash}</h2>
                                     <p>Este módulo aún no ha sido refactorizado al nuevo estándar FSD.</p>
                                  </div>`;
                            }
                        } catch (error) {
                            console.error(`[Router] Error al cargar ${hash}:`, error);
                            moduleContainer.innerHTML = `<div>Error cargando submódulo</div>`;
                        }

                        // Actualizar UI del sidebar
                        document.querySelectorAll('.sidebar-nav .nav-item').forEach(nav => {
                            nav.classList.remove('active');
                            if (nav.getAttribute('href') === hash) nav.classList.add('active');
                        });

                        moduleContainer.style.opacity = 1;
                    }, 150);
                } else {
                    moduleContainer.innerHTML = `<div>No route found for ${hash}</div>`;
                }
            }
        } else if (basePath === '#/dashboard') {
            window.location.hash = '#/dashboard/inicio';
        }
    }
}
