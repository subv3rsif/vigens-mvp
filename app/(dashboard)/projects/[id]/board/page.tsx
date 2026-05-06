'use client';

import { use, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { useProjects } from '../../../../../lib/hooks/use-projects';
import { useTasks } from '../../../../../lib/hooks/use-tasks';
import { Button } from '../../../../../components/ui/button';
import { EmptyState } from '../../../../../components/ui/empty-state';
import { KanbanColumn } from '../../../../../components/kanban/kanban-column';
import { TaskCard } from '../../../../../components/kanban/task-card';
import { COLUMN_CONFIGS, ColumnStatusType } from '../../../../../types/kanban.types';
import { Task } from '../../../../../types/database.types';
import { useState } from 'react';

interface BoardPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function BoardPage({ params }: BoardPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { projects, isLoading: projectsLoading } = useProjects();
  const { tasks, isLoading: tasksLoading, updateTask } = useTasks(id);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  // Find the project
  const project = projects.find((p) => p.id === id);

  // Group tasks by status
  const tasksByStatus = useMemo(() => {
    return COLUMN_CONFIGS.reduce((acc, column) => {
      acc[column.id] = tasks.filter((task) => task.status === column.id);
      return acc;
    }, {} as Record<ColumnStatusType, Task[]>);
  }, [tasks]);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Handle loading state
  if (projectsLoading || tasksLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Chargement du tableau...</p>
      </div>
    );
  }

  // Handle not found or no access
  if (!project) {
    return (
      <EmptyState
        icon={ArrowLeft}
        title="Projet introuvable"
        description="Ce projet n'existe pas ou vous n'y avez pas accès."
        action={{
          label: 'Retour aux projets',
          onClick: () => router.push('/projects'),
          variant: 'outline',
        }}
      />
    );
  }

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    const taskId = event.active.id as string;
    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      setActiveTask(task);
    }
  };

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = active.id as string;
    const newStatus = over.id as ColumnStatusType;
    const task = tasks.find((t) => t.id === taskId);

    if (!task || task.status === newStatus) return;

    // Update task status
    updateTask({
      id: taskId,
      updates: { status: newStatus },
    });
  };

  // Placeholder handler for adding tasks
  const handleAddTask = (columnTitle: string) => {
    toast.info(`Ajout d'une tâche dans "${columnTitle}"`, {
      description: 'Cette fonctionnalité sera disponible prochainement.',
    });
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-6">
        {/* Header with back button */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/projects/${id}`)}
            aria-label="Retour au projet"
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-2xl" role="img" aria-label="Project icon">
              {project.icon}
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {project.name}
            </h1>
            <span className="text-muted-foreground">/</span>
            <span className="text-xl text-muted-foreground">Tableau</span>
          </div>
        </div>

        {/* Kanban Board */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
          {COLUMN_CONFIGS.map((column) => (
            <KanbanColumn
              key={column.id}
              id={column.id}
              title={column.title}
              taskCount={tasksByStatus[column.id]?.length || 0}
              color={column.color}
              onAddTask={() => handleAddTask(column.title)}
            >
              {tasksByStatus[column.id]?.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onClick={() => toast.info('Détails de la tâche à venir')}
                />
              ))}
            </KanbanColumn>
          ))}
        </div>
      </div>

      <DragOverlay>
        {activeTask && (
          <TaskCard task={activeTask} />
        )}
      </DragOverlay>
    </DndContext>
  );
}
