import { createRoot } from 'react-dom/client';
import Banner from './Banner';

// Espera a que la tienda haya pintado su hueco y se monta en él.
function montar() {
  const hueco = document.getElementById('banner');
  if (hueco) createRoot(hueco).render(<Banner />);
  else requestAnimationFrame(montar);
}
montar();
