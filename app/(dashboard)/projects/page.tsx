'use client';

import { FolderKanban, Plus } from "lucide-react";
import { useProjects } from "../../../lib/hooks/use-projects";
import { Button } from "../../../components/ui/button";
import { EmptyState } from "../../../components/ui/empty-state";
import { ProjectList } from "../../../components/projects/project-list";

export default function ProjectsPage() {
  const { projects, isLoading } = useProjects();

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
        <Button
          onClick={() => console.log("Create project clicked")}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Nouveau projet
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Chargement des projets...</p>
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="Aucun projet"
          description="Créez votre premier projet pour commencer à organiser vos tâches."
          action={{
            label: "Créer un projet",
            onClick: () => console.log("Create project clicked"),
            variant: "outline",
          }}
        />
      ) : (
        <ProjectList projects={projects} />
      )}
    </div>
  );
}
