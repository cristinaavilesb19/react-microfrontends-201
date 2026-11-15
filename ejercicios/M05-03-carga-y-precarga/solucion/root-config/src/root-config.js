import { registerApplication, start } from 'single-spa';

// Función de carga: single-spa la llama la primera vez que la aplicación debe estar activa.
const cargarCatalogo = () => import('catalogo/spa');
const cargarCarrito = () => import('carrito/spa');

registerApplication({ name: 'catalogo', app: cargarCatalogo, activeWhen: '/catalogo' });
registerApplication({ name: 'carrito', app: cargarCarrito, activeWhen: '/carrito' });

start();

// Precarga: cuando el navegador queda libre, descarga el carrito (es el siguiente paso probable).
// La descarga se reutiliza: al entrar en /carrito ya no se pide otra vez.
requestIdleCallback(() => {
  console.log('[root] precargando carrito');
  cargarCarrito();
});
