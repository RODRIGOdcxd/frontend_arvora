# Panel de administración · ARVORA & METAL S.A.C.

Panel web del taller de metal y muebles en Lima (bases de mesa, mesas, sillas, bancas y estructuras). La interfaz está en español (Perú) y consume el API Spring Boot de [ERP_ARVORA](https://github.com/RODRIGOdcxd/ERP_ARVORA).

## Qué había en este repositorio

El proyecto ya era **Next.js 16** (App Router), React 19, TypeScript, Tailwind CSS 4 y componentes shadcn (`base-nova`). Había un tablero de plantilla: un menú lateral que cambiaba de sección en la misma página, un formulario de producto de demostración y textos de marcador. No había cliente HTTP, rutas por recurso ni datos reales. Se conservó ese stack (el API permite CORS a `http://localhost:3000`) y se reemplazó el tablero de demostración por el panel.

El logo del taller está en `public/images/logoArvora.jpg`. No había guía de marca; la paleta (acero `#1C1C1E`, cedro `#B5743A`, fondo `#F7F6F3`) vive en las variables de `app/globals.css`.

## Cómo ejecutarlo

```bash
npm install
cp .env.example .env.local
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

| Variable | Uso |
|---|---|
| `NEXT_PUBLIC_API_URL` | Base del API, con `/api/v1`. Equivale a `VITE_API_URL` en un proyecto Vite. Por defecto `http://localhost:8080/api/v1`. |
| `NEXT_PUBLIC_API_MOCK` | `true` intercepta el API con MSW en el navegador. `false` llama al Spring Boot real. Si se omite, `next dev` usa el modo demostración. |

### Modo demostración (sin backend)

Con `NEXT_PUBLIC_API_MOCK=true` (o simplemente `npm run dev` sin definir la variable) el service worker de MSW responde `/api/v1` con datos del taller: tubo de 6 m, melamina cedro caramelo, mesa 1.20 × 0.80, cotizaciones y movimientos. La barra superior muestra «Modo demostración».

### Contra el backend real

1. Levante el API de la rama `cursor/api-crud-v1-eb3c` (puerto 8080).
2. En `.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
NEXT_PUBLIC_API_MOCK=false
```

3. Reinicie `npm run dev`. El CORS del backend ya acepta `http://localhost:3000`.

Todavía no hay login. La ruta `/login` es un marcador: el cliente ya puede adjuntar `Authorization: Bearer` cuando exista el token (`lib/api/client.ts`, `setAccessToken` / `setRequestInterceptor`).

## Comandos

```bash
npm run dev
npm run lint
npm run typecheck
npm test
npm run build
```

## Estructura

- `app/(panel)/` — rutas del panel (inicio, inventario, ventas, compras, configuración).
- `features/` — una carpeta por recurso.
- `components/crud/` — listado genérico: página de Spring, orden, búsqueda `texto`, filtros, formulario en panel lateral, confirmación de baja, vacío, error y esqueleto.
- `lib/api/` — cliente `fetch`, página, ProblemDetail e interceptor del token.
- `lib/domain/` — tipos de los DTO, esquemas Zod y la vista previa de IGV.
- `mocks/` — almacén en memoria y handlers MSW con el mismo contrato.

## Contrato del API (PR #2)

Base `/api/v1`. Listados: `page`, `size`, `sort` y búsqueda `texto`. La respuesta es una página de Spring (`content`, `totalElements`, `totalPages`, `number`, `size`). Las colecciones anidadas (imágenes, precios, componentes, líneas) devuelven un arreglo.

Errores RFC 7807: `title`, `detail`, `status`, `codigo` y, en validación, `errores: [{ campo, mensaje }]`. 409 para duplicados, versión y reglas de negocio. Los maestros se desactivan con `DELETE` (`activo=false`). Las unidades de medida se borran de verdad si no están en uso. `DELETE` de una cotización la anula.

Los movimientos solo se crean y se consultan. Revertir registra un `AJUSTE` de signo contrario.

Los totales de la cotización (base, IGV 18%, total) los calcula el servidor. El panel muestra esos importes y, al lado, una vista previa con la misma fórmula.

## Notas para el backend

No hay un endpoint de resumen. El inicio suma `totalElements` de los listados y los últimos movimientos. Si más adelante existe `GET /api/v1/dashboard`, esta pantalla puede dejar de componerlo.

`ExistenciaResponse` no trae `stockMinimo`. El resalte de stock bajo cruza la existencia con el artículo en el cliente. El mínimo es del artículo, no por almacén. La vista solo incluye artículos que ya tienen movimientos.

El precio de lista y los precios por volumen incluyen IGV. `ArticuloResponse.preciosIncluyenIgv` llega siempre en `true`.
