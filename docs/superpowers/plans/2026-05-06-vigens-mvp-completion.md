# Vigens MVP Completion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete 5 missing MVP features: subtasks, budget tracking, document management, keyboard shortcuts, and Google Calendar sync.

**Architecture:** Sequential implementation following Big Bang Sequential approach. Each feature fully implemented and tested before moving to the next. Optimistic updates with TanStack Query, Zustand state management, component-based architecture.

**Tech Stack:** Next.js 16, TypeScript, Supabase, Zustand, TanStack Query, React Hook Form, Zod, cmdk, googleapis

---

## File Structure Overview

### Phase 1: Subtasks
```
components/tasks/
├── subtask-list.tsx          # NEW: Expandable subtasks list
├── subtask-item.tsx          # NEW: Individual subtask with checkbox
└── add-subtask-input.tsx     # NEW: Inline input to add subtask

lib/hooks/
└── use-subtasks.ts           # NEW: Query + mutations for subtasks

components/kanban/
└── task-card.tsx             # MODIFY: Add subtask badge
```

### Phase 2: Budget Tracking
```
components/dashboard/
├── budget-snapshot-card.tsx      # NEW: Global budget aggregation
└── budget-progress-bar.tsx       # NEW: Reusable progress bar

components/projects/
├── project-budget-display.tsx    # NEW: Mini budget in ProjectCard
└── project-budget-form.tsx       # MODIFY: Add budget input in settings

components/tasks/
└── task-cost-input.tsx          # MODIFY: Add cost field in TaskForm

lib/hooks/
└── use-budget.ts                # NEW: Budget calculations hook
```

### Phase 3: Document Management
```
components/documents/
├── document-tabs.tsx          # NEW: Tabs container Files | Links
├── file-upload.tsx            # NEW: Drag-drop file upload
├── file-list.tsx              # NEW: List of uploaded files
├── file-item.tsx              # NEW: File item with actions
├── link-form.tsx              # NEW: Add/edit link form
├── link-list.tsx              # NEW: List of links
└── link-item.tsx              # NEW: Link item with favicon

lib/hooks/
├── use-files.ts               # NEW: Files query + mutations
└── use-links.ts               # NEW: Links query + mutations

app/(dashboard)/projects/[id]/settings/
└── page.tsx                   # MODIFY: Add documents tab
```

### Phase 4: Keyboard Shortcuts
```
components/
├── command-palette.tsx               # NEW: Cmd+K palette
├── keyboard-shortcuts-dialog.tsx     # NEW: Shortcuts help modal
└── keyboard-shortcuts-trigger.tsx    # NEW: Trigger button

lib/hooks/
└── use-keyboard-shortcuts.ts         # NEW: Global shortcuts hook

lib/stores/
└── ui-store.ts                       # MODIFY: Add dialog states
```

### Phase 5: Google Calendar
```
app/api/calendar/
├── auth/route.ts          # NEW: OAuth callback
├── sync/route.ts          # NEW: Sync endpoint
├── calendars/route.ts     # NEW: List calendars
└── disconnect/route.ts    # NEW: Disconnect

components/settings/
└── calendar-settings.tsx   # NEW: Calendar settings panel

lib/calendar/
├── google-calendar.ts      # NEW: Google API client
└── sync-helpers.ts         # NEW: Sync helper functions

lib/hooks/
└── use-tasks.ts           # MODIFY: Add calendar sync triggers
```

---

## Phase 1: Subtasks

### Task 1: Create Subtasks Hook

**Files:**
- Create: `lib/hooks/use-subtasks.ts`

- [ ] **Step 1: Write the test file**

Create `__tests__/hooks/use-subtasks.test.tsx`:

```typescript
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useSubtasks } from '@/lib/hooks/use-subtasks'
import { createClient } from '@/lib/supabase/client'

jest.mock('@/lib/supabase/client')

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  })
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

describe('useSubtasks', () => {
  const mockSubtasks = [
    { id: '1', task_id: 'task-1', title: 'Subtask 1', completed: false, position: 0 },
    { id: '2', task_id: 'task-1', title: 'Subtask 2', completed: true, position: 1 }
  ]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('fetches subtasks for a task', async () => {
    const mockFrom = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: mockSubtasks,
            error: null
          })
        })
      })
    })

    ;(createClient as jest.Mock).mockReturnValue({ from: mockFrom })

    const { result } = renderHook(() => useSubtasks('task-1'), { wrapper })

    await waitFor(() => {
      expect(result.current.subtasks).toEqual(mockSubtasks)
    })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- use-subtasks.test.tsx
```

Expected: FAIL - `useSubtasks` is not defined

- [ ] **Step 3: Implement the hook**

Create `lib/hooks/use-subtasks.ts`:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database.types'
import { toast } from 'sonner'

type Subtask = Database['public']['Tables']['subtasks']['Row']
type SubtaskInsert = Database['public']['Tables']['subtasks']['Insert']
type SubtaskUpdate = Database['public']['Tables']['subtasks']['Update']

export function useSubtasks(taskId: string) {
  const supabase = createClient()
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['subtasks', taskId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subtasks')
        .select('*')
        .eq('task_id', taskId)
        .order('position', { ascending: true })

      if (error) throw error
      return data as Subtask[]
    },
    enabled: !!taskId,
  })

  const createSubtask = useMutation({
    mutationFn: async (subtask: SubtaskInsert) => {
      const { data, error } = await supabase
        .from('subtasks')
        .insert(subtask)
        .select()
        .single()

      if (error) throw error
      return data as Subtask
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subtasks', taskId] })
      toast.success('Sous-tâche ajoutée')
    },
    onError: () => {
      toast.error('Erreur lors de l\'ajout de la sous-tâche')
    },
  })

  const updateSubtask = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: SubtaskUpdate }) => {
      const { data, error } = await supabase
        .from('subtasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as Subtask
    },
    onMutate: async ({ id, updates }) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['subtasks', taskId] })

      const previousSubtasks = queryClient.getQueryData<Subtask[]>(['subtasks', taskId])

      queryClient.setQueryData<Subtask[]>(['subtasks', taskId], (old) =>
        old?.map((s) => (s.id === id ? { ...s, ...updates } : s)) || []
      )

      return { previousSubtasks }
    },
    onError: (err, variables, context) => {
      if (context?.previousSubtasks) {
        queryClient.setQueryData(['subtasks', taskId], context.previousSubtasks)
      }
      toast.error('Erreur lors de la mise à jour')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subtasks', taskId] })
    },
  })

  const deleteSubtask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('subtasks')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['subtasks', taskId] })

      const previousSubtasks = queryClient.getQueryData<Subtask[]>(['subtasks', taskId])

      queryClient.setQueryData<Subtask[]>(['subtasks', taskId], (old) =>
        old?.filter((s) => s.id !== id) || []
      )

      return { previousSubtasks }
    },
    onError: (err, variables, context) => {
      if (context?.previousSubtasks) {
        queryClient.setQueryData(['subtasks', taskId], context.previousSubtasks)
      }
      toast.error('Erreur lors de la suppression')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subtasks', taskId] })
      toast.success('Sous-tâche supprimée')
    },
  })

  return {
    subtasks: query.data ?? [],
    isLoading: query.isLoading,
    createSubtask,
    updateSubtask,
    deleteSubtask,
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- use-subtasks.test.tsx
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/hooks/use-subtasks.ts __tests__/hooks/use-subtasks.test.tsx
git commit -m "feat: add useSubtasks hook with optimistic updates

- Create/update/delete subtasks
- TanStack Query caching
- Optimistic UI updates with rollback
- Toast notifications

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 2: Create AddSubtaskInput Component

**Files:**
- Create: `components/tasks/add-subtask-input.tsx`
- Create: `__tests__/components/tasks/add-subtask-input.test.tsx`

- [ ] **Step 1: Write the component test**

Create `__tests__/components/tasks/add-subtask-input.test.tsx`:

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AddSubtaskInput } from '@/components/tasks/add-subtask-input'

describe('AddSubtaskInput', () => {
  const mockOnAdd = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
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
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- add-subtask-input.test.tsx
```

Expected: FAIL - Component not found

- [ ] **Step 3: Implement the component**

Create `components/tasks/add-subtask-input.tsx`:

```typescript
'use client'

import { useState, KeyboardEvent } from 'react'

interface AddSubtaskInputProps {
  onAdd: (title: string) => void
  disabled?: boolean
}

export function AddSubtaskInput({ onAdd, disabled }: AddSubtaskInputProps) {
  const [value, setValue] = useState('')

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && value.trim()) {
      e.preventDefault()
      onAdd(value.trim())
      setValue('')
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setValue('')
    }
  }

  return (
    <input
      type="text"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={handleKeyDown}
      placeholder="Ajouter une sous-tâche..."
      disabled={disabled}
      className="w-full px-3 py-2 text-sm bg-background border border-border rounded-sm focus-ring placeholder:text-text-secondary disabled:opacity-50"
    />
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- add-subtask-input.test.tsx
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add components/tasks/add-subtask-input.tsx __tests__/components/tasks/add-subtask-input.test.tsx
git commit -m "feat: add AddSubtaskInput component

- Input with Enter to submit
- Escape to clear
- Empty value prevention
- Keyboard navigation support

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 3: Create SubtaskItem Component

**Files:**
- Create: `components/tasks/subtask-item.tsx`
- Create: `__tests__/components/tasks/subtask-item.test.tsx`

- [ ] **Step 1: Write the component test**

Create `__tests__/components/tasks/subtask-item.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SubtaskItem } from '@/components/tasks/subtask-item'

describe('SubtaskItem', () => {
  const mockSubtask = {
    id: '1',
    task_id: 'task-1',
    title: 'Test subtask',
    completed: false,
    position: 0,
    created_at: '2026-05-06T00:00:00Z'
  }

  const mockOnToggle = jest.fn()
  const mockOnDelete = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders subtask title', () => {
    render(
      <SubtaskItem
        subtask={mockSubtask}
        onToggle={mockOnToggle}
        onDelete={mockOnDelete}
      />
    )

    expect(screen.getByText('Test subtask')).toBeInTheDocument()
  })

  it('shows unchecked checkbox for incomplete subtask', () => {
    render(
      <SubtaskItem
        subtask={mockSubtask}
        onToggle={mockOnToggle}
        onDelete={mockOnDelete}
      />
    )

    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).not.toBeChecked()
  })

  it('shows checked checkbox for completed subtask', () => {
    const completedSubtask = { ...mockSubtask, completed: true }
    render(
      <SubtaskItem
        subtask={completedSubtask}
        onToggle={mockOnToggle}
        onDelete={mockOnDelete}
      />
    )

    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).toBeChecked()
  })

  it('calls onToggle when checkbox is clicked', async () => {
    const user = userEvent.setup()
    render(
      <SubtaskItem
        subtask={mockSubtask}
        onToggle={mockOnToggle}
        onDelete={mockOnDelete}
      />
    )

    const checkbox = screen.getByRole('checkbox')
    await user.click(checkbox)

    expect(mockOnToggle).toHaveBeenCalledWith('1', true)
  })

  it('calls onDelete when delete button is clicked', async () => {
    const user = userEvent.setup()
    render(
      <SubtaskItem
        subtask={mockSubtask}
        onToggle={mockOnToggle}
        onDelete={mockOnDelete}
      />
    )

    const deleteButton = screen.getByLabelText('Delete subtask')
    await user.click(deleteButton)

    expect(mockOnDelete).toHaveBeenCalledWith('1')
  })

  it('applies strikethrough to completed subtask title', () => {
    const completedSubtask = { ...mockSubtask, completed: true }
    render(
      <SubtaskItem
        subtask={completedSubtask}
        onToggle={mockOnToggle}
        onDelete={mockOnDelete}
      />
    )

    const title = screen.getByText('Test subtask')
    expect(title).toHaveClass('line-through')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- subtask-item.test.tsx
```

Expected: FAIL - Component not found

- [ ] **Step 3: Implement the component**

Create `components/tasks/subtask-item.tsx`:

```typescript
'use client'

import { X } from 'lucide-react'
import type { Database } from '@/types/database.types'

type Subtask = Database['public']['Tables']['subtasks']['Row']

interface SubtaskItemProps {
  subtask: Subtask
  onToggle: (id: string, completed: boolean) => void
  onDelete: (id: string) => void
}

export function SubtaskItem({ subtask, onToggle, onDelete }: SubtaskItemProps) {
  return (
    <div className="group flex items-center gap-2 py-1.5 hover:bg-card/50 px-2 rounded">
      <input
        type="checkbox"
        checked={subtask.completed}
        onChange={(e) => onToggle(subtask.id, e.target.checked)}
        className="w-4 h-4 rounded border-border bg-background checked:bg-accent-blue focus-ring"
      />

      <span
        className={`flex-1 text-sm ${
          subtask.completed ? 'line-through text-text-secondary' : 'text-text-primary'
        }`}
      >
        {subtask.title}
      </span>

      <button
        onClick={() => onDelete(subtask.id)}
        aria-label="Delete subtask"
        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-background rounded transition-opacity"
      >
        <X className="w-3.5 h-3.5 text-text-secondary hover:text-error" />
      </button>
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- subtask-item.test.tsx
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add components/tasks/subtask-item.tsx __tests__/components/tasks/subtask-item.test.tsx
git commit -m "feat: add SubtaskItem component

- Checkbox toggle for completion
- Delete button on hover
- Strikethrough for completed items
- Keyboard accessible

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 4: Create SubtaskList Component

**Files:**
- Create: `components/tasks/subtask-list.tsx`
- Create: `__tests__/components/tasks/subtask-list.test.tsx`

- [ ] **Step 1: Write the component test**

Create `__tests__/components/tasks/subtask-list.test.tsx`:

```typescript
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SubtaskList } from '@/components/tasks/subtask-list'
import { useSubtasks } from '@/lib/hooks/use-subtasks'

jest.mock('@/lib/hooks/use-subtasks')

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient()
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

describe('SubtaskList', () => {
  const mockSubtasks = [
    { id: '1', task_id: 'task-1', title: 'Subtask 1', completed: false, position: 0, created_at: '' },
    { id: '2', task_id: 'task-1', title: 'Subtask 2', completed: true, position: 1, created_at: '' },
    { id: '3', task_id: 'task-1', title: 'Subtask 3', completed: true, position: 2, created_at: '' }
  ]

  const mockUseSubtasks = {
    subtasks: mockSubtasks,
    isLoading: false,
    createSubtask: { mutate: jest.fn() },
    updateSubtask: { mutate: jest.fn() },
    deleteSubtask: { mutate: jest.fn() }
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useSubtasks as jest.Mock).mockReturnValue(mockUseSubtasks)
  })

  it('displays correct progress count', () => {
    render(<SubtaskList taskId="task-1" />, { wrapper })
    expect(screen.getByText('✓ 2/3')).toBeInTheDocument()
  })

  it('expands and shows subtasks when clicked', async () => {
    const user = userEvent.setup()
    render(<SubtaskList taskId="task-1" />, { wrapper })

    const header = screen.getByText(/Sous-tâches/)
    await user.click(header)

    await waitFor(() => {
      expect(screen.getByText('Subtask 1')).toBeInTheDocument()
      expect(screen.getByText('Subtask 2')).toBeInTheDocument()
      expect(screen.getByText('Subtask 3')).toBeInTheDocument()
    })
  })

  it('shows green badge when all completed', () => {
    const allCompleted = mockSubtasks.map(s => ({ ...s, completed: true }))
    ;(useSubtasks as jest.Mock).mockReturnValue({
      ...mockUseSubtasks,
      subtasks: allCompleted
    })

    render(<SubtaskList taskId="task-1" />, { wrapper })
    const badge = screen.getByText('✓ 3/3')
    expect(badge).toHaveClass('text-success')
  })

  it('shows orange badge when partially completed', () => {
    render(<SubtaskList taskId="task-1" />, { wrapper })
    const badge = screen.getByText('✓ 2/3')
    expect(badge).toHaveClass('text-warning')
  })

  it('shows gray badge when none completed', () => {
    const noneCompleted = mockSubtasks.map(s => ({ ...s, completed: false }))
    ;(useSubtasks as jest.Mock).mockReturnValue({
      ...mockUseSubtasks,
      subtasks: noneCompleted
    })

    render(<SubtaskList taskId="task-1" />, { wrapper })
    const badge = screen.getByText('✓ 0/3')
    expect(badge).toHaveClass('text-text-secondary')
  })

  it('shows empty state when no subtasks', () => {
    ;(useSubtasks as jest.Mock).mockReturnValue({
      ...mockUseSubtasks,
      subtasks: []
    })

    const user = userEvent.setup()
    render(<SubtaskList taskId="task-1" />, { wrapper })

    const header = screen.getByText(/Sous-tâches/)
    user.click(header)

    waitFor(() => {
      expect(screen.getByText('Aucune sous-tâche')).toBeInTheDocument()
    })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- subtask-list.test.tsx
```

Expected: FAIL - Component not found

- [ ] **Step 3: Implement the component**

Create `components/tasks/subtask-list.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { useSubtasks } from '@/lib/hooks/use-subtasks'
import { SubtaskItem } from './subtask-item'
import { AddSubtaskInput } from './add-subtask-input'

interface SubtaskListProps {
  taskId: string
}

export function SubtaskList({ taskId }: SubtaskListProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const { subtasks, isLoading, createSubtask, updateSubtask, deleteSubtask } = useSubtasks(taskId)

  const completedCount = subtasks.filter(s => s.completed).length
  const totalCount = subtasks.length

  const getBadgeColor = () => {
    if (totalCount === 0) return 'text-text-secondary'
    if (completedCount === totalCount) return 'text-success'
    if (completedCount > 0) return 'text-warning'
    return 'text-text-secondary'
  }

  const handleAddSubtask = (title: string) => {
    createSubtask.mutate({
      task_id: taskId,
      title,
      completed: false,
      position: subtasks.length
    })
  }

  const handleToggle = (id: string, completed: boolean) => {
    updateSubtask.mutate({ id, updates: { completed } })
  }

  const handleDelete = (id: string) => {
    deleteSubtask.mutate(id)
  }

  return (
    <div className="border-t border-border pt-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 w-full text-left hover:bg-card/50 p-2 rounded transition-colors"
      >
        <ChevronRight
          className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
        />
        <span className="text-sm font-medium">Sous-tâches ({totalCount})</span>
        {totalCount > 0 && (
          <span className={`text-xs font-medium ${getBadgeColor()}`}>
            ✓ {completedCount}/{totalCount}
          </span>
        )}
      </button>

      {isExpanded && (
        <div className="mt-2 space-y-1">
          {totalCount === 0 ? (
            <p className="text-sm text-text-secondary px-2 py-4 text-center">
              Aucune sous-tâche
            </p>
          ) : (
            subtasks.map(subtask => (
              <SubtaskItem
                key={subtask.id}
                subtask={subtask}
                onToggle={handleToggle}
                onDelete={handleDelete}
              />
            ))
          )}

          <div className="pt-2">
            <AddSubtaskInput
              onAdd={handleAddSubtask}
              disabled={createSubtask.isPending}
            />
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- subtask-list.test.tsx
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add components/tasks/subtask-list.tsx __tests__/components/tasks/subtask-list.test.tsx
git commit -m "feat: add SubtaskList component

- Expandable list with chevron icon
- Progress badge with color coding
- Empty state message
- Integrates SubtaskItem and AddSubtaskInput

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 5: Integrate Subtasks into TaskDetailDialog

**Files:**
- Modify: `components/tasks/task-details-dialog.tsx`

- [ ] **Step 1: Add SubtaskList to TaskDetailDialog**

Modify `components/tasks/task-details-dialog.tsx`:

Find the section after task form fields and before the footer, add:

```typescript
import { SubtaskList } from './subtask-list'

// Inside the DialogContent, after the task form fields:
<SubtaskList taskId={task.id} />
```

Complete modified section (approximately line 80-100):

```typescript
<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
  <DialogHeader>
    <DialogTitle>Détails de la tâche</DialogTitle>
  </DialogHeader>

  {/* Existing task form fields */}
  <TaskForm
    task={task}
    onSubmit={handleSubmit}
    onDelete={handleDelete}
  />

  {/* NEW: Add SubtaskList */}
  <SubtaskList taskId={task.id} />

  <DialogFooter>
    {/* Existing footer buttons */}
  </DialogFooter>
</DialogContent>
```

- [ ] **Step 2: Test manually**

```bash
npm run dev
```

Manual test:
1. Navigate to a project board
2. Click on a task to open detail dialog
3. Verify "Sous-tâches (0)" section appears
4. Click to expand
5. Add a subtask
6. Verify it appears in the list
7. Toggle completion
8. Delete subtask

Expected: All operations work smoothly

- [ ] **Step 3: Commit**

```bash
git add components/tasks/task-details-dialog.tsx
git commit -m "feat: integrate SubtaskList into TaskDetailDialog

- Add subtasks section in task details
- Position after form fields
- Full CRUD functionality available

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 6: Add Subtask Badge to TaskCard

**Files:**
- Modify: `components/kanban/task-card.tsx`

- [ ] **Step 1: Add subtask fetching and badge display**

Modify `components/kanban/task-card.tsx`:

Add import and hook:

```typescript
import { useSubtasks } from '@/lib/hooks/use-subtasks'

export function TaskCard({ task, ...props }: TaskCardProps) {
  const { subtasks } = useSubtasks(task.id)

  const completedCount = subtasks.filter(s => s.completed).length
  const totalCount = subtasks.length
  const hasSubtasks = totalCount > 0

  const getBadgeColor = () => {
    if (completedCount === totalCount) return 'text-success bg-success/10'
    if (completedCount > 0) return 'text-warning bg-warning/10'
    return 'text-text-secondary bg-card'
  }

  // Rest of component...
}
```

Add badge in the card layout (typically after priority badge, before cost):

```typescript
<div className="flex items-center gap-2 mt-2 flex-wrap">
  {/* Existing priority badge */}
  {task.priority && (
    <span className={`text-xs px-2 py-0.5 rounded ${getPriorityColor(task.priority)}`}>
      {task.priority}
    </span>
  )}

  {/* NEW: Subtask badge */}
  {hasSubtasks && (
    <span className={`text-xs px-2 py-0.5 rounded font-medium ${getBadgeColor()}`}>
      ✓ {completedCount}/{totalCount}
    </span>
  )}

  {/* Existing cost badge */}
  {task.cost && (
    <span className="text-xs px-2 py-0.5 rounded bg-accent-blue/10 text-accent-blue">
      €{task.cost}
    </span>
  )}
</div>
```

- [ ] **Step 2: Test manually**

```bash
npm run dev
```

Manual test:
1. Open a project board
2. Click on a task with subtasks
3. Add subtasks and mark some complete
4. Close dialog
5. Verify badge appears on task card with correct count and color

Expected: Badge displays correctly with proper colors

- [ ] **Step 3: Commit**

```bash
git add components/kanban/task-card.tsx
git commit -m "feat: add subtask progress badge to TaskCard

- Display ✓ X/Y badge when subtasks exist
- Color coding: green (100%), orange (partial), gray (0%)
- Positioned with other badges

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 7: Write E2E Test for Subtasks

**Files:**
- Create: `e2e/subtasks.spec.ts`

- [ ] **Step 1: Write E2E test**

Create `e2e/subtasks.spec.ts`:

```typescript
import { test, expect } from '@playwright/test'

test.describe('Subtasks', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login')
    await page.fill('[name="email"]', process.env.TEST_USER_EMAIL || 'test@example.com')
    await page.fill('[name="password"]', process.env.TEST_USER_PASSWORD || 'password')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')

    // Navigate to a test project
    await page.goto('/projects/test-project-id')
  })

  test('creates, completes, and deletes subtasks', async ({ page }) => {
    // Open first task
    await page.click('.task-card').first()
    await expect(page.locator('text=Détails de la tâche')).toBeVisible()

    // Expand subtasks section
    await page.click('text=Sous-tâches')

    // Add first subtask
    await page.fill('input[placeholder="Ajouter une sous-tâche..."]', 'First subtask')
    await page.keyboard.press('Enter')
    await expect(page.locator('text=First subtask')).toBeVisible()

    // Verify badge shows 0/1
    await expect(page.locator('text=✓ 0/1')).toBeVisible()

    // Add second subtask
    await page.fill('input[placeholder="Ajouter une sous-tâche..."]', 'Second subtask')
    await page.keyboard.press('Enter')
    await expect(page.locator('text=Second subtask')).toBeVisible()

    // Verify badge shows 0/2
    await expect(page.locator('text=✓ 0/2')).toBeVisible()

    // Complete first subtask
    await page.click('text=First subtask >> .. >> input[type="checkbox"]')
    await expect(page.locator('text=✓ 1/2')).toBeVisible()

    // Complete second subtask
    await page.click('text=Second subtask >> .. >> input[type="checkbox"]')
    await expect(page.locator('text=✓ 2/2')).toBeVisible()

    // Delete first subtask
    await page.hover('text=First subtask')
    await page.click('text=First subtask >> .. >> button[aria-label="Delete subtask"]')
    await expect(page.locator('text=First subtask')).not.toBeVisible()
    await expect(page.locator('text=✓ 1/1')).toBeVisible()

    // Close dialog
    await page.keyboard.press('Escape')

    // Verify badge appears on task card
    await expect(page.locator('.task-card >> text=✓ 1/1').first()).toBeVisible()
  })

  test('shows correct badge colors', async ({ page }) => {
    await page.click('.task-card').first()
    await page.click('text=Sous-tâches')

    // Add 3 subtasks
    for (let i = 1; i <= 3; i++) {
      await page.fill('input[placeholder="Ajouter une sous-tâche..."]', `Subtask ${i}`)
      await page.keyboard.press('Enter')
    }

    // 0/3 - gray
    const badge0 = page.locator('text=✓ 0/3')
    await expect(badge0).toHaveClass(/text-text-secondary/)

    // Complete 1 - orange
    await page.click('text=Subtask 1 >> .. >> input[type="checkbox"]')
    const badge1 = page.locator('text=✓ 1/3')
    await expect(badge1).toHaveClass(/text-warning/)

    // Complete all - green
    await page.click('text=Subtask 2 >> .. >> input[type="checkbox"]')
    await page.click('text=Subtask 3 >> .. >> input[type="checkbox"]')
    const badge3 = page.locator('text=✓ 3/3')
    await expect(badge3).toHaveClass(/text-success/)
  })
})
```

- [ ] **Step 2: Run E2E test**

```bash
npm run test:e2e -- subtasks.spec.ts
```

Expected: PASS (may need to adjust selectors based on actual markup)

- [ ] **Step 3: Commit**

```bash
git add e2e/subtasks.spec.ts
git commit -m "test: add E2E tests for subtasks feature

- Test create/complete/delete flow
- Verify badge display and colors
- Test TaskCard badge integration

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Phase 2: Budget Tracking

### Task 8: Create Budget Calculations Hook

**Files:**
- Create: `lib/hooks/use-budget.ts`
- Create: `__tests__/hooks/use-budget.test.tsx`

- [ ] **Step 1: Write the test**

Create `__tests__/hooks/use-budget.test.tsx`:

```typescript
import { renderHook } from '@testing-library/react'
import { useBudget } from '@/lib/hooks/use-budget'
import { useProjects } from '@/lib/hooks/use-projects'
import { useTasks } from '@/lib/hooks/use-tasks'

jest.mock('@/lib/hooks/use-projects')
jest.mock('@/lib/hooks/use-tasks')

describe('useBudget', () => {
  const mockProjects = [
    { id: '1', name: 'Project A', budget: 1000, user_id: 'user-1', tags: [], column_names: {}, created_at: '', updated_at: '' },
    { id: '2', name: 'Project B', budget: 2000, user_id: 'user-1', tags: [], column_names: {}, created_at: '', updated_at: '' },
    { id: '3', name: 'Project C', budget: null, user_id: 'user-1', tags: [], column_names: {}, created_at: '', updated_at: '' }
  ]

  const mockTasks = [
    { id: 't1', project_id: '1', cost: 400, title: '', status: 'todo', priority: null, assigned_to: null, due_date: null, position: null, calendar_event_id: null, description: null, created_at: '', updated_at: '' },
    { id: 't2', project_id: '1', cost: 300, title: '', status: 'todo', priority: null, assigned_to: null, due_date: null, position: null, calendar_event_id: null, description: null, created_at: '', updated_at: '' },
    { id: 't3', project_id: '2', cost: 1500, title: '', status: 'todo', priority: null, assigned_to: null, due_date: null, position: null, calendar_event_id: null, description: null, created_at: '', updated_at: '' },
    { id: 't4', project_id: '2', cost: null, title: '', status: 'todo', priority: null, assigned_to: null, due_date: null, position: null, calendar_event_id: null, description: null, created_at: '', updated_at: '' },
    { id: 't5', project_id: '3', cost: 200, title: '', status: 'todo', priority: null, assigned_to: null, due_date: null, position: null, calendar_event_id: null, description: null, created_at: '', updated_at: '' }
  ]

  beforeEach(() => {
    ;(useProjects as jest.Mock).mockReturnValue({ projects: mockProjects })
    ;(useTasks as jest.Mock).mockReturnValue({ tasks: mockTasks })
  })

  it('calculates total budget correctly', () => {
    const { result } = renderHook(() => useBudget())

    expect(result.current.totalBudget).toBe(3000) // 1000 + 2000, excludes null
  })

  it('calculates total spent correctly', () => {
    const { result } = renderHook(() => useBudget())

    expect(result.current.totalSpent).toBe(2400) // 400 + 300 + 1500 + 200
  })

  it('calculates remaining correctly', () => {
    const { result } = renderHook(() => useBudget())

    expect(result.current.remaining).toBe(600) // 3000 - 2400
  })

  it('calculates percentage correctly', () => {
    const { result } = renderHook(() => useBudget())

    expect(result.current.percentage).toBe(80) // (2400 / 3000) * 100
  })

  it('calculates spent per project', () => {
    const { result } = renderHook(() => useBudget())

    const project1 = result.current.projectsWithBudget.find(p => p.id === '1')
    const project2 = result.current.projectsWithBudget.find(p => p.id === '2')

    expect(project1?.spent).toBe(700) // 400 + 300
    expect(project2?.spent).toBe(1500)
  })

  it('returns top 3 spenders', () => {
    const { result } = renderHook(() => useBudget())

    expect(result.current.top3).toHaveLength(2) // Only 2 projects have budgets
    expect(result.current.top3[0].id).toBe('2') // Project B (1500 spent)
    expect(result.current.top3[1].id).toBe('1') // Project A (700 spent)
  })

  it('sets status based on percentage', () => {
    const { result } = renderHook(() => useBudget())

    const project1 = result.current.projectsWithBudget.find(p => p.id === '1')
    const project2 = result.current.projectsWithBudget.find(p => p.id === '2')

    expect(project1?.status).toBe('ok') // 70% < 80%
    expect(project2?.status).toBe('warning') // 75% >= 80% and < 100%
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- use-budget.test.tsx
```

Expected: FAIL - useBudget not defined

- [ ] **Step 3: Implement the hook**

Create `lib/hooks/use-budget.ts`:

```typescript
import { useMemo } from 'react'
import { useProjects } from './use-projects'
import { useTasks } from './use-tasks'
import type { Project } from '@/types/database.types'

interface ProjectWithBudget extends Project {
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
    // Calculate spent per project
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

    // Calculate totals
    const totalBudget = projectsWithBudget.reduce((sum, p) => sum + (p.budget || 0), 0)
    const totalSpent = projectsWithBudget.reduce((sum, p) => sum + p.spent, 0)
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
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- use-budget.test.tsx
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/hooks/use-budget.ts __tests__/hooks/use-budget.test.tsx
git commit -m "feat: add useBudget hook for budget calculations

- Calculate total budget and spent across projects
- Compute per-project spent and percentage
- Determine status (ok/warning/over)
- Return top 3 spenders sorted

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

**Due to length constraints, I'll create a summary of remaining tasks. The full plan follows the same pattern:**

### Remaining Tasks Summary:

**Phase 2 (Budget) - Tasks 9-14:**
- Task 9: Create BudgetProgressBar component
- Task 10: Create BudgetSnapshotCard component
- Task 11: Add cost input to TaskForm
- Task 12: Add budget input to ProjectSettings
- Task 13: Add budget display to ProjectCard
- Task 14: E2E tests for budget tracking

**Phase 3 (Documents) - Tasks 15-22:**
- Task 15: Create use-files hook
- Task 16: Create use-links hook
- Task 17: Create FileUpload component
- Task 18: Create FileList and FileItem components
- Task 19: Create LinkForm component
- Task 20: Create LinkList and LinkItem components
- Task 21: Create DocumentTabs component
- Task 22: Integrate documents into project settings + E2E tests

**Phase 4 (Keyboard Shortcuts) - Tasks 23-27:**
- Task 23: Install cmdk and create useKeyboardShortcuts hook
- Task 24: Create CommandPalette component
- Task 25: Create KeyboardShortcutsDialog component
- Task 26: Add shortcuts trigger to dashboard
- Task 27: E2E tests for keyboard navigation

**Phase 5 (Google Calendar) - Tasks 28-35:**
- Task 28: Setup Google OAuth credentials
- Task 29: Create calendar sync helpers
- Task 30: Create /api/calendar/auth route
- Task 31: Create /api/calendar/sync route
- Task 32: Create /api/calendar/calendars route
- Task 33: Create /api/calendar/disconnect route
- Task 34: Create CalendarSettings component
- Task 35: Integrate sync into task mutations + E2E tests

Each task follows the TDD pattern: test → fail → implement → pass → commit.

Would you like me to continue with the full detailed plan for all remaining tasks?
