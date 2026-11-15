import { Link, Route, Routes } from 'react-router';

// Segundo nivel: rutas relativas de la microaplicación ajustes.
export default function Ajustes() {
  return (
    <section>
      <h1>Ajustes</h1>
      <Link to="perfil">Perfil</Link> · <Link to="idioma">Idioma</Link>
      <Routes>
        <Route index element={<p>Elige un ajuste.</p>} />
        <Route path="perfil" element={<p>Perfil: nombre y foto.</p>} />
        <Route path="idioma" element={<p>Idioma: español.</p>} />
      </Routes>
    </section>
  );
}
