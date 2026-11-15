// Catálogo: lo mantiene otro equipo. No cambia en este laboratorio.
const productos = ['Mochila urbana', 'Botella térmica', 'Cuaderno A5'];

export default function Catalogo() {
  return (
    <ul>
      {productos.map((p) => <li key={p}>{p}</li>)}
    </ul>
  );
}
