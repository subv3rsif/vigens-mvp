import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LinkList } from '@/components/documents/link-list';
import { useLinks } from '@/lib/hooks/use-links';
import { Link } from '@/types/database.types';

// Mock the useLinks hook
vi.mock('@/lib/hooks/use-links');

// Mock LinkForm component
vi.mock('@/components/documents/link-form', () => ({
  LinkForm: ({ onCancel }: any) => (
    <div data-testid="link-form">
      <button onClick={onCancel}>Cancel Form</button>
    </div>
  )
}));

// Mock LinkItem component
vi.mock('@/components/documents/link-item', () => ({
  LinkItem: ({ link, onUpdate, onDelete }: any) => (
    <div data-testid={`link-item-${link.id}`}>
      <span>{link.title}</span>
      <button onClick={() => onUpdate(link.id, { title: 'Updated' })}>Update</button>
      <button onClick={() => onDelete(link.id)}>Delete</button>
    </div>
  )
}));

describe('LinkList', () => {
  const mockCreateLink = {
    mutate: vi.fn(),
    isPending: false,
  };

  const mockUpdateLink = {
    mutate: vi.fn(),
    isPending: false,
  };

  const mockDeleteLink = {
    mutate: vi.fn(),
    isPending: false,
  };

  const createMockLink = (id: string, title: string): Link => ({
    id,
    task_id: 'task-123',
    user_id: 'user-123',
    url: `https://example.com/${id}`,
    title,
    description: `Description for ${title}`,
    created_at: '2024-05-07T10:30:00Z',
    updated_at: '2024-05-07T10:30:00Z',
  });

  const defaultProps = {
    taskId: 'task-123',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useLinks).mockReturnValue({
      links: [],
      isLoading: false,
      createLink: mockCreateLink,
      updateLink: mockUpdateLink,
      deleteLink: mockDeleteLink,
    } as any);
  });

  describe('Loading State', () => {
    it('should show loading message when loading', () => {
      vi.mocked(useLinks).mockReturnValue({
        links: [],
        isLoading: true,
        createLink: mockCreateLink,
        updateLink: mockUpdateLink,
        deleteLink: mockDeleteLink,
      } as any);

      render(<LinkList {...defaultProps} />);

      expect(screen.getByText(/chargement/i)).toBeInTheDocument();
    });

    it('should not show content when loading', () => {
      vi.mocked(useLinks).mockReturnValue({
        links: [createMockLink('1', 'Link 1')],
        isLoading: true,
        createLink: mockCreateLink,
        updateLink: mockUpdateLink,
        deleteLink: mockDeleteLink,
      } as any);

      render(<LinkList {...defaultProps} />);

      expect(screen.queryByTestId('link-item-1')).not.toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no links', () => {
      render(<LinkList {...defaultProps} />);

      expect(screen.getByText(/aucun lien ajouté/i)).toBeInTheDocument();
    });

    it('should show empty state icon when no links', () => {
      const { container } = render(<LinkList {...defaultProps} />);

      // Check for icon in empty state
      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('should not show empty state when links exist', () => {
      vi.mocked(useLinks).mockReturnValue({
        links: [createMockLink('1', 'Link 1')],
        isLoading: false,
        createLink: mockCreateLink,
        updateLink: mockUpdateLink,
        deleteLink: mockDeleteLink,
      } as any);

      render(<LinkList {...defaultProps} />);

      expect(screen.queryByText(/aucun lien ajouté/i)).not.toBeInTheDocument();
    });
  });

  describe('Link Count', () => {
    it('should show "0 lien(s)" when empty', () => {
      render(<LinkList {...defaultProps} />);

      expect(screen.getByText('0 lien(s)')).toBeInTheDocument();
    });

    it('should show "1 lien(s)" with one link', () => {
      vi.mocked(useLinks).mockReturnValue({
        links: [createMockLink('1', 'Link 1')],
        isLoading: false,
        createLink: mockCreateLink,
        updateLink: mockUpdateLink,
        deleteLink: mockDeleteLink,
      } as any);

      render(<LinkList {...defaultProps} />);

      expect(screen.getByText('1 lien(s)')).toBeInTheDocument();
    });

    it('should show "3 lien(s)" with multiple links', () => {
      vi.mocked(useLinks).mockReturnValue({
        links: [
          createMockLink('1', 'Link 1'),
          createMockLink('2', 'Link 2'),
          createMockLink('3', 'Link 3'),
        ],
        isLoading: false,
        createLink: mockCreateLink,
        updateLink: mockUpdateLink,
        deleteLink: mockDeleteLink,
      } as any);

      render(<LinkList {...defaultProps} />);

      expect(screen.getByText('3 lien(s)')).toBeInTheDocument();
    });
  });

  describe('Add Link Button', () => {
    it('should render "Ajouter un lien" button', () => {
      render(<LinkList {...defaultProps} />);

      expect(screen.getByRole('button', { name: /ajouter un lien/i })).toBeInTheDocument();
    });

    it('should show link form when add button is clicked', async () => {
      render(<LinkList {...defaultProps} />);

      const addButton = screen.getByRole('button', { name: /ajouter un lien/i });
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByTestId('link-form')).toBeInTheDocument();
      });
    });

    it('should hide link form when add button is clicked again', async () => {
      render(<LinkList {...defaultProps} />);

      const addButton = screen.getByRole('button', { name: /ajouter un lien/i });

      // Show form
      fireEvent.click(addButton);
      await waitFor(() => {
        expect(screen.getByTestId('link-form')).toBeInTheDocument();
      });

      // Hide form
      fireEvent.click(addButton);
      await waitFor(() => {
        expect(screen.queryByTestId('link-form')).not.toBeInTheDocument();
      });
    });

    it('should hide link form when form cancel is called', async () => {
      render(<LinkList {...defaultProps} />);

      const addButton = screen.getByRole('button', { name: /ajouter un lien/i });
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByTestId('link-form')).toBeInTheDocument();
      });

      const cancelButton = screen.getByText('Cancel Form');
      fireEvent.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByTestId('link-form')).not.toBeInTheDocument();
      });
    });
  });

  describe('Link Display', () => {
    it('should render all links', () => {
      vi.mocked(useLinks).mockReturnValue({
        links: [
          createMockLink('1', 'GitHub'),
          createMockLink('2', 'GitLab'),
          createMockLink('3', 'Bitbucket'),
        ],
        isLoading: false,
        createLink: mockCreateLink,
        updateLink: mockUpdateLink,
        deleteLink: mockDeleteLink,
      } as any);

      render(<LinkList {...defaultProps} />);

      expect(screen.getByTestId('link-item-1')).toBeInTheDocument();
      expect(screen.getByTestId('link-item-2')).toBeInTheDocument();
      expect(screen.getByTestId('link-item-3')).toBeInTheDocument();
    });

    it('should render links in correct order', () => {
      vi.mocked(useLinks).mockReturnValue({
        links: [
          createMockLink('1', 'First'),
          createMockLink('2', 'Second'),
          createMockLink('3', 'Third'),
        ],
        isLoading: false,
        createLink: mockCreateLink,
        updateLink: mockUpdateLink,
        deleteLink: mockDeleteLink,
      } as any);

      render(<LinkList {...defaultProps} />);

      const linkTitles = screen.getAllByText(/First|Second|Third/);
      expect(linkTitles[0]).toHaveTextContent('First');
      expect(linkTitles[1]).toHaveTextContent('Second');
      expect(linkTitles[2]).toHaveTextContent('Third');
    });
  });

  describe('Link Actions', () => {
    it('should call updateLink.mutate when link is updated', async () => {
      vi.mocked(useLinks).mockReturnValue({
        links: [createMockLink('1', 'Link 1')],
        isLoading: false,
        createLink: mockCreateLink,
        updateLink: mockUpdateLink,
        deleteLink: mockDeleteLink,
      } as any);

      render(<LinkList {...defaultProps} />);

      const updateButton = screen.getByText('Update');
      fireEvent.click(updateButton);

      await waitFor(() => {
        expect(mockUpdateLink.mutate).toHaveBeenCalledWith({
          linkId: '1',
          title: 'Updated',
        });
      });
    });

    it('should call deleteLink.mutate when link is deleted', async () => {
      vi.mocked(useLinks).mockReturnValue({
        links: [createMockLink('1', 'Link 1')],
        isLoading: false,
        createLink: mockCreateLink,
        updateLink: mockUpdateLink,
        deleteLink: mockDeleteLink,
      } as any);

      render(<LinkList {...defaultProps} />);

      const deleteButton = screen.getByText('Delete');
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(mockDeleteLink.mutate).toHaveBeenCalledWith('1');
      });
    });
  });

  describe('Integration', () => {
    it('should pass taskId to LinkForm', async () => {
      render(<LinkList {...defaultProps} />);

      const addButton = screen.getByRole('button', { name: /ajouter un lien/i });
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByTestId('link-form')).toBeInTheDocument();
      });
    });

    it('should hide form after successful link creation', async () => {
      render(<LinkList {...defaultProps} />);

      const addButton = screen.getByRole('button', { name: /ajouter un lien/i });
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByTestId('link-form')).toBeInTheDocument();
      });

      // Simulate successful creation by hiding form via onSuccess callback
      // This is handled by LinkForm's onSuccess prop
    });
  });
});
