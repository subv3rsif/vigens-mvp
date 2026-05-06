import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SubtaskList } from '@/components/tasks/subtask-list'
import { useSubtasks } from '@/lib/hooks/use-subtasks'
import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('@/lib/hooks/use-subtasks')

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient()
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

describe('SubtaskList', () => {
  const mockSubtasks = [
    { id: '1', task_id: 'task-1', user_id: 'user-1', title: 'Subtask 1', completed: false, position: 0, created_at: '', updated_at: '' },
    { id: '2', task_id: 'task-1', user_id: 'user-1', title: 'Subtask 2', completed: true, position: 1, created_at: '', updated_at: '' },
    { id: '3', task_id: 'task-1', user_id: 'user-1', title: 'Subtask 3', completed: true, position: 2, created_at: '', updated_at: '' }
  ]

  const mockUseSubtasks = {
    subtasks: mockSubtasks,
    isLoading: false,
    createSubtask: { mutate: vi.fn(), isPending: false },
    updateSubtask: { mutate: vi.fn() },
    deleteSubtask: { mutate: vi.fn() }
  }

  beforeEach(() => {
    vi.clearAllMocks()
    ;(useSubtasks as any).mockReturnValue(mockUseSubtasks)
  })

  it('displays correct progress count', () => {
    render(<SubtaskList taskId="task-1" />, { wrapper })
    expect(screen.getByText('✓ 2/3')).toBeInTheDocument()
  })

  it('expands and shows subtasks when clicked', async () => {
    const user = userEvent.setup()
    render(<SubtaskList taskId="task-1" />, { wrapper })

    const header = screen.getByText(/Sous-tâches/)
    await user.click(header)

    await waitFor(() => {
      expect(screen.getByText('Subtask 1')).toBeInTheDocument()
      expect(screen.getByText('Subtask 2')).toBeInTheDocument()
      expect(screen.getByText('Subtask 3')).toBeInTheDocument()
    })
  })

  it('shows green badge when all completed', () => {
    const allCompleted = mockSubtasks.map(s => ({ ...s, completed: true }))
    ;(useSubtasks as any).mockReturnValue({
      ...mockUseSubtasks,
      subtasks: allCompleted
    })

    render(<SubtaskList taskId="task-1" />, { wrapper })
    const badge = screen.getByText('✓ 3/3')
    expect(badge).toHaveClass('text-success')
  })

  it('shows orange badge when partially completed', () => {
    render(<SubtaskList taskId="task-1" />, { wrapper })
    const badge = screen.getByText('✓ 2/3')
    expect(badge).toHaveClass('text-warning')
  })

  it('shows gray badge when none completed', () => {
    const noneCompleted = mockSubtasks.map(s => ({ ...s, completed: false }))
    ;(useSubtasks as any).mockReturnValue({
      ...mockUseSubtasks,
      subtasks: noneCompleted
    })

    render(<SubtaskList taskId="task-1" />, { wrapper })
    const badge = screen.getByText('✓ 0/3')
    expect(badge).toHaveClass('text-text-secondary')
  })

  it('shows empty state when no subtasks', async () => {
    ;(useSubtasks as any).mockReturnValue({
      ...mockUseSubtasks,
      subtasks: []
    })

    const user = userEvent.setup()
    render(<SubtaskList taskId="task-1" />, { wrapper })

    const header = screen.getByText(/Sous-tâches/)
    await user.click(header)

    await waitFor(() => {
      expect(screen.getByText('Aucune sous-tâche')).toBeInTheDocument()
    })
  })
})
