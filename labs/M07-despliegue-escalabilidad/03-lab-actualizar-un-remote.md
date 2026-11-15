# Lab — Actualizar un remote

[← Página anterior](02-lab-kubernetes.md)

En este laboratorio practicas **el [despliegue independiente](../glosario/01-arquitectura.md#despliegue-independiente) y la caché de `remoteEntry.js`**. El ejercicio
es el par mínimo de siempre, un [remote](../glosario/02-module-federation.md#remote) `saludo` y un `host` que lo carga con [Module Federation](../glosario/02-module-federation.md#module-federation), desplegados en
Kubernetes (kind). Cambias una palabra del remote («versión 1» → «versión 2»), publicas su imagen nueva sin
tocar el [host](../glosario/02-module-federation.md#host), compruebas por qué el navegador la ve sin borrar la caché y vuelves atrás con un [rollback](../glosario/04-integracion-despliegue.md#rollback).

### Objetivo

Comprender qué es el despliegue independiente de un [microfrontend](../glosario/01-arquitectura.md#microfrontend): cómo llega una versión nueva del remote al
navegador sin tocar el host, qué papel tiene la caché de `remoteEntry.js`, cómo se detecta un problema durante
la actualización y cómo se vuelve a la versión anterior.

### Punto de partida

- Carpeta del ejercicio: [`ejercicios/M07-03-actualizar-un-remote/`](../../ejercicios/M07-03-actualizar-un-remote/),
  con `saludo/`, `host/`, [`kind.yaml`](../../ejercicios/M07-03-actualizar-un-remote/kind.yaml) y
  [`k8s/`](../../ejercicios/M07-03-actualizar-un-remote/k8s/). Solo vas a cambiar
  [`saludo/src/Saludo.jsx`](../../ejercicios/M07-03-actualizar-un-remote/saludo/src/Saludo.jsx).
- Terminal en la raíz del repositorio: `/workspaces/react-microfrontends-201`. Todos los comandos se lanzan
  desde ahí.
- Puerto: **8080**, desde la pestaña **Puertos** de VS Code (icono del globo, «Abrir en el navegador»).
- Estado: Docker en marcha y el 8080 libre o ya ocupado por el clúster `microfrontends` del curso. El paso 1
  deja desplegada la versión 1, vengas de donde vengas.

### Qué está pasando

La promesa de los microfrontends es que el equipo del remote publica cuando quiere, sin pedir al del host que
reconstruya ni redespliegue. Eso funciona por dos cosas:

| Pieza | Qué hace | En este laboratorio |
|-------|----------|---------------------|
| `remoteEntry.js` con nombre fijo y `Cache-Control: no-cache` | El host siempre lo pide por la misma URL y el navegador lo revalida en cada carga | `/mf/saludo/remoteEntry.js` |
| Chunks con hash en el nombre, cacheados un año | Una versión nueva trae ficheros con nombres nuevos; los viejos nunca se sobrescriben | `442.e35820d8.js` pasa a `442.48e608fe.js` |
| [Rolling update](../glosario/04-integracion-despliegue.md#rolling-update) del [Deployment](../glosario/04-integracion-despliegue.md#deployment) | Kubernetes sustituye los pods del remote poco a poco, sin cortar | `kubectl set image` sobre `deployment/saludo` |
| Historial de revisiones | Cada cambio de plantilla del pod es una revisión a la que se puede volver | `kubectl rollout history` y `rollout undo` |

El host no cambia: su nginx reenvía `/mf/saludo/` al [Service](../glosario/04-integracion-despliegue.md#service) `saludo` (`SALUDO_URL=http://saludo`) y el
navegador solo habla con el host, en el 8080. Quien cambia es lo que hay detrás de ese Service.

> [!WARNING]
> Durante el rolling update hay pods de la versión 1 y de la 2 detrás del mismo Service. Un navegador puede
> recibir el `remoteEntry.js` de una versión y pedir un chunk que solo tiene la otra: la carga falla con un
> `ChunkLoadError` en la **Consola**. En producción se evita publicando los estáticos de cada versión en un
> almacenamiento compartido o una CDN que **conserva los chunks antiguos**, de modo que cualquier
> `remoteEntry.js` encuentra siempre sus ficheros.

### 1 — Despliega la versión 1

Este paso reconstruye el punto de partida: clúster, imágenes de la versión 1 cargadas en el nodo, y el
Deployment y el Service de cada [microaplicación](../glosario/01-arquitectura.md#microaplicacion). Si el clúster ya existe, el script lo dice
(`El clúster microfrontends ya existe.`) y no lo toca ([ficha](../comandos-lab.md#cluster-up)).

```bash
# Clúster kind «microfrontends» (si no existe)
bash scripts/cluster-up.sh ejercicios/M07-03-actualizar-un-remote/kind.yaml
# Imágenes de la versión 1, construidas desde la raíz del repositorio
docker build -q -f ejercicios/M07-03-actualizar-un-remote/saludo/Dockerfile -t saludo:1 .
docker build -q -f ejercicios/M07-03-actualizar-un-remote/host/Dockerfile -t host:1 .
# Copia las imágenes al nodo (no hay registro)
kind load docker-image saludo:1 host:1 --name microfrontends
# Borra lo que hubiera desplegado el lab anterior, para que los pods arranquen con estas imágenes
kubectl delete deployment,service saludo host --ignore-not-found
# Deployment + Service de cada microaplicación
kubectl apply -f ejercicios/M07-03-actualizar-un-remote/k8s/saludo.yaml
kubectl apply -f ejercicios/M07-03-actualizar-un-remote/k8s/host.yaml
# Espera a que estén listos
kubectl rollout status deployment/saludo && kubectl rollout status deployment/host
```

**Resultado esperado** (recortado: solo el final; los `sha256` y el puerto cambian):

```text
Kubernetes control plane is running at https://127.0.0.1:38959
...
deployment "saludo" successfully rolled out
deployment "host" successfully rolled out
```

Abre el puerto **8080** en el navegador: el título «Host» y «Hola desde el remote saludo, versión 1».

### 2 — Fíjate en el pod del host

Para comprobar después que el host no se ha tocado, mira sus pods ahora.

```bash
# Pods con su nodo e IP (recortado a las primeras columnas)
kubectl get pods -o wide | cut -c1-60
```

**Resultado esperado** (sufijos y edades cambian; si acabas de escalar el remote puede quedar un pod
`Terminating`):

```text
NAME                     READY   STATUS        RESTARTS   AG
host-7cc49c467f-qp4cz    1/1     Running       0          1s
saludo-8dcd66c8b-k6sxp   1/1     Running       0          26
saludo-8dcd66c8b-p72ss   1/1     Terminating   0          12
saludo-8dcd66c8b-swr6b   1/1     Running       0          26
```

El nombre del pod del host (aquí `host-7cc49c467f-qp4cz`) es lo que vas a comparar al final. Los pods de
`saludo` llevan `8dcd66c8b`, el identificador de la plantilla de la versión 1.

### 3 — Mira qué chunks anuncia remoteEntry.js

Abre en el navegador la URL del puerto 8080 seguida de `/mf/saludo/remoteEntry.js`. Es el fichero en crudo,
minificado. Los nombres de los chunks no aparecen enteros: Webpack guarda un **mapa** de identificador de
chunk → hash y compone el nombre al pedirlo. Busca con `Ctrl+F` `696:"` y verás el hash que le corresponde.
Con este comando de ayuda sacas el mapa completo:

```bash
# Mapa id de chunk → hash que guarda remoteEntry.js
curl -s http://localhost:8080/mf/saludo/remoteEntry.js | grep -oE '\{[0-9]+:"[0-9a-f]{8}"[^}]*\}'
```

**Resultado esperado** (versión 1; los hashes cambian si cambia el código):

```text
{442:"e35820d8",696:"1e000061",706:"7d085d6c"}
```

Cada pareja es `id:"hash"` y el fichero que pedirá el navegador es `<id>.<hash>.js`: `442:"e35820d8"` es
`/mf/saludo/442.e35820d8.js`, el mismo nombre que ves en la pestaña **Red**. Deja este resultado a la vista
en la terminal: lo vas a comparar con el de la versión 2.

### 4 — Cambia el texto del remote

El cambio es mínimo a propósito: una palabra visible en el componente expuesto.

```jsx
// ejercicios/M07-03-actualizar-un-remote/saludo/src/Saludo.jsx
// Texto visible de la versión desplegada.
export default function Saludo() {
  return <p>Hola desde el remote saludo, versión 2</p>;
}
```

### 5 — Construye la imagen de la versión 2

Solo se construye el remote. La etiqueta nueva, `saludo:2`, es la que permite a Kubernetes distinguir las
versiones.

```bash
# Imagen nueva del remote; el host no se reconstruye
docker build -q -f ejercicios/M07-03-actualizar-un-remote/saludo/Dockerfile -t saludo:2 .
```

**Resultado esperado** (el identificador cambia):

```text
sha256:9780de0f832b18fa2a5735b0bec1e0b39c32350fc71e528e8d4ded4c38a2acae
```

### 6 — Carga la versión 2 en el nodo

```bash
# Copia saludo:2 al nodo del clúster
kind load docker-image saludo:2 --name microfrontends
```

**Resultado esperado:**

```text
Image: "saludo:2" with ID "sha256:9780de0f832b18fa2a5735b0bec1e0b39c32350fc71e528e8d4ded4c38a2acae" not yet present on node "microfrontends-control-plane", loading...
```

### 7 — Publica la versión 2

Cambia la imagen del contenedor `saludo` del Deployment `saludo`. Es lo que haría el pipeline del equipo del
remote: el Deployment del host no aparece en el comando.

```bash
# Nueva imagen para el contenedor «saludo» del Deployment saludo
kubectl set image deployment/saludo saludo=saludo:2
```

**Resultado esperado:**

```text
deployment.apps/saludo image updated
```

### 8 — Sigue el rolling update

```bash
# Espera a que todos los pods de saludo sean de la versión nueva
kubectl rollout status deployment/saludo
```

**Resultado esperado** (el número de líneas de espera varía):

```text
Waiting for deployment "saludo" rollout to finish: 1 out of 2 new replicas have been updated...
Waiting for deployment "saludo" rollout to finish: 1 out of 2 new replicas have been updated...
Waiting for deployment "saludo" rollout to finish: 1 out of 2 new replicas have been updated...
Waiting for deployment "saludo" rollout to finish: 1 old replicas are pending termination...
Waiting for deployment "saludo" rollout to finish: 1 old replicas are pending termination...
deployment "saludo" successfully rolled out
```

Kubernetes ha creado un pod nuevo, ha esperado a que esté listo y solo entonces ha retirado uno viejo, y así
hasta el final. Mientras salían las líneas `1 out of 2`, el Service repartía entre las dos versiones.

### 9 — Comprueba que el host no ha cambiado

```bash
# Pods después de la actualización
kubectl get pods
```

**Resultado esperado** (sufijos y edades cambian):

```text
NAME                      READY   STATUS        RESTARTS   AGE
host-7cc49c467f-qp4cz     1/1     Running       0          5s
saludo-7bddc666d7-gfdhr   1/1     Running       0          1s
saludo-7bddc666d7-hpllb   1/1     Running       0          2s
saludo-8dcd66c8b-swr6b    1/1     Terminating   0          30s
```

| Pod | Qué ha pasado |
|-----|---------------|
| `host-7cc49c467f-qp4cz` | El mismo nombre que en el paso 2: el host no se ha reiniciado |
| `saludo-7bddc666d7-…` | Pods nuevos, con otra plantilla (`7bddc666d7`): la versión 2 |
| `saludo-8dcd66c8b-swr6b` `Terminating` | El último pod de la versión 1, saliendo |

### 10 — Recarga el navegador

Recarga la página del 8080 con **F12** → pestaña **Red** (Network) abierta, **sin** vaciar la caché. El texto
pasa a «Hola desde el remote saludo, versión 2». En la pestaña **Red**, pulsa `remoteEntry.js`: su
`Cache-Control: no-cache` obliga al navegador a preguntar al servidor, y el servidor devuelve el fichero
nuevo. Los chunks del remote tienen ahora otros nombres, así que el navegador los descarga aunque tuviera los
de la versión 1 cacheados para un año.

Compara el mapa con el del paso 3:

```bash
# Mapa id de chunk → hash con la versión 2 desplegada
curl -s http://localhost:8080/mf/saludo/remoteEntry.js | grep -oE '\{[0-9]+:"[0-9a-f]{8}"[^}]*\}'
```

**Resultado esperado:**

```text
{442:"48e608fe",696:"1e000061",706:"7d085d6c"}
```

| Chunk | Versión 1 | Versión 2 |
|-------|-----------|-----------|
| 442 | `442.e35820d8.js` | `442.48e608fe.js` |
| 696 | `696.1e000061.js` | `696.1e000061.js` |
| 706 | `706.7d085d6c.js` | `706.7d085d6c.js` |

Solo cambia el `442`, el chunk de `Saludo.jsx`: es el único fichero cuyo contenido ha cambiado, así que es el
único con hash nuevo, y el navegador lo descarga aunque tuviera el viejo cacheado para un año. `696` y `706`
(el código de terceros que acompaña al componente) conservan su nombre y el navegador los reutiliza de su
caché. El nombre `remoteEntry.js` sigue siendo el mismo, y sigue llegando con `no-cache`:

```bash
# Cabecera de caché de remoteEntry.js con la versión 2
curl -sI http://localhost:8080/mf/saludo/remoteEntry.js | grep -iE 'HTTP|cache-control'
```

**Resultado esperado:**

```text
HTTP/1.1 200 OK
Cache-Control: no-cache
```

Por eso el host, que solo conoce ese nombre, no ha necesitado cambiar nada.

### 11 — Deja escrito el motivo y mira el historial

Cada cambio de la plantilla del pod crea una revisión. Para saber después qué era cada una, guarda el motivo
en la anotación `kubernetes.io/change-cause` del Deployment: se copia a la revisión actual.

```bash
# Motivo de la revisión actual (la versión 2) e historial de revisiones
kubectl annotate deployment/saludo kubernetes.io/change-cause='saludo versión 2' && kubectl rollout history deployment/saludo
```

**Resultado esperado:**

```text
deployment.apps/saludo annotated
deployment.apps/saludo
REVISION  CHANGE-CAUSE
1         <none>
2         saludo versión 2

```

La revisión 1 es `saludo:1`, publicada sin motivo; la 2, `saludo:2`, con el tuyo.

### 12 — Vuelve a la versión 1

La versión 2 tiene un problema (o eso supones): vuelve a la anterior sin reconstruir nada.

```bash
# Vuelve a la revisión anterior y espera a que termine
kubectl rollout undo deployment/saludo && kubectl rollout status deployment/saludo
```

**Resultado esperado:**

```text
deployment.apps/saludo rolled back
Waiting for deployment "saludo" rollout to finish: 1 out of 2 new replicas have been updated...
Waiting for deployment "saludo" rollout to finish: 1 out of 2 new replicas have been updated...
Waiting for deployment "saludo" rollout to finish: 1 out of 2 new replicas have been updated...
Waiting for deployment "saludo" rollout to finish: 1 old replicas are pending termination...
Waiting for deployment "saludo" rollout to finish: 1 old replicas are pending termination...
deployment "saludo" successfully rolled out
```

```bash
# Pods después del rollback
kubectl get pods
```

**Resultado esperado** (sufijos y edades cambian):

```text
NAME                     READY   STATUS    RESTARTS   AGE
host-7cc49c467f-qp4cz    1/1     Running   0          69s
saludo-8dcd66c8b-74gq2   1/1     Running   0          32s
saludo-8dcd66c8b-nfqjx   1/1     Running   0          33s
```

Los pods de `saludo` vuelven a llevar `8dcd66c8b`: la misma plantilla que en el paso 2, la de `saludo:1`. Un
rollback no reconstruye nada; reactiva una revisión anterior con su imagen, que sigue en el nodo. El host sigue
siendo `host-7cc49c467f-qp4cz`. Recarga el navegador: vuelve «Hola desde el remote saludo, versión 1».

El mapa de `remoteEntry.js` vuelve a ser el del paso 3:

```bash
# Mapa id de chunk → hash tras el rollback
curl -s http://localhost:8080/mf/saludo/remoteEntry.js | grep -oE '\{[0-9]+:"[0-9a-f]{8}"[^}]*\}'
```

**Resultado esperado:**

```text
{442:"e35820d8",696:"1e000061",706:"7d085d6c"}
```

Y el historial ha cambiado de una forma que sorprende:

```bash
# Revisiones después del rollback
kubectl rollout history deployment/saludo
```

**Resultado esperado:**

```text
deployment.apps/saludo
REVISION  CHANGE-CAUSE
2         saludo versión 2
3         <none>

```

La revisión 1 ha desaparecido: el rollback no «vuelve» a la 1, la reactiva como una revisión nueva, la 3. Un
`undo` sin número va siempre a la revisión anterior a la actual.

## Comprueba tu entendimiento

**El host no se ha enterado**
Compara el nombre del pod del host en los pasos 2, 9 y 12.
→ Es el mismo (`host-…-qp4cz` en la salida de ejemplo) en los tres.

**Cada versión, su plantilla**
Mira el prefijo de los pods de `saludo` antes, durante y después.
→ `8dcd66c8b` con `saludo:1`, `7bddc666d7` con `saludo:2` y otra vez `8dcd66c8b` tras el rollback.

**Qué imagen está en uso**
Pregunta al Deployment qué imagen tiene ahora.
→ `saludo:1` después del rollback.

```bash
# Imagen del contenedor del Deployment saludo
kubectl get deployment saludo -o jsonpath='{.spec.template.spec.containers[0].image}'
```

## Investiga

¿Qué pasaría si `remoteEntry.js` se sirviera con la misma caché que los chunks? Abre
[`saludo/nginx.conf`](../../ejercicios/M07-03-actualizar-un-remote/saludo/nginx.conf) y localiza las dos
reglas: `location = /remoteEntry.js` con `no-cache` y `location /` con `max-age=31536000, immutable`. Después
mira la cabecera real que llega al navegador a través del host:

```bash
# Cabecera de caché de remoteEntry.js, pedido a través del host
curl -sI http://localhost:8080/mf/saludo/remoteEntry.js | grep -iE 'HTTP|cache-control'
```

```text
HTTP/1.1 200 OK
Cache-Control: no-cache
```

Con `immutable`, un navegador que ya hubiera cargado la versión 1 no volvería a pedir `remoteEntry.js`
durante un año: seguiría pidiendo los chunks de la versión 1, aunque el clúster ya solo sirviera la 2.

## Experimenta

Tras el rollback, el Deployment usa `saludo:1` y `Saludo.jsx` sigue diciendo «versión 2». Construye ese
código con la **misma** etiqueta que está en uso. **Antes, predice**: al lanzar `kubectl set image
deployment/saludo saludo=saludo:1`, ¿se crearán pods nuevos con el texto «versión 2»?

```bash
# Código de la versión 2 con la etiqueta de la versión 1, cargado en el nodo
docker build -q -f ejercicios/M07-03-actualizar-un-remote/saludo/Dockerfile -t saludo:1 .
kind load docker-image saludo:1 --name microfrontends
# La misma imagen que ya tiene el Deployment
kubectl set image deployment/saludo saludo=saludo:1
kubectl rollout history deployment/saludo
```

**Resultado esperado** (recortado: sin el identificador del build):

```text
Image with ID: sha256:9780de0f832b18fa2a5735b0bec1e0b39c32350fc71e528e8d4ded4c38a2acae already present on the node microfrontends-control-plane but is missing the tag docker.io/library/saludo:1. re-tagging...
deployment.apps/saludo
REVISION  CHANGE-CAUSE
2         saludo versión 2
3         <none>
```

`kind load` reconoce la imagen: es idéntica a `saludo:2` (mismo código, mismo identificador) y solo le pone la
etiqueta `saludo:1`. `kubectl set image` no imprime nada y el historial no tiene revisión nueva.

La plantilla del pod no cambia (sigue diciendo `saludo:1`), así que Kubernetes no ve nada que desplegar: no hay
revisión nueva ni pods nuevos, y los que ya corren siguen con la imagen que tenían. Lo peligroso es que, a
partir de ahora, cualquier pod que se recree (un fallo, un escalado) arrancará con el código nuevo bajo la
etiqueta vieja. Por eso cada versión lleva su propia etiqueta. Deja `saludo:1` como era:

```bash
# Devuelve Saludo.jsx a «versión 1» y reconstruye y recarga saludo:1
git checkout -- ejercicios/M07-03-actualizar-un-remote/saludo/src/Saludo.jsx
docker build -q -f ejercicios/M07-03-actualizar-un-remote/saludo/Dockerfile -t saludo:1 .
kind load docker-image saludo:1 --name microfrontends
```

## Reto

### 1 — Volver a una revisión concreta

**La situación:** tras el rollback del paso 12, el problema de la versión 2 resulta no ser tal y hay que
volver a publicarla. Un compañero propone reconstruir la imagen y lanzar otra vez `kubectl set image`, y otro,
un `undo` «a la anterior».

**Qué haces:** vuelve a la versión 2 **por su número de revisión**, sin construir nada, y mira el historial
resultante.

**Pistas:** `kubectl rollout history deployment/saludo` para ver los números; `--revision=N` enseña la
plantilla (y la imagen) de una revisión; `kubectl rollout undo --to-revision=N`.

**Lo que buscas:** que los pods de `saludo` vuelvan a llevar la plantilla de `saludo:2` y que el historial
conserve el motivo `saludo versión 2`.

<details>
<summary>Ver solución</summary>

```bash
# Comprueba antes qué imagen tiene la revisión 2
kubectl rollout history deployment/saludo --revision=2
# Vuelve a la revisión 2, espera y mira el historial
kubectl rollout undo deployment/saludo --to-revision=2 && kubectl rollout status deployment/saludo && kubectl rollout history deployment/saludo
```

```text
deployment.apps/saludo rolled back
Waiting for deployment "saludo" rollout to finish: 1 out of 2 new replicas have been updated...
Waiting for deployment "saludo" rollout to finish: 1 out of 2 new replicas have been updated...
Waiting for deployment "saludo" rollout to finish: 1 out of 2 new replicas have been updated...
Waiting for deployment "saludo" rollout to finish: 1 old replicas are pending termination...
Waiting for deployment "saludo" rollout to finish: 1 old replicas are pending termination...
deployment "saludo" successfully rolled out
deployment.apps/saludo
REVISION  CHANGE-CAUSE
3         <none>
4         saludo versión 2

```

La revisión 2 se reactiva como la 4 y se lleva su `CHANGE-CAUSE`: el motivo viaja con la plantilla. Ni se ha
reconstruido la imagen (`saludo:2` sigue en el nodo) ni se ha tocado el host. Con `undo` a secas habrías ido a
la revisión anterior a la actual, que no siempre es la que quieres. En un equipo real, la anotación la pone el
pipeline con el commit o la versión publicada. **La regla:** el motivo de cada despliegue vive junto al
despliegue, y se vuelve a una revisión concreta, comprobada con `--revision`, no «a la anterior».

</details>

## Limpieza

Deja el remote como está en el repositorio y borra el clúster ([ficha](../comandos-lab.md#cluster-up)). Si
también levantaste el Compose del laboratorio de Docker, páralo.

```bash
# Devuelve Saludo.jsx a «versión 1»
git checkout -- ejercicios/M07-03-actualizar-un-remote/saludo/src/Saludo.jsx
# Borra el clúster y libera el puerto 8080
kind delete cluster --name microfrontends
# Si sigue en marcha, para el Compose del laboratorio de Docker
docker compose -f ejercicios/M07-01-imagenes-docker/compose.yaml down
```

## Errores frecuentes

| Síntoma | Causa probable | Cómo arreglarlo |
|---------|----------------|-----------------|
| Pods nuevos en `ErrImagePull` tras `set image` | `saludo:2` no se cargó en el nodo | `kind load docker-image saludo:2 --name microfrontends` |
| `set image` no crea pods nuevos | La etiqueta es la misma que ya usa el Deployment | Construye con una etiqueta nueva (`saludo:3`) y usa esa |
| El navegador sigue mostrando la versión anterior | `remoteEntry.js` cacheado (sin `no-cache`) o la página no se ha recargado | Comprueba `Cache-Control` con `curl -sI` y recarga |
| `ChunkLoadError` en la **Consola** durante la actualización | Mezcla de versiones: `remoteEntry.js` de una versión, chunk pedido a un pod de la otra | Recarga al terminar el rollout; en producción, chunks antiguos conservados en un almacenamiento estático o CDN |
| `rollout undo` vuelve a una versión inesperada | `undo` sin número va a la revisión anterior a la actual, sea cual sea | `kubectl rollout history` y `kubectl rollout undo --to-revision=N` |

```bash
# Comandos de diagnóstico de la tabla
kind load docker-image saludo:2 --name microfrontends
curl -sI http://localhost:8080/mf/saludo/remoteEntry.js | grep -i cache-control
kubectl rollout history deployment/saludo
kubectl rollout undo deployment/saludo --to-revision=2
```

## Conclusiones

### Qué es el despliegue independiente de un microfrontend

Publicar una versión del remote es cambiar la imagen de **su** Deployment. El host sigue pidiendo
`/mf/saludo/remoteEntry.js`; como ese fichero se revalida en cada carga, el navegador recibe el de la versión
nueva, y este anuncia chunks con nombres nuevos.

```text
versión 1: remoteEntry.js {442:"e35820d8"…} ──► 442.e35820d8.js …   (pods 8dcd66c8b)
                 │ kubectl set image saludo=saludo:2
versión 2: remoteEntry.js {442:"48e608fe"…} ──► 442.48e608fe.js …   (pods 7bddc666d7)
host: host-7cc49c467f-qp4cz, sin cambios
```

### Cómo debe ser

| Requisito | En el lab |
|-----------|-----------|
| Una etiqueta de imagen por versión | `saludo:1`, `saludo:2` |
| `remoteEntry.js` revalidado, chunks con hash e inmutables | `no-cache` frente a `max-age=31536000, immutable` en `saludo/nginx.conf` |
| Publicar el remote sin tocar el host | `kubectl set image deployment/saludo`; el pod del host conserva su nombre |
| Actualizar sin cortar | Rolling update: `1 out of 2 new replicas`, luego `1 old replicas are pending termination` |
| Poder volver atrás sin reconstruir | `kubectl rollout undo`: pods otra vez con la plantilla `8dcd66c8b` |

### Dónde se rompe y cómo lo has detectado

| Fallo | Cómo lo has visto | Qué provoca |
|-------|-------------------|-------------|
| Reutilizar la etiqueta | `set image` con `saludo:1` no crea revisión | La versión nueva no se despliega |
| `remoteEntry.js` cacheado | Las dos reglas de `nginx.conf` y su `Cache-Control` | El navegador se queda en la versión vieja |
| Mezcla de versiones en el rolling update | Pods `7bddc666d7` y `8dcd66c8b` a la vez en el paso 9 | Un `remoteEntry.js` puede pedir chunks que su pod no tiene |
| Historial sin motivo | `CHANGE-CAUSE <none>` | No se sabe a qué revisión volver |

### Cómo se perfecciona

- Estáticos de cada versión en un almacenamiento compartido o una CDN que conserva los chunks antiguos: la
  convivencia de versiones deja de romper la carga.
- Despliegues canary o blue-green para exponer la versión nueva a una parte del tráfico antes de pasar a todos.
- Un pipeline de CI/CD por microfrontend que construye, etiqueta con la versión, publica la imagen y registra el
  motivo del despliegue.
- Un `ErrorBoundary` en el host para que un fallo del remote no deje la página en blanco.

### En una frase

> 🔑 El remote se publica cambiando solo su Deployment; `remoteEntry.js` revalidado y chunks con hash hacen que
> el navegador lo vea sin que el host se entere.
