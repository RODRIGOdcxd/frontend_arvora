"use client"

import * as React from "react"
import { ChevronDownIcon } from "lucide-react"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

type NavMainItem = {
  title: string
  url: string
  icon?: React.ReactNode
  items?: NavMainItem[]
}

export function NavMain({
  items,
  activeItem,
  onSelect,
}: {
  items: NavMainItem[]
  activeItem?: string
  onSelect?: (title: string) => void
}) {
  const [expandedItems, setExpandedItems] = React.useState<Set<string>>(new Set())

  const toggleExpanded = (itemTitle: string) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(itemTitle)) {
      newExpanded.delete(itemTitle)
    } else {
      newExpanded.add(itemTitle)
    }
    setExpandedItems(newExpanded)
  }

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {items.map((item) => (
            <React.Fragment key={item.title}>
              <SidebarMenuItem>
                <div className="flex items-center">
                  {item.items && item.items.length > 0 ? (
                    <button
                      onClick={() => toggleExpanded(item.title)}
                      className="mr-1 p-1 hover:bg-sidebar-accent rounded"
                    >
                      <ChevronDownIcon
                        className={`h-4 w-4 transition-transform ${
                          expandedItems.has(item.title) ? "rotate-0" : "-rotate-90"
                        }`}
                      />
                    </button>
                  ) : (
                    <div className="w-8" />
                  )}
                  <SidebarMenuButton
                    type="button"
                    tooltip={item.title}
                    isActive={item.title === activeItem}
                    onClick={() => {
                      if (item.items && item.items.length > 0) {
                        toggleExpanded(item.title)
                      } else {
                        onSelect?.(item.title)
                      }
                    }}
                    className="flex-1"
                  >
                    {item.icon}
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </div>
              </SidebarMenuItem>
              {item.items && item.items.length > 0 && expandedItems.has(item.title) && (
                <div className="ml-4 flex flex-col gap-1">
                  {item.items.map((subitem) => (
                    <SidebarMenuItem key={subitem.title}>
                      <SidebarMenuButton
                        type="button"
                        tooltip={subitem.title}
                        isActive={subitem.title === activeItem}
                        onClick={() => onSelect?.(subitem.title)}
                        className="text-sm"
                      >
                        {subitem.icon}
                        <span>{subitem.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </div>
              )}
            </React.Fragment>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
