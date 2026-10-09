"use client"

import * as React from "react"
import { DynamicForm, type FormField } from "@/components/dynamic-form"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DataTable } from "@/components/data-table"

const productFields: FormField[] = [
  {
    name: "id",
    label: "ID",
    type: "readonly",
    readonly: true,
    section: "Información Básica",
  },
  {
    name: "codigo",
    label: "Código",
    type: "text",
    placeholder: "Ej: PROD-001",
    required: true,
    section: "Información Básica",
  },
  {
    name: "nombre",
    label: "Nombre",
    type: "text",
    placeholder: "Nombre del producto",
    required: true,
    section: "Información Básica",
  },
  {
    name: "descripcion",
    label: "Descripción",
    type: "textarea",
    placeholder: "Descripción detallada del producto",
    section: "Información Básica",
  },
  {
    name: "marca",
    label: "Marca",
    type: "text",
    placeholder: "Marca del producto",
    section: "Información Básica",
  },
  {
    name: "modelo",
    label: "Modelo",
    type: "text",
    placeholder: "Modelo del producto",
    section: "Información Básica",
  },
  {
    name: "categoria",
    label: "Categoría",
    type: "select",
    options: [
      { label: "Electrónica", value: "electronica" },
      { label: "Ropa", value: "ropa" },
      { label: "Alimentos", value: "alimentos" },
      { label: "Muebles", value: "muebles" },
      { label: "Otros", value: "otros" },
    ],
    section: "Información Básica",
  },
  {
    name: "precioCompra",
    label: "Precio Compra",
    type: "number",
    placeholder: "0.00",
    required: true,
    section: "Precios y Stock",
  },
  {
    name: "precioVenta",
    label: "Precio Venta",
    type: "number",
    placeholder: "0.00",
    required: true,
    section: "Precios y Stock",
  },
  {
    name: "stock",
    label: "Stock",
    type: "number",
    placeholder: "0",
    section: "Precios y Stock",
  },
  {
    name: "stockMinimo",
    label: "Stock Mínimo",
    type: "number",
    placeholder: "0",
    section: "Precios y Stock",
  },
  {
    name: "stockReservado",
    label: "Stock Reservado",
    type: "number",
    placeholder: "0",
    section: "Precios y Stock",
  },
  {
    name: "stockDisponible",
    label: "Stock Disponible",
    type: "number",
    placeholder: "0",
    readonly: true,
    section: "Precios y Stock",
  },
  {
    name: "unidadMedida",
    label: "Unidad de Medida",
    type: "select",
    options: [
      { label: "Unidad", value: "unidad" },
      { label: "Kilogramo", value: "kg" },
      { label: "Litro", value: "lt" },
      { label: "Metro", value: "m" },
      { label: "Centímetro", value: "cm" },
    ],
    section: "Imágenes y Fechas",
  },
  {
    name: "imagenes",
    label: "Imágenes",
    type: "file",
    maxFiles: 5,
    section: "Imágenes y Fechas",
  },
  {
    name: "fechaCreacion",
    label: "Fecha Creación",
    type: "readonly",
    readonly: true,
    section: "Imágenes y Fechas",
  },
  {
    name: "fechaActualizacion",
    label: "Fecha Actualización",
    type: "readonly",
    readonly: true,
    section: "Imágenes y Fechas",
  },
]

interface ProductFormProps {
  data: any[]
  onAddProduct?: (product: Record<string, any>) => Promise<void> | void
}

export function ProductForm({ data, onAddProduct }: ProductFormProps) {
  const [isFormVisible, setIsFormVisible] = React.useState(false)
  const [editingProduct, setEditingProduct] = React.useState<Record<string, any> | null>(null)

  const handleSubmit = async (values: Record<string, any>) => {
    if (onAddProduct) {
      await onAddProduct(values)
    } else {
      console.log("Producto guardado:", values)
    }
    setIsFormVisible(false)
    setEditingProduct(null)
  }

  const initialValues = editingProduct || {
    id: "",
    codigo: "",
    nombre: "",
    descripcion: "",
    marca: "",
    modelo: "",
    categoria: "",
    precioCompra: "",
    precioVenta: "",
    stock: "",
    stockMinimo: "",
    stockReservado: "",
    stockDisponible: "",
    unidadMedida: "",
    imagenes: [],
    fechaCreacion: new Date().toISOString(),
    fechaActualizacion: new Date().toISOString(),
  }

  return (
    <Tabs defaultValue="formulario" className="w-full">
      <TabsList>
        <TabsTrigger value="formulario">Formulario</TabsTrigger>
        <TabsTrigger value="tabla">Tabla</TabsTrigger>
      </TabsList>

      <TabsContent value="formulario" className="space-y-4">
        {isFormVisible && (
          <DynamicForm
            title={editingProduct ? "Editar Producto" : "Crear Nuevo Producto"}
            description={editingProduct ? "Actualiza la información del producto" : "Ingresa los datos del nuevo producto"}
            fields={productFields}
            initialValues={initialValues}
            onSubmit={handleSubmit}
            submitLabel={editingProduct ? "Actualizar" : "Crear"}
            onCancel={() => {
              setIsFormVisible(false)
              setEditingProduct(null)
            }}
          />
        )}

        {!isFormVisible && (
          <button
            onClick={() => setIsFormVisible(true)}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            + Nuevo Producto
          </button>
        )}
      </TabsContent>

      <TabsContent value="tabla">
        <DataTable data={data} />
      </TabsContent>
    </Tabs>
  )
}
