// Resumen no sabe de dónde salen las tareas: las recibe por props (su contrato).
export default function Resumen({ total, pendientes }) {
  return <p>Pendientes: {pendientes} de {total}</p>;
}
