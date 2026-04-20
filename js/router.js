class Router {
    constructor() {
        this.appDiv = document.getElementById('app');
        // Define routes
        this.routes = {
            '#/login': { view: 'views/login.html' },
            '#/dashboard': { view: 'views/dashboard.html' },
        };
        
        // Listen to hash changes
        window.addEventListener('hashchange', () => this.handleRoute());
        
        // Initialize
        this.handleRoute();
    }

    async handleRoute() {
        let hash = window.location.hash;
        
        // Default route
        if (!hash || hash === '') {
            hash = '#/login';
            window.location.hash = hash;
            return;
        }

        // ---- Guard: proteger el dashboard ----
        const isDashboardRoute = hash === '#/dashboard' || hash.startsWith('#/dashboard/');
        if (isDashboardRoute && window.Auth && !window.Auth.isLoggedIn()) {
            window.location.hash = '#/login';
            return;
        }

        // ---- Guard: si ya está logueado no puede volver al login ----
        if (hash === '#/login' && window.Auth && window.Auth.isLoggedIn()) {
            window.location.hash = '#/dashboard/inicio';
            return;
        }

        // ---- Guard: verificar que el módulo esté permitido para el rol ----
        if (hash.startsWith('#/dashboard/')) {
            const moduleName = hash.replace('#/dashboard/', '');
            if (window.Auth && !window.Auth.canAccess(moduleName)) {
                // Redirigir al inicio si no tiene permiso
                window.location.hash = '#/dashboard/inicio';
                return;
            }
        }

        // Sub-routing for dashboard modules (e.g. #/dashboard/reservas)
        let isDashboardModule = hash.startsWith('#/dashboard/');
        let basePath = isDashboardModule ? '#/dashboard' : hash;
        
        // If route does not exist
        if (!this.routes[basePath]) {
            console.error('Route not found:', basePath);
            return;
        }

        // Check if we need to load the main dashboard shell
        let needsShellLoad = false;
        if (basePath === '#/dashboard') {
            const shellContent = document.querySelector('.main-wrapper');
            if (!shellContent) {
                needsShellLoad = true;
            }
        }

        // Load View
        if (basePath === '#/login' || needsShellLoad) {
            await this.loadView(this.routes[basePath].view, this.appDiv);
            
            // Background classes for dashboard mode
            if (basePath === '#/dashboard') {
                document.body.classList.add('dashboard-mode');
            } else {
                document.body.classList.remove('dashboard-mode');
            }

            // After loading shell or login, re-init behaviors
            this.initBehaviors(basePath);
        }

        // If it's a dashboard module, load the sub-module
        if (isDashboardModule) {
            const moduleName = hash.replace('#/dashboard/', '');
            const moduleContainer = document.getElementById('module-content');
            
            if (moduleContainer) {
                // Fade out current content
                moduleContainer.style.opacity = 0;
                
                // wait for fade out
                setTimeout(async () => {
                    await this.loadView(`views/modules/${moduleName}.html`, moduleContainer);
                    
                    // Update sidebar active states
                    const navItems = document.querySelectorAll('.sidebar-nav .nav-item');
                    navItems.forEach(nav => {
                        nav.classList.remove('active');
                        if (nav.getAttribute('href') === hash) {
                            nav.classList.add('active');
                        }
                    });

                    // Fade in new content
                    moduleContainer.style.opacity = 1;
                }, 150);
            }
        } else if (basePath === '#/dashboard') {
            // Default sub-route when going to /dashboard
            window.location.hash = '#/dashboard/inicio';
        }
    }

    async loadView(url, container) {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Failed to load ${url}`);
            
            const html = await response.text();
            container.innerHTML = html;

            // Re-execute scripts injected via innerHTML (browser ignores them by default)
            const scripts = container.querySelectorAll('script');
            for (const oldScript of scripts) {
                const newScript = document.createElement('script');
                // Copy all attributes (type, src, etc.)
                for (const attr of oldScript.attributes) {
                    newScript.setAttribute(attr.name, attr.value);
                }
                if (oldScript.src) {
                    // External script: wait for it to load
                    await new Promise((resolve, reject) => {
                        newScript.onload = resolve;
                        newScript.onerror = reject;
                    });
                } else {
                    newScript.textContent = oldScript.textContent;
                }
                oldScript.parentNode.replaceChild(newScript, oldScript);
            }
        } catch (error) {
            console.error('Routing Error:', error);
            container.innerHTML = `<div class="error-msg">Error loading view: ${error.message}</div>`;
        }
    }

    initBehaviors(basePath) {
        // Login page behaviors now handled inside login.html script
    }
}

// Ensure the class is available globally if needed, or instantiate
window.AppRouter = new Router();
