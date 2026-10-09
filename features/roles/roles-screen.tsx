"use client"

import { CrudScreen } from "@/components/crud/crud-screen"
import { ActivoBadge } from "@/components/crud/states"
import { FILTRO_ACTIVO } from "@/lib/domain/labels"
import { rolSchema } from "@/lib/domain/schemas"
import type { Rol } from "@/lib/domain/types"
import { flag, str } from "@/lib/form"

export function RolesScreen() {
  return (
    <CrudScreen<Rol>
      config={{
        title: "Roles",
        description: "Perfiles de acceso. Hoy cada usuario tiene un solo rol. El login llegará con Spring Security.",
        endpoint: "/roles",
        queryKey: "roles",
        defaultSort: "nombre,asc",
        searchPlaceholder: "Buscar por código o nombre",
        remove: "soft",
        filters: [{ name: "activo", label: "Estado", options: FILTRO_ACTIVO }],
        defaultValues: { codigo: "", nombre: "", activo: true },
        schema: () => rolSchema,
        fields: [
          { name: "codigo", label: "Código", type: "text", required: true, placeholder: "VENTAS" },
          { name: "nombre", label: "Nombre", type: "text", required: true },
          { name: "activo", label: "Activo", type: "checkbox" },
        ],
        columns: [
          { id: "codigo", header: "Código", sortKey: "codigo", cell: (fila) => fila.codigo },
          { id: "nombre", header: "Nombre", sortKey: "nombre", cell: (fila) => fila.nombre },
          { id: "activo", header: "Estado", cell: (fila) => <ActivoBadge activo={fila.activo} /> },
        ],
        toForm: (fila) => ({ codigo: fila.codigo, nombre: fila.nombre, activo: fila.activo }),
        toPayload: (valores) => ({
          codigo: str(valores, "codigo").trim().toUpperCase(),
          nombre: str(valores, "nombre").trim(),
          activo: flag(valores, "activo"),
        }),
      }}
    />
  )
}
