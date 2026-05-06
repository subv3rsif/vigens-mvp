import * as React from "react"

import { Button } from "./button"
import { cn } from "../../lib/utils"

interface EmptyStateProps {
  icon?: React.ComponentType<{ className?: string }>
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
    variant?: "default" | "outline" | "secondary" | "ghost"
  }
  className?: string
}

function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      role="status"
      className={cn(
        "flex flex-col items-center justify-center gap-4 py-12 px-4",
        className
      )}
    >
      {Icon && (
        <Icon className="h-16 w-16 text-muted-foreground" />
      )}
      <div className="flex flex-col items-center gap-2">
        <h3 className="text-lg font-semibold text-foreground">
          {title}
        </h3>
        {description && (
          <p className="max-w-md text-center text-sm text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {action && (
        <Button
          onClick={action.onClick}
          variant={action.variant ?? "outline"}
          className="mt-2"
        >
          {action.label}
        </Button>
      )}
    </div>
  )
}

export { EmptyState, type EmptyStateProps }
