import { createRoot } from 'react-dom/client';
import Notas from './Notas';

// Se monta siempre en #root: solo funciona en su propia página.
createRoot(document.getElementById('root')).render(<Notas />);
