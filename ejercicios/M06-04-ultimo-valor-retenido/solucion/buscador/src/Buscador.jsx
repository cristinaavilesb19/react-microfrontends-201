import { useState } from 'react';
import { MENSAJES, publicar } from 'mensajes';

// Publica según el contrato: nombre y payload definidos en paquetes/mensajes.
export default function Buscador() {
  const [texto, setTexto] = useState('');
  return (
    <section>
      <input value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Buscar" />
      <button onClick={() => publicar(MENSAJES.BUSQUEDA_CAMBIADA, { texto })}>Buscar</button>
    </section>
  );
}
