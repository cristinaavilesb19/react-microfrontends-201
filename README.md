# Microfrontends con React

[Siguiente página →](labs/M01-introduccion-microfrontends/00-del-monolito-a-microfrontends.md)

## Objetivo general

Al finalizar el curso, el alumno sabrá partir una aplicación React en microfrontends que se construyen, se
despliegan y escalan por separado, y hacer que compartan estado y se comuniquen sin acoplarse.

## Enfoque

Cada concepto se trabaja con un **ejercicio pequeño e independiente**: un componente remoto, un contador con
hooks, un bus de dos mensajes. Cada laboratorio tiene su propia carpeta con el punto de partida y la solución,
y no depende de ningún otro.

El recorrido va de la idea a producción. Primero se ve qué gana un microfrontend frente al monolito y cómo se
trazan sus fronteras. Después se federan aplicaciones con **Webpack Module Federation**, se reparte el
**estado** (Redux, Context, una única fuente de verdad) y se integran con **single-spa**. Luego se elige el
**canal de comunicación** (props, contexto compartido, mensajes) y, al final, cada microaplicación va a su
imagen **Docker** y a su despliegue en **Kubernetes**.

Cada laboratorio termina rompiendo lo que acaba de montar: dos copias de React, un remote caído, un mensaje
que llega tarde, una caché que no se invalida. Así se ve dónde falla cada pieza.

## Dirigido a

Desarrolladores frontend que ya trabajan con React y mantienen, o van a mantener, aplicaciones grandes
repartidas entre varios equipos que necesitan publicar sus partes a su ritmo.

## Conocimientos previos

- **Se da por sabido:** React con componentes funcionales y hooks (`useState`, `useEffect`, `useContext`),
  JavaScript moderno (módulos ES, `async`/`await`, promesas) y npm.
- **Basta con haberlo usado:** Git básico, un bundler cualquiera, la terminal, las herramientas de desarrollo del
  navegador y Redux o React Router.
- **Se estudia en el curso:** Module Federation, single-spa, el estado compartido entre aplicaciones y el
  despliegue con Docker y Kubernetes.
- **Entorno:** GitHub Codespaces con todo instalado; solo necesitas una cuenta de GitHub.

## Objetivos específicos

- Explicar qué es un microfrontend y comprobar qué aporta el despliegue independiente frente a un monolito.
- Trazar fronteras entre módulos, estructurar una microaplicación autónoma y repartir las rutas en dos niveles.
- Configurar host y remotes con Module Federation, cargarlos en tiempo de ejecución, compartir React sin
  duplicarlo y cargar cada remote bajo demanda.
- Decidir dónde vive cada estado y compartirlo con Redux, Context, una fuente única y eventos globales.
- Integrar varias microaplicaciones React en una SPA con single-spa, controlando su ciclo de vida y su carga.
- Comunicar microaplicaciones por props, contexto compartido y un bus de mensajes con contrato.
- Empaquetar cada microaplicación en su imagen y desplegarla, escalarla y actualizarla por separado en Docker
  y Kubernetes.

## Temario

<!-- gen:temario -->
- **[M01 — Introducción a Microfrontends con React](labs/M01-introduccion-microfrontends/README.md)**
  - [Definición y principios clave](labs/M01-introduccion-microfrontends/00-del-monolito-a-microfrontends.md)
  - [Ventajas y desafíos frente a una arquitectura monolítica](labs/M01-introduccion-microfrontends/02-lab-despliegue-independiente.md)
  - [Casos de uso en proyectos empresariales](labs/M01-introduccion-microfrontends/00-del-monolito-a-microfrontends.md)
  - [Impacto de los microfrontends en la escalabilidad y el mantenimiento de aplicaciones React](labs/M01-introduccion-microfrontends/02-lab-despliegue-independiente.md)
- **[M02 — Diseño de Arquitecturas de Microfronts en React](labs/M02-diseno-arquitecturas/README.md)**
  - [Desacoplamiento de componentes y modularización](labs/M02-diseno-arquitecturas/01-lab-fronteras-entre-modulos.md)
  - [Estructura de microaplicaciones en React](labs/M02-diseno-arquitecturas/02-lab-estructura-microaplicacion.md)
  - [Definición de un sistema de enrutamiento compartido entre microaplicaciones](labs/M02-diseno-arquitecturas/03-lab-enrutamiento-compartido.md)
  - [Ejercicio práctico: Diseño de un proyecto básico con React modularizado](labs/M02-diseno-arquitecturas/01-lab-fronteras-entre-modulos.md)
- **[M03 — Webpack Module Federation en React](labs/M03-module-federation/README.md)**
  - [Configuración de Webpack Module Federation](labs/M03-module-federation/01-lab-host-y-remote.md)
  - [Carga dinámica de módulos federados en tiempo de ejecución](labs/M03-module-federation/02-lab-remotos-dinamicos.md)
  - [Gestión de dependencias compartidas: Evitar la duplicación de librerías](labs/M03-module-federation/03-lab-dependencias-compartidas.md)
  - [Optimización de la carga inicial mediante Lazy Loading](labs/M03-module-federation/04-lab-lazy-loading-remotos.md)
  - [Ejercicio práctico: Configuración de un proyecto React utilizando Webpack Module Federation](labs/M03-module-federation/01-lab-host-y-remote.md)
- **[M04 — State Management en Microfronts con React](labs/M04-state-management/README.md)**
  - [Redux en aplicaciones desacopladas: Manejo del estado global](labs/M04-state-management/01-lab-store-redux-compartido.md)
  - [Uso de Context API para manejar estados locales en microaplicaciones](labs/M04-state-management/02-lab-context-estado-local.md)
  - [Sincronización del estado entre microaplicaciones React](labs/M04-state-management/03-lab-sincronizar-estado.md)
  - [Implementación de eventos globales para la comunicación entre microfronts](labs/M04-state-management/04-lab-eventos-hacia-el-store.md)
  - [Ejercicio práctico: Gestión del estado global con Redux en un sistema de microfrontends](labs/M04-state-management/01-lab-store-redux-compartido.md)
- **[M05 — Integración de Microaplicaciones React](labs/M05-integracion-single-spa/README.md)**
  - [Uso de Single-SPA para la integración de microaplicaciones React](labs/M05-integracion-single-spa/00-root-config.md)
  - [Integración de múltiples microaplicaciones en una sola SPA](labs/M05-integracion-single-spa/01-lab-registrar-microaplicaciones.md)
  - [Renderizado independiente de cada microfrontend](labs/M05-integracion-single-spa/02-lab-ciclo-de-vida.md)
  - [Estrategias de Lazy Loading para optimizar la carga de microfrontends](labs/M05-integracion-single-spa/03-lab-carga-y-precarga.md)
  - [Ejercicio práctico: Integración de microaplicaciones con Single-SPA y Lazy Loading](labs/M05-integracion-single-spa/01-lab-registrar-microaplicaciones.md)
- **[M06 — Comunicación entre Microaplicaciones React](labs/M06-comunicacion/README.md)**
  - [Uso de props y contextos compartidos para pasar datos entre microaplicaciones](labs/M06-comunicacion/01-lab-props-entre-microaplicaciones.md)
  - [Implementación de eventos globales y sistemas de mensajes](labs/M06-comunicacion/03-lab-bus-de-mensajes.md)
  - [Sincronización del estado y datos compartidos entre microfronts](labs/M06-comunicacion/04-lab-ultimo-valor-retenido.md)
  - [Ejercicio práctico: Comunicación entre microaplicaciones desacopladas usando eventos globales](labs/M06-comunicacion/03-lab-bus-de-mensajes.md)
- **[M07 — Despliegue y Escalabilidad en Microfrontends React](labs/M07-despliegue-escalabilidad/README.md)**
  - [Despliegue de microaplicaciones React en Docker](labs/M07-despliegue-escalabilidad/01-lab-imagenes-docker.md)
  - [Orquestación de microfrontends con Kubernetes](labs/M07-despliegue-escalabilidad/02-lab-kubernetes.md)
  - [Estrategias para la escalabilidad en producción: Despliegue independiente de cada microfrontend](labs/M07-despliegue-escalabilidad/03-lab-actualizar-un-remote.md)
  - [Ejercicio práctico: Despliegue de una arquitectura de microfrontends en entornos Docker y Kubernetes](labs/M07-despliegue-escalabilidad/02-lab-kubernetes.md)
<!-- /gen:temario -->

## Antes de empezar

1. Haz un **fork** de este repositorio en tu cuenta de GitHub.
2. En tu fork, pulsa **Code** → pestaña **Codespaces** → **Create codespace on main**.
3. Espera a que termine la preparación: instala las dependencias de todos los ejercicios (`npm ci`).

| Necesitas | Dónde |
|-----------|-------|
| Qué trae el entorno, puertos y solución de problemas | [infra/README.md](infra/README.md) |
| Fichas de los comandos del curso | [labs/comandos-lab.md](labs/comandos-lab.md) |
| Glosario | [labs/glosario/README.md](labs/glosario/README.md) |

## Guardar tu trabajo

Los laboratorios modifican ficheros de `ejercicios/…/inicio/`. Guárdalos en **tu fork**:

```bash
# Un commit por laboratorio, en tu fork (origin)
git add ejercicios/M03-01-host-y-remote
git commit -m "M03-01 host y remote"
git push origin main
```

Para recibir correcciones del curso original, añádelo como `upstream` una vez y trae sus cambios cuando los haya:

```bash
# Una sola vez: el repositorio del curso como upstream
git remote add upstream https://github.com/my-it-labs/react-microfrontends-201.git
# Cuando quieras traer correcciones
git pull upstream main
```

Lo que generan los ejercicios (`dist/`, `publicado/`, `node_modules/`) queda fuera del control de versiones.

## Empieza aquí

<!-- gen:empieza -->
→ **[M01 — Del monolito a los microfrontends](labs/M01-introduccion-microfrontends/00-del-monolito-a-microfrontends.md)**
<!-- /gen:empieza -->
