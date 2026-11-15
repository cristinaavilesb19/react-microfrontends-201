// 'boton/Boton' no es un fichero: Module Federation lo pide al remote «boton» en tiempo de ejecución.
import Boton from 'boton/Boton';

export default function App() {
  return (
    <main>
      <h1>Host (puerto 3000)</h1>
      <p>Este botón viene de otra aplicación:</p>
      <Boton texto="Botón federado" />
    </main>
  );
}
