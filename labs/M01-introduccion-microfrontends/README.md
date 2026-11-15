# M01 — Introducción a Microfrontends con React

[← Página anterior](../../README.md) · [Siguiente página →](00-del-monolito-a-microfrontends.md)

Este módulo responde a tres preguntas antes de tocar ninguna herramienta: qué es un [microfrontend](../glosario/01-arquitectura.md#microfrontend), qué gana y qué
cuesta frente a una aplicación React monolítica, y en qué proyectos compensa. La respuesta no se queda en la
teoría: se ve una página compuesta por dos aplicaciones React que se construyen por separado y, en el laboratorio,
se cambia una de ellas y se publica sin recompilar la otra.

## Qué aprenderás

- Explicar qué es un microfrontend con sus principios (equipo dueño, [despliegue independiente](../glosario/01-arquitectura.md#despliegue-independiente), aislamiento,
  [contrato](../glosario/01-arquitectura.md#contrato) mínimo) y distinguirlo de una simple carpeta de componentes.
- Reconocer cuándo compensa partir el frontend y cuándo es mejor seguir con un [monolito](../glosario/01-arquitectura.md#monolito) bien modularizado.
- Componer una página con dos aplicaciones React construidas y publicadas por separado, y ver en la pestaña
  **Red** (Network) del navegador qué ficheros llegan de cada una.
- Comprobar con los nombres de los ficheros publicados qué se vuelve a desplegar al cambiar una parte, en un
  monolito y en una página separada.
- Detectar el primer coste de separar sin más: cada aplicación lleva su propia copia de React.

## Teoría

Un **microfrontend** es una parte de la interfaz que un equipo construye, prueba y publica por su cuenta, y que
se compone con las demás en el navegador del usuario. En un monolito, todo el frontend sale de un único build:
cambiar un texto obliga a recompilar y volver a publicar el conjunto.

| | Monolito React | Microfrontends |
|---|----------------|----------------|
| Builds | Uno para toda la aplicación | Uno por [microaplicación](../glosario/01-arquitectura.md#microaplicacion) |
| Publicación | Todo a la vez | Cada parte a su ritmo |
| Fallo de una parte | Puede tumbar la página entera | Se queda en su hueco (si está bien aislada) |
| Dependencias | Una versión de React para todo | Cada parte decide, con riesgo de duplicar |
| Coste inicial | Bajo | Alto: integración, contratos, infraestructura |

> [!NOTE]
> Separar el código en carpetas o paquetes no es tener microfrontends. Lo que define un microfrontend es que se
> **despliega** solo: se publica una parte nueva y las demás no se recompilan.

En este módulo la composición es la más sencilla posible: la página carga con una etiqueta `<script>` un fichero
que otra aplicación publica en una URL fija. A partir del M03 esa misma idea se hace con **[Module Federation](../glosario/02-module-federation.md#module-federation)**,
que además permite compartir React entre las partes.

## Páginas

<!-- gen:paginas -->
| # | Página | Qué hay |
|---|--------|---------|
| 00 | [Del monolito a los microfrontends](00-del-monolito-a-microfrontends.md) | Qué es un microfrontend, sus principios y en qué casos empresariales compensa |
| 01 | [Una página, dos aplicaciones](01-una-pagina-dos-aplicaciones.md) | Demostración: una página compone dos aplicaciones React construidas y publicadas por separado |
| 02 | [Lab — Despliegue independiente](02-lab-despliegue-independiente.md) | Cambias un widget y lo publicas sin recompilar la página que lo usa; comparas con un monolito |

→ Empieza por **[00 — Del monolito a los microfrontends](00-del-monolito-a-microfrontends.md)**.
<!-- /gen:paginas -->

## Conclusiones del módulo

| Idea | Dónde se ha visto |
|------|-------------------|
| Un microfrontend se define por desplegarse solo, no por estar en otra carpeta | [00 — Del monolito a los microfrontends](00-del-monolito-a-microfrontends.md) |
| La página y el widget son dos builds: dos ficheros que llegan por separado en la pestaña **Red** | [01 — Una página, dos aplicaciones](01-una-pagina-dos-aplicaciones.md) |
| Cambiar el banner separado publica solo `banner.js`; en el monolito cambia el bundle entero | [02 — Lab: despliegue independiente](02-lab-despliegue-independiente.md) |
| Si el banner no está publicado, la tienda sigue funcionando sin él | [02 — Lab: despliegue independiente](02-lab-despliegue-independiente.md) |
| Cada aplicación lleva su copia de React (214 KiB por bundle) y el widget vive en una URL fija sin hash | Demo y lab: es el punto de partida del M03 |

> 🔑 Un microfrontend te da independencia para publicar a cambio de integración: en este módulo la pagas con
> React duplicado y una URL fija; Module Federation (M03) es la forma de pagar menos.
