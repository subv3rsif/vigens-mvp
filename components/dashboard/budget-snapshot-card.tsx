import { useBudget } from '@/lib/hooks/use-budget'
import { BudgetProgressBar } from './budget-progress-bar'

export function BudgetSnapshotCard() {
  const { totalBudget, totalSpent, percentage, top3 } = useBudget()

  // Format number as French currency (space as thousands separator)
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Determine overall budget status
  const getStatus = (): 'ok' | 'warning' | 'over' => {
    if (percentage > 100) return 'over'
    if (percentage >= 80) return 'warning'
    return 'ok'
  }

  // Empty state if no budget configured
  if (totalBudget === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <h3 className="text-lg font-semibold mb-4">Budget Global</h3>
        <p className="text-sm text-text-secondary">
          Aucun budget configuré. Ajoutez des budgets à vos projets pour suivre vos dépenses.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <h3 className="text-lg font-semibold mb-4">Budget Global</h3>

      {/* Budget totals */}
      <div className="mb-4">
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-2xl font-bold">
            {formatCurrency(totalSpent)} €
          </span>
          <span className="text-sm text-text-secondary">
            / {formatCurrency(totalBudget)} €
          </span>
        </div>

        {/* Progress bar */}
        <BudgetProgressBar
          percentage={percentage}
          status={getStatus()}
          showLabel={false}
        />
      </div>

      {/* Top 3 spenders */}
      {top3.length > 0 && (
        <div className="space-y-2 pt-4 border-t border-border">
          <h4 className="text-sm font-medium text-text-secondary mb-3">
            Top 3 Dépenses
          </h4>
          {top3.map((project, index) => (
            <div key={project.id} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="text-text-secondary">{index + 1}.</span>
                <span className="font-medium truncate">{project.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-medium">
                  {formatCurrency(project.spent)} €
                </span>
                <span className="text-xs text-text-secondary min-w-[3rem] text-right">
                  {Math.round(project.percentage)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
