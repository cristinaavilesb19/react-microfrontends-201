# Lab — Un shell sin framework

[← Página anterior](02-lab-despliegue-independiente.md) · [Siguiente página →](04-lab-aislamiento-de-estilos.md)

En este laboratorio practicas la **carga bajo demanda y el [ciclo de vida](../glosario/04-integracion-despliegue.md#ciclo-de-vida)** de un [microfrontend](../glosario/01-arquitectura.md#microfrontend), sin React, sin
Webpack y sin librerías: solo JavaScript del navegador. El ejercicio es un [shell](../glosario/01-arquitectura.md#shell) con dos botones, **Catálogo** y
**Reloj**, y dos microfrontends que publican un [contrato](../glosario/01-arquitectura.md#contrato) `mount` y `unmount`. Hoy el shell descarga los dos al
arrancar y los apila uno encima de otro. Lo cambias para que cada uno llegue con `import()` cuando se pide y para
que el anterior se desmonte y limpie lo suyo.

### Objetivo

Comprender qué hace un shell de microfrontends: cómo carga código de otra parte en tiempo de ejecución, por qué
cada microfrontend tiene que poder desmontarse, cómo se detecta un desmontaje que no limpia y qué hace el shell
cuando un microfrontend no está disponible. Es el mecanismo que [single-spa](../glosario/04-integracion-despliegue.md#single-spa) y [Module Federation](../glosario/02-module-federation.md#module-federation) automatizan más
adelante en el curso.

### Punto de partida

- Carpeta: [`ejercicios/M01-03-shell-sin-framework/inicio/`](../../ejercicios/M01-03-shell-sin-framework/inicio/).
  La solución terminada está en [`solucion/`](../../ejercicios/M01-03-shell-sin-framework/solucion/).
- Estado: dependencias instaladas en la raíz del repositorio (el Codespace ejecuta `npm ci` al crearse). No hay
  nada que compilar: el navegador ejecuta los ficheros tal cual.
- Arranque y URL: `npm start` en `inicio/`, puerto **3000** (pestaña **Puertos** de VS Code, icono del globo;
  fuera de Codespaces, `http://localhost:3000`).
- Qué se ve al abrir: el título **Shell** y los botones **Catálogo** y **Reloj**.

Si quieres empezar de cero:

```bash
# Desde la raíz del repositorio: deja inicio/ como en el repositorio (ficha: ../comandos-lab.md#reiniciar)
bash scripts/reiniciar.sh M01-03-shell-sin-framework
```

Ficha: [`reiniciar.sh`](../comandos-lab.md#reiniciar).

### Qué está pasando

Un shell es la página que reparte el sitio entre microfrontends: decide cuál se ve, lo carga y lo quita. Para que
pueda hacerlo sin conocer su código, cada microfrontend publica un contrato mínimo:

```text
  shell ── import('/reloj/mfe.js') ──► módulo del microfrontend
        ── mount(contenedor) ────────► se pinta en el hueco que le dan
        ── unmount() ────────────────► se quita y para lo que dejó en marcha
```

| Pieza | En la realidad | En este laboratorio |
|-------|----------------|---------------------|
| Shell | La página principal, de un equipo de plataforma | `index.html` y `shell.js` |
| Microfrontend | Una parte de la interfaz, de otro equipo, publicada en su propia URL | `catalogo/mfe.js` y `reloj/mfe.js` |
| Contrato | Lo único que el shell sabe de cada microfrontend | `mount(contenedor)` y `unmount()` |
| Algo que limpiar | Temporizadores, conexiones, listeners en `window` | El `setInterval` del reloj |

Los tres se sirven desde el mismo servidor estático (`serve`), cada uno en su carpeta, como si los publicara un
equipo distinto en su ruta.

### 1 — Arranca y mira qué se descarga

Arranca el servidor estático en `inicio/` ([ficha de `npm start`](../comandos-lab.md#npm-start)).

```bash
# Entra en el punto de partida y sirve la carpeta en el puerto 3000 (Ctrl+C para pararlo)
cd /workspaces/react-microfrontends-201/ejercicios/M01-03-shell-sin-framework/inicio
npm start
```

**Resultado esperado:**

```text
   ┌──────────────────────────────────────────┐
   │                                          │
   │   Serving!                               │
   │                                          │
   │   - Local:    http://localhost:3000      │
   │   - Network:  http://10.181.73.90:3000   │
   │                                          │
   └──────────────────────────────────────────┘
```

Abre el puerto 3000 con **F12** → pestañas **Red** (Network) y **Consola** (Console), y recarga sin pulsar nada:

```text
Red      200  /shell.js
Red      200  /catalogo/mfe.js
Red      200  /reloj/mfe.js
── Texto de la página:
Shell
Catálogo Reloj
```

Los dos microfrontends se han descargado antes de que nadie los pida. Es lo que dice el principio de
`shell.js`:

```js
// shell.js (punto de partida)
// Imports estáticos: el navegador descarga los dos módulos antes de ejecutar el shell.
import * as catalogo from '/catalogo/mfe.js';
import * as reloj from '/reloj/mfe.js';
```

### 2 — Pulsa Reloj y después Catálogo

Pulsa **Reloj**, espera un par de segundos y pulsa **Catálogo**.

**Resultado esperado** (la hora cambia en cada ejecución):

```text
── Clic en Reloj
Consola  [reloj] mount
Consola  [reloj] tic
Consola  [reloj] tic
── Clic en Catálogo
Consola  [catalogo] mount
Consola  [reloj] tic
Consola  [reloj] tic
── Texto de la página:
Shell
Catálogo Reloj
Reloj

12:00:00

Catálogo
Mochila urbana
Botella térmica
```

| Qué ves | Qué significa |
|---------|---------------|
| Reloj y Catálogo a la vez en la página | El shell monta el nuevo sin quitar el anterior |
| `[reloj] tic` después de pulsar **Catálogo** | El temporizador del reloj sigue en marcha: nadie le ha pedido que pare |

### 3 — Lee el contrato del reloj

Antes de tocar el shell, mira qué ofrece un microfrontend. Abre `inicio/reloj/mfe.js`; no lo vas a cambiar:

```js
// reloj/mfe.js
let raiz = null;
let temporizador = null;

export function mount(contenedor) {
  raiz = document.createElement('section');
  contenedor.appendChild(raiz);
  const pintar = () => { raiz.innerHTML = `<h2>Reloj</h2><p>${new Date().toLocaleTimeString('es-ES')}</p>`; };
  pintar();
  // Lo que se registra fuera del DOM (un setInterval) solo se para si alguien llama a unmount.
  temporizador = setInterval(() => { pintar(); console.log('[reloj] tic'); }, 1000);
  console.log('[reloj] mount');
}

export function unmount() {
  clearInterval(temporizador);
  raiz?.remove();
  raiz = null;
  console.log('[reloj] unmount');
}
```

El reloj sabe montarse y desmontarse; el shell nunca llama a `unmount`. `catalogo/mfe.js` tiene la misma forma,
sin temporizador.

### 4 — Carga cada microfrontend cuando se pide

Sustituye `inicio/shell.js`. Los `import` estáticos desaparecen: `import()` es una función que devuelve una promesa
con el módulo y descarga el fichero la primera vez que se llama.

```js
// shell.js
// Shell sin framework: carga cada microfrontend al pedirlo.
const contenedor = document.getElementById('contenedor');

async function mostrar(nombre) {
  const modulo = await import(`/${nombre}/mfe.js`);   // se descarga la primera vez que se pide
  modulo.mount(contenedor);
}

for (const boton of document.querySelectorAll('[data-mfe]')) {
  boton.addEventListener('click', () => mostrar(boton.dataset.mfe));
}
```

Guarda (no hace falta reiniciar `serve`), recarga con la pestaña **Red** limpia y repite: **Reloj** y después
**Catálogo**.

**Resultado esperado:**

```text
Red      200  /shell.js
── Clic en Reloj
Red      200  /reloj/mfe.js
Consola  [reloj] mount
Consola  [reloj] tic
Consola  [reloj] tic
── Clic en Catálogo
Red      200  /catalogo/mfe.js
Consola  [catalogo] mount
Consola  [reloj] tic
── Texto de la página:
Shell
Catálogo Reloj
Reloj

12:00:00

Catálogo
Mochila urbana
Botella térmica
```

Ahora cada `mfe.js` llega al pulsar su botón. Pero el reloj sigue en pantalla y sigue haciendo `tic`: falta la
otra mitad del contrato.

### 5 — Desmonta el anterior antes de montar el siguiente

El shell tiene que recordar qué microfrontend está montado para llamar a su `unmount`. Sustituye otra vez
`inicio/shell.js`:

```js
// shell.js
// Shell sin framework: carga cada microfrontend al pedirlo y desmonta el anterior.
const contenedor = document.getElementById('contenedor');
let activo = null;   // { nombre, modulo } del microfrontend montado

async function mostrar(nombre) {
  if (activo?.nombre === nombre) return;           // ya está montado
  activo?.modulo.unmount();                        // el anterior se retira y limpia lo suyo
  const modulo = await import(`/${nombre}/mfe.js`); // se descarga la primera vez; después, de la caché de módulos
  modulo.mount(contenedor);
  activo = { nombre, modulo };
}

for (const boton of document.querySelectorAll('[data-mfe]')) {
  boton.addEventListener('click', () => mostrar(boton.dataset.mfe));
}
```

### 6 — Comprueba el ciclo completo

Recarga con **Red** y **Consola** limpias. Pulsa **Reloj**, espera dos segundos, pulsa **Catálogo** y vuelve a
pulsar **Reloj**.

**Resultado esperado** (la hora cambia en cada ejecución):

```text
Red      200  /shell.js
── Clic en Reloj
Red      200  /reloj/mfe.js
Consola  [reloj] mount
Consola  [reloj] tic
Consola  [reloj] tic
── Clic en Catálogo
Consola  [reloj] unmount
Red      200  /catalogo/mfe.js
Consola  [catalogo] mount
── Clic en Reloj otra vez
Consola  [catalogo] unmount
Consola  [reloj] mount
Consola  [reloj] tic
── Texto de la página:
Shell
Catálogo Reloj
Reloj

12:00:00
```

| Qué ves | Qué significa |
|---------|---------------|
| `[reloj] unmount` antes de cargar el catálogo | El shell retira al anterior antes de montar el siguiente |
| Ningún `tic` mientras se ve el catálogo | `unmount` ha parado el temporizador |
| Sin petición de red al volver a **Reloj** | El navegador guarda cada módulo ya importado: la segunda vez no se descarga |
| Un solo microfrontend en la página | El hueco `#contenedor` tiene siempre un dueño |

## Comprueba tu entendimiento

**El microfrontend no necesita al shell**
Abre `/reloj/` en el puerto 3000 (el `index.html` de la carpeta del reloj).
→ Se ve el reloj solo y la **Consola** muestra `[reloj] mount`: su equipo lo prueba sin levantar el shell.

**El shell no conoce el código de nadie**
Busca `setInterval` o `Mochila` en `shell.js`.
→ No aparecen: el shell solo sabe la ruta de cada `mfe.js` y las dos funciones del contrato.

**Pulsar dos veces el mismo botón**
Pulsa **Catálogo** dos veces seguidas.
→ Un solo `[catalogo] mount`: la primera línea de `mostrar` ignora el clic si ya está montado.

## Investiga

**¿Por qué el segundo clic en Reloj no descarga nada?** En la pestaña **Red**, el segundo clic no muestra
ninguna petición. Comprueba en la **Consola** si dos `import()` de la misma URL devuelven el mismo objeto:

```js
// En la Consola del shell: ¿el mismo módulo o dos copias?
(await import('/reloj/mfe.js')) === (await import('/reloj/mfe.js'))
```

**Resultado esperado:**

```text
true
```

El navegador ejecuta cada módulo una sola vez y guarda el resultado: todos los `import()` de esa URL reciben el
mismo objeto, con las mismas variables `raiz` y `temporizador`. Piensa qué implica eso si un microfrontend
guarda estado en el módulo y se monta, se desmonta y se vuelve a montar.

## Experimenta

**¿Qué pasa si `unmount` no limpia?** Predice antes: si en `reloj/mfe.js` comentas `clearInterval(temporizador);`,
¿seguirá el reloj haciendo `tic` sin que se vea, o pasará algo peor?

```js
// reloj/mfe.js — experimento: el desmontaje quita el DOM pero no el temporizador
export function unmount() {
  // clearInterval(temporizador);
  raiz?.remove();
  raiz = null;
  console.log('[reloj] unmount');
}
```

Recarga, pulsa **Reloj** y después **Catálogo**.

**Resultado esperado:**

```text
── Clic en Reloj
Consola  [reloj] mount
Consola  [reloj] tic
── Clic en Catálogo
Consola  [reloj] unmount
Consola  [catalogo] mount
Consola (error)  Uncaught TypeError: Cannot set properties of null (setting 'innerHTML')
Consola (error)  Uncaught TypeError: Cannot set properties of null (setting 'innerHTML')
── Texto de la página:
Shell
Catálogo Reloj
Catálogo
Mochila urbana
Botella térmica
```

El temporizador sigue vivo y, cada segundo, intenta pintar en un `raiz` que `unmount` ya ha puesto a `null`. La
página parece correcta, pero la **Consola** se llena de errores. En un microfrontend real el síntoma puede ser
peor y más silencioso: peticiones que se repiten o datos que se pisan. Vuelve a dejar `clearInterval`.

## Mejora

**Que un microfrontend caído no rompa el shell.** Añade a `inicio/index.html` un tercer botón para un
microfrontend que no existe:

```html
<!-- index.html: un microfrontend que todavía no está publicado -->
<button data-mfe="ofertas">Ofertas</button>
```

Recarga y pulsa **Catálogo**, **Ofertas** y **Reloj**.

**Resultado esperado** (sin la mejora):

```text
Consola  [catalogo] mount
── Clic en Ofertas
Consola  [catalogo] unmount
Consola (error)  Failed to load resource: the server responded with a status of 404 (Not Found)
Consola (error)  Uncaught (in promise) TypeError: Failed to fetch dynamically imported module: http://localhost:3000/ofertas/mfe.js
── Clic en Reloj
Consola  [catalogo] unmount
Consola  [reloj] mount
```

`[catalogo] unmount` sale dos veces: tras el fallo, `activo` sigue apuntando al catálogo, que ya estaba
desmontado. Corrígelo en `mostrar`: deja `activo` a `null` en cuanto desmontas y captura el error de `import()`.

```js
// shell.js — mostrar con manejo de errores
async function mostrar(nombre) {
  if (activo?.nombre === nombre) return;
  activo?.modulo.unmount();
  activo = null;
  contenedor.textContent = '';                       // borra el aviso de un fallo anterior
  try {
    const modulo = await import(`/${nombre}/mfe.js`);
    modulo.mount(contenedor);
    activo = { nombre, modulo };
  } catch (error) {
    // Un microfrontend que no carga no se lleva por delante al shell: se avisa en su hueco.
    contenedor.textContent = `«${nombre}» no está disponible ahora mismo.`;
    console.error('[shell] no se pudo cargar', nombre, '-', error.message);
  }
}
```

Repite **Catálogo**, **Ofertas** y **Reloj**: en el hueco aparece «ofertas» no está disponible ahora mismo., la
**Consola** muestra `[shell] no se pudo cargar ofertas - Failed to fetch dynamically imported module: …` y al pulsar
**Reloj** sale un solo `[reloj] mount`, sin el `unmount` repetido.

## Reto

### 1 — Un microfrontend nuevo sin tocar la lógica del shell

**La situación:** el equipo de ofertas publica su microfrontend en `/ofertas/mfe.js`. Quieres que dar de alta un
microfrontend sea añadir una línea, no tocar `mostrar`, y que las URL no estén construidas a mano dentro de la
función.

**Qué haces:** crea `inicio/ofertas/mfe.js` con el mismo contrato que `catalogo/mfe.js` (pinta «Ofertas» y
«20 % en mochilas»). En `shell.js`, añade un objeto `registro` que asocie cada nombre a su URL y haz que `mostrar`
lo use. Añade el botón **Ofertas** al HTML si no lo tienes.

**Pistas:** un objeto `{ nombre: 'url' }`; `import()` acepta cualquier expresión que dé una URL.

**Lo que buscas:** al pulsar **Ofertas**, la pestaña **Red** muestra `/ofertas/mfe.js`, la **Consola**
`[ofertas] mount` y la página «Ofertas · 20 % en mochilas», sin haber cambiado el cuerpo de `mostrar` salva la
línea del `import()`.

<details>
<summary>Ver solución</summary>

```js
// shell.js — el registro es la única lista de microfrontends que conoce el shell
const registro = {
  catalogo: '/catalogo/mfe.js',
  reloj: '/reloj/mfe.js',
  ofertas: '/ofertas/mfe.js',
};

// … y dentro de mostrar:
const modulo = await import(registro[nombre]);
```

```js
// ofertas/mfe.js — el mismo contrato que los demás
let raiz = null;

export function mount(contenedor) {
  raiz = document.createElement('section');
  raiz.innerHTML = '<h2>Ofertas</h2><p>20 % en mochilas</p>';
  contenedor.appendChild(raiz);
  console.log('[ofertas] mount');
}

export function unmount() {
  raiz?.remove();
  raiz = null;
  console.log('[ofertas] unmount');
}
```

```text
Red      200  /shell.js
── Clic en Ofertas
Red      200  /ofertas/mfe.js
Consola  [ofertas] mount
── Texto de la página:
Shell
Catálogo Reloj Ofertas
Ofertas

20 % en mochilas
```

El registro es un manifiesto: si se sacara a un fichero JSON, el shell podría dar de alta microfrontends sin
publicarse de nuevo. Es lo que hacen los [import maps](../glosario/01-arquitectura.md#import-map), que verás en
[05 — Cinco integraciones](05-cinco-integraciones.md), y los remotos dinámicos de Module Federation (M03).
**La regla:** el shell conoce nombres y direcciones; el código de cada microfrontend lo descubre en tiempo de
ejecución.

</details>

## Errores frecuentes

| Síntoma | Causa probable | Cómo arreglarlo |
|---------|----------------|-----------------|
| `Failed to fetch dynamically imported module` | La URL del `import()` no existe o el microfrontend no está publicado | Comprueba la ruta en la pestaña **Red** (404) y el nombre de la carpeta |
| `Cannot use import statement outside a module` | Falta `type="module"` en el `<script>` del shell | `<script type="module" src="./shell.js">` |
| Dos microfrontends apilados en la página | El shell no llama a `unmount` del anterior | Guarda el activo y llama a su `unmount` antes de montar otro |
| `[reloj] tic` con el reloj fuera de la pantalla | `unmount` no para el temporizador | `clearInterval` en `unmount` |
| `Error: listen EADDRINUSE: address already in use :::3000` | Otro ejercicio sigue en marcha | Páralo con **Ctrl+C** o libera el puerto (ver [ficha](../comandos-lab.md#npm-start)) |

```bash
# Libera el puerto 3000 si otro ejercicio lo ocupa
fuser -k 3000/tcp
```

## Conclusiones

### Qué es un shell de microfrontends

La página que decide qué microfrontend ocupa cada hueco y cuándo. No conoce su código: lo carga en tiempo de
ejecución por su URL y lo maneja a través de un contrato.

```text
  clic ──► mostrar(nombre)
             ├─ activo.unmount()          el anterior se quita y limpia
             ├─ import('/nombre/mfe.js')   1.ª vez: red · después: caché de módulos
             └─ modulo.mount(contenedor)   el nuevo se pinta en el hueco
```

### Cómo debe ser

| Requisito | En el lab |
|-----------|-----------|
| Cada microfrontend se carga cuando se necesita | `import()` dentro de `mostrar`, no `import` al principio |
| Un solo microfrontend por hueco | `activo` y `unmount` antes de `mount` |
| `unmount` deshace todo lo que hizo `mount` | `clearInterval` y `raiz.remove()` |
| El shell sobrevive a un microfrontend caído | `try`/`catch` alrededor del `import()` |
| El microfrontend funciona solo | `/reloj/` monta el reloj sin shell |

### Dónde se rompe y cómo lo has detectado

| Fallo | Cómo lo has visto | Qué provoca |
|-------|-------------------|-------------|
| Imports estáticos | Los dos `mfe.js` en **Red** sin pulsar nada | Se paga la descarga de todo al abrir |
| Sin `unmount` | Dos microfrontends en la página y `tic` del reloj oculto | Interfaz incoherente y trabajo en segundo plano |
| `unmount` que no limpia | `Cannot set properties of null` cada segundo | Errores y fugas que la pantalla no enseña |
| Microfrontend no publicado | `Failed to fetch dynamically imported module` | Sin control, un `unmount` repetido y un hueco vacío |

### Cómo se perfecciona

Lo que has escrito a mano es lo que automatizan las librerías: single-spa registra cada microfrontend con una
condición de ruta y gestiona `bootstrap`, `mount` y `unmount` (M05). Module Federation sustituye la URL suelta
por un contenedor con [dependencias compartidas](../glosario/02-module-federation.md#shared) (M03). En [05 — Cinco integraciones](05-cinco-integraciones.md)
ves estos mismos microfrontends con cada una de esas técnicas.

### En una frase

> 🔑 Un shell carga cada microfrontend con `import()` cuando hace falta y respeta su contrato: monta el nuevo
> solo después de que el anterior se haya desmontado y limpiado.
