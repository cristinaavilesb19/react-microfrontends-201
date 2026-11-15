// Bus de mensajes sobre eventos del navegador (window).
// Último valor de cada tipo: vive en window porque cada microaplicación lleva su copia de este fichero.
const ultimo = (window.__busUltimo ??= {});

export function publicar(tipo, payload) {
  console.log(`[bus] publica ${tipo}`, JSON.stringify(payload));
  ultimo[tipo] = payload;
  window.dispatchEvent(new CustomEvent(tipo, { detail: payload }));
}

// Quien se suscribe tarde recibe al momento el último valor publicado.
export function suscribir(tipo, manejador) {
  if (tipo in ultimo) manejador(ultimo[tipo]);
  const oyente = (evento) => manejador(evento.detail);
  window.addEventListener(tipo, oyente);
  return () => window.removeEventListener(tipo, oyente);
}
