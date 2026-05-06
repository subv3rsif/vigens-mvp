import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useProjects } from '../../lib/hooks/use-projects'
import { ReactNode } from 'react'

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

describe('useProjects', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('provides the expected hook interface', () => {
    const { result } = renderHook(() => useProjects(), {
      wrapper: createWrapper(),
    })

    // Check that all expected properties exist
    expect(result.current).toHaveProperty('projects')
    expect(result.current).toHaveProperty('isLoading')
    expect(result.current).toHaveProperty('error')
    expect(result.current).toHaveProperty('createProject')
    expect(result.current).toHaveProperty('updateProject')
    expect(result.current).toHaveProperty('deleteProject')
  })

  it('initializes with default state', () => {
    const { result } = renderHook(() => useProjects(), {
      wrapper: createWrapper(),
    })

    expect(result.current.projects).toBeDefined()
    expect(typeof result.current.isLoading).toBe('boolean')
  })

  it('provides mutation functions', () => {
    const { result } = renderHook(() => useProjects(), {
      wrapper: createWrapper(),
    })

    expect(typeof result.current.createProject).toBe('function')
    expect(typeof result.current.updateProject).toBe('function')
    expect(typeof result.current.deleteProject).toBe('function')
  })

  it('provides loading states', () => {
    const { result } = renderHook(() => useProjects(), {
      wrapper: createWrapper(),
    })

    expect(result.current).toHaveProperty('isCreating')
    expect(result.current).toHaveProperty('isUpdating')
    expect(result.current).toHaveProperty('isDeleting')
    expect(typeof result.current.isCreating).toBe('boolean')
    expect(typeof result.current.isUpdating).toBe('boolean')
    expect(typeof result.current.isDeleting).toBe('boolean')
  })

  it('can be called multiple times without errors', () => {
    const wrapper = createWrapper()

    const { result: result1 } = renderHook(() => useProjects(), { wrapper })
    const { result: result2 } = renderHook(() => useProjects(), { wrapper })

    expect(result1.current).toBeDefined()
    expect(result2.current).toBeDefined()
  })
})
