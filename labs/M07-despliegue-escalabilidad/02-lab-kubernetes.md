# Lab — Kubernetes

[← Página anterior](01-lab-imagenes-docker.md) · [Siguiente página →](03-lab-actualizar-un-remote.md)

En este laboratorio practicas **un [Deployment](../glosario/04-integracion-despliegue.md#deployment) y un [Service](../glosario/04-integracion-despliegue.md#service) por [microfrontend](../glosario/01-arquitectura.md#microfrontend)**. El ejercicio es el mismo par
mínimo de aplicaciones, un [remote](../glosario/02-module-federation.md#remote) `saludo` y un `host` que lo carga con [Module Federation](../glosario/02-module-federation.md#module-federation), desplegado ahora en
un clúster de Kubernetes local (kind). Cada [microaplicación](../glosario/01-arquitectura.md#microaplicacion) tiene su Deployment y su Service, el [host](../glosario/02-module-federation.md#host) es la
única entrada desde fuera y el remote se escala sin tocar el host.

### Objetivo

Comprender qué es desplegar cada microfrontend con su propio Deployment y su propio Service: cómo se
encuentran host y remote dentro del clúster, cómo debe ser para escalar uno sin tocar el otro, cómo se detecta
que un pod ha caído y cómo se perfecciona la entrada en producción.

### Punto de partida

- Carpeta del ejercicio: [`ejercicios/M07-02-kubernetes/`](../../ejercicios/M07-02-kubernetes/), con `saludo/`,
  `host/`, [`kind.yaml`](../../ejercicios/M07-02-kubernetes/kind.yaml) y los manifiestos de
  [`k8s/`](../../ejercicios/M07-02-kubernetes/k8s/). Es un procedimiento: no se modifica código.
- Terminal en la raíz del repositorio: `/workspaces/react-microfrontends-201`. Todos los comandos se lanzan
  desde ahí.
- Puerto: **8080**, desde la pestaña **Puertos** de VS Code (icono del globo, «Abrir en el navegador»).
- Estado: Docker en marcha y el puerto 8080 libre. Si tienes levantado el Compose de este módulo, páralo:

```bash
# Libera el puerto 8080 si lo ocupa el Compose del laboratorio de Docker
docker compose -f ejercicios/M07-01-imagenes-docker/compose.yaml down
```

### Qué está pasando

En producción, cada microfrontend tiene que poder tener **su número de copias y su versión**, sin depender de
los demás: el remote más usado escala, el host no. Kubernetes da esa separación con dos objetos por
microaplicación:

| Objeto | Qué hace | En este laboratorio |
|--------|----------|---------------------|
| **Deployment** | Mantiene N pods de una imagen; si uno muere, crea otro | `saludo` (2 réplicas de `saludo:1`) y `host` (1 de `host:1`) |
| **Service** `ClusterIP` | Nombre estable dentro del clúster que reparte entre los pods listos | `saludo`: el host lo llama `http://saludo` |
| **Service** `NodePort` | Abre un puerto en el nodo para entrar desde fuera | `host`, puerto 30080 |
| `extraPortMappings` de kind | Publica un puerto del nodo en la máquina | 30080 del nodo → 8080 del Codespace |

El host es la misma imagen que en Docker: su nginx reenvía `/mf/saludo/` a `${SALUDO_URL}`, y aquí
`SALUDO_URL=http://saludo` es el nombre del Service del remote. El navegador solo habla con el host, en el
8080, y el host pide el remote en su mismo origen.

> [!NOTE]
> En un clúster real la entrada no suele ser un `NodePort`, sino un **Ingress** o la **Gateway API**, con su
> dominio y su certificado TLS. Aquí se usa `NodePort` para no instalar un controlador de entrada; el principio
> es el mismo: un único punto de entrada para el navegador.

### 1 — Lee la configuración del clúster

kind crea un clúster de Kubernetes dentro de un contenedor Docker. Su `kind.yaml` define un nodo y publica su
puerto 30080 como el 8080 de tu máquina:

```yaml
# Clúster kind de un nodo. El puerto 30080 del nodo se publica como 8080 en la máquina.
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
name: microfrontends
nodes:
  - role: control-plane
    extraPortMappings:
      - containerPort: 30080
        hostPort: 8080
        listenAddress: "127.0.0.1"   # escucha solo en local (Codespaces lo reenvía desde la pestaña Puertos)
```

### 2 — Crea el clúster

El script del curso crea el clúster con ese fichero y arregla antes la red de Docker de Codespaces
([ficha](../comandos-lab.md#cluster-up)).

```bash
# Crea el clúster kind «microfrontends» si no existe y deja kubectl apuntando a él
bash scripts/cluster-up.sh ejercicios/M07-02-kubernetes/kind.yaml
```

**Resultado esperado** (recortado: sin las líneas de progreso `•`; el puerto de la última línea cambia):

```text
[kind-net-fix] recreando red kind vacía (IPv4)
[kind-net-fix] creando red docker kind solo IPv4
Creating cluster "microfrontends" ...
 ✓ Ensuring node image (kindest/node:v1.32.0) 🖼
 ✓ Preparing nodes 📦
 ✓ Writing configuration 📜
 ✓ Starting control-plane 🕹️
 ✓ Installing CNI 🔌
 ✓ Installing StorageClass 💾
Set kubectl context to "kind-microfrontends"
You can now use your cluster with:

kubectl cluster-info --context kind-microfrontends

Have a question, bug, or feature request? Let us know! https://kind.sigs.k8s.io/#community 🙂
[kind-net-fix] containerd usa proxy en microfrontends-control-plane
Kubernetes control plane is running at https://127.0.0.1:38959
```

La última línea confirma que `kubectl` habla con el clúster.
Si el clúster ya existía, el script dice `El clúster microfrontends ya existe.` y no lo toca.

<details>
<summary>Qué hace por dentro (<code>scripts/cluster-up.sh</code>)</summary>

```bash
NOMBRE="$(awk '/^name:/ {print $2}' "$CONFIG")"        # nombre del clúster, del kind.yaml
bash "$ROOT/scripts/kind-net-fix.sh" || true            # red de Docker en Codespaces
if kind get clusters 2>/dev/null | grep -qx "$NOMBRE"; then
  echo "El clúster $NOMBRE ya existe."
else
  # Sin variables de proxy: kubeadm las cogería al arrancar el nodo.
  env -u HTTP_PROXY -u HTTPS_PROXY -u http_proxy -u https_proxy \
    kind create cluster --config "$CONFIG"
fi
bash "$ROOT/scripts/kind-net-fix.sh" || true
kubectl cluster-info --context "kind-$NOMBRE" | head -1
```

</details>

### 3 — Construye las dos imágenes

Las imágenes son las mismas que en Docker: [build multietapa](../glosario/04-integracion-despliegue.md#imagen-multietapa), de Node a nginx. Se construyen desde la raíz del
repositorio porque necesitan su `package-lock.json`.

```bash
# Imagen del remote y del host; -q imprime solo el identificador de cada imagen
docker build -q -f ejercicios/M07-02-kubernetes/saludo/Dockerfile -t saludo:1 . && docker build -q -f ejercicios/M07-02-kubernetes/host/Dockerfile -t host:1 .
```

**Resultado esperado** (los identificadores cambian):

```text
sha256:2952c50de254fb07f60f1f02d6eddc0c6e44cad83f0fb9a10cdbf618ced69afd
sha256:43eca0976f14c71c9f3f1073d6eeef8698f4614088ba603bd957840a162ee826
```

### 4 — Carga las imágenes en el nodo

El clúster no ve las imágenes de tu Docker: su nodo tiene su propio almacén de imágenes y no hay un registro
del que descargarlas. `kind load` las copia dentro del nodo.

```bash
# Copia saludo:1 y host:1 al nodo del clúster microfrontends
kind load docker-image saludo:1 host:1 --name microfrontends
```

**Resultado esperado** (los identificadores cambian):

```text
Image: "saludo:1" with ID "sha256:2952c50de254fb07f60f1f02d6eddc0c6e44cad83f0fb9a10cdbf618ced69afd" not yet present on node "microfrontends-control-plane", loading...
Image: "host:1" with ID "sha256:43eca0976f14c71c9f3f1073d6eeef8698f4614088ba603bd957840a162ee826" not yet present on node "microfrontends-control-plane", loading...
```

Los manifiestos usan `imagePullPolicy: IfNotPresent`: Kubernetes usa la imagen del nodo y no intenta
descargarla. En producción, en lugar de este paso, la imagen se sube a un registro.

### 5 — Lee y aplica el manifiesto del remote

[`k8s/saludo.yaml`](../../ejercicios/M07-02-kubernetes/k8s/saludo.yaml) tiene dos objetos: el Deployment, con
2 réplicas y una sonda que da el pod por listo cuando sirve `remoteEntry.js`, y el Service que les da un
nombre.

```yaml
# Microaplicación saludo: su propio Deployment y su propio Service.
apiVersion: apps/v1
kind: Deployment
metadata:
  name: saludo
spec:
  replicas: 2                      # escala sola, sin tocar el host
  selector:
    matchLabels: { app: saludo }
  template:
    metadata:
      labels: { app: saludo }
    spec:
      containers:
        - name: saludo
          image: saludo:1
          imagePullPolicy: IfNotPresent
          ports:
            - containerPort: 80
          readinessProbe:
            httpGet: { path: /remoteEntry.js, port: 80 }
---
apiVersion: v1
kind: Service
metadata:
  name: saludo                     # el host lo encuentra por este nombre: http://saludo
spec:
  selector: { app: saludo }
  ports:
    - port: 80
      targetPort: 80
```

```bash
# Crea el Deployment y el Service del remote
kubectl apply -f ejercicios/M07-02-kubernetes/k8s/saludo.yaml
```

**Resultado esperado:**

```text
deployment.apps/saludo created
service/saludo created
```

### 6 — Lee y aplica el manifiesto del host

[`k8s/host.yaml`](../../ejercicios/M07-02-kubernetes/k8s/host.yaml) da al host la dirección del remote por
variable de entorno y lo expone con un `NodePort` en el 30080, el puerto que `kind.yaml` publica.

```yaml
# Host: su propio Deployment y un Service NodePort, la entrada desde fuera del clúster.
apiVersion: apps/v1
kind: Deployment
metadata:
  name: host
spec:
  replicas: 1
  selector:
    matchLabels: { app: host }
  template:
    metadata:
      labels: { app: host }
    spec:
      containers:
        - name: host
          image: host:1
          imagePullPolicy: IfNotPresent
          env:
            - name: SALUDO_URL
              value: http://saludo     # el Service del remote
          ports:
            - containerPort: 80
---
apiVersion: v1
kind: Service
metadata:
  name: host
spec:
  type: NodePort
  selector: { app: host }
  ports:
    - port: 80
      targetPort: 80
      nodePort: 30080                # kind.yaml lo publica como localhost:8080
```

```bash
# Crea el Deployment y el Service del host
kubectl apply -f ejercicios/M07-02-kubernetes/k8s/host.yaml
```

**Resultado esperado:**

```text
deployment.apps/host created
service/host created
```

### 7 — Espera a que los pods estén listos

```bash
# Espera a que cada Deployment tenga todas sus réplicas disponibles
kubectl rollout status deployment/saludo && kubectl rollout status deployment/host
```

**Resultado esperado:**

```text
Waiting for deployment spec update to be observed...
Waiting for deployment spec update to be observed...
Waiting for deployment "saludo" rollout to finish: 0 out of 2 new replicas have been updated...
Waiting for deployment "saludo" rollout to finish: 0 of 2 updated replicas are available...
Waiting for deployment "saludo" rollout to finish: 1 of 2 updated replicas are available...
deployment "saludo" successfully rolled out
deployment "host" successfully rolled out
```

Un pod de `saludo` cuenta como disponible cuando su `readinessProbe` obtiene respuesta de `/remoteEntry.js`.

### 8 — Mira lo que ha quedado desplegado

```bash
# Deployments, Services y pods del espacio de nombres por defecto
kubectl get deployments,services,pods
```

**Resultado esperado** (IP, sufijos de los pods y edades cambian):

```text
NAME                     READY   UP-TO-DATE   AVAILABLE   AGE
deployment.apps/host     1/1     1            1           14s
deployment.apps/saludo   2/2     2            2           15s

NAME                 TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)        AGE
service/host         NodePort    10.96.108.232   <none>        80:30080/TCP   14s
service/kubernetes   ClusterIP   10.96.0.1       <none>        443/TCP        21s
service/saludo       ClusterIP   10.96.15.46     <none>        80/TCP         15s

NAME                         READY   STATUS    RESTARTS   AGE
pod/host-7cc49c467f-sjltj    1/1     Running   0          13s
pod/saludo-8dcd66c8b-k6sxp   1/1     Running   0          13s
pod/saludo-8dcd66c8b-swr6b   1/1     Running   0          13s
```

| Línea | Qué dice |
|-------|----------|
| `deployment.apps/saludo 2/2` | Dos copias del remote listas |
| `service/host NodePort 80:30080/TCP` | La entrada desde fuera: el 30080 del nodo, que es tu 8080 |
| `service/saludo ClusterIP` | Solo accesible dentro del clúster, por el nombre `saludo` |
| `pod/saludo-8dcd66c8b-…` | `8dcd66c8b` identifica la plantilla del pod (la versión); el último sufijo, cada copia |

### 9 — Abre la página en el navegador

Abre el puerto **8080** desde la pestaña **Puertos**, con **F12** → pestaña **Red** (Network) abierta, y
recarga.

**Resultado esperado** en la pestaña **Red** y en la página (los hashes de los nombres cambian si cambia el
código):

```text
Red      200  /main.a56a8c68.js
Red      200  /729.4feb2364.js
Red      200  /mf/saludo/remoteEntry.js
Red      200  /97.c0b40862.js
Red      200  /mf/saludo/696.54e5f2ce.js
Red      200  /mf/saludo/442.9b987b2c.js
Red      200  /mf/saludo/706.d9e631ae.js
── Texto de la página:
Host

Hola desde el remote saludo, versión 1
```

La misma página que con Docker: todo sale del 8080 y lo que va por `/mf/saludo/` lo sirven los pods de
`saludo` a través de su Service. Pulsa `remoteEntry.js` en la pestaña **Red** y mira **Encabezados**
(Headers): `Cache-Control: no-cache`. Lo mismo desde la terminal:

```bash
# Desde la terminal: el host responde y reenvía /mf/saludo/ al Service del remote
curl -sI http://localhost:8080/mf/saludo/remoteEntry.js | grep -iE 'HTTP|cache-control'
```

**Resultado esperado:**

```text
HTTP/1.1 200 OK
Cache-Control: no-cache
```

> [!TIP]
> Si el navegador no conecta con el 8080 justo después de desplegar, es que has pedido la página antes de que
> el Service del host respondiera. Espera a que termine `rollout status` y vuelve a intentarlo:
>
> ```bash
> # Espera a que el host esté disponible y reintenta
> kubectl rollout status deployment/host
> curl -sI http://localhost:8080/ | head -1
> ```

### 10 — Escala el remote sin tocar el host

El remote recibe más tráfico: súbelo a 3 réplicas. Solo cambia su Deployment.

```bash
# Tres copias de saludo, espera a que estén listas y lista sus pods
kubectl scale deployment/saludo --replicas=3 && kubectl rollout status deployment/saludo && kubectl get pods -l app=saludo
```

**Resultado esperado** (sufijos y edades cambian):

```text
deployment.apps/saludo scaled
Waiting for deployment "saludo" rollout to finish: 2 of 3 updated replicas are available...
deployment "saludo" successfully rolled out
NAME                     READY   STATUS    RESTARTS   AGE
saludo-8dcd66c8b-k6sxp   1/1     Running   0          25s
saludo-8dcd66c8b-p72ss   1/1     Running   0          11s
saludo-8dcd66c8b-swr6b   1/1     Running   0          25s
```

El pod nuevo (`p72ss`) es más joven que los otros dos. El host no se ha reiniciado ni reconfigurado: sigue
llamando a `http://saludo`.

### 11 — Comprueba a quién reparte el Service

Detrás del nombre `saludo` hay ahora tres pods. Los **endpoints** del Service son sus direcciones:

```bash
# Direcciones de los pods listos detrás del Service saludo
kubectl get endpoints saludo
```

**Resultado esperado** (las IP cambian):

```text
NAME     ENDPOINTS                                   AGE
saludo   10.244.0.3:80,10.244.0.7:80,10.244.0.8:80   26s
```

Tres direcciones: el Service reparte las peticiones del host entre las tres copias. Solo entran los pods cuya
`readinessProbe` responde.

## Comprueba tu entendimiento

**Cada microfrontend, su Deployment**
Lanza `kubectl get deployments`.
→ Aparecen `host` y `saludo` por separado, cada uno con su número de réplicas.

**El remote no tiene entrada desde fuera**
Lanza `kubectl get services`.
→ `saludo` es `ClusterIP` (sin puerto en el nodo); solo `host` es `NodePort` con `80:30080/TCP`.

**El host encuentra al remote por nombre**
Lanza `kubectl get deployment host -o yaml` y busca `SALUDO_URL`.
→ `value: http://saludo`, el nombre del Service del remote, no una IP.

```bash
# Comandos de esta sección
kubectl get deployments
kubectl get services
kubectl get deployment host -o yaml
```

## Experimenta

Borra el pod del host. **Antes, predice**: ¿desaparece el host para siempre? ¿El pod que quede se llamará
igual?

```bash
# Borra el pod del host y lista los pods del host justo después
kubectl delete pod -l app=host && kubectl get pods -l app=host
```

**Resultado esperado** (sufijos cambian):

```text
pod "host-7cc49c467f-sjltj" deleted
NAME                    READY   STATUS    RESTARTS   AGE
host-7cc49c467f-qp4cz   1/1     Running   0          1s
```

El Deployment ha creado otro pod en un segundo: mismo prefijo `host-7cc49c467f` (misma plantilla, misma
versión), sufijo nuevo (`qp4cz`). Lo que garantiza el Deployment es el número de copias, no un pod concreto.
Las réplicas de `saludo` no se han enterado.

Devuelve el remote a sus 2 réplicas:

```bash
# Vuelve a 2 réplicas de saludo, como en el manifiesto
kubectl scale deployment/saludo --replicas=2
```

```text
deployment.apps/saludo scaled
```

## Reto

### 1 — Dejar el remote sin copias

**La situación:** un compañero propone bajar `saludo` a 0 réplicas para ahorrar recursos «porque el host
sigue funcionando». Quieres comprobar qué ve el navegador.

**Qué haces:** escala `saludo` a 0 y pide `remoteEntry.js` a través del host. Después recarga la página del
8080 con **F12** abierto en la pestaña **Consola** (Console).

**Pistas:** `kubectl scale … --replicas=0`; `curl -s -o /dev/null -w '%{http_code}\n'` imprime solo el código
de respuesta; `kubectl get endpoints saludo` dice qué pods hay detrás del Service; compara con lo que pasaba
al parar el contenedor `saludo` en Docker.

**Lo que buscas:** explicar, con la respuesta del host y la **Consola**, por qué la página deja de mostrar el
saludo aunque el pod del host esté `Running`.

<details>
<summary>Ver solución</summary>

```bash
# Ninguna copia del remote; espera 3 s y pide remoteEntry.js a través del host
kubectl scale deployment/saludo --replicas=0 && sleep 3 && curl -s -o /dev/null -w '%{http_code}\n' http://localhost:8080/mf/saludo/remoteEntry.js
```

```text
deployment.apps/saludo scaled
502
```

Al recargar la página, en la **Consola** y en la pestaña **Red**:

```text
Consola (error)  Failed to load resource: the server responded with a status of 502 (Bad Gateway)
Red      falló  http://localhost:8080/mf/saludo/remoteEntry.js
Consola (aviso)  Initialization of sharing external failed: ScriptExternalLoadError: Loading script failed.
(error: http://localhost:8080/mf/saludo/remoteEntry.js)
Consola (error)  Uncaught ScriptExternalLoadError: Loading script failed.
── Texto de la página:

```

El Service `saludo` se queda sin pods detrás (`kubectl get endpoints saludo` no muestra direcciones). El nginx
del host sigue vivo y reenvía `/mf/saludo/`, pero nadie responde y devuelve `502 Bad Gateway`. Module
Federation no consigue cargar `remoteEntry.js` (`ScriptExternalLoadError`) y, como el host importa el remote al
arrancar, la página se queda en blanco: ni siquiera sale «Host». **La regla:** el host `Running` no significa
que la página funcione; la disponibilidad de cada remote se vigila por separado (endpoints, sondas) y el host
debería aislar el fallo con un `ErrorBoundary`. Vuelve a dejarlo como estaba:

```bash
# Dos réplicas otra vez, y espera a que estén listas
kubectl scale deployment/saludo --replicas=2 && kubectl rollout status deployment/saludo
```

```text
deployment.apps/saludo scaled
Waiting for deployment "saludo" rollout to finish: 0 of 2 updated replicas are available...
Waiting for deployment "saludo" rollout to finish: 1 of 2 updated replicas are available...
deployment "saludo" successfully rolled out
```

</details>

## Errores frecuentes

| Síntoma | Causa probable | Cómo arreglarlo |
|---------|----------------|-----------------|
| Pods en `ErrImagePull` o `ImagePullBackOff` | La imagen no está en el nodo y Kubernetes intenta descargarla de Docker Hub | `kind load docker-image saludo:1 host:1 --name microfrontends` y `kubectl delete pod -l app=saludo` |
| `Bind for 127.0.0.1:8080 failed: port is already allocated` al crear el clúster | El Compose del laboratorio de Docker sigue en marcha | `docker compose -f ejercicios/M07-01-imagenes-docker/compose.yaml down` y vuelve a lanzar `cluster-up.sh` |
| `saludo` en `0/1 Running` mucho tiempo | La `readinessProbe` no obtiene `/remoteEntry.js` | `kubectl describe pod -l app=saludo` y mira los eventos `Readiness probe failed` |
| `The connection to the server … was refused` | `kubectl` apunta a otro contexto o el clúster no existe | `kind get clusters` y `kubectl config use-context kind-microfrontends` |
| El navegador no conecta con el 8080 justo después de desplegar | La petición sale antes de que el Service del host responda | Espera a `kubectl rollout status deployment/host` y reintenta |
| Desde el terminal responde y desde un contenedor no | Red de Docker para kind en Codespaces | `bash scripts/kind-net-fix.sh` |

```bash
# Comandos de diagnóstico de la tabla
kind load docker-image saludo:1 host:1 --name microfrontends
kubectl delete pod -l app=saludo
docker compose -f ejercicios/M07-01-imagenes-docker/compose.yaml down
kubectl describe pod -l app=saludo
kind get clusters
kubectl config use-context kind-microfrontends
kubectl rollout status deployment/host
bash scripts/kind-net-fix.sh
```

## Limpieza

Si vas a seguir con [03 — Actualizar un remote](03-lab-actualizar-un-remote.md), puedes dejar el clúster: ese
laboratorio lo reutiliza si existe. Si no, bórralo para liberar el 8080 ([ficha](../comandos-lab.md#cluster-up)):

```bash
# Borra el clúster y libera el puerto 8080
kind delete cluster --name microfrontends
```

## Conclusiones

### Qué es un Deployment y un Service por microfrontend

Cada microaplicación es un Deployment (cuántas copias de qué imagen) y un Service (un nombre estable que
reparte entre las copias listas). El host llega al remote por el nombre del Service; el navegador llega al host
por la única entrada del clúster.

```text
navegador ──► :8080 ─(kind)─► nodo :30080 ─► Service host (NodePort) ─► pod host
                                                                          │ /mf/saludo/
                                                                          ▼
                                             Service saludo (ClusterIP) ─► pod saludo ×2..3
```

### Cómo debe ser

| Requisito | En el lab |
|-----------|-----------|
| Un Deployment y un Service por microfrontend | `k8s/saludo.yaml` y `k8s/host.yaml` |
| El host encuentra al remote por nombre, no por IP | `SALUDO_URL=http://saludo` |
| Solo el host tiene entrada desde fuera | `host` NodePort 30080; `saludo` ClusterIP |
| Un pod solo recibe tráfico cuando está listo | `readinessProbe` sobre `/remoteEntry.js` |
| Escalar uno sin tocar el otro | `saludo` a 3 réplicas; el pod del host no cambia |

### Dónde se rompe y cómo lo has detectado

| Fallo | Cómo lo has visto | Qué provoca |
|-------|-------------------|-------------|
| Pod del host borrado | `kubectl delete pod -l app=host` | Nada duradero: el Deployment crea otro en un segundo |
| Remote sin réplicas | `kubectl scale … --replicas=0`: `502` y `ScriptExternalLoadError` en la **Consola** | El host responde, pero la página se queda en blanco |
| Imagen no cargada en el nodo | `ErrImagePull` en `kubectl get pods` | El microfrontend no arranca |

### Cómo se perfecciona

- Entrada con **Ingress** o **Gateway API**, con dominio y TLS, en lugar de `NodePort`.
- Imágenes en un registro, con etiquetas de versión, en lugar de `kind load`.
- Escalado automático por consumo (`HorizontalPodAutoscaler`) y límites de recursos por microfrontend.
- Un namespace por equipo o por producto para separar permisos y cuotas.

### En una frase

> 🔑 Con un Deployment y un Service por microfrontend, cada uno tiene su número de copias y el host solo
> conoce un nombre.
