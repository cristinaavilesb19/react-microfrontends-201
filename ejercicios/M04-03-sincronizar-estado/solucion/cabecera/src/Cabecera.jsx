import { cambiarTema, useTema } from 'tema-compartido';

// Ya no guarda el tema: lo lee de la fuente única.
export default function Cabecera() {
  const tema = useTema();
  return (
    <div style={{ background: tema === 'oscuro' ? '#222' : '#eee', color: tema === 'oscuro' ? '#eee' : '#222', padding: 8 }}>
      Cabecera: tema {tema} <button onClick={cambiarTema}>Cambiar tema</button>
    </div>
  );
}
