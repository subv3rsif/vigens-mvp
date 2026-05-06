'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { FolderKanban, ListTodo, Plus, ArrowRight, CheckCircle2, Circle, Clock } from 'lucide-react';
import { useProjects } from '../../../lib/hooks/use-projects';
import { useTasks } from '../../../lib/hooks/use-tasks';
import { createClient } from '../../../lib/supabase/client';
import { StatsCard } from '../../../components/dashboard/stats-card';
import { ProjectCard } from '../../../components/projects/project-card';
import { Button } from '../../../components/ui/button';
import { EmptyState } from '../../../components/ui/empty-state';
import { CreateProjectDialog } from '../../../components/projects/create-project-dialog';
import { CreateTaskDialog } from '../../../components/kanban/create-task-dialog';
import { TaskDetailsDialog } from '../../../components/kanban/task-details-dialog';
import { Task } from '../../../types/database.types';
import { getPriorityConfig } from '../../../types/task.types';
import { ColumnStatus, getColumnConfig } from '../../../types/kanban.types';

export default function DashboardPage() {
  const { projects, isLoading: projectsLoading } = useProjects();
  const { tasks, isLoading: tasksLoading } = useTasks(); // Get all tasks (no project filter)
  const [userName, setUserName] = useState<string>('');
  const [isCreateTaskDialogOpen, setIsCreateTaskDialogOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');

  // Get user name from session
  useEffect(() => {
    async function getUserName() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.user_metadata?.full_name) {
        setUserName(session.user.user_metadata.full_name);
      } else if (session?.user?.email) {
        // Fallback to email first part
        setUserName(session.user.email.split('@')[0]);
      }
    }
    getUserName();
  }, []);

  // Calculate statistics
  const stats = useMemo(() => {
    const todoTasks = tasks.filter((task) => task.status === ColumnStatus.TODO);
    const inProgressTasks = tasks.filter(
      (task) => task.status === ColumnStatus.IN_PROGRESS
    );
    const doneTasks = tasks.filter((task) => task.status === ColumnStatus.DONE);

    return {
      totalProjects: projects.length,
      totalTasks: tasks.length,
      todoTasks: todoTasks.length,
      inProgressTasks: inProgressTasks.length,
      doneTasks: doneTasks.length,
    };
  }, [projects, tasks]);

  // Get recent projects (5 most recent)
  const recentProjects = useMemo(() => {
    return projects.slice(0, 5);
  }, [projects]);

  // Get recent tasks (10 most recent) with project info
  const recentTasks = useMemo(() => {
    return tasks
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10);
  }, [tasks]);

  const isLoading = projectsLoading || tasksLoading;

  // Get project name for a task
  const getProjectName = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    return project?.name || 'Projet supprimé';
  };

  // Get project icon for a task
  const getProjectIcon = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    return project?.icon || '📁';
  };

  // Handle task click
  const handleTaskClick = (task: Task) => {
    setSelectedTaskId(task.id);
    setSelectedProjectId(task.project_id);
  };

  // Handle create task click
  const handleCreateTaskClick = () => {
    if (projects.length > 0) {
      setSelectedProjectId(projects[0].id);
      setIsCreateTaskDialogOpen(true);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          {userName ? `Bonjour, ${userName}` : 'Tableau de bord'}
        </h2>
        <p className="text-muted-foreground">
          Voici un aperçu de vos projets et tâches.
        </p>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      )}

      {/* Statistics Cards */}
      {!isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Projets"
            value={stats.totalProjects}
            icon={FolderKanban}
            description="Total de projets actifs"
          />
          <StatsCard
            title="À faire"
            value={stats.todoTasks}
            icon={Circle}
            description="Tâches à démarrer"
          />
          <StatsCard
            title="En cours"
            value={stats.inProgressTasks}
            icon={Clock}
            description="Tâches en progression"
          />
          <StatsCard
            title="Terminé"
            value={stats.doneTasks}
            icon={CheckCircle2}
            description="Tâches complétées"
          />
        </div>
      )}

      {/* Quick Actions */}
      {!isLoading && (
        <div className="flex flex-wrap gap-3">
          <CreateProjectDialog />
          <Button
            variant="outline"
            onClick={handleCreateTaskClick}
            disabled={projects.length === 0}
            className="gap-2"
            title={
              projects.length === 0
                ? 'Créez d\'abord un projet'
                : 'Créer une nouvelle tâche'
            }
          >
            <Plus className="h-4 w-4" />
            Nouvelle tâche
          </Button>
        </div>
      )}

      {/* Recent Projects Section */}
      {!isLoading && projects.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">Projets récents</h3>
            {projects.length > 5 && (
              <Link href="/projects">
                <Button variant="ghost" size="sm" className="gap-2">
                  Voir tous
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recentProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </div>
      )}

      {/* Recent Tasks Section */}
      {!isLoading && tasks.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">Tâches récentes</h3>
          </div>
          <div className="space-y-2">
            {recentTasks.map((task) => {
              const priorityConfig = task.priority
                ? getPriorityConfig(task.priority)
                : null;
              const statusConfig = getColumnConfig(task.status as any);
              const projectName = getProjectName(task.project_id);
              const projectIcon = getProjectIcon(task.project_id);

              return (
                <button
                  key={task.id}
                  onClick={() => handleTaskClick(task)}
                  className="w-full group rounded-lg border border-border bg-card p-4 transition-all hover:shadow-md hover:border-primary/50 cursor-pointer text-left"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Project badge */}
                      <div className="flex items-center gap-1.5 mb-2">
                        <span className="text-xs" role="img" aria-label="Project icon">
                          {projectIcon}
                        </span>
                        <span className="text-xs text-muted-foreground truncate">
                          {projectName}
                        </span>
                      </div>

                      {/* Task title */}
                      <h4 className="font-semibold text-foreground mb-1 line-clamp-1">
                        {task.title}
                      </h4>

                      {/* Task description */}
                      {task.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                          {task.description}
                        </p>
                      )}

                      {/* Task metadata */}
                      <div className="flex items-center gap-3 text-xs">
                        {/* Status */}
                        {statusConfig && (
                          <div className="flex items-center gap-1.5">
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: statusConfig.color }}
                              aria-hidden="true"
                            />
                            <span className="text-muted-foreground">
                              {statusConfig.title}
                            </span>
                          </div>
                        )}

                        {/* Priority */}
                        {priorityConfig && (
                          <div className="flex items-center gap-1.5">
                            <div
                              className={`w-2 h-2 rounded-full ${priorityConfig.dotColor}`}
                              aria-hidden="true"
                            />
                            <span className="text-muted-foreground">
                              {priorityConfig.label}
                            </span>
                          </div>
                        )}

                        {/* Due date */}
                        {task.due_date && (
                          <span className="text-muted-foreground">
                            Échéance:{' '}
                            {new Date(task.due_date).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'short',
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State - No Projects */}
      {!isLoading && projects.length === 0 && (
        <EmptyState
          icon={FolderKanban}
          title="Aucun projet"
          description="Créez votre premier projet pour commencer à organiser vos tâches."
        />
      )}

      {/* Empty State - No Tasks (but has projects) */}
      {!isLoading && projects.length > 0 && tasks.length === 0 && (
        <div className="space-y-4">
          <EmptyState
            icon={ListTodo}
            title="Aucune tâche"
            description="Créez votre première tâche pour commencer à travailler sur vos projets."
          />
        </div>
      )}

      {/* Task Details Dialog */}
      {selectedTaskId && selectedProjectId && (
        <TaskDetailsDialog
          taskId={selectedTaskId}
          projectId={selectedProjectId}
          open={!!selectedTaskId}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedTaskId(null);
              setSelectedProjectId('');
            }
          }}
        />
      )}

      {/* Create Task Dialog */}
      {isCreateTaskDialogOpen && selectedProjectId && (
        <CreateTaskDialog
          projectId={selectedProjectId}
          initialStatus={ColumnStatus.TODO}
          open={isCreateTaskDialogOpen}
          onOpenChange={setIsCreateTaskDialogOpen}
        />
      )}
    </div>
  );
}
