# M06 — Comunicación entre Microaplicaciones React

[← Página anterior](../M05-integracion-single-spa/03-lab-carga-y-precarga.md) · [Siguiente página →](00-canales-de-comunicacion.md)

Dos [microaplicaciones](../glosario/01-arquitectura.md#microaplicacion) que viven en la misma página acaban necesitando hablarse: el [host](../glosario/02-module-federation.md#host) sabe quién ha
iniciado sesión y el perfil lo tiene que pintar; un buscador escribe un texto y otra microaplicación muestra
sus resultados. Este módulo trata **cómo pasan los datos de una a otra** sin que una dependa del código de la
otra: por props, por un [contexto compartido](../glosario/03-estado-comunicacion.md#contexto-compartido) o por mensajes, y siempre con un **[contrato](../glosario/01-arquitectura.md#contrato)** explícito que diga
qué se envía, con qué nombre y con qué forma.

## Qué aprenderás

- Pasar datos y callbacks de un host a un [remote](../glosario/02-module-federation.md#remote) por props, y reconocer cuándo un contrato se rompe sin avisar.
- Compartir un contexto de React entre host y remote, y comprobar por qué sin compartirlo como [singleton](../glosario/02-module-federation.md#singleton) cada
  uno lee su propia copia.
- Montar un [bus de mensajes](../glosario/03-estado-comunicacion.md#bus-de-mensajes) con nombres versionados, payload definido y baja de la suscripción.
- Hacer que una microaplicación que se monta tarde reciba el último mensaje que se publicó antes de que llegara.

## Teoría

Hay tres canales, de más acoplado a menos:

| Canal | Cómo viaja el dato | Cuándo se elige | Qué hay que compartir | Dónde se rompe |
|-------|--------------------|-----------------|-----------------------|----------------|
| **Props** | El host renderiza el remote y le pasa valores y funciones | El host contiene al remote y es dueño del dato | Los nombres y la forma de las props | Un nombre mal escrito: el remote recibe `undefined` sin error |
| **Contexto compartido** | Un `Provider` arriba; `useContext` en cualquier remote de debajo | Un dato que muchos leen (idioma, tema, sesión) sin pasarlo de mano en mano | El **mismo objeto** de contexto: el paquete, como singleton | Si cada microaplicación lleva su copia, el remote lee su valor por defecto |
| **Mensajes (bus)** | Una publica un evento con nombre y payload; las demás se suscriben | Microaplicaciones hermanas que no se contienen ni se conocen | El contrato de mensajes: nombre, versión y payload | Nombres distintos, suscripciones sin baja, o alguien que llega tarde |

```text
 props                 contexto compartido          bus de mensajes
 ─────                 ───────────────────          ───────────────
 host                  host <Provider value>        buscador ──publicar──┐
  └─ <Remote a={…}     ├─ remote A  useContext                           ▼
       onX={…} />      └─ remote B  useContext                window (eventos)
   ▲ callback ─┘                                                         │
                                                    resultados ◄─suscribir┘
```

Las props y el contexto solo funcionan si una microaplicación está **dentro** del árbol de React de la otra. El
bus funciona entre hermanas que no se ven, a cambio de que el contrato viva en un sitio que ambas importen.

> [!NOTE]
> **Comunicación no es estado.** En M04 se decidía dónde vive un estado y quién es su única fuente de verdad
> (un store, un Context). Aquí se mira el **canal**: cómo llega un dato o un aviso de una microaplicación a otra,
> con qué contrato y qué pasa si quien escucha no está en ese momento. Retener el último mensaje de un bus no
> convierte el bus en un store: solo evita que quien llega tarde se quede sin el último aviso.

> [!TIP]
> En todos los ejercicios del módulo el navegador solo habla con el host (puerto 3000). Los remotes se piden en
> el mismo origen bajo `/mf/<nombre>/` y el servidor de desarrollo del host los reenvía a su puerto
> (`devServer.proxy`). Por eso en la pestaña **Red** verás rutas como `/mf/perfil/remoteEntry.js`.

## Páginas

<!-- gen:paginas -->
| # | Página | Qué hay |
|---|--------|---------|
| 00 | [Canales de comunicación](00-canales-de-comunicacion.md) | Demostración: el mismo dato por props, por contexto compartido y por evento |
| 01 | [Lab — Props entre microaplicaciones](01-lab-props-entre-microaplicaciones.md) | El host pasa datos y un callback a un remote por props y el remote responde |
| 02 | [Lab — Contexto compartido](02-lab-contexto-compartido.md) | Un paquete con un Context compartido como singleton llega a host y remote; sin singleton, no |
| 03 | [Lab — Bus de mensajes](03-lab-bus-de-mensajes.md) | Creas un bus con nombres de mensaje, payload y desuscripción entre dos remotes |
| 04 | [Lab — Último valor retenido](04-lab-ultimo-valor-retenido.md) | Un remote que monta tarde pierde el mensaje; lo resuelves reteniendo el último valor |

→ Empieza por **[00 — Canales de comunicación](00-canales-de-comunicacion.md)**.
<!-- /gen:paginas -->

## Conclusiones del módulo

### Qué es comunicar microaplicaciones

Es hacer llegar un dato o un aviso de una microaplicación a otra sin que una importe el código interno de la otra.
Lo que se comparte es un **contrato**: los nombres de las props, el objeto de contexto o los nombres y payloads
de los mensajes.

### Cómo debe ser

| Requisito | Dónde lo has visto |
|-----------|--------------------|
| El dueño del dato lo pasa y recibe los avisos por callback | Props con `usuario` y `onCerrarSesion` |
| El contexto es un único objeto para todas | `idioma-compartido` como singleton: el remote cambia a `[en]` |
| Los nombres de mensaje salen de un contrato, con versión | `MENSAJES.BUSQUEDA_CAMBIADA = 'busqueda:cambiada:v1'` |
| Quien se suscribe se da de baja | `suscribir` devuelve la baja y el efecto la devuelve |
| Quien llega tarde no se pierde el último aviso | El bus retiene el último valor en `window.__busUltimo` |

### Dónde se rompe

| Fallo | Síntoma |
|-------|---------|
| Global en `window` en lugar de props | Cambia la variable y la pantalla no se entera |
| Prop con otro nombre (`user` en lugar de `usuario`) | «Perfil: sin datos», sin ningún error |
| Contexto sin compartir | El host dice `en` y el remote sigue en `[es]` |
| Nombres de mensaje a mano | Se publica `buscar`, se escucha `busqueda`: no llega nada |
| Suscripción sin baja | Tras ocultar y mostrar, el mismo mensaje se recibe dos veces |
| Suscriptor que monta tarde | «Resultados para: (nada)» aunque ya se buscó |

Ninguno de estos fallos da un error en la **Consola**: el contrato se rompe en silencio, y por eso hay que
escribirlo en un sitio común y comprobarlo.

> 🔑 Elige el canal por la relación entre microaplicaciones (contiene, comparte un dato de ambiente o son
> hermanas) y escribe siempre el contrato en un sitio que importen las dos.

