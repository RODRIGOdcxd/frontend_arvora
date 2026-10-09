import { http, HttpResponse, type HttpHandler } from "msw"

import { MockProblem, respuestaProblema } from "@/mocks/problems"
import { store } from "@/mocks/store"

const API = "*/api/v1"

function idDe(params: Record<string, string | readonly string[] | undefined>, nombre: string) {
  const valor = params[nombre]
  const texto = Array.isArray(valor) ? valor[0] : valor
  return Number(texto)
}

async function cuerpo(request: Request) {
  return request.json()
}

async function ejecutar(accion: () => unknown, status = 200) {
  try {
    const data = await accion()
    if (status === 204) return new HttpResponse(null, { status: 204 })
    return HttpResponse.json(data as never, { status })
  } catch (error) {
    if (error instanceof MockProblem) return respuestaProblema(error)
    throw error
  }
}

function recurso(
  ruta: string,
  acciones: {
    listar: (url: URL) => unknown
    obtener: (id: number) => unknown
    crear: (body: unknown) => unknown
    actualizar: (id: number, body: unknown) => unknown
    eliminar: (id: number) => void
  },
): HttpHandler[] {
  return [
    http.get(`${API}${ruta}`, ({ request }) => ejecutar(async () => acciones.listar(new URL(request.url)))),
    http.get(`${API}${ruta}/:id`, ({ params }) => ejecutar(async () => acciones.obtener(idDe(params, "id")))),
    http.post(`${API}${ruta}`, async ({ request }) => ejecutar(async () => acciones.crear(await cuerpo(request)), 201)),
    http.put(`${API}${ruta}/:id`, async ({ params, request }) =>
      ejecutar(async () => acciones.actualizar(idDe(params, "id"), await cuerpo(request))),
    ),
    http.delete(`${API}${ruta}/:id`, ({ params }) => ejecutar(async () => acciones.eliminar(idDe(params, "id")), 204)),
  ]
}

export const handlers: HttpHandler[] = [
  ...recurso("/roles", {
    listar: (url) => store.listarRoles(url),
    obtener: (id) => store.obtenerRol(id),
    crear: (body) => store.crearRol(body),
    actualizar: (id, body) => store.actualizarRol(id, body),
    eliminar: (id) => store.eliminarRol(id),
  }),
  ...recurso("/usuarios", {
    listar: (url) => store.listarUsuarios(url),
    obtener: (id) => store.obtenerUsuario(id),
    crear: (body) => store.crearUsuario(body),
    actualizar: (id, body) => store.actualizarUsuario(id, body),
    eliminar: (id) => store.eliminarUsuario(id),
  }),
  ...recurso("/clientes", {
    listar: (url) => store.listarClientes(url),
    obtener: (id) => store.obtenerCliente(id),
    crear: (body) => store.crearCliente(body),
    actualizar: (id, body) => store.actualizarCliente(id, body),
    eliminar: (id) => store.eliminarCliente(id),
  }),
  ...recurso("/proveedores", {
    listar: (url) => store.listarProveedores(url),
    obtener: (id) => store.obtenerProveedor(id),
    crear: (body) => store.crearProveedor(body),
    actualizar: (id, body) => store.actualizarProveedor(id, body),
    eliminar: (id) => store.eliminarProveedor(id),
  }),
  ...recurso("/categorias", {
    listar: (url) => store.listarCategorias(url),
    obtener: (id) => store.obtenerCategoria(id),
    crear: (body) => store.crearCategoria(body),
    actualizar: (id, body) => store.actualizarCategoria(id, body),
    eliminar: (id) => store.eliminarCategoria(id),
  }),
  ...recurso("/unidades-medida", {
    listar: (url) => store.listarUnidades(url),
    obtener: (id) => store.obtenerUnidad(id),
    crear: (body) => store.crearUnidad(body),
    actualizar: (id, body) => store.actualizarUnidad(id, body),
    eliminar: (id) => store.eliminarUnidad(id),
  }),
  ...recurso("/almacenes", {
    listar: (url) => store.listarAlmacenes(url),
    obtener: (id) => store.obtenerAlmacen(id),
    crear: (body) => store.crearAlmacen(body),
    actualizar: (id, body) => store.actualizarAlmacen(id, body),
    eliminar: (id) => store.eliminarAlmacen(id),
  }),
  http.get(`${API}/articulos/:articuloId/imagenes`, ({ params }) =>
    ejecutar(async () => store.listarImagenes(idDe(params, "articuloId"))),
  ),
  http.post(`${API}/articulos/:articuloId/imagenes`, async ({ params, request }) =>
    ejecutar(async () => store.crearImagen(idDe(params, "articuloId"), await cuerpo(request)), 201),
  ),
  http.put(`${API}/articulos/:articuloId/imagenes/:imagenId`, async ({ params, request }) =>
    ejecutar(async () => store.actualizarImagen(idDe(params, "articuloId"), idDe(params, "imagenId"), await cuerpo(request))),
  ),
  http.delete(`${API}/articulos/:articuloId/imagenes/:imagenId`, ({ params }) =>
    ejecutar(async () => store.eliminarImagen(idDe(params, "articuloId"), idDe(params, "imagenId")), 204),
  ),
  http.get(`${API}/articulos/:articuloId/precios-escala`, ({ params }) =>
    ejecutar(async () => store.listarPrecios(idDe(params, "articuloId"))),
  ),
  http.post(`${API}/articulos/:articuloId/precios-escala`, async ({ params, request }) =>
    ejecutar(async () => store.crearPrecio(idDe(params, "articuloId"), await cuerpo(request)), 201),
  ),
  http.put(`${API}/articulos/:articuloId/precios-escala/:precioId`, async ({ params, request }) =>
    ejecutar(async () => store.actualizarPrecio(idDe(params, "articuloId"), idDe(params, "precioId"), await cuerpo(request))),
  ),
  http.delete(`${API}/articulos/:articuloId/precios-escala/:precioId`, ({ params }) =>
    ejecutar(async () => store.eliminarPrecio(idDe(params, "articuloId"), idDe(params, "precioId")), 204),
  ),
  http.get(`${API}/articulos/:articuloId/componentes`, ({ params }) =>
    ejecutar(async () => store.listarComponentes(idDe(params, "articuloId"))),
  ),
  http.post(`${API}/articulos/:articuloId/componentes`, async ({ params, request }) =>
    ejecutar(async () => store.crearComponente(idDe(params, "articuloId"), await cuerpo(request)), 201),
  ),
  http.put(`${API}/articulos/:articuloId/componentes/:componenteId`, async ({ params, request }) =>
    ejecutar(async () => store.actualizarComponente(idDe(params, "articuloId"), idDe(params, "componenteId"), await cuerpo(request))),
  ),
  http.delete(`${API}/articulos/:articuloId/componentes/:componenteId`, ({ params }) =>
    ejecutar(async () => store.eliminarComponente(idDe(params, "articuloId"), idDe(params, "componenteId")), 204),
  ),
  ...recurso("/articulos", {
    listar: (url) => store.listarArticulos(url),
    obtener: (id) => store.obtenerArticulo(id),
    crear: (body) => store.crearArticulo(body),
    actualizar: (id, body) => store.actualizarArticulo(id, body),
    eliminar: (id) => store.eliminarArticulo(id),
  }),
  http.get(`${API}/movimientos-inventario`, ({ request }) =>
    ejecutar(async () => store.listarMovimientos(new URL(request.url))),
  ),
  http.get(`${API}/movimientos-inventario/:id`, ({ params }) =>
    ejecutar(async () => store.obtenerMovimiento(idDe(params, "id"))),
  ),
  http.post(`${API}/movimientos-inventario`, async ({ request }) =>
    ejecutar(async () => store.crearMovimiento(await cuerpo(request)), 201),
  ),
  http.get(`${API}/existencias`, ({ request }) => ejecutar(async () => store.listarExistencias(new URL(request.url)))),
  http.get(`${API}/cotizaciones/:cotizacionId/lineas`, ({ params }) =>
    ejecutar(async () => store.listarLineas(idDe(params, "cotizacionId"))),
  ),
  http.post(`${API}/cotizaciones/:cotizacionId/lineas`, async ({ params, request }) =>
    ejecutar(async () => store.crearLinea(idDe(params, "cotizacionId"), await cuerpo(request)), 201),
  ),
  http.put(`${API}/cotizaciones/:cotizacionId/lineas/:lineaId`, async ({ params, request }) =>
    ejecutar(async () =>
      store.actualizarLinea(idDe(params, "cotizacionId"), idDe(params, "lineaId"), await cuerpo(request)),
    ),
  ),
  http.delete(`${API}/cotizaciones/:cotizacionId/lineas/:lineaId`, ({ params }) =>
    ejecutar(async () => store.eliminarLinea(idDe(params, "cotizacionId"), idDe(params, "lineaId")), 204),
  ),
  ...recurso("/cotizaciones", {
    listar: (url) => store.listarCotizaciones(url),
    obtener: (id) => store.obtenerCotizacion(id),
    crear: (body) => store.crearCotizacion(body),
    actualizar: (id, body) => store.actualizarCotizacion(id, body),
    eliminar: (id) => store.eliminarCotizacion(id),
  }),
]
