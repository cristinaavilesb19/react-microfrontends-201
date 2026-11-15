import { getMountedApps, registerApplication, start } from 'single-spa';

// Activa solo en la ruta raíz exacta.
registerApplication({
  name: 'inicio',
  app: () => import('inicio/spa'),
  activeWhen: (location) => location.pathname === '/',
});

// Pendiente: registrar perfil y navegacion.

window.addEventListener('single-spa:app-change', () => console.log('montadas:', getMountedApps().join(', ')));
start();
