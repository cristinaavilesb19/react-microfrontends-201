# Lab — Dependencias compartidas

[← Página anterior](02-lab-remotos-dinamicos.md) · [Siguiente página →](04-lab-lazy-loading-remotos.md)

En este laboratorio practicas **`shared` y `singleton`**, la opción de [Module Federation](../glosario/02-module-federation.md#module-federation) que evita llevar
dos copias de la misma librería. El ejercicio es un `Contador` con `useState`, expuesto por un [remote](../glosario/02-module-federation.md#remote). Sin
[dependencias compartidas](../glosario/02-module-federation.md#shared), el [host](../glosario/02-module-federation.md#host) y el remote traen cada uno su React y el contador revienta; lo arreglas
compartiendo `react` y `react-dom` y después compruebas qué pasa cuando las versiones no encajan.

### Objetivo

Comprender qué son las dependencias compartidas: cómo deciden host y remote qué copia de una librería se
usa, por qué React tiene que ser una sola, cómo se detectan una copia duplicada o una versión
incompatible y cómo se controla con `singleton`, `requiredVersion` y `strictVersion`.

### Punto de partida

- Carpeta:
  [`ejercicios/M03-03-dependencias-compartidas/inicio`](../../ejercicios/M03-03-dependencias-compartidas/inicio),
  con `remote/` (puerto **3001**, expone `./Contador`) y `host/` (puerto **3000**, lo importa como
  `contador/Contador`). La solución está en [`solucion/`](../../ejercicios/M03-03-dependencias-compartidas/solucion).
- Los dos ya tienen `ModuleFederationPlugin` y [arranque asíncrono](../glosario/02-module-federation.md#arranque-asincrono) (`index.js` → `import('./bootstrap')`),
  pero **ninguno declara `shared`**.
- Navegador con **F12** → pestañas **Red** (Network) y **Consola** (Console).
- Para empezar de cero ([ficha](../comandos-lab.md#reiniciar)):

```bash
# Deja inicio/ como está en el repositorio
bash scripts/reiniciar.sh M03-03-dependencias-compartidas
```

### Qué está pasando

Cada aplicación se compila por separado, así que cada una mete en su salida las librerías que usa. Para la
mayoría de librerías, duplicarlas solo cuesta bytes. Para React, además, rompe: los hooks guardan su
estado en el React que **está pintando** el componente. Si el `Contador` llama a `useState` de su propia
copia de React, pero quien lo pinta es el `react-dom` del host con otra copia, esa copia no sabe que hay un
componente en marcha.

| En la realidad | En este laboratorio |
|----------------|---------------------|
| Librerías que tienen estado global (React, un router, un store) | `react` y `react-dom` |
| Un componente de otro equipo que usa hooks | `Contador`, con `useState` |
| Acordar una única copia y qué versiones valen | `shared` con `singleton` y `requiredVersion` |

Con `shared`, cada aplicación **ofrece** su copia en un registro común (el *share scope*) y **consume** de
ahí la que se elija. Con `singleton: true` solo puede haber una para todos.

```js
// Contador.jsx (remote) — un componente con hooks
import { useState } from 'react';

// Un componente con hooks: necesita el mismo React que lo está pintando.
export default function Contador() {
  const [n, setN] = useState(0);
  return <button onClick={() => setN(n + 1)}>Clics: {n}</button>;
}
```

### 1 — Arranca sin dependencias compartidas

Arranca las dos aplicaciones ([ficha de `npm start`](../comandos-lab.md#npm-start)).

```bash
# Arranca remote (3001) y host (3000) sin «shared»
cd /workspaces/react-microfrontends-201/ejercicios/M03-03-dependencias-compartidas/inicio
npm start
```

**Resultado esperado** (el orden de las líneas puede variar):

```text
> concurrently -n remote,host "npm start --prefix remote" "npm start --prefix host"
[host] webpack 5.112.2 compiled successfully
[host] <i> [webpack-dev-server] Loopback: http://localhost:3000/, http://[::1]:3000/
[remote] webpack 5.112.2 compiled successfully
[remote] <i> [webpack-dev-server] Loopback: http://localhost:3001/, http://[::1]:3001/
```

Las dos compilan sin quejarse: el problema no se ve hasta que se ejecuta.

### 2 — Abre el host y lee el error

Abre el host (puerto 3000, pestaña **Puertos**, icono del globo) con **F12** → **Red** y **Consola**:

**Resultado esperado:**

```text
Red      200  /main.js
Red      200  /src_bootstrap_js.js
Red      200  /mf/contador/remoteEntry.js
Red      200  /vendors-node_modules_react-dom_client_js-node_modules_react_jsx-dev-runtime_js.js
Red      200  /mf/contador/src_Contador_jsx.js
Red      200  /mf/contador/vendors-node_modules_react_jsx-dev-runtime_js.js
Consola (error)  Invalid hook call. Hooks can only be called inside of the body of a function component. This could happen for one of the following reasons:
1. You might have mismatching versions of React and the renderer (such as React DOM)
2. You might be breaking the Rules of Hooks
3. You might have more than one copy of React in the same app
See https://react.dev/link/invalid-hook-call for tips about how to debug and fix this problem.
Consola (error)  Invalid hook call. Hooks can only be called inside of the body of a function component. This could happen for one of the following reasons:
1. You might have mismatching versions of React and the renderer (such as React DOM)
2. You might be breaking the Rules of Hooks
3. You might have more than one copy of React in the same app
See https://react.dev/link/invalid-hook-call for tips about how to debug and fix this problem.
Consola (error)  Uncaught Cannot read properties of null (reading 'useState')
Consola (aviso)  %s

%s
 An error occurred in the <Contador> component. Consider adding an error boundary to your tree to customize error handling behavior.
Visit https://react.dev/link/error-boundaries to learn more about error boundaries.
── Texto de la página:

```

| Qué ves | Qué significa |
|---------|---------------|
| `/src_bootstrap_js.js`, sin `webpack_sharing_consume` en el nombre | El host no consume nada compartido: React va dentro de sus propios trozos |
| `/vendors-node_modules_react-dom_client_js-…` (host) y `/mf/contador/vendors-node_modules_react_jsx-dev-runtime_js.js` (remote) | Cada uno trae su React |
| `Invalid hook call` … `3. You might have more than one copy of React` | React enumera las causas posibles; aquí es la tercera |
| `Cannot read properties of null (reading 'useState')` | La copia de React del remote no tiene componente activo: su despachador de hooks es `null` |
| `An error occurred in the <Contador> component` y la página en blanco | Nadie captura el error: la página entera desaparece |

### 3 — Comprueba que el remote, solo, funciona

Abre el remote en su puerto (3001) y pulsa el botón una vez:

**Resultado esperado:**

```text
Red      200  /main.js
Red      200  /remoteEntry.js
Red      200  /src_bootstrap_js.js
Red      200  /vendors-node_modules_react_jsx-dev-runtime_js.js
Red      200  /vendors-node_modules_react-dom_client_js.js
── Clic
── Texto de la página:
Remote contador (puerto 3001)
Clics: 1
```

El código del `Contador` es correcto. Solo, el remote tiene una copia de React y con ella pinta y guarda el
estado. El fallo aparece al juntar dos aplicaciones: es un problema de integración, no del componente.

### 4 — Mira en el contenedor que no hay nada compartido

Abre en el navegador el puerto 3001 con `/remoteEntry.js` al final de la dirección y busca con `Ctrl+F` el
texto `webpack/sharing`: no hay ninguna coincidencia. El contenedor no ofrece ni pide nada compartido.
Desde la terminal, el mismo recuento:

```bash
# En otra terminal: cuántas líneas del contenedor mencionan dependencias compartidas
curl -s http://localhost:3001/remoteEntry.js | grep -c "webpack/sharing"
```

**Resultado esperado:**

```text
0
```

Cuando termines el lab, repite este comando: el número dejará de ser cero.

### 5 — Comparte React en el remote

En `remote/webpack.config.js`, sustituye el comentario `// Sin «shared»…` del plugin por la lista de
dependencias compartidas:

```js
// remote/webpack.config.js — en plugins
    new ModuleFederationPlugin({
      name: 'contador',
      filename: 'remoteEntry.js',
      exposes: { './Contador': './src/Contador.jsx' },
      shared: { react: { singleton: true }, 'react-dom': { singleton: true } },
    }),
```

| Opción | Qué decide |
|--------|-----------|
| `shared: { react: … }` | El remote ofrece su `react` al share scope y, al usarlo, lo pide de ahí |
| `singleton: true` | Solo puede haber una copia para todos: si hay varias, se usa una y las demás se ignoran |
| Versión requerida (implícita) | Si no se escribe `requiredVersion`, Webpack la toma del `package.json`: aquí `^19.3.1`, el de la raíz del repositorio |

### 6 — Comparte React en el host y reinicia

`shared` tiene que estar en **los dos** lados: si solo lo declara el remote, el host sigue pintando con su
copia. Sustituye el mismo comentario en `host/webpack.config.js`:

```js
// host/webpack.config.js — en plugins
    new ModuleFederationPlugin({
      name: 'host',
      remotes: { contador: 'contador@/mf/contador/remoteEntry.js' },
      shared: { react: { singleton: true }, 'react-dom': { singleton: true } },
    }),
```

Para las aplicaciones con `Ctrl+C` y vuelve a arrancarlas:

```bash
# En inicio/, después de Ctrl+C
npm start
```

**Resultado esperado** (el orden de las líneas puede variar):

```text
> concurrently -n remote,host "npm start --prefix remote" "npm start --prefix host"
[host] webpack 5.112.2 compiled successfully
[host] <i> [webpack-dev-server] Loopback: http://localhost:3000/, http://[::1]:3000/
[remote] webpack 5.112.2 compiled successfully
[remote] <i> [webpack-dev-server] Loopback: http://localhost:3001/, http://[::1]:3001/
```

Recarga el host y pulsa el botón dos veces:

```text
Red      200  /main.js
Red      200  /src_bootstrap_js-webpack_sharing_consume_default_react-dom_react-dom-webpack_sharing_consume_-f8f6f9.js
Red      200  /mf/contador/remoteEntry.js
Red      200  /mf/contador/vendors-node_modules_react_index_js.js
Red      200  /mf/contador/src_Contador_jsx.js
Red      200  /vendors-node_modules_react-dom_client_js-node_modules_react_jsx-dev-runtime_js.js
Red      200  /mf/contador/vendors-node_modules_react-dom_index_js.js
Red      200  /mf/contador/vendors-node_modules_react_jsx-dev-runtime_js.js
── Clic
── Clic
── Texto de la página:
Host (puerto 3000)
Clics: 2
```

| Qué ves | Qué significa |
|---------|---------------|
| `src_bootstrap_js-webpack_sharing_consume_default_react-dom_react-dom-…` | El arranque del host ahora consume `react` y `react-dom` del share scope |
| `react_index_js` y `react-dom_index_js` **una sola vez**, con `/mf/contador/` | Las dos versiones son iguales (19.3.1) y se ha elegido una: la del remote. El host no descarga la suya |
| `Clics: 2` y ningún error en la **Consola** | El `useState` del `Contador` y el `react-dom` del host usan el mismo React |

### 7 — Lee en la terminal qué ofrece y qué pide cada uno

En la salida de `npm start`, entre la lista de módulos que compila cada aplicación, aparecen las líneas de
dependencias compartidas.

**Resultado esperado** (recortado):

```text
[host]   consume shared module (default) react@^19.3.1 (singleton) (fallback: ../../../.....(truncated) 42 bytes [built] [code generated]
[host]   consume shared module (default) react-dom@* (singleton) (fallback: ../../../../n...(truncated) 42 bytes [built] [code generated]
[host]   consume shared module (default) react@* (singleton) (fallback: ../../../../node_...(truncated) 42 bytes [built] [code generated]
[host]   provide shared module (default) react-dom@19.3.1 = ../../../../node_modules/reac...(truncated) 42 bytes [built] [code generated]
[host]   provide shared module (default) react@19.3.1 = ../../../../node_modules/...(truncated) 42 bytes [built] [code generated]
[remote]     consume shared module (default) react@^19.3.1 (singleton) (fallback: ../../../.....(truncated) 42 bytes [built] [code generated]
[remote]     consume shared module (default) react-dom@* (singleton) (fallback: ../../../../n...(truncated) 42 bytes [built] [code generated]
[remote]     consume shared module (default) react@* (singleton) (fallback: ../../../../node_...(truncated) 42 bytes [built] [code generated]
```

| Parte | Qué significa |
|-------|---------------|
| `provide shared module … react@19.3.1` | La aplicación ofrece su copia al share scope, con su versión exacta |
| `consume shared module … react@^19.3.1` | La aplicación pide `react` y acepta cualquier versión del rango `^19.3.1` |
| `react@*` | Peticiones de `react` desde dentro de otras librerías (`react-dom`), que aceptan cualquiera |
| `(default)` | El nombre del share scope: el mismo que usa `__webpack_share_scopes__.default` |
| `(fallback: …)` | La copia propia que se usará si nadie ofrece una válida |

Repite ahora el recuento del paso 4: ya no sale `0`.

## Comprueba tu entendimiento

**Una sola copia de React**
En la pestaña **Red** del host, escribe `react_index` en el filtro.
→ Aparece una sola petición, `/mf/contador/vendors-node_modules_react_index_js.js`. Antes del arreglo cada
aplicación llevaba la suya dentro de otros trozos.

**El arranque ya espera a React**
Compara el nombre del trozo de arranque del host en la pestaña **Red** antes (paso 2) y después (paso 6).
→ Pasa de `/src_bootstrap_js.js` a `/src_bootstrap_js-webpack_sharing_consume_default_react-dom_…`: el
arranque asíncrono ahora espera a que el share scope decida qué `react` y qué `react-dom` se usan.

**El remote solo sigue funcionando**
Abre otra vez el remote en el puerto 3001 y pulsa el botón.
→ `Clics: 1`. Solo, el remote es el único que ofrece React y usa el suyo: `shared` no le obliga a tener un
host.

## Experimenta

### Una versión que no encaja

**Predice antes:** si el remote exige React 18 y en la página solo hay React 19, ¿falla el contador, o
funciona con un aviso?

En `remote/webpack.config.js`, fija el rango de versión que acepta el remote:

```js
// remote/webpack.config.js — en plugins: el remote dice que solo acepta React 18
      shared: { react: { singleton: true, requiredVersion: '^18.0.0' }, 'react-dom': { singleton: true } },
```

Reinicia con `Ctrl+C` y `npm start`, y recarga el host.

**Resultado esperado:**

```text
Red      200  /main.js
Red      200  /src_bootstrap_js-webpack_sharing_consume_default_react-dom_react-dom-webpack_sharing_consume_-f8f6f9.js
Red      200  /mf/contador/remoteEntry.js
Consola (aviso)  Unsatisfied version 19.3.1 from m03-03-remote of shared singleton module react (required ^18.0.0)
Red      200  /mf/contador/vendors-node_modules_react_index_js.js
Red      200  /vendors-node_modules_react-dom_client_js-node_modules_react_jsx-dev-runtime_js.js
Red      200  /mf/contador/src_Contador_jsx.js
Red      200  /mf/contador/vendors-node_modules_react_jsx-dev-runtime_js.js
Red      200  /mf/contador/vendors-node_modules_react-dom_index_js.js
── Texto de la página:
Host (puerto 3000)
Clics: 0
```

**Cómo se lee:** con `singleton` solo puede haber una copia, así que Webpack usa la 19.3.1 aunque el remote
pida `^18.0.0`, y lo avisa en la **Consola** (`Unsatisfied version …`; `m03-03-remote` es el `name` del
`package.json` de quien la ofrece). La página funciona: el aviso es fácil de pasar por alto y el remote
corre con una versión que no ha probado.

### El mismo desajuste, con `strictVersion`

**Predice antes:** si además el remote dice que la versión es estricta, ¿el aviso se convierte en error?

```js
// remote/webpack.config.js — en plugins: versión estricta
      shared: { react: { singleton: true, requiredVersion: '^18.0.0', strictVersion: true }, 'react-dom': { singleton: true } },
```

Reinicia y recarga el host.

**Resultado esperado:**

```text
Red      200  /main.js
Red      200  /src_bootstrap_js-webpack_sharing_consume_default_react-dom_react-dom-webpack_sharing_consume_-f8f6f9.js
Red      200  /mf/contador/remoteEntry.js
Red      200  /mf/contador/vendors-node_modules_react_index_js.js
Red      200  /vendors-node_modules_react-dom_client_js-node_modules_react_jsx-dev-runtime_js.js
Red      200  /mf/contador/src_Contador_jsx.js
Red      200  /mf/contador/vendors-node_modules_react_jsx-dev-runtime_js.js
Red      200  /mf/contador/vendors-node_modules_react-dom_index_js.js
Consola (error)  Uncaught Unsatisfied version 19.3.1 from m03-03-remote of shared singleton module react (required ^18.0.0)
── Texto de la página:

```

**Cómo se lee:** el mismo mensaje pasa de aviso (`Consola (aviso)`) a error sin capturar (`Consola (error)  Uncaught …`) y la página queda en blanco. El
remote prefiere no ejecutarse antes que hacerlo con una versión fuera de su rango.

| Configuración del remote | Qué pasa con React 19.3.1 en la página |
|--------------------------|----------------------------------------|
| `singleton: true` | Funciona, sin avisos |
| `singleton: true, requiredVersion: '^18.0.0'` | Funciona, con aviso `Unsatisfied version` |
| `… , strictVersion: true` | Error y página en blanco |

Deja `remote/webpack.config.js` como en el paso 5 y reinicia.

## Reto

### 1 — Exigir la versión correcta sin romper nada

**La situación:** después del experimento, un compañero propone dejar `strictVersion: true` en el remote
para que nunca se ejecute con un React que no ha probado. Otro teme que eso vuelva a dejar la página en
blanco.

**Qué haces:** en `remote/webpack.config.js`, declara para `react` un `requiredVersion` que cubra la
versión que hay en la página y añade `strictVersion: true`. Reinicia con `npm start` y recarga el host.

**Pistas:** la versión que se ofrece aparece en las líneas `provide shared module` de la terminal (paso 7).
Un rango `^19.0.0` acepta cualquier 19.x.

**Lo que buscas:** el contador funciona (`Clics:` sube al pulsar), la **Consola** no muestra ningún
`Unsatisfied version` y en la terminal la línea `consume shared module` del remote muestra tu rango.

<details>
<summary>Ver solución</summary>

```js
// remote/webpack.config.js — en plugins: acepta cualquier React 19 y se niega a cualquier otro
      shared: {
        react: { singleton: true, requiredVersion: '^19.0.0', strictVersion: true },
        'react-dom': { singleton: true },
      },
```

Con React 19.3.1 en la página el rango se cumple: no hay aviso ni error y el contador funciona. Si algún
día el host sube a React 20, el remote fallará en lugar de ejecutarse a ciegas, y el mensaje dirá
exactamente qué versión hay y cuál pedía.

**La regla:** `singleton` garantiza una sola copia; `requiredVersion` dice cuáles valen; `strictVersion`
decide si una versión fuera de rango es un aviso o un error. Escríbelos explícitos para las librerías con
estado global.

</details>

## Errores frecuentes

| Síntoma | Causa probable | Cómo arreglarlo |
|---------|----------------|-----------------|
| `Invalid hook call` y `Cannot read properties of null (reading 'useState')` | Dos copias de React: falta `shared` en el host, en el remote o en los dos | Declara `react` y `react-dom` con `singleton: true` en los dos y reinicia |
| Has añadido `shared` y el error sigue | El servidor no relee `webpack.config.js` en caliente | `Ctrl+C` y `npm start` |
| `Unsatisfied version … (required …)` como aviso | El `requiredVersion` de alguien no cubre la versión elegida | Ajusta el rango a la versión real (líneas `provide shared module` de la terminal) |
| `Unsatisfied version …` como error y página en blanco | Lo mismo, con `strictVersion: true` | Ajusta el rango o alinea la versión de React de las dos aplicaciones |
| `Shared module is not available for eager consumption` | Falta el arranque asíncrono en una de las aplicaciones | Deja en `src/index.js` solo `import('./bootstrap')` |

## Conclusiones

### Qué son las dependencias compartidas

Un registro común, el share scope, donde cada aplicación ofrece sus librerías y del que todas consumen. Al
arrancar se decide qué copia de cada una se usa; con `singleton`, una sola para toda la página.

```text
host     ── provide react@19.3.1 ──┐                         ┌── consume react@^19.3.1 ── host
                                   ├─► share scope «default» ┤
contador ── provide react@19.3.1 ──┘     (se elige una)      └── consume react@^19.3.1 ── contador
```

### Cómo debe ser

| Requisito | En el lab |
|-----------|-----------|
| Las librerías con estado global, compartidas en todos los lados | `react` y `react-dom` en host y remote |
| Una sola copia | `singleton: true` |
| El rango de versiones aceptado, explícito | `requiredVersion` (si no, se toma del `package.json`: `^19.3.1`) |
| Arranque asíncrono para decidir antes de usar | `index.js` → `import('./bootstrap')` |

### Dónde se rompe y cómo lo has detectado

| Fallo | Cómo lo has visto | Qué provoca |
|-------|-------------------|-------------|
| Sin `shared` | `Invalid hook call`, `reading 'useState'`; `grep -c "webpack/sharing"` da `0` | Página en blanco |
| Versión fuera de rango | `Consola (aviso)  Unsatisfied version 19.3.1 … (required ^18.0.0)` | El remote corre con una versión no probada |
| Versión fuera de rango y `strictVersion` | El mismo mensaje como error sin capturar | Página en blanco |

### Cómo se perfecciona

- Rangos explícitos (`requiredVersion`) para cada librería compartida, revisados cuando un equipo sube de
  versión mayor.
- `strictVersion` solo donde un desajuste es peor que no pintar; en el resto, el aviso y una barrera de
  errores alrededor del remote.
- Compartir lo que tiene estado global (React, router, store) y no todo: compartir de más acopla las
  versiones de todos los equipos.
- Repetir el recuento de `webpack/sharing` o leer las líneas `provide`/`consume` como comprobación en CI.

### En una frase

> 🔑 Cada aplicación compila su propio React; `shared` con `singleton` hace que se use solo uno, y `requiredVersion` con `strictVersion` decide qué pasa cuando las versiones no encajan.
