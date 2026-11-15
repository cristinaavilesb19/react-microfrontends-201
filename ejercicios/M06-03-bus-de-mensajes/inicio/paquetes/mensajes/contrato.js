// Contrato de mensajes: nombre (con versión) y forma del payload.
// Quien publica y quien escucha importan estas constantes; nadie escribe el nombre a mano.
export const MENSAJES = {
  BUSQUEDA_CAMBIADA: 'busqueda:cambiada:v1', // payload: { texto: string }
};
