'use client';

import { useState } from 'react';
import { ExternalLink, Pencil, Trash2 } from 'lucide-react';
import { Link } from '@/types/database.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/projects/confirm-dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const linkEditSchema = z.object({
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

type LinkEditData = z.infer<typeof linkEditSchema>;

interface LinkItemProps {
  link: Link;
  onUpdate: (linkId: string, updates: { title: string; url: string; description?: string | null }) => void;
  onDelete: (linkId: string) => void;
}

export function LinkItem({ link, onUpdate, onDelete }: LinkItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<LinkEditData>({
    resolver: zodResolver(linkEditSchema),
    defaultValues: {
      title: link.title || '',
      url: link.url,
      description: link.description || '',
    },
  });

  const onSubmit = (data: LinkEditData) => {
    onUpdate(link.id, {
      title: data.title,
      url: data.url,
      description: data.description || null,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    reset({
      title: link.title || '',
      url: link.url,
      description: link.description || '',
    });
    setIsEditing(false);
  };

  const handleDelete = () => {
    onDelete(link.id);
    setShowDeleteConfirm(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  };

  const truncateUrl = (url: string, maxLength: number = 60) => {
    if (url.length <= maxLength) return url;
    return url.substring(0, maxLength) + '...';
  };

  return (
    <>
      <div className="flex items-start justify-between gap-4 rounded-lg border p-4">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-base">{link.title}</h4>
          </div>

          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline flex items-center gap-1 text-sm break-all"
          >
            {truncateUrl(link.url)}
            <ExternalLink className="size-3 flex-shrink-0" />
          </a>

          {link.description && (
            <p className="text-sm text-muted-foreground">{link.description}</p>
          )}

          <p className="text-xs text-muted-foreground">
            Ajouté le {formatDate(link.created_at)}
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsEditing(true)}
            aria-label="Modifier le lien"
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowDeleteConfirm(true)}
            aria-label="Supprimer le lien"
          >
            <Trash2 className="size-4 text-destructive" />
          </Button>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le lien</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Titre</Label>
              <Input
                id="edit-title"
                {...register('title')}
                aria-invalid={errors.title ? 'true' : 'false'}
                aria-describedby={errors.title ? 'edit-title-error' : undefined}
              />
              {errors.title && (
                <p id="edit-title-error" className="text-sm text-red-600" role="alert">
                  {errors.title.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-url">URL</Label>
              <Input
                id="edit-url"
                {...register('url')}
                placeholder="https://example.com"
                aria-invalid={errors.url ? 'true' : 'false'}
                aria-describedby={errors.url ? 'edit-url-error' : undefined}
              />
              {errors.url && (
                <p id="edit-url-error" className="text-sm text-red-600" role="alert">
                  {errors.url.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                {...register('description')}
                rows={3}
                aria-invalid={errors.description ? 'true' : 'false'}
                aria-describedby={errors.description ? 'edit-description-error' : undefined}
              />
              {errors.description && (
                <p id="edit-description-error" className="text-sm text-red-600" role="alert">
                  {errors.description.message}
                </p>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCancel}>
                Annuler
              </Button>
              <Button type="submit">
                Modifier
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Supprimer le lien"
        description="Êtes-vous sûr de vouloir supprimer ce lien ? Cette action est irréversible."
        confirmLabel="Supprimer"
        onConfirm={handleDelete}
        variant="destructive"
      />
    </>
  );
}
