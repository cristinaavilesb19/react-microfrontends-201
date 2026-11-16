# Lab — Despliegue independiente

[← Página anterior](01-una-pagina-dos-aplicaciones.md) · [Siguiente página →](03-lab-shell-sin-framework.md)

En este laboratorio practicas el **[despliegue independiente](../glosario/01-arquitectura.md#despliegue-independiente)**, el principio que define un [microfrontend](../glosario/01-arquitectura.md#microfrontend). El
ejercicio es una tienda mínima (un título, un banner con un texto y una lista de tres productos) que existe en dos
versiones: como **[monolito](../glosario/01-arquitectura.md#monolito)**, con todo en un solo build, y **separada**, con el banner como aplicación aparte.
Cambias el texto del banner en las dos y comparas qué ficheros hay que volver a publicar en cada caso.

### Objetivo

Comprender qué es el despliegue independiente: cómo funciona, cómo debe ser, cómo se detectan sus debilidades y
cómo se mejora.

### Punto de partida

- Carpeta: `ejercicios/M01-02-despliegue-independiente/`. Este laboratorio es un procedimiento: no tiene `inicio/`
  ni `solucion/`; cambias un fichero, reconstruyes y al final lo dejas como estaba con `git checkout`.
- Dependencias: instaladas en la raíz del repositorio al crear el Codespace (`npm ci`).
- Dos terminales en VS Code (**Terminal** → **New Terminal** dos veces): la **terminal 1** sirve la tienda en el
  puerto **3000**; la **terminal 2** construye.
- La página se abre desde la pestaña **Puertos** (puerto 3000, icono del globo). Fuera de Codespaces,
  `http://localhost:3000`.
- Estado: nada construido; `monolito/dist/` y `separado/publicado/` se crean en los pasos (están fuera del control
  de versiones).

| Carpeta | Qué es |
|---------|--------|
| `monolito/` | Tienda con `Banner.jsx` y `Catalogo.jsx` en la misma aplicación: un build → `monolito/dist/` |
| `separado/tienda/` | Tienda con el catálogo y un hueco `<div id="banner">`; publica en `separado/publicado/` |
| `separado/banner/` | Aplicación que solo contiene el banner; publica en `separado/publicado/banner/banner.js` |

### Qué está pasando

En un frontend real, partes distintas cambian a ritmos distintos: un banner de campaña puede cambiar cada semana y
un catálogo, cada mes. Si están en el mismo build, publicar el banner obliga a recompilar y volver a desplegar el
catálogo, aunque no haya cambiado: se vuelve a probar todo, se invalida la caché de todo y el equipo del banner
depende del calendario del otro.

El despliegue independiente consiste en que cada parte tenga su propio build y su propia URL de publicación, y que
la página la cargue desde esa URL sin conocer su código. La pista para comprobarlo está en los nombres de fichero:
Webpack pone en el nombre un **hash del contenido** (`main.62e09873.js`). Si el hash no cambia, ese fichero no se ha
vuelto a publicar.

| En la realidad | En este laboratorio |
|----------------|---------------------|
| Aplicación que contiene la página | `separado/tienda` (y todo `monolito/`) |
| Microfrontend de otro equipo | `separado/banner` |
| Publicar una versión | `npm run build:…` escribe en `dist/` o `publicado/` |
| Servidor web o CDN | `npm run monolito` / `npm run separado` (`serve` sobre esa carpeta) |
| Saber qué se ha publicado | Comparar los nombres con hash antes y después |

<details>
<summary>Qué hace por dentro (<code>ejercicios/M01-02-despliegue-independiente/package.json</code>)</summary>

```jsonc
{
  "private": true,
  "scripts": {
    // Cada build se lanza en la carpeta de su aplicación, con su webpack.config.js
    "build:monolito": "npm run build --prefix monolito",
    "build:tienda": "npm run build --prefix separado/tienda",
    "build:banner": "npm run build --prefix separado/banner",
    // Sirven tal cual lo publicado, como un servidor web; los dos usan el puerto 3000
    "monolito": "serve monolito/dist -l 3000",
    "separado": "serve separado/publicado -l 3000"
  }
}
```

</details>

### 1 — Construir el monolito

Empiezas por la versión de referencia: banner y catálogo en un único build. En `monolito/src/index.js` los dos
componentes se importan y se montan juntos.

```jsx
// monolito/src/index.js
import { createRoot } from 'react-dom/client';
import Banner from './Banner';
import Catalogo from './Catalogo';

// Un solo build: banner y catálogo salen en el mismo bundle.
createRoot(document.getElementById('root')).render(
  <main>
    <h1>Tienda (monolito)</h1>
    <Banner />
    <Catalogo />
  </main>
);
```

En la **terminal 2**:

```bash
# Entra en la carpeta del laboratorio
cd /workspaces/react-microfrontends-201/ejercicios/M01-02-despliegue-independiente
# Construye el monolito en monolito/dist/
npm run build:monolito
```

**Resultado esperado** (últimas líneas; el hash y los tiempos pueden cambiar en tu entorno):

```text
asset main.7b796f45.js 214 KiB [emitted] [immutable] [minimized] (name: main) 1 related asset
asset index.html 204 bytes [emitted] [minimized]
webpack 5.112.2 compiled successfully in 2369 ms
```

Un único bundle, `main.7b796f45.js`, con banner, catálogo y React dentro. Quédate con su hash: lo compararás en el
paso 7.

### 2 — Ver el monolito en el navegador

Sirves lo publicado y miras qué ficheros pide la página. En la **terminal 1**:

```bash
# Entra en la carpeta del laboratorio
cd /workspaces/react-microfrontends-201/ejercicios/M01-02-despliegue-independiente
# Sirve monolito/dist en el puerto 3000 (Ctrl+C para pararlo)
npm run monolito
```

Abre el puerto 3000 desde la pestaña **Puertos**, pulsa **F12** → pestaña **Red** (Network) y recarga.

**Resultado esperado.** En la pestaña **Red**:

```text
Red      200  /main.7b796f45.js
```

En la página:

```text
Tienda (monolito)
Rebajas de otoño: 20 % en mochilas
Mochila urbana
Botella térmica
Cuaderno A5
```

Un solo fichero de JavaScript trae toda la tienda. Para el navegador no hay partes: hay un bundle.

Para el servidor con **Ctrl+C** en la terminal 1: la versión separada usa el mismo puerto.

### 3 — Construir la tienda separada

Ahora la versión separada. La tienda ya no importa el banner: deja un hueco con `id="banner"` y su HTML carga
`/banner/banner.js` con una etiqueta `<script>`.

```jsx
// separado/tienda/src/index.js
import { createRoot } from 'react-dom/client';
import Catalogo from './Catalogo';

// La tienda deja un hueco (#banner) y no sabe nada del código del banner.
createRoot(document.getElementById('root')).render(
  <main>
    <h1>Tienda (separado)</h1>
    <div id="banner"></div>
    <Catalogo />
  </main>
);
```

```html
<!-- separado/tienda/public/index.html -->
<body>
  <div id="root"></div>
  <!-- El banner se publica aparte, siempre en la misma URL -->
  <script src="/banner/banner.js" defer></script>
</body>
```

En la **terminal 2**:

```bash
# Construye la tienda en separado/publicado/
npm run build:tienda
```

**Resultado esperado** (últimas líneas; el hash puede cambiar en tu entorno):

```text
asset main.62e09873.js 214 KiB [emitted] [immutable] [minimized] (name: main) 1 related asset
asset index.html 249 bytes [emitted] [minimized]
webpack 5.112.2 compiled successfully in 2457 ms
```

La tienda sin banner pesa lo mismo que el monolito entero: 214 KiB. El banner era unos pocos bytes; lo que pesa es
React.

### 4 — Construir y publicar el banner

El banner es otra aplicación React. Su `index.js` espera a que exista el hueco y se monta en él; su
`webpack.config.js` publica en `../publicado/banner` con un nombre fijo, `banner.js`, porque es la URL que pide el
HTML de la tienda.

```jsx
// separado/banner/src/index.js
import { createRoot } from 'react-dom/client';
import Banner from './Banner';

// Espera a que la tienda haya pintado su hueco y se monta en él.
function montar() {
  const hueco = document.getElementById('banner');
  if (hueco) createRoot(hueco).render(<Banner />);
  else requestAnimationFrame(montar);
}
montar();
```

```js
// separado/banner/webpack.config.js (extracto)
output: {
  path: path.resolve(__dirname, '../publicado/banner'),   // dónde se publica
  filename: 'banner.js',                                   // URL fija: sin hash
  clean: true,
},
```

En la **terminal 2**:

```bash
# Construye el banner en separado/publicado/banner/
npm run build:banner
```

**Resultado esperado** (últimas líneas):

```text
asset banner.js 214 KiB [emitted] [minimized] (name: main) 1 related asset
webpack 5.112.2 compiled successfully in 2305 ms
```

Mira cómo han quedado las dos publicaciones:

```bash
# Lista lo publicado por el monolito y por las dos aplicaciones separadas
ls monolito/dist separado/publicado separado/publicado/banner
```

```text
monolito/dist:
index.html
main.7b796f45.js
main.7b796f45.js.LICENSE.txt

separado/publicado:
banner
index.html
main.62e09873.js
main.62e09873.js.LICENSE.txt

separado/publicado/banner:
banner.js
banner.js.LICENSE.txt
```

| Fichero | De qué build | Nombre |
|---------|--------------|--------|
| `monolito/dist/main.7b796f45.js` | Monolito | Con hash |
| `separado/publicado/main.62e09873.js` | Tienda | Con hash |
| `separado/publicado/banner/banner.js` | Banner | Fijo |

> [!NOTE]
> El build de la tienda limpia su carpeta de salida antes de escribir, pero respeta la subcarpeta del banner:
> `clean: { keep: /^banner\// }` en `separado/tienda/webpack.config.js`. Cada equipo borra solo lo suyo.

### 5 — Ver la tienda separada en el navegador

Antes de abrirla, mira la fuente: abre en el editor `separado/publicado/index.html`, el HTML que ha generado el
build de la tienda.

```html
<!-- separado/publicado/index.html (minimizado por Webpack) -->
<!doctype html><html lang=es><head><meta charset=utf-8><link rel=icon href=data:,><title>Tienda (separado)</title><script defer src=main.62e09873.js></script></head><body><div id=root></div><script src=/banner/banner.js defer></script></body></html>
```

Hay dos `<script>`: el de la tienda, con el hash que el build ha escrito, y el del banner, con la URL fija que
venía en la plantilla. En la **terminal 1**:

```bash
# Sirve separado/publicado en el puerto 3000 (Ctrl+C para pararlo)
npm run separado
```

Recarga la página con la pestaña **Red** abierta.

**Resultado esperado.** En la pestaña **Red**:

```text
Red      200  /banner/banner.js
Red      200  /main.62e09873.js
```

En la página:

```text
Tienda (separado)
Rebajas de otoño: 20 % en mochilas
Mochila urbana
Botella térmica
Cuaderno A5
```

Para el usuario la página es igual que la del monolito. Para el navegador son dos aplicaciones: dos ficheros que
llegan por separado. Deja este servidor en marcha.

### 6 — Cambiar el texto del banner separado

Ahora llega una campaña nueva. Abre `separado/banner/src/Banner.jsx` y cambia el valor de `TEXTO`:

```jsx
// separado/banner/src/Banner.jsx
// Texto de la campaña: lo cambia el equipo de marketing cada semana.
export const TEXTO = 'Black Friday: 30 % en todo';   // antes: 'Rebajas de otoño: 20 % en mochilas'

export default function Banner() {
  return <aside style={{ background: '#fde68a', padding: 12 }}>{TEXTO}</aside>;
}
```

Guarda el fichero. Todavía no cambia nada en el navegador: lo servido es lo publicado, no el código fuente.

### 7 — Publicar solo el banner

Reconstruyes **solo** el banner, sin tocar la tienda. En la **terminal 2**:

```bash
# Vuelve a construir el banner; la tienda no se recompila
npm run build:banner
```

**Resultado esperado** (últimas líneas):

```text
asset banner.js 214 KiB [emitted] [minimized] (name: main) 1 related asset
webpack 5.112.2 compiled successfully in 2176 ms
```

Comprueba qué ha cambiado en la publicación de la tienda:

```bash
# Lista lo publicado por la tienda
ls separado/publicado
```

```text
banner
index.html
main.62e09873.js
main.62e09873.js.LICENSE.txt
```

El bundle de la tienda sigue siendo `main.62e09873.js`, el mismo del paso 3: no se ha vuelto a publicar. Solo ha
cambiado el contenido de `banner/banner.js`.

### 8 — Ver el cambio sin haber tocado la tienda

Recarga la página (el servidor de la terminal 1 sigue en marcha).

**Resultado esperado.** En la pestaña **Red**:

```text
Red      200  /main.62e09873.js
Red      200  /banner/banner.js
```

En la página:

```text
Tienda (separado)
Black Friday: 30 % en todo
Mochila urbana
Botella térmica
Cuaderno A5
```

La tienda carga el mismo `main.62e09873.js` que antes y, aun así, muestra el banner nuevo: lo pide en
`/banner/banner.js` y en esa URL ahora hay otra versión. Eso es el despliegue independiente. El orden de las dos
líneas en **Red** puede variar; los dos ficheros se piden en paralelo.

> [!TIP]
> Si ves el texto antiguo, el navegador ha usado su caché de `banner.js`: al tener siempre la misma URL, no sabe
> que ha cambiado. Recarga con **Ctrl+Shift+R** o marca **Disable cache** en la pestaña **Red**.

### 9 — Hacer el mismo cambio en el monolito

Repite la campaña en el monolito. Abre `monolito/src/Banner.jsx` y pon el mismo texto:

```jsx
// monolito/src/Banner.jsx
// Texto de la campaña: lo cambia el equipo de marketing cada semana.
export const TEXTO = 'Black Friday: 30 % en todo';   // antes: 'Rebajas de otoño: 20 % en mochilas'

export default function Banner() {
  return <aside style={{ background: '#fde68a', padding: 12 }}>{TEXTO}</aside>;
}
```

En la **terminal 2**:

```bash
# Reconstruye el monolito: no hay forma de construir solo el banner
npm run build:monolito
```

**Resultado esperado** (últimas líneas; el hash puede cambiar en tu entorno):

```text
asset main.ec099756.js 214 KiB [emitted] [immutable] [minimized] (name: main) 1 related asset
asset index.html 204 bytes [emitted] [compared for emit] [minimized]
webpack 5.112.2 compiled successfully in 2406 ms
```

```bash
# Lista lo publicado por el monolito
ls monolito/dist
```

```text
index.html
main.ec099756.js
main.ec099756.js.LICENSE.txt
```

El hash ha pasado de `main.7b796f45.js` (paso 1) a `main.ec099756.js`. Has cambiado una frase y se ha vuelto a
publicar todo: los 214 KiB con el catálogo, que no había cambiado, y React. Los usuarios vuelven a descargar la
tienda entera.

| | Monolito | Separado |
|---|----------|----------|
| Qué recompilas | Todo (`build:monolito`) | Solo el banner (`build:banner`) |
| Fichero de la tienda | Cambia: `7b796f45` → `ec099756` | No cambia: `62e09873` |
| Qué vuelve a descargar el usuario | 214 KiB, toda la aplicación | 214 KiB del banner (React incluido) |
| Quién decide cuándo se publica | Quien publica la aplicación entera | El dueño del banner |

Fíjate en la tercera fila: en la versión separada el usuario también descarga 214 KiB, porque el banner trae su
propia copia de React. Separar ha dado independencia, no ligereza.

### 10 — Dejar el ejercicio como estaba

Devuelves los dos `Banner.jsx` a su texto original y vuelves a publicar ambos. En la **terminal 2**:

```bash
# Deshace tus cambios en los dos Banner.jsx
git checkout -- monolito/src/Banner.jsx separado/banner/src/Banner.jsx
# Vuelve a publicar el banner y el monolito con el texto original
npm run build:banner
npm run build:monolito
```

**Resultado esperado:** al recargar la tienda separada vuelve a salir `Rebajas de otoño: 20 % en mochilas`, y el
monolito vuelve a publicar un bundle con el mismo hash que en el paso 1 (el hash depende solo del contenido).

## Comprueba tu entendimiento

**Qué se ha publicado en cada caso**
Compara `ls separado/publicado` antes y después del paso 7, y `ls monolito/dist` antes y después del paso 9.
→ En la tienda separada `main.62e09873.js` no cambia; en el monolito el bundle pasa a tener otro hash.

**Dónde está el [contrato](../glosario/01-arquitectura.md#contrato)**
Busca en `separado/tienda/src/` alguna referencia al código del banner.
→ No hay ninguna: la tienda solo conoce el hueco `id="banner"` (en `index.js`) y la URL `/banner/banner.js` (en
`public/index.html`).

**Por qué el banner no lleva hash**
Abre `separado/publicado/index.html` y busca la etiqueta del banner.
→ `<script src=/banner/banner.js defer>`: la URL está escrita en la plantilla de la tienda; si el banner llevara
hash, la tienda tendría que recompilarse cada vez que el banner cambia.

## Investiga

**¿Por qué pesa 214 KiB un banner que solo pinta una frase?** Primero la fuente: abre en el editor
`separado/publicado/banner/banner.js.LICENSE.txt`, el fichero que Webpack escribe junto al bundle con las licencias
del código de terceros que ha metido dentro.

```text
/**
 * @license React
 * react-dom-client.production.js
 ...
/**
 * @license React
 * react-dom.production.js
 ...
/**
 * @license React
 * react-jsx-runtime.production.js
 ...
/**
 * @license React
 * react.production.js
 ...
/**
 * @license React
 * scheduler.production.js
 ...
```

(recortado: cada licencia lleva también su texto MIT)

El banner lleva dentro React, React DOM, el runtime de JSX y el scheduler. Abre ahora
`separado/publicado/main.62e09873.js.LICENSE.txt`: es el mismo fichero, con las mismas cinco licencias. Compara los
tamaños de los dos bundles:

```bash
# Cuenta los bytes de los bundles de la tienda y del banner
wc -c separado/publicado/*.js separado/publicado/banner/*.js
```

**Resultado esperado** (los bytes pueden variar ligeramente):

```text
219095 separado/publicado/main.62e09873.js
218993 separado/publicado/banner/banner.js
438088 total
```

Unos 219 000 bytes cada uno, casi idénticos: la página separada descarga React dos veces. Con más microfrontends,
más copias. Compartir una sola copia de React entre aplicaciones es lo que resuelve [Module Federation](../glosario/02-module-federation.md#module-federation) en el M03.

## Experimenta

**¿Qué le pasa a la tienda si el banner no está publicado?** Predice antes: ¿se queda la página en blanco, sale un
error en pantalla o la tienda sigue sin banner?

Con el servidor de la terminal 1 en marcha, borra la publicación del banner en la **terminal 2**:

```bash
# Simula que el banner no está desplegado: borra su carpeta publicada
rm -rf separado/publicado/banner
```

Recarga la página con **F12** abierto.

**Resultado esperado.** En la pestaña **Consola** (Console):

```text
Consola (error)  Failed to load resource: the server responded with a status of 404 (Not Found)
```

En la pestaña **Red**:

```text
Red      falló  http://localhost:3000/banner/banner.js
Red      200  /main.62e09873.js
```

En la página:

```text
Tienda (separado)
Mochila urbana
Botella térmica
Cuaderno A5
```

La petición de `banner.js` falla con un 404 y el hueco `#banner` se queda vacío, pero la tienda y el catálogo se
pintan igual: son otra aplicación, en otro fichero. En el monolito no se puede «quitar» el banner sin recompilar,
y un error dentro de `Banner` afectaría a todo el árbol de React de la tienda.

Vuelve a publicarlo:

```bash
# Publica de nuevo el banner en separado/publicado/banner/
npm run build:banner
```

## Reto

### 1 — Un build que borra lo que no es suyo

**La situación:** en `separado/tienda/webpack.config.js` la salida se limpia con `clean: { keep: /^banner\// }`. Un
compañero propone dejarlo en `clean: true`, «como en el resto de proyectos», porque así no se acumulan bundles
viejos con hashes antiguos.

**Qué haces:** cambia esa línea a `clean: true`, reconstruye solo la tienda y recarga la página servida por
`npm run separado`.

```bash
# Reconstruye solo la tienda con la nueva opción de limpieza
npm run build:tienda
# Mira qué queda publicado
ls separado/publicado
```

**Pistas:** `output.clean` de Webpack borra la carpeta `output.path` antes de escribir; `keep` recibe una expresión
regular con las rutas que no debe borrar. Fíjate en qué carpeta escribe la tienda y en cuál escribe el banner.

**Lo que buscas:** explicar por qué la tienda, que no ha cambiado de código, deja de mostrar el banner, y qué línea
protege la publicación del otro equipo.

<details>
<summary>Ver solución</summary>

```js
// separado/tienda/webpack.config.js (la propuesta del compañero)
output: {
  path: path.resolve(__dirname, '../publicado'),   // la tienda escribe en publicado/
  filename: '[name].[contenthash:8].js',
  clean: true,                                      // borra TODO publicado/, incluida banner/
},
```

Tras `npm run build:tienda`, `ls separado/publicado` ya no muestra la carpeta `banner`, y al recargar se ve lo
mismo que en «Experimenta»: un 404 de `/banner/banner.js` en la **Consola** y la tienda sin banner. El banner no ha
fallado: lo ha borrado el despliegue de otra aplicación, porque las dos publican en el mismo árbol de carpetas.

En producción pasaría lo mismo si dos equipos suben a la misma ruta de un servidor o de un bucket y uno de ellos
sincroniza «borrando lo que sobra». Lo arreglas devolviendo la opción `keep` y publicando otra vez el banner:

```bash
# Recupera la configuración original de la tienda
git checkout -- separado/tienda/webpack.config.js
# Reconstruye la tienda y vuelve a publicar el banner
npm run build:tienda
npm run build:banner
```

**La regla:** desplegar de forma independiente exige que cada parte tenga su propio espacio de publicación y que
ningún despliegue pueda borrar o sobrescribir el de otro.

</details>

## Errores frecuentes

| Síntoma | Causa probable | Cómo arreglarlo |
|---------|----------------|-----------------|
| `Error: listen EADDRINUSE: address already in use :::3000` al lanzar `npm run separado` | Sigue en marcha `npm run monolito` (u otro ejercicio) en el puerto 3000 | Páralo con **Ctrl+C** en su terminal o libera el puerto (ver [ficha](../comandos-lab.md#npm-start)): `fuser -k 3000/tcp` |
| La página da 404 o sale un listado vacío | No has construido antes de servir: `dist/` y `publicado/` no están en el repositorio | Construye primero: `npm run build:monolito`, o `npm run build:tienda` y `npm run build:banner` |
| Tras el paso 7 sigue saliendo el texto antiguo | Caché del navegador para `banner.js`, que siempre tiene la misma URL | Recarga con **Ctrl+Shift+R** o marca **Disable cache** en la pestaña **Red** |
| El banner del monolito no cambia tras editar | Has editado `separado/banner/src/Banner.jsx`; el monolito tiene su propia copia en `monolito/src/Banner.jsx` | Edita `monolito/src/Banner.jsx` y lanza `npm run build:monolito` |
| `npm error Missing script: "build:banner"` | Estás en otra carpeta | `cd /workspaces/react-microfrontends-201/ejercicios/M01-02-despliegue-independiente` |
| Desaparece el banner tras construir la tienda | Has cambiado `clean` en `separado/tienda/webpack.config.js` (ver el reto) | `git checkout -- separado/tienda/webpack.config.js` y `npm run build:banner` |

Los comandos de la tabla, en sus bloques:

```bash
# Libera el puerto 3000 si quedó un servidor en marcha
fuser -k 3000/tcp
# Desde la carpeta del laboratorio, construye antes de servir
cd /workspaces/react-microfrontends-201/ejercicios/M01-02-despliegue-independiente
npm run build:monolito
npm run build:tienda
npm run build:banner
# Recupera la configuración original de la tienda
git checkout -- separado/tienda/webpack.config.js
```

## Conclusiones

### Qué es el despliegue independiente

Es poder publicar una parte de la interfaz sin recompilar ni volver a publicar las demás. En este laboratorio la
tienda separada carga el banner desde una URL que no controla (`/banner/banner.js`); cuando el banner cambia, solo
cambia ese fichero y la tienda sigue sirviendo `main.62e09873.js`.

```text
Monolito                          Separado
build:monolito                    build:tienda        build:banner
      │                                 │                   │
      ▼                                 ▼                   ▼
dist/main.[hash].js               publicado/          publicado/banner/
(banner + catálogo + React)       main.[hash].js      banner.js  (URL fija)
                                  (catálogo + React)  (banner + React)
```

### Cómo debe ser

| Requisito | En el lab |
|-----------|-----------|
| Cada parte tiene su propio build | `build:tienda` y `build:banner`, cada uno con su `webpack.config.js` |
| La página no conoce el código de la parte, solo un contrato | Un hueco `id="banner"` y la URL `/banner/banner.js` |
| La parte incrustada se publica donde la página la espera | `banner.js` con nombre fijo, sin hash |
| Cada despliegue toca solo su espacio | `clean: { keep: /^banner\// }` en la tienda |
| Se puede comprobar qué se ha publicado | El hash de `main.62e09873.js` no cambia al publicar el banner |

### Dónde se rompe y cómo lo has detectado

| Fallo | Cómo lo has visto | Qué provoca |
|-------|-------------------|-------------|
| En el monolito no se puede publicar solo una parte | El hash pasa de `7b796f45` a `ec099756` por cambiar una frase | Se vuelve a publicar y descargar toda la aplicación |
| Cada aplicación lleva su copia de React | 214 KiB por bundle; las mismas cinco licencias de React en los dos `LICENSE.txt` | La página separada descarga React dos veces |
| La URL fija no avisa de que hay versión nueva | Puede salir el texto antiguo hasta recargar sin caché | Usuarios con versiones mezcladas |
| La parte no está publicada | 404 de `/banner/banner.js` en **Consola** y **Red** | El hueco queda vacío (la tienda sigue funcionando) |
| Un despliegue borra el de otro | `clean: true` en la tienda elimina `publicado/banner/` | La parte desaparece sin que su equipo haya hecho nada |

### Cómo se perfecciona

- **Compartir React** en lugar de llevarlo en cada bundle, y cargar las partes con un mecanismo pensado para ello:
  Module Federation (M03) publica un `remoteEntry.js` en URL fija que apunta a ficheros con hash, y comparte
  dependencias entre [host](../glosario/02-module-federation.md#host) y [remotes](../glosario/02-module-federation.md#remote).
- **Controlar la caché**: la URL fija con cabeceras que obliguen a revalidar y el resto con hash e inmutable (M07,
  con nginx).
- **Prever el fallo**: qué se muestra si una parte no carga (límites de error y suspense, en M03 y M05).
- **Separar la publicación**: cada parte en su imagen, su servidor o su ruta, sin compartir carpeta (M07).

### En una frase

> 🔑 Una parte se despliega de forma independiente cuando la página la pide en una URL fija y su publicación no
> obliga a cambiar ningún otro fichero; sin compartir dependencias, esa independencia cuesta una copia de React
> por aplicación.
