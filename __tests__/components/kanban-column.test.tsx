import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { KanbanColumn } from '../../components/kanban/kanban-column'

describe('KanbanColumn', () => {
  const defaultProps = {
    id: 'todo',
    title: 'To Do',
    taskCount: 3,
    onAddTask: vi.fn(),
    color: '#6366f1',
  }

  it('renders column title', () => {
    render(<KanbanColumn {...defaultProps} />)
    expect(screen.getByText('To Do')).toBeInTheDocument()
  })

  it('renders task count badge', () => {
    render(<KanbanColumn {...defaultProps} />)
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('shows empty state when no tasks', () => {
    render(<KanbanColumn {...defaultProps} taskCount={0} />)
    expect(screen.getByText('Aucune tâche')).toBeInTheDocument()
  })

  it('renders children tasks when provided', () => {
    render(
      <KanbanColumn {...defaultProps}>
        <div>Task 1</div>
        <div>Task 2</div>
      </KanbanColumn>
    )
    expect(screen.getByText('Task 1')).toBeInTheDocument()
    expect(screen.getByText('Task 2')).toBeInTheDocument()
  })

  it('calls onAddTask when header add button is clicked', async () => {
    const user = userEvent.setup()
    const onAddTask = vi.fn()
    render(<KanbanColumn {...defaultProps} onAddTask={onAddTask} />)

    const addButton = screen.getByRole('button', {
      name: /ajouter une tâche dans to do/i,
    })
    await user.click(addButton)
    expect(onAddTask).toHaveBeenCalledTimes(1)
  })

  it('calls onAddTask when empty state button is clicked', async () => {
    const user = userEvent.setup()
    const onAddTask = vi.fn()
    render(<KanbanColumn {...defaultProps} taskCount={0} onAddTask={onAddTask} />)

    // Get all buttons and click the one in the empty state (second button)
    const addButtons = screen.getAllByRole('button', {
      name: /ajouter une tâche/i,
    })
    await user.click(addButtons[1])
    expect(onAddTask).toHaveBeenCalledTimes(1)
  })

  it('applies custom color to indicator', () => {
    const { container } = render(
      <KanbanColumn {...defaultProps} color="#ff0000" />
    )
    const colorIndicator = container.querySelector('[style*="background-color"]')
    expect(colorIndicator).toHaveStyle({ backgroundColor: '#ff0000' })
  })

  it('does not show empty state when tasks exist', () => {
    render(
      <KanbanColumn {...defaultProps} taskCount={2}>
        <div>Task 1</div>
      </KanbanColumn>
    )
    expect(screen.queryByText('Aucune tâche')).not.toBeInTheDocument()
  })
})
