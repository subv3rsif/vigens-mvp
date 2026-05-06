'use client';

import { FolderKanban } from "lucide-react";
import { useProjects } from "../../../lib/hooks/use-projects";
import { EmptyState } from "../../../components/ui/empty-state";
import { ProjectList } from "../../../components/projects/project-list";
import { CreateProjectDialog } from "../../../components/projects/create-project-dialog";

export default function ProjectsPage() {
  const { projects, isLoading, error } = useProjects();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Projets
          </h2>
          <p className="text-muted-foreground">
            Gérez tous vos projets en un seul endroit.
          </p>
        </div>
        <CreateProjectDialog />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Chargement des projets...</p>
        </div>
      ) : error ? (
        <EmptyState
          icon={FolderKanban}
          title="Erreur de chargement"
          description="Une erreur s'est produite lors du chargement de vos projets. Veuillez réessayer."
          action={{
            label: "Réessayer",
            onClick: () => window.location.reload(),
            variant: "outline",
          }}
        />
      ) : projects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="Aucun projet"
          description="Créez votre premier projet pour commencer à organiser vos tâches."
        />
      ) : (
        <ProjectList projects={projects} />
      )}
    </div>
  );
}
