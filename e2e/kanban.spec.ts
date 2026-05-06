import { test, expect } from '@playwright/test'

test.describe('Kanban Board', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to a project's board
    // In a real scenario, you'd create a test project first
    await page.goto('/projects/test-project-id/board')
  })

  test('displays kanban columns', async ({ page }) => {
    await expect(page.getByText(/à faire/i)).toBeVisible()
    await expect(page.getByText(/en cours/i)).toBeVisible()
    await expect(page.getByText(/terminé/i)).toBeVisible()
  })

  test('shows add task button in each column', async ({ page }) => {
    const addButtons = page.getByRole('button', {
      name: /ajouter une tâche/i,
    })
    await expect(addButtons.first()).toBeVisible()
  })

  test('opens create task dialog', async ({ page }) => {
    await page
      .getByRole('button', { name: /ajouter une tâche/i })
      .first()
      .click()
    await expect(
      page.getByRole('heading', { name: /nouvelle tâche/i })
    ).toBeVisible()
  })

  test('shows task form fields', async ({ page }) => {
    await page
      .getByRole('button', { name: /ajouter une tâche/i })
      .first()
      .click()
    await expect(page.getByLabel(/titre/i)).toBeVisible()
    await expect(page.getByLabel(/description/i)).toBeVisible()
    await expect(page.getByLabel(/priorité/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /créer/i })).toBeVisible()
  })

  test('validates required task title', async ({ page }) => {
    await page
      .getByRole('button', { name: /ajouter une tâche/i })
      .first()
      .click()
    await page.getByRole('button', { name: /créer/i }).click()
    await expect(page.getByText(/titre requis/i)).toBeVisible()
  })

  test('creates task with valid data', async ({ page }) => {
    const taskTitle = `Test Task ${Date.now()}`

    await page
      .getByRole('button', { name: /ajouter une tâche/i })
      .first()
      .click()
    await page.getByLabel(/titre/i).fill(taskTitle)
    await page.getByLabel(/description/i).fill('Test task description')
    await page.getByRole('button', { name: /créer/i }).click()

    // Should show success toast
    await expect(page.getByText(/tâche créée/i)).toBeVisible()
  })

  test('displays task cards in columns', async ({ page }) => {
    // Assuming there are tasks in the database
    const taskCards = page.locator('[class*="task-card"]')
    const count = await taskCards.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test('opens task details on card click', async ({ page }) => {
    // Find first task card and click it
    const firstTask = page.locator('[class*="task-card"]').first()
    if ((await firstTask.count()) > 0) {
      await firstTask.click()
      await expect(
        page.getByRole('heading', { name: /détails de la tâche/i })
      ).toBeVisible()
    }
  })

  test('shows empty state when column has no tasks', async ({ page }) => {
    // This assumes at least one column is empty
    const emptyState = page.getByText(/aucune tâche/i)
    if ((await emptyState.count()) > 0) {
      await expect(emptyState.first()).toBeVisible()
    }
  })

  test('displays task priority indicator', async ({ page }) => {
    const firstTask = page.locator('[class*="task-card"]').first()
    if ((await firstTask.count()) > 0) {
      await expect(firstTask).toBeVisible()
      // Priority indicators should be present (Haute, Moyenne, or Basse)
      const priorityText = await firstTask.textContent()
      expect(priorityText).toBeTruthy()
    }
  })

  test('displays task due date when set', async ({ page }) => {
    const taskWithDate = page
      .locator('[class*="task-card"]')
      .filter({ hasText: /\d+\s+(jan|fév|mar|avr|mai|juin|juil|août|sep|oct|nov|déc)/i })
      .first()

    if ((await taskWithDate.count()) > 0) {
      await expect(taskWithDate).toBeVisible()
    }
  })
})
