'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { createClient } from '../supabase/client';
import { Link, LinkInsert, LinkUpdate } from '@/types/database.types';

function getLinksQueryKey(taskId: string) {
  return ['links', taskId];
}

async function fetchLinks(taskId: string): Promise<Link[]> {
  const supabase = createClient();
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData?.session?.user?.id;

  if (!userId) {
    throw new Error('Non authentifié');
  }

  const { data, error } = await supabase
    .from('links')
    .select('*')
    .eq('task_id', taskId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

async function createLinkInDb(
  taskId: string,
  title: string,
  url: string,
  description: string | null | undefined
): Promise<Link> {
  const supabase = createClient();
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData?.session?.user?.id;

  if (!userId) {
    throw new Error('Non authentifié');
  }

  // Create database record
  const linkRecord: LinkInsert = {
    task_id: taskId,
    user_id: userId,
    title,
    url,
    description: description || null,
  };

  const { data, error } = await supabase
    .from('links')
    .insert([linkRecord])
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function updateLinkInDb(
  linkId: string,
  title?: string,
  url?: string,
  description?: string | null
): Promise<Link> {
  const supabase = createClient();

  // Add authentication check
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData?.session?.user?.id;
  if (!userId) throw new Error('Non authentifié');

  // Fetch link to check ownership
  const { data: linkData, error: fetchError } = await supabase
    .from('links')
    .select('*')
    .eq('id', linkId)
    .single();

  if (fetchError) throw fetchError;
  if (!linkData) throw new Error('Lien introuvable');

  // Add authorization check
  if (linkData.user_id !== userId) throw new Error('Non autorisé');

  // Update the link
  const updateData: LinkUpdate = {};
  if (title !== undefined) updateData.title = title;
  if (url !== undefined) updateData.url = url;
  if (description !== undefined) updateData.description = description;

  const { data, error } = await supabase
    .from('links')
    .update(updateData)
    .eq('id', linkId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function deleteLinkFromDb(linkId: string): Promise<void> {
  const supabase = createClient();

  // Add authentication check
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData?.session?.user?.id;
  if (!userId) throw new Error('Non authentifié');

  // Fetch link to check ownership
  const { data: linkData, error: fetchError } = await supabase
    .from('links')
    .select('*')
    .eq('id', linkId)
    .single();

  if (fetchError) throw fetchError;
  if (!linkData) throw new Error('Lien introuvable');

  // Add authorization check
  if (linkData.user_id !== userId) throw new Error('Non autorisé');

  // Delete from database
  const { error: dbError } = await supabase
    .from('links')
    .delete()
    .eq('id', linkId);

  if (dbError) throw dbError;
}

export function useLinks(taskId: string) {
  const queryClient = useQueryClient();
  const queryKey = getLinksQueryKey(taskId);

  // Fetch links
  const { data: links = [], isLoading } = useQuery({
    queryKey,
    queryFn: () => fetchLinks(taskId),
    enabled: !!taskId && taskId.trim().length > 0,
  });

  // Create link mutation
  const createLink = useMutation({
    mutationFn: async ({
      taskId: tid,
      title,
      url,
      description,
    }: {
      taskId: string;
      title: string;
      url: string;
      description?: string | null;
    }) => {
      return createLinkInDb(tid, title, url, description);
    },
    onMutate: async ({ title, url, description, taskId: tid }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey });

      // Snapshot previous data
      const previousLinks = queryClient.getQueryData<Link[]>(queryKey);

      // Create temp link record with temporary ID
      const tempLink: Link = {
        id: `temp-${Date.now()}`,
        task_id: tid,
        user_id: 'temp-user',
        title,
        url,
        description: description || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Optimistically update
      queryClient.setQueryData<Link[]>(queryKey, (old) => [
        tempLink,
        ...(old || []),
      ]);

      return { previousLinks, tempLink };
    },
    onSuccess: (data, _, context) => {
      // Guard against undefined context
      if (!context) return;

      // Replace temp link with real one
      queryClient.setQueryData<Link[]>(queryKey, (old) =>
        old
          ? old.map((l) =>
              l.id === context.tempLink.id ? data : l
            )
          : [data]
      );
      toast.success('Lien ajouté');
    },
    onError: (error, _, context) => {
      // Rollback on error
      queryClient.setQueryData(queryKey, context?.previousLinks);

      const errorMessage = error instanceof Error ? error.message : "Erreur lors de l'ajout du lien";
      toast.error(errorMessage);
    },
  });

  // Update link mutation
  const updateLink = useMutation({
    mutationFn: async ({
      linkId,
      title,
      url,
      description,
    }: {
      linkId: string;
      title?: string;
      url?: string;
      description?: string | null;
    }) => {
      return updateLinkInDb(linkId, title, url, description);
    },
    onMutate: async ({ linkId, title, url, description }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey });

      // Snapshot previous data
      const previousLinks = queryClient.getQueryData<Link[]>(queryKey);

      // Optimistically update
      queryClient.setQueryData<Link[]>(queryKey, (old) =>
        old
          ? old.map((l) =>
              l.id === linkId
                ? {
                    ...l,
                    ...(title !== undefined && { title }),
                    ...(url !== undefined && { url }),
                    ...(description !== undefined && { description }),
                    updated_at: new Date().toISOString(),
                  }
                : l
            )
          : old
      );

      return { previousLinks };
    },
    onSuccess: (data, _, context) => {
      // Guard against undefined context
      if (!context) return;

      // Update with real data from server
      queryClient.setQueryData<Link[]>(queryKey, (old) =>
        old ? old.map((l) => (l.id === data.id ? data : l)) : [data]
      );
      toast.success('Lien modifié');
    },
    onError: (error, _, context) => {
      // Rollback on error
      queryClient.setQueryData(queryKey, context?.previousLinks);
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la modification';
      toast.error(errorMessage);
    },
  });

  // Delete link mutation
  const deleteLink = useMutation({
    mutationFn: async (linkId: string) => {
      return deleteLinkFromDb(linkId);
    },
    onMutate: async (linkId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey });

      // Snapshot previous data
      const previousLinks = queryClient.getQueryData<Link[]>(queryKey);

      // Optimistically remove
      queryClient.setQueryData<Link[]>(queryKey, (old) =>
        old ? old.filter((l) => l.id !== linkId) : old
      );

      return { previousLinks };
    },
    onSuccess: (_, __, context) => {
      // Guard against undefined context
      if (!context) return;

      toast.success('Lien supprimé');
    },
    onError: (error, _, context) => {
      // Rollback on error
      queryClient.setQueryData(queryKey, context?.previousLinks);
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la suppression';
      toast.error(errorMessage);
    },
  });

  return {
    links,
    isLoading,
    createLink,
    updateLink,
    deleteLink,
  };
}
