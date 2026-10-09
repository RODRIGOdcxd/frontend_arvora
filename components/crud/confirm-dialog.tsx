"use client"

import { Button } from "@/components/ui/button"

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  pending,
  destructive = true,
  onConfirm,
  onOpenChange,
}: {
  open: boolean
  title: string
  description: string
  confirmLabel: string
  pending?: boolean
  destructive?: boolean
  onConfirm: () => void
  onOpenChange: (open: boolean) => void
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        aria-label="Cerrar"
        className="absolute inset-0 bg-black/40"
        onClick={() => onOpenChange(false)}
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        className="page-enter relative w-full max-w-md rounded-xl border bg-popover p-5 text-popover-foreground shadow-lg"
      >
        <h2 id="confirm-title" className="text-base font-medium">
          {title}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancelar
          </Button>
          <Button variant={destructive ? "destructive" : "default"} onClick={onConfirm} disabled={pending}>
            {pending ? "Guardando…" : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
