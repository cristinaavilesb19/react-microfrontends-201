import { createRoot } from 'react-dom/client';
import Banner from './Banner';
import Catalogo from './Catalogo';

// Un solo build: banner y catálogo salen en el mismo bundle.
createRoot(document.getElementById('root')).render(
  <main>
    <h1>Tienda (monolito)</h1>
    <Banner />
    <Catalogo />
  </main>
);
