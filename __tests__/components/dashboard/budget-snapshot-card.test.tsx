import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BudgetSnapshotCard } from '@/components/dashboard/budget-snapshot-card'
import { useBudget } from '@/lib/hooks/use-budget'

vi.mock('@/lib/hooks/use-budget')

describe('BudgetSnapshotCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders budget totals', () => {
    (useBudget as any).mockReturnValue({
      totalBudget: 20000,
      totalSpent: 12500,
      remaining: 7500,
      percentage: 62.5,
      top3: [],
      projectsWithBudget: []
    })

    render(<BudgetSnapshotCard />)

    expect(screen.getByText(/12 500/)).toBeInTheDocument()
    expect(screen.getByText(/20 000/)).toBeInTheDocument()
  })

  it('renders top 3 spenders', () => {
    (useBudget as any).mockReturnValue({
      totalBudget: 20000,
      totalSpent: 12500,
      remaining: 7500,
      percentage: 62.5,
      top3: [
        { id: '1', name: 'Project Alpha', spent: 4200, percentage: 21, status: 'ok' },
        { id: '2', name: 'Project Beta', spent: 3800, percentage: 19, status: 'ok' },
        { id: '3', name: 'Project Gamma', spent: 2100, percentage: 10.5, status: 'ok' }
      ],
      projectsWithBudget: []
    })

    render(<BudgetSnapshotCard />)

    expect(screen.getByText('Project Alpha')).toBeInTheDocument()
    expect(screen.getByText('Project Beta')).toBeInTheDocument()
    expect(screen.getByText('Project Gamma')).toBeInTheDocument()
  })

  it('shows empty state when no budget data', () => {
    (useBudget as any).mockReturnValue({
      totalBudget: 0,
      totalSpent: 0,
      remaining: 0,
      percentage: 0,
      top3: [],
      projectsWithBudget: []
    })

    render(<BudgetSnapshotCard />)

    expect(screen.getByText(/aucun budget/i)).toBeInTheDocument()
  })

  it('formats currency correctly', () => {
    (useBudget as any).mockReturnValue({
      totalBudget: 1234.56,
      totalSpent: 789.12,
      remaining: 445.44,
      percentage: 64,
      top3: [],
      projectsWithBudget: []
    })

    render(<BudgetSnapshotCard />)

    // French number formatting with spaces for thousands
    // Check for numbers (text is split by € symbol)
    expect(screen.getByText(/789/)).toBeInTheDocument()
    expect(screen.getByText(/1 235/)).toBeInTheDocument()
  })
})
