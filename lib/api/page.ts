/** Página de Spring Data (`Page`), con los campos que consume el panel. */

export type SpringPage<T> = {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
  numberOfElements?: number
  first?: boolean
  last?: boolean
  empty?: boolean
}

export type ListParams = {
  page: number
  size: number
  sort?: string
  texto?: string
  filters?: Record<string, string | number | boolean | undefined | null>
}

export function toQuery(params: ListParams): string {
  const search = new URLSearchParams()
  search.set("page", String(params.page))
  search.set("size", String(params.size))
  if (params.sort) search.set("sort", params.sort)
  if (params.texto?.trim()) search.set("texto", params.texto.trim())
  for (const [clave, valor] of Object.entries(params.filters ?? {})) {
    if (valor === undefined || valor === null || valor === "") continue
    search.set(clave, String(valor))
  }
  return `?${search.toString()}`
}

export type SortAccess<T> = (item: T) => string | number | boolean | null | undefined

export function paginar<T>(items: T[], url: URL, sortFields: Record<string, SortAccess<T>>): SpringPage<T> {
  const sort = url.searchParams.get("sort")
  let filas = items.slice()
  if (sort) {
    const [campo, direccion = "asc"] = sort.split(",")
    const acceso = sortFields[campo]
    if (!acceso) {
      throw new Error(`SORT:${campo}`)
    }
    const factor = direccion.toLowerCase() === "desc" ? -1 : 1
    filas.sort((a, b) => {
      const va = acceso(a)
      const vb = acceso(b)
      if (typeof va === "number" && typeof vb === "number") return (va - vb) * factor
      return String(va ?? "").localeCompare(String(vb ?? ""), "es", { sensitivity: "base" }) * factor
    })
  }
  const page = Number(url.searchParams.get("page") ?? "0")
  const size = Number(url.searchParams.get("size") ?? "20")
  const inicio = page * size
  const content = filas.slice(inicio, inicio + size)
  const totalPages = size > 0 ? Math.ceil(filas.length / size) : 0
  return {
    content,
    totalElements: filas.length,
    totalPages,
    number: page,
    size,
    numberOfElements: content.length,
    first: page === 0,
    last: inicio + size >= filas.length,
    empty: content.length === 0,
  }
}

export function coincideTexto(consulta: string | null, ...campos: Array<string | null | undefined>) {
  if (!consulta?.trim()) return true
  const texto = consulta.trim().toLowerCase()
  return campos.some((campo) => (campo ?? "").toLowerCase().includes(texto))
}
