import { createRoot } from 'react-dom/client';
import Pedidos from './modulos/pedidos/Pedidos';
import Clientes from './modulos/clientes/Clientes';

createRoot(document.getElementById('root')).render(
  <main>
    <Clientes />
    <Pedidos />
  </main>
);
