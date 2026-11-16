// Adaptador para qiankun: un script clásico (qiankun no ejecuta <script type="module">)
// que publica el ciclo de vida en window.reloj y delega en el mismo mfe.js de siempre.
window['reloj'] = {
  async bootstrap() {},
  async mount(props) {
    const { mount } = await import('/reloj/mfe.js');
    mount(props.container.querySelector('#raiz'));
  },
  async unmount() {
    const { unmount } = await import('/reloj/mfe.js');
    unmount();
  },
};
