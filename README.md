# API REST · Sala Manolete

API RESTful desarrollada con **Node.js** y **Express** para la gestión integral de programación artística, cálculo de personal y rentabilidad, control de almacén y gestión automatizada de pedidos de **Sala Manolete**.

Toda la lógica de negocio se ejecuta sobre colecciones en memoria siguiendo estrictamente un paradigma de **programación funcional e inmutable**: no se utilizan bucles (`for`, `while`, `forEach`), no se mutan los arrays ni objetos originales y se emplean métodos de orden superior.

---

## Índice

1. [Requisitos e instalación](#requisitos-e-instalación)
2. [Estructura del proyecto](#estructura-del-proyecto)
3. [Reglas de negocio (`src/config.js`)](#reglas-de-negocio-srcconfigjs)
4. [Diseño de datos y decisiones técnicas](#diseño-de-datos-y-decisiones-técnicas)
5. [Documentación de Endpoints](#documentación-de-endpoints)
   - [Eventos](#1-eventos)
   - [Informes y estadísticas](#2-informes-y-estadísticas)
   - [Almacén y Productos](#3-almacén-y-productos)
   - [Pedidos](#4-pedidos)
6. [Códigos de estado y manejo de errores](#códigos-de-estado-y-manejo-de-errores)
7. [Pruebas con REST Client](#pruebas-con-rest-client)

---

## Requisitos e instalación

* **Node.js**
* **npm**

### Pasos para arrancar el servidor

1. Clona el repositorio o sitúate en la carpeta raíz del proyecto:
   ```bash
   cd sala-eventos
   ```
2. Instala las dependencias necesarias (`express`):
   ```bash
   npm install
   ```
3. Inicia la aplicación:
   ```bash
   npm start
   ```
   El servidor quedará escuchando en `http://localhost:3000`.

---

## Estructura del proyecto

El código está modularizado separando la capa de enrutamiento HTTP (`app.js`), la configuración (`config.js`), las validaciones (`validar.js`) y la lógica pura de negocio (`servicios/`):

```text
sala-eventos/
├── .gitignore               # Exclusión de node_modules y archivos de entorno
├── package.json             # Dependencias y script de arranque (npm start)
├── peticiones.http          # Batería de 50 peticiones de prueba para REST Client
├── README.md                # Documentación técnica del proyecto
└── src/
    ├── app.js               # Configuración de Express, rutas y middlewares de error
    ├── config.js            # Constantes globales y reglas de la sala
    ├── datos.js             # Dataset inicial realista (10 eventos, 5 productos, 2 pedidos)
    ├── validar.js           # Validadores por colección y elementos anidados con flatMap
    └── servicios/
        ├── comun.js         # Utilidades genéricas (buscarPorId, calcularSiguienteId)
        ├── eventos.js       # Cálculos, CRUD inmutable, filtros, paginación e informes
        ├── almacen.js       # Valoración de stock, necesidades por evento y previsión
        └── pedidos.js       # Creación manual/automática y recepción de mercancía
```

---

## Reglas de negocio (`src/config.js`)

Para evitar "números mágicos" dispersos en la lógica, todos los parámetros operativos de la sala están centralizados en `src/config.js`:

* **`NOMBRE_SALA`**: `'Sala Manolete'`
* **`AFORO`**: `150` personas máximo por evento.
* **`PERSONAS_POR_CAMARERO`**: `35` asistentes (redondeando siempre hacia arriba con `Math.ceil`).
* **`MINIMO_CAMAREROS`**: `2` camareros por evento activo (en eventos de tipo `fiesta` se suma `1` camarero adicional; en eventos cancelados son `0`).
* **`COSTE_CAMARERO`**: `90 €` por camarero y evento.
* **`TIPOS`**: `['monologo', 'concierto', 'fiesta', 'karaoke', 'quiz', 'privado']`.

---

## Diseño de datos y decisiones técnicas

### 1. Colección de Eventos (`eventos`)

```json
{
  "id": 1,
  "titulo": "Noche de Monólogos en Euskera",
  "descripcion": "Los mejores monologuistas del panorama actual para reír sin parar.",
  "tipo": "monologo",
  "fecha": "2026-11-05",
  "hora": "21:00",
  "entrada": { "gratis": false, "precio": 10 },
  "gentePrevista": 100,
  "organizador": { "nombre": "Algara Elkartea", "contacto": "600111222" },
  "alquiler": { "cobra": true, "importe": 150, "pagado": false },
  "cancelacion": null,
  "artistas": [
    { "nombre": "Kike Biguri", "cobra": 250, "minutos": 45 }
  ],
  "etiquetas": ["humor", "euskera", "terraza"],
  "celebrado": true
}
```

* **Justificación y alternativas descartadas**:
  * **Gestión de cancelaciones**: Se eligió almacenar un objeto `{ cancelado: true, motivo: "..." }` cuando el evento se cancela y `null` cuando sigue activo, descartando tener dos propiedades independientes (`cancelado` y `motivoCancelacion`) en el nivel raíz. Esto garantiza que nunca exista un motivo huérfano sin cancelación o viceversa.
  * **Campos derivados no persistidos**: Propiedades como `camarerosNecesarios`, `costePersonal`, `costeArtistas` y `balancePrevisto` no se guardan en el array en memoria; se calculan dinámicamente al serializar cada respuesta. Se descartó persistirlos para evitar desincronizaciones al editar la gente prevista o el caché de un artista mediante `PATCH`.

### 2. Colección de Productos (`productos`)

```json
{
  "id": 1,
  "nombre": "Cerveza en lata",
  "categoria": "bebida",
  "unidad": "latas",
  "stockActual": 10,
  "minimo": 50,
  "caja": { "unidadesPorCaja": 24, "precioCaja": 18.5 },
  "proveedor": { "nombre": "Bebidas del Norte S.A.", "telefono": "943123456" },
  "consumoPorTipo": {
    "monologo": 1,
    "concierto": 2,
    "fiesta": 3,
    "karaoke": 2,
    "quiz": 1.5,
    "privado": 2
  }
}
```

* **Justificación y alternativas descartadas**:
  * **Diccionario de consumos**: Para modelar el consumo estimado por persona según el tipo de evento, se descartó un array de objetos (`[{ tipo: "fiesta", cantidad: 3 }]`) y se optó por un objeto mapa (`consumoPorTipo`). Esto permite consultas directas `O(1)` (`producto.consumoPorTipo[evento.tipo]`) y simplifica la validación cruzada contra el array `TIPOS` de `config.js`.
  * **Separación de unidades y precios**: Los valores numéricos (`minutos`, `precio`, `precioCaja`) se almacenan exclusivamente como `Number`, dejando la unidad implícita en el nombre del campo para facilitar agregaciones con `reduce`.

### 3. Colección de Pedidos (`pedidos`)

```json
{
  "id": 2,
  "fecha": "2026-11-01",
  "lineas": [
    { "productoId": 1, "cajas": 4 },
    { "productoId": 3, "cajas": 2 }
  ],
  "importeTotal": 104,
  "recibido": false
}
```

* **Justificación y alternativas descartadas**:
  * **Inmutabilidad del importe histórico**: A diferencia de los balances de eventos, `importeTotal` sí se persiste en el momento de crear el pedido. Se descartó recalcularlo dinámicamente porque las tarifas de los proveedores (`precioCaja`) pueden actualizarse en el futuro y alterarían el histórico contable de pedidos ya realizados.

---

## Documentación de Endpoints

### 1. Eventos

| Método | Ruta | Descripción | Códigos |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/eventos` | Lista paginada con datos calculados. Admite filtros combinables, ordenación y proyección. | `200` |
| `GET` | `/api/eventos/:id` | Obtiene el detalle completo de un evento por su ID. | `200`, `400`, `404` |
| `POST` | `/api/eventos` | Crea un nuevo evento asignando ID automáticamente. | `201`, `400` |
| `PUT` | `/api/eventos/:id` | Reemplaza por completo un evento existente conservando su ID. | `200`, `400`, `404` |
| `PATCH` | `/api/eventos/:id` | Actualiza parcialmente un evento fusionando objetos anidados y validando el resultado final. | `200`, `400`, `404` |
| `DELETE` | `/api/eventos/:id` | Elimina un evento del sistema. | `204`, `400`, `404` |
| `PATCH` | `/api/eventos/:id/cancelar` | Cancela un evento indicando `{ "motivo": "..." }`. | `200`, `400`, `404`, `409` |
| `PATCH` | `/api/eventos/:id/pagar-alquiler` | Marca como pagado el alquiler de un evento. | `200`, `400`, `404`, `409` |
| `PATCH` | `/api/eventos/:id/celebrar` | Marca un evento como celebrado y descuenta el consumo previsto del almacén. | `200`, `400`, `404`, `409` |
| `GET` | `/api/eventos/:id/necesidades` | Detalla lo necesario, disponible y faltante de cada producto para ese evento. | `200`, `400`, `404` |

#### Parámetros de consulta admitidos en `GET /api/eventos`
* **Filtros**: `tipo`, `precioMin`, `precioMax`, `gratis` (`true`/`false`), `texto` (busca en título y descripción), `etiqueta`, `desde` (`AAAA-MM-DD`), `hasta` (`AAAA-MM-DD`), `organizador`, `artista`, `cancelado` (`true`/`false`), `alquilerPendiente` (`true`), `minCamareros`.
* **Ordenación**: `orden` (cualquier propiedad guardada o calculada, por defecto `fecha`) y `dir` (`asc` o `desc`).
* **Paginación**: `pagina` (por defecto `1`) y `limite` (por defecto `10`).
* **Proyección**: `campos` (lista separada por comas, ej. `?campos=titulo,fecha`; el `id` siempre se incluye).

### 2. Informes y estadísticas

| Método | Ruta | Descripción | Códigos |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/eventos/resumen` | Total de eventos, cancelados, celebrados, media de asistencia y balance previsto global. | `200` |
| `GET` | `/api/eventos/deudas` | Importe total de alquiler pendiente agrupado por cada organizador deudor. | `200` |
| `GET` | `/api/eventos/actuaciones` | Todas las actuaciones de todos los eventos ordenadas de mayor a menor caché. | `200` |
| `GET` | `/api/eventos/calendario?mes=AAAA-MM` | Programación mensual de eventos activos ordenada cronológicamente. | `200`, `400` |
| `GET` | `/api/eventos/preguntas` | Devuelve tres booleanos: alquileres pendientes, stock sobre mínimo y eventos multi-artista. | `200` |

### 3. Almacén y Productos

| Método | Ruta | Descripción | Códigos |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/productos` | Lista de productos. Admite `?categoria=` y `?bajoMinimo=true`. | `200` |
| `GET` | `/api/productos/:id` | Detalle de un producto por su ID. | `200`, `400`, `404` |
| `POST` | `/api/productos` | Da de alta un nuevo producto en el almacén. | `201`, `400` |
| `PATCH` | `/api/productos/:id` | Actualiza parcialmente un producto fusionando `caja`, `proveedor` y `consumoPorTipo`. | `200`, `400`, `404` |
| `DELETE` | `/api/productos/:id` | Elimina un producto si no está incluido en ningún pedido pendiente. | `204`, `400`, `404`, `409` |
| `GET` | `/api/productos/valor` | Valor económico total del inventario y desglose por categoría. | `200` |
| `GET` | `/api/productos/prevision` | Calcula cajas completas a pedir y coste total para cubrir eventos pendientes y mínimos. | `200` |

### 4. Pedidos

| Método | Ruta | Descripción | Códigos |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/pedidos` | Historial de pedidos ordenados del más reciente al más antiguo (`?pendiente=true`). | `200` |
| `GET` | `/api/pedidos/:id` | Detalle de un pedido enriqueciendo cada línea con el nombre del producto. | `200`, `400`, `404` |
| `POST` | `/api/pedidos` | Registra un pedido manual con fecha actual y cálculo automático de importe. | `201`, `400` |
| `POST` | `/api/pedidos/automatico` | Crea un pedido automáticamente a partir del cálculo de `/api/productos/prevision`. | `201`, `409` |
| `PATCH` | `/api/pedidos/:id/recibir` | Marca un pedido como recibido e incrementa el stock del almacén según unidades por caja. | `200`, `400`, `404`, `409` |

---

## Códigos de estado y manejo de errores

Todas las respuestas de error devuelven un objeto JSON estandarizado:

* **`400 Bad Request`**: Fallos de validación de esquema o reglas cruzadas, o parámetros de ruta/consulta con formato inválido. Devuelve `{ "errores": ["..."] }`.
* **`404 Not Found`**: Recurso solicitado inexistente o endpoint no definido. Devuelve `{ "error": "..." }`.
* **`409 Conflict`**: Operación incompatible con el estado actual del recurso (cancelar un evento ya cancelado/celebrado, celebrar sin stock suficiente, recibir un pedido ya recibido, borrar un producto en pedido pendiente o generar un pedido automático sin necesidades). Devuelve `{ "error": "..." }` (acompañado de `faltantes` cuando aplica).
* **`500 Internal Server Error`**: Capturado por el middleware global de errores inesperados. Devuelve `{ "error": "Error interno" }`.

---

## Pruebas con REST Client

El repositorio incluye el archivo **`peticiones.http`** en la raíz con **50 peticiones preparadas** que cubren:
1. Todas las rutas `GET`, `POST`, `PUT`, `PATCH` y `DELETE` de las tres colecciones.
2. Cada filtro de `/api/eventos` probado de manera individual.
3. Combinaciones múltiples de filtros, ordenación, paginación y proyección.
4. Casos límite y respuestas de error `400`, `404` y `409`.

Para ejecutarlas, abre `peticiones.http` en **Visual Studio Code** con la extensión *REST Client* instalada y pulsa **Send Request** sobre cada bloque.