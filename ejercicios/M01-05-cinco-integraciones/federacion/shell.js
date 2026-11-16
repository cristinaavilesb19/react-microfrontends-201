// 5 — Module Federation: el shell importa «catalogo/mfe» como si fuera un paquete;
// Webpack lo resuelve en tiempo de ejecución con el remoteEntry.js de cada remote.
const contenedor = document.getElementById('contenedor');
const remotos = { catalogo: () => import('catalogo/mfe'), reloj: () => import('reloj/mfe') };
let activo = null;

async function mostrar() {
  activo?.unmount();
  activo = null;
  const nombre = location.hash.slice(1);
  if (!remotos[nombre]) return;
  activo = await remotos[nombre]();
  activo.mount(contenedor);
}

addEventListener('hashchange', mostrar);
mostrar();
