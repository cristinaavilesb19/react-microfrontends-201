# Glosario

[← Volver al curso](../../README.md)

Los conceptos del curso, agrupados por área. Cada ficha dice qué es, cómo aparece en los ejercicios,
dónde se rompe y en qué páginas lo usas.

| Hoja | Qué reúne |
|------|-----------|
| [01 — Arquitectura](01-arquitectura.md) | Microfrontend, monolito, shell, fronteras, rutas, import maps y Shadow DOM |
| [02 — Module Federation](02-module-federation.md) | Host, remote, contenedor, dependencias compartidas, carga dinámica y diferida |
| [03 — Estado y comunicación](03-estado-comunicacion.md) | Store global, Context, fuente única, eventos y bus de mensajes |
| [04 — Integración y despliegue](04-integracion-despliegue.md) | single-spa, qiankun, ciclo de vida, imágenes, Kubernetes y caché |

## Índice alfabético

- [activeWhen](04-integracion-despliegue.md#activewhen)
- [Arranque asíncrono (bootstrap)](02-module-federation.md#arranque-asincrono)
- [Barrera de errores](02-module-federation.md#barrera-de-errores)
- [Bus de mensajes](03-estado-comunicacion.md#bus-de-mensajes)
- [Carga dinámica de remotes](02-module-federation.md#carga-dinamica)
- [Ciclo de vida (bootstrap, mount, unmount)](04-integracion-despliegue.md#ciclo-de-vida)
- [Contenedor (remoteEntry.js)](02-module-federation.md#remote-entry)
- [Context API](03-estado-comunicacion.md#context-api)
- [Contexto compartido](03-estado-comunicacion.md#contexto-compartido)
- [Contrato](01-arquitectura.md#contrato)
- [Dependencias compartidas (shared)](02-module-federation.md#shared)
- [Deployment](04-integracion-despliegue.md#deployment)
- [Despliegue independiente](01-arquitectura.md#despliegue-independiente)
- [Enrutamiento en dos niveles](01-arquitectura.md#enrutamiento-dos-niveles)
- [Evento global (CustomEvent)](03-estado-comunicacion.md#evento-global)
- [Fuente única de verdad](03-estado-comunicacion.md#fuente-unica)
- [Frontera de módulo](01-arquitectura.md#frontera)
- [Host](02-module-federation.md#host)
- [Imagen multietapa](04-integracion-despliegue.md#imagen-multietapa)
- [Import map](01-arquitectura.md#import-map)
- [Inyección de reducers](03-estado-comunicacion.md#inyeccion-reducers)
- [Lazy loading](02-module-federation.md#lazy-loading)
- [Microaplicación](01-arquitectura.md#microaplicacion)
- [Microfrontend](01-arquitectura.md#microfrontend)
- [Module Federation](02-module-federation.md#module-federation)
- [Monolito frontend](01-arquitectura.md#monolito)
- [Precarga](04-integracion-despliegue.md#precarga)
- [qiankun](04-integracion-despliegue.md#qiankun)
- [Remote](02-module-federation.md#remote)
- [Rollback](04-integracion-despliegue.md#rollback)
- [Rolling update](04-integracion-despliegue.md#rolling-update)
- [Root-config](04-integracion-despliegue.md#root-config)
- [Service](04-integracion-despliegue.md#service)
- [Shadow DOM](01-arquitectura.md#shadow-dom)
- [Shell](01-arquitectura.md#shell)
- [single-spa](04-integracion-despliegue.md#single-spa)
- [Singleton](02-module-federation.md#singleton)
- [Store global](03-estado-comunicacion.md#store-global)
- [Último valor retenido](03-estado-comunicacion.md#ultimo-valor)

## Preguntas frecuentes

**¿Module Federation o single-spa?** No compiten: Module Federation resuelve *cómo llega el código* de otra
aplicación al navegador (y cómo se comparte React); single-spa resuelve *quién se monta y cuándo* según la
URL. En el curso se usan juntos en M05: single-spa decide y Module Federation carga.

**¿Redux compartido, Context o eventos?** Redux compartido cuando varias microaplicaciones leen y cambian el
mismo estado global y aceptan depender de la misma librería. Context, para el estado que no sale de una
microaplicación. Eventos o bus, cuando solo hay que avisar de algo y no se quiere que el otro lado dependa de
tu librería ni de tu estado. Ver [03 — Estado y comunicación](03-estado-comunicacion.md#mapa).

**¿Por qué `singleton` si ya pongo `shared`?** `shared` permite reutilizar una copia; `singleton` obliga a que
haya **una sola** en toda la página aunque las versiones pedidas no coincidan. React, react-dom, react-redux,
single-spa y los paquetes con estado (un contexto, un store) la necesitan.

**¿Por qué los remotes se piden en `/mf/<nombre>/` del mismo puerto?** Para que el navegador hable con un
único origen, como en producción detrás de un único dominio. En desarrollo lo reenvía `devServer.proxy`; en
Docker y Kubernetes, nginx.
