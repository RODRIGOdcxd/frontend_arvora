"use client"

import { CrudScreen } from "@/components/crud/crud-screen"
import { ActivoBadge } from "@/components/crud/states"
import { CANALES, etiquetaCanal, etiquetaDe, FILTRO_ACTIVO, TIPOS_DOCUMENTO } from "@/lib/domain/labels"
import { clienteSchema } from "@/lib/domain/schemas"
import type { Cliente } from "@/lib/domain/types"
import { flag, str, textoONull } from "@/lib/form"

export function ClientesScreen() {
  return (
    <CrudScreen<Cliente>
      config={{
        title: "Clientes",
        description: "Clientes y prospectos. El documento es opcional, pero el tipo y el número van juntos.",
        endpoint: "/clientes",
        queryKey: "clientes",
        defaultSort: "nombre,asc",
        searchPlaceholder: "Buscar por nombre, teléfono, correo o documento",
        remove: "soft",
        filters: [{ name: "activo", label: "Estado", options: FILTRO_ACTIVO }],
        defaultValues: {
          tipoDocumento: "",
          numeroDocumento: "",
          nombre: "",
          telefono: "",
          email: "",
          direccion: "",
          ciudad: "",
          canalOrigen: "",
          notas: "",
          activo: true,
        },
        schema: () => clienteSchema,
        fields: [
          { name: "nombre", label: "Nombre o razón social", type: "text", required: true },
          { name: "tipoDocumento", label: "Tipo de documento", type: "select", options: TIPOS_DOCUMENTO },
          { name: "numeroDocumento", label: "Número de documento", type: "text" },
          { name: "telefono", label: "Teléfono", type: "text" },
          { name: "email", label: "Correo", type: "email" },
          { name: "ciudad", label: "Ciudad", type: "text" },
          { name: "direccion", label: "Dirección", type: "text" },
          { name: "canalOrigen", label: "Canal de origen", type: "select", options: CANALES },
          { name: "notas", label: "Notas", type: "textarea" },
          { name: "activo", label: "Activo", type: "checkbox" },
        ],
        columns: [
          { id: "nombre", header: "Nombre", sortKey: "nombre", cell: (fila) => fila.nombre },
          {
            id: "documento",
            header: "Documento",
            cell: (fila) =>
              fila.tipoDocumento ? `${fila.tipoDocumento} ${fila.numeroDocumento ?? ""}` : "Sin documento",
          },
          { id: "telefono", header: "Teléfono", cell: (fila) => fila.telefono ?? "—" },
          {
            id: "canal",
            header: "Canal",
            cell: (fila) => etiquetaDe(etiquetaCanal, fila.canalOrigen),
          },
          { id: "activo", header: "Estado", cell: (fila) => <ActivoBadge activo={fila.activo} /> },
        ],
        toForm: (fila) => ({
          tipoDocumento: fila.tipoDocumento ?? "",
          numeroDocumento: fila.numeroDocumento ?? "",
          nombre: fila.nombre,
          telefono: fila.telefono ?? "",
          email: fila.email ?? "",
          direccion: fila.direccion ?? "",
          ciudad: fila.ciudad ?? "",
          canalOrigen: fila.canalOrigen ?? "",
          notas: fila.notas ?? "",
          activo: fila.activo,
        }),
        toPayload: (valores) => ({
          tipoDocumento: str(valores, "tipoDocumento") || null,
          numeroDocumento: textoONull(valores.numeroDocumento),
          nombre: str(valores, "nombre").trim(),
          telefono: textoONull(valores.telefono),
          email: textoONull(valores.email),
          direccion: textoONull(valores.direccion),
          ciudad: textoONull(valores.ciudad),
          canalOrigen: str(valores, "canalOrigen") || null,
          notas: textoONull(valores.notas),
          activo: flag(valores, "activo"),
        }),
      }}
    />
  )
}
