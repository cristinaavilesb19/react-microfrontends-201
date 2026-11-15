import { Link, Route, Routes } from 'react-router';

// Segundo nivel: rutas de la microaplicación ayuda.
// Están escritas como si ayuda fuera dueña de toda la URL.
export default function Ayuda() {
  return (
    <section>
      <h1>Ayuda</h1>
      <Link to="/faq">Preguntas frecuentes</Link> · <Link to="/contacto">Contacto</Link>
      <Routes>
        <Route path="/faq" element={<p>FAQ: ¿cómo cambio mi contraseña?</p>} />
        <Route path="/contacto" element={<p>Escríbenos a soporte@example.com</p>} />
      </Routes>
    </section>
  );
}
