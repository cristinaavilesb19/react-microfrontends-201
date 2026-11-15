# Glosario 03 — Estado y comunicación

[← Hoja anterior](02-module-federation.md) · [Índice del glosario](README.md) · [Siguiente hoja →](04-integracion-despliegue.md)

Dónde vive cada dato y cómo se entera una microaplicación de lo que pasa en otra. Se usa en M04 y M06.

---

<a id="mapa"></a>
## 1. El mapa de familias

✔ = lo usas en el curso · ○ = hermano que no usamos, para que sepas que existe y cuándo se elige.

```text
Compartir entre microaplicaciones
├── Estado (alguien lo guarda y los demás lo leen)
│   ├── ✔ Store Redux del host con inyección de reducers .... M04-01
│   ├── ✔ Store propio en un paquete singleton ............... M04-03
│   ├── ✔ Context privado de la microaplicación .............. M04-02
│   └── ○ Zustand, Jotai, signals (mismo patrón: un singleton compartido)
└── Comunicación (alguien avisa y los demás reaccionan)
    ├── ✔ Props y callbacks del host ......................... M06-01
    ├── ✔ Contexto en un paquete compartido .................. M06-02
    ├── ✔ CustomEvent en window ............................... M04-04, M06-00
    ├── ✔ Bus con contrato y último valor retenido ........... M06-03, M06-04
    └── ○ BroadcastChannel (entre pestañas), postMessage (iframes)
```

<a id="comparacion-canales"></a>
### Comparación: qué canal elegir

| | ✔ Props | ✔ Contexto compartido | ✔ Evento / bus | ✔ Store compartido |
|--|--|--|--|--|
| **Cómo funciona** | El host pasa datos y funciones al pintar el remote | Host y remote importan el mismo `createContext` (singleton) | Uno publica en `window`, otros se suscriben | Todos leen y escriben el mismo store |
| **Cuándo se elige** | Relación padre-hijo directa | Datos de ambiente (idioma, tema) a cualquier profundidad | Avisar sin depender del otro | Estado de verdad global |
| **Qué acopla** | Nombres de props | El paquete del contexto y React | Solo el nombre y forma del mensaje | Librería, forma del estado |
| **En el curso** | `usuario`, `onCerrarSesion` | `idioma-compartido` | `busqueda:cambiada:v1` | `store.inyectar(slice)` |

---

## 2. Los conceptos

<a id="store-global"></a>
### Store global

**Qué es:** un único store (aquí, Redux) que vive en el host y que las microaplicaciones usan a través del
`<Provider>` del host.

**En el curso:** `host/src/store.js` de M04-01. La cabecera del host muestra `slices en el store: sesion,
favoritos` cuando el remote se ha inyectado.

**Dónde se rompe:** si el remote crea su propio store y su `<Provider>`, el host no ve nada: `slices en el
store: sesion · favoritos: 0`.

**Lo usas en:** <!--usos:store-global-->[01-lab](../M04-state-management/01-lab-store-redux-compartido.md)<!--/usos-->

<a id="inyeccion-reducers"></a>
### Inyección de reducers

**Qué es:** añadir el reducer de una microaplicación al store después de crearlo, sin que el host lo conozca
al compilar. Con Redux Toolkit 2: `combineSlices(...)` y `rootReducer.inject(slice)`.

**En el curso:** `store.inyectar(favoritosSlice)` desde el remote, con `useStore()`.

**Lo usas en:** <!--usos:inyeccion-reducers-->[00-don](../M04-state-management/00-donde-vive-el-estado.md) · [01-lab](../M04-state-management/01-lab-store-redux-compartido.md)<!--/usos-->

<a id="context-api"></a>
### Context API

**Qué es:** `createContext` + `Provider` + `useContext`: hace llegar un valor a cualquier componente por
debajo sin pasarlo por props en cada nivel.

**En el curso:** `FormularioContext` de M04-02: privado de la microaplicación (no está en `exposes`), cada
instancia del formulario con su `Provider` y su estado.

**Dónde se rompe:** usar el hook fuera del `Provider` (`useFormulario fuera de <FormularioProvider>`).

**Lo usas en:** <!--usos:context-api-->[02-lab](../M04-state-management/02-lab-context-estado-local.md)<!--/usos-->

<a id="contexto-compartido"></a>
### Contexto compartido

**Qué es:** un `createContext` que vive en un paquete compartido como singleton, para que el `Provider` del
host y el `useContext` del remote usen **el mismo objeto**.

**Dónde se rompe:** si el paquete no se comparte, cada aplicación tiene su copia del contexto y el remote ve
el valor por defecto (`[es]` aunque el host diga `en`, M06-02).

**Lo usas en:** <!--usos:contexto-compartido-->[M06](../M06-comunicacion/README.md) · [00-can](../M06-comunicacion/00-canales-de-comunicacion.md) · [02-lab](../M06-comunicacion/02-lab-contexto-compartido.md) · [03-lab](../M06-comunicacion/03-lab-bus-de-mensajes.md)<!--/usos-->

<a id="fuente-unica"></a>
### Fuente única de verdad

**Qué es:** que un dato viva en un único sitio y todos lo lean de ahí, en lugar de que cada parte guarde su
copia.

**En el curso:** el tema claro/oscuro de M04-03 en `paquetes/tema` (`useSyncExternalStore`), compartido como
singleton: al cambiarlo en la cabecera, el pie también cambia.

**Dónde se rompe:** dos `useState` con el mismo dato: «Cabecera: tema oscuro» y «Pie: tema claro».

**Lo usas en:** <!--usos:fuente-unica-->[M04](../M04-state-management/README.md) · [00-don](../M04-state-management/00-donde-vive-el-estado.md) · [03-lab](../M04-state-management/03-lab-sincronizar-estado.md)<!--/usos-->

<a id="evento-global"></a>
### Evento global (CustomEvent)

**Qué es:** `window.dispatchEvent(new CustomEvent(nombre, { detail }))` para avisar y
`window.addEventListener(nombre, fn)` para escuchar. No necesita librería compartida.

**En el curso:** `acceso:sesion-iniciada` en M04-04: el host lo traduce a una acción de su store.

**Dónde se rompe:** un `useEffect` que se suscribe sin devolver la limpieza; con StrictMode llegan dos
acciones por clic.

**Lo usas en:** <!--usos:evento-global-->[M04](../M04-state-management/README.md) · [00-don](../M04-state-management/00-donde-vive-el-estado.md) · [02-lab](../M04-state-management/02-lab-context-estado-local.md) · [04-lab](../M04-state-management/04-lab-eventos-hacia-el-store.md) · [00-can](../M06-comunicacion/00-canales-de-comunicacion.md)<!--/usos-->

<a id="bus-de-mensajes"></a>
### Bus de mensajes

**Qué es:** una capa pequeña sobre los eventos con un **contrato**: nombres de mensaje con versión y forma del
payload, `publicar(tipo, payload)` y `suscribir(tipo, fn)` que devuelve la baja.

**En el curso:** `paquetes/mensajes/` de M06-03 con `busqueda:cambiada:v1`.

**Dónde se rompe:** nombres escritos a mano distintos en cada lado (`buscar` / `busqueda`): no llega nada y no
hay error. Sin baja, tras ocultar y mostrar, el mismo mensaje se recibe dos veces.

**Lo usas en:** <!--usos:bus-de-mensajes-->[04-lab](../M04-state-management/04-lab-eventos-hacia-el-store.md) · [M06](../M06-comunicacion/README.md) · [03-lab](../M06-comunicacion/03-lab-bus-de-mensajes.md) · [04-lab](../M06-comunicacion/04-lab-ultimo-valor-retenido.md)<!--/usos-->

<a id="ultimo-valor"></a>
### Último valor retenido

**Qué es:** el bus guarda el último payload de cada tipo y se lo entrega al que se suscribe tarde.

**En el curso:** `window.__busUltimo` en M06-04 (en `window` porque cada microaplicación lleva su copia del
paquete).

**Dónde se rompe:** sin retenerlo, la microaplicación que monta después de publicarse el mensaje muestra
«(nada)».

**Lo usas en:** <!--usos:ultimo-valor-->[04-lab](../M06-comunicacion/04-lab-ultimo-valor-retenido.md)<!--/usos-->
