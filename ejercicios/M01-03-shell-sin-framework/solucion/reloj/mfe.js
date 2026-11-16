// Microfrontend «reloj»: además de pintar, deja un temporizador en marcha.
let raiz = null;
let temporizador = null;

export function mount(contenedor) {
  raiz = document.createElement('section');
  contenedor.appendChild(raiz);
  const pintar = () => { raiz.innerHTML = `<h2>Reloj</h2><p>${new Date().toLocaleTimeString('es-ES')}</p>`; };
  pintar();
  // Lo que se registra fuera del DOM (un setInterval) solo se para si alguien llama a unmount.
  temporizador = setInterval(() => { pintar(); console.log('[reloj] tic'); }, 1000);
  console.log('[reloj] mount');
}

export function unmount() {
  clearInterval(temporizador);
  raiz?.remove();
  raiz = null;
  console.log('[reloj] unmount');
}
