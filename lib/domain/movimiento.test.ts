import { describe, expect, it } from "vitest"

import { cantidadConSigno, esBajoStock, reversoDe, validarMovimiento } from "@/lib/domain/movimiento"
import type { Movimiento } from "@/lib/domain/types"

const movimiento: Movimiento = {
  id: 4,
  fecha: "2026-10-03T11:40:00-05:00",
  tipo: "COMPRA",
  articuloId: 6,
  articuloCodigo: "NIV-REG",
  articuloNombre: "Nivelador regulable",
  almacenId: 1,
  almacenNombre: "Taller Villa El Salvador",
  cantidad: 15,
  costoUnitario: 1.8,
  proveedorId: 1,
  cotizacionId: null,
  documentoRef: "GR-7781",
  usuarioId: 1,
  usuarioNombre: "Rodrigo Castillo",
  nota: null,
  createdAt: "2026-10-03T11:40:00-05:00",
}

describe("movimientos", () => {
  it("exige costo en una compra y signo según el tipo", () => {
    expect(validarMovimiento("COMPRA", 2, null)).toMatch(/costo unitario/)
    expect(validarMovimiento("VENTA", 1, null)).toMatch(/restar/)
    expect(validarMovimiento("COMPRA", 2, 10)).toBeNull()
  })

  it("convierte la cantidad del formulario al signo del libro", () => {
    expect(cantidadConSigno("VENTA", 3)).toBe(-3)
    expect(cantidadConSigno("AJUSTE", 2, "SALIDA")).toBe(-2)
    expect(cantidadConSigno("SALDO_INICIAL", 4)).toBe(4)
  })

  it("arma un ajuste inverso, sin editar el movimiento original", () => {
    expect(reversoDe(movimiento)).toMatchObject({
      tipo: "AJUSTE",
      articuloId: 6,
      almacenId: 1,
      cantidad: -15,
      documentoRef: "REV-4",
      usuarioId: 1,
    })
  })

  it("marca bajo stock cuando la cantidad no supera el mínimo", () => {
    expect(esBajoStock(15, 20)).toBe(true)
    expect(esBajoStock(30, 8)).toBe(false)
    expect(esBajoStock(0, 0, false)).toBe(false)
  })
})
