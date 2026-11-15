import { lazy, Suspense } from 'react';
import { Link, Route, Routes } from 'react-router';
import BarreraErrores from './BarreraErrores';

// lazy: el remote se pide la primera vez que se pinta su ruta.
const Mapa = lazy(() => import('mapa/Mapa'));
const Tiempo = lazy(() => import('tiempo/Tiempo'));

// Cada ruta tiene su propia barrera (key distinta): el fallo de una no se arrastra a otra.
function Seccion({ children }) {
  return (
    <BarreraErrores>
      <Suspense fallback={<p>Cargando…</p>}>{children}</Suspense>
    </BarreraErrores>
  );
}

export default function App() {
  return (
    <main>
      <nav><Link to="/">Inicio</Link> · <Link to="/mapa">Mapa</Link> · <Link to="/tiempo">Tiempo</Link></nav>
      <Routes>
        <Route path="/" element={<h1>Inicio</h1>} />
        <Route path="/mapa" element={<Seccion key="mapa"><Mapa /></Seccion>} />
        <Route path="/tiempo" element={<Seccion key="tiempo"><Tiempo /></Seccion>} />
      </Routes>
    </main>
  );
}
