# M02 — Diseño de Arquitecturas de Microfronts en React

[← Página anterior](../M01-introduccion-microfrontends/05-cinco-integraciones.md) · [Siguiente página →](00-imports-cruzados.md)

Antes de federar nada hay que saber **por dónde se corta** una aplicación React. Este módulo trabaja el diseño
previo a [Module Federation](../glosario/02-module-federation.md#module-federation): qué es una [frontera](../glosario/01-arquitectura.md#frontera) entre módulos y cómo se hace cumplir, cómo se estructura una
[microaplicación](../glosario/01-arquitectura.md#microaplicacion) para que cualquier contenedor la pueda montar y desmontar, y cómo se reparten las rutas cuando
varias microaplicaciones comparten una misma barra de direcciones. Todo se hace en un único bundle de Webpack, para
que lo que se vea sea la arquitectura y no la carga entre aplicaciones, que llega en M03.

## Qué aprenderás

- Detectar los imports que atan dos partes de una aplicación y prohibirlos con una regla del linter.
- Sustituir esas dependencias por un [contrato](../glosario/01-arquitectura.md#contrato) explícito de props, calculado por quien compone la página.
- Convertir una aplicación React en una microaplicación con `mount(elemento, props)` que devuelve cómo
  desmontarla, y que funciona sola y dentro de una página ajena.
- Repartir el enrutamiento: prefijos en el contenedor y rutas relativas en cada microaplicación.

## Teoría

Un [microfrontend](../glosario/01-arquitectura.md#microfrontend) no empieza en la configuración de Webpack, sino en tres decisiones de diseño:

| Decisión | Pregunta que responde | Pieza que la materializa | Página |
|----------|-----------------------|--------------------------|--------|
| Frontera | ¿Qué es de cada parte y qué puede ver de las otras? | Carpetas por módulo, regla `no-restricted-imports`, props | [00](00-imports-cruzados.md), [01](01-lab-fronteras-entre-modulos.md) |
| [Ciclo de vida](../glosario/04-integracion-despliegue.md#ciclo-de-vida) | ¿Quién decide dónde y cuándo se pinta cada parte? | `mount(elemento, props)` → `unmount` | [02](02-lab-estructura-microaplicacion.md) |
| Enrutamiento | ¿Quién es dueño de cada trozo de la URL? | Prefijos `/x/*` en el contenedor, rutas relativas dentro | [03](03-lab-enrutamiento-compartido.md) |

```text
                 contenedor
     (compone, reparte prefijos, pasa props)
         │                     │
   /ayuda/*  mount(el, props)   /ajustes/*
         ▼                     ▼
  microaplicación A      microaplicación B
  (rutas relativas,      (rutas relativas,
   no importa de B)       no importa de A)
```

El **contenedor** es la única pieza que conoce a todas las demás. Las microaplicaciones no se conocen entre sí:
lo que una necesita de otra le llega a través del contenedor.

> [!NOTE]
> **Módulo** y **microaplicación** no son lo mismo. Un módulo es una carpeta con frontera dentro de una
> aplicación; una microaplicación es un módulo que además sabe montarse sola (tiene su ciclo de vida) y que se
> puede construir y desplegar por separado. Primero se traza la frontera; después se le da ciclo de vida.

> [!TIP]
> Si una parte no se puede probar sola, en su propia página, todavía no es una microaplicación: depende de algo
> que el contenedor le da sin decirlo. El modo aislado del lab 02 sirve justamente para comprobarlo.

## Páginas

<!-- gen:paginas -->
| # | Página | Qué hay |
|---|--------|---------|
| 00 | [Imports cruzados](00-imports-cruzados.md) | Demostración: cómo un import entre carpetas ata dos partes de una aplicación |
| 01 | [Lab — Fronteras entre módulos](01-lab-fronteras-entre-modulos.md) | Una regla de ESLint detecta los imports que cruzan módulos y los sustituyes por props |
| 02 | [Lab — Estructura de una microaplicación](02-lab-estructura-microaplicacion.md) | Creas una microaplicación con mount y unmount que arranca sola y dentro de otra página |
| 03 | [Lab — Enrutamiento compartido](03-lab-enrutamiento-compartido.md) | El contenedor reparte las rutas de primer nivel y cada microaplicación gestiona las suyas |

→ Empieza por **[00 — Imports cruzados](00-imports-cruzados.md)**.
<!-- /gen:paginas -->

## Conclusiones del módulo

| Concepto | Qué lo hace bueno | Cómo se rompe |
|----------|-------------------|---------------|
| Frontera de módulo | Nadie importa ficheros de otro módulo; los datos llegan por props | Un import `../otro/…` convierte un detalle interno en una dependencia oculta |
| Microaplicación autónoma | `mount(elemento, props)` devuelve cómo desmontarla y funciona sola | Montarse siempre en `#root`, o desmontar sin limpiar lo registrado |
| [Enrutamiento en dos niveles](../glosario/01-arquitectura.md#enrutamiento-dos-niveles) | El contenedor reparte prefijos; dentro, rutas relativas | Una ruta con barra inicial sale del prefijo y acaba en «No encontrado» |

Las tres piezas son la misma idea aplicada a tres sitios: cada parte depende solo de un contrato explícito (props,
`mount`, un prefijo) que le da quien la compone. Con eso resuelto, en M03 cada microaplicación pasará a ser una
aplicación aparte que el contenedor carga por la red con Module Federation.

> 🔑 Se puede separar en microfrontends lo que ya no se conoce por dentro: fronteras, ciclo de vida y rutas se
> diseñan antes de federar.
