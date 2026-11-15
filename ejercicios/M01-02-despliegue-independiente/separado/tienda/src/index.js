import { createRoot } from 'react-dom/client';
import Catalogo from './Catalogo';

// La tienda deja un hueco (#banner) y no sabe nada del código del banner.
createRoot(document.getElementById('root')).render(
  <main>
    <h1>Tienda (separado)</h1>
    <div id="banner"></div>
    <Catalogo />
  </main>
);
