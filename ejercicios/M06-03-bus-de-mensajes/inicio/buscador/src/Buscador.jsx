import { useState } from 'react';

// Publica con un nombre escrito a mano.
export default function Buscador() {
  const [texto, setTexto] = useState('');
  const buscar = () => window.dispatchEvent(new CustomEvent('buscar', { detail: texto }));
  return (
    <section>
      <input value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Buscar" />
      <button onClick={buscar}>Buscar</button>
    </section>
  );
}
