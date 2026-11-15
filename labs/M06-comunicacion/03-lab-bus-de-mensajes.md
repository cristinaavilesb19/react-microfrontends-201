# Lab — Bus de mensajes

[← Página anterior](02-lab-contexto-compartido.md) · [Siguiente página →](04-lab-ultimo-valor-retenido.md)

En este laboratorio practicas un **[bus de mensajes](../glosario/03-estado-comunicacion.md#bus-de-mensajes) con [contrato](../glosario/01-arquitectura.md#contrato)** entre dos [microaplicaciones](../glosario/01-arquitectura.md#microaplicacion) que no se conocen.
El ejercicio son dos [remotes](../glosario/02-module-federation.md#remote) hermanos dentro de un [host](../glosario/02-module-federation.md#host): `buscador`, con un campo y un botón **Buscar**, y
`resultados`, que muestra «Resultados para: …». Al principio cada uno escribe a mano el nombre del evento y no se
entienden; lo arreglas con un paquete que fija el nombre del mensaje, su payload y la baja de la suscripción.

### Objetivo

Comprender qué es un bus de mensajes con contrato: cómo funciona, cómo debe ser, cómo se detecta que un mensaje
no llega o llega de más y cómo se mejora.

### Punto de partida

- Carpeta: [`ejercicios/M06-03-bus-de-mensajes/inicio`](../../ejercicios/M06-03-bus-de-mensajes/inicio/) con
  `host` (puerto 3000), `buscador` (3001), `resultados` (3002) y el paquete local `paquetes/mensajes`.
- La solución terminada está en [`…/solucion`](../../ejercicios/M06-03-bus-de-mensajes/solucion/).
- Dependencias instaladas en la raíz del repositorio (el Codespace lo hace al crearse).
- Para empezar de cero:

```bash
# Deja inicio/ como está en el repositorio
bash scripts/reiniciar.sh M06-03-bus-de-mensajes
```

Ficha: [`reiniciar.sh`](../comandos-lab.md#reiniciar). El navegador solo habla con el host: los remotes se
piden en `/mf/buscador/` y `/mf/resultados/` y el servidor del host los reenvía a sus puertos.

### Qué está pasando

Props y contexto exigen que una microaplicación esté dentro de la otra. Cuando son **hermanas**, como un buscador
y un listado que el host coloca uno al lado del otro, ninguna renderiza a la otra. El host podría hacer de
intermediario, pero entonces tendría que saber de búsquedas. La alternativa es un **bus de mensajes**: una
publica «ha cambiado la búsqueda» y quien esté interesado se suscribe. Ninguna importa a la otra.

En el navegador el bus más simple ya existe: `window.dispatchEvent` con un `CustomEvent` y
`window.addEventListener`. Lo que no trae es un **contrato**:

| Parte del contrato | En este lab |
|--------------------|-------------|
| Nombre del mensaje, con versión | `'busqueda:cambiada:v1'` |
| Forma del payload | `{ texto: string }` |
| Dónde está escrito | `paquetes/mensajes/contrato.js`, que importan las dos |
| Cómo se deja de escuchar | `suscribir` devuelve la función de baja |

La versión en el nombre permite cambiar el payload más adelante (`v2`) sin romper a quien todavía espera la `v1`.

### 1 — Arranca el punto de partida

```bash
# Entra en el inicio del laboratorio y arranca buscador, resultados y host a la vez
cd /workspaces/react-microfrontends-201/ejercicios/M06-03-bus-de-mensajes/inicio
npm start
```

Ficha: [`npm start`](../comandos-lab.md#npm-start).

**Resultado esperado** (el orden de las líneas puede variar):

```text
> concurrently -n buscador,resultados,host "npm start --prefix buscador" "npm start --prefix resultados" "npm start --prefix host"
[host] webpack 5.112.2 compiled successfully
[host] <i> [webpack-dev-server] Loopback: http://localhost:3000/, http://[::1]:3000/
[resultados] webpack 5.112.2 compiled successfully
[resultados] <i> [webpack-dev-server] Loopback: http://localhost:3002/, http://[::1]:3002/
[buscador] webpack 5.112.2 compiled successfully
[buscador] <i> [webpack-dev-server] Loopback: http://localhost:3001/, http://[::1]:3001/
```

### 2 — Busca algo y mira qué llega

Abre el host (pestaña **Puertos**, puerto **3000**) con **F12** abierto en **Consola**. Escribe `mochila` en el
campo **Buscar** y pulsa el botón **Buscar**.

**Resultado esperado** (lista de **Red** y texto de la página; algunos nombres de fichero pueden cambiar):

```text
Red      200  /main.js
Red      200  /src_bootstrap_js-webpack_sharing_consume_default_react-dom_react-dom-webpack_sharing_consume_-f8f6f9.js
Red      200  /mf/buscador/remoteEntry.js
Red      200  /mf/resultados/remoteEntry.js
Red      200  /vendors-node_modules_react-dom_client_js-node_modules_react_jsx-dev-runtime_js.js
Red      200  /mf/resultados/vendors-node_modules_react_index_js.js
Red      200  /mf/buscador/vendors-node_modules_react_jsx-dev-runtime_js.js
Red      200  /mf/buscador/src_Buscador_jsx.js
Red      200  /mf/resultados/src_Resultados_jsx.js
Red      200  /mf/resultados/vendors-node_modules_react_jsx-dev-runtime_js.js
Red      200  /mf/resultados/vendors-node_modules_react-dom_index_js.js
── Escribes «mochila»
── Clic
── Texto de la página:
Host
Mostrar/ocultar resultados
Buscar

Resultados para: (nada)
```

Las dos microaplicaciones se cargan, el clic se hace y la **Consola** queda vacía: ni mensaje recibido ni error.

### 3 — Lee qué publica uno y qué escucha el otro

El buscador ([`inicio/buscador/src/Buscador.jsx`](../../ejercicios/M06-03-bus-de-mensajes/inicio/buscador/src/Buscador.jsx)):

```jsx
import { useState } from 'react';

// Publica con un nombre escrito a mano.
export default function Buscador() {
  const [texto, setTexto] = useState('');
  // Evento 'buscar', con el texto suelto como detail
  const buscar = () => window.dispatchEvent(new CustomEvent('buscar', { detail: texto }));
  return (
    <section>
      <input value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Buscar" />
      <button onClick={buscar}>Buscar</button>
    </section>
  );
}
```

Los resultados ([`inicio/resultados/src/Resultados.jsx`](../../ejercicios/M06-03-bus-de-mensajes/inicio/resultados/src/Resultados.jsx)):

```jsx
import { useEffect, useState } from 'react';

// Escucha otro nombre escrito a mano, y nunca se da de baja.
export default function Resultados() {
  const [texto, setTexto] = useState('');
  useEffect(() => {
    // Escucha 'busqueda', no 'buscar'; y el efecto no devuelve nada para quitar el oyente
    window.addEventListener('busqueda', (e) => {
      console.log('[resultados] recibe', e.detail);
      setTexto(e.detail);
    });
  }, []);
  return <p>Resultados para: {texto || '(nada)'}</p>;
}
```

| Fallo | Por qué no da error |
|-------|---------------------|
| Se publica `buscar` y se escucha `busqueda` | Un evento sin oyentes no es un error para el navegador |
| El oyente nunca se quita | Funciona hasta que el componente se desmonta y vuelve a montarse |

### 4 — Lee el contrato que ya tienes en el paquete

El paquete `paquetes/mensajes` ya está en el inicio, con el alias `mensajes` en los `webpack.config.js` de los
remotes. El contrato ([`inicio/paquetes/mensajes/contrato.js`](../../ejercicios/M06-03-bus-de-mensajes/inicio/paquetes/mensajes/contrato.js)):

```js
// Contrato de mensajes: nombre (con versión) y forma del payload.
// Quien publica y quien escucha importan estas constantes; nadie escribe el nombre a mano.
export const MENSAJES = {
  BUSQUEDA_CAMBIADA: 'busqueda:cambiada:v1', // payload: { texto: string }
};
```

El bus ([`inicio/paquetes/mensajes/bus.js`](../../ejercicios/M06-03-bus-de-mensajes/inicio/paquetes/mensajes/bus.js)):

```js
// Bus de mensajes sobre eventos del navegador (window).
export function publicar(tipo, payload) {
  console.log(`[bus] publica ${tipo}`, JSON.stringify(payload));   // rastro de cada mensaje en la Consola
  window.dispatchEvent(new CustomEvent(tipo, { detail: payload }));
}

// Devuelve la función para darse de baja: quien se suscribe, se desuscribe.
export function suscribir(tipo, manejador) {
  const oyente = (evento) => manejador(evento.detail);   // el manejador recibe el payload, no el evento
  window.addEventListener(tipo, oyente);
  return () => window.removeEventListener(tipo, oyente);
}
```

Y `index.js` reexporta `MENSAJES`, `publicar` y `suscribir`.

### 5 — Publica según el contrato

Sustituye `inicio/buscador/src/Buscador.jsx`:

```jsx
import { useState } from 'react';
import { MENSAJES, publicar } from 'mensajes';

// Publica según el contrato: nombre y payload definidos en paquetes/mensajes.
export default function Buscador() {
  const [texto, setTexto] = useState('');
  return (
    <section>
      <input value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Buscar" />
      {/* Nombre de la constante y payload con la forma { texto } */}
      <button onClick={() => publicar(MENSAJES.BUSQUEDA_CAMBIADA, { texto })}>Buscar</button>
    </section>
  );
}
```

### 6 — Suscríbete según el contrato y date de baja

Sustituye `inicio/resultados/src/Resultados.jsx`:

```jsx
import { useEffect, useState } from 'react';
import { MENSAJES, suscribir } from 'mensajes';

// Se suscribe al montar y se da de baja al desmontar (lo que devuelve suscribir).
export default function Resultados() {
  const [texto, setTexto] = useState('');
  // Flecha sin llaves: el efecto devuelve lo que devuelve suscribir, la función de baja,
  // y React la llama al desmontar el componente
  useEffect(() => suscribir(MENSAJES.BUSQUEDA_CAMBIADA, ({ texto }) => {
    console.log('[resultados] recibe', texto);
    setTexto(texto);
  }), []);
  return <p>Resultados para: {texto || '(nada)'}</p>;
}
```

### 7 — Busca, oculta, muestra y vuelve a buscar

Con `npm start` en marcha, Webpack recompila al guardar. Recarga el host con la **Consola** abierta y haz esto:

1. Escribe `mochila` en **Buscar** y pulsa **Buscar**.
2. Pulsa **Mostrar/ocultar resultados** dos veces (se desmonta y se vuelve a montar `resultados`).
3. Pulsa **Buscar** otra vez.

**Resultado esperado:**

```text
Red      200  /main.js
Red      200  /src_bootstrap_js-webpack_sharing_consume_default_react-dom_react-dom-webpack_sharing_consume_-f8f6f9.js
Red      200  /mf/resultados/remoteEntry.js
Red      200  /mf/buscador/remoteEntry.js
Red      200  /vendors-node_modules_react-dom_client_js-node_modules_react_jsx-dev-runtime_js.js
Red      200  /mf/resultados/vendors-node_modules_react_index_js.js
Red      200  /mf/buscador/vendors-node_modules_react_jsx-dev-runtime_js.js
Red      200  /mf/buscador/src_Buscador_jsx.js
Red      200  /mf/resultados/vendors-node_modules_react-dom_index_js.js
Red      200  /mf/resultados/vendors-node_modules_react_jsx-dev-runtime_js.js
Red      200  /mf/resultados/src_Resultados_jsx.js
── Escribes «mochila»
── Clic
Consola  [bus] publica busqueda:cambiada:v1 {"texto":"mochila"}
Consola  [resultados] recibe mochila
── Clic
── Clic
── Clic
Consola  [bus] publica busqueda:cambiada:v1 {"texto":"mochila"}
Consola  [resultados] recibe mochila
── Texto de la página:
Host
Mostrar/ocultar resultados
Buscar

Resultados para: mochila
```

| Línea | Qué significa |
|-------|---------------|
| `[bus] publica busqueda:cambiada:v1 {"texto":"mochila"}` | El buscador publica con el nombre y el payload del contrato |
| `[resultados] recibe mochila` | El listado recibe el payload y repinta |
| Una sola línea `recibe` tras ocultar y mostrar | La suscripción anterior se dio de baja al desmontar; solo hay un oyente |

## Comprueba tu entendimiento

**El nombre sale del contrato**
Busca el nombre del mensaje escrito a mano en el código de los remotes:

```bash
# Busca el nombre literal del mensaje fuera del paquete (desde la raíz del repositorio)
grep -rn "busqueda:cambiada" ejercicios/M06-03-bus-de-mensajes/inicio/buscador/src ejercicios/M06-03-bus-de-mensajes/inicio/resultados/src
```

→ No sale nada: solo `paquetes/mensajes/contrato.js` contiene el nombre.

**El mensaje llega**
Busca `mochila`.
→ `[resultados] recibe mochila` en la **Consola** y `Resultados para: mochila`.

**Un oyente por montaje**
Oculta y muestra los resultados y vuelve a buscar.
→ Una sola línea `[resultados] recibe mochila` por búsqueda.

## Investiga

¿Dónde está el código del paquete `mensajes`? Mira la lista de **Red** del paso 7: no hay ningún fichero
`paquetes_mensajes…`. A diferencia del [contexto compartido](../glosario/03-estado-comunicacion.md#contexto-compartido), este paquete **no** está en `shared`: cada remote
lleva su propia copia dentro de su `src_…_jsx.js`. Funciona igual porque el bus no guarda nada en el módulo: los
mensajes viajan por `window`, que es el mismo objeto para todos. Lo que sí comparten las dos copias es el texto
del contrato.

Comprueba también que el bus no depende de React: con la página del host abierta, publica desde la **Consola**
un mensaje que respete el contrato y mira si el listado lo pinta.

```js
// Publica a mano un mensaje con el nombre y el payload del contrato
window.dispatchEvent(new CustomEvent('busqueda:cambiada:v1', { detail: { texto: 'gorra' } }))
```

**Resultado esperado:**

```text
Consola  [resultados] recibe gorra
── Texto de la página:
Host
Mostrar/ocultar resultados
Buscar
Resultados para: gorra
```

No sale ningún `[bus] publica`: el mensaje no ha pasado por el buscador. Cualquiera que respete el contrato
puede hablar por el bus, sea otra microaplicación, un script o una prueba automática.

## Experimenta

**Predice antes:** en `Resultados.jsx`, cambia la flecha sin llaves por una con llaves, de modo que el efecto ya no
devuelva la baja. Repite el paso 7 (buscar, ocultar, mostrar, buscar). ¿Cuántas veces se recibe la segunda
búsqueda?

```jsx
// Experimento: con llaves, el efecto no devuelve nada; la suscripción nunca se da de baja
useEffect(() => { suscribir(MENSAJES.BUSQUEDA_CAMBIADA, ({ texto }) => {
  console.log('[resultados] recibe', texto);
  setTexto(texto);
}); }, []);
```

**Resultado esperado** (la primera búsqueda se hace aquí con los resultados ya vueltos a montar):

```text
── Escribes «mochila»
── Clic
── Clic
── Clic
Consola  [bus] publica busqueda:cambiada:v1 {"texto":"mochila"}
Consola  [resultados] recibe mochila
Consola  [resultados] recibe mochila
── Texto de la página:
Host
Mostrar/ocultar resultados
Buscar

Resultados para: mochila
```

Un solo mensaje publicado y **dos** recepciones: el oyente del primer montaje sigue vivo, llamando a un
componente que ya no existe. Cada vez que se oculte y muestre habrá uno más. La pantalla parece correcta, y por
eso el fallo se nota tarde: un contador que suma de más, una petición repetida. Vuelve a dejar la flecha sin
llaves.

## Reto

### 1 — Un segundo mensaje: limpiar la búsqueda

**La situación:** el buscador quiere un botón **Limpiar** que deje el listado en `(nada)`. Un compañero propone
publicar `busqueda:cambiada:v1` con `{ texto: '' }`; otro, un mensaje propio.

**Qué haces:** añade al contrato `BUSQUEDA_LIMPIADA: 'busqueda:limpiada:v1'` (payload vacío, `{}`). En
`Buscador.jsx`, un botón **Limpiar** que lo publique; en `Resultados.jsx`, una segunda suscripción que ponga el
texto a `''`, con su baja.

**Pistas:** `paquetes/mensajes/contrato.js`; un efecto puede suscribirse a dos mensajes y devolver una función
que llame a las dos bajas.

**Lo que buscas:** en la **Consola**, `[bus] publica busqueda:limpiada:v1 {}` al pulsar **Limpiar**, y
`Resultados para: (nada)`; tras ocultar y mostrar, cada mensaje se sigue recibiendo una sola vez.

<details>
<summary>Ver solución</summary>

```js
// paquetes/mensajes/contrato.js
export const MENSAJES = {
  BUSQUEDA_CAMBIADA: 'busqueda:cambiada:v1', // payload: { texto: string }
  BUSQUEDA_LIMPIADA: 'busqueda:limpiada:v1', // payload: {}
};
```

```jsx
// buscador/src/Buscador.jsx, junto al botón Buscar
<button onClick={() => publicar(MENSAJES.BUSQUEDA_LIMPIADA, {})}>Limpiar</button>
```

```jsx
// resultados/src/Resultados.jsx
useEffect(() => {
  const bajas = [
    suscribir(MENSAJES.BUSQUEDA_CAMBIADA, ({ texto }) => setTexto(texto)),
    suscribir(MENSAJES.BUSQUEDA_LIMPIADA, () => setTexto('')),
  ];
  return () => bajas.forEach((baja) => baja());   // al desmontar, fuera las dos
}, []);
```

Un mensaje propio dice **qué ha pasado** («se ha limpiado») en lugar de obligar al receptor a adivinarlo por un
payload especial. **La regla:** un mensaje por hecho, cada uno en el contrato, y cada suscripción con su baja.

</details>

## Errores frecuentes

| Síntoma | Causa probable | Cómo arreglarlo |
|---------|----------------|-----------------|
| `Resultados para: (nada)` y la **Consola** vacía | Nombres distintos al publicar y al escuchar | Usa `MENSAJES.…` del contrato en los dos lados |
| `[bus] publica …` sale pero no `recibe` | El receptor escucha otro nombre o no está montado | Revisa que use la misma constante y que esté visible |
| `recibe` sale dos o más veces por búsqueda | La suscripción no se da de baja | El efecto debe devolver lo que devuelve `suscribir` |
| `[resultados] recibe undefined` y `(nada)` | El emisor envía el texto suelto y el receptor espera `{ texto }` | Respeta la forma del payload del contrato en los dos lados |
| `Module not found: Error: Can't resolve 'mensajes'` | Falta el alias `mensajes` en esa aplicación | Añádelo en `resolve.alias` de su `webpack.config.js` y reinicia |

```bash
# Tras cambiar un webpack.config.js: Ctrl+C y vuelve a arrancar las tres aplicaciones
npm start
```

## Conclusiones

### Qué es un bus de mensajes con contrato

Un canal de eventos por el que una microaplicación publica un hecho y las que estén interesadas lo reciben, sin
conocerse. El contrato fija el nombre (con versión), la forma del payload y la obligación de darse de baja.

```text
buscador ── publicar('busqueda:cambiada:v1', { texto }) ──▶ window ──▶ suscribir(…) ── resultados
                         ▲                                                  ▲
                         └──────────── paquetes/mensajes/contrato.js ───────┘
```

### Cómo debe ser

| Requisito | En el lab |
|-----------|-----------|
| Nombres en un contrato común, no a mano | `MENSAJES.BUSQUEDA_CAMBIADA` |
| Nombre versionado | `:v1` al final |
| Payload con forma fija | `{ texto: string }` |
| Toda suscripción tiene su baja | `useEffect(() => suscribir(…), [])` |
| Rastro de lo que circula | `[bus] publica …` en la **Consola** |

### Dónde se rompe y cómo lo has detectado

| Fallo | Cómo lo has visto | Qué provoca |
|-------|-------------------|-------------|
| Nombres distintos | `buscar` frente a `busqueda`: `(nada)` y la **Consola** vacía | El mensaje se pierde en silencio |
| Suscripción sin baja | Dos líneas `recibe mochila` por una sola publicación | Oyentes acumulados, trabajo repetido |

### Cómo se perfecciona

Un rastro opcional de cada mensaje (como el `console.log` del bus), validar el payload al publicar, versionar
el nombre cuando cambia su forma y mantener las dos versiones mientras haya receptores antiguos, y en un proyecto
real tipar el contrato (TypeScript) para que publicar con otra forma no compile.

### En una frase

> 🔑 Un bus desacopla a quien publica de quien escucha solo si los dos comparten el contrato del mensaje, y cada
> suscripción se da de baja cuando su microaplicación se desmonta.
