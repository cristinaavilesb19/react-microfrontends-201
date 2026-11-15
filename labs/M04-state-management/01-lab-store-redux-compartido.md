# Lab — Store Redux compartido

[← Página anterior](00-donde-vive-el-estado.md) · [Siguiente página →](02-lab-context-estado-local.md)

En este laboratorio practicas el **[store global](../glosario/03-estado-comunicacion.md#store-global) con [inyección de reducers](../glosario/03-estado-comunicacion.md#inyeccion-reducers)**: el [host](../glosario/02-module-federation.md#host) crea un único store de
Redux y una [microaplicación](../glosario/01-arquitectura.md#microaplicacion) remota le añade su propio slice al montarse, sin que el host sepa de antemano
que ese slice existe. El ejercicio es mínimo: un [remote](../glosario/02-module-federation.md#remote) `favoritos` con tres libros que se marcan con una
estrella y un host que cuenta cuántos hay marcados.

### Objetivo

Comprender qué es un store global con inyección de reducers: cómo funciona, cómo debe ser, cómo se detectan
sus debilidades y cómo se mejora.

### Punto de partida

- Carpeta: `ejercicios/M04-01-store-redux-compartido/inicio`, con dos aplicaciones:

  | Aplicación | Puerto | Qué hace |
  |------------|--------|----------|
  | `host` | 3000 | Crea el store con un slice propio (`sesion`) y pinta la cabecera y el remote |
  | `favoritos` | 3001 | Expone `./Favoritos`: la lista de libros con su slice `favoritos` |

- Estado: en `inicio/` el remote **crea su propio store**. Tú lo cambias para que use el del host.
- Arranque, desde la raíz del repositorio (ficha: [`npm start`](../comandos-lab.md#npm-start)):

  ```bash
  # Entra en el punto de partida del lab y arranca host y remote a la vez
  cd ejercicios/M04-01-store-redux-compartido/inicio
  npm start
  ```

- URL: pestaña **Puertos** de VS Code → puerto **3000** → icono del globo (**Abrir en el navegador**).
  Fuera de Codespaces, `http://localhost:3000`.
- Si quieres volver a empezar (ficha: [`reiniciar`](../comandos-lab.md#reiniciar)):

  ```bash
  # Deja inicio/ como está en el repositorio
  bash scripts/reiniciar.sh M04-01-store-redux-compartido
  ```

> [!NOTE]
> **El navegador solo habla con el host.** El host pide el remote en su mismo origen, en
> `/mf/favoritos/remoteEntry.js`, y su servidor de desarrollo lo reenvía al puerto 3001 (`devServer.proxy` en
> `host/webpack.config.js`). Así funciona igual en Codespaces, donde cada puerto es otro dominio, y en
> producción, donde todo sale por un único dominio. Por eso en la pestaña **Red** verás rutas `/mf/favoritos/…`.

> [!NOTE]
> **[Arranque asíncrono](../glosario/02-module-federation.md#arranque-asincrono).** `src/index.js` de cada aplicación solo hace `import('./bootstrap')`. Ese salto
> asíncrono da tiempo a [Module Federation](../glosario/02-module-federation.md#module-federation) a descargar el `remoteEntry.js` y a decidir qué copia de React,
> `react-redux` y `@reduxjs/toolkit` usa cada aplicación antes de que se ejecute la primera línea de la app.

### Qué está pasando

Redux guarda el estado en un objeto (el **store**) al que los componentes se conectan con un `<Provider>`. En
una sola aplicación, el store se crea una vez con todos sus reducers. Con [microfrontends](../glosario/01-arquitectura.md#microfrontend) eso no vale: el host
se despliega por su lado y no puede importar el reducer de un remote que aún no existe cuando se construye.

La salida es dar la vuelta a la dependencia. El host crea un store **ampliable** con `combineSlices` de Redux
Toolkit y ofrece una función, `store.inyectar(slice)`, como [contrato](../glosario/01-arquitectura.md#contrato). Cuando el remote se monta, toma el store
del `<Provider>` del host con `useStore()` y le inyecta su slice. Desde ese momento el estado del remote vive
en el store del host: el host puede leerlo y cualquier otra microaplicación también.

| Pieza | Qué representa |
|-------|----------------|
| `host/src/store.js` | El store global y su contrato `inyectar` |
| `favoritos/src/favoritosSlice.js` | El estado propio del remote: la lista de ids marcados |
| `favoritos/src/Favoritos.jsx` | El componente expuesto; decide de qué store lee |
| `shared` en los dos `webpack.config.js` | Que host y remote usen la misma copia de `react-redux` y `@reduxjs/toolkit` |

### 1 — Ver dos stores que no se hablan

Primero comprueba el problema: el remote marca libros, pero el host no se entera.

1. Con `npm start` en marcha, abre el puerto 3000.
2. Pulsa **☆ Rayuela** y **☆ Pedro Páramo**.
3. Abre **F12** → pestaña **Red** (Network) y recarga para ver qué se descarga.

**Resultado esperado** en el terminal (el orden de las líneas cambia en cada arranque):

```text
> concurrently -n favoritos,host "npm start --prefix favoritos" "npm start --prefix host"
[favoritos] webpack 5.112.2 compiled successfully
[favoritos] <i> [webpack-dev-server] Loopback: http://localhost:3001/, http://[::1]:3001/
[host] webpack 5.112.2 compiled successfully
[host] <i> [webpack-dev-server] Loopback: http://localhost:3000/, http://[::1]:3000/
```

En la pestaña **Red** (los nombres de los chunks dependen de la compilación):

```text
Red      200  /main.js
Red      200  /src_bootstrap_js-webpack_sharing_consume_default_react-dom_react-dom-webpack_sharing_consume_-f8f6f9.js
Red      200  /mf/favoritos/remoteEntry.js
Red      200  /vendors-node_modules_react-dom_client_js-node_modules_react_jsx-dev-runtime_js.js
Red      200  /vendors-node_modules_react-dom_index_js.js
Red      200  /vendors-node_modules_react_index_js.js
Red      200  /vendors-node_modules_react-redux_dist_react-redux_mjs.js
Red      200  /mf/favoritos/vendors-node_modules_react_jsx-dev-runtime_js.js
Red      200  /mf/favoritos/src_Favoritos_jsx.js
Red      200  /vendors-node_modules_reduxjs_toolkit_dist_redux-toolkit_modern_mjs.js
```

Y en la página, después de los dos clics:

```text
Host · slices en el store: sesion · favoritos: 0
Favoritos (remote)
★ Rayuela☆ Ficciones★ Pedro Páramo
```

**Cómo se lee:**

| Lo que ves | Qué significa |
|------------|---------------|
| `★ Rayuela … ★ Pedro Páramo` | El remote guarda bien sus favoritos… |
| `slices en el store: sesion` | …pero en el store del host solo está su slice `sesion` |
| `favoritos: 0` | El host no puede contar lo que vive en otro store |
| `react-redux` y `redux-toolkit` sin `/mf/favoritos/` | Solo se descarga una copia, la del host: las librerías ya se comparten. El problema no son las librerías, es que hay **dos stores** |

### 2 — Leer el contrato del host

Antes de tocar el remote, mira qué le ofrece el host. Abre `inicio/host/src/store.js` en el editor; no lo vas a
cambiar.

```js
import { combineSlices, configureStore, createSlice } from '@reduxjs/toolkit';

// Estado propio del host.
const sesion = createSlice({ name: 'sesion', initialState: { usuario: 'Ana' }, reducers: {} });

// combineSlices permite añadir slices después de crear el store.
export const rootReducer = combineSlices(sesion);
export const store = configureStore({ reducer: rootReducer });

// Contrato para los remotes: añadir su slice sin que el host lo conozca de antemano.
store.inyectar = (slice) => {
  rootReducer.inject(slice);
  store.dispatch({ type: 'host/sliceInyectado', payload: slice.name });
};
```

**Cómo se lee:**

- `combineSlices(sesion)` crea un reducer raíz que se puede ampliar después con `rootReducer.inject(slice)`.
  Con el `combineReducers` clásico, la lista de reducers queda fija al crear el store.
- `store.inyectar` es lo único que el remote necesita saber del host. No importa nada del host: lo encuentra
  en el store que recibe por el `<Provider>`.
- El `dispatch` de `host/sliceInyectado` hace pasar una acción por el reducer raíz para que el estado inicial
  del slice nuevo aparezca en el store en ese momento, sin esperar a la primera acción del remote.

Abre también `inicio/host/webpack.config.js` y busca `shared`. Está igual en el remote:

```js
shared: {
  react: { singleton: true },
  'react-dom': { singleton: true },
  // El Provider y los hooks del remote tienen que ser los del host
  'react-redux': { singleton: true },
  // Mismo Redux Toolkit para que inject funcione sobre el store del host
  '@reduxjs/toolkit': { singleton: true },
},
```

### 3 — Quitar el store propio del remote

Ahora cambia el remote para que deje de crear su store y use el del host. Abre
`inicio/favoritos/src/Favoritos.jsx`. Arriba del fichero, sustituye los imports y borra `storePropio`:

```jsx
import { useState } from 'react';
// Ya no hace falta Provider ni configureStore: el store lo pone el host
import { useDispatch, useSelector, useStore } from 'react-redux';
import { alternar, favoritosSlice } from './favoritosSlice';
```

Deja `Lista` como está y sustituye el componente exportado, al final del fichero:

```jsx
// Sin store propio: usa el del host (lo da su <Provider>) y le inyecta su slice una vez.
export default function Favoritos() {
  const store = useStore();                       // el store del Provider más cercano: el del host
  useState(() => store.inyectar(favoritosSlice)); // el inicializador de useState solo corre en el primer render
  return <Lista />;
}
```

**Cómo se lee:**

- `useStore()` devuelve el store del `<Provider>` que envuelve al componente. Como el host pinta
  `<Favoritos />` dentro de su `<Provider store={store}>`, ese store es el del host.
- La inyección tiene que hacerse **antes** de que `Lista` lea `state.favoritos`, y una sola vez. El
  inicializador de `useState` cumple las dos cosas: corre durante el primer render, antes que los hijos.
  Un `useEffect` llegaría tarde: corre después de pintar.

Guarda. Webpack recompila el remote solo.

### 4 — Comprobar que el host ve los favoritos

Recarga la página del puerto 3000 y fíjate en la cabecera antes de pulsar nada. Después pulsa **☆ Rayuela** y
**☆ Pedro Páramo**.

**Resultado esperado** en la página. Antes de pulsar:

```text
Host · slices en el store: sesion, favoritos · favoritos: 0
```

Después de los dos clics:

```text
Host · slices en el store: sesion, favoritos · favoritos: 2
Favoritos (remote)
★ Rayuela☆ Ficciones★ Pedro Páramo
```

**Cómo se lee:** `favoritos` ya aparece en el store del host nada más cargar, aunque el host no lo importa en
ningún sitio: lo ha inyectado el remote. El contador del host sigue a las estrellas del remote porque los dos
leen del mismo store.

> [!TIP]
> Si la cabecera sigue diciendo `slices en el store: sesion`, recarga con **Ctrl+Shift+R**: el navegador puede
> tener en caché el chunk anterior de `/mf/favoritos/`.

### 5 — Que el remote siga funcionando solo

Un remote tiene que poder abrirse sin el host, en su puerto, para desarrollarlo. Pero ahora `Favoritos` espera
un `<Provider>` con un store que tenga `inyectar`. Dale uno en su página aislada: abre
`inicio/favoritos/src/App.jsx` y sustitúyelo por:

```jsx
import { combineSlices, configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import Favoritos from './Favoritos';

// Modo aislado (http://localhost:3001): un store mínimo con el mismo contrato que el del host.
const rootReducer = combineSlices({});
const store = configureStore({ reducer: rootReducer });
store.inyectar = (slice) => rootReducer.inject(slice);

export default function App() {
  return (
    <Provider store={store}>
      <Favoritos />
    </Provider>
  );
}
```

Abre el puerto **3001** desde la pestaña **Puertos**, con **F12** → **Consola** abierta, y pulsa **☆ Rayuela**.

**Resultado esperado** en la **Consola**:

```text
Consola (aviso)  Selector unknown returned a different result when called with the same parameters. This can lead to unnecessary rerenders.
Selectors that return a new reference (such as an object or an array) should be memoized: https://redux.js.org/usage/deriving-data-selectors#optimizing-selectors-with-memoization [object Object]
```

Y en la página:

```text
Favoritos (remote)
★ Rayuela☆ Ficciones☆ Pedro Páramo
```

**Cómo se lee:** el remote funciona solo, con su store de prueba. El aviso lo vas a explicar en «Investiga»:
tiene que ver con una diferencia entre este `inyectar` y el del host.

## Comprueba tu entendimiento

**El slice aparece sin que el host lo importe**
Busca `favoritosSlice` en la carpeta `inicio/host`.
→ No aparece en ningún fichero, y aun así la cabecera dice `slices en el store: sesion, favoritos`.

**Un solo store**
En el puerto 3000, pulsa las tres estrellas y vuelve a pulsar **★ Ficciones**.
→ El contador del host pasa de 3 a 2 a la vez que la estrella del remote se apaga.

**El remote no conoce al host**
Abre `inicio/favoritos/src/Favoritos.jsx` y busca `host`.
→ Solo aparece en el comentario: el remote solo depende de que su `Provider` le dé un store con `inyectar`.

## Investiga

**¿Por qué avisa la Consola en el puerto 3001 y no en el 3000?** Compara las dos funciones `inyectar`:

```js
// host/src/store.js
store.inyectar = (slice) => {
  rootReducer.inject(slice);
  store.dispatch({ type: 'host/sliceInyectado', payload: slice.name });
};

// favoritos/src/App.jsx (modo aislado)
store.inyectar = (slice) => rootReducer.inject(slice);
```

Pistas para responder:

- El estado del store solo se recalcula cuando pasa una acción. Sin el `dispatch`, `state.favoritos` sigue sin
  existir hasta el primer clic.
- El selector de `Lista` es `(state) => state.favoritos?.ids ?? []`. Mientras `state.favoritos` no existe,
  devuelve un `[]` **nuevo** en cada llamada.
- En desarrollo, `react-redux` 9 llama dos veces al selector en el primer render y avisa si los dos resultados
  no son el mismo objeto.

Con eso puedes explicar el aviso y decidir qué cambio lo quita: añadir el `dispatch` también en el modo
aislado, o devolver siempre el mismo array vacío (`const VACIO = []` fuera del componente y `?? VACIO`).

## Experimenta

**¿Qué pasa si el remote deja de compartir `react-redux`?** Predice antes: el remote usa `useStore()`, que lee
el store del contexto de `react-redux`. Si el remote trae su propia copia de la librería, ¿encontrará el
`<Provider>` del host?

Abre `inicio/favoritos/webpack.config.js` y borra la línea de `react-redux` del bloque `shared`:

```js
shared: {
  react: { singleton: true },
  'react-dom': { singleton: true },
  // 'react-redux': { singleton: true },   ← quitada para el experimento
  '@reduxjs/toolkit': { singleton: true },
},
```

Los cambios en `webpack.config.js` no se recargan solos: para con **Ctrl+C** y vuelve a arrancar.

```bash
# Vuelve a arrancar para que Webpack lea la configuración nueva
npm start
```

Recarga el puerto 3000.

**Resultado esperado** en la página:

```text
Host · slices en el store: sesion, favoritos · favoritos: 0
Favoritos (remote)
☆ Rayuela☆ Ficciones☆ Pedro Páramo
```

En la pestaña **Red** aparecen las dos copias de la librería (recortado):

```text
Red      200  /vendors-node_modules_react-redux_dist_react-redux_mjs.js
Red      200  /mf/favoritos/vendors-node_modules_react_jsx-dev-runtime_js-node_modules_react-redux_dist_react-redux_mjs.js
Red      200  /mf/favoritos/src_Favoritos_jsx.js
```

**Cómo se lee:** sigue funcionando, y el slice `favoritos` está en el store del host. Lo esperable sería que la
copia propia del remote no encontrara el `<Provider>` del host, pero `react-redux` 9 guarda su contexto en
`globalThis` con una clave global (`Symbol.for(…)`): las dos copias de la librería se descargan, pero **las dos
usan el mismo contexto**. Que funcione es un detalle de implementación de esta versión, no algo garantizado:
pagas una copia de más de la librería y dependes de que otra versión siga haciendo lo mismo. Vuelve a poner la
línea de `react-redux` en `shared` y arranca otra vez.

## Reto

### 1 — El remote saluda al usuario del host

**La situación:** el store del host tiene un slice `sesion` con `usuario: 'Ana'`. Alguien propone que la lista
de favoritos muestre de quién son: «Favoritos de Ana». El remote no puede importar nada del host, y además
tiene que seguir abriéndose solo en el puerto 3001, donde no hay slice `sesion`.

**Qué haces:** en `inicio/favoritos/src/Favoritos.jsx`, haz que `Lista` lea el usuario del store y lo ponga en
el título `<h2>`.

**Pistas:** `useSelector`, el encadenamiento opcional `?.` y un valor por defecto con `??`.

**Lo que buscas:** en el puerto 3000, el título dice «Favoritos de Ana (remote)»; en el 3001, la página carga
sin errores en la **Consola** y el título no se rompe.

<details>
<summary>Ver solución</summary>

```jsx
function Lista() {
  const ids = useSelector((state) => state.favoritos?.ids ?? []);
  // Lee un slice que no es suyo: si no está (modo aislado), usa un texto neutro
  const usuario = useSelector((state) => state.sesion?.usuario ?? 'nadie');
  const dispatch = useDispatch();
  return (
    <section>
      <h2>Favoritos de {usuario} (remote)</h2>
      {/* … los botones, igual que antes … */}
    </section>
  );
}
```

El remote lee estado del host a través del store compartido, sin importarlo. Pero con esa línea el remote
depende de la **forma** del slice `sesion`: si el host renombra `usuario`, el remote enseña «nadie» sin que
nada falle al compilar. **La regla:** leer un slice ajeno convierte su forma en parte del contrato entre los
dos equipos; tolera que falte y documenta qué campos usas.

</details>

## Errores frecuentes

| Síntoma | Causa probable | Cómo arreglarlo |
|---------|----------------|-----------------|
| La cabecera del host dice `slices en el store: sesion` y `favoritos: 0` | El remote sigue creando su `storePropio` con su `<Provider>` | Paso 3: quita `storePropio` y usa `useStore()` |
| `TypeError: store.inyectar is not a function` en la **Consola** | El remote se pinta dentro de un `<Provider>` cuyo store no tiene `inyectar` (p. ej. el de su `App.jsx` sin el paso 5) | Añade `store.inyectar` a ese store |
| `could not find react-redux context value` en la **Consola** | `Favoritos` se pinta fuera de cualquier `<Provider>` | En el host, `<Favoritos />` dentro de `<Provider store={store}>`; en el 3001, el `App.jsx` del paso 5 |
| Cambias `shared` y no notas nada | La configuración de Webpack solo se lee al arrancar | Para con **Ctrl+C** y vuelve a arrancar (bloque de abajo) |
| `EADDRINUSE` al arrancar | Otro ejercicio ocupa los puertos | Libera los puertos (bloque de abajo) |

```bash
# Arranca de nuevo después de cambiar un webpack.config.js
npm start
```

```bash
# Libera los puertos de los ejercicios si otro sigue en marcha
fuser -k 3000/tcp 3001/tcp 3002/tcp 3003/tcp
```

## Conclusiones

### Qué es un store global con inyección de reducers

Un único store de Redux, creado por el host, al que cada microaplicación añade su slice cuando se monta. El
host no conoce los slices de los remotes: solo ofrece el contrato `inyectar`.

```text
host                                   remote favoritos
store = configureStore(combineSlices(sesion))
<Provider store={store}>  ───────────► useStore()  →  store.inyectar(favoritosSlice)
                                                         │
state: { sesion, favoritos } ◄───────────────────────────┘
```

### Cómo debe ser

| Requisito | En el lab |
|-----------|-----------|
| Un solo store, creado por el host | `host/src/store.js`; el remote ya no llama a `configureStore` |
| Reducer raíz ampliable | `combineSlices` + `rootReducer.inject(slice)` |
| Un contrato pequeño entre host y remote | `store.inyectar(slice)`, leído con `useStore()` |
| Inyección antes del primer selector y una sola vez | Inicializador de `useState` en `Favoritos` |
| Mismas librerías en las dos aplicaciones | `react-redux` y `@reduxjs/toolkit` en `shared` con `singleton: true` |
| El remote se abre solo | Store mínimo con el mismo contrato en `favoritos/src/App.jsx` |

### Dónde se rompe y cómo lo has detectado

| Fallo | Cómo lo has visto | Qué provoca |
|-------|-------------------|-------------|
| El remote crea su propio store | `favoritos: 0` con dos estrellas marcadas (paso 1) | El host no ve el estado del remote |
| Inyectar sin hacer pasar una acción | Aviso del selector en la **Consola** del 3001 (paso 5) | El slice no está en el estado hasta la primera acción |
| `react-redux` sin compartir | La página sigue funcionando (Experimenta) | Dos copias descargadas; funciona solo porque la versión 9 comparte su contexto por `globalThis` |
| Leer un slice ajeno | Reto | La forma de ese slice pasa a ser contrato entre equipos |

### Cómo se perfecciona

- Inyectar también los middlewares o listeners que necesite el remote (`createListenerMiddleware` admite
  añadirlos en caliente), no solo el reducer.
- Fijar en `shared` un `requiredVersion` para `react-redux` y `@reduxjs/toolkit`, para que una versión
  incompatible avise en vez de colarse.
- Exportar desde cada remote sus selectores, para que nadie lea su slice a mano.
- Para cargas muy grandes, retirar el slice cuando la microaplicación se desmonta, o aceptar que se queda.

### En una frase

> 🔑 El host crea un store ampliable y ofrece `inyectar`; cada remote añade su slice al montarse y así hay un
> solo estado global sin que el host importe nada de los remotes.
