import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AddSubtaskInput } from '@/components/tasks/add-subtask-input'

describe('AddSubtaskInput', () => {
  const mockOnAdd = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders input placeholder', () => {
    render(<AddSubtaskInput onAdd={mockOnAdd} />)
    expect(screen.getByPlaceholderText('Ajouter une sous-tâche...')).toBeInTheDocument()
  })

  it('calls onAdd when Enter is pressed', async () => {
    const user = userEvent.setup()
    render(<AddSubtaskInput onAdd={mockOnAdd} />)

    const input = screen.getByPlaceholderText('Ajouter une sous-tâche...')
    await user.type(input, 'New subtask{Enter}')

    expect(mockOnAdd).toHaveBeenCalledWith('New subtask')
    expect(input).toHaveValue('')
  })

  it('clears input on Escape', async () => {
    const user = userEvent.setup()
    render(<AddSubtaskInput onAdd={mockOnAdd} />)

    const input = screen.getByPlaceholderText('Ajouter une sous-tâche...')
    await user.type(input, 'Test')
    await user.keyboard('{Escape}')

    expect(input).toHaveValue('')
    expect(mockOnAdd).not.toHaveBeenCalled()
  })

  it('does not call onAdd for empty input', async () => {
    const user = userEvent.setup()
    render(<AddSubtaskInput onAdd={mockOnAdd} />)

    const input = screen.getByPlaceholderText('Ajouter une sous-tâche...')
    await user.type(input, '{Enter}')

    expect(mockOnAdd).not.toHaveBeenCalled()
  })
})
