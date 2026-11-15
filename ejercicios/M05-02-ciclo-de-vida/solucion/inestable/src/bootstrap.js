import { createRoot } from 'react-dom/client';
import App from './App';

// Abierta sola (http://localhost:3002) se pinta en #root, sin single-spa.
createRoot(document.getElementById('root')).render(<App />);
