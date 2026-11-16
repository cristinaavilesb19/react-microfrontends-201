// 1 — import(): el shell construye la URL de cada microfrontend y lo carga cuando la ruta lo pide.
const contenedor = document.getElementById('contenedor');
let activo = null;

async function mostrar() {
  activo?.unmount();
  activo = null;
  const nombre = location.hash.slice(1);
  if (!nombre) return;
  activo = await import(`/${nombre}/mfe.js`);   // la URL está en el código del shell
  activo.mount(contenedor);
}

addEventListener('hashchange', mostrar);
mostrar();
