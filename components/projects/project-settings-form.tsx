'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { Archive, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { ConfirmDialog } from './confirm-dialog';
import { Project } from '../../types/database.types';
import { useProjects } from '../../lib/hooks/use-projects';

// Zod validation schema
const projectSettingsSchema = z.object({
  name: z
    .string()
    .min(1, 'Le nom est requis')
    .max(100, 'Maximum 100 caractères'),
  description: z
    .string()
    .max(500, 'Maximum 500 caractères')
    .optional()
    .or(z.literal('')),
  icon: z.string().max(2, 'Maximum 2 caractères'),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Format de couleur invalide'),
});

export type ProjectSettingsData = z.infer<typeof projectSettingsSchema>;

interface ProjectSettingsFormProps {
  project: Project;
  onUpdate: (id: string, data: ProjectSettingsData) => void;
  isUpdating?: boolean;
}

export function ProjectSettingsForm({
  project,
  onUpdate,
  isUpdating,
}: ProjectSettingsFormProps) {
  const router = useRouter();
  const { updateProjectMutation, deleteProjectMutation, isDeleting } = useProjects();
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ProjectSettingsData>({
    resolver: zodResolver(projectSettingsSchema),
    defaultValues: {
      name: project.name,
      description: project.description || '',
      icon: project.icon,
      color: project.color,
    },
  });

  const onSubmit = (data: ProjectSettingsData) => {
    onUpdate(project.id, data);
  };

  const handleArchive = () => {
    updateProjectMutation.mutate(
      { id: project.id, updates: { archived: true } },
      {
        onSuccess: () => {
          router.push('/projects');
        },
        onError: () => {
          // Error toast already shown by useProjects hook
          setShowArchiveDialog(false);
        }
      }
    );
  };

  const handleDelete = () => {
    deleteProjectMutation.mutate(project.id, {
      onSuccess: () => {
        router.push('/projects');
      },
      onError: () => {
        // Error toast already shown by useProjects hook
        setShowDeleteDialog(false);
      }
    });
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              Nom du projet <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="Mon projet"
              aria-invalid={errors.name ? 'true' : 'false'}
              disabled={isUpdating}
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
              disabled={isUpdating}
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
                disabled={isUpdating}
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
                disabled={isUpdating}
                className="h-8 cursor-pointer"
              />
              {errors.color && (
                <p className="text-sm text-destructive" role="alert">
                  {errors.color.message}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={isUpdating || !isDirty}>
            {isUpdating ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </Button>
        </div>
      </form>

      <div className="mt-8 space-y-4 border-t pt-8">
        <h3 className="text-lg font-semibold text-foreground">Zone de danger</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-4">
            <div className="flex-1">
              <p className="font-medium text-foreground">Archiver le projet</p>
              <p className="text-sm text-muted-foreground">
                Le projet sera masqué mais vous pourrez le restaurer plus tard.
              </p>
            </div>
            <Button
              variant="secondary"
              onClick={() => setShowArchiveDialog(true)}
              disabled={isDeleting}
              data-icon="inline-start"
            >
              <Archive className="size-4" data-icon="inline-start" />
              Archiver
            </Button>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/5 p-4">
            <div className="flex-1">
              <p className="font-medium text-foreground">Supprimer le projet</p>
              <p className="text-sm text-muted-foreground">
                Cette action est irréversible. Toutes les tâches seront supprimées.
              </p>
            </div>
            <Button
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
              disabled={isDeleting}
              data-icon="inline-start"
            >
              <Trash2 className="size-4" data-icon="inline-start" />
              Supprimer
            </Button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={showArchiveDialog}
        onOpenChange={setShowArchiveDialog}
        title="Archiver le projet ?"
        description="Le projet sera masqué mais vous pourrez le restaurer plus tard."
        confirmLabel="Archiver"
        onConfirm={handleArchive}
        variant="default"
        isLoading={isUpdating}
      />

      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Supprimer le projet ?"
        description="Cette action est irréversible. Toutes les tâches de ce projet seront également supprimées."
        confirmLabel="Supprimer définitivement"
        onConfirm={handleDelete}
        variant="destructive"
        isLoading={isDeleting}
      />
    </>
  );
}
