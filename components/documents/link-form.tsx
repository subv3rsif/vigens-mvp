'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useLinks } from '@/lib/hooks/use-links';

const linkFormSchema = z.object({
  title: z
    .string()
    .min(1, 'Le titre est requis')
    .max(200, 'Le titre ne peut pas dépasser 200 caractères'),
  url: z
    .string()
    .min(1, "L'URL est requise")
    .url("L'URL doit être valide (ex: https://example.com)"),
  description: z
    .string()
    .max(500, 'La description ne peut pas dépasser 500 caractères')
    .optional(),
});

type LinkFormData = z.infer<typeof linkFormSchema>;

interface LinkFormProps {
  taskId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function LinkForm({ taskId, onSuccess, onCancel }: LinkFormProps) {
  const { createLink } = useLinks(taskId);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<LinkFormData>({
    resolver: zodResolver(linkFormSchema),
    defaultValues: {
      title: '',
      url: '',
      description: '',
    },
  });

  const onSubmit = (data: LinkFormData) => {
    createLink.mutate(
      {
        ...data,
        taskId,
      },
      {
        onSuccess: () => {
          reset();
          onSuccess?.();
        },
      }
    );
  };

  const isSubmitting = createLink.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Titre</Label>
        <Input
          id="title"
          {...register('title')}
          disabled={isSubmitting}
          aria-invalid={errors.title ? 'true' : 'false'}
          aria-describedby={errors.title ? 'title-error' : undefined}
        />
        {errors.title && (
          <p id="title-error" className="text-sm text-red-600" role="alert">
            {errors.title.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="url">URL</Label>
        <Input
          id="url"
          {...register('url')}
          disabled={isSubmitting}
          placeholder="https://example.com"
          aria-invalid={errors.url ? 'true' : 'false'}
          aria-describedby={errors.url ? 'url-error' : undefined}
        />
        {errors.url && (
          <p id="url-error" className="text-sm text-red-600" role="alert">
            {errors.url.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          {...register('description')}
          disabled={isSubmitting}
          rows={3}
          aria-invalid={errors.description ? 'true' : 'false'}
          aria-describedby={errors.description ? 'description-error' : undefined}
        />
        {errors.description && (
          <p id="description-error" className="text-sm text-red-600" role="alert">
            {errors.description.message}
          </p>
        )}
      </div>

      <div className="flex gap-2 justify-end">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Annuler
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Ajout en cours...' : 'Ajouter'}
        </Button>
      </div>
    </form>
  );
}
