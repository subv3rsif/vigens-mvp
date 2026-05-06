'use client';

import { Plus } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';

interface KanbanColumnProps {
  title: string;
  taskCount: number;
  onAddTask: () => void;
  color?: string;
  children?: React.ReactNode;
}

export function KanbanColumn({
  title,
  taskCount,
  onAddTask,
  color = '#6366f1',
  children,
}: KanbanColumnProps) {
  const isEmpty = taskCount === 0;

  return (
    <Card className="flex flex-col h-full min-h-[400px] border-border">
      <CardHeader className="border-b border-border pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: color }}
              aria-hidden="true"
            />
            <CardTitle className="text-sm font-semibold">{title}</CardTitle>
            <Badge variant="secondary" className="text-xs">
              {taskCount}
            </Badge>
          </div>
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={onAddTask}
            aria-label={`Ajouter une tâche dans ${title}`}
          >
            <Plus className="size-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 pt-4">
        {isEmpty ? (
          <div className="flex items-center justify-center h-full min-h-[200px]">
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">Aucune tâche</p>
              <Button
                size="sm"
                variant="ghost"
                onClick={onAddTask}
                data-icon="inline-start"
              >
                <Plus className="size-3.5" data-icon="inline-start" />
                Ajouter une tâche
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {children}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
