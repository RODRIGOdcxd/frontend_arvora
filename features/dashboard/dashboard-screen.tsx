"use client"

import Link from "next/link"

import { ErrorState, TableSkeleton } from "@/components/crud/states"
import { usePagina } from "@/lib/api/hooks"
import { ApiError } from "@/lib/api/problem"
import { esBajoStock } from "@/lib/domain/movimiento"
import { etiquetaDe, etiquetaMovimiento } from "@/lib/domain/labels"
import type { Articulo, Cliente, Cotizacion, Existencia, Movimiento, Proveedor } from "@/lib/domain/types"
import { formatCantidad, formatFechaHora } from "@/lib/format"

export function DashboardScreen() {
  const articulos = usePagina<Articulo>("articulos", "/articulos", { page: 0, size: 100, sort: "nombre,asc" })
  const clientes = usePagina<Cliente>("clientes", "/clientes", { page: 0, size: 1, sort: "nombre,asc" })
  const proveedores = usePagina<Proveedor>("proveedores", "/proveedores", { page: 0, size: 1, sort: "razonSocial,asc" })
  const borradores = usePagina<Cotizacion>("cotizaciones", "/cotizaciones", {
    page: 0,
    size: 1,
    sort: "fechaEmision,desc",
    filters: { estado: "BORRADOR" },
  })
  const movimientos = usePagina<Movimiento>("movimientos", "/movimientos-inventario", {
    page: 0,
    size: 5,
    sort: "fecha,desc",
  })
  const existencias = usePagina<Existencia>("existencias", "/existencias", {
    page: 0,
    size: 100,
    sort: "cantidad,desc",
  })

  const error = [articulos, clientes, proveedores, borradores, movimientos, existencias].find((consulta) => consulta.isError)
  if (error) {
    return (
      <ErrorState
        titulo="No se pudo armar el inicio"
        detalle={error.error instanceof ApiError ? error.error.problem.detail : undefined}
        onRetry={() => {
          void articulos.refetch()
          void clientes.refetch()
          void movimientos.refetch()
        }}
      />
    )
  }

  const cargando = articulos.isLoading || movimientos.isLoading || existencias.isLoading
  const catalogo = new Map((articulos.data?.content ?? []).map((articulo) => [articulo.id, articulo]))
  const bajos = (existencias.data?.content ?? []).filter((fila) => {
    const articulo = catalogo.get(fila.articuloId)
    return esBajoStock(fila.cantidad, articulo?.stockMinimo, articulo?.controlaStock ?? true)
  })

  return (
    <section className="page-enter flex flex-col gap-6">
      <header>
        <p className="text-sm font-medium text-wood">ARVORA & METAL S.A.C.</p>
        <h1 className="text-2xl font-semibold tracking-tight">Inicio</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Conteos tomados de los listados. El API todavía no expone un resumen propio: esta pantalla está marcada
          como composición del cliente.
        </p>
      </header>
      {cargando ? <TableSkeleton filas={3} /> : null}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Tarjeta etiqueta="Artículos" valor={articulos.data?.totalElements} href="/inventario/articulos" />
        <Tarjeta etiqueta="Clientes" valor={clientes.data?.totalElements} href="/ventas/clientes" />
        <Tarjeta etiqueta="Proveedores" valor={proveedores.data?.totalElements} href="/compras/proveedores" />
        <Tarjeta etiqueta="Cotizaciones en borrador" valor={borradores.data?.totalElements} href="/ventas/cotizaciones" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-xl border bg-card p-4">
          <h2 className="text-sm font-medium">Movimientos recientes</h2>
          <ul className="mt-3 divide-y">
            {(movimientos.data?.content ?? []).map((movimiento) => (
              <li key={movimiento.id} className="flex items-start justify-between gap-3 py-2 text-sm">
                <div>
                  <p className="font-medium">{movimiento.articuloNombre}</p>
                  <p className="text-xs text-muted-foreground">
                    {etiquetaDe(etiquetaMovimiento, movimiento.tipo)} · {formatFechaHora(movimiento.fecha)}
                  </p>
                </div>
                <span className={movimiento.cantidad < 0 ? "text-destructive" : "text-success"}>
                  {formatCantidad(movimiento.cantidad)}
                </span>
              </li>
            ))}
          </ul>
          <Link href="/inventario/movimientos" className="mt-2 inline-block text-sm text-wood hover:underline">
            Ver el libro
          </Link>
        </article>
        <article className="rounded-xl border bg-card p-4">
          <h2 className="text-sm font-medium">Stock bajo el mínimo</h2>
          {bajos.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">No hay existencias por debajo del mínimo en esta página.</p>
          ) : (
            <ul className="mt-3 divide-y">
              {bajos.slice(0, 6).map((fila) => (
                <li key={`${fila.articuloId}-${fila.almacenId}`} className="flex justify-between gap-3 py-2 text-sm">
                  <span>
                    {fila.articuloNombre}
                    <span className="block text-xs text-muted-foreground">{fila.almacenNombre}</span>
                  </span>
                  <span className="text-warning">{formatCantidad(fila.cantidad)}</span>
                </li>
              ))}
            </ul>
          )}
          <Link href="/inventario/existencias" className="mt-2 inline-block text-sm text-wood hover:underline">
            Ver existencias
          </Link>
        </article>
      </div>
    </section>
  )
}

function Tarjeta({ etiqueta, valor, href }: { etiqueta: string; valor?: number; href: string }) {
  return (
    <Link href={href} className="rounded-xl border bg-card p-4 transition-colors hover:border-wood">
      <p className="text-sm text-muted-foreground">{etiqueta}</p>
      <p className="mt-2 text-3xl font-semibold tabular-nums">{valor ?? "—"}</p>
    </Link>
  )
}
