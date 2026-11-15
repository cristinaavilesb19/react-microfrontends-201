// Bus de mensajes sobre eventos del navegador (window).
export function publicar(tipo, payload) {
  console.log(`[bus] publica ${tipo}`, JSON.stringify(payload));
  window.dispatchEvent(new CustomEvent(tipo, { detail: payload }));
}

// Devuelve la función para darse de baja: quien se suscribe, se desuscribe.
export function suscribir(tipo, manejador) {
  const oyente = (evento) => manejador(evento.detail);
  window.addEventListener(tipo, oyente);
  return () => window.removeEventListener(tipo, oyente);
}
