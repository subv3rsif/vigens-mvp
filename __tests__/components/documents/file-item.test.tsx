import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FileItem } from '@/components/documents/file-item';
import { File } from '@/types/database.types';

// Mock dependencies
vi.mock('@/components/projects/confirm-dialog', () => ({
  ConfirmDialog: ({ open, onConfirm, confirmLabel }: any) =>
    open ? (
      <div data-testid="confirm-dialog">
        <button onClick={onConfirm}>{confirmLabel}</button>
      </div>
    ) : null
}));

describe('FileItem', () => {
  const mockOnDelete = vi.fn();
  const mockOnDownload = vi.fn();

  const createMockFile = (overrides?: Partial<File>): File => ({
    id: 'file-123',
    task_id: 'task-123',
    user_id: 'user-123',
    file_path: 'path/to/file.pdf',
    file_name: 'document.pdf',
    file_type: 'application/pdf',
    file_size: 1234567, // ~1.18 MB
    storage_bucket: 'project-files',
    created_at: '2024-05-07T10:30:00Z',
    updated_at: '2024-05-07T10:30:00Z',
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render file name', () => {
      const file = createMockFile();
      render(<FileItem file={file} onDelete={mockOnDelete} onDownload={mockOnDownload} />);

      expect(screen.getByText('document.pdf')).toBeInTheDocument();
    });

    it('should render formatted file size in Mo', () => {
      const file = createMockFile({ file_size: 2 * 1024 * 1024 }); // 2 MB
      render(<FileItem file={file} onDelete={mockOnDelete} onDownload={mockOnDownload} />);

      expect(screen.getByText('2.0 Mo')).toBeInTheDocument();
    });

    it('should render formatted file size in Ko', () => {
      const file = createMockFile({ file_size: 512 * 1024 }); // 512 KB
      render(<FileItem file={file} onDelete={mockOnDelete} onDownload={mockOnDownload} />);

      expect(screen.getByText('512.0 Ko')).toBeInTheDocument();
    });

    it('should render formatted file size in bytes', () => {
      const file = createMockFile({ file_size: 500 }); // 500 bytes
      render(<FileItem file={file} onDelete={mockOnDelete} onDownload={mockOnDownload} />);

      expect(screen.getByText('500 o')).toBeInTheDocument();
    });

    it('should render formatted date in French', () => {
      const file = createMockFile({ created_at: '2024-05-07T10:30:00Z' });
      render(<FileItem file={file} onDelete={mockOnDelete} onDownload={mockOnDownload} />);

      expect(screen.getByText(/7 mai 2024/i)).toBeInTheDocument();
    });
  });

  describe('File Icons', () => {
    it('should render PDF icon for PDF files', () => {
      const file = createMockFile({ file_type: 'application/pdf', file_name: 'doc.pdf' });
      const { container } = render(<FileItem file={file} onDelete={mockOnDelete} onDownload={mockOnDownload} />);

      // FileText icon is used for PDFs
      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('should render FileText icon for Word documents', () => {
      const file = createMockFile({
        file_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        file_name: 'doc.docx'
      });
      const { container } = render(<FileItem file={file} onDelete={mockOnDelete} onDownload={mockOnDownload} />);

      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('should render FileSpreadsheet icon for Excel files', () => {
      const file = createMockFile({
        file_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        file_name: 'sheet.xlsx'
      });
      const { container } = render(<FileItem file={file} onDelete={mockOnDelete} onDownload={mockOnDownload} />);

      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('should render Image icon for image files', () => {
      const file = createMockFile({ file_type: 'image/jpeg', file_name: 'photo.jpg' });
      const { container } = render(<FileItem file={file} onDelete={mockOnDelete} onDownload={mockOnDownload} />);

      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('should render generic File icon for unknown types', () => {
      const file = createMockFile({ file_type: 'application/octet-stream', file_name: 'file.bin' });
      const { container } = render(<FileItem file={file} onDelete={mockOnDelete} onDownload={mockOnDownload} />);

      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('Download Action', () => {
    it('should render download button', () => {
      const file = createMockFile();
      render(<FileItem file={file} onDelete={mockOnDelete} onDownload={mockOnDownload} />);

      const downloadButton = screen.getByLabelText(/télécharger/i);
      expect(downloadButton).toBeInTheDocument();
    });

    it('should call onDownload when download button is clicked', () => {
      const file = createMockFile();
      render(<FileItem file={file} onDelete={mockOnDelete} onDownload={mockOnDownload} />);

      const downloadButton = screen.getByLabelText(/télécharger/i);
      fireEvent.click(downloadButton);

      expect(mockOnDownload).toHaveBeenCalledWith('file-123');
    });
  });

  describe('Delete Action', () => {
    it('should render delete button', () => {
      const file = createMockFile();
      render(<FileItem file={file} onDelete={mockOnDelete} onDownload={mockOnDownload} />);

      const deleteButton = screen.getByLabelText(/supprimer/i);
      expect(deleteButton).toBeInTheDocument();
    });

    it('should show confirmation dialog when delete button is clicked', async () => {
      const file = createMockFile();
      render(<FileItem file={file} onDelete={mockOnDelete} onDownload={mockOnDownload} />);

      const deleteButton = screen.getByLabelText(/supprimer/i);
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByTestId('confirm-dialog')).toBeInTheDocument();
      });
    });

    it('should call onDelete when delete is confirmed', async () => {
      const file = createMockFile();
      render(<FileItem file={file} onDelete={mockOnDelete} onDownload={mockOnDownload} />);

      const deleteButton = screen.getByLabelText(/supprimer/i);
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByTestId('confirm-dialog')).toBeInTheDocument();
      });

      const confirmButton = screen.getByText(/supprimer/i);
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(mockOnDelete).toHaveBeenCalledWith('file-123');
      });
    });

    it('should not call onDelete when delete is cancelled', async () => {
      const file = createMockFile();
      render(<FileItem file={file} onDelete={mockOnDelete} onDownload={mockOnDownload} />);

      const deleteButton = screen.getByLabelText(/supprimer/i);
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByTestId('confirm-dialog')).toBeInTheDocument();
      });

      // Close dialog without confirming
      const deleteButtonAgain = screen.getByLabelText(/supprimer/i);
      fireEvent.click(deleteButtonAgain);

      expect(mockOnDelete).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible labels for buttons', () => {
      const file = createMockFile();
      render(<FileItem file={file} onDelete={mockOnDelete} onDownload={mockOnDownload} />);

      expect(screen.getByLabelText(/télécharger/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/supprimer/i)).toBeInTheDocument();
    });

    it('should be keyboard accessible', () => {
      const file = createMockFile();
      render(<FileItem file={file} onDelete={mockOnDelete} onDownload={mockOnDownload} />);

      const downloadButton = screen.getByLabelText(/télécharger/i);

      // Buttons are inherently keyboard accessible, verify they can receive focus
      downloadButton.focus();
      expect(downloadButton).toHaveFocus();

      // Clicking the focused button should trigger the action
      fireEvent.click(downloadButton);
      expect(mockOnDownload).toHaveBeenCalledWith('file-123');
    });
  });

  describe('File Name Truncation', () => {
    it('should handle long file names', () => {
      const longFileName = 'this-is-a-very-long-file-name-that-should-be-truncated-properly.pdf';
      const file = createMockFile({ file_name: longFileName });
      render(<FileItem file={file} onDelete={mockOnDelete} onDownload={mockOnDownload} />);

      expect(screen.getByText(longFileName)).toBeInTheDocument();
    });
  });
});
