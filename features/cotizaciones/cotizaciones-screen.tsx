"use client"

import { z } from "zod"

import { CrudScreen } from "@/components/crud/crud-screen"
import { ESTADOS_COTIZACION, etiquetaDe, etiquetaEstado } from "@/lib/domain/labels"
import type { Cotizacion, EstadoCotizacion } from "@/lib/domain/types"
import { formatFecha, formatMoney } from "@/lib/format"
import { cn } from "@/lib/utils"

const TONOS: Record<EstadoCotizacion, string> = {
  BORRADOR: "bg-muted text-foreground",
  ENVIADA: "bg-wood/15 text-wood",
  ACEPTADA: "bg-success/15 text-success",
  RECHAZADA: "bg-destructive/10 text-destructive",
  VENCIDA: "bg-warning/15 text-warning",
  ANULADA: "bg-muted text-muted-foreground line-through",
}

export function EstadoBadge({ estado }: { estado: EstadoCotizacion }) {
  return (
    <span className={cn("inline-flex rounded-full px-2 py-0.5 text-xs font-medium", TONOS[estado])}>
      {etiquetaDe(etiquetaEstado, estado)}
    </span>
  )
}

export function CotizacionesScreen() {
  return (
    <CrudScreen<Cotizacion>
      config={{
        title: "Cotizaciones",
        description: "El subtotal, el IGV y el total los calcula el servidor. Las líneas solo se editan en borrador.",
        endpoint: "/cotizaciones",
        queryKey: "cotizaciones",
        defaultSort: "fechaEmision,desc",
        searchPlaceholder: "Buscar por número",
        remove: "anular",
        createHref: "/ventas/cotizaciones/nuevo",
        editHref: (fila) => `/ventas/cotizaciones/${fila.id}`,
        filters: [{ name: "estado", label: "Estado", options: ESTADOS_COTIZACION }],
        fields: [],
        defaultValues: {},
        schema: () => z.object({}),
        toForm: () => ({}),
        toPayload: () => ({}),
        columns: [
          { id: "numero", header: "Número", sortKey: "numero", cell: (fila) => fila.numero },
          { id: "cliente", header: "Cliente", cell: (fila) => fila.clienteNombre },
          {
            id: "fecha",
            header: "Emisión",
            sortKey: "fechaEmision",
            cell: (fila) => formatFecha(fila.fechaEmision),
          },
          { id: "estado", header: "Estado", cell: (fila) => <EstadoBadge estado={fila.estado} /> },
          {
            id: "total",
            header: "Total",
            sortKey: "total",
            className: "text-right",
            cell: (fila) => formatMoney(fila.total, fila.moneda),
          },
        ],
      }}
    />
  )
}
