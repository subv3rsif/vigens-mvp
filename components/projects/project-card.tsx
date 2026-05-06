import Link from "next/link";
import { Settings } from "lucide-react";
import { Project } from "../../types/database.types";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Card
      className={cn(
        "relative transition-all duration-200 hover:border-accent-blue hover:shadow-md h-full group"
      )}
    >
      <Link href={`/projects/${project.id}`} className="block">
        <CardHeader>
          <div className="flex items-center gap-2 pr-8">
            <span className="text-xl" role="img" aria-label="Project icon">
              {project.icon}
            </span>
            <CardTitle className="line-clamp-1">{project.name}</CardTitle>
          </div>
        </CardHeader>
        {project.description && (
          <CardContent>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {project.description}
            </p>
          </CardContent>
        )}
      </Link>

      <Link
        href={`/projects/${project.id}`}
        className="absolute top-3 right-3 z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <Button
          variant="ghost"
          size="icon-sm"
          className="opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Paramètres du projet"
        >
          <Settings className="size-4" />
        </Button>
      </Link>
    </Card>
  );
}
