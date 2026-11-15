import { useState } from 'react';
import Buscador from 'buscador/Buscador';
import Resultados from 'resultados/Resultados';

// El host solo coloca las dos microaplicaciones: no pasa datos entre ellas.
export default function App() {
  const [verResultados, setVerResultados] = useState(true);
  return (
    <main>
      <h1>Host</h1>
      <button id="alternar" onClick={() => setVerResultados(!verResultados)}>Mostrar/ocultar resultados</button>
      <Buscador />
      {verResultados && <Resultados />}
    </main>
  );
}
