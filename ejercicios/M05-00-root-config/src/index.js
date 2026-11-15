import { getMountedApps, registerApplication, start } from 'single-spa';

// Una «aplicación» para single-spa es cualquier objeto con bootstrap, mount y unmount.
function aplicacion(nombre, texto) {
  let hueco;
  return {
    bootstrap: async () => console.log(`[${nombre}] bootstrap`),
    mount: async () => {
      hueco = document.createElement('p');
      hueco.textContent = texto;
      document.body.appendChild(hueco);
      console.log(`[${nombre}] mount`);
    },
    unmount: async () => {
      hueco.remove();
      console.log(`[${nombre}] unmount`);
    },
  };
}

// activeWhen: con qué URL está activa cada aplicación.
registerApplication({ name: 'saludo', app: async () => aplicacion('saludo', 'Hola desde la aplicación saludo'), activeWhen: '/saludo' });
registerApplication({ name: 'despedida', app: async () => aplicacion('despedida', 'Adiós desde la aplicación despedida'), activeWhen: '/despedida' });

window.addEventListener('single-spa:routing-event', () => console.log('montadas:', getMountedApps().join(', ') || '(ninguna)'));
start();
