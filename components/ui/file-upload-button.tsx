"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Upload } from "lucide-react"

interface FileUploadButtonProps {
  maxFiles?: number
  accept?: string
  onChange: (files: File[]) => void
}

export function FileUploadButton({ maxFiles = 1, accept = "*", onChange }: FileUploadButtonProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || [])
    const limitedFiles = newFiles.slice(0, maxFiles)
    onChange(limitedFiles)

    if (inputRef.current) {
      inputRef.current.value = ""
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        multiple={maxFiles > 1}
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
      />
      <Button
        type="button"
        variant="outline"
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="h-4 w-4 mr-2" />
        Cargar imagen{maxFiles > 1 ? "s" : ""}
      </Button>
    </>
  )
}
