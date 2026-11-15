import { useEffect, useState } from 'react';

// Escucha otro nombre escrito a mano, y nunca se da de baja.
export default function Resultados() {
  const [texto, setTexto] = useState('');
  useEffect(() => {
    window.addEventListener('busqueda', (e) => {
      console.log('[resultados] recibe', e.detail);
      setTexto(e.detail);
    });
  }, []);
  return <p>Resultados para: {texto || '(nada)'}</p>;
}
