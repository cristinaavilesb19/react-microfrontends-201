import { mount } from './mount';

// Modo aislado: si la página tiene #root, la microaplicación se monta sola.
const raiz = document.getElementById('root');
if (raiz) mount(raiz);

// Contrato público: lo que ve quien la integra.
export { mount };
