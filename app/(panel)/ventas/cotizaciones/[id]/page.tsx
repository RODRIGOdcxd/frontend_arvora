"use client"

import { useParams } from "next/navigation"

import { CotizacionEditor } from "@/features/cotizaciones/cotizacion-editor"

export default function Page() {
  return <CotizacionEditor id={useParams<{ id: string }>().id} />
}
