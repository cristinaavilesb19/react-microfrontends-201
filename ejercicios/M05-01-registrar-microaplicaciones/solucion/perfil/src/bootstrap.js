import { createRoot } from 'react-dom/client';
import App from './App';

// Abierta sola (http://localhost:3003) se pinta en #root, sin single-spa.
createRoot(document.getElementById('root')).render(<App />);
