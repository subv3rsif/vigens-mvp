'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Calendar, Edit2, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { ConfirmDialog } from '../projects/confirm-dialog';
import { SubtaskList } from '../tasks/subtask-list';
import { DocumentTabs } from '../documents/document-tabs';
import { useTasks } from '../../lib/hooks/use-tasks';
import { Task } from '../../types/database.types';
import { PRIORITY_CONFIGS, TaskPriorityType, getPriorityConfig } from '../../types/task.types';
import { COLUMN_CONFIGS, ColumnStatusType, getColumnConfig } from '../../types/kanban.types';

// Form validation schema (same as TaskForm)
const taskFormSchema = z.object({
  title: z
    .string()
    .min(1, 'Le titre est requis')
    .max(200, 'Le titre ne peut pas dépasser 200 caractères'),
  description: z
    .string()
    .max(1000, 'La description ne peut pas dépasser 1000 caractères')
    .optional(),
  status: z.enum(['todo', 'in_progress', 'done']),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  due_date: z.string().optional(),
  cost: z.string().optional(),
});

type TaskFormData = z.infer<typeof taskFormSchema>;

interface TaskDetailsDialogProps {
  taskId: string | null;
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TaskDetailsDialog({
  taskId,
  projectId,
  open,
  onOpenChange,
}: TaskDetailsDialogProps) {
  const { tasks, updateTask, deleteTask, isUpdating, isDeleting } = useTasks(projectId);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Find the task
  const task = tasks.find((t) => t.id === taskId);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskFormSchema),
    values: task
      ? {
          title: task.title,
          description: task.description || '',
          status: task.status as ColumnStatusType,
          priority: task.priority as TaskPriorityType,
          due_date: task.due_date || '',
          cost: task.cost ? String(task.cost) : '',
        }
      : undefined,
  });

  const selectedPriority = watch('priority');
  const selectedStatus = watch('status');

  // Handle task not found
  if (!task) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tâche introuvable</DialogTitle>
            <DialogDescription>
              Cette tâche n'existe pas ou a été supprimée.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => onOpenChange(false)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  const priorityConfig = task.priority ? getPriorityConfig(task.priority as TaskPriorityType) : null;
  const statusConfig = getColumnConfig(task.status as ColumnStatusType);

  // Handle edit mode toggle
  const handleEditClick = () => {
    setIsEditMode(true);
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    reset();
  };

  // Handle form submission
  const onSubmit = (data: TaskFormData) => {
    updateTask(
      {
        id: task.id,
        updates: {
          title: data.title,
          description: data.description || null,
          status: data.status,
          priority: data.priority || 'medium',
          due_date: data.due_date || null,
          cost: data.cost ? Number(data.cost) : null,
        },
      },
      {
        onSuccess: () => {
          setIsEditMode(false);
          toast.success('Tâche mise à jour');
        },
      }
    );
  };

  // Handle delete
  const handleDeleteClick = () => {
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    deleteTask(task.id, {
      onSuccess: () => {
        setIsDeleteDialogOpen(false);
        onOpenChange(false);
        toast.success('Tâche supprimée');
      },
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          {isEditMode ? (
            // Edit Mode
            <form onSubmit={handleSubmit(onSubmit)}>
              <DialogHeader>
                <DialogTitle>Modifier la tâche</DialogTitle>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {/* Title field */}
                <div className="space-y-2">
                  <Label htmlFor="edit-title">
                    Titre <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="edit-title"
                    placeholder="Entrez le titre de la tâche"
                    aria-invalid={errors.title ? 'true' : 'false'}
                    {...register('title')}
                  />
                  {errors.title && (
                    <p className="text-xs text-destructive">{errors.title.message}</p>
                  )}
                </div>

                {/* Description field */}
                <div className="space-y-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    placeholder="Ajoutez une description (optionnel)"
                    rows={4}
                    aria-invalid={errors.description ? 'true' : 'false'}
                    {...register('description')}
                  />
                  {errors.description && (
                    <p className="text-xs text-destructive">
                      {errors.description.message}
                    </p>
                  )}
                </div>

                {/* Cost field */}
                <div className="space-y-2">
                  <Label htmlFor="edit-cost">Coût (€)</Label>
                  <Input
                    id="edit-cost"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    aria-invalid={errors.cost ? 'true' : 'false'}
                    {...register('cost')}
                  />
                  {errors.cost && (
                    <p className="text-xs text-destructive">{errors.cost.message}</p>
                  )}
                </div>

                {/* Status field */}
                <div className="space-y-2">
                  <Label htmlFor="edit-status">Statut</Label>
                  <Select
                    value={selectedStatus}
                    onValueChange={(value) =>
                      setValue('status', value as ColumnStatusType)
                    }
                  >
                    <SelectTrigger id="edit-status" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COLUMN_CONFIGS.map((config) => (
                        <SelectItem key={config.id} value={config.id}>
                          {config.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.status && (
                    <p className="text-xs text-destructive">{errors.status.message}</p>
                  )}
                </div>

                {/* Priority field */}
                <div className="space-y-2">
                  <Label htmlFor="edit-priority">Priorité</Label>
                  <Select
                    value={selectedPriority}
                    onValueChange={(value) =>
                      setValue('priority', value as TaskPriorityType)
                    }
                  >
                    <SelectTrigger id="edit-priority" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(PRIORITY_CONFIGS).map((config) => (
                        <SelectItem key={config.value} value={config.value}>
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${config.dotColor}`} />
                            <span>{config.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.priority && (
                    <p className="text-xs text-destructive">{errors.priority.message}</p>
                  )}
                </div>

                {/* Due date field */}
                <div className="space-y-2">
                  <Label htmlFor="edit-due_date">Date d'échéance</Label>
                  <Input
                    id="edit-due_date"
                    type="date"
                    aria-invalid={errors.due_date ? 'true' : 'false'}
                    {...register('due_date')}
                  />
                  {errors.due_date && (
                    <p className="text-xs text-destructive">{errors.due_date.message}</p>
                  )}
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancelEdit}
                  disabled={isUpdating}
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={isUpdating}>
                  {isUpdating ? 'Enregistrement...' : 'Enregistrer'}
                </Button>
              </DialogFooter>
            </form>
          ) : (
            // View Mode
            <>
              <DialogHeader>
                <DialogTitle className="text-xl">{task.title}</DialogTitle>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Description */}
                {task.description && (
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Description</Label>
                    <p className="text-sm text-foreground whitespace-pre-wrap">
                      {task.description}
                    </p>
                  </div>
                )}

                {/* Status */}
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Statut</Label>
                  <div className="flex items-center gap-2">
                    {statusConfig && (
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: statusConfig.color }}
                        aria-hidden="true"
                      />
                    )}
                    <span className="text-sm font-medium text-foreground">
                      {statusConfig?.title}
                    </span>
                  </div>
                </div>

                {/* Priority */}
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Priorité</Label>
                  <div className="flex items-center gap-2">
                    {priorityConfig && (
                      <>
                        <div
                          className={`w-2 h-2 rounded-full ${priorityConfig.dotColor}`}
                          aria-hidden="true"
                        />
                        <span className="text-sm font-medium text-foreground">
                          {priorityConfig.label}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Due date */}
                {task.due_date && (
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Date d'échéance</Label>
                    <div className="flex items-center gap-2">
                      <Calendar className="size-4 text-muted-foreground" aria-hidden="true" />
                      <span className="text-sm font-medium text-foreground">
                        {new Date(task.due_date).toLocaleDateString('fr-FR', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                )}

                {/* Cost */}
                {task.cost && (
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Coût</Label>
                    <p className="text-sm font-medium text-foreground">
                      {task.cost.toFixed(2)} €
                    </p>
                  </div>
                )}

                {/* Created at */}
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Créée le</Label>
                  <p className="text-sm text-foreground">
                    {new Date(task.created_at).toLocaleDateString('fr-FR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>

              {/* Subtasks section */}
              <SubtaskList taskId={task.id} />

              {/* Documents section */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-sm font-semibold text-foreground">Documents</h3>
                <DocumentTabs taskId={task.id} />
              </div>

              <DialogFooter>
                <Button
                  variant="destructive"
                  onClick={handleDeleteClick}
                  disabled={isDeleting}
                >
                  <Trash2 className="size-4 mr-2" />
                  Supprimer
                </Button>
                <Button onClick={handleEditClick}>
                  <Edit2 className="size-4 mr-2" />
                  Modifier
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Supprimer la tâche ?"
        description="Cette action est irréversible."
        confirmLabel="Supprimer"
        onConfirm={handleDeleteConfirm}
        variant="destructive"
        isLoading={isDeleting}
      />
    </>
  );
}
