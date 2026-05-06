'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useProjects } from '../../../../../lib/hooks/use-projects';
import { Button } from '../../../../../components/ui/button';
import { EmptyState } from '../../../../../components/ui/empty-state';
import { KanbanColumn } from '../../../../../components/kanban/kanban-column';
import { COLUMN_CONFIGS } from '../../../../../types/kanban.types';

interface BoardPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function BoardPage({ params }: BoardPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { projects, isLoading } = useProjects();

  // Find the project
  const project = projects.find((p) => p.id === id);

  // Handle loading state
  if (isLoading) {
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

  // Placeholder handler for adding tasks
  const handleAddTask = (columnTitle: string) => {
    toast.info(`Ajout d'une tâche dans "${columnTitle}"`, {
      description: 'Cette fonctionnalité sera disponible prochainement.',
    });
  };

  return (
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
            title={column.title}
            taskCount={0}
            color={column.color}
            onAddTask={() => handleAddTask(column.title)}
          />
        ))}
      </div>
    </div>
  );
}
