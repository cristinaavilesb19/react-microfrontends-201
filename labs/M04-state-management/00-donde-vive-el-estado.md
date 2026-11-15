# Dónde vive el estado

[← Página anterior](README.md) · [Siguiente página →](01-lab-store-redux-compartido.md)

En una aplicación React de una pieza, el estado acaba donde haga falta: un `useState` aquí, un Context allá,
un store de Redux para lo que comparte media aplicación. Todo se compila junto y todo usa la misma copia de
cada librería, así que cualquier componente puede llegar a cualquier estado.

Con [microfrontends](../glosario/01-arquitectura.md#microfrontend) eso deja de ser verdad. Cada [microaplicación](../glosario/01-arquitectura.md#microaplicacion) es **otro bundle**, construido y desplegado
por separado. Un módulo JavaScript que dos bundles importan existe **dos veces** en el navegador, salvo que
[Module Federation](../glosario/02-module-federation.md#module-federation) lo comparta como [singleton](../glosario/02-module-federation.md#singleton). Por eso la pregunta «¿dónde guardo este dato?» se convierte en
«¿quién es el dueño de este dato y quién más necesita verlo?». De la respuesta sale cuánto se acoplan las
microaplicaciones entre sí.

## Tres alcances

| Alcance | Quién lo ve | Dónde vive | Ejemplo |
|---------|-------------|------------|---------|
| **De componente** | Un componente y sus hijos directos | `useState` / `useReducer` | El texto de un campo mientras se escribe |
| **De microaplicación** | Todos los componentes de una microaplicación, nadie de fuera | Un Context privado de la microaplicación | Los pasos de un formulario de alta |
| **Global** | Varias microaplicaciones a la vez | Un store, o un módulo compartido como singleton | La sesión del usuario, el tema claro/oscuro, los favoritos que el [host](../glosario/02-module-federation.md#host) cuenta |

La regla práctica: **cada dato en el alcance más pequeño que funcione**. Subir un estado de alcance tiene
un coste: lo que es global forma parte del [contrato](../glosario/01-arquitectura.md#contrato) entre equipos, y cambiar su forma obliga a coordinar
despliegues.

```text
           ┌──────────────────────────── navegador ────────────────────────────┐
           │                                                                   │
           │   host (bundle propio)              remote (bundle propio)        │
           │   ┌──────────────────┐              ┌──────────────────────┐      │
           │   │ useState         │              │ useState             │      │  de componente
           │   │ Context privado  │              │ Context privado      │      │  de microaplicación
           │   └────────┬─────────┘              └──────────┬───────────┘      │
           │            │                                   │                  │
           │            └────────► estado global ◄──────────┘                  │  global
           │              (store o módulo compartido singleton)                │
           └───────────────────────────────────────────────────────────────────┘
```

## Cuatro formas de compartir lo global

| Mecanismo | Cómo funciona | Qué acopla | Dónde se practica |
|-----------|---------------|------------|-------------------|
| **Store Redux del host con [inyección de reducers](../glosario/03-estado-comunicacion.md#inyeccion-reducers)** | El host crea el store; cada [remote](../glosario/02-module-federation.md#remote) le añade su slice al montarse | Los dos dependen de `react-redux` y `@reduxjs/toolkit`, compartidos como singleton | [01 — Store Redux compartido](01-lab-store-redux-compartido.md) |
| **Context privado** | No se comparte: el estado no sale de la microaplicación | Nada fuera de ella | [02 — Context para el estado local](02-lab-context-estado-local.md) |
| **Módulo compartido como [fuente única](../glosario/03-estado-comunicacion.md#fuente-unica)** | Un paquete pequeño guarda el valor y avisa a quien se suscribe; Module Federation lo carga una sola vez | El paquete y su versión | [03 — Sincronizar estado](03-lab-sincronizar-estado.md) |
| **[Evento global](../glosario/03-estado-comunicacion.md#evento-global) hacia el store** | Un remote emite un `CustomEvent`; el host lo escucha y lo convierte en una acción | Solo el nombre del evento y la forma de `detail` | [04 — Eventos globales hacia el store](04-lab-eventos-hacia-el-store.md) |

> [!WARNING]
> **Compartir estado es compartir una instancia.** Dos microaplicaciones que importan el mismo fichero no
> comparten nada si cada bundle lleva su copia: cada una tendrá su variable, su store o su contexto. Lo que
> hace que el valor sea uno solo es que Module Federation entregue **la misma instancia** del módulo a todas
> (`shared` con `singleton: true`), o que el estado viva en un sitio que ya es único, como `window`.

## Copias y desincronización

El fallo típico del estado entre microaplicaciones no es un error en la Consola: es **que todo funciona,
pero cada parte enseña una cosa distinta**. La cabecera dice «tema oscuro» y el pie, «tema claro». El
remote marca dos favoritos y el host cuenta cero. Cada microaplicación tiene su copia del dato y ninguna
está mal por sí sola.

| Síntoma | Qué suele haber detrás |
|---------|------------------------|
| Dos partes de la página enseñan valores distintos del mismo dato | Cada microaplicación tiene su propio `useState`, su propio store o su propia copia del módulo |
| El host no ve lo que cambia un remote | El remote creó su propio store en lugar de usar el del host |
| Un cambio en un remote obliga a tocar el host | El host importa el reducer o el contexto del remote: el estado ha cruzado la [frontera](../glosario/01-arquitectura.md#frontera) |

> [!NOTE]
> Redux, Context y eventos no compiten. Una misma página suele usar los tres: Context para lo que no sale de
> una microaplicación, un store para lo que varias leen y cambian, y eventos para que una microaplicación
> que no usa Redux avise de algo sin conocer a nadie.

> [!TIP]
> Antes de compartir un dato, pregúntate quién es su **dueño** (quién lo cambia) y quién solo lo **lee**.
> Si solo hay un dueño y nadie más lo lee, no es global: déjalo en su microaplicación.
