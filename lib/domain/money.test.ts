import { describe, expect, it } from "vitest"

import { esErrorTotales, importeLinea, previewTotales } from "@/lib/domain/money"

describe("previewTotales", () => {
  it("separa la base y el IGV cuando el precio ya incluye el impuesto", () => {
    const importe = importeLinea(2, 549, 0) + importeLinea(6, 189, 0)
    const totales = previewTotales({
      importes: [importe],
      descuento: 0,
      tasaIgv: 0.18,
      preciosIncluyenIgv: true,
    })
    expect(esErrorTotales(totales)).toBe(false)
    if (esErrorTotales(totales)) return
    expect(totales.total).toBe(2232)
    expect(totales.subtotal).toBe(1891.53)
    expect(totales.igv).toBe(340.47)
  })

  it("suma el IGV cuando los precios son sin impuesto", () => {
    const totales = previewTotales({
      importes: [100],
      descuento: 0,
      tasaIgv: 0.18,
      preciosIncluyenIgv: false,
    })
    if (esErrorTotales(totales)) throw new Error(totales.error)
    expect(totales).toMatchObject({ subtotal: 100, igv: 18, total: 118 })
  })

  it("no deja que el descuento supere las líneas", () => {
    const totales = previewTotales({
      importes: [10],
      descuento: 20,
      tasaIgv: 0.18,
      preciosIncluyenIgv: true,
    })
    expect(totales).toEqual({ error: "El descuento no puede superar la suma de las líneas" })
  })
})
