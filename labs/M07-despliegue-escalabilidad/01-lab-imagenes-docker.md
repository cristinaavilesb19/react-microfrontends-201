# Lab — Imágenes Docker

[← Página anterior](00-una-imagen-por-microfrontend.md) · [Siguiente página →](02-lab-kubernetes.md)

En este laboratorio practicas **una imagen por [microaplicación](../glosario/01-arquitectura.md#microaplicacion), configurable al arrancar**. El ejercicio son
dos aplicaciones mínimas: un [remote](../glosario/02-module-federation.md#remote) `saludo`, que pinta «Hola desde el remote saludo, versión 1», y un `host`
que lo carga con [Module Federation](../glosario/02-module-federation.md#module-federation). Cada una tiene su Dockerfile y Docker Compose las levanta juntas. La
dirección del remote no está en la imagen del [host](../glosario/02-module-federation.md#host): se le pasa al arrancar.

### Objetivo

Comprender qué es una imagen por microaplicación configurable al arrancar: cómo se construye y se configura,
cómo debe ser para que el host no dependa del entorno, cómo se detecta que el remote ha caído y qué se mejora
en un entorno real.

### Punto de partida

- Carpeta del ejercicio: [`ejercicios/M07-01-imagenes-docker/`](../../ejercicios/M07-01-imagenes-docker/), con
  `saludo/`, `host/` y [`compose.yaml`](../../ejercicios/M07-01-imagenes-docker/compose.yaml). Es un
  procedimiento: no hay `inicio/` ni `solucion/`, no se modifica código.
- Terminal en la raíz del repositorio: `/workspaces/react-microfrontends-201`.
- Puerto: **8080**, el único que se publica. Se abre desde la pestaña **Puertos** de VS Code (icono del globo,
  «Abrir en el navegador»). Fuera de Codespaces, `http://localhost:8080`.
- Estado: nada en marcha en el puerto 8080. Si tienes el clúster de Kubernetes del curso o otro Compose de este
  módulo, páralos:

```bash
# Libera el puerto 8080 si lo ocupa el clúster kind del curso
kind delete cluster --name microfrontends
```

### Qué está pasando

En un proyecto real cada [microfrontend](../glosario/01-arquitectura.md#microfrontend) lo publica su equipo, a su ritmo. Para eso cada uno tiene que ser un
**artefacto desplegable por sí solo**: una imagen con su build y su servidor. Y el host, que se construye una
vez, tiene que funcionar en desarrollo, en preproducción y en producción, donde el remote vive en sitios
distintos. Si la dirección del remote se compilara en el host, habría que reconstruirlo para cada entorno.

| Pieza | Qué es | En este laboratorio |
|-------|--------|---------------------|
| Imagen del remote | nginx + `dist/` del remote | `saludo:1`, sin puerto publicado |
| Imagen del host | nginx + `dist/` del host + plantilla de nginx | `host:1`, publicado en 8080 |
| Dirección del remote | Variable de entorno al arrancar | `SALUDO_URL=http://saludo` en `compose.yaml` |
| Red entre contenedores | Cada servicio se encuentra por su nombre | `saludo` resuelve al contenedor del remote |

> [!NOTE]
> El navegador solo habla con el host. El host pide el remote en su mismo origen, bajo `/mf/saludo/`, y nginx
> reenvía esa ruta al contenedor `saludo`. Así funciona igual en Codespaces, donde cada puerto es un dominio
> distinto, y en producción, donde todo cuelga de un único dominio. En desarrollo hace lo mismo el
> `devServer.proxy` de Webpack.

Las dos aplicaciones arrancan con `index.js` → `import('./bootstrap')`: ese [arranque asíncrono](../glosario/02-module-federation.md#arranque-asincrono) da tiempo a
Module Federation a cargar `remoteEntry.js` y resolver React compartido antes de pintar.

### 1 — Lee cómo el host encuentra al remote

Antes de construir nada, mira las dos piezas que unen host y remote: en el `webpack.config.js` del host, la
dirección del remote es una ruta relativa al propio host; en la plantilla de nginx, esa ruta se reenvía a una
variable.

```js
// host/webpack.config.js (extracto): el remote se pide en el mismo origen del host
new ModuleFederationPlugin({
  name: 'host',
  remotes: { saludo: 'saludo@/mf/saludo/remoteEntry.js' },
  shared: { react: { singleton: true }, 'react-dom': { singleton: true } },
}),
```

```nginx
# host/nginx.conf.template
# Plantilla: la imagen oficial de nginx sustituye ${SALUDO_URL} al arrancar el contenedor.
server {
  listen 80;
  root /usr/share/nginx/html;

  # El remote se publica en el mismo origen que el host: /mf/saludo/ se reenvía a su servidor.
  location /mf/saludo/ {
    proxy_pass ${SALUDO_URL}/;
  }

  # Rutas de la SPA: cualquier otra URL devuelve index.html.
  location / {
    add_header Cache-Control "no-cache";
    try_files $uri /index.html;
  }
}
```

El Dockerfile del host copia este fichero a `/etc/nginx/templates/default.conf.template`. La imagen oficial
de nginx, al arrancar, pasa cada plantilla de esa carpeta por `envsubst` y escribe el resultado en
`/etc/nginx/conf.d/`. Con eso, `host:1` no contiene ninguna dirección del remote.

### 2 — Lee el compose.yaml

El `compose.yaml` declara un servicio por microaplicación. Los dos se construyen con la raíz del repositorio
como contexto (`../..`), porque las dependencias se instalan desde su `package-lock.json`.

```yaml
# Dos microaplicaciones, dos imágenes, dos contenedores.
name: m07-microfrontends

services:
  saludo:
    build:
      context: ../..                                      # raíz del repositorio
      dockerfile: ejercicios/M07-01-imagenes-docker/saludo/Dockerfile
    image: saludo:1

  host:
    build:
      context: ../..
      dockerfile: ejercicios/M07-01-imagenes-docker/host/Dockerfile
    image: host:1
    environment:
      SALUDO_URL: http://saludo                           # dónde está el remote (nombre del servicio)
    ports:
      - "8080:80"                                         # único punto de entrada para el navegador
    depends_on:
      - saludo
```

Fíjate en que `saludo` no tiene `ports`: desde fuera solo se llega al host.

### 3 — Construye y levanta las dos imágenes

```bash
# Entra en la carpeta del ejercicio (donde está compose.yaml)
cd /workspaces/react-microfrontends-201/ejercicios/M07-01-imagenes-docker
# Construye saludo:1 y host:1 y arranca un contenedor de cada uno en segundo plano
docker compose up -d --build
```

**Resultado esperado** (sin las líneas de progreso del build):

```text
 saludo:1  Built
 host:1  Built
 Network m07-microfrontends_default  Creating
 Network m07-microfrontends_default  Created
 Container m07-microfrontends-saludo-1  Creating
 Container m07-microfrontends-saludo-1  Created
 Container m07-microfrontends-host-1  Creating
 Container m07-microfrontends-host-1  Created
 Container m07-microfrontends-saludo-1  Starting
 Container m07-microfrontends-saludo-1  Started
 Container m07-microfrontends-host-1  Starting
 Container m07-microfrontends-host-1  Started
```

Dos imágenes, una red propia del proyecto y dos contenedores. `saludo` arranca antes por el `depends_on`.

### 4 — Comprueba qué puertos se publican

```bash
# Contenedores del proyecto y sus puertos
docker compose ps
```

**Resultado esperado** (los tiempos cambian):

```text
NAME                          IMAGE      COMMAND                  SERVICE   CREATED         STATUS         PORTS
m07-microfrontends-host-1     host:1     "/docker-entrypoint.…"   host      2 seconds ago   Up 2 seconds   0.0.0.0:8080->80/tcp, [::]:8080->80/tcp
m07-microfrontends-saludo-1   saludo:1   "/docker-entrypoint.…"   saludo    2 seconds ago   Up 2 seconds   80/tcp
```

El host publica `8080->80`; el remote solo expone `80/tcp` dentro de la red de Compose. El único punto de
entrada es el 8080.

### 5 — Abre la página en el navegador

Abre el puerto **8080** desde la pestaña **Puertos** y, con **F12**, ve a la pestaña **Red** (Network) antes
de recargar.

**Resultado esperado** en la pestaña **Red** y en la página (los hashes de los nombres cambian si cambia el
código):

```text
Red      200  /main.3f5abe02.js
Red      200  /729.640ea0cd.js
Red      200  /mf/saludo/remoteEntry.js
Red      200  /97.3ee20d0e.js
Red      200  /mf/saludo/696.c867bd17.js
Red      200  /mf/saludo/442.734fce4d.js
Red      200  /mf/saludo/706.f5d6fbcf.js
── Texto de la página:
Host

Hola desde el remote saludo, versión 1
```

Todo sale del mismo origen. Lo que va por `/mf/saludo/` lo sirve en realidad el contenedor `saludo`: primero
su `remoteEntry.js` y después los chunks que ese fichero indica.

### 6 — Mira las cabeceras de remoteEntry.js

En la pestaña **Red**, pulsa sobre `remoteEntry.js` y mira **Encabezados** (Headers) → encabezados de
respuesta: ahí está `Cache-Control`. Lo mismo desde la terminal:

```bash
# Cabeceras de remoteEntry.js pedido a través del host
curl -sI http://localhost:8080/mf/saludo/remoteEntry.js | grep -iE 'HTTP|cache-control'
```

**Resultado esperado:**

```text
HTTP/1.1 200 OK
Cache-Control: no-cache
```

La cabecera la pone el nginx de `saludo` y atraviesa el proxy del host sin cambios: el remote decide su propia
política de caché.

### 7 — Comprueba la sustitución al arrancar

Los registros del host muestran qué hizo la imagen de nginx antes de arrancar.

```bash
# Primeras líneas del registro del contenedor host
docker compose logs host | head -12
```

**Resultado esperado** (fecha y hora cambian):

```text
host-1  | /docker-entrypoint.sh: /docker-entrypoint.d/ is not empty, will attempt to perform configuration
host-1  | /docker-entrypoint.sh: Looking for shell scripts in /docker-entrypoint.d/
host-1  | /docker-entrypoint.sh: Launching /docker-entrypoint.d/10-listen-on-ipv6-by-default.sh
host-1  | 10-listen-on-ipv6-by-default.sh: info: Getting the checksum of /etc/nginx/conf.d/default.conf
host-1  | 10-listen-on-ipv6-by-default.sh: info: Enabled listen on IPv6 in /etc/nginx/conf.d/default.conf
host-1  | /docker-entrypoint.sh: Sourcing /docker-entrypoint.d/15-local-resolvers.envsh
host-1  | /docker-entrypoint.sh: Launching /docker-entrypoint.d/20-envsubst-on-templates.sh
host-1  | 20-envsubst-on-templates.sh: Running envsubst on /etc/nginx/templates/default.conf.template to /etc/nginx/conf.d/default.conf
host-1  | /docker-entrypoint.sh: Launching /docker-entrypoint.d/30-tune-worker-processes.sh
host-1  | /docker-entrypoint.sh: Configuration complete; ready for start up
host-1  | 2026/11/11 11:33:51 [notice] 1#1: using the "epoll" event method
host-1  | 2026/11/11 11:33:51 [notice] 1#1: nginx/1.29.8
```

La línea `Running envsubst on /etc/nginx/templates/default.conf.template to /etc/nginx/conf.d/default.conf`
es la sustitución de `${SALUDO_URL}`. Ahora mira el fichero que ha quedado:

```bash
# Configuración de nginx ya generada dentro del contenedor host
docker compose exec host cat /etc/nginx/conf.d/default.conf
```

**Resultado esperado:**

```text
# Plantilla: la imagen oficial de nginx sustituye http://saludo al arrancar el contenedor.
server {
  listen 80;
  root /usr/share/nginx/html;

  # El remote se publica en el mismo origen que el host: /mf/saludo/ se reenvía a su servidor.
  location /mf/saludo/ {
    proxy_pass http://saludo/;
  }

  # Rutas de la SPA: cualquier otra URL devuelve index.html.
  location / {
    add_header Cache-Control "no-cache";
    try_files $uri /index.html;
  }
}
```

`proxy_pass http://saludo/;`: el valor de `SALUDO_URL` del `compose.yaml`. `envsubst` sustituye la variable
en todo el fichero, también en el comentario de la primera línea.

## Comprueba tu entendimiento

**El remote no está publicado**
Abre la lista de puertos con `docker compose ps`.
→ Solo `m07-microfrontends-host-1` tiene `0.0.0.0:8080->80/tcp`; `saludo` muestra `80/tcp`.

**La dirección del remote viene de fuera**
Busca `saludo` en `host/nginx.conf.template` y en `docker compose exec host cat /etc/nginx/conf.d/default.conf`.
→ En la plantilla aparece `${SALUDO_URL}`; en el contenedor, `http://saludo`.

**Cada fichero, su caché**
En la pestaña **Red**, compara `Cache-Control` de `remoteEntry.js` y de un chunk de `/mf/saludo/`.
→ `no-cache` en el primero; `public, max-age=31536000, immutable` en el segundo.

## Investiga

¿Qué chunks pide el host porque se lo dice `remoteEntry.js`? Abre en el navegador la URL del puerto 8080
seguida de `/mf/saludo/remoteEntry.js`. Es el fichero en crudo: JavaScript minificado. Los nombres de los
chunks no aparecen enteros: Webpack guarda un **mapa** de identificador de chunk → hash y compone el nombre
al pedirlo. Busca con `Ctrl+F` `696:"` y verás el hash del chunk 696. El host no conoce esos nombres; los
descubre leyendo este fichero en cada carga.

Con este comando de ayuda sacas el mapa completo:

```bash
# Mapa id de chunk → hash que guarda remoteEntry.js
curl -s http://localhost:8080/mf/saludo/remoteEntry.js | grep -oE '\{[0-9]+:"[0-9a-f]{8}"[^}]*\}'
```

**Resultado esperado** (los hashes cambian si cambia el código):

```text
{442:"734fce4d",696:"c867bd17",706:"f5d6fbcf"}
```

Cada pareja `id:"hash"` es el fichero `<id>.<hash>.js`: `696:"c867bd17"` es `/mf/saludo/696.c867bd17.js`,
el que viste en la pestaña **Red**.

Compara esos nombres con lo que hay dentro de la imagen del remote:

```bash
# Ficheros que sirve el nginx del contenedor saludo
docker compose exec saludo ls /usr/share/nginx/html
```

**Resultado esperado** (los hashes cambian si cambia el código):

```text
325.7f340d5d.js
325.7f340d5d.js.LICENSE.txt
442.734fce4d.js
442.734fce4d.js.LICENSE.txt
50x.html
696.c867bd17.js
696.c867bd17.js.LICENSE.txt
706.f5d6fbcf.js
706.f5d6fbcf.js.LICENSE.txt
97.9cb1b1a7.js
97.9cb1b1a7.js.LICENSE.txt
972.d3d4b03d.js
index.html
main.0a14328c.js
remoteEntry.js
```

Los tres chunks del mapa (`442`, `696`, `706`) están en la imagen con el mismo hash. El resto (`main…`, `325`,
`97`, `972`) los usa el remote cuando se abre solo, con su propio `index.html`: el host no los pide.

## Experimenta

Para el remote y deja el host en marcha. **Antes de recargar, predice**: ¿mostrará el host su título «Host»
sin el saludo, o nada? ¿Qué devolverá `/mf/saludo/remoteEntry.js`?

```bash
# Para solo el contenedor del remote
docker compose stop saludo
```

```text
 Container m07-microfrontends-saludo-1  Stopping
 Container m07-microfrontends-saludo-1  Stopped
```

Recarga la página del puerto 8080 con **F12** abierto y espera unos segundos: el nginx del host tarda en
rendirse con el remote parado.

**Resultado esperado** (los hashes de los nombres cambian si cambia el código):

```text
Red      200  /main.3f5abe02.js
Red      200  /729.640ea0cd.js
Red      200  /97.3ee20d0e.js
Consola (error)  Failed to load resource: the server responded with a status of 502 (Bad Gateway)
Red      falló  http://localhost:8080/mf/saludo/remoteEntry.js
Consola (aviso)  Initialization of sharing external failed: ScriptExternalLoadError: Loading script failed.
(error: http://localhost:8080/mf/saludo/remoteEntry.js)
Red      200  /325.8c474b78.js
Red      200  /696.e9c22650.js
Consola (error)  Uncaught ScriptExternalLoadError: Loading script failed.
── Texto de la página:

```

```bash
# Qué responde el host cuando pide el remote
curl -sI http://localhost:8080/mf/saludo/remoteEntry.js | head -1
```

```text
HTTP/1.1 502 Bad Gateway
```

La página queda en blanco: ni siquiera sale «Host». `App.jsx` importa `saludo/Saludo` de forma estática y el
arranque falla al no llegar `remoteEntry.js`. El `502 Bad Gateway` lo genera el nginx del host: él está
vivo, pero el servidor al que reenvía no responde. Vuelve a arrancarlo:

```bash
# Arranca otra vez el remote
docker compose start saludo
```

```text
 Container m07-microfrontends-saludo-1  Starting
 Container m07-microfrontends-saludo-1  Started
```

Recarga: vuelve «Hola desde el remote saludo, versión 1» sin haber tocado el host.

## Reto

### 1 — Cambiar dónde vive el remote sin reconstruir el host

**La situación:** en otro entorno, el remote no se llama `saludo`, sino `saludo-v1`. Un compañero propone
cambiar el `webpack.config.js` del host y reconstruir `host:1` para ese entorno.

**Qué haces:** en `compose.yaml`, renombra el servicio `saludo` a `saludo-v1` (y su entrada en
`depends_on`) y cambia `SALUDO_URL` para que apunte al nuevo nombre. Después aplica el cambio **sin**
`--build`:

```bash
# Recrea los contenedores con la configuración nueva, sin reconstruir imágenes
docker compose up -d --remove-orphans
```

**Pistas:** el nombre del servicio es también su nombre en la red de Compose; `--remove-orphans` borra el
contenedor del servicio que ya no existe.

**Lo que buscas:** la página del 8080 sigue mostrando el saludo, `docker compose exec host cat
/etc/nginx/conf.d/default.conf` muestra el nombre nuevo en `proxy_pass` y ninguna imagen se ha reconstruido.

<details>
<summary>Ver solución</summary>

```yaml
services:
  saludo-v1:                                  # nuevo nombre del servicio
    build:
      context: ../..
      dockerfile: ejercicios/M07-01-imagenes-docker/saludo/Dockerfile
    image: saludo:1

  host:
    build:
      context: ../..
      dockerfile: ejercicios/M07-01-imagenes-docker/host/Dockerfile
    image: host:1
    environment:
      SALUDO_URL: http://saludo-v1            # la misma imagen del host, otra dirección
    ports:
      - "8080:80"
    depends_on:
      - saludo-v1
```

```bash
# Comprueba la configuración generada al arrancar
docker compose exec host cat /etc/nginx/conf.d/default.conf
```

En `location /mf/saludo/` queda `proxy_pass http://saludo-v1/;`. La imagen `host:1` es la misma: solo ha
cambiado la variable con la que arranca. Es lo que se hace entre entornos reales: una imagen, una
configuración por entorno. **La regla:** lo que cambia entre entornos se inyecta al arrancar, no se compila.
Deja el `compose.yaml` como estaba al terminar:

```bash
# Devuelve compose.yaml a su estado del repositorio y recrea los contenedores
git checkout -- ejercicios/M07-01-imagenes-docker/compose.yaml
docker compose up -d --remove-orphans
```

</details>

## Limpieza

Al terminar, para y borra los contenedores y la red del ejercicio:

```bash
# Para y borra los contenedores y la red del proyecto m07-microfrontends
docker compose down
```

```text
 Container m07-microfrontends-host-1  Stopping
 Container m07-microfrontends-host-1  Stopped
 Container m07-microfrontends-host-1  Removing
 Container m07-microfrontends-host-1  Removed
 Container m07-microfrontends-saludo-1  Stopping
 Container m07-microfrontends-saludo-1  Stopped
 Container m07-microfrontends-saludo-1  Removing
 Container m07-microfrontends-saludo-1  Removed
 Network m07-microfrontends_default  Removing
 Network m07-microfrontends_default  Removed
```

## Errores frecuentes

| Síntoma | Causa probable | Cómo arreglarlo |
|---------|----------------|-----------------|
| `COPY package-lock.json` falla: `not found` | Build lanzado con la carpeta del ejercicio como contexto | Usa `docker compose up -d --build` desde la carpeta del ejercicio (su contexto es `../..`) o `docker build -f … .` desde la raíz |
| `Bind for 0.0.0.0:8080 failed: port is already allocated` | El clúster kind del curso u otro Compose usa el 8080 | `kind delete cluster --name microfrontends` o `docker compose down` en la otra carpeta |
| La página se queda en blanco y `/mf/saludo/remoteEntry.js` da `502 Bad Gateway` | El contenedor `saludo` está parado o con otro nombre | `docker compose ps` para verlo y `docker compose start saludo` |
| `no configuration file provided: not found` | `docker compose` lanzado fuera de la carpeta del ejercicio | `cd /workspaces/react-microfrontends-201/ejercicios/M07-01-imagenes-docker` |

## Conclusiones

### Qué es una imagen por microaplicación, configurable al arrancar

Cada microfrontend es una imagen independiente con nginx y su build. El host no lleva dentro la dirección del
remote: la recibe en una variable al arrancar y la usa para reenviar `/mf/saludo/`.

```text
navegador ──► :8080 host:1 (nginx)
                ├── /            → estáticos del host
                └── /mf/saludo/  → proxy_pass ${SALUDO_URL}/ = http://saludo/ ──► saludo:1
```

### Cómo debe ser

| Requisito | En el lab |
|-----------|-----------|
| Una imagen por microaplicación | `saludo:1` y `host:1`, cada una con su Dockerfile |
| Sin direcciones de entorno dentro de la imagen | `${SALUDO_URL}` en la plantilla; `http://saludo` en `compose.yaml` |
| Un único punto de entrada | Solo el host publica el 8080 |
| Cada remote decide su caché | `Cache-Control: no-cache` del `remoteEntry.js` llega intacto a través del host |

### Dónde se rompe y cómo lo has detectado

| Fallo | Cómo lo has visto | Qué provoca |
|-------|-------------------|-------------|
| Remote parado | `docker compose stop saludo` y recarga | Página en blanco; `502 Bad Gateway` en `/mf/saludo/remoteEntry.js` |
| Contexto de build equivocado | Error de `COPY package-lock.json` | La imagen no se construye |

### Cómo se perfecciona

- Un `ErrorBoundary` y un `import()` diferido del remote en el host, para que la página pinte aunque el remote
  falle (el host de este lab lo importa de forma estática y se queda en blanco).
- Imágenes publicadas en un registro con etiquetas de versión, construidas por un pipeline de CI por
  microaplicación.
- Comprobaciones de salud (`healthcheck`) para que el orquestador sepa cuándo el remote está listo.

### En una frase

> 🔑 La imagen del host se construye una vez y en cada entorno se le dice al arrancar dónde está el remote.
