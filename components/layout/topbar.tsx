"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { ModeToggle } from "@/components/mode-toggle"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { apiMockEnabled } from "@/lib/api/client"

const ETIQUETAS: Record<string, string> = {
  inventario: "Inventario",
  articulos: "Artículos",
  existencias: "Existencias",
  movimientos: "Movimientos",
  ventas: "Ventas",
  cotizaciones: "Cotizaciones",
  clientes: "Clientes",
  compras: "Compras",
  proveedores: "Proveedores",
  configuracion: "Configuración",
  categorias: "Categorías",
  unidades: "Unidades",
  almacenes: "Almacenes",
  usuarios: "Usuarios",
  roles: "Roles",
  nuevo: "Nuevo",
}

export function Topbar() {
  const pathname = usePathname()
  const partes = pathname.split("/").filter(Boolean)
  const migas = partes.map((parte, indice) => {
    const href = `/${partes.slice(0, indice + 1).join("/")}`
    const etiqueta = ETIQUETAS[parte] ?? (/^\d+$/.test(parte) ? "Detalle" : parte)
    return { href, etiqueta, ultima: indice === partes.length - 1 }
  })

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-card/80 px-3 backdrop-blur-sm md:px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mx-1 h-4 data-vertical:self-auto" />
      <Breadcrumb className="min-w-0 flex-1">
        <BreadcrumbList>
          <BreadcrumbItem>
            {migas.length === 0 ? (
              <BreadcrumbPage>Inicio</BreadcrumbPage>
            ) : (
              <BreadcrumbLink render={<Link href="/" />}>Inicio</BreadcrumbLink>
            )}
          </BreadcrumbItem>
          {migas.map((miga) => (
            <React.Fragment key={miga.href}>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {miga.ultima ? (
                  <BreadcrumbPage>{miga.etiqueta}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink render={<Link href={miga.href} />}>{miga.etiqueta}</BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
      {apiMockEnabled() ? (
        <span className="hidden rounded-full bg-wood/15 px-2 py-0.5 text-xs font-medium text-wood sm:inline">
          Modo demostración
        </span>
      ) : null}
      <ModeToggle />
    </header>
  )
}
