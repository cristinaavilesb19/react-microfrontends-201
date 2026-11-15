import { useEffect, useState } from 'react';
import { useColor } from 'contexto-color';

// La misma ficha recibe datos por tres canales distintos.
export default function Ficha({ nombre }) {
  const color = useColor();                         // 2. contexto compartido
  const [aviso, setAviso] = useState('(ninguno)');
  useEffect(() => {                                  // 3. evento global
    const oir = (e) => setAviso(e.detail);
    window.addEventListener('demo:aviso', oir);
    return () => window.removeEventListener('demo:aviso', oir);
  }, []);
  return (
    <section style={{ border: `3px solid ${color}`, padding: 8 }}>
      <p>Por props: {nombre}</p>
      <p>Por contexto: {color}</p>
      <p>Por evento: {aviso}</p>
    </section>
  );
}
