"use client"

import * as React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"

import { FormFields, type FieldDef } from "@/components/crud/form-fields"
import { ActivoBadge, ErrorState, TableSkeleton } from "@/components/crud/states"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { api } from "@/lib/api/client"
import { useCatalogo, useLista } from "@/lib/api/hooks"
import { notificarError, notificarOk } from "@/lib/api/notify"
import { ApiError } from "@/lib/api/problem"
import { TIPOS_ARTICULO, TIPOS_CORTE, etiquetaDe, etiquetaTipoArticulo } from "@/lib/domain/labels"
import { articuloSchema, componenteSchema, erroresZod, imagenSchema, precioEscalaSchema } from "@/lib/domain/schemas"
import type { Articulo, ArticuloImagen, Categoria, Componente, PrecioEscala, Proveedor, UnidadMedida } from "@/lib/domain/types"
import type { FormValues } from "@/lib/form"
import { flag, idONull, numeroONull, str, textoONull } from "@/lib/form"
import { formatCantidad, formatMoney } from "@/lib/format"

const vacio: FormValues = {
  codigo: "",
  nombre: "",
  descripcion: "",
  tipo: "PRODUCTO",
  categoriaId: "",
  unidadMedidaId: "",
  seCompra: false,
  seVende: true,
  controlaStock: true,
  marca: "",
  colorAcabado: "",
  proveedorHabitualId: "",
  costoReferencia: "",
  precioVenta: "",
  stockMinimo: "0",
  activo: true,
  largoMm: "",
  anchoMm: "",
  altoMm: "",
  espesorMm: "",
  diametroMm: "",
  tipoCorte: "NINGUNO",
  respetaVeta: false,
}

function desdeArticulo(articulo: Articulo): FormValues {
  return {
    codigo: articulo.codigo,
    nombre: articulo.nombre,
    descripcion: articulo.descripcion ?? "",
    tipo: articulo.tipo,
    categoriaId: articulo.categoriaId ? String(articulo.categoriaId) : "",
    unidadMedidaId: String(articulo.unidadMedidaId),
    seCompra: articulo.seCompra,
    seVende: articulo.seVende,
    controlaStock: articulo.controlaStock,
    marca: articulo.marca ?? "",
    colorAcabado: articulo.colorAcabado ?? "",
    proveedorHabitualId: articulo.proveedorHabitualId ? String(articulo.proveedorHabitualId) : "",
    costoReferencia: articulo.costoReferencia == null ? "" : String(articulo.costoReferencia),
    precioVenta: articulo.precioVenta == null ? "" : String(articulo.precioVenta),
    stockMinimo: String(articulo.stockMinimo),
    activo: articulo.activo,
    largoMm: articulo.largoMm == null ? "" : String(articulo.largoMm),
    anchoMm: articulo.anchoMm == null ? "" : String(articulo.anchoMm),
    altoMm: articulo.altoMm == null ? "" : String(articulo.altoMm),
    espesorMm: articulo.espesorMm == null ? "" : String(articulo.espesorMm),
    diametroMm: articulo.diametroMm == null ? "" : String(articulo.diametroMm),
    tipoCorte: articulo.tipoCorte,
    respetaVeta: articulo.respetaVeta,
  }
}

function payloadDe(valores: FormValues, version: number | null) {
  return {
    codigo: str(valores, "codigo").trim(),
    nombre: str(valores, "nombre").trim(),
    descripcion: textoONull(valores.descripcion),
    tipo: str(valores, "tipo"),
    categoriaId: idONull(valores.categoriaId),
    unidadMedidaId: idONull(valores.unidadMedidaId),
    seCompra: flag(valores, "seCompra"),
    seVende: flag(valores, "seVende"),
    controlaStock: str(valores, "tipo") === "SERVICIO" ? false : flag(valores, "controlaStock"),
    largoMm: numeroONull(valores.largoMm),
    anchoMm: numeroONull(valores.anchoMm),
    altoMm: numeroONull(valores.altoMm),
    espesorMm: numeroONull(valores.espesorMm),
    diametroMm: numeroONull(valores.diametroMm),
    tipoCorte: str(valores, "tipoCorte") || "NINGUNO",
    respetaVeta: flag(valores, "respetaVeta"),
    marca: textoONull(valores.marca),
    colorAcabado: textoONull(valores.colorAcabado),
    proveedorHabitualId: idONull(valores.proveedorHabitualId),
    costoReferencia: numeroONull(valores.costoReferencia),
    precioVenta: numeroONull(valores.precioVenta),
    stockMinimo: numeroONull(valores.stockMinimo) ?? 0,
    activo: flag(valores, "activo"),
    version,
  }
}

export function ArticuloEditor({ id }: { id: string }) {
  const nuevo = id === "nuevo"
  const numerico = Number(id)
  const router = useRouter()
  const queryClient = useQueryClient()
  const consulta = useQuery({
    queryKey: ["articulo", id],
    queryFn: () => api.get<Articulo>(`/articulos/${numerico}`),
    enabled: !nuevo,
  })
  const [valores, setValores] = React.useState<FormValues>(vacio)
  const [errores, setErrores] = React.useState<Record<string, string>>({})

  React.useEffect(() => {
    if (consulta.data) setValores(desdeArticulo(consulta.data))
  }, [consulta.data])

  const categorias = useCatalogo<Categoria>("categorias", "/categorias")
  const unidades = useCatalogo<UnidadMedida>("unidades", "/unidades-medida", "codigo,asc")
  const proveedores = useCatalogo<Proveedor>("proveedores", "/proveedores", "razonSocial,asc")
  const articulos = useCatalogo<Articulo>("articulos", "/articulos")

  const datos: FieldDef[] = [
    { name: "codigo", label: "Código", type: "text", required: true },
    { name: "nombre", label: "Nombre", type: "text", required: true },
    { name: "tipo", label: "Tipo", type: "select", required: true, options: TIPOS_ARTICULO },
    {
      name: "categoriaId",
      label: "Categoría",
      type: "select",
      options: (categorias.data?.content ?? []).map((item) => ({ value: String(item.id), label: item.nombre })),
    },
    {
      name: "unidadMedidaId",
      label: "Unidad de stock",
      type: "select",
      required: true,
      options: (unidades.data?.content ?? []).map((item) => ({ value: String(item.id), label: `${item.codigo} · ${item.nombre}` })),
    },
    {
      name: "proveedorHabitualId",
      label: "Proveedor habitual",
      type: "select",
      options: (proveedores.data?.content ?? []).map((item) => ({ value: String(item.id), label: item.razonSocial })),
    },
    { name: "marca", label: "Marca", type: "text" },
    { name: "colorAcabado", label: "Color o acabado", type: "text", placeholder: "Cedro caramelo" },
    { name: "costoReferencia", label: "Costo de referencia sin IGV", type: "number", step: "0.0001" },
    { name: "precioVenta", label: "Precio de lista con IGV", type: "number", step: "0.01" },
    { name: "stockMinimo", label: "Stock mínimo", type: "number", step: "0.0001" },
    { name: "descripcion", label: "Descripción", type: "textarea" },
    { name: "seCompra", label: "Se compra", type: "checkbox" },
    { name: "seVende", label: "Se vende", type: "checkbox" },
    { name: "controlaStock", label: "Controla stock", type: "checkbox", help: "Un servicio siempre queda en falso." },
    { name: "activo", label: "Activo", type: "checkbox" },
  ]
  const medidas: FieldDef[] = [
    { name: "tipoCorte", label: "Tipo de corte", type: "select", options: TIPOS_CORTE },
    { name: "largoMm", label: "Largo (mm)", type: "number", step: "0.01" },
    { name: "anchoMm", label: "Ancho (mm)", type: "number", step: "0.01" },
    { name: "altoMm", label: "Alto (mm)", type: "number", step: "0.01" },
    { name: "espesorMm", label: "Espesor (mm)", type: "number", step: "0.01" },
    { name: "diametroMm", label: "Diámetro (mm)", type: "number", step: "0.01" },
    { name: "respetaVeta", label: "Respeta la veta", type: "checkbox", help: "En tableros como el cedro caramelo no se rotan las piezas." },
  ]

  const guardar = useMutation({
    mutationFn: async () => {
      const payload = payloadDe(valores, nuevo ? null : (consulta.data?.version ?? null))
      const resultado = articuloSchema.safeParse(payload)
      if (!resultado.success) {
        setErrores(erroresZod(resultado.error))
        throw new Error("validacion")
      }
      setErrores({})
      if (nuevo) return api.post<Articulo>("/articulos", resultado.data)
      return api.put<Articulo>(`/articulos/${numerico}`, resultado.data)
    },
    onSuccess: (articulo) => {
      notificarOk(nuevo ? "Artículo creado" : "Artículo guardado")
      void queryClient.invalidateQueries({ queryKey: ["articulos"] })
      void queryClient.invalidateQueries({ queryKey: ["articulo", String(articulo.id)] })
      if (nuevo) router.replace(`/inventario/articulos/${articulo.id}`)
    },
    onError: (error) => {
      if (error instanceof Error && error.message === "validacion") return
      const apiError = notificarError(error)
      if (apiError instanceof ApiError) setErrores(apiError.fieldErrors())
    },
  })

  if (!nuevo && consulta.isLoading) return <TableSkeleton />
  if (!nuevo && consulta.isError) {
    return (
      <ErrorState
        titulo="No se encontró el artículo"
        detalle={consulta.error instanceof ApiError ? consulta.error.problem.detail : undefined}
      />
    )
  }

  return (
    <section className="page-enter flex flex-col gap-4">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm text-wood">{nuevo ? "Nuevo artículo" : etiquetaDe(etiquetaTipoArticulo, consulta.data?.tipo)}</p>
          <h1 className="text-2xl font-semibold tracking-tight">{nuevo ? "Crear artículo" : consulta.data?.nombre}</h1>
          {!nuevo && consulta.data ? (
            <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <span>{consulta.data.codigo}</span>
              <ActivoBadge activo={consulta.data.activo} />
              <span>Versión {consulta.data.version}</span>
            </div>
          ) : null}
        </div>
        <Button onClick={() => guardar.mutate()} disabled={guardar.isPending}>
          {guardar.isPending ? "Guardando…" : "Guardar datos"}
        </Button>
      </header>
      <Tabs defaultValue="datos">
        <TabsList className="flex h-auto flex-wrap">
          <TabsTrigger value="datos">Datos</TabsTrigger>
          <TabsTrigger value="medidas">Medidas y corte</TabsTrigger>
          <TabsTrigger value="receta" disabled={nuevo}>Receta</TabsTrigger>
          <TabsTrigger value="precios" disabled={nuevo}>Precios por volumen</TabsTrigger>
          <TabsTrigger value="imagenes" disabled={nuevo}>Imágenes</TabsTrigger>
        </TabsList>
        <TabsContent value="datos" className="rounded-xl border bg-card p-4">
          <FormFields fields={datos} values={valores} errors={errores} onChange={(name, value) => setValores((previo) => ({ ...previo, [name]: value }))} />
        </TabsContent>
        <TabsContent value="medidas" className="rounded-xl border bg-card p-4">
          <p className="mb-4 text-sm text-muted-foreground">
            Lineal exige el largo. Panel exige largo, ancho y espesor. Un tubo de 6 m se guarda como 6000 mm.
          </p>
          <FormFields fields={medidas} values={valores} errors={errores} onChange={(name, value) => setValores((previo) => ({ ...previo, [name]: value }))} />
        </TabsContent>
        <TabsContent value="receta">
          {nuevo ? null : (
            <Receta articuloId={numerico} materiales={(articulos.data?.content ?? []).filter((item) => item.id !== numerico)} />
          )}
        </TabsContent>
        <TabsContent value="precios">
          {nuevo ? null : <Precios articuloId={numerico} />}
        </TabsContent>
        <TabsContent value="imagenes">
          {nuevo ? null : <Imagenes articuloId={numerico} />}
        </TabsContent>
      </Tabs>
    </section>
  )
}

function Receta({ articuloId, materiales }: { articuloId: number; materiales: Articulo[] }) {
  const queryClient = useQueryClient()
  const lista = useLista<Componente>(`componentes-${articuloId}`, `/articulos/${articuloId}/componentes`)
  const [valores, setValores] = React.useState<FormValues>({
    materialId: "",
    nombrePieza: "",
    cantidadPiezas: "1",
    largoMm: "",
    anchoMm: "",
    toleranciaMenosMm: "0",
    toleranciaMasMm: "0",
    cantidad: "",
    mermaPct: "0",
    orden: "0",
    notas: "",
  })
  const [errores, setErrores] = React.useState<Record<string, string>>({})
  const [editando, setEditando] = React.useState<number | null>(null)
  const guardar = useMutation({
    mutationFn: async () => {
      const payload = {
        materialId: idONull(valores.materialId),
        nombrePieza: textoONull(valores.nombrePieza),
        cantidadPiezas: numeroONull(valores.cantidadPiezas),
        largoMm: numeroONull(valores.largoMm),
        anchoMm: numeroONull(valores.anchoMm),
        toleranciaMenosMm: numeroONull(valores.toleranciaMenosMm),
        toleranciaMasMm: numeroONull(valores.toleranciaMasMm),
        cantidad: numeroONull(valores.cantidad),
        mermaPct: numeroONull(valores.mermaPct),
        orden: numeroONull(valores.orden),
        notas: textoONull(valores.notas),
      }
      const resultado = componenteSchema.safeParse(payload)
      if (!resultado.success) {
        setErrores(erroresZod(resultado.error))
        throw new Error("validacion")
      }
      if (resultado.data.materialId === articuloId) {
        setErrores({ materialId: "El material no puede ser el mismo producto" })
        throw new Error("validacion")
      }
      setErrores({})
      if (editando) return api.put(`/articulos/${articuloId}/componentes/${editando}`, resultado.data)
      return api.post(`/articulos/${articuloId}/componentes`, resultado.data)
    },
    onSuccess: () => {
      notificarOk("Receta actualizada")
      setEditando(null)
      void queryClient.invalidateQueries({ queryKey: [`componentes-${articuloId}`] })
    },
    onError: (error) => {
      if (error instanceof Error && error.message === "validacion") return
      notificarError(error)
    },
  })
  const quitar = useMutation({
    mutationFn: (componenteId: number) => api.delete(`/articulos/${articuloId}/componentes/${componenteId}`),
    onSuccess: () => {
      notificarOk("Componente quitado")
      void queryClient.invalidateQueries({ queryKey: [`componentes-${articuloId}`] })
    },
    onError: (error) => notificarError(error),
  })
  const campos: FieldDef[] = [
    {
      name: "materialId",
      label: "Material",
      type: "select",
      required: true,
      options: materiales.map((item) => ({ value: String(item.id), label: `${item.codigo} · ${item.nombre}` })),
    },
    { name: "nombrePieza", label: "Pieza", type: "text", placeholder: "Pata, tablero, travesaño" },
    { name: "cantidadPiezas", label: "Piezas", type: "number", step: "1" },
    { name: "largoMm", label: "Largo final (mm)", type: "number", step: "0.01" },
    { name: "anchoMm", label: "Ancho final (mm)", type: "number", step: "0.01" },
    { name: "cantidad", label: "Consumo directo", type: "number", step: "0.0001", help: "Kg de pintura, unidades de nivelador. O el largo de la pieza." },
    { name: "toleranciaMenosMm", label: "Tolerancia −", type: "number", step: "0.01" },
    { name: "toleranciaMasMm", label: "Tolerancia +", type: "number", step: "0.01" },
    { name: "mermaPct", label: "Merma %", type: "number", step: "0.01" },
    { name: "orden", label: "Orden", type: "number", step: "1" },
    { name: "notas", label: "Notas", type: "textarea" },
  ]
  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-hidden rounded-xl border bg-card">
        {lista.isLoading ? <TableSkeleton filas={3} /> : null}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pieza</TableHead>
              <TableHead>Material</TableHead>
              <TableHead>Medida / consumo</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {(lista.data ?? []).map((fila) => (
              <TableRow key={fila.id}>
                <TableCell>{fila.nombrePieza ?? "—"} · {fila.cantidadPiezas} pz</TableCell>
                <TableCell>{fila.materialCodigo}</TableCell>
                <TableCell>
                  {fila.largoMm != null ? `${formatCantidad(fila.largoMm, 2)} × ${formatCantidad(fila.anchoMm, 2)} mm` : formatCantidad(fila.cantidad)}
                  {fila.mermaPct ? ` · merma ${fila.mermaPct}%` : ""}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => {
                    setEditando(fila.id)
                    setValores({
                      materialId: String(fila.materialId),
                      nombrePieza: fila.nombrePieza ?? "",
                      cantidadPiezas: String(fila.cantidadPiezas),
                      largoMm: fila.largoMm == null ? "" : String(fila.largoMm),
                      anchoMm: fila.anchoMm == null ? "" : String(fila.anchoMm),
                      toleranciaMenosMm: String(fila.toleranciaMenosMm),
                      toleranciaMasMm: String(fila.toleranciaMasMm),
                      cantidad: fila.cantidad == null ? "" : String(fila.cantidad),
                      mermaPct: String(fila.mermaPct),
                      orden: String(fila.orden),
                      notas: fila.notas ?? "",
                    })
                  }}>Editar</Button>
                  <Button variant="ghost" size="sm" onClick={() => quitar.mutate(fila.id)}>Quitar</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <form className="rounded-xl border bg-card p-4" onSubmit={(event) => { event.preventDefault(); guardar.mutate() }}>
        <h2 className="mb-3 text-sm font-medium">{editando ? "Editar componente" : "Agregar componente"}</h2>
        <FormFields fields={campos} values={valores} errors={errores} onChange={(name, value) => setValores((previo) => ({ ...previo, [name]: value }))} />
        <Button className="mt-4" type="submit" disabled={guardar.isPending}>Guardar componente</Button>
      </form>
    </div>
  )
}

function Precios({ articuloId }: { articuloId: number }) {
  const queryClient = useQueryClient()
  const lista = useLista<PrecioEscala>(`precios-${articuloId}`, `/articulos/${articuloId}/precios-escala`)
  const [valores, setValores] = React.useState<FormValues>({ cantidadMinima: "", precioUnitario: "" })
  const [errores, setErrores] = React.useState<Record<string, string>>({})
  const [editando, setEditando] = React.useState<number | null>(null)
  const guardar = useMutation({
    mutationFn: async () => {
      const payload = {
        cantidadMinima: numeroONull(valores.cantidadMinima),
        precioUnitario: numeroONull(valores.precioUnitario),
      }
      const resultado = precioEscalaSchema.safeParse(payload)
      if (!resultado.success) {
        setErrores(erroresZod(resultado.error))
        throw new Error("validacion")
      }
      setErrores({})
      if (editando) return api.put(`/articulos/${articuloId}/precios-escala/${editando}`, resultado.data)
      return api.post(`/articulos/${articuloId}/precios-escala`, resultado.data)
    },
    onSuccess: () => {
      notificarOk("Precio guardado")
      setEditando(null)
      setValores({ cantidadMinima: "", precioUnitario: "" })
      void queryClient.invalidateQueries({ queryKey: [`precios-${articuloId}`] })
    },
    onError: (error) => {
      if (!(error instanceof Error && error.message === "validacion")) notificarError(error)
    },
  })
  const quitar = useMutation({
    mutationFn: (precioId: number) => api.delete(`/articulos/${articuloId}/precios-escala/${precioId}`),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: [`precios-${articuloId}`] }),
    onError: (error) => notificarError(error),
  })
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <div className="overflow-hidden rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Desde</TableHead>
              <TableHead>Precio con IGV</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {(lista.data ?? []).map((fila) => (
              <TableRow key={fila.id}>
                <TableCell>{formatCantidad(fila.cantidadMinima)}</TableCell>
                <TableCell>{formatMoney(fila.precioUnitario)}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => {
                    setEditando(fila.id)
                    setValores({ cantidadMinima: String(fila.cantidadMinima), precioUnitario: String(fila.precioUnitario) })
                  }}>Editar</Button>
                  <Button variant="ghost" size="sm" onClick={() => quitar.mutate(fila.id)}>Quitar</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <form className="rounded-xl border bg-card p-4" onSubmit={(event) => { event.preventDefault(); guardar.mutate() }}>
        <FormFields
          fields={[
            { name: "cantidadMinima", label: "Cantidad mínima", type: "number", required: true, step: "0.0001" },
            { name: "precioUnitario", label: "Precio unitario con IGV", type: "number", required: true, step: "0.01" },
          ]}
          values={valores}
          errors={errores}
          onChange={(name, value) => setValores((previo) => ({ ...previo, [name]: value }))}
        />
        <Button className="mt-4" type="submit">Guardar precio</Button>
      </form>
    </div>
  )
}

function Imagenes({ articuloId }: { articuloId: number }) {
  const queryClient = useQueryClient()
  const lista = useLista<ArticuloImagen>(`imagenes-${articuloId}`, `/articulos/${articuloId}/imagenes`)
  const [valores, setValores] = React.useState<FormValues>({ url: "", orden: "0", principal: false })
  const [errores, setErrores] = React.useState<Record<string, string>>({})
  const guardar = useMutation({
    mutationFn: async () => {
      const payload = {
        url: str(valores, "url").trim(),
        orden: numeroONull(valores.orden),
        principal: flag(valores, "principal"),
      }
      const resultado = imagenSchema.safeParse(payload)
      if (!resultado.success) {
        setErrores(erroresZod(resultado.error))
        throw new Error("validacion")
      }
      setErrores({})
      return api.post(`/articulos/${articuloId}/imagenes`, resultado.data)
    },
    onSuccess: () => {
      notificarOk("Imagen agregada")
      setValores({ url: "", orden: "0", principal: false })
      void queryClient.invalidateQueries({ queryKey: [`imagenes-${articuloId}`] })
    },
    onError: (error) => {
      if (!(error instanceof Error && error.message === "validacion")) notificarError(error)
    },
  })
  const quitar = useMutation({
    mutationFn: (imagenId: number) => api.delete(`/articulos/${articuloId}/imagenes/${imagenId}`),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: [`imagenes-${articuloId}`] }),
  })
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {(lista.data ?? []).map((imagen) => (
          <figure key={imagen.id} className="overflow-hidden rounded-xl border bg-card">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imagen.url} alt="" className="h-40 w-full object-cover" />
            <figcaption className="flex items-center justify-between gap-2 p-3 text-xs">
              <span>{imagen.principal ? "Principal" : `Orden ${imagen.orden}`}</span>
              <Button variant="ghost" size="sm" onClick={() => quitar.mutate(imagen.id)}>Quitar</Button>
            </figcaption>
          </figure>
        ))}
      </div>
      <form className="rounded-xl border bg-card p-4" onSubmit={(event) => { event.preventDefault(); guardar.mutate() }}>
        <p className="mb-3 text-sm text-muted-foreground">Solo se guarda la URL. El archivo vive fuera del ERP.</p>
        <FormFields
          fields={[
            { name: "url", label: "URL", type: "text", required: true, placeholder: "https://…" },
            { name: "orden", label: "Orden", type: "number", step: "1" },
            { name: "principal", label: "Imagen principal", type: "checkbox" },
          ]}
          values={valores}
          errors={errores}
          onChange={(name, value) => setValores((previo) => ({ ...previo, [name]: value }))}
        />
        <Button className="mt-4" type="submit">Agregar imagen</Button>
      </form>
    </div>
  )
}
