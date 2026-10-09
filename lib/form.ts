/** Valores de formulario: texto o casilla. Los números viajan como texto hasta el payload. */
export type FormValues = Record<string, string | boolean>

export function str(values: FormValues, name: string) {
  const valor = values[name]
  return typeof valor === "string" ? valor : ""
}

export function flag(values: FormValues, name: string) {
  return values[name] === true
}

export function textoONull(valor: string | boolean | undefined) {
  if (typeof valor !== "string") return null
  const limpio = valor.trim()
  return limpio.length === 0 ? null : limpio
}

export function numeroONull(valor: string | boolean | undefined) {
  if (typeof valor !== "string" || valor.trim() === "") return null
  const normalizado = valor.trim().replace(",", ".")
  const numero = Number(normalizado)
  return Number.isFinite(numero) ? numero : Number.NaN
}

export function idONull(valor: string | boolean | undefined) {
  const numero = numeroONull(valor)
  if (numero == null || Number.isNaN(numero)) return null
  return numero
}
