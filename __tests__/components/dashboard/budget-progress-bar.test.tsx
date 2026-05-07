import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BudgetProgressBar } from '@/components/dashboard/budget-progress-bar'

describe('BudgetProgressBar', () => {
  it('renders progress bar with percentage', () => {
    render(<BudgetProgressBar percentage={62} status="ok" />)
    expect(screen.getByText('62%')).toBeInTheDocument()
  })

  it('shows green color for ok status', () => {
    render(<BudgetProgressBar percentage={50} status="ok" />)
    const progressBar = screen.getByRole('progressbar')
    expect(progressBar).toHaveClass('bg-success')
  })

  it('shows orange color for warning status', () => {
    render(<BudgetProgressBar percentage={85} status="warning" />)
    const progressBar = screen.getByRole('progressbar')
    expect(progressBar).toHaveClass('bg-warning')
  })

  it('shows red color for over budget status', () => {
    render(<BudgetProgressBar percentage={110} status="over" />)
    const progressBar = screen.getByRole('progressbar')
    expect(progressBar).toHaveClass('bg-error')
  })

  it('caps percentage display at 100% max', () => {
    render(<BudgetProgressBar percentage={110} status="over" />)
    // Width should be 100% even if percentage is 110
    const progressBar = screen.getByRole('progressbar')
    expect(progressBar).toHaveStyle({ width: '100%' })
  })

  it('handles zero percentage', () => {
    render(<BudgetProgressBar percentage={0} status="ok" />)
    expect(screen.getByText('0%')).toBeInTheDocument()
    const progressBar = screen.getByRole('progressbar')
    expect(progressBar).toHaveStyle({ width: '0%' })
  })
})
