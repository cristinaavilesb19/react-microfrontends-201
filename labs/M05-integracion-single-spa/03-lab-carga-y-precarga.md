# Lab — Carga y precarga

[← Página anterior](02-lab-ciclo-de-vida.md) · [Siguiente página →](../M06-comunicacion/README.md)

En este laboratorio practicas la **carga bajo demanda y la [precarga](../glosario/04-integracion-despliegue.md#precarga)** de [microaplicaciones](../glosario/01-arquitectura.md#microaplicacion) en [single-spa](../glosario/04-integracion-despliegue.md#single-spa). El
ejercicio tiene dos aplicaciones, `catalogo` en `/catalogo` y `carrito` en `/carrito`, y un [root-config](../glosario/04-integracion-despliegue.md#root-config) que las
importa de forma estática. Mides en la pestaña **Red** qué se descarga en cada ruta, cambias los imports por
funciones de carga y, al final, precargas el carrito cuando el navegador está libre.

### Objetivo

Comprender la carga bajo demanda en single-spa: cómo funciona la función de carga de `registerApplication`,
cómo debe escribirse para no descargar de más, cómo se detecta en la pestaña **Red** lo que se descarga y cómo
se mejora la navegación con una precarga.

### Punto de partida

- Carpeta: `ejercicios/M05-03-carga-y-precarga/inicio` (la terminada está en `…/solucion`).
- Arranque: `npm start` en esa carpeta (paso 1) levanta `catalogo` (3001), `carrito` (3002) y el root-config (3000).
- URL: puerto **3000**, desde la pestaña **Puertos** de VS Code (icono del globo, «Abrir en el navegador»);
  fuera de Codespaces, `http://localhost:3000`.
- Herramientas: **F12** → pestaña **Red** (Network), con la casilla **Inhabilitar caché** (Disable cache)
  marcada para que cada recarga vuelva a pedirlo todo, y **Consola** (Console).
- Al abrir se ve solo la barra «Inicio · Catálogo · Carrito».

Si ya has tocado la carpeta y quieres volver a empezar:

```bash
# Deja inicio/ como está en el repositorio (ficha: ../comandos-lab.md#reiniciar)
cd /workspaces/react-microfrontends-201
bash scripts/reiniciar.sh M05-03-carga-y-precarga
```

### Qué está pasando

En un proyecto real, el root-config puede llegar a registrar decenas de microaplicaciones, y un usuario solo
visita unas pocas. Si todas se descargan al abrir la página, la primera carga paga el código de todas. La
función `app` de `registerApplication` existe para evitarlo: single-spa solo la llama la primera vez que la
aplicación debe estar activa. La precarga es llamar a esa misma función antes de tiempo, cuando se puede
adivinar la siguiente ruta y el navegador no tiene nada mejor que hacer.

El root-config del punto de partida (`root-config/src/root-config.js`) importa las dos aplicaciones arriba del
fichero:

```js
import { registerApplication, start } from 'single-spa';
// Imports estáticos: el código de las dos microaplicaciones se descarga al abrir la página.
import * as catalogo from 'catalogo/spa';
import * as carrito from 'carrito/spa';

registerApplication({ name: 'catalogo', app: async () => catalogo, activeWhen: '/catalogo' });
registerApplication({ name: 'carrito', app: async () => carrito, activeWhen: '/carrito' });

start();
```

La función `app` existe, pero no carga nada: devuelve un módulo que ya se descargó para poder ejecutar el
`import` de arriba.

> [!NOTE]
> **El navegador solo habla con el root-config.** Los [remotes](../glosario/02-module-federation.md#remote) se piden bajo `/mf/<nombre>/` en el puerto 3000 y
> el servidor del root-config los reenvía al puerto de cada aplicación (`devServer.proxy` en
> `root-config/webpack.config.js`). Por eso todas las peticiones de la pestaña **Red** van al mismo origen.

Qué es cada fichero que vas a ver en la pestaña **Red**:

| Petición | Qué es |
|----------|--------|
| `/main.js`, `/src_root-config_js.js` | El root-config (`index.js` y el `root-config.js` que carga de forma asíncrona) |
| `/vendors-…single-spa…js` | single-spa |
| `/mf/<app>/remoteEntry.js` | El índice de una aplicación: qué expone y qué comparte |
| `/mf/<app>/vendors-node_modules_react_index_js.js`, `…react-dom_index_js.js` | React y react-dom, compartidos: se descargan una vez, desde una de las aplicaciones |
| `/mf/<app>/src_spa_js.js` (y su `…react-dom_client…`) | El código propio de la aplicación: su `spa.js` y su `App` |

### 1 — Medir el punto de partida

Arranca las tres aplicaciones y mira qué se descarga al abrir la página y al navegar.

```bash
# Arranca catalogo, carrito y root-config a la vez (ficha: ../comandos-lab.md#npm-start)
cd /workspaces/react-microfrontends-201/ejercicios/M05-03-carga-y-precarga/inicio
npm start
```

**Resultado esperado** (el orden de las líneas puede cambiar):

```text
> concurrently -n catalogo,carrito,root-config "npm start --prefix catalogo" "npm start --prefix carrito" "npm start --prefix root-config"
[root-config] webpack 5.112.2 compiled successfully
[root-config] <i> [webpack-dev-server] Loopback: http://localhost:3000/, http://[::1]:3000/
[carrito] webpack 5.112.2 compiled successfully
[carrito] <i> [webpack-dev-server] Loopback: http://localhost:3002/, http://[::1]:3002/
[catalogo] webpack 5.112.2 compiled successfully
[catalogo] <i> [webpack-dev-server] Loopback: http://localhost:3001/, http://[::1]:3001/
```

Abre el puerto 3000 con la pestaña **Red** a la vista. Pulsa **Catálogo** y después **Carrito**.

**Resultado esperado** (las peticiones pueden llegar en otro orden):

```text
Red      200  /main.js
Red      200  /src_root-config_js.js
Red      200  /mf/catalogo/remoteEntry.js
Red      200  /mf/carrito/remoteEntry.js
Red      200  /vendors-node_modules_single-spa_lib_es2015_esm_single-spa_dev_js.js
Red      200  /mf/catalogo/vendors-node_modules_react_index_js.js
Red      200  /mf/catalogo/src_spa_js.js
Red      200  /mf/catalogo/vendors-node_modules_react-dom_index_js.js
Red      200  /mf/carrito/src_spa_js.js
Red      200  /mf/catalogo/vendors-node_modules_react-dom_client_js-node_modules_react_jsx-dev-runtime_js.js
Red      200  /mf/carrito/vendors-node_modules_react-dom_client_js-node_modules_react_jsx-dev-runtime_js.js
── Clic
── Clic
── Texto de la página:
Inicio · Catálogo · Carrito
Carrito

El carrito está vacío.
```

**Cómo se lee:** en `/` no hay ninguna aplicación activa y aun así se han descargado las dos (`src_spa_js.js`
de `catalogo` y de `carrito`) y React. Al pulsar **Catálogo** y **Carrito** no se pide nada: ya estaba todo.
Es el comportamiento de un [monolito](../glosario/01-arquitectura.md#monolito): la primera carga paga todas las rutas.

### 2 — Cargar cada aplicación cuando hace falta

Quita los dos imports estáticos y haz que la función de carga sea un `import()`: así la descarga ocurre cuando
single-spa llama a la función, es decir, la primera vez que la ruta activa la aplicación. Sustituye en
`root-config/src/root-config.js` todo lo que hay entre la primera línea y `start();` por esto:

```js
// Función de carga: single-spa la llama la primera vez que la aplicación debe estar activa.
const cargarCatalogo = () => import('catalogo/spa');
const cargarCarrito = () => import('carrito/spa');

registerApplication({ name: 'catalogo', app: cargarCatalogo, activeWhen: '/catalogo' });
registerApplication({ name: 'carrito', app: cargarCarrito, activeWhen: '/carrito' });
```

Las funciones tienen nombre porque en el paso 3 vas a llamar a una de ellas desde otro sitio.

Guarda, vuelve a `/`, recarga y repite: **Catálogo** y después **Carrito**.

**Resultado esperado** (las peticiones pueden llegar en otro orden):

```text
Red      200  /main.js
Red      200  /src_root-config_js.js
Red      200  /mf/carrito/remoteEntry.js
Red      200  /mf/catalogo/remoteEntry.js
Red      200  /vendors-node_modules_single-spa_lib_es2015_esm_single-spa_dev_js.js
── Clic
Red      200  /mf/catalogo/vendors-node_modules_react-dom_index_js.js
Red      200  /mf/catalogo/vendors-node_modules_react_index_js.js
Red      200  /mf/catalogo/src_spa_js.js
Red      200  /mf/catalogo/vendors-node_modules_react-dom_client_js-node_modules_react_jsx-dev-runtime_js.js
── Clic
Red      200  /mf/carrito/src_spa_js.js
Red      200  /mf/carrito/vendors-node_modules_react-dom_client_js-node_modules_react_jsx-dev-runtime_js.js
── Texto de la página:
Inicio · Catálogo · Carrito
Carrito

El carrito está vacío.
```

**Cómo se lee:**

| Momento | Qué llega | Por qué |
|---------|-----------|---------|
| Abrir `/` | Root-config, single-spa y los dos `remoteEntry.js` | Los `remoteEntry.js` se piden al arrancar porque [Module Federation](../glosario/02-module-federation.md#module-federation) necesita leer qué comparte cada remote (el *share scope*) antes de ejecutar nada. Son índices pequeños, no el código de la aplicación |
| **Catálogo** | React, react-dom y el `spa.js` de `catalogo` | single-spa llama a `cargarCatalogo` por primera vez; React viene con la primera aplicación que lo necesita |
| **Carrito** | Solo el `spa.js` de `carrito` y su parte de react-dom | React ya estaba; el carrito solo trae lo suyo |

La primera carga ya no paga las aplicaciones que no se visitan. El precio aparece al navegar: el primer clic en
**Carrito** tiene que esperar a su descarga.

### 3 — Precargar el carrito cuando el navegador está libre

Si es probable que el usuario vaya al carrito, se puede descargar antes de que lo pida, sin competir con la
carga de la página. `requestIdleCallback` ejecuta una función cuando el navegador no tiene trabajo pendiente;
dentro se llama a la misma `cargarCarrito` que usa single-spa. Añade esto al final de
`root-config/src/root-config.js`, después de `start();`:

```js
// Precarga: cuando el navegador queda libre, descarga el carrito (es el siguiente paso probable).
// La descarga se reutiliza: al entrar en /carrito ya no se pide otra vez.
requestIdleCallback(() => {
  console.log('[root] precargando carrito');
  cargarCarrito();
});
```

Guarda, vuelve a `/`, recarga con **Red** y **Consola** a la vista y espera un momento antes de navegar. Pulsa
**Catálogo** y después **Carrito**.

**Resultado esperado** (las peticiones pueden llegar en otro orden):

```text
Red      200  /main.js
Red      200  /src_root-config_js.js
Red      200  /mf/catalogo/remoteEntry.js
Red      200  /mf/carrito/remoteEntry.js
Red      200  /vendors-node_modules_single-spa_lib_es2015_esm_single-spa_dev_js.js
Consola  [root] precargando carrito
Red      200  /mf/catalogo/vendors-node_modules_react-dom_index_js.js
Red      200  /mf/catalogo/vendors-node_modules_react_index_js.js
Red      200  /mf/carrito/src_spa_js.js
Red      200  /mf/carrito/vendors-node_modules_react-dom_client_js-node_modules_react_jsx-dev-runtime_js.js
── Clic
Red      200  /mf/catalogo/src_spa_js.js
Red      200  /mf/catalogo/vendors-node_modules_react-dom_client_js-node_modules_react_jsx-dev-runtime_js.js
── Clic
── Texto de la página:
Inicio · Catálogo · Carrito
Carrito

El carrito está vacío.
```

**Cómo se lee:** después de la carga de la página, la **Consola** muestra `[root] precargando carrito` y llegan
React y el código del carrito, sin que se haya pulsado nada. El catálogo sigue cargándose al pulsarlo. Al pulsar
**Carrito** no se pide nada: `import('carrito/spa')` ya se resolvió una vez y Webpack devuelve el mismo módulo,
así que la función de carga que llama single-spa termina al instante. La precarga no ha montado el carrito (no
hay `mount` hasta entrar en `/carrito`): solo ha adelantado la descarga.

## Comprueba tu entendimiento

**Nada se descarga dos veces**
Con la precarga puesta, pulsa **Carrito**, **Inicio** y **Carrito** varias veces.
→ En la pestaña **Red** no aparece ninguna petición nueva de `/mf/carrito/` después de la precarga.

**La precarga no monta**
Recarga en `/` y espera a ver `[root] precargando carrito` en la **Consola**.
→ La página sigue mostrando solo la barra: el carrito está descargado pero no montado.

**El catálogo sigue bajo demanda**
Recarga en `/` y no pulses nada.
→ En la pestaña **Red** no aparece ningún `/mf/catalogo/src_spa_js.js`; solo su `remoteEntry.js`.

## Investiga

**¿Por qué se piden los dos `remoteEntry.js` si ninguna aplicación está activa?** Mira primero la fuente: abre
`/mf/carrito/remoteEntry.js` en el puerto 3000 y busca `shared` o `react` con **Ctrl+F**. Ese fichero declara
qué módulos expone el carrito (`./spa`) y qué versiones de React, react-dom y single-spa ofrece al reparto.

Después, en la pestaña **Red**, pulsa sobre la petición de `remoteEntry.js` y mira la columna o la pestaña
**Iniciador** (Initiator): no la pide single-spa, sino el código de Webpack que inicializa las dependencias
compartidas. Por eso la función de carga ahorra el código de cada aplicación, pero no su índice.

**¿Quién sirve React?** En los pasos 2 y 3 React llega desde `/mf/catalogo/`, aunque en el paso 3 lo pide la
precarga del carrito. Las dos aplicaciones ofrecen la misma versión y Module Federation elige una sola copia
para todas; de cuál se sirva no depende de qué aplicación la pida primero.

## Mejora

`requestIdleCallback` no está disponible en todos los navegadores. Si no está, la precarga lanzaría
un `TypeError` al arrancar el root-config. Sustituye la llamada del paso 3 por una versión con alternativa:

```js
// Si el navegador no tiene requestIdleCallback, se usa un setTimeout como alternativa.
const cuandoEsteLibre = window.requestIdleCallback ?? ((fn) => setTimeout(fn, 1));

cuandoEsteLibre(() => {
  console.log('[root] precargando carrito');
  cargarCarrito();
});
```

Guarda y recarga: en Chrome el resultado tiene que ser el mismo que en el paso 3 (la línea
`[root] precargando carrito` y las peticiones de `/mf/carrito/` antes de navegar).

## Reto

### 1 — Precargar cuando el usuario apunta al enlace

**La situación:** precargar siempre el carrito descarga código que muchos usuarios no usarán. Alguien propone
descargarlo solo cuando el ratón pase por encima del enlace **Carrito**, que es una señal clara de que va a
pulsarlo.

**Qué haces:** en `root-config/src/root-config.js`, sustituye la precarga en reposo por un manejador que llame
a `cargarCarrito` la primera vez que el ratón entra en el enlace `a[href="/carrito"]` del `index.html`.

**Pistas:** `document.querySelector`, el evento `mouseenter` y la opción `{ once: true }` de `addEventListener`.

**Lo que buscas:** en la pestaña **Red**, `/mf/carrito/src_spa_js.js` aparece al pasar el ratón por **Carrito**,
antes de pulsar; al pulsar, no se pide nada nuevo.

<details>
<summary>Ver solución</summary>

```js
// Precarga por intención: la primera vez que el ratón entra en el enlace, se descarga el carrito.
document.querySelector('a[href="/carrito"]').addEventListener('mouseenter', () => {
  console.log('[root] precargando carrito');
  cargarCarrito();
}, { once: true });
```

El enlace está en el `index.html` del root-config, así que existe ya cuando se ejecuta `root-config.js`. Entre
que el ratón entra y el clic suele haber tiempo para la descarga; si no lo hay, single-spa espera a la misma
promesa y no se descarga dos veces. **La regla:** la precarga es llamar antes a la misma función de carga; lo
que cambia entre estrategias es la señal que decide cuándo (reposo, intención, ruta siguiente probable).

</details>

## Errores frecuentes

| Síntoma | Causa probable | Cómo arreglarlo |
|---------|----------------|-----------------|
| Todo se descarga al abrir `/` aunque hay funciones de carga | Sigue quedando un `import … from 'catalogo/spa'` estático arriba del fichero | Borra los imports estáticos; solo debe quedar el `import()` dentro de la función |
| Al pulsar **Carrito** se vuelve a descargar después de precargar | La precarga y el registro usan imports distintos (otra ruta de módulo) | Usa la misma función `cargarCarrito` en los dos sitios |
| `TypeError: requestIdleCallback is not defined` | El navegador no lo implementa | Usa la alternativa con `setTimeout` de «Mejora» |
| La pestaña **Red** no muestra peticiones nuevas al recargar | La caché del navegador sirve los ficheros | Marca **Inhabilitar caché** (Disable cache) en la pestaña **Red** |
| `504` en `/mf/<app>/remoteEntry.js` | El servidor de esa aplicación no está en marcha | Arranca todo desde la carpeta del ejercicio (bloque de abajo) |

```bash
# Arranca las tres aplicaciones del ejercicio (ficha: ../comandos-lab.md#npm-start)
cd /workspaces/react-microfrontends-201/ejercicios/M05-03-carga-y-precarga/inicio
npm start
```

## Conclusiones

### Qué es la carga bajo demanda y la precarga

La carga bajo demanda es dejar que single-spa llame a la función `app` cuando la aplicación tiene que estar
activa, y que esa función sea la que descarga el código (`() => import('carrito/spa')`). La precarga es llamar
a esa misma función antes, ante una señal, para que la navegación no espere.

```text
                ┌── imports estáticos ──▶ todo al abrir la página
registerApplication
                ├── () => import()     ──▶ cada aplicación al entrar en su ruta
                └── + precarga          ──▶ la siguiente probable, cuando el navegador está libre
```

### Cómo debe ser

| Requisito | En el lab |
|-----------|-----------|
| Sin imports estáticos de aplicaciones en el root-config | Paso 2: en `/` solo llegan root-config, single-spa y los `remoteEntry.js` |
| La función de carga es un `import()` con nombre, reutilizable | `cargarCatalogo`, `cargarCarrito` |
| La precarga usa la misma función que el registro | Paso 3: al pulsar **Carrito**, ninguna petición |
| La precarga no compite con la carga inicial | `requestIdleCallback`, con alternativa si no existe |

### Dónde se rompe y cómo lo has detectado

| Fallo | Cómo lo has visto | Qué provoca |
|-------|-------------------|-------------|
| Imports estáticos | Paso 1: los dos `src_spa_js.js` al abrir `/` | La primera carga paga todas las rutas |
| Solo carga bajo demanda | Paso 2: el primer clic en **Carrito** espera a su descarga | Navegación más lenta la primera vez |
| `remoteEntry.js` de todas las aplicaciones al arrancar | Pasos 2 y 3, columna **Iniciador** | Con muchas aplicaciones, muchas peticiones pequeñas al inicio |

### Cómo se perfecciona

- Elegir qué precargar con datos reales de navegación (qué ruta sigue a cuál), no a ojo.
- Respetar el ahorro de datos del usuario (`navigator.connection.saveData`) antes de precargar.
- Con muchas aplicaciones, cargar los remotes de forma dinámica (como en M03) para no pedir todos los
  `remoteEntry.js` al arrancar; en la variante canónica de single-spa, el import map cumple ese papel.
- Medir el efecto con la pestaña **Rendimiento** (Performance) o Lighthouse, no solo contando peticiones.

### En una frase

> 🔑 single-spa descarga una aplicación cuando llama a su función de carga: escríbela como un `import()` para
> que sea al entrar en su ruta, y llámala tú antes cuando sepas adónde irá el usuario.
