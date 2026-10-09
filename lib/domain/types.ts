/** DTOs alineados con los records de `com.erparvora.erp_arvora.api.dto` (PR #2). */

export type TipoDocumento = "DNI" | "RUC" | "CE" | "PAS"
export type CanalOrigen = "MARKETPLACE" | "WHATSAPP" | "TIKTOK" | "REFERIDO" | "WEB" | "OTRO"
export type Magnitud = "CONTEO" | "LONGITUD" | "AREA" | "MASA" | "VOLUMEN"
export type TipoArticulo = "MATERIA_PRIMA" | "INSUMO" | "PRODUCTO" | "REVENTA" | "SERVICIO"
export type TipoCorte = "NINGUNO" | "LINEAL" | "PANEL"
export type TipoMovimiento =
  | "SALDO_INICIAL"
  | "COMPRA"
  | "CONSUMO_PRODUCCION"
  | "INGRESO_PRODUCCION"
  | "VENTA"
  | "AJUSTE"
  | "DEVOLUCION"
export type EstadoCotizacion =
  | "BORRADOR"
  | "ENVIADA"
  | "ACEPTADA"
  | "RECHAZADA"
  | "VENCIDA"
  | "ANULADA"
export type Moneda = "PEN" | "USD"

export type Rol = {
  id: number
  codigo: string
  nombre: string
  activo: boolean
}

export type Usuario = {
  id: number
  email: string
  nombre: string
  rolId: number
  rolCodigo: string
  rolNombre: string
  activo: boolean
  ultimoAcceso: string | null
  createdAt: string
  updatedAt: string
}

export type Cliente = {
  id: number
  tipoDocumento: TipoDocumento | null
  numeroDocumento: string | null
  nombre: string
  telefono: string | null
  email: string | null
  direccion: string | null
  ciudad: string | null
  canalOrigen: CanalOrigen | null
  notas: string | null
  activo: boolean
  createdAt: string
  updatedAt: string
}

export type Proveedor = {
  id: number
  ruc: string | null
  razonSocial: string
  nombreComercial: string | null
  contacto: string | null
  telefono: string | null
  email: string | null
  direccion: string | null
  rubro: string | null
  notas: string | null
  activo: boolean
  createdAt: string
  updatedAt: string
}

export type UnidadMedida = {
  id: number
  codigo: string
  nombre: string
  magnitud: Magnitud
  decimales: number
}

export type Categoria = {
  id: number
  nombre: string
  padreId: number | null
  padreNombre: string | null
  activo: boolean
}

export type Almacen = {
  id: number
  codigo: string
  nombre: string
  activo: boolean
}

export type Articulo = {
  id: number
  codigo: string
  nombre: string
  descripcion: string | null
  tipo: TipoArticulo
  categoriaId: number | null
  categoriaNombre: string | null
  unidadMedidaId: number
  unidadMedidaCodigo: string
  seCompra: boolean
  seVende: boolean
  controlaStock: boolean
  largoMm: number | null
  anchoMm: number | null
  altoMm: number | null
  espesorMm: number | null
  diametroMm: number | null
  tipoCorte: TipoCorte
  respetaVeta: boolean
  marca: string | null
  colorAcabado: string | null
  proveedorHabitualId: number | null
  proveedorNombre: string | null
  costoReferencia: number | null
  precioVenta: number | null
  preciosIncluyenIgv: boolean
  stockMinimo: number
  activo: boolean
  version: number
  createdAt: string
  updatedAt: string
}

export type ArticuloImagen = {
  id: number
  articuloId: number
  url: string
  orden: number
  principal: boolean
}

export type PrecioEscala = {
  id: number
  articuloId: number
  cantidadMinima: number
  precioUnitario: number
}

export type Componente = {
  id: number
  productoId: number
  materialId: number
  materialCodigo: string
  materialNombre: string
  nombrePieza: string | null
  cantidadPiezas: number
  largoMm: number | null
  anchoMm: number | null
  toleranciaMenosMm: number
  toleranciaMasMm: number
  cantidad: number | null
  mermaPct: number
  orden: number
  notas: string | null
}

export type Movimiento = {
  id: number
  fecha: string
  tipo: TipoMovimiento
  articuloId: number
  articuloCodigo: string
  articuloNombre: string
  almacenId: number
  almacenNombre: string
  cantidad: number
  costoUnitario: number | null
  proveedorId: number | null
  cotizacionId: number | null
  documentoRef: string | null
  usuarioId: number
  usuarioNombre: string
  nota: string | null
  createdAt: string
}

export type Existencia = {
  articuloId: number
  articuloCodigo: string | null
  articuloNombre: string | null
  almacenId: number
  almacenCodigo: string | null
  almacenNombre: string | null
  cantidad: number
}

export type CotizacionLinea = {
  id: number
  linea: number
  articuloId: number | null
  descripcion: string
  largoMm: number | null
  anchoMm: number | null
  altoMm: number | null
  cantidad: number
  unidadCodigo: string
  precioUnitario: number
  descuento: number
  importe: number
  costoUnitarioEst: number | null
}

export type Cotizacion = {
  id: number
  numero: string
  clienteId: number
  clienteNombre: string
  usuarioId: number
  usuarioNombre: string
  fechaEmision: string
  validaHasta: string | null
  estado: EstadoCotizacion
  moneda: Moneda
  preciosIncluyenIgv: boolean
  tasaIgv: number
  subtotal: number
  descuento: number
  igv: number
  total: number
  adelantoPct: number
  plazoEntregaDias: number | null
  condiciones: string | null
  notasInternas: string | null
  version: number
  lineas: CotizacionLinea[]
  createdAt: string
  updatedAt: string
}
