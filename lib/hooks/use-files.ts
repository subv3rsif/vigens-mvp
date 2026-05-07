'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { createClient } from '../supabase/client';
import { File, FileInsert } from '@/types/database.types';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes
const STORAGE_BUCKET = 'project-files';

function getFilesQueryKey(taskId: string) {
  return ['files', taskId];
}

async function fetchFiles(taskId: string): Promise<File[]> {
  const supabase = createClient();
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData?.session?.user?.id;

  if (!userId) {
    throw new Error('Not authenticated');
  }

  const { data, error } = await supabase
    .from('files')
    .select('*')
    .eq('task_id', taskId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

async function uploadFileToStorage(
  file: globalThis.File,
  taskId: string
): Promise<File> {
  const supabase = createClient();
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData?.session?.user?.id;

  if (!userId) {
    throw new Error('Not authenticated');
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('Le fichier est trop volumineux (maximum 10 Mo)');
  }

  // Generate unique file path
  const fileId = crypto.randomUUID();
  const filePath = `${taskId}/${fileId}-${file.name}`;

  // Upload to storage
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  // Create database record
  const fileRecord: FileInsert = {
    task_id: taskId,
    user_id: userId,
    file_path: uploadData.path,
    file_name: file.name,
    file_type: file.type,
    file_size: file.size,
    storage_bucket: STORAGE_BUCKET,
  };

  const { data, error } = await supabase
    .from('files')
    .insert([fileRecord])
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function deleteFileFromStorage(fileId: string): Promise<void> {
  const supabase = createClient();

  // Get file metadata to know the storage path
  const { data: fileData, error: fetchError } = await supabase
    .from('files')
    .select('*')
    .eq('id', fileId)
    .single();

  if (fetchError) throw fetchError;

  // Delete from storage
  const { error: storageError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .remove([fileData.file_path]);

  if (storageError) throw storageError;

  // Delete from database
  const { error: dbError } = await supabase
    .from('files')
    .delete()
    .eq('id', fileId);

  if (dbError) throw dbError;
}

async function downloadFileFromStorage(fileId: string): Promise<void> {
  const supabase = createClient();

  // Get file metadata
  const { data: fileData, error: fetchError } = await supabase
    .from('files')
    .select('*')
    .eq('id', fileId)
    .single();

  if (fetchError) throw fetchError;

  // Get signed URL
  const { data: urlData, error: urlError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(fileData.file_path, 60); // 60 seconds expiry

  if (urlError) throw urlError;

  // Create anchor element for download
  const link = document.createElement('a');
  link.href = urlData.signedUrl;
  link.download = fileData.file_name; // This triggers download instead of navigation
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function useFiles(taskId: string) {
  const queryClient = useQueryClient();
  const queryKey = getFilesQueryKey(taskId);

  // Fetch files
  const { data: files = [], isLoading } = useQuery({
    queryKey,
    queryFn: () => fetchFiles(taskId),
    enabled: !!taskId,
  });

  // Upload file mutation
  const uploadFile = useMutation({
    mutationFn: async ({
      file,
      taskId: tid,
    }: {
      file: globalThis.File;
      taskId: string;
    }) => {
      return uploadFileToStorage(file, tid);
    },
    onMutate: async ({ file, taskId: tid }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey });

      // Snapshot previous data
      const previousFiles = queryClient.getQueryData<File[]>(queryKey);

      // Create temp file record with temporary ID
      const tempFile: File = {
        id: `temp-${Date.now()}`,
        task_id: tid,
        user_id: 'temp-user',
        file_path: 'temp-path',
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        storage_bucket: STORAGE_BUCKET,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Optimistically update
      queryClient.setQueryData<File[]>(queryKey, (old) => [
        tempFile,
        ...(old || []),
      ]);

      return { previousFiles, tempFile };
    },
    onSuccess: (data, _, context) => {
      // Guard against undefined context
      if (!context) return;

      // Replace temp file with real one
      queryClient.setQueryData<File[]>(queryKey, (old) =>
        old
          ? old.map((f) =>
              f.id === context.tempFile.id ? data : f
            )
          : [data]
      );
      toast.success('Fichier ajouté');
    },
    onError: (error, _, context) => {
      // Rollback on error
      queryClient.setQueryData(queryKey, context?.previousFiles);

      const errorMessage = error instanceof Error ? error.message : "Erreur lors de l'ajout du fichier";
      toast.error(errorMessage);
    },
  });

  // Delete file mutation
  const deleteFile = useMutation({
    mutationFn: async (fileId: string) => {
      return deleteFileFromStorage(fileId);
    },
    onMutate: async (fileId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey });

      // Snapshot previous data
      const previousFiles = queryClient.getQueryData<File[]>(queryKey);

      // Optimistically remove
      queryClient.setQueryData<File[]>(queryKey, (old) =>
        old ? old.filter((f) => f.id !== fileId) : old
      );

      return { previousFiles };
    },
    onSuccess: (_, __, context) => {
      // Guard against undefined context
      if (!context) return;

      toast.success('Fichier supprimé');
    },
    onError: (_, __, context) => {
      // Rollback on error
      queryClient.setQueryData(queryKey, context?.previousFiles);
      toast.error('Erreur lors de la suppression du fichier');
    },
  });

  // Download file function
  const downloadFile = async (fileId: string) => {
    try {
      await downloadFileFromStorage(fileId);
      toast.success('Téléchargement démarré');
    } catch (error) {
      toast.error('Erreur lors du téléchargement du fichier');
      throw error;
    }
  };

  return {
    files,
    isLoading,
    uploadFile,
    deleteFile,
    downloadFile,
  };
}
