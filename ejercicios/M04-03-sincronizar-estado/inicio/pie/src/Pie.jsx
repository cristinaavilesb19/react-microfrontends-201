import { useState } from 'react';

// Cada microaplicación guarda SU copia del tema.
export default function Pie() {
  const [tema, setTema] = useState('claro');
  const cambiarTema = () => setTema(tema === 'claro' ? 'oscuro' : 'claro');
  return (
    <div style={{ background: tema === 'oscuro' ? '#222' : '#eee', color: tema === 'oscuro' ? '#eee' : '#222', padding: 8 }}>
      Pie: tema {tema} <button onClick={cambiarTema}>Cambiar tema</button>
    </div>
  );
}
