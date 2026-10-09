import { describe, expect, it } from "vitest"

import { parseProblem } from "@/lib/api/problem"

describe("parseProblem", () => {
  it("lee el ProblemDetail del backend, con errores por campo", () => {
    const problema = parseProblem(
      {
        type: "about:blank",
        title: "Datos inválidos",
        status: 400,
        detail: "Revise los campos marcados",
        codigo: "datos_invalidos",
        instance: "/api/v1/proveedores",
        errores: [{ campo: "ruc", mensaje: "El RUC debe tener 11 dígitos y empezar por 10, 15, 17 o 20" }],
      },
      400,
    )
    expect(problema.title).toBe("Datos inválidos")
    expect(problema.codigo).toBe("datos_invalidos")
    expect(problema.errores).toEqual([
      { campo: "ruc", mensaje: "El RUC debe tener 11 dígitos y empezar por 10, 15, 17 o 20" },
    ])
  })

  it("tolera un cuerpo vacío", () => {
    const problema = parseProblem(undefined, 409)
    expect(problema.status).toBe(409)
    expect(problema.errores).toEqual([])
  })
})
