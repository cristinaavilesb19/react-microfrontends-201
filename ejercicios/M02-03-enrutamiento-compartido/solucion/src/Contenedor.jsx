import { Link, Route, Routes } from 'react-router';
import Ayuda from './apps/ayuda/Ayuda';
import Ajustes from './apps/ajustes/Ajustes';

// Primer nivel: el contenedor solo decide qué microaplicación ocupa cada prefijo.
export default function Contenedor() {
  return (
    <>
      <nav>
        <Link to="/">Inicio</Link> · <Link to="/ayuda">Ayuda</Link> · <Link to="/ajustes">Ajustes</Link>
      </nav>
      <Routes>
        <Route path="/" element={<h1>Inicio</h1>} />
        <Route path="/ayuda/*" element={<Ayuda />} />
        <Route path="/ajustes/*" element={<Ajustes />} />
        <Route path="*" element={<h1>No encontrado</h1>} />
      </Routes>
    </>
  );
}
