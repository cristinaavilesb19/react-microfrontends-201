// Microfrontend «reloj». Mismo contrato: mount y unmount (que para su temporizador).
let raiz = null;
let temporizador = null;

export function mount(contenedor) {
  raiz = document.createElement('section');
  contenedor.appendChild(raiz);
  const pintar = () => { raiz.innerHTML = `<h2>Reloj</h2><p>${new Date().toLocaleTimeString('es-ES')}</p>`; };
  pintar();
  temporizador = setInterval(pintar, 1000);
  console.log('[reloj] mount');
}

export function unmount() {
  clearInterval(temporizador);
  raiz?.remove();
  raiz = null;
  console.log('[reloj] unmount');
}
