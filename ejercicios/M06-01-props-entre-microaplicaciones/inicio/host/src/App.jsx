import Perfil from 'perfil/Perfil';

// El host deja el usuario en una global antes de pintar el remote.
window.usuarioActual = { nombre: 'Ana López', email: 'ana@example.com' };

export default function App() {
  return (
    <main>
      <h1>Host · sesión: {window.usuarioActual ? window.usuarioActual.nombre : 'cerrada'}</h1>
      <Perfil />
    </main>
  );
}
