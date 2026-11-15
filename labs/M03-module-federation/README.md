# M03 — Webpack Module Federation en React

[← Página anterior](../M02-diseno-arquitecturas/03-lab-enrutamiento-compartido.md) · [Siguiente página →](00-remote-entry.md)

Hasta aquí, dos aplicaciones solo podían compartir código si una lo copiaba o lo instalaba como paquete y
se volvía a compilar. En este módulo una aplicación usa un componente que **otra compila y sirve por su
cuenta**, y lo recibe por la red en tiempo de ejecución. Es la pieza que permite publicar cada
[microfrontend](../glosario/01-arquitectura.md#microfrontend) por separado: **Webpack [Module Federation](../glosario/02-module-federation.md#module-federation)**, el `ModuleFederationPlugin` que trae Webpack 5
sin instalar nada más.

El tramo recorre la configuración de un [host](../glosario/02-module-federation.md#host) y un [remote](../glosario/02-module-federation.md#remote), la carga de un remote cuya dirección solo se
conoce al arrancar, la gestión de [dependencias compartidas](../glosario/02-module-federation.md#shared) para no llevar dos copias de React y la carga
de cada remote solo cuando hace falta.

## Qué aprenderás

- Leer un `remoteEntry.js` y saber qué hace: qué módulos ofrece un remote y cómo se los pide el host.
- Convertir dos aplicaciones React + Webpack normales en un host y un remote, con su [arranque asíncrono](../glosario/02-module-federation.md#arranque-asincrono).
- Cambiar la versión de un remote que usa el host editando un JSON, sin recompilar el host.
- Reconocer el error de dos copias de React y arreglarlo compartiendo `react` y `react-dom` como [singleton](../glosario/02-module-federation.md#singleton),
  con control de versiones.
- Retrasar la descarga de cada remote hasta que se visita su ruta y aislar su fallo para que no tumbe la
  página.

## Teoría

> [!NOTE]
> **Por qué Webpack y no Vite.** Module Federation nació en Webpack 5 y el plugin viene incluido
> (`require('webpack').container`), sin dependencias extra. Es la implementación de referencia: las demás
> (Module Federation 2.0, Rspack, plugins para Vite) la copian con más o menos fidelidad. Vite es más
> rápido en desarrollo, pero su federación es un plugin de terceros con diferencias en el arranque y en las
> dependencias compartidas. Por eso todas las aplicaciones del curso se compilan con Webpack.

### Host, remote y contenedor

| Pieza | Qué es | En los ejercicios |
|-------|--------|-------------------|
| **Remote** | Aplicación que **expone** módulos para que otras los usen | El remote `boton` expone `./Boton` |
| **Host** | Aplicación que **consume** módulos de uno o varios remotes | El host importa `boton/Boton` |
| **Contenedor** | Lo que el remote publica: un objeto con `init` y `get`, creado al ejecutar su `remoteEntry.js` | `window.boton` |
| **`remoteEntry.js`** | Fichero de entrada del contenedor; pequeño, solo dice qué se expone y dónde está cada trozo | `http://localhost:3001/remoteEntry.js` |
| **Share scope** | Registro de dependencias compartidas (`react`, `react-dom`) del que todos se sirven | `__webpack_share_scopes__.default` |

Una misma aplicación puede ser host y remote a la vez. Los nombres describen el papel en cada relación,
no el tipo de aplicación.

### Las opciones de `ModuleFederationPlugin`

```js
// webpack.config.js — opciones que aparecen en este módulo
new ModuleFederationPlugin({
  name: 'boton',                                   // nombre del contenedor (window.boton)
  filename: 'remoteEntry.js',                      // remote: fichero de entrada que publica
  exposes: { './Boton': './src/Boton.jsx' },       // remote: qué módulos ofrece y con qué nombre
  remotes: { boton: 'boton@/mf/boton/remoteEntry.js' }, // host: alias → nombre@URL del remoteEntry.js
  shared: { react: { singleton: true } },          // ambos: dependencias que no se duplican
})
```

### Dos reglas de todos los ejercicios

**El navegador solo habla con el host.** Los remotes se piden en el mismo origen que el host, bajo
`/mf/<nombre>/`, y el servidor del host los reenvía al puerto de cada remote:

```text
navegador ──► :3000/mf/boton/remoteEntry.js ──(devServer.proxy)──► :3001/remoteEntry.js
```

En desarrollo lo hace `devServer.proxy`; en Docker y Kubernetes (M07) lo hará nginx. Así funciona igual en
Codespaces, donde cada puerto es otro dominio, y en producción, donde todo cuelga de un único dominio.

**El arranque es asíncrono.** `index.js` solo contiene `import('./bootstrap')`, y la aplicación de verdad
empieza en `bootstrap.js`. Esa espera da tiempo a Module Federation a descargar los `remoteEntry.js` y a
decidir qué copia de cada dependencia compartida se usa antes de que se ejecute el primer `import React`.

> [!NOTE]
> Module Federation no es un paquete npm ni un servidor: es un plugin de Webpack. Lo que llega al
> navegador son ficheros JavaScript normales que cualquier servidor estático puede servir. Las
> alternativas (Module Federation 2.0, Vite, Rspack) siguen la misma idea de host, remote y contenedor.

## Páginas

<!-- gen:paginas -->
| # | Página | Qué hay |
|---|--------|---------|
| 00 | [Qué hay dentro de remoteEntry.js](00-remote-entry.md) | Demostración: un remote expone un componente y el host lo pide por la red |
| 01 | [Lab — Host y remote](01-lab-host-y-remote.md) | Expones un componente Boton con ModuleFederationPlugin y lo usas desde otra aplicación |
| 02 | [Lab — Remotos dinámicos](02-lab-remotos-dinamicos.md) | El host lee la URL del remote de un JSON al arrancar y cambia de versión sin recompilar |
| 03 | [Lab — Dependencias compartidas](03-lab-dependencias-compartidas.md) | Un contador con hooks falla con dos copias de React; lo arreglas con shared y singleton |
| 04 | [Lab — Lazy loading de remotos](04-lab-lazy-loading-remotos.md) | Cargas cada remote solo al entrar en su ruta, con Suspense y una [barrera de errores](../glosario/02-module-federation.md#barrera-de-errores) |

→ Empieza por **[00 — Qué hay dentro de remoteEntry.js](00-remote-entry.md)**.
<!-- /gen:paginas -->

## Conclusiones del módulo

### Qué es Module Federation

Un mecanismo de Webpack para que una aplicación cargue, en tiempo de ejecución, módulos que otra compila
y despliega por su cuenta. El remote publica un contenedor (`remoteEntry.js` con `init` y `get`) y el host
lo pide por la red como si fuera un `import` más.

### Cómo debe ser

| Requisito | Dónde se ha visto |
|-----------|-------------------|
| El remote declara `name`, `filename` y `exposes`; el host, `remotes` | [01 — Host y remote](01-lab-host-y-remote.md) |
| Arranque asíncrono con `import('./bootstrap')` en host y remote | [00](00-remote-entry.md) y [01](01-lab-host-y-remote.md) |
| Los remotes se piden en el mismo origen, bajo `/mf/<nombre>/` | Todos los ejercicios (`devServer.proxy`) |
| La URL del remote puede vivir fuera del código compilado | [02 — Remotos dinámicos](02-lab-remotos-dinamicos.md) (`remotes.json`) |
| `react` y `react-dom` compartidos como `singleton` | [03 — Dependencias compartidas](03-lab-dependencias-compartidas.md) |
| Cada remote se carga al visitar su ruta y tiene su barrera de errores | [04 — Lazy loading de remotos](04-lab-lazy-loading-remotos.md) |

### Dónde se rompe

| Fallo | Qué se ve |
|-------|-----------|
| El host importa un remote sin `ModuleFederationPlugin` | `Module not found: Error: Can't resolve 'boton/Boton'` al compilar |
| Un remote está caído y se importa de forma estática | `ScriptExternalLoadError` y la página en blanco |
| La URL de `remotes.json` no existe | 404, `Refused to execute script` y la página en blanco si no hay barrera |
| Dos copias de React | `Invalid hook call` y `Cannot read properties of null (reading 'useState')` |
| Versión compartida fuera de rango | Aviso `Unsatisfied version…`; con `strictVersion`, error y página en blanco |

### Cómo se perfecciona

Con un manifiesto de remotes que publique el despliegue (no el código), rangos de versión explícitos en
`shared`, una barrera de errores por cada zona que pinta un remote y [carga dinámica](../glosario/02-module-federation.md#carga-dinamica) para los remotes que no
se usan al arrancar. Module Federation 2.0 añade tipos y un manifiesto estándar sobre la misma idea.

### En una frase

> 🔑 Un microfrontend federado es un `remoteEntry.js` que el host pide por la red: si compartes React una sola vez, lo cargas cuando hace falta y aíslas su fallo, cada equipo puede publicar el suyo sin recompilar a los demás.
