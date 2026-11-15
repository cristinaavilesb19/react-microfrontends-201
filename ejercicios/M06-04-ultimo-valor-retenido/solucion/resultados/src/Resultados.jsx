import { useEffect, useState } from 'react';
import { MENSAJES, suscribir } from 'mensajes';

// Se suscribe al montar y se da de baja al desmontar (lo que devuelve suscribir).
export default function Resultados() {
  const [texto, setTexto] = useState('');
  useEffect(() => suscribir(MENSAJES.BUSQUEDA_CAMBIADA, ({ texto }) => {
    console.log('[resultados] recibe', texto);
    setTexto(texto);
  }), []);
  return <p>Resultados para: {texto || '(nada)'}</p>;
}
