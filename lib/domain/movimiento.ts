import type { Movimiento, TipoMovimiento } from "@/lib/domain/types"

const ENTRADA: TipoMovimiento[] = ["SALDO_INICIAL", "COMPRA", "INGRESO_PRODUCCION"]
const SALIDA: TipoMovimiento[] = ["CONSUMO_PRODUCCION", "VENTA"]

/** Mensaje de `MovimientoInventarioService.validar`, o null si la cantidad es válida. */
export function validarMovimiento(
  tipo: TipoMovimiento,
  cantidad: number,
  costoUnitario: number | null,
): string | null {
  if (!Number.isFinite(cantidad) || cantidad === 0) {
    return "La cantidad no puede ser cero"
  }
  if (ENTRADA.includes(tipo) && cantidad < 0) {
    return "Este tipo de movimiento solo puede sumar stock"
  }
  if (SALIDA.includes(tipo) && cantidad > 0) {
    return "Este tipo de movimiento solo puede restar stock"
  }
  if (tipo === "COMPRA" && costoUnitario == null) {
    return "Una compra debe indicar el costo unitario sin IGV"
  }
  if (costoUnitario != null && costoUnitario < 0) {
    return "El costo no puede ser negativo"
  }
  return null
}

/**
 * Aplica el signo que exige el tipo. El formulario pide una cantidad positiva
 * y, en ajuste o devolución, la dirección.
 */
export function cantidadConSigno(
  tipo: TipoMovimiento,
  cantidadAbsoluta: number,
  direccion: "ENTRADA" | "SALIDA" = "ENTRADA",
): number {
  const absoluta = Math.abs(cantidadAbsoluta)
  if (ENTRADA.includes(tipo)) return absoluta
  if (SALIDA.includes(tipo)) return -absoluta
  return direccion === "SALIDA" ? -absoluta : absoluta
}

/** Corrección append-only: otro movimiento AJUSTE de signo contrario. No hay PUT ni DELETE. */
export function reversoDe(movimiento: Movimiento): {
  tipo: "AJUSTE"
  articuloId: number
  almacenId: number
  cantidad: number
  costoUnitario: null
  proveedorId: null
  cotizacionId: null
  documentoRef: string
  usuarioId: number
  nota: string
  fecha: null
} {
  return {
    tipo: "AJUSTE",
    articuloId: movimiento.articuloId,
    almacenId: movimiento.almacenId,
    cantidad: -movimiento.cantidad,
    costoUnitario: null,
    proveedorId: null,
    cotizacionId: null,
    documentoRef: `REV-${movimiento.id}`.slice(0, 60),
    usuarioId: movimiento.usuarioId,
    nota: `Reverso del movimiento #${movimiento.id}`,
    fecha: null,
  }
}

export function esBajoStock(
  cantidad: number,
  stockMinimo: number | null | undefined,
  controlaStock = true,
): boolean {
  if (!controlaStock) return false
  if (stockMinimo == null || stockMinimo <= 0) return cantidad <= 0
  return cantidad <= stockMinimo
}
