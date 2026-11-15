import { createRoot } from 'react-dom/client';

function Portada() {
  return (
    <header>
      <h1>Portada</h1>
      <p>Esta cabecera es de la aplicación «portada». El reloj de abajo es de otra aplicación.</p>
    </header>
  );
}

createRoot(document.getElementById('root')).render(<Portada />);
