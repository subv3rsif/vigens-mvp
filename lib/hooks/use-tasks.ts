'use client';

import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { createClient } from '../supabase/client';
import { useTaskStore } from '../stores/task-store';
import { Task, TaskInsert, TaskUpdate } from '../../types/database.types';

function getTasksQueryKey(projectId?: string) {
  return projectId ? ['tasks', projectId] : ['tasks'];
}

async function fetchTasks(projectId?: string): Promise<Task[]> {
  const supabase = createClient();
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData?.session?.user?.id;

  if (!userId) {
    throw new Error('Not authenticated');
  }

  let query = supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .order('position', { ascending: true });

  if (projectId) {
    query = query.eq('project_id', projectId);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

async function createTaskInDb(task: TaskInsert): Promise<Task> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('tasks')
    .insert([task])
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function updateTaskInDb(
  id: string,
  updates: TaskUpdate
): Promise<Task> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function deleteTaskInDb(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from('tasks').delete().eq('id', id);

  if (error) throw error;
}

export function useTasks(projectId?: string) {
  const queryClient = useQueryClient();
  const { setTasks, addTask, updateTask, deleteTask } = useTaskStore();

  const queryKey = getTasksQueryKey(projectId);

  // Fetch tasks
  const { data: tasks = [], isLoading } = useQuery({
    queryKey,
    queryFn: () => fetchTasks(projectId),
    enabled: true,
  });

  // Sync to Zustand store
  React.useEffect(() => {
    setTasks(tasks);
  }, [tasks, setTasks]);

  // Create task mutation
  const createMutation = useMutation({
    mutationFn: async (newTask: TaskInsert) => {
      return createTaskInDb(newTask);
    },
    onMutate: async (newTask) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey });

      // Snapshot previous data
      const previousTasks = queryClient.getQueryData<Task[]>(queryKey);

      // Create temp task with temporary ID
      const tempTask: Task = {
        id: `temp-${Date.now()}`,
        project_id: newTask.project_id,
        user_id: newTask.user_id,
        title: newTask.title,
        description: newTask.description || null,
        status: newTask.status || 'todo',
        priority: newTask.priority || 'medium',
        due_date: newTask.due_date || null,
        assigned_to: newTask.assigned_to || null,
        position: newTask.position || 0,
        archived: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Optimistically update
      queryClient.setQueryData<Task[]>(queryKey, (old) => [
        tempTask,
        ...(old || []),
      ]);
      addTask(tempTask);

      return { previousTasks, tempTask };
    },
    onSuccess: (data, _, context) => {
      // Replace temp task with real one
      queryClient.setQueryData<Task[]>(queryKey, (old) =>
        old
          ? old.map((t) =>
              t.id === context?.tempTask.id ? data : t
            )
          : [data]
      );
      updateTask(context?.tempTask.id!, data);
      toast.success('Tâche créée');
    },
    onError: (_, __, context) => {
      // Rollback on error
      queryClient.setQueryData(queryKey, context?.previousTasks);
      toast.error('Erreur lors de la création de la tâche');
    },
  });

  // Update task mutation
  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: TaskUpdate;
    }) => {
      return updateTaskInDb(id, updates);
    },
    onMutate: async ({ id, updates }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey });

      // Snapshot previous data
      const previousTasks = queryClient.getQueryData<Task[]>(queryKey);

      // Optimistically update
      queryClient.setQueryData<Task[]>(queryKey, (old) =>
        old
          ? old.map((t) => (t.id === id ? { ...t, ...updates } : t))
          : old
      );
      updateTask(id, updates);

      return { previousTasks };
    },
    onSuccess: (data) => {
      toast.success('Tâche mise à jour');
    },
    onError: (_, __, context) => {
      // Rollback on error
      queryClient.setQueryData(queryKey, context?.previousTasks);
      toast.error('Erreur lors de la mise à jour de la tâche');
    },
  });

  // Delete task mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return deleteTaskInDb(id);
    },
    onMutate: async (id) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey });

      // Snapshot previous data
      const previousTasks = queryClient.getQueryData<Task[]>(queryKey);

      // Optimistically remove
      queryClient.setQueryData<Task[]>(queryKey, (old) =>
        old ? old.filter((t) => t.id !== id) : old
      );
      deleteTask(id);

      return { previousTasks };
    },
    onSuccess: () => {
      toast.success('Tâche supprimée');
    },
    onError: (_, __, context) => {
      // Rollback on error
      queryClient.setQueryData(queryKey, context?.previousTasks);
      toast.error('Erreur lors de la suppression de la tâche');
    },
  });

  return {
    tasks,
    isLoading,
    createTask: createMutation.mutate,
    updateTask: updateMutation.mutate,
    deleteTask: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
