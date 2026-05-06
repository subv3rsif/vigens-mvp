'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Settings } from 'lucide-react';
import { useProjects } from '../../../../lib/hooks/use-projects';
import { Button } from '../../../../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../../components/ui/tabs';
import { ProjectSettingsForm, ProjectSettingsData } from '../../../../components/projects/project-settings-form';
import { EmptyState } from '../../../../components/ui/empty-state';

interface ProjectSettingsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function ProjectSettingsPage({ params }: ProjectSettingsPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const {
    projects,
    isLoading,
    updateProject,
    deleteProject,
    isUpdating,
    isDeleting,
    updateProjectMutation,
    deleteProjectMutation,
  } = useProjects();

  // Find the project
  const project = projects.find((p) => p.id === id);

  // Handle loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Chargement du projet...</p>
      </div>
    );
  }

  // Handle not found or no access
  if (!project) {
    return (
      <EmptyState
        icon={Settings}
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

  const handleUpdate = (projectId: string, data: ProjectSettingsData) => {
    updateProject({
      id: projectId,
      updates: {
        name: data.name,
        description: data.description || null,
        icon: data.icon,
        color: data.color,
      },
    });
  };

  const handleArchive = (projectId: string) => {
    updateProject({
      id: projectId,
      updates: {
        archived: true,
      },
    });
  };

  const handleDelete = (projectId: string) => {
    deleteProject(projectId);
  };

  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/projects')}
          aria-label="Retour aux projets"
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
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="settings">
        <TabsList>
          <TabsTrigger value="settings">Paramètres</TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="mt-6">
          <div className="mx-auto max-w-2xl">
            <ProjectSettingsForm
              project={project}
              onUpdate={handleUpdate}
              onArchive={handleArchive}
              onDelete={handleDelete}
              isUpdating={isUpdating}
              isDeleting={isDeleting}
              updateProjectMutation={updateProjectMutation}
              deleteProjectMutation={deleteProjectMutation}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
