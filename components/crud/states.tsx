import { AlertTriangleIcon, InboxIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

export function ActivoBadge({ activo }: { activo: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        activo ? "bg-success/15 text-success" : "bg-muted text-muted-foreground",
      )}
    >
      {activo ? "Activo" : "Inactivo"}
    </span>
  )
}

export function EmptyState({
  titulo,
  descripcion,
  accion,
}: {
  titulo: string
  descripcion: string
  accion?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
      <InboxIcon className="size-8 text-wood" />
      <p className="text-sm font-medium">{titulo}</p>
      <p className="max-w-sm text-sm text-muted-foreground">{descripcion}</p>
      {accion}
    </div>
  )
}

export function ErrorState({
  titulo,
  detalle,
  onRetry,
}: {
  titulo: string
  detalle?: string
  onRetry?: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
      <AlertTriangleIcon className="size-8 text-destructive" />
      <p className="text-sm font-medium">{titulo}</p>
      {detalle ? <p className="max-w-md text-sm text-muted-foreground">{detalle}</p> : null}
      {onRetry ? (
        <Button variant="outline" onClick={onRetry}>
          Reintentar
        </Button>
      ) : null}
    </div>
  )
}

export function TableSkeleton({ filas = 6 }: { filas?: number }) {
  return (
    <div className="flex flex-col gap-2 p-4" aria-busy="true" aria-label="Cargando">
      {Array.from({ length: filas }, (_, indice) => (
        <Skeleton key={indice} className="h-8 w-full" />
      ))}
    </div>
  )
}
