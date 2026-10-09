"use client"

import * as React from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"

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
import { useCatalogo, usePagina } from "@/lib/api/hooks"
import { notificarError, notificarOk } from "@/lib/api/notify"
import { ApiError } from "@/lib/api/problem"
import { TIPOS_MOVIMIENTO, etiquetaDe, etiquetaMovimiento } from "@/lib/domain/labels"
import { cantidadConSigno, reversoDe } from "@/lib/domain/movimiento"
import { erroresZod, movimientoSchema } from "@/lib/domain/schemas"
import type { Almacen, Articulo, Movimiento, Proveedor, TipoMovimiento, Usuario } from "@/lib/domain/types"
import type { FormValues } from "@/lib/form"
import { idONull, numeroONull, str, textoONull } from "@/lib/form"
import { formatCantidad, formatFechaHora } from "@/lib/format"

const ENTRADA = new Set(["SALDO_INICIAL", "COMPRA", "INGRESO_PRODUCCION"])
const SALIDA = new Set(["CONSUMO_PRODUCCION", "VENTA"])

const inicial: FormValues = {
  tipo: "COMPRA",
  articuloId: "",
  almacenId: "",
  cantidad: "",
  direccion: "ENTRADA",
  costoUnitario: "",
  proveedorId: "",
  documentoRef: "",
  usuarioId: "",
  nota: "",
  fecha: "",
}

export function MovimientosScreen() {
  const queryClient = useQueryClient()
  const [page, setPage] = React.useState(0)
  const [tipo, setTipo] = React.useState("")
  const [articuloId, setArticuloId] = React.useState("")
  const [almacenId, setAlmacenId] = React.useState("")
  const [desde, setDesde] = React.useState("")
  const [hasta, setHasta] = React.useState("")
  const [abierto, setAbierto] = React.useState(false)
  const [valores, setValores] = React.useState<FormValues>(inicial)
  const [errores, setErrores] = React.useState<Record<string, string>>({})

  const articulos = useCatalogo<Articulo>("articulos", "/articulos")
  const almacenes = useCatalogo<Almacen>("almacenes", "/almacenes")
  const proveedores = useCatalogo<Proveedor>("proveedores", "/proveedores", "razonSocial,asc")
  const usuarios = useCatalogo<Usuario>("usuarios", "/usuarios")
  const consulta = usePagina<Movimiento>("movimientos", "/movimientos-inventario", {
    page,
    size: 20,
    sort: "fecha,desc",
    filters: {
      tipo: tipo || undefined,
      articuloId: articuloId || undefined,
      almacenId: almacenId || undefined,
      desde: desde || undefined,
      hasta: hasta || undefined,
    },
  })

  const opcionesArticulo = (articulos.data?.content ?? [])
    .filter((articulo) => articulo.controlaStock)
    .map((articulo) => ({ value: String(articulo.id), label: `${articulo.codigo} · ${articulo.nombre}` }))
  const opcionesAlmacen = (almacenes.data?.content ?? []).map((almacen) => ({
    value: String(almacen.id),
    label: almacen.nombre,
  }))
  const opcionesProveedor = (proveedores.data?.content ?? []).map((proveedor) => ({
    value: String(proveedor.id),
    label: proveedor.razonSocial,
  }))
  const opcionesUsuario = (usuarios.data?.content ?? []).map((usuario) => ({
    value: String(usuario.id),
    label: usuario.nombre,
  }))

  const tipoActual = str(valores, "tipo")
  const pideDireccion = tipoActual === "AJUSTE" || tipoActual === "DEVOLUCION"
  const campos: FieldDef[] = [
    { name: "tipo", label: "Tipo", type: "select", required: true, options: TIPOS_MOVIMIENTO },
    { name: "articuloId", label: "Artículo", type: "select", required: true, options: opcionesArticulo },
    { name: "almacenId", label: "Almacén", type: "select", required: true, options: opcionesAlmacen },
    { name: "cantidad", label: "Cantidad", type: "number", required: true, step: "0.0001", help: "Siempre en positivo. El signo lo pone el tipo." },
    ...(pideDireccion
      ? [{ name: "direccion", label: "Dirección", type: "select" as const, required: true, options: [
          { value: "ENTRADA", label: "Entrada (suma)" },
          { value: "SALIDA", label: "Salida (resta)" },
        ] }]
      : []),
    { name: "costoUnitario", label: "Costo unitario sin IGV", type: "number", step: "0.0001", help: "Obligatorio en una compra." },
    { name: "proveedorId", label: "Proveedor", type: "select", options: opcionesProveedor },
    { name: "documentoRef", label: "Documento", type: "text", placeholder: "F001-123" },
    { name: "usuarioId", label: "Usuario que registra", type: "select", required: true, options: opcionesUsuario },
    { name: "fecha", label: "Fecha", type: "date" },
    { name: "nota", label: "Nota", type: "textarea" },
  ]

  const crear = useMutation({
    mutationFn: async (payload: unknown) => api.post<Movimiento>("/movimientos-inventario", payload),
    onSuccess: () => {
      notificarOk("Movimiento registrado")
      setAbierto(false)
      void queryClient.invalidateQueries({ queryKey: ["movimientos"] })
      void queryClient.invalidateQueries({ queryKey: ["existencias"] })
    },
    onError: (error) => {
      const apiError = notificarError(error)
      if (apiError instanceof ApiError) setErrores(apiError.fieldErrors())
    },
  })

  function enviar(event: React.FormEvent) {
    event.preventDefault()
    const tipoMovimiento = str(valores, "tipo") as TipoMovimiento
    const absoluta = numeroONull(valores.cantidad)
    const direccion = str(valores, "direccion") === "SALIDA" ? "SALIDA" : "ENTRADA"
    const cantidad = absoluta == null ? Number.NaN : cantidadConSigno(tipoMovimiento, absoluta, direccion)
    const payload = {
      tipo: tipoMovimiento,
      articuloId: idONull(valores.articuloId),
      almacenId: idONull(valores.almacenId),
      cantidad,
      costoUnitario: numeroONull(valores.costoUnitario),
      proveedorId: idONull(valores.proveedorId),
      cotizacionId: null,
      documentoRef: textoONull(valores.documentoRef),
      usuarioId: idONull(valores.usuarioId),
      nota: textoONull(valores.nota),
      fecha: str(valores, "fecha") ? new Date(`${str(valores, "fecha")}T12:00:00-05:00`).toISOString() : null,
    }
    const resultado = movimientoSchema.safeParse(payload)
    if (!resultado.success) {
      setErrores(erroresZod(resultado.error))
      return
    }
    setErrores({})
    crear.mutate(resultado.data)
  }

  function revertir(movimiento: Movimiento) {
    crear.mutate(reversoDe(movimiento))
  }

  const filas = consulta.data?.content ?? []

  return (
    <section className="page-enter flex flex-col gap-4">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Movimientos</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Libro de entradas y salidas. No se edita ni se borra: para corregir se registra un ajuste de signo contrario.
          </p>
        </div>
        <Button onClick={() => { setValores(inicial); setErrores({}); setAbierto(true) }}>Registrar</Button>
      </header>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        <Filtro etiqueta="Tipo" valor={tipo} opciones={TIPOS_MOVIMIENTO} onChange={setTipo} />
        <Filtro etiqueta="Artículo" valor={articuloId} opciones={opcionesArticulo} onChange={setArticuloId} />
        <Filtro etiqueta="Almacén" valor={almacenId} opciones={opcionesAlmacen} onChange={setAlmacenId} />
        <Input type="date" aria-label="Desde" value={desde} onChange={(event) => { setDesde(event.target.value); setPage(0) }} />
        <Input type="date" aria-label="Hasta" value={hasta} onChange={(event) => { setHasta(event.target.value); setPage(0) }} />
      </div>
      <div className="overflow-hidden rounded-xl border bg-card">
        {consulta.isLoading ? <TableSkeleton /> : null}
        {consulta.isError ? (
          <ErrorState
            titulo="No se pudo cargar el libro"
            detalle={consulta.error instanceof ApiError ? consulta.error.problem.detail : undefined}
            onRetry={() => void consulta.refetch()}
          />
        ) : null}
        {consulta.isSuccess && filas.length === 0 ? (
          <EmptyState titulo="Sin movimientos" descripcion="Registre un saldo inicial o una compra para ver stock." />
        ) : null}
        {consulta.isSuccess && filas.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Artículo</TableHead>
                <TableHead>Almacén</TableHead>
                <TableHead className="text-right">Cantidad</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filas.map((fila, indice) => (
                <TableRow key={fila.id} className="row-enter" style={{ animationDelay: `${indice * 25}ms` }}>
                  <TableCell>{formatFechaHora(fila.fecha)}</TableCell>
                  <TableCell>
                    <span className={ENTRADA.has(fila.tipo) ? "text-success" : SALIDA.has(fila.tipo) ? "text-destructive" : ""}>
                      {etiquetaDe(etiquetaMovimiento, fila.tipo)}
                    </span>
                  </TableCell>
                  <TableCell>
                    {fila.articuloCodigo}
                    <span className="block text-xs text-muted-foreground">{fila.articuloNombre}</span>
                  </TableCell>
                  <TableCell>{fila.almacenNombre}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatCantidad(fila.cantidad)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" disabled={crear.isPending} onClick={() => revertir(fila)}>
                      Revertir
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : null}
      </div>
      <Sheet open={abierto} onOpenChange={setAbierto}>
        <SheetContent className="data-[side=right]:sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>Registrar movimiento</SheetTitle>
            <SheetDescription>Compra y saldo inicial suman. Venta y consumo restan.</SheetDescription>
          </SheetHeader>
          <form className="flex flex-1 flex-col gap-4 overflow-y-auto px-4" onSubmit={enviar}>
            <FormFields
              fields={campos}
              values={valores}
              errors={errores}
              onChange={(name, value) => setValores((previo) => ({ ...previo, [name]: value }))}
            />
            <SheetFooter className="px-0">
              <Button type="button" variant="outline" onClick={() => setAbierto(false)}>Cancelar</Button>
              <Button type="submit" disabled={crear.isPending}>{crear.isPending ? "Guardando…" : "Registrar"}</Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </section>
  )
}

function Filtro({
  etiqueta,
  valor,
  opciones,
  onChange,
}: {
  etiqueta: string
  valor: string
  opciones: { value: string; label: string }[]
  onChange: (valor: string) => void
}) {
  return (
    <Select
      value={valor || null}
      items={[{ value: "", label: etiqueta }, ...opciones]}
      onValueChange={(nuevo) => onChange(nuevo ?? "")}
    >
      <SelectTrigger className="w-full" aria-label={etiqueta}>
        <SelectValue placeholder={etiqueta} />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectItem value="">{etiqueta}</SelectItem>
          {opciones.map((opcion) => (
            <SelectItem key={opcion.value} value={opcion.value}>
              {opcion.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
