# Lab — Remotos dinámicos

[← Página anterior](01-lab-host-y-remote.md) · [Siguiente página →](03-lab-dependencias-compartidas.md)

En este laboratorio practicas la **[carga dinámica](../glosario/02-module-federation.md#carga-dinamica) de contenedores**: el [host](../glosario/02-module-federation.md#host) no sabe al compilar dónde está
el [remote](../glosario/02-module-federation.md#remote), lo descubre al arrancar. El ejercicio es un `Banner` con dos versiones publicadas a la vez,
`banner-v1` y `banner-v2`. El host lee de un JSON qué versión usar y cambias de una a otra editando ese
fichero, sin recompilar el host.

### Objetivo

Comprender qué es la carga dinámica de un contenedor remoto: cómo lo descarga e inicializa el host a mano,
qué gana frente a un remote fijado en `webpack.config.js`, cómo se detecta una URL rota y qué falta para
que ese fallo no tumbe la página.

### Punto de partida

- Carpeta: [`ejercicios/M03-02-remotos-dinamicos/inicio`](../../ejercicios/M03-02-remotos-dinamicos/inicio),
  con tres aplicaciones: `banner-v1/` (puerto **3001**), `banner-v2/` (puerto **3002**) y `host/` (puerto
  **3000**). La solución está en [`solucion/`](../../ejercicios/M03-02-remotos-dinamicos/solucion).
- Las dos versiones del banner son remotes ya federados con el mismo `name: 'banner'` y el mismo
  `exposes: { './Banner': … }`. Solo cambia el texto y el color.
- El host ya es un host de [Module Federation](../glosario/02-module-federation.md#module-federation), con la URL de `banner-v1` escrita en su `webpack.config.js`.
- Navegador con **F12** → pestañas **Red** (Network) y **Consola** (Console).
- Para empezar de cero ([ficha](../comandos-lab.md#reiniciar)):

```bash
# Deja inicio/ como está en el repositorio
bash scripts/reiniciar.sh M03-02-remotos-dinamicos
```

### Qué está pasando

Con `remotes` en `webpack.config.js`, la URL del remote queda **dentro del `main.js` compilado del host**.
Cambiar de versión, de servidor o de entorno exige recompilar y desplegar el host, que es justo la
dependencia que los [microfrontends](../glosario/01-arquitectura.md#microfrontend) quieren evitar. En un proyecto real, el despliegue de cada remote
publica su URL en un manifiesto (un JSON, un servicio de configuración) y el host lo lee al arrancar.

| En la realidad | En este laboratorio |
|----------------|---------------------|
| Dos versiones de un microfrontend desplegadas a la vez | `banner-v1` en el 3001, `banner-v2` en el 3002 |
| El manifiesto que dice qué versión está activa | `host/public/remotes.json` |
| Cambiar de versión (o volver atrás) | Editar el JSON y recargar |

Lo que en el lab [01 — Host y remote](01-lab-host-y-remote.md) hacía Webpack solo (descargar
`remoteEntry.js`, inicializar el contenedor y pedirle el módulo), aquí lo hace una función del host.

> [!NOTE]
> **Mismo origen.** El host pide cada versión bajo `/mf/banner-v1/` y `/mf/banner-v2/`, y su
> `devServer.proxy` las reenvía al 3001 y al 3002. El navegador solo habla con el host, así que el JSON
> guarda rutas relativas que valen igual en Codespaces y en producción.

### 1 — Arranca el punto de partida y mira de dónde sale el banner

Arranca las tres aplicaciones ([ficha de `npm start`](../comandos-lab.md#npm-start)).

```bash
# Arranca banner-v1 (3001), banner-v2 (3002) y host (3000)
cd /workspaces/react-microfrontends-201/ejercicios/M03-02-remotos-dinamicos/inicio
npm start
```

**Resultado esperado** (el orden de las líneas puede variar):

```text
> concurrently -n banner-v1,banner-v2,host "npm start --prefix banner-v1" "npm start --prefix banner-v2" "npm start --prefix host"
[banner-v1] webpack 5.112.2 compiled successfully
[banner-v1] <i> [webpack-dev-server] Loopback: http://localhost:3001/, http://[::1]:3001/
[host] webpack 5.112.2 compiled successfully
[host] <i> [webpack-dev-server] Loopback: http://localhost:3000/, http://[::1]:3000/
[banner-v2] webpack 5.112.2 compiled successfully
[banner-v2] <i> [webpack-dev-server] Loopback: http://localhost:3002/, http://[::1]:3002/
```

Abre el host (puerto 3000, desde la pestaña **Puertos**, icono del globo) con **F12** → **Red**:

```text
Red      200  /main.js
Red      200  /src_bootstrap_js-webpack_sharing_consume_default_react-dom_react-dom-webpack_sharing_consume_-f8f6f9.js
Red      200  /mf/banner-v1/remoteEntry.js
Red      200  /vendors-node_modules_react-dom_client_js-node_modules_react_jsx-dev-runtime_js.js
Red      200  /vendors-node_modules_react-dom_index_js.js
Red      200  /vendors-node_modules_react_index_js.js
Red      200  /mf/banner-v1/vendors-node_modules_react_jsx-dev-runtime_js.js
Red      200  /mf/banner-v1/src_Banner_jsx.js
── Texto de la página:
Host (puerto 3000)
Banner versión 1
```

La URL `/mf/banner-v1/remoteEntry.js` sale de esta línea de `host/webpack.config.js`:

```js
// host/webpack.config.js (punto de partida) — la URL queda compilada dentro del host
remotes: { banner: 'banner@/mf/banner-v1/remoteEntry.js' },
```

Para usar `banner-v2` habría que cambiarla, parar y volver a arrancar el host. Eso es lo que vas a quitar.

### 2 — Crea el manifiesto de remotes

Saca la URL del código a un fichero que el host sirve tal cual. Crea `host/public/remotes.json`:

```json
{
  "banner": "/mf/banner-v1/remoteEntry.js"
}
```

Lo que está en `public/` lo sirve el servidor de desarrollo sin compilarlo: editarlo no recompila nada.

### 3 — Escribe el cargador de contenedores

El host necesita una función que haga a mano los cuatro pasos de Module Federation. Crea
`host/src/cargarRemoto.js`:

```js
// host/src/cargarRemoto.js
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
```

| Paso | Qué hace | Qué hacía Webpack con `remotes` |
|------|----------|---------------------------------|
| 1 | Inserta un `<script>` con la URL leída; al ejecutarse crea `window.banner` | Lo mismo, con la URL compilada |
| 2 | `__webpack_init_sharing__` registra en el share scope las [dependencias compartidas](../glosario/02-module-federation.md#shared) del host | Lo mismo, al arrancar |
| 3 | `contenedor.init(...)` le pasa ese registro al remote: usará el mismo React | Lo mismo |
| 4 | `contenedor.get('./Banner')` devuelve la fábrica; `factory()`, el módulo | Lo mismo, al resolver `import 'banner/Banner'` |

`__webpack_init_sharing__` y `__webpack_share_scopes__` no se importan: Webpack los define en cualquier
aplicación que tenga `ModuleFederationPlugin`. El objeto `contenedores` guarda la promesa por nombre para no
inicializar dos veces el mismo contenedor.

### 4 — Haz que el host lea el JSON antes de pintar el banner

Sustituye `host/src/App.jsx`. El `import` estático desaparece: el banner se carga con `lazy`, que espera a
una promesa, y `Suspense` pinta un aviso mientras tanto.

```jsx
// host/src/App.jsx
import { lazy, Suspense } from 'react';
import { cargarModulo } from './cargarRemoto';

// La URL del banner se lee de /remotes.json al arrancar: cambiarla no exige recompilar.
const Banner = lazy(async () => {
  const remotes = await fetch('/remotes.json').then((r) => r.json());
  console.log('[host] banner desde', remotes.banner);
  return cargarModulo('banner', remotes.banner, './Banner');
});

export default function App() {
  return (
    <main>
      <h1>Host (puerto 3000)</h1>
      <Suspense fallback={<p>Cargando banner…</p>}>
        <Banner />
      </Suspense>
    </main>
  );
}
```

`lazy` necesita una promesa que resuelva a un módulo con `default`: es lo que devuelve `factory()`.

### 5 — Quita el remote fijo del host y reinicia

El host ya no necesita conocer el banner al compilar. En `host/webpack.config.js`, borra la línea
`remotes` del plugin y deja el resto:

```js
// host/webpack.config.js — en plugins
    new ModuleFederationPlugin({
      name: 'host',
      // Sin «remotes»: el host los descubre en tiempo de ejecución (src/cargarRemoto.js).
      shared: { react: { singleton: true }, 'react-dom': { singleton: true } },
    }),
```

El plugin se queda: sigue haciendo falta para compartir React y para que existan
`__webpack_init_sharing__` y `__webpack_share_scopes__`. Como has tocado `webpack.config.js`, para con
`Ctrl+C` y vuelve a arrancar:

```bash
# En inicio/, después de Ctrl+C
npm start
```

**Resultado esperado** (el orden de las líneas puede variar):

```text
> concurrently -n banner-v1,banner-v2,host "npm start --prefix banner-v1" "npm start --prefix banner-v2" "npm start --prefix host"
[host] webpack 5.112.2 compiled successfully
[banner-v2] webpack 5.112.2 compiled successfully
[host] <i> [webpack-dev-server] Loopback: http://localhost:3000/, http://[::1]:3000/
[banner-v2] <i> [webpack-dev-server] Loopback: http://localhost:3002/, http://[::1]:3002/
[banner-v1] webpack 5.112.2 compiled successfully
[banner-v1] <i> [webpack-dev-server] Loopback: http://localhost:3001/, http://[::1]:3001/
```

Recarga el host con **F12** abierto (**Red** y **Consola**):

```text
Red      200  /main.js
Red      200  /src_bootstrap_js-webpack_sharing_consume_default_react-dom_react-dom-webpack_sharing_consume_-f8f6f9.js
Red      200  /vendors-node_modules_react_index_js.js
Red      200  /vendors-node_modules_react-dom_index_js.js
Red      200  /vendors-node_modules_react-dom_client_js-node_modules_react_jsx-dev-runtime_js.js
Red      200  /remotes.json
Consola  [host] banner desde /mf/banner-v1/remoteEntry.js
Red      200  /mf/banner-v1/remoteEntry.js
Red      200  /mf/banner-v1/vendors-node_modules_react_jsx-dev-runtime_js.js
Red      200  /mf/banner-v1/src_Banner_jsx.js
── Texto de la página:
Host (puerto 3000)
Banner versión 1
```

Compáralo con el paso 1:

| Antes (remote fijo) | Ahora (remote dinámico) |
|---------------------|-------------------------|
| `remoteEntry.js` justo después de `bootstrap`, antes de pintar | El host arranca y pinta; después pide `/remotes.json` |
| La URL viene de `main.js` | La URL viene de `remotes.json` (la línea `[host] banner desde …`) |
| El banner llega con el host | El banner llega después, cuando `lazy` lo pide: `Suspense` pinta «Cargando banner…» mientras tanto |

### 6 — Mira el manifiesto que sirve el host

Abre en el navegador el puerto 3000 con `/remotes.json` al final de la dirección: ves el JSON que has
creado, servido por el host. Desde la terminal es lo mismo:

```bash
# En otra terminal: el manifiesto tal como lo recibe el navegador
curl -s http://localhost:3000/remotes.json
```

**Resultado esperado:**

```text
{
  "banner": "/mf/banner-v1/remoteEntry.js"
}
```

### 7 — Cambia de versión sin recompilar

Edita `host/public/remotes.json` con las aplicaciones en marcha y cambia `v1` por `v2`:

```json
{
  "banner": "/mf/banner-v2/remoteEntry.js"
}
```

No reinicies nada. La terminal no muestra ninguna compilación nueva del host. Recarga el host:

**Resultado esperado:**

```text
Red      200  /main.js
Red      200  /src_bootstrap_js-webpack_sharing_consume_default_react-dom_react-dom-webpack_sharing_consume_-f8f6f9.js
Red      200  /vendors-node_modules_react-dom_index_js.js
Red      200  /vendors-node_modules_react_index_js.js
Red      200  /vendors-node_modules_react-dom_client_js-node_modules_react_jsx-dev-runtime_js.js
Red      200  /remotes.json
Consola  [host] banner desde /mf/banner-v2/remoteEntry.js
Red      200  /mf/banner-v2/remoteEntry.js
Red      200  /mf/banner-v2/vendors-node_modules_react_jsx-dev-runtime_js.js
Red      200  /mf/banner-v2/src_Banner_jsx.js
── Texto de la página:
Host (puerto 3000)
Banner versión 2
```

El `main.js` y el `bootstrap` del host son los mismos ficheros de antes; solo ha cambiado lo que dice el
JSON. Volver a `v1` es la misma operación al revés: así se hace una marcha atrás en segundos.

## Comprueba tu entendimiento

**El host no sabe nada del banner al compilar**
Busca `banner-v1` en `host/webpack.config.js` y en `host/src/`.
→ Solo aparece en `host/public/remotes.json`. El código compilado del host no contiene ninguna URL de
remote.

**El contenedor lo crea el script**
Con el host abierto, escribe en la **Consola**:

```js
// En la Consola del host: el contenedor que ha dejado el remoteEntry.js descargado
Object.keys(window.banner)
```

→ Ves `get` e `init`: el mismo contenedor de siempre, aunque lo haya cargado tu función y no Webpack.

**Las dos versiones se llaman igual**
Mira el `name` de `banner-v1/webpack.config.js` y de `banner-v2/webpack.config.js`.
→ Los dos son `banner`. Por eso el host puede cambiar de uno a otro sin tocar `cargarModulo('banner', …)`.

## Investiga

¿En qué momento exacto se lee `remotes.json` y quién inserta el `remoteEntry.js`? En la pestaña **Red**,
pulsa sobre `/remotes.json` y después sobre `/mf/banner-v1/remoteEntry.js`, y mira en cada uno la columna
**Iniciador** (Initiator): qué fichero y qué línea lanzaron la petición. Compáralo con lo que esperas del
código: el `fetch` está en el `lazy` de `App.jsx` y el `<script>` lo crea `cargarScript` en
`cargarRemoto.js`. Después repítelo con el punto de partida en mente: en el paso 1 el `remoteEntry.js` no lo
pedía tu código, sino el runtime de Webpack.

## Experimenta

**Predice antes:** si `remotes.json` apunta a una versión que no existe, ¿verás el título del host con un
hueco donde iba el banner, o no verás nada?

Edita `host/public/remotes.json` con una ruta inexistente y recarga:

```json
{
  "banner": "/mf/banner-v9/remoteEntry.js"
}
```

**Resultado esperado:**

```text
Red      200  /main.js
Red      200  /vendors-node_modules_react_index_js.js
Red      200  /vendors-node_modules_react-dom_index_js.js
Red      200  /src_bootstrap_js-webpack_sharing_consume_default_react-dom_react-dom-webpack_sharing_consume_-f8f6f9.js
Red      200  /vendors-node_modules_react-dom_client_js-node_modules_react_jsx-dev-runtime_js.js
Red      200  /remotes.json
Consola  [host] banner desde /mf/banner-v9/remoteEntry.js
Consola (error)  Failed to load resource: the server responded with a status of 404 (Not Found)
Consola (error)  Refused to execute script from 'http://localhost:3000/mf/banner-v9/remoteEntry.js' because its MIME type ('text/html') is not executable, and strict MIME type checking is enabled.
Red      falló  http://localhost:3000/mf/banner-v9/remoteEntry.js
Consola (error)  Uncaught No se pudo cargar /mf/banner-v9/remoteEntry.js
Consola (aviso)  %s

%s
 An error occurred in one of your React components. Consider adding an error boundary to your tree to customize error handling behavior.
Visit https://react.dev/link/error-boundaries to learn more about error boundaries.
── Texto de la página:

```

**Cómo se lee:**

| Línea | Qué ha pasado |
|-------|---------------|
| `404 (Not Found)` | No hay regla de proxy para `/mf/banner-v9`: el host no encuentra el fichero |
| `Refused to execute script … MIME type ('text/html')` | La respuesta 404 es una página HTML y el navegador se niega a ejecutarla como script |
| `No se pudo cargar /mf/banner-v9/remoteEntry.js` | El `reject` de `cargarScript`, tu propio mensaje |
| `Consider adding an error boundary` y la página en blanco | El error sale de `lazy` y nadie lo captura: React desmonta todo el árbol, título incluido |

Que el remote se cargue tarde no basta: un error en la carga sigue tumbando la página entera. Falta una
**[barrera de errores](../glosario/02-module-federation.md#barrera-de-errores)** alrededor del banner, que es lo que monta el lab
[04 — Lazy loading de remotos](04-lab-lazy-loading-remotos.md). Deja el JSON otra vez en `v1` o `v2` y
recarga.

## Reto

### 1 — Probar la versión nueva solo en tu navegador

**La situación:** el equipo del banner ha publicado `banner-v2` y quiere probarlo en el host real antes de
cambiar `remotes.json` para todo el mundo. Alguien propone que el host acepte un parámetro en la URL,
`?banner=v2`, que solo afecta a quien lo escribe.

**Qué haces:** con `remotes.json` en `v1`, cambia el `lazy` de `host/src/App.jsx` para que, si la URL de la
página trae `?banner=…`, use `/mf/banner-<valor>/remoteEntry.js`, y si no, lo que diga el JSON. Guarda
(no hace falta reiniciar) y abre el host con y sin `?banner=v2` al final de la dirección.

**Pistas:** `new URLSearchParams(window.location.search).get('banner')` devuelve el valor o `null`.

**Lo que buscas:** sin parámetro ves «Banner versión 1»; con `?banner=v2`, «Banner versión 2», y la línea
`[host] banner desde …` de la **Consola** dice qué URL se ha usado en cada caso.

<details>
<summary>Ver solución</summary>

```jsx
// host/src/App.jsx — el parámetro de la URL manda sobre el manifiesto
const Banner = lazy(async () => {
  const remotes = await fetch('/remotes.json').then((r) => r.json());
  const version = new URLSearchParams(window.location.search).get('banner');  // p. ej. 'v2'
  const url = version ? `/mf/banner-${version}/remoteEntry.js` : remotes.banner;
  console.log('[host] banner desde', url);
  return cargarModulo('banner', url, './Banner');
});
```

Con `?banner=v2` la **Consola** muestra `[host] banner desde /mf/banner-v2/remoteEntry.js` y en la pestaña
**Red** aparece `/mf/banner-v2/remoteEntry.js`; sin parámetro, lo de siempre. En un entorno real, este tipo
de interruptor se restringe (a usuarios internos, a una cookie) para que nadie cargue versiones a medias.

**La regla:** si la URL del remote se decide en tiempo de ejecución, se puede decidir por usuario: una
versión para todos en el manifiesto y otra para quien la está probando.

</details>

## Errores frecuentes

| Síntoma | Causa probable | Cómo arreglarlo |
|---------|----------------|-----------------|
| `__webpack_init_sharing__ is not defined` | Has quitado el `ModuleFederationPlugin` entero del host, no solo `remotes` | Deja el plugin con `name` y `shared` (paso 5) y reinicia con `npm start` |
| `404` en `/remotes.json` | El fichero no está en `host/public/` o tiene otro nombre | Crea `host/public/remotes.json` |
| `Unexpected token` al leer el JSON | El JSON tiene una coma de más o comillas simples | Deja exactamente `{ "banner": "/mf/banner-v1/remoteEntry.js" }` |
| Cambias el JSON y sigue saliendo la versión anterior | No has recargado la página: el contenedor ya está cargado en `window.banner` | Recarga el host |
| `Refused to execute script … MIME type ('text/html')` | La URL del JSON no corresponde a ninguna regla de `devServer.proxy` | Usa `/mf/banner-v1/` o `/mf/banner-v2/`, las dos que reenvía el host |
| Página en blanco con `Consider adding an error boundary` | La carga del remote ha fallado y no hay barrera de errores | Arregla la URL; para aislar el fallo, mira [04 — Lazy loading de remotos](04-lab-lazy-loading-remotos.md) |

## Conclusiones

### Qué es la carga dinámica de contenedores

El host descarga el `remoteEntry.js` de una URL que lee al arrancar, inicializa el contenedor con su share
scope y le pide el módulo. Son los mismos cuatro pasos que hace Webpack con `remotes`, con la URL fuera del
código compilado.

```text
App (lazy) ──► fetch /remotes.json ──► <script src="/mf/banner-v2/remoteEntry.js">
                                          └► window.banner.init(share scope) ──► get('./Banner') ──► <Banner />
```

### Cómo debe ser

| Requisito | En el lab |
|-----------|-----------|
| La URL vive en un fichero que se cambia sin compilar | `host/public/remotes.json` |
| El host conserva `ModuleFederationPlugin` con `shared` | Sin `remotes`, con `react` y `react-dom` [singleton](../glosario/02-module-federation.md#singleton) |
| El contenedor se inicializa con el share scope del host | `contenedor.init(__webpack_share_scopes__.default)` |
| Cada contenedor se inicializa una sola vez | El objeto `contenedores` guarda la promesa por nombre |
| Las versiones de un remote comparten `name` y `exposes` | `banner` y `./Banner` en v1 y v2 |

### Dónde se rompe y cómo lo has detectado

| Fallo | Cómo lo has visto | Qué provoca |
|-------|-------------------|-------------|
| URL inexistente en el JSON | `404`, `Refused to execute script`, `No se pudo cargar …` en la **Consola** | Página en blanco |
| Sin barrera de errores | `Consider adding an error boundary` | El fallo del banner se lleva por delante el título del host |
| URL fija en `webpack.config.js` | La URL sale de `main.js` (paso 1) | Cambiar de versión obliga a recompilar el host |

### Cómo se perfecciona

- Una barrera de errores alrededor de cada remote para que su fallo quede en su zona
  ([04 — Lazy loading de remotos](04-lab-lazy-loading-remotos.md)).
- El manifiesto lo genera el despliegue de cada remote, no se edita a mano, y se pide sin caché
  (`fetch('/remotes.json', { cache: 'no-store' })`) para que una marcha atrás llegue enseguida.
- Dos versiones con el mismo `name` no pueden convivir en la misma página (las dos son `window.banner`):
  para mostrarlas juntas, cada una necesita su propio nombre.
- Module Federation 2.0 trae un manifiesto estándar y un cargador de remotes que sustituyen a este
  `cargarRemoto.js`.

### En una frase

> 🔑 Si la URL del remote se lee al arrancar en lugar de compilarse dentro del host, cambiar de versión es editar un JSON y recargar, pero sin una barrera de errores una URL rota sigue tumbando la página.
