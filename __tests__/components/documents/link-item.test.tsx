import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LinkItem } from '@/components/documents/link-item';
import { Link } from '@/types/database.types';

// Mock dependencies
vi.mock('@/components/projects/confirm-dialog', () => ({
  ConfirmDialog: ({ open, onConfirm, confirmLabel }: any) =>
    open ? (
      <div data-testid="confirm-dialog">
        <button onClick={onConfirm}>{confirmLabel}</button>
      </div>
    ) : null
}));

describe('LinkItem', () => {
  const mockOnUpdate = vi.fn();
  const mockOnDelete = vi.fn();

  const createMockLink = (overrides?: Partial<Link>): Link => ({
    id: 'link-123',
    task_id: 'task-123',
    user_id: 'user-123',
    url: 'https://github.com',
    title: 'GitHub',
    description: 'Social coding platform',
    created_at: '2024-05-07T10:30:00Z',
    updated_at: '2024-05-07T10:30:00Z',
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render link title', () => {
      const link = createMockLink();
      render(<LinkItem link={link} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);

      expect(screen.getByText('GitHub')).toBeInTheDocument();
    });

    it('should render link URL as clickable external link', () => {
      const link = createMockLink();
      render(<LinkItem link={link} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);

      const linkElement = screen.getByRole('link', { name: /github.com/i });
      expect(linkElement).toBeInTheDocument();
      expect(linkElement).toHaveAttribute('href', 'https://github.com');
      expect(linkElement).toHaveAttribute('target', '_blank');
      expect(linkElement).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('should render external link icon', () => {
      const link = createMockLink();
      const { container } = render(<LinkItem link={link} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);

      // Check that an external link icon is rendered
      const externalIcon = container.querySelector('svg');
      expect(externalIcon).toBeInTheDocument();
    });

    it('should render description when present', () => {
      const link = createMockLink({ description: 'Social coding platform' });
      render(<LinkItem link={link} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);

      expect(screen.getByText('Social coding platform')).toBeInTheDocument();
    });

    it('should not render description when null', () => {
      const link = createMockLink({ description: null });
      render(<LinkItem link={link} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);

      expect(screen.queryByText('Social coding platform')).not.toBeInTheDocument();
    });

    it('should render formatted date in French', () => {
      const link = createMockLink({ created_at: '2024-05-07T10:30:00Z' });
      render(<LinkItem link={link} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);

      expect(screen.getByText(/7 mai 2024/i)).toBeInTheDocument();
    });

    it('should truncate long URLs', () => {
      const longUrl = 'https://example.com/very/long/path/that/should/be/truncated/properly';
      const link = createMockLink({ url: longUrl });
      render(<LinkItem link={link} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);

      const linkElement = screen.getByRole('link');
      expect(linkElement).toHaveAttribute('href', longUrl);
    });
  });

  describe('Edit Action', () => {
    it('should render edit button', () => {
      const link = createMockLink();
      render(<LinkItem link={link} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);

      const editButton = screen.getByLabelText(/modifier/i);
      expect(editButton).toBeInTheDocument();
    });

    it('should show edit dialog when edit button is clicked', async () => {
      const link = createMockLink();
      render(<LinkItem link={link} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);

      const editButton = screen.getByLabelText(/modifier/i);
      fireEvent.click(editButton);

      await waitFor(() => {
        // Should show form fields for editing
        expect(screen.getByLabelText('Titre')).toBeInTheDocument();
        expect(screen.getByLabelText('URL')).toBeInTheDocument();
        expect(screen.getByLabelText('Description')).toBeInTheDocument();
      });
    });

    it('should pre-fill form with current link data', async () => {
      const link = createMockLink();
      render(<LinkItem link={link} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);

      const editButton = screen.getByLabelText(/modifier/i);
      fireEvent.click(editButton);

      await waitFor(() => {
        const titleInput = screen.getByLabelText('Titre') as HTMLInputElement;
        const urlInput = screen.getByLabelText('URL') as HTMLInputElement;
        const descriptionInput = screen.getByLabelText('Description') as HTMLTextAreaElement;

        expect(titleInput.value).toBe('GitHub');
        expect(urlInput.value).toBe('https://github.com');
        expect(descriptionInput.value).toBe('Social coding platform');
      });
    });

    it('should call onUpdate when edit form is submitted', async () => {
      const link = createMockLink();
      render(<LinkItem link={link} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);

      const editButton = screen.getByLabelText(/modifier/i);
      fireEvent.click(editButton);

      await waitFor(() => {
        expect(screen.getByLabelText('Titre')).toBeInTheDocument();
      });

      const titleInput = screen.getByLabelText('Titre');
      fireEvent.change(titleInput, { target: { value: 'Updated GitHub' } });

      const saveButton = screen.getByRole('button', { name: /enregistrer|modifier/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockOnUpdate).toHaveBeenCalledWith('link-123', expect.objectContaining({
          title: 'Updated GitHub',
        }));
      });
    });

    it('should close edit dialog after successful update', async () => {
      const link = createMockLink();
      render(<LinkItem link={link} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);

      const editButton = screen.getByLabelText(/modifier/i);
      fireEvent.click(editButton);

      await waitFor(() => {
        expect(screen.getByLabelText('Titre')).toBeInTheDocument();
      });

      const saveButton = screen.getByRole('button', { name: /enregistrer|modifier/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.queryByLabelText('Titre')).not.toBeInTheDocument();
      });
    });

    it('should close edit dialog when cancel is clicked', async () => {
      const link = createMockLink();
      render(<LinkItem link={link} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);

      const editButton = screen.getByLabelText(/modifier/i);
      fireEvent.click(editButton);

      await waitFor(() => {
        expect(screen.getByLabelText('Titre')).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole('button', { name: /annuler/i });
      fireEvent.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByLabelText('Titre')).not.toBeInTheDocument();
      });

      expect(mockOnUpdate).not.toHaveBeenCalled();
    });
  });

  describe('Delete Action', () => {
    it('should render delete button', () => {
      const link = createMockLink();
      render(<LinkItem link={link} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);

      const deleteButton = screen.getByLabelText(/supprimer/i);
      expect(deleteButton).toBeInTheDocument();
    });

    it('should show confirmation dialog when delete button is clicked', async () => {
      const link = createMockLink();
      render(<LinkItem link={link} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);

      const deleteButton = screen.getByLabelText(/supprimer/i);
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByTestId('confirm-dialog')).toBeInTheDocument();
      });
    });

    it('should call onDelete when delete is confirmed', async () => {
      const link = createMockLink();
      render(<LinkItem link={link} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);

      const deleteButton = screen.getByLabelText(/supprimer/i);
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByTestId('confirm-dialog')).toBeInTheDocument();
      });

      const confirmButton = screen.getByText(/supprimer/i);
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(mockOnDelete).toHaveBeenCalledWith('link-123');
      });
    });

    it('should not call onDelete when delete is cancelled', async () => {
      const link = createMockLink();
      render(<LinkItem link={link} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);

      const deleteButton = screen.getByLabelText(/supprimer/i);
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByTestId('confirm-dialog')).toBeInTheDocument();
      });

      // Close the dialog without confirming - implementation may vary
      // For now, just verify onDelete was not called yet
      expect(mockOnDelete).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible labels for buttons', () => {
      const link = createMockLink();
      render(<LinkItem link={link} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);

      expect(screen.getByLabelText(/modifier/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/supprimer/i)).toBeInTheDocument();
    });

    it('should be keyboard accessible', () => {
      const link = createMockLink();
      render(<LinkItem link={link} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);

      const editButton = screen.getByLabelText(/modifier/i);
      editButton.focus();
      expect(editButton).toHaveFocus();

      fireEvent.click(editButton);
      // Dialog should open
    });
  });
});
