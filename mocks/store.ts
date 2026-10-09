import type { z } from "zod"

import { paginar, coincideTexto, type SpringPage } from "@/lib/api/page"
import {
  articuloSchema,
  categoriaSchema,
  clienteSchema,
  componenteSchema,
  cotizacionSchema,
  erroresZod,
  imagenSchema,
  lineaSchema,
  movimientoSchema,
  precioEscalaSchema,
  proveedorSchema,
  rolSchema,
  unidadSchema,
  usuarioSchema,
  almacenSchema,
} from "@/lib/domain/schemas"
import { esErrorTotales, importeLinea, previewTotales } from "@/lib/domain/money"
import type {
  Almacen,
  Articulo,
  ArticuloImagen,
  Categoria,
  Cliente,
  Componente,
  Cotizacion,
  CotizacionLinea,
  EstadoCotizacion,
  Existencia,
  Movimiento,
  PrecioEscala,
  Proveedor,
  Rol,
  TipoMovimiento,
  UnidadMedida,
  Usuario,
} from "@/lib/domain/types"
import { conflicto, datosInvalidos, noEncontrado } from "@/mocks/problems"

const CREADO = "2026-10-01T15:00:00-05:00"

type UsuarioRow = Usuario & { passwordHash: string }
type ArticuloRow = Omit<Articulo, "categoriaNombre" | "unidadMedidaCodigo" | "proveedorNombre" | "preciosIncluyenIgv">
type MovimientoRow = Omit<Movimiento, "articuloCodigo" | "articuloNombre" | "almacenNombre" | "usuarioNombre">
type ComponenteRow = Omit<Componente, "materialCodigo" | "materialNombre">
type CotizacionRow = Omit<Cotizacion, "clienteNombre" | "usuarioNombre" | "lineas">

function ahora() {
  return new Date().toISOString()
}

function vacio(valor: string | null | undefined) {
  if (valor == null) return null
  const limpio = valor.trim()
  return limpio.length === 0 ? null : limpio
}

function validar<T>(schema: z.ZodType<T>, body: unknown): T {
  const resultado = schema.safeParse(body)
  if (!resultado.success) {
    const errores = Object.entries(erroresZod(resultado.error)).map(([campo, mensaje]) => ({ campo, mensaje }))
    throw datosInvalidos("Revise los campos marcados", errores)
  }
  return resultado.data
}

function exigirVersion(actual: number, enviada: number | null | undefined) {
  if (enviada == null) throw datosInvalidos("Debe enviar la versión del registro para actualizar")
  if (enviada !== actual) {
    throw conflicto("Otro usuario modificó este registro. Recargue e intente de nuevo.", "version")
  }
}

function pagina<T>(items: T[], url: URL, sorts: Parameters<typeof paginar<T>>[2]): SpringPage<T> {
  try {
    return paginar(items, url, sorts)
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("SORT:")) {
      throw datosInvalidos(`No se puede ordenar por '${error.message.slice(5)}'`)
    }
    throw error
  }
}

function activoDe(url: URL) {
  const valor = url.searchParams.get("activo")
  if (valor === "true") return true
  if (valor === "false") return false
  return undefined
}

const transiciones: Record<EstadoCotizacion, EstadoCotizacion[]> = {
  BORRADOR: ["ENVIADA", "ANULADA"],
  ENVIADA: ["ACEPTADA", "RECHAZADA", "VENCIDA", "ANULADA"],
  ACEPTADA: ["ANULADA"],
  RECHAZADA: ["ANULADA"],
  VENCIDA: ["ANULADA"],
  ANULADA: [],
}

function crearBase() {
  const roles: Rol[] = [
    { id: 1, codigo: "ADMIN", nombre: "Administrador", activo: true },
    { id: 2, codigo: "VENTAS", nombre: "Ventas", activo: true },
    { id: 3, codigo: "TALLER", nombre: "Taller / producción", activo: true },
  ]
  const usuarios: UsuarioRow[] = [
    usuario(1, "rodrigo.admin@arvora.pe", "Rodrigo Castillo", 1, "admin1234"),
    usuario(2, "lucia.ventas@arvora.pe", "Lucía Mendoza", 2, "ventas123"),
    usuario(3, "marco.taller@arvora.pe", "Marco Huamán", 3, "taller123"),
  ]
  const unidades: UnidadMedida[] = [
    { id: 1, codigo: "UND", nombre: "Unidad", magnitud: "CONTEO", decimales: 0 },
    { id: 2, codigo: "PAR", nombre: "Par", magnitud: "CONTEO", decimales: 0 },
    { id: 3, codigo: "JGO", nombre: "Juego", magnitud: "CONTEO", decimales: 0 },
    { id: 4, codigo: "M", nombre: "Metro", magnitud: "LONGITUD", decimales: 3 },
    { id: 5, codigo: "M2", nombre: "Metro cuadrado", magnitud: "AREA", decimales: 4 },
    { id: 6, codigo: "KG", nombre: "Kilogramo", magnitud: "MASA", decimales: 3 },
    { id: 7, codigo: "L", nombre: "Litro", magnitud: "VOLUMEN", decimales: 3 },
    { id: 8, codigo: "GAL", nombre: "Galón", magnitud: "VOLUMEN", decimales: 3 },
  ]
  const categorias: Categoria[] = [
    cat(1, "Bases para mesa"),
    cat(2, "Mesas"),
    cat(3, "Sillas y bancas"),
    cat(4, "Estantes y otros muebles"),
    cat(5, "Estructuras metálicas"),
    cat(6, "Tubos y perfiles"),
    cat(7, "Planchas"),
    cat(8, "Tableros y madera"),
    cat(9, "Pintura y acabados"),
    cat(10, "Herrajes y accesorios"),
    cat(11, "Consumibles"),
    cat(12, "Servicios"),
    cat(13, "Melamina", 8),
  ]
  const almacenes: Almacen[] = [
    { id: 1, codigo: "TALLER", nombre: "Taller Villa El Salvador", activo: true },
    { id: 2, codigo: "MOSTRADOR", nombre: "Mostrador del taller", activo: true },
  ]
  const proveedores: Proveedor[] = [
    {
      id: 1,
      ruc: "20123456789",
      razonSocial: "Javisac S.A.C.",
      nombreComercial: "Javisac",
      contacto: "Luis Jara",
      telefono: "014567890",
      email: "ventas@javisac.pe",
      direccion: "Av. Argentina 2140, Lima",
      rubro: "Metal",
      notas: "Tubos y perfiles. Entrega a Villa El Salvador.",
      activo: true,
      createdAt: CREADO,
      updatedAt: CREADO,
    },
    {
      id: 2,
      ruc: "20444555666",
      razonSocial: "Tableros Lima E.I.R.L.",
      nombreComercial: "Tableros Lima",
      contacto: "Rosa Paredes",
      telefono: "987654321",
      email: "pedidos@tableroslima.pe",
      direccion: "Av. El Sol 880, Villa El Salvador",
      rubro: "Tableros",
      notas: "Melamina cedro caramelo 18 mm.",
      activo: true,
      createdAt: CREADO,
      updatedAt: CREADO,
    },
    {
      id: 3,
      ruc: "20555666777",
      razonSocial: "Pinturas del Sur S.A.C.",
      nombreComercial: null,
      contacto: "Carlos Díaz",
      telefono: "956111222",
      email: "cdiaz@pinturassur.pe",
      direccion: "Jr. Los Industriales 45, Lima",
      rubro: "Pintura",
      notas: null,
      activo: true,
      createdAt: CREADO,
      updatedAt: CREADO,
    },
  ]
  const clientes: Cliente[] = [
    {
      id: 1,
      tipoDocumento: "DNI",
      numeroDocumento: "45678912",
      nombre: "Ana Quispe",
      telefono: "999111222",
      email: "ana.quispe@gmail.com",
      direccion: "Calle Los Sauces 120",
      ciudad: "Lima",
      canalOrigen: "WHATSAPP",
      notas: "Mesa de comedor para 6. Color cedro caramelo.",
      activo: true,
      createdAt: CREADO,
      updatedAt: CREADO,
    },
    {
      id: 2,
      tipoDocumento: "RUC",
      numeroDocumento: "20600111222",
      nombre: "Constructora Los Olivos S.A.C.",
      telefono: "014440000",
      email: "compras@losolivos.pe",
      direccion: "Av. Universitaria 3400",
      ciudad: "Los Olivos",
      canalOrigen: "REFERIDO",
      notas: "Pide adelanto del 50% y plazo de 15 días.",
      activo: true,
      createdAt: CREADO,
      updatedAt: CREADO,
    },
    {
      id: 3,
      tipoDocumento: null,
      numeroDocumento: null,
      nombre: "Pedido TikTok — mesa comedor",
      telefono: "984000111",
      email: null,
      direccion: null,
      ciudad: "Lima",
      canalOrigen: "TIKTOK",
      notas: "Prospecto. Aún no deja documento.",
      activo: true,
      createdAt: CREADO,
      updatedAt: CREADO,
    },
  ]
  const articulos: ArticuloRow[] = [
    art(1, "TQ-50-10-6000", "Tubo cuadrado 2\" × 1.0 mm × 6 m", "MATERIA_PRIMA", 6, 1, {
      seCompra: true,
      largoMm: 6000,
      anchoMm: 50,
      altoMm: 50,
      espesorMm: 1,
      tipoCorte: "LINEAL",
      marca: "Aceros Arequipa",
      colorAcabado: "Negro",
      proveedorHabitualId: 1,
      costoReferencia: 48.5,
      stockMinimo: 8,
    }),
    art(2, "MEL-18-CC", "Melamina 18 mm cedro caramelo", "MATERIA_PRIMA", 13, 1, {
      seCompra: true,
      largoMm: 2440,
      anchoMm: 1830,
      espesorMm: 18,
      tipoCorte: "PANEL",
      respetaVeta: true,
      colorAcabado: "Cedro caramelo",
      proveedorHabitualId: 2,
      costoReferencia: 95,
      stockMinimo: 4,
      descripcion: "Plancha 2.44 × 1.83 m. La veta no se rota al cortar.",
    }),
    art(3, "MESA-120-80", "Mesa de comedor 1.20 × 0.80 m", "PRODUCTO", 2, 1, {
      seVende: true,
      largoMm: 1200,
      anchoMm: 800,
      altoMm: 750,
      colorAcabado: "Cedro caramelo / negro",
      costoReferencia: 180,
      precioVenta: 549,
      stockMinimo: 0,
      descripcion: "Tablero de melamina y base metálica. Precio de lista con IGV.",
    }),
    art(4, "SILLA-COM", "Silla metálica de comedor", "PRODUCTO", 3, 1, {
      seVende: true,
      colorAcabado: "Negro mate",
      costoReferencia: 70,
      precioVenta: 189,
      stockMinimo: 0,
    }),
    art(5, "BANCA-120", "Banca 1.20 m", "PRODUCTO", 3, 1, {
      seVende: true,
      largoMm: 1200,
      costoReferencia: 110,
      precioVenta: 320,
    }),
    art(6, "NIV-REG", "Nivelador regulable", "INSUMO", 10, 1, {
      seCompra: true,
      proveedorHabitualId: 1,
      costoReferencia: 1.8,
      stockMinimo: 20,
    }),
    art(7, "PINT-NEG", "Pintura electrostática negro mate", "INSUMO", 9, 6, {
      seCompra: true,
      proveedorHabitualId: 3,
      costoReferencia: 28,
      stockMinimo: 2,
      descripcion: "Se compra y se consume por kilogramo.",
    }),
    art(8, "WD-40", "WD-40 aerosol 11 oz", "REVENTA", 11, 1, {
      seCompra: true,
      seVende: true,
      marca: "WD-40",
      costoReferencia: 18,
      precioVenta: 28,
      stockMinimo: 6,
    }),
    art(9, "SRV-PINT", "Servicio de pintado electrostático", "SERVICIO", 12, 1, {
      seVende: true,
      controlaStock: false,
      precioVenta: 80,
      descripcion: "Tercerizado. No mueve inventario.",
    }),
  ]
  const imagenes: ArticuloImagen[] = [
    { id: 1, articuloId: 3, url: "/images/logoArvora.jpg", orden: 0, principal: true },
  ]
  const precios: PrecioEscala[] = [
    { id: 1, articuloId: 3, cantidadMinima: 1, precioUnitario: 549 },
    { id: 2, articuloId: 3, cantidadMinima: 4, precioUnitario: 519 },
    { id: 3, articuloId: 3, cantidadMinima: 10, precioUnitario: 489 },
  ]
  const componentes: ComponenteRow[] = [
    {
      id: 1,
      productoId: 3,
      materialId: 2,
      nombrePieza: "Tablero",
      cantidadPiezas: 1,
      largoMm: 1200,
      anchoMm: 800,
      toleranciaMenosMm: 1,
      toleranciaMasMm: 0,
      cantidad: null,
      mermaPct: 0,
      orden: 1,
      notas: "No rotar: respeta la veta del cedro.",
    },
    {
      id: 2,
      productoId: 3,
      materialId: 1,
      nombrePieza: "Pata",
      cantidadPiezas: 4,
      largoMm: 730,
      anchoMm: null,
      toleranciaMenosMm: 0,
      toleranciaMasMm: 1,
      cantidad: null,
      mermaPct: 2,
      orden: 2,
      notas: null,
    },
    {
      id: 3,
      productoId: 3,
      materialId: 7,
      nombrePieza: "Pintura de la base",
      cantidadPiezas: 1,
      largoMm: null,
      anchoMm: null,
      toleranciaMenosMm: 0,
      toleranciaMasMm: 0,
      cantidad: 0.15,
      mermaPct: 0,
      orden: 3,
      notas: null,
    },
    {
      id: 4,
      productoId: 3,
      materialId: 6,
      nombrePieza: "Niveladores",
      cantidadPiezas: 4,
      largoMm: null,
      anchoMm: null,
      toleranciaMenosMm: 0,
      toleranciaMasMm: 0,
      cantidad: 4,
      mermaPct: 0,
      orden: 4,
      notas: null,
    },
  ]
  const movimientos: MovimientoRow[] = [
    mov(1, "2026-10-02T09:00:00-05:00", "SALDO_INICIAL", 1, 1, 26, 48.5, null, 3, "Inventario de apertura"),
    mov(2, "2026-10-02T09:10:00-05:00", "SALDO_INICIAL", 1, 2, 4, 48.5, null, 3, "Tubos en mostrador"),
    mov(3, "2026-10-03T11:20:00-05:00", "COMPRA", 2, 1, 8, 95, 2, 1, "Factura F001-4521", "F001-4521"),
    mov(4, "2026-10-03T11:40:00-05:00", "COMPRA", 6, 1, 15, 1.8, 1, 1, null, "GR-7781"),
    mov(5, "2026-10-04T08:15:00-05:00", "COMPRA", 7, 1, 5, 28, 3, 1, null, "F001-90"),
    mov(6, "2026-10-04T08:30:00-05:00", "SALDO_INICIAL", 8, 1, 4, 18, null, 3, null),
    mov(7, "2026-10-06T16:00:00-05:00", "VENTA", 8, 1, -1, null, null, 2, "Venta de mostrador"),
    mov(8, "2026-10-07T10:00:00-05:00", "CONSUMO_PRODUCCION", 7, 1, -0.15, null, null, 3, "Pintado de una base de mesa"),
  ]
  const lineas: CotizacionLinea[] = []
  const cotizaciones: CotizacionRow[] = []
  sembrarCotizacion(cotizaciones, lineas, {
    id: 1,
    numero: "COT-2026-00005",
    clienteId: 2,
    usuarioId: 2,
    fechaEmision: "2026-09-20",
    validaHasta: "2026-10-05",
    estado: "ACEPTADA",
    descuento: 0,
    adelantoPct: 50,
    plazoEntregaDias: 15,
    condiciones: "Adelanto 50% para iniciar. Saldo contra entrega en Villa El Salvador.",
    notasInternas: "Cliente recurrente de estructuras.",
    lineas: [
      {
        id: 1,
        linea: 1,
        articuloId: null,
        descripcion: "Estructura metálica para toldo 4 × 3 m",
        largoMm: 4000,
        anchoMm: 3000,
        altoMm: 2800,
        cantidad: 1,
        unidadCodigo: "UND",
        precioUnitario: 2800,
        descuento: 0,
        importe: 2800,
        costoUnitarioEst: null,
      },
    ],
  })
  sembrarCotizacion(cotizaciones, lineas, {
    id: 2,
    numero: "COT-2026-00006",
    clienteId: 1,
    usuarioId: 2,
    fechaEmision: "2026-10-06",
    validaHasta: "2026-10-20",
    estado: "ENVIADA",
    descuento: 0,
    adelantoPct: 50,
    plazoEntregaDias: 12,
    condiciones: "Precios con IGV. Fabricación bajo pedido.",
    notasInternas: null,
    lineas: [
      lineaDeArticulo(2, 1, 3, 2, 549, 180),
      lineaDeArticulo(3, 2, 4, 6, 189, 70),
    ],
  })
  sembrarCotizacion(cotizaciones, lineas, {
    id: 3,
    numero: "COT-2026-00007",
    clienteId: 3,
    usuarioId: 2,
    fechaEmision: "2026-10-09",
    validaHasta: "2026-10-30",
    estado: "BORRADOR",
    descuento: 0,
    adelantoPct: 50,
    plazoEntregaDias: 10,
    condiciones: "Válida por 21 días. El color de tablero es cedro caramelo.",
    notasInternas: "Confirmar medidas antes de enviar.",
    lineas: [
      {
        ...lineaDeArticulo(4, 1, 3, 1, 549, 180),
        largoMm: 1200,
        anchoMm: 800,
        altoMm: 750,
      },
    ],
  })

  return {
    nextId: 100,
    roles,
    usuarios,
    unidades,
    categorias,
    almacenes,
    proveedores,
    clientes,
    articulos,
    imagenes,
    precios,
    componentes,
    movimientos,
    cotizaciones,
    lineas,
  }
}

function usuario(id: number, email: string, nombre: string, rolId: number, password: string): UsuarioRow {
  return {
    id,
    email,
    nombre,
    rolId,
    rolCodigo: "",
    rolNombre: "",
    activo: true,
    ultimoAcceso: id === 2 ? "2026-10-08T18:40:00-05:00" : null,
    createdAt: CREADO,
    updatedAt: CREADO,
    passwordHash: `bcrypt-mock:${password}`,
  }
}

function cat(id: number, nombre: string, padreId: number | null = null): Categoria {
  return { id, nombre, padreId, padreNombre: null, activo: true }
}

function art(
  id: number,
  codigo: string,
  nombre: string,
  tipo: ArticuloRow["tipo"],
  categoriaId: number,
  unidadMedidaId: number,
  extra: Partial<ArticuloRow>,
): ArticuloRow {
  return {
    id,
    codigo,
    nombre,
    descripcion: extra.descripcion ?? null,
    tipo,
    categoriaId,
    unidadMedidaId,
    seCompra: extra.seCompra ?? false,
    seVende: extra.seVende ?? false,
    controlaStock: extra.controlaStock ?? tipo !== "SERVICIO",
    largoMm: extra.largoMm ?? null,
    anchoMm: extra.anchoMm ?? null,
    altoMm: extra.altoMm ?? null,
    espesorMm: extra.espesorMm ?? null,
    diametroMm: extra.diametroMm ?? null,
    tipoCorte: extra.tipoCorte ?? "NINGUNO",
    respetaVeta: extra.respetaVeta ?? false,
    marca: extra.marca ?? null,
    colorAcabado: extra.colorAcabado ?? null,
    proveedorHabitualId: extra.proveedorHabitualId ?? null,
    costoReferencia: extra.costoReferencia ?? null,
    precioVenta: extra.precioVenta ?? null,
    stockMinimo: extra.stockMinimo ?? 0,
    activo: true,
    version: 0,
    createdAt: CREADO,
    updatedAt: CREADO,
  }
}

function mov(
  id: number,
  fecha: string,
  tipo: TipoMovimiento,
  articuloId: number,
  almacenId: number,
  cantidad: number,
  costoUnitario: number | null,
  proveedorId: number | null,
  usuarioId: number,
  nota: string | null,
  documentoRef: string | null = null,
): MovimientoRow {
  return {
    id,
    fecha,
    tipo,
    articuloId,
    almacenId,
    cantidad,
    costoUnitario,
    proveedorId,
    cotizacionId: null,
    documentoRef,
    usuarioId,
    nota,
    createdAt: fecha,
  }
}

function lineaDeArticulo(
  id: number,
  linea: number,
  articuloId: number,
  cantidad: number,
  precio: number,
  costo: number,
): CotizacionLinea {
  return {
    id,
    linea,
    articuloId,
    descripcion: "",
    largoMm: null,
    anchoMm: null,
    altoMm: null,
    cantidad,
    unidadCodigo: "UND",
    precioUnitario: precio,
    descuento: 0,
    importe: importeLinea(cantidad, precio, 0),
    costoUnitarioEst: costo,
  }
}

function sembrarCotizacion(
  cotizaciones: CotizacionRow[],
  lineas: CotizacionLinea[],
  input: Omit<CotizacionRow, "subtotal" | "igv" | "total" | "moneda" | "preciosIncluyenIgv" | "tasaIgv" | "version" | "createdAt" | "updatedAt"> & {
    lineas: CotizacionLinea[]
  },
) {
  const nombres: Record<number, string> = {
    3: "Mesa de comedor 1.20 × 0.80 m",
    4: "Silla metálica de comedor",
  }
  const detalle = input.lineas.map((linea) => ({
    ...linea,
    descripcion: linea.descripcion || nombres[linea.articuloId ?? 0] || linea.descripcion,
    importe: importeLinea(linea.cantidad, linea.precioUnitario, linea.descuento),
  }))
  const totales = previewTotales({
    importes: detalle.map((linea) => linea.importe),
    descuento: input.descuento,
    tasaIgv: 0.18,
    preciosIncluyenIgv: true,
  })
  if (esErrorTotales(totales)) throw new Error(totales.error)
  lineas.push(...detalle)
  cotizaciones.push({
    id: input.id,
    numero: input.numero,
    clienteId: input.clienteId,
    usuarioId: input.usuarioId,
    fechaEmision: input.fechaEmision,
    validaHasta: input.validaHasta,
    estado: input.estado,
    moneda: "PEN",
    preciosIncluyenIgv: true,
    tasaIgv: 0.18,
    subtotal: totales.subtotal,
    descuento: totales.descuento,
    igv: totales.igv,
    total: totales.total,
    adelantoPct: input.adelantoPct,
    plazoEntregaDias: input.plazoEntregaDias,
    condiciones: input.condiciones,
    notasInternas: input.notasInternas,
    version: 0,
    createdAt: CREADO,
    updatedAt: CREADO,
  })
}

const db = crearBase()

function rolDe(id: number) {
  const rol = db.roles.find((item) => item.id === id)
  if (!rol) throw noEncontrado("el rol", id)
  return rol
}

function usuarioDe(id: number) {
  const usuario = db.usuarios.find((item) => item.id === id)
  if (!usuario) throw noEncontrado("el usuario", id)
  return usuario
}

function clienteDe(id: number) {
  const cliente = db.clientes.find((item) => item.id === id)
  if (!cliente) throw noEncontrado("el cliente", id)
  return cliente
}

function proveedorDe(id: number) {
  const proveedor = db.proveedores.find((item) => item.id === id)
  if (!proveedor) throw noEncontrado("el proveedor", id)
  return proveedor
}

function categoriaDe(id: number) {
  const categoria = db.categorias.find((item) => item.id === id)
  if (!categoria) throw noEncontrado("la categoría", id)
  return categoria
}

function unidadDe(id: number) {
  const unidad = db.unidades.find((item) => item.id === id)
  if (!unidad) throw noEncontrado("la unidad de medida", id)
  return unidad
}

function almacenDe(id: number) {
  const almacen = db.almacenes.find((item) => item.id === id)
  if (!almacen) throw noEncontrado("el almacén", id)
  return almacen
}

function articuloDe(id: number) {
  const articulo = db.articulos.find((item) => item.id === id)
  if (!articulo) throw noEncontrado("el artículo", id)
  return articulo
}

function cotizacionDe(id: number) {
  const cotizacion = db.cotizaciones.find((item) => item.id === id)
  if (!cotizacion) throw noEncontrado("la cotización", id)
  return cotizacion
}

function presentarCategoria(categoria: Categoria): Categoria {
  const padre = categoria.padreId == null ? null : db.categorias.find((item) => item.id === categoria.padreId)
  return { ...categoria, padreNombre: padre?.nombre ?? null }
}

function presentarUsuario(usuario: UsuarioRow): Usuario {
  const rol = db.roles.find((item) => item.id === usuario.rolId)
  return {
    id: usuario.id,
    email: usuario.email,
    nombre: usuario.nombre,
    rolId: usuario.rolId,
    rolCodigo: rol?.codigo ?? "",
    rolNombre: rol?.nombre ?? "",
    activo: usuario.activo,
    ultimoAcceso: usuario.ultimoAcceso,
    createdAt: usuario.createdAt,
    updatedAt: usuario.updatedAt,
  }
}

function presentarArticulo(articulo: ArticuloRow): Articulo {
  const categoria = articulo.categoriaId == null ? null : db.categorias.find((item) => item.id === articulo.categoriaId)
  const unidad = db.unidades.find((item) => item.id === articulo.unidadMedidaId)
  const proveedor =
    articulo.proveedorHabitualId == null
      ? null
      : db.proveedores.find((item) => item.id === articulo.proveedorHabitualId)
  return {
    ...articulo,
    categoriaNombre: categoria?.nombre ?? null,
    unidadMedidaCodigo: unidad?.codigo ?? "",
    proveedorNombre: proveedor?.razonSocial ?? null,
    preciosIncluyenIgv: true,
  }
}

function presentarMovimiento(movimiento: MovimientoRow): Movimiento {
  const articulo = db.articulos.find((item) => item.id === movimiento.articuloId)
  const almacen = db.almacenes.find((item) => item.id === movimiento.almacenId)
  const usuario = db.usuarios.find((item) => item.id === movimiento.usuarioId)
  return {
    ...movimiento,
    articuloCodigo: articulo?.codigo ?? "",
    articuloNombre: articulo?.nombre ?? "",
    almacenNombre: almacen?.nombre ?? "",
    usuarioNombre: usuario?.nombre ?? "",
  }
}

function presentarComponente(componente: ComponenteRow): Componente {
  const material = db.articulos.find((item) => item.id === componente.materialId)
  return {
    ...componente,
    materialCodigo: material?.codigo ?? "",
    materialNombre: material?.nombre ?? "",
  }
}

function lineasDe(cotizacionId: number) {
  return db.lineas
    .filter((linea) => lineaCotizacion(linea) === cotizacionId)
    .sort((a, b) => a.linea - b.linea)
}

const lineaCotizacionId = new Map<number, number>()

function lineaCotizacion(linea: CotizacionLinea) {
  return lineaCotizacionId.get(linea.id) ?? 0
}

function recordarLinea(lineaId: number, cotizacionId: number) {
  lineaCotizacionId.set(lineaId, cotizacionId)
}

for (const linea of db.lineas) {
  const cotizacion = db.cotizaciones.find((item) => {
    if (linea.id <= 1) return item.id === 1
    if (linea.id <= 3) return item.id === 2
    return item.id === 3
  })
  if (cotizacion) recordarLinea(linea.id, cotizacion.id)
}

function recalcularCotizacion(cotizacion: CotizacionRow) {
  const detalle = lineasDe(cotizacion.id)
  const totales = previewTotales({
    importes: detalle.map((linea) => linea.importe),
    descuento: cotizacion.descuento,
    tasaIgv: cotizacion.tasaIgv,
    preciosIncluyenIgv: cotizacion.preciosIncluyenIgv,
  })
  if (esErrorTotales(totales)) {
    throw datosInvalidos(totales.error)
  }
  cotizacion.subtotal = totales.subtotal
  cotizacion.descuento = totales.descuento
  cotizacion.igv = totales.igv
  cotizacion.total = totales.total
  cotizacion.updatedAt = ahora()
  cotizacion.version += 1
}

function presentarCotizacion(cotizacion: CotizacionRow): Cotizacion {
  const cliente = db.clientes.find((item) => item.id === cotizacion.clienteId)
  const usuario = db.usuarios.find((item) => item.id === cotizacion.usuarioId)
  return {
    ...cotizacion,
    clienteNombre: cliente?.nombre ?? "",
    usuarioNombre: usuario?.nombre ?? "",
    lineas: lineasDe(cotizacion.id),
  }
}

function generarNumero(fecha: string | null | undefined) {
  const anio = (fecha ?? ahora()).slice(0, 4)
  const prefijo = `COT-${anio}-`
  const numeros = db.cotizaciones
    .map((item) => item.numero)
    .filter((numero) => numero.startsWith(prefijo))
    .sort()
  const ultimo = numeros.at(-1)
  const siguiente = ultimo ? Number(ultimo.slice(prefijo.length)) + 1 : 1
  return `${prefijo}${String(siguiente).padStart(5, "0")}`
}

function aplicarLinea(linea: CotizacionLinea, request: z.infer<typeof lineaSchema>, creacion: boolean) {
  if (request.articuloId != null) {
    const articulo = articuloDe(request.articuloId)
    const cambio = linea.articuloId !== articulo.id
    linea.articuloId = articulo.id
    if (creacion || cambio) linea.costoUnitarioEst = articulo.costoReferencia
    if (request.precioUnitario != null) linea.precioUnitario = request.precioUnitario
    else if (creacion || cambio || linea.precioUnitario == null) {
      if (articulo.precioVenta == null) {
        throw datosInvalidos("El artículo no tiene precio de lista; indique el precio unitario")
      }
      linea.precioUnitario = articulo.precioVenta
    }
    linea.descripcion = vacio(request.descripcion) ?? articulo.nombre
    const unidad = db.unidades.find((item) => item.id === articulo.unidadMedidaId)
    linea.unidadCodigo = vacio(request.unidadCodigo) ?? unidad?.codigo ?? "UND"
  } else {
    if (!vacio(request.descripcion)) throw datosInvalidos("La descripción es obligatoria para un ítem sin artículo")
    if (request.precioUnitario == null) throw datosInvalidos("El precio unitario es obligatorio para un ítem sin artículo")
    linea.articuloId = null
    linea.costoUnitarioEst = null
    linea.descripcion = request.descripcion!.trim()
    linea.precioUnitario = request.precioUnitario
    linea.unidadCodigo = vacio(request.unidadCodigo) ?? "UND"
  }
  linea.cantidad = request.cantidad
  linea.descuento = request.descuento ?? 0
  linea.largoMm = request.largoMm ?? null
  linea.anchoMm = request.anchoMm ?? null
  linea.altoMm = request.altoMm ?? null
  linea.importe = importeLinea(linea.cantidad, linea.precioUnitario, linea.descuento)
  if (linea.importe < 0) throw datosInvalidos("El descuento de la línea no puede superar el importe")
}

function exigirBorrador(cotizacion: CotizacionRow) {
  if (cotizacion.estado !== "BORRADOR") {
    throw conflicto("Las líneas solo se editan mientras la cotización está en borrador")
  }
}

function validarTransicion(desde: EstadoCotizacion, hacia: EstadoCotizacion) {
  if (desde === hacia) return
  if (!transiciones[desde].includes(hacia)) {
    throw conflicto(`No se puede pasar de ${desde} a ${hacia}`)
  }
}

export const store = {
  listarRoles(url: URL) {
    const texto = url.searchParams.get("texto")
    const activo = activoDe(url)
    const filas = db.roles.filter((rol) => {
      if (activo != null && rol.activo !== activo) return false
      return coincideTexto(texto, rol.codigo, rol.nombre)
    })
    return pagina(filas, url, { codigo: (rol) => rol.codigo, nombre: (rol) => rol.nombre, id: (rol) => rol.id })
  },
  obtenerRol(id: number) {
    return rolDe(id)
  },
  crearRol(body: unknown) {
    const request = validar(rolSchema, body)
    if (db.roles.some((rol) => rol.codigo === request.codigo)) {
      throw conflicto("Ya existe un rol con ese código", "duplicado")
    }
    const creado: Rol = {
      id: db.nextId++,
      codigo: request.codigo,
      nombre: request.nombre,
      activo: request.activo ?? true,
    }
    db.roles.push(creado)
    return creado
  },
  actualizarRol(id: number, body: unknown) {
    const actual = rolDe(id)
    const request = validar(rolSchema, body)
    if (db.roles.some((rol) => rol.id !== id && rol.codigo === request.codigo)) {
      throw conflicto("Ya existe un rol con ese código", "duplicado")
    }
    actual.codigo = request.codigo
    actual.nombre = request.nombre
    if (request.activo != null) actual.activo = request.activo
    return actual
  },
  eliminarRol(id: number) {
    rolDe(id).activo = false
  },

  listarUsuarios(url: URL) {
    const texto = url.searchParams.get("texto")
    const activo = activoDe(url)
    const rolId = numeroParam(url, "rolId")
    const filas = db.usuarios
      .filter((usuario) => {
        if (activo != null && usuario.activo !== activo) return false
        if (rolId != null && usuario.rolId !== rolId) return false
        return coincideTexto(texto, usuario.email, usuario.nombre)
      })
      .map(presentarUsuario)
    return pagina(filas, url, {
      nombre: (usuario) => usuario.nombre,
      email: (usuario) => usuario.email,
      id: (usuario) => usuario.id,
    })
  },
  obtenerUsuario(id: number) {
    return presentarUsuario(usuarioDe(id))
  },
  crearUsuario(body: unknown) {
    const request = validar(usuarioSchema(true), body)
    if (db.usuarios.some((usuario) => usuario.email.toLowerCase() === request.email.toLowerCase())) {
      throw conflicto("Ya existe un usuario con ese correo", "duplicado")
    }
    rolDe(request.rolId)
    const creado: UsuarioRow = {
      id: db.nextId++,
      email: request.email,
      nombre: request.nombre,
      rolId: request.rolId,
      rolCodigo: "",
      rolNombre: "",
      activo: request.activo ?? true,
      ultimoAcceso: null,
      createdAt: ahora(),
      updatedAt: ahora(),
      passwordHash: `bcrypt-mock:${request.password}`,
    }
    db.usuarios.push(creado)
    return presentarUsuario(creado)
  },
  actualizarUsuario(id: number, body: unknown) {
    const actual = usuarioDe(id)
    const request = validar(usuarioSchema(false), body)
    if (db.usuarios.some((usuario) => usuario.id !== id && usuario.email.toLowerCase() === request.email.toLowerCase())) {
      throw conflicto("Ya existe un usuario con ese correo", "duplicado")
    }
    rolDe(request.rolId)
    actual.email = request.email
    actual.nombre = request.nombre
    actual.rolId = request.rolId
    if (request.password) actual.passwordHash = `bcrypt-mock:${request.password}`
    if (request.activo != null) actual.activo = request.activo
    actual.updatedAt = ahora()
    return presentarUsuario(actual)
  },
  eliminarUsuario(id: number) {
    usuarioDe(id).activo = false
  },

  listarClientes(url: URL) {
    const texto = url.searchParams.get("texto")
    const activo = activoDe(url)
    const filas = db.clientes.filter((cliente) => {
      if (activo != null && cliente.activo !== activo) return false
      return coincideTexto(texto, cliente.nombre, cliente.telefono, cliente.email, cliente.numeroDocumento)
    })
    return pagina(filas, url, { nombre: (cliente) => cliente.nombre, id: (cliente) => cliente.id })
  },
  obtenerCliente(id: number) {
    return clienteDe(id)
  },
  crearCliente(body: unknown) {
    const request = validar(clienteSchema, body)
    asegurarDocumentoUnico(null, request.tipoDocumento ?? null, request.numeroDocumento ?? null)
    const creado: Cliente = {
      id: db.nextId++,
      tipoDocumento: request.tipoDocumento ?? null,
      numeroDocumento: vacio(request.numeroDocumento),
      nombre: request.nombre,
      telefono: vacio(request.telefono),
      email: vacio(request.email),
      direccion: vacio(request.direccion),
      ciudad: vacio(request.ciudad),
      canalOrigen: request.canalOrigen ?? null,
      notas: vacio(request.notas),
      activo: request.activo ?? true,
      createdAt: ahora(),
      updatedAt: ahora(),
    }
    db.clientes.push(creado)
    return creado
  },
  actualizarCliente(id: number, body: unknown) {
    const actual = clienteDe(id)
    const request = validar(clienteSchema, body)
    asegurarDocumentoUnico(id, request.tipoDocumento ?? null, request.numeroDocumento ?? null)
    Object.assign(actual, {
      tipoDocumento: request.tipoDocumento ?? null,
      numeroDocumento: vacio(request.numeroDocumento),
      nombre: request.nombre,
      telefono: vacio(request.telefono),
      email: vacio(request.email),
      direccion: vacio(request.direccion),
      ciudad: vacio(request.ciudad),
      canalOrigen: request.canalOrigen ?? null,
      notas: vacio(request.notas),
      updatedAt: ahora(),
    })
    if (request.activo != null) actual.activo = request.activo
    return actual
  },
  eliminarCliente(id: number) {
    clienteDe(id).activo = false
  },

  listarProveedores(url: URL) {
    const texto = url.searchParams.get("texto")
    const activo = activoDe(url)
    const filas = db.proveedores.filter((proveedor) => {
      if (activo != null && proveedor.activo !== activo) return false
      return coincideTexto(texto, proveedor.razonSocial, proveedor.nombreComercial, proveedor.ruc, proveedor.contacto)
    })
    return pagina(filas, url, {
      razonSocial: (proveedor) => proveedor.razonSocial,
      ruc: (proveedor) => proveedor.ruc,
      id: (proveedor) => proveedor.id,
    })
  },
  obtenerProveedor(id: number) {
    return proveedorDe(id)
  },
  crearProveedor(body: unknown) {
    const request = validar(proveedorSchema, body)
    const ruc = vacio(request.ruc)
    if (ruc && db.proveedores.some((proveedor) => proveedor.ruc === ruc)) {
      throw conflicto("Ya existe un proveedor con ese RUC", "duplicado")
    }
    const creado: Proveedor = {
      id: db.nextId++,
      ruc,
      razonSocial: request.razonSocial,
      nombreComercial: vacio(request.nombreComercial),
      contacto: vacio(request.contacto),
      telefono: vacio(request.telefono),
      email: vacio(request.email),
      direccion: vacio(request.direccion),
      rubro: vacio(request.rubro),
      notas: vacio(request.notas),
      activo: request.activo ?? true,
      createdAt: ahora(),
      updatedAt: ahora(),
    }
    db.proveedores.push(creado)
    return creado
  },
  actualizarProveedor(id: number, body: unknown) {
    const actual = proveedorDe(id)
    const request = validar(proveedorSchema, body)
    const ruc = vacio(request.ruc)
    if (ruc && db.proveedores.some((proveedor) => proveedor.id !== id && proveedor.ruc === ruc)) {
      throw conflicto("Ya existe un proveedor con ese RUC", "duplicado")
    }
    Object.assign(actual, {
      ruc,
      razonSocial: request.razonSocial,
      nombreComercial: vacio(request.nombreComercial),
      contacto: vacio(request.contacto),
      telefono: vacio(request.telefono),
      email: vacio(request.email),
      direccion: vacio(request.direccion),
      rubro: vacio(request.rubro),
      notas: vacio(request.notas),
      updatedAt: ahora(),
    })
    if (request.activo != null) actual.activo = request.activo
    return actual
  },
  eliminarProveedor(id: number) {
    proveedorDe(id).activo = false
  },

  listarCategorias(url: URL) {
    const texto = url.searchParams.get("texto")
    const activo = activoDe(url)
    const filas = db.categorias
      .filter((categoria) => {
        if (activo != null && categoria.activo !== activo) return false
        return coincideTexto(texto, categoria.nombre)
      })
      .map(presentarCategoria)
    return pagina(filas, url, { nombre: (categoria) => categoria.nombre, id: (categoria) => categoria.id })
  },
  obtenerCategoria(id: number) {
    return presentarCategoria(categoriaDe(id))
  },
  crearCategoria(body: unknown) {
    const request = validar(categoriaSchema, body)
    if (db.categorias.some((categoria) => categoria.nombre.toLowerCase() === request.nombre.toLowerCase())) {
      throw conflicto("Ya existe una categoría con ese nombre", "duplicado")
    }
    if (request.padreId != null) categoriaDe(request.padreId)
    const creada: Categoria = {
      id: db.nextId++,
      nombre: request.nombre,
      padreId: request.padreId ?? null,
      padreNombre: null,
      activo: request.activo ?? true,
    }
    db.categorias.push(creada)
    return presentarCategoria(creada)
  },
  actualizarCategoria(id: number, body: unknown) {
    const actual = categoriaDe(id)
    const request = validar(categoriaSchema, body)
    if (request.padreId === id) throw datosInvalidos("Una categoría no puede ser su propio padre")
    if (db.categorias.some((categoria) => categoria.id !== id && categoria.nombre.toLowerCase() === request.nombre.toLowerCase())) {
      throw conflicto("Ya existe una categoría con ese nombre", "duplicado")
    }
    if (request.padreId != null) categoriaDe(request.padreId)
    actual.nombre = request.nombre
    actual.padreId = request.padreId ?? null
    if (request.activo != null) actual.activo = request.activo
    return presentarCategoria(actual)
  },
  eliminarCategoria(id: number) {
    categoriaDe(id).activo = false
  },

  listarUnidades(url: URL) {
    const texto = url.searchParams.get("texto")
    const filas = db.unidades.filter((unidad) => coincideTexto(texto, unidad.codigo, unidad.nombre))
    return pagina(filas, url, { codigo: (unidad) => unidad.codigo, nombre: (unidad) => unidad.nombre, id: (unidad) => unidad.id })
  },
  obtenerUnidad(id: number) {
    return unidadDe(id)
  },
  crearUnidad(body: unknown) {
    const request = validar(unidadSchema, body)
    if (db.unidades.some((unidad) => unidad.codigo === request.codigo)) {
      throw conflicto("Ya existe una unidad de medida con ese código", "duplicado")
    }
    const creada: UnidadMedida = { id: db.nextId++, ...request, decimales: request.decimales }
    db.unidades.push(creada)
    return creada
  },
  actualizarUnidad(id: number, body: unknown) {
    const actual = unidadDe(id)
    const request = validar(unidadSchema, body)
    if (db.unidades.some((unidad) => unidad.id !== id && unidad.codigo === request.codigo)) {
      throw conflicto("Ya existe una unidad de medida con ese código", "duplicado")
    }
    Object.assign(actual, request)
    return actual
  },
  eliminarUnidad(id: number) {
    unidadDe(id)
    if (db.articulos.some((articulo) => articulo.unidadMedidaId === id)) {
      throw conflicto("No se puede completar porque el registro está en uso o la referencia no existe", "en_uso")
    }
    db.unidades = db.unidades.filter((unidad) => unidad.id !== id)
  },

  listarAlmacenes(url: URL) {
    const texto = url.searchParams.get("texto")
    const activo = activoDe(url)
    const filas = db.almacenes.filter((almacen) => {
      if (activo != null && almacen.activo !== activo) return false
      return coincideTexto(texto, almacen.codigo, almacen.nombre)
    })
    return pagina(filas, url, { codigo: (almacen) => almacen.codigo, nombre: (almacen) => almacen.nombre, id: (almacen) => almacen.id })
  },
  obtenerAlmacen(id: number) {
    return almacenDe(id)
  },
  crearAlmacen(body: unknown) {
    const request = validar(almacenSchema, body)
    if (db.almacenes.some((almacen) => almacen.codigo === request.codigo)) {
      throw conflicto("Ya existe un almacén con ese código", "duplicado")
    }
    const creado: Almacen = { id: db.nextId++, codigo: request.codigo, nombre: request.nombre, activo: request.activo ?? true }
    db.almacenes.push(creado)
    return creado
  },
  actualizarAlmacen(id: number, body: unknown) {
    const actual = almacenDe(id)
    const request = validar(almacenSchema, body)
    if (db.almacenes.some((almacen) => almacen.id !== id && almacen.codigo === request.codigo)) {
      throw conflicto("Ya existe un almacén con ese código", "duplicado")
    }
    actual.codigo = request.codigo
    actual.nombre = request.nombre
    if (request.activo != null) actual.activo = request.activo
    return actual
  },
  eliminarAlmacen(id: number) {
    almacenDe(id).activo = false
  },

  listarArticulos(url: URL) {
    const texto = url.searchParams.get("texto")
    const activo = activoDe(url)
    const tipo = url.searchParams.get("tipo")
    const categoriaId = numeroParam(url, "categoriaId")
    const filas = db.articulos
      .filter((articulo) => {
        if (activo != null && articulo.activo !== activo) return false
        if (tipo && articulo.tipo !== tipo) return false
        if (categoriaId != null && articulo.categoriaId !== categoriaId) return false
        return coincideTexto(texto, articulo.codigo, articulo.nombre)
      })
      .map(presentarArticulo)
    return pagina(filas, url, {
      nombre: (articulo) => articulo.nombre,
      codigo: (articulo) => articulo.codigo,
      tipo: (articulo) => articulo.tipo,
      id: (articulo) => articulo.id,
    })
  },
  obtenerArticulo(id: number) {
    return presentarArticulo(articuloDe(id))
  },
  crearArticulo(body: unknown) {
    const request = validar(articuloSchema, body)
    if (db.articulos.some((articulo) => articulo.codigo === request.codigo)) {
      throw conflicto("Ya existe un artículo con ese código", "duplicado")
    }
    if (request.categoriaId != null) categoriaDe(request.categoriaId)
    unidadDe(request.unidadMedidaId)
    if (request.proveedorHabitualId != null) proveedorDe(request.proveedorHabitualId)
    const creado: ArticuloRow = {
      id: db.nextId++,
      codigo: request.codigo,
      nombre: request.nombre,
      descripcion: vacio(request.descripcion),
      tipo: request.tipo,
      categoriaId: request.categoriaId ?? null,
      unidadMedidaId: request.unidadMedidaId,
      seCompra: request.seCompra ?? false,
      seVende: request.seVende ?? false,
      controlaStock: request.tipo === "SERVICIO" ? false : (request.controlaStock ?? true),
      largoMm: request.largoMm ?? null,
      anchoMm: request.anchoMm ?? null,
      altoMm: request.altoMm ?? null,
      espesorMm: request.espesorMm ?? null,
      diametroMm: request.diametroMm ?? null,
      tipoCorte: request.tipoCorte ?? "NINGUNO",
      respetaVeta: request.respetaVeta ?? false,
      marca: vacio(request.marca),
      colorAcabado: vacio(request.colorAcabado),
      proveedorHabitualId: request.proveedorHabitualId ?? null,
      costoReferencia: request.costoReferencia ?? null,
      precioVenta: request.precioVenta ?? null,
      stockMinimo: request.stockMinimo ?? 0,
      activo: request.activo ?? true,
      version: 0,
      createdAt: ahora(),
      updatedAt: ahora(),
    }
    db.articulos.push(creado)
    return presentarArticulo(creado)
  },
  actualizarArticulo(id: number, body: unknown) {
    const actual = articuloDe(id)
    const request = validar(articuloSchema, body)
    exigirVersion(actual.version, request.version)
    if (db.articulos.some((articulo) => articulo.id !== id && articulo.codigo === request.codigo)) {
      throw conflicto("Ya existe un artículo con ese código", "duplicado")
    }
    if (request.categoriaId != null) categoriaDe(request.categoriaId)
    unidadDe(request.unidadMedidaId)
    if (request.proveedorHabitualId != null) proveedorDe(request.proveedorHabitualId)
    Object.assign(actual, {
      codigo: request.codigo,
      nombre: request.nombre,
      descripcion: vacio(request.descripcion),
      tipo: request.tipo,
      categoriaId: request.categoriaId ?? null,
      unidadMedidaId: request.unidadMedidaId,
      seCompra: request.seCompra ?? false,
      seVende: request.seVende ?? false,
      controlaStock: request.tipo === "SERVICIO" ? false : (request.controlaStock ?? actual.controlaStock),
      largoMm: request.largoMm ?? null,
      anchoMm: request.anchoMm ?? null,
      altoMm: request.altoMm ?? null,
      espesorMm: request.espesorMm ?? null,
      diametroMm: request.diametroMm ?? null,
      tipoCorte: request.tipoCorte ?? "NINGUNO",
      respetaVeta: request.respetaVeta ?? false,
      marca: vacio(request.marca),
      colorAcabado: vacio(request.colorAcabado),
      proveedorHabitualId: request.proveedorHabitualId ?? null,
      costoReferencia: request.costoReferencia ?? null,
      precioVenta: request.precioVenta ?? null,
      stockMinimo: request.stockMinimo ?? 0,
      updatedAt: ahora(),
      version: actual.version + 1,
    })
    if (request.activo != null) actual.activo = request.activo
    return presentarArticulo(actual)
  },
  eliminarArticulo(id: number) {
    articuloDe(id).activo = false
  },

  listarImagenes(articuloId: number) {
    articuloDe(articuloId)
    return db.imagenes
      .filter((imagen) => imagen.articuloId === articuloId)
      .sort((a, b) => a.orden - b.orden || a.id - b.id)
  },
  crearImagen(articuloId: number, body: unknown) {
    articuloDe(articuloId)
    const request = validar(imagenSchema, body)
    const principal = request.principal ?? false
    if (principal) db.imagenes.forEach((imagen) => {
      if (imagen.articuloId === articuloId) imagen.principal = false
    })
    const creada: ArticuloImagen = {
      id: db.nextId++,
      articuloId,
      url: request.url,
      orden: request.orden ?? 0,
      principal,
    }
    db.imagenes.push(creada)
    return creada
  },
  actualizarImagen(articuloId: number, imagenId: number, body: unknown) {
    articuloDe(articuloId)
    const imagen = db.imagenes.find((item) => item.id === imagenId && item.articuloId === articuloId)
    if (!imagen) throw noEncontrado("la imagen", imagenId)
    const request = validar(imagenSchema, body)
    const principal = request.principal ?? false
    if (principal) db.imagenes.forEach((item) => {
      if (item.articuloId === articuloId) item.principal = false
    })
    imagen.url = request.url
    imagen.orden = request.orden ?? 0
    imagen.principal = principal
    return imagen
  },
  eliminarImagen(articuloId: number, imagenId: number) {
    articuloDe(articuloId)
    const indice = db.imagenes.findIndex((item) => item.id === imagenId && item.articuloId === articuloId)
    if (indice < 0) throw noEncontrado("la imagen", imagenId)
    db.imagenes.splice(indice, 1)
  },

  listarPrecios(articuloId: number) {
    articuloDe(articuloId)
    return db.precios
      .filter((precio) => precio.articuloId === articuloId)
      .sort((a, b) => a.cantidadMinima - b.cantidadMinima)
  },
  crearPrecio(articuloId: number, body: unknown) {
    articuloDe(articuloId)
    const request = validar(precioEscalaSchema, body)
    if (db.precios.some((precio) => precio.articuloId === articuloId && precio.cantidadMinima === request.cantidadMinima)) {
      throw conflicto("Ya existe un precio para esa cantidad mínima", "duplicado")
    }
    const creado: PrecioEscala = { id: db.nextId++, articuloId, ...request }
    db.precios.push(creado)
    return creado
  },
  actualizarPrecio(articuloId: number, precioId: number, body: unknown) {
    articuloDe(articuloId)
    const precio = db.precios.find((item) => item.id === precioId && item.articuloId === articuloId)
    if (!precio) throw noEncontrado("el precio", precioId)
    const request = validar(precioEscalaSchema, body)
    if (
      db.precios.some(
        (item) => item.id !== precioId && item.articuloId === articuloId && item.cantidadMinima === request.cantidadMinima,
      )
    ) {
      throw conflicto("Ya existe un precio para esa cantidad mínima", "duplicado")
    }
    Object.assign(precio, request)
    return precio
  },
  eliminarPrecio(articuloId: number, precioId: number) {
    articuloDe(articuloId)
    const indice = db.precios.findIndex((item) => item.id === precioId && item.articuloId === articuloId)
    if (indice < 0) throw noEncontrado("el precio", precioId)
    db.precios.splice(indice, 1)
  },

  listarComponentes(articuloId: number) {
    articuloDe(articuloId)
    return db.componentes
      .filter((componente) => componente.productoId === articuloId)
      .sort((a, b) => a.orden - b.orden || a.id - b.id)
      .map(presentarComponente)
  },
  crearComponente(articuloId: number, body: unknown) {
    articuloDe(articuloId)
    const request = validar(componenteSchema, body)
    if (request.materialId === articuloId) throw datosInvalidos("El material no puede ser el mismo producto")
    articuloDe(request.materialId)
    const creado: ComponenteRow = {
      id: db.nextId++,
      productoId: articuloId,
      materialId: request.materialId,
      nombrePieza: vacio(request.nombrePieza),
      cantidadPiezas: request.cantidadPiezas ?? 1,
      largoMm: request.largoMm ?? null,
      anchoMm: request.anchoMm ?? null,
      toleranciaMenosMm: request.toleranciaMenosMm ?? 0,
      toleranciaMasMm: request.toleranciaMasMm ?? 0,
      cantidad: request.cantidad ?? null,
      mermaPct: request.mermaPct ?? 0,
      orden: request.orden ?? 0,
      notas: vacio(request.notas),
    }
    db.componentes.push(creado)
    return presentarComponente(creado)
  },
  actualizarComponente(articuloId: number, componenteId: number, body: unknown) {
    articuloDe(articuloId)
    const componente = db.componentes.find((item) => item.id === componenteId && item.productoId === articuloId)
    if (!componente) throw noEncontrado("el componente", componenteId)
    const request = validar(componenteSchema, body)
    if (request.materialId === articuloId) throw datosInvalidos("El material no puede ser el mismo producto")
    articuloDe(request.materialId)
    Object.assign(componente, {
      materialId: request.materialId,
      nombrePieza: vacio(request.nombrePieza),
      cantidadPiezas: request.cantidadPiezas ?? 1,
      largoMm: request.largoMm ?? null,
      anchoMm: request.anchoMm ?? null,
      toleranciaMenosMm: request.toleranciaMenosMm ?? 0,
      toleranciaMasMm: request.toleranciaMasMm ?? 0,
      cantidad: request.cantidad ?? null,
      mermaPct: request.mermaPct ?? 0,
      orden: request.orden ?? 0,
      notas: vacio(request.notas),
    })
    return presentarComponente(componente)
  },
  eliminarComponente(articuloId: number, componenteId: number) {
    articuloDe(articuloId)
    const indice = db.componentes.findIndex((item) => item.id === componenteId && item.productoId === articuloId)
    if (indice < 0) throw noEncontrado("el componente", componenteId)
    db.componentes.splice(indice, 1)
  },

  listarMovimientos(url: URL) {
    const articuloId = numeroParam(url, "articuloId")
    const almacenId = numeroParam(url, "almacenId")
    const tipo = url.searchParams.get("tipo")
    const desde = url.searchParams.get("desde")
    const hasta = url.searchParams.get("hasta")
    const filas = db.movimientos
      .filter((movimiento) => {
        if (articuloId != null && movimiento.articuloId !== articuloId) return false
        if (almacenId != null && movimiento.almacenId !== almacenId) return false
        if (tipo && movimiento.tipo !== tipo) return false
        const dia = movimiento.fecha.slice(0, 10)
        if (desde && dia < desde) return false
        if (hasta && dia > hasta) return false
        return true
      })
      .map(presentarMovimiento)
    return pagina(filas, url, {
      fecha: (movimiento) => movimiento.fecha,
      cantidad: (movimiento) => movimiento.cantidad,
      id: (movimiento) => movimiento.id,
      tipo: (movimiento) => movimiento.tipo,
    })
  },
  obtenerMovimiento(id: number) {
    const movimiento = db.movimientos.find((item) => item.id === id)
    if (!movimiento) throw noEncontrado("el movimiento", id)
    return presentarMovimiento(movimiento)
  },
  crearMovimiento(body: unknown) {
    const request = validar(movimientoSchema, body)
    const articulo = articuloDe(request.articuloId)
    if (!articulo.controlaStock) throw datosInvalidos("Este artículo no controla stock")
    almacenDe(request.almacenId)
    usuarioDe(request.usuarioId)
    if (request.proveedorId != null) proveedorDe(request.proveedorId)
    if (request.cotizacionId != null) cotizacionDe(request.cotizacionId)
    const creado: MovimientoRow = {
      id: db.nextId++,
      fecha: request.fecha ? new Date(request.fecha).toISOString() : ahora(),
      tipo: request.tipo,
      articuloId: request.articuloId,
      almacenId: request.almacenId,
      cantidad: request.cantidad,
      costoUnitario: request.costoUnitario ?? null,
      proveedorId: request.proveedorId ?? null,
      cotizacionId: request.cotizacionId ?? null,
      documentoRef: vacio(request.documentoRef),
      usuarioId: request.usuarioId,
      nota: vacio(request.nota),
      createdAt: ahora(),
    }
    db.movimientos.push(creado)
    return presentarMovimiento(creado)
  },

  listarExistencias(url: URL) {
    const articuloId = numeroParam(url, "articuloId")
    const almacenId = numeroParam(url, "almacenId")
    const acumulado = new Map<string, number>()
    for (const movimiento of db.movimientos) {
      const clave = `${movimiento.articuloId}:${movimiento.almacenId}`
      acumulado.set(clave, (acumulado.get(clave) ?? 0) + movimiento.cantidad)
    }
    const filas: Existencia[] = [...acumulado.entries()].flatMap(([clave, cantidad]) => {
      const [artId, almId] = clave.split(":").map(Number)
      if (articuloId != null && artId !== articuloId) return []
      if (almacenId != null && almId !== almacenId) return []
      const articulo = db.articulos.find((item) => item.id === artId)
      const almacen = db.almacenes.find((item) => item.id === almId)
      return [
        {
          articuloId: artId,
          articuloCodigo: articulo?.codigo ?? null,
          articuloNombre: articulo?.nombre ?? null,
          almacenId: almId,
          almacenCodigo: almacen?.codigo ?? null,
          almacenNombre: almacen?.nombre ?? null,
          cantidad: Math.round(cantidad * 10000) / 10000,
        },
      ]
    })
    return pagina(filas, url, {
      cantidad: (fila) => fila.cantidad,
      articuloId: (fila) => fila.articuloId,
      almacenId: (fila) => fila.almacenId,
    })
  },

  listarCotizaciones(url: URL) {
    const texto = url.searchParams.get("texto")
    const clienteId = numeroParam(url, "clienteId")
    const estado = url.searchParams.get("estado")
    const filas = db.cotizaciones
      .filter((cotizacion) => {
        if (clienteId != null && cotizacion.clienteId !== clienteId) return false
        if (estado && cotizacion.estado !== estado) return false
        return coincideTexto(texto, cotizacion.numero)
      })
      .map(presentarCotizacion)
    return pagina(filas, url, {
      fechaEmision: (cotizacion) => cotizacion.fechaEmision,
      numero: (cotizacion) => cotizacion.numero,
      total: (cotizacion) => cotizacion.total,
      id: (cotizacion) => cotizacion.id,
    })
  },
  obtenerCotizacion(id: number) {
    return presentarCotizacion(cotizacionDe(id))
  },
  crearCotizacion(body: unknown) {
    const request = validar(cotizacionSchema, body)
    const cliente = clienteDe(request.clienteId)
    usuarioDe(request.usuarioId)
    const fecha = request.fechaEmision ?? ahora().slice(0, 10)
    if (request.validaHasta && request.validaHasta < fecha) {
      throw datosInvalidos("La validez no puede ser anterior a la fecha de emisión")
    }
    const numero = vacio(request.numero) ?? generarNumero(fecha)
    if (db.cotizaciones.some((cotizacion) => cotizacion.numero === numero)) {
      throw conflicto("Ya existe una cotización con ese número", "duplicado")
    }
    const creada: CotizacionRow = {
      id: db.nextId++,
      numero,
      clienteId: cliente.id,
      usuarioId: request.usuarioId,
      fechaEmision: fecha,
      validaHasta: request.validaHasta ?? null,
      estado: "BORRADOR",
      moneda: request.moneda ?? "PEN",
      preciosIncluyenIgv: request.preciosIncluyenIgv ?? true,
      tasaIgv: request.tasaIgv ?? 0.18,
      subtotal: 0,
      descuento: request.descuento ?? 0,
      igv: 0,
      total: 0,
      adelantoPct: request.adelantoPct ?? 50,
      plazoEntregaDias: request.plazoEntregaDias ?? null,
      condiciones: vacio(request.condiciones),
      notasInternas: vacio(request.notasInternas),
      version: 0,
      createdAt: ahora(),
      updatedAt: ahora(),
    }
    db.cotizaciones.push(creada)
    recalcularCotizacion(creada)
    creada.version = 0
    return presentarCotizacion(creada)
  },
  actualizarCotizacion(id: number, body: unknown) {
    const actual = cotizacionDe(id)
    const request = validar(cotizacionSchema, body)
    exigirVersion(actual.version, request.version)
    if (actual.estado === "ANULADA") throw conflicto("Una cotización anulada no se puede modificar")
    if (actual.estado !== "BORRADOR") {
      if (request.estado == null) {
        throw conflicto("Solo se puede cambiar el estado de una cotización que ya no está en borrador")
      }
      validarTransicion(actual.estado, request.estado)
      actual.estado = request.estado
      if (request.notasInternas != null) actual.notasInternas = vacio(request.notasInternas)
      actual.version += 1
      actual.updatedAt = ahora()
      return presentarCotizacion(actual)
    }
    clienteDe(request.clienteId)
    usuarioDe(request.usuarioId)
    const fecha = request.fechaEmision ?? actual.fechaEmision
    if (request.validaHasta && request.validaHasta < fecha) {
      throw datosInvalidos("La validez no puede ser anterior a la fecha de emisión")
    }
    if (vacio(request.numero) && db.cotizaciones.some((cotizacion) => cotizacion.id !== id && cotizacion.numero === request.numero)) {
      throw conflicto("Ya existe una cotización con ese número", "duplicado")
    }
    actual.clienteId = request.clienteId
    actual.usuarioId = request.usuarioId
    actual.fechaEmision = fecha
    actual.validaHasta = request.validaHasta ?? null
    actual.moneda = request.moneda ?? actual.moneda
    actual.preciosIncluyenIgv = request.preciosIncluyenIgv ?? true
    actual.tasaIgv = request.tasaIgv ?? 0.18
    actual.descuento = request.descuento ?? 0
    actual.adelantoPct = request.adelantoPct ?? 50
    actual.plazoEntregaDias = request.plazoEntregaDias ?? null
    actual.condiciones = vacio(request.condiciones)
    actual.notasInternas = vacio(request.notasInternas)
    if (vacio(request.numero)) actual.numero = request.numero!.trim()
    if (request.estado && request.estado !== "BORRADOR") {
      validarTransicion("BORRADOR", request.estado)
      actual.estado = request.estado
    }
    recalcularCotizacion(actual)
    return presentarCotizacion(actual)
  },
  eliminarCotizacion(id: number) {
    const actual = cotizacionDe(id)
    actual.estado = "ANULADA"
    actual.updatedAt = ahora()
  },
  listarLineas(cotizacionId: number) {
    cotizacionDe(cotizacionId)
    return lineasDe(cotizacionId)
  },
  crearLinea(cotizacionId: number, body: unknown) {
    const cotizacion = cotizacionDe(cotizacionId)
    exigirBorrador(cotizacion)
    const request = validar(lineaSchema, body)
    if (lineasDe(cotizacionId).some((linea) => linea.linea === request.linea)) {
      throw conflicto("Ya existe una línea con ese número", "duplicado")
    }
    const creada: CotizacionLinea = {
      id: db.nextId++,
      linea: request.linea,
      articuloId: null,
      descripcion: "",
      largoMm: null,
      anchoMm: null,
      altoMm: null,
      cantidad: request.cantidad,
      unidadCodigo: "UND",
      precioUnitario: 0,
      descuento: 0,
      importe: 0,
      costoUnitarioEst: null,
    }
    aplicarLinea(creada, request, true)
    db.lineas.push(creada)
    recordarLinea(creada.id, cotizacionId)
    recalcularCotizacion(cotizacion)
    return creada
  },
  actualizarLinea(cotizacionId: number, lineaId: number, body: unknown) {
    const cotizacion = cotizacionDe(cotizacionId)
    exigirBorrador(cotizacion)
    const linea = db.lineas.find((item) => item.id === lineaId && lineaCotizacion(item) === cotizacionId)
    if (!linea) throw noEncontrado("la línea", lineaId)
    const request = validar(lineaSchema, body)
    if (lineasDe(cotizacionId).some((item) => item.id !== lineaId && item.linea === request.linea)) {
      throw conflicto("Ya existe una línea con ese número", "duplicado")
    }
    linea.linea = request.linea
    aplicarLinea(linea, request, false)
    recalcularCotizacion(cotizacion)
    return linea
  },
  eliminarLinea(cotizacionId: number, lineaId: number) {
    const cotizacion = cotizacionDe(cotizacionId)
    exigirBorrador(cotizacion)
    const indice = db.lineas.findIndex((item) => item.id === lineaId && lineaCotizacion(item) === cotizacionId)
    if (indice < 0) throw noEncontrado("la línea", lineaId)
    db.lineas.splice(indice, 1)
    recalcularCotizacion(cotizacion)
  },
}

function numeroParam(url: URL, nombre: string) {
  const valor = url.searchParams.get(nombre)
  if (!valor) return undefined
  const numero = Number(valor)
  return Number.isFinite(numero) ? numero : undefined
}

function asegurarDocumentoUnico(
  id: number | null,
  tipo: Cliente["tipoDocumento"],
  numero: string | null | undefined,
) {
  const documento = vacio(numero)
  if (!tipo || !documento) return
  const ocupado = db.clientes.some(
    (cliente) => cliente.id !== id && cliente.tipoDocumento === tipo && cliente.numeroDocumento === documento,
  )
  if (ocupado) throw conflicto("Ya existe un cliente con ese documento", "duplicado")
}
