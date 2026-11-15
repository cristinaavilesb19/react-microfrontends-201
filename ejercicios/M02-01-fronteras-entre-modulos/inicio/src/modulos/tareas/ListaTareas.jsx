export default function ListaTareas({ tareas }) {
  return (
    <ul>
      {tareas.map((t) => <li key={t.id}>{t.hecha ? '✔' : '○'} {t.texto}</li>)}
    </ul>
  );
}
