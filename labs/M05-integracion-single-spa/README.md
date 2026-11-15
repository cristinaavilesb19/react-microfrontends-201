# M05 — Integración de Microaplicaciones React

[← Página anterior](../M04-state-management/04-lab-eventos-hacia-el-store.md) · [Siguiente página →](00-root-config.md)

En [Module Federation](../glosario/02-module-federation.md#module-federation) el [host](../glosario/02-module-federation.md#host) es una aplicación React que pinta componentes remotos dentro de su propio árbol.
Este módulo cambia de modelo: con **[single-spa](../glosario/04-integracion-despliegue.md#single-spa)** no hay una aplicación principal, sino un **[root-config](../glosario/04-integracion-despliegue.md#root-config)** que
registra varias [microaplicaciones](../glosario/01-arquitectura.md#microaplicacion) React completas, decide por la URL cuáles están activas y las monta y
desmonta, cada una con su propio árbol de React y su [ciclo de vida](../glosario/04-integracion-despliegue.md#ciclo-de-vida). Así se integran varias microaplicaciones
en una sola SPA, cada una se renderiza por su cuenta y su código se descarga solo cuando hace falta.

## Qué aprenderás

- Escribir un root-config que registra microaplicaciones y decide con `activeWhen` cuáles se muestran en cada ruta.
- Convertir una aplicación React en una microaplicación de single-spa con `single-spa-react` y fijar dónde se pinta.
- Seguir en la consola las fases `bootstrap`, `mount` y `unmount` y saber qué ocurre en cada una.
- Aislar el fallo de una microaplicación para que el resto de la página siga funcionando, y enterarte desde el root-config.
- Medir en la pestaña **Red** qué se descarga en cada ruta y precargar una microaplicación cuando el navegador está libre.

## Teoría

### Las piezas de single-spa

| Pieza | Qué es | Dónde está en los ejercicios |
|-------|--------|------------------------------|
| **root-config** | La página que arranca todo: registra las aplicaciones y llama a `start()`. No pinta ninguna interfaz propia salvo la que tenga su `index.html` | `root-config/src/root-config.js` |
| **aplicación** (microaplicación) | Cualquier módulo que exporte `bootstrap`, `mount` y `unmount` (funciones que devuelven promesas) | `<app>/src/spa.js` |
| **`registerApplication`** | Da de alta una aplicación con su `name`, la función `app` que la carga y su `activeWhen` | root-config |
| **`activeWhen`** | Cuándo está activa: un prefijo de ruta (`'/perfil'`), una función `(location) => boolean` o `() => true` (siempre) | root-config |
| **`single-spa-react`** | Adaptador que convierte un componente raíz de React en las tres funciones del ciclo de vida | `<app>/src/spa.js` |
| **`start()`** | A partir de aquí single-spa escucha la URL y monta y desmonta | root-config |

### El ciclo de vida

Cada vez que cambia la URL, single-spa evalúa el `activeWhen` de todas las aplicaciones y llama a sus funciones:

```text
NOT_LOADED ──app()──▶ NOT_BOOTSTRAPPED ──bootstrap──▶ NOT_MOUNTED ──mount──▶ MOUNTED
                                                          ▲                     │
                                                          └──────unmount────────┘
   (si app() falla: LOAD_ERROR; si bootstrap/mount/unmount fallan: SKIP_BECAUSE_BROKEN)
```

| Fase | Cuántas veces | Qué hace `single-spa-react` |
|------|---------------|-----------------------------|
| carga (`app()`) | Una, la primera vez que la aplicación debe estar activa | Nada: es la descarga del código |
| `bootstrap` | Una | Prepara la aplicación |
| `mount` | Cada vez que la ruta la activa | `createRoot` en su contenedor y `render` del componente raíz |
| `unmount` | Cada vez que la ruta la desactiva | Desmonta el árbol de React |

`single-spa-react` pinta cada aplicación en el elemento con id `single-spa-application:<nombre>`. Si el
`index.html` del root-config lo tiene, lo usa; si no, lo crea al final de `<body>`. Declarar esos contenedores
en el `index.html` es la forma de fijar la disposición de la página.

> [!NOTE]
> **Montar no es renderizar.** Dentro de una aplicación montada, React vuelve a renderizar cuando cambia su
> estado, sin que single-spa intervenga. single-spa solo decide cuándo existe el árbol (`mount`) y cuándo
> deja de existir (`unmount`). Por eso cada [microfrontend](../glosario/01-arquitectura.md#microfrontend) se renderiza de forma independiente.

### Decisión del curso: cargar las aplicaciones con Module Federation

La documentación de single-spa (y `npx create-single-spa`) monta el root-config con **import maps y
SystemJS**: cada aplicación se compila como módulo SystemJS, el `index.html` declara en un
`<script type="systemjs-importmap">` la URL de cada una y la carga es `app: () => System.import('@org/perfil')`.
Las librerías comunes (React, single-spa) se comparten poniéndolas también en el import map.

En este curso la carga se hace con **Module Federation**, la herramienta de M03:

```js
// root-config: la función de carga es un import() de un módulo remoto
registerApplication({ name: 'perfil', app: () => import('perfil/spa'), activeWhen: '/perfil' });
```

| | Import maps + SystemJS (canónico) | Module Federation (este curso) |
|---|---|---|
| Dónde se decide la URL de cada aplicación | En el import map del `index.html` | En `remotes` del `webpack.config.js` del root-config |
| Cómo se comparte React | Una entrada en el import map; las apps lo marcan como `externals` | `shared` con `singleton: true` en el root-config y en cada aplicación |
| Qué expone cada aplicación | Su bundle entero, en formato SystemJS | `./spa` (las funciones del ciclo de vida) en su `remoteEntry.js` |
| Herramientas | `create-single-spa`, `import-map-overrides` | Las mismas de M03 (`ModuleFederationPlugin` de Webpack) |

Se elige Module Federation para no añadir un cargador más y reutilizar el reparto de dependencias que ya se
conoce. El root-config no usa React, pero comparte `react`, `react-dom` y `single-spa` como `singleton`: así
todas las aplicaciones usan la misma copia. Si `single-spa` no se compartiera, cada aplicación que lo importa
traería la suya y la consola avisaría con «single-spa has been loaded twice».

> [!TIP]
> **El navegador solo habla con el root-config.** Los `remoteEntry.js` se piden en el mismo origen, bajo
> `/mf/<nombre>/`, y el servidor de desarrollo del root-config (puerto 3000) los reenvía al puerto de cada
> aplicación con `devServer.proxy`. Así funciona igual en Codespaces, donde cada puerto es otro dominio, y en
> producción, donde todo está detrás de un único dominio.

### Cargar bajo demanda

La función `app` es lo que convierte single-spa en un cargador perezoso: no se llama hasta que la aplicación
debe estar activa. Si el root-config importa las aplicaciones de forma estática, todo se descarga al abrir la
página. Entre los dos extremos está la **[precarga](../glosario/04-integracion-despliegue.md#precarga)**: llamar a la misma función de carga antes de tiempo,
cuando el navegador está libre, para que la navegación siguiente no espere.

## Páginas

<!-- gen:paginas -->
| # | Página | Qué hay |
|---|--------|---------|
| 00 | [El root-config de single-spa](00-root-config.md) | Demostración: single-spa monta y desmonta dos aplicaciones mínimas según la URL |
| 01 | [Lab — Registrar microaplicaciones](01-lab-registrar-microaplicaciones.md) | Registras tres aplicaciones React con single-spa-react y conviven en la misma página |
| 02 | [Lab — Ciclo de vida](02-lab-ciclo-de-vida.md) | Sigues bootstrap, mount y unmount en la consola y aíslas el fallo de una aplicación |
| 03 | [Lab — Carga y precarga](03-lab-carga-y-precarga.md) | Mides qué se descarga en cada ruta y precargas una aplicación cuando el navegador está libre |

→ Empieza por **[00 — El root-config de single-spa](00-root-config.md)**.
<!-- /gen:paginas -->

## Conclusiones del módulo

### Qué es

single-spa es un orquestador: un root-config registra aplicaciones con una función de carga y una condición de
actividad, y llama a su ciclo de vida (`bootstrap` una vez, `mount` y `unmount` al navegar). Cada
microaplicación React tiene su propio árbol y se renderiza sola; la página es la suma de las que están activas.

### Cómo debe ser

| Requisito | Dónde se ha visto |
|-----------|-------------------|
| Cada aplicación exporta `bootstrap`, `mount` y `unmount` | Demo (objetos a mano) y labs (`single-spa-react`) |
| `activeWhen` describe la ruta de cada una, sin solaparse por accidente | Lab 01: prefijo, función y `() => true` |
| Los contenedores `single-spa-application:<nombre>` fijan el orden | Lab 01, `index.html` del root-config |
| React, react-dom y single-spa compartidos como `singleton` | Todos los `webpack.config.js` |
| Cada aplicación tiene `errorBoundary` y el root-config un `addErrorHandler` | Lab 02 |
| Las aplicaciones se cargan con una función, no con imports estáticos | Lab 03 |

### Dónde se rompe

| Fallo | Qué provoca | Lab |
|-------|-------------|-----|
| Ruta sin aplicación registrada | Página vacía, sin errores | 01 |
| Sin contenedores en el `index.html` | El orden depende de qué aplicación termina antes de cargarse | 01 |
| Error de render sin `errorBoundary` | El `unmount` se queda colgado (aviso #31, 3000 ms) y la aplicación no vuelve a montarse | 02 |
| Servidor de una aplicación parado | `LOAD_ERROR` en esa aplicación; el resto sigue | 02 |
| Imports estáticos en el root-config | Se descarga todo al abrir la página | 03 |

### En una frase

> 🔑 El root-config decide qué aplicaciones existen en cada URL y cuándo se descargan; cada aplicación decide
> cómo se pinta y cómo falla sin arrastrar a las demás.
