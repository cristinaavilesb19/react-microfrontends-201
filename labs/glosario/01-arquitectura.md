# Glosario 01 — Arquitectura

[Índice del glosario](README.md) · [Siguiente hoja →](02-module-federation.md)

Qué es un microfrontend, frente a qué se compara y cómo se trazan sus límites. Se usa sobre todo en M01 y M02.

---

<a id="mapa"></a>
## 1. El mapa de familias

✔ = lo usas en el curso · ○ = hermano que no usamos, para que sepas que existe y cuándo se elige.

```text
Cómo se compone una página hecha por varios equipos
├── En tiempo de compilación
│   └── ○ Paquetes npm por equipo (un solo build: vuelve a ser un monolito al desplegar)
├── En el servidor
│   └── ○ Server-side includes / composición en el edge (SSR, ESI)
└── En el navegador, en tiempo de ejecución
    ├── ○ iframes (aislamiento total, integración pobre)
    ├── ○ Web Components (custom elements como frontera)
    ├── ✔ Script con contrato de montaje ........ M01-01, M01-02, M02-02
    ├── ✔ Webpack Module Federation .............. M03, M04, M06, M07
    └── ✔ single-spa (orquestación por URL) ...... M05
```

<a id="comparacion-composicion"></a>
### Comparación: cuándo se compone

| | ✔ En el navegador | ○ En compilación | ○ En el servidor |
|--|--|--|--|
| **Cómo funciona** | La página descarga el código de cada equipo al ejecutarse | Cada equipo publica un paquete y la aplicación lo instala | El servidor junta fragmentos HTML antes de responder |
| **Cuándo se elige** | Equipos que publican a su ritmo en una SPA | Pocos equipos, despliegue conjunto aceptable | SEO, primera carga muy rápida |
| **Qué cuesta** | Gestionar versiones y dependencias compartidas en tiempo de ejecución | Cada cambio obliga a recompilar y desplegar todo | Infraestructura de servidor y caché |
| **En el curso** | El banner se cambia sin recompilar la tienda (M01-02) | — | — |

---

## 2. Los conceptos

<a id="microfrontend"></a>
### Microfrontend

**Qué es:** una parte de la interfaz de una aplicación web que un equipo construye, prueba y despliega por su
cuenta, y que se compone con las demás en una sola página.

**En el curso:** el `reloj` de M01-01 y el `banner` de M01-02 son los primeros: un bundle propio que se monta
en el hueco que le deja la página. A partir de M03, cada remote es un microfrontend.

**Dónde se rompe:** cuando dos microfrontends tienen que desplegarse juntos para funcionar. Entonces la
separación solo añade complejidad.

**Lo usas en:** <!--usos:microfrontend-->[M01](../M01-introduccion-microfrontends/README.md) · [00-del](../M01-introduccion-microfrontends/00-del-monolito-a-microfrontends.md) · [02-lab](../M01-introduccion-microfrontends/02-lab-despliegue-independiente.md) · [M02](../M02-diseno-arquitecturas/README.md) · [00-imp](../M02-diseno-arquitecturas/00-imports-cruzados.md) · [01-lab](../M02-diseno-arquitecturas/01-lab-fronteras-entre-modulos.md) · [M03](../M03-module-federation/README.md) · [02-lab](../M03-module-federation/02-lab-remotos-dinamicos.md) · [04-lab](../M03-module-federation/04-lab-lazy-loading-remotos.md) · [M04](../M04-state-management/README.md) · [00-don](../M04-state-management/00-donde-vive-el-estado.md) · [01-lab](../M04-state-management/01-lab-store-redux-compartido.md) · [02-lab](../M04-state-management/02-lab-context-estado-local.md) · [03-lab](../M04-state-management/03-lab-sincronizar-estado.md) · [M05](../M05-integracion-single-spa/README.md) · [04-lab](../M06-comunicacion/04-lab-ultimo-valor-retenido.md) · [M07](../M07-despliegue-escalabilidad/README.md) · [00-una](../M07-despliegue-escalabilidad/00-una-imagen-por-microfrontend.md) · [01-lab](../M07-despliegue-escalabilidad/01-lab-imagenes-docker.md) · [02-lab](../M07-despliegue-escalabilidad/02-lab-kubernetes.md) · [03-lab](../M07-despliegue-escalabilidad/03-lab-actualizar-un-remote.md)<!--/usos-->

Relacionado: [monolito](#monolito) · [despliegue independiente](#despliegue-independiente)

<a id="monolito"></a>
### Monolito frontend

**Qué es:** una aplicación de interfaz que se compila y se despliega entera, como una sola pieza, aunque por
dentro esté bien organizada en carpetas.

**En el curso:** `ejercicios/M01-02-despliegue-independiente/monolito`: banner y catálogo salen en un único
`main.<hash>.js`; cambiar una frase del banner cambia el hash de todo el bundle.

**Dónde se rompe:** con varios equipos, cada despliegue arrastra el trabajo de todos.

**Lo usas en:** <!--usos:monolito-->[M01](../M01-introduccion-microfrontends/README.md) · [00-del](../M01-introduccion-microfrontends/00-del-monolito-a-microfrontends.md) · [01-una](../M01-introduccion-microfrontends/01-una-pagina-dos-aplicaciones.md) · [02-lab](../M01-introduccion-microfrontends/02-lab-despliegue-independiente.md) · [03-lab](../M05-integracion-single-spa/03-lab-carga-y-precarga.md)<!--/usos-->

Relacionado: [microfrontend](#microfrontend)

<a id="despliegue-independiente"></a>
### Despliegue independiente

**Qué es:** poder publicar una nueva versión de una parte sin recompilar ni volver a desplegar las demás.

**En el curso:** en M01-02 se reconstruye solo `banner.js` y la tienda conserva su `main.62e09873.js`; en
M07-03 se actualiza el Deployment `saludo` y el pod del host no cambia.

**Dónde se rompe:** si la URL de entrada de la parte cambia en cada versión (el resto tendría que
enterarse) o si la caché del navegador sirve la versión vieja.

**Lo usas en:** <!--usos:despliegue-independiente-->[M01](../M01-introduccion-microfrontends/README.md) · [00-del](../M01-introduccion-microfrontends/00-del-monolito-a-microfrontends.md) · [02-lab](../M01-introduccion-microfrontends/02-lab-despliegue-independiente.md) · [M07](../M07-despliegue-escalabilidad/README.md) · [03-lab](../M07-despliegue-escalabilidad/03-lab-actualizar-un-remote.md)<!--/usos-->

Relacionado: [contrato](#contrato)

<a id="frontera"></a>
### Frontera de módulo

**Qué es:** el límite que separa lo que un módulo expone de lo que es suyo y nadie más debe tocar.

**En el curso:** en M02-01, `src/modulos/<x>/` no puede importar de otro módulo; lo vigila la regla
`no-restricted-imports` de ESLint con el patrón `../*/**`.

**Dónde se rompe:** un import cruzado (`../clientes/datos`) que funciona hoy y se rompe en silencio cuando el
otro equipo renombra una función (M02-00).

**Lo usas en:** <!--usos:frontera-->[00-del](../M01-introduccion-microfrontends/00-del-monolito-a-microfrontends.md) · [M02](../M02-diseno-arquitecturas/README.md) · [01-lab](../M02-diseno-arquitecturas/01-lab-fronteras-entre-modulos.md) · [04-lab](../M03-module-federation/04-lab-lazy-loading-remotos.md) · [00-don](../M04-state-management/00-donde-vive-el-estado.md) · [02-lab](../M04-state-management/02-lab-context-estado-local.md)<!--/usos-->

Relacionado: [contrato](#contrato)

<a id="contrato"></a>
### Contrato

**Qué es:** lo único que una parte promete a las demás: qué expone, qué recibe y qué avisa. Todo lo demás
puede cambiar sin pedir permiso.

**En el curso:** props (`total`, `pendientes` en M02-01; `usuario`, `onCerrarSesion` en M06-01),
`window.notas.mount(el, props)` en M02-02, los módulos de `exposes` en M03, los nombres de mensaje de
`paquetes/mensajes/contrato.js` en M06-03.

**Dónde se rompe:** cuando cambia sin avisar: `user=` en lugar de `usuario=` deja el perfil «sin datos» sin
ningún error (M06-01).

**Lo usas en:** <!--usos:contrato-->[M01](../M01-introduccion-microfrontends/README.md) · [00-del](../M01-introduccion-microfrontends/00-del-monolito-a-microfrontends.md) · [01-una](../M01-introduccion-microfrontends/01-una-pagina-dos-aplicaciones.md) · [02-lab](../M01-introduccion-microfrontends/02-lab-despliegue-independiente.md) · [M02](../M02-diseno-arquitecturas/README.md) · [00-imp](../M02-diseno-arquitecturas/00-imports-cruzados.md) · [01-lab](../M02-diseno-arquitecturas/01-lab-fronteras-entre-modulos.md) · [02-lab](../M02-diseno-arquitecturas/02-lab-estructura-microaplicacion.md) · [03-lab](../M02-diseno-arquitecturas/03-lab-enrutamiento-compartido.md) · [01-lab](../M03-module-federation/01-lab-host-y-remote.md) · [M04](../M04-state-management/README.md) · [00-don](../M04-state-management/00-donde-vive-el-estado.md) · [01-lab](../M04-state-management/01-lab-store-redux-compartido.md) · [02-lab](../M04-state-management/02-lab-context-estado-local.md) · [04-lab](../M04-state-management/04-lab-eventos-hacia-el-store.md) · [M06](../M06-comunicacion/README.md) · [01-lab](../M06-comunicacion/01-lab-props-entre-microaplicaciones.md) · [03-lab](../M06-comunicacion/03-lab-bus-de-mensajes.md) · [04-lab](../M06-comunicacion/04-lab-ultimo-valor-retenido.md)<!--/usos-->

<a id="microaplicacion"></a>
### Microaplicación

**Qué es:** un microfrontend con todo lo necesario para arrancar: sabe montarse en un elemento que le dan,
desmontarse y funcionar sola para desarrollarla.

**En el curso:** `notas` de M02-02 exporta `mount(elemento, props)`, que devuelve la función de desmontar, y
se monta sola si la página tiene `#root`.

**Dónde se rompe:** si se monta siempre en un id fijo de su propia página, solo funciona en su página.

**Lo usas en:** <!--usos:microaplicacion-->[M01](../M01-introduccion-microfrontends/README.md) · [M02](../M02-diseno-arquitecturas/README.md) · [00-imp](../M02-diseno-arquitecturas/00-imports-cruzados.md) · [01-lab](../M02-diseno-arquitecturas/01-lab-fronteras-entre-modulos.md) · [02-lab](../M02-diseno-arquitecturas/02-lab-estructura-microaplicacion.md) · [03-lab](../M02-diseno-arquitecturas/03-lab-enrutamiento-compartido.md) · [M04](../M04-state-management/README.md) · [00-don](../M04-state-management/00-donde-vive-el-estado.md) · [01-lab](../M04-state-management/01-lab-store-redux-compartido.md) · [02-lab](../M04-state-management/02-lab-context-estado-local.md) · [03-lab](../M04-state-management/03-lab-sincronizar-estado.md) · [04-lab](../M04-state-management/04-lab-eventos-hacia-el-store.md) · [M05](../M05-integracion-single-spa/README.md) · [01-lab](../M05-integracion-single-spa/01-lab-registrar-microaplicaciones.md) · [02-lab](../M05-integracion-single-spa/02-lab-ciclo-de-vida.md) · [03-lab](../M05-integracion-single-spa/03-lab-carga-y-precarga.md) · [M06](../M06-comunicacion/README.md) · [00-can](../M06-comunicacion/00-canales-de-comunicacion.md) · [01-lab](../M06-comunicacion/01-lab-props-entre-microaplicaciones.md) · [02-lab](../M06-comunicacion/02-lab-contexto-compartido.md) · [03-lab](../M06-comunicacion/03-lab-bus-de-mensajes.md) · [04-lab](../M06-comunicacion/04-lab-ultimo-valor-retenido.md) · [M07](../M07-despliegue-escalabilidad/README.md) · [01-lab](../M07-despliegue-escalabilidad/01-lab-imagenes-docker.md) · [02-lab](../M07-despliegue-escalabilidad/02-lab-kubernetes.md) · [03-lab](../M07-despliegue-escalabilidad/03-lab-actualizar-un-remote.md)<!--/usos-->

Relacionado: [ciclo de vida](04-integracion-despliegue.md#ciclo-de-vida)

<a id="enrutamiento-dos-niveles"></a>
### Enrutamiento en dos niveles

**Qué es:** el contenedor decide qué microaplicación ocupa cada prefijo de la URL (`/ayuda/*`) y cada
microaplicación gestiona sus rutas por debajo, relativas a ese prefijo.

**En el curso:** M02-03, con React Router 7: `<Route path="/ayuda/*">` en el contenedor y
`<Route path="faq">` dentro de la microaplicación. En M05, `activeWhen` de single-spa es el primer nivel.

**Dónde se rompe:** rutas absolutas dentro de la microaplicación (`/faq`): el clic sale del prefijo y acaba
en «No encontrado».

**Lo usas en:** <!--usos:enrutamiento-dos-niveles-->[M02](../M02-diseno-arquitecturas/README.md) · [03-lab](../M02-diseno-arquitecturas/03-lab-enrutamiento-compartido.md)<!--/usos-->
