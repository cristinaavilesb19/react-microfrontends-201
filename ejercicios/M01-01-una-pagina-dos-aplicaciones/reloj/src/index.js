import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';

function Reloj() {
  const [hora, setHora] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setHora(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return <p>Reloj (aplicación «reloj»): {hora.toLocaleTimeString('es-ES')}</p>;
}

// La aplicación se monta sola en el hueco que le deja la página.
createRoot(document.getElementById('reloj')).render(<Reloj />);
