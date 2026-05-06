import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TaskCard } from '../../components/kanban/task-card'
import { Task } from '../../types/database.types'

describe('TaskCard', () => {
  const mockTask: Task = {
    id: '1',
    project_id: 'project-1',
    user_id: 'user-1',
    title: 'Test Task',
    description: 'Test description',
    status: 'todo',
    priority: 'high',
    due_date: '2026-05-10',
    assigned_to: null,
    position: 0,
    archived: false,
    created_at: '2026-05-01',
    updated_at: '2026-05-01',
  }

  it('renders task title', () => {
    render(<TaskCard task={mockTask} />)
    expect(screen.getByText('Test Task')).toBeInTheDocument()
  })

  it('renders task description', () => {
    render(<TaskCard task={mockTask} />)
    expect(screen.getByText('Test description')).toBeInTheDocument()
  })

  it('shows priority indicator for high priority', () => {
    render(<TaskCard task={mockTask} />)
    expect(screen.getByText('Élevé')).toBeInTheDocument()
  })

  it('shows due date when present', () => {
    render(<TaskCard task={mockTask} />)
    expect(screen.getByText('10 mai')).toBeInTheDocument()
  })

  it('does not show due date when not present', () => {
    const taskWithoutDueDate = { ...mockTask, due_date: null }
    render(<TaskCard task={taskWithoutDueDate} />)
    expect(screen.queryByRole('img', { name: /calendar/i })).not.toBeInTheDocument()
  })

  it('handles click events', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<TaskCard task={mockTask} onClick={onClick} />)

    await user.click(screen.getByText('Test Task'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('does not show priority when not set', () => {
    const taskWithoutPriority = { ...mockTask, priority: '' }
    render(<TaskCard task={taskWithoutPriority} />)
    expect(screen.queryByText('Élevé')).not.toBeInTheDocument()
    expect(screen.queryByText('Moyen')).not.toBeInTheDocument()
    expect(screen.queryByText('Faible')).not.toBeInTheDocument()
  })
})
