import { Link, Route, Routes } from 'react-router';
// Imports estáticos: los dos remotes se descargan al abrir la página, aunque no se visiten.
import Mapa from 'mapa/Mapa';
import Tiempo from 'tiempo/Tiempo';

export default function App() {
  return (
    <main>
      <nav><Link to="/">Inicio</Link> · <Link to="/mapa">Mapa</Link> · <Link to="/tiempo">Tiempo</Link></nav>
      <Routes>
        <Route path="/" element={<h1>Inicio</h1>} />
        <Route path="/mapa" element={<Mapa />} />
        <Route path="/tiempo" element={<Tiempo />} />
      </Routes>
    </main>
  );
}
