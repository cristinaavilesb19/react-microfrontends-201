import { tareas } from './modulos/tareas/almacen';
import ListaTareas from './modulos/tareas/ListaTareas';
import Resumen from './modulos/resumen/Resumen';

// App compone los módulos y es la única que conoce a los dos.
export default function App() {
  const pendientes = tareas.filter((t) => !t.hecha).length;
  return (
    <main>
      <h1>Tareas</h1>
      <Resumen total={tareas.length} pendientes={pendientes} />
      <ListaTareas tareas={tareas} />
    </main>
  );
}
