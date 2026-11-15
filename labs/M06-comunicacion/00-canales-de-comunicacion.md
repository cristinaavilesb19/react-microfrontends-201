# Canales de comunicación

[← Página anterior](README.md) · [Siguiente página →](01-lab-props-entre-microaplicaciones.md)

Esta demostración enseña los tres canales con los que una [microaplicación](../glosario/01-arquitectura.md#microaplicacion) recibe datos de otra, todos a la vez
y en un ejemplo mínimo: un [host](../glosario/02-module-federation.md#host) y un [remote](../glosario/02-module-federation.md#remote), `ficha`, que pinta tres líneas. Cada línea le llega por un canal
distinto: un nombre **por props**, un color **por [contexto compartido](../glosario/03-estado-comunicacion.md#contexto-compartido)** y un aviso **por evento** del navegador.

## Punto de partida

- Carpeta: [`ejercicios/M06-00-canales-de-comunicacion`](../../ejercicios/M06-00-canales-de-comunicacion/)
- Aplicaciones: `host` (puerto 3000) y `ficha`, el remote (puerto 3001), más el paquete local
  `paquetes/contexto-color`, que ambas importan con el nombre `contexto-color`.
- Estado: dependencias instaladas en la raíz del repositorio (el Codespace lo hace al crearse). No hace falta
  nada de otras páginas.

```bash
# Entra en la carpeta de la demostración y arranca host y remote a la vez
cd /workspaces/react-microfrontends-201/ejercicios/M06-00-canales-de-comunicacion
npm start
```

Ficha del comando: [`npm start`](../comandos-lab.md#npm-start).

Salida (el orden de las líneas puede variar entre ejecuciones):

```text
> concurrently -n ficha,host "npm start --prefix ficha" "npm start --prefix host"
[host] webpack 5.112.2 compiled successfully
[ficha] webpack 5.112.2 compiled successfully
[host] <i> [webpack-dev-server] Loopback: http://localhost:3000/, http://[::1]:3000/
[ficha] <i> [webpack-dev-server] Loopback: http://localhost:3001/, http://[::1]:3001/
```

El host se abre desde la pestaña **Puertos** de VS Code: puerto **3000**, icono del globo («Abrir en el
navegador»). Fuera de Codespaces, `http://localhost:3000`.

> [!NOTE]
> El navegador solo habla con el host. El remote se pide en el mismo origen, bajo `/mf/ficha/`, y el servidor de
> desarrollo del host lo reenvía al puerto 3001 (`devServer.proxy` en `host/webpack.config.js`). Así funciona
> igual en Codespaces, donde cada puerto es otro dominio, que en producción, con un único dominio.

## Recorrido

### 1 — Quién manda cada dato

El host, en `host/src/App.jsx`, envuelve la ficha en un `Provider` de contexto, le pasa un nombre por props y
tiene un botón que lanza un evento en `window`:

```jsx
import { ColorContext } from 'contexto-color';
import Ficha from 'ficha/Ficha';

export default function App() {
  // 3. Evento global: cualquiera que escuche 'demo:aviso' en window lo recibe
  const avisar = () => window.dispatchEvent(new CustomEvent('demo:aviso', { detail: 'stock bajo' }));
  return (
    // 2. Contexto: todo lo que quede debajo lee 'teal'
    <ColorContext.Provider value="teal">
      <h1>Host</h1>
      <button onClick={avisar}>Publicar evento</button>
      <Ficha nombre="Ana" />{/* 1. props */}
    </ColorContext.Provider>
  );
}
```

La ficha, en `ficha/src/Ficha.jsx`, recoge cada dato por su canal:

```jsx
import { useEffect, useState } from 'react';
import { useColor } from 'contexto-color';

export default function Ficha({ nombre }) {          // 1. props: llegan como argumento
  const color = useColor();                         // 2. contexto compartido
  const [aviso, setAviso] = useState('(ninguno)');
  useEffect(() => {                                  // 3. evento global
    const oir = (e) => setAviso(e.detail);
    window.addEventListener('demo:aviso', oir);
    return () => window.removeEventListener('demo:aviso', oir);   // baja al desmontar
  }, []);
  return (
    <section style={{ border: `3px solid ${color}`, padding: 8 }}>
      <p>Por props: {nombre}</p>
      <p>Por contexto: {color}</p>
      <p>Por evento: {aviso}</p>
    </section>
  );
}
```

El contexto vive en un paquete aparte, `paquetes/contexto-color/index.js`, para que host y remote importen el
mismo objeto:

```js
import { createContext, useContext } from 'react';

// Contexto en un paquete compartido: host y remote importan el MISMO objeto.
export const ColorContext = createContext('gris');      // 'gris' = valor si no hay Provider
export const useColor = () => useContext(ColorContext);
```

Los dos `webpack.config.js` lo declaran en `shared` como [singleton](../glosario/02-module-federation.md#singleton), junto a React:

```js
shared: {
  react: { singleton: true },
  'react-dom': { singleton: true },
  // Una sola copia del paquete en la página: el Provider del host y el useContext del remote son el mismo contexto
  'contexto-color': { singleton: true, version: '1.0.0', requiredVersion: '1.0.0' },
},
```

Cada aplicación arranca con `src/index.js`, que solo contiene `import('./bootstrap')`. Ese [arranque asíncrono](../glosario/02-module-federation.md#arranque-asincrono)
da tiempo a [Module Federation](../glosario/02-module-federation.md#module-federation) a descargar el `remoteEntry.js` y a decidir qué copia de React y de
`contexto-color` se usa antes de ejecutar el código de la aplicación.

### 2 — La página del host

Con las herramientas del navegador abiertas (**F12**, pestaña **Red** / Network), al abrir el puerto 3000 y
pulsar **Publicar evento** se cargan estos ficheros y la página queda así (algunos nombres de fichero llevan
un fragmento que puede cambiar):

```text
Red      200  /main.js
Red      200  /src_bootstrap_js-webpack_sharing_consume_default_react-dom_react-dom-webpack_sharing_consume_-f8f6f9.js
Red      200  /mf/ficha/remoteEntry.js
Red      200  /vendors-node_modules_react-dom_client_js-node_modules_react_jsx-dev-runtime_js.js
Red      200  /vendors-node_modules_react_index_js.js
Red      200  /paquetes_contexto-color_index_js-_5f4c0.js
Red      200  /vendors-node_modules_react-dom_index_js.js
Red      200  /mf/ficha/vendors-node_modules_react_jsx-dev-runtime_js.js
Red      200  /mf/ficha/src_Ficha_jsx.js
── Clic
── Texto de la página:
Host
Publicar evento

Por props: Ana

Por contexto: teal

Por evento: stock bajo
```

| Línea | Canal | Qué la produce |
|-------|-------|----------------|
| `Por props: Ana` | Props | `<Ficha nombre="Ana" />` en el host |
| `Por contexto: teal` | Contexto compartido | `<ColorContext.Provider value="teal">`, leído con `useColor()` en el remote |
| `Por evento: stock bajo` | [Evento global](../glosario/03-estado-comunicacion.md#evento-global) | El clic lanza `demo:aviso` en `window`; el remote lo escucha |

En la pestaña **Red** aparece `/paquetes_contexto-color_index_js-_5f4c0.js` **una sola vez**: es la única copia
del paquete del contexto, y la usan las dos aplicaciones. El remote llega por `/mf/ficha/…`, el camino del proxy.

### 3 — El remote abierto solo

Abierto en su propio puerto, el 3001, el remote no tiene host alrededor. Su `ficha/src/App.jsx` le pasa un
nombre de ejemplo, no hay `Provider` y nadie publica el evento:

```jsx
import Ficha from './Ficha';

// Abierta sola: sin host, cada canal muestra su valor por defecto.
export default function App() {
  return <Ficha nombre="(sin host)" />;
}
```

```text
Red      200  /remoteEntry.js
Red      200  /main.js
Red      200  /vendors-node_modules_react_jsx-dev-runtime_js.js
Red      200  /vendors-node_modules_react_index_js.js
Red      200  /paquetes_contexto-color_index_js-_5f4c0.js
Red      200  /vendors-node_modules_react-dom_index_js.js
Red      200  /src_bootstrap_js-webpack_sharing_consume_default_react-dom_react-dom.js
Red      200  /vendors-node_modules_react-dom_client_js.js
── Texto de la página:
Por props: (sin host)

Por contexto: gris

Por evento: (ninguno)
```

Cada canal muestra su valor de reserva: la prop de ejemplo, el valor por defecto de `createContext('gris')` y
el estado inicial `(ninguno)`, porque ningún evento ha llegado.

## Qué queda visto

- **Props**: el host renderiza al remote y le da los datos; solo funciona si uno contiene al otro.
- **Contexto compartido**: un `Provider` arriba llega a cualquier remote de debajo, siempre que ambos usen la
  misma copia del paquete que crea el contexto.
- **Evento global**: el emisor no sabe quién escucha; el remote se suscribe en `window` y se da de baja al
  desmontar.

Cada canal se practica por separado en los laboratorios del módulo, empezando por
[01 — Props entre microaplicaciones](01-lab-props-entre-microaplicaciones.md); cada uno se hace sin haber
seguido esta demostración.

Queda abierta una pregunta: si el host escribe la prop como `user` y el remote espera `usuario`, o si el emisor
publica `buscar` y el receptor escucha `busqueda`, ¿quién se entera de que la comunicación se ha roto?
