# Lab — Último valor retenido

[← Página anterior](03-lab-bus-de-mensajes.md) · [Siguiente página →](../M07-despliegue-escalabilidad/README.md)

En este laboratorio practicas el **[último valor retenido](../glosario/03-estado-comunicacion.md#ultimo-valor)** en un [bus de mensajes](../glosario/03-estado-comunicacion.md#bus-de-mensajes). El ejercicio es un `buscador`
que publica la búsqueda y un [remote](../glosario/02-module-federation.md#remote) `resultados` que el [host](../glosario/02-module-federation.md#host) solo carga al pulsar **Ver resultados**. Si buscas
antes de abrirlo, el listado llega tarde y se pierde el mensaje; lo resuelves haciendo que el bus recuerde el
último valor de cada mensaje y se lo entregue a quien se suscribe después.

### Objetivo

Comprender qué es el último valor retenido en un bus de mensajes: cómo funciona, cómo debe ser, cómo se detecta
que un suscriptor tardío se ha quedado sin el mensaje y cómo se mejora.

### Punto de partida

- Carpeta: [`ejercicios/M06-04-ultimo-valor-retenido/inicio`](../../ejercicios/M06-04-ultimo-valor-retenido/inicio/)
  con `host` (puerto 3000), `buscador` (3001), `resultados` (3002) y el paquete local `paquetes/mensajes`.
- Buscador y resultados ya usan el [contrato](../glosario/01-arquitectura.md#contrato) `MENSAJES.BUSQUEDA_CAMBIADA` (`'busqueda:cambiada:v1'`, payload
  `{ texto }`) y las funciones `publicar` y `suscribir` del paquete.
- La solución terminada está en [`…/solucion`](../../ejercicios/M06-04-ultimo-valor-retenido/solucion/).
- Dependencias instaladas en la raíz del repositorio (el Codespace lo hace al crearse).
- Para empezar de cero:

```bash
# Deja inicio/ como está en el repositorio
bash scripts/reiniciar.sh M06-04-ultimo-valor-retenido
```

Ficha: [`reiniciar.sh`](../comandos-lab.md#reiniciar). El navegador solo habla con el host: los remotes se
piden en `/mf/buscador/` y `/mf/resultados/` y el servidor del host los reenvía a sus puertos.

### Qué está pasando

Un evento del navegador es «dispara y olvida»: llega a quien esté escuchando **en ese instante** y desaparece.
Entre [microaplicaciones](../glosario/01-arquitectura.md#microaplicacion) eso es un problema, porque no todas están montadas a la vez: una ruta que se abre más
tarde, un remote cargado bajo demanda, un panel que se despliega. Quien llega tarde no sabe qué se dijo antes.

La solución habitual es que el bus **retenga el último valor de cada mensaje** y se lo entregue a cada nuevo
suscriptor en cuanto se suscribe. Es lo que hacen un `BehaviorSubject` de RxJS o los mensajes retenidos de MQTT.

> [!NOTE]
> Esto no es gestión de estado. En M04 se decidía quién es la única fuente de verdad de un estado (un store, un
> Context). Aquí no hay nadie que sea dueño de «la búsqueda»: el bus solo recuerda **el último aviso** que circuló
> para que quien llegue tarde no se lo pierda. Si varias microaplicaciones necesitan leer y modificar el mismo
> dato, lo que hace falta es un estado compartido, no un bus.

Hay un detalle propio de los [microfrontends](../glosario/01-arquitectura.md#microfrontend): el paquete `mensajes` no está en `shared`, así que cada
microaplicación lleva **su propia copia** de `bus.js`. Una variable normal del módulo existiría dos veces, una en
cada copia. Por eso el último valor se guarda en `window`, que es el mismo objeto para todos.

### 1 — Arranca el punto de partida

```bash
# Entra en el inicio del laboratorio y arranca buscador, resultados y host a la vez
cd /workspaces/react-microfrontends-201/ejercicios/M06-04-ultimo-valor-retenido/inicio
npm start
```

Ficha: [`npm start`](../comandos-lab.md#npm-start).

**Resultado esperado** (el orden de las líneas puede variar):

```text
> concurrently -n buscador,resultados,host "npm start --prefix buscador" "npm start --prefix resultados" "npm start --prefix host"
[host] webpack 5.112.2 compiled successfully
[buscador] webpack 5.112.2 compiled successfully
[host] <i> [webpack-dev-server] Loopback: http://localhost:3000/, http://[::1]:3000/
[buscador] <i> [webpack-dev-server] Loopback: http://localhost:3001/, http://[::1]:3001/
[resultados] webpack 5.112.2 compiled successfully
[resultados] <i> [webpack-dev-server] Loopback: http://localhost:3002/, http://[::1]:3002/
```

### 2 — Lee cómo carga el host los resultados

El host monta el buscador desde el principio, pero los resultados solo cuando se pulsa **Ver resultados**
([`inicio/host/src/App.jsx`](../../ejercicios/M06-04-ultimo-valor-retenido/inicio/host/src/App.jsx)):

```jsx
import { lazy, Suspense, useState } from 'react';
import Buscador from 'buscador/Buscador';

// Resultados se carga y se monta solo cuando se pide: llega tarde a la conversación.
const Resultados = lazy(() => import('resultados/Resultados'));

export default function App() {
  const [verResultados, setVerResultados] = useState(false);
  return (
    <main>
      <h1>Host</h1>
      <Buscador />
      <button id="ver" onClick={() => setVerResultados(true)}>Ver resultados</button>
      {/* Hasta el clic no se descarga el código de Resultados ni se suscribe nadie */}
      {verResultados && <Suspense fallback={<p>Cargando…</p>}><Resultados /></Suspense>}
    </main>
  );
}
```

Y `resultados/src/Resultados.jsx` se suscribe al montar, con su baja:

```jsx
useEffect(() => suscribir(MENSAJES.BUSQUEDA_CAMBIADA, ({ texto }) => {
  console.log('[resultados] recibe', texto);
  setTexto(texto);
}), []);
```

### 3 — Busca antes de abrir los resultados

Abre el host (pestaña **Puertos**, puerto **3000**) con **F12**: pestaña **Red** y, a la vez, la **Consola**.
Escribe `tienda` en **Buscar**, pulsa **Buscar** y después **Ver resultados**. Espera un par de segundos a que
se descargue el remote.

**Resultado esperado** (algunos nombres de fichero pueden cambiar):

```text
Red      200  /main.js
Red      200  /src_bootstrap_js-webpack_sharing_consume_default_react-dom_react-dom-webpack_sharing_consume_-f8f6f9.js
Red      200  /mf/buscador/remoteEntry.js
Red      200  /mf/resultados/remoteEntry.js
Red      200  /vendors-node_modules_react-dom_client_js-node_modules_react_jsx-dev-runtime_js.js
Red      200  /mf/resultados/vendors-node_modules_react_index_js.js
Red      200  /mf/buscador/vendors-node_modules_react_jsx-dev-runtime_js.js
Red      200  /mf/resultados/vendors-node_modules_react-dom_index_js.js
Red      200  /mf/buscador/src_Buscador_jsx.js
── Escribes «tienda»
── Clic
Consola  [bus] publica busqueda:cambiada:v1 {"texto":"tienda"}
── Clic
Red      200  /mf/resultados/src_Resultados_jsx.js
Red      200  /mf/resultados/vendors-node_modules_react_jsx-dev-runtime_js.js
── Texto de la página:
Host
Buscar
Ver resultados

Resultados para: (nada)
```

| Qué ves | Qué significa |
|---------|---------------|
| `[bus] publica … {"texto":"tienda"}` | El mensaje sale bien, con el contrato correcto |
| `src_Resultados_jsx.js` solo **después** de `clic #ver` | El código del listado no existía en la página cuando se publicó |
| Ninguna línea `[resultados] recibe` | Al suscribirse, el evento ya había pasado |
| `Resultados para: (nada)` | El listado no sabe qué se buscó |

### 4 — Haz que el bus retenga el último valor

Cambia `inicio/paquetes/mensajes/bus.js` para que guarde el último payload de cada tipo y se lo dé a quien se
suscribe:

```js
// Bus de mensajes sobre eventos del navegador (window).
// Último valor de cada tipo: vive en window porque cada microaplicación lleva su copia de este fichero.
const ultimo = (window.__busUltimo ??= {});   // la primera copia que se carga crea el objeto; las demás lo reutilizan

export function publicar(tipo, payload) {
  console.log(`[bus] publica ${tipo}`, JSON.stringify(payload));
  ultimo[tipo] = payload;                      // se recuerda antes de avisar
  window.dispatchEvent(new CustomEvent(tipo, { detail: payload }));
}

// Quien se suscribe tarde recibe al momento el último valor publicado.
export function suscribir(tipo, manejador) {
  if (tipo in ultimo) manejador(ultimo[tipo]); // entrega inmediata, si ya se publicó algo
  const oyente = (evento) => manejador(evento.detail);
  window.addEventListener(tipo, oyente);
  return () => window.removeEventListener(tipo, oyente);
}
```

Ni el buscador ni los resultados cambian: siguen llamando a `publicar` y `suscribir` igual que antes.

### 5 — Repite la búsqueda antes de abrir

Con `npm start` en marcha, Webpack recompila al guardar. Recarga el host y repite el paso 3: `tienda`, **Buscar**,
**Ver resultados**, y espera un par de segundos.

**Resultado esperado** (recortado: solo lo que pasa desde la búsqueda):

```text
── Escribes «tienda»
── Clic
Consola  [bus] publica busqueda:cambiada:v1 {"texto":"tienda"}
── Clic
Red      200  /mf/resultados/src_Resultados_jsx.js
Red      200  /mf/resultados/vendors-node_modules_react_jsx-dev-runtime_js.js
Consola  [resultados] recibe tienda
── Texto de la página:
Host
Buscar
Ver resultados

Resultados para: tienda
```

Ahora aparece `[resultados] recibe tienda` justo después de descargarse el remote: al suscribirse, el bus le ha
entregado el valor que tenía guardado.

### 6 — Mira el valor retenido

Con la página tal como queda en el paso 5, escribe en la **Consola**:

```js
// Lo que el bus tiene retenido, por nombre de mensaje
JSON.stringify(window.__busUltimo)
```

**Resultado esperado:**

```text
{"busqueda:cambiada:v1":{"texto":"tienda"}}
```

Una entrada por tipo de mensaje, con el último payload publicado. Es lo único que el bus recuerda: no guarda
historia, solo el último.

### 7 — Abre los resultados sin haber buscado

Recarga el host (eso vacía `window.__busUltimo`) y pulsa directamente **Ver resultados**, sin buscar.

**Resultado esperado** (recortado):

```text
── Clic
Red      200  /mf/resultados/src_Resultados_jsx.js
Red      200  /mf/resultados/vendors-node_modules_react_jsx-dev-runtime_js.js
── Texto de la página:
Host
Buscar
Ver resultados

Resultados para: (nada)
```

Sin nada publicado no hay nada retenido: `tipo in ultimo` es falso y el listado empieza vacío, como debe.

## Comprueba tu entendimiento

**El suscriptor tardío recibe el último valor**
Busca `tienda` y después pulsa **Ver resultados**.
→ `[resultados] recibe tienda` en la **Consola** y `Resultados para: tienda`.

**El bus solo guarda el último**
Tras el paso anterior, evalúa `JSON.stringify(window.__busUltimo)` en la **Consola**.
→ `{"busqueda:cambiada:v1":{"texto":"tienda"}}`.

**Sin publicar no hay entrega**
Recarga y pulsa **Ver resultados** sin buscar.
→ `Resultados para: (nada)`.

## Experimenta

**Predice antes:** en `bus.js`, cambia la línea del último valor por una variable normal del módulo:

```js
// Experimento: el último valor en una variable del módulo, no en window
const ultimo = {};
```

Recarga y repite: `tienda`, **Buscar**, **Ver resultados**. ¿Recibe `tienda` el listado?

**Resultado esperado** (recortado: solo lo que pasa desde la búsqueda):

```text
── Escribes «tienda»
── Clic
Consola  [bus] publica busqueda:cambiada:v1 {"texto":"tienda"}
── Clic
Red      200  /mf/resultados/src_Resultados_jsx.js
Red      200  /mf/resultados/vendors-node_modules_react_jsx-dev-runtime_js.js
── Texto de la página:
Host
Buscar
Ver resultados
Resultados para: (nada)
```

Vuelve a salir `Resultados para: (nada)`, y no hay ningún `[resultados] recibe`. El buscador publica con **su** copia de `bus.js` y guarda
`tienda` en su `ultimo`; el listado se suscribe con **la suya**, cuyo `ultimo` está vacío. Dos copias del mismo
fichero son dos variables distintas, igual que dos copias de un `createContext` eran dos contextos. Comprueba en
**Red** que no hay ningún fichero `paquetes_mensajes…`: el bus va dentro de `src_Buscador_jsx.js` y de
`src_Resultados_jsx.js`. Vuelve a dejar `const ultimo = (window.__busUltimo ??= {});`.

> [!TIP]
> La alternativa a `window` es compartir el paquete `mensajes` como [singleton](../glosario/02-module-federation.md#singleton) en `shared` de las tres
> aplicaciones, como se hace con un contexto. Entonces hay una sola copia de `bus.js` y la variable del módulo
> basta.

## Reto

### 1 — Leer el valor no basta

**La situación:** un compañero propone simplificar `Resultados.jsx`: en lugar de suscribirse, que lea el valor
retenido al montar con `useState(() => window.__busUltimo?.['busqueda:cambiada:v1']?.texto ?? '')`.

**Qué haces:** aplica su propuesta en `inicio/resultados/src/Resultados.jsx` (quita el `useEffect`). Busca
`tienda`, pulsa **Ver resultados** y, con el listado ya abierto, busca `mochila`.

**Pistas:** `useState` con función inicial solo se evalúa en el primer render.

**Lo que buscas:** explicar por qué el listado muestra `tienda` pero se queda ahí al buscar `mochila`, y dejar
`Resultados.jsx` como estaba, con la suscripción.

<details>
<summary>Ver solución</summary>

```jsx
// Propuesta del compañero: lee el retenido una vez y no escucha nada más
export default function Resultados() {
  const [texto] = useState(() => window.__busUltimo?.['busqueda:cambiada:v1']?.texto ?? '');
  return <p>Resultados para: {texto || '(nada)'}</p>;
}
```

Al abrir muestra `Resultados para: tienda`, porque el valor estaba retenido. Al buscar `mochila` no cambia:
nadie está suscrito y la **Consola** solo muestra `[bus] publica … {"texto":"mochila"}`. Además, el listado
depende ahora de un detalle interno del bus (`window.__busUltimo`) en lugar de su contrato (`suscribir`).
**La regla:** el último valor retenido resuelve **la llegada tarde**; los cambios siguientes siguen llegando por la
suscripción, y las dos cosas van juntas en `suscribir`.

</details>

## Errores frecuentes

| Síntoma | Causa probable | Cómo arreglarlo |
|---------|----------------|-----------------|
| `Resultados para: (nada)` tras buscar y abrir | El bus no retiene, o retiene en una variable del módulo | Guarda el último valor en `window.__busUltimo` (o comparte el paquete como singleton) |
| El listado recibe la búsqueda dos veces al abrir | Se entrega el retenido y además se vuelve a publicar al montar | Que solo el buscador publique; el retenido se entrega una vez, en `suscribir` |
| Tras recargar, los resultados no recuerdan la búsqueda | `window.__busUltimo` vive en la memoria de la página | Es lo esperado; si debe sobrevivir a la recarga, es estado (URL, `sessionStorage`), no mensaje |
| `Cargando…` se queda fijo | El remote `resultados` no responde en el 3002 | Comprueba que `npm start` muestra `[resultados] … compiled successfully` |

```bash
# Si el puerto 3002 está ocupado por otro ejercicio, libera los puertos y vuelve a arrancar
fuser -k 3000/tcp 3001/tcp 3002/tcp 3003/tcp
npm start
```

## Conclusiones

### Qué es el último valor retenido

Una memoria mínima del bus: por cada nombre de mensaje guarda el último payload publicado y se lo entrega a cada
nuevo suscriptor en el momento de suscribirse. Los cambios posteriores llegan como siempre, por el evento.

```text
buscador ── publicar(tienda) ──▶ bus: ultimo['busqueda:cambiada:v1'] = { texto: 'tienda' }
                                   │
          (más tarde) resultados ── suscribir ──▶ recibe { texto: 'tienda' } al momento
```

### Cómo debe ser

| Requisito | En el lab |
|-----------|-----------|
| Se retiene por tipo de mensaje, solo el último | `{"busqueda:cambiada:v1":{"texto":"tienda"}}` |
| Se entrega al suscribirse, sin que nadie republique | `[resultados] recibe tienda` justo tras cargar el remote |
| Vive donde lo ven todas las copias del bus | `window.__busUltimo` |
| Sin publicar, no se inventa nada | `Resultados para: (nada)` tras recargar |

### Dónde se rompe y cómo lo has detectado

| Fallo | Cómo lo has visto | Qué provoca |
|-------|-------------------|-------------|
| Bus sin retener | `publica` sin ningún `recibe`; `(nada)` tras **Ver resultados** | El suscriptor tardío se pierde el mensaje |
| Retenido en una variable del módulo | Ningún fichero `paquetes_mensajes…` en **Red**: cada remote lleva su copia | Cada copia tiene su propio `ultimo` |

### Cómo se perfecciona

Decidir en el contrato qué mensajes se retienen (un «ha cambiado la búsqueda» sí; un «se ha pulsado comprar» no,
porque entregarlo tarde repetiría la acción), compartir el paquete del bus como singleton para no depender de
una global, y no usarlo como sustituto de un estado compartido cuando varias microaplicaciones tienen que leer y
modificar el mismo dato.

### En una frase

> 🔑 Un evento solo llega a quien está escuchando; retener el último valor de cada mensaje hace que una
> microaplicación que monta tarde empiece sabiendo lo último que se dijo.
