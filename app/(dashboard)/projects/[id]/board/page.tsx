'use client';

import { use, useMemo, useState } from 'react';
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
import { CreateTaskDialog } from '../../../../../components/kanban/create-task-dialog';
import { TaskDetailsDialog } from '../../../../../components/kanban/task-details-dialog';
import { COLUMN_CONFIGS, ColumnStatusType } from '../../../../../types/kanban.types';
import { Task } from '../../../../../types/database.types';

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
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedColumnStatus, setSelectedColumnStatus] = useState<ColumnStatusType>('todo');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);

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

  // Handler for adding tasks
  const handleAddTask = (columnStatus: ColumnStatusType) => {
    setSelectedColumnStatus(columnStatus);
    setIsCreateDialogOpen(true);
  };

  // Handler for opening task details
  const handleTaskClick = (taskId: string) => {
    setSelectedTaskId(taskId);
    setIsDetailsDialogOpen(true);
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
              onAddTask={() => handleAddTask(column.id)}
            >
              {tasksByStatus[column.id]?.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onClick={() => handleTaskClick(task.id)}
                />
              ))}
            </KanbanColumn>
          ))}
        </div>
      </div>

      <DragOverlay>
        {activeTask && <TaskCard task={activeTask} />}
      </DragOverlay>

      {/* Create Task Dialog */}
      <CreateTaskDialog
        projectId={id}
        initialStatus={selectedColumnStatus}
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />

      {/* Task Details Dialog */}
      <TaskDetailsDialog
        taskId={selectedTaskId}
        projectId={id}
        open={isDetailsDialogOpen}
        onOpenChange={setIsDetailsDialogOpen}
      />
    </DndContext>
  );
}
