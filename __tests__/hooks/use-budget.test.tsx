import { renderHook } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useBudget } from '@/lib/hooks/use-budget'
import { useProjects } from '@/lib/hooks/use-projects'
import { useTasks } from '@/lib/hooks/use-tasks'

vi.mock('@/lib/hooks/use-projects')
vi.mock('@/lib/hooks/use-tasks')

describe('useBudget', () => {
  const mockProjects = [
    { id: '1', name: 'Project A', budget: 1000, user_id: 'user-1', color: '#000', icon: 'folder', archived: false, position: 0, created_at: '', updated_at: '', description: null },
    { id: '2', name: 'Project B', budget: 2000, user_id: 'user-1', color: '#000', icon: 'folder', archived: false, position: 1, created_at: '', updated_at: '', description: null },
    { id: '3', name: 'Project C', budget: null, user_id: 'user-1', color: '#000', icon: 'folder', archived: false, position: 2, created_at: '', updated_at: '', description: null }
  ]

  const mockTasks = [
    { id: 't1', project_id: '1', user_id: 'user-1', cost: 400, title: 'Task 1', status: 'todo', priority: 'medium', description: null, due_date: null, assigned_to: null, position: 0, archived: false, created_at: '', updated_at: '' },
    { id: 't2', project_id: '1', user_id: 'user-1', cost: 300, title: 'Task 2', status: 'todo', priority: 'medium', description: null, due_date: null, assigned_to: null, position: 1, archived: false, created_at: '', updated_at: '' },
    { id: 't3', project_id: '2', user_id: 'user-1', cost: 1600, title: 'Task 3', status: 'todo', priority: 'medium', description: null, due_date: null, assigned_to: null, position: 0, archived: false, created_at: '', updated_at: '' },
    { id: 't4', project_id: '2', user_id: 'user-1', cost: null, title: 'Task 4', status: 'todo', priority: 'medium', description: null, due_date: null, assigned_to: null, position: 1, archived: false, created_at: '', updated_at: '' },
    { id: 't5', project_id: '3', user_id: 'user-1', cost: 200, title: 'Task 5', status: 'todo', priority: 'medium', description: null, due_date: null, assigned_to: null, position: 0, archived: false, created_at: '', updated_at: '' }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    ;(useProjects as any).mockReturnValue({ projects: mockProjects })
    ;(useTasks as any).mockReturnValue({ tasks: mockTasks })
  })

  it('calculates total budget correctly', () => {
    const { result } = renderHook(() => useBudget())

    expect(result.current.totalBudget).toBe(3000) // 1000 + 2000, excludes null
  })

  it('calculates total spent correctly', () => {
    const { result } = renderHook(() => useBudget())

    expect(result.current.totalSpent).toBe(2500) // 400 + 300 + 1600 + 200
  })

  it('calculates remaining correctly', () => {
    const { result } = renderHook(() => useBudget())

    expect(result.current.remaining).toBe(500) // 3000 - 2500
  })

  it('calculates percentage correctly', () => {
    const { result } = renderHook(() => useBudget())

    expect(result.current.percentage).toBeCloseTo(83.33, 2) // (2500 / 3000) * 100
  })

  it('calculates spent per project', () => {
    const { result } = renderHook(() => useBudget())

    const project1 = result.current.projectsWithBudget.find(p => p.id === '1')
    const project2 = result.current.projectsWithBudget.find(p => p.id === '2')

    expect(project1?.spent).toBe(700) // 400 + 300
    expect(project2?.spent).toBe(1600)
  })

  it('returns top 3 spenders', () => {
    const { result } = renderHook(() => useBudget())

    expect(result.current.top3).toHaveLength(2) // Only 2 projects have budgets
    expect(result.current.top3[0].id).toBe('2') // Project B (1600 spent)
    expect(result.current.top3[1].id).toBe('1') // Project A (700 spent)
  })

  it('sets status based on percentage', () => {
    const { result } = renderHook(() => useBudget())

    const project1 = result.current.projectsWithBudget.find(p => p.id === '1')
    const project2 = result.current.projectsWithBudget.find(p => p.id === '2')

    expect(project1?.status).toBe('ok') // 70% < 80%
    expect(project2?.status).toBe('warning') // 80% >= 80% and < 100%
  })
})
