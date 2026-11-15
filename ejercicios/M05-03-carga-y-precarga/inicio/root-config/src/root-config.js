import { registerApplication, start } from 'single-spa';
// Imports estáticos: el código de las dos microaplicaciones se descarga al abrir la página.
import * as catalogo from 'catalogo/spa';
import * as carrito from 'carrito/spa';

registerApplication({ name: 'catalogo', app: async () => catalogo, activeWhen: '/catalogo' });
registerApplication({ name: 'carrito', app: async () => carrito, activeWhen: '/carrito' });

start();
