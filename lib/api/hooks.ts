"use client"

import { useQuery } from "@tanstack/react-query"

import { api } from "@/lib/api/client"
import { toQuery, type ListParams, type SpringPage } from "@/lib/api/page"

export function usePagina<T>(clave: string, ruta: string, params: ListParams, enabled = true) {
  return useQuery({
    queryKey: [clave, params],
    queryFn: () => api.get<SpringPage<T>>(`${ruta}${toQuery(params)}`),
    enabled,
    placeholderData: (previa) => previa,
  })
}

export function useCatalogo<T>(clave: string, ruta: string, sort = "nombre,asc") {
  return useQuery({
    queryKey: [clave, "catalogo", sort],
    queryFn: () => api.get<SpringPage<T>>(`${ruta}${toQuery({ page: 0, size: 100, sort })}`),
    staleTime: 60_000,
  })
}

export function useLista<T>(clave: string, ruta: string, enabled = true) {
  return useQuery({
    queryKey: [clave],
    queryFn: () => api.get<T[]>(ruta),
    enabled,
  })
}
