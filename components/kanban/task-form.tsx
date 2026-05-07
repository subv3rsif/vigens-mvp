'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { PRIORITY_CONFIGS, TaskPriorityType } from '../../types/task.types';
import { ColumnStatusType } from '../../types/kanban.types';

// Form validation schema
const taskFormSchema = z.object({
  title: z
    .string()
    .min(1, 'Le titre est requis')
    .max(200, 'Le titre ne peut pas dépasser 200 caractères'),
  description: z
    .string()
    .max(1000, 'La description ne peut pas dépasser 1000 caractères')
    .optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  due_date: z.string().optional(),
  cost: z.string().optional(),
});

export type TaskFormData = z.infer<typeof taskFormSchema>;

interface TaskFormProps {
  initialStatus: ColumnStatusType;
  onSubmit: (data: TaskFormData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function TaskForm({
  initialStatus,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: TaskFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: '',
      description: '',
      priority: 'medium',
      due_date: '',
    },
  });

  const selectedPriority = watch('priority');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Title field */}
      <div className="space-y-2">
        <Label htmlFor="title">
          Titre <span className="text-destructive">*</span>
        </Label>
        <Input
          id="title"
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
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
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
        <Label htmlFor="cost">Coût (€)</Label>
        <Input
          id="cost"
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

      {/* Priority field */}
      <div className="space-y-2">
        <Label htmlFor="priority">Priorité</Label>
        <Select
          value={selectedPriority}
          onValueChange={(value) =>
            setValue('priority', value as TaskPriorityType)
          }
        >
          <SelectTrigger id="priority" className="w-full">
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
        <Label htmlFor="due_date">Date d'échéance</Label>
        <Input
          id="due_date"
          type="date"
          aria-invalid={errors.due_date ? 'true' : 'false'}
          {...register('due_date')}
        />
        {errors.due_date && (
          <p className="text-xs text-destructive">{errors.due_date.message}</p>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 justify-end pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Annuler
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Création...' : 'Créer la tâche'}
        </Button>
      </div>
    </form>
  );
}
