# Glosario 04 — Integración y despliegue

[← Hoja anterior](03-estado-comunicacion.md) · [Índice del glosario](README.md)

Quién monta cada microaplicación y cuándo, y cómo se publica cada una por separado. Se usa en M05 y M07.

---

<a id="mapa"></a>
## 1. El mapa de familias

✔ = lo usas en el curso · ○ = hermano que no usamos, para que sepas que existe y cuándo se elige.

```text
Orquestar y publicar microfrontends
├── Orquestación en el navegador
│   ├── ✔ single-spa + Module Federation ............ M05
│   ├── ○ single-spa + import maps (create-single-spa)
│   └── ○ Rutas del propio host (React Router + lazy) ... M03-04
└── Publicación
    ├── ✔ Una imagen nginx por microaplicación ........ M07-00, M07-01
    ├── ✔ Deployment + Service en Kubernetes .......... M07-02, M07-03
    ├── ○ Ingress / Gateway API (una entrada con rutas por prefijo)
    └── ○ Almacenamiento estático + CDN (S3, Azure Blob…) con versiones conservadas
```

---

## 2. Los conceptos

<a id="single-spa"></a>
### single-spa

**Qué es:** un orquestador que registra microaplicaciones y, según la URL, decide cuáles montar y desmontar.
No sabe de React: trabaja con funciones de ciclo de vida.

**En el curso:** `registerApplication({ name, app, activeWhen })` y `start()` en `root-config.js`.

**Lo usas en:** <!--usos:single-spa-->[M01](../M01-introduccion-microfrontends/README.md) · [00-del](../M01-introduccion-microfrontends/00-del-monolito-a-microfrontends.md) · [03-lab](../M01-introduccion-microfrontends/03-lab-shell-sin-framework.md) · [05-cin](../M01-introduccion-microfrontends/05-cinco-integraciones.md) · [02-lab](../M02-diseno-arquitecturas/02-lab-estructura-microaplicacion.md) · [03-lab](../M02-diseno-arquitecturas/03-lab-enrutamiento-compartido.md) · [M05](../M05-integracion-single-spa/README.md) · [00-roo](../M05-integracion-single-spa/00-root-config.md) · [01-lab](../M05-integracion-single-spa/01-lab-registrar-microaplicaciones.md) · [02-lab](../M05-integracion-single-spa/02-lab-ciclo-de-vida.md) · [03-lab](../M05-integracion-single-spa/03-lab-carga-y-precarga.md)<!--/usos-->

<a id="qiankun"></a>
### qiankun

**Qué es:** una librería de microfrontends construida sobre single-spa. Cada microfrontend se registra por su
página HTML (`entry`), y qiankun la descarga, ejecuta sus scripts en un sandbox y llama al ciclo de vida que el
microfrontend deja en `window`. Nació en Ant Group y se usa sobre todo en China.

**En el curso:** M01-05, como cuarta forma de integrar los mismos dos microfrontends.

**Dónde se rompe:** no ejecuta `<script type="module">`: el microfrontend necesita un script clásico como
adaptador.

**Lo usas en:** <!--usos:qiankun-->[M01](../M01-introduccion-microfrontends/README.md) · [04-lab](../M01-introduccion-microfrontends/04-lab-aislamiento-de-estilos.md) · [05-cin](../M01-introduccion-microfrontends/05-cinco-integraciones.md)<!--/usos-->

<a id="root-config"></a>
### Root-config

**Qué es:** la página y el código que registran las microaplicaciones. No pinta contenido propio; define la
disposición (un `div#single-spa-application:<nombre>` por microaplicación) y el registro.

**Lo usas en:** <!--usos:root-config-->[M05](../M05-integracion-single-spa/README.md) · [00-roo](../M05-integracion-single-spa/00-root-config.md) · [01-lab](../M05-integracion-single-spa/01-lab-registrar-microaplicaciones.md) · [02-lab](../M05-integracion-single-spa/02-lab-ciclo-de-vida.md) · [03-lab](../M05-integracion-single-spa/03-lab-carga-y-precarga.md)<!--/usos-->

<a id="activewhen"></a>
### activeWhen

**Qué es:** la condición de URL con la que una microaplicación está activa: un prefijo (`'/perfil'`), una
función (`(location) => location.pathname === '/'`) o siempre (`() => true`).

**Lo usas en:** <!--usos:activewhen-->[00-roo](../M05-integracion-single-spa/00-root-config.md) · [01-lab](../M05-integracion-single-spa/01-lab-registrar-microaplicaciones.md)<!--/usos-->

<a id="ciclo-de-vida"></a>
### Ciclo de vida (bootstrap, mount, unmount)

**Qué es:** las tres funciones que single-spa llama: `bootstrap` una vez, `mount` al activarse y `unmount` al
desactivarse. `single-spa-react` las crea a partir del componente raíz, con su propia raíz de React.

**Dónde se rompe:** un fallo de render sin `errorBoundary` deja el `unmount` colgado (aviso `#31 … did not
resolve or reject for 3000 ms`); el resto de microaplicaciones sigue (M05-02).

**Lo usas en:** <!--usos:ciclo-de-vida-->[00-del](../M01-introduccion-microfrontends/00-del-monolito-a-microfrontends.md) · [03-lab](../M01-introduccion-microfrontends/03-lab-shell-sin-framework.md) · [05-cin](../M01-introduccion-microfrontends/05-cinco-integraciones.md) · [M02](../M02-diseno-arquitecturas/README.md) · [02-lab](../M02-diseno-arquitecturas/02-lab-estructura-microaplicacion.md) · [M05](../M05-integracion-single-spa/README.md) · [00-roo](../M05-integracion-single-spa/00-root-config.md) · [01-lab](../M05-integracion-single-spa/01-lab-registrar-microaplicaciones.md) · [02-lab](../M05-integracion-single-spa/02-lab-ciclo-de-vida.md)<!--/usos-->

<a id="precarga"></a>
### Precarga

**Qué es:** descargar por adelantado el código que probablemente hará falta, cuando el navegador está libre
(`requestIdleCallback`), sin montarlo.

**En el curso:** M05-03: el carrito se descarga tras arrancar; al entrar en `/carrito` ya no se pide nada.

**Lo usas en:** <!--usos:precarga-->[M05](../M05-integracion-single-spa/README.md) · [03-lab](../M05-integracion-single-spa/03-lab-carga-y-precarga.md)<!--/usos-->

<a id="imagen-multietapa"></a>
### Imagen multietapa

**Qué es:** un `Dockerfile` con una etapa que compila (Node) y otra que solo sirve el resultado (nginx). La
imagen final no lleva Node ni `node_modules`.

**En el curso:** `saludo:1` ocupa 62.4MB; se construye desde la raíz del repositorio porque necesita
`package-lock.json`.

**Lo usas en:** <!--usos:imagen-multietapa-->[M07](../M07-despliegue-escalabilidad/README.md) · [02-lab](../M07-despliegue-escalabilidad/02-lab-kubernetes.md)<!--/usos-->

<a id="deployment"></a>
### Deployment

**Qué es:** el objeto de Kubernetes que mantiene N réplicas de un contenedor y las actualiza poco a poco.

**En el curso:** uno por microfrontend (`saludo` con 2 réplicas, `host` con 1). Se escala uno sin tocar el otro.

**Lo usas en:** <!--usos:deployment-->[M07](../M07-despliegue-escalabilidad/README.md) · [02-lab](../M07-despliegue-escalabilidad/02-lab-kubernetes.md) · [03-lab](../M07-despliegue-escalabilidad/03-lab-actualizar-un-remote.md)<!--/usos-->

<a id="service"></a>
### Service

**Qué es:** el nombre y la IP estable con los que se llega a los pods de un Deployment.

**En el curso:** el host llega al remote por `http://saludo`; el Service `host` es NodePort 30080, publicado
como `localhost:8080` por kind.

**Lo usas en:** <!--usos:service-->[M07](../M07-despliegue-escalabilidad/README.md) · [02-lab](../M07-despliegue-escalabilidad/02-lab-kubernetes.md) · [03-lab](../M07-despliegue-escalabilidad/03-lab-actualizar-un-remote.md)<!--/usos-->

<a id="rolling-update"></a>
### Rolling update

**Qué es:** sustituir los pods de una versión por los de la siguiente de uno en uno, sin cortar el servicio.

**Dónde se rompe:** mientras conviven las dos versiones, un navegador puede recibir el `remoteEntry.js` de una
y pedir chunks que solo tiene la otra. En producción se conservan los chunks antiguos.

**Lo usas en:** <!--usos:rolling-update-->[M07](../M07-despliegue-escalabilidad/README.md) · [03-lab](../M07-despliegue-escalabilidad/03-lab-actualizar-un-remote.md)<!--/usos-->

<a id="rollback"></a>
### Rollback

**Qué es:** volver a la revisión anterior de un Deployment: `kubectl rollout undo deployment/saludo`.

**Lo usas en:** <!--usos:rollback-->[M07](../M07-despliegue-escalabilidad/README.md) · [03-lab](../M07-despliegue-escalabilidad/03-lab-actualizar-un-remote.md)<!--/usos-->
