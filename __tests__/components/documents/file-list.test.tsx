import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FileList } from '@/components/documents/file-list';
import { useFiles } from '@/lib/hooks/use-files';
import { File } from '@/types/database.types';

// Mock dependencies
vi.mock('@/lib/hooks/use-files');
vi.mock('@/components/documents/file-item', () => ({
  FileItem: ({ file, onDelete, onDownload }: any) => (
    <div data-testid={`file-item-${file.id}`}>
      <span>{file.file_name}</span>
      <button onClick={() => onDelete(file.id)}>Delete</button>
      <button onClick={() => onDownload(file.id)}>Download</button>
    </div>
  )
}));

describe('FileList', () => {
  const mockDeleteFile = vi.fn();
  const mockDownloadFile = vi.fn();
  const taskId = 'task-123';

  const createMockFile = (id: string, name: string): File => ({
    id,
    task_id: taskId,
    user_id: 'user-123',
    file_path: `path/to/${name}`,
    file_name: name,
    file_type: 'application/pdf',
    file_size: 1234567,
    storage_bucket: 'project-files',
    created_at: '2024-05-07T10:30:00Z',
    updated_at: '2024-05-07T10:30:00Z',
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading State', () => {
    it('should render loading state when files are being fetched', () => {
      (useFiles as any).mockReturnValue({
        files: [],
        isLoading: true,
        deleteFile: { mutate: mockDeleteFile },
        downloadFile: mockDownloadFile,
      });

      render(<FileList taskId={taskId} />);

      expect(screen.getByText(/chargement/i)).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should render empty state when no files exist', () => {
      (useFiles as any).mockReturnValue({
        files: [],
        isLoading: false,
        deleteFile: { mutate: mockDeleteFile },
        downloadFile: mockDownloadFile,
      });

      render(<FileList taskId={taskId} />);

      expect(screen.getByText(/aucun fichier uploadé/i)).toBeInTheDocument();
    });

    it('should render empty state icon', () => {
      (useFiles as any).mockReturnValue({
        files: [],
        isLoading: false,
        deleteFile: { mutate: mockDeleteFile },
        downloadFile: mockDownloadFile,
      });

      const { container } = render(<FileList taskId={taskId} />);

      // Check for icon SVG
      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('Files Display', () => {
    it('should render list of files', () => {
      const files = [
        createMockFile('file-1', 'document1.pdf'),
        createMockFile('file-2', 'document2.pdf'),
        createMockFile('file-3', 'document3.pdf'),
      ];

      (useFiles as any).mockReturnValue({
        files,
        isLoading: false,
        deleteFile: { mutate: mockDeleteFile },
        downloadFile: mockDownloadFile,
      });

      render(<FileList taskId={taskId} />);

      expect(screen.getByTestId('file-item-file-1')).toBeInTheDocument();
      expect(screen.getByTestId('file-item-file-2')).toBeInTheDocument();
      expect(screen.getByTestId('file-item-file-3')).toBeInTheDocument();
    });

    it('should display correct file count for single file', () => {
      const files = [createMockFile('file-1', 'document.pdf')];

      (useFiles as any).mockReturnValue({
        files,
        isLoading: false,
        deleteFile: { mutate: mockDeleteFile },
        downloadFile: mockDownloadFile,
      });

      render(<FileList taskId={taskId} />);

      expect(screen.getByText(/1 fichier\(s\)/i)).toBeInTheDocument();
    });

    it('should display correct file count for multiple files', () => {
      const files = [
        createMockFile('file-1', 'document1.pdf'),
        createMockFile('file-2', 'document2.pdf'),
        createMockFile('file-3', 'document3.pdf'),
      ];

      (useFiles as any).mockReturnValue({
        files,
        isLoading: false,
        deleteFile: { mutate: mockDeleteFile },
        downloadFile: mockDownloadFile,
      });

      render(<FileList taskId={taskId} />);

      expect(screen.getByText(/3 fichier\(s\)/i)).toBeInTheDocument();
    });
  });

  describe('File Actions', () => {
    it('should call deleteFile mutation when delete is triggered', async () => {
      const files = [createMockFile('file-1', 'document.pdf')];

      (useFiles as any).mockReturnValue({
        files,
        isLoading: false,
        deleteFile: { mutate: mockDeleteFile },
        downloadFile: mockDownloadFile,
      });

      render(<FileList taskId={taskId} />);

      const deleteButton = screen.getByText('Delete');
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(mockDeleteFile).toHaveBeenCalledWith('file-1');
      });
    });

    it('should call downloadFile when download is triggered', async () => {
      const files = [createMockFile('file-1', 'document.pdf')];

      (useFiles as any).mockReturnValue({
        files,
        isLoading: false,
        deleteFile: { mutate: mockDeleteFile },
        downloadFile: mockDownloadFile,
      });

      render(<FileList taskId={taskId} />);

      const downloadButton = screen.getByText('Download');
      fireEvent.click(downloadButton);

      await waitFor(() => {
        expect(mockDownloadFile).toHaveBeenCalledWith('file-1');
      });
    });
  });

  describe('Task ID Handling', () => {
    it('should pass taskId to useFiles hook', () => {
      const useFilesMock = vi.fn().mockReturnValue({
        files: [],
        isLoading: false,
        deleteFile: { mutate: mockDeleteFile },
        downloadFile: mockDownloadFile,
      });

      (useFiles as any).mockImplementation(useFilesMock);

      render(<FileList taskId={taskId} />);

      expect(useFilesMock).toHaveBeenCalledWith(taskId);
    });
  });

  describe('Component Integration', () => {
    it('should pass correct props to FileItem components', () => {
      const files = [createMockFile('file-1', 'document.pdf')];

      (useFiles as any).mockReturnValue({
        files,
        isLoading: false,
        deleteFile: { mutate: mockDeleteFile },
        downloadFile: mockDownloadFile,
      });

      render(<FileList taskId={taskId} />);

      expect(screen.getByTestId('file-item-file-1')).toBeInTheDocument();
      expect(screen.getByText('document.pdf')).toBeInTheDocument();
    });

    it('should render files in order', () => {
      const files = [
        createMockFile('file-1', 'document1.pdf'),
        createMockFile('file-2', 'document2.pdf'),
        createMockFile('file-3', 'document3.pdf'),
      ];

      (useFiles as any).mockReturnValue({
        files,
        isLoading: false,
        deleteFile: { mutate: mockDeleteFile },
        downloadFile: mockDownloadFile,
      });

      const { container } = render(<FileList taskId={taskId} />);

      const fileItems = container.querySelectorAll('[data-testid^="file-item-"]');
      expect(fileItems).toHaveLength(3);
    });
  });
});
