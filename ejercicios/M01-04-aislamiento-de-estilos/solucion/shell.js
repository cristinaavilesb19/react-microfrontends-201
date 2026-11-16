// El shell monta los dos microfrontends al arrancar, cada uno en su hueco.
import * as catalogo from '/catalogo/mfe.js';
import * as ofertas from '/ofertas/mfe.js';

catalogo.mount(document.getElementById('catalogo'));
ofertas.mount(document.getElementById('ofertas'));
