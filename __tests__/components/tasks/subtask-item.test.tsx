import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SubtaskItem } from '@/components/tasks/subtask-item'

describe('SubtaskItem', () => {
  const mockSubtask = {
    id: '1',
    task_id: 'task-1',
    title: 'Test subtask',
    completed: false,
    position: 0,
    created_at: '2026-05-06T00:00:00Z'
  }

  const mockOnToggle = vi.fn()
  const mockOnDelete = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders subtask title', () => {
    render(
      <SubtaskItem
        subtask={mockSubtask}
        onToggle={mockOnToggle}
        onDelete={mockOnDelete}
      />
    )

    expect(screen.getByText('Test subtask')).toBeInTheDocument()
  })

  it('shows unchecked checkbox for incomplete subtask', () => {
    render(
      <SubtaskItem
        subtask={mockSubtask}
        onToggle={mockOnToggle}
        onDelete={mockOnDelete}
      />
    )

    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).not.toBeChecked()
  })

  it('shows checked checkbox for completed subtask', () => {
    const completedSubtask = { ...mockSubtask, completed: true }
    render(
      <SubtaskItem
        subtask={completedSubtask}
        onToggle={mockOnToggle}
        onDelete={mockOnDelete}
      />
    )

    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).toBeChecked()
  })

  it('calls onToggle when checkbox is clicked', async () => {
    const user = userEvent.setup()
    render(
      <SubtaskItem
        subtask={mockSubtask}
        onToggle={mockOnToggle}
        onDelete={mockOnDelete}
      />
    )

    const checkbox = screen.getByRole('checkbox')
    await user.click(checkbox)

    expect(mockOnToggle).toHaveBeenCalledWith('1', true)
  })

  it('calls onDelete when delete button is clicked', async () => {
    const user = userEvent.setup()
    render(
      <SubtaskItem
        subtask={mockSubtask}
        onToggle={mockOnToggle}
        onDelete={mockOnDelete}
      />
    )

    const deleteButton = screen.getByLabelText('Delete subtask')
    await user.click(deleteButton)

    expect(mockOnDelete).toHaveBeenCalledWith('1')
  })

  it('applies strikethrough to completed subtask title', () => {
    const completedSubtask = { ...mockSubtask, completed: true }
    render(
      <SubtaskItem
        subtask={completedSubtask}
        onToggle={mockOnToggle}
        onDelete={mockOnDelete}
      />
    )

    const title = screen.getByText('Test subtask')
    expect(title).toHaveClass('line-through')
  })
})
