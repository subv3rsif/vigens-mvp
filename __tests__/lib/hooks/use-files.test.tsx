import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFiles } from '@/lib/hooks/use-files';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

// Mock dependencies
vi.mock('@/lib/supabase/client');
vi.mock('sonner');

const mockCreateClient = vi.mocked(createClient);
const mockToast = vi.mocked(toast);

describe('useFiles', () => {
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
      storage: {
        from: vi.fn(),
      },
    };

    mockCreateClient.mockReturnValue(mockSupabase);
    vi.clearAllMocks();
  });

  describe('fetchFiles', () => {
    it('should fetch files for a task', async () => {
      const mockFiles = [
        {
          id: '1',
          task_id: 'task-1',
          user_id: 'user-1',
          file_path: 'task-1/file1.pdf',
          file_name: 'file1.pdf',
          file_type: 'application/pdf',
          file_size: 1024,
          storage_bucket: 'project-files',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        {
          id: '2',
          task_id: 'task-1',
          user_id: 'user-1',
          file_path: 'task-1/file2.jpg',
          file_name: 'file2.jpg',
          file_type: 'image/jpeg',
          file_size: 2048,
          storage_bucket: 'project-files',
          created_at: '2024-01-02T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
        },
      ];

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { user: { id: 'user-1' } } },
      });

      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockResolvedValue({ data: mockFiles, error: null });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      mockSelect.mockReturnValue({
        eq: mockEq,
      });

      mockEq.mockReturnValue({
        order: mockOrder,
      });

      const { result } = renderHook(() => useFiles('task-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.files).toEqual(mockFiles);
      expect(mockSupabase.from).toHaveBeenCalledWith('files');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockEq).toHaveBeenCalledWith('task_id', 'task-1');
      expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false });
    });

    it('should return empty array when no files exist', async () => {
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

      const { result } = renderHook(() => useFiles('task-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.files).toEqual([]);
    });

    it('should throw error when not authenticated', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
      });

      const { result } = renderHook(() => useFiles('task-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Query should fail due to auth error
      expect(result.current.files).toEqual([]);
    });
  });

  describe('uploadFile', () => {
    it('should upload file successfully', async () => {
      const mockFile = new File(['test content'], 'test.pdf', {
        type: 'application/pdf',
      });

      const mockFileRecord = {
        id: 'file-1',
        task_id: 'task-1',
        user_id: 'user-1',
        file_path: 'task-1/file-1-test.pdf',
        file_name: 'test.pdf',
        file_type: 'application/pdf',
        file_size: mockFile.size,
        storage_bucket: 'project-files',
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

      // Mock storage upload
      const mockUpload = vi.fn().mockResolvedValue({
        data: { path: mockFileRecord.file_path },
        error: null,
      });

      mockSupabase.storage.from.mockReturnValue({
        upload: mockUpload,
      });

      // Mock insert
      const mockInsert = vi.fn().mockReturnThis();
      const mockSelectSingle = vi.fn().mockResolvedValue({
        data: mockFileRecord,
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

      const { result } = renderHook(() => useFiles('task-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Trigger upload
      result.current.uploadFile.mutate({ file: mockFile, taskId: 'task-1' });

      await waitFor(() => {
        expect(result.current.uploadFile.isSuccess).toBe(true);
      });

      expect(mockToast.success).toHaveBeenCalledWith('Fichier ajouté');
    });

    it('should reject files larger than 10MB', async () => {
      const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.pdf', {
        type: 'application/pdf',
      });

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

      const { result } = renderHook(() => useFiles('task-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      result.current.uploadFile.mutate({ file: largeFile, taskId: 'task-1' });

      await waitFor(() => {
        expect(result.current.uploadFile.isError).toBe(true);
      });

      expect(mockToast.error).toHaveBeenCalledWith(
        'Le fichier est trop volumineux (maximum 10 Mo)'
      );
    });

    it('should handle upload errors', async () => {
      const mockFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });

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

      // Mock storage upload failure
      mockSupabase.storage.from.mockReturnValue({
        upload: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Storage error' },
        }),
      });

      const { result } = renderHook(() => useFiles('task-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      result.current.uploadFile.mutate({ file: mockFile, taskId: 'task-1' });

      await waitFor(() => {
        expect(result.current.uploadFile.isError).toBe(true);
      });

      expect(mockToast.error).toHaveBeenCalledWith(
        "Erreur lors de l'ajout du fichier"
      );
    });
  });

  describe('deleteFile', () => {
    it('should delete file successfully', async () => {
      const mockFiles = [
        {
          id: 'file-1',
          task_id: 'task-1',
          user_id: 'user-1',
          file_path: 'task-1/file-1-test.pdf',
          file_name: 'test.pdf',
          file_type: 'application/pdf',
          file_size: 1024,
          storage_bucket: 'project-files',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { user: { id: 'user-1' } } },
      });

      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockResolvedValue({ data: mockFiles, error: null });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        delete: vi.fn().mockReturnThis(),
      });

      mockSelect.mockReturnValue({
        eq: mockEq,
      });

      mockEq.mockReturnValue({
        order: mockOrder,
        single: vi.fn().mockResolvedValue({
          data: mockFiles[0],
          error: null,
        }),
      });

      // Mock storage delete
      mockSupabase.storage.from.mockReturnValue({
        remove: vi.fn().mockResolvedValue({ data: {}, error: null }),
      });

      // Mock database delete
      const mockDelete = vi.fn().mockReturnThis();
      const mockDeleteEq = vi.fn().mockResolvedValue({ error: null });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        delete: mockDelete,
      });

      mockDelete.mockReturnValue({
        eq: mockDeleteEq,
      });

      const { result } = renderHook(() => useFiles('task-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      result.current.deleteFile.mutate('file-1');

      await waitFor(() => {
        expect(result.current.deleteFile.isSuccess).toBe(true);
      });

      expect(mockToast.success).toHaveBeenCalledWith('Fichier supprimé');
    });

    it('should handle delete errors', async () => {
      const mockFiles = [
        {
          id: 'file-1',
          task_id: 'task-1',
          user_id: 'user-1',
          file_path: 'task-1/file-1-test.pdf',
          file_name: 'test.pdf',
          file_type: 'application/pdf',
          file_size: 1024,
          storage_bucket: 'project-files',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { user: { id: 'user-1' } } },
      });

      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockResolvedValue({ data: mockFiles, error: null });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      mockSelect.mockReturnValue({
        eq: mockEq,
      });

      mockEq.mockReturnValue({
        order: mockOrder,
        single: vi.fn().mockResolvedValue({
          data: mockFiles[0],
          error: null,
        }),
      });

      // Mock storage delete failure
      mockSupabase.storage.from.mockReturnValue({
        remove: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Storage error' },
        }),
      });

      const { result } = renderHook(() => useFiles('task-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      result.current.deleteFile.mutate('file-1');

      await waitFor(() => {
        expect(result.current.deleteFile.isError).toBe(true);
      });

      expect(mockToast.error).toHaveBeenCalledWith(
        'Erreur lors de la suppression du fichier'
      );
    });
  });

  describe('downloadFile', () => {
    it('should download file successfully', async () => {
      const mockFiles = [
        {
          id: 'file-1',
          task_id: 'task-1',
          user_id: 'user-1',
          file_path: 'task-1/file-1-test.pdf',
          file_name: 'test.pdf',
          file_type: 'application/pdf',
          file_size: 1024,
          storage_bucket: 'project-files',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { user: { id: 'user-1' } } },
      });

      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockResolvedValue({ data: mockFiles, error: null });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      mockSelect.mockReturnValue({
        eq: mockEq,
      });

      mockEq.mockReturnValue({
        order: mockOrder,
        single: vi.fn().mockResolvedValue({
          data: mockFiles[0],
          error: null,
        }),
      });

      // Mock storage download
      mockSupabase.storage.from.mockReturnValue({
        createSignedUrl: vi.fn().mockResolvedValue({
          data: { signedUrl: 'https://example.com/signed-url' },
          error: null,
        }),
      });

      // Mock window.open
      global.window.open = vi.fn();

      const { result } = renderHook(() => useFiles('task-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await result.current.downloadFile('file-1');

      expect(global.window.open).toHaveBeenCalledWith(
        'https://example.com/signed-url',
        '_blank'
      );
    });

    it('should handle download errors', async () => {
      const mockFiles = [
        {
          id: 'file-1',
          task_id: 'task-1',
          user_id: 'user-1',
          file_path: 'task-1/file-1-test.pdf',
          file_name: 'test.pdf',
          file_type: 'application/pdf',
          file_size: 1024,
          storage_bucket: 'project-files',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { user: { id: 'user-1' } } },
      });

      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockResolvedValue({ data: mockFiles, error: null });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      mockSelect.mockReturnValue({
        eq: mockEq,
      });

      mockEq.mockReturnValue({
        order: mockOrder,
        single: vi.fn().mockResolvedValue({
          data: mockFiles[0],
          error: null,
        }),
      });

      // Mock storage download failure
      mockSupabase.storage.from.mockReturnValue({
        createSignedUrl: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Storage error' },
        }),
      });

      const { result } = renderHook(() => useFiles('task-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(result.current.downloadFile('file-1')).rejects.toThrow();
      expect(mockToast.error).toHaveBeenCalledWith(
        'Erreur lors du téléchargement du fichier'
      );
    });
  });
});
