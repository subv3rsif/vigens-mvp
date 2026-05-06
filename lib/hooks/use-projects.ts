'use client';

import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { createClient } from '../supabase/client';
import { useProjectStore } from '../stores/project-store';
import { Project, ProjectInsert, ProjectUpdate } from '../../types/database.types';

const PROJECTS_QUERY_KEY = ['projects'];

async function fetchProjects(): Promise<Project[]> {
  const supabase = createClient();
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData?.session?.user?.id;

  if (!userId) {
    throw new Error('Not authenticated');
  }

  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

async function createProjectInDb(project: ProjectInsert): Promise<Project> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('projects')
    .insert([project])
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function updateProjectInDb(
  id: string,
  updates: ProjectUpdate
): Promise<Project> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function deleteProjectInDb(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from('projects').delete().eq('id', id);

  if (error) throw error;
}

export function useProjects() {
  const queryClient = useQueryClient();
  const { setProjects, addProject, updateProject, deleteProject } =
    useProjectStore();

  // Fetch projects
  const { data: projects = [], isLoading, error } = useQuery({
    queryKey: PROJECTS_QUERY_KEY,
    queryFn: fetchProjects,
    enabled: true,
  });

  // Sync to Zustand store
  useEffect(() => {
    setProjects(projects);
  }, [projects, setProjects]);

  // Create project mutation
  const createMutation = useMutation({
    mutationFn: async (newProject: ProjectInsert) => {
      return createProjectInDb(newProject);
    },
    onMutate: async (newProject) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: PROJECTS_QUERY_KEY });

      // Snapshot previous data
      const previousProjects = queryClient.getQueryData<Project[]>(
        PROJECTS_QUERY_KEY
      );

      // Create temp project with temporary ID
      const tempProject: Project = {
        id: `temp-${Date.now()}`,
        user_id: newProject.user_id,
        name: newProject.name,
        description: newProject.description || null,
        color: newProject.color || '#3b82f6',
        icon: newProject.icon || '📁',
        archived: false,
        position: newProject.position || 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Optimistically update
      queryClient.setQueryData<Project[]>(PROJECTS_QUERY_KEY, (old) => [
        tempProject,
        ...(old || []),
      ]);
      addProject(tempProject);

      return { previousProjects, tempProject };
    },
    onSuccess: (data, _, context) => {
      // Guard against undefined context
      if (!context) return;

      // Replace temp project with real one
      queryClient.setQueryData<Project[]>(PROJECTS_QUERY_KEY, (old) =>
        old
          ? old.map((p) =>
              p.id === context.tempProject.id ? data : p
            )
          : [data]
      );
      updateProject(context.tempProject.id, data);
      toast.success('Projet créé');
    },
    onError: (_, __, context) => {
      // Rollback on error
      queryClient.setQueryData(PROJECTS_QUERY_KEY, context?.previousProjects);
      // Also rollback Zustand store
      if (context?.tempProject) {
        deleteProject(context.tempProject.id);
      }
      toast.error('Erreur lors de la création du projet');
    },
  });

  // Update project mutation
  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: ProjectUpdate;
    }) => {
      return updateProjectInDb(id, updates);
    },
    onMutate: async ({ id, updates }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: PROJECTS_QUERY_KEY });

      // Snapshot previous data
      const previousProjects = queryClient.getQueryData<Project[]>(
        PROJECTS_QUERY_KEY
      );

      // Optimistically update
      queryClient.setQueryData<Project[]>(PROJECTS_QUERY_KEY, (old) =>
        old
          ? old.map((p) => (p.id === id ? { ...p, ...updates } : p))
          : old
      );
      updateProject(id, updates);

      return { previousProjects };
    },
    onSuccess: (_, __, context) => {
      // Guard against undefined context
      if (!context) return;

      toast.success('Projet mis à jour');
    },
    onError: (_, __, context) => {
      // Rollback on error
      queryClient.setQueryData(PROJECTS_QUERY_KEY, context?.previousProjects);
      // Also rollback Zustand store
      if (context?.previousProjects) {
        setProjects(context.previousProjects);
      }
      toast.error('Erreur lors de la mise à jour du projet');
    },
  });

  // Delete project mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return deleteProjectInDb(id);
    },
    onMutate: async (id) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: PROJECTS_QUERY_KEY });

      // Snapshot previous data
      const previousProjects = queryClient.getQueryData<Project[]>(
        PROJECTS_QUERY_KEY
      );

      // Optimistically remove
      queryClient.setQueryData<Project[]>(PROJECTS_QUERY_KEY, (old) =>
        old ? old.filter((p) => p.id !== id) : old
      );
      deleteProject(id);

      return { previousProjects };
    },
    onSuccess: (_, __, context) => {
      // Guard against undefined context
      if (!context) return;

      toast.success('Projet supprimé');
    },
    onError: (_, __, context) => {
      // Rollback on error
      queryClient.setQueryData(PROJECTS_QUERY_KEY, context?.previousProjects);
      // Also rollback Zustand store
      if (context?.previousProjects) {
        setProjects(context.previousProjects);
      }
      toast.error('Erreur lors de la suppression du projet');
    },
  });

  return {
    projects,
    isLoading,
    error,
    createProject: createMutation.mutate,
    updateProject: updateMutation.mutate,
    deleteProject: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
