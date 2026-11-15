# Comandos del curso

Fichas de los comandos que se lanzan una y otra vez en los laboratorios. Cada bloque de código que
los usa enlaza aquí.

<a id="npm-start"></a>
## `npm start` (en la carpeta de un ejercicio)

**Qué hace:** arranca a la vez todas las aplicaciones del ejercicio (host, remotes, root-config), cada una
con su servidor de desarrollo de Webpack en su puerto. La salida de cada una sale con su prefijo:
`[host]`, `[remote]`, `[catalogo]`…

**Dónde se lanza:** en la carpeta que tiene el `package.json` con varias aplicaciones, p. ej.
`ejercicios/M03-01-host-y-remote/inicio`. Dentro de una sola aplicación (`…/inicio/host`), `npm start`
arranca solo esa.

**Qué necesita:** las dependencias de la raíz instaladas (`npm ci`, el Codespace lo hace al crearse) y
los puertos libres (3000–3003).

**Cuándo ha ido bien:** una línea `compiled successfully` por aplicación y una `Loopback:` con su puerto.

**Cómo se para:** `Ctrl+C` en esa terminal (para todas).

**Por dentro** (`package.json` del ejercicio):

```jsonc
{
  "private": true,
  "scripts": {
    // concurrently lanza cada aplicación con su propio npm start y etiqueta su salida
    "start": "concurrently -n remote,host \"npm start --prefix remote\" \"npm start --prefix host\""
  }
}
```

Y en cada aplicación, `"start": "webpack serve"`: lee su `webpack.config.js` y sirve en el puerto de
`devServer.port`.

> [!TIP]
> Si al arrancar sale `Error: listen EADDRINUSE: address already in use :::3000`, hay otro ejercicio en
> marcha. Páralo con `Ctrl+C` en su terminal o libera los puertos:
>
> ```bash
> # Mata lo que esté escuchando en los puertos de los ejercicios
> fuser -k 3000/tcp 3001/tcp 3002/tcp 3003/tcp
> ```

<a id="reiniciar"></a>
## `bash scripts/reiniciar.sh <laboratorio>`

**Qué hace:** deja la carpeta `inicio/` de un laboratorio como está en el repositorio: deshace tus
cambios y borra los ficheros nuevos que hayas creado allí. No toca nada fuera de esa carpeta.

**Parámetro:** el nombre de la carpeta del laboratorio, p. ej. `M03-01-host-y-remote`.

**Cuándo ha ido bien:** imprime `ejercicios/<laboratorio>/inicio vuelve a su estado inicial.`

**Por dentro** (`scripts/reiniciar.sh`):

```bash
LAB="${1:?Indica la carpeta del laboratorio, p. ej. M03-01-host-y-remote}"
cd "$(dirname "$0")/.."
git checkout -- "ejercicios/$LAB/inicio"     # deshace tus cambios en ficheros del repositorio
git clean -fd "ejercicios/$LAB/inicio"        # borra los ficheros nuevos que hayas creado
```

> [!WARNING]
> Si quieres conservar lo que has hecho, haz commit antes (ver «Guardar tu trabajo» en el
> [README](../README.md#guardar-tu-trabajo)).

<a id="cluster-up"></a>
## `bash scripts/cluster-up.sh <kind.yaml>`

**Qué hace:** crea el clúster de Kubernetes local (kind) descrito en el `kind.yaml` del laboratorio, si
no existe ya, y deja `kubectl` apuntando a él. Antes y después aplica el arreglo de red de Docker para
Codespaces (`scripts/kind-net-fix.sh`).

**Parámetro:** la ruta al `kind.yaml`, p. ej. `ejercicios/M07-02-kubernetes/kind.yaml`.

**Qué necesita:** Docker en marcha y el puerto 8080 libre (el clúster lo publica).

**Cuándo ha ido bien:** termina con `Kubernetes control plane is running at https://127.0.0.1:…`.

**Por dentro** (`scripts/cluster-up.sh`, extracto):

```bash
NOMBRE="$(awk '/^name:/ {print $2}' "$CONFIG")"        # nombre del clúster, del kind.yaml
bash "$ROOT/scripts/kind-net-fix.sh" || true            # red de Docker en Codespaces
if kind get clusters | grep -qx "$NOMBRE"; then
  echo "El clúster $NOMBRE ya existe."
else
  env -u HTTP_PROXY -u HTTPS_PROXY kind create cluster --config "$CONFIG"
fi
```

Para borrarlo al terminar:

```bash
# Borra el clúster y libera el puerto 8080
kind delete cluster --name microfrontends
```
