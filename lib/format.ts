export function texto(valor: string | number | null | undefined) {
  if (valor == null || valor === "") return "—"
  return String(valor)
}

export function formatMoney(valor: number | null | undefined, moneda: "PEN" | "USD" = "PEN") {
  if (valor == null || Number.isNaN(valor)) return "—"
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: moneda,
    minimumFractionDigits: 2,
  }).format(valor)
}

export function formatCantidad(valor: number | null | undefined, decimales = 4) {
  if (valor == null || Number.isNaN(valor)) return "—"
  return new Intl.NumberFormat("es-PE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimales,
  }).format(valor)
}

export function formatFecha(iso: string | null | undefined) {
  if (!iso) return "—"
  const [anio, mes, dia] = iso.slice(0, 10).split("-").map(Number)
  if (!anio || !mes || !dia) return "—"
  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(anio, mes - 1, dia)))
}

export function formatFechaHora(iso: string | null | undefined) {
  if (!iso) return "—"
  const fecha = new Date(iso)
  if (Number.isNaN(fecha.getTime())) return "—"
  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Lima",
  }).format(fecha)
}

export function hoyIso() {
  return new Date().toISOString().slice(0, 10)
}
