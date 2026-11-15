import { lazy, Suspense, useState } from 'react';
import Buscador from 'buscador/Buscador';

// Resultados se carga y se monta solo cuando se pide: llega tarde a la conversación.
const Resultados = lazy(() => import('resultados/Resultados'));

export default function App() {
  const [verResultados, setVerResultados] = useState(false);
  return (
    <main>
      <h1>Host</h1>
      <Buscador />
      <button id="ver" onClick={() => setVerResultados(true)}>Ver resultados</button>
      {verResultados && <Suspense fallback={<p>Cargando…</p>}><Resultados /></Suspense>}
    </main>
  );
}
