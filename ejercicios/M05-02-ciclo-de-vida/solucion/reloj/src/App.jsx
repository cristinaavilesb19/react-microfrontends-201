import { useEffect, useState } from 'react';

export default function App() {
  const [hora, setHora] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setHora(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return <p>Reloj (microaplicación): {hora.toLocaleTimeString('es-ES')}</p>;
}
