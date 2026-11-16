// Adaptador para qiankun: un script clásico (qiankun no ejecuta <script type="module">)
// que publica el ciclo de vida en window.catalogo y delega en el mismo mfe.js de siempre.
window['catalogo'] = {
  async bootstrap() {},
  async mount(props) {
    const { mount } = await import('/catalogo/mfe.js');
    mount(props.container.querySelector('#raiz'));
  },
  async unmount() {
    const { unmount } = await import('/catalogo/mfe.js');
    unmount();
  },
};
