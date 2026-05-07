import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useLinks } from '@/lib/hooks/use-links';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

// Mock dependencies
vi.mock('@/lib/supabase/client');
vi.mock('sonner');

const mockCreateClient = vi.mocked(createClient);
const mockToast = vi.mocked(toast);

describe('useLinks', () => {
  let queryClient: QueryClient;
  let mockSupabase: any;

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  beforeEach(() => {
    // Reset query client for each test
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    // Setup mock Supabase client
    mockSupabase = {
      auth: {
        getSession: vi.fn(),
      },
      from: vi.fn(),
    };

    mockCreateClient.mockReturnValue(mockSupabase);
    vi.clearAllMocks();
  });

  describe('fetchLinks', () => {
    it('should fetch links for a task', async () => {
      const mockLinks = [
        {
          id: 'link-1',
          task_id: 'task-1',
          user_id: 'user-1',
          title: 'Documentation',
          url: 'https://example.com/docs',
          description: 'Project documentation',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 'link-2',
          task_id: 'task-1',
          user_id: 'user-1',
          title: 'API Reference',
          url: 'https://example.com/api',
          description: null,
          created_at: '2024-01-02T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
        },
      ];

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { user: { id: 'user-1' } } },
      });

      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockResolvedValue({ data: mockLinks, error: null });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      mockSelect.mockReturnValue({
        eq: mockEq,
      });

      mockEq.mockReturnValue({
        order: mockOrder,
      });

      const { result } = renderHook(() => useLinks('task-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.links).toEqual(mockLinks);
      expect(mockSupabase.from).toHaveBeenCalledWith('links');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockEq).toHaveBeenCalledWith('task_id', 'task-1');
      expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false });
    });

    it('should return empty array when no links exist', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { user: { id: 'user-1' } } },
      });

      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockResolvedValue({ data: [], error: null });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      mockSelect.mockReturnValue({
        eq: mockEq,
      });

      mockEq.mockReturnValue({
        order: mockOrder,
      });

      const { result } = renderHook(() => useLinks('task-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.links).toEqual([]);
    });

    it('should throw error when not authenticated', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
      });

      const { result } = renderHook(() => useLinks('task-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Query should fail due to auth error
      expect(result.current.links).toEqual([]);
    });
  });

  describe('createLink', () => {
    it('should create link successfully', async () => {
      const newLinkData = {
        title: 'Documentation',
        url: 'https://example.com/docs',
        description: 'Project documentation',
      };

      const mockLinkRecord = {
        id: 'link-1',
        task_id: 'task-1',
        user_id: 'user-1',
        title: newLinkData.title,
        url: newLinkData.url,
        description: newLinkData.description,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      // Mock auth
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { user: { id: 'user-1' } } },
      });

      // Mock initial query
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockResolvedValue({ data: [], error: null });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        insert: vi.fn().mockReturnThis(),
      });

      mockSelect.mockReturnValue({
        eq: mockEq,
      });

      mockEq.mockReturnValue({
        order: mockOrder,
      });

      // Mock insert
      const mockInsert = vi.fn().mockReturnThis();
      const mockSelectSingle = vi.fn().mockResolvedValue({
        data: mockLinkRecord,
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        insert: mockInsert,
      });

      mockInsert.mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: mockSelectSingle,
        }),
      });

      const { result } = renderHook(() => useLinks('task-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Trigger create
      result.current.createLink.mutate({ ...newLinkData, taskId: 'task-1' });

      await waitFor(() => {
        expect(result.current.createLink.isSuccess).toBe(true);
      });

      expect(mockToast.success).toHaveBeenCalledWith('Lien ajouté');
    });

    it('should handle create errors', async () => {
      const newLinkData = {
        title: 'Documentation',
        url: 'https://example.com/docs',
        description: null,
      };

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { user: { id: 'user-1' } } },
      });

      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockResolvedValue({ data: [], error: null });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      mockSelect.mockReturnValue({
        eq: mockEq,
      });

      mockEq.mockReturnValue({
        order: mockOrder,
      });

      // Mock insert failure
      const mockInsert = vi.fn().mockReturnThis();
      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        insert: mockInsert,
      });

      mockInsert.mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database error' },
          }),
        }),
      });

      const { result } = renderHook(() => useLinks('task-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      result.current.createLink.mutate({ ...newLinkData, taskId: 'task-1' });

      await waitFor(() => {
        expect(result.current.createLink.isError).toBe(true);
      });

      expect(mockToast.error).toHaveBeenCalled();
    });

    it('should reject create when not authenticated', async () => {
      const newLinkData = {
        title: 'Documentation',
        url: 'https://example.com/docs',
        description: null,
      };

      // First call for initial fetch - authenticated
      mockSupabase.auth.getSession
        .mockResolvedValueOnce({
          data: { session: { user: { id: 'user-1' } } },
        })
        // Second call for create - not authenticated
        .mockResolvedValueOnce({
          data: { session: null },
        });

      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockResolvedValue({ data: [], error: null });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      mockSelect.mockReturnValue({
        eq: mockEq,
      });

      mockEq.mockReturnValue({
        order: mockOrder,
      });

      const { result } = renderHook(() => useLinks('task-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      result.current.createLink.mutate({ ...newLinkData, taskId: 'task-1' });

      await waitFor(() => {
        expect(result.current.createLink.isError).toBe(true);
      });

      expect(mockToast.error).toHaveBeenCalledWith('Non authentifié');
    });
  });

  describe('updateLink', () => {
    it('should update link successfully', async () => {
      const mockLinks = [
        {
          id: 'link-1',
          task_id: 'task-1',
          user_id: 'user-1',
          title: 'Old Title',
          url: 'https://example.com/old',
          description: 'Old description',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      const updateData = {
        title: 'New Title',
        url: 'https://example.com/new',
        description: 'New description',
      };

      const updatedLink = {
        ...mockLinks[0],
        ...updateData,
        updated_at: '2024-01-02T00:00:00Z',
      };

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { user: { id: 'user-1' } } },
      });

      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockResolvedValue({ data: mockLinks, error: null });
      const mockSingle = vi.fn().mockResolvedValue({ data: mockLinks[0], error: null });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        update: vi.fn().mockReturnThis(),
      });

      mockSelect.mockReturnValue({
        eq: mockEq,
      });

      mockEq.mockReturnValue({
        order: mockOrder,
        single: mockSingle,
      });

      // Mock update
      const mockUpdate = vi.fn().mockReturnThis();
      const mockUpdateEq = vi.fn().mockReturnThis();
      const mockUpdateSelect = vi.fn().mockReturnThis();
      const mockUpdateSingle = vi.fn().mockResolvedValue({
        data: updatedLink,
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        update: mockUpdate,
      });

      mockUpdate.mockReturnValue({
        eq: mockUpdateEq,
      });

      mockUpdateEq.mockReturnValue({
        select: mockUpdateSelect,
      });

      mockUpdateSelect.mockReturnValue({
        single: mockUpdateSingle,
      });

      const { result } = renderHook(() => useLinks('task-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      result.current.updateLink.mutate({ linkId: 'link-1', ...updateData });

      await waitFor(() => {
        expect(result.current.updateLink.isSuccess).toBe(true);
      });

      expect(mockToast.success).toHaveBeenCalledWith('Lien modifié');
    });

    it('should handle update errors', async () => {
      const mockLinks = [
        {
          id: 'link-1',
          task_id: 'task-1',
          user_id: 'user-1',
          title: 'Old Title',
          url: 'https://example.com/old',
          description: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { user: { id: 'user-1' } } },
      });

      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockResolvedValue({ data: mockLinks, error: null });
      const mockSingle = vi.fn().mockResolvedValue({ data: mockLinks[0], error: null });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      mockSelect.mockReturnValue({
        eq: mockEq,
      });

      mockEq.mockReturnValue({
        order: mockOrder,
        single: mockSingle,
      });

      // Mock update failure
      const mockUpdate = vi.fn().mockReturnThis();
      const mockUpdateEq = vi.fn().mockReturnThis();
      const mockUpdateSelect = vi.fn().mockReturnThis();
      const mockUpdateSingle = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Update failed' },
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        update: mockUpdate,
      });

      mockUpdate.mockReturnValue({
        eq: mockUpdateEq,
      });

      mockUpdateEq.mockReturnValue({
        select: mockUpdateSelect,
      });

      mockUpdateSelect.mockReturnValue({
        single: mockUpdateSingle,
      });

      const { result } = renderHook(() => useLinks('task-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      result.current.updateLink.mutate({
        linkId: 'link-1',
        title: 'New Title',
        url: 'https://example.com/new',
      });

      await waitFor(() => {
        expect(result.current.updateLink.isError).toBe(true);
      });

      expect(mockToast.error).toHaveBeenCalled();
    });

    it('should reject update when not authenticated', async () => {
      // First call for initial fetch - authenticated
      mockSupabase.auth.getSession
        .mockResolvedValueOnce({
          data: { session: { user: { id: 'user-1' } } },
        })
        // Second call for update - not authenticated
        .mockResolvedValueOnce({
          data: { session: null },
        });

      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockResolvedValue({ data: [], error: null });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      mockSelect.mockReturnValue({
        eq: mockEq,
      });

      mockEq.mockReturnValue({
        order: mockOrder,
      });

      const { result } = renderHook(() => useLinks('task-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      result.current.updateLink.mutate({
        linkId: 'link-1',
        title: 'New Title',
        url: 'https://example.com/new',
      });

      await waitFor(() => {
        expect(result.current.updateLink.isError).toBe(true);
      });

      expect(mockToast.error).toHaveBeenCalledWith('Non authentifié');
    });

    it('should reject update when user does not own the link', async () => {
      const mockLinks = [
        {
          id: 'link-1',
          task_id: 'task-1',
          user_id: 'user-1',
          title: 'Title',
          url: 'https://example.com',
          description: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      // User is authenticated as user-2 (different owner)
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { user: { id: 'user-2' } } },
      });

      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockResolvedValue({ data: mockLinks, error: null });
      const mockSingle = vi.fn().mockResolvedValue({ data: mockLinks[0], error: null });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      mockSelect.mockReturnValue({
        eq: mockEq,
      });

      mockEq.mockReturnValue({
        order: mockOrder,
        single: mockSingle,
      });

      const { result } = renderHook(() => useLinks('task-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      result.current.updateLink.mutate({
        linkId: 'link-1',
        title: 'New Title',
        url: 'https://example.com/new',
      });

      await waitFor(() => {
        expect(result.current.updateLink.isError).toBe(true);
      });

      expect(mockToast.error).toHaveBeenCalledWith('Non autorisé');
    });
  });

  describe('deleteLink', () => {
    it('should delete link successfully', async () => {
      const mockLinks = [
        {
          id: 'link-1',
          task_id: 'task-1',
          user_id: 'user-1',
          title: 'Documentation',
          url: 'https://example.com/docs',
          description: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { user: { id: 'user-1' } } },
      });

      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockResolvedValue({ data: mockLinks, error: null });
      const mockSingle = vi.fn().mockResolvedValue({ data: mockLinks[0], error: null });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        delete: vi.fn().mockReturnThis(),
      });

      mockSelect.mockReturnValue({
        eq: mockEq,
      });

      mockEq.mockReturnValue({
        order: mockOrder,
        single: mockSingle,
      });

      // Mock delete
      const mockDelete = vi.fn().mockReturnThis();
      const mockDeleteEq = vi.fn().mockResolvedValue({ error: null });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        delete: mockDelete,
      });

      mockDelete.mockReturnValue({
        eq: mockDeleteEq,
      });

      const { result } = renderHook(() => useLinks('task-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      result.current.deleteLink.mutate('link-1');

      await waitFor(() => {
        expect(result.current.deleteLink.isSuccess).toBe(true);
      });

      expect(mockToast.success).toHaveBeenCalledWith('Lien supprimé');
    });

    it('should handle delete errors', async () => {
      const mockLinks = [
        {
          id: 'link-1',
          task_id: 'task-1',
          user_id: 'user-1',
          title: 'Documentation',
          url: 'https://example.com/docs',
          description: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { user: { id: 'user-1' } } },
      });

      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockResolvedValue({ data: mockLinks, error: null });
      const mockSingle = vi.fn().mockResolvedValue({ data: mockLinks[0], error: null });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      mockSelect.mockReturnValue({
        eq: mockEq,
      });

      mockEq.mockReturnValue({
        order: mockOrder,
        single: mockSingle,
      });

      // Mock delete failure
      const mockDelete = vi.fn().mockReturnThis();
      const mockDeleteEq = vi.fn().mockResolvedValue({
        error: { message: 'Delete failed' },
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        delete: mockDelete,
      });

      mockDelete.mockReturnValue({
        eq: mockDeleteEq,
      });

      const { result } = renderHook(() => useLinks('task-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      result.current.deleteLink.mutate('link-1');

      await waitFor(() => {
        expect(result.current.deleteLink.isError).toBe(true);
      });

      expect(mockToast.error).toHaveBeenCalled();
    });

    it('should reject delete when not authenticated', async () => {
      const mockLinks = [
        {
          id: 'link-1',
          task_id: 'task-1',
          user_id: 'user-1',
          title: 'Documentation',
          url: 'https://example.com/docs',
          description: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      // First call for initial fetch - authenticated
      mockSupabase.auth.getSession
        .mockResolvedValueOnce({
          data: { session: { user: { id: 'user-1' } } },
        })
        // Second call for delete - not authenticated
        .mockResolvedValueOnce({
          data: { session: null },
        });

      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockResolvedValue({ data: mockLinks, error: null });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      mockSelect.mockReturnValue({
        eq: mockEq,
      });

      mockEq.mockReturnValue({
        order: mockOrder,
      });

      const { result } = renderHook(() => useLinks('task-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      result.current.deleteLink.mutate('link-1');

      await waitFor(() => {
        expect(result.current.deleteLink.isError).toBe(true);
      });

      expect(mockToast.error).toHaveBeenCalledWith('Non authentifié');
    });

    it('should reject delete when user does not own the link', async () => {
      const mockLinks = [
        {
          id: 'link-1',
          task_id: 'task-1',
          user_id: 'user-1',
          title: 'Documentation',
          url: 'https://example.com/docs',
          description: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      // User is authenticated as user-2 (different owner)
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { user: { id: 'user-2' } } },
      });

      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockResolvedValue({ data: mockLinks, error: null });
      const mockSingle = vi.fn().mockResolvedValue({ data: mockLinks[0], error: null });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      mockSelect.mockReturnValue({
        eq: mockEq,
      });

      mockEq.mockReturnValue({
        order: mockOrder,
        single: mockSingle,
      });

      const { result } = renderHook(() => useLinks('task-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      result.current.deleteLink.mutate('link-1');

      await waitFor(() => {
        expect(result.current.deleteLink.isError).toBe(true);
      });

      expect(mockToast.error).toHaveBeenCalledWith('Non autorisé');
    });
  });
});
