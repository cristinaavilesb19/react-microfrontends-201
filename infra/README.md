# Entorno del curso

El curso se hace en **GitHub Codespaces**: no necesitas instalar nada en tu equipo.

## Qué trae el Codespace

| Herramienta | Versión | Para qué |
|-------------|---------|----------|
| Node.js | 22 | Webpack, servidores de desarrollo |
| Dependencias npm | `package.json` de la raíz | React 19, Webpack 5, React Router 7, Redux Toolkit, single-spa… instaladas una vez para todos los ejercicios |
| Docker | docker-in-docker | Imágenes de las microaplicaciones (M07) |
| kind y kubectl | 0.26 / 1.30 | Kubernetes local (M07) |

Configuración en [`.devcontainer/devcontainer.json`](../.devcontainer/devcontainer.json).

## Cómo está organizado el repositorio

| Ruta | Qué es |
|------|--------|
| `ejercicios/Mxx-NN-…/inicio/` | Punto de partida de un laboratorio: lo que abres y modificas |
| `ejercicios/Mxx-NN-…/solucion/` | El mismo laboratorio terminado |
| `ejercicios/Mxx-NN-…/` (sin inicio/solucion) | Ejemplo de una demostración |
| `labs/` | Las páginas del curso |
| `scripts/` | Ayudas: reiniciar un laboratorio, crear el clúster, red de Docker en Codespaces |

Cada laboratorio es independiente: no necesitas haber hecho el anterior.

## Puertos

| Puerto | Quién |
|--------|-------|
| 3000 | Host o root-config del ejercicio en marcha |
| 3001–3003 | Remotes del ejercicio en marcha |
| 8080 | Docker Compose o Kubernetes (M07) |

Se abren desde la pestaña **Puertos** de VS Code (icono del globo, «Abrir en el navegador»).

> [!NOTE]
> El navegador solo habla con el puerto 3000 (o 8080). Los remotes se piden en ese mismo origen, bajo
> `/mf/<nombre>/`, y el servidor del host los reenvía a su puerto. Así funciona igual en Codespaces, donde
> cada puerto es un dominio distinto, y en producción, donde todo cuelga de un único dominio.

## Solución de problemas

| Síntoma | Causa | Arreglo |
|---------|-------|---------|
| `EADDRINUSE` al hacer `npm start` | Otro ejercicio sigue en marcha | `Ctrl+C` en su terminal o `fuser -k 3000/tcp 3001/tcp 3002/tcp 3003/tcp` |
| `Cannot find module 'webpack'` | Dependencias sin instalar | `npm ci` en la raíz del repositorio |
| En Docker/kind: desde el terminal responde y desde un contenedor no | Red de Docker en Codespaces (iptables legacy y nft a la vez) | `bash scripts/red-docker-codespace.sh` y, con kind, `bash scripts/kind-net-fix.sh` |
| `Bind for 0.0.0.0:8080 failed: port is already allocated` | El clúster kind (o Compose) de otro laboratorio sigue usando el 8080 | `kind delete cluster --name microfrontends` o `docker compose down` en la carpeta del laboratorio |

```bash
# Instala las dependencias de todos los ejercicios (desde la raíz del repositorio)
npm ci
```

```bash
# Arreglo de red de Docker en Codespaces (lo hace el Codespace al arrancar; repetible)
bash scripts/red-docker-codespace.sh
bash scripts/kind-net-fix.sh
```
