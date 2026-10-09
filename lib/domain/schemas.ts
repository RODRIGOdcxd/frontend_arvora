import { z } from "zod"

import type { TipoMovimiento } from "@/lib/domain/types"
import { validarMovimiento } from "@/lib/domain/movimiento"

const codigoRol = z
  .string()
  .trim()
  .min(1, "El código es obligatorio")
  .max(30, "El código admite hasta 30 caracteres")

export const rolSchema = z.object({
  codigo: codigoRol,
  nombre: z.string().trim().min(1, "El nombre es obligatorio").max(80, "El nombre admite hasta 80 caracteres"),
  activo: z.boolean().optional(),
})

const email = z.string().trim().email("El correo no es válido").max(150, "El correo admite hasta 150 caracteres")

export const usuarioSchema = (creando: boolean) =>
  z
    .object({
      email,
      nombre: z.string().trim().min(1, "El nombre es obligatorio").max(120, "El nombre admite hasta 120 caracteres"),
      password: z.string().max(72, "La contraseña debe tener entre 8 y 72 caracteres").nullable().optional(),
      rolId: z.number({ error: "El rol es obligatorio" }).int().positive("El rol es obligatorio"),
      activo: z.boolean().optional(),
    })
    .superRefine((valor, ctx) => {
      const password = valor.password?.trim() ?? ""
      if (creando && password.length === 0) {
        ctx.addIssue({ code: "custom", path: ["password"], message: "La contraseña es obligatoria al crear el usuario" })
      }
      if (password.length > 0 && password.length < 8) {
        ctx.addIssue({
          code: "custom",
          path: ["password"],
          message: "La contraseña debe tener entre 8 y 72 caracteres",
        })
      }
    })

const ruc = /^(10|15|17|20)[0-9]{9}$/

export const clienteSchema = z
  .object({
    tipoDocumento: z.enum(["DNI", "RUC", "CE", "PAS"]).nullable().optional(),
    numeroDocumento: z.string().trim().max(20, "El número de documento admite hasta 20 caracteres").nullable().optional(),
    nombre: z.string().trim().min(1, "El nombre es obligatorio").max(200, "El nombre admite hasta 200 caracteres"),
    telefono: z.string().trim().max(30).nullable().optional(),
    email: z.string().trim().max(150).nullable().optional(),
    direccion: z.string().trim().max(300).nullable().optional(),
    ciudad: z.string().trim().max(80).nullable().optional(),
    canalOrigen: z.enum(["MARKETPLACE", "WHATSAPP", "TIKTOK", "REFERIDO", "WEB", "OTRO"]).nullable().optional(),
    notas: z.string().nullable().optional(),
    activo: z.boolean().optional(),
  })
  .superRefine((valor, ctx) => {
    const tieneTipo = valor.tipoDocumento != null
    const numero = valor.numeroDocumento?.trim() ?? ""
    const tieneNumero = numero.length > 0
    if (tieneTipo !== tieneNumero) {
      ctx.addIssue({
        code: "custom",
        path: ["numeroDocumento"],
        message: "El tipo y el número de documento van juntos",
      })
    }
    if (valor.email && valor.email.length > 0 && !z.string().email().safeParse(valor.email).success) {
      ctx.addIssue({ code: "custom", path: ["email"], message: "El correo no es válido" })
    }
  })

export const proveedorSchema = z
  .object({
    ruc: z.string().trim().nullable().optional(),
    razonSocial: z.string().trim().min(1, "La razón social es obligatoria").max(200),
    nombreComercial: z.string().trim().max(200).nullable().optional(),
    contacto: z.string().trim().max(120).nullable().optional(),
    telefono: z.string().trim().max(30).nullable().optional(),
    email: z.string().trim().max(150).nullable().optional(),
    direccion: z.string().trim().max(300).nullable().optional(),
    rubro: z.string().trim().max(80).nullable().optional(),
    notas: z.string().nullable().optional(),
    activo: z.boolean().optional(),
  })
  .superRefine((valor, ctx) => {
    const documento = valor.ruc?.trim() ?? ""
    if (documento.length > 0 && !ruc.test(documento)) {
      ctx.addIssue({
        code: "custom",
        path: ["ruc"],
        message: "El RUC debe tener 11 dígitos y empezar por 10, 15, 17 o 20",
      })
    }
    if (valor.email && valor.email.length > 0 && !z.string().email().safeParse(valor.email).success) {
      ctx.addIssue({ code: "custom", path: ["email"], message: "El correo no es válido" })
    }
  })

export const categoriaSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio").max(80, "El nombre admite hasta 80 caracteres"),
  padreId: z.number().int().positive().nullable().optional(),
  activo: z.boolean().optional(),
})

export const unidadSchema = z.object({
  codigo: z.string().trim().min(1, "El código es obligatorio").max(10),
  nombre: z.string().trim().min(1, "El nombre es obligatorio").max(50),
  magnitud: z.enum(["CONTEO", "LONGITUD", "AREA", "MASA", "VOLUMEN"], { error: "La magnitud es obligatoria" }),
  decimales: z.number().int().min(0, "Los decimales van de 0 a 4").max(4, "Los decimales van de 0 a 4"),
})

export const almacenSchema = z.object({
  codigo: z.string().trim().min(1, "El código es obligatorio").max(20),
  nombre: z.string().trim().min(1, "El nombre es obligatorio").max(100),
  activo: z.boolean().optional(),
})

const positivo = z.number().positive("El valor debe ser mayor que cero").nullable().optional()
const noNegativo = z.number().nonnegative("El valor no puede ser negativo").nullable().optional()

export const articuloSchema = z
  .object({
    codigo: z.string().trim().min(1, "El código es obligatorio").max(40),
    nombre: z.string().trim().min(1, "El nombre es obligatorio").max(200),
    descripcion: z.string().nullable().optional(),
    tipo: z.enum(["MATERIA_PRIMA", "INSUMO", "PRODUCTO", "REVENTA", "SERVICIO"], {
      error: "El tipo es obligatorio",
    }),
    categoriaId: z.number().int().positive().nullable().optional(),
    unidadMedidaId: z.number({ error: "La unidad de medida es obligatoria" }).int().positive("La unidad de medida es obligatoria"),
    seCompra: z.boolean().optional(),
    seVende: z.boolean().optional(),
    controlaStock: z.boolean().optional(),
    largoMm: positivo,
    anchoMm: positivo,
    altoMm: positivo,
    espesorMm: positivo,
    diametroMm: positivo,
    tipoCorte: z.enum(["NINGUNO", "LINEAL", "PANEL"]).optional(),
    respetaVeta: z.boolean().optional(),
    marca: z.string().trim().max(80).nullable().optional(),
    colorAcabado: z.string().trim().max(80).nullable().optional(),
    proveedorHabitualId: z.number().int().positive().nullable().optional(),
    costoReferencia: noNegativo,
    precioVenta: noNegativo,
    stockMinimo: noNegativo,
    activo: z.boolean().optional(),
    version: z.number().int().nonnegative().nullable().optional(),
  })
  .superRefine((valor, ctx) => {
    const corte = valor.tipoCorte ?? "NINGUNO"
    if (corte === "LINEAL" && valor.largoMm == null) {
      ctx.addIssue({ code: "custom", path: ["largoMm"], message: "Un corte lineal requiere el largo en milímetros" })
    }
    if (corte === "PANEL") {
      if (valor.largoMm == null) {
        ctx.addIssue({ code: "custom", path: ["largoMm"], message: "Un corte de panel requiere largo, ancho y espesor en milímetros" })
      }
      if (valor.anchoMm == null) {
        ctx.addIssue({ code: "custom", path: ["anchoMm"], message: "Un corte de panel requiere largo, ancho y espesor en milímetros" })
      }
      if (valor.espesorMm == null) {
        ctx.addIssue({
          code: "custom",
          path: ["espesorMm"],
          message: "Un corte de panel requiere largo, ancho y espesor en milímetros",
        })
      }
    }
    if (valor.tipo === "SERVICIO" && valor.controlaStock) {
      ctx.addIssue({ code: "custom", path: ["controlaStock"], message: "Un servicio no controla stock" })
    }
  })

export const imagenSchema = z.object({
  url: z.string().trim().min(1, "La URL es obligatoria").max(500),
  orden: z.number().int().nullable().optional(),
  principal: z.boolean().optional(),
})

export const precioEscalaSchema = z.object({
  cantidadMinima: z.number().positive("La cantidad mínima debe ser mayor que cero"),
  precioUnitario: z.number().nonnegative("El precio no puede ser negativo"),
})

export const componenteSchema = z
  .object({
    materialId: z.number({ error: "El material es obligatorio" }).int().positive("El material es obligatorio"),
    nombrePieza: z.string().trim().max(120).nullable().optional(),
    cantidadPiezas: z.number().int().positive("La cantidad de piezas debe ser mayor que cero").nullable().optional(),
    largoMm: positivo,
    anchoMm: positivo,
    toleranciaMenosMm: noNegativo,
    toleranciaMasMm: noNegativo,
    cantidad: positivo,
    mermaPct: z.number().min(0, "La merma no puede ser negativa").max(99.99, "La merma debe ser menor que 100").nullable().optional(),
    orden: z.number().int().nullable().optional(),
    notas: z.string().trim().max(300).nullable().optional(),
  })
  .superRefine((valor, ctx) => {
    if (valor.largoMm == null && valor.cantidad == null) {
      ctx.addIssue({
        code: "custom",
        path: ["cantidad"],
        message: "Indique el largo de la pieza o la cantidad de consumo",
      })
    }
  })

export const movimientoSchema = z
  .object({
    tipo: z.enum([
      "SALDO_INICIAL",
      "COMPRA",
      "CONSUMO_PRODUCCION",
      "INGRESO_PRODUCCION",
      "VENTA",
      "AJUSTE",
      "DEVOLUCION",
    ]),
    articuloId: z.number().int().positive("El artículo es obligatorio"),
    almacenId: z.number().int().positive("El almacén es obligatorio"),
    cantidad: z.number({ error: "La cantidad es obligatoria" }),
    costoUnitario: noNegativo,
    proveedorId: z.number().int().positive().nullable().optional(),
    cotizacionId: z.number().int().positive().nullable().optional(),
    documentoRef: z.string().trim().max(60).nullable().optional(),
    usuarioId: z.number().int().positive("El usuario es obligatorio"),
    nota: z.string().trim().max(300).nullable().optional(),
    fecha: z.string().nullable().optional(),
  })
  .superRefine((valor, ctx) => {
    const mensaje = validarMovimiento(valor.tipo as TipoMovimiento, valor.cantidad, valor.costoUnitario ?? null)
    if (mensaje) {
      ctx.addIssue({ code: "custom", path: ["cantidad"], message: mensaje })
    }
  })

export const cotizacionSchema = z
  .object({
    numero: z.string().trim().max(20).nullable().optional(),
    clienteId: z.number({ error: "El cliente es obligatorio" }).int().positive("El cliente es obligatorio"),
    usuarioId: z.number({ error: "El usuario es obligatorio" }).int().positive("El usuario es obligatorio"),
    fechaEmision: z.string().nullable().optional(),
    validaHasta: z.string().nullable().optional(),
    estado: z.enum(["BORRADOR", "ENVIADA", "ACEPTADA", "RECHAZADA", "VENCIDA", "ANULADA"]).nullable().optional(),
    moneda: z.enum(["PEN", "USD"]).nullable().optional(),
    preciosIncluyenIgv: z.boolean().optional(),
    tasaIgv: z.number().min(0, "La tasa de IGV no puede ser negativa").max(0.9999, "La tasa de IGV debe ser menor que 1").nullable().optional(),
    descuento: z.number().nonnegative().nullable().optional(),
    adelantoPct: z.number().min(0).max(100).nullable().optional(),
    plazoEntregaDias: z.number().int().min(0).max(3650).nullable().optional(),
    condiciones: z.string().nullable().optional(),
    notasInternas: z.string().nullable().optional(),
    version: z.number().int().nonnegative().nullable().optional(),
  })
  .superRefine((valor, ctx) => {
    if (valor.fechaEmision && valor.validaHasta && valor.validaHasta < valor.fechaEmision) {
      ctx.addIssue({
        code: "custom",
        path: ["validaHasta"],
        message: "La validez no puede ser anterior a la fecha de emisión",
      })
    }
  })

export const lineaSchema = z.object({
  linea: z.number().int().min(1).max(9999),
  articuloId: z.number().int().positive().nullable().optional(),
  descripcion: z.string().trim().max(500).nullable().optional(),
  largoMm: positivo,
  anchoMm: positivo,
  altoMm: positivo,
  cantidad: z.number().positive("La cantidad debe ser mayor que cero"),
  unidadCodigo: z.string().trim().max(10).nullable().optional(),
  precioUnitario: z.number().nonnegative().nullable().optional(),
  descuento: z.number().nonnegative().nullable().optional(),
})

export function erroresZod(error: z.ZodError): Record<string, string> {
  const salida: Record<string, string> = {}
  for (const issue of error.issues) {
    const clave = String(issue.path[0] ?? "")
    if (clave && !salida[clave]) salida[clave] = issue.message
  }
  return salida
}
