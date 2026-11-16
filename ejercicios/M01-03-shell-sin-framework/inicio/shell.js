// Shell sin framework: importa los dos microfrontends al arrancar y monta el que se pide.
import * as catalogo from '/catalogo/mfe.js';
import * as reloj from '/reloj/mfe.js';

const contenedor = document.getElementById('contenedor');
const microfrontends = { catalogo, reloj };

for (const boton of document.querySelectorAll('[data-mfe]')) {
  boton.addEventListener('click', () => microfrontends[boton.dataset.mfe].mount(contenedor));
}
