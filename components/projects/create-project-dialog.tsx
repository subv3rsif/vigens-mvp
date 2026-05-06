'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { ProjectForm, ProjectFormData } from './project-form';
import { useProjects } from '../../lib/hooks/use-projects';
import { createClient } from '../../lib/supabase/client';

interface CreateProjectDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function CreateProjectDialog({
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: CreateProjectDialogProps = {}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const { createProject, isCreating } = useProjects();

  const open = controlledOpen ?? internalOpen;
  const setOpen = controlledOnOpenChange ?? setInternalOpen;

  const handleSubmit = async (data: ProjectFormData) => {
    try {
      // Get user ID from Supabase session
      const supabase = createClient();
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;

      if (!userId) {
        toast.error('Vous devez être connecté pour créer un projet');
        return;
      }

      // Create project with user_id
      createProject(
        {
          user_id: userId,
          name: data.name,
          description: data.description || null,
          icon: data.icon || '📁',
          color: data.color || '#3b82f6',
        },
        {
          onSuccess: () => {
            setOpen(false);
          },
        }
      );
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error('Une erreur est survenue');
    }
  };

  const handleCancel = () => {
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Nouveau projet
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Créer un projet</DialogTitle>
          <DialogDescription>
            Ajoutez un nouveau projet pour organiser vos tâches
          </DialogDescription>
        </DialogHeader>
        <ProjectForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={isCreating}
        />
      </DialogContent>
    </Dialog>
  );
}
