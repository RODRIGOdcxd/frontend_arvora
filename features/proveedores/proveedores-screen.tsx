"use client"

import { CrudScreen } from "@/components/crud/crud-screen"
import { ActivoBadge } from "@/components/crud/states"
import { FILTRO_ACTIVO } from "@/lib/domain/labels"
import { proveedorSchema } from "@/lib/domain/schemas"
import type { Proveedor } from "@/lib/domain/types"
import { flag, str, textoONull } from "@/lib/form"

export function ProveedoresScreen() {
  return (
    <CrudScreen<Proveedor>
      config={{
        title: "Proveedores",
        description: "Metal, tableros, pintura y servicios. El RUC es opcional y, si se indica, debe ser válido.",
        endpoint: "/proveedores",
        queryKey: "proveedores",
        defaultSort: "razonSocial,asc",
        searchPlaceholder: "Buscar por razón social, nombre comercial o RUC",
        remove: "soft",
        filters: [{ name: "activo", label: "Estado", options: FILTRO_ACTIVO }],
        defaultValues: {
          ruc: "",
          razonSocial: "",
          nombreComercial: "",
          contacto: "",
          telefono: "",
          email: "",
          direccion: "",
          rubro: "",
          notas: "",
          activo: true,
        },
        schema: () => proveedorSchema,
        fields: [
          { name: "razonSocial", label: "Razón social", type: "text", required: true },
          { name: "nombreComercial", label: "Nombre comercial", type: "text" },
          {
            name: "ruc",
            label: "RUC",
            type: "text",
            placeholder: "20#########",
            help: "11 dígitos. Empieza por 10, 15, 17 o 20.",
          },
          { name: "rubro", label: "Rubro", type: "text", placeholder: "Metal, tableros, pintura…" },
          { name: "contacto", label: "Contacto", type: "text" },
          { name: "telefono", label: "Teléfono", type: "text" },
          { name: "email", label: "Correo", type: "email" },
          { name: "direccion", label: "Dirección", type: "text" },
          { name: "notas", label: "Notas", type: "textarea" },
          { name: "activo", label: "Activo", type: "checkbox" },
        ],
        columns: [
          { id: "razon", header: "Razón social", sortKey: "razonSocial", cell: (fila) => fila.razonSocial },
          { id: "ruc", header: "RUC", sortKey: "ruc", cell: (fila) => fila.ruc ?? "—" },
          { id: "rubro", header: "Rubro", cell: (fila) => fila.rubro ?? "—" },
          { id: "contacto", header: "Contacto", cell: (fila) => fila.contacto ?? "—" },
          { id: "activo", header: "Estado", cell: (fila) => <ActivoBadge activo={fila.activo} /> },
        ],
        toForm: (fila) => ({
          ruc: fila.ruc ?? "",
          razonSocial: fila.razonSocial,
          nombreComercial: fila.nombreComercial ?? "",
          contacto: fila.contacto ?? "",
          telefono: fila.telefono ?? "",
          email: fila.email ?? "",
          direccion: fila.direccion ?? "",
          rubro: fila.rubro ?? "",
          notas: fila.notas ?? "",
          activo: fila.activo,
        }),
        toPayload: (valores) => ({
          ruc: textoONull(valores.ruc),
          razonSocial: str(valores, "razonSocial").trim(),
          nombreComercial: textoONull(valores.nombreComercial),
          contacto: textoONull(valores.contacto),
          telefono: textoONull(valores.telefono),
          email: textoONull(valores.email),
          direccion: textoONull(valores.direccion),
          rubro: textoONull(valores.rubro),
          notas: textoONull(valores.notas),
          activo: flag(valores, "activo"),
        }),
      }}
    />
  )
}
