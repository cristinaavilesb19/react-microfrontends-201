# Lab — Eventos globales hacia el store

[← Página anterior](03-lab-sincronizar-estado.md) · [Siguiente página →](../M05-integracion-single-spa/README.md)

En este laboratorio practicas el **[evento global](../glosario/03-estado-comunicacion.md#evento-global) como puente hacia el estado**: una [microaplicación](../glosario/01-arquitectura.md#microaplicacion) que no usa
Redux anuncia lo que ha pasado con un `CustomEvent`, y el [host](../glosario/02-module-federation.md#host) lo escucha y lo convierte en una acción de su
store. El ejercicio es un [remote](../glosario/02-module-federation.md#remote) `acceso` con dos botones, **Entrar como Ana** y **Entrar como Luis**, y un host
que muestra quién tiene la sesión y cuántas acciones le han llegado.

### Objetivo

Comprender qué es un evento global como puente hacia el estado: cómo funciona, cómo debe ser, cómo se detectan
sus debilidades y cómo se mejora.

### Punto de partida

- Carpeta: `ejercicios/M04-04-eventos-hacia-el-store/inicio`, con dos aplicaciones:

  | Aplicación | Puerto | Qué hace |
  |------------|--------|----------|
  | `host` | 3000 | Tiene un store de Redux con el slice `sesion` y pinta el remote |
  | `acceso` | 3001 | Expone `./Acceso`; al pulsar un botón emite el evento `acceso:sesion-iniciada` |

- Estado: en `inicio/` nadie escucha el evento. Tú añades el puente en el host.
- Arranque, desde la raíz del repositorio (ficha: [`npm start`](../comandos-lab.md#npm-start)):

  ```bash
  # Entra en el punto de partida del lab y arranca host y remote a la vez
  cd ejercicios/M04-04-eventos-hacia-el-store/inicio
  npm start
  ```

- URL: pestaña **Puertos** de VS Code → puerto **3000** → icono del globo (**Abrir en el navegador**).
  Fuera de Codespaces, `http://localhost:3000`.
- Si quieres volver a empezar (ficha: [`reiniciar`](../comandos-lab.md#reiniciar)):

  ```bash
  # Deja inicio/ como está en el repositorio
  bash scripts/reiniciar.sh M04-04-eventos-hacia-el-store
  ```

> [!NOTE]
> El navegador solo habla con el host: el remote se pide en `/mf/acceso/remoteEntry.js` y el servidor del host
> lo reenvía al puerto 3001 (`devServer.proxy`). `src/index.js` solo hace `import('./bootstrap')`: ese arranque
> asíncrono da tiempo a [Module Federation](../glosario/02-module-federation.md#module-federation) a cargar el remote y a compartir React antes de pintar.

### Qué está pasando

Compartir el store obliga a que todas las microaplicaciones usen Redux y la misma versión de `react-redux`. A
veces no se puede o no compensa: el remote es de otro equipo, está hecho con otra librería o solo necesita
avisar de algo. Para eso sirve un **evento global**: el remote dispara un `CustomEvent` en `window` con un nombre
y unos datos (`detail`), sin saber quién lo escucha.

El host, que sí tiene el store, pone un **puente**: un `useEffect` que se suscribe al evento con
`addEventListener` y, cada vez que llega, despacha la acción correspondiente. Así el estado global sigue
cambiando solo a través de acciones del store, y el remote solo depende de un [contrato](../glosario/01-arquitectura.md#contrato) mínimo: el nombre del
evento y la forma de `detail`.

| Pieza | Qué representa |
|-------|----------------|
| `acceso/src/Acceso.jsx` | La microaplicación que anuncia: no importa Redux |
| `acceso:sesion-iniciada` con `detail: { usuario }` | El contrato entre los dos equipos |
| `host/src/store.js` | El estado global: `usuario` y `inicios` (cuántas acciones han llegado) |
| `usePuenteSesion` (lo creas tú) | El puente: evento → acción |
| `StrictMode` en `host/src/bootstrap.js` | Un detector de efectos sin limpieza, en desarrollo |

### 1 — Ver un evento que nadie escucha

1. Abre el puerto 3000 con **F12** → **Consola** abierta.
2. Pulsa **Entrar como Ana**.

**Resultado esperado** en el terminal (el orden cambia en cada arranque):

```text
> concurrently -n acceso,host "npm start --prefix acceso" "npm start --prefix host"
[acceso] webpack 5.112.2 compiled successfully
[acceso] <i> [webpack-dev-server] Loopback: http://localhost:3001/, http://[::1]:3001/
[host] webpack 5.112.2 compiled successfully
[host] <i> [webpack-dev-server] Loopback: http://localhost:3000/, http://[::1]:3000/
```

En la **Consola**:

```text
[acceso] emite acceso:sesion-iniciada Ana
```

Y en la página:

```text
Host · sesión: sin sesión · acciones recibidas: 0
Acceso (remote)
Entrar como AnaEntrar como Luis
```

**Cómo se lee:** el remote ha emitido el evento (lo dice su `console.log`), pero el host sigue «sin sesión» y
con 0 acciones. Un evento sin oyentes no da error: simplemente se pierde.

### 2 — Leer los dos lados del contrato

Abre `inicio/acceso/src/Acceso.jsx`. Es lo que emite el remote; no lo vas a cambiar:

```jsx
// Microaplicación sin Redux: no sabe quién la escucha. Solo anuncia lo que ha pasado.
export default function Acceso() {
  const entrar = (usuario) => {
    console.log('[acceso] emite acceso:sesion-iniciada', usuario);
    window.dispatchEvent(new CustomEvent('acceso:sesion-iniciada', { detail: { usuario } }));
  };
  // … los dos botones llaman a entrar('Ana') y entrar('Luis') …
}
```

Y `inicio/host/src/store.js`, el estado que tiene que cambiar:

```js
const sesion = createSlice({
  name: 'sesion',
  initialState: { usuario: null, inicios: 0 },
  reducers: {
    sesionIniciada(state, action) {
      state.usuario = action.payload;
      state.inicios += 1;        // cuántas veces ha llegado la acción
    },
  },
});

export const { sesionIniciada } = sesion.actions;
```

**Cómo se lee:** el nombre del evento lleva el prefijo de la microaplicación que lo emite (`acceso:`), para que
no choque con otros. El dato viaja en `detail.usuario`. Del lado del host, la acción `sesionIniciada` recibe el
usuario como `payload` y cuenta en `inicios` cuántas veces ha llegado: ese contador te servirá para ver si el
puente despacha de más.

### 3 — Añadir el puente en el host

Abre `inicio/host/src/App.jsx`. Cambia los imports del principio:

```jsx
import { useEffect } from 'react';
import { Provider, useDispatch, useSelector } from 'react-redux';
import Acceso from 'acceso/Acceso';
import { sesionIniciada, store } from './store';
```

Debajo de los imports, añade el hook del puente:

```jsx
// Puente: traduce el evento global a una acción del store del host.
function usePuenteSesion() {
  const dispatch = useDispatch();
  useEffect(() => {
    // Cada evento se convierte en una acción con el usuario de detail
    const alIniciar = (evento) => dispatch(sesionIniciada(evento.detail.usuario));
    window.addEventListener('acceso:sesion-iniciada', alIniciar);
    // Limpieza: al desmontar (o al repetir el efecto) se quita el oyente
    return () => window.removeEventListener('acceso:sesion-iniciada', alIniciar);
  }, [dispatch]);
}
```

Y llámalo en `Pagina`, que ya está dentro del `<Provider>`:

```jsx
function Pagina() {
  usePuenteSesion();
  return (
    <>
      <Cabecera />
      <Acceso />
    </>
  );
}
```

**Cómo se lee:** el puente va en `Pagina` y no en `App` porque `useDispatch` necesita un `<Provider>` por encima,
y `App` es quien lo pone.

### 4 — Comprobar que el evento llega al store

Recarga el puerto 3000. Pulsa **Entrar como Ana** y después **Entrar como Luis**.

**Resultado esperado** en la **Consola**:

```text
[acceso] emite acceso:sesion-iniciada Ana
[acceso] emite acceso:sesion-iniciada Luis
```

Y en la página:

```text
Host · sesión: Luis · acciones recibidas: 2
Acceso (remote)
Entrar como AnaEntrar como Luis
```

**Cómo se lee:** dos eventos, dos acciones. La sesión es la del último evento, `Luis`. El remote no ha cambiado:
el host ha decidido escucharlo, y el remote sigue sin saber que existe un store.

## Comprueba tu entendimiento

**El remote no depende de Redux**
Busca `redux` en `inicio/acceso/src` y en `inicio/acceso/webpack.config.js`.
→ No aparece: `acceso` solo comparte `react` y `react-dom`.

**Una acción por clic**
Pulsa **Entrar como Ana** tres veces seguidas.
→ `acciones recibidas` sube de uno en uno y la sesión sigue en `Ana`.

**El host decide el nombre de la acción**
Compara el nombre del evento y el de la acción.
→ El evento es `acceso:sesion-iniciada` (lo elige el remote); la acción es `sesion/sesionIniciada` (la elige el
host). El puente es el único sitio que conoce los dos.

## Investiga

**¿Puede cualquiera emitir el evento?** El contrato es solo un nombre en `window`. Desde la **Consola** del
puerto 3000, emite tú el evento con otro usuario y mira la cabecera del host:

```js
// Emite el mismo evento que el remote, con otro usuario
window.dispatchEvent(new CustomEvent('acceso:sesion-iniciada', { detail: { usuario: 'Eva' } }));
```

**Resultado esperado** en la página:

```text
Host · sesión: Eva · acciones recibidas: 1
Acceso (remote)
Entrar como AnaEntrar como Luis
```

La **Consola** no muestra ningún `[acceso] emite …`: el remote no ha hecho nada y aun así el host ha cambiado de
sesión.

Piensa qué dice eso de la confianza en los eventos globales: el host no sabe quién ha disparado el evento, y
`detail` puede traer cualquier cosa. ¿Qué comprobaría el puente antes de despachar en un proyecto real?

## Experimenta

**¿Qué pasa si el efecto no se limpia?** Predice antes: el host arranca dentro de `<StrictMode>`
(`inicio/host/src/bootstrap.js`). En desarrollo, StrictMode monta cada componente, lo desmonta y lo vuelve a
montar para destapar efectos mal hechos. Si quitas el `return` del efecto, ¿cuántas acciones llegarán por clic?

En `usePuenteSesion`, comenta la línea de la limpieza:

```jsx
  useEffect(() => {
    const alIniciar = (evento) => dispatch(sesionIniciada(evento.detail.usuario));
    window.addEventListener('acceso:sesion-iniciada', alIniciar);
    // return () => window.removeEventListener('acceso:sesion-iniciada', alIniciar);   ← experimento
  }, [dispatch]);
```

Recarga el puerto 3000 y pulsa **Entrar como Ana** una sola vez.

**Resultado esperado** en la **Consola**:

```text
[acceso] emite acceso:sesion-iniciada Ana
```

Y en la página:

```text
Host · sesión: Ana · acciones recibidas: 2
Acceso (remote)
Entrar como AnaEntrar como Luis
```

**Cómo se lee:** un evento, dos acciones. StrictMode ejecutó el efecto dos veces y, sin limpieza, quedaron dos
oyentes en `window`. En producción StrictMode no repite los efectos, pero el mismo fallo aparece cada vez que el
componente se desmonta y vuelve a montarse (al cambiar de ruta, por ejemplo): los oyentes se acumulan y cada
evento se procesa varias veces. Vuelve a poner el `return`.

## Reto

### 1 — Cerrar la sesión

**La situación:** el equipo de `acceso` quiere añadir un botón **Salir**. Propone emitir un segundo evento,
`acceso:sesion-cerrada`, sin `detail`. En el host, la cabecera tiene que volver a «sin sesión».

**Qué haces:**

1. En `inicio/acceso/src/Acceso.jsx`, añade el botón **Salir** que emita `acceso:sesion-cerrada`.
2. En `inicio/host/src/store.js`, añade la acción `sesionCerrada` que deje `usuario` en `null`.
3. En `usePuenteSesion`, escucha también el evento nuevo y despacha la acción.

**Pistas:** `new CustomEvent(nombre)` sin segundo argumento; un reducer más en `reducers`; dos
`addEventListener` en el mismo efecto, y la limpieza tiene que quitar los dos.

**Lo que buscas:** tras **Entrar como Ana** y **Salir**, la cabecera dice `sesión: sin sesión`; y con un solo clic
en **Salir**, `acciones recibidas` no cambia (cuenta solo inicios).

<details>
<summary>Ver solución</summary>

```jsx
// acceso/src/Acceso.jsx: el remote anuncia también el cierre
const salir = () => window.dispatchEvent(new CustomEvent('acceso:sesion-cerrada'));
// … junto a los otros botones …
<button onClick={salir}>Salir</button>
```

```js
// host/src/store.js: la acción nueva
reducers: {
  sesionIniciada(state, action) {
    state.usuario = action.payload;
    state.inicios += 1;
  },
  sesionCerrada(state) {
    state.usuario = null;
  },
},
// …
export const { sesionIniciada, sesionCerrada } = sesion.actions;
```

```jsx
// host/src/App.jsx: el puente escucha los dos eventos y limpia los dos
useEffect(() => {
  const alIniciar = (evento) => dispatch(sesionIniciada(evento.detail.usuario));
  const alCerrar = () => dispatch(sesionCerrada());
  window.addEventListener('acceso:sesion-iniciada', alIniciar);
  window.addEventListener('acceso:sesion-cerrada', alCerrar);
  return () => {
    window.removeEventListener('acceso:sesion-iniciada', alIniciar);
    window.removeEventListener('acceso:sesion-cerrada', alCerrar);
  };
}, [dispatch]);
```

Cada evento nuevo es una ampliación del contrato: el remote lo anuncia y el host decide si lo traduce a una
acción. Si te olvidas de limpiar el segundo oyente, StrictMode te lo enseña igual que en «Experimenta». **La
regla:** un evento global por cada hecho que ocurre en la microaplicación, con nombre prefijado; el puente del
host lo traduce y limpia todo lo que suscribe.

</details>

## Errores frecuentes

| Síntoma | Causa probable | Cómo arreglarlo |
|---------|----------------|-----------------|
| La **Consola** muestra `[acceso] emite …` pero el host sigue en «sin sesión» | No hay puente, o el nombre del evento no coincide letra a letra | Paso 3; copia el nombre `acceso:sesion-iniciada` del remote |
| `acciones recibidas` sube de dos en dos | El efecto no tiene función de limpieza y StrictMode lo ejecutó dos veces | Devuelve `() => window.removeEventListener(…)` |
| `could not find react-redux context value` en la **Consola** | `usePuenteSesion()` se llama en `App`, fuera del `<Provider>` | Llámalo en `Pagina` |
| `Cannot read properties of undefined (reading 'usuario')` | El evento llega sin `detail` | Emite siempre `{ detail: { usuario } }`, o comprueba `evento.detail` en el puente |

## Conclusiones

### Qué es un evento global como puente hacia el estado

Una microaplicación anuncia lo que ha pasado con un `CustomEvent` en `window`; el host lo escucha y lo traduce a
una acción de su store. El remote no depende del store ni de Redux; el store sigue cambiando solo por acciones.

```text
remote acceso                     window                         host
entrar('Ana')  ──► dispatchEvent('acceso:sesion-iniciada', {usuario})
                                    │
                                    └──► usePuenteSesion ──► dispatch(sesionIniciada('Ana')) ──► store
```

### Cómo debe ser

| Requisito | En el lab |
|-----------|-----------|
| Nombre de evento con prefijo de quien lo emite | `acceso:sesion-iniciada` |
| Datos en `detail`, con forma conocida | `{ usuario }` |
| Un solo puente, en el dueño del estado | `usePuenteSesion` en el host |
| El oyente se quita al desmontar | `return () => window.removeEventListener(…)` |
| El remote no conoce el store | `acceso` no importa Redux ni lo comparte |

### Dónde se rompe y cómo lo has detectado

| Fallo | Cómo lo has visto | Qué provoca |
|-------|-------------------|-------------|
| Nadie escucha | `[acceso] emite …` y `acciones recibidas: 0` (paso 1) | El evento se pierde sin error |
| Efecto sin limpieza | `acciones recibidas: 2` con un solo clic (Experimenta) | Oyentes acumulados, acciones repetidas |
| Cualquiera puede emitir | Evento lanzado desde la **Consola** (Investiga) | El host confía en datos que no ha validado |

### Cómo se perfecciona

- Reunir los nombres de evento y la forma de `detail` en un sitio documentado (un fichero de contratos o un
  paquete compartido de constantes), para que no se escriban a mano en dos repositorios.
- Validar `detail` en el puente antes de despachar.
- Si un remote se monta después de que el evento se haya emitido, el evento se pierde: para eso hace falta
  retener el último valor (se trabaja en [M06 — Último valor retenido](../M06-comunicacion/04-lab-ultimo-valor-retenido.md)).
- Cuando hay muchos eventos, un [bus de mensajes](../glosario/03-estado-comunicacion.md#bus-de-mensajes) pequeño con suscripción y baja ordena lo que aquí son
  `addEventListener` sueltos.

### En una frase

> 🔑 El remote anuncia un hecho con un `CustomEvent` y el host, dueño del estado, lo traduce a una acción en un
> efecto que siempre limpia su oyente.
