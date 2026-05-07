import Link from "next/link";
import { Settings } from "lucide-react";
import { Project } from "../../types/database.types";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";
import { useTasks } from "../../lib/hooks/use-tasks";
import { BudgetProgressBar } from "../dashboard/budget-progress-bar";

interface ProjectCardProps {
  project: Project;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function ProjectCard({ project }: ProjectCardProps) {
  const { tasks } = useTasks(project.id);

  // Budget calculations
  const hasBudget = project.budget !== null && project.budget !== undefined;
  const spent = tasks.reduce((sum, t) => sum + (t.cost || 0), 0);
  const percentage = hasBudget && project.budget && project.budget > 0
    ? (spent / project.budget) * 100
    : 0;

  const getStatus = (): 'ok' | 'warning' | 'over' => {
    if (percentage > 100) return 'over';
    if (percentage >= 80) return 'warning';
    return 'ok';
  };

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

      {hasBudget && (
        <div className="px-6 pb-4">
          <div className="mt-3 pt-3 border-t border-border">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-text-secondary">Budget</span>
              <span className="font-medium">
                {formatCurrency(spent)} / {formatCurrency(project.budget || 0)} €
              </span>
            </div>
            <BudgetProgressBar percentage={percentage} status={getStatus()} showLabel={false} />
            <BudgetProgressBar percentage={percentage} status={getStatus()} showLabel={false} />
          </div>
        </div>
      )}

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
