// Microfrontend «catalogo». Su contrato es el mismo para las cinco integraciones: mount y unmount.
let raiz = null;

export function mount(contenedor) {
  raiz = document.createElement('section');
  raiz.innerHTML = '<h2>Catálogo</h2><p>Mochila urbana · Botella térmica</p>';
  contenedor.appendChild(raiz);
  console.log('[catalogo] mount');
}

export function unmount() {
  raiz?.remove();
  raiz = null;
  console.log('[catalogo] unmount');
}
