// Microfrontend «ofertas»: también llama «tarjeta» a su recuadro, pero dentro de su Shadow DOM.
const CSS = `
  .tarjeta { border: 3px dashed #d97706; background: #fffbeb; padding: 8px 12px; margin: 8px 0; }
`;

export function mount(contenedor) {
  // Shadow DOM: un árbol propio dentro del hueco. Su CSS no sale y el CSS de la página no entra.
  const sombra = contenedor.shadowRoot ?? contenedor.attachShadow({ mode: 'open' });
  sombra.innerHTML = `<style>${CSS}</style><section class="tarjeta"><h2>Ofertas</h2><p>20 % en mochilas</p></section>`;
}
