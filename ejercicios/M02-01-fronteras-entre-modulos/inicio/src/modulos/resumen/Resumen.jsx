// Resumen lee directamente el almacén interno de otro módulo.
import { tareas } from '../tareas/almacen';

export default function Resumen() {
  const pendientes = tareas.filter((t) => !t.hecha).length;
  return <p>Pendientes: {pendientes} de {tareas.length}</p>;
}
