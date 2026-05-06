import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('redirects to login when not authenticated', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/.*login/)
  })

  test('shows login form', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('heading', { name: /connexion/i })).toBeVisible()
    await expect(page.getByPlaceholder(/email/i)).toBeVisible()
    await expect(page.getByPlaceholder(/mot de passe/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /se connecter/i })).toBeVisible()
  })

  test('shows signup form', async ({ page }) => {
    await page.goto('/signup')
    await expect(page.getByRole('heading', { name: /inscription/i })).toBeVisible()
    await expect(page.getByPlaceholder(/email/i)).toBeVisible()
    await expect(page.getByPlaceholder(/mot de passe/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /créer un compte/i })).toBeVisible()
  })

  test('navigates from login to signup', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('link', { name: /inscription/i }).click()
    await expect(page).toHaveURL(/.*signup/)
  })

  test('navigates from signup to login', async ({ page }) => {
    await page.goto('/signup')
    await page.getByRole('link', { name: /connexion/i }).click()
    await expect(page).toHaveURL(/.*login/)
  })

  test('shows validation error for invalid email', async ({ page }) => {
    await page.goto('/login')
    await page.getByPlaceholder(/email/i).fill('invalid-email')
    await page.getByPlaceholder(/mot de passe/i).fill('password123')
    await page.getByRole('button', { name: /se connecter/i }).click()
    await expect(page.getByText(/email invalide/i)).toBeVisible()
  })

  test('shows validation error for empty password', async ({ page }) => {
    await page.goto('/login')
    await page.getByPlaceholder(/email/i).fill('test@example.com')
    await page.getByRole('button', { name: /se connecter/i }).click()
    await expect(page.getByText(/mot de passe requis/i)).toBeVisible()
  })
})
