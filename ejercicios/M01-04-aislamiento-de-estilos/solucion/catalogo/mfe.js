// Microfrontend «catalogo»: su CSS vive dentro de su Shadow DOM, no en la página.
const CSS = `
  .tarjeta { border: 3px solid #2563eb; background: #eff6ff; padding: 8px 12px; margin: 8px 0; }
`;

export function mount(contenedor) {
  // Shadow DOM: un árbol propio dentro del hueco. Su CSS no sale y el CSS de la página no entra.
  const sombra = contenedor.shadowRoot ?? contenedor.attachShadow({ mode: 'open' });
  sombra.innerHTML = `<style>${CSS}</style><section class="tarjeta"><h2>Catálogo</h2><p>Mochila urbana · Botella térmica</p></section>`;
}
