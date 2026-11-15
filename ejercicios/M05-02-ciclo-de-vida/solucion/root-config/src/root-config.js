import { addErrorHandler, getAppStatus, registerApplication, start } from 'single-spa';

// Envuelve las funciones del ciclo de vida para ver en la consola cuándo las llama single-spa.
function conTraza(nombre, ciclo) {
  const traza = (fase) => async (props) => {
    console.log(`[${nombre}] ${fase}`);
    return ciclo[fase](props);
  };
  return { bootstrap: traza('bootstrap'), mount: traza('mount'), unmount: traza('unmount') };
}

registerApplication({ name: 'reloj', app: () => import('reloj/spa').then((m) => conTraza('reloj', m)), activeWhen: '/' });
registerApplication({ name: 'inestable', app: () => import('inestable/spa').then((m) => conTraza('inestable', m)), activeWhen: '/panel' });

// Errores del ciclo de vida (no del render): single-spa los entrega aquí.
addErrorHandler((err) => console.log(`[root] error en ${err.appOrParcelName}: ${getAppStatus(err.appOrParcelName)}`));

start();
