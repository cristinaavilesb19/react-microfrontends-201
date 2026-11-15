import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import Contenedor from './Contenedor';

// Un solo router para toda la página: lo crea el contenedor.
createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <Contenedor />
  </BrowserRouter>
);
