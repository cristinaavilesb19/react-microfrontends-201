import { useState } from 'react';
import Perfil from 'perfil/Perfil';

// El host es el dueño del dato: lo pasa hacia abajo y recibe el aviso hacia arriba.
export default function App() {
  const [usuario, setUsuario] = useState({ nombre: 'Ana López', email: 'ana@example.com' });
  return (
    <main>
      <h1>Host · sesión: {usuario ? usuario.nombre : 'cerrada'}</h1>
      <Perfil usuario={usuario} onCerrarSesion={() => setUsuario(null)} />
    </main>
  );
}
