"use client"

import { CrudScreen } from "@/components/crud/crud-screen"
import { ActivoBadge } from "@/components/crud/states"
import { useCatalogo } from "@/lib/api/hooks"
import { FILTRO_ACTIVO } from "@/lib/domain/labels"
import { categoriaSchema } from "@/lib/domain/schemas"
import type { Categoria } from "@/lib/domain/types"
import { flag, idONull, str } from "@/lib/form"

export function CategoriasScreen() {
  const categorias = useCatalogo<Categoria>("categorias", "/categorias")
  const opciones = (categorias.data?.content ?? []).map((categoria) => ({
    value: String(categoria.id),
    label: categoria.nombre,
  }))

  return (
    <CrudScreen<Categoria>
      config={{
        title: "Categorías",
        description: "Clasificación de artículos. Una categoría puede colgar de otra, pero no de sí misma.",
        endpoint: "/categorias",
        queryKey: "categorias",
        defaultSort: "nombre,asc",
        searchPlaceholder: "Buscar por nombre",
        remove: "soft",
        filters: [{ name: "activo", label: "Estado", options: FILTRO_ACTIVO }],
        defaultValues: { nombre: "", padreId: "", activo: true },
        schema: () => categoriaSchema,
        fields: [
          { name: "nombre", label: "Nombre", type: "text", required: true },
          { name: "padreId", label: "Categoría padre", type: "select", options: opciones },
          { name: "activo", label: "Activo", type: "checkbox" },
        ],
        columns: [
          { id: "nombre", header: "Nombre", sortKey: "nombre", cell: (fila) => fila.nombre },
          { id: "padre", header: "Padre", cell: (fila) => fila.padreNombre ?? "—" },
          { id: "activo", header: "Estado", cell: (fila) => <ActivoBadge activo={fila.activo} /> },
        ],
        toForm: (fila) => ({
          nombre: fila.nombre,
          padreId: fila.padreId ? String(fila.padreId) : "",
          activo: fila.activo,
        }),
        toPayload: (valores) => ({
          nombre: str(valores, "nombre").trim(),
          padreId: idONull(valores.padreId),
          activo: flag(valores, "activo"),
        }),
      }}
    />
  )
}
