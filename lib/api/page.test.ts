import { describe, expect, it } from "vitest"

import { paginar, toQuery } from "@/lib/api/page"

describe("toQuery", () => {
  it("arma page, size, sort y el filtro texto del API", () => {
    const consulta = toQuery({
      page: 1,
      size: 20,
      sort: "nombre,asc",
      texto: " mesa ",
      filters: { activo: true, tipo: "PRODUCTO", vacio: "" },
    })
    const params = new URLSearchParams(consulta.slice(1))
    expect(params.get("page")).toBe("1")
    expect(params.get("size")).toBe("20")
    expect(params.get("sort")).toBe("nombre,asc")
    expect(params.get("texto")).toBe("mesa")
    expect(params.get("activo")).toBe("true")
    expect(params.get("tipo")).toBe("PRODUCTO")
    expect(params.has("vacio")).toBe(false)
  })
})

describe("paginar", () => {
  const filas = [
    { id: 1, nombre: "Banca" },
    { id: 2, nombre: "Mesa" },
  ]

  it("ordena y recorta la página", () => {
    const url = new URL("http://local/api/v1/articulos?page=0&size=1&sort=nombre,desc")
    const pagina = paginar(filas, url, { nombre: (fila) => fila.nombre })
    expect(pagina.content.map((fila) => fila.nombre)).toEqual(["Mesa"])
    expect(pagina.totalElements).toBe(2)
    expect(pagina.totalPages).toBe(2)
  })

  it("rechaza un sort que el recurso no tiene", () => {
    const url = new URL("http://local/api/v1/existencias?sort=articuloNombre,asc")
    expect(() => paginar(filas, url, { cantidad: () => 1 })).toThrow("SORT:articuloNombre")
  })
})
