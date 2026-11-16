# Los mismos microfrontends, cinco integraciones

[← Página anterior](04-lab-aislamiento-de-estilos.md) · [Siguiente página →](../M02-diseno-arquitecturas/README.md)

Esta demostración toma dos [microfrontends](../glosario/01-arquitectura.md#microfrontend) en JavaScript puro, **catálogo** y **reloj**, y los integra en un [shell](../glosario/01-arquitectura.md#shell)
de cinco maneras distintas: `import()`, [import maps](../glosario/01-arquitectura.md#import-map), **[single-spa](../glosario/04-integracion-despliegue.md#single-spa)**, **[qiankun](../glosario/04-integracion-despliegue.md#qiankun)** y **[Module Federation](../glosario/02-module-federation.md#module-federation)**. Los
microfrontends no cambian entre una y otra: el mismo `mfe.js` con el [contrato](../glosario/01-arquitectura.md#contrato) `mount` y `unmount`. Lo que cambia
es quién sabe dónde está cada uno, quién decide cuándo se monta y qué hace falta para publicarlo.

## Punto de partida

- Carpeta: [`ejercicios/M01-05-cinco-integraciones`](../../ejercicios/M01-05-cinco-integraciones). Ya está
  todo escrito; la demostración no cambia nada.
- Dependencias instaladas en la raíz del repositorio (el Codespace ejecuta `npm ci` al crearse): `single-spa`,
  `qiankun` y Webpack.
- Navegador con **F12** → pestañas **Red** (Network) y **Consola** (Console).

```text
M01-05-cinco-integraciones/
├── catalogo/      mfe.js (contrato), index.html y qiankun.js (solo para qiankun)
├── reloj/         lo mismo
├── shells/        1-import.html, 2-import-map.html, 3-single-spa.html, 4-qiankun.html y su .js
├── federacion/    webpack.config.js y shell.js de la versión con Module Federation
├── preparar.js    copia las librerías y construye Module Federation en publicado/
└── index.html     enlaces a las cinco versiones
```

Los dos microfrontends tienen la forma que ya conoces de [03 — Un shell sin framework](03-lab-shell-sin-framework.md):

```js
// catalogo/mfe.js — el mismo fichero para las cinco integraciones
let raiz = null;

export function mount(contenedor) {
  raiz = document.createElement('section');
  raiz.innerHTML = '<h2>Catálogo</h2><p>Mochila urbana · Botella térmica</p>';
  contenedor.appendChild(raiz);
  console.log('[catalogo] mount');
}

export function unmount() {
  raiz?.remove();
  raiz = null;
  console.log('[catalogo] unmount');
}
```

Las cinco páginas del shell son iguales: dos enlaces, `#catalogo` y `#reloj`, y un hueco `#contenedor`. La parte
de la URL tras `#` decide qué microfrontend se ve.

## Recorrido

### 1 — Arranque

`npm start` ejecuta antes `preparar.js` (el script `prestart`): copia `single-spa` y `qiankun` desde
`node_modules` a `publicado/vendor/` y construye con Webpack los tres paquetes de Module Federation. Después
sirve la carpeta en el puerto 3000 ([ficha de `npm start`](../comandos-lab.md#npm-start)).

```bash
# Copia las librerías, construye Module Federation y sirve la demostración en el puerto 3000
cd /workspaces/react-microfrontends-201/ejercicios/M01-05-cinco-integraciones
npm start
```

**Resultado** (recortado: sin la lista de módulos de cada build; el recuadro final es el de las otras demos):

```text
[preparar] librerías copiadas en publicado/vendor/
catalogo:
  asset remoteEntry.js 2.91 KiB [emitted] [minimized] (name: catalogo)
  asset 764.js 376 bytes [emitted] [minimized]
  catalogo (webpack 5.112.2) compiled successfully in 386 ms
reloj:
  asset remoteEntry.js 2.9 KiB [emitted] [minimized] (name: reloj)
  asset 374.js 436 bytes [emitted] [minimized]
  reloj (webpack 5.112.2) compiled successfully in 366 ms
shell:
  asset main.js 4.7 KiB [emitted] [minimized] (name: main)
  asset index.html 378 bytes [emitted] [minimized]
  shell (webpack 5.112.2) compiled successfully in 559 ms
[preparar] Module Federation construido en publicado/federacion/
```

Solo una de las cinco versiones necesita compilar: Module Federation. Las otras cuatro sirven los ficheros tal
cual. La página del puerto 3000 enlaza las cinco.

### 2 — `import()`: el shell conoce la URL

```js
// shells/import.js — el shell construye la URL y carga el microfrontend cuando la ruta lo pide
const contenedor = document.getElementById('contenedor');
let activo = null;

async function mostrar() {
  activo?.unmount();
  activo = null;
  const nombre = location.hash.slice(1);
  if (!nombre) return;
  activo = await import(`/${nombre}/mfe.js`);   // la URL está en el código del shell
  activo.mount(contenedor);
}

addEventListener('hashchange', mostrar);
mostrar();
```

Al abrir `/shells/1-import#catalogo` y pulsar **Reloj** (la hora cambia en cada ejecución):

```text
Red      200  /shells/import.js
Red      200  /catalogo/mfe.js
Consola  [catalogo] mount
── Clic en Reloj
Consola  [catalogo] unmount
Red      200  /reloj/mfe.js
Consola  [reloj] mount
── Texto de la página:
Shell — import()
Catálogo · Reloj · Las cinco integraciones
Reloj

12:00:00
```

Es el shell del lab 03. Sin librerías, pero el shell lleva escrita la ruta de cada microfrontend: moverlo de sitio
es publicar el shell de nuevo.

### 3 — Import maps: el shell importa por nombre

Un **import map** es un bloque JSON del HTML que asocia nombres a URL. El navegador lo consulta en cada `import`.
El `.js` del shell es el mismo con una sola línea distinta:

```html
<!-- shells/2-import-map.html — el import map da nombre a cada microfrontend -->
<script type="importmap">
  { "imports": { "catalogo": "/catalogo/mfe.js", "reloj": "/reloj/mfe.js" } }
</script>
```

```js
// shells/import-map.js — la línea que cambia: se importa por nombre
activo = await import(nombre);               // «catalogo» → /catalogo/mfe.js, según el import map
```

Al abrir `/shells/2-import-map#catalogo` y pulsar **Reloj**:

```text
Red      200  /shells/import-map.js
Red      200  /catalogo/mfe.js
Consola  [catalogo] mount
── Clic en Reloj
Consola  [catalogo] unmount
Red      200  /reloj/mfe.js
Consola  [reloj] mount
── Texto de la página:
Shell — import maps
Catálogo · Reloj · Las cinco integraciones
Reloj

12:00:00
```

Las mismas peticiones, pero el código del shell ya no contiene ninguna URL: para apuntar a otra versión de un
microfrontend basta con cambiar el import map, que puede generarse en el servidor. Es el mismo papel que el
`remotes.json` de [M03 — Remotos dinámicos](../M03-module-federation/02-lab-remotos-dinamicos.md). Los import maps
son un estándar del navegador; antes se conseguía lo mismo con la librería **SystemJS**, que todavía aparece en
muchos proyectos de single-spa.

### 4 — single-spa: registro y ciclo de vida por ruta

El shell ya no decide cuándo montar: registra cada microfrontend con una función de carga y una condición de
ruta (`activeWhen`), y single-spa llama a `bootstrap`, `mount` y `unmount` cuando la URL cambia.

```js
// shells/single-spa.js
import { getMountedApps, registerApplication, start } from 'single-spa';

const contenedor = document.getElementById('contenedor');

// single-spa pide bootstrap, mount y unmount que devuelvan promesas: se adapta el contrato del microfrontend.
const cargar = (nombre) => async () => {
  const mfe = await import(`/${nombre}/mfe.js`);
  return { bootstrap: async () => {}, mount: async () => mfe.mount(contenedor), unmount: async () => mfe.unmount() };
};

for (const nombre of ['catalogo', 'reloj']) {
  registerApplication({ name: nombre, app: cargar(nombre), activeWhen: (l) => l.hash === `#${nombre}` });
}
addEventListener('single-spa:routing-event', () => console.log('[shell] montadas:', getMountedApps().join(', ') || '(ninguna)'));
start();
```

`import ... from 'single-spa'` funciona sin compilar porque la página tiene un import map con
`"single-spa": "/publicado/vendor/single-spa.js"`. Al abrir `/shells/3-single-spa#catalogo` y pulsar **Reloj**:

```text
Red      200  /shells/single-spa.js
Red      200  /publicado/vendor/single-spa.js
Red      200  /catalogo/mfe.js
Consola  [catalogo] mount
Consola  [shell] montadas: catalogo
── Clic en Reloj
Consola  [catalogo] unmount
Red      200  /reloj/mfe.js
Consola  [reloj] mount
Consola  [shell] montadas: reloj
Consola  [shell] montadas: reloj
── Texto de la página:
Shell — single-spa
Catálogo · Reloj · Las cinco integraciones
Reloj

12:00:00
```

| Qué se ve | Qué significa |
|-----------|---------------|
| `/publicado/vendor/single-spa.js` | La librería se descarga como un módulo más |
| `[catalogo] unmount` antes de `[reloj] mount` | El orden lo garantiza single-spa, no el shell |
| `[shell] montadas: reloj` dos veces | Un clic en un enlace `#` dispara en el navegador `popstate` y `hashchange`; single-spa escucha los dos y emite un evento de enrutado por cada uno |

El shell ha dejado de tener una función `mostrar`: describe qué aplicaciones hay y cuándo están activas. Es lo
que se trabaja con React en M05.

### 5 — qiankun: una página HTML por microfrontend

qiankun está construido sobre single-spa y añade dos cosas: cada microfrontend se registra por **su página HTML**
(su `entry`), y sus scripts se ejecutan dentro de un **sandbox** que aísla lo que escriben en `window`.

```js
// shells/qiankun.js — qiankun se carga como script clásico y deja window.qiankun
const { registerMicroApps, start } = window.qiankun;

registerMicroApps([
  { name: 'catalogo', entry: '/catalogo/', container: '#contenedor', activeRule: (l) => l.hash === '#catalogo' },
  { name: 'reloj', entry: '/reloj/', container: '#contenedor', activeRule: (l) => l.hash === '#reloj' },
]);
start({ prefetch: false });   // sin precarga: cada microfrontend se descarga al activarse
```

El microfrontend necesita una página de entrada y un adaptador. qiankun no ejecuta `<script type="module">`, así
que el adaptador es un script clásico que deja el [ciclo de vida](../glosario/04-integracion-despliegue.md#ciclo-de-vida) en `window` con el nombre de la aplicación y
delega en el mismo `mfe.js`:

```js
// catalogo/qiankun.js — lo carga catalogo/index.html: <div id="raiz"></div><script src="./qiankun.js"></script>
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
```

Al abrir `/shells/4-qiankun#catalogo` y pulsar **Reloj**:

```text
Red      200  /shells/qiankun.js
Red      200  /publicado/vendor/qiankun.js
Red      200  /catalogo/
Red      200  /catalogo/qiankun.js
Red      200  /catalogo/mfe.js
Consola  [catalogo] mount
── Clic en Reloj
Consola  [catalogo] unmount
Red      200  /reloj/
Red      200  /reloj/qiankun.js
Red      200  /reloj/mfe.js
Consola  [reloj] mount
── Texto de la página:
Shell — qiankun
Catálogo · Reloj · Las cinco integraciones
Reloj

12:00:00
```

| Qué se ve | Qué significa |
|-----------|---------------|
| `/catalogo/` antes que cualquier `.js` | qiankun descarga primero la página HTML del microfrontend y de ahí saca sus scripts |
| `/catalogo/qiankun.js` | Se ejecuta en el sandbox y deja `window.catalogo` con el ciclo de vida |
| `/catalogo/mfe.js` | El adaptador importa el mismo módulo de las otras versiones |

La ventaja es que un microfrontend puede ser una aplicación completa con su HTML, y que lo que deja en `window`
no se mezcla con lo de los demás. qiankun nació en Ant Group y se usa sobre todo en China: buena parte de su comunidad
y de sus ejemplos están en chino.

### 6 — Module Federation: compilado con Webpack

Cada microfrontend se construye como un **[remote](../glosario/02-module-federation.md#remote)** que expone su `mfe.js`, y el shell como un **[host](../glosario/02-module-federation.md#host)** que
declara dónde está cada `remoteEntry.js`.

```js
// federacion/webpack.config.js (extracto) — el remote expone el mismo mfe.js
new ModuleFederationPlugin({ name: nombre, filename: 'remoteEntry.js', exposes: { './mfe': `../${nombre}/mfe.js` } })

// … y el shell declara los remotes
new ModuleFederationPlugin({
  name: 'shell',
  remotes: {
    catalogo: 'catalogo@/publicado/federacion/catalogo/remoteEntry.js',
    reloj: 'reloj@/publicado/federacion/reloj/remoteEntry.js',
  },
})
```

```js
// federacion/shell.js — el shell importa «catalogo/mfe» como si fuera un paquete
const remotos = { catalogo: () => import('catalogo/mfe'), reloj: () => import('reloj/mfe') };
```

Al abrir `/publicado/federacion/shell/#catalogo` y pulsar **Reloj**:

```text
Red      200  /publicado/federacion/shell/main.js
Red      200  /publicado/federacion/catalogo/remoteEntry.js
Red      200  /publicado/federacion/reloj/remoteEntry.js
Red      200  /publicado/federacion/catalogo/764.js
Consola  [catalogo] mount
── Clic en Reloj
Consola  [catalogo] unmount
Red      200  /publicado/federacion/reloj/374.js
Consola  [reloj] mount
── Texto de la página:
Shell — Module Federation
Catálogo · Reloj · Las cinco integraciones
Reloj

12:00:00
```

| Qué se ve | Qué significa |
|-----------|---------------|
| Los dos `remoteEntry.js` al arrancar | El host consulta a cada remote antes de empezar (es el índice de lo que expone) |
| `764.js` y `374.js` | El código de cada `mfe.js`, compilado por su remote, que llega cuando se pide |
| Nombres sin significado (`764.js`) | Los decide Webpack; el host solo conoce `catalogo/mfe` |

Aquí no hay nada que compartir, porque los microfrontends no usan librerías. La razón de ser de Module
Federation aparece cuando las hay: que React viaje una sola vez para todos. Es el M03.

## Qué queda visto

| Técnica | Quién sabe dónde está cada microfrontend | Quién decide cuándo se monta | Qué exige al microfrontend | Compilación |
|---------|------------------------------------------|------------------------------|----------------------------|-------------|
| `import()` | El código del shell | El shell | Un módulo con `mount`/`unmount` | No |
| Import maps | El HTML del shell (el import map) | El shell | Lo mismo | No |
| single-spa | La función de carga de cada registro | single-spa, por `activeWhen` | `bootstrap`/`mount`/`unmount` que devuelvan promesas | No |
| qiankun | La `entry` HTML de cada registro | qiankun, por `activeRule` | Una página HTML y el ciclo de vida en `window`, sin `type="module"` | No |
| Module Federation | La configuración de `remotes` del host | El shell | Un build con `ModuleFederationPlugin` | Sí |

- Las cinco resuelven el mismo problema: cargar en tiempo de ejecución código que otro equipo publica por su
  cuenta, y montarlo y desmontarlo en un hueco de la página.
- Se diferencian en dos ejes: **dónde vive la dirección** de cada microfrontend (código, HTML, configuración) y
  **quién orquesta** el montaje (el shell o una librería).
- No son excluyentes. En este curso se combinan: Module Federation para cargar y compartir dependencias (M03) y
  single-spa para orquestar por rutas (M05), cargando cada aplicación de single-spa con Module Federation.

**La pregunta que abre el M02:** si los microfrontends se pueden cargar por separado, ¿cómo se decide dónde
termina cada uno, cómo se estructura por dentro y quién se encarga de las rutas?
