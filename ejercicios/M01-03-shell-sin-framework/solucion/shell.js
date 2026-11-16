// Shell sin framework: carga cada microfrontend al pedirlo y desmonta el anterior.
const contenedor = document.getElementById('contenedor');
let activo = null;   // { nombre, modulo } del microfrontend montado

async function mostrar(nombre) {
  if (activo?.nombre === nombre) return;           // ya está montado
  activo?.modulo.unmount();                        // el anterior se retira y limpia lo suyo
  const modulo = await import(`/${nombre}/mfe.js`); // se descarga la primera vez; después, de la caché de módulos
  modulo.mount(contenedor);
  activo = { nombre, modulo };
}

for (const boton of document.querySelectorAll('[data-mfe]')) {
  boton.addEventListener('click', () => mostrar(boton.dataset.mfe));
}
