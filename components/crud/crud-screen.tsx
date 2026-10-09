"use client"

import * as React from "react"
import Link from "next/link"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { z } from "zod"
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon } from "lucide-react"

import { ConfirmDialog } from "@/components/crud/confirm-dialog"
import { FormFields, type FieldDef } from "@/components/crud/form-fields"
import { EmptyState, ErrorState, TableSkeleton } from "@/components/crud/states"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { api } from "@/lib/api/client"
import { usePagina } from "@/lib/api/hooks"
import { notificarError, notificarOk } from "@/lib/api/notify"
import { ApiError } from "@/lib/api/problem"
import { erroresZod } from "@/lib/domain/schemas"
import type { FormValues } from "@/lib/form"
import { cn } from "@/lib/utils"

export type CrudColumn<T> = {
  id: string
  header: string
  sortKey?: string
  className?: string
  cell: (row: T) => React.ReactNode
}

export type FilterDef = {
  name: string
  label: string
  options: { value: string; label: string }[]
}

export type CrudConfig<T extends { id: number }> = {
  title: string
  description: string
  endpoint: string
  queryKey: string
  columns: CrudColumn<T>[]
  fields: FieldDef[]
  defaultValues: FormValues
  toForm: (row: T) => FormValues
  toPayload: (values: FormValues, row: T | null) => unknown
  schema: (creando: boolean) => z.ZodType
  searchPlaceholder?: string
  filters?: FilterDef[]
  defaultSort: string
  remove: "soft" | "hard" | "anular" | "none"
  createHref?: string
  editHref?: (row: T) => string
}

const TEXTOS = {
  soft: {
    boton: "Desactivar",
    titulo: "Desactivar registro",
    detalle: "Dejará de aparecer como activo. El historial se conserva.",
    ok: "Registro desactivado",
  },
  hard: {
    boton: "Eliminar",
    titulo: "Eliminar registro",
    detalle: "Se borra solo si ningún otro dato lo está usando.",
    ok: "Registro eliminado",
  },
  anular: {
    boton: "Anular",
    titulo: "Anular cotización",
    detalle: "La cotización pasa a anulada. No se borra.",
    ok: "Cotización anulada",
  },
}

function useDebounce(valor: string, espera = 300) {
  const [estable, setEstable] = React.useState(valor)
  React.useEffect(() => {
    const timer = window.setTimeout(() => setEstable(valor), espera)
    return () => window.clearTimeout(timer)
  }, [valor, espera])
  return estable
}

export function CrudScreen<T extends { id: number }>({ config }: { config: CrudConfig<T> }) {
  const queryClient = useQueryClient()
  const [texto, setTexto] = React.useState("")
  const textoEstable = useDebounce(texto)
  const [page, setPage] = React.useState(0)
  const [size, setSize] = React.useState(20)
  const [sort, setSort] = React.useState(config.defaultSort)
  const [filtros, setFiltros] = React.useState<Record<string, string>>({})
  const [abierto, setAbierto] = React.useState(false)
  const [editando, setEditando] = React.useState<T | null>(null)
  const [valores, setValores] = React.useState<FormValues>(config.defaultValues)
  const [errores, setErrores] = React.useState<Record<string, string>>({})
  const [confirmar, setConfirmar] = React.useState<T | null>(null)

  React.useEffect(() => {
    setPage(0)
  }, [textoEstable, size, sort, filtros])

  const consulta = usePagina<T>(config.queryKey, config.endpoint, {
    page,
    size,
    sort,
    texto: textoEstable,
    filters: filtros,
  })

  const guardar = useMutation({
    mutationFn: async () => {
      const payload = config.toPayload(valores, editando)
      const esquema = config.schema(editando == null)
      const resultado = esquema.safeParse(payload)
      if (!resultado.success) {
        setErrores(erroresZod(resultado.error))
        throw new Error("validacion")
      }
      setErrores({})
      if (editando) return api.put(`${config.endpoint}/${editando.id}`, resultado.data)
      return api.post(config.endpoint, resultado.data)
    },
    onSuccess: () => {
      notificarOk(editando ? "Cambios guardados" : "Registro creado")
      setAbierto(false)
      void queryClient.invalidateQueries({ queryKey: [config.queryKey] })
    },
    onError: (error) => {
      if (error instanceof Error && error.message === "validacion") return
      const apiError = notificarError(error)
      if (apiError instanceof ApiError) setErrores(apiError.fieldErrors())
    },
  })

  const quitar = useMutation({
    mutationFn: (fila: T) => api.delete(`${config.endpoint}/${fila.id}`),
    onSuccess: () => {
      const modo = config.remove === "none" ? "soft" : config.remove
      notificarOk(TEXTOS[modo].ok)
      setConfirmar(null)
      void queryClient.invalidateQueries({ queryKey: [config.queryKey] })
    },
    onError: (error) => notificarError(error),
  })

  function abrirNuevo() {
    setEditando(null)
    setValores(config.defaultValues)
    setErrores({})
    setAbierto(true)
  }

  function abrirEdicion(fila: T) {
    setEditando(fila)
    setValores(config.toForm(fila))
    setErrores({})
    setAbierto(true)
  }

  function alternarOrden(clave: string) {
    const [campo, direccion = "asc"] = sort.split(",")
    if (campo === clave) setSort(`${clave},${direccion === "asc" ? "desc" : "asc"}`)
    else setSort(`${clave},asc`)
  }

  const filas = consulta.data?.content ?? []
  const totalPages = consulta.data?.totalPages ?? 0
  const modo = config.remove === "none" ? null : TEXTOS[config.remove]
  const usaFormulario = config.fields.length > 0 && !config.editHref

  return (
    <section className="page-enter flex flex-col gap-4">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{config.title}</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{config.description}</p>
        </div>
        {config.createHref ? (
          <Button render={<Link href={config.createHref} />}>
            <PlusIcon />
            Nuevo
          </Button>
        ) : usaFormulario ? (
          <Button onClick={abrirNuevo}>
            <PlusIcon />
            Nuevo
          </Button>
        ) : null}
      </header>

      <div className="flex flex-col gap-2 rounded-xl border bg-card p-3 sm:flex-row sm:flex-wrap sm:items-center">
        <Input
          value={texto}
          onChange={(event) => setTexto(event.target.value)}
          placeholder={config.searchPlaceholder ?? "Buscar"}
          aria-label="Buscar"
          className="sm:max-w-xs"
        />
        {(config.filters ?? []).map((filtro) => (
          <Select
            key={filtro.name}
            value={filtros[filtro.name] ?? ""}
            items={[{ value: "", label: filtro.label }, ...filtro.options]}
            onValueChange={(valor) =>
              setFiltros((previo) => ({ ...previo, [filtro.name]: valor ?? "" }))
            }
          >
            <SelectTrigger className="w-full sm:w-44" aria-label={filtro.label}>
              <SelectValue placeholder={filtro.label} />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="">{filtro.label}</SelectItem>
                {filtro.options.map((opcion) => (
                  <SelectItem key={opcion.value} value={opcion.value}>
                    {opcion.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        {consulta.isLoading ? <TableSkeleton /> : null}
        {consulta.isError ? (
          <ErrorState
            titulo="No se pudo cargar el listado"
            detalle={consulta.error instanceof ApiError ? consulta.error.problem.detail : undefined}
            onRetry={() => void consulta.refetch()}
          />
        ) : null}
        {consulta.isSuccess && filas.length === 0 ? (
          <EmptyState
            titulo="No hay resultados"
            descripcion="Pruebe con otro texto o quite los filtros. Si la lista está vacía, cree el primer registro."
          />
        ) : null}
        {consulta.isSuccess && filas.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                {config.columns.map((columna) => (
                  <TableHead key={columna.id} className={columna.className}>
                    {columna.sortKey ? (
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 hover:text-foreground"
                        onClick={() => alternarOrden(columna.sortKey!)}
                      >
                        {columna.header}
                        {sort.startsWith(`${columna.sortKey},`) ? (sort.endsWith("desc") ? " ↓" : " ↑") : ""}
                      </button>
                    ) : (
                      columna.header
                    )}
                  </TableHead>
                ))}
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filas.map((fila, indice) => (
                <TableRow key={fila.id} className="row-enter" style={{ animationDelay: `${indice * 25}ms` }}>
                  {config.columns.map((columna) => (
                    <TableCell key={columna.id} className={columna.className}>
                      {columna.cell(fila)}
                    </TableCell>
                  ))}
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {config.editHref ? (
                        <Button variant="ghost" size="sm" render={<Link href={config.editHref(fila)} />}>
                          Abrir
                        </Button>
                      ) : usaFormulario ? (
                        <Button variant="ghost" size="sm" onClick={() => abrirEdicion(fila)}>
                          Editar
                        </Button>
                      ) : null}
                      {modo ? (
                        <Button variant="ghost" size="sm" onClick={() => setConfirmar(fila)}>
                          {modo.boton}
                        </Button>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : null}
        <footer className="flex flex-col gap-2 border-t px-3 py-2 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>
            {consulta.data ? `${consulta.data.totalElements} registros` : " "}
          </span>
          <div className="flex items-center gap-2">
            <Select
              value={String(size)}
              items={[
                { value: "10", label: "10" },
                { value: "20", label: "20" },
                { value: "50", label: "50" },
              ]}
              onValueChange={(valor) => setSize(Number(valor ?? 20))}
            >
              <SelectTrigger className="w-20" aria-label="Filas por página">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon-sm" disabled={page <= 0} onClick={() => setPage((n) => n - 1)} aria-label="Página anterior">
              <ChevronLeftIcon />
            </Button>
            <span>
              {totalPages === 0 ? "0" : page + 1} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon-sm"
              disabled={totalPages === 0 || page + 1 >= totalPages}
              onClick={() => setPage((n) => n + 1)}
              aria-label="Página siguiente"
            >
              <ChevronRightIcon />
            </Button>
          </div>
        </footer>
      </div>

      <Sheet open={abierto} onOpenChange={setAbierto}>
        <SheetContent className="data-[side=right]:sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>{editando ? "Editar" : "Nuevo"}</SheetTitle>
            <SheetDescription>{config.title}</SheetDescription>
          </SheetHeader>
          <form
            className="flex flex-1 flex-col gap-4 overflow-y-auto px-4"
            onSubmit={(event) => {
              event.preventDefault()
              guardar.mutate()
            }}
          >
            <FormFields
              fields={config.fields}
              values={valores}
              errors={errores}
              onChange={(name, value) => setValores((previo) => ({ ...previo, [name]: value }))}
            />
            <SheetFooter className="px-0">
              <Button type="button" variant="outline" onClick={() => setAbierto(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={guardar.isPending} className={cn(guardar.isPending && "opacity-80")}>
                {guardar.isPending ? "Guardando…" : "Guardar"}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      {modo ? (
        <ConfirmDialog
          open={confirmar != null}
          title={modo.titulo}
          description={modo.detalle}
          confirmLabel={modo.boton}
          pending={quitar.isPending}
          onOpenChange={(open) => {
            if (!open) setConfirmar(null)
          }}
          onConfirm={() => {
            if (confirmar) quitar.mutate(confirmar)
          }}
        />
      ) : null}
    </section>
  )
}
