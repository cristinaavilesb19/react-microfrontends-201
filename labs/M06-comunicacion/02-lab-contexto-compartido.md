# Lab — Contexto compartido

[← Página anterior](01-lab-props-entre-microaplicaciones.md) · [Siguiente página →](03-lab-bus-de-mensajes.md)

En este laboratorio practicas el **contexto de React compartido entre [microaplicaciones](../glosario/01-arquitectura.md#microaplicacion)**. El ejercicio es un
[host](../glosario/02-module-federation.md#host) con un botón **Cambiar idioma** y un [remote](../glosario/02-module-federation.md#remote) `saludo` que dice «Hola, bienvenida» o «Hello, welcome» según el
idioma que lee de un contexto. Al principio el remote no se entera del cambio; lo arreglas compartiendo el
paquete del contexto como [singleton](../glosario/02-module-federation.md#singleton).

### Objetivo

Comprender qué es un [contexto compartido](../glosario/03-estado-comunicacion.md#contexto-compartido) entre microaplicaciones: cómo funciona, cómo debe ser, cómo se detecta
que cada una está leyendo su propia copia y cómo se mejora.

### Punto de partida

- Carpeta: [`ejercicios/M06-02-contexto-compartido/inicio`](../../ejercicios/M06-02-contexto-compartido/inicio/)
  con `host` (puerto 3000), `saludo`, el remote (puerto 3001), y el paquete local `paquetes/idioma`.
- La solución terminada está en [`…/solucion`](../../ejercicios/M06-02-contexto-compartido/solucion/).
- Dependencias instaladas en la raíz del repositorio (el Codespace lo hace al crearse).
- Para empezar de cero:

```bash
# Deja inicio/ como está en el repositorio
bash scripts/reiniciar.sh M06-02-contexto-compartido
```

Ficha: [`reiniciar.sh`](../comandos-lab.md#reiniciar). El navegador solo habla con el host: el remote se pide
en `/mf/saludo/` y el servidor del host lo reenvía al puerto 3001.

### Qué está pasando

Un contexto de React sirve para datos «de ambiente» que leen muchos componentes a distintas profundidades: el
idioma, el tema, la sesión. Se crea con `createContext`, alguien arriba pone un `Provider` con el valor y
cualquiera de debajo lo lee con `useContext`, sin pasar props de mano en mano.

La clave está en que `useContext(X)` busca el `Provider` **de ese mismo objeto `X`**. Entre microaplicaciones,
host y remote se construyen por separado: si cada uno mete en su bundle su propia copia del fichero que hace
`createContext`, hay **dos objetos de contexto distintos**. El host pone el `Provider` del suyo y el remote
pregunta por el otro, que no tiene `Provider` encima, así que recibe su valor por defecto.

Para que sea uno solo, el paquete que crea el contexto tiene que compartirse en [Module Federation](../glosario/02-module-federation.md#module-federation) como
**singleton**, igual que React: una única copia en la página para todas las microaplicaciones.

| Pieza | Qué representa |
|-------|----------------|
| `paquetes/idioma` (alias `idioma-compartido`) | La librería común que define el contexto del idioma |
| `host/src/App.jsx` | Quien decide el idioma y pone el `Provider` |
| `saludo/src/Saludo.jsx` | Un remote que solo lee el idioma con `useIdioma()` |

### 1 — Arranca el punto de partida

```bash
# Entra en el inicio del laboratorio y arranca host y saludo a la vez
cd /workspaces/react-microfrontends-201/ejercicios/M06-02-contexto-compartido/inicio
npm start
```

Ficha: [`npm start`](../comandos-lab.md#npm-start).

**Resultado esperado** (el orden de las líneas puede variar):

```text
> concurrently -n saludo,host "npm start --prefix saludo" "npm start --prefix host"
[host] webpack 5.112.2 compiled successfully
[host] <i> [webpack-dev-server] Loopback: http://localhost:3000/, http://[::1]:3000/
[saludo] webpack 5.112.2 compiled successfully
[saludo] <i> [webpack-dev-server] Loopback: http://localhost:3001/, http://[::1]:3001/
```

### 2 — Lee el paquete del contexto y cómo lo encuentra cada aplicación

El paquete [`inicio/paquetes/idioma/index.js`](../../ejercicios/M06-02-contexto-compartido/inicio/paquetes/idioma/index.js)
crea el contexto y un hook para leerlo:

```js
import { createContext, useContext } from 'react';

// Contexto del idioma de la página. Valor por defecto: 'es'.
export const IdiomaContext = createContext('es');
export const useIdioma = () => useContext(IdiomaContext);
```

Su `package.json` lo llama `idioma-compartido`, versión `1.0.0`. Host y remote lo importan con ese nombre
gracias a un alias en sus `webpack.config.js`:

```js
// 'idioma-compartido' apunta a la carpeta del paquete local
resolve: { extensions: ['.js', '.jsx'], alias: { 'idioma-compartido': path.resolve(__dirname, '../paquetes/idioma') } },
```

El host pone el `Provider` y cambia el idioma con el botón
([`inicio/host/src/App.jsx`](../../ejercicios/M06-02-contexto-compartido/inicio/host/src/App.jsx)):

```jsx
import { useState } from 'react';
import { IdiomaContext } from 'idioma-compartido';
import Saludo from 'saludo/Saludo';

export default function App() {
  const [idioma, setIdioma] = useState('es');
  return (
    // Todo lo que quede debajo debería leer el idioma del host
    <IdiomaContext.Provider value={idioma}>
      <h1>Host · idioma: {idioma}</h1>
      <button onClick={() => setIdioma(idioma === 'es' ? 'en' : 'es')}>Cambiar idioma</button>
      <Saludo />
    </IdiomaContext.Provider>
  );
}
```

Y el remote lo lee ([`inicio/saludo/src/Saludo.jsx`](../../ejercicios/M06-02-contexto-compartido/inicio/saludo/src/Saludo.jsx)):

```jsx
import { useIdioma } from 'idioma-compartido';

const textos = { es: 'Hola, bienvenida', en: 'Hello, welcome' };

// El remote no recibe el idioma por props: lo lee del contexto.
export default function Saludo() {
  const idioma = useIdioma();
  return <p>Saludo (remote) [{idioma}]: {textos[idioma]}</p>;
}
```

En el `shared` de los dos `webpack.config.js` solo están `react` y `react-dom`: el paquete del idioma no se
comparte.

### 3 — Cambia el idioma y mira el remote

Abre el host (pestaña **Puertos**, puerto **3000**) con **F12** en la pestaña **Red** y pulsa **Cambiar idioma**.

**Resultado esperado** (algunos nombres de fichero llevan un fragmento que puede cambiar):

```text
Red      200  /main.js
Red      200  /src_bootstrap_js-webpack_sharing_consume_default_react-dom_react-dom-webpack_sharing_consume_-f8f6f9.js
Red      200  /mf/saludo/remoteEntry.js
Red      200  /vendors-node_modules_react-dom_client_js-node_modules_react_jsx-dev-runtime_js.js
Red      200  /mf/saludo/vendors-node_modules_react-dom_index_js.js
Red      200  /mf/saludo/vendors-node_modules_react_index_js.js
Red      200  /mf/saludo/src_Saludo_jsx.js
Red      200  /mf/saludo/vendors-node_modules_react_jsx-dev-runtime_js.js
── Clic
── Texto de la página:
Host · idioma: en
Cambiar idioma

Saludo (remote) [es]: Hola, bienvenida
```

| Qué ves | Qué significa |
|---------|---------------|
| `Host · idioma: en` | El estado del host ha cambiado y su `Provider` vale `en` |
| `Saludo (remote) [es]` | El remote no ve ese `Provider`: lee el valor por defecto de **su** contexto |
| Ningún fichero `paquetes_idioma…` en **Red** | El paquete no viaja aparte: va metido dentro del código de cada aplicación, una copia en cada una |

No hay ningún error en la **Consola**. React no puede saber que esperabas que fueran el mismo contexto.

### 4 — Comparte el paquete en el host

Declara el paquete como dependencia compartida y única. En `inicio/host/webpack.config.js`, dentro de
`ModuleFederationPlugin`, sustituye la línea de `shared`:

```js
shared: {
  react: { singleton: true },
  'react-dom': { singleton: true },
  // El paquete del contexto, compartido: host y remote usan el mismo IdiomaContext.
  'idioma-compartido': { singleton: true, version: '1.0.0', requiredVersion: '1.0.0' },
},
```

| Opción | Para qué |
|--------|----------|
| `singleton: true` | Una sola copia en la página, aunque varias aplicaciones la traigan |
| `version: '1.0.0'` | La versión que **ofrece** esta aplicación (un paquete local no la lee sola de `node_modules`) |
| `requiredVersion: '1.0.0'` | La versión que **acepta**; si no encaja, Module Federation avisa en la **Consola** |

### 5 — Compártelo también en el remote

Un paquete compartido tiene que estar declarado en las dos partes; si solo lo declara una, la otra sigue usando
su copia. Haz el mismo cambio en `inicio/saludo/webpack.config.js`:

```js
shared: {
  react: { singleton: true },
  'react-dom': { singleton: true },
  // El paquete del contexto, compartido: host y remote usan el mismo IdiomaContext.
  'idioma-compartido': { singleton: true, version: '1.0.0', requiredVersion: '1.0.0' },
},
```

### 6 — Reinicia y vuelve a cambiar el idioma

El servidor de desarrollo lee `webpack.config.js` solo al arrancar: para `npm start` con `Ctrl+C` y vuelve a
lanzarlo.

```bash
# En la misma terminal, tras Ctrl+C: vuelve a arrancar host y saludo con la nueva configuración
npm start
```

**Resultado esperado** en la terminal (el orden puede variar):

```text
> concurrently -n saludo,host "npm start --prefix saludo" "npm start --prefix host"
[host] webpack 5.112.2 compiled successfully
[host] <i> [webpack-dev-server] Loopback: http://localhost:3000/, http://[::1]:3000/
[saludo] webpack 5.112.2 compiled successfully
[saludo] <i> [webpack-dev-server] Loopback: http://localhost:3001/, http://[::1]:3001/
```

Recarga el host y pulsa **Cambiar idioma** dos veces.

**Resultado esperado** (texto tras el primer clic, y tras el segundo):

```text
Red      200  /main.js
Red      200  /src_bootstrap_js-webpack_sharing_consume_default_react-dom_react-dom-webpack_sharing_consume_-f8f6f9.js
Red      200  /mf/saludo/remoteEntry.js
Red      200  /vendors-node_modules_react-dom_client_js-node_modules_react_jsx-dev-runtime_js.js
Red      200  /mf/saludo/vendors-node_modules_react_index_js.js
Red      200  /mf/saludo/paquetes_idioma_index_js.js
Red      200  /mf/saludo/src_Saludo_jsx.js
Red      200  /mf/saludo/vendors-node_modules_react-dom_index_js.js
Red      200  /mf/saludo/vendors-node_modules_react_jsx-dev-runtime_js.js
── Clic
── Texto de la página (tras el primer clic):
Host · idioma: en
Cambiar idioma

Saludo (remote) [en]: Hello, welcome
── Clic
── Texto de la página:
Host · idioma: es
Cambiar idioma

Saludo (remote) [es]: Hola, bienvenida
```

El remote sigue al host en los dos sentidos. En **Red** aparece ahora `paquetes_idioma_index_js.js` como fichero
propio, y **una sola vez**: es la copia única del contexto que usan las dos aplicaciones.

### 7 — Abre el remote solo

Abre el puerto **3001**: el remote sin host, sin nadie que ponga un `Provider`.

**Resultado esperado:**

```text
Red      200  /main.js
Red      200  /remoteEntry.js
Red      200  /vendors-node_modules_react_jsx-dev-runtime_js.js
Red      200  /vendors-node_modules_react_index_js.js
Red      200  /paquetes_idioma_index_js.js
Red      200  /src_bootstrap_js-webpack_sharing_consume_default_react-dom_react-dom.js
Red      200  /vendors-node_modules_react-dom_index_js.js
Red      200  /vendors-node_modules_react-dom_client_js.js
── Texto de la página:
Saludo (remote) [es]: Hola, bienvenida
```

Solo, el remote lee el valor por defecto `'es'` de `createContext('es')`. Es el mismo texto que veías en el paso
3 dentro del host: allí era un fallo y aquí es lo esperado, y la pantalla no los distingue.

## Comprueba tu entendimiento

**Una sola copia del contexto**
Recarga el host con **F12** → **Red** y filtra por `idioma`.
→ Una única línea, `/mf/saludo/paquetes_idioma_index_js.js`.

**El remote sigue al host**
Pulsa **Cambiar idioma**.
→ `Host · idioma: en` y `Saludo (remote) [en]: Hello, welcome`.

**Sin host, valor por defecto**
Abre el puerto 3001.
→ `Saludo (remote) [es]: Hola, bienvenida`.

## Investiga

¿Qué copia del paquete está usando el host? Mira la lista de **Red** del paso 6: el fichero del paquete llega
por `/mf/saludo/…`, es decir, lo sirve el remote, y el host no pide el suyo. Las dos aplicaciones ofrecen la misma
versión `1.0.0`; Module Federation elige una de las copias registradas y todas usan esa. Lo que importa no es
cuál gana, sino que solo haya una.

Compáralo con la lista del paso 3: allí no había fichero del paquete porque cada aplicación lo llevaba dentro
de su propio código.

## Mejora

El fallo del paso 3 pasó desapercibido porque el contexto tiene un valor por defecto creíble (`'es'`). Haz que,
dentro del host, un contexto sin `Provider` sea un error visible. En `inicio/paquetes/idioma/index.js`:

```js
import { createContext, useContext } from 'react';

// Sin valor por defecto: si no hay Provider, useContext devuelve null
export const IdiomaContext = createContext(null);

export const useIdioma = () => {
  const idioma = useContext(IdiomaContext);
  // Un remote fuera del Provider (o con otra copia del contexto) lo dice en vez de inventarse un idioma
  if (idioma === null) throw new Error('useIdioma: no hay IdiomaContext.Provider por encima (¿paquete sin compartir?)');
  return idioma;
};
```

Con este cambio el remote abierto solo también falla, porque no tiene `Provider`: envuelve su `Saludo` en
`saludo/src/App.jsx` con su propio `IdiomaContext.Provider` (es lo que pide el reto). Después quita
`idioma-compartido` del `shared` del remote, reinicia y recarga el host.

**Resultado esperado:**

```text
Consola (error)  Uncaught useIdioma: no hay IdiomaContext.Provider por encima (¿paquete sin compartir?)
Consola (aviso)  %s
%s
 An error occurred in the <Saludo> component. Consider adding an error boundary to your tree to customize error handling behavior.
Visit https://react.dev/link/error-boundaries to learn more about error boundaries.
── Texto de la página:

```

El remote usa su propia copia del contexto, que no tiene `Provider`, y lo dice: el fallo ya no es silencioso.
Vuelve a dejar el `shared` como en el paso 5.

## Reto

### 1 — Un Provider para cuando el remote va solo

**La situación:** el equipo del remote desarrolla `saludo` en su puerto, sin host. Quieren probar el texto en
inglés sin tener que arrancar el host.

**Qué haces:** en `inicio/saludo/src/App.jsx` (el arranque del remote abierto solo, que el host no usa), envuelve
`<Saludo />` en un `IdiomaContext.Provider` con valor `'en'`.

**Pistas:** importa `IdiomaContext` desde `idioma-compartido`; el `Provider` va en el `App` del remote, no en
`Saludo.jsx`.

**Lo que buscas:** el puerto 3001 muestra `[en]: Hello, welcome` y, dentro del host (puerto 3000), el saludo
sigue obedeciendo al botón **Cambiar idioma**.

<details>
<summary>Ver solución</summary>

```jsx
import { IdiomaContext } from 'idioma-compartido';
import Saludo from './Saludo';

// Solo para el remote abierto solo: el host expone Saludo, no este App.
export default function App() {
  return (
    <IdiomaContext.Provider value="en">
      <Saludo />
    </IdiomaContext.Provider>
  );
}
```

En el 3001, `Saludo (remote) [en]: Hello, welcome`. En el host no cambia nada, porque el host importa
`saludo/Saludo` (lo que expone el remote), no su `App`. **La regla:** el componente expuesto solo lee el
contexto; quien lo monta, sea el host o el arranque propio del remote, es quien pone el `Provider`.

</details>

## Errores frecuentes

| Síntoma | Causa probable | Cómo arreglarlo |
|---------|----------------|-----------------|
| El host cambia a `en` y el remote sigue en `[es]` | El paquete del contexto no está en `shared`, o solo en una de las dos aplicaciones | Decláralo como `singleton` en host **y** remote |
| Has cambiado `shared` y no hay diferencia | El servidor de desarrollo no relee `webpack.config.js` | Para con `Ctrl+C` y vuelve a lanzar `npm start` |
| Aviso de versión del paquete compartido en la **Consola** | `version` o `requiredVersion` no coinciden entre host y remote | Pon la misma versión en las dos y en el `package.json` del paquete |
| `Module not found: Error: Can't resolve 'idioma-compartido'` | Falta el alias en `resolve.alias` de esa aplicación | Añade el alias a `../paquetes/idioma` |

```bash
# Vuelve a arrancar host y saludo tras cambiar webpack.config.js (después de Ctrl+C)
npm start
```

## Conclusiones

### Qué es un contexto compartido entre microaplicaciones

Un contexto de React cuyo objeto (`createContext`) vive en un paquete común, cargado **una sola vez** en la página.
El host pone el `Provider` y cualquier remote de debajo lo lee, sin props.

```text
sin singleton                         con singleton
host:   Provider(IdiomaContext#1)     host:   Provider(IdiomaContext)
saludo: useContext(IdiomaContext#2)   saludo: useContext(IdiomaContext)   ← el mismo
        → valor por defecto 'es'              → 'en'
```

### Cómo debe ser

| Requisito | En el lab |
|-----------|-----------|
| El contexto se crea en un paquete común | `paquetes/idioma`, importado como `idioma-compartido` |
| Se comparte como singleton en todas las aplicaciones | `shared` del host y del remote, con versión `1.0.0` |
| Solo hay una copia en la página | Una única línea `paquetes_idioma_index_js.js` en **Red** |
| El componente expuesto no pone su propio `Provider` | `Saludo.jsx` solo usa `useIdioma()` |

### Dónde se rompe y cómo lo has detectado

| Fallo | Cómo lo has visto | Qué provoca |
|-------|-------------------|-------------|
| Paquete sin compartir | `Host · idioma: en` y `Saludo (remote) [es]` | Cada aplicación lee su propio contexto |
| Valor por defecto creíble | Sin errores en la **Consola**; el mismo texto que el remote solo | El fallo pasa desapercibido |

### Cómo se perfecciona

Contextos sin valor por defecto y un hook que falla si no encuentra `Provider`, versiones del paquete
alineadas entre aplicaciones y, en un proyecto real, el paquete publicado en un registro con su versión, de modo
que `requiredVersion` detecte a quien se quede atrás.

### En una frase

> 🔑 Un contexto solo se comparte si su objeto es el mismo: el paquete que lo crea va como singleton en todas las
> microaplicaciones, o cada una escucha a un `Provider` que no existe.
