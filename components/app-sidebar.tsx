"use client"

import * as React from "react"

import Image from "next/image"
import { NavDocuments } from "@/components/nav-documents"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { LayoutDashboardIcon, ListIcon, ChartBarIcon, FolderIcon, UsersIcon, CameraIcon, FileTextIcon, Settings2Icon, CircleHelpIcon, SearchIcon, DatabaseIcon, FileChartColumnIcon, FileIcon, ShoppingCartIcon, TrendingUpIcon, UserCheckIcon, ImageIcon, TagsIcon, BoxIcon } from "lucide-react"
import { ModeToggle } from "./mode-toggle"

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/images/logoArvora.jpg",
  },
  navMain: [
    {
      title: "Productos",
      url: "#",
      icon: (
        <LayoutDashboardIcon
        />
      ),
    },
    {
      title: "Materiales",
      url: "#",
      icon: (
        <ListIcon
        />
      ),
    },
    {
      title: "Usuarios",
      url: "#",
      icon: (
        <ChartBarIcon
        />
      ),
    },
    {
      title: "Facturas",
      url: "#",
      icon: (
        <FolderIcon
        />
      ),
    },
    {
      title: "Proveedores",
      url: "#",
      icon: (
        <UsersIcon
        />
      ),
    },
    {
      title: "Ventas y Cotizaciones",
      url: "#",
      icon: <TrendingUpIcon />,
      items: [
        {
          title: "Ventas",
          url: "#",
          icon: <ShoppingCartIcon className="h-4 w-4" />,
        },
        {
          title: "Detalle Ventas",
          url: "#",
          icon: <FileTextIcon className="h-4 w-4" />,
        },
        {
          title: "Cotizaciones",
          url: "#",
          icon: <FileChartColumnIcon className="h-4 w-4" />,
        },
        {
          title: "Pagos",
          url: "#",
          icon: <DatabaseIcon className="h-4 w-4" />,
        },
      ],
    },
    {
      title: "Compras y Abastecimiento",
      url: "#",
      icon: <ShoppingCartIcon />,
      items: [
        {
          title: "Compras",
          url: "#",
          icon: <ListIcon className="h-4 w-4" />,
        },
      ],
    },
    {
      title: "Clientes y Relaciones",
      url: "#",
      icon: <UserCheckIcon />,
      items: [
        {
          title: "Clientes",
          url: "#",
          icon: <UsersIcon className="h-4 w-4" />,
        },
        {
          title: "Roles",
          url: "#",
          icon: <UserCheckIcon className="h-4 w-4" />,
        },
      ],
    },
    {
      title: "Imágenes",
      url: "#",
      icon: <ImageIcon />,
      items: [
        {
          title: "Imágenes de Productos",
          url: "#",
          icon: <CameraIcon className="h-4 w-4" />,
        },
      ],
    },
    {
      title: "Clasificación y Estructura",
      url: "#",
      icon: <TagsIcon />,
      items: [
        {
          title: "Categorías",
          url: "#",
          icon: <FolderIcon className="h-4 w-4" />,
        },
        {
          title: "Marcas",
          url: "#",
          icon: <BoxIcon className="h-4 w-4" />,
        },
        {
          title: "Unidades de Medida",
          url: "#",
          icon: <DatabaseIcon className="h-4 w-4" />,
        },
      ],
    },
  ],
}
type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  items?: typeof data.navMain
  activeSection?: string
  onSectionChange?: (section: string) => void
}

export function AppSidebar({
  items,
  activeSection,
  onSectionChange,
  ...props
}: AppSidebarProps) {
  const navMainItems = items ?? data.navMain

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="data-[slot=sidebar-menu-button]:p-1.5!"
              render={<a href="#" />}
            >
              <div className="relative h-10 w-10 overflow-hidden rounded-full border border-border bg-muted">
                <Image
                  src="/images/logoArvora.jpg"
                  alt="ERP ARVORA"
                  fill
                  sizes="40px"
                  className="object-cover"
                />
              </div>
              <span className="text-base font-semibold">ERP ARVORA</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <ModeToggle />
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain
          items={navMainItems}
          activeItem={activeSection}
          onSelect={onSectionChange}
        />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
