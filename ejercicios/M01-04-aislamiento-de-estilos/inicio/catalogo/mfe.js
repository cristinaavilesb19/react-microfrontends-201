// Microfrontend «catalogo»: trae su CSS y lo añade a la página al montarse.
const CSS = `
  .tarjeta { border: 3px solid #2563eb; background: #eff6ff; padding: 8px 12px; margin: 8px 0; }
`;

export function mount(contenedor) {
  const estilo = document.createElement('style');
  estilo.textContent = CSS;
  document.head.appendChild(estilo);             // el CSS va al <head> de la página: es global
  contenedor.innerHTML = '<section class="tarjeta"><h2>Catálogo</h2><p>Mochila urbana · Botella térmica</p></section>';
}
