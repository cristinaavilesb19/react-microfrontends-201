# Lab — Sincronizar estado

[← Página anterior](02-lab-context-estado-local.md) · [Siguiente página →](04-lab-eventos-hacia-el-store.md)

En este laboratorio practicas la **[fuente única](../glosario/03-estado-comunicacion.md#fuente-unica) de verdad**: un dato que varias [microaplicaciones](../glosario/01-arquitectura.md#microaplicacion) muestran
tiene que vivir en un solo sitio. El ejercicio es un tema claro/oscuro que pintan dos [remotes](../glosario/02-module-federation.md#remote), `cabecera` y
`pie`. Al principio cada uno guarda su propia copia y se desincronizan; lo arreglas con un paquete pequeño,
`tema-compartido`, que [Module Federation](../glosario/02-module-federation.md#module-federation) carga una sola vez para todos.

### Objetivo

Comprender qué es una fuente única de verdad entre microaplicaciones: cómo funciona, cómo debe ser, cómo se
detectan sus debilidades y cómo se mejora.

### Punto de partida

- Carpeta: `ejercicios/M04-03-sincronizar-estado/inicio`, con tres aplicaciones:

  | Aplicación | Puerto | Qué hace |
  |------------|--------|----------|
  | `host` | 3000 | Pinta la cabecera, un texto propio y el pie |
  | `cabecera` | 3001 | Expone `./Cabecera`: el tema actual y un botón **Cambiar tema** |
  | `pie` | 3002 | Expone `./Pie`: lo mismo, en el pie |

- Arranque, desde la raíz del repositorio (ficha: [`npm start`](../comandos-lab.md#npm-start)):

  ```bash
  # Entra en el punto de partida del lab y arranca las tres aplicaciones
  cd ejercicios/M04-03-sincronizar-estado/inicio
  npm start
  ```

- URL: pestaña **Puertos** de VS Code → puerto **3000** → icono del globo (**Abrir en el navegador**).
  Fuera de Codespaces, `http://localhost:3000`.
- Si quieres volver a empezar (ficha: [`reiniciar`](../comandos-lab.md#reiniciar)):

  ```bash
  # Deja inicio/ como está en el repositorio (borra también la carpeta paquetes/ que crees)
  bash scripts/reiniciar.sh M04-03-sincronizar-estado
  ```

> [!NOTE]
> El navegador solo habla con el [host](../glosario/02-module-federation.md#host): los remotes se piden en `/mf/cabecera/` y `/mf/pie/`, y el servidor
> del host los reenvía a los puertos 3001 y 3002 (`devServer.proxy`). `src/index.js` solo hace
> `import('./bootstrap')`: ese [arranque asíncrono](../glosario/02-module-federation.md#arranque-asincrono) deja a Module Federation decidir qué copia de cada módulo
> compartido usa cada aplicación antes de pintar.

### Qué está pasando

El tema de la interfaz es un dato con un único significado: o la página está en oscuro o no. Si cada
microaplicación guarda su copia con `useState`, cada una cambia la suya y la página acaba a medias. Para que
todas vean lo mismo, el dato tiene que vivir en **un solo sitio** y las demás tienen que **leerlo y
suscribirse** a sus cambios.

Ese sitio puede ser un módulo JavaScript: una variable con el tema, una función para cambiarlo y una lista
de quién quiere enterarse. React tiene un hook pensado para leer un estado externo así,
`useSyncExternalStore`. El detalle importante es que el módulo tiene que ser **el mismo objeto** en todas las
aplicaciones: si cada bundle lleva su copia, vuelve a haber tres variables `tema`. Eso lo garantiza
Module Federation con `shared` y `singleton: true`.

| Pieza | Qué representa |
|-------|----------------|
| `useState` en `Cabecera.jsx` y `Pie.jsx` (en `inicio/`) | Dos copias del mismo dato |
| `paquetes/tema/` (lo creas tú) | La fuente única: el tema y sus suscriptores |
| `alias` `tema-compartido` | El nombre con el que lo importan las tres aplicaciones |
| `shared` `tema-compartido` con `singleton: true` | Que el navegador cargue una sola instancia del paquete |

### 1 — Ver la desincronización

1. Abre el puerto 3000.
2. Pulsa **Cambiar tema** en la cabecera (el primer botón).

**Resultado esperado** en el terminal (el orden cambia en cada arranque):

```text
> concurrently -n cabecera,pie,host "npm start --prefix cabecera" "npm start --prefix pie" "npm start --prefix host"
[host] webpack 5.112.2 compiled successfully
[host] <i> [webpack-dev-server] Loopback: http://localhost:3000/, http://[::1]:3000/
[pie] webpack 5.112.2 compiled successfully
[pie] <i> [webpack-dev-server] Loopback: http://localhost:3002/, http://[::1]:3002/
[cabecera] webpack 5.112.2 compiled successfully
[cabecera] <i> [webpack-dev-server] Loopback: http://localhost:3001/, http://[::1]:3001/
```

Y en la página, después del clic:

```text
Cabecera: tema oscuro Cambiar tema

Contenido del host

Pie: tema claro Cambiar tema
```

**Cómo se lee:** la cabecera ha cambiado su copia y el pie no se ha enterado. No hay ningún error en la
**Consola**: cada microaplicación funciona bien por separado. Así es como suele aparecer este fallo en un
proyecto real.

### 2 — Crear el paquete de la fuente única

Crea la carpeta `inicio/paquetes/tema/` con dos ficheros. Primero su `package.json`, que le da nombre y
versión (Module Federation usa la versión para decidir qué copia comparte):

```json
{
  "name": "tema-compartido",
  "version": "1.0.0",
  "main": "index.js"
}
```

Después `inicio/paquetes/tema/index.js`:

```js
import { useSyncExternalStore } from 'react';

// Fuente única del tema: un valor y la lista de quien quiere enterarse de sus cambios.
let tema = 'claro';
const oyentes = new Set();

// Cambia el valor y avisa a todos los suscriptores
export function cambiarTema() {
  tema = tema === 'claro' ? 'oscuro' : 'claro';
  oyentes.forEach((avisar) => avisar());
}

// React llama a esto al montar el componente; devuelve cómo darse de baja
function suscribir(avisar) {
  oyentes.add(avisar);
  return () => oyentes.delete(avisar);
}

// Hook para leer el tema y volver a pintar cuando cambia.
export function useTema() {
  return useSyncExternalStore(suscribir, () => tema);
}
```

**Cómo se lee:** `useSyncExternalStore(suscribir, leer)` es el hook de React para estado que vive fuera de
React. Se suscribe al montar, se da de baja al desmontar y, cada vez que `cambiarTema` avisa, vuelve a llamar
a `leer` y repinta si el valor ha cambiado.

### 3 — Darle un nombre en las tres aplicaciones

Las tres aplicaciones tienen que importar el paquete con el mismo nombre, `tema-compartido`. Como es un
paquete local y no está en `node_modules`, se lo dices a Webpack con un `alias`. En
`inicio/cabecera/webpack.config.js`, añade arriba el `require` de `path` y cambia la línea `resolve`:

```js
const path = require('path');
// … el resto de requires, igual …

  // 'tema-compartido' es el paquete local ../paquetes/tema.
  resolve: { extensions: ['.js', '.jsx'], alias: { 'tema-compartido': path.resolve(__dirname, '../paquetes/tema') } },
```

Haz el mismo cambio en `inicio/pie/webpack.config.js` y en `inicio/host/webpack.config.js`. El host no usa
el tema, pero tiene que conocer el paquete para compartirlo en el paso siguiente.

### 4 — Compartirlo como singleton

En los mismos tres `webpack.config.js`, sustituye el bloque `shared` del `ModuleFederationPlugin`:

```js
      shared: {
        react: { singleton: true },
        'react-dom': { singleton: true },
        // El paquete del tema, compartido: todas las aplicaciones usan la MISMA instancia.
        'tema-compartido': { singleton: true, version: '1.0.0', requiredVersion: '1.0.0' },
      },
```

**Cómo se lee:** `singleton: true` pide una sola instancia del módulo en toda la página. `version` es la
versión que ofrece cada aplicación y `requiredVersion`, la que acepta; se ponen a mano porque el paquete
local no está en las dependencias del `package.json` de donde Webpack las lee normalmente.

### 5 — Leer el tema de la fuente única

Sustituye `inicio/cabecera/src/Cabecera.jsx` por:

```jsx
import { cambiarTema, useTema } from 'tema-compartido';

// Ya no guarda el tema: lo lee de la fuente única.
export default function Cabecera() {
  const tema = useTema();
  return (
    <div style={{ background: tema === 'oscuro' ? '#222' : '#eee', color: tema === 'oscuro' ? '#eee' : '#222', padding: 8 }}>
      Cabecera: tema {tema} <button onClick={cambiarTema}>Cambiar tema</button>
    </div>
  );
}
```

Y `inicio/pie/src/Pie.jsx`, igual pero con su texto:

```jsx
import { cambiarTema, useTema } from 'tema-compartido';

// Ya no guarda el tema: lo lee de la fuente única.
export default function Pie() {
  const tema = useTema();
  return (
    <div style={{ background: tema === 'oscuro' ? '#222' : '#eee', color: tema === 'oscuro' ? '#eee' : '#222', padding: 8 }}>
      Pie: tema {tema} <button onClick={cambiarTema}>Cambiar tema</button>
    </div>
  );
}
```

### 6 — Arrancar de nuevo y comprobar

Has cambiado `webpack.config.js`, que solo se lee al arrancar. Para con **Ctrl+C** y vuelve a arrancar:

```bash
# Webpack vuelve a leer las tres configuraciones
npm start
```

Recarga el puerto 3000 con **F12** → **Red** abierta y pulsa **Cambiar tema** en la cabecera.

**Resultado esperado** en el terminal. Entre las líneas de cada aplicación aparecen las del módulo
compartido (recortado):

```text
[pie]     consume shared module (default) tema-compartido@=1.0.0 (singleton) (fallback: .....(truncated) 42 bytes [built] [code generated]
[pie]     provide shared module (default) tema-compartido@1.0.0 = ../paquetes...(truncated) 42 bytes [built] [code generated]
[cabecera]     consume shared module (default) tema-compartido@=1.0.0 (singleton) (fallback: .....(truncated) 42 bytes [built] [code generated]
[cabecera]     provide shared module (default) tema-compartido@1.0.0 = ../paquetes...(truncated) 42 bytes [built] [code generated]
```

En la pestaña **Red** (recortado; el orden y qué remote sirve cada chunk cambian):

```text
Red      200  /mf/pie/remoteEntry.js
Red      200  /mf/cabecera/remoteEntry.js
Red      200  /mf/pie/vendors-node_modules_react_index_js.js
Red      200  /mf/pie/src_Pie_jsx.js
Red      200  /mf/cabecera/src_Cabecera_jsx.js
Red      200  /mf/pie/vendors-node_modules_react-dom_index_js.js
Red      200  /mf/cabecera/vendors-node_modules_react_jsx-dev-runtime_js.js
Red      200  /mf/pie/vendors-node_modules_react_jsx-dev-runtime_js.js
Red      200  /mf/pie/paquetes_tema_index_js.js
```

Y en la página, después del clic:

```text
Cabecera: tema oscuro Cambiar tema

Contenido del host

Pie: tema oscuro Cambiar tema
```

**Cómo se lee:**

| Lo que ves | Qué significa |
|------------|---------------|
| `provide shared module … tema-compartido@1.0.0` | Cada aplicación **ofrece** su copia del paquete |
| `consume shared module … (singleton)` | Y cada una **pide** la que se haya elegido para toda la página |
| Un solo `paquetes_tema_index_js.js` en **Red** | El navegador descarga una sola copia, aquí la del pie |
| `Cabecera: tema oscuro` y `Pie: tema oscuro` | Un solo `let tema` para los dos remotes: el clic en la cabecera llega al pie |

## Comprueba tu entendimiento

**Funciona en los dos sentidos**
Pulsa **Cambiar tema** en el pie.
→ La cabecera y el pie vuelven a la vez a `tema claro`.

**Ya no hay copias del dato**
Busca `useState` en `inicio/cabecera/src` y en `inicio/pie/src`.
→ No aparece en `Cabecera.jsx` ni en `Pie.jsx`: el tema solo está en `paquetes/tema/index.js`.

**Una sola descarga**
En **Red**, escribe `tema` en el filtro y recarga.
→ Una sola petición a `paquetes_tema_index_js.js`, aunque los dos remotes importan el paquete.

## Experimenta

**¿Basta con que las dos usen el mismo código?** Predice antes: la cabecera y el pie importan el mismo
`paquetes/tema/index.js`. Si quitas `tema-compartido` del `shared`, pero dejas el `alias` y los imports,
¿siguen sincronizados?

En los tres `webpack.config.js`, comenta la línea de `tema-compartido` del bloque `shared`:

```js
      shared: {
        react: { singleton: true },
        'react-dom': { singleton: true },
        // 'tema-compartido': { singleton: true, version: '1.0.0', requiredVersion: '1.0.0' },   ← experimento
      },
```

Para con **Ctrl+C**, vuelve a arrancar y pulsa **Cambiar tema** en la cabecera.

```bash
# Vuelve a arrancar para que Webpack lea la configuración nueva
npm start
```

**Resultado esperado** en la **Red** (recortado):

```text
Red      200  /mf/cabecera/remoteEntry.js
Red      200  /mf/pie/remoteEntry.js
Red      200  /mf/cabecera/src_Cabecera_jsx.js
Red      200  /mf/pie/src_Pie_jsx.js
```

Y en la página:

```text
Cabecera: tema oscuro Cambiar tema

Contenido del host

Pie: tema claro Cambiar tema
```

**Cómo se lee:** vuelve a desincronizarse con el mismo código fuente. Ya no hay un `paquetes_tema_index_js.js`
aparte: cada remote ha metido su copia del paquete dentro de su propio chunk (`src_Cabecera_jsx.js`,
`src_Pie_jsx.js`), y cada copia tiene su `let tema` y su lista de oyentes. Mismo fichero no es mismo estado;
lo que hace única la fuente es que la instancia sea una. Vuelve a poner la línea en los tres ficheros.

## Reto

### 1 — El host también sigue el tema

**La situación:** el texto «Contenido del host» se queda siempre igual, aunque la cabecera y el pie se pongan
en oscuro. Alguien propone añadir un `useState` con el tema en el host y sincronizarlo con los remotes.

**Qué haces:** en lugar de una tercera copia, haz que `inicio/host/src/App.jsx` lea el tema de la misma fuente
y lo muestre en su texto.

**Pistas:** el host ya tiene el `alias` y el `shared` de `tema-compartido` (pasos 3 y 4); le basta con importar
el hook.

**Lo que buscas:** tras pulsar **Cambiar tema** en cualquiera de los dos remotes, los tres textos de la página
dicen el mismo tema.

<details>
<summary>Ver solución</summary>

```jsx
import Cabecera from 'cabecera/Cabecera';
import Pie from 'pie/Pie';
// La misma fuente que usan los remotes: no hay copia en el host
import { useTema } from 'tema-compartido';

export default function App() {
  const tema = useTema();
  return (
    <main>
      <Cabecera />
      <p>Contenido del host (tema {tema})</p>
      <Pie />
    </main>
  );
}
```

El host no guarda nada: se suscribe a la misma instancia que los remotes, así que un clic en cualquiera
repinta los tres. Como el host también participa en `shared`, puede ser él quien aporte la copia del paquete
que usa toda la página. **La regla:** a un dato compartido se le añade un lector, nunca una copia que haya que
mantener sincronizada.

</details>

## Errores frecuentes

| Síntoma | Causa probable | Cómo arreglarlo |
|---------|----------------|-----------------|
| `Module not found: Error: Can't resolve 'tema-compartido'` en el terminal | Falta el `alias` en el `webpack.config.js` de esa aplicación, o la ruta no apunta a `../paquetes/tema` | Paso 3, en las tres aplicaciones |
| La cabecera y el pie siguen desincronizados con el código nuevo | `tema-compartido` no está en `shared` de alguna aplicación, o no has vuelto a arrancar | Paso 4 y arranque nuevo (bloque de abajo) |
| `Unsatisfied version` en la **Consola** | `version` y `requiredVersion` no coinciden entre aplicaciones | Pon `1.0.0` en las dos claves de las tres aplicaciones |
| El tema cambia pero no se repinta | Se lee la variable sin `useTema()` (sin suscripción) | Lee siempre con el hook |

```bash
# Arranca de nuevo después de cambiar un webpack.config.js
npm start
```

## Conclusiones

### Qué es una fuente única de verdad

Un dato que varias microaplicaciones muestran vive en un solo sitio; las demás lo leen y se suscriben a sus
cambios. Entre [microfrontends](../glosario/01-arquitectura.md#microfrontend), «un solo sitio» quiere decir **una sola instancia** en el navegador.

```text
                 tema-compartido (una instancia, singleton)
                 let tema · oyentes · cambiarTema()
                   ▲                ▲               ▲
          useTema()│       useTema()│      useTema()│
               cabecera            pie            host
```

### Cómo debe ser

| Requisito | En el lab |
|-----------|-----------|
| El dato en un solo módulo | `paquetes/tema/index.js` |
| Lectura con suscripción | `useSyncExternalStore` dentro de `useTema()` |
| Una forma de cambiarlo | `cambiarTema()`, que avisa a los oyentes |
| El mismo nombre en todas las aplicaciones | `alias` `tema-compartido` |
| Una sola instancia | `shared` con `singleton: true` y versión `1.0.0` en las tres |

### Dónde se rompe y cómo lo has detectado

| Fallo | Cómo lo has visto | Qué provoca |
|-------|-------------------|-------------|
| Cada remote con su `useState` | `Cabecera: tema oscuro` y `Pie: tema claro` (paso 1) | Página a medias, sin errores |
| Mismo código sin `shared` | Vuelve la desincronización y no hay `paquetes_tema_index_js.js` en **Red** (Experimenta) | Una copia del módulo dentro de cada remote |
| Una copia más para «sincronizar» | Reto | Más estados que mantener iguales |

### Cómo se perfecciona

- Publicar el paquete en un registro (npm privado) con su versión, en vez de un alias a una carpeta, para que
  cada equipo lo instale como una dependencia más.
- Fijar la política de versiones en `shared` (`requiredVersion` con rango, `strictVersion`) para que dos
  versiones incompatibles avisen.
- Guardar el tema en `localStorage` dentro del paquete para que sobreviva a una recarga.
- Cuando el dato es más complejo que un valor, usar un store (Redux, Zustand) como fuente única con el mismo
  principio: una instancia compartida.

### En una frase

> 🔑 Para que varias microaplicaciones vean el mismo dato no basta con el mismo código: hace falta la misma
> instancia, y eso lo da un módulo compartido como [singleton](../glosario/02-module-federation.md#singleton) al que todas se suscriben.
