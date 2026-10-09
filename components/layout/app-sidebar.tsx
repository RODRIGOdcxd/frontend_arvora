"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  ArrowLeftRightIcon,
  BoxesIcon,
  ChevronDownIcon,
  FileTextIcon,
  LayoutDashboardIcon,
  RulerIcon,
  ShieldIcon,
  TagsIcon,
  TruckIcon,
  UserCogIcon,
  UsersIcon,
  WarehouseIcon,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"

type Enlace = { titulo: string; href: string }

const grupos: { titulo: string; icono: React.ReactNode; enlaces: Enlace[] }[] = [
  {
    titulo: "Inventario",
    icono: <BoxesIcon />,
    enlaces: [
      { titulo: "Artículos", href: "/inventario/articulos" },
      { titulo: "Existencias", href: "/inventario/existencias" },
      { titulo: "Movimientos", href: "/inventario/movimientos" },
    ],
  },
  {
    titulo: "Ventas",
    icono: <FileTextIcon />,
    enlaces: [
      { titulo: "Cotizaciones", href: "/ventas/cotizaciones" },
      { titulo: "Clientes", href: "/ventas/clientes" },
    ],
  },
  {
    titulo: "Compras",
    icono: <TruckIcon />,
    enlaces: [{ titulo: "Proveedores", href: "/compras/proveedores" }],
  },
  {
    titulo: "Configuración",
    icono: <TagsIcon />,
    enlaces: [
      { titulo: "Categorías", href: "/configuracion/categorias" },
      { titulo: "Unidades", href: "/configuracion/unidades" },
      { titulo: "Almacenes", href: "/configuracion/almacenes" },
      { titulo: "Usuarios", href: "/configuracion/usuarios" },
      { titulo: "Roles", href: "/configuracion/roles" },
    ],
  },
]

function activo(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function AppSidebar() {
  const pathname = usePathname()
  const [abiertos, setAbiertos] = React.useState<Record<string, boolean>>({
    Inventario: true,
    Ventas: true,
    Compras: true,
    Configuración: true,
  })

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link href="/" />} tooltip="ARVORA & METAL">
              <Image
                src="/images/logoArvora.jpg"
                alt="ARVORA & METAL"
                width={32}
                height={32}
                className="rounded-md"
              />
              <span className="grid text-left leading-tight">
                <span className="truncate font-semibold">ARVORA & METAL</span>
                <span className="truncate text-xs text-sidebar-foreground/70">Taller · Lima</span>
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton render={<Link href="/" />} isActive={pathname === "/"} tooltip="Inicio">
                  <LayoutDashboardIcon />
                  <span>Inicio</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {grupos.map((grupo) => {
          const abierto = abiertos[grupo.titulo] !== false
          const iconoGrupo =
            grupo.titulo === "Configuración" ? <UserCogIcon /> : grupo.icono
          return (
            <SidebarGroup key={grupo.titulo}>
              <SidebarGroupLabel className="flex items-center gap-2">
                {iconoGrupo}
                {grupo.titulo}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      tooltip={grupo.titulo}
                      onClick={() => setAbiertos((previo) => ({ ...previo, [grupo.titulo]: !abierto }))}
                    >
                      {grupo.icono}
                      <span>{grupo.titulo}</span>
                      <ChevronDownIcon className={`ml-auto transition-transform ${abierto ? "" : "-rotate-90"}`} />
                    </SidebarMenuButton>
                    {abierto ? (
                      <SidebarMenuSub>
                        {grupo.enlaces.map((enlace) => (
                          <SidebarMenuSubItem key={enlace.href}>
                            <SidebarMenuSubButton
                              render={<Link href={enlace.href} />}
                              isActive={activo(pathname, enlace.href)}
                            >
                              {enlace.titulo === "Unidades" ? <RulerIcon /> : null}
                              {enlace.titulo === "Almacenes" ? <WarehouseIcon /> : null}
                              {enlace.titulo === "Usuarios" ? <UsersIcon /> : null}
                              {enlace.titulo === "Roles" ? <ShieldIcon /> : null}
                              {enlace.titulo === "Movimientos" ? <ArrowLeftRightIcon /> : null}
                              <span>{enlace.titulo}</span>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    ) : null}
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )
        })}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton render={<Link href="/login" />} tooltip="Acceso">
              <ShieldIcon />
              <span>Acceso (próximamente)</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
