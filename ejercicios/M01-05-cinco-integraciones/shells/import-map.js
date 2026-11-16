// 2 — import maps: el shell importa por nombre; la URL de cada microfrontend está en el import map del HTML.
const contenedor = document.getElementById('contenedor');
let activo = null;

async function mostrar() {
  activo?.unmount();
  activo = null;
  const nombre = location.hash.slice(1);
  if (!nombre) return;
  activo = await import(nombre);               // «catalogo» → /catalogo/mfe.js, según el import map
  activo.mount(contenedor);
}

addEventListener('hashchange', mostrar);
mostrar();
