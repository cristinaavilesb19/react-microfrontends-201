import { lazy, Suspense } from 'react';
import { cargarModulo } from './cargarRemoto';

// La URL del banner se lee de /remotes.json al arrancar: cambiarla no exige recompilar.
const Banner = lazy(async () => {
  const remotes = await fetch('/remotes.json').then((r) => r.json());
  console.log('[host] banner desde', remotes.banner);
  return cargarModulo('banner', remotes.banner, './Banner');
});

export default function App() {
  return (
    <main>
      <h1>Host (puerto 3000)</h1>
      <Suspense fallback={<p>Cargando banner…</p>}>
        <Banner />
      </Suspense>
    </main>
  );
}
