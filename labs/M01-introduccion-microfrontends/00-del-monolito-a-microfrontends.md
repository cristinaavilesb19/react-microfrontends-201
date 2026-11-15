# Del monolito a los microfrontends

[← Página anterior](README.md) · [Siguiente página →](01-una-pagina-dos-aplicaciones.md)

Esta página explica qué es un [microfrontend](../glosario/01-arquitectura.md#microfrontend), qué principios lo sostienen, qué gana y qué cuesta frente a una
aplicación React monolítica y en qué proyectos de empresa compensa. Es la base de todo el curso: cada módulo
posterior resuelve uno de los desafíos que aparecen aquí.

## Qué es un microfrontend

Un **microfrontend** es una parte de la interfaz de usuario (una sección, un widget, una ruta) que construye,
prueba y publica un equipo de forma independiente, y que se compone con otras partes para formar lo que el
usuario ve como una sola aplicación.

Es la misma idea que los microservicios llevada al navegador: en lugar de un único frontend que lo hace todo, la
interfaz se reparte en piezas con dueño, [ciclo de vida](../glosario/04-integracion-despliegue.md#ciclo-de-vida) y despliegue propios.

```text
Monolito                              Microfrontends
┌──────────────────────────┐          ┌──────────────────────────┐
│ un repositorio           │          │ página contenedora       │
│ un build → main.[hash].js│          │  ├─ cabecera   (equipo A)│
│ un despliegue            │          │  ├─ catálogo   (equipo B)│
│ cabecera+catálogo+carrito│          │  └─ carrito    (equipo C)│
└──────────────────────────┘          │ un build y un despliegue │
                                      │ por cada parte           │
                                      └──────────────────────────┘
```

> [!NOTE]
> Dividir el código en carpetas, paquetes de npm o un monorepo no es tener microfrontends. Si para publicar un
> cambio en el catálogo hay que recompilar y desplegar la cabecera, sigue siendo un [monolito](../glosario/01-arquitectura.md#monolito) (modular, pero
> monolito). Lo que define un microfrontend es el **[despliegue independiente](../glosario/01-arquitectura.md#despliegue-independiente)**.

## Principios clave

| Principio | Qué significa | Qué pasa si no se cumple |
|-----------|---------------|--------------------------|
| **Dueño único** | Cada microfrontend pertenece a un equipo, alineado con una parte del negocio (catálogo, pagos, cuenta) | Dos equipos tocan la misma pieza y vuelven a coordinarse en cada cambio |
| **Despliegue independiente** | Se publica una parte sin recompilar ni volver a desplegar las demás | El ritmo de publicación lo marca el equipo más lento |
| **Aislamiento** | No comparte estado global ni código interno con los demás por debajo de la mesa; un fallo queda en su hueco | Un error en un widget deja la página en blanco |
| **[Contrato](../glosario/01-arquitectura.md#contrato) mínimo** | Lo que se intercambian las partes es poco y explícito: un punto de montaje, unas props, unos eventos | Cualquier cambio interno rompe a otro equipo |
| **Autonomía técnica (con límites)** | Cada equipo elige y actualiza sus dependencias | Si no se acuerda nada, cada parte trae su copia de React y la página pesa el doble |

El último principio es el más delicado: la autonomía tiene un precio en bytes y en coherencia. Buena parte del
curso (M03, [dependencias compartidas](../glosario/02-module-federation.md#shared)) trata de cómo conservar la autonomía sin cargar React varias veces.

## Ventajas y desafíos frente al monolito

| Aspecto | Monolito React | Microfrontends |
|---------|----------------|----------------|
| Publicación | Todo a la vez, con un solo pipeline | Cada parte a su ritmo |
| Tamaño del build | Crece con toda la aplicación | Cada build es pequeño y rápido |
| Equipos | Comparten repositorio, revisiones y calendario | Trabajan en paralelo con [fronteras](../glosario/01-arquitectura.md#frontera) claras |
| Fallos | Un error de build o de ejecución afecta a todo | Se limita a la parte que falla, si está aislada |
| Actualizar librerías | Una migración de golpe para toda la aplicación | Parte a parte, con convivencia de versiones |
| Coherencia visual | Natural: un único código | Requiere sistema de diseño compartido |
| Rendimiento | Una sola copia de cada librería | Riesgo de duplicar React y otras dependencias |
| Integración | Imports normales entre componentes | Hace falta un mecanismo de composición y contratos |
| Operación | Un artefacto, un despliegue | Varios artefactos, versiones y URLs que vigilar |
| Pruebas de extremo a extremo | Sobre una sola aplicación | Sobre combinaciones de versiones de varias partes |

> [!WARNING]
> Los microfrontends resuelven un problema **organizativo** (muchos equipos sobre un mismo frontend) a costa de
> complejidad **técnica**. Con un solo equipo y una aplicación mediana, un monolito bien modularizado suele ser
> mejor opción.

## Cómo se componen: alternativas de integración

Las partes se pueden unir en distintos momentos. Cuanto más tarde se componen, más independiente es su
despliegue.

| Integración | Cómo funciona | Despliegue independiente | Cuándo se usa |
|-------------|---------------|--------------------------|---------------|
| **En el build** (build-time) | Cada parte se publica como paquete de npm y el contenedor la importa | No: hay que recompilar el contenedor para cada versión | Librerías compartidas, sistemas de diseño |
| **En el servidor** | El servidor (SSI, ESI, un servidor Node) ensambla el HTML de cada parte antes de enviarlo | Sí | Páginas con mucho contenido y SEO |
| **iframe** | Cada parte es una página completa dentro de un `<iframe>` | Sí, con aislamiento total | Integrar aplicaciones heredadas o de terceros; difícil compartir estilos, rutas y tamaño |
| **En el navegador, en tiempo de ejecución** | La página carga el JavaScript de cada parte desde su URL y lo monta en un hueco | Sí | SPA con varias partes React: **[Module Federation](../glosario/02-module-federation.md#module-federation)** (M03) y **[single-spa](../glosario/04-integracion-despliegue.md#single-spa)** (M05) |
| **Web components** | Cada parte se registra como un elemento HTML propio (`<mi-carrito>`) | Sí | Mezclar frameworks distintos detrás de un estándar del navegador |

> [!TIP]
> La demostración y el laboratorio de este módulo usan la forma más simple de composición en el navegador: una
> etiqueta `<script>` que carga el fichero de otra aplicación. Así se ve la idea sin herramientas; Module
> Federation y single-spa la hacen robusta.

## Casos de uso en proyectos empresariales

| Caso | Por qué encaja |
|------|----------------|
| Comercio electrónico grande (catálogo, buscador, carrito, pago, cuenta) | Cada área tiene su equipo y su ritmo: el banner de campañas cambia cada semana, el pago casi nunca |
| Portal interno o intranet que agrupa herramientas de varios departamentos | Cada departamento publica su herramienta sin coordinarse con los demás |
| Banca y seguros (área de cliente con productos distintos) | Productos con regulación y ciclos de aprobación diferentes conviven en una misma web |
| Migración progresiva de un frontend heredado | Se sustituye una sección cada vez, conviviendo con la antigua en la misma página |
| Plataformas SaaS con módulos contratables | Cada módulo se carga solo si el cliente lo tiene contratado |
| Paneles con widgets de varios proveedores o equipos | Cada widget es una aplicación que se monta en su hueco |

Cuándo **no** compensa:

- Un solo equipo pequeño o una aplicación que cabe en la cabeza de una persona.
- Productos en fase inicial, donde las fronteras entre áreas todavía cambian cada mes.
- Aplicaciones donde el peso y el tiempo de carga mandan y no hay margen para gestionar dependencias compartidas.

## Impacto en la escalabilidad y el mantenimiento

| Dimensión | Impacto positivo | Coste que aparece |
|-----------|------------------|-------------------|
| Escalabilidad de equipos | Se añaden equipos sin que el repositorio y el pipeline se conviertan en cuello de botella | Hace falta gobernanza: contratos, versionado, sistema de diseño |
| Escalabilidad del despliegue | Publicar una parte es rápido y de poco riesgo; se puede escalar y servir cada parte por separado (M07) | Más artefactos, URLs y versiones en producción |
| Mantenimiento del código | Bases de código pequeñas, fáciles de entender y de borrar | Duplicación de configuración (Webpack, Babel, lint) en cada parte |
| Evolución tecnológica | Se actualiza React o una librería parte a parte | Varias versiones conviviendo; incompatibilidades si se comparte mal |
| Rendimiento | Cada parte se puede cargar bajo demanda (M03, M05) | Dependencias duplicadas si no se comparten |
| Fiabilidad | Un fallo queda aislado en su parte | Hay que diseñar qué se muestra cuando una parte no carga |

> [!NOTE]
> El laboratorio de este módulo mide dos de estas filas con ficheros reales: qué se vuelve a publicar al cambiar
> una parte (despliegue) y cuánto pesa cada aplicación cuando no comparten React (rendimiento).

## En una frase

> 🔑 Un microfrontend es una parte de la interfaz con dueño propio que se publica sin recompilar las demás;
> compensa cuando hay varios equipos sobre un mismo frontend y obliga a resolver integración, dependencias
> compartidas y fallos parciales.
