import { clientes } from './datos';

export default function Clientes() {
  return (
    <section>
      <h2>Clientes</h2>
      <ul>{clientes.map((c) => <li key={c.id}>{c.nombre}</li>)}</ul>
    </section>
  );
}
