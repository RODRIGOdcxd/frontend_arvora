/**
 * Misma regla que `Cotizacion.recalcularTotales` y `CotizacionLinea.recalcularImporte`:
 * HALF_UP a 2 decimales. El servidor sigue siendo la fuente de verdad.
 */

export type Totales = {
  subtotal: number
  descuento: number
  igv: number
  total: number
}

export function redondear(valor: number, escala = 2): number {
  const factor = 10 ** escala
  return Math.round((valor + Number.EPSILON) * factor) / factor
}

export function importeLinea(cantidad: number, precioUnitario: number, descuento: number): number {
  return redondear(redondear(cantidad * precioUnitario) - descuento)
}

export function previewTotales(input: {
  importes: number[]
  descuento: number
  tasaIgv: number
  preciosIncluyenIgv: boolean
}): Totales | { error: string } {
  const suma = input.importes.reduce((total, importe) => total + importe, 0)
  const descuento = input.descuento
  const neto = redondear(suma - descuento)
  if (neto < 0) {
    return { error: "El descuento no puede superar la suma de las líneas" }
  }
  const tasa = input.tasaIgv
  if (input.preciosIncluyenIgv) {
    const total = neto
    const subtotal = redondear(neto / (1 + tasa))
    const igv = redondear(total - subtotal)
    return { subtotal, descuento, igv, total }
  }
  const subtotal = neto
  const igv = redondear(neto * tasa)
  const total = redondear(subtotal + igv)
  return { subtotal, descuento, igv, total }
}

export function esErrorTotales(valor: Totales | { error: string }): valor is { error: string } {
  return "error" in valor
}
