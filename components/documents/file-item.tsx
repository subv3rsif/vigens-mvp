'use client';

import { useState } from 'react';
import {
  File as FileIcon,
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  Download,
  Trash2,
} from 'lucide-react';
import { File } from '@/types/database.types';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/projects/confirm-dialog';
import { cn } from '@/lib/utils';

interface FileItemProps {
  file: File;
  onDelete: (fileId: string) => void;
  onDownload: (fileId: string) => void;
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return '0 o';
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function getFileIcon(mimeType: string | null) {
  if (!mimeType) return FileIcon;
  if (mimeType.includes('pdf')) return FileText;
  if (mimeType.includes('word') || mimeType.includes('document')) return FileText;
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet'))
    return FileSpreadsheet;
  if (mimeType.includes('image')) return ImageIcon;
  return FileIcon;
}

export function FileItem({ file, onDelete, onDownload }: FileItemProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const Icon = getFileIcon(file.file_type);

  const handleDelete = () => {
    onDelete(file.id);
    setShowDeleteDialog(false);
  };

  return (
    <>
      <div className="flex items-center gap-4 rounded-lg border p-4 hover:bg-muted/50 transition-colors">
        <div className="flex-shrink-0">
          <Icon className="h-8 w-8 text-muted-foreground" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{file.file_name}</p>
          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
            <span>{formatFileSize(file.file_size)}</span>
            <span>•</span>
            <span>{formatDate(file.created_at)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDownload(file.id)}
            aria-label="Télécharger le fichier"
          >
            <Download className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowDeleteDialog(true)}
            aria-label="Supprimer le fichier"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Supprimer le fichier"
        description={`Êtes-vous sûr de vouloir supprimer "${file.file_name}" ? Cette action est irréversible.`}
        confirmLabel="Supprimer"
        onConfirm={handleDelete}
        variant="destructive"
      />
    </>
  );
}
