// Import cruzado: pedidos entra en un fichero interno de clientes.
import { nombreCompleto } from '../clientes/datos';

const pedidos = [
  { id: 'P-101', cliente: 1, total: 42 },
  { id: 'P-102', cliente: 2, total: 18 },
];

export default function Pedidos() {
  return (
    <section>
      <h2>Pedidos</h2>
      <ul>
        {pedidos.map((p) => <li key={p.id}>{p.id} · {nombreCompleto(p.cliente)} · {p.total} €</li>)}
      </ul>
    </section>
  );
}
