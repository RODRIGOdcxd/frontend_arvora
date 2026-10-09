import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { ActivoBadge, EmptyState } from "@/components/crud/states"

describe("estados del CRUD", () => {
  it("muestra el vacío con su mensaje", () => {
    render(<EmptyState titulo="No hay resultados" descripcion="Pruebe con otro texto." />)
    expect(screen.getByText("No hay resultados")).toBeInTheDocument()
    expect(screen.getByText("Pruebe con otro texto.")).toBeInTheDocument()
  })

  it("distingue un registro activo de uno inactivo", () => {
    const { rerender } = render(<ActivoBadge activo />)
    expect(screen.getByText("Activo")).toBeInTheDocument()
    rerender(<ActivoBadge activo={false} />)
    expect(screen.getByText("Inactivo")).toBeInTheDocument()
  })
})
