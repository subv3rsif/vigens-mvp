'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';

// Zod validation schema
const projectFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Le nom est requis')
    .max(100, 'Maximum 100 caractères'),
  description: z
    .string()
    .max(500, 'Maximum 500 caractères')
    .optional()
    .or(z.literal('')),
  icon: z
    .string()
    .max(2, 'Maximum 2 caractères'),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Format de couleur invalide'),
});

export type ProjectFormData = z.infer<typeof projectFormSchema>;

interface ProjectFormProps {
  onSubmit: (data: ProjectFormData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function ProjectForm({ onSubmit, onCancel, isSubmitting }: ProjectFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      name: '',
      description: '',
      icon: '📁',
      color: '#3b82f6',
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">
          Nom du projet <span className="text-destructive">*</span>
        </Label>
        <Input
          id="name"
          {...register('name')}
          placeholder="Mon projet"
          aria-invalid={errors.name ? 'true' : 'false'}
          disabled={isSubmitting}
        />
        {errors.name && (
          <p className="text-sm text-destructive" role="alert">
            {errors.name.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description (optionnelle)</Label>
        <Textarea
          id="description"
          {...register('description')}
          placeholder="Décrivez votre projet..."
          aria-invalid={errors.description ? 'true' : 'false'}
          disabled={isSubmitting}
          rows={3}
        />
        {errors.description && (
          <p className="text-sm text-destructive" role="alert">
            {errors.description.message}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="icon">Icône</Label>
          <Input
            id="icon"
            {...register('icon')}
            placeholder="📁"
            maxLength={2}
            aria-invalid={errors.icon ? 'true' : 'false'}
            disabled={isSubmitting}
          />
          {errors.icon && (
            <p className="text-sm text-destructive" role="alert">
              {errors.icon.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="color">Couleur</Label>
          <Input
            id="color"
            type="color"
            {...register('color')}
            aria-invalid={errors.color ? 'true' : 'false'}
            disabled={isSubmitting}
            className="h-8 cursor-pointer"
          />
          {errors.color && (
            <p className="text-sm text-destructive" role="alert">
              {errors.color.message}
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Annuler
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Création...' : 'Créer'}
        </Button>
      </div>
    </form>
  );
}
