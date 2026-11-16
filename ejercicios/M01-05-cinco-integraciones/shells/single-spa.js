// 3 — single-spa: el shell registra aplicaciones y single-spa decide cuándo montar y desmontar cada una.
import { getMountedApps, registerApplication, start } from 'single-spa';

const contenedor = document.getElementById('contenedor');

// single-spa pide bootstrap, mount y unmount que devuelvan promesas: se adapta el contrato del microfrontend.
const cargar = (nombre) => async () => {
  const mfe = await import(`/${nombre}/mfe.js`);
  return { bootstrap: async () => {}, mount: async () => mfe.mount(contenedor), unmount: async () => mfe.unmount() };
};

for (const nombre of ['catalogo', 'reloj']) {
  registerApplication({ name: nombre, app: cargar(nombre), activeWhen: (l) => l.hash === `#${nombre}` });
}
addEventListener('single-spa:routing-event', () => console.log('[shell] montadas:', getMountedApps().join(', ') || '(ninguna)'));
start();
