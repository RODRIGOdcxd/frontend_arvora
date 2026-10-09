import { describe, expect, it } from "vitest"

import { articuloSchema, clienteSchema, proveedorSchema } from "@/lib/domain/schemas"

const articuloBase = {
  codigo: "TQ-1",
  nombre: "Tubo",
  tipo: "MATERIA_PRIMA" as const,
  unidadMedidaId: 1,
  tipoCorte: "NINGUNO" as const,
}

describe("esquemas alineados al API", () => {
  it("exige tipo y número de documento juntos", () => {
    const resultado = clienteSchema.safeParse({ nombre: "Ana", tipoDocumento: "DNI", numeroDocumento: null })
    expect(resultado.success).toBe(false)
    if (resultado.success) return
    expect(resultado.error.issues.some((issue) => issue.message.includes("van juntos"))).toBe(true)
  })

  it("rechaza un RUC mal formado", () => {
    const resultado = proveedorSchema.safeParse({ razonSocial: "Javisac", ruc: "123" })
    expect(resultado.success).toBe(false)
  })

  it("exige largo, ancho y espesor en un panel", () => {
    const resultado = articuloSchema.safeParse({ ...articuloBase, tipoCorte: "PANEL", largoMm: 2440 })
    expect(resultado.success).toBe(false)
  })

  it("acepta un servicio sin stock", () => {
    const resultado = articuloSchema.safeParse({
      ...articuloBase,
      tipo: "SERVICIO",
      tipoCorte: "NINGUNO",
      controlaStock: false,
    })
    expect(resultado.success).toBe(true)
  })
})
