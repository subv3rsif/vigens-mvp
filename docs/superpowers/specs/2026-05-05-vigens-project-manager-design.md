# Vigens - Personal Project Management Command Center

**Date:** 2026-05-05
**Type:** Full-stack PWA
**Status:** Design Approved

---

## Product Vision

Vigens is a minimalist, fast, dark-mode-first project management web app designed for solo managers who need to manage multiple projects, assign tasks to collaborators, track progress and expenses. This is NOT a team collaboration tool - it's a **personal command center** focused on radical simplicity, zero clutter, and instant understanding.

### Core Philosophy

- Radical simplicity
- Zero clutter
- Instant understanding (no learning curve)
- Every screen answers: "what should I do next?"
- Speed above all (Linear-style UX)

### Inspiration

- **Notion** - clean UI
- **Trello** - Kanban clarity
- **Linear** - speed & keyboard UX

---

## Design Decisions (Locked)

### Authentication
- **Email + password** with Supabase Auth
- Simple login/signup flow
- No magic links, no OAuth (except Google for Calendar)

### Visual Style
- **Dark mode first** (#0f0f0f background)
- **Subtle blue/purple accents** (#3b82f6, #8b5cf6) for borders and highlights
- Notion-style sophistication
- Generous spacing, minimal text

### Kanban System
- **Fixed 3-column** system (Todo / Doing / Done)
- Columns are **renameable** per project
- No custom column creation (keeps it simple)

### Project Tags
- **Freeform tags** (audiovisual, web, communication, etc.)
- Autocomplete from previously used tags
- No predefined categories

### Dashboard Layout
- **3-column triptych**: Focus Today | At Risk | Budget Snapshot
- Equal visual weight for all three sections
- Desktop-optimized, stacks vertically on mobile

### Mobile Experience
- **Full feature parity** with desktop
- Well-adapted responsive design (not just shrunk desktop)
- Same editing capabilities everywhere
- Dashboard columns stack vertically
- Kanban swipes horizontally

### Subtasks
- **Expandable with count indicator**
- 1 level deep only
- Shows "✓ 2/5" when collapsed
- Click to expand inline checklist

### Document Storage
- **Two tabs**: Files | Links
- Files uploaded to Supabase Storage
- Links stored in database with title + URL

---

## Technical Architecture

### Tech Stack

**Frontend:**
- Next.js 15 (App Router)
- TypeScript (strict mode)
- Tailwind CSS (custom dark theme)
- Zustand (state management)
- TanStack Query (server state & caching)
- @hello-pangea/dnd (Kanban drag-and-drop)
- React Hook Form + Zod (forms & validation)
- Sonner (toast notifications)
- date-fns (date handling)

**Backend:**
- Supabase Auth (email/password)
- Supabase Database (PostgreSQL)
- Supabase Storage (file uploads)
- Supabase RLS (row-level security)

**Deployment:**
- Vercel (zero-config deployment)
- PWA with service worker (next-pwa)

**Integrations:**
- Google Calendar API (one-way sync: tasks → calendar)

### Architectural Approach

**Client-Heavy SPA Architecture:**

- Direct Supabase client from browser
- Zustand for local state management
- TanStack Query for server state caching
- Optimistic updates everywhere (instant feel)
- Minimal server components (auth checks only)
- RLS for security (fine for personal tool)

**Why Client-Heavy:**
- Instant feel (optimistic updates)
- Best offline support (client-side caching)
- Perfect for PWA architecture
- Smooth drag-and-drop Kanban
- Simpler mental model

**Data Flow:**
```
User Action → Update Zustand (optimistic) →
→ Mutation API → TanStack Query invalidates cache →
→ Refetch → Update Zustand → UI reflects
```

**Error Handling:**
- On error: automatic rollback to previous Zustand state
- Toast notification to user
- Retry mechanism for network errors

---

## Project Structure

```
/app
  /(auth)
    /login              # Login page
    /signup             # Signup page
  /(dashboard)
    /dashboard          # Main landing (3-col triptych)
    /projects
      /[id]             # Kanban view
        /settings       # Project settings (rename columns, budget)
  /api
    /calendar           # Google Calendar webhook/sync
/components
  /ui                   # shadcn/ui base components
  /dashboard            # DashboardCard, FocusToday, AtRisk, BudgetSnapshot
  /kanban               # KanbanBoard, KanbanColumn, TaskCard
  /projects             # ProjectCard, ProjectList, ProjectForm
  /tasks                # TaskForm, TaskDetail, SubtaskChecklist
  /documents            # FileUpload, LinkList, DocumentTabs
/lib
  /supabase             # Supabase client, auth helpers
  /stores               # Zustand stores
  /hooks                # Custom React hooks
  /utils                # Helper functions
/types                  # TypeScript types/interfaces
/public
  /manifest.json        # PWA manifest
  /service-worker.js    # PWA offline support
```

**Routing:**
- `/(dashboard)` routes require auth (middleware check)
- `/(auth)` routes redirect to dashboard if logged in
- Clean URLs: `/dashboard`, `/projects/abc123`

---

## Database Schema

### Tables

**`users`**
```sql
id              uuid PRIMARY KEY (Supabase Auth)
email           text UNIQUE NOT NULL
created_at      timestamptz DEFAULT now()
```

**`projects`**
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id         uuid REFERENCES users(id) ON DELETE CASCADE
name            text NOT NULL
tags            text[] -- freeform tags array
budget          decimal(10,2) NULL
column_names    jsonb DEFAULT '{"todo":"À faire","doing":"En cours","done":"Terminé"}'
created_at      timestamptz DEFAULT now()
updated_at      timestamptz DEFAULT now()
```

**`tasks`**
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
project_id      uuid REFERENCES projects(id) ON DELETE CASCADE
title           text NOT NULL
description     text
status          text NOT NULL CHECK (status IN ('todo','doing','done'))
priority        text CHECK (priority IN ('low','medium','high'))
assigned_to     text -- freeform text, no FK
due_date        date NULL
cost            decimal(10,2) NULL
position        integer -- order within Kanban columns
calendar_event_id text NULL -- Google Calendar event ID
created_at      timestamptz DEFAULT now()
updated_at      timestamptz DEFAULT now()
```

**`subtasks`**
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
task_id         uuid REFERENCES tasks(id) ON DELETE CASCADE
title           text NOT NULL
completed       boolean DEFAULT false
position        integer
created_at      timestamptz DEFAULT now()
```

**`files`**
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
project_id      uuid REFERENCES projects(id) ON DELETE CASCADE
name            text NOT NULL
storage_path    text NOT NULL -- Supabase Storage path
size_bytes      bigint
mime_type       text
created_at      timestamptz DEFAULT now()
```

**`links`**
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
project_id      uuid REFERENCES projects(id) ON DELETE CASCADE
title           text NOT NULL
url             text NOT NULL
description     text
created_at      timestamptz DEFAULT now()
```

**`activity_log`** (optional, lightweight)
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
project_id      uuid REFERENCES projects(id) ON DELETE CASCADE
action          text NOT NULL -- "task_created", "task_completed", etc.
details         jsonb -- flexible metadata
created_at      timestamptz DEFAULT now()
```

**`user_settings`**
```sql
user_id                 uuid PRIMARY KEY REFERENCES users(id)
google_calendar_token   jsonb
google_calendar_enabled boolean DEFAULT false
default_calendar_id     text
keyboard_shortcuts_enabled boolean DEFAULT true
created_at              timestamptz DEFAULT now()
updated_at              timestamptz DEFAULT now()
```

### Indexes

Performance-critical indexes:
```sql
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_tasks_project_status ON tasks(project_id, status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX idx_subtasks_task_id ON subtasks(task_id);
CREATE INDEX idx_files_project_id ON files(project_id);
CREATE INDEX idx_links_project_id ON links(project_id);
```

### Row Level Security (RLS)

**Projects:**
```sql
CREATE POLICY "Users can CRUD own projects"
ON projects FOR ALL
USING (auth.uid() = user_id);
```

**Tasks (inherits via project ownership):**
```sql
CREATE POLICY "Users can CRUD tasks in own projects"
ON tasks FOR ALL
USING (
  project_id IN (
    SELECT id FROM projects WHERE user_id = auth.uid()
  )
);
```

**Subtasks, Files, Links, Activity Log:**
- Same pattern: access via project ownership
- Users can only see/modify data belonging to their projects

### Storage Policies

**Bucket: `project-files`**
```sql
CREATE POLICY "Users own files"
ON storage.objects FOR ALL
USING (
  bucket_id = 'project-files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

**File structure:**
```
project-files/
  {user_id}/
    {project_id}/
      {file_id}-{filename}
```

---

## State Management (Zustand)

### Store Architecture

Multiple Zustand stores separated by domain (better performance, cleaner code).

**`useProjectStore`**
```typescript
interface ProjectStore {
  projects: Project[]
  currentProject: Project | null

  // Actions
  setProjects: (projects: Project[]) => void
  addProject: (project: Project) => void
  updateProject: (id: string, updates: Partial<Project>) => void
  deleteProject: (id: string) => void
  setCurrentProject: (project: Project | null) => void
}
```

**`useTaskStore`**
```typescript
interface TaskStore {
  tasks: Task[]
  selectedTask: Task | null

  // Optimistic actions
  addTask: (task: Task) => void
  updateTask: (id: string, updates: Partial<Task>) => void
  deleteTask: (id: string) => void
  moveTask: (taskId: string, newStatus: string, newPosition: number) => void
  setSelectedTask: (task: Task | null) => void
  reorderTasks: (tasks: Task[]) => void
}
```

**`useUIStore`**
```typescript
interface UIStore {
  isSidebarOpen: boolean
  isTaskDialogOpen: boolean
  isProjectDialogOpen: boolean
  activeView: 'dashboard' | 'kanban' | 'list'

  // Actions
  toggleSidebar: () => void
  openTaskDialog: () => void
  closeTaskDialog: () => void
  setActiveView: (view: string) => void
}
```

**`useAuthStore`**
```typescript
interface AuthStore {
  user: User | null
  session: Session | null

  // Actions
  setUser: (user: User | null) => void
  setSession: (session: Session | null) => void
  signOut: () => void
}
```

### Synchronization Strategy

1. **TanStack Query** manages server cache and sync
2. **Zustand** manages local state and optimistic updates
3. **Flow:**
   - User action → Update Zustand immediately (optimistic)
   - Mutation to Supabase via TanStack Query
   - On success: cache already up-to-date
   - On error: rollback Zustand + show toast

4. **Example (move task in Kanban):**
   ```typescript
   // 1. Immediate update (UI moves instantly)
   moveTask(taskId, 'doing', 5)

   // 2. Async mutation
   updateTaskMutation.mutate({
     id: taskId,
     status: 'doing',
     position: 5
   })

   // 3. On error: automatic rollback + error toast
   ```

### Persistence

**Zustand persist middleware:**
- Persist critical stores to IndexedDB
- Hydrate on app load (offline support)
- Sync with Supabase when online

---

## Authentication & Security

### Authentication Flow

**Signup:**
1. Form: email + password (min 8 chars, Zod validation)
2. `supabase.auth.signUp({ email, password })`
3. Optional email confirmation (can be disabled for simplicity)
4. Auto-redirect to `/dashboard`

**Login:**
1. Form: email + password
2. `supabase.auth.signInWithPassword({ email, password })`
3. Session stored in httpOnly cookie (managed by Supabase)
4. Redirect to `/dashboard`

**Session Persistence:**
- Next.js middleware checks session on every protected route
- Auto-refresh token (Supabase handles)
- Expired session → redirect `/login`

**Logout:**
1. `supabase.auth.signOut()`
2. Clear all Zustand stores
3. Clear TanStack Query cache
4. Redirect `/login`

### Security Model

**Row Level Security (RLS):**
- All tables have RLS enabled
- Simple policy: `user_id = auth.uid()` for projects
- Other tables inherit via FK (tasks accessible if project is)

**Storage Security:**
- Files stored under `{user_id}/{project_id}/` path
- RLS policy ensures users can only access their own files
- No public file access

**Client-Side Security:**
- All Supabase requests use authenticated client
- No API routes for basic CRUD (RLS is enough)
- API routes only for Google Calendar webhook

**Input Validation:**
- All forms validated with Zod schemas
- Server-side validation via database constraints
- Protection against XSS, SQL injection via parameterized queries

---

## Core Features Implementation

### 1. Dashboard (Landing Screen)

**Layout:**
```tsx
<div className="grid grid-cols-3 gap-6">
  <FocusTodayCard />
  <AtRiskCard />
  <BudgetSnapshotCard />
</div>
```

**FocusToday Card:**
- Shows tasks:
  - `status = 'doing'` (in progress)
  - `due_date <= today + 3 days` (due soon)
- Query: `SELECT * FROM tasks WHERE ... ORDER BY due_date ASC, priority DESC LIMIT 10`
- Each task clickable → opens TaskDetail dialog
- "View all" button → filters on `/projects/{id}`

**AtRisk Card:**
- Late tasks: `due_date < today AND status != 'done'`
- Compact list with red indicator
- Count badge: "5 tasks late"

**BudgetSnapshot Card:**
- Aggregation:
  ```sql
  SELECT
    SUM(budget) as total_budget,
    SUM((SELECT SUM(cost) FROM tasks WHERE project_id = projects.id)) as total_spent
  FROM projects
  WHERE user_id = auth.uid()
  ```
- Visual progress bar:
  - Green if < 80% used
  - Orange if 80-100%
  - Red if > 100%
- Breakdown by project (top 3 spenders)

**Mobile Responsive:**
- Columns stack vertically
- Order: Focus → At Risk → Budget

---

### 2. Kanban Board

**Structure:**
```tsx
<DragDropContext onDragEnd={handleDragEnd}>
  <div className="flex gap-6">
    <KanbanColumn status="todo" title={project.column_names.todo} />
    <KanbanColumn status="doing" title={project.column_names.doing} />
    <KanbanColumn status="done" title={project.column_names.done} />
  </div>
</DragDropContext>
```

**KanbanColumn:**
- Header: title + task count + "New task" button
- Droppable zone (@hello-pangea/dnd)
- Scrollable TaskCard list

**TaskCard:**
- Draggable
- Displays:
  - Title (truncated if > 60 chars)
  - Priority badge (if set)
  - Assigned to (avatar initials + name)
  - Due date (red if past)
  - Subtask indicator: "✓ 2/5" (collapsed)
  - Cost badge (if set)
- Click → opens TaskDetail dialog
- Hover → shows "..." menu (edit, delete)

**Drag & Drop Logic:**
```typescript
const handleDragEnd = (result) => {
  // 1. Optimistic Zustand update
  moveTask(taskId, newStatus, newPosition)

  // 2. Supabase mutation
  await updateTask({ id: taskId, status: newStatus, position: newPosition })

  // 3. On error: rollback + toast
}
```

**Mobile:**
- Horizontal swipe between columns
- Full-width cards
- Drag & drop disabled (use "Move to..." menu instead)

---

### 3. Budget Tracking

**Project Level:**
- Optional `budget` field in ProjectForm
- Auto-calculated `spent`: sum of `task.cost`
- Display:
  ```
  Budget: 5,000 € | Spent: 3,200 € | Remaining: 1,800 €
  [████████░░] 64%
  ```

**Task Level:**
- Optional `cost` field in TaskForm
- If filled, appears as badge on TaskCard
- Updates project budget in real-time (optimistic)

**Dashboard Budget Card:**
- Aggregates all projects
- Lists top 3 projects by spending
- Alert if any project > 100% budget

---

### 4. Documents (Files + Links)

**Interface:**
```tsx
<Tabs defaultValue="files">
  <TabsList>
    <TabsTrigger value="files">Files</TabsTrigger>
    <TabsTrigger value="links">Links</TabsTrigger>
  </TabsList>

  <TabsContent value="files">
    <FileUpload projectId={project.id} />
    <FileList files={files} />
  </TabsContent>

  <TabsContent value="links">
    <LinkForm projectId={project.id} />
    <LinkList links={links} />
  </TabsContent>
</Tabs>
```

**FileUpload:**
- Drag & drop zone
- Upload to Supabase Storage: `project-files/{user_id}/{project_id}/{file_id}-{filename}`
- Progress bar during upload
- Limit: 50MB per file
- Image preview

**FileList:**
- List with type icon (PDF, image, doc, etc.)
- Name + size + date
- Actions: Download, Delete
- Click name → downloads file

**LinkList:**
- List with favicon (if available)
- Title (inline editable) + URL
- Click → opens in new tab
- Actions: Edit, Delete

---

### 5. Task Management

**Task Creation:**
- Quick add: inline input in Kanban column header
- Full form: dialog with all fields
  - Title (required)
  - Description (textarea)
  - Status (pre-filled based on column)
  - Priority (dropdown: low/medium/high)
  - Assigned to (freeform text with autocomplete)
  - Due date (date picker)
  - Cost (number input)

**Task Detail Dialog:**
- Full task info
- Inline editing for all fields
- Subtasks expandable section:
  - Add subtask (inline input)
  - Check/uncheck subtasks
  - Delete subtask
- Activity timeline (optional, lightweight)
- Delete task button (with confirmation)

**Subtasks:**
- Maximum 1 level deep (no nested subtasks)
- Simple checklist UI
- Progress indicator: "✓ 2/5"
- Collapsed by default, click to expand

---

## PWA & Offline Support

### PWA Configuration

**`manifest.json`:**
```json
{
  "name": "Vigens - Project Manager",
  "short_name": "Vigens",
  "description": "Personal project management command center",
  "start_url": "/dashboard",
  "display": "standalone",
  "background_color": "#0f0f0f",
  "theme_color": "#3b82f6",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

**Service Worker (next-pwa with Workbox):**
```javascript
// next.config.js
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/.*\.supabase\.co\/.*$/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'supabase-api',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 5 * 60 // 5 minutes
        }
      }
    },
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif)$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'images',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
        }
      }
    }
  ]
})
```

### Offline Strategy

**1. Static UI Cache:**
- HTML, CSS, JS cached automatically
- App shell available offline

**2. Data Cache:**
- TanStack Query with `staleTime` and `cacheTime`
- Last known state available offline
- UI indicator: "Offline mode"

**3. Offline Mutations:**
- Queue failed mutations (TanStack Query `onError`)
- Auto-retry when connection returns
- Toast: "Changes will sync when online"

**4. IndexedDB Fallback:**
- Persist Zustand stores in IndexedDB (`persist` middleware)
- On offline reload: hydrate from IndexedDB
- Sync with Supabase when back online

**UX Indicators:**
```tsx
const isOnline = useOnlineStatus()

{!isOnline && (
  <Banner variant="warning">
    Offline mode - your changes will sync when online
  </Banner>
)}
```

**Installation Prompt:**
- Detect if PWA not installed
- Subtle toast: "Install Vigens on your device?"
- Permanent dismiss if declined

---

## Google Calendar Integration

### One-Way Sync (Tasks → Calendar)

**Integration Flow:**

**1. Google Connection:**
- Button "Connect Google Calendar" in Settings
- OAuth 2.0 flow (Supabase Auth supports Google provider)
- Scopes: `calendar.events` (write only)
- Token stored in `user_settings.google_calendar_token`

**2. Auto Sync:**
- Trigger: when task with `due_date` is created/modified
- TanStack Query `onSuccess` hook:
  ```typescript
  onSuccess: async (task) => {
    if (task.due_date && googleCalendarEnabled) {
      await syncTaskToCalendar(task)
    }
  }
  ```

**3. Event Creation:**
```typescript
// API route: /api/calendar/sync
const event = {
  summary: `[Vigens] ${task.title}`,
  description: `Project: ${project.name}\n${task.description}`,
  start: { date: task.due_date },
  end: { date: task.due_date },
  colorId: task.priority === 'high' ? '11' : '1' // Red if high priority
}

await googleCalendar.events.insert({
  calendarId: userSettings.default_calendar_id,
  resource: event
})
```

**4. Calendar Link Storage:**
- Store `calendar_event_id` in tasks table
- Allows update/delete event if task modified/deleted

**5. Event Updates:**
- If `due_date` changes → update event
- If task `status = 'done'` → optional: delete event or mark completed

**6. Settings UI:**
- Toggle "Sync with Google Calendar"
- Select target calendar (dropdown of user calendars)
- Disconnect Google button

**Error Handling:**
- If sync fails (quota, expired token): warning toast
- Task still saved, just not in Calendar
- "Retry sync" button available

**Future (not MVP):**
- Bidirectional sync (Calendar → Vigens)
- Calendar notifications

---

## Error Handling & UX Polish

### Toast Notifications

Using **Sonner** (modern, minimal toast library):

```typescript
// Success
toast.success('Project created')

// Error
toast.error('Unable to delete task')

// With action
toast.error('Google Calendar sync failed', {
  action: {
    label: 'Retry',
    onClick: () => retrySync()
  }
})

// Loading
const toastId = toast.loading('Uploading...')
// ... then
toast.success('File uploaded', { id: toastId })
```

**Positions:** Bottom-right (desktop), top-center (mobile)

---

### Loading States

**Skeleton Loaders:**
- Dashboard cards: pulse animation
- Kanban columns: shimmer rectangles
- Never lone spinners (feels slow)

**Optimistic UI:**
- All mutations = immediate update
- Silent rollback on network error
- Toast only for business errors (validation, permissions)

---

### Form Validation

**Zod Schemas:**
```typescript
const taskSchema = z.object({
  title: z.string().min(1, 'Title required').max(200),
  description: z.string().max(2000).optional(),
  due_date: z.date().optional(),
  cost: z.number().positive().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional()
})
```

**React Hook Form:**
- Real-time validation (onBlur)
- Errors below fields
- Disable submit if invalid
- Auto-focus first error field

---

### Keyboard Shortcuts

**Global:**
- `Cmd/Ctrl + K` → Command palette (search projects/tasks)
- `N` → New task (if in project)
- `Cmd/Ctrl + N` → New project
- `/` → Focus search bar
- `Esc` → Close dialog/modal

**In Kanban:**
- `1/2/3` → Focus column 1/2/3
- `↑/↓` → Navigate tasks
- `Enter` → Open selected task
- `E` → Edit selected task
- `Del` → Delete task (with confirmation)

**Settings:**
- Toggle "Enable keyboard shortcuts" (default: true)
- Show shortcuts in tooltips

---

### Empty States

**No projects:**
```tsx
<EmptyState
  icon={<FolderIcon />}
  title="No projects"
  description="Create your first project to get started"
  action={<Button>New project</Button>}
/>
```

**Empty Kanban column:**
- "Drag a task here"
- Or "+ Add task" button

---

### Destructive Confirmations

**Confirmation Dialogs:**
- Delete project: "Delete [name]? This action is irreversible."
- Delete task with subtasks: "This task has X subtasks. Delete all?"
- Checkbox: "Don't ask again" (stored in localStorage)

---

### Performance Optimizations

**Code Splitting:**
- Route-based (automatic with Next.js)
- Heavy components lazy-loaded:
  ```tsx
  const FileUpload = lazy(() => import('./FileUpload'))
  ```

**Image Optimization:**
- Next.js `<Image>` with lazy loading
- WebP with fallback

**Virtualization:**
- If > 50 tasks in Kanban column: use `react-virtual`
- If > 100 projects: virtualize list

---

### Accessibility

- All actions keyboard accessible
- Visible focus rings (ring-2 ring-blue-500)
- ARIA labels on icon-only buttons
- Color contrast: WCAG AA minimum
- Screen reader announcements (live regions for toasts)

---

## Non-Goals (Strict Scope)

**Out of scope for MVP:**
- ❌ CRM features
- ❌ Invoicing
- ❌ HR system
- ❌ Complex analytics/reports
- ❌ Gantt charts
- ❌ Multi-level permissions
- ❌ Team collaboration features
- ❌ Time tracking
- ❌ Bidirectional Calendar sync
- ❌ Mobile native apps (PWA is enough)

---

## Optional Nice-to-Have (Post-MVP)

**Low priority enhancements:**
- Dark/light mode toggle (currently dark-only)
- Activity timeline per project (basic version in schema)
- Simple notifications (browser notifications for due dates)
- Export project data (CSV, JSON)
- Keyboard shortcut customization
- Recurring tasks
- Task templates
- Bulk actions (multi-select tasks)

---

## Success Criteria

**The app is successful if:**

1. **Speed:** Dashboard loads < 1s, all interactions feel instant
2. **Clarity:** New user understands interface in < 30 seconds
3. **Mobile:** Full functionality on mobile (tested on iOS/Android)
4. **Offline:** Core features work offline (view, edit, create)
5. **Stability:** No data loss, reliable sync
6. **Budget:** Accurate budget tracking with visual indicators
7. **Kanban:** Smooth drag & drop, no lag
8. **PWA:** Installable, works like native app

---

## Implementation Notes

### Extensibility

**Architecture is designed for future expansion:**
- Zustand stores are modular (easy to add new stores)
- Component structure is domain-separated
- Database schema allows new tables/columns easily
- RLS policies follow consistent pattern
- New features won't require refactoring

**Future features can be added without major changes:**
- New project views (List, Calendar view)
- New task fields (tags, custom fields)
- New integrations (Slack, GitHub, etc.)
- Advanced filtering/search
- Collaboration features (if needed later)

### Development Workflow

**Recommended order of implementation:**

1. **Foundation:**
   - Next.js + Tailwind setup
   - Supabase project creation
   - Database schema + RLS policies
   - Auth flow (login/signup)

2. **Core UI:**
   - Base components (shadcn/ui)
   - Layout (sidebar, header)
   - Dark theme configuration

3. **State Management:**
   - Zustand stores setup
   - TanStack Query configuration
   - Supabase client helpers

4. **MVP Features (in order):**
   - Projects CRUD
   - Tasks CRUD
   - Kanban board (drag & drop)
   - Dashboard (3 cards)
   - Subtasks
   - Budget tracking
   - Documents (files + links)

5. **Polish:**
   - Keyboard shortcuts
   - Loading states
   - Error handling
   - Empty states
   - Mobile responsive

6. **PWA:**
   - Service worker
   - Offline support
   - Installation prompt

7. **Integrations:**
   - Google Calendar sync

8. **Testing & Deployment:**
   - E2E tests (critical paths)
   - Deploy to Vercel
   - Performance audit

---

## Technical Constraints

**Browser Support:**
- Chrome/Edge (latest 2 versions)
- Safari (latest 2 versions)
- Firefox (latest 2 versions)
- Mobile Safari (iOS 15+)
- Chrome Android (latest)

**Performance Targets:**
- First Contentful Paint: < 1.5s
- Time to Interactive: < 2.5s
- Lighthouse PWA score: > 90
- Lighthouse Performance: > 85

**Storage Limits:**
- File uploads: 50MB per file
- Total storage per user: 5GB (Supabase limit)
- IndexedDB cache: ~50MB (offline data)

---

## Deployment & Environment

**Vercel Configuration:**
```json
{
  "framework": "nextjs",
  "buildCommand": "next build",
  "installCommand": "npm install",
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "@supabase_url",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@supabase_anon_key",
    "SUPABASE_SERVICE_ROLE_KEY": "@supabase_service_key",
    "GOOGLE_CLIENT_ID": "@google_client_id",
    "GOOGLE_CLIENT_SECRET": "@google_client_secret"
  }
}
```

**Supabase Configuration:**
- Project region: closest to user (EU/US)
- Database: PostgreSQL 15
- Storage: 5GB limit
- Auth: Email/password + Google OAuth

**Domain:**
- Custom domain recommended (e.g., vigens.app)
- HTTPS enforced (automatic with Vercel)

---

## Visual Design System

### Colors

**Base:**
- Background: `#0f0f0f`
- Cards: `#1a1a1a`
- Borders: `#262626`
- Text primary: `#ffffff`
- Text secondary: `#888888`

**Accents:**
- Primary blue: `#3b82f6`
- Primary purple: `#8b5cf6`
- Success green: `#10b981`
- Warning orange: `#f59e0b`
- Error red: `#ef4444`

**Priority colors:**
- Low: `#6b7280` (gray)
- Medium: `#f59e0b` (orange)
- High: `#ef4444` (red)

### Typography

**Font family:**
- UI: `Inter` (Google Fonts)
- Monospace: `Fira Code` (for code snippets if needed)

**Scale:**
- h1: 32px, font-weight: 700
- h2: 24px, font-weight: 600
- h3: 18px, font-weight: 600
- body: 14px, font-weight: 400
- small: 12px, font-weight: 400

### Spacing

**Base unit: 4px**
- xs: 4px
- sm: 8px
- md: 16px
- lg: 24px
- xl: 32px
- 2xl: 48px

### Border Radius

- sm: 4px (buttons, inputs)
- md: 6px (cards)
- lg: 8px (modals)
- full: 9999px (avatars, badges)

### Shadows

**Subtle elevation:**
- sm: `0 1px 2px rgba(0, 0, 0, 0.05)`
- md: `0 1px 3px rgba(0, 0, 0, 0.1)`
- lg: `0 4px 6px rgba(0, 0, 0, 0.1)`

---

## End of Specification

**This design is approved and ready for implementation planning.**

**Next step:** Create detailed implementation plan with task breakdown.
