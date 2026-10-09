import { HttpResponse } from "msw"

export class MockProblem extends Error {
  readonly status: number
  readonly title: string
  readonly codigo: string
  readonly errores?: { campo: string; mensaje: string }[]

  constructor(
    status: number,
    title: string,
    detail: string,
    codigo: string,
    errores?: { campo: string; mensaje: string }[],
  ) {
    super(detail)
    this.status = status
    this.title = title
    this.codigo = codigo
    this.errores = errores
  }
}

export function datosInvalidos(detail: string, errores?: { campo: string; mensaje: string }[]) {
  return new MockProblem(400, "Datos inválidos", detail, "datos_invalidos", errores)
}

export function conflicto(detail: string, codigo = "conflicto") {
  return new MockProblem(409, "Conflicto", detail, codigo)
}

export function noEncontrado(nombre: string, id: number) {
  return new MockProblem(404, "No encontrado", `No se encontró ${nombre} con id ${id}`, "no_encontrado")
}

export function respuestaProblema(error: MockProblem) {
  return HttpResponse.json(
    {
      type: "about:blank",
      title: error.title,
      status: error.status,
      detail: error.message,
      codigo: error.codigo,
      ...(error.errores ? { errores: error.errores } : {}),
    },
    { status: error.status },
  )
}
