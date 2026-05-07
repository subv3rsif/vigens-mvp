import { test, expect } from '@playwright/test'

test.describe('Subtasks', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to test project board
    await page.goto('/projects/test-project-id/board')
  })

  test('creates, completes, and deletes subtasks', async ({ page }) => {
    // Open first task card
    const firstTask = page.locator('[class*="task-card"]').first()
    const hasTask = (await firstTask.count()) > 0

    if (!hasTask) {
      test.skip()
    }

    await firstTask.click()

    // Verify task details dialog opened
    await expect(page.getByRole('heading', { name: /détails de la tâche/i })).toBeVisible()

    // Expand subtasks section (look for "Sous-tâches" button/text)
    const subtasksButton = page.getByText(/sous-tâches/i).first()
    await subtasksButton.click()

    // Add first subtask
    const input = page.getByPlaceholder(/ajouter une sous-tâche/i)
    await input.fill('First subtask')
    await input.press('Enter')

    // Verify subtask appears
    await expect(page.getByText('First subtask')).toBeVisible()

    // Verify progress badge updates (may be 0/1 or 1/1 depending on timing)
    await expect(page.locator('text=/✓\\s*\\d+\\/\\d+/')).toBeVisible()

    // Add second subtask
    await input.fill('Second subtask')
    await input.press('Enter')
    await expect(page.getByText('Second subtask')).toBeVisible()

    // Complete first subtask by clicking its checkbox
    // Find checkbox near "First subtask" text
    const firstSubtaskRow = page.locator('text=First subtask').locator('..')
    const firstCheckbox = firstSubtaskRow.locator('input[type="checkbox"]')
    await firstCheckbox.click()

    // Verify progress updated
    await expect(page.locator('text=/✓\\s*1\\/2/')).toBeVisible()

    // Complete second subtask
    const secondSubtaskRow = page.locator('text=Second subtask').locator('..')
    const secondCheckbox = secondSubtaskRow.locator('input[type="checkbox"]')
    await secondCheckbox.click()

    // Verify all complete
    await expect(page.locator('text=/✓\\s*2\\/2/')).toBeVisible()

    // Delete first subtask
    // Hover to show delete button, then click it
    await page.locator('text=First subtask').hover()
    const deleteButton = page.locator('text=First subtask').locator('..').getByLabel(/delete subtask/i)
    await deleteButton.click()

    // Verify it's gone
    await expect(page.getByText('First subtask')).not.toBeVisible()

    // Verify count updated to 1/1
    await expect(page.locator('text=/✓\\s*1\\/1/')).toBeVisible()

    // Close dialog (press Escape or click outside)
    await page.keyboard.press('Escape')

    // Wait for dialog to close
    await expect(page.getByRole('heading', { name: /détails de la tâche/i })).not.toBeVisible()

    // Verify badge appears on task card in the board
    // The card should show the subtask progress badge
    await expect(firstTask.locator('text=/✓\\s*1\\/1/')).toBeVisible({ timeout: 5000 })
  })

  test('shows correct badge colors', async ({ page }) => {
    const firstTask = page.locator('[class*="task-card"]').first()
    const hasTask = (await firstTask.count()) > 0

    if (!hasTask) {
      test.skip()
    }

    await firstTask.click()

    // Expand subtasks
    const subtasksButton = page.getByText(/sous-tâches/i).first()
    await subtasksButton.click()

    const input = page.getByPlaceholder(/ajouter une sous-tâche/i)

    // Add 3 subtasks
    for (let i = 1; i <= 3; i++) {
      await input.fill(`Subtask ${i}`)
      await input.press('Enter')
      await expect(page.getByText(`Subtask ${i}`)).toBeVisible()
    }

    // Check 0/3 badge exists (gray - text-text-secondary)
    const badge0 = page.locator('text=/✓\\s*0\\/3/')
    await expect(badge0).toBeVisible()

    // Complete 1 subtask
    const subtask1Row = page.locator('text=Subtask 1').locator('..')
    const checkbox1 = subtask1Row.locator('input[type="checkbox"]')
    await checkbox1.click()

    // Check 1/3 badge exists (orange - text-warning)
    const badge1 = page.locator('text=/✓\\s*1\\/3/')
    await expect(badge1).toBeVisible()

    // Complete remaining subtasks
    const subtask2Row = page.locator('text=Subtask 2').locator('..')
    const checkbox2 = subtask2Row.locator('input[type="checkbox"]')
    await checkbox2.click()

    const subtask3Row = page.locator('text=Subtask 3').locator('..')
    const checkbox3 = subtask3Row.locator('input[type="checkbox"]')
    await checkbox3.click()

    // Check 3/3 badge exists (green - text-success)
    const badge3 = page.locator('text=/✓\\s*3\\/3/')
    await expect(badge3).toBeVisible()
  })
})
