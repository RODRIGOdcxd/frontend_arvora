"use client"

import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { FormValues } from "@/lib/form"
import { cn } from "@/lib/utils"

export type FieldOption = { value: string; label: string }

export type FieldDef = {
  name: string
  label: string
  type: "text" | "textarea" | "number" | "select" | "checkbox" | "date" | "email" | "password"
  required?: boolean
  placeholder?: string
  help?: string
  options?: FieldOption[]
  step?: string
  disabled?: boolean
}

export function FormFields({
  fields,
  values,
  errors,
  disabled,
  onChange,
}: {
  fields: FieldDef[]
  values: FormValues
  errors: Record<string, string>
  disabled?: boolean
  onChange: (name: string, value: string | boolean) => void
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {fields.map((field) => {
        const error = errors[field.name]
        const ancho = field.type === "textarea" || field.type === "checkbox" ? "sm:col-span-2" : ""
        return (
          <div key={field.name} className={cn("flex flex-col gap-1.5", ancho)}>
            {field.type === "checkbox" ? (
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={values[field.name] === true}
                  disabled={disabled || field.disabled}
                  onCheckedChange={(checked) => onChange(field.name, checked === true)}
                />
                <span>{field.label}</span>
              </label>
            ) : (
              <>
                <Label htmlFor={field.name}>
                  {field.label}
                  {field.required ? <span className="text-destructive"> *</span> : null}
                </Label>
                {field.type === "textarea" ? (
                  <Textarea
                    id={field.name}
                    value={String(values[field.name] ?? "")}
                    placeholder={field.placeholder}
                    disabled={disabled || field.disabled}
                    aria-invalid={Boolean(error)}
                    onChange={(event) => onChange(field.name, event.target.value)}
                  />
                ) : field.type === "select" ? (
                  <Select
                    value={String(values[field.name] ?? "") || null}
                    items={[{ value: "", label: "Sin selección" }, ...(field.options ?? [])]}
                    onValueChange={(valor) => onChange(field.name, valor ?? "")}
                    disabled={disabled || field.disabled}
                  >
                    <SelectTrigger id={field.name} className="w-full" aria-invalid={Boolean(error)}>
                      <SelectValue placeholder="Seleccione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="">Sin selección</SelectItem>
                        {(field.options ?? []).map((opcion) => (
                          <SelectItem key={opcion.value} value={opcion.value}>
                            {opcion.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id={field.name}
                    type={field.type === "number" ? "number" : field.type}
                    step={field.step}
                    value={String(values[field.name] ?? "")}
                    placeholder={field.placeholder}
                    disabled={disabled || field.disabled}
                    aria-invalid={Boolean(error)}
                    onChange={(event) => onChange(field.name, event.target.value)}
                  />
                )}
              </>
            )}
            {field.help ? <p className="text-xs text-muted-foreground">{field.help}</p> : null}
            {error ? <p className="text-xs text-destructive">{error}</p> : null}
          </div>
        )
      })}
    </div>
  )
}
