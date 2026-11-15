import { tareas } from './modulos/tareas/almacen';
import ListaTareas from './modulos/tareas/ListaTareas';
import Resumen from './modulos/resumen/Resumen';

export default function App() {
  return (
    <main>
      <h1>Tareas</h1>
      <Resumen />
      <ListaTareas tareas={tareas} />
    </main>
  );
}
