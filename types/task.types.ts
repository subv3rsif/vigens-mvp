import { Task, TaskInsert, TaskUpdate } from './database.types';

// Task priority levels
export const TaskPriority = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
} as const;

export type TaskPriorityType = (typeof TaskPriority)[keyof typeof TaskPriority];

// Task status values (matching kanban columns)
export const TaskStatus = {
  TODO: 'todo',
  IN_PROGRESS: 'in_progress',
  DONE: 'done',
} as const;

export type TaskStatusType = (typeof TaskStatus)[keyof typeof TaskStatus];

// Re-export database types for convenience
export type { Task, TaskInsert, TaskUpdate };

// Priority configuration for display
export interface PriorityConfig {
  value: TaskPriorityType;
  label: string;
  color: string;
  dotColor: string;
}

export const PRIORITY_CONFIGS: Record<TaskPriorityType, PriorityConfig> = {
  [TaskPriority.LOW]: {
    value: 'low',
    label: 'Faible',
    color: '#6b7280', // gray
    dotColor: 'bg-gray-500',
  },
  [TaskPriority.MEDIUM]: {
    value: 'medium',
    label: 'Moyen',
    color: '#f59e0b', // amber
    dotColor: 'bg-amber-500',
  },
  [TaskPriority.HIGH]: {
    value: 'high',
    label: 'Élevé',
    color: '#ef4444', // red
    dotColor: 'bg-red-500',
  },
};

// Helper function to get priority config
export function getPriorityConfig(priority: string): PriorityConfig {
  return (
    PRIORITY_CONFIGS[priority as TaskPriorityType] || PRIORITY_CONFIGS[TaskPriority.MEDIUM]
  );
}
