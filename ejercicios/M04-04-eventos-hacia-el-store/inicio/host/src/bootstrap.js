import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// StrictMode monta, desmonta y vuelve a montar en desarrollo: delata efectos sin limpieza.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
