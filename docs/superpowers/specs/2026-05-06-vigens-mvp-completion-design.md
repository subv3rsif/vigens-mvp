# Vigens - Completion du MVP Final

**Date:** 2026-05-06
**Type:** Completion MVP
**Status:** Design Approved

---

## Vue d'ensemble

Ce document détaille le design pour compléter les 5 fonctionnalités manquantes du MVP de Vigens, application de gestion de projets PWA dark-mode-first.

### Contexte

Le projet Vigens a déjà implémenté :
- ✅ Authentication (login/signup)
- ✅ Dashboard avec statistiques
- ✅ Projets (CRUD, paramètres)
- ✅ Tableau Kanban avec drag & drop
- ✅ Tâches (CRUD, détails, assignation)
- ✅ PWA de base (manifest, service worker, offline)
- ✅ Tests (Vitest + Playwright)

### Fonctionnalités à compléter

1. **Sous-tâches** - Checklist à 1 niveau dans les tâches
2. **Suivi budgétaire complet** - Agrégation, indicateurs visuels
3. **Gestion de documents** - Files & Links par projet
4. **Raccourcis clavier** - Command palette + navigation
5. **Intégration Google Calendar** - Sync one-way automatique

### Approche d'implémentation

**Big Bang Sequential** - Implémentation dans l'ordre logique fonctionnel :
1. Sous-tâches (extend task capabilities)
2. Suivi budgétaire (financial tracking)
3. Documents (content management)
4. Raccourcis clavier (UX polish)
5. Google Calendar (external integration)

Chaque fonctionnalité sera complètement terminée et testée avant de passer à la suivante.

---

## 1. Sous-tâches (Subtasks)

### Architecture

**Base de données :**
- Table `subtasks` (déjà existante dans schema)
  - `id` UUID PRIMARY KEY
  - `task_id` UUID → `tasks.id` (CASCADE DELETE)
  - `title` TEXT NOT NULL
  - `completed` BOOLEAN DEFAULT false
  - `position` INTEGER
  - `created_at` TIMESTAMPTZ

**Relations :**
- Une tâche peut avoir plusieurs subtasks
- Maximum 1 niveau de profondeur (pas de nested subtasks)

**Composants :**
```
components/tasks/
├── subtask-list.tsx          # Liste expandable de subtasks
├── subtask-item.tsx          # Item individuel avec checkbox
└── add-subtask-input.tsx     # Input inline pour ajouter
```

**Hook :**
```
lib/hooks/use-subtasks.ts     # Query + mutations avec optimistic updates
```

### Data Flow

**1. Fetch subtasks :**
- Quand TaskDetailDialog s'ouvre → `useSubtasks(taskId)` query
- Tri par `position` ASC
- Cache avec TanStack Query

**2. Affichage collapsed (TaskCard) :**
- Calcul : `completed_count / total_count`
- Badge : `✓ 2/5` si subtasks existent
- Couleur :
  - 🟢 Vert si 100% complété
  - 🟠 Orange si > 0% et < 100%
  - ⚪ Gris si 0%

**3. Affichage expanded (TaskDetailDialog) :**
- Section "Sous-tâches (3)" cliquable
- Click → expand/collapse (state local)
- Liste de checkboxes
- Input inline en bas : "Ajouter une sous-tâche..."
- Delete icon on hover de chaque item

**4. Mutations optimistic :**
```typescript
// Add subtask
1. User enters title + press Enter
2. Zustand update immédiat (temp UUID)
3. DB mutation via Supabase
4. On success: replace temp avec real subtask
5. On error: rollback + toast error

// Toggle completed
1. Click checkbox → immediate UI update
2. DB mutation
3. On error: rollback checkbox

// Delete subtask
1. Click delete → immediate removal
2. DB mutation
3. On error: restore + toast
```

### Composant SubtaskList

```typescript
interface SubtaskListProps {
  taskId: string
  isExpanded: boolean
  onToggleExpand: () => void
}

// Features:
// - Header: "Sous-tâches (3)" avec ✓ 2/3 badge
// - Click header → toggle expand/collapse
// - Chevron icon (rotate sur expand)
// - Liste de SubtaskItem si expanded
// - AddSubtaskInput en bas si expanded
// - Empty state: "Aucune sous-tâche"
```

**SubtaskItem :**
```typescript
interface SubtaskItemProps {
  subtask: Subtask
  onToggle: (id: string) => void
  onDelete: (id: string) => void
}

// Layout:
// [✓] Title (strikethrough si completed)  [×]
// Checkbox → Toggle completed
// Title → Click to inline edit (optional MVP+)
// × → Delete avec hover only
```

**AddSubtaskInput :**
```typescript
// Simple input inline
// Placeholder: "Ajouter une sous-tâche..."
// Enter → Create
// Escape → Clear input
// Auto-focus après création
```

### Error Handling

- **Fetch fails** → Toast error + empty state message
- **Mutation fails** → Rollback optimistic + toast "Erreur, veuillez réessayer"
- **Delete subtask avec parent task completed** → No confirmation needed (simple delete)

### Testing

**Unit tests :**
- SubtaskList render avec 0, 1, 5 subtasks
- Progress calculation (0/3, 2/5, 5/5)
- Badge color logic

**Integration tests :**
- Add subtask flow (input → submit → verify DB)
- Toggle completed (checkbox → verify DB update)
- Delete subtask (click × → verify removed)

**E2E tests :**
- Create task → open detail → add 3 subtasks → mark 2 complete → verify count "✓ 2/3"
- Delete task with subtasks → verify cascade delete

---

## 2. Suivi Budgétaire Complet

### Architecture

**Base de données :**
- Champs existants (déjà dans schema) :
  - `projects.budget` DECIMAL(10,2) - Budget total
  - `tasks.cost` DECIMAL(10,2) - Coût individuel
- Calculs côté client : `spent = Σ tasks.cost WHERE project_id = X`

**Composants :**
```
components/dashboard/
├── budget-snapshot-card.tsx      # Agrégation tous projets
└── budget-progress-bar.tsx       # Progress bar réutilisable

components/projects/
├── project-budget-display.tsx    # Mini budget dans ProjectCard
└── project-budget-form.tsx       # Input budget dans settings

components/tasks/
└── task-cost-input.tsx          # Input cost dans TaskForm
```

### Data Flow

**1. Niveau Task :**
- TaskForm inclut champ `cost` (Number input, optionnel)
- Format : € avec 2 décimales
- Validation : > 0 si rempli
- Si rempli → Badge "€X" sur TaskCard (coin bas-droit)
- Mutation optimistic → recalcul spent du project

**2. Niveau Project :**
- ProjectCard affiche mini progress bar si `budget` défini
- Format : `3 200 € / 5 000 €`
- Progress bar colorée selon % :
  - 🟢 Green: < 80%
  - 🟠 Orange: 80-100%
  - 🔴 Red: > 100%
- ProjectSettings page : input "Budget" (optionnel)

**3. Dashboard BudgetSnapshotCard :**

**Agrégation globale :**
```typescript
// Calcul côté client (useMemo)
totalBudget = Σ projects.budget (where budget IS NOT NULL)
totalSpent = Σ (Σ tasks.cost WHERE project_id = P) FOR ALL projects
remaining = totalBudget - totalSpent
percentage = (totalSpent / totalBudget) * 100
```

**Layout :**
```
┌─────────────────────────────────┐
│ Budget Snapshot                 │
├─────────────────────────────────┤
│ 12 500 € / 20 000 €            │
│ [████████████░░░░░░] 62%       │
│                                 │
│ Top 3 Spenders:                 │
│ 1. Project Alpha    4 200 € 34%│
│ 2. Project Beta     3 800 € 30%│
│ 3. Project Gamma    2 100 € 17%│
└─────────────────────────────────┘
```

**Breakdown "Top 3 Spenders" :**
- Query les projets, trier par `spent DESC`
- Afficher top 3 avec :
  - Nom du projet
  - Montant spent
  - % du total spent
- Click sur projet → Navigate to project

**Alertes visuelles :**
- Banner orange si un projet > 100% budget
- Banner rouge si total global > 100%
- Message : "⚠️ Budget dépassé de X €"

### Calculs et Performance

**Optimisation :**
```typescript
// Hook personnalisé: useBudgetData()
const useBudgetData = () => {
  const { projects } = useProjects()
  const { tasks } = useTasks() // All tasks

  const budgetData = useMemo(() => {
    // Map projects avec spent calculé
    const projectsWithBudget = projects.map(project => {
      const projectTasks = tasks.filter(t => t.project_id === project.id)
      const spent = projectTasks.reduce((sum, t) => sum + (t.cost || 0), 0)
      const percentage = project.budget ? (spent / project.budget) * 100 : 0

      return {
        ...project,
        spent,
        percentage,
        status: percentage > 100 ? 'over' : percentage > 80 ? 'warning' : 'ok'
      }
    }).filter(p => p.budget !== null)

    // Totaux
    const totalBudget = projectsWithBudget.reduce((sum, p) => sum + (p.budget || 0), 0)
    const totalSpent = projectsWithBudget.reduce((sum, p) => sum + p.spent, 0)
    const remaining = totalBudget - totalSpent

    // Top 3
    const top3 = [...projectsWithBudget]
      .sort((a, b) => b.spent - a.spent)
      .slice(0, 3)

    return {
      totalBudget,
      totalSpent,
      remaining,
      percentage: totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0,
      top3,
      projects: projectsWithBudget
    }
  }, [projects, tasks])

  return budgetData
}
```

**Cache :**
- TanStack Query cache projects + tasks
- useMemo recalcule seulement si projects ou tasks changent
- Pas de requête SQL complexe (tout côté client)

### UI Components

**BudgetProgressBar :**
```typescript
interface BudgetProgressBarProps {
  budget: number
  spent: number
  size?: 'sm' | 'md' | 'lg'
  showLabels?: boolean
}

// Features:
// - Progress bar avec couleur dynamique (green/orange/red)
// - Affichage spent / budget si showLabels
// - Tooltip hover : "X € dépensés sur Y € budget (Z% utilisé)"
// - Gestion overflow (si spent > budget, bar reste à 100% mais red)
```

**BudgetSnapshotCard :**
```typescript
// Structure:
// - CardHeader: "Budget Snapshot"
// - Large numbers: totalSpent / totalBudget
// - BudgetProgressBar (size='lg')
// - Divider
// - "Top 3 Spenders" section
// - List items cliquables → navigate to project
// - Empty state si aucun projet avec budget
```

### Error Handling

- Si `budget = 0` → N'affiche pas le projet dans top 3
- Si `budget = null` → Projet ignoré dans calculs
- Si spent > budget → Progress bar rouge + warning icon
- Si division par 0 → Percentage = 0

### Testing

**Unit tests :**
- Calcul spent avec tasks à différents coûts
- Percentage calculation (0%, 50%, 100%, 120%)
- Top 3 sorting logic
- Color logic (green/orange/red thresholds)

**Integration tests :**
- Add task with cost → verify project spent updates
- Update task cost → verify recalculation
- Delete task → verify spent decreases

**E2E tests :**
- Set project budget 1000€ → add tasks totaling 600€ → verify dashboard shows 60%
- Add task exceeding budget → verify warning banner

---

## 3. Gestion de Documents (Files & Links)

### Architecture

**Base de données :**
- Tables existantes dans schema :
  - `files` (id, project_id, name, storage_path, size_bytes, mime_type, created_at)
  - `links` (id, project_id, title, url, description, created_at)
- Supabase Storage bucket : `project-files`
- Structure fichiers : `{user_id}/{project_id}/{file_id}-{filename}`

**Composants :**
```
components/documents/
├── document-tabs.tsx          # Container avec tabs Files | Links
├── file-upload.tsx            # Drag-drop zone + upload logic
├── file-list.tsx              # Liste des fichiers uploadés
├── file-item.tsx              # Item fichier avec preview + actions
├── link-form.tsx              # Formulaire add/edit link
├── link-list.tsx              # Liste des links
└── link-item.tsx              # Item link avec favicon
```

**Hooks :**
```
lib/hooks/
├── use-files.ts               # Query + mutations files
└── use-links.ts               # Query + mutations links
```

**Accès :**
- Accessible depuis Project Settings page
- Nouvel onglet "Documents" dans `/projects/[id]/settings?tab=documents`

### Data Flow - Files

**1. Upload Flow :**
```typescript
// User drag-and-drop ou click to browse
Step 1: Validate file
  - Size < 50MB
  - Mime type allowed (all types by default)
  - Nom de fichier valide

Step 2: Generate file_id
  - file_id = crypto.randomUUID()
  - storage_path = `{user_id}/{project_id}/{file_id}-{filename}`

Step 3: Upload to Supabase Storage
  - Show progress bar (0-100%)
  - Chunk upload si > 10MB
  - Cancel button pendant upload

Step 4: On upload success
  - Insert record dans table files
  - Optimistic UI: show file immediately
  - Toast success: "Fichier uploadé"

Step 5: On error
  - Remove from UI
  - Toast error avec retry button
  - Log error details
```

**2. Download Flow :**
```typescript
// Click sur filename → Download
Step 1: Get signed URL from Supabase Storage
  - URL expire après 60 secondes

Step 2: Trigger browser download
  - window.open(signedUrl) ou <a download>

Step 3: Track download (optional)
  - Log dans activity_log
```

**3. Delete Flow :**
```typescript
// Click delete → Confirmation dialog
Step 1: Show confirm dialog
  - "Supprimer {filename} ?"
  - Action destructive (red button)

Step 2: Delete from Storage
  - await supabase.storage.from('project-files').remove([path])

Step 3: Delete DB record
  - await supabase.from('files').delete().eq('id', fileId)

Step 4: Optimistic UI
  - Remove immediately from list
  - On error: restore + toast
```

### Data Flow - Links

**1. Add Link :**
```typescript
// LinkForm component
Fields:
  - URL (required, validated format)
  - Title (optional, auto-fetch from meta tags)
  - Description (optional, textarea)

Step 1: Validate URL
  - Regex check: https?://...
  - Toast error si invalide

Step 2: Auto-fetch title (optional feature)
  - Fetch URL meta tags
  - Extract <title> ou og:title
  - Pre-fill Title field
  - Fallback: user enters manually

Step 3: Submit
  - Insert into links table
  - Optimistic UI update
  - Toast success

On error:
  - Toast error
  - Keep form filled (retry)
```

**2. Edit Link :**
```typescript
// Inline editing
Click title → Input field appears
  - Edit title inline
  - Enter to save, Escape to cancel
  - Optimistic update

Click description → Expand textarea
  - Same inline edit flow

URL non-editable:
  - Si besoin modifier URL → Delete + Re-add
```

**3. Open Link :**
```typescript
// Click sur link item → Open in new tab
window.open(link.url, '_blank', 'noopener,noreferrer')

Optional: Track click
  - Log dans activity_log
```

### UI Components

**FileUpload :**
```typescript
interface FileUploadProps {
  projectId: string
  maxSizeMB?: number        // default 50
  acceptedTypes?: string[]  // default: all
  onUploadComplete?: (file: FileRecord) => void
}

// Features:
// - Drag-drop zone avec border dashed
// - Hover state: border blue, background highlight
// - Click to browse fallback (<input type="file">)
// - Multiple files upload (sequential)
// - Progress bar par fichier
// - Preview thumbnail pour images (base64)
// - Cancel button pendant upload
// - Error state avec retry
```

**FileList :**
```typescript
// Layout: Grid ou List selon viewport
// - Desktop: Grid 3 colonnes
// - Mobile: List 1 colonne

// FileItem structure:
┌────────────────────────────┐
│ [Icon] filename.pdf        │
│        2.5 MB • 2 days ago │
│        [Download] [Delete] │
└────────────────────────────┘

// Icons par type:
// - PDF: FileText icon (red)
// - Image: Image icon (blue)
// - Doc: FileText icon (blue)
// - Default: File icon (gray)

// Actions:
// - Hover → Show actions
// - Download → Get signed URL + download
// - Delete → Confirmation + delete
```

**LinkList :**
```typescript
// Layout: Simple list

// LinkItem structure:
┌────────────────────────────────────┐
│ [Favicon] Title (bold, clickable)  │
│           https://example.com      │
│           Description if exists... │
│           [Edit] [Delete]          │
└────────────────────────────────────┘

// Favicon:
// - Fetch from https://www.google.com/s2/favicons?domain={domain}
// - Fallback: Link icon si fetch fails

// Actions:
// - Click title/url → Open in new tab
// - Edit → Inline edit title/description
// - Delete → Confirmation + delete
```

**DocumentTabs :**
```typescript
// Tabs avec count badges
<Tabs defaultValue="files">
  <TabsList>
    <TabsTrigger value="files">
      Files ({filesCount})
    </TabsTrigger>
    <TabsTrigger value="links">
      Links ({linksCount})
    </TabsTrigger>
  </TabsList>

  <TabsContent value="files">
    <FileUpload projectId={id} />
    <FileList files={files} />
  </TabsContent>

  <TabsContent value="links">
    <LinkForm projectId={id} />
    <LinkList links={links} />
  </TabsContent>
</Tabs>

// Active tab persiste dans URL:
// /projects/123/settings?tab=documents&docTab=files
```

### Storage & Security

**Supabase Storage Policy :**
```sql
-- RLS déjà définie dans schema initial
CREATE POLICY "Users can CRUD own files in storage"
  ON storage.objects
  FOR ALL
  USING (
    bucket_id = 'project-files' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
```

**Path structure enforce security :**
- Tous les fichiers sous `{user_id}/`
- Impossible d'accéder aux fichiers d'un autre user
- Supabase vérifie via RLS automatiquement

**Upload Limits :**
- Client-side validation: 50MB per file
- Supabase free tier: 5GB total storage
- Optional: Afficher storage quota dans settings (future feature)

### Error Handling

**Files :**
- **File too large** → Toast error "Fichier trop volumineux (max 50MB)" AVANT upload
- **Upload failed** → Toast error + Retry button
- **Unsupported type** → Warning toast (si filter activé)
- **Storage quota exceeded** → Error message clair "Quota dépassé"
- **Network error** → Toast "Erreur réseau, réessayez"

**Links :**
- **Invalid URL** → Form validation error inline
- **Duplicate URL** → Warning toast "Lien déjà ajouté" (allow anyway)
- **Fetch meta tags failed** → Fallback silencieux (user enters title manually)
- **URL unreachable** → Warning (mais allow add anyway)

### Testing

**Files - Unit tests :**
- FileUpload validation (size, type)
- File size formatting (bytes → KB/MB)
- Storage path generation

**Files - Integration tests :**
- Upload file → verify Storage + DB record
- Download file → verify signed URL generated
- Delete file → verify Storage + DB cleanup

**Files - E2E tests :**
- Drag-drop image → verify appears in list → download → delete

**Links - Unit tests :**
- URL validation regex
- Favicon URL generation

**Links - Integration tests :**
- Add link → edit title → delete
- Auto-fetch title from URL

**Links - E2E tests :**
- Add link → verify in list → click to open → delete

---

## 4. Raccourcis Clavier

### Architecture

**Composants :**
```
components/
├── command-palette.tsx               # Cmd+K palette (Cmdk library)
├── keyboard-shortcuts-dialog.tsx     # Modal/Lightbox liste des shortcuts
└── keyboard-shortcuts-trigger.tsx    # Bouton/lien dans dashboard

lib/hooks/
└── use-keyboard-shortcuts.ts         # Hook global pour shortcuts
```

**Dépendance :**
```bash
npm install cmdk  # Command palette by Paaco (shadcn compatible)
```

**Settings :**
- `user_settings.keyboard_shortcuts_enabled` BOOLEAN (default: true)
- Toggle dans Settings page

### Shortcuts Globaux

**Navigation :**
- `Cmd/Ctrl + K` → Ouvre command palette
- `/` → Focus search bar (si disponible dans page)
- `Esc` → Ferme dialog/modal actif
- `?` → Affiche aide shortcuts (ouvre KeyboardShortcutsDialog)

**Actions :**
- `N` → Nouvelle tâche (si dans un project context)
- `Cmd/Ctrl + N` → Nouveau projet
- `Cmd/Ctrl + S` → Sauvegarde (si formulaire actif, prevent default browser behavior)

### Shortcuts Kanban (dans Board)

**Navigation colonnes :**
- `1` → Focus colonne "À faire"
- `2` → Focus colonne "En cours"
- `3` → Focus colonne "Terminé"
- Focus visible avec ring-2 border blue

**Navigation tâches :**
- `↑` / `↓` → Naviguer entre les tâches (dans colonne focusée)
- `Tab` → Cycle entre colonnes (→ next column)
- `Shift + Tab` → Cycle reverse (← previous column)
- `Enter` → Ouvrir tâche sélectionnée (TaskDetailDialog)

**Actions :**
- `E` → Éditer tâche sélectionnée (focus dans TaskDetailDialog)
- `Del` / `Backspace` → Supprimer tâche (avec confirmation)
- `Space` → Quick toggle status (todo → doing → done → todo)

### Command Palette (Cmd+K)

**Features :**
```typescript
// Recherche fuzzy dans:
interface CommandItem {
  id: string
  label: string
  category: 'recent' | 'projects' | 'tasks' | 'actions'
  icon: LucideIcon
  onSelect: () => void
  shortcut?: string  // Affiche shortcut badge si existe
}
```

**Sections (affichage dynamique) :**

1. **Recent** (si historique existe)
   - 5 derniers projects/tasks visités
   - Icône Clock
   - "Récents"

2. **Projects**
   - Recherche fuzzy dans tous les projets
   - Max 5 résultats affichés
   - Icône Folder
   - Click → Navigate to project

3. **Tasks**
   - Recherche fuzzy dans toutes les tâches
   - Max 5 résultats affichés
   - Icône CheckSquare
   - Click → Open TaskDetailDialog

4. **Actions**
   - Actions rapides :
     - "Nouveau projet" (icon: Plus) → Ouvre CreateProjectDialog
     - "Nouvelle tâche" (icon: Plus) si dans project → Ouvre CreateTaskDialog
     - "Paramètres" (icon: Settings) → Navigate to /settings
     - "Raccourcis" (icon: Keyboard) → Ouvre KeyboardShortcutsDialog
     - "Déconnexion" (icon: LogOut) → Sign out

**Search Logic :**
- Fuzzy matching avec cmdk (built-in)
- Highlight matched characters
- Search dans title, description, project name
- Debounce 150ms

**UI :**
```
┌─────────────────────────────────────┐
│ [Search icon] Search...             │
├─────────────────────────────────────┤
│ Récents                             │
│   Project Alpha        [Folder]     │
│   Task: Fix bug        [Check]      │
│                                     │
│ Projets                             │
│   Project Beta         [Folder]     │
│                                     │
│ Tâches                              │
│   Task: Design mockup  [Check]      │
│                                     │
│ Actions                             │
│   Nouveau projet    [⌘N]  [Plus]   │
│   Paramètres              [Settings]│
└─────────────────────────────────────┘
```

### Keyboard Shortcuts Dialog (Lightbox)

**Trigger dans Dashboard :**
- Emplacement : Header (top-right) OU Sidebar (bottom)
- Lien/bouton : "⌨️ Raccourcis"
- Click → Ouvre dialog fullscreen modal
- Ou raccourci `?` depuis n'importe où

**Dialog Content :**
```typescript
interface ShortcutSection {
  title: string
  shortcuts: Array<{
    keys: string[]      // Ex: ['Cmd', 'K']
    description: string // Ex: "Ouvrir palette de commandes"
  }>
}

const sections: ShortcutSection[] = [
  {
    title: "Globaux",
    shortcuts: [
      { keys: ['Cmd', 'K'], description: 'Palette de commandes' },
      { keys: ['N'], description: 'Nouvelle tâche (dans projet)' },
      { keys: ['Cmd', 'N'], description: 'Nouveau projet' },
      { keys: ['/'], description: 'Rechercher' },
      { keys: ['Esc'], description: 'Fermer dialog' },
      { keys: ['?'], description: 'Afficher cette aide' },
    ]
  },
  {
    title: "Tableau Kanban",
    shortcuts: [
      { keys: ['1', '2', '3'], description: 'Focus colonne 1/2/3' },
      { keys: ['↑', '↓'], description: 'Naviguer tâches' },
      { keys: ['Tab'], description: 'Changer de colonne' },
      { keys: ['Enter'], description: 'Ouvrir tâche' },
      { keys: ['E'], description: 'Éditer tâche' },
      { keys: ['Del'], description: 'Supprimer tâche' },
      { keys: ['Space'], description: 'Changer statut' },
    ]
  }
]
```

**Layout Dialog :**
```
┌─────────────────────────────────────────┐
│ Raccourcis clavier             [×]      │
├─────────────────────────────────────────┤
│                                         │
│  Globaux              Tableau Kanban    │
│  ────────────────     ──────────────    │
│  Cmd K  Palette       1 2 3  Colonnes   │
│  N      Nouvelle      ↑ ↓    Naviguer   │
│  Cmd N  Projet        Tab    Changer    │
│  /      Rechercher    Enter  Ouvrir     │
│  Esc    Fermer        E      Éditer     │
│  ?      Aide          Del    Supprimer  │
│                       Space  Statut     │
│                                         │
├─────────────────────────────────────────┤
│ [Toggle] Activer raccourcis  [Fermer]  │
└─────────────────────────────────────────┘
```

**Features :**
- Grid 2 colonnes (desktop) / Stack (mobile)
- Chaque shortcut : keys (kbd tags) + description
- Footer : Toggle "Activer les raccourcis" + Bouton "Fermer"
- State géré par Zustand (useUIStore.isShortcutsDialogOpen)

### Hook Implementation

```typescript
// lib/hooks/use-keyboard-shortcuts.ts
export function useKeyboardShortcuts() {
  const { keyboardShortcutsEnabled } = useUserSettings()
  const { isInProject, currentProjectId } = useProjectStore()
  const { openCommandPalette, openNewTaskDialog, openNewProjectDialog, openShortcutsDialog } = useUIStore()

  useEffect(() => {
    if (!keyboardShortcutsEnabled) return

    const handler = (e: KeyboardEvent) => {
      // Ignore si focus dans input/textarea/contenteditable
      const target = e.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return
      }

      // Cmd/Ctrl + K → Command palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        openCommandPalette()
      }

      // N → New task (si dans projet)
      if (e.key === 'n' && !e.metaKey && !e.ctrlKey && !e.shiftKey) {
        if (isInProject) {
          e.preventDefault()
          openNewTaskDialog()
        }
      }

      // Cmd/Ctrl + N → New project
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault()
        openNewProjectDialog()
      }

      // / → Focus search (si existe)
      if (e.key === '/') {
        e.preventDefault()
        const searchInput = document.querySelector('[data-search-input]') as HTMLInputElement
        searchInput?.focus()
      }

      // Esc → Close active dialog
      if (e.key === 'Escape') {
        // Géré par Dialog component (built-in)
      }

      // ? → Show shortcuts help
      if (e.key === '?') {
        e.preventDefault()
        openShortcutsDialog()
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [keyboardShortcutsEnabled, isInProject, currentProjectId])
}

// Hook in root layout
// app/layout.tsx
export default function RootLayout({ children }) {
  useKeyboardShortcuts() // Register global shortcuts

  return (
    <html>
      <body>
        {children}
        <CommandPalette />
        <KeyboardShortcutsDialog />
      </body>
    </html>
  )
}
```

### Visual Indicators

**Tooltips avec shortcuts :**
```typescript
// Composant Button avec tooltip
<Tooltip>
  <TooltipTrigger asChild>
    <Button onClick={createTask}>
      New Task
    </Button>
  </TooltipTrigger>
  <TooltipContent>
    Create new task <kbd className="ml-2">N</kbd>
  </TooltipContent>
</Tooltip>
```

**Kbd component styling :**
```css
kbd {
  @apply px-2 py-1 text-xs bg-card border border-border rounded font-mono;
}
```

### Error Handling

- **Action impossible** → Toast error (ex: "Aucun projet sélectionné")
- **Shortcut conflict** → Priority: Dialog > Page-specific > Global
- **Disabled shortcuts** → Hook ne s'enregistre pas, aucune action

### Accessibility

- **Focus visible** : ring-2 ring-accent-blue sur tous les éléments
- **Screen reader** : ARIA labels sur kbd elements
- **Tab navigation** : Tous les shortcuts ont équivalents souris
- **WCAG 2.1 AA** : Contrast ratios respectés

### Testing

**Unit tests :**
- Key press handlers avec différents modifiers
- isInputFocused() logic
- Shortcut conflict resolution

**Integration tests :**
- Command palette : search + select item
- Shortcuts : press N → verify dialog opens
- Toggle enabled/disabled → verify shortcuts active/inactive

**E2E tests :**
- Kbd navigation full workflow : Cmd+K → search "Alpha" → select → verify navigation
- Kanban navigation : 1 → ↓ → Enter → verify task opens
- Accessibility : Tab through interface → verify focus visible

---

## 5. Intégration Google Calendar

### Architecture

**Base de données :**
- `tasks.calendar_event_id` TEXT - Stocke l'ID de l'événement Google Calendar
- `user_settings.google_calendar_token` JSONB - Token OAuth (encrypted)
- `user_settings.google_calendar_enabled` BOOLEAN - Toggle on/off
- `user_settings.default_calendar_id` TEXT - Calendar sélectionné par défaut

**API Routes :**
```
app/api/calendar/
├── auth/route.ts          # OAuth callback handler
├── sync/route.ts          # Sync task → calendar event (POST)
├── calendars/route.ts     # List user's calendars (GET)
└── disconnect/route.ts    # Revoke access (POST)
```

**Composants :**
```
components/settings/
└── calendar-settings.tsx   # Settings UI panel

lib/calendar/
├── google-calendar.ts      # Google Calendar API client wrapper
└── sync-helpers.ts         # Sync logic helpers
```

**Dépendances :**
```bash
npm install googleapis
```

**Environment Variables :**
```env
# .env.local
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
GOOGLE_REDIRECT_URI=http://localhost:3000/api/calendar/auth
```

### OAuth Flow

**1. Initial Connection :**
```typescript
// User clicks "Connect Google Calendar" dans Settings

Step 1: Generate OAuth URL
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/calendar.events'],
  })
  window.location.href = authUrl

Step 2: User approves sur Google consent screen
  - Scopes requested: calendar.events (write access)

Step 3: Google redirects to /api/calendar/auth?code=xxx

Step 4: Exchange code for tokens
  const { tokens } = await oauth2Client.getToken(code)
  // tokens = { access_token, refresh_token, expiry_date }

Step 5: Store tokens in DB
  await supabase
    .from('user_settings')
    .upsert({
      user_id: userId,
      google_calendar_token: tokens, // JSONB encrypted
      google_calendar_enabled: true
    })

Step 6: Fetch user's calendars
  const calendars = await calendar.calendarList.list()

Step 7: Set default calendar
  const primaryCalendar = calendars.find(c => c.primary) || calendars[0]
  await supabase
    .from('user_settings')
    .update({ default_calendar_id: primaryCalendar.id })
    .eq('user_id', userId)

Step 8: Redirect to Settings avec success toast
```

**2. Token Refresh :**
```typescript
// Tokens expirent après 1 heure
// Auto-refresh avant chaque API call

async function getValidAccessToken(userId: string) {
  const { data: settings } = await supabase
    .from('user_settings')
    .select('google_calendar_token')
    .eq('user_id', userId)
    .single()

  const { access_token, refresh_token, expiry_date } = settings.google_calendar_token

  // Check si expiré ou expire dans < 5 min
  if (Date.now() >= expiry_date - 5 * 60 * 1000) {
    // Refresh token
    oauth2Client.setCredentials({ refresh_token })
    const { credentials } = await oauth2Client.refreshAccessToken()

    // Update DB
    await supabase
      .from('user_settings')
      .update({
        google_calendar_token: {
          ...settings.google_calendar_token,
          access_token: credentials.access_token,
          expiry_date: credentials.expiry_date
        }
      })
      .eq('user_id', userId)

    return credentials.access_token
  }

  return access_token
}
```

**3. Disconnect :**
```typescript
// User clicks "Disconnect" button

Step 1: Revoke token via Google API
  await oauth2Client.revokeToken(access_token)

Step 2: Clear calendar_event_id from all tasks
  await supabase
    .from('tasks')
    .update({ calendar_event_id: null })
    .not('calendar_event_id', 'is', null)

Step 3: Clear settings
  await supabase
    .from('user_settings')
    .update({
      google_calendar_token: null,
      google_calendar_enabled: false,
      default_calendar_id: null
    })
    .eq('user_id', userId)

Step 4: Toast success "Google Calendar disconnected"
```

### Sync Logic (One-Way: Tasks → Calendar)

**Trigger Events :**
1. **Task créée** avec `due_date` → Create calendar event
2. **Task `due_date` modifiée** → Update calendar event (ou create si n'existe pas)
3. **Task `status = 'done'`** → Delete calendar event
4. **Task supprimée** → Delete calendar event

**Event Creation :**
```typescript
// POST /api/calendar/sync
// Body: { taskId, action: 'create' | 'update' | 'delete' }

async function createCalendarEvent(task: Task, project: Project, settings: UserSettings) {
  // Get valid access token
  const accessToken = await getValidAccessToken(task.user_id)
  oauth2Client.setCredentials({ access_token: accessToken })

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client })

  // Build event
  const event = {
    summary: `[Vigens] ${task.title}`,
    description: [
      `Projet: ${project.name}`,
      task.description || '',
      '',
      'Géré depuis Vigens',
      task.priority ? `Priorité: ${task.priority}` : '',
      task.assigned_to ? `Assigné à: ${task.assigned_to}` : '',
      task.cost ? `Coût: ${task.cost}€` : ''
    ].filter(Boolean).join('\n'),

    start: {
      date: task.due_date,  // All-day event (YYYY-MM-DD)
    },
    end: {
      date: task.due_date,
    },

    colorId: getPriorityColor(task.priority),
    // '11' = Red (high), '5' = Yellow (medium), '1' = Blue (low/none)

    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 24 * 60 }, // Rappel 1 jour avant
      ],
    },
  }

  // Insert event
  const response = await calendar.events.insert({
    calendarId: settings.default_calendar_id,
    resource: event,
  })

  // Store event ID in task
  await supabase
    .from('tasks')
    .update({ calendar_event_id: response.data.id })
    .eq('id', task.id)

  return response.data
}

// Helper function
function getPriorityColor(priority: string | null): string {
  switch (priority) {
    case 'high': return '11'    // Red
    case 'medium': return '5'   // Yellow
    case 'low':
    default: return '1'         // Blue
  }
}
```

**Event Update :**
```typescript
async function updateCalendarEvent(task: Task, project: Project, settings: UserSettings) {
  const accessToken = await getValidAccessToken(task.user_id)
  oauth2Client.setCredentials({ access_token: accessToken })
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client })

  // Si pas de calendar_event_id, créer event
  if (!task.calendar_event_id) {
    return createCalendarEvent(task, project, settings)
  }

  try {
    // Update existing event
    const response = await calendar.events.update({
      calendarId: settings.default_calendar_id,
      eventId: task.calendar_event_id,
      resource: {
        summary: `[Vigens] ${task.title}`,
        description: /* ... same as create ... */,
        start: { date: task.due_date },
        end: { date: task.due_date },
        colorId: getPriorityColor(task.priority),
      }
    })

    return response.data
  } catch (error: any) {
    // Si event 404 (deleted on Google side)
    if (error.code === 404) {
      // Clear calendar_event_id et recréer
      await supabase
        .from('tasks')
        .update({ calendar_event_id: null })
        .eq('id', task.id)

      return createCalendarEvent(task, project, settings)
    }

    throw error
  }
}
```

**Event Deletion :**
```typescript
async function deleteCalendarEvent(task: Task, settings: UserSettings) {
  if (!task.calendar_event_id) return

  const accessToken = await getValidAccessToken(task.user_id)
  oauth2Client.setCredentials({ access_token: accessToken })
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client })

  try {
    await calendar.events.delete({
      calendarId: settings.default_calendar_id,
      eventId: task.calendar_event_id,
    })
  } catch (error: any) {
    // Silently fail si event déjà deleted (404) ou autre erreur
    console.warn('Calendar event delete failed:', error)
    // Continue quand même pour clear DB
  }

  // Clear calendar_event_id
  await supabase
    .from('tasks')
    .update({ calendar_event_id: null })
    .eq('id', task.id)
}
```

### Integration Points

**Hook into Task Mutations :**
```typescript
// lib/hooks/use-tasks.ts - Modifier les mutations existantes

const createTask = useMutation({
  mutationFn: async (task) => {
    // 1. Create task in DB
    const newTask = await supabase.from('tasks').insert(task).select().single()

    // 2. Si calendar enabled ET due_date existe
    const { data: settings } = await supabase
      .from('user_settings')
      .select('google_calendar_enabled, default_calendar_id')
      .eq('user_id', userId)
      .single()

    if (settings?.google_calendar_enabled && newTask.due_date) {
      // Trigger calendar sync (async, non-blocking)
      fetch('/api/calendar/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: newTask.id,
          action: 'create'
        })
      }).catch(error => {
        // Error handling (toast sera affiché par API route)
        console.error('Calendar sync failed:', error)
      })
    }

    return newTask
  },
  // ... rest of mutation
})

const updateTask = useMutation({
  mutationFn: async ({ id, updates }) => {
    // 1. Update task in DB
    const updatedTask = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    // 2. Check si sync needed
    const settings = await getUserSettings()

    if (settings?.google_calendar_enabled) {
      // Si due_date modifiée
      if ('due_date' in updates) {
        const action = updates.due_date ? 'update' : 'delete'

        await fetch('/api/calendar/sync', {
          method: 'POST',
          body: JSON.stringify({ taskId: id, action })
        })
      }

      // Si status → 'done', delete event
      if (updates.status === 'done' && updatedTask.calendar_event_id) {
        await fetch('/api/calendar/sync', {
          method: 'POST',
          body: JSON.stringify({ taskId: id, action: 'delete' })
        })
      }
    }

    return updatedTask
  },
  // ... rest
})

const deleteTask = useMutation({
  mutationFn: async (id) => {
    // 1. Get task avant delete (pour calendar_event_id)
    const { data: task } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', id)
      .single()

    // 2. Delete task
    await supabase.from('tasks').delete().eq('id', id)

    // 3. Delete calendar event if exists
    const settings = await getUserSettings()
    if (settings?.google_calendar_enabled && task?.calendar_event_id) {
      await fetch('/api/calendar/sync', {
        method: 'POST',
        body: JSON.stringify({ taskId: id, action: 'delete' })
      })
    }
  },
  // ... rest
})
```

### Settings UI

**CalendarSettings Component :**
```typescript
// components/settings/calendar-settings.tsx

export function CalendarSettings() {
  const { data: settings, isLoading } = useUserSettings()
  const { data: calendars } = useGoogleCalendars() // Si connected
  const [syncCount, setSyncCount] = useState(0)

  const handleConnect = async () => {
    // Redirect to OAuth flow
    window.location.href = '/api/calendar/auth'
  }

  const handleDisconnect = async () => {
    // Confirmation dialog
    const confirmed = await confirm('Disconnect Google Calendar? Synced events will remain.')
    if (!confirmed) return

    // Call disconnect API
    await fetch('/api/calendar/disconnect', { method: 'POST' })

    // Refresh settings
    mutate()
    toast.success('Google Calendar disconnected')
  }

  const handleCalendarChange = async (calendarId: string) => {
    await supabase
      .from('user_settings')
      .update({ default_calendar_id: calendarId })
      .eq('user_id', userId)

    toast.success('Default calendar updated')
  }

  const handleToggleSync = async (enabled: boolean) => {
    await supabase
      .from('user_settings')
      .update({ google_calendar_enabled: enabled })
      .eq('user_id', userId)

    toast.success(enabled ? 'Sync enabled' : 'Sync disabled')
  }

  // Fetch synced tasks count
  useEffect(() => {
    const fetchCount = async () => {
      const { count } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .not('calendar_event_id', 'is', null)

      setSyncCount(count || 0)
    }

    if (settings?.google_calendar_enabled) {
      fetchCount()
    }
  }, [settings])

  if (isLoading) return <Skeleton />

  const isConnected = !!settings?.google_calendar_token

  return (
    <Card>
      <CardHeader>
        <h3 className="text-h3 flex items-center gap-2">
          <CalendarIcon className="w-5 h-5" />
          Google Calendar
        </h3>
        <p className="text-sm text-text-secondary">
          Sync tasks with due dates to your Google Calendar
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {!isConnected ? (
          <div className="text-center py-6">
            <CalendarIcon className="w-12 h-12 mx-auto mb-4 text-text-secondary" />
            <p className="text-sm text-text-secondary mb-4">
              Connect your Google Calendar to automatically sync tasks
            </p>
            <Button onClick={handleConnect} size="lg">
              Connect Google Calendar
            </Button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 p-3 bg-success/10 border border-success/20 rounded">
              <CheckCircle className="w-4 h-4 text-success" />
              <span className="text-sm">
                Connected as <strong>{settings.email}</strong>
              </span>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Default Calendar
              </label>
              <Select
                value={settings.default_calendar_id}
                onValueChange={handleCalendarChange}
              >
                {calendars?.map(cal => (
                  <SelectItem key={cal.id} value={cal.id}>
                    {cal.summary} {cal.primary && '(Primary)'}
                  </SelectItem>
                ))}
              </Select>
            </div>

            <div className="flex items-center justify-between p-3 border rounded">
              <div>
                <p className="text-sm font-medium">Sync tasks with due dates</p>
                <p className="text-xs text-text-secondary">
                  Automatically create calendar events
                </p>
              </div>
              <Switch
                checked={settings.google_calendar_enabled}
                onCheckedChange={handleToggleSync}
              />
            </div>

            <div className="text-sm text-text-secondary">
              {syncCount} task{syncCount !== 1 ? 's' : ''} synced to calendar
            </div>

            <Button
              variant="destructive"
              onClick={handleDisconnect}
              className="w-full"
            >
              Disconnect Google Calendar
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}
```

### Error Handling

**Scénarios d'erreur :**

1. **Quota exceeded** (Google API limits: 1M requests/day)
   ```typescript
   // API route error handling
   if (error.code === 429) {
     return Response.json({
       error: 'Calendar sync temporarily unavailable (quota exceeded)',
       retry: true
     }, { status: 429 })
   }

   // Client-side
   toast.error('Calendar sync unavailable, will retry later')
   // Queue for retry avec exponential backoff
   ```

2. **Token expired/revoked**
   ```typescript
   if (error.code === 401) {
     // Auto-disable sync
     await supabase
       .from('user_settings')
       .update({ google_calendar_enabled: false })
       .eq('user_id', userId)

     // Notify user
     toast.error('Google Calendar disconnected. Please reconnect.', {
       action: {
         label: 'Reconnect',
         onClick: () => window.location.href = '/api/calendar/auth'
       }
     })
   }
   ```

3. **Network error**
   ```typescript
   // Queue sync for retry
   const syncQueue = useLocalStorage<SyncJob[]>('calendar-sync-queue', [])

   if (error instanceof NetworkError) {
     syncQueue.push({
       id: crypto.randomUUID(),
       taskId,
       action,
       timestamp: Date.now(),
       retries: 0
     })

     toast.warning('Sync will retry when online')
   }
   ```

4. **Event creation fails**
   ```typescript
   // Task is ALWAYS saved first (calendar sync doesn't block)
   try {
     await syncToCalendar(task)
   } catch (error) {
     // Task existe déjà, juste log l'erreur
     console.error('Calendar sync failed:', error)

     toast.error('Task saved, but calendar sync failed', {
       action: {
         label: 'Retry',
         onClick: () => retrySyncToCalendar(task.id)
       }
     })
   }
   ```

**Retry Mechanism :**
```typescript
// lib/calendar/sync-queue.ts
interface SyncJob {
  id: string
  taskId: string
  action: 'create' | 'update' | 'delete'
  timestamp: number
  retries: number
}

const MAX_RETRIES = 3
const RETRY_DELAYS = [1000, 5000, 15000] // 1s, 5s, 15s

async function processSyncQueue() {
  const queue = getSyncQueue()

  for (const job of queue) {
    if (job.retries >= MAX_RETRIES) {
      // Give up après 3 tentatives
      removeSyncJob(job.id)
      continue
    }

    try {
      await fetch('/api/calendar/sync', {
        method: 'POST',
        body: JSON.stringify({ taskId: job.taskId, action: job.action })
      })

      // Success → remove from queue
      removeSyncJob(job.id)
    } catch (error) {
      // Increment retries et attendre
      updateSyncJob(job.id, { retries: job.retries + 1 })

      // Schedule retry avec exponential backoff
      const delay = RETRY_DELAYS[job.retries] || 15000
      setTimeout(() => processSyncQueue(), delay)
    }
  }
}

// Trigger queue processing on app load et après chaque mutation
useEffect(() => {
  processSyncQueue()
}, [])
```

### Security & Privacy

**Token Storage :**
- Tokens stockés dans `user_settings.google_calendar_token` (JSONB)
- RLS policy : users can only access their own settings
- Tokens NEVER exposed au client (API routes only)
- Refresh token permet renouvellement automatique

**Scopes minimaux :**
- `https://www.googleapis.com/auth/calendar.events` (write events only)
- PAS de lecture complète du calendrier (privacy)
- PAS d'accès aux autres Google services

**Revocation :**
- Disconnect button → Revoke token via Google API
- Clear tous les `calendar_event_id` des tasks
- User garde contrôle total sur ses données

**HTTPS required :**
- OAuth redirect URI MUST use HTTPS en production
- Tokens transitent uniquement via HTTPS

### Testing

**Unit Tests :**
- Event payload generation (createCalendarEvent)
- Priority → color mapping (getPriorityColor)
- Token refresh logic (getValidAccessToken)
- Sync queue management (processSyncQueue)

**Integration Tests (Mock Google API) :**
```typescript
// Utiliser Mock Service Worker (MSW)
import { rest } from 'msw'
import { setupServer } from 'msw/node'

const server = setupServer(
  rest.post('https://oauth2.googleapis.com/token', (req, res, ctx) => {
    return res(ctx.json({
      access_token: 'mock_access_token',
      refresh_token: 'mock_refresh_token',
      expiry_date: Date.now() + 3600000
    }))
  }),

  rest.post('https://www.googleapis.com/calendar/v3/calendars/:calendarId/events', (req, res, ctx) => {
    return res(ctx.json({
      id: 'mock_event_id',
      summary: req.body.summary,
      start: req.body.start,
      end: req.body.end
    }))
  })
)

// Tests
describe('Google Calendar Sync', () => {
  beforeAll(() => server.listen())
  afterAll(() => server.close())

  test('creates calendar event when task with due_date is created', async () => {
    const task = await createTask({
      title: 'Test task',
      due_date: '2026-05-10',
      project_id: 'xxx'
    })

    // Wait for async sync
    await waitFor(() => {
      expect(task.calendar_event_id).toBe('mock_event_id')
    })
  })

  test('updates calendar event when due_date changes', async () => {
    // ... test update flow
  })

  test('deletes calendar event when task is deleted', async () => {
    // ... test delete flow
  })
})
```

**E2E Tests (avec vrai compte test Google) :**
```typescript
// e2e/calendar-sync.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Google Calendar Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Login avec test account qui a Google Calendar connected
    await page.goto('/login')
    await page.fill('[name="email"]', 'test@example.com')
    await page.fill('[name="password"]', 'password')
    await page.click('button[type="submit"]')
  })

  test('syncs task to calendar', async ({ page }) => {
    // Créer une tâche avec due_date
    await page.goto('/projects/test-project-id')
    await page.click('text=New Task')
    await page.fill('[name="title"]', 'E2E Test Task')
    await page.fill('[name="due_date"]', '2026-05-15')
    await page.click('button:has-text("Create")')

    // Vérifier que calendar_event_id est set
    // (via API call ou DB check)
    const task = await getTaskByTitle('E2E Test Task')
    expect(task.calendar_event_id).toBeTruthy()

    // Optionnel: Vérifier event existe dans Google Calendar via API
    const event = await getCalendarEvent(task.calendar_event_id)
    expect(event.summary).toContain('E2E Test Task')
  })

  test('disconnects calendar', async ({ page }) => {
    await page.goto('/settings')
    await page.click('text=Disconnect Google Calendar')
    await page.click('button:has-text("Confirm")')

    // Vérifier que settings cleared
    await expect(page.locator('text=Connect Google Calendar')).toBeVisible()
  })
})
```

**Manual Testing Checklist :**
- [ ] Connect Google Calendar → verify OAuth flow
- [ ] Select calendar → verify saved
- [ ] Create task with due_date → verify event in Calendar
- [ ] Update due_date → verify event updated
- [ ] Mark task done → verify event deleted
- [ ] Delete task → verify event deleted
- [ ] Toggle sync off → verify no new syncs
- [ ] Disconnect → verify token revoked + events remain
- [ ] Reconnect → verify new syncs work
- [ ] Test quota exceeded scenario (hard to test)
- [ ] Test token expiry → verify auto-refresh

---

## Implementation Order (Résumé)

1. **Sous-tâches** (2-3 jours)
   - Table + composants + hook
   - Tests + commit

2. **Suivi budgétaire** (2-3 jours)
   - Calculs + composants
   - Tests + commit

3. **Gestion de documents** (3-4 jours)
   - Files upload + Links
   - Tests + commit

4. **Raccourcis clavier** (1-2 jours)
   - Hook + Command Palette + Dialog
   - Tests + commit

5. **Google Calendar** (3-4 jours)
   - OAuth + Sync logic + Settings UI
   - Tests + commit

**Total estimé : 11-16 jours de développement**

---

## Success Criteria

Le MVP sera considéré comme complet quand :

✅ **Sous-tâches :**
- Créer/éditer/supprimer subtasks
- Indicateur "✓ X/Y" visible sur TaskCard
- Expandable dans TaskDetailDialog

✅ **Budget :**
- Champs cost dans tasks, budget dans projects
- BudgetSnapshotCard affiche agrégation correcte
- Progress bars avec couleurs correctes (green/orange/red)
- Top 3 projects spenders affichés

✅ **Documents :**
- Upload files (drag-drop + browse)
- Download/delete files
- Add/edit/delete links
- Document tabs accessible depuis project settings

✅ **Raccourcis clavier :**
- Command palette (Cmd+K) fonctionnel
- Shortcuts globaux (N, Cmd+N, /, Esc, ?)
- Shortcuts Kanban (1/2/3, ↑/↓, Enter, E, Del, Space)
- Dialog aide accessible et complet

✅ **Google Calendar :**
- OAuth flow complet
- Sync automatique tasks → calendar
- Settings UI avec connect/disconnect
- Error handling robuste

✅ **Tests :**
- Tous les tests unitaires passent
- Tests d'intégration couvrent les flows critiques
- Tests E2E validés manuellement

✅ **Performance :**
- Pas de régression (< 2.5s TTI)
- Optimistic updates instantanés
- Pas de lag sur UI

---

## Notes d'implémentation

### Code Quality

- **TypeScript strict mode** : Pas de `any`, typage complet
- **ESLint** : Aucune erreur, suivre config Next.js
- **Commits atomiques** : Un commit par feature complète
- **Git messages** : Format conventional commits

### Performance

- **Optimistic updates** partout (instant UI feel)
- **TanStack Query cache** : staleTime = 1min, gcTime = 5min
- **useMemo** pour calculs budgétaires
- **Lazy load** Command Palette (code splitting)

### Accessibility

- **Keyboard navigation** : Tab order logique
- **Focus visible** : ring-2 sur tous les interactifs
- **ARIA labels** : Sur boutons icon-only
- **Screen reader** : Annonces pour toasts

### Security

- **RLS policies** : Testées et validées
- **Input validation** : Zod schemas partout
- **OAuth tokens** : Encrypted storage
- **File uploads** : Validation size + type

### Documentation

- **README.md** : Mise à jour avec nouvelles features
- **CHANGELOG.md** : Log de toutes les features ajoutées
- **JSDoc comments** : Sur fonctions complexes
- **Storybook** : (optional) Pour composants UI

---

## End of Specification

**Status :** Design Approved
**Next Step :** Create implementation plan

Ce design est validé et prêt pour la phase de planification détaillée (writing-plans).
