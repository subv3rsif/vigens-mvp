interface BudgetProgressBarProps {
  percentage: number
  status: 'ok' | 'warning' | 'over'
  showLabel?: boolean
}

export function BudgetProgressBar({
  percentage,
  status,
  showLabel = true,
}: BudgetProgressBarProps) {
  // Cap percentage at 100 for display
  const displayPercentage = Math.min(percentage, 100)

  const getBarColor = () => {
    switch (status) {
      case 'ok':
        return 'bg-success'
      case 'warning':
        return 'bg-warning'
      case 'over':
        return 'bg-error'
      default:
        return 'bg-success'
    }
  }

  return (
    <div className="space-y-2">
      {/* Progress bar background */}
      <div className="relative w-full h-2 bg-muted rounded-full overflow-hidden">
        {/* Progress bar fill */}
        <div
          role="progressbar"
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
          className={`h-full transition-all duration-300 ${getBarColor()}`}
          style={{ width: `${displayPercentage}%` }}
        />
      </div>

      {/* Percentage label */}
      {showLabel && (
        <div className="flex justify-between items-center text-xs">
          <span className="text-muted-foreground">
            {Math.round(percentage)}%
          </span>
        </div>
      )}
    </div>
  )
}
