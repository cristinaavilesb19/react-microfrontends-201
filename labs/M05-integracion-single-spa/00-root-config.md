# El root-config de single-spa

[← Página anterior](README.md) · [Siguiente página →](01-lab-registrar-microaplicaciones.md)

Esta demostración muestra el corazón de [single-spa](../glosario/04-integracion-despliegue.md#single-spa) sin React ni [Module Federation](../glosario/02-module-federation.md#module-federation): un **[root-config](../glosario/04-integracion-despliegue.md#root-config)** que
registra dos aplicaciones mínimas, `saludo` y `despedida`, y una condición **`activeWhen`** para cada una.
Al navegar, single-spa decide cuál debe estar montada y llama a sus funciones `bootstrap`, `mount` y
`unmount`. Cada «aplicación» es un objeto de tres funciones que añade o quita un párrafo de la página.

## Punto de partida

- Carpeta: `ejercicios/M05-00-root-config` (una sola aplicación, sin [remotes](../glosario/02-module-federation.md#remote)).
- URL: puerto **3000**, desde la pestaña **Puertos** de VS Code (icono del globo, «Abrir en el navegador»).
  Fuera de Codespaces, `http://localhost:3000`.
- Herramientas del navegador: **F12** → pestaña **Consola** (Console), donde aparecen las trazas del [ciclo de vida](../glosario/04-integracion-despliegue.md#ciclo-de-vida).
- Estado: dependencias instaladas en la raíz del repositorio (el Codespace hace `npm ci` al crearse).

## Recorrido

### 1 — El código del root-config

Todo el ejercicio cabe en `src/index.js`. La función `aplicacion` fabrica el objeto que single-spa espera
de cualquier aplicación: tres funciones asíncronas. `registerApplication` da de alta cada una con su nombre,
su función de carga (`app`) y su `activeWhen`; `start()` pone a single-spa a escuchar la URL.

```js
import { getMountedApps, registerApplication, start } from 'single-spa';

// Una «aplicación» para single-spa es cualquier objeto con bootstrap, mount y unmount.
function aplicacion(nombre, texto) {
  let hueco;
  return {
    bootstrap: async () => console.log(`[${nombre}] bootstrap`),
    mount: async () => {
      hueco = document.createElement('p');
      hueco.textContent = texto;
      document.body.appendChild(hueco);
      console.log(`[${nombre}] mount`);
    },
    unmount: async () => {
      hueco.remove();
      console.log(`[${nombre}] unmount`);
    },
  };
}

// activeWhen: con qué URL está activa cada aplicación.
registerApplication({ name: 'saludo', app: async () => aplicacion('saludo', 'Hola desde la aplicación saludo'), activeWhen: '/saludo' });
registerApplication({ name: 'despedida', app: async () => aplicacion('despedida', 'Adiós desde la aplicación despedida'), activeWhen: '/despedida' });

window.addEventListener('single-spa:routing-event', () => console.log('montadas:', getMountedApps().join(', ') || '(ninguna)'));
start();
```

El [activeWhen](../glosario/04-integracion-despliegue.md#activewhen) de `saludo` (`'/saludo'`) es un **prefijo**: la aplicación también estaría activa en `/saludo/lo-que-sea`.
El último `addEventListener` escucha el evento que single-spa emite al terminar cada cambio de ruta y escribe
qué aplicaciones han quedado montadas.

La barra de enlaces está en `public/index.html` y no pertenece a ninguna aplicación: es del root-config.
Cada enlace llama a `singleSpaNavigate`, que cambia la URL sin recargar la página.

```html
<!-- Esta página no es de ninguna microaplicación: la gestiona el root-config. -->
<nav><a href="/" onclick="singleSpaNavigate(event)">Inicio</a> · <a href="/saludo" onclick="singleSpaNavigate(event)">Saludo</a> · <a href="/despedida" onclick="singleSpaNavigate(event)">Despedida</a></nav>
```

### 2 — Arranque

El servidor de desarrollo de Webpack sirve el root-config en el puerto 3000.

```bash
# Entra en la carpeta de la demostración y arranca su servidor (ficha: ../comandos-lab.md#npm-start)
cd /workspaces/react-microfrontends-201/ejercicios/M05-00-root-config
npm start
```

**Resultado:**

```text
webpack 5.112.2 compiled successfully
<i> [webpack-dev-server] Loopback: http://localhost:3000/, http://[::1]:3000/
```

Ficha del comando: [`npm start`](../comandos-lab.md#npm-start).

### 3 — Navegar y mirar la consola

Con la página abierta en `/` y la **Consola** a la vista, se pulsa **Saludo**, después **Despedida**,
después **Inicio** y otra vez **Saludo**. Las líneas `── Clic` marcan cada pulsación; `Red` es lo que
aparece en la pestaña **Red** (Network) y `Consola`, lo que sale en la **Consola**.

```text
Red      200  /main.js
Consola  montadas: (ninguna)
── Clic
Consola  [saludo] bootstrap
Consola  [saludo] mount
Consola  montadas: saludo
── Clic
Consola  [saludo] unmount
Consola  [despedida] bootstrap
Consola  [despedida] mount
Consola  montadas: despedida
── Clic
Consola  [despedida] unmount
Consola  montadas: (ninguna)
── Clic
Consola  [saludo] mount
Consola  montadas: saludo
── Texto de la página:
Inicio · Saludo · Despedida

Hola desde la aplicación saludo
```

| Momento | Qué hace single-spa | Por qué |
|---------|---------------------|---------|
| Abrir `/` | Nada: `montadas: (ninguna)` | Ningún `activeWhen` coincide con `/` |
| Primer clic en **Saludo** | `bootstrap` y `mount` de `saludo` | Es la primera vez que está activa: la carga y la prepara |
| Clic en **Despedida** | `unmount` de `saludo`, `bootstrap` y `mount` de `despedida` | Primero desmonta lo que sobra, después monta lo que falta |
| Clic en **Inicio** | `unmount` de `despedida` | Vuelve a no haber ninguna activa |
| Segundo clic en **Saludo** | Solo `mount` | `bootstrap` ocurre una vez por aplicación; ya estaba preparada |

Solo hay una petición, `/main.js`: las dos aplicaciones viven en el mismo bundle y su función `app` no
descarga nada. Cuando cada aplicación es un proyecto aparte, esa función es la que trae su código.

## Qué queda visto

- El root-config registra aplicaciones con `registerApplication` y arranca con `start()`.
- `activeWhen` decide, en cada cambio de ruta, qué aplicaciones deben estar montadas.
- Para single-spa una aplicación es un objeto con `bootstrap`, `mount` y `unmount`; `bootstrap` se llama una
  sola vez y `mount`/`unmount`, en cada navegación.
- La página que se ve es el `index.html` del root-config más lo que cada aplicación montada añade.

El laboratorio [01 — Registrar microaplicaciones](01-lab-registrar-microaplicaciones.md) lo lleva a
aplicaciones React reales, cada una con su servidor; se puede hacer sin haber seguido esta demostración.

Aquí cada aplicación escribía un párrafo a mano en `document.body`. Si las aplicaciones son proyectos React
que se publican por separado, ¿quién crea el árbol de React de cada una, dónde lo pinta y cómo se consigue
que una barra de navegación esté siempre visible mientras el contenido cambia con la ruta?
