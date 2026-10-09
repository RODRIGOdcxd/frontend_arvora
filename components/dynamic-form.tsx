"use client"

import * as React from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileUploadButton } from "@/components/ui/file-upload-button"
import { X } from "lucide-react"

export type FieldType = "text" | "email" | "number" | "textarea" | "select" | "file" | "date" | "readonly"

export interface FormField {
  name: string
  label: string
  type: FieldType
  placeholder?: string
  required?: boolean
  disabled?: boolean
  readonly?: boolean
  section?: string
  options?: { label: string; value: string }[]
  maxFiles?: number
  maxLength?: number
  pattern?: string
}

export interface DynamicFormProps {
  title: string
  description?: string
  fields: FormField[]
  initialValues?: Record<string, any>
  onSubmit: (values: Record<string, any>) => Promise<void> | void
  submitLabel?: string
  cancelLabel?: string
  onCancel?: () => void
}

export function DynamicForm({
  title,
  description,
  fields,
  initialValues = {},
  onSubmit,
  submitLabel = "Guardar",
  cancelLabel = "Cancelar",
  onCancel,
}: DynamicFormProps) {
  const [values, setValues] = React.useState<Record<string, any>>(initialValues)
  const [files, setFiles] = React.useState<Record<string, File[]>>({})
  const [isLoading, setIsLoading] = React.useState(false)

  const handleChange = (name: string, value: any) => {
    setValues((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleFileChange = (name: string, newFiles: File[]) => {
    setFiles((prev) => ({
      ...prev,
      [name]: newFiles,
    }))
  }

  const handleRemoveFile = (name: string, index: number) => {
    setFiles((prev) => ({
      ...prev,
      [name]: prev[name].filter((_, i) => i !== index),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const formData = {
        ...values,
        ...Object.entries(files).reduce((acc, [key, fileList]) => {
          if (fileList.length > 0) {
            acc[key] = fileList
          }
          return acc
        }, {} as Record<string, File[]>),
      }

      await onSubmit(formData)
      toast.success(`${title} guardado correctamente`)
    } catch (error) {
      toast.error(`Error al guardar ${title}`)
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {Object.entries(
            fields.reduce((groups, field) => {
              const section = field.section ?? ""
              if (!groups[section]) {
                groups[section] = []
              }
              groups[section].push(field)
              return groups
            }, {} as Record<string, FormField[]>)
          ).map(([section, sectionFields]) => (
            <section key={section} className="space-y-4 rounded-2xl border border-border bg-muted p-4">
              {section ? (
                <div className="border-b border-border pb-3">
                  <h3 className="text-sm font-semibold text-foreground">{section}</h3>
                </div>
              ) : null}

              <div className="grid gap-6 md:grid-cols-2">
                {sectionFields.map((field) => (
                  <div key={field.name} className="space-y-2">
                    <Label htmlFor={field.name} className="flex items-center gap-2">
                      {field.label}
                      {field.required && <span className="text-red-500">*</span>}
                    </Label>

                {field.type === "readonly" && (
                  <div className="flex h-10 w-full items-center rounded-md border border-input bg-muted px-3 py-2 text-sm text-muted-foreground">
                    {values[field.name] || "-"}
                  </div>
                )}

                {field.type === "text" && (
                  <Input
                    id={field.name}
                    type="text"
                    placeholder={field.placeholder}
                    value={values[field.name] || ""}
                    onChange={(e) => handleChange(field.name, e.target.value)}
                    disabled={field.disabled || field.readonly}
                    required={field.required}
                    maxLength={field.maxLength}
                  />
                )}

                {field.type === "email" && (
                  <Input
                    id={field.name}
                    type="email"
                    placeholder={field.placeholder}
                    value={values[field.name] || ""}
                    onChange={(e) => handleChange(field.name, e.target.value)}
                    disabled={field.disabled || field.readonly}
                    required={field.required}
                  />
                )}

                {field.type === "number" && (
                  <Input
                    id={field.name}
                    type="number"
                    placeholder={field.placeholder}
                    value={values[field.name] || ""}
                    onChange={(e) => handleChange(field.name, e.target.value)}
                    disabled={field.disabled || field.readonly}
                    required={field.required}
                  />
                )}

                {field.type === "date" && (
                  <Input
                    id={field.name}
                    type="date"
                    value={values[field.name] || ""}
                    onChange={(e) => handleChange(field.name, e.target.value)}
                    disabled={field.disabled || field.readonly}
                    required={field.required}
                  />
                )}

                {field.type === "textarea" && (
                  <Textarea
                    id={field.name}
                    placeholder={field.placeholder}
                    value={values[field.name] || ""}
                    onChange={(e) => handleChange(field.name, e.target.value)}
                    disabled={field.disabled || field.readonly}
                    required={field.required}
                    rows={4}
                  />
                )}

                {field.type === "select" && (
                  <Select
                    value={values[field.name] || ""}
                    onValueChange={(value) => handleChange(field.name, value)}
                    disabled={field.disabled || field.readonly}
                  >
                    <SelectTrigger id={field.name}>
                      <SelectValue placeholder={field.placeholder || `Selecciona ${field.label}`} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {field.options?.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                )}

                {field.type === "file" && (
                  <div className="space-y-2">
                    <FileUploadButton
                      maxFiles={field.maxFiles || 1}
                      accept="image/*"
                      onChange={(newFiles) => handleFileChange(field.name, newFiles)}
                    />
                    {files[field.name] && files[field.name].length > 0 && (
                      <div className="grid gap-2">
                        {files[field.name].map((file, idx) => (
                          <div
                            key={`${field.name}-${idx}`}
                            className="flex items-center justify-between rounded-md border border-input p-2 text-sm"
                          >
                            <span className="truncate">{file.name}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveFile(field.name, idx)}
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      ))}

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Guardando..." : submitLabel}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
                {cancelLabel}
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
