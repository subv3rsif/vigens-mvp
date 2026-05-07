'use client'

import { useState, useRef, DragEvent, ChangeEvent, KeyboardEvent } from 'react'
import { Upload, Loader2 } from 'lucide-react'
import { useFiles } from '@/lib/hooks/use-files'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface FileUploadProps {
  taskId: string
  onUploadComplete?: () => void
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'text/plain',
]

function validateFile(file: File): boolean {
  if (file.size > MAX_FILE_SIZE) {
    toast.error('Fichier trop volumineux (max 10 Mo)')
    return false
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    toast.error('Type de fichier non supporté')
    return false
  }
  return true
}

export function FileUpload({ taskId, onUploadComplete }: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { uploadFile } = useFiles(taskId)

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    const validFiles = Array.from(files).filter(validateFile)

    if (validFiles.length === 0) return

    let uploadedCount = 0

    for (const file of validFiles) {
      try {
        await uploadFile.mutateAsync({ file, taskId })
        uploadedCount++
      } catch (error) {
        console.error('File upload error:', error);
        // Error already shown by hook via toast
      }
    }

    if (uploadedCount > 0 && onUploadComplete) {
      onUploadComplete()
    }
  }

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    const files = e.dataTransfer.files
    handleUpload(files)
  }

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleUpload(e.target.files)
  }

  const handleClick = () => {
    if (!uploadFile.isPending) {
      fileInputRef.current?.click()
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && !uploadFile.isPending) {
      e.preventDefault()
      fileInputRef.current?.click()
    }
  }

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        hidden
        onChange={handleFileInputChange}
        accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.txt"
        disabled={uploadFile.isPending}
      />

      <div
        role="button"
        tabIndex={0}
        aria-label="Zone de téléchargement de fichiers - Glissez vos fichiers ici ou cliquez pour sélectionner"
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        aria-disabled={uploadFile.isPending}
        className={cn(
          'flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 transition-colors cursor-pointer',
          isDragOver
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/50 hover:bg-muted/50',
          uploadFile.isPending && 'opacity-50 cursor-not-allowed pointer-events-none'
        )}
      >
        {uploadFile.isPending ? (
          <>
            <Loader2 className="h-10 w-10 text-muted-foreground animate-spin mb-4" />
            <p className="text-sm text-muted-foreground font-medium">
              Envoi en cours...
            </p>
          </>
        ) : (
          <>
            <Upload className="h-10 w-10 text-muted-foreground mb-4" />
            <p className="text-sm text-foreground font-medium mb-1">
              Glissez vos fichiers ici ou cliquez pour sélectionner
            </p>
            <p className="text-xs text-muted-foreground">
              PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, GIF, TXT (max 10 Mo)
            </p>
          </>
        )}
      </div>
    </div>
  )
}
