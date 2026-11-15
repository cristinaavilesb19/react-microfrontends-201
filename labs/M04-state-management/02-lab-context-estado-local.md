# Lab — Context para el estado local

[← Página anterior](01-lab-store-redux-compartido.md) · [Siguiente página →](03-lab-sincronizar-estado.md)

En este laboratorio practicas **[Context API](../glosario/03-estado-comunicacion.md#context-api) como estado de [microaplicación](../glosario/01-arquitectura.md#microaplicacion)**: un estado que comparten todos los
componentes de una microaplicación y que no sale de ella. El ejercicio es un [remote](../glosario/02-module-federation.md#remote) `formulario` con dos
campos (nombre y ciudad) y un resumen. Lo vas a pasar de props en cascada a un Context privado, y vas a
comprobar que el [host](../glosario/02-module-federation.md#host) no puede alcanzar ese estado aunque lo intente.

### Objetivo

Comprender qué es Context API como estado de microaplicación: cómo funciona, cómo debe ser, cómo se detectan
sus debilidades y cómo se mejora.

### Punto de partida

- Carpeta: `ejercicios/M04-02-context-estado-local/inicio`, con dos aplicaciones:

  | Aplicación | Puerto | Qué hace |
  |------------|--------|----------|
  | `host` | 3000 | Pinta **dos** instancias del remote: «Alta de cliente A» y «Alta de cliente B» |
  | `formulario` | 3001 | Expone `./Formulario`; en `inicio/` el estado baja por props |

- Arranque, desde la raíz del repositorio (ficha: [`npm start`](../comandos-lab.md#npm-start)):

  ```bash
  # Entra en el punto de partida del lab y arranca host y remote a la vez
  cd ejercicios/M04-02-context-estado-local/inicio
  npm start
  ```

- URL: pestaña **Puertos** de VS Code → puerto **3000** → icono del globo (**Abrir en el navegador**).
  Fuera de Codespaces, `http://localhost:3000`.
- Si quieres volver a empezar (ficha: [`reiniciar`](../comandos-lab.md#reiniciar)):

  ```bash
  # Deja inicio/ como está en el repositorio
  bash scripts/reiniciar.sh M04-02-context-estado-local
  ```

> [!NOTE]
> El navegador solo habla con el host: el remote se pide en `/mf/formulario/remoteEntry.js` y el servidor del
> host lo reenvía al puerto 3001 (`devServer.proxy`). `src/index.js` solo hace `import('./bootstrap')`: ese
> [arranque asíncrono](../glosario/02-module-federation.md#arranque-asincrono) da tiempo a [Module Federation](../glosario/02-module-federation.md#module-federation) a cargar el remote y a compartir React antes de pintar.

### Qué está pasando

No todo el estado de un [microfrontend](../glosario/01-arquitectura.md#microfrontend) es global. Los datos de un formulario a medio rellenar solo importan a
ese formulario: el host no tiene por qué verlos, y si los viera acabaría dependiendo de su forma. Ese estado
es **de la microaplicación**: lo comparten varios de sus componentes, pero no cruza su [frontera](../glosario/01-arquitectura.md#frontera).

Pasarlo por props funciona, pero obliga a que componentes intermedios reciban datos que no usan solo para
reenviarlos. Un **Context** lo resuelve: un `Provider` guarda el estado arriba y cualquier componente de debajo
lo lee con un hook. Si el Context no se expone en el `remoteEntry.js`, nadie de fuera puede leerlo: el estado
queda **privado** por construcción.

| Pieza | Qué representa |
|-------|----------------|
| `Formulario` | El componente expuesto: la frontera de la microaplicación |
| `Pasos` | Un componente intermedio que no usa los datos |
| `PasoNombre`, `PasoCiudad`, `Resumen` | Los que sí leen o cambian los datos |
| `FormularioContext.jsx` (lo creas tú) | El estado de la microaplicación, sin exponer |

### 1 — Ver dos instancias independientes

Antes de cambiar nada, comprueba cómo se comporta el punto de partida.

1. Abre el puerto 3000.
2. En «Alta de cliente A», escribe `Marta` en **Nombre**.
3. En «Alta de cliente B», escribe `Vigo` en **Ciudad**.

**Resultado esperado** en el terminal (el orden de las líneas cambia en cada arranque):

```text
> concurrently -n formulario,host "npm start --prefix formulario" "npm start --prefix host"
[host] webpack 5.112.2 compiled successfully
[host] <i> [webpack-dev-server] Loopback: http://localhost:3000/, http://[::1]:3000/
[formulario] webpack 5.112.2 compiled successfully
[formulario] <i> [webpack-dev-server] Loopback: http://localhost:3001/, http://[::1]:3001/
```

Y en la página:

```text
Host
Alta de cliente A

Resumen: Marta · —

Alta de cliente B

Resumen: — · Vigo
```

**Cómo se lee:** cada `<Formulario />` del host tiene su propio estado: lo que escribes en A no aparece en B.
Es estado local de cada instancia. Funciona; lo que vas a mejorar es cómo llega ese estado a los componentes.

### 2 — Leer las props en cascada

Abre `inicio/formulario/src/Formulario.jsx` y sigue el camino de `datos`:

```jsx
export default function Formulario({ titulo }) {
  const [datos, setDatos] = useState({ nombre: '', ciudad: '' });
  return (
    <fieldset>
      <legend>{titulo}</legend>
      <Pasos datos={datos} setDatos={setDatos} />
    </fieldset>
  );
}

function Pasos({ datos, setDatos }) {
  // Pasos no usa datos: solo los reenvía.
  return (
    <>
      <PasoNombre datos={datos} setDatos={setDatos} />
      <PasoCiudad datos={datos} setDatos={setDatos} />
      <Resumen datos={datos} />
    </>
  );
}
```

**Cómo se lee:** `Pasos` recibe `datos` y `setDatos` y no hace nada con ellos. Con un paso más (dirección,
teléfono…) cada componente intermedio tendría que reenviar las mismas dos props.

### 3 — Crear el Context de la microaplicación

Crea el fichero `inicio/formulario/src/FormularioContext.jsx` con el estado y un hook para leerlo:

```jsx
import { createContext, useContext, useState } from 'react';

// Contexto privado de la microaplicación: no se exporta en «exposes».
const FormularioContext = createContext(null);

// Guarda el estado y lo pone al alcance de todo lo que tenga debajo
export function FormularioProvider({ children }) {
  const [datos, setDatos] = useState({ nombre: '', ciudad: '' });
  // Una sola forma de cambiar un campo, en lugar de que cada paso copie el objeto
  const cambiar = (campo, valor) => setDatos((d) => ({ ...d, [campo]: valor }));
  return <FormularioContext.Provider value={{ datos, cambiar }}>{children}</FormularioContext.Provider>;
}

// El hook que usan los pasos; falla en voz alta si falta el Provider
export function useFormulario() {
  const valor = useContext(FormularioContext);
  if (!valor) throw new Error('useFormulario fuera de <FormularioProvider>');
  return valor;
}
```

**Cómo se lee:** el valor por defecto del contexto es `null` a propósito. Si alguien usa `useFormulario` sin
`Provider` encima, el `throw` lo dice con un mensaje claro en lugar de un `undefined` más abajo.

### 4 — Usar el Context en el formulario

Sustituye el contenido de `inicio/formulario/src/Formulario.jsx` por:

```jsx
import { FormularioProvider, useFormulario } from './FormularioContext';

// Cada instancia crea su Provider: su estado es local a esa instancia de la microaplicación.
export default function Formulario({ titulo }) {
  return (
    <FormularioProvider>
      <fieldset>
        <legend>{titulo}</legend>
        <Pasos />
      </fieldset>
    </FormularioProvider>
  );
}

// Ya no recibe ni reenvía nada
function Pasos() {
  return (
    <>
      <PasoNombre />
      <PasoCiudad />
      <Resumen />
    </>
  );
}

function PasoNombre() {
  const { datos, cambiar } = useFormulario();
  return <input placeholder="Nombre" value={datos.nombre} onChange={(e) => cambiar('nombre', e.target.value)} />;
}

function PasoCiudad() {
  const { datos, cambiar } = useFormulario();
  return <input placeholder="Ciudad" value={datos.ciudad} onChange={(e) => cambiar('ciudad', e.target.value)} />;
}

function Resumen() {
  const { datos } = useFormulario();
  return <p>Resumen: {datos.nombre || '—'} · {datos.ciudad || '—'}</p>;
}
```

Guarda. Webpack recompila el remote solo.

### 5 — Comprobar que se comporta igual

Es una refactorización: en pantalla no debe cambiar nada. Recarga el puerto 3000 y repite el paso 1: `Marta`
en el **Nombre** de A y `Vigo` en la **Ciudad** de B.

**Resultado esperado** en la página:

```text
Host
Alta de cliente A

Resumen: Marta · —

Alta de cliente B

Resumen: — · Vigo
```

**Cómo se lee:** el mismo resultado que en el paso 1. Las dos instancias siguen separadas porque **cada
`<Formulario />` crea su propio `<FormularioProvider>`**, y cada Provider tiene su `useState`. Context no hace
que el estado sea global: lo comparte solo con lo que hay debajo de cada Provider.

## Comprueba tu entendimiento

**El host no sabe nada del estado**
Abre `inicio/host/src/App.jsx` y busca `datos` o `useFormulario`.
→ No aparecen: el host solo pinta `<Formulario titulo="…" />`.

**Lo que sale en el contenedor**
Abre `inicio/formulario/webpack.config.js` y mira `exposes`.
→ Solo está `'./Formulario'`. `FormularioContext.jsx` no está expuesto.

**La microaplicación sola**
Abre el puerto 3001 y escribe en **Nombre**.
→ La página aislada pinta un solo formulario, «Formulario aislado», y su resumen sigue lo que escribes.

## Experimenta

**¿Qué pasa si un componente usa el hook sin Provider?** Predice antes: ¿se pinta el formulario vacío, se
queda en blanco o sale un error?

En `inicio/formulario/src/Formulario.jsx`, quita el `<FormularioProvider>` que envuelve al `<fieldset>`:

```jsx
export default function Formulario({ titulo }) {
  // Experimento: sin Provider, los pasos no encuentran el contexto
  return (
    <fieldset>
      <legend>{titulo}</legend>
      <Pasos />
    </fieldset>
  );
}
```

Recarga el puerto 3000 con **F12** → **Consola** abierta.

**Resultado esperado** en la **Consola**:

```text
Consola (error)  Uncaught useFormulario fuera de <FormularioProvider>
Consola (aviso)  %s

%s
 An error occurred in the <PasoNombre> component. Consider adding an error boundary to your tree to customize error handling behavior.
Visit https://react.dev/link/error-boundaries to learn more about error boundaries.
```

**Cómo se lee:** el primer componente que llama a `useFormulario` (`PasoNombre`) recibe `null` del contexto y
lanza el error que escribiste en el paso 3. React lo atribuye a `<PasoNombre>` y, como no hay barrera de
errores, desmonta el árbol. Sin el `throw`, el error habría sido un `Cannot read properties of null` mucho más
difícil de rastrear. Vuelve a poner el `<FormularioProvider>`.

## Mejora

**Un campo más sin tocar los intermedios.** Añade un campo **Teléfono** al formulario: un `telefono: ''` en el
estado inicial de `FormularioProvider`, un componente `PasoTelefono` que use `useFormulario()` y `cambiar('telefono', …)`,
y `<PasoTelefono />` dentro de `Pasos`. Haz que `Resumen` lo muestre.

```jsx
// En FormularioContext.jsx: el estado inicial con el campo nuevo
const [datos, setDatos] = useState({ nombre: '', ciudad: '', telefono: '' });

// En Formulario.jsx: el paso nuevo lee y escribe por el contexto
function PasoTelefono() {
  const { datos, cambiar } = useFormulario();
  return <input placeholder="Teléfono" value={datos.telefono} onChange={(e) => cambiar('telefono', e.target.value)} />;
}
```

Comprueba que `Pasos` solo gana una línea (`<PasoTelefono />`) y ninguna prop, y que el host no cambia.

## Reto

### 1 — El host quiere leer el formulario

**La situación:** alguien del equipo del host propone mostrar en la cabecera el nombre que se está escribiendo
en el formulario. Como el remote ya tiene `useFormulario`, sugiere importarlo directamente desde el host:
`formulario/FormularioContext`.

**Qué haces:** en `inicio/host/src/App.jsx`, añade un import de `formulario/FormularioContext` y recarga el
puerto 3000 con la **Consola** abierta.

```jsx
// Experimento del reto: importar algo del remote que no está en exposes
import { useFormulario } from 'formulario/FormularioContext';
```

**Pistas:** mira qué módulos publica el remote en su `webpack.config.js` y piensa qué le pide el host al
`remoteEntry.js` con ese import.

**Lo que buscas:** saber qué error da, por qué, y qué tendría que cambiar el **remote** (no el host) para que el
host pudiera enterarse del nombre.

<details>
<summary>Ver solución</summary>

**Resultado esperado** en la **Consola**, y la página en blanco:

```text
Consola (error)  Uncaught Module "./FormularioContext" does not exist in container.
```

El contenedor del remote (`remoteEntry.js`) solo sabe entregar lo que está en `exposes`, y ahí solo está
`./Formulario`. El host pide `./FormularioContext`, el contenedor no lo tiene y el import falla al cargar: la
página se queda vacía. Esa es la frontera funcionando: el estado del formulario es privado de la
microaplicación.

Si el host de verdad necesita el dato, no se arregla exponiendo el contexto (el host dependería de la forma
interna del estado y no funcionaría igual, porque cada `<Formulario />` tiene su Provider). Se arregla con un
[contrato](../glosario/01-arquitectura.md#contrato) explícito: una prop `alCambiar` en `Formulario` que el remote llama con lo que quiere publicar, o un
[evento global](../glosario/03-estado-comunicacion.md#evento-global). Quita el import del host para dejarlo como estaba.

**La regla:** lo que no está en `exposes` es privado; si el host necesita un dato, el remote decide publicarlo
con un contrato, no abre su estado interno.

</details>

## Errores frecuentes

| Síntoma | Causa probable | Cómo arreglarlo |
|---------|----------------|-----------------|
| `useFormulario fuera de <FormularioProvider>` en la **Consola** | Un paso se pinta fuera del Provider | Envuelve el `<fieldset>` con `<FormularioProvider>` (paso 4) |
| `Module "./FormularioContext" does not exist in container.` | El host importa algo que el remote no expone | Quita ese import; si hace falta el dato, el remote lo publica con una prop o un evento |
| Lo que escribes en A aparece también en B | Un único Provider envuelve a las dos instancias, o el estado se ha sacado a un módulo fuera del componente | Cada `<Formulario />` crea su propio `<FormularioProvider>` |
| El campo no deja escribir | `value` sin `onChange` que actualice el contexto | Usa `cambiar('campo', e.target.value)` |
| `Module not found: Error: Can't resolve './FormularioContext'` en el terminal | El fichero no se llama exactamente `FormularioContext.jsx` o no está en `formulario/src/` | Revisa nombre y carpeta del paso 3 |

## Conclusiones

### Qué es Context API como estado de microaplicación

Un estado que comparten los componentes de una microaplicación a través de un `Provider` y un hook, y que no
se publica fuera de ella. Cada instancia de la microaplicación tiene su Provider y, con él, su propio estado.

```text
host
├── <Formulario titulo="A">  →  <FormularioProvider>  →  datos A  →  PasoNombre, PasoCiudad, Resumen
└── <Formulario titulo="B">  →  <FormularioProvider>  →  datos B  →  PasoNombre, PasoCiudad, Resumen
           ▲
           └── exposes: solo ./Formulario  (FormularioContext no sale del remote)
```

### Cómo debe ser

| Requisito | En el lab |
|-----------|-----------|
| El Provider dentro del componente expuesto | `Formulario` envuelve su contenido en `<FormularioProvider>` |
| Un hook propio para leerlo | `useFormulario()` |
| Fallo claro si falta el Provider | `createContext(null)` y `throw` en el hook |
| Una forma única de cambiar el estado | `cambiar(campo, valor)` |
| El contexto fuera de `exposes` | Solo `./Formulario` en `formulario/webpack.config.js` |

### Dónde se rompe y cómo lo has detectado

| Fallo | Cómo lo has visto | Qué provoca |
|-------|-------------------|-------------|
| Props en cascada | `Pasos` reenvía `datos` y `setDatos` sin usarlos (paso 2) | Cada campo nuevo toca todos los intermedios |
| Hook sin Provider | `useFormulario fuera de <FormularioProvider>` (Experimenta) | El árbol se desmonta |
| El host intenta leer el estado del remote | `Module "./FormularioContext" does not exist in container.` (Reto) | La página no carga; la frontera lo impide |

### Cómo se perfecciona

- Separar en dos contextos el valor y la función de cambio (`cambiar` no cambia nunca), para que los
  componentes que solo escriben no se vuelvan a pintar con cada tecla.
- Memorizar el objeto `value` con `useMemo` cuando el Provider se vuelve a pintar por otros motivos.
- Si el formulario crece, pasar de `useState` a `useReducer` dentro del Provider, con acciones con nombre.
- Publicar hacia fuera solo lo necesario, con una prop o un evento con nombre y forma documentados.

### En una frase

> 🔑 Context guarda el estado que una microaplicación comparte por dentro; si no está en `exposes`, nadie de fuera
> puede leerlo, y cada instancia tiene el suyo porque tiene su propio Provider.
