import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FileUpload } from '@/components/documents/file-upload';
import { useFiles } from '@/lib/hooks/use-files';
import { toast } from 'sonner';

// Mock dependencies
vi.mock('@/lib/hooks/use-files');
vi.mock('sonner');

describe('FileUpload', () => {
  const mockUploadFile = vi.fn();
  const mockOnUploadComplete = vi.fn();
  const taskId = 'task-123';

  beforeEach(() => {
    vi.clearAllMocks();
    (useFiles as any).mockReturnValue({
      uploadFile: {
        mutateAsync: mockUploadFile,
        isPending: false,
      },
    });
  });

  describe('Rendering', () => {
    it('should render the upload zone with French text', () => {
      render(<FileUpload taskId={taskId} />);

      expect(screen.getByText(/Glissez vos fichiers ici ou cliquez pour sélectionner/i)).toBeInTheDocument();
    });

    it('should render upload icon', () => {
      render(<FileUpload taskId={taskId} />);

      const uploadZone = screen.getByRole('button');
      expect(uploadZone).toBeInTheDocument();
    });

    it('should have hidden file input', () => {
      render(<FileUpload taskId={taskId} />);

      const fileInput = document.querySelector('input[type="file"]');
      expect(fileInput).toBeInTheDocument();
      expect(fileInput).toHaveAttribute('hidden');
    });

    it('should support multiple file selection', () => {
      render(<FileUpload taskId={taskId} />);

      const fileInput = document.querySelector('input[type="file"]');
      expect(fileInput).toHaveAttribute('multiple');
    });
  });

  describe('Click to Upload', () => {
    it('should trigger file input when clicking upload zone', () => {
      render(<FileUpload taskId={taskId} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const clickSpy = vi.spyOn(fileInput, 'click');

      const uploadZone = screen.getByRole('button');
      fireEvent.click(uploadZone);

      expect(clickSpy).toHaveBeenCalled();
    });

    it('should upload valid file when selected via input', async () => {
      mockUploadFile.mockResolvedValue({});
      render(<FileUpload taskId={taskId} onUploadComplete={mockOnUploadComplete} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });

      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      });

      fireEvent.change(fileInput);

      await waitFor(() => {
        expect(mockUploadFile).toHaveBeenCalledWith({ file, taskId });
      });
    });
  });

  describe('Drag and Drop', () => {
    it('should highlight zone on drag over', () => {
      render(<FileUpload taskId={taskId} />);

      const uploadZone = screen.getByRole('button');

      fireEvent.dragEnter(uploadZone);
      fireEvent.dragOver(uploadZone);

      expect(uploadZone).toHaveClass('border-primary');
    });

    it('should remove highlight on drag leave', () => {
      render(<FileUpload taskId={taskId} />);

      const uploadZone = screen.getByRole('button');

      fireEvent.dragEnter(uploadZone);
      fireEvent.dragLeave(uploadZone);

      expect(uploadZone).not.toHaveClass('border-primary');
    });

    it('should upload valid file on drop', async () => {
      mockUploadFile.mockResolvedValue({});
      render(<FileUpload taskId={taskId} onUploadComplete={mockOnUploadComplete} />);

      const uploadZone = screen.getByRole('button');
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });

      const dropEvent = new Event('drop', { bubbles: true }) as any;
      dropEvent.dataTransfer = {
        files: [file],
      };

      fireEvent(uploadZone, dropEvent);

      await waitFor(() => {
        expect(mockUploadFile).toHaveBeenCalledWith({ file, taskId });
      });
    });

    it('should prevent default browser behavior on drag events', () => {
      render(<FileUpload taskId={taskId} />);

      const uploadZone = screen.getByRole('button');

      const dragOverEvent = new Event('dragover', { bubbles: true }) as any;
      const preventDefaultSpy = vi.spyOn(dragOverEvent, 'preventDefault');

      fireEvent(uploadZone, dragOverEvent);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });
  });

  describe('File Validation', () => {
    it('should reject files larger than 10MB', async () => {
      render(<FileUpload taskId={taskId} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.pdf', {
        type: 'application/pdf'
      });

      Object.defineProperty(fileInput, 'files', {
        value: [largeFile],
        writable: false,
      });

      fireEvent.change(fileInput);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Fichier trop volumineux (max 10 Mo)');
      });

      expect(mockUploadFile).not.toHaveBeenCalled();
    });

    it('should reject unsupported file types', async () => {
      render(<FileUpload taskId={taskId} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const invalidFile = new File(['content'], 'test.exe', { type: 'application/x-msdownload' });

      Object.defineProperty(fileInput, 'files', {
        value: [invalidFile],
        writable: false,
      });

      fireEvent.change(fileInput);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Type de fichier non supporté');
      });

      expect(mockUploadFile).not.toHaveBeenCalled();
    });

    it('should accept PDF files', async () => {
      mockUploadFile.mockResolvedValue({});
      render(<FileUpload taskId={taskId} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });

      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      });

      fireEvent.change(fileInput);

      await waitFor(() => {
        expect(mockUploadFile).toHaveBeenCalled();
      });

      expect(toast.error).not.toHaveBeenCalled();
    });

    it('should accept DOCX files', async () => {
      mockUploadFile.mockResolvedValue({});
      render(<FileUpload taskId={taskId} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['content'], 'test.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      });

      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      });

      fireEvent.change(fileInput);

      await waitFor(() => {
        expect(mockUploadFile).toHaveBeenCalled();
      });
    });

    it('should accept image files', async () => {
      mockUploadFile.mockResolvedValue({});
      render(<FileUpload taskId={taskId} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });

      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      });

      fireEvent.change(fileInput);

      await waitFor(() => {
        expect(mockUploadFile).toHaveBeenCalled();
      });
    });
  });

  describe('Multiple Files', () => {
    it('should upload multiple valid files', async () => {
      mockUploadFile.mockResolvedValue({});
      render(<FileUpload taskId={taskId} onUploadComplete={mockOnUploadComplete} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const files = [
        new File(['content1'], 'test1.pdf', { type: 'application/pdf' }),
        new File(['content2'], 'test2.pdf', { type: 'application/pdf' }),
      ];

      Object.defineProperty(fileInput, 'files', {
        value: files,
        writable: false,
      });

      fireEvent.change(fileInput);

      await waitFor(() => {
        expect(mockUploadFile).toHaveBeenCalledTimes(2);
      });
    });

    it('should skip invalid files and upload valid ones', async () => {
      mockUploadFile.mockResolvedValue({});
      render(<FileUpload taskId={taskId} onUploadComplete={mockOnUploadComplete} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const files = [
        new File(['content1'], 'test.pdf', { type: 'application/pdf' }),
        new File(['content2'], 'test.exe', { type: 'application/x-msdownload' }),
      ];

      Object.defineProperty(fileInput, 'files', {
        value: files,
        writable: false,
      });

      fireEvent.change(fileInput);

      await waitFor(() => {
        expect(mockUploadFile).toHaveBeenCalledTimes(1);
        expect(toast.error).toHaveBeenCalledWith('Type de fichier non supporté');
      });
    });
  });

  describe('Upload Progress', () => {
    it('should show uploading state', async () => {
      (useFiles as any).mockReturnValue({
        uploadFile: {
          mutateAsync: vi.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100))),
          isPending: true,
        },
      });

      render(<FileUpload taskId={taskId} />);

      expect(screen.getByText(/Envoi en cours/i)).toBeInTheDocument();
    });

    it('should disable zone during upload', async () => {
      (useFiles as any).mockReturnValue({
        uploadFile: {
          mutateAsync: vi.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100))),
          isPending: true,
        },
      });

      render(<FileUpload taskId={taskId} />);

      const uploadZone = screen.getByRole('button');
      expect(uploadZone).toHaveClass('pointer-events-none');
      expect(uploadZone).toHaveClass('opacity-50');
    });

    it('should call onUploadComplete after successful upload', async () => {
      mockUploadFile.mockResolvedValue({});
      render(<FileUpload taskId={taskId} onUploadComplete={mockOnUploadComplete} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });

      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      });

      fireEvent.change(fileInput);

      await waitFor(() => {
        expect(mockOnUploadComplete).toHaveBeenCalled();
      });
    });

    it('should not call onUploadComplete on upload error', async () => {
      mockUploadFile.mockRejectedValue(new Error('Upload failed'));
      render(<FileUpload taskId={taskId} onUploadComplete={mockOnUploadComplete} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });

      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      });

      fireEvent.change(fileInput);

      await waitFor(() => {
        expect(mockUploadFile).toHaveBeenCalled();
      });

      expect(mockOnUploadComplete).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<FileUpload taskId={taskId} />);

      const uploadZone = screen.getByRole('button');
      expect(uploadZone).toHaveAttribute('aria-label');
    });

    it('should be keyboard accessible', () => {
      render(<FileUpload taskId={taskId} />);

      const uploadZone = screen.getByRole('button');
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const clickSpy = vi.spyOn(fileInput, 'click');

      fireEvent.keyDown(uploadZone, { key: 'Enter' });

      expect(clickSpy).toHaveBeenCalled();
    });
  });
});
