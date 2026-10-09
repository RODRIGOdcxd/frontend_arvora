"use client"

import * as React from "react"
import Link from "next/link"

import { EmptyState, ErrorState, TableSkeleton } from "@/components/crud/states"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useCatalogo, usePagina } from "@/lib/api/hooks"
import { ApiError } from "@/lib/api/problem"
import { esBajoStock } from "@/lib/domain/movimiento"
import type { Almacen, Articulo, Existencia } from "@/lib/domain/types"
import { formatCantidad } from "@/lib/format"
import { cn } from "@/lib/utils"

export function ExistenciasScreen() {
  const [page, setPage] = React.useState(0)
  const [articuloId, setArticuloId] = React.useState("")
  const [almacenId, setAlmacenId] = React.useState("")
  const articulos = useCatalogo<Articulo>("articulos", "/articulos", "nombre,asc")
  const almacenes = useCatalogo<Almacen>("almacenes", "/almacenes")
  const consulta = usePagina<Existencia>("existencias", "/existencias", {
    page,
    size: 20,
    sort: "cantidad,desc",
    filters: {
      articuloId: articuloId || undefined,
      almacenId: almacenId || undefined,
    },
  })

  const minimos = new Map((articulos.data?.content ?? []).map((articulo) => [articulo.id, articulo]))
  const filas = consulta.data?.content ?? []

  return (
    <section className="page-enter flex flex-col gap-4">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Existencias</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Stock calculado con la suma de movimientos. Solo lectura. El resaltado de bajo stock compara la cantidad
          con el mínimo del artículo, porque la vista no trae ese dato.
        </p>
      </header>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Select
          value={articuloId || null}
          items={[
            { value: "", label: "Todos los artículos" },
            ...(articulos.data?.content ?? []).map((articulo) => ({
              value: String(articulo.id),
              label: `${articulo.codigo} · ${articulo.nombre}`,
            })),
          ]}
          onValueChange={(valor) => {
            setArticuloId(valor ?? "")
            setPage(0)
          }}
        >
          <SelectTrigger className="w-full sm:w-80" aria-label="Artículo">
            <SelectValue placeholder="Artículo" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="">Todos los artículos</SelectItem>
              {(articulos.data?.content ?? []).map((articulo) => (
                <SelectItem key={articulo.id} value={String(articulo.id)}>
                  {articulo.codigo} · {articulo.nombre}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <Select
          value={almacenId || null}
          items={[
            { value: "", label: "Todos los almacenes" },
            ...(almacenes.data?.content ?? []).map((almacen) => ({
              value: String(almacen.id),
              label: almacen.nombre,
            })),
          ]}
          onValueChange={(valor) => {
            setAlmacenId(valor ?? "")
            setPage(0)
          }}
        >
          <SelectTrigger className="w-full sm:w-64" aria-label="Almacén">
            <SelectValue placeholder="Almacén" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="">Todos los almacenes</SelectItem>
              {(almacenes.data?.content ?? []).map((almacen) => (
                <SelectItem key={almacen.id} value={String(almacen.id)}>
                  {almacen.nombre}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      <div className="overflow-hidden rounded-xl border bg-card">
        {consulta.isLoading ? <TableSkeleton /> : null}
        {consulta.isError ? (
          <ErrorState
            titulo="No se pudieron cargar las existencias"
            detalle={consulta.error instanceof ApiError ? consulta.error.problem.detail : undefined}
            onRetry={() => void consulta.refetch()}
          />
        ) : null}
        {consulta.isSuccess && filas.length === 0 ? (
          <EmptyState
            titulo="Sin existencias"
            descripcion="Un artículo aparece aquí cuando tiene al menos un movimiento. El stock en cero sin movimientos no sale en la vista."
          />
        ) : null}
        {consulta.isSuccess && filas.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Artículo</TableHead>
                <TableHead>Almacén</TableHead>
                <TableHead className="text-right">Cantidad</TableHead>
                <TableHead className="text-right">Mínimo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filas.map((fila, indice) => {
                const articulo = minimos.get(fila.articuloId)
                const bajo = esBajoStock(fila.cantidad, articulo?.stockMinimo, articulo?.controlaStock ?? true)
                return (
                  <TableRow
                    key={`${fila.articuloId}-${fila.almacenId}`}
                    className={cn("row-enter", bajo && "bg-warning/10")}
                    style={{ animationDelay: `${indice * 25}ms` }}
                  >
                    <TableCell>
                      <Link href={`/inventario/articulos/${fila.articuloId}`} className="hover:underline">
                        <span className="font-medium">{fila.articuloCodigo}</span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">{fila.articuloNombre}</span>
                      </Link>
                    </TableCell>
                    <TableCell>{fila.almacenNombre}</TableCell>
                    <TableCell className="text-right">{formatCantidad(fila.cantidad)}</TableCell>
                    <TableCell className="text-right">
                      {bajo ? <span className="font-medium text-warning">Bajo · </span> : null}
                      {articulo ? formatCantidad(articulo.stockMinimo) : "—"}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        ) : null}
        <footer className="flex items-center justify-end gap-2 border-t px-3 py-2">
          <Button variant="outline" size="sm" disabled={page <= 0} onClick={() => setPage((n) => n - 1)}>
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground">
            Página {(consulta.data?.number ?? 0) + 1} de {consulta.data?.totalPages ?? 0}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={!consulta.data || consulta.data.number + 1 >= consulta.data.totalPages}
            onClick={() => setPage((n) => n + 1)}
          >
            Siguiente
          </Button>
        </footer>
      </div>
    </section>
  )
}
