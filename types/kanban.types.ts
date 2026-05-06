// Kanban board column status types

export const ColumnStatus = {
  TODO: 'todo',
  IN_PROGRESS: 'in_progress',
  DONE: 'done',
} as const;

export type ColumnStatusType = (typeof ColumnStatus)[keyof typeof ColumnStatus];

// Column configuration for display
export interface ColumnConfig {
  id: ColumnStatusType;
  title: string;
  color: string;
  order: number;
}

export const COLUMN_CONFIGS: ColumnConfig[] = [
  {
    id: ColumnStatus.TODO,
    title: 'À faire',
    color: '#6366f1', // indigo
    order: 1,
  },
  {
    id: ColumnStatus.IN_PROGRESS,
    title: 'En cours',
    color: '#f59e0b', // amber
    order: 2,
  },
  {
    id: ColumnStatus.DONE,
    title: 'Terminé',
    color: '#10b981', // green
    order: 3,
  },
];

// Helper function to get column config by status
export function getColumnConfig(status: ColumnStatusType): ColumnConfig | undefined {
  return COLUMN_CONFIGS.find((config) => config.id === status);
}
