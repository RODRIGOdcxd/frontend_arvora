"use client"

import { CrudScreen } from "@/components/crud/crud-screen"
import { MAGNITUDES, etiquetaDe, etiquetaMagnitud } from "@/lib/domain/labels"
import { unidadSchema } from "@/lib/domain/schemas"
import type { UnidadMedida } from "@/lib/domain/types"
import { numeroONull, str } from "@/lib/form"

export function UnidadesScreen() {
  return (
    <CrudScreen<UnidadMedida>
      config={{
        title: "Unidades de medida",
        description: "UND, metro, kilogramo y el resto. Se eliminan solo si ningún artículo las usa.",
        endpoint: "/unidades-medida",
        queryKey: "unidades",
        defaultSort: "codigo,asc",
        searchPlaceholder: "Buscar por código o nombre",
        remove: "hard",
        defaultValues: { codigo: "", nombre: "", magnitud: "CONTEO", decimales: "0" },
        schema: () => unidadSchema,
        fields: [
          { name: "codigo", label: "Código", type: "text", required: true, placeholder: "KG" },
          { name: "nombre", label: "Nombre", type: "text", required: true },
          { name: "magnitud", label: "Magnitud", type: "select", required: true, options: MAGNITUDES },
          { name: "decimales", label: "Decimales", type: "number", required: true, step: "1" },
        ],
        columns: [
          { id: "codigo", header: "Código", sortKey: "codigo", cell: (fila) => fila.codigo },
          { id: "nombre", header: "Nombre", sortKey: "nombre", cell: (fila) => fila.nombre },
          {
            id: "magnitud",
            header: "Magnitud",
            cell: (fila) => etiquetaDe(etiquetaMagnitud, fila.magnitud),
          },
          { id: "decimales", header: "Decimales", cell: (fila) => fila.decimales },
        ],
        toForm: (fila) => ({
          codigo: fila.codigo,
          nombre: fila.nombre,
          magnitud: fila.magnitud,
          decimales: String(fila.decimales),
        }),
        toPayload: (valores) => ({
          codigo: str(valores, "codigo").trim().toUpperCase(),
          nombre: str(valores, "nombre").trim(),
          magnitud: str(valores, "magnitud"),
          decimales: numeroONull(valores.decimales) ?? Number.NaN,
        }),
      }}
    />
  )
}
