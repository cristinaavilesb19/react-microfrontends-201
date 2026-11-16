# Lab — Estructura de una microaplicación

[← Página anterior](01-lab-fronteras-entre-modulos.md) · [Siguiente página →](03-lab-enrutamiento-compartido.md)

En este laboratorio practicas la **[microaplicación](../glosario/01-arquitectura.md#microaplicacion) autónoma**: una aplicación React que no decide dónde se
pinta, sino que ofrece una función `mount(elemento, props)` que devuelve cómo desmontarla. El ejercicio es una
lista de notas que hoy solo sabe montarse en el `#root` de su propia página. La conviertes en una microaplicación
que arranca sola (**modo aislado**) y que una página HTML ajena, sin React, monta y desmonta (**modo integrado**).

### Objetivo

Comprender qué hace autónoma a una microaplicación: cómo funciona un [contrato](../glosario/01-arquitectura.md#contrato) `mount`/`unmount`, cómo debe ser
para que cualquier contenedor la use, cómo se comprueba que monta y desmonta de verdad y qué le falta para usarse
en producción.

### Punto de partida

- Carpeta: [`ejercicios/M02-02-estructura-microaplicacion/inicio/`](../../ejercicios/M02-02-estructura-microaplicacion/inicio/).
  La solución terminada está en [`solucion/`](../../ejercicios/M02-02-estructura-microaplicacion/solucion/).
- Estado: dependencias instaladas en la raíz del repositorio (el Codespace ejecuta `npm ci` al crearse).
- Arranque y URL: `npm start` en `inicio/`, puerto **3000** (pestaña **Puertos** de VS Code, icono del globo;
  fuera de Codespaces, `http://localhost:3000`).
- Qué se ve al abrir: un recuadro **Notas** con un campo de texto, el botón **Añadir** y la nota «Comprar pan».

Si quieres empezar de cero:

```bash
# Desde la raíz del repositorio: deja inicio/ como en el repositorio (ficha: ../comandos-lab.md#reiniciar)
bash scripts/reiniciar.sh M02-02-estructura-microaplicacion
```

Ficha: [`reiniciar.sh`](../comandos-lab.md#reiniciar).

### Qué está pasando

Una aplicación React normal se monta a sí misma: `index.js` busca `#root` y llama a `createRoot(...).render(...)`.
Eso solo sirve en su propia página. Para que otro (un contenedor, un [shell](../glosario/01-arquitectura.md#shell), [single-spa](../glosario/04-integracion-despliegue.md#single-spa)) la pueda colocar donde
quiera, la microaplicación tiene que darle la vuelta a esa responsabilidad:

```text
          modo aislado                              modo integrado
  index.html de la microaplicación          página contenedora (cualquier tecnología)
  ┌──────────────┐                          ┌───────────────────────────────┐
  │ <div id=root>│ ◄── mount(root)          │ <div id=hueco> ◄── window.notas.mount(hueco, props)
  └──────────────┘    (index.js)            │                    devuelve → unmount()
                                            └───────────────────────────────┘
```

| Pieza | Qué es | En este laboratorio |
|-------|--------|---------------------|
| `mount(elemento, props)` | El contrato público: pinta la microaplicación en el elemento que le den, con los datos que le den | `src/mount.js` |
| Función de desmontaje | Lo que devuelve `mount`: quita la aplicación y libera lo que tenía en marcha | `root.unmount()` y un mensaje en la **Consola** |
| Modo aislado | La microaplicación arranca sola en su página, para desarrollarla y probarla sin el resto | `index.js`: si hay `#root`, se monta |
| Publicación del contrato | Cómo encuentra el contenedor a `mount` | `output.library` de Webpack: `window.notas` |
| Contenedor | Quien decide cuándo y dónde se monta | `public/contenedor.html`, HTML sin React |

Aquí el contenedor carga el bundle con una etiqueta `<script>` y lee `window.notas`. En el módulo siguiente,
[Module Federation](../glosario/02-module-federation.md#module-federation) sustituirá esa variable global por un mecanismo de carga entre aplicaciones, pero el contrato
`mount`/`unmount` seguirá siendo el mismo.

### 1 — Arranca la versión que solo vive en su página

Arranca `inicio/` y fíjate en cómo se carga.

```bash
# Desde la raíz del repositorio
cd ejercicios/M02-02-estructura-microaplicacion/inicio
# Arranca en el puerto 3000 (ficha: ../comandos-lab.md#npm-start)
npm start
```

Ficha: [`npm start`](../comandos-lab.md#npm-start).

**Resultado esperado** en la terminal:

```text
webpack 5.112.2 compiled successfully
<i> [webpack-dev-server] Loopback: http://localhost:3000/, http://[::1]:3000/
```

Abre el puerto 3000 con **F12** → pestaña **Red** (Network):

```text
Red      200  /main.js
── Texto de la página:
Notas
Añadir
Comprar pan
```

Ahora abre `src/index.js`. Es la fuente del problema:

```js
import { createRoot } from 'react-dom/client';
import Notas from './Notas';

// Se monta siempre en #root: solo funciona en su propia página.
createRoot(document.getElementById('root')).render(<Notas />);
```

El bundle se llama `main.js`, no expone nada y al cargarse busca `#root`. Una página que no tenga `#root`, o que
quiera montar las notas en otro sitio y quitarlas después, no puede usarlo.

### 2 — Escribe el contrato `mount`

Crea `src/mount.js`. Recibe el elemento y las props, crea la raíz de React allí y devuelve una función que la
desmonta. Los dos `console.log` te dejan ver en la **Consola** cuándo ocurre cada cosa.

```jsx
import { createRoot } from 'react-dom/client';
import Notas from './Notas';

// mount(elemento, props): pinta la microaplicación donde le digan y devuelve cómo quitarla.
export function mount(elemento, props = {}) {
  const root = createRoot(elemento);
  root.render(<Notas {...props} />);
  console.log('[notas] montada');
  return () => {
    root.unmount();
    console.log('[notas] desmontada');
  };
}
```

`Notas.jsx` no cambia: ya acepta la prop `titulo` (con `'Notas'` por defecto). `mount` le pasa las props tal
cual, así que el contenedor podrá cambiar el título sin tocar la microaplicación.

### 3 — Separa el modo aislado del contrato

Sustituye el contenido de `src/index.js`. Ya no monta a ciegas: solo se monta sola si su página tiene `#root`, y
exporta `mount` para quien la integre.

```js
import { mount } from './mount';

// Modo aislado: si la página tiene #root, la microaplicación se monta sola.
const raiz = document.getElementById('root');
if (raiz) mount(raiz);

// Contrato público: lo que ve quien la integra.
export { mount };
```

### 4 — Publica el contrato en `window.notas`

El `export` de `index.js` no le sirve a una página que carga el bundle con `<script>`: necesita encontrar
`mount` en algún sitio. En `webpack.config.js`, cambia la línea de `output` para que el fichero se llame
`notas.js` y deje lo que exporta `index.js` en la variable global `window.notas`:

```js
  // El bundle se publica como notas.js y deja su contrato en window.notas.
  output: { publicPath: 'auto', clean: true, filename: 'notas.js', library: { name: 'notas', type: 'window' } },
```

| Opción | Qué hace |
|--------|----------|
| `filename: 'notas.js'` | Nombre estable del bundle, para que el contenedor sepa qué pedir |
| `library.name: 'notas'` | Nombre de la variable donde queda el contrato |
| `library.type: 'window'` | La variable se crea en `window`: `window.notas.mount` |

### 5 — Crea la página contenedora

Crea `public/contenedor.html`. Es una página ajena a la microaplicación: HTML y un poco de JavaScript, sin React.
Carga `notas.js`, y dos botones llaman al contrato. El servidor de desarrollo sirve los ficheros de `public/`,
así que estará en `/contenedor.html`.

```html
<!doctype html>
<html lang="es">
  <head><meta charset="utf-8" /><link rel="icon" href="data:," /><title>Contenedor</title></head>
  <body>
    <h1>Página contenedora (HTML sin React)</h1>
    <button id="montar">Montar notas</button>
    <button id="desmontar">Desmontar notas</button>
    <div id="hueco"></div>
    <script src="/notas.js"></script>
    <script>
      // La página solo conoce el contrato: window.notas.mount(elemento, props) devuelve unmount.
      let desmontar = null;
      document.getElementById('montar').onclick = () => {
        if (!desmontar) desmontar = window.notas.mount(document.getElementById('hueco'), { titulo: 'Notas del contenedor' });
      };
      document.getElementById('desmontar').onclick = () => {
        if (desmontar) { desmontar(); desmontar = null; }
      };
    </script>
  </body>
</html>
```

La página no sabe nada de React ni de cómo están hechas las notas. Solo sabe que `mount` existe, qué props
acepta y que lo que devuelve sirve para quitarla. La comprobación `if (!desmontar)` evita montar dos veces en el
mismo hueco.

### 6 — Reinicia y comprueba el modo aislado

Has cambiado `webpack.config.js`, que el servidor solo lee al arrancar. Páralo con `Ctrl+C` y arráncalo otra vez.

```bash
# En inicio/: vuelve a arrancar para que lea la nueva configuración de output
npm start
```

**Resultado esperado** en la terminal:

```text
webpack 5.112.2 compiled successfully
<i> [webpack-dev-server] Loopback: http://localhost:3000/, http://[::1]:3000/
```

Recarga el puerto 3000 con **F12** abierto (pestañas **Red** y **Consola**):

```text
Red      200  /notas.js
Consola  [notas] montada
── Texto de la página:
Notas
Añadir
Comprar pan
```

La página se ve igual, pero ahora el fichero es `notas.js` y la **Consola** dice `[notas] montada`: `index.js`
ha encontrado `#root` y ha llamado a `mount`. Es el modo aislado.

### 7 — Móntala desde la página contenedora

Abre `/contenedor.html` en el mismo puerto (añade `/contenedor.html` a la URL). Pulsa **Montar notas**, después
**Desmontar notas** y otra vez **Montar notas**, mirando la **Consola**.

**Resultado esperado:**

```text
Red      200  /notas.js
── Clic
Consola  [notas] montada
── Clic
Consola  [notas] desmontada
── Clic
Consola  [notas] montada
── Texto de la página:
Página contenedora (HTML sin React)
Montar notas Desmontar notas
Notas del contenedor
Añadir
Comprar pan
```

| Qué ves | Cómo se lee |
|---------|-------------|
| `200 /notas.js` y nada en la **Consola** al cargar | `contenedor.html` no tiene `#root`: la microaplicación no se monta sola |
| `[notas] montada` tras cada **Montar notas** | El contenedor decide cuándo; `mount` obedece |
| `[notas] desmontada` | La función que devolvió `mount` ha quitado la raíz de React |
| Título **Notas del contenedor** | La prop `titulo` ha viajado del contenedor a `Notas` por el contrato |

### 8 — Mira el contrato en crudo

Abre `/notas.js` directamente en el navegador. Es el bundle que pide el contenedor: arranca con el código de
Webpack (`webpackBootstrap`) y, buscando con `Ctrl+F`, encontrarás, al final, `window.notas = __webpack_exports__;`. Con este comando de ayuda
ves solo las primeras líneas desde la terminal:

```bash
# En otra terminal, con el servidor en marcha: primeras líneas del bundle
curl -s localhost:3000/notas.js | head -3
```

**Resultado esperado:**

```text
/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({
```

Y en la **Consola** del navegador, en `/contenedor.html`, pregunta qué hay en `window.notas`:

```js
// Qué tipo de valor es y qué expone
typeof window.notas
Object.keys(window.notas)
```

**Resultado esperado** (cada expresión devuelve su valor; aquí, en una línea):

```text
object mount
```

`window.notas` es un objeto con una sola clave, `mount`: exactamente lo que exporta `index.js`. Todo lo demás
(`Notas`, `useState`, React) queda dentro del bundle.

## Comprueba tu entendimiento

**El contenedor manda**
Recarga `/contenedor.html` sin pulsar nada.
→ La página muestra solo el título y los dos botones; en la **Consola** no aparece `[notas] montada`.

**Desmontar es quitar, no esconder**
En `/contenedor.html`, monta, escribe una nota nueva, pulsa **Añadir**, desmonta y vuelve a montar.
→ La nota nueva ha desaparecido y solo queda «Comprar pan»: la raíz de React se destruyó y su estado con ella.

**Las props son el canal**
Cambia en `contenedor.html` el valor de `titulo` y recarga.
→ El recuadro muestra el título nuevo sin haber tocado `Notas.jsx`.

## Experimenta

**Montar dos veces en el mismo hueco.** En `contenedor.html`, quita la comprobación `if (!desmontar)` del botón
**Montar notas**. Antes de probarlo, predice: ¿qué pasará al pulsarlo dos veces seguidas? ¿Y al pulsar
**Desmontar notas** después?

```js
// Experimento: sin la protección, cada clic crea una raíz nueva sobre el mismo elemento
document.getElementById('montar').onclick = () => {
  desmontar = window.notas.mount(document.getElementById('hueco'), { titulo: 'Notas del contenedor' });
};
```

Recarga, pulsa **Montar notas** dos veces y **Desmontar notas** una, mirando la **Consola**. Fíjate en cuántas
veces sale `[notas] montada`, qué avisa React sobre llamar a `createRoot()` dos veces en el mismo contenedor, y
si la primera raíz se llega a desmontar: la variable `desmontar` solo guarda la última.

**Resultado esperado:**

```text
Red      200  /notas.js
── Clic
Consola  [notas] montada
── Clic
Consola (error)  You are calling ReactDOMClient.createRoot() on a container that has already been passed to createRoot() before. Instead, call root.render() on the existing root instead if you want to update it.
Consola  [notas] montada
── Clic
Consola  [notas] desmontada
── Texto de la página:
Página contenedora (HTML sin React)
Montar notas Desmontar notas
```

Dos `montada` y un solo `desmontada`: el hueco se vacía, pero la primera raíz de React sigue viva en memoria y
nadie tiene ya la función para desmontarla. Vuelve a poner la comprobación.

**Sin modo aislado.** En `src/index.js`, comenta la línea `if (raiz) mount(raiz);`. Predice qué verás en el
puerto 3000 y qué en `/contenedor.html`. Compruébalo.

**Resultado esperado** en el puerto 3000:

```text
Red      200  /notas.js
── Texto de la página:

```

Y en `/contenedor.html`, tras pulsar **Montar notas**:

```text
Red      200  /notas.js
── Clic
Consola  [notas] montada
── Texto de la página:
Página contenedora (HTML sin React)
Montar notas Desmontar notas
Notas del contenedor
Añadir
Comprar pan
```

La página propia se queda en blanco: el bundle se descarga, pero nadie llama a `mount`. El contenedor no
depende del modo aislado, porque llama al contrato él mismo. Vuelve a dejar la línea.

## Mejora

**Desmontar limpia lo que la microaplicación deja fuera de React.** Una microaplicación real suele registrar algo
fuera de su árbol de componentes (un listener en `window`, un temporizador). Si `unmount` no lo quita, sigue vivo
después de desmontar. Haz que `mount` registre un listener y que la función de desmontaje lo retire:

```jsx
// src/mount.js: lo que mount registra fuera de React, el desmontaje lo retira
export function mount(elemento, props = {}) {
  const root = createRoot(elemento);
  root.render(<Notas {...props} />);
  const alRedimensionar = () => console.log('[notas] ancho', window.innerWidth);
  window.addEventListener('resize', alRedimensionar);
  console.log('[notas] montada');
  return () => {
    window.removeEventListener('resize', alRedimensionar);
    root.unmount();
    console.log('[notas] desmontada');
  };
}
```

Comprueba en `/contenedor.html`: con las notas montadas, cambiar el tamaño de la ventana escribe `[notas] ancho …`
en la **Consola**; después de desmontar, deja de escribirlo. Prueba a quitar la línea `removeEventListener` y
verás que el mensaje sigue saliendo con la microaplicación desmontada.

## Reto

### 1 — Actualizar las props sin desmontar

**La situación:** el contenedor quiere cambiar el título de las notas mientras están montadas. Hoy la única forma
es desmontar y volver a montar, y eso borra las notas que haya escrito el usuario. Un compañero propone que el
contenedor cambie el texto del `<h2>` directamente con `document.querySelector`.

**Qué haces:** cambias el contrato para que `mount` devuelva un objeto con dos funciones, `unmount()` y
`update(props)`, y añades a `contenedor.html` un tercer botón **Cambiar título** que llama a `update`.

**Pistas:** `root.render()` se puede volver a llamar sobre la misma raíz con props nuevas y React conserva el
estado de los componentes; el contenedor tendrá que guardar el objeto devuelto en lugar de una función.

**Lo que buscas:** montas, añades una nota, pulsas **Cambiar título** y el recuadro cambia de título sin perder la
nota; **Desmontar notas** sigue escribiendo `[notas] desmontada`.

<details>
<summary>Ver solución</summary>

`src/mount.js`:

```jsx
// El contrato crece: mount devuelve un objeto con unmount y update.
export function mount(elemento, props = {}) {
  const root = createRoot(elemento);
  const pintar = (p) => root.render(<Notas {...p} />);
  pintar(props);
  console.log('[notas] montada');
  return {
    // Vuelve a renderizar la misma raíz: React conserva el estado de Notas.
    update: (nuevas) => pintar({ ...props, ...nuevas }),
    unmount: () => {
      root.unmount();
      console.log('[notas] desmontada');
    },
  };
}
```

`public/contenedor.html` (script):

```html
<button id="titulo">Cambiar título</button>
<script>
  // El contenedor guarda el objeto que devuelve mount, no una función.
  let app = null;
  document.getElementById('montar').onclick = () => {
    if (!app) app = window.notas.mount(document.getElementById('hueco'), { titulo: 'Notas del contenedor' });
  };
  document.getElementById('titulo').onclick = () => {
    if (app) app.update({ titulo: 'Título cambiado' });
  };
  document.getElementById('desmontar').onclick = () => {
    if (app) { app.unmount(); app = null; }
  };
</script>
```

Como `index.js` llama a `mount(raiz)` sin usar lo que devuelve, el modo aislado sigue funcionando sin cambios.
Tocar el DOM de la microaplicación desde fuera, como proponía el compañero, se rompería en cuanto React volviera
a renderizar. Es el mismo contrato que usa single-spa (`mount`, `unmount` y `update`), que se ve en el módulo M05.
**La regla:** el contenedor solo habla con la microaplicación a través de su contrato; si necesita algo nuevo, se
amplía el contrato.

</details>

## Errores frecuentes

| Síntoma | Causa probable | Cómo arreglarlo |
|---------|----------------|-----------------|
| **Consola**: `Cannot read properties of undefined (reading 'mount')` en `contenedor.html` | Falta `library` en `output` o no has reiniciado el servidor tras cambiar `webpack.config.js` | Revisa el paso 4 y reinicia (bloque de abajo) |
| `404 /notas.js` en **Red** | El servidor sigue con la configuración vieja y sirve `main.js` | Para con `Ctrl+C` y vuelve a arrancar |
| `/contenedor.html` muestra la página de notas aislada | El fichero no está en `public/` o tiene otro nombre | Créalo como `public/contenedor.html` |
| En el puerto 3000 la página sale vacía | `index.js` ya no llama a `mount(raiz)` o `#root` falta en `public/index.html` | Revisa el paso 3 |
| `[notas] montada` sale dos veces seguidas | Se ha montado dos veces sin desmontar | Mantén la comprobación `if (!desmontar)` del paso 5 |

```bash
# En inicio/: Ctrl+C para parar el servidor y vuelve a arrancarlo (ficha: ../comandos-lab.md#npm-start)
npm start
```

## Conclusiones

### Qué es una microaplicación autónoma

Una aplicación que no decide dónde ni cuándo se pinta: ofrece un contrato, `mount(elemento, props)`, que la pinta
donde le digan y devuelve cómo quitarla. Tiene además un modo aislado para desarrollarse sola.

```text
  contenedor ──mount(hueco, { titulo })──► microaplicación
             ◄────── unmount() ──────────
  (no conoce React)                       (no conoce al contenedor)
```

### Cómo debe ser

| Requisito | En el lab |
|-----------|-----------|
| Se monta en el elemento que le pasan, no en uno fijo | `mount(elemento, props)` con `createRoot(elemento)` |
| Devuelve cómo desmontarla | `[notas] desmontada` tras **Desmontar notas** |
| Recibe sus datos por props | `titulo: 'Notas del contenedor'` |
| Funciona sola para desarrollarla | `[notas] montada` en el puerto 3000 sin contenedor |
| Expone solo el contrato | `Object.keys(window.notas)` → `mount` |
| El contenedor no depende de su tecnología | `contenedor.html` es HTML sin React |

### Dónde se rompe y cómo lo has detectado

| Fallo | Cómo lo has visto | Qué provoca |
|-------|-------------------|-------------|
| Se monta siempre en `#root` | `inicio/`: `main.js` sin nada en `window` | Nadie más puede usarla |
| Contrato sin publicar | `window.notas` indefinido sin `library` | El contenedor no encuentra `mount` |
| Montar dos veces | Experimento sin `if (!desmontar)` | Dos raíces en un elemento y una que nunca se desmonta |
| Desmontar sin limpiar | `[notas] ancho …` sigue tras desmontar | Fugas: listeners y temporizadores vivos |
| Variable global | `window.notas` | Dos microaplicaciones con el mismo nombre se pisan |

### Cómo se perfecciona

En producción, la variable global se sustituye por un mecanismo de carga: Module Federation (M03) expone
`mount` como módulo remoto, y single-spa (M05) estandariza el [ciclo de vida](../glosario/04-integracion-despliegue.md#ciclo-de-vida) con `bootstrap`, `mount`, `unmount` y
`update`. El contrato se versiona y se documenta, la función de desmontaje limpia todo lo que la microaplicación
registró, y el modo aislado se usa para desarrollarla y probarla sin levantar el resto.

### En una frase

> 🔑 Una microaplicación es autónoma cuando se monta donde le dicen, con lo que le pasan, y devuelve cómo quitarla:
> `mount(elemento, props)` → `unmount`.
