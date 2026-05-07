import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ProjectCard } from '../../components/projects/project-card'
import { Project } from '../../types/database.types'
import { useTasks } from '@/lib/hooks/use-tasks'

vi.mock('@/lib/hooks/use-tasks')

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient()
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

describe('ProjectCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(useTasks as any).mockReturnValue({
      tasks: [],
      isLoading: false,
      createTask: vi.fn(),
      updateTask: vi.fn(),
      deleteTask: vi.fn()
    })
  })

  const mockProject: Project = {
    id: 'project-1',
    user_id: 'user-1',
    name: 'Test Project',
    description: 'Test project description',
    color: '#3b82f6',
    icon: '📁',
    archived: false,
    position: 0,
    budget: null,
    created_at: '2026-05-01',
    updated_at: '2026-05-01',
  }

  it('renders project name', () => {
    render(<ProjectCard project={mockProject} />, { wrapper })
    expect(screen.getByText('Test Project')).toBeInTheDocument()
  })

  it('renders project icon', () => {
    render(<ProjectCard project={mockProject} />, { wrapper })
    const icon = screen.getByRole('img', { name: /project icon/i })
    expect(icon).toHaveTextContent('📁')
  })

  it('renders project description when provided', () => {
    render(<ProjectCard project={mockProject} />, { wrapper })
    expect(screen.getByText('Test project description')).toBeInTheDocument()
  })

  it('does not render description section when not provided', () => {
    const projectWithoutDescription = { ...mockProject, description: null }
    render(<ProjectCard project={projectWithoutDescription} />)
    expect(screen.queryByText('Test project description')).not.toBeInTheDocument()
  })

  it('renders project with correct structure', () => {
    const { container } = render(<ProjectCard project={mockProject} />, { wrapper })
    // Verify the component renders with project data
    expect(container).toBeInTheDocument()
    expect(screen.getByText('Test Project')).toBeInTheDocument()
  })

  it('shows settings button', () => {
    render(<ProjectCard project={mockProject} />, { wrapper })
    const settingsButton = screen.getByRole('button', {
      name: /paramètres du projet/i,
    })
    expect(settingsButton).toBeInTheDocument()
  })

  it('truncates long project names', () => {
    const projectWithLongName = {
      ...mockProject,
      name: 'This is a very long project name that should be truncated',
    }
    const { container } = render(<ProjectCard project={projectWithLongName} />)
    const titleElement = container.querySelector('.line-clamp-1')
    expect(titleElement).toBeInTheDocument()
  })

  it('truncates long descriptions', () => {
    const projectWithLongDescription = {
      ...mockProject,
      description:
        'This is a very long description that should be truncated to only two lines maximum to avoid taking too much space',
    }
    const { container } = render(<ProjectCard project={projectWithLongDescription} />)
    const descElement = container.querySelector('.line-clamp-2')
    expect(descElement).toBeInTheDocument()
  })
})
