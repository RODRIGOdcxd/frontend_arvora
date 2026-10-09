"use client"

import { z } from "zod"

import { CrudScreen } from "@/components/crud/crud-screen"
import { ActivoBadge } from "@/components/crud/states"
import { etiquetaDe, etiquetaTipoArticulo, FILTRO_ACTIVO, TIPOS_ARTICULO } from "@/lib/domain/labels"
import type { Articulo } from "@/lib/domain/types"
import { formatMoney } from "@/lib/format"

export function ArticulosScreen() {
  return (
    <CrudScreen<Articulo>
      config={{
        title: "Artículos",
        description: "Productos, materias primas, insumos, reventa y servicios. El precio de lista incluye IGV.",
        endpoint: "/articulos",
        queryKey: "articulos",
        defaultSort: "nombre,asc",
        searchPlaceholder: "Buscar por código o nombre",
        remove: "soft",
        createHref: "/inventario/articulos/nuevo",
        editHref: (fila) => `/inventario/articulos/${fila.id}`,
        filters: [
          { name: "activo", label: "Estado", options: FILTRO_ACTIVO },
          { name: "tipo", label: "Tipo", options: TIPOS_ARTICULO },
        ],
        fields: [],
        defaultValues: {},
        schema: () => z.object({}),
        toForm: () => ({}),
        toPayload: () => ({}),
        columns: [
          { id: "codigo", header: "Código", sortKey: "codigo", cell: (fila) => fila.codigo },
          { id: "nombre", header: "Nombre", sortKey: "nombre", cell: (fila) => fila.nombre },
          {
            id: "tipo",
            header: "Tipo",
            sortKey: "tipo",
            cell: (fila) => etiquetaDe(etiquetaTipoArticulo, fila.tipo),
          },
          { id: "unidad", header: "Unidad", cell: (fila) => fila.unidadMedidaCodigo },
          {
            id: "precio",
            header: "Precio con IGV",
            className: "text-right",
            cell: (fila) => formatMoney(fila.precioVenta),
          },
          { id: "activo", header: "Estado", cell: (fila) => <ActivoBadge activo={fila.activo} /> },
        ],
      }}
    />
  )
}
