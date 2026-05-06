'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { createClient } from '../supabase/client';
import { Subtask, SubtaskInsert, SubtaskUpdate } from '../../types/database.types';

function getSubtasksQueryKey(taskId: string) {
  return ['subtasks', taskId];
}

async function fetchSubtasks(taskId: string): Promise<Subtask[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('subtasks')
    .select('*')
    .eq('task_id', taskId)
    .order('position', { ascending: true });

  if (error) throw error;
  return data || [];
}

async function createSubtaskInDb(subtask: SubtaskInsert): Promise<Subtask> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('subtasks')
    .insert([subtask])
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function updateSubtaskInDb(
  id: string,
  updates: SubtaskUpdate
): Promise<Subtask> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('subtasks')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function deleteSubtaskInDb(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from('subtasks').delete().eq('id', id);

  if (error) throw error;
}

export function useSubtasks(taskId: string) {
  const queryClient = useQueryClient();

  const queryKey = getSubtasksQueryKey(taskId);

  // Fetch subtasks
  const { data: subtasks = [], isLoading } = useQuery({
    queryKey,
    queryFn: () => fetchSubtasks(taskId),
    enabled: !!taskId,
  });

  // Create subtask mutation
  const createMutation = useMutation({
    mutationFn: async (newSubtask: SubtaskInsert) => {
      return createSubtaskInDb(newSubtask);
    },
    onMutate: async (newSubtask) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey });

      // Snapshot previous data
      const previousSubtasks = queryClient.getQueryData<Subtask[]>(queryKey);

      // Create temp subtask with temporary ID
      const tempSubtask: Subtask = {
        id: `temp-${Date.now()}`,
        task_id: newSubtask.task_id,
        user_id: newSubtask.user_id,
        title: newSubtask.title,
        completed: newSubtask.completed || false,
        position: newSubtask.position || (previousSubtasks?.length || 0),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Optimistically update
      queryClient.setQueryData<Subtask[]>(queryKey, (old) => [
        ...(old || []),
        tempSubtask,
      ]);

      return { previousSubtasks, tempSubtask };
    },
    onSuccess: (data, _, context) => {
      // Guard against undefined context
      if (!context) return;

      // Replace temp subtask with real one
      queryClient.setQueryData<Subtask[]>(queryKey, (old) =>
        old
          ? old.map((s) =>
              s.id === context.tempSubtask.id ? data : s
            )
          : [data]
      );
      toast.success('Sous-tâche créée');
    },
    onError: (_, __, context) => {
      // Rollback on error
      queryClient.setQueryData(queryKey, context?.previousSubtasks);
      toast.error('Erreur lors de la création de la sous-tâche');
    },
  });

  // Update subtask mutation
  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: SubtaskUpdate;
    }) => {
      return updateSubtaskInDb(id, updates);
    },
    onMutate: async ({ id, updates }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey });

      // Snapshot previous data
      const previousSubtasks = queryClient.getQueryData<Subtask[]>(queryKey);

      // Optimistically update
      queryClient.setQueryData<Subtask[]>(queryKey, (old) =>
        old
          ? old.map((s) => (s.id === id ? { ...s, ...updates } : s))
          : old
      );

      return { previousSubtasks };
    },
    onSuccess: (_, __, context) => {
      // Guard against undefined context
      if (!context) return;

      toast.success('Sous-tâche mise à jour');
    },
    onError: (_, __, context) => {
      // Rollback on error
      queryClient.setQueryData(queryKey, context?.previousSubtasks);
      toast.error('Erreur lors de la mise à jour de la sous-tâche');
    },
  });

  // Delete subtask mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return deleteSubtaskInDb(id);
    },
    onMutate: async (id) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey });

      // Snapshot previous data
      const previousSubtasks = queryClient.getQueryData<Subtask[]>(queryKey);

      // Optimistically remove
      queryClient.setQueryData<Subtask[]>(queryKey, (old) =>
        old ? old.filter((s) => s.id !== id) : old
      );

      return { previousSubtasks };
    },
    onSuccess: (_, __, context) => {
      // Guard against undefined context
      if (!context) return;

      toast.success('Sous-tâche supprimée');
    },
    onError: (_, __, context) => {
      // Rollback on error
      queryClient.setQueryData(queryKey, context?.previousSubtasks);
      toast.error('Erreur lors de la suppression de la sous-tâche');
    },
  });

  return {
    subtasks,
    isLoading,
    createSubtask: createMutation,
    updateSubtask: updateMutation,
    deleteSubtask: deleteMutation,
  };
}
