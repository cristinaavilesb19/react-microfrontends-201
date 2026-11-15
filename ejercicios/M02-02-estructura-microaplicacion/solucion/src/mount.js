import { createRoot } from 'react-dom/client';
import Notas from './Notas';

// mount(elemento, props): pinta la microaplicación donde le digan y devuelve cómo quitarla.
export function mount(elemento, props = {}) {
  const root = createRoot(elemento);
  root.render(<Notas {...props} />);
  console.log('[notas] montada');
  return () => {
    root.unmount();
    console.log('[notas] desmontada');
  };
}
