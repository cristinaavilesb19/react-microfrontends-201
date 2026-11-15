import { useSyncExternalStore } from 'react';

// Fuente única del tema: un valor y la lista de quien quiere enterarse de sus cambios.
let tema = 'claro';
const oyentes = new Set();

export function cambiarTema() {
  tema = tema === 'claro' ? 'oscuro' : 'claro';
  oyentes.forEach((avisar) => avisar());
}

function suscribir(avisar) {
  oyentes.add(avisar);
  return () => oyentes.delete(avisar);
}

// Hook para leer el tema y volver a pintar cuando cambia.
export function useTema() {
  return useSyncExternalStore(suscribir, () => tema);
}
