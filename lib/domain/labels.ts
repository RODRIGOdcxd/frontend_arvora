import type {
  CanalOrigen,
  EstadoCotizacion,
  Magnitud,
  Moneda,
  TipoArticulo,
  TipoCorte,
  TipoDocumento,
  TipoMovimiento,
} from "@/lib/domain/types"

export type Opcion = { value: string; label: string }

export const TIPOS_DOCUMENTO: Opcion[] = [
  { value: "DNI", label: "DNI" },
  { value: "RUC", label: "RUC" },
  { value: "CE", label: "Carné de extranjería" },
  { value: "PAS", label: "Pasaporte" },
]

export const CANALES: Opcion[] = [
  { value: "MARKETPLACE", label: "Marketplace" },
  { value: "WHATSAPP", label: "WhatsApp" },
  { value: "TIKTOK", label: "TikTok" },
  { value: "REFERIDO", label: "Referido" },
  { value: "WEB", label: "Web" },
  { value: "OTRO", label: "Otro" },
]

export const MAGNITUDES: Opcion[] = [
  { value: "CONTEO", label: "Conteo" },
  { value: "LONGITUD", label: "Longitud" },
  { value: "AREA", label: "Área" },
  { value: "MASA", label: "Masa" },
  { value: "VOLUMEN", label: "Volumen" },
]

export const TIPOS_ARTICULO: Opcion[] = [
  { value: "MATERIA_PRIMA", label: "Materia prima" },
  { value: "INSUMO", label: "Insumo" },
  { value: "PRODUCTO", label: "Producto" },
  { value: "REVENTA", label: "Reventa" },
  { value: "SERVICIO", label: "Servicio" },
]

export const TIPOS_CORTE: Opcion[] = [
  { value: "NINGUNO", label: "Ninguno" },
  { value: "LINEAL", label: "Lineal (barras)" },
  { value: "PANEL", label: "Panel (planchas)" },
]

export const TIPOS_MOVIMIENTO: Opcion[] = [
  { value: "SALDO_INICIAL", label: "Saldo inicial" },
  { value: "COMPRA", label: "Compra" },
  { value: "INGRESO_PRODUCCION", label: "Ingreso de producción" },
  { value: "CONSUMO_PRODUCCION", label: "Consumo de producción" },
  { value: "VENTA", label: "Venta" },
  { value: "AJUSTE", label: "Ajuste" },
  { value: "DEVOLUCION", label: "Devolución" },
]

export const ESTADOS_COTIZACION: Opcion[] = [
  { value: "BORRADOR", label: "Borrador" },
  { value: "ENVIADA", label: "Enviada" },
  { value: "ACEPTADA", label: "Aceptada" },
  { value: "RECHAZADA", label: "Rechazada" },
  { value: "VENCIDA", label: "Vencida" },
  { value: "ANULADA", label: "Anulada" },
]

export const MONEDAS: Opcion[] = [
  { value: "PEN", label: "Soles (PEN)" },
  { value: "USD", label: "Dólares (USD)" },
]

export const FILTRO_ACTIVO: Opcion[] = [
  { value: "true", label: "Activos" },
  { value: "false", label: "Inactivos" },
]

const mapa = (opciones: Opcion[]) =>
  Object.fromEntries(opciones.map((opcion) => [opcion.value, opcion.label]))

export const etiquetaDocumento = mapa(TIPOS_DOCUMENTO) as Record<TipoDocumento, string>
export const etiquetaCanal = mapa(CANALES) as Record<CanalOrigen, string>
export const etiquetaMagnitud = mapa(MAGNITUDES) as Record<Magnitud, string>
export const etiquetaTipoArticulo = mapa(TIPOS_ARTICULO) as Record<TipoArticulo, string>
export const etiquetaCorte = mapa(TIPOS_CORTE) as Record<TipoCorte, string>
export const etiquetaMovimiento = mapa(TIPOS_MOVIMIENTO) as Record<TipoMovimiento, string>
export const etiquetaEstado = mapa(ESTADOS_COTIZACION) as Record<EstadoCotizacion, string>
export const etiquetaMoneda = mapa(MONEDAS) as Record<Moneda, string>

export function etiquetaDe(mapaEtiquetas: Record<string, string>, valor: string | null | undefined) {
  if (!valor) return "—"
  return mapaEtiquetas[valor] ?? valor
}
