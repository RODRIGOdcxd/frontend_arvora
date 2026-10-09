"use client"

import { CrudScreen } from "@/components/crud/crud-screen"
import { ActivoBadge } from "@/components/crud/states"
import { useCatalogo } from "@/lib/api/hooks"
import { FILTRO_ACTIVO } from "@/lib/domain/labels"
import { usuarioSchema } from "@/lib/domain/schemas"
import type { Rol, Usuario } from "@/lib/domain/types"
import { flag, str } from "@/lib/form"
import { formatFechaHora } from "@/lib/format"

export function UsuariosScreen() {
  const roles = useCatalogo<Rol>("roles", "/roles")
  const opciones = (roles.data?.content ?? []).map((rol) => ({
    value: String(rol.id),
    label: `${rol.codigo} · ${rol.nombre}`,
  }))

  return (
    <CrudScreen<Usuario>
      config={{
        title: "Usuarios",
        description: "Personas del taller. La contraseña se envía solo al crear o cambiarla; el API nunca la devuelve.",
        endpoint: "/usuarios",
        queryKey: "usuarios",
        defaultSort: "nombre,asc",
        searchPlaceholder: "Buscar por nombre o correo",
        remove: "soft",
        filters: [
          { name: "activo", label: "Estado", options: FILTRO_ACTIVO },
          { name: "rolId", label: "Rol", options: opciones },
        ],
        defaultValues: { email: "", nombre: "", password: "", rolId: "", activo: true },
        schema: (creando) => usuarioSchema(creando),
        fields: [
          { name: "nombre", label: "Nombre", type: "text", required: true },
          { name: "email", label: "Correo", type: "email", required: true },
          {
            name: "password",
            label: "Contraseña",
            type: "password",
            help: "Obligatoria al crear (8 a 72 caracteres). Al editar, déjela vacía para no cambiarla.",
          },
          { name: "rolId", label: "Rol", type: "select", required: true, options: opciones },
          { name: "activo", label: "Activo", type: "checkbox" },
        ],
        columns: [
          { id: "nombre", header: "Nombre", sortKey: "nombre", cell: (fila) => fila.nombre },
          { id: "email", header: "Correo", sortKey: "email", cell: (fila) => fila.email },
          { id: "rol", header: "Rol", cell: (fila) => fila.rolNombre },
          {
            id: "acceso",
            header: "Último acceso",
            cell: (fila) => formatFechaHora(fila.ultimoAcceso),
          },
          { id: "activo", header: "Estado", cell: (fila) => <ActivoBadge activo={fila.activo} /> },
        ],
        toForm: (fila) => ({
          email: fila.email,
          nombre: fila.nombre,
          password: "",
          rolId: String(fila.rolId),
          activo: fila.activo,
        }),
        toPayload: (valores) => ({
          email: str(valores, "email").trim(),
          nombre: str(valores, "nombre").trim(),
          password: str(valores, "password").trim() || null,
          rolId: Number(str(valores, "rolId")),
          activo: flag(valores, "activo"),
        }),
      }}
    />
  )
}
