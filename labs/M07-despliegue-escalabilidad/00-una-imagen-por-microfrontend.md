# Una imagen por microfrontend

[← Página anterior](README.md) · [Siguiente página →](01-lab-imagenes-docker.md)

Esta demostración empaqueta un [remote](../glosario/02-module-federation.md#remote) mínimo, `saludo`, en su propia imagen Docker y la arranca sola. El
remote expone un único componente que pinta «Hola desde el remote saludo, versión 1». Lo que se mira es qué
acaba dentro de la imagen (solo nginx y los estáticos del build) y cómo sirve nginx el `remoteEntry.js`
frente al resto de ficheros.

## Punto de partida

- Terminal en la raíz del repositorio: `/workspaces/react-microfrontends-201`.
- Ejemplo: [`ejercicios/M07-00-una-imagen-por-microfrontend/saludo/`](../../ejercicios/M07-00-una-imagen-por-microfrontend/saludo/),
  un remote de [Module Federation](../glosario/02-module-federation.md#module-federation) con su [`Dockerfile`](../../ejercicios/M07-00-una-imagen-por-microfrontend/saludo/Dockerfile)
  y su [`nginx.conf`](../../ejercicios/M07-00-una-imagen-por-microfrontend/saludo/nginx.conf).
- Estado: Docker disponible en el Codespace. No hace falta nada en marcha.

## Recorrido

### 1 — El remote que se va a empaquetar

El remote publica `./Saludo` en su `remoteEntry.js`. El texto incluye la versión para poder distinguir
después qué build está sirviendo cada contenedor:

```jsx
// saludo/src/Saludo.jsx — texto visible de la versión desplegada
export default function Saludo() {
  return <p>Hola desde el remote saludo, versión 1</p>;
}
```

Su `webpack.config.js` añade un hash del contenido al nombre de cada fichero, salvo a `remoteEntry.js`, que
mantiene siempre el mismo nombre porque es la dirección que conoce el [host](../glosario/02-module-federation.md#host):

```js
// saludo/webpack.config.js (extracto)
output: { publicPath: 'auto', clean: true, filename: '[name].[contenthash:8].js', chunkFilename: '[name].[contenthash:8].js' },
// ...
new ModuleFederationPlugin({
  name: 'saludo',
  filename: 'remoteEntry.js',                      // nombre fijo: la puerta de entrada del remote
  exposes: { './Saludo': './src/Saludo.jsx' },
  shared: { react: { singleton: true }, 'react-dom': { singleton: true } },
}),
```

El `src/index.js` solo hace `import('./bootstrap')`. Ese [arranque asíncrono](../glosario/02-module-federation.md#arranque-asincrono) da tiempo a Module Federation a
resolver los módulos compartidos (React) antes de pintar nada.

### 2 — El Dockerfile en dos etapas

La primera etapa compila con Node; la segunda parte de nginx y copia solo el resultado del build. Todo lo que
se usó para compilar (Node, `node_modules`, el código fuente) se queda en la primera etapa:

```dockerfile
# --- Etapa 1: compilar con Node ---
FROM node:22-alpine AS build
WORKDIR /repo
# Dependencias primero: esta capa se reutiliza mientras package-lock.json no cambie.
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY ejercicios/M07-00-una-imagen-por-microfrontend/saludo ./app
WORKDIR /repo/app
RUN npm run build

# --- Etapa 2: servir los estáticos con nginx ---
FROM nginx:1.29-alpine
COPY ejercicios/M07-00-una-imagen-por-microfrontend/saludo/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /repo/app/dist /usr/share/nginx/html
```

Las dependencias del curso están en el `package.json` y el `package-lock.json` de la **raíz** del
repositorio, no en la carpeta del ejercicio. Por eso la imagen se construye con la raíz como contexto (el `.`
del final) y el Dockerfile se indica con `-f`.

### 3 — Construir la imagen

```bash
# Desde la raíz del repositorio: contexto = raíz, Dockerfile = el del remote, etiqueta saludo:1
docker build -f ejercicios/M07-00-una-imagen-por-microfrontend/saludo/Dockerfile -t saludo:1 .
```

Salida (recortada a los pasos; los tiempos y los `sha256` cambian en cada ejecución):

```text
#7 [build 1/7] FROM docker.io/library/node:22-alpine@sha256:0e1754758c2df4cfa3e68d59e2e1b7374bb7fd9ea6328eaaacf15cc934af8202
#8 [stage-1 1/3] FROM docker.io/library/nginx:1.29-alpine@sha256:5616878291a2eed594aee8db4dade5878cf7edcb475e59193904b198d9b830de
#10 [build 2/7] WORKDIR /repo
#11 [build 3/7] COPY package.json package-lock.json ./
#12 [build 4/7] RUN npm ci --no-audit --no-fund
#13 [build 5/7] COPY ejercicios/M07-00-una-imagen-por-microfrontend/saludo ./app
#14 [build 6/7] WORKDIR /repo/app
#15 [build 7/7] RUN npm run build
#15 DONE 4.0s
#16 [stage-1 2/3] COPY ejercicios/M07-00-una-imagen-por-microfrontend/saludo/nginx.conf /etc/nginx/conf.d/default.conf
#17 [stage-1 3/3] COPY --from=build /repo/app/dist /usr/share/nginx/html
#18 naming to docker.io/library/saludo:1 done
```

Las líneas `[build …]` son la etapa de Node y las `[stage-1 …]`, la de nginx. La única conexión entre las dos
es el `COPY --from=build` del final.

### 4 — Qué ocupa y qué contiene

```bash
# Tamaño de la imagen final
docker images saludo:1 --format '{{.Repository}}:{{.Tag}} {{.Size}}'
```

```text
saludo:1 62.4MB
```

```bash
# Ficheros que sirve nginx dentro de la imagen
docker run --rm saludo:1 ls /usr/share/nginx/html
```

Salida (los hashes de los nombres cambian si cambia el código):

```text
325.6642c3ed.js
325.6642c3ed.js.LICENSE.txt
442.7d41c073.js
442.7d41c073.js.LICENSE.txt
50x.html
696.914f8c6c.js
696.914f8c6c.js.LICENSE.txt
706.e3dc2d3e.js
706.e3dc2d3e.js.LICENSE.txt
97.22de1b3a.js
97.22de1b3a.js.LICENSE.txt
972.c768148f.js
index.html
main.d764a727.js
remoteEntry.js
```

Unos 62 MB, casi todo nginx sobre Alpine. No hay `node_modules` ni código fuente: solo el `dist/` del build.
Todos los ficheros llevan hash en el nombre menos `index.html`, `50x.html` (la página de error de nginx) y
`remoteEntry.js`.

### 5 — La configuración de nginx

```nginx
server {
  listen 80;
  root /usr/share/nginx/html;

  # remoteEntry.js tiene siempre el mismo nombre: el navegador debe revalidarlo en cada carga.
  location = /remoteEntry.js {
    add_header Cache-Control "no-cache";
    add_header Access-Control-Allow-Origin "*";
  }

  # El resto lleva hash en el nombre: si cambia el contenido, cambia el nombre. Caché de un año.
  location / {
    add_header Cache-Control "public, max-age=31536000, immutable";
    add_header Access-Control-Allow-Origin "*";
    try_files $uri =404;
  }
}
```

Dos reglas de caché distintas para dos tipos de fichero. `Access-Control-Allow-Origin` permite que un host
servido desde otro origen pueda cargar el remote.

### 6 — Arrancar el contenedor y mirar las cabeceras

```bash
# Arranca el remote solo, en segundo plano, publicado en el puerto 8081
docker run -d --name saludo-demo -p 8081:80 saludo:1
```

```text
0f3d64f506f1c27c02eb4beb6b51db17644a8de875e19a027441da1efc1c9d1c
```

```bash
# Cabeceras de remoteEntry.js
curl -sI http://localhost:8081/remoteEntry.js | grep -iE 'HTTP|content-type|cache-control|access-control'
```

```text
HTTP/1.1 200 OK
Content-Type: application/javascript
Cache-Control: no-cache
Access-Control-Allow-Origin: *
```

```bash
# Cabeceras de un chunk con hash (el nombre sale del ls del paso 4)
curl -sI http://localhost:8081/325.6642c3ed.js | grep -iE 'HTTP|cache-control'
```

```text
HTTP/1.1 200 OK
Cache-Control: public, max-age=31536000, immutable
```

| Fichero | `Cache-Control` | Qué hace el navegador |
|---------|-----------------|-----------------------|
| `remoteEntry.js` | `no-cache` | Lo guarda, pero pregunta al servidor en cada carga si ha cambiado |
| `325.6642c3ed.js` | `public, max-age=31536000, immutable` | Lo reutiliza durante un año sin preguntar |

```bash
# Para y borra el contenedor de la demo
docker rm -f saludo-demo
```

```text
saludo-demo
```

## Qué queda visto

- La imagen de un [microfrontend](../glosario/01-arquitectura.md#microfrontend) se construye en dos etapas y la final solo lleva nginx y los estáticos.
- Se construye desde la raíz del repositorio porque las dependencias se instalan desde su `package-lock.json`.
- `remoteEntry.js` se revalida en cada carga; los chunks con hash se cachean un año, porque una versión nueva
  siempre trae nombres nuevos.

El laboratorio [01 — Imágenes Docker](01-lab-imagenes-docker.md) pone esta imagen junto a la de un host; se
puede hacer sin haber seguido esta demostración.

La imagen del remote no sabe nada de quién la consume. Pero el host sí necesita saber dónde está el remote, y
esa dirección cambia de un entorno a otro: **¿cómo se construye la imagen del host una sola vez y se le dice,
en cada entorno, dónde encontrar a `saludo`?**
