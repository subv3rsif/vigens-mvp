'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../ui/dialog';
import { TaskForm, TaskFormData } from './task-form';
import { ColumnStatusType } from '../../types/kanban.types';
import { useTasks } from '../../lib/hooks/use-tasks';
import { createClient } from '../../lib/supabase/client';
import { TaskInsert } from '../../types/database.types';

interface CreateTaskDialogProps {
  projectId: string;
  initialStatus: ColumnStatusType;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateTaskDialog({
  projectId,
  initialStatus,
  open,
  onOpenChange,
}: CreateTaskDialogProps) {
  const { tasks, createTask, isCreating } = useTasks(projectId);

  // Calculate the next position for the new task in the column
  const calculateNextPosition = (status: ColumnStatusType): number => {
    const tasksInColumn = tasks.filter((task) => task.status === status);
    if (tasksInColumn.length === 0) return 0;
    const maxPosition = Math.max(...tasksInColumn.map((task) => task.position));
    return maxPosition + 1;
  };

  const handleSubmit = async (data: TaskFormData) => {
    try {
      // Get the current user session
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user?.id) {
        throw new Error('User not authenticated');
      }

      // Calculate position
      const position = calculateNextPosition(initialStatus);

      // Prepare task data
      const newTask: TaskInsert = {
        project_id: projectId,
        user_id: session.user.id,
        title: data.title,
        description: data.description || null,
        status: initialStatus,
        priority: data.priority || 'medium',
        due_date: data.due_date || null,
        position,
      };

      // Create the task
      createTask(newTask);

      // Close dialog on success
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Créer une nouvelle tâche</DialogTitle>
          <DialogDescription>
            Ajoutez une nouvelle tâche à votre projet. Remplissez les
            informations ci-dessous.
          </DialogDescription>
        </DialogHeader>

        <TaskForm
          initialStatus={initialStatus}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={isCreating}
        />
      </DialogContent>
    </Dialog>
  );
}
