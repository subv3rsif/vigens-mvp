'use client';

import { useState } from 'react';
import { Plus, Link as LinkIcon } from 'lucide-react';
import { useLinks } from '@/lib/hooks/use-links';
import { Button } from '@/components/ui/button';
import { LinkForm } from './link-form';
import { LinkItem } from './link-item';

interface LinkListProps {
  taskId: string;
}

export function LinkList({ taskId }: LinkListProps) {
  const { links, isLoading, updateLink, deleteLink } = useLinks(taskId);
  const [showForm, setShowForm] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with count and add button */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{links.length} lien(s)</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowForm(!showForm)}
        >
          <Plus className="size-4 mr-2" />
          Ajouter un lien
        </Button>
      </div>

      {/* Add link form */}
      {showForm && (
        <div className="rounded-lg border p-4">
          <LinkForm
            taskId={taskId}
            onSuccess={() => setShowForm(false)}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {/* Empty state */}
      {links.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 text-center border rounded-lg">
          <LinkIcon className="size-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Aucun lien ajouté</p>
        </div>
      ) : (
        /* Links list */
        <div className="space-y-3">
          {links.map((link) => (
            <LinkItem
              key={link.id}
              link={link}
              onUpdate={(linkId, updates) =>
                updateLink.mutate({
                  linkId,
                  ...updates,
                })
              }
              onDelete={(linkId) => deleteLink.mutate(linkId)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
