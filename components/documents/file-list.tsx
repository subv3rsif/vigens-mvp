'use client';

import { FileX } from 'lucide-react';
import { useFiles } from '@/lib/hooks/use-files';
import { FileItem } from './file-item';

interface FileListProps {
  taskId: string;
}

export function FileList({ taskId }: FileListProps) {
  const { files, isLoading, deleteFile, downloadFile } = useFiles(taskId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-sm text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  if (!files.length) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <FileX className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-sm text-muted-foreground">Aucun fichier uploadé</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {files.length} fichier(s)
      </p>

      <div className="space-y-2">
        {files.map((file) => (
          <FileItem
            key={file.id}
            file={file}
            onDelete={() => deleteFile.mutate(file.id)}
            onDownload={() => downloadFile(file.id)}
          />
        ))}
      </div>
    </div>
  );
}
