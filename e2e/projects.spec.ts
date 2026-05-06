import { test, expect } from '@playwright/test'

test.describe('Projects', () => {
  // Note: These tests assume authentication is set up
  // In a real scenario, you'd use test fixtures or beforeEach to log in

  test.beforeEach(async ({ page }) => {
    // You would typically log in here or use a test fixture
    // For now, we'll navigate to the projects page
    await page.goto('/projects')
  })

  test('displays projects page', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /mes projets/i })
    ).toBeVisible()
  })

  test('shows create project button', async ({ page }) => {
    await expect(
      page.getByRole('button', { name: /nouveau projet/i })
    ).toBeVisible()
  })

  test('opens create project dialog', async ({ page }) => {
    await page.getByRole('button', { name: /nouveau projet/i }).click()
    await expect(
      page.getByRole('heading', { name: /créer un projet/i })
    ).toBeVisible()
  })

  test('shows project form fields', async ({ page }) => {
    await page.getByRole('button', { name: /nouveau projet/i }).click()
    await expect(page.getByLabel(/nom du projet/i)).toBeVisible()
    await expect(page.getByLabel(/description/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /créer/i })).toBeVisible()
  })

  test('validates required project name', async ({ page }) => {
    await page.getByRole('button', { name: /nouveau projet/i }).click()
    await page.getByRole('button', { name: /créer/i }).click()
    await expect(page.getByText(/nom requis/i)).toBeVisible()
  })

  test('creates project with valid data', async ({ page }) => {
    const projectName = `Test Project ${Date.now()}`

    await page.getByRole('button', { name: /nouveau projet/i }).click()
    await page.getByLabel(/nom du projet/i).fill(projectName)
    await page.getByLabel(/description/i).fill('Test project description')
    await page.getByRole('button', { name: /créer/i }).click()

    // Should show success toast and close dialog
    await expect(page.getByText(/projet créé/i)).toBeVisible()
  })

  test('displays project cards', async ({ page }) => {
    // Assuming there are projects in the database
    const projectCards = page.locator('[class*="project-card"]')
    await expect(projectCards.first()).toBeVisible()
  })

  test('navigates to project detail page', async ({ page }) => {
    // Find first project card and click it
    const firstProject = page.locator('a[href*="/projects/"]').first()
    await firstProject.click()
    await expect(page).toHaveURL(/.*projects\/.*/)
  })

  test('shows project settings button on hover', async ({ page }) => {
    const firstProjectCard = page
      .locator('div')
      .filter({ hasText: /projet/i })
      .first()
    await firstProjectCard.hover()
    const settingsButton = firstProjectCard.getByRole('button', {
      name: /paramètres/i,
    })
    await expect(settingsButton).toBeVisible()
  })
})
