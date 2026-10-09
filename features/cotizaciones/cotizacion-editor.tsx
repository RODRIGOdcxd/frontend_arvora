"use client"

import * as React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"

import { FormFields, type FieldDef } from "@/components/crud/form-fields"
import { ErrorState, TableSkeleton } from "@/components/crud/states"
import { EstadoBadge } from "@/features/cotizaciones/cotizaciones-screen"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { api } from "@/lib/api/client"
import { useCatalogo } from "@/lib/api/hooks"
import { notificarError, notificarOk } from "@/lib/api/notify"
import { ApiError } from "@/lib/api/problem"
import { MONEDAS } from "@/lib/domain/labels"
import { esErrorTotales, importeLinea, previewTotales } from "@/lib/domain/money"
import { cotizacionSchema, erroresZod, lineaSchema } from "@/lib/domain/schemas"
import type { Articulo, Cliente, Cotizacion, EstadoCotizacion, Usuario } from "@/lib/domain/types"
import type { FormValues } from "@/lib/form"
import { flag, idONull, numeroONull, str, textoONull } from "@/lib/form"
import { formatCantidad, formatMoney, hoyIso } from "@/lib/format"

const vacio: FormValues = {
  numero: "",
  clienteId: "",
  usuarioId: "",
  fechaEmision: hoyIso(),
  validaHasta: "",
  moneda: "PEN",
  preciosIncluyenIgv: true,
  tasaIgv: "0.18",
  descuento: "0",
  adelantoPct: "50",
  plazoEntregaDias: "",
  condiciones: "",
  notasInternas: "",
}

function payloadCabecera(valores: FormValues, version: number | null, estado?: EstadoCotizacion) {
  return {
    numero: textoONull(valores.numero),
    clienteId: idONull(valores.clienteId),
    usuarioId: idONull(valores.usuarioId),
    fechaEmision: textoONull(valores.fechaEmision),
    validaHasta: textoONull(valores.validaHasta),
    estado: estado ?? null,
    moneda: str(valores, "moneda") || "PEN",
    preciosIncluyenIgv: flag(valores, "preciosIncluyenIgv"),
    tasaIgv: numeroONull(valores.tasaIgv),
    descuento: numeroONull(valores.descuento) ?? 0,
    adelantoPct: numeroONull(valores.adelantoPct),
    plazoEntregaDias: numeroONull(valores.plazoEntregaDias),
    condiciones: textoONull(valores.condiciones),
    notasInternas: textoONull(valores.notasInternas),
    version,
  }
}

export function CotizacionEditor({ id }: { id: string }) {
  const nuevo = id === "nuevo"
  const numerico = Number(id)
  const router = useRouter()
  const queryClient = useQueryClient()
  const consulta = useQuery({
    queryKey: ["cotizacion", id],
    queryFn: () => api.get<Cotizacion>(`/cotizaciones/${numerico}`),
    enabled: !nuevo,
  })
  const clientes = useCatalogo<Cliente>("clientes", "/clientes")
  const usuarios = useCatalogo<Usuario>("usuarios", "/usuarios")
  const articulos = useCatalogo<Articulo>("articulos", "/articulos")
  const [valores, setValores] = React.useState<FormValues>(vacio)
  const [errores, setErrores] = React.useState<Record<string, string>>({})
  const [linea, setLinea] = React.useState<FormValues>({
    linea: "1",
    articuloId: "",
    descripcion: "",
    cantidad: "1",
    precioUnitario: "",
    descuento: "0",
    unidadCodigo: "",
    largoMm: "",
    anchoMm: "",
    altoMm: "",
  })
  const [erroresLinea, setErroresLinea] = React.useState<Record<string, string>>({})
  const cotizacion = consulta.data
  const [hidratada, setHidratada] = React.useState<Cotizacion | null>(null)
  if (cotizacion && cotizacion !== hidratada) {
    setHidratada(cotizacion)
    setValores({
      numero: cotizacion.numero,
      clienteId: String(cotizacion.clienteId),
      usuarioId: String(cotizacion.usuarioId),
      fechaEmision: cotizacion.fechaEmision,
      validaHasta: cotizacion.validaHasta ?? "",
      moneda: cotizacion.moneda,
      preciosIncluyenIgv: cotizacion.preciosIncluyenIgv,
      tasaIgv: String(cotizacion.tasaIgv),
      descuento: String(cotizacion.descuento),
      adelantoPct: String(cotizacion.adelantoPct),
      plazoEntregaDias: cotizacion.plazoEntregaDias == null ? "" : String(cotizacion.plazoEntregaDias),
      condiciones: cotizacion.condiciones ?? "",
      notasInternas: cotizacion.notasInternas ?? "",
    })
    const siguiente = Math.max(0, ...cotizacion.lineas.map((item) => item.linea)) + 1
    setLinea((previo) => ({ ...previo, linea: String(siguiente) }))
  }

  const editable = nuevo || consulta.data?.estado === "BORRADOR"
  const campos: FieldDef[] = [
    { name: "numero", label: "Número", type: "text", placeholder: "Se genera si se deja vacío", disabled: !editable },
    {
      name: "clienteId",
      label: "Cliente",
      type: "select",
      required: true,
      disabled: !editable,
      options: (clientes.data?.content ?? []).map((item) => ({ value: String(item.id), label: item.nombre })),
    },
    {
      name: "usuarioId",
      label: "Elaborada por",
      type: "select",
      required: true,
      disabled: !editable,
      options: (usuarios.data?.content ?? []).map((item) => ({ value: String(item.id), label: item.nombre })),
    },
    { name: "fechaEmision", label: "Emisión", type: "date", disabled: !editable },
    { name: "validaHasta", label: "Válida hasta", type: "date", disabled: !editable },
    { name: "moneda", label: "Moneda", type: "select", options: MONEDAS, disabled: !editable },
    { name: "tasaIgv", label: "Tasa IGV", type: "number", step: "0.0001", disabled: !editable, help: "0.18 es el 18%." },
    { name: "descuento", label: "Descuento de cabecera", type: "number", step: "0.01", disabled: !editable },
    { name: "adelantoPct", label: "Adelanto %", type: "number", step: "0.01", disabled: !editable },
    { name: "plazoEntregaDias", label: "Plazo (días)", type: "number", step: "1", disabled: !editable },
    { name: "preciosIncluyenIgv", label: "Los precios de línea incluyen IGV", type: "checkbox", disabled: !editable },
    { name: "condiciones", label: "Condiciones", type: "textarea", disabled: !editable },
    { name: "notasInternas", label: "Notas internas", type: "textarea" },
  ]

  const guardar = useMutation({
    mutationFn: async (estado?: EstadoCotizacion) => {
      const payload = payloadCabecera(valores, nuevo ? null : (consulta.data?.version ?? null), estado)
      const resultado = cotizacionSchema.safeParse(payload)
      if (!resultado.success) {
        setErrores(erroresZod(resultado.error))
        throw new Error("validacion")
      }
      setErrores({})
      if (nuevo) return api.post<Cotizacion>("/cotizaciones", resultado.data)
      return api.put<Cotizacion>(`/cotizaciones/${numerico}`, resultado.data)
    },
    onSuccess: (cotizacion) => {
      notificarOk("Cotización guardada")
      void queryClient.invalidateQueries({ queryKey: ["cotizaciones"] })
      void queryClient.setQueryData(["cotizacion", String(cotizacion.id)], cotizacion)
      if (nuevo) router.replace(`/ventas/cotizaciones/${cotizacion.id}`)
      else void queryClient.invalidateQueries({ queryKey: ["cotizacion", id] })
    },
    onError: (error) => {
      if (error instanceof Error && error.message === "validacion") return
      const apiError = notificarError(error)
      if (apiError instanceof ApiError) setErrores(apiError.fieldErrors())
    },
  })

  const guardarLinea = useMutation({
    mutationFn: async () => {
      const payload = {
        linea: numeroONull(linea.linea),
        articuloId: idONull(linea.articuloId),
        descripcion: textoONull(linea.descripcion),
        cantidad: numeroONull(linea.cantidad),
        precioUnitario: numeroONull(linea.precioUnitario),
        descuento: numeroONull(linea.descuento) ?? 0,
        unidadCodigo: textoONull(linea.unidadCodigo),
        largoMm: numeroONull(linea.largoMm),
        anchoMm: numeroONull(linea.anchoMm),
        altoMm: numeroONull(linea.altoMm),
      }
      const resultado = lineaSchema.safeParse(payload)
      if (!resultado.success) {
        setErroresLinea(erroresZod(resultado.error))
        throw new Error("validacion")
      }
      setErroresLinea({})
      return api.post(`/cotizaciones/${numerico}/lineas`, resultado.data)
    },
    onSuccess: async () => {
      notificarOk("Línea agregada")
      await queryClient.invalidateQueries({ queryKey: ["cotizacion", id] })
    },
    onError: (error) => {
      if (!(error instanceof Error && error.message === "validacion")) notificarError(error)
    },
  })

  const quitarLinea = useMutation({
    mutationFn: (lineaId: number) => api.delete(`/cotizaciones/${numerico}/lineas/${lineaId}`),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["cotizacion", id] }),
    onError: (error) => notificarError(error),
  })

  if (!nuevo && consulta.isLoading) return <TableSkeleton />
  if (!nuevo && consulta.isError) {
    return (
      <ErrorState
        titulo="No se encontró la cotización"
        detalle={consulta.error instanceof ApiError ? consulta.error.problem.detail : undefined}
      />
    )
  }

  const vista = previewTotales({
    importes: (cotizacion?.lineas ?? []).map((item) => item.importe),
    descuento: numeroONull(valores.descuento) ?? 0,
    tasaIgv: numeroONull(valores.tasaIgv) ?? 0.18,
    preciosIncluyenIgv: flag(valores, "preciosIncluyenIgv"),
  })
  const borradorLinea = numeroONull(linea.cantidad) != null && numeroONull(linea.precioUnitario) != null
    ? importeLinea(numeroONull(linea.cantidad) ?? 0, numeroONull(linea.precioUnitario) ?? 0, numeroONull(linea.descuento) ?? 0)
    : null

  return (
    <section className="page-enter flex flex-col gap-4">
      <header className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{nuevo ? "Nueva cotización" : cotizacion?.numero}</h1>
            {cotizacion ? <EstadoBadge estado={cotizacion.estado} /> : null}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Los totales oficiales salen del servidor. La vista previa usa la misma fórmula (IGV 18% por defecto) mientras escribe.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {editable ? (
            <Button onClick={() => guardar.mutate(undefined)} disabled={guardar.isPending}>
              Guardar cabecera
            </Button>
          ) : null}
          {cotizacion?.estado === "BORRADOR" ? (
            <Button variant="outline" onClick={() => guardar.mutate("ENVIADA")}>Enviar</Button>
          ) : null}
          {cotizacion?.estado === "ENVIADA" ? (
            <>
              <Button variant="outline" onClick={() => guardar.mutate("ACEPTADA")}>Aceptar</Button>
              <Button variant="outline" onClick={() => guardar.mutate("RECHAZADA")}>Rechazar</Button>
              <Button variant="outline" onClick={() => guardar.mutate("VENCIDA")}>Marcar vencida</Button>
            </>
          ) : null}
          {cotizacion && cotizacion.estado !== "ANULADA" && cotizacion.estado !== "BORRADOR" ? (
            <Button variant="destructive" onClick={() => guardar.mutate("ANULADA")}>Anular</Button>
          ) : null}
        </div>
      </header>

      <div className="grid gap-4 xl:grid-cols-[1fr_280px]">
        <form className="rounded-xl border bg-card p-4" onSubmit={(event) => { event.preventDefault(); guardar.mutate(undefined) }}>
          <FormFields
            fields={campos}
            values={valores}
            errors={errores}
            disabled={!editable && cotizacion?.estado === "ANULADA"}
            onChange={(name, value) => setValores((previo) => ({ ...previo, [name]: value }))}
          />
        </form>
        <aside className="h-fit rounded-xl border bg-card p-4">
          <h2 className="text-sm font-medium">Totales</h2>
          {cotizacion ? (
            <dl className="mt-3 space-y-1 text-sm">
              <Fila etiqueta="Subtotal (servidor)" valor={formatMoney(cotizacion.subtotal, cotizacion.moneda)} />
              <Fila etiqueta="Descuento" valor={formatMoney(cotizacion.descuento, cotizacion.moneda)} />
              <Fila etiqueta="IGV (servidor)" valor={formatMoney(cotizacion.igv, cotizacion.moneda)} />
              <Fila etiqueta="Total (servidor)" valor={formatMoney(cotizacion.total, cotizacion.moneda)} fuerte />
            </dl>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">Guarde la cabecera para obtener los totales oficiales.</p>
          )}
          <div className="mt-4 border-t pt-3 text-sm">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Vista previa</p>
            {esErrorTotales(vista) ? (
              <p className="mt-2 text-destructive">{vista.error}</p>
            ) : (
              <p className="mt-2">
                Base {formatMoney(vista.subtotal)} · IGV {formatMoney(vista.igv)} · Total {formatMoney(vista.total)}
              </p>
            )}
            {borradorLinea != null ? (
              <p className="mt-2 text-xs text-muted-foreground">
                La línea que está escribiendo sumaría {formatMoney(borradorLinea)} al guardar.
              </p>
            ) : null}
          </div>
        </aside>
      </div>

      {!nuevo && cotizacion ? (
        <div className="overflow-hidden rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead className="text-right">Cantidad</TableHead>
                <TableHead className="text-right">Precio</TableHead>
                <TableHead className="text-right">Importe</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {cotizacion.lineas.map((item) => (
                <TableRow key={item.id} className="row-enter">
                  <TableCell>{item.linea}</TableCell>
                  <TableCell>
                    {item.descripcion}
                    {item.largoMm ? (
                      <span className="block text-xs text-muted-foreground">
                        {formatCantidad(item.largoMm, 2)} × {formatCantidad(item.anchoMm, 2)} × {formatCantidad(item.altoMm, 2)} mm
                      </span>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-right">{formatCantidad(item.cantidad)} {item.unidadCodigo}</TableCell>
                  <TableCell className="text-right">{formatMoney(item.precioUnitario, cotizacion.moneda)}</TableCell>
                  <TableCell className="text-right">{formatMoney(item.importe, cotizacion.moneda)}</TableCell>
                  <TableCell className="text-right">
                    {editable ? (
                      <Button variant="ghost" size="sm" onClick={() => quitarLinea.mutate(item.id)}>Quitar</Button>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {editable ? (
            <form className="border-t p-4" onSubmit={(event) => { event.preventDefault(); guardarLinea.mutate() }}>
              <h2 className="mb-3 text-sm font-medium">Agregar línea</h2>
              <FormFields
                fields={[
                  { name: "linea", label: "Nº", type: "number", required: true, step: "1" },
                  {
                    name: "articuloId",
                    label: "Artículo",
                    type: "select",
                    help: "Vacío si el ítem es a medida.",
                    options: (articulos.data?.content ?? []).map((item) => ({
                      value: String(item.id),
                      label: `${item.codigo} · ${item.nombre}`,
                    })),
                  },
                  { name: "descripcion", label: "Descripción", type: "text" },
                  { name: "cantidad", label: "Cantidad", type: "number", required: true, step: "0.0001" },
                  { name: "precioUnitario", label: "Precio unitario", type: "number", step: "0.01", help: "Si hay artículo y lo omite, se copia el precio de lista." },
                  { name: "descuento", label: "Descuento", type: "number", step: "0.01" },
                  { name: "largoMm", label: "Largo mm", type: "number", step: "0.01" },
                  { name: "anchoMm", label: "Ancho mm", type: "number", step: "0.01" },
                  { name: "altoMm", label: "Alto mm", type: "number", step: "0.01" },
                ]}
                values={linea}
                errors={erroresLinea}
                onChange={(name, value) => {
                  setLinea((previo) => {
                    const siguiente = { ...previo, [name]: value }
                    if (name === "articuloId" && typeof value === "string" && value) {
                      const articulo = articulos.data?.content.find((item) => item.id === Number(value))
                      if (articulo?.precioVenta != null) siguiente.precioUnitario = String(articulo.precioVenta)
                      if (articulo) siguiente.descripcion = articulo.nombre
                    }
                    return siguiente
                  })
                }}
              />
              <Button className="mt-4" type="submit" disabled={guardarLinea.isPending}>Agregar línea</Button>
            </form>
          ) : (
            <p className="border-t p-4 text-sm text-muted-foreground">Las líneas solo se editan en borrador.</p>
          )}
        </div>
      ) : null}
    </section>
  )
}

function Fila({ etiqueta, valor, fuerte }: { etiqueta: string; valor: string; fuerte?: boolean }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted-foreground">{etiqueta}</dt>
      <dd className={fuerte ? "font-semibold" : ""}>{valor}</dd>
    </div>
  )
}
