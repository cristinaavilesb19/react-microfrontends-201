# Glosario 02 — Module Federation

[← Hoja anterior](01-arquitectura.md) · [Índice del glosario](README.md) · [Siguiente hoja →](03-estado-comunicacion.md)

Cómo llega al navegador el código de otra aplicación y cómo se comparte React entre todas. Se usa desde M03
hasta M07.

---

<a id="mapa"></a>
## 1. El mapa de familias

✔ = lo usas en el curso · ○ = hermano que no usamos, para que sepas que existe y cuándo se elige.

```text
Cargar código de otra aplicación en tiempo de ejecución
├── ✔ Webpack 5 ModuleFederationPlugin (nativo) ...... M03–M07
├── ○ Module Federation 2.0 (@module-federation/enhanced: manifiesto, tipos, runtime plugins)
├── ○ Rspack / Rsbuild (la misma federación, compilador en Rust)
├── ○ Vite + plugin de federación
└── ○ Import maps + SystemJS (lo canónico de single-spa)
```

<a id="comparacion-carga"></a>
### Comparación: cómo conoce el host a sus remotes

| | ✔ `remotes` estáticos | ✔ Carga dinámica | ○ Import maps |
|--|--|--|--|
| **Cómo funciona** | La URL del `remoteEntry.js` va en `webpack.config.js` | El host lee la URL al arrancar (`remotes.json`) y carga el contenedor a mano | Un JSON en la página dice qué URL tiene cada módulo |
| **Cuándo se elige** | Pocos remotes, URL estable | Entornos con URL distintas, cambiar de versión sin recompilar | Ecosistema single-spa sin Webpack |
| **Qué cuesta** | Recompilar el host para cambiar la URL | Más código en el host (`cargarRemoto.js`) | Sin dependencias compartidas automáticas |
| **En el curso** | M03-01, M03-04 | M03-02: v1 → v2 editando `remotes.json` | — |

---

## 2. Los conceptos

<a id="module-federation"></a>
### Module Federation

**Qué es:** la función de Webpack 5 que permite que una aplicación use, en tiempo de ejecución, módulos
compilados y publicados por otra, compartiendo librerías entre ellas.

**En el curso:** `new ModuleFederationPlugin({...})` en `webpack.config.js`, que viene de
`require('webpack').container`.

**Lo usas en:** <!--usos:module-federation-->[M01](../M01-introduccion-microfrontends/README.md) · [00-del](../M01-introduccion-microfrontends/00-del-monolito-a-microfrontends.md) · [02-lab](../M01-introduccion-microfrontends/02-lab-despliegue-independiente.md) · [03-lab](../M01-introduccion-microfrontends/03-lab-shell-sin-framework.md) · [05-cin](../M01-introduccion-microfrontends/05-cinco-integraciones.md) · [M02](../M02-diseno-arquitecturas/README.md) · [00-imp](../M02-diseno-arquitecturas/00-imports-cruzados.md) · [02-lab](../M02-diseno-arquitecturas/02-lab-estructura-microaplicacion.md) · [M03](../M03-module-federation/README.md) · [00-rem](../M03-module-federation/00-remote-entry.md) · [01-lab](../M03-module-federation/01-lab-host-y-remote.md) · [02-lab](../M03-module-federation/02-lab-remotos-dinamicos.md) · [03-lab](../M03-module-federation/03-lab-dependencias-compartidas.md) · [04-lab](../M03-module-federation/04-lab-lazy-loading-remotos.md) · [M04](../M04-state-management/README.md) · [00-don](../M04-state-management/00-donde-vive-el-estado.md) · [01-lab](../M04-state-management/01-lab-store-redux-compartido.md) · [02-lab](../M04-state-management/02-lab-context-estado-local.md) · [03-lab](../M04-state-management/03-lab-sincronizar-estado.md) · [04-lab](../M04-state-management/04-lab-eventos-hacia-el-store.md) · [M05](../M05-integracion-single-spa/README.md) · [00-roo](../M05-integracion-single-spa/00-root-config.md) · [01-lab](../M05-integracion-single-spa/01-lab-registrar-microaplicaciones.md) · [02-lab](../M05-integracion-single-spa/02-lab-ciclo-de-vida.md) · [03-lab](../M05-integracion-single-spa/03-lab-carga-y-precarga.md) · [00-can](../M06-comunicacion/00-canales-de-comunicacion.md) · [02-lab](../M06-comunicacion/02-lab-contexto-compartido.md) · [00-una](../M07-despliegue-escalabilidad/00-una-imagen-por-microfrontend.md) · [01-lab](../M07-despliegue-escalabilidad/01-lab-imagenes-docker.md) · [02-lab](../M07-despliegue-escalabilidad/02-lab-kubernetes.md) · [03-lab](../M07-despliegue-escalabilidad/03-lab-actualizar-un-remote.md)<!--/usos-->

<a id="host"></a>
### Host

**Qué es:** la aplicación que consume módulos de otras. Su configuración lleva `remotes` (o los carga a mano).

**En el curso:** casi siempre en el puerto 3000; importa `'boton/Boton'` como si fuera un paquete.

**Dónde se rompe:** sin `ModuleFederationPlugin`, `'boton/Boton'` da `Module not found` al compilar (M03-01).

**Lo usas en:** <!--usos:host-->[02-lab](../M01-introduccion-microfrontends/02-lab-despliegue-independiente.md) · [05-cin](../M01-introduccion-microfrontends/05-cinco-integraciones.md) · [M03](../M03-module-federation/README.md) · [00-rem](../M03-module-federation/00-remote-entry.md) · [01-lab](../M03-module-federation/01-lab-host-y-remote.md) · [02-lab](../M03-module-federation/02-lab-remotos-dinamicos.md) · [03-lab](../M03-module-federation/03-lab-dependencias-compartidas.md) · [04-lab](../M03-module-federation/04-lab-lazy-loading-remotos.md) · [M04](../M04-state-management/README.md) · [00-don](../M04-state-management/00-donde-vive-el-estado.md) · [01-lab](../M04-state-management/01-lab-store-redux-compartido.md) · [02-lab](../M04-state-management/02-lab-context-estado-local.md) · [03-lab](../M04-state-management/03-lab-sincronizar-estado.md) · [04-lab](../M04-state-management/04-lab-eventos-hacia-el-store.md) · [M05](../M05-integracion-single-spa/README.md) · [M06](../M06-comunicacion/README.md) · [00-can](../M06-comunicacion/00-canales-de-comunicacion.md) · [01-lab](../M06-comunicacion/01-lab-props-entre-microaplicaciones.md) · [02-lab](../M06-comunicacion/02-lab-contexto-compartido.md) · [03-lab](../M06-comunicacion/03-lab-bus-de-mensajes.md) · [04-lab](../M06-comunicacion/04-lab-ultimo-valor-retenido.md) · [M07](../M07-despliegue-escalabilidad/README.md) · [00-una](../M07-despliegue-escalabilidad/00-una-imagen-por-microfrontend.md) · [01-lab](../M07-despliegue-escalabilidad/01-lab-imagenes-docker.md) · [02-lab](../M07-despliegue-escalabilidad/02-lab-kubernetes.md) · [03-lab](../M07-despliegue-escalabilidad/03-lab-actualizar-un-remote.md)<!--/usos-->

<a id="remote"></a>
### Remote

**Qué es:** la aplicación que publica módulos para otras. Su configuración lleva `name`, `filename` y
`exposes`.

**En el curso:** puertos 3001–3003; `exposes: { './Boton': './src/Boton.jsx' }`.

**Dónde se rompe:** si el remote está caído, el import falla en el navegador (`ScriptExternalLoadError`) y,
sin barrera de errores, se lleva la página entera (M03-02, M03-04).

**Lo usas en:** <!--usos:remote-->[02-lab](../M01-introduccion-microfrontends/02-lab-despliegue-independiente.md) · [05-cin](../M01-introduccion-microfrontends/05-cinco-integraciones.md) · [03-lab](../M02-diseno-arquitecturas/03-lab-enrutamiento-compartido.md) · [M03](../M03-module-federation/README.md) · [00-rem](../M03-module-federation/00-remote-entry.md) · [01-lab](../M03-module-federation/01-lab-host-y-remote.md) · [02-lab](../M03-module-federation/02-lab-remotos-dinamicos.md) · [03-lab](../M03-module-federation/03-lab-dependencias-compartidas.md) · [04-lab](../M03-module-federation/04-lab-lazy-loading-remotos.md) · [M04](../M04-state-management/README.md) · [00-don](../M04-state-management/00-donde-vive-el-estado.md) · [01-lab](../M04-state-management/01-lab-store-redux-compartido.md) · [02-lab](../M04-state-management/02-lab-context-estado-local.md) · [03-lab](../M04-state-management/03-lab-sincronizar-estado.md) · [04-lab](../M04-state-management/04-lab-eventos-hacia-el-store.md) · [00-roo](../M05-integracion-single-spa/00-root-config.md) · [01-lab](../M05-integracion-single-spa/01-lab-registrar-microaplicaciones.md) · [02-lab](../M05-integracion-single-spa/02-lab-ciclo-de-vida.md) · [03-lab](../M05-integracion-single-spa/03-lab-carga-y-precarga.md) · [M06](../M06-comunicacion/README.md) · [00-can](../M06-comunicacion/00-canales-de-comunicacion.md) · [01-lab](../M06-comunicacion/01-lab-props-entre-microaplicaciones.md) · [02-lab](../M06-comunicacion/02-lab-contexto-compartido.md) · [03-lab](../M06-comunicacion/03-lab-bus-de-mensajes.md) · [04-lab](../M06-comunicacion/04-lab-ultimo-valor-retenido.md) · [M07](../M07-despliegue-escalabilidad/README.md) · [00-una](../M07-despliegue-escalabilidad/00-una-imagen-por-microfrontend.md) · [01-lab](../M07-despliegue-escalabilidad/01-lab-imagenes-docker.md) · [02-lab](../M07-despliegue-escalabilidad/02-lab-kubernetes.md) · [03-lab](../M07-despliegue-escalabilidad/03-lab-actualizar-un-remote.md)<!--/usos-->

<a id="remote-entry"></a>
### Contenedor (remoteEntry.js)

**Qué es:** el fichero de entrada de un remote. Al cargarse crea `window.<name>` con dos funciones:
`init` (para apuntarse a las dependencias compartidas) y `get` (para pedir un módulo expuesto).

**Cómo funciona por dentro:** dentro hay un `moduleMap` con cada módulo de `exposes`; `get('./Saludo')`
descarga el chunk de ese módulo (`src_Saludo_jsx.js`) y devuelve una función que lo evalúa.

**En el curso:** se abre en crudo en `http://localhost:3001/remoteEntry.js` en M03-00. En producción tiene
nombre fijo y `Cache-Control: no-cache` (M07).

**Lo usas en:** <!--usos:remote-entry-->—<!--/usos-->

<a id="arranque-asincrono"></a>
### Arranque asíncrono (bootstrap)

**Qué es:** el patrón `index.js` → `import('./bootstrap')`. El import dinámico da tiempo a Module Federation
a negociar las dependencias compartidas antes de que se ejecute el código que usa React.

**Dónde se rompe:** si `index.js` importa React directamente, el consumo compartido aún no está resuelto y
Webpack avisa de que el módulo compartido se consume de forma «eager».

**Lo usas en:** <!--usos:arranque-asincrono-->[M03](../M03-module-federation/README.md) · [00-rem](../M03-module-federation/00-remote-entry.md) · [01-lab](../M03-module-federation/01-lab-host-y-remote.md) · [03-lab](../M03-module-federation/03-lab-dependencias-compartidas.md) · [04-lab](../M03-module-federation/04-lab-lazy-loading-remotos.md) · [01-lab](../M04-state-management/01-lab-store-redux-compartido.md) · [02-lab](../M04-state-management/02-lab-context-estado-local.md) · [03-lab](../M04-state-management/03-lab-sincronizar-estado.md) · [01-lab](../M05-integracion-single-spa/01-lab-registrar-microaplicaciones.md) · [00-can](../M06-comunicacion/00-canales-de-comunicacion.md) · [00-una](../M07-despliegue-escalabilidad/00-una-imagen-por-microfrontend.md) · [01-lab](../M07-despliegue-escalabilidad/01-lab-imagenes-docker.md)<!--/usos-->

<a id="shared"></a>
### Dependencias compartidas (shared)

**Qué es:** la lista de librerías que host y remotes se ofrecen entre sí para no descargarlas dos veces.

**En el curso:** `shared: { react: { singleton: true }, 'react-dom': { singleton: true } }`. Al compilar se
ve `provide shared module (default) react@19.3.1` y `consume shared module (default) react@^19.3.1 (singleton)`.

**Dónde se rompe:** sin `shared`, cada aplicación lleva su React; con hooks: `Invalid hook call` y
`Cannot read properties of null (reading 'useState')` (M03-03).

**Lo usas en:** <!--usos:shared-->[00-del](../M01-introduccion-microfrontends/00-del-monolito-a-microfrontends.md) · [03-lab](../M01-introduccion-microfrontends/03-lab-shell-sin-framework.md) · [M03](../M03-module-federation/README.md) · [00-rem](../M03-module-federation/00-remote-entry.md) · [01-lab](../M03-module-federation/01-lab-host-y-remote.md) · [02-lab](../M03-module-federation/02-lab-remotos-dinamicos.md) · [03-lab](../M03-module-federation/03-lab-dependencias-compartidas.md) · [01-lab](../M05-integracion-single-spa/01-lab-registrar-microaplicaciones.md)<!--/usos-->

<a id="singleton"></a>
### Singleton

**Qué es:** la opción de `shared` que obliga a una sola copia de la librería en toda la página. Si alguien
pide una versión que no encaja, avisa (`Unsatisfied version 19.3.1 … (required ^18.0.0)`) y usa igual la
única copia; con `strictVersion: true`, falla.

**En el curso:** React y react-dom siempre; react-redux y Redux Toolkit en M04-01; `single-spa` en M05 (sin
él: `single-spa has been loaded twice`); los paquetes `tema-compartido` e `idioma-compartido` (M04-03, M06-02).

**Lo usas en:** <!--usos:singleton-->[M03](../M03-module-federation/README.md) · [02-lab](../M03-module-federation/02-lab-remotos-dinamicos.md) · [04-lab](../M03-module-federation/04-lab-lazy-loading-remotos.md) · [M04](../M04-state-management/README.md) · [00-don](../M04-state-management/00-donde-vive-el-estado.md) · [03-lab](../M04-state-management/03-lab-sincronizar-estado.md) · [M06](../M06-comunicacion/README.md) · [00-can](../M06-comunicacion/00-canales-de-comunicacion.md) · [02-lab](../M06-comunicacion/02-lab-contexto-compartido.md) · [04-lab](../M06-comunicacion/04-lab-ultimo-valor-retenido.md)<!--/usos-->

<a id="carga-dinamica"></a>
### Carga dinámica de remotes

**Qué es:** descubrir la URL de un remote al ejecutar y cargar su contenedor a mano: script →
`__webpack_init_sharing__('default')` → `contenedor.init(__webpack_share_scopes__.default)` → `contenedor.get(módulo)`.

**En el curso:** `host/src/cargarRemoto.js` de M03-02 con `public/remotes.json`.

**Dónde se rompe:** una URL que no existe en `remotes.json` y sin barrera de errores: página en blanco.

**Lo usas en:** <!--usos:carga-dinamica-->[M03](../M03-module-federation/README.md) · [02-lab](../M03-module-federation/02-lab-remotos-dinamicos.md)<!--/usos-->

<a id="lazy-loading"></a>
### Lazy loading

**Qué es:** retrasar la descarga de un código hasta que hace falta. En React, `lazy(() => import('mapa/Mapa'))`
con `<Suspense fallback>` mientras llega.

**Cómo funciona por dentro:** con `remotes` estáticos, los `remoteEntry.js` se piden al arrancar (el host
inicializa las dependencias compartidas de todos); lo que se retrasa es el chunk del módulo expuesto
(`src_Mapa_jsx.js`). Para retrasar también el `remoteEntry.js`, carga dinámica.

**Lo usas en:** <!--usos:lazy-loading-->[04-lab](../M03-module-federation/04-lab-lazy-loading-remotos.md)<!--/usos-->

<a id="barrera-de-errores"></a>
### Barrera de errores

**Qué es:** un componente de clase con `getDerivedStateFromError` que, si un hijo falla, pinta un aviso en
lugar de desmontar toda la aplicación.

**En el curso:** `BarreraErrores.jsx` de M03-04 (con `key` por ruta para que el fallo de una sección no se
arrastre a otra) y `errorBoundary` de single-spa-react en M05.

**Lo usas en:** <!--usos:barrera-de-errores-->[M03](../M03-module-federation/README.md) · [01-lab](../M03-module-federation/01-lab-host-y-remote.md) · [02-lab](../M03-module-federation/02-lab-remotos-dinamicos.md) · [04-lab](../M03-module-federation/04-lab-lazy-loading-remotos.md)<!--/usos-->
