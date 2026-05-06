import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useSubtasks } from '../../lib/hooks/use-subtasks'
import { Subtask, SubtaskInsert, SubtaskUpdate } from '../../types/database.types'
import { ReactNode } from 'react'

// Mock the Supabase client
vi.mock('../../lib/supabase/client', () => ({
  createClient: vi.fn(),
}))

// Import mock after it's defined
import { createClient } from '../../lib/supabase/client'

// Create wrapper with QueryClient
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  })
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useSubtasks', () => {
  const mockSubtasks: Subtask[] = [
    {
      id: '1',
      task_id: 'task-1',
      user_id: 'user-1',
      title: 'Subtask 1',
      completed: false,
      position: 0,
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
    },
    {
      id: '2',
      task_id: 'task-1',
      user_id: 'user-1',
      title: 'Subtask 2',
      completed: true,
      position: 1,
      created_at: '2024-01-02',
      updated_at: '2024-01-02',
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('provides the expected hook interface', () => {
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      }),
    })

    ;(createClient as any).mockReturnValue({ from: mockFrom })

    const { result } = renderHook(() => useSubtasks('task-1'), {
      wrapper: createWrapper(),
    })

    // Check that all expected properties exist
    expect(result.current).toHaveProperty('subtasks')
    expect(result.current).toHaveProperty('isLoading')
    expect(result.current).toHaveProperty('createSubtask')
    expect(result.current).toHaveProperty('updateSubtask')
    expect(result.current).toHaveProperty('deleteSubtask')
  })

  it('fetches subtasks for a task', async () => {
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: mockSubtasks,
            error: null,
          }),
        }),
      }),
    })

    ;(createClient as any).mockReturnValue({ from: mockFrom })

    const { result } = renderHook(() => useSubtasks('task-1'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.subtasks).toEqual(mockSubtasks)
    })
  })

  it('initializes with empty subtasks', () => {
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      }),
    })

    ;(createClient as any).mockReturnValue({ from: mockFrom })

    const { result } = renderHook(() => useSubtasks('task-1'), {
      wrapper: createWrapper(),
    })

    expect(result.current.subtasks).toBeDefined()
    expect(Array.isArray(result.current.subtasks)).toBe(true)
  })

  it('provides loading state', async () => {
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      }),
    })

    ;(createClient as any).mockReturnValue({ from: mockFrom })

    const { result } = renderHook(() => useSubtasks('task-1'), {
      wrapper: createWrapper(),
    })

    expect(typeof result.current.isLoading).toBe('boolean')
  })

  it('provides mutation functions', () => {
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      }),
    })

    ;(createClient as any).mockReturnValue({ from: mockFrom })

    const { result } = renderHook(() => useSubtasks('task-1'), {
      wrapper: createWrapper(),
    })

    expect(typeof result.current.createSubtask.mutate).toBe('function')
    expect(typeof result.current.updateSubtask.mutate).toBe('function')
    expect(typeof result.current.deleteSubtask.mutate).toBe('function')
  })

  it('disables query when taskId is not provided', () => {
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      }),
    })

    ;(createClient as any).mockReturnValue({ from: mockFrom })

    const { result } = renderHook(() => useSubtasks(''), {
      wrapper: createWrapper(),
    })

    expect(result.current.subtasks).toEqual([])
  })
})
