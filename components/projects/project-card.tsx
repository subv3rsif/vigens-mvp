import Link from "next/link";
import { Project } from "../../types/database.types";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { cn } from "../../lib/utils";

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Link href={`/projects/${project.id}`}>
      <Card
        className={cn(
          "transition-all duration-200 hover:border-accent-blue hover:shadow-md cursor-pointer h-full"
        )}
      >
        <CardHeader>
          <div className="flex items-center gap-2">
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
      </Card>
    </Link>
  );
}
