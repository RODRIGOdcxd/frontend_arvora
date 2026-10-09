"use client"

import { useParams } from "next/navigation"

import { ArticuloEditor } from "@/features/articulos/articulo-editor"

export default function Page() {
  const params = useParams<{ id: string }>()
  return <ArticuloEditor id={params.id} />
}
