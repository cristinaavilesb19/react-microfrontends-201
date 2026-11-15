# Lab — Enrutamiento compartido

[← Página anterior](02-lab-estructura-microaplicacion.md) · [Siguiente página →](../M03-module-federation/README.md)

En este laboratorio practicas el **[enrutamiento en dos niveles](../glosario/01-arquitectura.md#enrutamiento-dos-niveles)**: el contenedor reparte los prefijos de la URL
(`/ayuda/*`, `/ajustes/*`) y cada [microaplicación](../glosario/01-arquitectura.md#microaplicacion) resuelve sus propias rutas dentro de su prefijo. El ejercicio
tiene un contenedor y dos microaplicaciones, `ayuda` y `ajustes`, con React Router 7. `ajustes` ya usa rutas
relativas; `ayuda` está escrita como si fuera dueña de toda la URL y su enlace **Preguntas frecuentes** acaba en
«No encontrado». La arreglas sin tocar el contenedor.

### Objetivo

Comprender cómo se reparte el enrutamiento entre un contenedor y sus microaplicaciones: qué decide cada nivel,
cómo deben escribirse las rutas para que una microaplicación no dependa de dónde la monten, cómo se detecta cuando
una invade el nivel del contenedor y qué queda por resolver entre microaplicaciones.

### Punto de partida

- Carpeta: [`ejercicios/M02-03-enrutamiento-compartido/inicio/`](../../ejercicios/M02-03-enrutamiento-compartido/inicio/).
  La solución terminada está en [`solucion/`](../../ejercicios/M02-03-enrutamiento-compartido/solucion/).
- Estado: dependencias instaladas en la raíz del repositorio (el Codespace ejecuta `npm ci` al crearse).
- Arranque y URL: `npm start` en `inicio/`, puerto **3000** (pestaña **Puertos** de VS Code, icono del globo;
  fuera de Codespaces, `http://localhost:3000`).
- Qué se ve al abrir: la barra **Inicio · Ayuda · Ajustes** y el título **Inicio**.

Si quieres empezar de cero:

```bash
# Desde la raíz del repositorio: deja inicio/ como en el repositorio (ficha: ../comandos-lab.md#reiniciar)
bash scripts/reiniciar.sh M02-03-enrutamiento-compartido
```

Ficha: [`reiniciar.sh`](../comandos-lab.md#reiniciar).

### Qué está pasando

En una página con varias microaplicaciones hay **una sola barra de direcciones** y, por tanto, un solo router que
la escucha. Si cada microaplicación declarase rutas absolutas, dos equipos podrían reclamar `/faq` a la vez y
ninguna se podría mover de sitio. Por eso el enrutamiento se reparte en dos niveles:

```text
  URL:  /ayuda/faq
        └─┬──┘└┬┘
          │    └── segundo nivel: lo resuelve la microaplicación ayuda  (ruta relativa "faq")
          └─────── primer nivel: lo resuelve el contenedor               (prefijo "/ayuda/*")
```

| Nivel | Quién | Qué decide | En este laboratorio |
|-------|-------|------------|---------------------|
| Router | El contenedor, una vez | Que haya un único `BrowserRouter` para toda la página | `src/index.js` |
| Primer nivel | El contenedor | Qué microaplicación ocupa cada prefijo, y qué pasa con lo que no es de nadie | `src/Contenedor.jsx`: `/ayuda/*`, `/ajustes/*`, `*` |
| Segundo nivel | Cada microaplicación | Sus pantallas, relativas a su prefijo, sin saber cuál es | `src/apps/ayuda/Ayuda.jsx`, `src/apps/ajustes/Ajustes.jsx` |

En React Router 7, un `<Routes>` dentro de una ruta que termina en `/*` resuelve sus rutas a partir de lo que esa
ruta ya ha consumido. Una ruta o un `<Link>` **sin barra inicial** (`faq`) es relativa a ese punto; **con barra**
(`/faq`) es absoluta y vuelve a empezar desde la raíz de la URL, es decir, desde el nivel del contenedor.

> [!NOTE]
> Aquí las tres piezas están en el mismo bundle para centrarse en las rutas. Cuando sean microaplicaciones
> federadas, el reparto será el mismo: el contenedor tiene el router y los prefijos, y cada [remote](../glosario/02-module-federation.md#remote) trae su
> `<Routes>` relativo.

### 1 — Reproduce el fallo

Arranca `inicio/`, abre `/ayuda` y pulsa **Preguntas frecuentes**.

```bash
# Desde la raíz del repositorio
cd ejercicios/M02-03-enrutamiento-compartido/inicio
# Arranca en el puerto 3000 (ficha: ../comandos-lab.md#npm-start)
npm start
```

Ficha: [`npm start`](../comandos-lab.md#npm-start).

**Resultado esperado** en la terminal:

```text
webpack 5.112.2 compiled successfully
<i> [webpack-dev-server] Loopback: http://localhost:3000/, http://[::1]:3000/
```

En el navegador, en `/ayuda` (añade `/ayuda` a la URL del puerto 3000), con **F12** → **Red** abierto, pulsa
**Preguntas frecuentes**:

```text
Red      200  /main.js
── Clic
── Texto de la página:
Inicio · Ayuda · Ajustes
No encontrado
```

La barra de direcciones termina en:

```text
/faq
```

| Qué ves | Cómo se lee |
|---------|-------------|
| Solo `200 /main.js`, sin peticiones nuevas al pulsar | La navegación es del lado del cliente: React Router cambia la URL sin recargar |
| La URL pasa a `/faq` | El enlace `to="/faq"` es absoluto: ha salido del prefijo `/ayuda` |
| `No encontrado` | El contenedor no tiene ningún prefijo `/faq` y aplica su ruta `*` |
| Desaparece el título **Ayuda** | La microaplicación ayuda ya no está montada: `/faq` no es suyo |

### 2 — Lee el primer nivel

Abre `src/Contenedor.jsx`. Es el nivel del contenedor y no lo vas a tocar en todo el lab:

```jsx
import { Link, Route, Routes } from 'react-router';
import Ayuda from './apps/ayuda/Ayuda';
import Ajustes from './apps/ajustes/Ajustes';

// Primer nivel: el contenedor solo decide qué microaplicación ocupa cada prefijo.
export default function Contenedor() {
  return (
    <>
      <nav>
        <Link to="/">Inicio</Link> · <Link to="/ayuda">Ayuda</Link> · <Link to="/ajustes">Ajustes</Link>
      </nav>
      <Routes>
        <Route path="/" element={<h1>Inicio</h1>} />
        <Route path="/ayuda/*" element={<Ayuda />} />
        <Route path="/ajustes/*" element={<Ajustes />} />
        <Route path="*" element={<h1>No encontrado</h1>} />
      </Routes>
    </>
  );
}
```

El `/*` de `/ayuda/*` le dice al router que todo lo que venga detrás de `/ayuda/` es asunto de `Ayuda`. El
`BrowserRouter` está en `src/index.js`, una sola vez para toda la página.

### 3 — Comprueba que el segundo nivel relativo funciona

`ajustes` ya está bien hecha. Ábrela directamente en una ruta de segundo nivel: `/ajustes/idioma`.

**Resultado esperado:**

```text
Red      200  /main.js
── Texto de la página:
Inicio · Ayuda · Ajustes
Ajustes
Perfil · Idioma

Idioma: español.
```

Mira cómo lo consigue en `src/apps/ajustes/Ajustes.jsx`:

```jsx
import { Link, Route, Routes } from 'react-router';

// Segundo nivel: rutas relativas de la microaplicación ajustes.
export default function Ajustes() {
  return (
    <section>
      <h1>Ajustes</h1>
      <Link to="perfil">Perfil</Link> · <Link to="idioma">Idioma</Link>
      <Routes>
        <Route index element={<p>Elige un ajuste.</p>} />
        <Route path="perfil" element={<p>Perfil: nombre y foto.</p>} />
        <Route path="idioma" element={<p>Idioma: español.</p>} />
      </Routes>
    </section>
  );
}
```

Ni una barra inicial: `idioma` se resuelve bajo `/ajustes/` porque es ahí donde la ha montado el contenedor.
`Ajustes.jsx` no contiene la palabra «ajustes» en ninguna ruta. La recarga directa en `/ajustes/idioma` funciona
porque el servidor de desarrollo tiene `historyApiFallback: true` y devuelve `index.html` para cualquier ruta.

### 4 — Haz relativas las rutas de `ayuda`

Ahora aplica lo mismo a `src/apps/ayuda/Ayuda.jsx`: quita la barra inicial de los dos `<Link>` y de los dos
`<Route>`, y añade una ruta `index` para cuando se entra en `/ayuda` sin nada más.

```jsx
import { Link, Route, Routes } from 'react-router';

// Segundo nivel: rutas RELATIVAS al prefijo que le dé el contenedor (/ayuda/*).
// La microaplicación no sabe ni le importa en qué prefijo vive.
export default function Ayuda() {
  return (
    <section>
      <h1>Ayuda</h1>
      <Link to="faq">Preguntas frecuentes</Link> · <Link to="contacto">Contacto</Link>
      <Routes>
        <Route index element={<p>Elige un tema.</p>} />
        <Route path="faq" element={<p>FAQ: ¿cómo cambio mi contraseña?</p>} />
        <Route path="contacto" element={<p>Escríbenos a soporte@example.com</p>} />
      </Routes>
    </section>
  );
}
```

| Cambio | Por qué |
|--------|---------|
| `to="/faq"` → `to="faq"` | El enlace se resuelve desde `/ayuda/`, no desde la raíz |
| `path="/faq"` → `path="faq"` | La ruta casa con lo que queda de la URL tras el prefijo |
| `<Route index …>` | Algo que pintar en `/ayuda` a secas |

### 5 — Vuelve a pulsar el enlace

Guarda (el servidor recarga solo), abre otra vez `/ayuda` y pulsa **Preguntas frecuentes**. En la **Consola**,
comprueba la ruta con `location.pathname`.

```js
// En la Consola del navegador: ruta actual
location.pathname
```

**Resultado esperado:**

```text
Red      200  /main.js
── Clic
── En la Consola:
/ayuda/faq
── Texto de la página:
Inicio · Ayuda · Ajustes
Ayuda
Preguntas frecuentes · Contacto

FAQ: ¿cómo cambio mi contraseña?
```

El enlace ha añadido `faq` al prefijo que ya tenía la URL. El contenedor ha resuelto `/ayuda` y la
microaplicación ha resuelto `faq`: cada uno su nivel.

### 6 — Comprueba que `/faq` sigue sin ser de nadie

Abre `/faq` directamente en la barra de direcciones.

**Resultado esperado:**

```text
Red      200  /main.js
── Texto de la página:
Inicio · Ayuda · Ajustes
No encontrado
```

Es correcto: `/faq` es una URL de primer nivel y el contenedor no la ha asignado a nadie. La pantalla de FAQ solo
existe dentro del prefijo que le han dado a `ayuda`.

## Comprueba tu entendimiento

**Cada nivel en su sitio**
Abre `/ayuda/contacto` escribiéndolo en la barra de direcciones.
→ Se ve **Ayuda** y debajo «Escríbenos a soporte@example.com».

**La ruta index**
Pulsa **Ayuda** en la barra de navegación.
→ La URL es `/ayuda` y se ve «Elige un tema.».

**Quien no tiene prefijo, no se pinta**
Abre `/contacto`.
→ «No encontrado»: `contacto` solo existe como segundo nivel de `ayuda`.

## Experimenta

**Mover una microaplicación de prefijo.** En `src/Contenedor.jsx`, cambia `/ayuda/*` por `/soporte/*` y el
enlace de la barra `to="/ayuda"` por `to="/soporte"`. Antes de probar, predice: ¿hay que tocar `Ayuda.jsx` para
que **Preguntas frecuentes** siga funcionando? ¿A qué URL llevará el enlace?

```jsx
// src/Contenedor.jsx: el contenedor reasigna el prefijo; Ayuda.jsx no se toca
<Link to="/soporte">Ayuda</Link>
// …
<Route path="/soporte/*" element={<Ayuda />} />
```

Recarga, pulsa **Ayuda** y después **Preguntas frecuentes**, y mira `location.pathname` en la **Consola**.

**Resultado esperado:**

```text
Red      200  /main.js
── Clic
── Clic
── En la Consola:
/soporte/faq
── Texto de la página:
Inicio · Ayuda · Ajustes
Ayuda
Preguntas frecuentes · Contacto

FAQ: ¿cómo cambio mi contraseña?
```

`Ayuda.jsx` no ha cambiado y su enlace relativo `faq` cuelga ahora de `/soporte`. Piensa también adónde habría
llevado el enlace con la versión de `Ayuda.jsx` del paso 1, la de rutas con barra. Vuelve a dejar `/ayuda`.

**Una ruta absoluta dentro de `ajustes`.** Cambia en `Ajustes.jsx` el enlace `to="perfil"` por `to="/perfil"`.
Predice qué pasará al pulsarlo y compruébalo desde `/ajustes`.

**Resultado esperado:**

```text
Red      200  /main.js
── Clic
── En la Consola:
/perfil
── Texto de la página:
Inicio · Ayuda · Ajustes
No encontrado
```

Es el mismo fallo del paso 1, ahora en la microaplicación que estaba bien. Deshaz el cambio.

## Mejora

**Una página «no encontrado» dentro de cada microaplicación.** Hoy `/ayuda/loquesea` pinta **Ayuda** y debajo
nada: el contenedor le ha dado el prefijo y la microaplicación no tiene ninguna ruta que case. Añade a `Ayuda.jsx`
una ruta comodín de segundo nivel:

```jsx
      <Routes>
        <Route index element={<p>Elige un tema.</p>} />
        <Route path="faq" element={<p>FAQ: ¿cómo cambio mi contraseña?</p>} />
        <Route path="contacto" element={<p>Escríbenos a soporte@example.com</p>} />
        {/* Segundo nivel: lo que es de ayuda pero no existe */}
        <Route path="*" element={<p>Ese tema de ayuda no existe.</p>} />
      </Routes>
```

Comprueba que `/ayuda/loquesea` muestra el mensaje dentro de **Ayuda** y que `/loquesea` sigue mostrando el
«No encontrado» del contenedor. Cada nivel responde por lo suyo.

## Reto

### 1 — Enlazar de una microaplicación a otra

**La situación:** en la FAQ se quiere un enlace «Cambia el idioma» que lleve a la pantalla de idioma de `ajustes`.
Un compañero propone escribir en `Ayuda.jsx` `<Link to="/ajustes/idioma">`.

**Qué haces:** evitas que `Ayuda.jsx` conozca el prefijo de otra microaplicación. El contenedor, que es quien
reparte los prefijos, le pasa a `Ayuda` la ruta como prop (`rutaIdioma`), y `Ayuda` la usa en el enlace de la FAQ.

**Pistas:** `<Ayuda rutaIdioma="…" />` en el elemento de la ruta del contenedor; desestructurar la prop en
`Ayuda`; un `<Link>` con esa prop como `to`.

**Lo que buscas:** en `/ayuda/faq` aparece «Cambia el idioma»; al pulsarlo, la URL es `/ajustes/idioma` y se ve
«Idioma: español.». `Ayuda.jsx` no contiene la palabra `ajustes`.

<details>
<summary>Ver solución</summary>

`src/Contenedor.jsx`:

```jsx
        {/* El contenedor conoce todos los prefijos: es quien da las rutas entre microaplicaciones */}
        <Route path="/ayuda/*" element={<Ayuda rutaIdioma="/ajustes/idioma" />} />
```

`src/apps/ayuda/Ayuda.jsx`:

```jsx
// La ruta a otra microaplicación llega por props: ayuda no conoce el prefijo de ajustes.
export default function Ayuda({ rutaIdioma }) {
  return (
    <section>
      <h1>Ayuda</h1>
      <Link to="faq">Preguntas frecuentes</Link> · <Link to="contacto">Contacto</Link>
      <Routes>
        <Route index element={<p>Elige un tema.</p>} />
        <Route
          path="faq"
          element={<p>FAQ: ¿cómo cambio mi contraseña? <Link to={rutaIdioma}>Cambia el idioma</Link></p>}
        />
        <Route path="contacto" element={<p>Escríbenos a soporte@example.com</p>} />
      </Routes>
    </section>
  );
}
```

Dentro de su prefijo, una microaplicación navega con rutas relativas; hacia fuera, la ruta es absoluta, pero se la
da el contenedor. Si mañana `ajustes` se mueve a `/preferencias/*`, se cambia una línea del contenedor y `ayuda`
no se entera. Es otra vez el [contrato](../glosario/01-arquitectura.md#contrato) por props, ahora aplicado a la navegación. **La regla:** una microaplicación
solo escribe rutas relativas; las que salen de ella se las da quien reparte los prefijos.

</details>

## Errores frecuentes

| Síntoma | Causa probable | Cómo arreglarlo |
|---------|----------------|-----------------|
| Al pulsar un enlace de la microaplicación, «No encontrado» y la URL sin prefijo | `to` o `path` con barra inicial (`/faq`) | Quita la barra: `to="faq"`, `path="faq"` |
| `/ayuda` funciona pero `/ayuda/faq` da «No encontrado» | En el contenedor falta el `/*` de `/ayuda/*`: la ruta solo casa con `/ayuda` exacto | El prefijo debe terminar en `/*` para que el segundo nivel reciba el resto |
| Error en la **Consola**: `You cannot render a <Router> inside another <Router>` | Se ha añadido un `BrowserRouter` dentro de una microaplicación | El router lo crea solo el contenedor (`src/index.js`) |
| Al recargar `/ayuda/faq` el servidor devuelve 404 | Falta `historyApiFallback: true` en `devServer` (o su equivalente en el servidor de producción) | Mantén la opción en `webpack.config.js` |
| `Module not found: Error: Can't resolve 'react-router-dom'` | Import de la librería antigua | En React Router 7 todo se importa de `react-router` |

## Conclusiones

### Qué es el enrutamiento en dos niveles

Un reparto de la URL: el contenedor tiene el único router y decide qué microaplicación ocupa cada prefijo; cada
microaplicación resuelve sus pantallas con rutas relativas a ese prefijo, sin saber cuál es.

```text
  BrowserRouter (contenedor, uno solo)
  └── Routes  /           → Inicio
              /ayuda/*    → Ayuda   └── Routes  index · faq · contacto
              /ajustes/*  → Ajustes └── Routes  index · perfil · idioma
              *           → No encontrado
```

### Cómo debe ser

| Requisito | En el lab |
|-----------|-----------|
| Un solo router para la página | `BrowserRouter` solo en `src/index.js` |
| El contenedor reparte prefijos acabados en `/*` | `/ayuda/*`, `/ajustes/*` |
| El contenedor responde por lo que no es de nadie | `/faq` → «No encontrado» |
| Las microaplicaciones usan rutas relativas | `to="faq"` → `/ayuda/faq` |
| Una microaplicación no conoce su prefijo | `Ayuda.jsx` y `Ajustes.jsx` sin `/ayuda` ni `/ajustes` |
| Las rutas entre microaplicaciones las da el contenedor | Reto: `rutaIdioma` por props |

### Dónde se rompe y cómo lo has detectado

| Fallo | Cómo lo has visto | Qué provoca |
|-------|-------------------|-------------|
| Rutas absolutas en una microaplicación | Paso 1: URL `/faq` y «No encontrado» | Sale de su prefijo y desaparece |
| Ruta de segundo nivel pedida en el primero | Paso 6: `/faq` → «No encontrado» | La pantalla solo existe bajo su prefijo |
| Microaplicación sin comodín propio | Mejora: `/ayuda/loquesea` en blanco | El usuario no sabe si ha fallado algo |
| Prefijo ajeno escrito a mano | Reto: `to="/ajustes/idioma"` en `Ayuda` | Mover `ajustes` rompe `ayuda` |

### Cómo se perfecciona

En producción, los prefijos se declaran en un único sitio del contenedor (una tabla de microaplicaciones con su
ruta), y el servidor devuelve `index.html` para cualquier ruta de la SPA. Las rutas entre microaplicaciones se
publican como contrato (props, un servicio de navegación) en lugar de escribirse a mano. Con [single-spa](../glosario/04-integracion-despliegue.md#single-spa) (M05),
el primer nivel lo resuelve la función de activación de cada aplicación, con la misma idea de prefijos.

### En una frase

> 🔑 El contenedor es dueño del primer segmento de la URL y la microaplicación del resto: rutas relativas dentro,
> prefijos solo en el contenedor.
