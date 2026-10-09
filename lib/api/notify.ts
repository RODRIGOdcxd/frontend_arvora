"use client"

import { toast } from "sonner"

import { ApiError } from "@/lib/api/problem"

export function notificarError(error: unknown) {
  if (error instanceof ApiError) {
    toast.error(error.problem.title, { description: error.problem.detail })
    return error
  }
  toast.error("No se pudo completar la operación")
  return null
}

export function notificarOk(mensaje: string) {
  toast.success(mensaje)
}
