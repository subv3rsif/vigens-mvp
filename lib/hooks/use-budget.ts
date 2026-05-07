'use client'

import { useMemo } from 'react'
import { useProjects } from './use-projects'
import { useTasks } from './use-tasks'
import type { Project } from '@/types/database.types'

export interface ProjectWithBudget extends Project {
  spent: number
  percentage: number
  status: 'ok' | 'warning' | 'over'
}

interface BudgetData {
  totalBudget: number
  totalSpent: number
  remaining: number
  percentage: number
  top3: ProjectWithBudget[]
  projectsWithBudget: ProjectWithBudget[]
}

export function useBudget(): BudgetData {
  const { projects } = useProjects()
  const { tasks } = useTasks()

  const budgetData = useMemo(() => {
    // Calculate spent per project for projects with budget
    const projectsWithBudget = projects
      .filter(p => p.budget !== null && p.budget !== undefined)
      .map(project => {
        const projectTasks = tasks.filter(t => t.project_id === project.id)
        const spent = projectTasks.reduce((sum, t) => sum + (t.cost || 0), 0)
        const percentage = project.budget ? (spent / project.budget) * 100 : 0

        let status: 'ok' | 'warning' | 'over' = 'ok'
        if (percentage > 100) status = 'over'
        else if (percentage >= 80) status = 'warning'

        return {
          ...project,
          spent,
          percentage,
          status
        }
      })

    // Calculate totals (including all tasks, even from projects without budget)
    const totalBudget = projectsWithBudget.reduce((sum, p) => sum + (p.budget || 0), 0)
    const totalSpent = tasks.reduce((sum, t) => sum + (t.cost || 0), 0)
    const remaining = totalBudget - totalSpent
    const percentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0

    // Get top 3 spenders
    const top3 = [...projectsWithBudget]
      .sort((a, b) => b.spent - a.spent)
      .slice(0, 3)

    return {
      totalBudget,
      totalSpent,
      remaining,
      percentage,
      top3,
      projectsWithBudget
    }
  }, [projects, tasks])

  return budgetData
}
