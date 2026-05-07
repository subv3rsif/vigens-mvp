import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LinkForm } from '@/components/documents/link-form';
import { useLinks } from '@/lib/hooks/use-links';

// Mock the useLinks hook
vi.mock('@/lib/hooks/use-links');

describe('LinkForm', () => {
  const mockCreateLink = {
    mutate: vi.fn(),
    isPending: false,
  };

  const defaultProps = {
    taskId: 'task-123',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useLinks).mockReturnValue({
      links: [],
      isLoading: false,
      createLink: mockCreateLink,
      updateLink: { mutate: vi.fn(), isPending: false },
      deleteLink: { mutate: vi.fn(), isPending: false },
    } as any);
  });

  describe('Rendering', () => {
    it('renders all form fields with French labels', () => {
      render(<LinkForm {...defaultProps} />);

      expect(screen.getByLabelText('Titre')).toBeInTheDocument();
      expect(screen.getByLabelText('URL')).toBeInTheDocument();
      expect(screen.getByLabelText('Description')).toBeInTheDocument();
    });

    it('renders submit button', () => {
      render(<LinkForm {...defaultProps} />);

      expect(screen.getByRole('button', { name: /ajouter/i })).toBeInTheDocument();
    });

    it('renders cancel button when onCancel is provided', () => {
      const onCancel = vi.fn();
      render(<LinkForm {...defaultProps} onCancel={onCancel} />);

      expect(screen.getByRole('button', { name: /annuler/i })).toBeInTheDocument();
    });

    it('does not render cancel button when onCancel is not provided', () => {
      render(<LinkForm {...defaultProps} />);

      expect(screen.queryByRole('button', { name: /annuler/i })).not.toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('shows error when title is empty', async () => {
      const user = userEvent.setup();
      render(<LinkForm {...defaultProps} />);

      const submitButton = screen.getByRole('button', { name: /ajouter/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Le titre est requis')).toBeInTheDocument();
      });
      expect(mockCreateLink.mutate).not.toHaveBeenCalled();
    });

    it('shows error when URL is empty', async () => {
      const user = userEvent.setup();
      render(<LinkForm {...defaultProps} />);

      const titleInput = screen.getByLabelText('Titre');
      await user.type(titleInput, 'Test Link');

      const submitButton = screen.getByRole('button', { name: /ajouter/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("L'URL est requise")).toBeInTheDocument();
      });
      expect(mockCreateLink.mutate).not.toHaveBeenCalled();
    });

    it('shows error when URL format is invalid', async () => {
      const user = userEvent.setup();
      render(<LinkForm {...defaultProps} />);

      const titleInput = screen.getByLabelText('Titre');
      const urlInput = screen.getByLabelText('URL');

      await user.type(titleInput, 'Test Link');
      await user.type(urlInput, 'not-a-valid-url');

      const submitButton = screen.getByRole('button', { name: /ajouter/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/URL doit être valide/i)).toBeInTheDocument();
      });
      expect(mockCreateLink.mutate).not.toHaveBeenCalled();
    });

    it('shows error when title exceeds 200 characters', async () => {
      const user = userEvent.setup();
      render(<LinkForm {...defaultProps} />);

      const titleInput = screen.getByLabelText('Titre');
      const longTitle = 'a'.repeat(201);
      await user.type(titleInput, longTitle);

      const submitButton = screen.getByRole('button', { name: /ajouter/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Le titre ne peut pas dépasser 200 caractères')).toBeInTheDocument();
      });
      expect(mockCreateLink.mutate).not.toHaveBeenCalled();
    });

    it('shows error when description exceeds 500 characters', async () => {
      const user = userEvent.setup();
      render(<LinkForm {...defaultProps} />);

      const titleInput = screen.getByLabelText('Titre');
      const urlInput = screen.getByLabelText('URL');
      const descriptionInput = screen.getByLabelText('Description');

      await user.type(titleInput, 'Test Link');
      await user.type(urlInput, 'https://example.com');
      const longDescription = 'a'.repeat(501);
      await user.type(descriptionInput, longDescription);

      const submitButton = screen.getByRole('button', { name: /ajouter/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('La description ne peut pas dépasser 500 caractères')).toBeInTheDocument();
      });
      expect(mockCreateLink.mutate).not.toHaveBeenCalled();
    });
  });

  describe('Form Submission', () => {
    it('submits valid link with title and URL', async () => {
      const user = userEvent.setup();
      render(<LinkForm {...defaultProps} />);

      const titleInput = screen.getByLabelText('Titre');
      const urlInput = screen.getByLabelText('URL');

      await user.type(titleInput, 'GitHub');
      await user.type(urlInput, 'https://github.com');

      const submitButton = screen.getByRole('button', { name: /ajouter/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockCreateLink.mutate).toHaveBeenCalledWith(
          {
            title: 'GitHub',
            url: 'https://github.com',
            description: '',
            taskId: 'task-123',
          },
          expect.any(Object)
        );
      });
    });

    it('submits valid link with all fields', async () => {
      const user = userEvent.setup();
      render(<LinkForm {...defaultProps} />);

      const titleInput = screen.getByLabelText('Titre');
      const urlInput = screen.getByLabelText('URL');
      const descriptionInput = screen.getByLabelText('Description');

      await user.type(titleInput, 'GitHub');
      await user.type(urlInput, 'https://github.com');
      await user.type(descriptionInput, 'Social coding platform');

      const submitButton = screen.getByRole('button', { name: /ajouter/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockCreateLink.mutate).toHaveBeenCalledWith(
          {
            title: 'GitHub',
            url: 'https://github.com',
            description: 'Social coding platform',
            taskId: 'task-123',
          },
          expect.any(Object)
        );
      });
    });

    it('resets form after successful submission', async () => {
      const user = userEvent.setup();
      mockCreateLink.mutate.mockImplementation((data, options) => {
        options.onSuccess?.();
      });

      render(<LinkForm {...defaultProps} />);

      const titleInput = screen.getByLabelText('Titre') as HTMLInputElement;
      const urlInput = screen.getByLabelText('URL') as HTMLInputElement;
      const descriptionInput = screen.getByLabelText('Description') as HTMLTextAreaElement;

      await user.type(titleInput, 'GitHub');
      await user.type(urlInput, 'https://github.com');
      await user.type(descriptionInput, 'Social coding platform');

      const submitButton = screen.getByRole('button', { name: /ajouter/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(titleInput.value).toBe('');
        expect(urlInput.value).toBe('');
        expect(descriptionInput.value).toBe('');
      });
    });

    it('calls onSuccess callback after successful submission', async () => {
      const user = userEvent.setup();
      const onSuccess = vi.fn();
      mockCreateLink.mutate.mockImplementation((data, options) => {
        options.onSuccess?.();
      });

      render(<LinkForm {...defaultProps} onSuccess={onSuccess} />);

      const titleInput = screen.getByLabelText('Titre');
      const urlInput = screen.getByLabelText('URL');

      await user.type(titleInput, 'GitHub');
      await user.type(urlInput, 'https://github.com');

      const submitButton = screen.getByRole('button', { name: /ajouter/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Cancel Button', () => {
    it('calls onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup();
      const onCancel = vi.fn();
      render(<LinkForm {...defaultProps} onCancel={onCancel} />);

      const cancelButton = screen.getByRole('button', { name: /annuler/i });
      await user.click(cancelButton);

      expect(onCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe('Loading State', () => {
    it('disables form during submission', () => {
      vi.mocked(useLinks).mockReturnValue({
        links: [],
        isLoading: false,
        createLink: { ...mockCreateLink, isPending: true },
        updateLink: { mutate: vi.fn(), isPending: false },
        deleteLink: { mutate: vi.fn(), isPending: false },
      } as any);

      render(<LinkForm {...defaultProps} />);

      expect(screen.getByLabelText('Titre')).toBeDisabled();
      expect(screen.getByLabelText('URL')).toBeDisabled();
      expect(screen.getByLabelText('Description')).toBeDisabled();
      expect(screen.getByRole('button', { name: /ajout en cours/i })).toBeDisabled();
    });

    it('shows loading text on submit button during submission', () => {
      vi.mocked(useLinks).mockReturnValue({
        links: [],
        isLoading: false,
        createLink: { ...mockCreateLink, isPending: true },
        updateLink: { mutate: vi.fn(), isPending: false },
        deleteLink: { mutate: vi.fn(), isPending: false },
      } as any);

      render(<LinkForm {...defaultProps} />);

      expect(screen.getByRole('button', { name: /ajout en cours/i })).toBeInTheDocument();
    });
  });
});
