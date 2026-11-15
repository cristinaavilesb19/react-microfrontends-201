# M07 — Despliegue y Escalabilidad en Microfrontends React

[← Página anterior](../M06-comunicacion/04-lab-ultimo-valor-retenido.md) · [Siguiente página →](00-una-imagen-por-microfrontend.md)

Un [microfrontend](../glosario/01-arquitectura.md#microfrontend) solo es independiente si llega a producción por separado. Este módulo lleva cada
[microaplicación](../glosario/01-arquitectura.md#microaplicacion) React a **su propia imagen Docker**, la levanta junto a las demás con **Docker Compose**, la
despliega en **Kubernetes** con su propio [Deployment](../glosario/04-integracion-despliegue.md#deployment) y su propio [Service](../glosario/04-integracion-despliegue.md#service), y publica una versión nueva del
[remote](../glosario/02-module-federation.md#remote) **sin reconstruir ni reiniciar el [host](../glosario/02-module-federation.md#host)**. Es el [despliegue independiente](../glosario/01-arquitectura.md#despliegue-independiente) de cada microfrontend llevado a
la práctica: una imagen, un despliegue y un ritmo de publicación por microaplicación.

## Qué aprenderás

- Empaquetar una microaplicación React en una imagen pequeña que solo contiene nginx y los estáticos de su build.
- Decidir qué ficheros de un remote se pueden cachear para siempre y cuál hay que revalidar en cada carga.
- Construir el host una vez y decirle al arrancar dónde está el remote, sin reconstruir su imagen.
- Desplegar host y remote en Kubernetes como piezas separadas y escalar solo la que lo necesita.
- Publicar una versión nueva del remote, comprobar que el host no se entera y volver atrás si algo falla.

## Teoría

### Un microfrontend en producción son ficheros estáticos

El build de Webpack de una microaplicación produce HTML, JavaScript y, si es un remote, su `remoteEntry.js`.
No hace falta Node para servirlo: basta un servidor de estáticos. Por eso la imagen se construye en **dos
etapas**:

| Etapa | Imagen base | Qué hace | Llega a la imagen final |
|-------|-------------|----------|-------------------------|
| `build` | `node:22-alpine` | `npm ci` y `npm run build` | No |
| final | `nginx:1.29-alpine` | Sirve `dist/` con su `nginx.conf` | Sí: solo nginx y los estáticos |

### Qué se cachea y qué no

| Fichero | Nombre | Caché | Por qué |
|---------|--------|-------|---------|
| `remoteEntry.js` | Fijo | `no-cache` (revalidar siempre) | El host lo pide siempre por el mismo nombre; si se cachea, nunca ve la versión nueva |
| Chunks (`696.c867bd17.js`…) | Con hash del contenido | `max-age=31536000, immutable` | Si el contenido cambia, cambia el nombre: el fichero viejo nunca se sobrescribe |
| `index.html` del host | Fijo | `no-cache` | Es la puerta de entrada a los ficheros con hash |

### Un único punto de entrada

El navegador solo habla con el host. Los remotes se piden en ese mismo origen, bajo `/mf/<nombre>/`, y el
servidor del host los reenvía a donde estén: `devServer.proxy` en desarrollo y nginx en Docker y Kubernetes.

```text
navegador ──► :8080 host (nginx)
                ├── /              → estáticos del host
                └── /mf/saludo/    → proxy_pass ${SALUDO_URL}/  ──► saludo (nginx)
```

La dirección del remote (`SALUDO_URL`) no se compila en el host: se le da **al arrancar el contenedor**. La
misma imagen `host:1` sirve en Compose (`http://saludo`, el nombre del servicio) y en Kubernetes
(`http://saludo`, el nombre del Service).

### Por qué Docker, Kubernetes y kind

Un microfrontend en producción son ficheros estáticos. Docker los empaqueta con su servidor (nginx) en una
imagen que se ejecuta igual en cualquier sitio. Kubernetes decide cuántas copias corren de cada imagen, las
sustituye sin cortar el servicio y deja volver atrás: es donde el despliegue independiente de cada
microfrontend se hace operativo. Los dos entran en el temario (7.1, 7.2 y 7.4).

Para practicar no hace falta un clúster en la nube. **kind** («Kubernetes in Docker») levanta un Kubernetes
completo dentro de un contenedor del propio Codespace: los mismos objetos y el mismo `kubectl` que en un clúster
real, sin cuentas ni coste. La única diferencia que se nota es que las imágenes no se suben a un registro:
se copian al nodo con `kind load docker-image`.

### Las piezas de Kubernetes

| Objeto | Qué es para un microfrontend | En este módulo |
|--------|------------------------------|----------------|
| Deployment | Cuántas copias (pods) de su imagen y qué versión | Uno por microaplicación: `host` (1 réplica) y `saludo` (2) |
| Service `ClusterIP` | Un nombre estable que reparte entre sus pods | `saludo`: el host lo encuentra como `http://saludo` |
| Service `NodePort` | Un puerto abierto en el nodo | `host`, en el 30080, que kind publica como 8080 |
| [Rolling update](../glosario/04-integracion-despliegue.md#rolling-update) | Sustituir pods de una versión por otra sin cortar | `kubectl set image` del saludo; `rollout undo` para volver |

> [!NOTE]
> En producción la entrada al clúster no suele ser un `NodePort`, sino un **Ingress** o la **Gateway API**,
> con su dominio y su certificado. En el curso se usa `NodePort` para no depender de un controlador de
> entrada: la idea (un único punto de entrada que reparte a cada microfrontend) es la misma.

> [!WARNING]
> Durante un rolling update conviven pods de la versión vieja y de la nueva. Un navegador puede recibir el
> `remoteEntry.js` de una versión y pedir chunks que solo tiene la otra. En producción se evita publicando
> los estáticos en un almacenamiento compartido o una CDN que **conserva los chunks antiguos**.

El siguiente paso natural, fuera de este módulo, es un pipeline de CI/CD por microaplicación que construya y
publique su imagen en cada cambio.

## Páginas

<!-- gen:paginas -->
| # | Página | Qué hay |
|---|--------|---------|
| 00 | [Una imagen por microfrontend](00-una-imagen-por-microfrontend.md) | Demostración: [build multietapa](../glosario/04-integracion-despliegue.md#imagen-multietapa) de un remote y nginx sirviendo su remoteEntry.js |
| 01 | [Lab — Imágenes Docker](01-lab-imagenes-docker.md) | Construyes la imagen de host y remote y los levantas con Docker Compose, con la URL del remote al arrancar |
| 02 | [Lab — Kubernetes](02-lab-kubernetes.md) | Despliegas host y remote en kind, cada uno con su Deployment y su Service, con una única entrada NodePort |
| 03 | [Lab — Actualizar un remote](03-lab-actualizar-un-remote.md) | Publicas la versión 2 del remote sin tocar el host, controlas la caché y haces [rollback](../glosario/04-integracion-despliegue.md#rollback) |

→ Empieza por **[00 — Una imagen por microfrontend](00-una-imagen-por-microfrontend.md)**.
<!-- /gen:paginas -->

## Conclusiones del módulo

### Qué es desplegar un microfrontend por separado

Cada microaplicación es una imagen con nginx y sus estáticos, con su propio despliegue. El host conoce la
dirección del remote por configuración al arrancar y el navegador entra siempre por el host.

### Cómo debe ser

| Requisito | Dónde se ha visto |
|-----------|-------------------|
| Imagen pequeña, sin Node ni código fuente | Build multietapa: `saludo:1` ocupa 62.4MB |
| `remoteEntry.js` revalidado, chunks inmutables | `Cache-Control: no-cache` frente a `max-age=31536000, immutable` |
| Dirección del remote fuera de la imagen | `${SALUDO_URL}` en la plantilla de nginx del host |
| Un Deployment y un Service por microfrontend | `k8s/saludo.yaml` y `k8s/host.yaml` |
| Escalar y actualizar uno sin tocar el otro | 3 réplicas de saludo y la versión 2 con el mismo pod del host |

### Dónde se rompe

| Fallo | Qué se ve |
|-------|-----------|
| El remote no está en marcha | La página del host se queda en blanco; `/mf/saludo/remoteEntry.js` da `502 Bad Gateway` |
| `remoteEntry.js` cacheado como un chunk | El navegador sigue cargando la versión vieja del remote |
| Rolling update sin conservar chunks viejos | Mezcla de versiones: un `remoteEntry.js` pide chunks que ya no existen |

### En una frase

> 🔑 Un microfrontend es independiente cuando su imagen, su despliegue y su versión se cambian sin tocar los
> de los demás, y el host solo sabe dónde encontrarlo.
