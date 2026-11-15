# M04 — State Management en Microfronts con React

[← Página anterior](../M03-module-federation/04-lab-lazy-loading-remotos.md) · [Siguiente página →](00-donde-vive-el-estado.md)

En un [microfrontend](../glosario/01-arquitectura.md#microfrontend) cada aplicación se construye y se despliega por separado, pero la página que ve el usuario
es una sola. Este módulo trata la pregunta que eso abre: **dónde vive cada estado** y cómo se reparte entre
[microaplicaciones](../glosario/01-arquitectura.md#microaplicacion) sin que dependan unas de otras. Se trabaja con cuatro mecanismos, uno por laboratorio: un
store de Redux del [host](../glosario/02-module-federation.md#host) al que los [remotes](../glosario/02-module-federation.md#remote) inyectan su slice, un Context que no sale de su microaplicación, un
módulo compartido como [fuente única](../glosario/03-estado-comunicacion.md#fuente-unica) y un [evento global](../glosario/03-estado-comunicacion.md#evento-global) que el host convierte en acción.

## Qué aprenderás

- Decidir si un dato es de componente, de microaplicación o global, y qué coste tiene subirlo de alcance.
- Montar en el host un store ampliable y dejar que cada remote le añada su slice sin que el host lo importe.
- Encerrar el estado interno de una microaplicación en un Context que no se publica en `exposes`.
- Detectar dos copias del mismo dato y sustituirlas por una sola instancia compartida.
- Conectar una microaplicación sin Redux al store del host con un evento y un efecto que se limpia.

## Teoría

Cada bundle trae sus propios módulos. Dos microaplicaciones que importan el mismo fichero tienen, en el
navegador, **dos copias** de él, salvo que [Module Federation](../glosario/02-module-federation.md#module-federation) lo comparta como [singleton](../glosario/02-module-federation.md#singleton). Por eso compartir estado
es, en el fondo, compartir **una instancia**: de un store, de un contexto o de un módulo.

| Alcance | Dónde vive | Quién lo ve |
|---------|------------|-------------|
| De componente | `useState` | Ese componente |
| De microaplicación | Context privado | Sus componentes, nadie de fuera |
| Global | Store del host o módulo compartido singleton | Todas las microaplicaciones |

> [!NOTE]
> El fallo típico no es un error en la **Consola**: es que todo funciona, pero dos partes de la página enseñan
> valores distintos del mismo dato. Cada laboratorio empieza enseñando ese síntoma.

> [!TIP]
> Cada dato en el alcance más pequeño que funcione. Lo que es global entra en el [contrato](../glosario/01-arquitectura.md#contrato) entre equipos.

La página [00 — Dónde vive el estado](00-donde-vive-el-estado.md) desarrolla estos alcances y compara los cuatro
mecanismos.

## Páginas

<!-- gen:paginas -->
| # | Página | Qué hay |
|---|--------|---------|
| 00 | [Dónde vive el estado](00-donde-vive-el-estado.md) | Estado de componente, de microaplicación y global: qué va en cada sitio |
| 01 | [Lab — Store Redux compartido](01-lab-store-redux-compartido.md) | El host crea el store y un remote inyecta su reducer sin que el host lo conozca |
| 02 | [Lab — Context para el estado local](02-lab-context-estado-local.md) | Un formulario por pasos guarda su estado en un Context que no sale de su microaplicación |
| 03 | [Lab — Sincronizar estado](03-lab-sincronizar-estado.md) | Dos remotes con su propia copia del tema claro/oscuro se desincronizan; lo arreglas con una única fuente |
| 04 | [Lab — Eventos globales hacia el store](04-lab-eventos-hacia-el-store.md) | Un remote sin Redux emite un CustomEvent y el host lo convierte en una acción del store |

→ Empieza por **[00 — Dónde vive el estado](00-donde-vive-el-estado.md)**.
<!-- /gen:paginas -->

## Conclusiones del módulo

### Qué mecanismo para qué

| Mecanismo | Cuándo | Qué comparte | Dónde se rompe |
|-----------|--------|--------------|----------------|
| Store del host + `inyectar` | Varias microaplicaciones leen y cambian el mismo estado y aceptan Redux | El store, `react-redux` y `@reduxjs/toolkit` como singleton | Un remote con su propio store: el host cuenta `favoritos: 0` |
| Context privado | El estado solo importa dentro de una microaplicación | Nada | El host lo intenta importar: `Module "./FormularioContext" does not exist in container.` |
| Módulo compartido singleton | Un valor sencillo que muestran varias (tema, idioma) | Una instancia del paquete | Sin `shared`, cada remote lleva su copia y se desincroniza |
| Evento global → acción | Un remote sin Redux tiene que avisar de algo | Solo el nombre del evento y `detail` | Sin limpieza del efecto, dos acciones por clic |

### Lo que se repite en los cuatro

- **Una sola instancia.** El mismo código en dos bundles no es el mismo estado; lo que lo hace uno es
  `singleton: true` o un sitio que ya es único, como `window`.
- **Un dueño por dato.** El host es dueño del store y de lo que traduce a acciones; cada remote, de su slice y de
  su Context.
- **Contratos pequeños.** `inyectar(slice)`, `exposes`, `tema-compartido@1.0.0`, `acceso:sesion-iniciada`: cuanto
  menos expone cada parte, menos se coordinan los despliegues.

> 🔑 Decidir dónde vive el estado es decidir cuánto se acoplan las microaplicaciones: cada dato en el alcance más
> pequeño que funcione y, si es global, en una sola instancia con un contrato explícito.
