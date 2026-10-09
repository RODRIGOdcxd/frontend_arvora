"use client"

import * as React from "react"
import { AppSidebar } from "@/components/app-sidebar"
// import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DataTable } from "@/components/data-table"
import { ProductForm } from "@/components/product-form"
// import { SectionCards } from "@/components/section-cards"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

import data from "./data.json"
const sectionContents: Record<string, React.ReactNode> = {
  Productos: <ProductForm data={data} />,
  Materiales: (
    <div className="p-6 text-sm text-muted-foreground">
      Contenido de materiales. Aquí puedes cargar la lista de materiales, filtros y acciones.
    </div>
  ),
  Usuarios: (
    <div className="p-6 text-sm text-muted-foreground">
      Contenido de usuarios. Aquí puedes mostrar usuarios, roles y permisos.
    </div>
  ),
  Facturas: (
    <div className="p-6 text-sm text-muted-foreground">
      Contenido de facturas. Aquí puedes mostrar facturas, estados y totales.
    </div>
  ),
  Proveedores: (
    <div className="p-6 text-sm text-muted-foreground">
      Contenido de proveedores. Aquí puedes mostrar contactos y condiciones de compra.
    </div>
  ),
  "Ventas y Cotizaciones": (
    <div className="p-6 text-sm text-muted-foreground">
      Módulo de ventas y cotizaciones. Gestiona tus ventas, cotizaciones y pagos.
    </div>
  ),
  Ventas: (
    <div className="p-6 text-sm text-muted-foreground">
      Lista de ventas registradas. Aquí puedes ver el historial de todas las transacciones.
    </div>
  ),
  "Detalle Ventas": (
    <div className="p-6 text-sm text-muted-foreground">
      Detalles de cada venta. Visualiza líneas de productos, cantidades y precios.
    </div>
  ),
  Cotizaciones: (
    <div className="p-6 text-sm text-muted-foreground">
      Gestión de cotizaciones. Crea y mantén un registro de todas tus cotizaciones.
    </div>
  ),
  Pagos: (
    <div className="p-6 text-sm text-muted-foreground">
      Registro de pagos recibidos. Controla el estado de cobranza de tus ventas.
    </div>
  ),
  "Compras y Abastecimiento": (
    <div className="p-6 text-sm text-muted-foreground">
      Módulo de compras. Gestiona órdenes de compra y abastecimiento.
    </div>
  ),
  Compras: (
    <div className="p-6 text-sm text-muted-foreground">
      Órdenes de compra. Aquí puedes crear y gestionar tus compras a proveedores.
    </div>
  ),
  "Clientes y Relaciones": (
    <div className="p-6 text-sm text-muted-foreground">
      Gestión de clientes y relaciones comerciales. Mantén un registro centralizado.
    </div>
  ),
  Clientes: (
    <div className="p-6 text-sm text-muted-foreground">
      Base de datos de clientes. Información de contacto, historial y datos comerciales.
    </div>
  ),
  Roles: (
    <div className="p-6 text-sm text-muted-foreground">
      Gestión de roles y permisos. Define permisos para diferentes usuarios del sistema.
    </div>
  ),
  Imágenes: (
    <div className="p-6 text-sm text-muted-foreground">
      Galería de imágenes. Gestiona las imágenes de tus productos.
    </div>
  ),
  "Imágenes de Productos": (
    <div className="p-6 text-sm text-muted-foreground">
      Carga y gestiona imágenes de productos. Mejora la presentación de tu catálogo.
    </div>
  ),
  "Clasificación y Estructura": (
    <div className="p-6 text-sm text-muted-foreground">
      Estructura de datos. Configura categorías, marcas y unidades de medida.
    </div>
  ),
  Categorías: (
    <div className="p-6 text-sm text-muted-foreground">
      Gestión de categorías de productos. Organiza tu catálogo de forma jerárquica.
    </div>
  ),
  Marcas: (
    <div className="p-6 text-sm text-muted-foreground">
      Registro de marcas. Mantén un catálogo de todas las marcas que comercializas.
    </div>
  ),
  "Unidades de Medida": (
    <div className="p-6 text-sm text-muted-foreground">
      Configuración de unidades de medida. Define unidades para tus productos (kg, lt, etc.).
    </div>
  ),
}

export default function Home() {
  const [section, setSection] = React.useState("Productos")
    const [isPending, startTransition] = React.useTransition()
  
    const handleSectionChange = (nextSection: string) => {
      startTransition(() => {
        setSection(nextSection)
      })
    }
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar
        variant="inset"
        activeSection={section}
        onSectionChange={handleSectionChange}
      />
      <SidebarInset>
        <SiteHeader title={section} />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              {isPending ? (
                <div className="p-6 text-sm text-muted-foreground">
                  Cargando {section}...
                </div>
              ) : (
                sectionContents[section] ?? (
                  <div className="p-6 text-sm text-muted-foreground">
                    Selecciona una sección del menú para ver su contenido.
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}