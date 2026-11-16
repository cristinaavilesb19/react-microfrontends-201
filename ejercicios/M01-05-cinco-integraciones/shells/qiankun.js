// 4 — qiankun: cada microfrontend se registra por su página HTML; qiankun la descarga, ejecuta sus scripts
// en un sandbox y llama al ciclo de vida que el microfrontend deja en window.
const { registerMicroApps, start } = window.qiankun;

registerMicroApps([
  { name: 'catalogo', entry: '/catalogo/', container: '#contenedor', activeRule: (l) => l.hash === '#catalogo' },
  { name: 'reloj', entry: '/reloj/', container: '#contenedor', activeRule: (l) => l.hash === '#reloj' },
]);
start({ prefetch: false });   // sin precarga: cada microfrontend se descarga al activarse
