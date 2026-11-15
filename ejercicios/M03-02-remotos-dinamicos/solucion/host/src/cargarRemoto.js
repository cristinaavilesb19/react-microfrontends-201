// Carga un contenedor remoto cuya URL solo se conoce en tiempo de ejecución.
const contenedores = {};

function cargarScript(url) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = url;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`No se pudo cargar ${url}`));
    document.head.appendChild(script);
  });
}

export async function cargarModulo(nombre, url, modulo) {
  if (!contenedores[nombre]) {
    contenedores[nombre] = (async () => {
      await cargarScript(url);                                 // 1. descarga remoteEntry.js: crea window[nombre]
      await __webpack_init_sharing__('default');               // 2. prepara las dependencias compartidas del host
      const contenedor = window[nombre];
      await contenedor.init(__webpack_share_scopes__.default); // 3. el remote se apunta a ellas (un solo React)
      return contenedor;
    })();
  }
  const contenedor = await contenedores[nombre];
  const factory = await contenedor.get(modulo);                // 4. pide el módulo expuesto
  return factory();
}
