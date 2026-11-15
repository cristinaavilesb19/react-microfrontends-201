import { cambiarTema, useTema } from 'tema-compartido';

// Ya no guarda el tema: lo lee de la fuente única.
export default function Pie() {
  const tema = useTema();
  return (
    <div style={{ background: tema === 'oscuro' ? '#222' : '#eee', color: tema === 'oscuro' ? '#eee' : '#222', padding: 8 }}>
      Pie: tema {tema} <button onClick={cambiarTema}>Cambiar tema</button>
    </div>
  );
}
