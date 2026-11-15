# Qué hay dentro de remoteEntry.js

[← Página anterior](README.md) · [Siguiente página →](01-lab-host-y-remote.md)

Esta demostración enseña la pieza central de [Module Federation](../glosario/02-module-federation.md#module-federation), el **contenedor**, con el caso más
pequeño posible: un [remote](../glosario/02-module-federation.md#remote) llamado `saludo` expone un componente `Saludo` que pinta un párrafo, y un [host](../glosario/02-module-federation.md#host)
lo usa sin tenerlo en su código. Se sigue el viaje de ese párrafo: qué pide el host por la red, qué
contiene el `remoteEntry.js` que recibe y qué objeto deja en el navegador.

## Punto de partida

- Carpeta: [`ejercicios/M03-00-remote-entry`](../../ejercicios/M03-00-remote-entry), con dos aplicaciones:
  `remote/` (puerto **3001**) y `host/` (puerto **3000**). Ya están configuradas; la demo no cambia nada.
- Dependencias instaladas en la raíz del repositorio (el Codespace lo hace al crearse con `npm ci`).
- Navegador con las herramientas de desarrollo: **F12** → pestañas **Red** (Network) y **Consola** (Console).

Las dos piezas de configuración que importan son estas:

```js
// remote/webpack.config.js — el remote publica un contenedor llamado «saludo»
new ModuleFederationPlugin({
  name: 'saludo',                               // nombre del contenedor: window.saludo
  filename: 'remoteEntry.js',                   // fichero de entrada que pedirá el host
  exposes: { './Saludo': './src/Saludo.jsx' },  // lo que ofrece, con el nombre público ./Saludo
  shared: { react: { singleton: true }, 'react-dom': { singleton: true } },
})
```

```js
// host/webpack.config.js — el host sabe dónde está el contenedor «saludo»
new ModuleFederationPlugin({
  name: 'host',
  remotes: { saludo: 'saludo@/mf/saludo/remoteEntry.js' },   // alias: nombre@URL
  shared: { react: { singleton: true }, 'react-dom': { singleton: true } },
})
```

Y el host lo usa como cualquier otro componente:

```jsx
// host/src/App.jsx — 'saludo/Saludo' no es un fichero del host: es el alias del remote + el módulo expuesto
import Saludo from 'saludo/Saludo';

export default function App() {
  return (
    <main>
      <h1>Host (puerto 3000)</h1>
      <Saludo nombre="Ana" />
    </main>
  );
}
```

## Recorrido

### 1 — Las dos aplicaciones arrancan a la vez

Un único comando, en la carpeta del ejercicio, arranca el remote y el host, cada uno con su servidor de
desarrollo de Webpack ([ficha de `npm start`](../comandos-lab.md#npm-start)).

```bash
# Arranca remote (3001) y host (3000) con concurrently
cd /workspaces/react-microfrontends-201/ejercicios/M03-00-remote-entry
npm start
```

**Resultado** (el orden de las líneas puede variar):

```text
> concurrently -n remote,host "npm start --prefix remote" "npm start --prefix host"
[host] webpack 5.112.2 compiled successfully
[host] <i> [webpack-dev-server] Loopback: http://localhost:3000/, http://[::1]:3000/
[remote] webpack 5.112.2 compiled successfully
[remote] <i> [webpack-dev-server] Loopback: http://localhost:3001/, http://[::1]:3001/
```

Son dos compilaciones independientes: el host no ha leído ni una línea de `Saludo.jsx`. Si el remote no
existiera, el host compilaría igual.

### 2 — El host pinta un párrafo que no es suyo

En la pestaña **Puertos** de VS Code, el puerto 3000 se abre con el icono del globo («Abrir en el
navegador»); fuera de Codespaces, `http://localhost:3000`. Con **F12** → **Red** abierto antes de recargar,
la página y sus peticiones son estas:

```text
Red      200  /main.js
Red      200  /src_bootstrap_js-webpack_sharing_consume_default_react-dom_react-dom-webpack_sharing_consume_-f8f6f9.js
Red      200  /mf/saludo/remoteEntry.js
Red      200  /vendors-node_modules_react-dom_client_js-node_modules_react_jsx-dev-runtime_js.js
Red      200  /mf/saludo/vendors-node_modules_react_index_js.js
Red      200  /mf/saludo/src_Saludo_jsx.js
Red      200  /mf/saludo/vendors-node_modules_react_jsx-dev-runtime_js.js
Red      200  /mf/saludo/vendors-node_modules_react-dom_index_js.js
── Texto de la página:
Host (puerto 3000)

Hola, Ana. Este párrafo lo ha compilado el remote «saludo».
```

| Petición | Quién la sirve | Qué es |
|----------|----------------|--------|
| `/main.js` | host | El `index.js` del host: solo contiene `import('./bootstrap')` |
| `/src_bootstrap_js-…` | host | El arranque real del host (`bootstrap.js` y `App.jsx`) |
| `/mf/saludo/remoteEntry.js` | remote, a través del host | El contenedor de `saludo` |
| `/mf/saludo/src_Saludo_jsx.js` | remote, a través del host | El código de `Saludo.jsx`, compilado por el remote |
| `/mf/saludo/vendors-node_modules_react_index_js.js` | remote, a través del host | React: una sola copia, compartida |

El párrafo dice «Ana», que es la prop que le pasa el host: el componente es del remote, pero se pinta
dentro del árbol de React del host.

> [!NOTE]
> **Por qué `/mf/saludo/` y no `localhost:3001`.** En este curso el navegador solo habla con el host. El
> host pide el remote en su mismo origen, bajo `/mf/<nombre>/`, y su servidor de desarrollo lo reenvía al
> puerto del remote:
>
> ```js
> // host/webpack.config.js — devServer
> proxy: [
>   // /mf/saludo/remoteEntry.js → http://localhost:3001/remoteEntry.js
>   { context: ['/mf/saludo'], target: 'http://localhost:3001', pathRewrite: { '^/mf/saludo': '' } },
> ],
> ```
>
> En Codespaces cada puerto tiene su propio dominio, y en producción todo cuelga de uno solo: con el
> reenvío, el host funciona igual en los dos sitios. Los trozos que pide después (`src_Saludo_jsx.js`…)
> también llevan `/mf/saludo/` porque el remote usa `publicPath: 'auto'`: calcula su dirección a partir de
> la URL desde la que se descargó su `remoteEntry.js`.

### 3 — El contenedor por dentro

El `remoteEntry.js` es un fichero JavaScript normal que se puede abrir en el navegador: en la pestaña
**Puertos**, el puerto 3001 con el globo y `/remoteEntry.js` al final de la dirección (fuera de Codespaces,
`http://localhost:3001/remoteEntry.js`). El principio del fichero es el mismo que devuelve la terminal:

```bash
# Las primeras 25 líneas del contenedor del remote
curl -s http://localhost:3001/remoteEntry.js | head -25
```

**Resultado:**

```text
var saludo;
/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "webpack/container/entry/saludo"
/*!***********************!*\
  !*** container entry ***!
  \***********************/
(__unused_webpack_module, exports, __webpack_require__) {

const moduleMap = {
	"./Saludo": () => {
		return Promise.all([__webpack_require__.e("vendors-node_modules_react_jsx-dev-runtime_js"), __webpack_require__.e("webpack_sharing_consume_default_react_react-_df21"), __webpack_require__.e("src_Saludo_jsx")]).then(() => (() => ((__webpack_require__(/*! ./src/Saludo.jsx */ "./src/Saludo.jsx")))));
	}
};
const get = (module, getScope) => {
	__webpack_require__.R = getScope;
	getScope = (
		__webpack_require__.o(moduleMap, module)
			? moduleMap[module]()
			: Promise.resolve().then(() => {
				throw new Error('Module "' + module + '" does not exist in container.');
			})
	);
```

| Parte | Qué hace |
|-------|----------|
| `var saludo;` | Crea la variable global con el `name` del plugin: así el host encuentra el contenedor |
| `moduleMap` | Una entrada por cada clave de `exposes`. `"./Saludo"` no trae el código: dice qué trozos descargar (`src_Saludo_jsx`, el JSX runtime, el React compartido) |
| `get(module)` | Lo que llama el host para pedir un módulo; si no está en `moduleMap`, `Module "…" does not exist in container.` |

Por eso el `remoteEntry.js` pesa poco: es un índice. El código del componente llega después, en
`src_Saludo_jsx.js`, solo cuando alguien lo pide. Con un filtro se localiza el índice directamente:

```bash
# Dónde está el mapa de módulos expuestos dentro del contenedor
curl -s http://localhost:3001/remoteEntry.js | grep -n -A6 "const moduleMap"
```

**Resultado:**

```text
12:const moduleMap = {
13-	"./Saludo": () => {
14-		return Promise.all([__webpack_require__.e("vendors-node_modules_react_jsx-dev-runtime_js"), __webpack_require__.e("webpack_sharing_consume_default_react_react-_df21"), __webpack_require__.e("src_Saludo_jsx")]).then(() => (() => ((__webpack_require__(/*! ./src/Saludo.jsx */ "./src/Saludo.jsx")))));
15-	}
16-};
17-const get = (module, getScope) => {
18-	__webpack_require__.R = getScope;
```

### 4 — El contenedor en el navegador

Con la página del host abierta, la **Consola** permite mirar el objeto que ha dejado `remoteEntry.js`:

```js
// En la Consola del host: qué tiene el contenedor «saludo»
Object.keys(window.saludo).join(', ')
```

**Resultado:**

```text
get, init
```

Todo contenedor tiene esas dos funciones y nada más:

| Función | Quién la llama y para qué |
|---------|---------------------------|
| `init(shareScope)` | El host, una vez, para pasarle el registro de [dependencias compartidas](../glosario/02-module-federation.md#shared): así el remote usa el mismo React que el host |
| `get('./Saludo')` | El host, cada vez que necesita un módulo expuesto: devuelve una promesa con su fábrica |

El `import Saludo from 'saludo/Saludo'` del host se traduce en eso: cargar `remoteEntry.js`, `init` y
`get('./Saludo')`.

### 5 — El remote también funciona solo

El remote es una aplicación completa. Abierto en su puerto (3001), pinta su propia página:

```text
Red      200  /main.js
Red      200  /remoteEntry.js
Red      200  /vendors-node_modules_react_jsx-dev-runtime_js.js
Red      200  /vendors-node_modules_react_index_js.js
Red      200  /src_bootstrap_js-webpack_sharing_consume_default_react-dom_react-dom.js
Red      200  /vendors-node_modules_react-dom_index_js.js
Red      200  /vendors-node_modules_react-dom_client_js.js
── Texto de la página:
Remote saludo (puerto 3001)

Hola, mundo. Este párrafo lo ha compilado el remote «saludo».
```

Aquí `Saludo` no recibe la prop y usa su valor por defecto, «mundo». El equipo del remote puede
desarrollar y probar su componente sin arrancar el host.

### 6 — El arranque asíncrono

Las dos aplicaciones tienen el mismo `index.js` de una línea:

```js
// src/index.js — arranque asíncrono
// Da tiempo a Module Federation a resolver remotes y dependencias compartidas.
import('./bootstrap');
```

`main.js` no pinta nada: pide `bootstrap.js` como un trozo aparte. Mientras llega, Module Federation
descarga `remoteEntry.js` y decide qué copia de React se usa. Cuando `bootstrap.js` hace
`import { createRoot } from 'react-dom/client'`, esa decisión ya está tomada. En la pestaña **Red** se ve
el orden: `main.js`, después `src_bootstrap_js-…` y `remoteEntry.js`, y al final los trozos del remote.

Para parar las dos aplicaciones, `Ctrl+C` en la terminal donde se lanzó `npm start`.

## Qué queda visto

- Un remote publica un **contenedor**: `remoteEntry.js` crea `window.saludo` con `init` y `get`, y su
  `moduleMap` dice qué módulos expone y qué trozos hay que descargar para cada uno.
- El host pide el contenedor por la red, en su mismo origen (`/mf/saludo/`), y el componente remoto se pinta
  dentro de su árbol de React con las props que el host le pasa.
- React viaja una sola vez porque los dos lo declaran en `shared`, y el [arranque asíncrono](../glosario/02-module-federation.md#arranque-asincrono) da tiempo a
  decidirlo antes de usarlo.

El laboratorio [01 — Host y remote](01-lab-host-y-remote.md) parte de dos aplicaciones sin Module
Federation y las federa paso a paso; se puede hacer sin haber seguido esta demostración.

**La pregunta que abre el lab:** si partes de dos aplicaciones React con Webpack que no saben nada la una de
la otra, ¿qué tienes que añadir a cada una para que el host pinte un componente del remote, y qué pasa si
falta alguna de esas piezas?
