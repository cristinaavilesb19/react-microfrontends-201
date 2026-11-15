# Lab — Props entre microaplicaciones

[← Página anterior](00-canales-de-comunicacion.md) · [Siguiente página →](02-lab-contexto-compartido.md)

En este laboratorio practicas las **props como [contrato](../glosario/01-arquitectura.md#contrato) entre un [host](../glosario/02-module-federation.md#host) y un [remote](../glosario/02-module-federation.md#remote)**. El ejercicio es un remote
`perfil` que pinta el nombre y el correo del usuario con un botón **Cerrar sesión**. Al principio lee el
usuario de una variable global en `window`; lo cambias para que lo reciba por props y avise al host con un
callback.

### Objetivo

Comprender qué son las props como contrato entre [microaplicaciones](../glosario/01-arquitectura.md#microaplicacion): cómo funcionan, cómo debe ser ese contrato,
cómo se detecta cuándo se rompe y cómo se mejora.

### Punto de partida

- Carpeta: [`ejercicios/M06-01-props-entre-microaplicaciones/inicio`](../../ejercicios/M06-01-props-entre-microaplicaciones/inicio/)
  con dos aplicaciones: `host` (puerto 3000) y `perfil`, el remote (puerto 3001).
- La solución terminada está en
  [`…/solucion`](../../ejercicios/M06-01-props-entre-microaplicaciones/solucion/).
- Dependencias instaladas en la raíz del repositorio (el Codespace lo hace al crearse).
- Si ya tocaste este ejercicio y quieres empezar de cero:

```bash
# Deja inicio/ como está en el repositorio
bash scripts/reiniciar.sh M06-01-props-entre-microaplicaciones
```

Ficha: [`reiniciar.sh`](../comandos-lab.md#reiniciar). El navegador solo habla con el host: el remote se pide
en `/mf/perfil/` y el servidor del host lo reenvía al puerto 3001.

### Qué está pasando

Cuando un host pinta un remote dentro de su árbol de React, la forma más directa de darle datos es la misma que
entre dos componentes cualesquiera: **props hacia abajo y callbacks hacia arriba**. El host es el dueño del dato
(quién tiene la sesión abierta); el remote lo muestra y, cuando el usuario hace algo, avisa llamando a una
función que el host le ha pasado. El remote no sabe de dónde sale el dato ni qué hará el host con el aviso.

Esa lista de props es un **contrato**: el equipo del remote publica «recibo `usuario` y `onCerrarSesion`» y el
equipo del host se compromete a pasarlos. En un proyecto real cada equipo despliega por su cuenta, así que el
contrato es lo único que los une.

El punto de partida hace lo que se ve a menudo cuando no hay contrato: dejar el dato en `window` y que el remote
lo lea de ahí. Funciona la primera vez, pero React no sabe que esa variable existe: si cambia, nadie repinta.

| Pieza | Qué representa |
|-------|----------------|
| `host/src/App.jsx` | La aplicación contenedora, dueña de la sesión |
| `perfil/src/Perfil.jsx` | El componente expuesto por el remote (`perfil/Perfil`) |
| `perfil/src/App.jsx` | El remote abierto solo, en su puerto, para desarrollarlo sin host |

### 1 — Arranca el punto de partida

Pon en marcha las dos aplicaciones para ver cómo se comporta la versión con la variable global.

```bash
# Entra en el inicio del laboratorio y arranca host y perfil a la vez
cd /workspaces/react-microfrontends-201/ejercicios/M06-01-props-entre-microaplicaciones/inicio
npm start
```

Ficha: [`npm start`](../comandos-lab.md#npm-start).

**Resultado esperado** (el orden de las líneas puede variar):

```text
> concurrently -n perfil,host "npm start --prefix perfil" "npm start --prefix host"
[perfil] webpack 5.112.2 compiled successfully
[perfil] <i> [webpack-dev-server] Loopback: http://localhost:3001/, http://[::1]:3001/
[host] webpack 5.112.2 compiled successfully
[host] <i> [webpack-dev-server] Loopback: http://localhost:3000/, http://[::1]:3000/
```

Una línea `compiled successfully` por aplicación: las dos están sirviendo.

### 2 — Mira cómo llega hoy el usuario

Antes de abrir la página, lee el código para saber qué esperar. El host deja el usuario en `window` antes de
pintar ([`inicio/host/src/App.jsx`](../../ejercicios/M06-01-props-entre-microaplicaciones/inicio/host/src/App.jsx)):

```jsx
import Perfil from 'perfil/Perfil';

// El host deja el usuario en una global antes de pintar el remote.
window.usuarioActual = { nombre: 'Ana López', email: 'ana@example.com' };

export default function App() {
  return (
    <main>
      <h1>Host · sesión: {window.usuarioActual ? window.usuarioActual.nombre : 'cerrada'}</h1>
      <Perfil />{/* sin props: el remote tendrá que buscar el dato por su cuenta */}
    </main>
  );
}
```

Y el remote la lee ([`inicio/perfil/src/Perfil.jsx`](../../ejercicios/M06-01-props-entre-microaplicaciones/inicio/perfil/src/Perfil.jsx)):

```jsx
// El remote lee una variable global que alguien debería haber dejado en window.
export default function Perfil() {
  const usuario = window.usuarioActual;
  if (!usuario) return <p>Perfil: sin datos</p>;
  return (
    <section>
      <h2>Perfil (remote)</h2>
      <p>{usuario.nombre} · {usuario.email}</p>
      {/* Cerrar sesión = borrar la global; React no se entera */}
      <button onClick={() => { window.usuarioActual = null; }}>Cerrar sesión</button>
    </section>
  );
}
```

Nada en el código del host dice que `Perfil` necesite `usuarioActual`: el contrato existe, pero está escondido.

### 3 — Pulsa «Cerrar sesión» y pregunta a la global

Abre el host (pestaña **Puertos**, puerto **3000**, icono del globo) con **F12** abierto en la pestaña **Red**.
Pulsa **Cerrar sesión** y, en la pestaña **Consola**, escribe:

```js
// Valor actual de la global que comparten host y remote
"window.usuarioActual = " + JSON.stringify(window.usuarioActual)
```

**Resultado esperado** (algunos nombres de fichero llevan un fragmento que puede cambiar):

```text
Red      200  /main.js
Red      200  /src_bootstrap_js-webpack_sharing_consume_default_react-dom_react-dom-webpack_sharing_consume_-f8f6f9.js
Red      200  /mf/perfil/remoteEntry.js
Red      200  /vendors-node_modules_react-dom_client_js-node_modules_react_jsx-dev-runtime_js.js
Red      200  /mf/perfil/vendors-node_modules_react_index_js.js
Red      200  /mf/perfil/src_Perfil_jsx.js
Red      200  /mf/perfil/vendors-node_modules_react_jsx-dev-runtime_js.js
Red      200  /mf/perfil/vendors-node_modules_react-dom_index_js.js
── Clic
── En la Consola:
window.usuarioActual = null
── Texto de la página:
Host · sesión: Ana López
Perfil (remote)

Ana López · ana@example.com

Cerrar sesión
```

| Qué ves | Qué significa |
|---------|---------------|
| `/mf/perfil/remoteEntry.js` en **Red** | El host pide el remote por su propio origen y el proxy lo reenvía al 3001 |
| `window.usuarioActual = null` | El clic sí ha cerrado la sesión en la variable |
| La página sigue diciendo `Ana López` | Ni host ni remote se repintan: la global no es estado de React |

### 4 — Escribe el contrato en el remote

Haz que el remote declare lo que necesita: recibe el usuario y una función para avisar de que se cierra la
sesión. Sustituye el contenido de `inicio/perfil/src/Perfil.jsx`:

```jsx
// Contrato del remote: qué recibe (usuario) y a quién avisa (onCerrarSesion).
export default function Perfil({ usuario, onCerrarSesion }) {
  if (!usuario) return <p>Perfil: sin datos</p>;
  return (
    <section>
      <h2>Perfil (remote)</h2>
      <p>{usuario.nombre} · {usuario.email}</p>
      {/* El remote no cierra nada: avisa al dueño del dato */}
      <button onClick={onCerrarSesion}>Cerrar sesión</button>
    </section>
  );
}
```

El remote ya no toca `window`: si quiere que algo cambie, llama al callback.

### 5 — Dale datos de ejemplo al remote abierto solo

El remote también se abre en su puerto para desarrollarlo sin host. Ahí no hay nadie que le pase props, así que
su `App` se las inventa. Sustituye `inicio/perfil/src/App.jsx`:

```jsx
import Perfil from './Perfil';

// Abierta sola: datos de ejemplo por props.
export default function App() {
  return <Perfil usuario={{ nombre: 'Prueba', email: 'prueba@example.com' }} onCerrarSesion={() => console.log('cerrar')} />;
}
```

### 6 — Haz que el host sea el dueño del dato

El host guarda el usuario en su estado, se lo pasa al remote y le da la función que lo borra. Sustituye
`inicio/host/src/App.jsx` (desaparece la línea de `window.usuarioActual`):

```jsx
import { useState } from 'react';
import Perfil from 'perfil/Perfil';

// El host es el dueño del dato: lo pasa hacia abajo y recibe el aviso hacia arriba.
export default function App() {
  const [usuario, setUsuario] = useState({ nombre: 'Ana López', email: 'ana@example.com' });
  return (
    <main>
      <h1>Host · sesión: {usuario ? usuario.nombre : 'cerrada'}</h1>
      {/* Las dos props del contrato: el dato y el callback */}
      <Perfil usuario={usuario} onCerrarSesion={() => setUsuario(null)} />
    </main>
  );
}
```

### 7 — Comprueba que el aviso sube y la pantalla cambia

Con `npm start` en marcha, Webpack recompila al guardar. Recarga el host (puerto 3000) y pulsa **Cerrar sesión**.

**Resultado esperado** (texto antes del clic y después):

```text
── Texto de la página (antes del clic):
Host · sesión: Ana López
Perfil (remote)

Ana López · ana@example.com

Cerrar sesión
── Clic
── Texto de la página:
Host · sesión: cerrada

Perfil: sin datos
```

El clic en el remote llama a `onCerrarSesion`, el host cambia su estado y React repinta a los dos: la cabecera
del host dice `cerrada` y el remote, que ya recibe `usuario = null`, muestra `Perfil: sin datos`.

### 8 — Abre el remote solo

Abre el puerto **3001** (el remote sin host) con la **Consola** abierta y pulsa **Cerrar sesión**.

**Resultado esperado:**

```text
Red      200  /main.js
Red      200  /remoteEntry.js
Red      200  /vendors-node_modules_react_jsx-dev-runtime_js.js
Red      200  /vendors-node_modules_react_index_js.js
Red      200  /src_bootstrap_js-webpack_sharing_consume_default_react-dom_react-dom.js
Red      200  /vendors-node_modules_react-dom_index_js.js
Red      200  /vendors-node_modules_react-dom_client_js.js
── Clic
Consola  cerrar
── Texto de la página:
Perfil (remote)

Prueba · prueba@example.com

Cerrar sesión
```

El remote pinta los datos de ejemplo y el callback de ejemplo escribe `cerrar` en la **Consola**. La página no
cambia porque ese `App` no guarda estado: solo demuestra que el remote cumple su parte del contrato sin host.

## Comprueba tu entendimiento

**El dato tiene un solo dueño**
Busca `usuarioActual` en el código del inicio:

```bash
# Busca la global en el código de host y perfil (desde la raíz del repositorio)
grep -rn usuarioActual ejercicios/M06-01-props-entre-microaplicaciones/inicio/*/src
```

→ No aparece: el usuario vive en el `useState` del host y viaja por la prop `usuario`.

**El aviso sube por el callback**
En el host, pulsa **Cerrar sesión**.
→ La cabecera pasa a `Host · sesión: cerrada` y el remote a `Perfil: sin datos`.

**El remote se desarrolla solo**
Abre el puerto 3001 y pulsa **Cerrar sesión**.
→ La **Consola** muestra `cerrar`: el remote llama a lo que le pasen, sin saber quién es.

## Experimenta

Un contrato de props solo existe en la cabeza de dos equipos. Rómpelo como lo rompería un despiste.

**Predice antes:** en `inicio/host/src/App.jsx`, cambia `usuario={usuario}` por `user={usuario}`. ¿Saldrá un
error en la **Consola**, una pantalla en blanco o algo peor?

```jsx
{/* Experimento: el host usa otro nombre de prop */}
<Perfil user={usuario} onCerrarSesion={() => setUsuario(null)} />
```

**Resultado esperado** (recarga el host):

```text
── Texto de la página:
Host · sesión: Ana López

Perfil: sin datos
```

El host cree que hay sesión y el remote dice que no hay datos. No hay ningún error: React pasa la prop `user`
sin quejarse, y el remote recibe `usuario = undefined`, el mismo caso que «sesión cerrada». El contrato se ha
roto **en silencio**. Vuelve a dejar `usuario={usuario}`.

## Mejora

Haz que el remote detecte y diga en voz alta que le llegan props que no conoce, y que tenga valores por defecto
para lo que es opcional. En `inicio/perfil/src/Perfil.jsx`:

```jsx
// Contrato del remote, con valores por defecto y aviso de props desconocidas.
export default function Perfil({ usuario = null, onCerrarSesion = () => {}, ...resto }) {
  const desconocidas = Object.keys(resto);
  // Una prop que el remote no espera suele ser un nombre mal escrito en el host
  if (desconocidas.length) console.warn('[perfil] props desconocidas:', desconocidas.join(', '));
  if (!usuario) return <p>Perfil: sin datos</p>;
  return (
    <section>
      <h2>Perfil (remote)</h2>
      <p>{usuario.nombre} · {usuario.email}</p>
      <button onClick={onCerrarSesion}>Cerrar sesión</button>
    </section>
  );
}
```

Repite el experimento de `user={usuario}` y mira la **Consola**.

**Resultado esperado:**

```text
Consola (aviso)  [perfil] props desconocidas: user
── Texto de la página:
Host · sesión: Ana López
Perfil: sin datos
```

La página sigue igual de mal, pero ahora el fallo deja rastro y nombra la prop equivocada.

> [!NOTE]
> En React 19 los componentes de función ya no comprueban `propTypes` ni usan `defaultProps`: los valores por
> defecto van en la desestructuración, como arriba. La forma habitual de blindar el contrato en un proyecto real
> es **TypeScript**: el remote publica el tipo de sus props y el host no compila si pasa `user`. Este curso usa
> JavaScript, así que solo se menciona.

## Reto

### 1 — Volver a entrar desde el host

**La situación:** el host es el dueño de la sesión. Un compañero propone que, cuando la sesión esté cerrada, el
propio remote muestre un botón «Entrar» que vuelva a escribir el usuario en `window`.

**Qué haces:** en lugar de eso, añade en `inicio/host/src/App.jsx` un botón **Volver a entrar**, visible solo con
la sesión cerrada, que restaure a Ana López. No toques `perfil`.

**Pistas:** el `setUsuario` que ya tienes; un render condicional `{!usuario && <button …>}`.

**Lo que buscas:** cerrar sesión desde el remote y volver a entrar desde el host, y que el remote se repinte las
dos veces sin haber cambiado una línea de su código.

<details>
<summary>Ver solución</summary>

```jsx
import { useState } from 'react';
import Perfil from 'perfil/Perfil';

const ANA = { nombre: 'Ana López', email: 'ana@example.com' };

export default function App() {
  const [usuario, setUsuario] = useState(ANA);
  return (
    <main>
      <h1>Host · sesión: {usuario ? usuario.nombre : 'cerrada'}</h1>
      {/* Solo el dueño del dato decide volver a abrir la sesión */}
      {!usuario && <button onClick={() => setUsuario(ANA)}>Volver a entrar</button>}
      <Perfil usuario={usuario} onCerrarSesion={() => setUsuario(null)} />
    </main>
  );
}
```

Al pulsar **Cerrar sesión** aparece **Volver a entrar** y el remote dice `Perfil: sin datos`; al pulsarlo, el
remote vuelve a pintar a Ana López. El remote no ha cambiado: solo recibe otra prop. **La regla:** el dato lo
cambia su dueño; quien lo muestra, avisa.

</details>

## Errores frecuentes

| Síntoma | Causa probable | Cómo arreglarlo |
|---------|----------------|-----------------|
| Pulsas **Cerrar sesión** y no cambia nada | El dato sigue en `window`, fuera del estado de React | Guarda el usuario en un `useState` del host y pásalo por props |
| `Perfil: sin datos` con la sesión abierta | La prop tiene otro nombre en el host (`user`, `usuarioActual`…) | Usa exactamente los nombres del contrato del remote |
| En el host, **Cerrar sesión** no hace nada y no hay error | El host no pasa `onCerrarSesion`: `onClick={undefined}` no falla, simplemente no llama a nadie | Pasa el callback; el aviso de la sección «Mejora» ayuda a verlo |
| `Error: listen EADDRINUSE: address already in use :::3000` | Otro ejercicio sigue en marcha | Para el otro con `Ctrl+C` o libera los puertos (abajo) |

```bash
# Libera los puertos de los ejercicios
fuser -k 3000/tcp 3001/tcp 3002/tcp 3003/tcp
```

## Conclusiones

### Qué son las props como contrato

Es la lista de valores y funciones que un remote declara que recibe. El host, que lo contiene, es el dueño del
dato y se lo pasa hacia abajo; el remote avisa hacia arriba llamando a un callback.

```text
host  ── usuario ───────────▶  perfil (remote)
      ◀── onCerrarSesion() ──
```

### Cómo debe ser

| Requisito | En el lab |
|-----------|-----------|
| Un único dueño del dato, con estado de React | `useState` en el host |
| El remote declara lo que recibe | `Perfil({ usuario, onCerrarSesion })` |
| Los cambios suben por callback, no tocando nada compartido | `onClick={onCerrarSesion}` |
| El remote funciona solo con datos de ejemplo | `perfil/src/App.jsx` en el puerto 3001, `cerrar` en la **Consola** |

### Dónde se rompe y cómo lo has detectado

| Fallo | Cómo lo has visto | Qué provoca |
|-------|-------------------|-------------|
| Dato en una global de `window` | `window.usuarioActual = null` y la página sigue con Ana López | Pantalla desincronizada del dato |
| Nombre de prop distinto | `user=` en el host → `Perfil: sin datos`, sin errores | Contrato roto en silencio |

### Cómo se perfecciona

Valores por defecto para lo opcional, un aviso en **Consola** para props desconocidas o que faltan y, en un
proyecto real, los tipos de las props publicados por el remote en TypeScript, para que el error salga al
compilar el host y no en producción.

### En una frase

> 🔑 Las props funcionan entre microaplicaciones igual que entre componentes, pero el contrato lo comparten dos
> equipos que despliegan por separado: escríbelo y compruébalo, porque romperlo no da ningún error.
