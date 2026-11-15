import { Link, Route, Routes } from 'react-router';

// Segundo nivel: rutas RELATIVAS al prefijo que le dé el contenedor (/ayuda/*).
// La microaplicación no sabe ni le importa en qué prefijo vive.
export default function Ayuda() {
  return (
    <section>
      <h1>Ayuda</h1>
      <Link to="faq">Preguntas frecuentes</Link> · <Link to="contacto">Contacto</Link>
      <Routes>
        <Route index element={<p>Elige un tema.</p>} />
        <Route path="faq" element={<p>FAQ: ¿cómo cambio mi contraseña?</p>} />
        <Route path="contacto" element={<p>Escríbenos a soporte@example.com</p>} />
      </Routes>
    </section>
  );
}
