'use client'

import { X } from 'lucide-react'
import type { Database } from '@/types/database.types'

type Subtask = Database['public']['Tables']['subtasks']['Row']

interface SubtaskItemProps {
  subtask: Subtask
  onToggle: (id: string, completed: boolean) => void
  onDelete: (id: string) => void
}

export function SubtaskItem({ subtask, onToggle, onDelete }: SubtaskItemProps) {
  return (
    <div className="group flex items-center gap-2 py-1.5 hover:bg-card/50 px-2 rounded">
      <input
        type="checkbox"
        checked={subtask.completed}
        onChange={(e) => onToggle(subtask.id, e.target.checked)}
        className="w-4 h-4 rounded border-border bg-background checked:bg-accent-blue focus-ring"
      />

      <span
        className={`flex-1 text-sm ${
          subtask.completed ? 'line-through text-text-secondary' : 'text-text-primary'
        }`}
      >
        {subtask.title}
      </span>

      <button
        onClick={() => onDelete(subtask.id)}
        aria-label="Delete subtask"
        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-background rounded transition-opacity"
      >
        <X className="w-3.5 h-3.5 text-text-secondary hover:text-error" />
      </button>
    </div>
  )
}
