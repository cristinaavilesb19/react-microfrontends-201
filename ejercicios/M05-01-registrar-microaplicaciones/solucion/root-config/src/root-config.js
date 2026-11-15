import { getMountedApps, registerApplication, start } from 'single-spa';

// Activa solo en la ruta raíz exacta.
registerApplication({
  name: 'inicio',
  app: () => import('inicio/spa'),
  activeWhen: (location) => location.pathname === '/',
});

// Activa en /perfil y en cualquier ruta que empiece por /perfil.
registerApplication({
  name: 'perfil',
  app: () => import('perfil/spa'),
  activeWhen: '/perfil',
});

// Activa siempre: la barra de navegación.
registerApplication({
  name: 'navegacion',
  app: () => import('navegacion/spa'),
  activeWhen: () => true,
});

window.addEventListener('single-spa:app-change', () => console.log('montadas:', getMountedApps().join(', ')));
start();
