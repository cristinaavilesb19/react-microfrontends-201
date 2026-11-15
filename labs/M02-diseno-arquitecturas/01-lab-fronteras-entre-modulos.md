# Lab — Fronteras entre módulos

[← Página anterior](00-imports-cruzados.md) · [Siguiente página →](02-lab-estructura-microaplicacion.md)

En este laboratorio practicas la **[frontera](../glosario/01-arquitectura.md#frontera) de módulo** y el **[contrato](../glosario/01-arquitectura.md#contrato) por props**. El ejercicio es una lista
de tareas con dos módulos, `tareas` y `resumen`: `resumen` lee directamente el almacén interno de `tareas`.
Añades una regla de ESLint que prohíbe ese import y lo sustituyes por dos props que le pasa quien compone la
página.

### Objetivo

Comprender qué es una frontera entre módulos: cómo funciona un contrato por props, cómo debe ser para que cada
módulo se pueda separar después, cómo se detecta automáticamente quien la cruza y dónde se queda corta esa
detección.

### Punto de partida

- Carpeta: [`ejercicios/M02-01-fronteras-entre-modulos/inicio/`](../../ejercicios/M02-01-fronteras-entre-modulos/inicio/).
  La solución terminada está en [`solucion/`](../../ejercicios/M02-01-fronteras-entre-modulos/solucion/).
- Estado: dependencias instaladas en la raíz del repositorio (el Codespace ejecuta `npm ci` al crearse).
- Arranque y URL: `npm start` en `inicio/`, puerto **3000** (pestaña **Puertos** de VS Code, icono del globo;
  fuera de Codespaces, `http://localhost:3000`).
- Qué se ve al abrir: el título **Tareas**, la línea **Pendientes: 2 de 3** y la lista con una tarea hecha (✔) y
  dos pendientes (○).

```bash
# Desde la raíz del repositorio
cd ejercicios/M02-01-fronteras-entre-modulos/inicio
# Arranca la aplicación en el puerto 3000 (ficha: ../comandos-lab.md#npm-start)
npm start
```

Ficha: [`npm start`](../comandos-lab.md#npm-start). Si ya habías tocado este laboratorio y quieres empezar de
cero:

```bash
# Desde la raíz del repositorio: deja inicio/ como en el repositorio (ficha: ../comandos-lab.md#reiniciar)
bash scripts/reiniciar.sh M02-01-fronteras-entre-modulos
```

Ficha: [`reiniciar.sh`](../comandos-lab.md#reiniciar).

### Qué está pasando

Una aplicación que va a acabar repartida en [microfrontends](../glosario/01-arquitectura.md#microfrontend) se divide primero en **módulos**: carpetas que
corresponden a una parte del producto y que un equipo podría llevarse a su propio repositorio. Para que eso sea
posible, cada módulo tiene una **frontera**: lo de dentro es suyo y puede cambiarlo cuando quiera; lo que
necesita de fuera le llega por un **contrato** explícito. En React el contrato más simple son las **props**.

```text
src/
├── App.jsx              # compone: es el único que conoce a los dos módulos
├── index.js
└── modulos/
    ├── tareas/
    │   ├── almacen.js   # estado interno de tareas
    │   └── ListaTareas.jsx
    └── resumen/
        └── Resumen.jsx  # hoy importa ../tareas/almacen  ← cruza la frontera
```

| Pieza del ejercicio | Qué representa en un proyecto real |
|---------------------|------------------------------------|
| `src/modulos/tareas/`, `src/modulos/resumen/` | Dos partes del producto que mañana pueden ser dos [microaplicaciones](../glosario/01-arquitectura.md#microaplicacion) |
| `almacen.js` | Un detalle interno (estado, API, formato de datos) que su equipo cambia sin avisar |
| `App.jsx` | El contenedor que compone la página y reparte los datos |
| `no-restricted-imports` en `eslint.config.js` | La regla que hace cumplir la frontera en cada `lint`, sin depender de la memoria de nadie |

Con un import directo, `resumen` funciona solo si `tareas` está en el mismo bundle y con la misma forma de datos.
Con props, a `resumen` le da igual de dónde salgan los números.

### 1 — Pasa el linter sin ninguna regla

Antes de poner la regla, comprueba qué dice ESLint con la configuración actual. Abre `eslint.config.js`: tiene
`rules: {}`, así que no vigila nada.

```bash
# En ejercicios/M02-01-fronteras-entre-modulos/inicio: analiza src con ESLint
npm run lint
```

**Resultado esperado:**

```text

> lint
> eslint src

```

Sin ninguna línea de problema. El import cruzado de `Resumen.jsx` existe, pero nadie lo está buscando.

### 2 — Mira el import que cruza la frontera

Abre `src/modulos/resumen/Resumen.jsx`. Es la fuente del problema, así que léela antes de escribir la regla:

```jsx
// Resumen lee directamente el almacén interno de otro módulo.
import { tareas } from '../tareas/almacen';

export default function Resumen() {
  const pendientes = tareas.filter((t) => !t.hecha).length;
  return <p>Pendientes: {pendientes} de {tareas.length}</p>;
}
```

`'../tareas/almacen'` sube a `src/modulos/` y entra en la carpeta de otro módulo. Esa forma de ruta,
`../<otro-modulo>/<fichero>`, es lo que la regla va a prohibir.

### 3 — Añade la regla de frontera

Sustituye `rules: {}` en `eslint.config.js` por la regla `no-restricted-imports` con un patrón. El patrón
`../*/**` casa con cualquier import que salga de la carpeta actual y entre en otra carpeta y en un fichero de
ella, y el mensaje le dice a quien la incumple qué hacer en su lugar.

```js
// Configuración de ESLint (formato plano).
module.exports = [
  {
    files: ['src/**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      // Frontera: ningún fichero de src/modulos/<x>/ puede entrar en otro módulo.
      // Los datos llegan por props desde quien compone (src/App.jsx).
      'no-restricted-imports': ['error', {
        patterns: [{ group: ['../*/**'], message: 'No importes de otro módulo: recibe los datos por props.' }],
      }],
    },
  },
];
```

```bash
# En inicio/: vuelve a pasar el linter, ahora con la regla
npm run lint
```

**Resultado esperado** (la ruta del fichero sale completa, empezando por `/workspaces/react-microfrontends-201/ejercicios/`):

```text

> lint
> eslint src


M02-01-fronteras-entre-modulos/inicio/src/modulos/resumen/Resumen.jsx
  2:1  error  '../tareas/almacen' import is restricted from being used by a pattern. No importes de otro módulo: recibe los datos por props  no-restricted-imports

✖ 1 problem (1 error, 0 warnings)

```

| Parte | Cómo se lee |
|-------|-------------|
| `Resumen.jsx` · `2:1` | Fichero y línea del import que cruza |
| `'../tareas/almacen' import is restricted … by a pattern` | Lo ha detectado el patrón `../*/**` |
| `No importes de otro módulo: …` | Tu mensaje: la instrucción para arreglarlo |
| `✖ 1 problem (1 error …)` | `npm run lint` termina con error: en un pipeline, el cambio no pasaría |

`App.jsx` también importa `./modulos/tareas/almacen` y no aparece: empieza por `./`, no por `../`. Es lo que
quieres, porque `App.jsx` es quien compone y tiene permiso para conocer a los dos módulos.

### 4 — Convierte `Resumen` en un componente con contrato

Reescribe `src/modulos/resumen/Resumen.jsx` para que no importe nada de `tareas`. Lo que antes calculaba con el
almacén ajeno ahora lo recibe como dos props: `total` y `pendientes`. Ese par de props es su contrato.

```jsx
// Resumen no sabe de dónde salen las tareas: las recibe por props (su contrato).
export default function Resumen({ total, pendientes }) {
  return <p>Pendientes: {pendientes} de {total}</p>;
}
```

`Resumen` ya no sabe qué es una tarea ni cómo se marca como hecha: solo pinta dos números.

### 5 — Haz que `App` cumpla el contrato

Quien compone la página calcula los dos valores y se los pasa a `Resumen`. Edita `src/App.jsx`:

```jsx
import { tareas } from './modulos/tareas/almacen';
import ListaTareas from './modulos/tareas/ListaTareas';
import Resumen from './modulos/resumen/Resumen';

// App compone los módulos y es la única que conoce a los dos.
export default function App() {
  const pendientes = tareas.filter((t) => !t.hecha).length;
  return (
    <main>
      <h1>Tareas</h1>
      <Resumen total={tareas.length} pendientes={pendientes} />
      <ListaTareas tareas={tareas} />
    </main>
  );
}
```

El cálculo de pendientes sale de `resumen` y pasa al único sitio que conoce el formato de las tareas.

### 6 — Comprueba la frontera y la página

Pasa el linter otra vez y arranca la aplicación (si ya estaba en marcha, el servidor recarga solo al guardar).

```bash
# En inicio/: el linter ya no debe encontrar imports cruzados
npm run lint
```

**Resultado esperado:**

```text

> lint
> eslint src

```

```bash
# En inicio/: arranca (o deja en marcha) la aplicación en el puerto 3000
npm start
```

**Resultado esperado** en la terminal:

```text
webpack 5.112.2 compiled successfully
<i> [webpack-dev-server] Loopback: http://localhost:3000/, http://[::1]:3000/
```

Y en el navegador, en el puerto 3000, con la pestaña **Red** (Network) de **F12** abierta:

```text
Red      200  /main.js
── Texto de la página:
Tareas

Pendientes: 2 de 3

✔ Revisar la factura
○ Llamar al proveedor
○ Preparar la demo
```

La página es idéntica a la del principio. Ese es el punto: has cambiado la forma de depender, no lo que ve el
usuario.

## Comprueba tu entendimiento

**La regla vigila la frontera**
Vuelve a poner en `Resumen.jsx` la línea `import { tareas } from '../tareas/almacen';` y ejecuta `npm run lint`.
→ Sale el mismo `error` del paso 3 en la línea 1 o 2 de `Resumen.jsx`. Quita la línea.

**El contrato está en un solo sitio**
Abre `Resumen.jsx` y lista lo que necesita para pintarse.
→ Solo `total` y `pendientes`, en la firma de la función. No hay ningún import.

**Quien compone sí puede conocer a todos**
Busca en `src/App.jsx` los imports de `./modulos/…`.
→ Importa de `tareas` y de `resumen`, y la regla no lo marca porque las rutas empiezan por `./`.

## Experimenta

**La regla funciona en las dos direcciones.** Añade al principio de `src/modulos/tareas/ListaTareas.jsx` un
import de `resumen`. Antes de ejecutar, predice: ¿lo marca la regla aunque sea `tareas` quien importa?

```jsx
// Experimento: tareas entra en resumen
import Resumen from '../resumen/Resumen';
```

```bash
# En inicio/
npm run lint
```

**Resultado esperado** (recortado: la ruta sale completa y antes van las líneas `> lint`):

```text
…/src/modulos/tareas/ListaTareas.jsx
  1:1  error  '../resumen/Resumen' import is restricted from being used by a pattern. No importes de otro módulo: recibe los datos por props  no-restricted-imports

✖ 1 problem (1 error, 0 warnings)
```

La regla no sabe qué módulo es «el de los datos»: prohíbe cualquier cruce. Quita la línea.

**Una ruta más larga no la esquiva.** Cambia el import de antes por uno que dé un rodeo hasta el mismo fichero
desde `src/modulos/resumen/Resumen.jsx`, y predice si pasa:

```jsx
// Experimento: rodeo hasta el almacén de tareas
import { tareas } from '../../modulos/tareas/almacen';
```

```bash
# En inicio/
npm run lint
```

**Resultado esperado** (recortado, como el anterior):

```text
…/src/modulos/resumen/Resumen.jsx
  1:1  error  '../../modulos/tareas/almacen' import is restricted from being used by a pattern. No importes de otro módulo: recibe los datos por props  no-restricted-imports

✖ 1 problem (1 error, 0 warnings)
```

`../../modulos/tareas/almacen` también empieza por `../` y entra en una carpeta: el patrón lo atrapa. Quita la
línea.

## Investiga

**Lo que la regla no ve.** `no-restricted-imports` mira las sentencias `import … from '…'`. Escribe en
`src/modulos/resumen/Resumen.jsx` una forma de llegar al almacén que no sea esa sentencia y comprueba si el linter
la ve:

```jsx
// Investigación: un import dinámico dentro del componente
export default function Resumen({ total, pendientes }) {
  import('../tareas/almacen');
  return <p>Pendientes: {pendientes} de {total}</p>;
}
```

```bash
# En inicio/
npm run lint
```

**Resultado esperado:**

```text

> lint
> eslint src

```

Ningún error: el import dinámico (`import('…')`) y `require('…')` cruzan la frontera sin que esta regla los vea.
Busca en la documentación de ESLint qué regla vigila `require` y qué opciones de `no-restricted-imports` existen
(`paths`, `patterns`, `importNames`) para afinar qué se permite. Deja `Resumen.jsx` como en el paso 4.

## Mejora

**Que el linter corra antes de arrancar.** Hoy alguien puede saltarse `npm run lint` y arrancar con el import
cruzado. Haz que `npm start` pase primero el linter: en el `package.json` de `inicio/`, añade un script
`prestart`, que npm ejecuta siempre antes de `start`.

```jsonc
{
  "name": "m02-01-fronteras",
  "private": true,
  "scripts": {
    // npm ejecuta prestart antes de start: si el linter falla, no arranca
    "prestart": "eslint src",
    "start": "webpack serve",
    "lint": "eslint src"
  }
}
```

Vuelve a poner el import cruzado en `Resumen.jsx` y ejecuta `npm start`: debe salir el error de ESLint y el
servidor no debe arrancar. Quita el import y comprueba que arranca. En un proyecto real, el mismo `npm run lint`
va en el pipeline de integración continua de cada microaplicación.

## Reto

### 1 — El nombre de la tarea pendiente

**La situación:** se quiere que el resumen muestre también el texto de la primera tarea pendiente («Siguiente:
Llamar al proveedor»). Un compañero propone que `Resumen` vuelva a importar el almacén, «solo para esto».

**Qué haces:** amplías el contrato de `Resumen` con una prop nueva, `siguiente`, y haces que `App.jsx` la calcule
y la pase. `Resumen` sigue sin importar nada de `tareas`.

**Pistas:** `Array.prototype.find` para la primera tarea con `hecha: false`; el operador `?.` por si no queda
ninguna; un valor por defecto en la desestructuración de props.

**Lo que buscas:** `npm run lint` sin errores y, en la página, una línea nueva con `Siguiente: Llamar al
proveedor` debajo de `Pendientes: 2 de 3`.

<details>
<summary>Ver solución</summary>

`src/modulos/resumen/Resumen.jsx`:

```jsx
// El contrato crece con una prop opcional; sigue sin importar nada de otro módulo.
export default function Resumen({ total, pendientes, siguiente = null }) {
  return (
    <>
      <p>Pendientes: {pendientes} de {total}</p>
      {siguiente && <p>Siguiente: {siguiente}</p>}
    </>
  );
}
```

`src/App.jsx`, dentro de `App`:

```jsx
  const pendientes = tareas.filter((t) => !t.hecha).length;
  // App conoce el formato de las tareas; Resumen solo recibe el texto.
  const siguiente = tareas.find((t) => !t.hecha)?.texto;
  // …
  <Resumen total={tareas.length} pendientes={pendientes} siguiente={siguiente} />
```

Cuando una parte necesita un dato nuevo de otra, se amplía el contrato en el punto donde se componen, no se
abre un atajo hacia dentro del otro módulo. La prop es opcional para que quien todavía no la pase siga
funcionando. **La regla:** un contrato crece añadiendo props opcionales; nunca abriendo un import hacia dentro
de otro módulo.

</details>

## Errores frecuentes

| Síntoma | Causa probable | Cómo arreglarlo |
|---------|----------------|-----------------|
| `npm run lint` no da ningún error con el import cruzado | Estás en `solucion/` (ya no tiene el import) o no has guardado `eslint.config.js` | Comprueba la carpeta (bloque de abajo) y que `rules` tiene `'no-restricted-imports'` |
| `Pendientes:  de ` (sin números) | `Resumen` espera `total` y `pendientes`, y `App.jsx` sigue con `<Resumen />` | Pasa las dos props en `App.jsx` (paso 5) |
| Has puesto la regla pero `npm run lint` sigue limpio en `inicio/` | Has editado `solucion/eslint.config.js` en lugar del de `inicio/` | Edita el de `inicio/` y lanza el linter desde allí (bloque de abajo) |
| `Error: listen EADDRINUSE: address already in use :::3000` | Otro ejercicio ocupa el puerto 3000 | Páralo con `Ctrl+C` o libera el puerto (bloque de abajo) |

```bash
# Comprueba en qué carpeta estás: debe acabar en M02-01-fronteras-entre-modulos/inicio
pwd
# Desde la raíz del repositorio: entra en inicio/ y pasa el linter
cd ejercicios/M02-01-fronteras-entre-modulos/inicio && npm run lint
```

```bash
# Libera el puerto 3000 si otro ejercicio lo ocupa
fuser -k 3000/tcp
```

## Conclusiones

### Qué es una frontera de módulo

Es el límite entre lo que un módulo considera suyo y lo que ofrece a los demás. Dentro, cambia lo que quiera;
hacia fuera, solo existe su contrato. En React, para un componente, ese contrato son sus props.

```text
           App.jsx (compone)
          /                \
  tareas (almacen)      resumen
         └── props: total, pendientes ──┘
      nadie importa de la carpeta de otro
```

### Cómo debe ser

| Requisito | En el lab |
|-----------|-----------|
| Ningún módulo importa ficheros de otro | `Resumen.jsx` sin imports; la regla `../*/**` lo hace cumplir |
| Los datos llegan por un contrato explícito | `Resumen({ total, pendientes })` |
| Un único sitio conoce a todos los módulos | `App.jsx`, con imports que empiezan por `./` |
| La frontera se comprueba sola | `npm run lint` termina con `✖ 1 problem` si alguien la cruza |

### Dónde se rompe y cómo lo has detectado

| Fallo | Cómo lo has visto | Qué provoca |
|-------|-------------------|-------------|
| Import directo al almacén de otro módulo | `error … '../tareas/almacen' import is restricted` | El módulo no se puede separar sin llevarse al otro |
| Import en sentido contrario | `error … '../resumen/Resumen'` en `ListaTareas.jsx` | Dependencia circular entre módulos |
| `import('…')` o `require('…')` | `npm run lint` limpio con el import dinámico dentro | La frontera se cruza sin aviso: la regla solo ve `import … from` |
| Contrato sin cumplir | `Pendientes:  de ` si `App` no pasa las props | El componente se pinta, pero vacío |

### Cómo se perfecciona

En un proyecto real la frontera se describe por módulos, no por forma de ruta: reglas como las de
`eslint-plugin-boundaries` o `import/no-restricted-paths` declaran qué carpeta puede depender de cuál. Cada
módulo expone un único punto de entrada (`index.js`) con lo público, y las props se documentan o se tipan
(PropTypes, TypeScript). El linter corre en el pipeline de cada microaplicación. Cuando los módulos pasen a ser
microaplicaciones federadas, la frontera ya estará trazada.

### En una frase

> 🔑 Un módulo solo se puede separar si nadie entra en su carpeta: lo que necesita le llega por props desde
> quien compone, y una regla del linter lo comprueba en cada cambio.
