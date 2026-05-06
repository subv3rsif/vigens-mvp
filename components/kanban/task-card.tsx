'use client';

import { Calendar } from 'lucide-react';
import { useDraggable } from '@dnd-kit/core';
import { Task } from '../../types/database.types';
import { getPriorityConfig } from '../../types/task.types';
import { useSubtasks } from '../../lib/hooks/use-subtasks';

interface TaskCardProps {
  task: Task;
  onClick?: () => void;
}

export function TaskCard({ task, onClick }: TaskCardProps) {
  const priorityConfig = task.priority ? getPriorityConfig(task.priority) : null;
  const { subtasks } = useSubtasks(task.id);

  const completedCount = subtasks.filter(s => s.completed).length;
  const totalCount = subtasks.length;
  const hasSubtasks = totalCount > 0;

  const getBadgeColor = () => {
    if (completedCount === totalCount) return 'text-success bg-success/10';
    if (completedCount > 0) return 'text-warning bg-warning/10';
    return 'text-text-secondary bg-card';
  };

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`group rounded-lg border border-border bg-card p-3 transition-all hover:shadow-md hover:border-primary/50 cursor-pointer ${
        isDragging ? 'opacity-50' : ''
      }`}
      onClick={onClick}
    >
      {/* Title */}
      <h4 className="font-semibold text-foreground mb-1 line-clamp-1">
        {task.title}
      </h4>

      {/* Description */}
      {task.description && (
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
          {task.description}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Priority indicator */}
          {priorityConfig && (
            <div className="flex items-center gap-1.5">
              <div
                className={`w-2 h-2 rounded-full ${priorityConfig.dotColor}`}
                aria-hidden="true"
              />
              <span className="text-muted-foreground">{priorityConfig.label}</span>
            </div>
          )}

          {/* Subtask badge */}
          {hasSubtasks && (
            <span className={`px-2 py-0.5 rounded font-medium ${getBadgeColor()}`}>
              ✓ {completedCount}/{totalCount}
            </span>
          )}
        </div>

        {/* Due date */}
        {task.due_date && (
          <div className="flex items-center gap-1 text-muted-foreground">
            <Calendar className="size-3" aria-hidden="true" />
            <span>
              {new Date(task.due_date).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'short',
              })}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
