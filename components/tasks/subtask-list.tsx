'use client'

import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { useSubtasks } from '@/lib/hooks/use-subtasks'
import { SubtaskItem } from './subtask-item'
import { AddSubtaskInput } from './add-subtask-input'

interface SubtaskListProps {
  taskId: string
}

export function SubtaskList({ taskId }: SubtaskListProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const { subtasks, isLoading, createSubtask, updateSubtask, deleteSubtask } = useSubtasks(taskId)

  const completedCount = subtasks.filter(s => s.completed).length
  const totalCount = subtasks.length

  const getBadgeColor = () => {
    if (totalCount === 0) return 'text-text-secondary'
    if (completedCount === totalCount) return 'text-success'
    if (completedCount > 0) return 'text-warning'
    return 'text-text-secondary'
  }

  const handleAddSubtask = (title: string) => {
    createSubtask.mutate({
      task_id: taskId,
      title,
      completed: false,
      position: subtasks.length
    })
  }

  const handleToggle = (id: string, completed: boolean) => {
    updateSubtask.mutate({ id, updates: { completed } })
  }

  const handleDelete = (id: string) => {
    deleteSubtask.mutate(id)
  }

  return (
    <div className="border-t border-border pt-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 w-full text-left hover:bg-card/50 p-2 rounded transition-colors"
      >
        <ChevronRight
          className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
        />
        <span className="text-sm font-medium">Sous-tâches ({totalCount})</span>
        {totalCount > 0 && (
          <span className={`text-xs font-medium ${getBadgeColor()}`}>
            ✓ {completedCount}/{totalCount}
          </span>
        )}
      </button>

      {isExpanded && (
        <div className="mt-2 space-y-1">
          {totalCount === 0 ? (
            <p className="text-sm text-text-secondary px-2 py-4 text-center">
              Aucune sous-tâche
            </p>
          ) : (
            subtasks.map(subtask => (
              <SubtaskItem
                key={subtask.id}
                subtask={subtask}
                onToggle={handleToggle}
                onDelete={handleDelete}
              />
            ))
          )}

          <div className="pt-2">
            <AddSubtaskInput
              onAdd={handleAddSubtask}
              disabled={createSubtask.isPending}
            />
          </div>
        </div>
      )}
    </div>
  )
}
