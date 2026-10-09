/** ProblemDetail (RFC 7807) tal como lo arma `GlobalExceptionHandler`. */

export type CampoError = {
  campo: string
  mensaje: string
}

export type ApiProblem = {
  status: number
  title: string
  detail: string
  codigo?: string
  instance?: string
  errores: CampoError[]
}

export class ApiError extends Error {
  readonly problem: ApiProblem

  constructor(problem: ApiProblem) {
    super(problem.detail || problem.title)
    this.name = "ApiError"
    this.problem = problem
  }

  fieldErrors(): Record<string, string> {
    return Object.fromEntries(this.problem.errores.map((error) => [error.campo, error.mensaje]))
  }
}

function esRegistro(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === "object" && valor !== null
}

export function parseProblem(body: unknown, status: number): ApiProblem {
  if (!esRegistro(body)) {
    return {
      status,
      title: status === 409 ? "Conflicto" : "Error",
      detail: "El servidor no devolvió un detalle.",
      errores: [],
    }
  }
  const erroresCrudos = Array.isArray(body.errores) ? body.errores : []
  const errores: CampoError[] = erroresCrudos.flatMap((item) => {
    if (!esRegistro(item) || typeof item.campo !== "string") return []
    return [{ campo: item.campo, mensaje: typeof item.mensaje === "string" ? item.mensaje : "Valor no válido" }]
  })
  return {
    status: typeof body.status === "number" ? body.status : status,
    title: typeof body.title === "string" ? body.title : "Error",
    detail: typeof body.detail === "string" ? body.detail : "No se pudo completar la operación.",
    codigo: typeof body.codigo === "string" ? body.codigo : undefined,
    instance: typeof body.instance === "string" ? body.instance : undefined,
    errores,
  }
}
