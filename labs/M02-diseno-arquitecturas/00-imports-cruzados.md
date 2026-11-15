# Imports cruzados

[← Página anterior](README.md) · [Siguiente página →](01-lab-fronteras-entre-modulos.md)

Esta demostración muestra el **acoplamiento entre módulos** en su forma más pequeña: una aplicación React con
dos carpetas, `clientes` y `pedidos`, y una sola línea que las ata. `pedidos` importa una función de un fichero
interno de `clientes`. Mientras nadie toca ese fichero, todo funciona; en cuanto `clientes` cambia algo que
considera suyo, se rompe la otra parte, y el aviso llega tarde y en el sitio equivocado.

## Punto de partida

- Código: [`ejercicios/M02-00-imports-cruzados/`](../../ejercicios/M02-00-imports-cruzados/), una aplicación React
  con Webpack en un único bundle (aquí todavía no hay [microfrontends](../glosario/01-arquitectura.md#microfrontend) ni [Module Federation](../glosario/02-module-federation.md#module-federation)).
- Estado: las dependencias del repositorio instaladas en la raíz (el Codespace ejecuta `npm ci` al crearse).
- URL: puerto **3000** (pestaña **Puertos** de VS Code, icono del globo; fuera de Codespaces,
  `http://localhost:3000`).

La estructura del ejercicio es esta:

```text
src/
├── index.js                  # compone la página: <Clientes /> y <Pedidos />
└── modulos/
    ├── clientes/
    │   ├── Clientes.jsx      # lista de clientes
    │   └── datos.js          # datos internos de clientes y nombreCompleto(id)
    └── pedidos/
        └── Pedidos.jsx       # lista de pedidos; importa ../clientes/datos
```

## Recorrido

### 1 — La aplicación en marcha

La aplicación se arranca desde su carpeta con el servidor de desarrollo de Webpack.

```bash
# Desde la raíz del repositorio, entra en la carpeta de la demo
cd ejercicios/M02-00-imports-cruzados
# Arranca el servidor de desarrollo en el puerto 3000 (ficha: ../comandos-lab.md#npm-start)
npm start
```

Ficha del comando: [`npm start`](../comandos-lab.md#npm-start).

**Resultado** en la terminal:

```text
webpack 5.112.2 compiled successfully
<i> [webpack-dev-server] Loopback: http://localhost:3000/, http://[::1]:3000/
```

Al abrir el puerto 3000, la pestaña **Red** (Network) de las herramientas del navegador (**F12**) muestra un solo
fichero de código, y la página pinta las dos secciones:

```text
Red      200  /main.js
── Texto de la página:
Clientes
Lucía Martín
Omar Haddad
Pedidos
P-101 · Lucía Martín · 42 €
P-102 · Omar Haddad · 18 €
```

Cada pedido muestra el nombre de su cliente. Ese nombre no está en `pedidos`: sale de `clientes`.

### 2 — La línea que ata los dos módulos

En `src/modulos/pedidos/Pedidos.jsx`, la primera línea de código entra en la carpeta de otro módulo:

```jsx
// Import cruzado: pedidos entra en un fichero interno de clientes.
import { nombreCompleto } from '../clientes/datos';

const pedidos = [
  { id: 'P-101', cliente: 1, total: 42 },
  { id: 'P-102', cliente: 2, total: 18 },
];

export default function Pedidos() {
  return (
    <section>
      <h2>Pedidos</h2>
      <ul>
        {pedidos.map((p) => <li key={p.id}>{p.id} · {nombreCompleto(p.cliente)} · {p.total} €</li>)}
      </ul>
    </section>
  );
}
```

Y `src/modulos/clientes/datos.js` se presenta como lo que es, un fichero interno de `clientes`:

```js
// Datos internos del módulo clientes.
export const clientes = [
  { id: 1, nombre: 'Lucía Martín' },
  { id: 2, nombre: 'Omar Haddad' },
];

export function nombreCompleto(id) {
  return clientes.find((c) => c.id === id)?.nombre ?? 'desconocido';
}
```

Nada en `datos.js` dice que `pedidos` dependa de él. Quien mantiene `clientes` no tiene forma de saberlo
mirando su propia carpeta.

### 3 — Encontrar los imports que cruzan carpetas

Un import que sube un nivel (`../`) desde un módulo y entra en otro es la marca del acoplamiento. Una búsqueda
de texto basta para listarlos todos.

```bash
# En ejercicios/M02-00-imports-cruzados: busca imports que salen de la carpeta del módulo
grep -rn "from '\.\./" src/modulos
```

**Resultado:**

```text
src/modulos/pedidos/Pedidos.jsx:2:import { nombreCompleto } from '../clientes/datos';
```

Hay uno: fichero, línea y destino. En una aplicación real esta lista tiene decenas de entradas, y cada una es un
cambio que no se puede hacer en un módulo sin revisar otro.

### 4 — `clientes` cambia algo suyo

El equipo de `clientes` renombra su función `nombreCompleto` a `nombreCliente` en `src/modulos/clientes/datos.js`,
sin tocar nada fuera de su carpeta:

```js
// Antes: export function nombreCompleto(id) {
export function nombreCliente(id) {
  return clientes.find((c) => c.id === id)?.nombre ?? 'desconocido';
}
```

Con el servidor parado (`Ctrl+C`), se compila el proyecto una vez para ver qué dice Webpack:

```bash
# En ejercicios/M02-00-imports-cruzados: compila una vez, sin servidor
npx webpack --mode development
```

**Resultado** (el tiempo de compilación cambia en cada ejecución):

```text
WARNING in ./src/modulos/pedidos/Pedidos.jsx 19:32-46
export 'nombreCompleto' (imported as 'nombreCompleto') was not found in '../clientes/datos' (possible exports: clientes, nombreCliente)
webpack 5.112.2 compiled with 1 warning in 567 ms
```

| Qué se ve | Qué significa |
|-----------|---------------|
| `WARNING in ./src/modulos/pedidos/Pedidos.jsx` | El aviso sale en `pedidos`, un módulo que nadie ha tocado |
| `was not found in '../clientes/datos'` | `pedidos` dependía de un nombre interno de `clientes` |
| `possible exports: clientes, nombreCliente` | `clientes` sigue funcionando; lo que se ha roto es el acuerdo implícito |
| `compiled with 1 warning` | Es un aviso, no un error: la compilación termina y el bundle se genera igual |

El bundle se genera con `nombreCompleto` sin definir dentro de `pedidos`, así que el fallo de verdad se ve al
ejecutar la página en el navegador, no al compilar.

Para dejar la demo como estaba, se deshace el cambio:

```bash
# Desde la raíz del repositorio: devuelve datos.js a su versión original
git checkout -- ejercicios/M02-00-imports-cruzados/src/modulos/clientes/datos.js
```

## Qué queda visto

- Un import entre carpetas convierte un detalle interno de un módulo (`nombreCompleto`) en un [contrato](../glosario/01-arquitectura.md#contrato) con otro,
  sin que ninguno de los dos lo declare.
- El cambio se hace en `clientes` y el aviso aparece en `pedidos`, y solo como `WARNING`.
- Encontrar estos imports con `grep` es posible, pero es una búsqueda que alguien tiene que acordarse de hacer.
  Si cada módulo se convierte después en una [microaplicación](../glosario/01-arquitectura.md#microaplicacion) con su propio equipo y su propio despliegue, este
  import ya no se puede resolver en el mismo bundle.

El laboratorio [01 — Fronteras entre módulos](01-lab-fronteras-entre-modulos.md) practica este concepto con
otro ejercicio y se puede hacer sin haber seguido esta demostración.

**La pregunta que abre el lab:** ¿cómo se consigue que el propio proyecto se niegue a aceptar un import que cruza
de un módulo a otro, y por dónde le llegan entonces los datos al módulo que los necesita?
