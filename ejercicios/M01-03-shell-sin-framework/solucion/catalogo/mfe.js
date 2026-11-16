// Microfrontend «catalogo»: un ES module que publica su contrato, mount y unmount.
let raiz = null;

export function mount(contenedor) {
  raiz = document.createElement('section');
  raiz.innerHTML = '<h2>Catálogo</h2><ul><li>Mochila urbana</li><li>Botella térmica</li></ul>';
  contenedor.appendChild(raiz);
  console.log('[catalogo] mount');
}

export function unmount() {
  raiz?.remove();
  raiz = null;
  console.log('[catalogo] unmount');
}
