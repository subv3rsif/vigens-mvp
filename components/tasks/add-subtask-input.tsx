'use client'

import { useState, KeyboardEvent } from 'react'

interface AddSubtaskInputProps {
  onAdd: (title: string) => void
  disabled?: boolean
}

export function AddSubtaskInput({ onAdd, disabled }: AddSubtaskInputProps) {
  const [value, setValue] = useState('')

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && value.trim()) {
      e.preventDefault()
      onAdd(value.trim())
      setValue('')
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setValue('')
    }
  }

  return (
    <input
      type="text"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={handleKeyDown}
      placeholder="Ajouter une sous-tâche..."
      disabled={disabled}
      className="w-full px-3 py-2 text-sm bg-background border border-border rounded-sm focus-ring placeholder:text-text-secondary disabled:opacity-50"
    />
  )
}
