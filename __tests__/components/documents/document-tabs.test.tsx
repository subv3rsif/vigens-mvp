import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DocumentTabs } from '@/components/documents/document-tabs';

// Mock child components
vi.mock('@/components/documents/file-upload', () => ({
  FileUpload: ({ taskId }: { taskId: string }) => (
    <div data-testid="file-upload">File Upload for task: {taskId}</div>
  ),
}));

vi.mock('@/components/documents/file-list', () => ({
  FileList: ({ taskId }: { taskId: string }) => (
    <div data-testid="file-list">File List for task: {taskId}</div>
  ),
}));

vi.mock('@/components/documents/link-list', () => ({
  LinkList: ({ taskId }: { taskId: string }) => (
    <div data-testid="link-list">Link List for task: {taskId}</div>
  ),
}));

describe('DocumentTabs', () => {
  const mockTaskId = 'task-123';

  it('renders both tab buttons', () => {
    render(<DocumentTabs taskId={mockTaskId} />);

    expect(screen.getByRole('tab', { name: /fichiers/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /liens/i })).toBeInTheDocument();
  });

  it('defaults to "Fichiers" tab', () => {
    render(<DocumentTabs taskId={mockTaskId} />);

    const filesTab = screen.getByRole('tab', { name: /fichiers/i });
    expect(filesTab).toHaveAttribute('aria-selected', 'true');
  });

  it('shows FileUpload and FileList components in Fichiers tab by default', () => {
    render(<DocumentTabs taskId={mockTaskId} />);

    expect(screen.getByTestId('file-upload')).toBeInTheDocument();
    expect(screen.getByTestId('file-list')).toBeInTheDocument();
    expect(screen.queryByTestId('link-list')).not.toBeInTheDocument();
  });

  it('switches to Liens tab on click', async () => {
    const user = userEvent.setup();
    render(<DocumentTabs taskId={mockTaskId} />);

    const liensTab = screen.getByRole('tab', { name: /liens/i });
    await user.click(liensTab);

    await waitFor(() => {
      expect(liensTab).toHaveAttribute('aria-selected', 'true');
    });
  });

  it('shows LinkList component when Liens tab is active', async () => {
    const user = userEvent.setup();
    render(<DocumentTabs taskId={mockTaskId} />);

    const liensTab = screen.getByRole('tab', { name: /liens/i });
    await user.click(liensTab);

    await waitFor(() => {
      expect(screen.getByTestId('link-list')).toBeInTheDocument();
      expect(screen.queryByTestId('file-upload')).not.toBeInTheDocument();
      expect(screen.queryByTestId('file-list')).not.toBeInTheDocument();
    });
  });

  it('switches back to Fichiers tab from Liens tab', async () => {
    const user = userEvent.setup();
    render(<DocumentTabs taskId={mockTaskId} />);

    // Click Liens tab
    const liensTab = screen.getByRole('tab', { name: /liens/i });
    await user.click(liensTab);

    await waitFor(() => {
      expect(screen.getByTestId('link-list')).toBeInTheDocument();
    });

    // Click back to Fichiers tab
    const filesTab = screen.getByRole('tab', { name: /fichiers/i });
    await user.click(filesTab);

    await waitFor(() => {
      expect(screen.getByTestId('file-upload')).toBeInTheDocument();
      expect(screen.getByTestId('file-list')).toBeInTheDocument();
      expect(screen.queryByTestId('link-list')).not.toBeInTheDocument();
    });
  });

  it('passes taskId prop to FileUpload component', () => {
    render(<DocumentTabs taskId={mockTaskId} />);

    expect(screen.getByTestId('file-upload')).toHaveTextContent(`task: ${mockTaskId}`);
  });

  it('passes taskId prop to FileList component', () => {
    render(<DocumentTabs taskId={mockTaskId} />);

    expect(screen.getByTestId('file-list')).toHaveTextContent(`task: ${mockTaskId}`);
  });

  it('passes taskId prop to LinkList component', async () => {
    const user = userEvent.setup();
    render(<DocumentTabs taskId={mockTaskId} />);

    const liensTab = screen.getByRole('tab', { name: /liens/i });
    await user.click(liensTab);

    await waitFor(() => {
      expect(screen.getByTestId('link-list')).toHaveTextContent(`task: ${mockTaskId}`);
    });
  });

  it('supports keyboard navigation', async () => {
    const user = userEvent.setup();
    render(<DocumentTabs taskId={mockTaskId} />);

    const filesTab = screen.getByRole('tab', { name: /fichiers/i });
    filesTab.focus();

    // Arrow right should move to next tab
    await user.keyboard('{ArrowRight}');

    await waitFor(() => {
      const liensTab = screen.getByRole('tab', { name: /liens/i });
      expect(liensTab).toHaveFocus();
    });
  });
});
